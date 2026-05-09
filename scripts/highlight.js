/**
 * Tiny, dependency-free syntax highlighter for TypeScript/JS/Bash blocks.
 * Covers the cases we actually use in the docs. Replace later if needed.
 */

const TS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'class', 'extends', 'implements',
  'return', 'if', 'else', 'for', 'while', 'await', 'async', 'new', 'try',
  'catch', 'finally', 'throw', 'import', 'from', 'export', 'default',
  'interface', 'type', 'enum', 'as', 'in', 'of', 'this', 'super', 'public',
  'private', 'protected', 'readonly', 'static', 'true', 'false', 'null',
  'undefined', 'void',
]);

const TS_TYPES = new Set([
  'string', 'number', 'boolean', 'any', 'object', 'unknown', 'never',
  'Promise', 'Record', 'Array', 'Buffer', 'Date',
]);

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightTS(src) {
  // Strategy: build segments by scanning. Order matters.
  const tokens = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    const ch = src[i];
    const rest = src.slice(i);

    // Line comment
    if (ch === '/' && src[i + 1] === '/') {
      const end = src.indexOf('\n', i);
      const stop = end === -1 ? len : end;
      tokens.push({ t: 'c', v: src.slice(i, stop) });
      i = stop;
      continue;
    }

    // Block comment
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? len : end + 2;
      tokens.push({ t: 'c', v: src.slice(i, stop) });
      i = stop;
      continue;
    }

    // Strings: ', ", `
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      let j = i + 1;
      while (j < len) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === quote) { j++; break; }
        j++;
      }
      tokens.push({ t: 's', v: src.slice(i, j) });
      i = j;
      continue;
    }

    // Decorators @Foo
    if (ch === '@' && /[A-Za-z_]/.test(src[i + 1] || '')) {
      const m = rest.match(/^@[A-Za-z_][\w]*/);
      if (m) {
        tokens.push({ t: 'd', v: m[0] });
        i += m[0].length;
        continue;
      }
    }

    // Numbers
    const numMatch = rest.match(/^\d+(\.\d+)?/);
    if (numMatch && (i === 0 || /[^A-Za-z_]/.test(src[i - 1]))) {
      tokens.push({ t: 'n', v: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }

    // Identifiers / keywords / types / functions
    const idMatch = rest.match(/^[A-Za-z_$][\w$]*/);
    if (idMatch) {
      const word = idMatch[0];
      const next = src[i + word.length];
      if (TS_KEYWORDS.has(word)) {
        tokens.push({ t: 'k', v: word });
      } else if (TS_TYPES.has(word)) {
        tokens.push({ t: 't', v: word });
      } else if (next === '(') {
        tokens.push({ t: 'f', v: word });
      } else if (/^[A-Z]/.test(word)) {
        tokens.push({ t: 't', v: word });
      } else {
        tokens.push({ t: 'id', v: word });
      }
      i += word.length;
      continue;
    }

    // Punctuation / whitespace pass-through
    tokens.push({ t: 'p', v: ch });
    i++;
  }

  return tokens
    .map((tk) => {
      const v = escapeHTML(tk.v);
      if (tk.t === 'p' || tk.t === 'id') return v;
      return `<span class="tok-${tk.t}">${v}</span>`;
    })
    .join('');
}

function highlightBash(src) {
  // Tokenize first, then escape + wrap. This avoids regexes matching
  // attribute values inside spans we've already inserted.
  const COMMANDS = new Set(['npm', 'npx', 'yarn', 'pnpm', 'docker', 'node', 'bun', 'git', 'curl', 'cd']);
  const out = [];
  let i = 0;
  const len = src.length;

  const push = (t, v) => out.push({ t, v });

  while (i < len) {
    const ch = src[i];
    const rest = src.slice(i);

    // Comment to end of line
    if (ch === '#') {
      const end = src.indexOf('\n', i);
      const stop = end === -1 ? len : end;
      push('c', src.slice(i, stop));
      i = stop;
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1;
      while (j < len) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === q) { j++; break; }
        j++;
      }
      push('s', src.slice(i, j));
      i = j;
      continue;
    }

    // Flag: -x, --xxx (must follow whitespace or line start)
    const prev = i === 0 ? '\n' : src[i - 1];
    if (ch === '-' && /\s/.test(prev)) {
      const m = rest.match(/^--?[A-Za-z][\w-]*/);
      if (m) {
        push('k', m[0]);
        i += m[0].length;
        continue;
      }
    }

    // Word
    const wm = rest.match(/^[A-Za-z_][\w-]*/);
    if (wm) {
      const word = wm[0];
      push(COMMANDS.has(word) ? 'f' : 'id', word);
      i += word.length;
      continue;
    }

    // Pass-through (whitespace, punctuation)
    push('p', ch);
    i++;
  }

  return out
    .map(({ t, v }) => {
      const safe = escapeHTML(v);
      if (t === 'p' || t === 'id') return safe;
      return `<span class="tok-${t}">${safe}</span>`;
    })
    .join('');
}

const HIGHLIGHTERS = {
  ts: highlightTS,
  typescript: highlightTS,
  js: highlightTS,
  javascript: highlightTS,
  tsx: highlightTS,
  bash: highlightBash,
  sh: highlightBash,
  shell: highlightBash,
};

export function highlight(src, lang) {
  const fn = HIGHLIGHTERS[(lang || 'ts').toLowerCase()];
  return fn ? fn(src) : escapeHTML(src);
}
