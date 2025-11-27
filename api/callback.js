// api/callback.js

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "https://roblox-spotify-backend.vercel.app/api/callback.js";

// SUPER simple in-memory store (per server instance).
// This is fine for you testing / personal use.
const tokens = {};

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

module.exports = async (req, res) => {
  try {
    const { code, state } = req.query; // state = robloxId

    if (!code || !state) {
      res.status(400).send("Missing code or state");
      return;
    }

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      res.status(500).send("Server not configured (missing env vars)");
      return;
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: String(REDIRECT_URI),
      client_id: String(CLIENT_ID),
      client_secret: String(CLIENT_SECRET),
    });

    const { ok, data } = await fetchJson("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!ok) {
      console.error("token error", data);
      res.status(500).send("Failed to get access token");
      return;
    }

    const robloxId = String(state);

    tokens[robloxId] = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000 - 60_000,
    };

    res.status(200).send("Linked! You can close this tab and go back to Roblox.");
  } catch (err) {
    console.error("callback error", err);
    res.status(500).send("Internal server error");
  }
};

// Export tokens for use in currently-playing.js (same lambda bundle on Vercel)
module.exports._tokens = tokens;
