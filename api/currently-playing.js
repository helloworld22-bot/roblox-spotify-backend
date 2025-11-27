// api/currently-playing.js

// Import the tokens object from callback.js.
// On Vercel, this will be bundled together and share memory
// in the same server instance.
const callback = require("./callback.js");
const tokens = callback._tokens || {};

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data, status: res.status };
}

async function ensureAccessToken(robloxId) {
  const info = tokens[robloxId];
  if (!info) return null;

  // Not expired yet
  if (info.expires_at && info.expires_at > Date.now()) {
    return info.access_token;
  }

  // No refresh token – cannot refresh
  if (!info.refresh_token) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: String(info.refresh_token),
  });

  const { ok, data } = await fetchJson("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!ok || !data.access_token) return null;

  info.access_token = data.access_token;
  info.expires_at = Date.now() + (data.expires_in || 3600) * 1000 - 60_000;
  return info.access_token;
}

// Example: /api/currently-playing?robloxId=1832410165
module.exports = async (req, res) => {
  try {
    const robloxId = req.query.robloxId;

    if (!robloxId) {
      res.status(400).json({ error: "Missing robloxId" });
      return;
    }

    const tokenInfo = tokens[robloxId];
    if (!tokenInfo) {
      res.status(200).json({ error: "Not connected" });
      return;
    }

    const accessToken = await ensureAccessToken(robloxId);
    if (!accessToken) {
      res.status(200).json({ error: "Not connected" });
      return;
    }

    const { ok, data, status } = await fetchJson(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      }
    );

    if (status === 204) {
      // Nothing playing
      res.status(200).json({ playing: false });
      return;
    }

    if (!ok) {
      console.error("currently-playing error", data);
      res.status(200).json({ error: "Spotify API error" });
      return;
    }

    res.status(200).json({
      playing: !!data.is_playing,
      track: data.item ? {
        name: data.item.name,
        artists: data.item.artists?.map(a => a.name).join(", "),
        album: data.item.album?.name,
      } : null,
    });
  } catch (err) {
    console.error("currently-playing crash", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
