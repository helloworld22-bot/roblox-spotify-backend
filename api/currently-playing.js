export default async function handler(req, res) {
    const robloxId = req.query.robloxId;

    if (!robloxId) {
        return res.status(400).json({ error: "Missing robloxId" });
    }

    global.tokens = global.tokens || {};
    const accessToken = global.tokens[robloxId];

    if (!accessToken) {
        return res.status(200).json({ error: "Not connected" });
    }

    const nowPlaying = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {
            Authorization: "Bearer " + accessToken,
        },
    });

    if (nowPlaying.status === 204) {
        return res.status(200).json({ isPlaying: false });
    }

    const data = await nowPlaying.json();

    const title = data?.item?.name || "Unknown Track";
    const artist = data?.item?.artists?.[0]?.name || "Unknown Artist";

    // Filter curse words
    const filterBadWords = (text) => {
        const badWords = ["fuck", "nigger", "nigga", "bitch", "cunt", "whore", "faggot", "kike", "retard", "slut"];
        let lower = text.toLowerCase();
        badWords.forEach((w) => {
            if (lower.includes(w)) {
                const regex = new RegExp(w, "gi");
                text = text.replace(regex, "###");
            }
        });
        return text;
    };

    res.status(200).json({
        isPlaying: true,
        trackName: filterBadWords(title),
        artist: filterBadWords(artist),
    });
}
