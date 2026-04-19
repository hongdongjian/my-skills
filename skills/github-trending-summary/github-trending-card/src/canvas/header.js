'use strict';

const { CANVAS, COLORS, FONTS } = require('../config/theme');
const { fillRoundedRect, fillGradientBadge } = require('./primitives');

// ──────────────────────────────────────────────
// Header section — title, subtitle, TOP N badge
// ──────────────────────────────────────────────

/**
 * Draw the header background card.
 */
const drawHeaderBackground = (ctx, { canvasWidth }) => {
  fillRoundedRect(ctx, {
    x: CANVAS.PADDING_X,
    y: CANVAS.PADDING_TOP,
    width: canvasWidth - CANVAS.PADDING_X * 2,
    height: 120,
    radius: CANVAS.CARD_BORDER_RADIUS,
    color: COLORS.BG_HEADER,
  });
};

/**
 * Draw the header title text.
 */
const drawHeaderTitle = (ctx, { title }) => {
  ctx.save();
  ctx.font = FONTS.TITLE;
  ctx.fillStyle = COLORS.TEXT_TITLE;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, CANVAS.PADDING_X + 24, CANVAS.PADDING_TOP + 18);
  ctx.restore();
};

/**
 * Draw the header subtitle (date + label).
 */
const drawHeaderSubtitle = (ctx, { date, subtitle }) => {
  ctx.save();
  ctx.font = FONTS.SUBTITLE;
  ctx.fillStyle = COLORS.TEXT_GRAY;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`${date} ${subtitle}`, CANVAS.PADDING_X + 24, CANVAS.PADDING_TOP + 74);
  ctx.restore();
};

/**
 * Draw the TOP N badge in the header's top-right.
 */
const drawTopBadge = (ctx, { topN, canvasWidth }) => {
  const badgeWidth = 110;
  const badgeHeight = 52;
  const headerBgHeight = 120;
  // 上下居中于 header 背景
  const badgeY = CANVAS.PADDING_TOP + (headerBgHeight - badgeHeight) / 2;
  fillGradientBadge(ctx, {
    x: canvasWidth - CANVAS.PADDING_X - badgeWidth - 15,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    radius: 12,
    colorStart: COLORS.BADGE_TOP_START,
    colorEnd: COLORS.BADGE_TOP_END,
    text: `TOP ${topN}`,
    font: FONTS.BADGE_TOP,
    textColor: '#FFFFFF',
  });
};

/**
 * Draw the complete header section.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} params - { title, date, subtitle, topN, canvasWidth }
 */
const drawHeader = (ctx, params) => {
  drawHeaderBackground(ctx, params);
  drawHeaderTitle(ctx, params);
  drawHeaderSubtitle(ctx, params);
  drawTopBadge(ctx, params);
};

module.exports = { drawHeader };
