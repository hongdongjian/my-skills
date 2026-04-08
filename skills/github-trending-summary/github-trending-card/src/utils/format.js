'use strict';

// ──────────────────────────────────────────────
// Text formatting utilities
// ──────────────────────────────────────────────

/**
 * Truncate text to fit within a max pixel width on the canvas.
 * Returns the original text if it fits, or a truncated version with "…".
 *
 * @param {CanvasRenderingContext2D} ctx - canvas context (for measureText)
 * @param {string} text - the text to potentially truncate
 * @param {number} maxWidth - max width in pixels
 * @returns {string} original or truncated text
 */
const truncateText = (ctx, text, maxWidth) => {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
};

module.exports = { truncateText };
