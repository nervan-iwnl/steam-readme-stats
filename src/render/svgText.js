// src/render/svgText.js

const AVG_CHAR_RATIO = 0.56;
const SOFT_MARGIN_PX = 30;

function textPxWidth(str, fontPx) {
  return Math.ceil(String(str || '').length * fontPx * AVG_CHAR_RATIO);
}

function chunkLongWord(word, maxPx, fontPx) {
  let maxChars = Math.floor((maxPx - SOFT_MARGIN_PX) / (fontPx * AVG_CHAR_RATIO));
  if (maxChars < 1) maxChars = 1;

  const chunks = [];
  for (let i = 0; i < word.length; i += maxChars) {
    chunks.push(word.slice(i, i + maxChars));
  }
  return chunks;
}

function wrapByPx(text, maxPx, fontPx) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (const rawWord of words) {
    const wWidth = textPxWidth(rawWord, fontPx);
    const shouldChunk = wWidth >= maxPx - SOFT_MARGIN_PX;
    const parts = shouldChunk ? chunkLongWord(rawWord, maxPx, fontPx) : [rawWord];

    for (const part of parts) {
      const partWidth = textPxWidth(part, fontPx);

      if (line) {
        const candidate = line + ' ' + part;
        const cWidth = textPxWidth(candidate, fontPx);

        if (cWidth < maxPx - SOFT_MARGIN_PX) {
          line = candidate;
        } else if (cWidth <= maxPx) {
          lines.push(line);
          line = part;
        } else {
          lines.push(line);
          line = part;
        }
      } else {
        if (partWidth <= maxPx) {
          line = part;
        } else {
          lines.push(part);
          line = '';
        }
      }
    }
  }

  if (line) lines.push(line);

  return lines;
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = {
  textPxWidth,
  wrapByPx,
  escapeXml,
};
