'use strict';

const Ajv = require('ajv');

// ──────────────────────────────────────────────
// JSON schema for trending data validation
// ──────────────────────────────────────────────

const trendingSchema = Object.freeze({
  type: 'object',
  required: ['date', 'title', 'subtitle', 'topN', 'projects'],
  properties: {
    date: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
    subtitle: { type: 'string' },
    topN: { type: 'integer', minimum: 1, maximum: 20 },
    projects: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['rank', 'name', 'description', 'language', 'todayStars', 'totalStars'],
        properties: {
          rank: { type: 'integer', minimum: 1 },
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          language: { type: 'string' },
          todayStars: { type: 'string' },
          totalStars: { type: 'string' },
          totalForks: { type: 'string' },
          readmeContent: { type: 'string' },
          imageUrl: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
});

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(trendingSchema);

/**
 * Validate trending data against schema.
 * Returns a result object (never throws).
 *
 * @param {unknown} data - raw JSON data
 * @returns {{ ok: true, data: object } | { ok: false, errors: string[] }}
 */
const validateTrendingData = (data) => {
  const valid = validate(data);
  if (valid) {
    return { ok: true, data };
  }
  const errors = (validate.errors || []).map(
    (err) => `${err.instancePath || '/'}: ${err.message}`
  );
  return { ok: false, errors };
};

module.exports = { validateTrendingData, trendingSchema };
