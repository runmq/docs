import { NAV, flatRoutes } from './nav.js';
import { enhanceAll, enhanceVersionToggle } from './components.js';

const $article = document.getElementById('article');
const $sidebar = document.querySelector('.sidebar__nav');
const $sidebarEl = document.getElementById('sidebar');
const $toc = document.querySelector('.toc__list');
const $themeToggle = document.getElementById('theme-toggle');
const $sidebarToggle = document.getElementById('sidebar-toggle');

const ROUTES = flatRoutes();
const ROUTE_INDEX = new Map(ROUTES.map((r, i) => [r.slug, i]));

/* ─────────────────────────────────────────────
   Sidebar render
   ───────────────────────────────────────────── */
function renderSidebar() {
  $sidebar.innerHTML = NAV.map(
    (group) => `
      <div class="sidebar__group">
        <p class="sidebar__heading">${group.heading}</p>
        ${group.items
          .map((item) => `<a href="#/${item.slug}" data-slug="${item.slug}">${item.title}</a>`)
          .join('')}
      </div>
    `
  ).join('');
}

function setActiveSidebar(slug) {
  $sidebar.querySelectorAll('a').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.slug === slug);
  });
  document.querySelectorAll('.topbar__nav a').forEach((a) => {
    const target = a.getAttribute('href').replace('#/', '');
    const groupRoots = ['getting-started', 'patterns', 'advanced', 'nestjs', 'pulse', 'benchmarks', 'api'];
    a.classList.toggle('is-active', target === slug || (groupRoots.includes(target) && slug.startsWith(target)));
  });
}

/* ─────────────────────────────────────────────
   Router
   ───────────────────────────────────────────── */
async function loadPage(slug) {
  $article.innerHTML = `<div class="article__loading">Loading…</div>`;
  let html;
  try {
    const res = await fetch(`content/${slug}.html`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.statusText);
    html = await res.text();
  } catch (err) {
    $article.innerHTML = `
      <div class="eyebrow">404</div>
      <h1>Page not found</h1>
      <p class="lead">We couldn't load <code>content/${slug}.html</code>. If you're running this locally, make sure you're serving the directory with a static server (any will do).</p>
      <p><a class="btn btn--ghost" href="#/home">Back to introduction →</a></p>
    `;
    enhanceAll($article);
    buildTOC();
    return;
  }

  $article.innerHTML = html;
  enhanceAll($article);
  buildTOC();
  buildPager(slug);
  $article.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function buildPager(slug) {
  const idx = ROUTE_INDEX.get(slug);
  if (idx === undefined) return;
  const prev = ROUTES[idx - 1];
  const next = ROUTES[idx + 1];
  if (!prev && !next) return;

  const pager = document.createElement('nav');
  pager.className = 'pager';
  pager.setAttribute('aria-label', 'Page navigation');
  pager.innerHTML = `
    ${prev ? `
      <a href="#/${prev.slug}" class="pager__prev">
        <span class="pager__label">← Previous</span>
        <span class="pager__title">${prev.title}</span>
      </a>` : '<span></span>'}
    ${next ? `
      <a href="#/${next.slug}" class="pager__next">
        <span class="pager__label">Next →</span>
        <span class="pager__title">${next.title}</span>
      </a>` : '<span></span>'}
  `;
  $article.appendChild(pager);
}

function getRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [slug] = hash.split('#');
  return slug || 'home';
}

let currentSlug = null;

async function handleRouteChange() {
  const slug = getRoute();
  const inner = location.hash.split('#')[2];

  if (slug !== currentSlug) {
    setActiveSidebar(slug);
    await loadPage(slug);
    currentSlug = slug;
  }

  if (inner) {
    const el = document.getElementById(inner);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $sidebarEl.classList.remove('is-open');
}

/* ─────────────────────────────────────────────
   TOC
   ───────────────────────────────────────────── */
function buildTOC() {
  const headings = $article.querySelectorAll('h2, h3');
  if (!headings.length) {
    $toc.innerHTML = '';
    document.querySelector('.toc').style.display = 'none';
    return;
  }
  document.querySelector('.toc').style.removeProperty('display');

  $toc.innerHTML = Array.from(headings)
    .map((h) => {
      const indent = h.tagName === 'H3' ? 'indent' : '';
      const text = h.textContent.replace('#', '').trim();
      return `<li class="${indent}"><a href="#${location.hash.split('#')[1] || ''}#${h.id}" data-id="${h.id}">${text}</a></li>`;
    })
    .join('');

  // Scroll spy
  const links = $toc.querySelectorAll('a');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id;
          links.forEach((l) => l.classList.toggle('is-active', l.dataset.id === id));
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
  );
  headings.forEach((h) => observer.observe(h));
}

/* ─────────────────────────────────────────────
   Theme toggle
   ───────────────────────────────────────────── */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('rmq-theme', next);
}

/* ─────────────────────────────────────────────
   Boot
   ───────────────────────────────────────────── */
renderSidebar();
enhanceVersionToggle(document.body);

window.addEventListener('hashchange', handleRouteChange);
$themeToggle.addEventListener('click', toggleTheme);
$sidebarToggle.addEventListener('click', () => $sidebarEl.classList.toggle('is-open'));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') $sidebarEl.classList.remove('is-open');
});

handleRouteChange();
