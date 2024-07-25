require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const STEAM_API_KEY = process.env.STEAM_API_KEY;

app.use(cors({
    origin: '*', 
}));

const templatePath = path.join(__dirname, 'widgetTemplate.svg');

async function getPlayerData(steamId) {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`;
    const params = {
        key: STEAM_API_KEY,
        steamids: steamId
    };
    const response = await axios.get(url, { params });
    return response.data.response.players[0];
}

async function getSteamLevel(steamId) {
    const url = `https://steamcommunity.com/profiles/${steamId}`;
    const response = await axios.get(url);
    const levelMatch = response.data.match(/<span class="friendPlayerLevelNum"[^>]*>(\d+)<\/span>/);
    return levelMatch ? levelMatch[1] : 'Level not found';
}

async function getOwnedGames(steamId) {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`;
    const params = {
        key: STEAM_API_KEY,
        steamid: steamId,
        format: 'json'
    };
    const response = await axios.get(url, { params });
    return response.data.response.games;
}

async function getFriendList(steamId) {
    const url = `https://api.steampowered.com/ISteamUser/GetFriendList/v0001/`;
    const params = {
        key: STEAM_API_KEY,
        steamid: steamId,
        relationship: 'friend'
    };
    const response = await axios.get(url, { params });
    return response.data.friendslist.friends.length;
}

async function getRecentlyPlayedGames(steamId) {
    const url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/`;
    const params = {
        key: STEAM_API_KEY,
        steamid: steamId,
        format: 'json'
    };
    const response = await axios.get(url, { params });
    const games = response.data.response.games;
    return games.length > 0 ? games[0] : null;
}

async function getUserStatus(steamId) {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`;
    const params = {
        key: STEAM_API_KEY,
        steamids: steamId
    };
    const response = await axios.get(url, { params });
    const player = response.data.response.players[0];
    return player.personastate;
}

async function getBase64Image(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return `data:image/png;base64,${Buffer.from(response.data, 'binary').toString('base64')}`;
}

async function generateWidgetSvg(player, level, games, friendCount, recentGame, status) {
    const template = fs.readFileSync(templatePath, 'utf8');
    const avatarUrl = await getBase64Image(player.avatarfull);
    const playerName = player.personaname;
    const steamLevel = level;
    const gamesCount = games.length;
    const friendsCount = friendCount;
    const lastPlayedGame = recentGame ? recentGame.name : 'N/A';

    let statusColor = '#808080'; // Серый (Offline) по умолчанию
    switch (status) {
        case 1:
            statusColor = '#00FF00'; // Зеленый (Online)
            break;
        case 2:
            statusColor = '#FF0000'; // Красный (Do Not Disturb)
            break;
        case 3:
            statusColor = '#0000FF'; // Синий (Away)
            break;
    }

    return template
        .replace('{avatarUrl}', avatarUrl)
        .replace('{playerName}', playerName)
        .replace('{steamLevel}', steamLevel)
        .replace('{gamesCount}', gamesCount)
        .replace('{friendsCount}', friendsCount)
        .replace('{lastPlayedGame}', lastPlayedGame)
        .replace('{statusColor}', statusColor);
}

app.get('/steam-widget', async (req, res) => {
    const steamId = req.query.steamid;

    if (!steamId) {
        return res.status(400).send('Missing Steam ID');
    }

    try {
        const player = await getPlayerData(steamId);
        const level = await getSteamLevel(steamId);
        const games = await getOwnedGames(steamId);
        const friendCount = await getFriendList(steamId);
        const recentGame = await getRecentlyPlayedGames(steamId);
        const status = await getUserStatus(steamId);

        const widgetSvg = await generateWidgetSvg(player, level, games, friendCount, recentGame, status);

        res.set('Content-Type', 'image/svg+xml');
        res.send(widgetSvg);
    } catch (error) {
        console.error('Error fetching Steam data:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
