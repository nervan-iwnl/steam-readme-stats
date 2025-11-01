// src/routes/widgetRoute.js
const express = require('express');
const router = express.Router();
const { getSteamData } = require('../services/steamService');
const { renderTemplate } = require('../render/renderTemplate');

router.get('/steam-widget/test', (req, res) => {
  const svg = renderTemplate({
    avatarUrl: '',
    playerName: 'TEST USER',
    steamLevel: 42,
    gamesCount: 123,
    friendsCount: 77,
    lastPlayedGame: 'Remnant: From the Ashes',
    statusColor: '#00ff66',
    lang: req.query.lang || 'en',
    theme: req.query.theme || 'dark',
    width: req.query.width ? Number(req.query.width) : undefined,
  });
  res.set('Content-Type', 'image/svg+xml');
  res.send(svg);
});

router.get('/steam-widget', async (req, res) => {
  const { steamid, width, theme, title, lang } = req.query;

  if (!steamid) {
    const svg = renderTemplate({
      avatarUrl: '',
      playerName: title || 'Steam User',
      steamLevel: '—',
      gamesCount: '—',
      friendsCount: '—',
      lastPlayedGame: 'No recent games',
      statusColor: '#6272a4',
      lang: lang || 'en',
      theme: theme || 'dark',
      width: width ? Number(width) : undefined,
    });
    res.set('Content-Type', 'image/svg+xml');
    return res.send(svg);
  }

  try {
    const data = await getSteamData(steamid);

    const svg = renderTemplate({
      avatarUrl: data.avatarUrl,
      playerName: title || data.playerName,
      steamLevel: data.steamLevel,
      gamesCount: data.gamesCount,
      friendsCount: data.friendsCount,
      lastPlayedGame: data.lastPlayedGame,
      statusColor: data.statusColor,
      statusKind: data.statusKind,
      lang: lang || 'en',
      theme: theme || 'dark',
      width: width ? Number(width) : undefined,
    });

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-store');
    res.send(svg);
    } catch (err) {
    console.error('steam-widget error:', err);

    const svg = renderTemplate({
      avatarUrl: '',
      playerName: title || 'Steam User',
      steamLevel: '—',
      gamesCount: '—',
      friendsCount: '—',
      lastPlayedGame: 'Steam API unavailable',
      statusColor: '#6272a4',
      lang: lang || 'en',
      theme: theme || 'dark',
      width: width ? Number(width) : undefined,
    });

    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  }
});

module.exports = router;
