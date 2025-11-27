require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// In-memory token store for testing
const userTokens = {}; // { robloxId: { access_token, refresh_token, expires_at } }

function getBasicAuthHeader() {
  const token = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  return `Basic ${token}`;
}

function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

// 1) Start Spotify login: /login?robloxId=12345
app.get("/login", (req, res) => {
  const robloxId = req.query.robloxId;
  if (!robloxId) {
    return res.status(400).send("robloxId is required");
  }

  const scope = "user-read-currently-playing user-read-playback-state";
  const state = robloxId;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
    state
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.redirect(authUrl);
});

// 2) Spotify callback: /callback
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state; // robloxId

  if (!code || !state) {
    return res.status(400).send("Missing code or state");
  }

  try {
    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: getBasicAuthHeader()
        }
      }
    );

    const data = tokenRes.data;
    const expiresAt = getCurrentTimestamp() + data.expires_in;

    userTokens[state] = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt
    };

    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h2>Spotify Connected!</h2>
          <p>You can now return to Roblox.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error exchanging code for tokens");
  }
});

async function refreshAccessToken(robloxId) {
  const user = userTokens[robloxId];
  if (!user || !user.refresh_token) {
    throw new Error("No refresh token stored for this user");
  }

  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: user.refresh_token
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: getBasicAuthHeader()
      }
    }
  );

  const data = res.data;
  const expiresAt = getCurrentTimestamp() + data.expires_in;

  userTokens[robloxId].access_token = data.access_token;
  userTokens[robloxId].expires_at = expiresAt;
}

// 3) Roblox will call this: /currently-playing?robloxId=12345
app.get("/currently-playing", async (req, res) => {
  const robloxId = req.query.robloxId;
  if (!robloxId) {
    return res.status(400).json({ error: "robloxId is required" });
  }

  const user = userTokens[robloxId];
  if (!user) {
    return res.status(404).json({ error: "Not connected" });
  }

  try {
    if (getCurrentTimestamp() >= user.expires_at) {
      await refreshAccessToken(robloxId);
    }

    const nowRes = await axios.get(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${userTokens[robloxId].access_token}`
        }
      }
    );

    if (nowRes.status === 204 || !nowRes.data) {
      return res.json({
        isPlaying: false,
        message: "Nothing is currently playing"
      });
    }

    const item = nowRes.data.item;

    const response = {
      isPlaying: nowRes.data.is_playing,
      trackName: item?.name || null,
      artist: item?.artists?.map((a) => a.name).join(", ") || null,
      albumName: item?.album?.name || null,
      albumArt: item?.album?.images?.[0]?.url || null
    };

    res.json(response);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch currently playing" });
  }
});

app.get("/", (req, res) => {
  res.send("Roblox Spotify backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
