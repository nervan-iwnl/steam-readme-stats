// src/render/renderTemplate.js
const fs = require('fs');
const path = require('path');
const { wrapByPx, escapeXml, textPxWidth } = require('./svgText');
const { getStrings } = require('./strings');

const templatePath = path.join(__dirname, '..', 'templates', 'widgetTemplate.svg');
const rawTemplate = fs.readFileSync(templatePath, 'utf8');

const BASE_W = 400;
const BASE_H = 220;
const TEXT_X = 140;
const RIGHT_PAD = 20;
const FONT_SIZE = 16;
const LINE_H = 22;
const MAX_W = 700;
const FIRST_LINE_PAD = 110;
const OTHER_LINES_PAD = 20;

const PLACEHOLDER = '<!--LAST_GAME_BLOCK-->';

const NAME_FONT_PX = 22;
const NAME_CHAR_PX = 14;

function renderTemplate({
  avatarUrl = '',
  playerName = 'Steam User',
  steamLevel = '—',
  gamesCount = '—',
  friendsCount = '—',
  lastPlayedGame = '—',
  statusColor = '#6272a4',
  statusKind = 'offline',
  width,
  theme = 'dark',
  lang = 'en',
}) {
  const strings = getStrings(lang);

  let finalW = width ? Number(width) : BASE_W;
  if (finalW < 320) finalW = 320;
  if (finalW > MAX_W) finalW = MAX_W;

  const nameLen = Array.from(playerName || '').length;
  if (nameLen > 0) {
    const needWForName = TEXT_X + nameLen * NAME_CHAR_PX + RIGHT_PAD;
    if (needWForName > finalW) {
      finalW = Math.min(needWForName, MAX_W);
    }
    if (nameLen > 32) {
      finalW = Math.min(
        TEXT_X + 32 * NAME_CHAR_PX + RIGHT_PAD,
        MAX_W
      );
    }
  }

  let firstAvailable = finalW - TEXT_X - RIGHT_PAD - FIRST_LINE_PAD;
  if (firstAvailable < 80) firstAvailable = 80;

  let otherAvailable = finalW - TEXT_X - RIGHT_PAD - OTHER_LINES_PAD;
  if (otherAvailable < 80) otherAvailable = 80;

  let firstPassLines = wrapByPx(lastPlayedGame, firstAvailable, FONT_SIZE);
  const hasSpaces = /\s/.test(lastPlayedGame);
  let lines;

  if (hasSpaces && firstPassLines.length > 1) {
    const head = firstPassLines[0];
    const tailText = firstPassLines.slice(1).join(' ');
    let tailLines = wrapByPx(tailText, otherAvailable, FONT_SIZE);
    lines = [head, ...tailLines];

    const headLen = (head || '').trim().length;
    if (headLen > 0 && headLen <= 4 && tailLines.length >= 1) {
      const fullValue = [head, ...tailLines].join(' ');
      tailLines = wrapByPx(fullValue, otherAvailable, FONT_SIZE);
      lines = ['', ...tailLines];
    }

    const maxTailPx = Math.max(
      0,
      ...tailLines.map((l) => textPxWidth(l, FONT_SIZE))
    );
    if (maxTailPx > otherAvailable && finalW < MAX_W) {
      const extra = maxTailPx - otherAvailable;
      let newW = finalW + extra;
      if (newW > MAX_W) newW = MAX_W;
      finalW = newW;

      firstAvailable = finalW - TEXT_X - RIGHT_PAD - FIRST_LINE_PAD;
      otherAvailable = finalW - TEXT_X - RIGHT_PAD - OTHER_LINES_PAD;
      if (firstAvailable < 80) firstAvailable = 80;
      if (otherAvailable < 80) otherAvailable = 80;

      firstPassLines = wrapByPx(lastPlayedGame, firstAvailable, FONT_SIZE);
      const head2 = firstPassLines[0];
      const tailText2 = firstPassLines.slice(1).join(' ');
      const tailLines2 = wrapByPx(tailText2, otherAvailable, FONT_SIZE);
      lines = [head2, ...tailLines2];
    }
  } else {
    lines = firstPassLines;
  }

  const extraLines = Math.max(0, lines.length - 1);
  const finalH = BASE_H + extraLines * LINE_H;

  const lastGameBlock = buildLastGameBlock(lines, strings.lastPlayed);

  let svg = rawTemplate;

  svg = svg.replace(/width="[^"]*"/, `width="${finalW}"`);
  svg = svg.replace(/height="[^"]*"/, `height="${finalH}"`);
  svg = svg.replace(/viewBox="0 0 \d+ \d+"/, `viewBox="0 0 ${finalW} ${finalH}"`);

  if (theme === 'light') {
    svg = svg.replace('#141321', '#ffffff');
    svg = svg.replace('#e4e2e2', '#d0d0d0');
  }

  svg = svg.replace(/{avatarUrl}/g, escapeXml(avatarUrl));
  svg = svg.replace(/{playerName}/g, escapeXml(playerName));
  svg = svg.replace(/{steamLevel}/g, escapeXml(String(steamLevel)));
  svg = svg.replace(/{gamesCount}/g, escapeXml(String(gamesCount)));
  svg = svg.replace(/{friendsCount}/g, escapeXml(String(friendsCount)));
  svg = svg.replace(/{statusColor}/g, escapeXml(statusColor));

  svg = svg.replace('Steam Level:', escapeXml(strings.steamLevel));
  svg = svg.replace('Games:', escapeXml(strings.games));
  svg = svg.replace('Friends:', escapeXml(strings.friends));

  svg = svg.replace(PLACEHOLDER, lastGameBlock);

  svg += `\n<!-- render:v701 ${new Date().toISOString()} -->\n`;

  return svg;
}

function buildLastGameBlock(lines, label) {
  let out = `<tspan class="key">${escapeXml(label)}</tspan>`;
  if (lines[0]) {
    out += ` <tspan class="value">${escapeXml(lines[0])}</tspan>`;
  }
  for (let i = 1; i < lines.length; i++) {
    out += `<tspan x="${TEXT_X}" dy="1.4em" class="value">${escapeXml(lines[i])}</tspan>`;
  }
  return out;
}

module.exports = {
  renderTemplate,
};
