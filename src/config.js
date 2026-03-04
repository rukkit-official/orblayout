/**
 * OrbLayout v1.0 — Config Loader
 * Loads and validates orb.config.json
 */

const path = require("path");
const fs = require("fs-extra");

const DEFAULT_CONFIG = {
  pagesDir: "pages",
  componentsDir: "components",
  layoutsDir: "layouts",
  outputDir: "dist",
  assetsDir: "assets",
  minify: false,
  pretty: true,
};

function loadConfig(rootDir) {
  const configPath = path.join(rootDir, "orb.config.json");
  let userConfig = {};

  if (fs.existsSync(configPath)) {
    try {
      userConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (e) {
      throw new Error(`[OrbLayout] Invalid orb.config.json: ${e.message}`);
    }
  }

  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Resolve all paths relative to rootDir
  config._root = rootDir;
  config._pages = path.join(rootDir, config.pagesDir);
  config._components = path.join(rootDir, config.componentsDir);
  config._layouts = path.join(rootDir, config.layoutsDir);
  config._output = path.join(rootDir, config.outputDir);
  config._assets = path.join(rootDir, config.assetsDir);

  return config;
}

module.exports = { loadConfig, DEFAULT_CONFIG };
