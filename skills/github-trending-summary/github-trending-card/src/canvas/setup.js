'use strict';

const { createCanvas } = require('@napi-rs/canvas');
const { CANVAS } = require('../config/theme');
const { registerFonts } = require('../config/fonts');

// ──────────────────────────────────────────────
// Canvas setup — font registration & creation
// ──────────────────────────────────────────────

/**
 * Compute canvas height dynamically based on project count.
 * @param {number} projectCount - number of projects to display
 * @returns {number} canvas height in pixels
 */
const computeCanvasHeight = (projectCount) =>
  CANVAS.PADDING_TOP +
  CANVAS.HEADER_HEIGHT +
  projectCount * (CANVAS.CARD_HEIGHT + CANVAS.CARD_GAP) -
  CANVAS.CARD_GAP +
  CANVAS.PADDING_BOTTOM;

/**
 * Create a canvas with dynamic height for the given number of projects.
 * @param {number} projectCount
 * @returns {{ canvas: Canvas, ctx: CanvasRenderingContext2D }}
 */
const createTrendingCanvas = (projectCount) => {
  registerFonts();
  const height = computeCanvasHeight(projectCount);
  const canvas = createCanvas(CANVAS.WIDTH, height);
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
};

module.exports = { registerFonts, computeCanvasHeight, createTrendingCanvas };
