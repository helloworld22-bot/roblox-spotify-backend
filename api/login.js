export default function handler(req, res) {
  try {
    const robloxId = req.query.robloxId;
    if (!robloxId) return res.status(400).json({ error: "Missing Roblox ID" });

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: "Missing Spotify env vars" });
    }

    const loginUrl =
      "https://accounts.spotify.com/authorize?" +
      "response_type=code" +
      "&client_id=" + clientId +
      "&scope=user-read-currently-playing" +
      "&redirect_uri=" + encodeURIComponent(redirectUri) +
      "&state=" + robloxId;

    res.status(200).json({ loginUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
