'use strict';

const { GlobalFonts } = require('@napi-rs/canvas');
const { FONT_FAMILY, FONT_PATH } = require('./theme');

let fontsRegistered = false;

const registerFonts = () => {
  if (fontsRegistered) return;

  const fontKey = GlobalFonts.registerFromPath(FONT_PATH, FONT_FAMILY);
  if (!fontKey) {
    throw new Error(`Failed to register font: ${FONT_PATH}`);
  }

  fontsRegistered = true;
};

module.exports = { registerFonts };
