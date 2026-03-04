/**
 * OrbLayout v1.0 — Parser
 * Parses .orb and .layout files into an intermediate representation
 */

/**
 * Extract layout reference and content from a page file
 * Returns { layoutSrc, content, rawPage } or null if no layout
 */
function parsePage(source) {
  const layoutRegex = /<layout\s+src="(.+?)">([\s\S]*?)<\/layout>/;
  const layoutMatch = source.match(layoutRegex);

  if (!layoutMatch) {
    // No layout — the page IS the output
    return { layoutSrc: null, content: source.trim(), rawPage: source };
  }

  const layoutSrc = layoutMatch[1];
  const inner = layoutMatch[2];

  // Extract named slots: <content>, <slot:name>
  const slots = {};

  // Default content slot
  const contentMatch = inner.match(/<content>([\s\S]*?)<\/content>/);
  if (contentMatch) {
    slots.content = contentMatch[1].trim();
  }

  // Named slots: <slot:sidebar>, <slot:meta>, etc.
  const namedSlotRegex = /<slot:(\w+)>([\s\S]*?)<\/slot:\1>/g;
  let slotMatch;
  while ((slotMatch = namedSlotRegex.exec(inner)) !== null) {
    slots[slotMatch[1]] = slotMatch[2].trim();
  }

  return { layoutSrc, slots, content: slots.content || "", rawPage: source };
}

/**
 * Parse component usage tags: <use component="name" prop1="val" />
 * Returns array of { full, name, props }
 */
function parseComponents(source) {
  const results = [];
  const regex = /<use\s+component="(.+?)"([\s\S]*?)\/>/g;
  let match;

  while ((match = regex.exec(source)) !== null) {
    const name = match[1];
    const propsString = match[2];
    const props = parseProps(propsString);
    results.push({ full: match[0], name, props });
  }

  return results;
}

/**
 * Parse HTML-style attributes into a props object
 * Supports: key="value", key='value', key (boolean)
 */
function parseProps(propsString) {
  const props = {};
  if (!propsString) return props;

  // Match key="value" or key='value'
  const attrRegex = /(\w[\w-]*)=(?:"([^"]*?)"|'([^']*?)')/g;
  let m;
  while ((m = attrRegex.exec(propsString)) !== null) {
    props[m[1]] = m[2] !== undefined ? m[2] : m[3];
  }

  // Match boolean attributes (standalone words)
  const boolRegex = /\b(\w[\w-]*)\b(?!=)/g;
  while ((m = boolRegex.exec(propsString)) !== null) {
    if (!(m[1] in props)) {
      props[m[1]] = true;
    }
  }

  return props;
}

/**
 * Parse {{#each items}} ... {{/each}} blocks
 * Returns array of { full, variable, body }
 */
function parseEachBlocks(source) {
  const results = [];
  const regex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    results.push({
      full: match[0],
      variable: match[1],
      body: match[2],
    });
  }
  return results;
}

/**
 * Parse {{#if variable}} ... {{else}} ... {{/if}} blocks
 * Returns array of { full, variable, trueBranch, falseBranch }
 */
function parseIfBlocks(source) {
  const results = [];
  const regex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const body = match[2];
    const elseSplit = body.split(/\{\{else\}\}/);
    results.push({
      full: match[0],
      variable: match[1],
      trueBranch: elseSplit[0],
      falseBranch: elseSplit[1] || "",
    });
  }
  return results;
}

/**
 * Parse {{#unless variable}} ... {{/unless}} blocks
 * Returns array of { full, variable, body }
 */
function parseUnlessBlocks(source) {
  const results = [];
  const regex = /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    results.push({
      full: match[0],
      variable: match[1],
      body: match[2],
    });
  }
  return results;
}

/**
 * Parse <import component="name" as="Alias" /> declarations
 */
function parseImports(source) {
  const imports = [];
  const regex = /<import\s+component="(.+?)"(?:\s+as="(.+?)")?\s*\/>/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    imports.push({
      full: match[0],
      name: match[1],
      alias: match[2] || match[1],
    });
  }
  return imports;
}

/**
 * Parse <style> blocks from .orb files
 */
function parseStyles(source) {
  const styles = [];
  const regex = /<style(?:\s+scoped)?>([\s\S]*?)<\/style>/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const isScoped = match[0].includes("scoped");
    styles.push({
      full: match[0],
      css: match[1].trim(),
      scoped: isScoped,
    });
  }
  return styles;
}

/**
 * Parse <script> blocks from .orb files (data definitions)
 * Supports: <script data> { key: "value" } </script>
 */
function parseDataBlock(source) {
  const regex = /<script\s+data>([\s\S]*?)<\/script>/;
  const match = source.match(regex);
  if (!match) return { data: {}, full: null };

  try {
    // Use Function constructor to safely evaluate object literal
    const fn = new Function(`return (${match[1].trim()});`);
    return { data: fn(), full: match[0] };
  } catch (e) {
    console.warn(`[OrbLayout] Warning: Failed to parse data block: ${e.message}`);
    return { data: {}, full: match[0] };
  }
}

module.exports = {
  parsePage,
  parseComponents,
  parseProps,
  parseEachBlocks,
  parseIfBlocks,
  parseUnlessBlocks,
  parseImports,
  parseStyles,
  parseDataBlock,
};
