require('dotenv').config(); 
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

const STEAM_API_KEY = process.env.STEAM_API_KEY;

app.use(cors());

async function getPlayerData(steamId) {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`;
    const params = {
        key: STEAM_API_KEY,
        steamids: steamId
    };
    const response = await axios.get(url, { params });
    console.log(response.data);
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

        const widgetHtml = `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                        }
                        .widget {
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            padding: 20px;
                            display: inline-block;
                            background: #f5f5f5;
                        }
                        .avatar {
                            border-radius: 50%;
                            width: 100px;
                            height: 100px;
                        }
                        .name {
                            font-size: 18px;
                            font-weight: bold;
                        }
                        .info {
                            font-size: 16px;
                            color: #555;
                        }
                        .info span {
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="widget">
                        <img src="${player.avatarfull}" class="avatar" alt="${player.personaname}">
                        <div class="name">${player.personaname}</div>
                        <div class="info"><span>Steam Level:</span> ${level}</div>
                        <div class="info"><span>Games:</span> ${games.length}</div>
                        <div class="info"><span>Friends:</span> ${friendCount}</div>
                        <div class="info"><span>Last Played Game:</span> ${recentGame ? recentGame.name : 'N/A'}</div>
                    </div>
                </body>
            </html>
        `;

        res.send(widgetHtml);
    } catch (error) {
        console.error('Error fetching Steam data:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
