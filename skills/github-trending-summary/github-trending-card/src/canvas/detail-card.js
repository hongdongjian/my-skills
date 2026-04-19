'use strict';

const { loadImage, createCanvas } = require('@napi-rs/canvas');
const { COLORS, FONTS, CANVAS, FONT_FAMILY } = require('../config/theme');
const { registerFonts } = require('../config/fonts');
const { fillRoundedRect, fillCardWithBorder } = require('./primitives');
const { getRankColor } = require('../utils/colors');

// ──────────────────────────────────────────────
// Detail card — one image per project
// Layout: preview image (top) + readme content (bottom)
// ──────────────────────────────────────────────

const DETAIL = Object.freeze({
  WIDTH: 1080,
  PREVIEW_HEIGHT: 454,
  PADDING_X: 48,
  PADDING_TOP: 36,
  PADDING_BOTTOM: 48,
  CONTENT_PADDING_X: 32,
  CONTENT_PADDING_Y: 24,
  INDENT_X: 44,
  SECTION_GAP: 0,
  LINE_HEIGHT: 44,
  MAX_LINES: 11,
  BORDER_RADIUS: 16,
  HEADER_HEIGHT: 80,
});

/**
 * Clean readme text before rendering:
 * - Decode common HTML entities
 * - Collapse runs of whitespace-only lines into a single blank line
 * - Remove lines that are purely punctuation/symbols with no readable words
 *
 * @param {string} text
 * @returns {string}
 */
const cleanReadmeText = (text) => {
  const htmlEntities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#39;': "'", '&middot;': '·', '&nbsp;': ' ', '&mdash;': '—',
    '&ndash;': '–', '&hellip;': '…', '&copy;': '©', '&reg;': '®',
  };

  let cleaned = text;

  // decode HTML entities
  for (const [entity, char] of Object.entries(htmlEntities)) {
    cleaned = cleaned.split(entity).join(char);
  }
  // decode numeric entities like &#123;
  cleaned = cleaned.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

  // split into lines, filter and normalize
  const lines = cleaned.split('\n');
  const result = [];
  let blankCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      blankCount++;
      // allow at most one consecutive blank line
      if (blankCount === 1) result.push('');
      continue;
    }

    blankCount = 0;

    // skip lines that contain no letter or digit (e.g. "| --- | --- |", "···")
    if (!/[\p{L}\p{N}]/u.test(trimmed)) continue;

    result.push(trimmed);
  }

  return result.join('\n').replace(/\n{2,}/g, '\n').trim();
};

/**
 * Wrap text into lines that fit within maxWidth.
 * Pure function — no side effects.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]}
 */
/**
 * Tokenize text into words for wrapping.
 * English/numbers are kept as space-separated tokens;
 * CJK characters are split individually so they can wrap anywhere.
 *
 * @param {string} text
 * @returns {string[]}
 */
const tokenize = (text) => {
  const tokens = [];
  // Match runs of CJK characters, or runs of non-CJK non-space characters, or spaces
  const re = /([\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef\u2e80-\u2eff]+|[^\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef\u2e80-\u2eff\s]+|\s+)/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const token = match[0];
    if (/\s/.test(token)) continue; // skip pure whitespace tokens
    // split CJK runs into individual characters
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(token)) {
      for (const ch of token) tokens.push(ch);
    } else {
      tokens.push(token);
    }
  }
  return tokens;
};

/**
 * Wrap text into lines that fit within maxWidth.
 * Handles CJK character-level wrapping and Latin word-level wrapping.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @returns {{ text: string, indent: boolean }[]}
 */
const wrapText = (ctx, text, maxWidth) => {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    const tokens = tokenize(paragraph);
    if (tokens.length === 0) {
      lines.push({ text: '', indent: false });
      continue;
    }
    let isFirst = true;
    let current = '';
    for (const token of tokens) {
      const separator = current && !/[\u4e00-\u9fff\u3400-\u4dbf]/.test(token) && !/[\u4e00-\u9fff\u3400-\u4dbf]/.test(current.slice(-1)) ? ' ' : '';
      const candidate = current ? `${current}${separator}${token}` : token;
      const availableWidth = isFirst ? maxWidth - DETAIL.INDENT_X : maxWidth;
      if (ctx.measureText(candidate).width <= availableWidth) {
        current = candidate;
      } else {
        if (current) {
          lines.push({ text: current, indent: isFirst });
          isFirst = false;
        }
        current = token;
      }
    }
    if (current) lines.push({ text: current, indent: isFirst });
  }
  return lines;
};

/**
 * Fetch remote image with timeout and retry.
 * Retries up to MAX_RETRIES times with exponential backoff.
 *
 * @param {string} url
 * @param {number} [maxRetries=3]
 * @returns {Promise<import('@napi-rs/canvas').Image|null>}
 */
const fetchImage = async (url, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      return await loadImage(buf);
    } catch (err) {
      const isLast = attempt === maxRetries;
      console.error(`[fetchImage] attempt ${attempt}/${maxRetries} failed: ${err.message}${isLast ? ' — giving up' : ' — retrying...'}`, url);
      if (!isLast) {
        await new Promise((r) => setTimeout(r, 500 * attempt)); // 0.5s, 1s, 1.5s
      }
    }
  }
  return null;
};

/**
 * Draw the preview image area (top section).
 * Falls back to a solid-color placeholder if the image fails to load.
 */
const drawPreview = (ctx, img, { width }) => {
  const x = 0;
  const y = 0;
  const w = width;
  const h = DETAIL.PREVIEW_HEIGHT;

  if (img) {
    // clip to rect then draw, preserving aspect ratio (cover)
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const scale = Math.max(w / img.width, h / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = x + (w - drawW) / 2;
    const drawY = y + (h - drawH) / 2;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  } else {
    // placeholder gradient
    ctx.save();
    const grad = ctx.createLinearGradient(x, y, w, h);
    grad.addColorStop(0, '#141e30');
    grad.addColorStop(1, '#0c1524');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    ctx.font = `bold 28px "${FONT_FAMILY}"`;
    ctx.fillStyle = COLORS.TEXT_GRAY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No Preview Available', w / 2, h / 2);
    ctx.restore();
  }
};

/**
 * Draw the readme content section (bottom section).
 */
const drawReadmeSection = (ctx, project, { y, width, rankColor }) => {
  const sectionX = 0;
  const sectionW = width;
  const innerX = DETAIL.CONTENT_PADDING_X;
  const innerW = sectionW - DETAIL.CONTENT_PADDING_X * 2;
  const textFont = `28px "${FONT_FAMILY}"`;

  // ── meta strip: Language | Today stars | Total stars ──
  const metaStripH = 76;
  const metaY = y;
  ctx.save();
  ctx.fillStyle = COLORS.BG_HEADER;
  ctx.fillRect(sectionX, metaY, sectionW, metaStripH);
  ctx.restore();

  // divider line below meta strip
  ctx.save();
  ctx.strokeStyle = rankColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(0, metaY + metaStripH);
  ctx.lineTo(sectionW, metaY + metaStripH);
  ctx.stroke();
  ctx.restore();

  const metaCenterY = metaY + metaStripH / 2;
  const metaFont = `bold 30px "${FONT_FAMILY}"`;

  // Project name (left)
  ctx.save();
  ctx.font = metaFont;
  ctx.fillStyle = COLORS.TEXT_WHITE;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(project.name, innerX, metaCenterY);
  ctx.restore();

  // Today stars (right)
  ctx.save();
  ctx.font = metaFont;
  ctx.fillStyle = COLORS.TEXT_TODAY;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`+${project.todayStars.replace(/^\+/, '')} today`, sectionW - innerX, metaCenterY);
  ctx.restore();

  // ── readme text area ──
  const textAreaY = y + 76 + DETAIL.CONTENT_PADDING_Y;

  ctx.save();
  ctx.font = textFont;
  ctx.fillStyle = COLORS.TEXT_DESC;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const lines = wrapText(ctx, cleanReadmeText(project.readmeContent || 'No readme available.'), innerW);
  const visibleLines = lines.slice(0, DETAIL.MAX_LINES);

  visibleLines.forEach((line, i) => {
    const x = innerX + (line.indent ? DETAIL.INDENT_X : 0);
    ctx.fillText(line.text, x, textAreaY + i * DETAIL.LINE_HEIGHT);
  });

  if (lines.length > DETAIL.MAX_LINES) {
    ctx.fillStyle = COLORS.TEXT_GRAY;
    ctx.fillText('…', innerX, textAreaY + DETAIL.MAX_LINES * DETAIL.LINE_HEIGHT);
  }

  ctx.restore();
};

/**
 * Compute total canvas height for the detail card.
 */
const computeDetailHeight = () =>
  DETAIL.PREVIEW_HEIGHT +
  DETAIL.SECTION_GAP +
  76 +                          // meta strip
  DETAIL.CONTENT_PADDING_Y +
  DETAIL.MAX_LINES * DETAIL.LINE_HEIGHT +
  DETAIL.PADDING_BOTTOM;

/**
 * Generate a detail PNG for a single project.
 *
 * @param {Object} project  - project data including imageUrl, readmeContent, etc.
 * @returns {Promise<Buffer>} PNG buffer
 */
const generateDetailCard = async (project) => {
  registerFonts();

  const width = DETAIL.WIDTH;
  const height = computeDetailHeight();
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const rankColor = getRankColor(project.rank);

  // background
  ctx.fillStyle = COLORS.BG_MAIN;
  ctx.fillRect(0, 0, width, height);

  // fetch preview image
  const img = await fetchImage(project.imageUrl);
  drawPreview(ctx, img, { width });

  // readme section
  drawReadmeSection(ctx, project, {
    y: DETAIL.PREVIEW_HEIGHT + DETAIL.SECTION_GAP,
    width,
    rankColor,
  });

  return canvas.toBuffer('image/webp', { quality: 85 });
};

module.exports = { generateDetailCard };
