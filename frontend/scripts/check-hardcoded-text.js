import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default;

const SRC = new URL('../src', import.meta.url).pathname;
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'i18n', '__tests__']);
const IGNORE_FILES = new Set([
  'src/utils/format.js',
  'src/constants/index.js',
  'src/constants/presets.js',
  'src/components/LanguageSwitcher.jsx',
  'src/components/common/ConfirmDialog.jsx',
]);
const CHECK_ATTRS = new Set([
  'placeholder', 'title', 'alt', 'label', 'aria-label',
  'helperText', 'helpertext', 'errorText', 'errortext',
]);

let exitCode = 0;

function* walkFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || IGNORE_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(full);
    } else if (entry.isFile() && /\.(jsx?)$/.test(entry.name)) {
      const rel = full.replace(SRC + '/', 'src/');
      if (IGNORE_FILES.has(rel)) continue;
      yield { path: full, rel };
    }
  }
}

function isInsideTCall(path) {
  let p = path.parentPath;
  while (p) {
    if (p.isCallExpression() && p.node.callee.name === 't') return true;
    p = p.parentPath;
  }
  return false;
}

function isUiText(text) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return false;
  if (!/[A-Za-z]{2,}/.test(trimmed)) return false;
  if (/^[\d%\-+.\s:()]+$/.test(trimmed)) return false;
  if (/^[a-z]+$/.test(trimmed)) return false;
  return true;
}

for (const file of walkFiles(SRC)) {
  const code = readFileSync(file.path, 'utf-8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'decorators-legacy'],
      errorRecovery: true,
    });
  } catch {
    continue;
  }

  traverse(ast, {
    JSXText(path) {
      if (isInsideTCall(path)) return;
      const text = path.node.value;
      const line = text.includes('\n')
        ? path.node.loc.start.line
        : path.node.loc?.start.line;
      if (!line) return;
      if (isUiText(text)) {
        console.log(`${file.rel}:${line}: ${text.trim().slice(0, 80)}`);
        exitCode = 1;
      }
    },

    JSXAttribute(path) {
      const attrName = path.node.name.name;
      if (!CHECK_ATTRS.has(attrName)) return;
      const val = path.node.value;
      if (!val || val.type !== 'StringLiteral') return;
      if (isInsideTCall(path)) return;
      if (isUiText(val.value)) {
        console.log(`${file.rel}:${val.loc?.start.line}: ${val.value.slice(0, 80)}`);
        exitCode = 1;
      }
    },
  });
}

if (exitCode === 0) {
  console.log('No hardcoded UI text found');
} else {
  console.log('\nHardcoded UI text detected. Use t() for i18n instead.');
}

process.exit(exitCode);
