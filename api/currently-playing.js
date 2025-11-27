// api/currently-playing.js

const { getSession } = require("./sessionStore");

async function fetchCurrentlyPlaying(accessToken) {
  const resp = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (resp.status === 204) {
    return { is_playing: false, item: null };
  }

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Spotify currently-playing error:", resp.status, text);
    throw new Error("Spotify error");
  }

  return resp.json();
}

module.exports = async function (req, res) {
  const { robloxId } = req.query;

  if (!robloxId) {
    res.status(400).json({ error: "Missing robloxId" });
    return;
  }

  const session = getSession(String(robloxId));

  if (!session) {
    res.status(401).json({ error: "Not connected" });
    return;
  }

  try {
    const data = await fetchCurrentlyPlaying(session.accessToken);

    let result = {
      is_playing: data.is_playing || false,
      progress_ms: data.progress_ms || 0,
      item: null,
    };

    if (data.item) {
      result.item = {
        name: data.item.name,
        artists: (data.item.artists || []).map((a) => a.name),
        album: data.item.album ? data.item.album.name : null,
        album_art:
          data.item.album && data.item.album.images && data.item.album.images[0]
            ? data.item.album.images[0].url
            : null,
      };
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Spotify request failed" });
  }
};
