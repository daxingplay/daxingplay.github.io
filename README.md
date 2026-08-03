# daxingplay.github.io

Hugo source for https://daxingplay.me/, built by Netlify (Hugo version pinned in `netlify.toml`).

## Local development

```sh
hugo server -D
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
