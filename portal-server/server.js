/*
    TERMINAL GATE - PORTAL SERVER

    Serves the Fallout hacking minigame as a UniFi external captive portal,
    and authorizes a guest's MAC address against the UniFi Network API once
    they solve it.

    This talks to two possible local UniFi APIs, chosen via UNIFI_API_MODE:
      - "v1"     the newer API-key based Integrations API
                 (Settings -> Control Plane -> Integrations)
      - "legacy" the classic cmd/stamgr controller API with a local admin login

    IMPORTANT: exact field/path names for the "v1" API can differ between
    UniFi Network app versions. The Integrations page on your own controller
    links to a live API reference for the version you're actually running -
    check that against authorizeV1() below before trusting it blindly.
*/

require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const axios = require('axios');

const app = express();
app.use(express.json());

// Serve the game's static files (index.html, hacking-minigame.js, styles.css,
// assets/) straight out of the project root, one level up from this folder.
app.use(express.static(path.join(__dirname, '..')));

const PORT = process.env.PORT || 8080;
const MODE = (process.env.UNIFI_API_MODE || 'v1').toLowerCase();
const CONTROLLER = (process.env.UNIFI_CONTROLLER_URL || '').replace(/\/+$/, '');
const INSECURE = process.env.UNIFI_INSECURE_TLS === 'true';
const SESSION_MINUTES = Number(process.env.SESSION_MINUTES || 480);

const httpsAgent = new https.Agent({ rejectUnauthorized: !INSECURE });

// ---------------------------------------------------------------------------
// Lightweight anti-replay / anti-bot: a one-time token issued when the page
// loads, required on the authorize call, and only valid after a minimum
// delay. This is a deterrent, not real access control - anyone with dev
// tools open can still call the API directly. See the guide for why that's
// an acceptable tradeoff on a home guest network.
// ---------------------------------------------------------------------------
const sessions = new Map(); // token -> issuedAt (ms)
const SESSION_TTL_MS = 10 * 60 * 1000;
const MIN_SOLVE_MS = 3000;

function cleanupSessions() {
    const now = Date.now();
    for (const [token, issuedAt] of sessions) {
        if (now - issuedAt > SESSION_TTL_MS) sessions.delete(token);
    }
}

app.post('/api/session-start', (req, res) => {
    cleanupSessions();
    const token = crypto.randomBytes(16).toString('hex');
    sessions.set(token, Date.now());
    res.json({ token });
});

function consumeValidSession(token) {
    if (!token || !sessions.has(token)) return false;
    const issuedAt = sessions.get(token);
    sessions.delete(token); // single use
    const age = Date.now() - issuedAt;
    return age >= MIN_SOLVE_MS && age <= SESSION_TTL_MS;
}

const lastAttemptByMac = new Map();
function isRateLimited(mac) {
    const now = Date.now();
    const last = lastAttemptByMac.get(mac);
    lastAttemptByMac.set(mac, now);
    return Boolean(last && now - last < 5000);
}

// ---------------------------------------------------------------------------
// Authorize endpoint - called by portal-client.js on a correct password.
// ---------------------------------------------------------------------------
app.post('/api/authorize', async (req, res) => {
    const { mac, token } = req.body || {};

    if (!mac || typeof mac !== 'string') {
        return res.status(400).json({ ok: false, error: 'missing client mac' });
    }
    if (!consumeValidSession(token)) {
        return res.status(403).json({ ok: false, error: 'invalid or expired session' });
    }
    if (isRateLimited(mac)) {
        return res.status(429).json({ ok: false, error: 'try again in a few seconds' });
    }

    try {
        if (MODE === 'legacy') {
            await authorizeLegacy(mac);
        } else {
            await authorizeV1(mac);
        }
        console.log(`Authorized guest ${mac} for ${SESSION_MINUTES} minutes`);
        res.json({ ok: true });
    } catch (err) {
        console.error('Authorization failed for', mac, '-', err.message);
        res.status(502).json({ ok: false, error: 'could not reach the controller' });
    }
});

// --- v1 Integrations API (API key) -----------------------------------------
async function authorizeV1(mac) {
    const apiKey = process.env.UNIFI_API_KEY;
    const siteId = process.env.UNIFI_SITE_ID;
    if (!apiKey || !siteId) {
        throw new Error('UNIFI_API_KEY / UNIFI_SITE_ID not configured');
    }

    const base = `${CONTROLLER}/proxy/network/integrations/v1/sites/${siteId}`;
    const headers = { 'X-API-KEY': apiKey };

    // Fetch clients and match the MAC client-side rather than relying on a
    // guessed filter query-string syntax, which has shifted between
    // UniFi Network app versions.
    const clientsResp = await axios.get(`${base}/clients`, { headers, httpsAgent });
    const clients = clientsResp.data?.data ?? clientsResp.data ?? [];
    const target = clients.find((c) => {
        const candidate = (c.macAddress || c.mac || '').toLowerCase();
        return candidate === mac.toLowerCase();
    });

    if (!target) {
        throw new Error('client not found yet - has it fully associated to the AP?');
    }

    await axios.post(
        `${base}/clients/${target.id}/actions`,
        {
            action: 'AUTHORIZE_GUEST_ACCESS',
            timeLimitMinutes: SESSION_MINUTES,
        },
        { headers: { ...headers, 'Content-Type': 'application/json' }, httpsAgent }
    );
}

// --- legacy controller API (local admin login) ------------------------------
async function authorizeLegacy(mac) {
    const site = process.env.UNIFI_SITE || 'default';
    const username = process.env.UNIFI_USERNAME;
    const password = process.env.UNIFI_PASSWORD;
    if (!username || !password) {
        throw new Error('UNIFI_USERNAME / UNIFI_PASSWORD not configured');
    }

    const loginResp = await axios.post(
        `${CONTROLLER}/api/auth/login`,
        { username, password },
        { httpsAgent, validateStatus: () => true }
    );
    if (loginResp.status >= 300) {
        throw new Error(`login failed: HTTP ${loginResp.status}`);
    }
    const cookies = loginResp.headers['set-cookie'] || [];
    const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
    const csrfToken =
        loginResp.headers['x-csrf-token'] || loginResp.headers['x-updated-csrf-token'];

    const cmdResp = await axios.post(
        `${CONTROLLER}/proxy/network/api/s/${site}/cmd/stamgr`,
        { cmd: 'authorize-guest', mac: mac.toLowerCase(), minutes: SESSION_MINUTES },
        {
            httpsAgent,
            validateStatus: () => true,
            headers: {
                'Content-Type': 'application/json',
                Cookie: cookieHeader,
                ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
            },
        }
    );
    if (cmdResp.status >= 300) {
        throw new Error(`authorize-guest failed: HTTP ${cmdResp.status}`);
    }
}

app.listen(PORT, () => {
    console.log(`Terminal gate portal server listening on port ${PORT} (mode: ${MODE})`);
    if (!CONTROLLER) {
        console.warn('UNIFI_CONTROLLER_URL is not set - authorization calls will fail.');
    }
});
