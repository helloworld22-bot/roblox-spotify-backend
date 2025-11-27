import fetch from "node-fetch";

export default async function handler(req, res) {
  const id = req.query.robloxId;
  if (!id) return res.status(400).json({ error: "Missing Roblox ID" });

  if (!global.tokens || !global.tokens[id]) {
    return res.status(400).json({ error: "Not connected" });
  }

  const access = global.tokens[id].access_token;

  const playing = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    { headers: { Authorization: `Bearer ${access}` } }
  );

  if (!playing.ok) return res.status(400).json({ error: "Not playing" });

  const json = await playing.json();
  res.status(200).json(json);
}
