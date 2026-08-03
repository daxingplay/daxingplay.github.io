# daxingplay.github.io

Hugo source for https://daxingplay.me/, built by Netlify (Hugo version pinned in `netlify.toml`).

## Local development

```sh
hugo server -D
```

## Languages

The site is bilingual: **Chinese at `/`** (the default, so every existing URL is unchanged)
and **English under `/en/`**.

Posts are translated by filename:

```
content/post/my-post.md      → Chinese, https://daxingplay.me/post/my-post/
content/post/my-post.en.md   → English, https://daxingplay.me/en/post/my-post/
```

A post with no `.en.md` sibling simply does not exist in English — it is absent from `/en/`,
its listings and its RSS feed. Nothing is machine-translated and no half-translated page is
ever served. Right now every post is Chinese-only, so `/en/` shows a deliberate empty state
pointing back at the Chinese archive; it fills up as you add `.en.md` files.

UI strings (nav, dates, "read more", 404 …) live in
`themes/hugo-nuo-ng/i18n/{zh-cn,en}.toml`. Add a key to **both** files when you add one.
Per-language site title, subtitle, menus and copyright are in the `[languages.*]` blocks of
`config.toml`.

### How a reader's language gets picked

1. If they have used the switcher before, that saved choice always wins.
2. Otherwise their browser's `Accept-Language` order decides.
3. Either way the redirect only fires when *this exact page* exists in the target language —
   nobody gets bounced off an article onto a home page.

The choice is stored in `localStorage` and applied by a small inline script in `<head>`
(`layouts/partials/language-redirect.html`), so it runs before first paint and there is no
flash of the wrong language. Deliberately client-side: each URL still serves exactly one
language to crawlers and to the CDN, and `hreflang` / `x-default` tags tell search engines
how the two versions relate.

To test the detection rules after changing that script:

```sh
hugo --destination /tmp/site && node scripts/test-redirect.js /tmp/site
```

## Theme

The active theme lives in `themes/hugo-nuo-ng/` as **plain files in this repo** — it is no
longer a git submodule, so a clone needs no `--recurse-submodules` and upstream going quiet
can't break a build.

Provenance: vendored from https://github.com/daxingplay/hugo-nuo-ng at commit
`31e41270de917624714332ba6e659fece1d7c847` (2024-03-31), itself a fork of
https://github.com/laozhu/hugo-nuo (MIT, see `themes/hugo-nuo-ng/LICENSE.md`).

Edit the theme directly here and commit alongside content changes. To pull a fix from
upstream, cherry-pick it by hand — there is no submodule pointer to bump.

Two unused themes (`casper`, `hugo-nuo`) were dropped at the same time; they are still in
git history if ever needed.
