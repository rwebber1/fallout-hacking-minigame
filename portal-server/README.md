# Terminal Gate Portal Server

A small Express server that serves the Fallout hacking minigame as a UniFi
external captive portal, and authorizes a guest's device on the network once
they crack the terminal's password.

See the full setup guide for how this fits into your UDM Pro's guest network,
walled garden, and API credentials - this README only covers running the
server itself.

## Run it

```
cd portal-server
cp .env.example .env
# edit .env with your controller URL, API key/credentials, and site ID
npm install
node server.js
```

The server listens on `PORT` (default 8080) and serves the game from the
project root (one level up), so `http://<host>:8080/` is the same
`index.html` as before, plus two new endpoints:

- `POST /api/session-start` - issues a one-time token when the page loads.
- `POST /api/authorize` - called by `portal-client.js` when the puzzle is
  solved; looks up the guest's client record on your UDM Pro and authorizes
  it for `SESSION_MINUTES`.

## Config reference

All configuration lives in `.env` (see `.env.example` for every variable).
The two supported modes:

- `UNIFI_API_MODE=v1` - the newer key-based Integrations API. Needs
  `UNIFI_API_KEY` (from Settings -> Control Plane -> Integrations) and
  `UNIFI_SITE_ID`.
- `UNIFI_API_MODE=legacy` - the classic controller API. Needs
  `UNIFI_USERNAME` / `UNIFI_PASSWORD` for a dedicated local admin account, and
  `UNIFI_SITE` (the short site name).

`UNIFI_INSECURE_TLS=true` tells the server to accept the UDM Pro's
self-signed certificate. Set it to `false` only if you've installed a real
certificate on the controller.

## A note on accuracy

The `v1` path in `authorizeV1()` (`server.js`) matches Ubiquiti's current
documentation for the Integrations API, but the exact endpoint shape has
shifted before across UniFi Network app versions. Before relying on this,
open your own controller's Integrations page - it links to a live API
reference for the version you're actually running - and confirm the
`/clients` and `/clients/{id}/actions` shapes match what's implemented here.
If they don't, `UNIFI_API_MODE=legacy` is the older, more stable fallback.

## Process management

Once this works, run it with something that restarts it on crash/reboot
(`pm2`, a systemd unit, or your NAS's Docker/container manager) - every new
guest connection depends on this process being up.
