/**
 * OrbLayout v1.0 — Builder
 * Orchestrates the build process: discovers pages, compiles, and writes output
 */

const fs = require("fs-extra");
const path = require("path");
const { glob } = require("glob");
const OrbCompiler = require("./compiler");

class OrbBuilder {
  constructor(config) {
    this.config = config;
    this.compiler = new OrbCompiler(config);
  }

  /**
   * Full build: compile all pages → dist/
   */
  async build() {
    const startTime = Date.now();

    // Ensure output directory exists and is clean
    await fs.emptyDir(this.config._output);

    // Discover all .orb page files
    const pages = await this.discoverPages();

    if (pages.length === 0) {
      console.log("  No .orb pages found in", this.config.pagesDir);
      return { pages: 0, time: 0 };
    }

    let compiled = 0;
    const errors = [];

    for (const pagePath of pages) {
      try {
        // Compute relative path and output path
        const relPath = path.relative(this.config._pages, pagePath);
        const outName = relPath.replace(/\.orb$/, ".html");
        const outPath = path.join(this.config._output, outName);

        // Ensure output subdirectory exists
        await fs.ensureDir(path.dirname(outPath));

        // Compile
        let html = this.compiler.compilePage(pagePath);

        // Minify if configured
        if (this.config.minify) {
          html = await this.minifyHTML(html);
        }

        // Write output
        await fs.writeFile(outPath, html, "utf-8");
        compiled++;

        console.log(`  ✓ ${relPath} → ${outName}`);

        // Clear caches between pages for clean state
        this.compiler.clearCache();
      } catch (e) {
        errors.push({ page: pagePath, error: e.message });
        console.error(`  ✗ ${path.relative(this.config._pages, pagePath)}: ${e.message}`);
      }
    }

    // Copy assets if they exist
    await this.copyAssets();

    const elapsed = Date.now() - startTime;

    return { pages: compiled, errors, time: elapsed };
  }

  /**
   * Discover all .orb files in pages directory
   */
  async discoverPages() {
    const pattern = path.join(this.config._pages, "**/*.orb").replace(/\\/g, "/");
    return glob(pattern);
  }

  /**
   * Copy static assets to output directory
   */
  async copyAssets() {
    if (fs.existsSync(this.config._assets)) {
      const assetsOut = path.join(this.config._output, "assets");
      await fs.copy(this.config._assets, assetsOut);
      console.log("  ✓ Assets copied");
    }
  }

  /**
   * Minify HTML output
   */
  async minifyHTML(html) {
    try {
      const { minify } = require("html-minifier-terser");
      return await minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true,
      });
    } catch (e) {
      console.warn("  ⚠ Minification failed, using unminified output");
      return html;
    }
  }
}

module.exports = OrbBuilder;
