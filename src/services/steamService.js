// src/services/steamService.js
// steam fetch + cache + url/vanity resolve + avatar fallback
const axios = require('axios');

const STEAM_KEY = process.env.STEAM_API_KEY;
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const STATUS_COLORS = {
  online: '#00ff66',
  offline: '#6272a4',
  away: '#f1fa8c',
};

// inline stub avatar
const FALLBACK_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjE0IiBmaWxsPSIjMTQxMzIxIi8+PHBhdGggZmlsbD0iIzhiZTlmZCIgZD0iTTUwIDI4YzMuMyAwIDYgMi43IDYgNnMtMi43IDYtNiA2LTYtMi43LTYtNiAyLjctNiA2LTZ6bTAgMjFjLTkuMSAwLTE3IDUuMi0yMCAxMi43LS4zLjcuMiAxLjMgMSAxLjNoMzguYy44IDAgMS4zLS42IDEuLTEuM0M2NyA1NC4yIDU5LjEgNDkgNTAgNDl6Ii8+PC9zdmc+';

function getFromCache(id) {
  const hit = cache.get(id);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(id);
    return null;
  }
  return hit.data;
}

function saveToCache(id, data) {
  cache.set(id, { ts: Date.now(), data });
}

// ----- resolve -----
function extractFromUrl(input) {
  const mProfiles = input.match(/\/profiles\/(\d{17})/);
  if (mProfiles) return { type: 'id64', value: mProfiles[1] };
  const mId = input.match(/\/id\/([^\/?#]+)/);
  if (mId) return { type: 'vanity', value: mId[1] };
  return null;
}

async function resolveVanityToId64(vanity) {
  const resp = await axios.get(
    'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/',
    { params: { key: STEAM_KEY, vanityurl: vanity } },
  );
  if (resp.data?.response?.success === 1) {
    return resp.data.response.steamid;
  }
  return null;
}

async function resolveAnySteamId(raw) {
  if (!raw) return null;
  const input = String(raw).trim();

  // id64
  if (/^\d{17}$/.test(input)) return input;

  // steamcommunity url
  if (/steamcommunity\.com/i.test(input)) {
    const parsed = extractFromUrl(input);
    if (parsed) {
      if (parsed.type === 'id64') return parsed.value;
      if (parsed.type === 'vanity') return await resolveVanityToId64(parsed.value);
    }
  }

  return await resolveVanityToId64(input);
}

// ----- steam calls -----
async function getPlayerSummary(steamid) {
  const resp = await axios.get(
    'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
    { params: { key: STEAM_KEY, steamids: steamid } },
  );
  return resp.data?.response?.players?.[0] ?? null;
}

async function getSteamLevel(steamid) {
  try {
    const resp = await axios.get(
      'https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/',
      { params: { key: STEAM_KEY, steamid } },
    );
    return resp.data?.response?.player_level ?? null;
  } catch {
    return null;
  }
}

async function getOwnedGames(steamid) {
  try {
    const resp = await axios.get(
      'https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/',
      { params: { key: STEAM_KEY, steamid, include_appinfo: 1 } },
    );
    return resp.data?.response?.game_count ?? 0;
  } catch {
    return 0;
  }
}

async function getFriendCount(steamid) {
  try {
    const resp = await axios.get(
      'https://api.steampowered.com/ISteamUser/GetFriendList/v0001/',
      { params: { key: STEAM_KEY, steamid, relationship: 'all' } },
    );
    return resp.data?.friendslist?.friends?.length ?? 0;
  } catch {
    return 0;
  }
}

async function getRecentlyPlayed(steamid) {
  try {
    const resp = await axios.get(
      'https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/',
      { params: { key: STEAM_KEY, steamid, count: 5 } },
    );
    const games = resp.data?.response?.games ?? [];
    return games[0]?.name ?? 'No recent games';
  } catch {
    return 'No recent games';
  }
}

async function fetchAvatarAsDataUrl(url) {
  if (!url) return FALLBACK_AVATAR;
  if (!/^https?:\/\//i.test(url)) return FALLBACK_AVATAR;
  try {
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    const b64 = Buffer.from(resp.data).toString('base64');
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return FALLBACK_AVATAR;
  }
}

function mapStatusColor(state) {
  if (state === 0) return { color: STATUS_COLORS.offline, kind: 'offline' };
  if (state === 1) return { color: STATUS_COLORS.online, kind: 'online' };
  return { color: STATUS_COLORS.away, kind: 'away' };
}

// ----- main -----
async function getSteamData(rawId) {
  const steamid = await resolveAnySteamId(rawId);

  if (!steamid) {
    return {
      avatarUrl: FALLBACK_AVATAR,
      playerName: 'Steam User',
      steamLevel: '—',
      gamesCount: '—',
      friendsCount: '—',
      lastPlayedGame: 'Profile not found',
      statusColor: STATUS_COLORS.offline,
      statusKind: 'offline',
    };
  }

  const cached = getFromCache(steamid);
  if (cached) return cached;

  const summary = await getPlayerSummary(steamid);

  const avatarPromise = fetchAvatarAsDataUrl(summary?.avatarfull || '');
  const [level, gamesCount, friendsCount, lastPlayedGame, avatarDataUrl] = await Promise.all([
    getSteamLevel(steamid),
    getOwnedGames(steamid),
    getFriendCount(steamid),
    getRecentlyPlayed(steamid),
    avatarPromise,
  ]);

  const status = mapStatusColor(summary?.personastate ?? 0);

  const data = {
    avatarUrl: avatarDataUrl,
    playerName: summary?.personaname || 'Steam User',
    steamLevel: level !== null ? level : '—',
    gamesCount,
    friendsCount,
    lastPlayedGame,
    statusColor: status.color,
    statusKind: status.kind,
  };

  saveToCache(steamid, data);
  return data;
}

module.exports = {
  getSteamData,
};
