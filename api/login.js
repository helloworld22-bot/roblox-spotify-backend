// api/login.js

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "https://roblox-spotify-backend.vercel.app/api/callback.js";

// Example: /api/login?robloxId=1832410165
module.exports = (req, res) => {
  try {
    const robloxId = req.query.robloxId;

    if (!robloxId) {
      res.status(400).json({ error: "Missing robloxId" });
      return;
    }

    if (!CLIENT_ID || !REDIRECT_URI) {
      res.status(500).json({ error: "Server not configured (missing env vars)" });
      return;
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: String(CLIENT_ID),
      scope: "user-read-currently-playing",
      redirect_uri: String(REDIRECT_URI),
      state: String(robloxId),
    });

    const loginUrl = "https://accounts.spotify.com/authorize?" + params.toString();
    res.status(200).json({ loginUrl });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
};
