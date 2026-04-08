'use strict';

// ──────────────────────────────────────────────
// Rank color palette — one per ranking position
// ──────────────────────────────────────────────

const RANK_COLORS = Object.freeze([
  '#FF6B6B', // rank 1 — coral/red
  '#4CAF50', // rank 2 — green
  '#9C27B0', // rank 3 — purple
  '#2196F3', // rank 4 — blue
  '#FF9800', // rank 5 — orange
  '#009688', // rank 6 — teal
  '#E91E63', // rank 7 — pink (extra)
  '#607D8B', // rank 8 — blue-grey (extra)
  '#795548', // rank 9 — brown (extra)
  '#3F51B5', // rank 10 — indigo (extra)
]);

const DEFAULT_RANK_COLOR = '#78909C';

/**
 * Get color for a given rank number.
 * Pure function — no mutation, always returns a value.
 * @param {number} rank - 1-based rank number
 * @returns {string} hex color string
 */
const getRankColor = (rank) =>
  RANK_COLORS[rank - 1] ?? DEFAULT_RANK_COLOR;

module.exports = { RANK_COLORS, DEFAULT_RANK_COLOR, getRankColor };
