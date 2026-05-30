import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const CJK_RE = /[\u4e00-\u9fff]/;
const UI_TEXT_RE = />([^<]{4,})</;

const IGNORE_DIRS = ['node_modules', 'dist', 'i18n'];
const IGNORE_FILES = [
  'src/utils/format.js',
  'src/constants/index.js',
  'src/constants/presets.js',
  'src/components/LanguageSwitcher.jsx',
  'src/components/common/ConfirmDialog.jsx'
];
let exitCode = 0;

function findFiles(dir, list = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || IGNORE_DIRS.includes(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(fullPath, list);
    } else if (entry.isFile() && /\.(jsx|js)$/.test(entry.name)) {
      list.push(fullPath);
    }
  }
  return list;
}

const files = findFiles('src');

for (const file of files) {
  const relPath = file.replace(/\\/g, '/');
  if (IGNORE_FILES.some(ig => relPath.endsWith(ig))) continue;

  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  let inTCall = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const prevLine = i > 0 ? lines[i - 1] : '';

    if (inTCall) {
      if (/\)/.test(line)) inTCall = false;
      continue;
    }

    if (/t\s*\([^)]*$/.test(line) && !/t\s*\([^)]*\)/.test(line)) {
      inTCall = true;
      continue;
    }

    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    if (/^\s*(import|export)\s/.test(line)) continue;

    if (/\|\|\s*$/.test(prevLine)) continue;

    if (/\w+\s*(>=|<=)\s*\w+/.test(line)) continue;

    // Check for hardcoded English UI text between JSX tags
    if (UI_TEXT_RE.test(line)) {
      const text = line.match(UI_TEXT_RE)[1].trim();
      if (/^\{/.test(text) && /\}$/.test(text)) continue;
      if (/^\{[\s\S]*\}\s*[a-zA-Z%\/]+\s*$/.test(text)) continue;

      const withoutT = text.replace(/t\s*\(\s*['"][\s\S]*?['"]\s*(,\s*['"][\s\S]*?['"]\s*)?\)/g, '').trim();
      if (!withoutT || withoutT.length < 4) continue;
      if (!/[A-Za-z]{3,}/.test(withoutT)) continue;
      if (/^[\d%\-+.\s:]+$/.test(withoutT)) continue;

      console.log(`${relPath}:${lineNum}: ${line.trim()}`);
      exitCode = 1;
      continue;
    }

    // Check for hardcoded Chinese text
    if (CJK_RE.test(line)) {
      if (/['"`][^'"`]*\/[^'"`]*[\u4e00-\u9fff][^'"`]*['"`]/.test(line)) continue;
      if (/t\s*\(\s*['"][^'"]*['"]\s*,\s*['"][^'"]*[\u4e00-\u9fff][^'"]*['"]\s*\)/.test(line)) continue;
      if (/t\s*\(\s*['"][^'"]*['"]\s*\)\s*\|\|\s*['"][^'"]*[\u4e00-\u9fff][^'"]*['"]/.test(line)) continue;

      if (/['"][^'"]*[\u4e00-\u9fff][^'"]*['"]/.test(line) ||
          />([^<]*[\u4e00-\u9fff][^<]*)</.test(line)) {
        console.log(`${relPath}:${lineNum}: ${line.trim()}`);
        exitCode = 1;
      }
    }
  }
}

if (exitCode === 0) {
  console.log('No hardcoded UI text found');
} else {
  console.log('\nHardcoded UI text detected. Use t() for i18n instead.');
}

process.exit(exitCode);
