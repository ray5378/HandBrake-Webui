import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default;

const SRC = new URL('../src', import.meta.url).pathname;
const LOCALES_DIR = new URL('../src/i18n/locales', import.meta.url).pathname;
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'i18n', '__tests__']);

let exitCode = 0;

function* walkFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || IGNORE_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(full);
    } else if (entry.isFile() && /\.(jsx?)$/.test(entry.name)) {
      yield full;
    }
  }
}

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const pk = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') {
      keys.push(...flattenKeys(v, pk));
    } else {
      keys.push(pk);
    }
  }
  return keys;
}

const localeFiles = readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json'));
const locales = {};
for (const f of localeFiles) {
  const name = f.replace('.json', '');
  const data = JSON.parse(readFileSync(join(LOCALES_DIR, f), 'utf-8'));
  locales[name] = new Set(flattenKeys(data));
}

const allLocaleNames = Object.keys(locales);
const usedKeys = new Set();
const keySource = {};

for (const file of walkFiles(SRC)) {
  const code = readFileSync(file, 'utf-8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'decorators-legacy'],
      errorRecovery: true
    });
  } catch {
    continue;
  }

  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee.name !== 't') return;
      const arg = path.node.arguments[0];
      if (!arg || arg.type !== 'StringLiteral') return;
      usedKeys.add(arg.value);
      if (!keySource[arg.value]) {
        keySource[arg.value] = [];
      }
      keySource[arg.value].push(file.replace(SRC + '/', 'src/') + ':' + arg.loc.start.line);
    }
  });
}

let missingCount = 0;
const unusedKeys = new Set();

for (const localeName of allLocaleNames) {
  const localeKeys = locales[localeName];

  for (const key of usedKeys) {
    if (!localeKeys.has(key)) {
      console.log(`  [${localeName}] 缺少 key: ${key}`);
      if (keySource[key]) {
        for (const src of keySource[key]) {
          console.log(`      来源: ${src}`);
        }
      }
      missingCount++;
    }
  }

  for (const k of localeKeys) {
    if (!usedKeys.has(k)) {
      unusedKeys.add(k);
    }
  }
}

if (missingCount > 0) {
  console.log(`\n共 ${missingCount} 个 key 在翻译文件中缺失`);
  exitCode = 1;
}

if (unusedKeys.size > 0) {
  console.log(`\n以下 key 在源码中未使用（共 ${unusedKeys.size} 个），可考虑清理:`);
  for (const k of [...unusedKeys].sort()) {
    console.log(`  ${k}`);
  }
}

if (exitCode === 0) {
  console.log('所有 i18n key 完整，无缺失');
} else {
  console.log('\ni18n key 检查未通过，请补充缺失的翻译');
}

process.exit(exitCode);
