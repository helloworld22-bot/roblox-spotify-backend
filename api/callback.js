import querystring from "querystring";

export default async function handler(req, res) {
    const code = req.query.code;
    const robloxId = req.query.state;

    if (!code || !robloxId) {
        return res.status(400).send("Missing code or Roblox ID");
    }

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
                "Basic " +
                Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
                ).toString("base64"),
        },
        body: querystring.stringify({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
        return res.status(500).send("Failed to get access token");
    }

    global.tokens = global.tokens || {};
    global.tokens[robloxId] = tokenData.access_token;

    res.send("Spotify connected. You can close this tab.");
}
