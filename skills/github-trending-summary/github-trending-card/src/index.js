'use strict';

const fs = require('fs');
const path = require('path');

const { CANVAS, COLORS } = require('./config/theme');
const { validateTrendingData } = require('./config/schema');
const { getRankColor } = require('./utils/colors');
const { createTrendingCanvas } = require('./canvas/setup');
const { drawHeader } = require('./canvas/header');
const { drawProjectCard, computeMetaColumns } = require('./canvas/project-card');
const { generateDetailCard } = require('./canvas/detail-card');

// ──────────────────────────────────────────────
// Entry point — orchestrates image generation
// Outputs:
//   0.png  — main trending overview card
//   1.png  — detail card for project rank 1
//   2.png  — detail card for project rank 2
//   …
// ──────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DATA_PATH = path.join(PROJECT_ROOT, 'data', 'data.json');
const DEFAULT_OUTPUT_DIR = path.join(PROJECT_ROOT, 'output');

/**
 * Parse CLI arguments for custom input/output paths.
 * @param {string[]} argv
 * @returns {{ inputPath: string, outputDir: string }}
 */
const parseArgs = (argv) => {
  const inputIdx = argv.indexOf('--input');
  const outputIdx = argv.indexOf('--output');
  return {
    inputPath: inputIdx !== -1 && argv[inputIdx + 1]
      ? path.resolve(argv[inputIdx + 1])
      : DEFAULT_DATA_PATH,
    outputDir: outputIdx !== -1 && argv[outputIdx + 1]
      ? path.resolve(argv[outputIdx + 1])
      : DEFAULT_OUTPUT_DIR,
  };
};

/**
 * Load and validate JSON data from file.
 * @param {string} filePath
 * @returns {object} validated data
 */
const loadData = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Data file not found: ${filePath}`);
    process.exit(1);
  }

  // Use a state-machine to escape literal control characters that appear
  // inside JSON string values (common in scraped readme content).
  // Regex-based approaches are unreliable because readmeContent can contain
  // multi-line content that confuses string boundary detection.
  const sanitizeJson = (src) => {
    const out = [];
    let inString = false;
    let escaped = false;

    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      const code = src.charCodeAt(i);

      if (escaped) {
        out.push(ch);
        escaped = false;
        continue;
      }

      if (ch === '\\' && inString) {
        out.push(ch);
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        out.push(ch);
        continue;
      }

      if (inString && code >= 0x00 && code <= 0x1F) {
        // Replace illegal control characters with their JSON escape sequences
        if (code === 0x0A) { out.push('\\n'); continue; }
        if (code === 0x0D) { out.push('\\r'); continue; }
        if (code === 0x09) { out.push('\\t'); continue; }
        out.push(' ');
        continue;
      }

      out.push(ch);
    }
    return out.join('');
  };

  const raw = JSON.parse(sanitizeJson(fs.readFileSync(filePath, 'utf-8')));
  const result = validateTrendingData(raw);

  if (!result.ok) {
    console.error('❌ Invalid data format:');
    result.errors.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
  }

  return result.data;
};

/**
 * Ensure output directory exists.
 * @param {string} dir
 */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Draw the main canvas background.
 */
const drawBackground = (ctx, { width, height }) => {
  ctx.save();
  ctx.fillStyle = COLORS.BG_MAIN;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

/**
 * Draw all project cards with aligned meta columns.
 */
const drawAllCards = (ctx, projects, canvasWidth) => {
  const cardStartY = CANVAS.PADDING_TOP + CANVAS.HEADER_HEIGHT;
  const metaColumns = computeMetaColumns(ctx, projects);

  projects.forEach((project, index) => {
    const cardY = cardStartY + index * (CANVAS.CARD_HEIGHT + CANVAS.CARD_GAP);
    drawProjectCard(ctx, project, {
      x: CANVAS.PADDING_X,
      y: cardY,
      width: canvasWidth - CANVAS.PADDING_X * 2,
      height: CANVAS.CARD_HEIGHT,
      rankColor: getRankColor(project.rank),
      metaColumns,
    });
  });
};

/**
 * Generate and save the main overview card as 0.png.
 * @param {object} data - validated trending data
 * @param {string} outputDir
 */
const generateMainCard = (data, outputDir) => {
  const { canvas, ctx } = createTrendingCanvas(data.projects.length);

  drawBackground(ctx, { width: canvas.width, height: canvas.height });
  drawHeader(ctx, {
    title: data.title,
    date: data.date,
    subtitle: data.subtitle,
    topN: data.topN,
    canvasWidth: canvas.width,
  });
  drawAllCards(ctx, data.projects, canvas.width);

  const outputPath = path.join(outputDir, '0.webp');
  fs.writeFileSync(outputPath, canvas.toBuffer('image/webp', { quality: 85 }));
  console.log(`✅ Main card saved: ${outputPath}`);
};

/**
 * Generate and save one detail card per project as {rank}.png.
 * Runs all requests concurrently.
 * @param {object[]} projects
 * @param {string} outputDir
 */
const generateDetailCards = async (projects, outputDir) => {
  await Promise.all(
    projects.map(async (project) => {
      const buffer = await generateDetailCard(project);
      const outputPath = path.join(outputDir, `${project.rank}.webp`);
      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ Detail card saved: ${outputPath}`);
    })
  );
};

/**
 * Main entry point.
 */
const generate = async () => {
  const { inputPath, outputDir } = parseArgs(process.argv);

  console.log(`📖 Loading data from: ${inputPath}`);
  const data = loadData(inputPath);

  ensureDir(outputDir);

  console.log(`🎨 Generating main card (0.png) for ${data.projects.length} projects...`);
  generateMainCard(data, outputDir);

  console.log(`🖼  Generating ${data.projects.length} detail cards (1.png, 2.png, ...)...`);
  await generateDetailCards(data.projects, outputDir);

  console.log(`\n🎉 All done — ${data.projects.length + 1} images saved to: ${outputDir}`);
};

generate().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
