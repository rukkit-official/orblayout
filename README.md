<p align="center">
  <img src="https://img.shields.io/badge/◉-OrbLayout-6c5ce7?style=for-the-badge&labelColor=1a1a2e" alt="OrbLayout" />
</p>

<h1 align="center">◉ OrbLayout v1.2</h1>

<p align="center">
  <strong>A lightweight static site builder with layouts, components, and props.<br>Pure HTML. Zero runtime. Blazing fast.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/orblayout"><img src="https://img.shields.io/badge/npm-orblayout-cc3534" alt="npm" /></a>
  <img src="https://img.shields.io/badge/version-1.2.0-6c5ce7" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D16-brightgreen" alt="Node" />
  <img src="https://img.shields.io/badge/runtime-none-ff6b6b" alt="No Runtime" />
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-cli-reference">CLI</a> •
  <a href="#-syntax-reference">Syntax</a> •
  <a href="#-npm--programmatic-api">API</a> •
  <a href="#-all-features">Features</a>
</p>

---

## What is OrbLayout?

OrbLayout brings the **component-based philosophy** of React, Vue, and Svelte to **pure static HTML** — without any JavaScript runtime, virtual DOM, or build complexity.

```
.orb file  →  OrbLayout Compiler  →  Pure .html file
```

Write `.orb` files using familiar HTML syntax enhanced with **layouts**, **reusable components**, **props**, **loops**, **conditionals**, **filters**, and **markdown**. The compiler outputs clean, static HTML.

---

## 🚀 Quick Start

### Option 1: Install via npm

```bash
npm install orblayout
```

### Option 2: Install globally

```bash
npm install -g orblayout
```

### Option 3: Clone from GitHub

```bash
git clone https://github.com/rukkit-official/orblayout.git
cd orblayout
npm install
```

### Create your first project

```bash
# Scaffold a new project
npx orb init

# Build static HTML
npx orb build

# Start dev server with live reload
npx orb dev
```

That's it! Open `http://localhost:3000` in your browser.

---

## 📦 CLI Reference

### Installation Methods

```bash
# Project dependency
npm install orblayout

# Global install
npm install -g orblayout

# Use without installing
npx orblayout <command>
```

### All Commands

| Command | Description |
|---------|-------------|
| `orb init` | Scaffold a new project with pages, components, layouts, config |
| `orb build` | Compile all `.orb` pages → `dist/` folder |
| `orb build --minify` | Build with HTML/CSS/JS minification |
| `orb dev` | Start dev server with live reload at `localhost:3000` |
| `orb dev --port 8080` | Dev server on custom port |
| `orb clean` | Remove the `dist/` output folder |
| `orb help` | Show all commands and options |
| `orb version` | Show version number |

### Usage Examples

```bash
# Scaffold a brand new project
mkdir my-site && cd my-site
npx orb init

# Build for production
npx orb build --minify

# Development with live reload
npx orb dev

# Custom dev server port
npx orb dev --port 4000

# Clean build output
npx orb clean

# Rebuild from scratch
npx orb clean && npx orb build
```

### package.json Scripts

Add these to your project's `package.json`:

```json
{
  "scripts": {
    "build": "orb build",
    "build:prod": "orb build --minify",
    "dev": "orb dev",
    "clean": "orb clean"
  }
}
```

Then use:
```bash
npm run build
npm run dev
npm run build:prod
```

---

## 📁 Project Structure

```
my-site/
│
├── pages/              # Page files (.orb)
│   ├── index.orb       # → dist/index.html
│   ├── about.orb       # → dist/about.html
│   └── blog/
│       └── post.orb    # → dist/blog/post.html
│
├── components/         # Reusable components (.orb)
│   ├── header.orb
│   ├── footer.orb
│   └── card.orb
│
├── layouts/            # Page layout templates (.layout)
│   └── main.layout
│
├── assets/             # Static files (copied to dist/assets/)
│   ├── style.css
│   └── logo.png
│
├── dist/               # Build output (auto-generated)
│
└── orb.config.json     # Configuration
```

---

## ⚙️ Configuration

**`orb.config.json`**

```json
{
  "pagesDir": "pages",
  "componentsDir": "components",
  "layoutsDir": "layouts",
  "outputDir": "dist",
  "assetsDir": "assets",
  "minify": false,
  "pretty": true
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `pagesDir` | `"pages"` | Directory containing `.orb` page files |
| `componentsDir` | `"components"` | Directory containing `.orb` component files |
| `layoutsDir` | `"layouts"` | Directory containing `.layout` files |
| `outputDir` | `"dist"` | Build output directory |
| `assetsDir` | `"assets"` | Static assets directory (copied as-is) |
| `minify` | `false` | Minify HTML output |
| `pretty` | `true` | Pretty-print output |

---

## 📖 Syntax Reference

### 1. Layouts — `<layout>` + `{{ content }}`

Define your page structure once, reuse it across all pages.

**`layouts/main.layout`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
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
```

**`pages/index.orb`**
```html
<layout src="main.layout">
  <content>
    <h1>Hello World!</h1>
    <p>This replaces {{ content }} in the layout.</p>
  </content>
</layout>
```

**Rules:**
- Each page can have **one** `<layout>` tag
- `src` is relative to the `layouts/` directory
- `{{ content }}` in the layout is replaced with the page's `<content>` block

### 2. Components — `<use component="..." />`

Reusable HTML blocks with props.

**`components/card.orb`**
```html
<div class="card">
  <h3>{{ title }}</h3>
  <p>{{ description }}</p>
</div>
```

**Using it in a page or layout:**
```html
<use component="card" title="Hello" description="This is a card" />
```

**Rules:**
- `component="name"` → looks for `components/name.orb`
- Props are passed as HTML attributes
- Must be **self-closing** (`/>`)
- Supports **multi-line** attributes
- Components can **nest** other components (recursive resolution)

### 3. Variables — `{{ variableName }}`

Interpolate data into your HTML.

```html
<h1>{{ title }}</h1>
<p>Written by {{ author }}</p>
<span>Year: {{ @page.year }}</span>
```

**Sources of variables:**
| Source | Example |
|--------|---------|
| Props on components | `<use component="card" title="Hi" />` |
| Data blocks | `<script data>({ title: "Hi" })</script>` |
| Layout variables | Variables from page data flow into layout |
| Built-in `@page.*` | `{{ @page.filename }}`, `{{ @page.year }}` |

**Built-in page variables:**

| Variable | Description |
|----------|-------------|
| `{{ @page.filename }}` | Current page filename without extension |
| `{{ @page.date }}` | Today's date (YYYY-MM-DD) |
| `{{ @page.year }}` | Current year |

### 4. Data Blocks — `<script data>`

Define page-level data as a JavaScript object.

```html
<script data>
({
  title: "My Page",
  author: "Dan",
  showBio: true,
  tags: ["html", "css", "js"],
  author_info: {
    name: "Dan",
    bio: "Full-stack developer"
  }
})
</script>

<layout src="main.layout">
  <content>
    <h1>{{ title }}</h1>
    <p>By {{ author }}</p>
  </content>
</layout>
```

**Rules:**
- Must use `<script data>` (not regular `<script>`)
- Content is a JavaScript object literal wrapped in `()`
- Supports strings, numbers, booleans, arrays, and nested objects

### 5. Loops — `{{#each}}`

Iterate over arrays.

**Primitive array:**
```html
<script data>
({
  fruits: ["Apple", "Banana", "Cherry"]
})
</script>

<ul>
  {{#each fruits}}
    <li>{{ this }}</li>
  {{/each}}
</ul>
```

**Object array:**
```html
<script data>
({
  team: [
    { name: "Alice", role: "Designer" },
    { name: "Bob", role: "Developer" }
  ]
})
</script>

{{#each team}}
  <div class="member">
    <h3>{{ name }}</h3>
    <p>{{ role }}</p>
  </div>
{{/each}}
```

**Loop helper variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ this }}` | Current item (primitives) | `"Apple"` |
| `{{ @index }}` | 0-based index | `0`, `1`, `2` |
| `{{ @number }}` | 1-based index | `1`, `2`, `3` |
| `{{ @first }}` | `"true"` if first item | `"true"` or `""` |
| `{{ @last }}` | `"true"` if last item | `"true"` or `""` |
| `{{ @count }}` | Total number of items | `"3"` |

### 6. Conditionals — `{{#if}}` / `{{#unless}}`

Show or hide content based on data.

**Basic if:**
```html
{{#if showBio}}
  <div class="bio">Hello!</div>
{{/if}}
```

**If/else:**
```html
{{#if loggedIn}}
  <button>Logout</button>
{{else}}
  <button>Login</button>
{{/if}}
```

**Unless (inverse if):**
```html
{{#unless hideFooter}}
  <use component="footer" />
{{/unless}}
```

**Truthy values:** anything except `undefined`, `null`, `false`, `""`, `0`

### 7. Pipe Filters — `{{ var | filter }}`

Transform data inline with pipe syntax.

```html
{{ title | uppercase }}           →  "HELLO WORLD"
{{ name | lowercase }}            →  "hello"
{{ name | capitalize }}           →  "Hello"
{{ title | slugify }}             →  "hello-world"
{{ text | truncate }}             →  "Hello wo..."
{{ html | escape }}               →  "&lt;div&gt;"
{{ data | json }}                 →  '{"key":"val"}'
{{ text | reverse }}              →  "dlrow olleH"
{{ text | trim }}                 →  "hello"
{{ price | number }}              →  "1,234,567"
{{ url | encode }}                →  "hello%20world"
{{ items | length }}              →  "5"
```

**Chain filters:**
```html
{{ title | uppercase | trim }}
{{ name | capitalize | slugify }}
```

**All built-in filters:**

| Filter | Input → Output | Description |
|--------|---------------|-------------|
| `uppercase` | `"hello"` → `"HELLO"` | Convert to uppercase |
| `lowercase` | `"HELLO"` → `"hello"` | Convert to lowercase |
| `capitalize` | `"hello"` → `"Hello"` | Capitalize first letter |
| `trim` | `" hello "` → `"hello"` | Trim whitespace |
| `slugify` | `"Hello World"` → `"hello-world"` | URL-safe slug |
| `reverse` | `"hello"` → `"olleh"` | Reverse string |
| `length` | `[1,2,3]` → `3` | Array/string length |
| `json` | `{a:1}` → `'{"a":1}'` | JSON stringify |
| `escape` | `"<div>"` → `"&lt;div&gt;"` | HTML escape |
| `truncate` | Long text → `"text..."` | Truncate to 100 chars |
| `number` | `1234567` → `"1,234,567"` | Locale number format |
| `encode` | `"a b"` → `"a%20b"` | URI encode |

### 8. Named Slots

Multiple content areas in a single layout.

**`layouts/docs.layout`**
```html
<html>
<body>
  <aside>{{ sidebar }}</aside>
  <main>{{ content }}</main>
</body>
</html>
```

**`pages/docs.orb`**
```html
<layout src="docs.layout">
  <content>
    <h1>Documentation</h1>
  </content>
  <slot:sidebar>
    <nav>
      <a href="#intro">Intro</a>
      <a href="#api">API</a>
    </nav>
  </slot:sidebar>
</layout>
```

### 9. Component Imports — `<import>`

Import components with custom tag aliases.

```html
<import component="card" as="Card" />
<import component="badge" as="Badge" />

<Card title="Hello" description="World" />
<Badge text="New" color="#6c5ce7" />
```

### 10. With Blocks — `{{#with}}`

Scope variables to a sub-object.

```html
<script data>
({
  author: {
    name: "Dan",
    bio: "Full-stack developer",
    twitter: "@dan"
  }
})
</script>

{{#with author}}
  <h3>{{ name }}</h3>
  <p>{{ bio }}</p>
  <a href="https://twitter.com/{{ twitter }}">Follow</a>
{{/with}}
```

### 11. Markdown Blocks — `<markdown>`

Write markdown inline in `.orb` files.

```html
<markdown>
# Hello World

This is **bold** and *italic*.

- Item one
- Item two
- Item three

[Visit OrbLayout](https://github.com/rukkit-official/orblayout)
</markdown>
```

Converts to proper HTML: `<h1>`, `<strong>`, `<em>`, `<ul>/<li>`, `<a>`, etc.

### 12. Component Styles — `<style>`

Components can include CSS that gets collected into the page `<head>`.

**`components/button.orb`**
```html
<style>
.orb-btn {
  background: #6c5ce7;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}
</style>

<button class="orb-btn">{{ label }}</button>
```

### 13. Partials — `<use partial="..." />`

Include files without props (simple file includes).

```html
<use partial="analytics" />
```

Looks for `components/analytics.orb`, then `layouts/analytics.orb`, then root-level.

---

## 📦 npm / Programmatic API

Use OrbLayout as a library in your own Node.js scripts.

### Install

```bash
npm install orblayout
```

### Basic Usage

```javascript
const { loadConfig, OrbCompiler, OrbBuilder } = require("orblayout");

// Load config from project root
const config = loadConfig(process.cwd());
```

### Build All Pages

```javascript
const { loadConfig, OrbBuilder } = require("orblayout");

const config = loadConfig(process.cwd());
const builder = new OrbBuilder(config);

builder.build().then(result => {
  console.log(`Built ${result.pages} pages in ${result.time}ms`);
  if (result.errors.length > 0) {
    console.error("Errors:", result.errors);
  }
});
```

### Compile a Single Page

```javascript
const { loadConfig, OrbCompiler } = require("orblayout");

const config = loadConfig(process.cwd());
const compiler = new OrbCompiler(config);

const html = compiler.compilePage("pages/index.orb");
console.log(html);

// Clear cache between files
compiler.clearCache();
```

### Register Custom Filters

```javascript
const { loadConfig, OrbCompiler } = require("orblayout");

const config = loadConfig(process.cwd());
const compiler = new OrbCompiler(config);

// Register custom filters
compiler.registerFilter("shout", value => value + "!!!");
compiler.registerFilter("emoji", value => "🔥 " + value);
compiler.registerFilter("wrap", value => `<mark>${value}</mark>`);

const html = compiler.compilePage("pages/index.orb");
// Now {{ title | shout }} works in your .orb files
```

### Start Dev Server Programmatically

```javascript
const { loadConfig, OrbDevServer } = require("orblayout");

const config = loadConfig(process.cwd());
const server = new OrbDevServer(config);

server.start(3000).then(() => {
  console.log("Dev server running!");
});

// Stop server
process.on("SIGINT", () => {
  server.stop();
  process.exit(0);
});
```

### API Reference

#### `loadConfig(rootDir)`
Loads `orb.config.json` from the given directory. Returns config object.

#### `new OrbCompiler(config)`
| Method | Description |
|--------|-------------|
| `.compilePage(filePath)` | Compile a single `.orb` file → HTML string |
| `.registerFilter(name, fn)` | Register a custom pipe filter |
| `.clearCache()` | Clear component and layout caches |

#### `new OrbBuilder(config)`
| Method | Description |
|--------|-------------|
| `.build()` | Build all pages → `dist/`. Returns `{ pages, errors, time }` |

#### `new OrbDevServer(config)`
| Method | Description |
|--------|-------------|
| `.start(port)` | Start dev server with live reload |
| `.stop()` | Stop the server and file watcher |

---

## 🎯 All Features

### v1.2 (Current)

| Feature | Syntax | Description |
|---------|--------|-------------|
| Layouts | `<layout src="...">` | Page structure templates |
| Content Slot | `<content>...</content>` | Main content injection |
| Named Slots | `<slot:name>...</slot:name>` | Multiple content areas |
| Components | `<use component="..." />` | Reusable HTML blocks |
| Props | `title="value"` | Pass data to components |
| Variables | `{{ variable }}` | Data interpolation |
| Data Blocks | `<script data>` | Page-level data definitions |
| Loops | `{{#each items}}` | Array iteration |
| Conditionals | `{{#if}}/{{else}}/{{/if}}` | Conditional rendering |
| Unless | `{{#unless var}}` | Inverse conditional |
| With Scope | `{{#with obj}}` | Variable scoping |
| Pipe Filters | `{{ var \| filter }}` | Data transformation |
| Imports | `<import component="..." as="..." />` | Component aliases |
| Partials | `<use partial="..." />` | Simple file includes |
| Markdown | `<markdown>...</markdown>` | Inline markdown |
| Styles | `<style>...</style>` | Component CSS |
| Page Variables | `{{ @page.filename }}` | Built-in metadata |
| Loop Helpers | `@index, @number, @first, @last, @count` | Loop context |
| Dev Server | `orb dev` | Live reload server |
| Minification | `--minify` | HTML/CSS/JS minification |
| Asset Copying | `assets/` | Static file management |
| Clean | `orb clean` | Remove build output |
| Scaffolding | `orb init` | Project scaffolding |
| 12 Built-in Filters | `uppercase, slugify, ...` | Data transforms |
| Custom Filters | `compiler.registerFilter()` | Extend with your own |
| Nested Components | Components within components | Recursive resolution |

---

## 🏗 Build Pipeline

```
┌─────────────────────────────────────────────────┐
│  1. Read .orb page file                         │
│  2. Parse <script data> → page data             │
│  3. Parse <style> → collected styles            │
│  4. Parse <import> → component aliases          │
│  5. Parse <layout src="..."> → load layout      │
│  6. Inject <content> into {{ content }}          │
│  7. Inject named <slot:*> into {{ slotName }}   │
│  8. Process <markdown> blocks                   │
│  9. Resolve {{ variables }}                     │
│ 10. Process {{ var | filter }} pipes            │
│ 11. Process {{#each}} loops                     │
│ 12. Process {{#if}}, {{#unless}} conditionals   │
│ 13. Process {{#with}} scoping                   │
│ 14. Resolve <use component="..." /> (recursive) │
│ 15. Resolve <use partial="..." />               │
│ 16. Process :class directives                   │
│ 17. Deduplicate & inject styles into <head>     │
│ 18. Optional: minify HTML                       │
│ 19. Write to dist/*.html                        │
└─────────────────────────────────────────────────┘
```

---

## 🌐 Deploying

Output is pure HTML. Deploy anywhere:

```bash
# Build for production
npx orb build --minify
```

| Platform | Setup |
|----------|-------|
| **GitHub Pages** | Push `dist/` to `gh-pages` branch |
| **Netlify** | Build: `npx orb build --minify`, Publish: `dist` |
| **Vercel** | Build: `npx orb build --minify`, Output: `dist` |
| **Cloudflare Pages** | Build: `npx orb build --minify`, Output: `dist` |
| **Any web server** | Just serve the `dist/` folder |
| **S3 + CloudFront** | Upload `dist/` contents to S3 bucket |

---

## 🔮 Roadmap

### v2.0 (Planned)
- [ ] Nested layouts (layout extending layout)
- [ ] Dynamic data from JSON/YAML files
- [ ] CSS/JS bundling
- [ ] Image optimization
- [ ] Sitemap generation
- [ ] RSS feed generation
- [ ] i18n / multi-language support
- [ ] Plugin system
- [ ] TypeScript support

---

## 💡 Philosophy

1. **HTML is powerful enough.** You don't always need React.
2. **Components are a great idea.** But they don't require a runtime.
3. **Static sites should be simple.** Write HTML, get HTML.
4. **Developer experience matters.** Hot reload, clear errors, fast builds.

---

## 📄 License

MIT © 2026 OrbLayout

---

<p align="center">
  <a href="https://github.com/rukkit-official/orblayout">
    <strong>◉ Star OrbLayout on GitHub</strong>
  </a>
  <br>
  <sub>Pure HTML. Zero Runtime. Maximum Speed.</sub>
</p>
