#!/usr/bin/env node

/**
 * OrbLayout v1.2 — CLI
 * Usage:
 *   orb build          Build all pages to dist/
 *   orb dev            Start dev server with live reload
 *   orb init           Scaffold a new OrbLayout project
 *   orb clean          Remove dist/ output
 *   orb build --minify Build with HTML minification
 */

const path = require("path");
const fs = require("fs-extra");
const { loadConfig } = require("../src/config");
const OrbBuilder = require("../src/builder");
const OrbDevServer = require("../src/server");

const VERSION = "1.2.0";

// ─── Banner ─────────────────────────────────────────────
function banner() {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║     ◉  O r b L a y o u t  v${VERSION}    ║
  ║     Static Site Builder               ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
  `);
}

// ─── Commands ───────────────────────────────────────────

async function cmdBuild(flags) {
  banner();
  const rootDir = process.cwd();
  const config = loadConfig(rootDir);

  if (flags.minify) config.minify = true;

  const builder = new OrbBuilder(config);

  console.log("  Building pages...\n");
  const result = await builder.build();

  console.log(`\n  ──────────────────────────────────`);
  console.log(`  Done! ${result.pages} page(s) compiled in ${result.time}ms`);
  console.log(`  Output: ${config.outputDir}/\n`);

  if (result.errors && result.errors.length > 0) {
    console.log(`  ⚠ ${result.errors.length} error(s) occurred\n`);
    process.exit(1);
  }
}

async function cmdDev(flags) {
  banner();
  const rootDir = process.cwd();
  const config = loadConfig(rootDir);

  const port = parseInt(flags.port || "3000", 10);
  const server = new OrbDevServer(config);

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n  Shutting down...\n");
    server.stop();
    process.exit(0);
  });

  await server.start(port);
}

async function cmdInit() {
  banner();
  const rootDir = process.cwd();

  console.log("  Scaffolding new OrbLayout project...\n");

  // Create directories
  const dirs = ["pages", "components", "layouts", "assets"];
  for (const dir of dirs) {
    await fs.ensureDir(path.join(rootDir, dir));
    console.log(`  ✓ Created ${dir}/`);
  }

  // Create orb.config.json
  if (!fs.existsSync(path.join(rootDir, "orb.config.json"))) {
    await fs.writeJSON(
      path.join(rootDir, "orb.config.json"),
      {
        pagesDir: "pages",
        componentsDir: "components",
        layoutsDir: "layouts",
        outputDir: "dist",
        assetsDir: "assets",
        minify: false,
        pretty: true,
      },
      { spaces: 2 }
    );
    console.log("  ✓ Created orb.config.json");
  }

  // Create default layout
  const layoutPath = path.join(rootDir, "layouts", "main.layout");
  if (!fs.existsSync(layoutPath)) {
    await fs.writeFile(
      layoutPath,
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
</head>
<body>

  <use component="header" title="{{ title }}" />

  <main>
    {{ content }}
  </main>

  <use component="footer" />

</body>
</html>
`,
      "utf-8"
    );
    console.log("  ✓ Created layouts/main.layout");
  }

  // Create header component
  const headerPath = path.join(rootDir, "components", "header.orb");
  if (!fs.existsSync(headerPath)) {
    await fs.writeFile(
      headerPath,
      `<header>
  <nav>
    <h1>{{ title }}</h1>
  </nav>
</header>
`,
      "utf-8"
    );
    console.log("  ✓ Created components/header.orb");
  }

  // Create footer component
  const footerPath = path.join(rootDir, "components", "footer.orb");
  if (!fs.existsSync(footerPath)) {
    await fs.writeFile(
      footerPath,
      `<footer>
  <p>&copy; ${new Date().getFullYear()} OrbLayout</p>
</footer>
`,
      "utf-8"
    );
    console.log("  ✓ Created components/footer.orb");
  }

  // Create default index page
  const indexPath = path.join(rootDir, "pages", "index.orb");
  if (!fs.existsSync(indexPath)) {
    await fs.writeFile(
      indexPath,
      `<layout src="main.layout">
  <content>
    <h1>Welcome to OrbLayout</h1>
    <p>Your lightweight static site builder is ready!</p>
  </content>
</layout>
`,
      "utf-8"
    );
    console.log("  ✓ Created pages/index.orb");
  }

  console.log(`\n  ──────────────────────────────────`);
  console.log("  Project scaffolded! Run:\n");
  console.log("    orb build    — Build static HTML");
  console.log("    orb dev      — Start dev server\n");
}

async function cmdClean() {
  banner();
  const rootDir = process.cwd();
  const config = loadConfig(rootDir);
  await fs.emptyDir(config._output);
  console.log(`  ✓ Cleaned ${config.outputDir}/\n`);
}

function cmdHelp() {
  banner();
  console.log(`  Usage: orb <command> [options]

  Commands:
    build          Compile .orb pages to static HTML
    dev            Start dev server with live reload
    init           Scaffold a new OrbLayout project
    clean          Remove build output
    help           Show this help message
    version        Show version

  Options:
    --minify       Minify HTML output (build)
    --port <num>   Dev server port (default: 3000)

  Examples:
    orb init
    orb build
    orb build --minify
    orb dev
    orb dev --port 8080

  GitHub: https://github.com/rukkit-official/orblayout
  `);
}

// ─── Parse args ─────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const command = args[0] || "help";
  const flags = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }

  return { command, flags };
}

// ─── Main ───────────────────────────────────────────────

async function main() {
  const { command, flags } = parseArgs(process.argv);

  try {
    switch (command) {
      case "build":
        await cmdBuild(flags);
        break;
      case "dev":
        await cmdDev(flags);
        break;
      case "init":
        await cmdInit();
        break;
      case "clean":
        await cmdClean();
        break;
      case "version":
      case "-v":
      case "--version":
        console.log(`OrbLayout v${VERSION}`);
        break;
      case "help":
      case "-h":
      case "--help":
      default:
        cmdHelp();
        break;
    }
  } catch (e) {
    console.error(`\n  ✗ Error: ${e.message}\n`);
    if (flags.verbose) console.error(e.stack);
    process.exit(1);
  }
}

main();
