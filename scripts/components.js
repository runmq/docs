/**
 * Tiny enhancers that upgrade plain HTML inside a content partial into
 * interactive components after it's been injected into the DOM.
 *
 * To add a new component: write CSS in styles/components.css, then add an
 * `enhance<Name>(root)` here and call it from `enhanceAll()`.
 */
import { highlight } from './highlight.js';

const COPY_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`;
const CHECK_ICON = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

/** Decode HTML entities so highlighter sees source text, not encoded HTML. */
function decode(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function enhanceCodeBlocks(root) {
  // Prefer <pre><code data-lang="ts">...</code></pre>. Wrap into card.
  root.querySelectorAll('pre > code').forEach((code) => {
    const pre = code.parentElement;
    if (pre.parentElement?.classList.contains('code')) return; // already wrapped

    const lang = code.getAttribute('data-lang') || code.className.replace('language-', '') || 'ts';
    const raw = decode(code.innerHTML);
    code.innerHTML = highlight(raw, lang);

    const card = document.createElement('div');
    card.className = 'code';
    card.innerHTML = `
      <div class="code__head">
        <span class="code__lang">${lang}</span>
        <button class="code__copy" type="button" aria-label="Copy code">${COPY_ICON}<span>Copy</span></button>
      </div>
    `;
    pre.parentNode.insertBefore(card, pre);
    card.appendChild(pre);

    const btn = card.querySelector('.code__copy');
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(raw);
        btn.dataset.copied = 'true';
        btn.innerHTML = `${CHECK_ICON}<span>Copied</span>`;
        setTimeout(() => {
          delete btn.dataset.copied;
          btn.innerHTML = `${COPY_ICON}<span>Copy</span>`;
        }, 1600);
      } catch (_) {
        /* ignore clipboard failures */
      }
    });
  });
}

function enhanceTabs(root) {
  root.querySelectorAll('[data-tabs]').forEach((wrap) => {
    if (wrap.classList.contains('tabs')) return;
    wrap.classList.add('tabs');

    const panels = Array.from(wrap.querySelectorAll(':scope > [data-tab]'));
    if (!panels.length) return;

    const list = document.createElement('div');
    list.className = 'tabs__list';
    list.setAttribute('role', 'tablist');

    panels.forEach((panel, i) => {
      panel.classList.add('tabs__panel');
      const id = `tab-${Math.random().toString(36).slice(2, 8)}-${i}`;
      panel.id = id;
      panel.setAttribute('role', 'tabpanel');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tabs__btn';
      btn.textContent = panel.getAttribute('data-tab');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', id);
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      if (i === 0) panel.dataset.active = 'true';

      btn.addEventListener('click', () => {
        list.querySelectorAll('.tabs__btn').forEach((b) => b.setAttribute('aria-selected', 'false'));
        panels.forEach((p) => delete p.dataset.active);
        btn.setAttribute('aria-selected', 'true');
        panel.dataset.active = 'true';
      });

      list.appendChild(btn);
    });

    wrap.prepend(list);
  });
}

function enhanceCallouts(root) {
  // Already-styled callouts get an icon if missing.
  root.querySelectorAll('.callout').forEach((c) => {
    if (c.querySelector(':scope > .callout__body')) return;
    const variant = (c.className.match(/callout--(\w+)/) || [])[1] || 'info';
    const icons = { tip: '✦', info: 'i', warn: '!', note: '·' };
    const icon = icons[variant] || 'i';
    const body = document.createElement('div');
    body.className = 'callout__body';
    while (c.firstChild) body.appendChild(c.firstChild);
    const ic = document.createElement('span');
    ic.className = 'callout__icon';
    ic.textContent = icon;
    c.append(ic, body);
  });
}

function enhanceHeadingAnchors(root) {
  root.querySelectorAll('.article h2, .article h3').forEach((h) => {
    if (!h.id) {
      const slug = h.textContent
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      h.id = slug;
    }
    if (h.querySelector('.heading-anchor')) return;
    const a = document.createElement('a');
    a.href = `#${location.hash.split('#')[1] || ''}#${h.id}`;
    a.className = 'heading-anchor';
    a.textContent = '#';
    a.setAttribute('aria-label', 'Direct link');
    h.appendChild(a);
  });
}

function enhanceBenchmarks(root) {
  // <div class="bench" data-max="300000">
  //   <div class="bench__row" data-lib="runmq" data-value="253104"></div>
  // </div>
  root.querySelectorAll('.bench').forEach((bench) => {
    const max = Number(bench.dataset.max || 0);
    bench.querySelectorAll('.bench__row').forEach((row) => {
      const value = Number(row.dataset.value || 0);
      const label = row.dataset.label || row.dataset.lib || '';
      const display = row.dataset.display || value.toLocaleString();
      const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
      row.innerHTML = `
        <div class="bench__label">${label}</div>
        <div class="bench__bar"><span style="width:${pct}%"></span></div>
        <div class="bench__value">${display}</div>
      `;
    });
  });
}

function enhanceScreenshots(root) {
  const imgs = root.querySelectorAll('.screenshot img');
  imgs.forEach((img) => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });
}

function openLightbox(src, alt) {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', alt || 'Screenshot');

  const image = document.createElement('img');
  image.src = src;
  image.alt = alt || '';

  const close = document.createElement('button');
  close.className = 'lightbox__close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '×';

  lb.appendChild(image);
  lb.appendChild(close);
  document.body.appendChild(lb);

  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const dismiss = () => {
    lb.remove();
    document.body.style.overflow = prevOverflow;
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') dismiss(); };

  lb.addEventListener('click', dismiss);
  image.addEventListener('click', (e) => { e.stopPropagation(); dismiss(); });
  close.addEventListener('click', (e) => { e.stopPropagation(); dismiss(); });
  document.addEventListener('keydown', onKey);
}

function enhanceVersionToggle(root) {
  const toggles = root.querySelectorAll('[data-version-toggle]');
  if (!toggles.length) return;

  const stored = localStorage.getItem('rmq-version');
  const initial = stored === '1' ? '1' : '2';

  function applyVersion(v) {
    document.querySelectorAll('[data-version]').forEach((el) => {
      if (el.hasAttribute('data-version-toggle')) return;
      if (el.closest('[data-version-toggle]')) return;
      el.dataset.versionActive = el.getAttribute('data-version') === v ? 'true' : 'false';
    });
    document.querySelectorAll('[data-version-toggle]').forEach((wrap) => {
      wrap.querySelectorAll('button').forEach((b) => {
        b.setAttribute('aria-selected', b.dataset.version === v ? 'true' : 'false');
      });
    });
    localStorage.setItem('rmq-version', v);
  }

  toggles.forEach((wrap) => {
    if (wrap.classList.contains('version-toggle--ready')) return;
    wrap.classList.add('version-toggle', 'version-toggle--ready');
    wrap.innerHTML = `
      <span class="version-toggle__label">API version</span>
      <div class="version-toggle__buttons" role="tablist" aria-label="Select API version">
        <button type="button" role="tab" data-version="1">1.x</button>
        <button type="button" role="tab" data-version="2">2.x</button>
      </div>
    `;
    wrap.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => applyVersion(btn.dataset.version));
    });
  });

  applyVersion(initial);
}

function enhanceTables(root) {
  root.querySelectorAll('table').forEach((table) => {
    if (table.parentElement?.classList.contains('table-scroll')) return;
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    table.parentElement.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
}

export function enhanceAll(root) {
  enhanceCodeBlocks(root);
  enhanceTabs(root);
  enhanceCallouts(root);
  enhanceBenchmarks(root);
  enhanceTables(root);
  enhanceHeadingAnchors(root);
  enhanceScreenshots(root);
  enhanceVersionToggle(root);
}
