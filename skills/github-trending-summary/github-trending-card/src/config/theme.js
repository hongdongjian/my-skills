'use strict';

const fs = require('fs');

// ──────────────────────────────────────────────
// Theme configuration — all visual constants
// ──────────────────────────────────────────────

const CANVAS = Object.freeze({
  WIDTH: 1080,
  HEADER_HEIGHT: 150,
  CARD_HEIGHT: 150,
  CARD_GAP: 16,
  PADDING_X: 48,
  PADDING_TOP: 36,
  PADDING_BOTTOM: 48,
  BORDER_RADIUS: 0,
  CARD_BORDER_RADIUS: 16,
  CARD_BORDER_WIDTH: 1,
});

const COLORS = Object.freeze({
  BG_MAIN: '#0c1524',         // 7. 底色偏蓝点
  BG_HEADER: '#141e30',
  BG_CARD: '#172033',
  TEXT_TITLE: '#CC2233',       // 1. GitHub Trending 字体颜色 #CC2233
  TEXT_WHITE: '#e6edf3',
  TEXT_GRAY: '#8b949e',
  TEXT_DESC: '#9ca3af',
  TEXT_TODAY: '#FF6B6B',       // 4. Today 颜色浅一点
  TEXT_LANGUAGE: '#FF6B6B',
  BADGE_TOP_START: '#CC2233',  // 2. TOP 背景色更深偏红
  BADGE_TOP_END: '#AA1122',    // 2. TOP 背景色更深偏红
});

const FONT_FAMILY = 'GitHubTrendingCJK';

const FONT_CANDIDATES = Object.freeze([
  '/System/Library/Fonts/Hiragino Sans GB.ttc',
  '/System/Library/Fonts/STHeiti Medium.ttc',
  '/System/Library/Fonts/STHeiti Light.ttc',
  '/System/Library/Fonts/Supplemental/Songti.ttc',
  '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
  '/Library/Fonts/Arial Unicode.ttf',
]);

const resolveFontPath = () => {
  const customPath = process.env.GITHUB_TRENDING_FONT_PATH?.trim();
  if (customPath) {
    if (!fs.existsSync(customPath)) {
      throw new Error(`Configured font not found: ${customPath}`);
    }
    return customPath;
  }

  for (const candidate of FONT_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `No usable CJK font found. Set GITHUB_TRENDING_FONT_PATH to one of: ${FONT_CANDIDATES.join(', ')}`
  );
};

const FONT_PATH = resolveFontPath();

const FONTS = Object.freeze({
  TITLE: `bold 42px "${FONT_FAMILY}"`,
  SUBTITLE: `22px "${FONT_FAMILY}"`,
  PROJECT_NAME: `bold 28px "${FONT_FAMILY}"`,
  DESCRIPTION: `24px "${FONT_FAMILY}"`,
  META: `26px "${FONT_FAMILY}"`,
  BADGE_RANK: `bold 26px "${FONT_FAMILY}"`,
  BADGE_TOP: `bold 28px "${FONT_FAMILY}"`,
});

module.exports = { CANVAS, COLORS, FONTS, FONT_FAMILY, FONT_PATH, FONT_CANDIDATES };
