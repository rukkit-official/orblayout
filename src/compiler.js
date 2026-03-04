/**
 * OrbLayout v1.2 — Compiler
 * The heart of OrbLayout: compiles .orb pages into static HTML
 *
 * Features:
 *  - Layout system with {{ content }} and named slots
 *  - Reusable components with props
 *  - {{#each}} loops with @index, @first, @last, @count, @number
 *  - {{#if}} / {{else}} / {{#unless}} conditionals
 *  - {{#with}} scoping blocks
 *  - {{ var | filter }} pipe filters (uppercase, lowercase, capitalize, trim, etc.)
 *  - <use partial="..." /> simple includes
 *  - <import component="..." as="..." /> aliases
 *  - <style> / <style scoped> blocks
 *  - <script data> page data blocks
 *  - <markdown> blocks (lightweight)
 *  - :class conditional CSS classes
 *  - {{ @page.* }} built-in page variables
 *  - Nested component resolution
 */

const fs = require("fs-extra");
const path = require("path");
const {
  parsePage,
  parseComponents,
  parseEachBlocks,
  parseIfBlocks,
  parseUnlessBlocks,
  parseImports,
  parseStyles,
  parseDataBlock,
  parsePartials,
  parseWithBlocks,
  parseFilters,
  parseClassDirectives,
  parseMarkdownBlocks,
} = require("./parser");

// ─── Built-in Filters ─────────────────────────────────

const BUILT_IN_FILTERS = {
  uppercase: (v) => String(v).toUpperCase(),
  lowercase: (v) => String(v).toLowerCase(),
  capitalize: (v) => String(v).charAt(0).toUpperCase() + String(v).slice(1),
  trim: (v) => String(v).trim(),
  slugify: (v) =>
    String(v)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
  reverse: (v) => String(v).split("").reverse().join(""),
  length: (v) => (Array.isArray(v) ? v.length : String(v).length),
  json: (v) => JSON.stringify(v),
  escape: (v) =>
    String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;"),
  truncate: (v) => (String(v).length > 100 ? String(v).slice(0, 100) + "..." : String(v)),
  number: (v) => Number(v).toLocaleString(),
  encode: (v) => encodeURIComponent(String(v)),
};

// ─── Simple Markdown Renderer ────────────────────────

function renderMarkdown(md) {
  let html = md;
  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Inline code
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  // Images
  html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" />');
  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr>");
  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>\n${m}</ul>\n`);
  // Paragraphs (lines not already wrapped in HTML tags)
  html = html
    .split("\n\n")
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (/^<[a-z]/.test(block)) return block;
      return `<p>${block}</p>`;
    })
    .join("\n");
  return html;
}

// ─── Compiler ────────────────────────────────────────

class OrbCompiler {
  constructor(config) {
    this.config = config;
    this.componentCache = {};
    this.layoutCache = {};
    this.collectedStyles = [];
    this.customFilters = {};
  }

  /**
   * Register a custom filter: compiler.registerFilter("shout", v => v + "!!!")
   */
  registerFilter(name, fn) {
    this.customFilters[name] = fn;
  }

  /**
   * Get a filter by name (custom takes priority over built-in)
   */
  getFilter(name) {
    return this.customFilters[name] || BUILT_IN_FILTERS[name] || null;
  }

  /**
   * Compile a single .orb page file → HTML string
   */
  compilePage(filePath) {
    const source = fs.readFileSync(filePath, "utf-8");
    this.collectedStyles = [];

    // Build page metadata (available as {{ @page.filename }} etc.)
    const pageMeta = {
      "@page.filename": path.basename(filePath, ".orb"),
      "@page.path": filePath,
      "@page.ext": ".orb",
      "@page.date": new Date().toISOString().split("T")[0],
      "@page.year": String(new Date().getFullYear()),
    };

    // Parse page-level data block
    const { data: pageData, full: dataBlock } = parseDataBlock(source);
    let cleanSource = dataBlock ? source.replace(dataBlock, "") : source;

    // Merge page meta into data
    const fullData = { ...pageMeta, ...pageData };

    // Parse page-level styles
    const pageStyles = parseStyles(cleanSource);
    for (const style of pageStyles) {
      this.collectedStyles.push(style.css);
      cleanSource = cleanSource.replace(style.full, "");
    }

    // Parse imports
    const imports = parseImports(cleanSource);
    for (const imp of imports) {
      cleanSource = cleanSource.replace(imp.full, "");
    }

    // Parse page structure
    const parsed = parsePage(cleanSource);

    let html;

    if (parsed.layoutSrc) {
      // Load and process layout
      const layoutPath = path.join(this.config._layouts, parsed.layoutSrc);
      if (!fs.existsSync(layoutPath)) {
        throw new Error(`[OrbLayout] Layout not found: ${parsed.layoutSrc} (expected at ${layoutPath})`);
      }

      let layout = this.loadLayout(layoutPath);

      // Replace {{ content }} with page content
      layout = layout.replace(/\{\{\s*content\s*\}\}/g, parsed.content || "");

      // Replace named slots
      if (parsed.slots) {
        for (const [slotName, slotContent] of Object.entries(parsed.slots)) {
          layout = layout.replace(
            new RegExp(`\\{\\{\\s*${this.escapeRegex(slotName)}\\s*\\}\\}`, "g"),
            slotContent
          );
        }
      }

      html = layout;
    } else {
      html = parsed.content;
    }

    // Process markdown blocks
    html = this.processMarkdown(html);

    // Process data variables
    html = this.resolveVariables(html, fullData);

    // Process filters ({{ var | filter }})
    html = this.processFilters(html, fullData);

    // Process control flow (each, if, unless)
    html = this.processControlFlow(html, fullData);

    // Process {{#with}} blocks
    html = this.processWithBlocks(html, fullData);

    // Process components (recursive)
    html = this.processComponents(html, fullData);

    // Process partials
    html = this.processPartials(html);

    // Process imports as inline components
    html = this.processImportedComponents(html, imports, fullData);

    // Process :class directives
    html = this.processClassDirectives(html, fullData);

    // Clean up remaining unresolved simple variables (not syntax like {{#each}})
    html = html.replace(/\{\{\s*(?!#|\/|else)[a-zA-Z_@][\w.@]*(?:\s*\|\s*\w+)*\s*\}\}/g, "");

    // Inject collected styles
    if (this.collectedStyles.length > 0) {
      const uniqueStyles = [...new Set(this.collectedStyles)];
      const styleBlock = `<style>\n${uniqueStyles.join("\n\n")}\n</style>`;
      if (html.includes("</head>")) {
        html = html.replace("</head>", `  ${styleBlock}\n</head>`);
      } else if (html.includes("<body")) {
        html = html.replace(/<body([^>]*)>/, `<head>\n  ${styleBlock}\n</head>\n<body$1>`);
      } else {
        html = styleBlock + "\n" + html;
      }
    }

    return html;
  }

  /**
   * Load a layout file (cached)
   */
  loadLayout(layoutPath) {
    if (this.layoutCache[layoutPath]) {
      return this.layoutCache[layoutPath];
    }
    const content = fs.readFileSync(layoutPath, "utf-8");
    this.layoutCache[layoutPath] = content;
    return content;
  }

  /**
   * Load a component file (cached)
   */
  loadComponent(name) {
    if (this.componentCache[name]) {
      return this.componentCache[name];
    }
    const compPath = path.join(this.config._components, `${name}.orb`);
    if (!fs.existsSync(compPath)) {
      throw new Error(`[OrbLayout] Component not found: ${name}.orb (expected at ${compPath})`);
    }
    const content = fs.readFileSync(compPath, "utf-8");
    this.componentCache[name] = content;
    return content;
  }

  /**
   * Process all <use component="..." /> tags (recursive)
   */
  processComponents(html, data = {}) {
    let iterations = 0;
    const MAX_ITERATIONS = 100;

    while (/<use\s+component="/.test(html) && iterations < MAX_ITERATIONS) {
      iterations++;
      const components = parseComponents(html);
      if (components.length === 0) break;

      for (const comp of components) {
        let compSource = this.loadComponent(comp.name);

        // Extract and collect component styles
        const compStyles = parseStyles(compSource);
        for (const style of compStyles) {
          this.collectedStyles.push(style.css);
          compSource = compSource.replace(style.full, "");
        }

        // Parse component data block
        const { data: compData, full: compDataBlock } = parseDataBlock(compSource);
        if (compDataBlock) {
          compSource = compSource.replace(compDataBlock, "");
        }

        // Merge data: component defaults < page data < inline props
        const mergedData = { ...compData, ...data, ...comp.props };

        // Resolve variables in component
        let resolved = this.resolveVariables(compSource, mergedData);

        // Process filters in component
        resolved = this.processFilters(resolved, mergedData);

        // Process control flow in component
        resolved = this.processControlFlow(resolved, mergedData);

        // Process markdown in component
        resolved = this.processMarkdown(resolved);

        html = html.replace(comp.full, resolved);
      }
    }

    if (iterations >= MAX_ITERATIONS) {
      console.warn("[OrbLayout] Warning: Maximum component nesting depth reached (possible circular reference)");
    }

    return html;
  }

  /**
   * Process imported components used with custom tag syntax
   */
  processImportedComponents(html, imports, data = {}) {
    for (const imp of imports) {
      const tagRegex = new RegExp(`<${imp.alias}([\\s\\S]*?)\\/>`, "g");
      let match;

      while ((match = tagRegex.exec(html)) !== null) {
        const propsString = match[1];
        const props = {};

        const attrRegex = /(\w[\w-]*)="([^"]*?)"/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(propsString)) !== null) {
          props[attrMatch[1]] = attrMatch[2];
        }

        let compSource = this.loadComponent(imp.name);

        const compStyles = parseStyles(compSource);
        for (const style of compStyles) {
          this.collectedStyles.push(style.css);
          compSource = compSource.replace(style.full, "");
        }

        const mergedData = { ...data, ...props };
        let resolved = this.resolveVariables(compSource, mergedData);
        resolved = this.processFilters(resolved, mergedData);
        resolved = this.processControlFlow(resolved, mergedData);

        html = html.replace(match[0], resolved);
      }
    }
    return html;
  }

  /**
   * Process <use partial="..." /> simple includes
   */
  processPartials(html) {
    const partials = parsePartials(html);
    for (const partial of partials) {
      let partialPath = path.join(this.config._components, `${partial.name}.orb`);
      if (!fs.existsSync(partialPath)) {
        partialPath = path.join(this.config._layouts, `${partial.name}.orb`);
      }
      if (!fs.existsSync(partialPath)) {
        partialPath = path.join(this.config._root, partial.name);
      }
      if (fs.existsSync(partialPath)) {
        const content = fs.readFileSync(partialPath, "utf-8");
        html = html.replace(partial.full, content);
      } else {
        console.warn(`[OrbLayout] Warning: Partial not found: ${partial.name}`);
        html = html.replace(partial.full, `<!-- partial "${partial.name}" not found -->`);
      }
    }
    return html;
  }

  /**
   * Process {{#each}}, {{#if}}, {{#unless}} blocks
   */
  processControlFlow(html, data = {}) {
    // Process {{#each}} blocks
    const eachBlocks = parseEachBlocks(html);
    for (const block of eachBlocks) {
      const items = data[block.variable];
      if (Array.isArray(items)) {
        const rendered = items
          .map((item, index) => {
            let body = block.body;
            if (typeof item === "object" && item !== null) {
              for (const [key, value] of Object.entries(item)) {
                body = body.replace(
                  new RegExp(`\\{\\{\\s*${this.escapeRegex(key)}\\s*\\}\\}`, "g"),
                  String(value)
                );
              }
            }
            body = body.replace(/\{\{\s*this\s*\}\}/g, String(item));
            body = body.replace(/\{\{\s*@index\s*\}\}/g, String(index));
            body = body.replace(/\{\{\s*@number\s*\}\}/g, String(index + 1));
            body = body.replace(/\{\{\s*@first\s*\}\}/g, index === 0 ? "true" : "");
            body = body.replace(/\{\{\s*@last\s*\}\}/g, index === items.length - 1 ? "true" : "");
            body = body.replace(/\{\{\s*@count\s*\}\}/g, String(items.length));
            return body;
          })
          .join("");
        html = html.replace(block.full, rendered);
      } else {
        html = html.replace(block.full, "");
      }
    }

    // Process {{#if}} blocks
    const ifBlocks = parseIfBlocks(html);
    for (const block of ifBlocks) {
      const value = data[block.variable];
      const isTruthy = value !== undefined && value !== null && value !== false && value !== "" && value !== 0;
      html = html.replace(block.full, isTruthy ? block.trueBranch : block.falseBranch);
    }

    // Process {{#unless}} blocks
    const unlessBlocks = parseUnlessBlocks(html);
    for (const block of unlessBlocks) {
      const value = data[block.variable];
      const isFalsy = value === undefined || value === null || value === false || value === "" || value === 0;
      html = html.replace(block.full, isFalsy ? block.body : "");
    }

    return html;
  }

  /**
   * Process {{#with variable}} blocks — scopes to a sub-object
   */
  processWithBlocks(html, data = {}) {
    const withBlocks = parseWithBlocks(html);
    for (const block of withBlocks) {
      const subData = data[block.variable];
      if (typeof subData === "object" && subData !== null) {
        let body = this.resolveVariables(block.body, subData);
        body = this.processControlFlow(body, subData);
        html = html.replace(block.full, body);
      } else {
        html = html.replace(block.full, "");
      }
    }
    return html;
  }

  /**
   * Process {{ variable | filter }} pipe syntax
   */
  processFilters(html, data = {}) {
    const filterExprs = parseFilters(html);
    for (const expr of filterExprs) {
      let value = data[expr.variable];
      if (value === undefined) continue;

      for (const filterName of expr.filters) {
        const filterFn = this.getFilter(filterName);
        if (filterFn) {
          value = filterFn(value);
        } else {
          console.warn(`[OrbLayout] Warning: Unknown filter "${filterName}"`);
        }
      }

      html = html.replace(expr.full, String(value));
    }
    return html;
  }

  /**
   * Process :class="{ className: condition }" directives
   */
  processClassDirectives(html, data = {}) {
    const directives = parseClassDirectives(html);
    for (const dir of directives) {
      try {
        const classObj = new Function(...Object.keys(data), `return (${dir.expression});`)(
          ...Object.values(data)
        );
        const classes = Object.entries(classObj)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(" ");
        html = html.replace(dir.full, classes ? `class="${classes}"` : "");
      } catch (e) {
        html = html.replace(dir.full, "");
      }
    }
    return html;
  }

  /**
   * Process <markdown> blocks
   */
  processMarkdown(html) {
    const blocks = parseMarkdownBlocks(html);
    for (const block of blocks) {
      html = html.replace(block.full, renderMarkdown(block.content));
    }
    return html;
  }

  /**
   * Resolve {{ variable }} placeholders with data
   */
  resolveVariables(html, data = {}) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        html = html.replace(
          new RegExp(`\\{\\{\\s*${this.escapeRegex(key)}\\s*\\}\\}`, "g"),
          String(value)
        );
      }
    }
    return html;
  }

  /**
   * Escape special regex characters
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Clear all caches (useful for watch mode)
   */
  clearCache() {
    this.componentCache = {};
    this.layoutCache = {};
    this.collectedStyles = [];
  }
}

module.exports = OrbCompiler;
