// api/login.js

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "";

module.exports = async function (req, res) {
  const { robloxId } = req.query;

  if (!robloxId) {
    res.status(400).json({ error: "Missing robloxId" });
    return;
  }

  if (!CLIENT_ID || !REDIRECT_URI) {
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: "user-read-currently-playing",
    redirect_uri: REDIRECT_URI,
    state: String(robloxId),
  });

  const loginUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  res.setHeader("Content-Type", "application/json");
  res.status(200).end(JSON.stringify({ loginUrl }));
};
