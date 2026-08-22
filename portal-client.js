/*
    PORTAL CLIENT
    Bridges the hacking minigame to the portal-server's /api/authorize endpoint.
    Kept separate from hacking-minigame.js so the puzzle logic stays network-free;
    it just fires a 'terminal-access-granted' event on a correct password.

    UniFi's captive portal redirect appends query params to this page's URL:
        id  = the guest client's MAC address
        ap  = the access point's MAC address
        ssid = the SSID the guest connected to
        url = the URL the guest originally tried to load
    See: https://help.ui.com/hc/en-us/articles/31228198640023
*/
(function () {
    const params = new URLSearchParams(window.location.search);
    const clientMac = params.get('id');
    const redirectUrl = params.get('url');

    let sessionToken = null;

    // Ask the server for a one-time session token as soon as the page loads.
    // This is a lightweight anti-replay measure, not a real security boundary.
    fetch('/api/session-start', { method: 'POST' })
        .then((r) => r.json())
        .then((data) => { sessionToken = data.token; })
        .catch((err) => console.warn('Could not start portal session:', err));

    document.addEventListener('terminal-access-granted', () => {
        const log = document.getElementById('submission-log');

        if (!clientMac) {
            // Happens if you open index.html directly instead of via the
            // UDM Pro's captive portal redirect - there's no MAC to authorize.
            console.warn('No client MAC in the URL - are you testing outside the captive portal flow?');
            if (log) log.innerHTML += '>NO CLIENT ID - open this page via the guest portal redirect<br>';
            return;
        }

        fetch('/api/authorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mac: clientMac, token: sessionToken }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (!log) return;
                if (data.ok) {
                    log.innerHTML += '>ACCESS GRANTED<br>';
                    setTimeout(() => {
                        window.location.href = redirectUrl || 'http://neverssl.com';
                    }, 2500);
                } else {
                    log.innerHTML += `>AUTHORIZATION FAILED - ${data.error || 'contact admin'}<br>`;
                }
            })
            .catch(() => {
                if (log) log.innerHTML += '>AUTHORIZATION ERROR - portal server unreachable<br>';
            });
    });
})();
