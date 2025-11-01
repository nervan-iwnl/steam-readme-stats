// src/services/steamService.js
const axios = require('axios');

const STEAM_KEY = process.env.STEAM_API_KEY;

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const STATUS_COLORS = {
  online: '#00ff66',
  offline: '#6272a4',
  away: '#f1fa8c',
};

function getFromCache(steamid) {
  const hit = cache.get(steamid);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(steamid);
    return null;
  }
  return hit.data;
}

function saveToCache(steamid, data) {
  cache.set(steamid, { ts: Date.now(), data });
}

async function getPlayerSummary(steamid) {
  const url = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/';
  const resp = await axios.get(url, {
    params: {
      key: STEAM_KEY,
      steamids: steamid,
    },
  });
  const players = resp.data.response.players;
  return players && players[0] ? players[0] : null;
}

async function getSteamLevel(steamid) {
  const url = 'https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/';
  try {
    const resp = await axios.get(url, {
      params: {
        key: STEAM_KEY,
        steamid,
      },
    });
    return resp.data?.response?.player_level ?? null;
  } catch (e) {
    return null;
  }
}

async function getOwnedGames(steamid) {
  try {
    const url = 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/';
    const resp = await axios.get(url, {
      params: {
        key: STEAM_KEY,
        steamid,
        include_appinfo: 1,
      },
    });
    return resp.data.response.game_count || 0;
  } catch {
    return 0;
  }
}

async function getFriendCount(steamid) {
  try {
    const url = 'https://api.steampowered.com/ISteamUser/GetFriendList/v0001/';
    const resp = await axios.get(url, {
      params: {
        key: STEAM_KEY,
        steamid,
        relationship: 'all',
      },
    });
    return (resp.data.friendslist && resp.data.friendslist.friends || []).length;
  } catch {
    return 0;
  }
}

async function getRecentlyPlayed(steamid) {
  try {
    const url = 'https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/';
    const resp = await axios.get(url, {
      params: {
        key: STEAM_KEY,
        steamid,
        count: 5,
      },
    });
    const games = (resp.data.response && resp.data.response.games) || [];
    if (games.length === 0) return 'No recent games';
    return games[0].name;
  } catch {
    return 'No recent games';
  }
}

function mapStatusColor(personaState) {
  if (personaState === 0) return { color: STATUS_COLORS.offline, kind: 'offline' };
  if (personaState === 1) return { color: STATUS_COLORS.online, kind: 'online' };
  return { color: STATUS_COLORS.away, kind: 'away' };
}

async function getSteamData(steamid) {
  const cached = getFromCache(steamid);
  if (cached) return cached;

  const summary = await getPlayerSummary(steamid);

  const [level, gamesCount, friendsCount, lastPlayedGame] = await Promise.all([
    getSteamLevel(steamid),
    getOwnedGames(steamid),
    getFriendCount(steamid),
    getRecentlyPlayed(steamid),
  ]);

  const status = mapStatusColor(summary?.personastate ?? 0);

  const data = {
    avatarUrl: summary?.avatarfull || '',
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
