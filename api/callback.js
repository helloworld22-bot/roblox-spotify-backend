// api/callback.js

const { saveSession } = require("./sessionStore");

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "";

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Spotify token error:", resp.status, text);
    throw new Error("Failed to get access token");
  }

  return resp.json();
}

module.exports = async function (req, res) {
  const { code, state } = req.query;

  if (!code || !state) {
    res.status(400).send("Missing code or state");
    return;
  }

  const robloxId = String(state);

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    res.status(500).send("Server not configured");
    return;
  }

  try {
    const tokenData = await exchangeCodeForToken(code);
    saveSession(robloxId, tokenData);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`
      <html>
        <body style="font-family: system-ui; text-align:center; margin-top:40px;">
          <h2>Spotify linked</h2>
          <p>Roblox user <b>${robloxId}</b> is now connected.</p>
          <p>You can close this tab and go back to Roblox.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to get access token");
  }
};
v
