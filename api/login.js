export default function handler(req, res) {
    const robloxId = req.query.robloxId;

    if (!robloxId) {
        return res.status(400).json({ error: "Missing robloxId" });
    }

    const redirect = `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=user-read-currently-playing&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&state=${robloxId}`;

    return res.status(200).json({ loginUrl: redirect });
}
