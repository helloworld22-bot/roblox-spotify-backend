// api/sessionStore.js

// In-memory token store keyed by robloxId
// This resets when the Vercel function cold-starts but is fine for now.
const sessions = {};

function saveSession(robloxId, data) {
  sessions[robloxId] = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000 - 60 * 1000,
  };
}

function getSession(robloxId) {
  const s = sessions[robloxId];
  if (!s) return null;
  if (s.expiresAt && s.expiresAt <= Date.now()) {
    return null;
  }
  return s;
}

module.exports = {
  saveSession,
  getSession,
};
