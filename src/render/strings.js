// src/render/strings.js
const STRINGS = {
  en: {
    steamLevel: 'Steam Level:',
    games: 'Games:',
    friends: 'Friends:',
    lastPlayed: 'Last Played Game:',
  },
  ru: {
    steamLevel: 'Уровень Steam:',
    games: 'Игры:',
    friends: 'Друзья:',
    lastPlayed: 'Последняя игра:',
  },
};

function getStrings(lang) {
  if (!lang) return STRINGS.en;
  const key = lang.toLowerCase();
  return STRINGS[key] || STRINGS.en;
}

module.exports = {
  getStrings,
};
