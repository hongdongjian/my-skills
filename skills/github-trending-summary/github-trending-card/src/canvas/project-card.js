'use strict';

const { COLORS, FONTS, CANVAS } = require('../config/theme');
const { fillCardWithBorder, drawRankBadge } = require('./primitives');
const { truncateText } = require('../utils/format');

// ──────────────────────────────────────────────
// Project card — draws a single project entry
// ──────────────────────────────────────────────

/**
 * Draw the card background with colored border.
 */
const drawCardBackground = (ctx, { x, y, width, height, rankColor }) => {
  fillCardWithBorder(ctx, {
    x,
    y,
    width,
    height,
    radius: CANVAS.CARD_BORDER_RADIUS,
    bgColor: COLORS.BG_CARD,
    borderColor: rankColor,
    borderWidth: CANVAS.CARD_BORDER_WIDTH,
  });
};

/**
 * Draw the rank badge on the left side of the card.
 */
const drawCardRankBadge = (ctx, { x, y, height, rank, rankColor }) => {
  const badgeSize = 44;
  const badgeX = x + 18;
  const badgeY = y + (height - badgeSize) / 2 - 5;

  drawRankBadge(ctx, {
    x: badgeX,
    y: badgeY,
    size: badgeSize,
    radius: 10,
    color: rankColor,
    rank,
    font: FONTS.BADGE_RANK,
  });

  return { badgeRight: badgeX + badgeSize };
};

/**
 * Draw the project name (line 1).
 */
const drawProjectName = (ctx, { textX, y, name, maxWidth }) => {
  ctx.save();
  ctx.font = FONTS.PROJECT_NAME;
  ctx.fillStyle = COLORS.TEXT_WHITE;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(truncateText(ctx, name, maxWidth), textX, y + 14);
  ctx.restore();
};

/**
 * Draw the project description (line 2).
 */
const drawProjectDescription = (ctx, { textX, y, description, maxWidth }) => {
  ctx.save();
  ctx.font = FONTS.DESCRIPTION;
  ctx.fillStyle = COLORS.TEXT_DESC;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(truncateText(ctx, description, maxWidth), textX, y + 48);
  ctx.restore();
};

/**
 * Pre-calculate meta column positions based on the longest text across all projects.
 * Ensures all cards have vertically aligned Language / Today / Total columns.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object[]} projects
 * @returns {{ langColWidth: number, todayColWidth: number }}
 */
const computeMetaColumns = (ctx, projects) => {
  ctx.save();
  ctx.font = FONTS.META;

  const langColWidth = projects.reduce((max, p) => {
    const w = ctx.measureText(`Language: ${p.language}`).width;
    return Math.max(max, w);
  }, 0);

  const todayColWidth = projects.reduce((max, p) => {
    const w = ctx.measureText(`Today ${p.todayStars}`).width;
    return Math.max(max, w);
  }, 0);

  ctx.restore();
  return { langColWidth, todayColWidth };
};

/**
 * Draw the metadata row: Language | Today stars | Total stars.
 * Column positions are pre-calculated so all cards align vertically.
 */
const drawProjectMeta = (ctx, { textX, y, language, todayStars, totalStars, metaColumns, rankColor }) => {
  ctx.save();
  ctx.font = FONTS.META;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const metaY = y + 82;
  const gap = 65;
  const todayX = textX + metaColumns.langColWidth + gap;
  const totalX = todayX + metaColumns.todayColWidth + gap;

  // Language — color matches rank badge
  ctx.fillStyle = rankColor;
  ctx.fillText(`Language: ${language}`, textX, metaY);

  // Today stars
  ctx.fillStyle = COLORS.TEXT_TODAY;
  ctx.fillText(`Today ${todayStars}`, todayX, metaY);

  // Total stars
  ctx.fillStyle = COLORS.TEXT_GRAY;
  ctx.fillText(`Total ${totalStars}`, totalX, metaY);

  ctx.restore();
};

/**
 * Draw a complete project card.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} project - { rank, name, description, language, todayStars, totalStars }
 * @param {Object} layout  - { x, y, width, height, rankColor, metaColumns }
 */
const drawProjectCard = (ctx, project, layout) => {
  const { x, y, width, height, rankColor, metaColumns } = layout;

  drawCardBackground(ctx, { x, y, width, height, rankColor });

  const { badgeRight } = drawCardRankBadge(ctx, {
    x, y, height,
    rank: project.rank,
    rankColor,
  });

  const textX = badgeRight + 18;
  const maxWidth = width - (textX - x) - 20;

  drawProjectName(ctx, { textX, y, name: project.name, maxWidth });
  drawProjectDescription(ctx, { textX, y, description: project.description, maxWidth });
  drawProjectMeta(ctx, {
    textX,
    y,
    language: project.language,
    todayStars: project.todayStars,
    totalStars: project.totalStars,
    metaColumns,
    rankColor,
  });
};

module.exports = { drawProjectCard, computeMetaColumns };
