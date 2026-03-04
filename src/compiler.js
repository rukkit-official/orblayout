/**
 * OrbLayout v1.0 — Compiler
 * The heart of OrbLayout: compiles .orb pages into static HTML
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
} = require("./parser");

class OrbCompiler {
  constructor(config) {
    this.config = config;
    this.componentCache = {};
    this.layoutCache = {};
    this.collectedStyles = [];
  }

  /**
   * Compile a single .orb page file → HTML string
   */
  compilePage(filePath) {
    const source = fs.readFileSync(filePath, "utf-8");
    this.collectedStyles = [];

    // Parse page-level data block
    const { data: pageData, full: dataBlock } = parseDataBlock(source);
    let cleanSource = dataBlock ? source.replace(dataBlock, "") : source;

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

      // Replace named slots: {{ slotName }}
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

    // Process data variables
    html = this.resolveVariables(html, pageData);

    // Process control flow
    html = this.processControlFlow(html, pageData);

    // Process components (recursive)
    html = this.processComponents(html, pageData);

    // Process imports as inline components
    html = this.processImportedComponents(html, imports, pageData);

    // Clean up any remaining unresolved variables
    html = html.replace(/\{\{\s*\w+\s*\}\}/g, "");

    // Inject collected styles
    if (this.collectedStyles.length > 0) {
      const styleBlock = `<style>\n${this.collectedStyles.join("\n\n")}\n</style>`;
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
   * Process all <use component="..." /> tags
   */
  processComponents(html, data = {}) {
    // Limit iterations to prevent infinite loops
    let iterations = 0;
    const MAX_ITERATIONS = 50;

    while (/<use\s+component="/.test(html) && iterations < MAX_ITERATIONS) {
      iterations++;
      const components = parseComponents(html);

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

        // Process control flow in component
        resolved = this.processControlFlow(resolved, mergedData);

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
   * <import component="card" as="Card" />
   * <Card title="Hello" />
   */
  processImportedComponents(html, imports, data = {}) {
    for (const imp of imports) {
      const tagRegex = new RegExp(`<${imp.alias}([^>]*?)\\/>`, "g");
      let match;

      while ((match = tagRegex.exec(html)) !== null) {
        const propsString = match[1];
        const props = {};

        // Parse inline props
        const attrRegex = /(\w[\w-]*)="([^"]*?)"/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(propsString)) !== null) {
          props[attrMatch[1]] = attrMatch[2];
        }

        let compSource = this.loadComponent(imp.name);

        // Extract styles
        const compStyles = parseStyles(compSource);
        for (const style of compStyles) {
          this.collectedStyles.push(style.css);
          compSource = compSource.replace(style.full, "");
        }

        const mergedData = { ...data, ...props };
        let resolved = this.resolveVariables(compSource, mergedData);
        resolved = this.processControlFlow(resolved, mergedData);

        html = html.replace(match[0], resolved);
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
              // Object items: {{ key }}
              for (const [key, value] of Object.entries(item)) {
                body = body.replace(
                  new RegExp(`\\{\\{\\s*${this.escapeRegex(key)}\\s*\\}\\}`, "g"),
                  String(value)
                );
              }
            }
            // {{ this }} for primitive values
            body = body.replace(/\{\{\s*this\s*\}\}/g, String(item));
            // {{ @index }}
            body = body.replace(/\{\{\s*@index\s*\}\}/g, String(index));
            // {{ @first }} / {{ @last }}
            body = body.replace(/\{\{\s*@first\s*\}\}/g, index === 0 ? "true" : "");
            body = body.replace(/\{\{\s*@last\s*\}\}/g, index === items.length - 1 ? "true" : "");
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
