<p align="center">
  <img src="https://img.shields.io/badge/◉-OrbLayout-6c5ce7?style=for-the-badge&labelColor=1a1a2e" alt="OrbLayout" />
</p>

<h1 align="center">◉ OrbLayout</h1>

<p align="center">
  <strong>A lightweight static site builder with layouts, components, and props.<br>Pure HTML. Zero runtime. Blazing fast.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-6c5ce7" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D16-brightgreen" alt="Node" />
  <img src="https://img.shields.io/badge/runtime-none-ff6b6b" alt="No Runtime" />
</p>

---

## What is OrbLayout?

OrbLayout brings the **component-based philosophy** of React, Vue, and Svelte to **pure static HTML** — without any JavaScript runtime, virtual DOM, or build complexity.

Write `.orb` files using familiar HTML syntax enhanced with layouts, reusable components, props, loops, and conditionals. OrbLayout compiles everything down to clean, static HTML files ready to deploy anywhere.

```
.orb file → OrbLayout Compiler → Pure .html file
```

### Why OrbLayout?

| Feature | OrbLayout | Plain HTML | React/Next.js |
|---------|-----------|------------|---------------|
| **Components** | ✅ | ❌ | ✅ |
| **Layouts** | ✅ | ❌ | ✅ |
| **Props** | ✅ | ❌ | ✅ |
| **Loops & Conditionals** | ✅ | ❌ | ✅ |
| **Zero Runtime JS** | ✅ | ✅ | ❌ |
| **No Build Toolchain** | ✅ | ✅ | ❌ |
| **Learning Curve** | Low | None | High |
| **Output Size** | Tiny | Tiny | Large |

---

## Quick Start

### Installation

```bash
# Clone or create a new project
mkdir my-site && cd my-site

# Install OrbLayout
npm install orblayout

# Scaffold project structure
npx orb init
```

### Or from this repo:

```bash
git clone https://github.com/your-username/orblayout.git
cd orblayout
npm install
node bin/cli.js build
```

### Commands

```bash
orb init              # Scaffold a new project
orb build             # Compile all .orb pages → dist/
orb build --minify    # Build with HTML minification
orb dev               # Start dev server with live reload
orb dev --port 8080   # Dev server on custom port
```

---

## Project Structure

```
my-site/
│
├── pages/              # Your .orb page files
│   ├── index.orb       # → dist/index.html
│   ├── about.orb       # → dist/about.html
│   └── blog/
│       └── post.orb    # → dist/blog/post.html
│
├── components/         # Reusable .orb components
│   ├── header.orb
│   ├── footer.orb
│   └── card.orb
│
├── layouts/            # Page layout templates
│   └── main.layout
│
├── assets/             # Static files (copied to dist/)
│   ├── style.css
│   └── logo.png
│
├── dist/               # Build output (auto-generated)
│
└── orb.config.json     # Configuration
```

---

## Syntax Reference

### 1. Layouts

Layouts define the overall page structure. Pages inject their content into layouts.

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
    <h1>Welcome!</h1>
    <p>This is my homepage.</p>
  </content>
</layout>
```

The `{{ content }}` placeholder in the layout gets replaced with whatever is inside `<content>...</content>` in the page.

### 2. Components

Components are reusable HTML blocks stored in the `components/` directory.

**`components/card.orb`**
```html
<div class="card">
  <h3>{{ title }}</h3>
  <p>{{ description }}</p>
</div>
```

**Using a component:**
```html
<use component="card" title="Hello" description="World" />
```

- `component="name"` — references `components/name.orb`
- Additional attributes become **props** passed to the component
- Must be **self-closing** (`/>`)
- Supports multi-line attributes

### 3. Variables `{{ }}`

Double curly braces insert variable values:

```html
<h1>{{ title }}</h1>
<p>Written by {{ author }}</p>
```

Variables can come from:
- **Props** passed to components
- **Data blocks** in pages
- **Layout variables** from page data

### 4. Data Blocks

Define page-level data with a `<script data>` block:

```html
<script data>
({
  title: "My Page",
  author: "Dan",
  showBio: true,
  skills: ["HTML", "CSS", "JavaScript"]
})
</script>

<layout src="main.layout">
  <content>
    <h1>{{ title }}</h1>
    <p>By {{ author }}</p>
  </content>
</layout>
```

### 5. Loops — `{{#each}}`

Iterate over arrays defined in data blocks:

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

**With objects:**

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
  <div>
    <h3>{{ name }}</h3>
    <p>{{ role }}</p>
    <small>Member #{{ @index }}</small>
  </div>
{{/each}}
```

**Special variables inside `{{#each}}`:**

| Variable | Description |
|----------|-------------|
| `{{ this }}` | Current item (for primitives) |
| `{{ @index }}` | Current index (0-based) |
| `{{ @first }}` | `"true"` if first item |
| `{{ @last }}` | `"true"` if last item |

### 6. Conditionals — `{{#if}}` / `{{#unless}}`

```html
{{#if showBio}}
  <div class="bio">
    <p>This is my bio!</p>
  </div>
{{/if}}

{{#if loggedIn}}
  <button>Logout</button>
{{else}}
  <button>Login</button>
{{/if}}

{{#unless hideFooter}}
  <use component="footer" />
{{/unless}}
```

**Truthy values:** anything except `undefined`, `null`, `false`, `""`, `0`

### 7. Named Slots

Layouts can have multiple content areas using named slots:

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
    <p>Main content here.</p>
  </content>
  <slot:sidebar>
    <nav>
      <a href="#intro">Intro</a>
      <a href="#api">API</a>
    </nav>
  </slot:sidebar>
</layout>
```

### 8. Component Imports

Import components with custom aliases for cleaner syntax:

```html
<import component="card" as="Card" />
<import component="badge" as="Badge" />

<Card title="Hello" description="World" />
<Badge text="New" color="#6c5ce7" />
```

### 9. Component Styles

Components can include `<style>` blocks that get collected and injected into the page `<head>`:

**`components/button.orb`**
```html
<style>
.orb-button {
  background: #6c5ce7;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.orb-button:hover {
  background: #5a4bd1;
}
</style>

<button class="orb-button">{{ label }}</button>
```

---

## Configuration

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
| `assetsDir` | `"assets"` | Static assets (copied as-is) |
| `minify` | `false` | Minify HTML output |
| `pretty` | `true` | Pretty-print output |

---

## Dev Server

The built-in dev server provides:

- **Live reload** — automatically rebuilds and refreshes browser on file changes
- **Clean URLs** — `/about` serves `about.html`
- **Directory indexes** — `/blog/` serves `blog/index.html`
- **Static file serving** — serves assets, CSS, images, etc.
- **SSE-based** — no WebSocket dependency

```bash
orb dev
# → http://localhost:3000

orb dev --port 8080
# → http://localhost:8080
```

---

## How It Works (Build Pipeline)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  1. Read .orb page file                         │
│  2. Extract <script data> block → page data     │
│  3. Extract <style> blocks → collected styles   │
│  4. Parse <layout src="..."> → find layout      │
│  5. Extract <content> and <slot:*> → slots      │
│  6. Load layout file                            │
│  7. Inject content into {{ content }} slot      │
│  8. Inject named slots                          │
│  9. Resolve {{ variables }} from page data      │
│ 10. Process {{#each}} loops                     │
│ 11. Process {{#if}} / {{#unless}} conditionals  │
│ 12. Resolve <use component="..." /> tags        │
│     - Load component .orb file                  │
│     - Parse inline props                        │
│     - Resolve component variables               │
│     - Recursively process nested components     │
│ 13. Inject collected styles into <head>         │
│ 14. Optional: minify HTML                       │
│ 15. Write to dist/*.html                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Full Example

Here's a complete example showing all features working together:

**`orb.config.json`**
```json
{
  "pagesDir": "pages",
  "componentsDir": "components",
  "layoutsDir": "layouts",
  "outputDir": "dist"
}
```

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
  <main>{{ content }}</main>
  <use component="footer" year="2026" />
</body>
</html>
```

**`components/header.orb`**
```html
<header>
  <nav>
    <a href="/">◉ OrbLayout</a>
    <a href="/about.html">About</a>
  </nav>
</header>
```

**`components/footer.orb`**
```html
<footer>
  <p>&copy; {{ year }} OrbLayout</p>
</footer>
```

**`components/card.orb`**
```html
<div class="card">
  <h3>{{ title }}</h3>
  <p>{{ description }}</p>
</div>
```

**`pages/index.orb`**
```html
<script data>
({
  title: "Home",
  features: ["Layouts", "Components", "Props", "Loops", "Conditionals"],
  showCards: true
})
</script>

<layout src="main.layout">
  <content>
    <h1>Welcome to OrbLayout</h1>

    {{#if showCards}}
      <use component="card" title="Fast" description="Build in milliseconds" />
      <use component="card" title="Simple" description="Just HTML + a few extras" />
    {{/if}}

    <h2>Features</h2>
    <ul>
      {{#each features}}
        <li>{{ this }}</li>
      {{/each}}
    </ul>
  </content>
</layout>
```

**Build:**
```bash
$ orb build

  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║     ◉  O r b L a y o u t  v1.0.0    ║
  ║     Static Site Builder               ║
  ║                                       ║
  ╚═══════════════════════════════════════╝

  Building pages...

  ✓ index.orb → index.html

  ──────────────────────────────────
  Done! 1 page(s) compiled in 12ms
  Output: dist/
```

---

## Programmatic API

Use OrbLayout as a library in your own Node.js scripts:

```javascript
const { loadConfig, OrbCompiler, OrbBuilder } = require("orblayout");

// Load config from current directory
const config = loadConfig(process.cwd());

// Compile a single page
const compiler = new OrbCompiler(config);
const html = compiler.compilePage("pages/index.orb");
console.log(html);

// Or build all pages
const builder = new OrbBuilder(config);
builder.build().then(result => {
  console.log(`Built ${result.pages} pages in ${result.time}ms`);
});
```

---

## Deploying

OrbLayout outputs plain HTML files. Deploy anywhere:

- **GitHub Pages** — push `dist/` to `gh-pages` branch
- **Netlify** — set build command to `orb build`, publish directory to `dist`
- **Vercel** — same as Netlify
- **Any web server** — just serve the `dist/` folder
- **S3 / CloudFront** — upload `dist/` contents

```bash
# Example: deploy to GitHub Pages
orb build
cd dist
git init
git add .
git commit -m "Deploy"
git push -f git@github.com:user/repo.git main:gh-pages
```

---

## Roadmap

### v1.0 (Current) ✅
- [x] Layout system with content injection
- [x] Reusable components with props
- [x] Variable interpolation `{{ }}`
- [x] `{{#each}}` loops with `@index`, `@first`, `@last`
- [x] `{{#if}}` / `{{else}}` / `{{#unless}}` conditionals
- [x] Named slots for multi-area layouts
- [x] Component imports with aliases
- [x] Component `<style>` blocks
- [x] `<script data>` blocks for page data
- [x] Static asset copying
- [x] Dev server with live reload
- [x] HTML minification
- [x] CLI with `init`, `build`, `dev` commands

### v2.0 (Planned)
- [ ] Markdown content support (`.md` in content blocks)
- [ ] Nested layouts (layout inheriting from layout)
- [ ] Partials (`<use partial="..." />`)
- [ ] Dynamic data from JSON/YAML files
- [ ] CSS/JS bundling
- [ ] Image optimization
- [ ] Sitemap generation
- [ ] RSS feed generation
- [ ] i18n / multi-language support
- [ ] Plugin system

---

## Syntax Cheat Sheet

```
┌──────────────────────────────────────────────────────────┐
│                  OrbLayout Syntax                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  LAYOUT                                                  │
│  <layout src="main.layout">                              │
│    <content> ... </content>                              │
│  </layout>                                               │
│                                                          │
│  COMPONENT                                               │
│  <use component="name" prop="value" />                   │
│                                                          │
│  IMPORT                                                  │
│  <import component="card" as="Card" />                   │
│  <Card title="Hello" />                                  │
│                                                          │
│  VARIABLE                                                │
│  {{ variableName }}                                      │
│                                                          │
│  DATA BLOCK                                              │
│  <script data>({ key: "value" })</script>                │
│                                                          │
│  LOOP                                                    │
│  {{#each items}} {{ this }} {{/each}}                    │
│                                                          │
│  CONDITIONAL                                             │
│  {{#if flag}} ... {{else}} ... {{/if}}                   │
│  {{#unless flag}} ... {{/unless}}                        │
│                                                          │
│  NAMED SLOT                                              │
│  <slot:sidebar> ... </slot:sidebar>                      │
│                                                          │
│  STYLE                                                   │
│  <style> .class { color: red; } </style>                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Philosophy

OrbLayout exists because:

1. **HTML is powerful enough.** You don't always need React.
2. **Components are a great idea.** But they don't require a runtime.
3. **Static sites should be simple.** Write HTML, get HTML.
4. **Developer experience matters.** Hot reload, clear errors, fast builds.

If your project doesn't need client-side interactivity, state management, or hydration — you don't need a JavaScript framework. You need **OrbLayout**.

---

## License

MIT © 2026 OrbLayout

---

<p align="center">
  <strong>◉ Built with OrbLayout</strong><br>
  <sub>Pure HTML. Zero Runtime. Maximum Speed.</sub>
</p>
