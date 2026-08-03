// Extracts the inline language-detection script from built pages and runs it
// against mocked browser globals, to check the redirect rules hold.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const OUT = process.argv[2];

function scriptFor(page) {
  const html = fs.readFileSync(path.join(OUT, page), 'utf8');
  const m = html.match(/<script>\s*\(function \(\) \{[\s\S]*?\}\)\(\);\s*<\/script>/);
  if (!m) throw new Error('no language script found in ' + page);
  return m[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
}

function run({ page, pathname, languages, stored }) {
  let redirectedTo = null;
  const storage = {
    getItem: k => (k === 'preferred-language' ? stored ?? null : null),
    setItem: () => {},
  };
  const sandbox = {
    navigator: { languages },
    window: {
      localStorage: storage,
      location: {
        pathname,
        search: '',
        hash: '',
        replace: url => {
          redirectedTo = url;
        },
      },
    },
  };
  sandbox.localStorage = storage;
  vm.createContext(sandbox);
  vm.runInContext(scriptFor(page), sandbox);
  return redirectedTo;
}

const cases = [
  {
    name: 'Chinese browser landing on the English home is moved to Chinese',
    args: { page: 'en/index.html', pathname: '/en/', languages: ['zh-CN', 'en'] },
    expect: '/',
  },
  {
    name: 'English browser landing on the Chinese home is moved to English',
    args: { page: 'index.html', pathname: '/', languages: ['en-US'] },
    expect: '/en/',
  },
  {
    name: 'Chinese browser on the Chinese home stays put',
    args: { page: 'index.html', pathname: '/', languages: ['zh-CN'] },
    expect: null,
  },
  {
    name: 'Saved choice beats the browser: zh saved, en browser, stays Chinese',
    args: { page: 'index.html', pathname: '/', languages: ['en-US'], stored: 'zh-cn' },
    expect: null,
  },
  {
    name: 'Saved choice beats the browser: en saved, zh browser, moves to English',
    args: { page: 'index.html', pathname: '/', languages: ['zh-CN'], stored: 'en' },
    expect: '/en/',
  },
  {
    name: 'English reader on an untranslated Chinese post stays (no bounce to 404)',
    args: {
      page: 'post/2013-not-that-simple/index.html',
      pathname: '/post/2013-not-that-simple/',
      languages: ['en-US'],
      stored: 'en',
    },
    expect: null,
  },
  {
    name: 'Unsupported browser language falls back to the default site',
    args: { page: 'index.html', pathname: '/', languages: ['fr-FR', 'de'] },
    expect: null,
  },
  {
    name: 'Regional Chinese variants (zh-Hant, zh-TW) still match Chinese',
    args: { page: 'en/index.html', pathname: '/en/', languages: ['zh-Hant-TW'] },
    expect: '/',
  },
  {
    name: 'Corrupt stored value is ignored, browser decides',
    args: { page: 'index.html', pathname: '/', languages: ['en-US'], stored: 'klingon' },
    expect: '/en/',
  },
];

let failed = 0;
for (const c of cases) {
  const got = run(c.args);
  const ok = got === c.expect;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}`);
  if (!ok) console.log(`        expected ${JSON.stringify(c.expect)}, got ${JSON.stringify(got)}`);
}
console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
