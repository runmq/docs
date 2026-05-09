# RunMQ Documentation Site

Static HTML/CSS/JS docs. No build step. No bundler. No framework.
Light/dark theme, custom components, and content stored as plain HTML
partials so adding a page is a single file + one config line.

## Run it locally

Any static server works. Pick one:

```bash
# Python
python3 -m http.server 4173

# Node
npx serve .

# Bun
bunx serve .
```

Then open <http://localhost:4173>.

> A static server is required because pages are loaded with `fetch()`.
> Opening `index.html` directly with `file://` will not work — the
> browser blocks `fetch` from the local filesystem.

## Add a page

1. Create `content/<your-slug>.html`. Anything you put inside is rendered
   as the article body. You can use any of the components below.
2. Add it to the sidebar in `scripts/nav.js`:

   ```js
   { slug: 'your-slug', title: 'Your title' },
   ```

That's it. The router, TOC, prev/next pager, and active-link state all
update automatically.

## Authoring components

All components are plain HTML — no JSX, no templating. Each one is
defined in `styles/components.css` and (where needed) enhanced by
`scripts/components.js` after the page is injected.

### Headings

`h1` is the page title. `h2` and `h3` are auto-collected into the
right-side TOC. Inside an `h1`, use `<em>` for an italic accent in the
brand color:

```html
<h1>Up and running in <em>five minutes</em>.</h1>
```

### Eyebrow + lead

```html
<div class="eyebrow">Quick start</div>
<h1>...</h1>
<p class="lead">A short opening sentence under the title.</p>
```

### Code blocks

Wrap code in `<pre><code data-lang="ts">...</code></pre>`. The renderer
adds the language label, copy button, and syntax highlighting. Supported
languages: `ts`, `js`, `tsx`, `bash`.

### Callouts

```html
<div class="callout callout--tip">  ...  </div>
<div class="callout callout--info"> ...  </div>
<div class="callout callout--warn"> ...  </div>
```

### Tabs

```html
<div data-tabs>
  <div data-tab="Core">     ...content...  </div>
  <div data-tab="NestJS">   ...content...  </div>
</div>
```

### Property tables

Use `class="props"`:

```html
<table class="props">
  <thead><tr><th>Property</th><th>Type</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td class="prop-name">url</td><td><code>string</code></td><td>...</td></tr>
  </tbody>
</table>
```

### Flow diagrams

Pre-formatted ASCII flow blocks. Wrap names with `<b>` for accent color:

```html
<div class="flow">Publisher → <b>topic</b> → Queue: <b>worker</b> → DLQ</div>
```

### Benchmark bars

```html
<div class="bench" data-max="300000">
  <div class="bench__row" data-lib="runmq" data-label="RunMQ"
       data-value="253104" data-display="253,104"></div>
  <div class="bench__row" data-lib="bullmq" data-label="BullMQ"
       data-value="53636"  data-display="53,636"></div>
</div>
```

### Other helpers

- `.lead` — large lead paragraph
- `.pullquote` — italic display quote
- `.pill`, `.pill--accent` — small inline pills
- `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--mono` — call-to-action buttons
- `.features` — 2-up feature grid (uses `.feature` cards with `.feature__icon`)
- `.stat-strip` — 4-up stat strip (uses `.stat` with `.stat__value` / `.stat__label`)

## Theming

CSS variables drive the entire visual system. Light is the default; dark
is opt-in via `data-theme="dark"` on `<html>`. The theme toggle in the
top bar persists the user's choice in `localStorage`.

To tweak colors or fonts, edit the variables at the top of
`styles/main.css`. They're documented inline.

## File map

```
docs/
├── index.html              # shell
├── styles/
│   ├── main.css            # layout, theme, typography
│   ├── components.css      # custom component styles
│   └── code.css            # code blocks + syntax tokens
├── scripts/
│   ├── nav.js              # sidebar/route config (extend here)
│   ├── app.js              # router, TOC, theme, sidebar
│   ├── components.js       # HTML enhancers (tabs, copy, etc.)
│   └── highlight.js        # tiny TS/JS/Bash highlighter
└── content/
    ├── home.html
    ├── getting-started.html
    └── ...                 # one HTML partial per page
```
