'use strict';

// ──────────────────────────────────────────────
// Canvas drawing primitives — reusable helpers
// Every function uses save()/restore() for isolation.
// ──────────────────────────────────────────────

/**
 * Trace a rounded rectangle path (does NOT fill or stroke).
 */
const roundedRectPath = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

/**
 * Fill a rounded rectangle with a solid color.
 */
const fillRoundedRect = (ctx, { x, y, width, height, radius, color }) => {
  ctx.save();
  ctx.fillStyle = color;
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.restore();
};

/**
 * Draw a rounded rectangle outline (stroke only).
 */
const strokeRoundedRect = (ctx, { x, y, width, height, radius, color, lineWidth = 2 }) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.stroke();
  ctx.restore();
};

/**
 * Draw a rounded card with a colored border outline.
 * Draws a filled background rect with a stroked colored border.
 */
const fillCardWithBorder = (ctx, { x, y, width, height, radius, bgColor, borderColor, borderWidth = 2 }) => {
  ctx.save();
  // Fill the card background
  fillRoundedRect(ctx, { x, y, width, height, radius, color: bgColor });
  // Stroke the border
  strokeRoundedRect(ctx, {
    x: x + borderWidth / 2,
    y: y + borderWidth / 2,
    width: width - borderWidth,
    height: height - borderWidth,
    radius: radius - borderWidth / 2,
    color: borderColor,
    lineWidth: borderWidth,
  });
  ctx.restore();
};

/**
 * Draw a gradient-filled rounded badge with centered text.
 */
const fillGradientBadge = (ctx, { x, y, width, height, radius, colorStart, colorEnd, text, font, textColor }) => {
  ctx.save();
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  ctx.fillStyle = gradient;
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.fill();

  ctx.font = font;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + height / 2);
  ctx.restore();
};

/**
 * Draw a small colored rank badge (rounded square with number).
 */
const drawRankBadge = (ctx, { x, y, size, radius, color, rank, font }) => {
  ctx.save();
  ctx.fillStyle = color;
  roundedRectPath(ctx, x, y, size, size, radius);
  ctx.fill();

  ctx.font = font;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(rank), x + size / 2, y + size / 2);
  ctx.restore();
};

module.exports = {
  roundedRectPath,
  fillRoundedRect,
  strokeRoundedRect,
  fillCardWithBorder,
  fillGradientBadge,
  drawRankBadge,
};
