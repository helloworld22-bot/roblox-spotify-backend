import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
      return res.status(400).send("Missing code/state");
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`
    });

    const tokenJson = await tokenRes.json();

    if (!tokenJson.access_token) {
      return res.status(500).send("Failed to get access token");
    }

    // Store in KV/JSON (simple demo)
    global.tokens = global.tokens || {};
    global.tokens[state] = tokenJson;

    res.send("Success! You can close this tab.");
  } catch (err) {
    res.status(500).send("Callback Error: " + err.message);
  }
}
