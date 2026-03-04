/**
 * OrbLayout v1.0 — Dev Server
 * Simple HTTP server with file watching and live reload
 */

const http = require("http");
const fs = require("fs-extra");
const path = require("path");
const OrbBuilder = require("./builder");

// Live reload script injected into HTML pages
const LIVE_RELOAD_SCRIPT = `
<script>
(function() {
  const es = new EventSource('/__orb_reload');
  es.onmessage = function(e) {
    if (e.data === 'reload') {
      window.location.reload();
    }
  };
  es.onerror = function() {
    setTimeout(function() { window.location.reload(); }, 2000);
  };
})();
</script>
`;

class OrbDevServer {
  constructor(config) {
    this.config = config;
    this.builder = new OrbBuilder(config);
    this.clients = [];
    this.server = null;
    this.watcher = null;
  }

  /**
   * Start dev server with watch + live reload
   */
  async start(port = 3000) {
    // Initial build
    console.log("\n  Building...\n");
    await this.builder.build();

    // Start HTTP server
    this.server = http.createServer((req, res) => this.handleRequest(req, res));

    this.server.listen(port, () => {
      console.log(`\n  🌐 OrbLayout dev server running at http://localhost:${port}`);
      console.log("  Watching for changes...\n");
    });

    // Start file watcher
    await this.startWatcher();
  }

  /**
   * Handle HTTP requests
   */
  handleRequest(req, res) {
    // Handle SSE endpoint for live reload
    if (req.url === "/__orb_reload") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      res.write("data: connected\n\n");
      this.clients.push(res);
      req.on("close", () => {
        this.clients = this.clients.filter((c) => c !== res);
      });
      return;
    }

    // Serve static files from dist
    let urlPath = req.url === "/" ? "/index.html" : req.url;

    // Try adding .html extension
    let filePath = path.join(this.config._output, urlPath);
    if (!fs.existsSync(filePath) && !path.extname(filePath)) {
      filePath += ".html";
    }

    // Try index.html in directory
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end(`
        <html>
          <head><title>404 — OrbLayout</title></head>
          <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa;">
            <div style="text-align: center;">
              <h1 style="font-size: 4rem; margin: 0; opacity: 0.2;">404</h1>
              <p>Page not found</p>
            </div>
          </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    let content = fs.readFileSync(filePath);

    // Inject live reload script into HTML
    if (ext === ".html") {
      content = content.toString("utf-8");
      if (content.includes("</body>")) {
        content = content.replace("</body>", `${LIVE_RELOAD_SCRIPT}\n</body>`);
      } else {
        content += LIVE_RELOAD_SCRIPT;
      }
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  }

  /**
   * Start watching source files for changes
   */
  async startWatcher() {
    try {
      const chokidar = require("chokidar");
      const watchPaths = [
        this.config._pages,
        this.config._components,
        this.config._layouts,
      ].filter(fs.existsSync);

      if (fs.existsSync(this.config._assets)) {
        watchPaths.push(this.config._assets);
      }

      this.watcher = chokidar.watch(watchPaths, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 100 },
      });

      let debounceTimer = null;

      this.watcher.on("all", (event, filePath) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          const relPath = path.relative(this.config._root, filePath);
          console.log(`  ↻ Changed: ${relPath}`);
          console.log("  Rebuilding...\n");

          try {
            await this.builder.build();
            this.notifyClients();
            console.log("");
          } catch (e) {
            console.error(`  ✗ Build error: ${e.message}\n`);
          }
        }, 150);
      });
    } catch (e) {
      console.warn("  ⚠ chokidar not available, watch mode disabled");
    }
  }

  /**
   * Notify all SSE clients to reload
   */
  notifyClients() {
    for (const client of this.clients) {
      client.write("data: reload\n\n");
    }
  }

  /**
   * Stop the dev server
   */
  stop() {
    if (this.watcher) this.watcher.close();
    if (this.server) this.server.close();
  }
}

module.exports = OrbDevServer;
