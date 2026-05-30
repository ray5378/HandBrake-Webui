import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const CJK_RE = /[\u4e00-\u9fff]/;
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

    // Track multi-line t() calls regardless of CJK content
    if (inTCall) {
      if (/\)/.test(line)) inTCall = false;
      if (!CJK_RE.test(line)) continue;
      // Line has CJK but we're inTCall, skip it
      continue;
    }

    if (/t\s*\([^)]*$/.test(line) && !/t\s*\([^)]*\)/.test(line)) {
      inTCall = true;
      continue;
    }

    if (!CJK_RE.test(line)) continue;

    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    if (/^\s*(import|export)\s/.test(line)) continue;

    // Check if previous line ends with `||` (fallback continuation)
    if (/\|\|\s*$/.test(prevLine)) continue;

    // Single-line t('key', 'chinese') calls
    if (/t\s*\(\s*['"][^'"]*['"]\s*,\s*['"][^'"]*[\u4e00-\u9fff][^'"]*['"]\s*\)/.test(line)) continue;

    // Single-line t('key') || 'chinese' calls
    if (/t\s*\(\s*['"][^'"]*['"]\s*\)\s*\|\|\s*['"][^'"]*[\u4e00-\u9fff][^'"]*['"]/.test(line)) continue;

    // Skip filesystem paths containing Chinese (e.g. '/drive/转码/转码后')
    if (/['"`][^'"`]*\/[^'"`]*[\u4e00-\u9fff][^'"`]*['"`]/.test(line)) continue;

    // Check for remaining Chinese in backtick strings
    if (/`[^`]*[\u4e00-\u9fff][^`]*`/.test(line)) {
      console.log(`${relPath}:${lineNum}: ${line.trim()}`);
      exitCode = 1;
      continue;
    }

    // Check for remaining Chinese in quoted strings
    if (/['"][^'"]*[\u4e00-\u9fff][^'"]*['"]/.test(line)) {
      console.log(`${relPath}:${lineNum}: ${line.trim()}`);
      exitCode = 1;
      continue;
    }

    // Check for Chinese in JSX text
    if (/>([^<]*[\u4e00-\u9fff][^<]*)</.test(line)) {
      console.log(`${relPath}:${lineNum}: ${line.trim()}`);
      exitCode = 1;
    }
  }
}

if (exitCode === 0) {
  console.log('No hardcoded Chinese text found');
} else {
  console.log('\nHardcoded Chinese text detected. Use t() for i18n instead.');
}

process.exit(exitCode);
