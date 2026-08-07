# TODO

Known issues worth fixing, with enough detail to pick up cold. Newest first.

## Images are served at full camera resolution (page weight)

**Status:** open. Noticed 2026-08-08 on the aquarium controller post.

Every image lives in `static/`, which Hugo copies verbatim — no resizing, no format
conversion, no responsive variants. So whatever comes off the phone is what a reader
downloads.

`/post/smart-controller-for-aquarium/` currently pulls roughly **7.7 MB** of images:

| File | Size | Natural width | Rendered width |
| --- | --- | --- | --- |
| `IMG_2767.jpeg` | 1.34 MB | 2000 px | 588 px |
| `IMG_2751.jpeg` | 1.34 MB | 2000 px | 540 px |
| `IMG_2761.jpeg` | 1.17 MB | 2000 px | 682 px |
| `IMG_2763.jpeg` | 1.12 MB | 2000 px | 770 px |
| `IMG_2765.jpeg` | 0.89 MB | 2000 px | 653 px |
| `IMG_2762.jpeg` | 0.81 MB | 2000 px | 708 px |
| `image.png` (cover) | 0.85 MB | 1024 px | 1037 px |
| `case-preview.png` | 0.44 MB | 1603 px | 1039 px |

Rendered widths measured in a 1440 × 900 viewport. The six photos are portraits capped at
`max-height: 80vh`, so height is the binding constraint and they land at 540–770 px wide.
Even allowing 2× for retina, 2000 px is more than needed.

Separately, `image.png` is the only one being *upscaled* — a 1024 px cover stretched across
a 1037 px column, so it is soft on any screen and badly soft on retina. It wants to be
about 2100 px wide.

Re-encoding the six JPEGs at 1600 px / quality 85 measured **1.6 MB total** — a 4.8 MB
saving with no visible difference at display size.

Options, cheapest first:

1. Resize the existing files in place. One-off, no code, fixes today's problem only.
2. Move post images into [page bundles](https://gohugo.io/content-management/page-bundles/)
   and run them through Hugo's image processing (`.Resize`, `.Fill`, WebP output,
   `srcset`). Fixes it permanently for future posts, but every existing
   `/files/...` path would need updating, and `static/files/` URLs are already public.
3. Add a pre-commit hook or a `scripts/` helper that downsizes anything dropped into
   `static/files/`.

Option 2 is the real fix; option 1 unblocks the current post.

## Content images have no dimensions and no lazy loading

**Status:** open. Same origin as above.

Markdown images render as bare `<img src="…" alt="…">` — see
`themes/hugo-nuo-ng/assets/styles/partials/_content.scss` for the styling side.

Two consequences:

- **No `width`/`height`**, so the browser cannot reserve space and the article reflows as
  each photo arrives. Worst on the aquarium post, which has seven inline images.
- **No `loading="lazy"`**, so all of them are fetched even though most sit several screens
  down.

Fix with a render hook (`layouts/_default/_markup/render-image.html`) that emits
`loading="lazy"` plus real dimensions. With page bundles (option 2 above) Hugo knows
`.Width` and `.Height` directly; with `static/` paths they have to be hardcoded or omitted.

Note: `layouts/post/summary.html` sets `lazyload="on"` on the list-card cover. That is not
a real attribute and does nothing — it should be `loading="lazy"`.

## Unused poster images

**Status:** open, trivial.

`static/files/smart-aquarium-controller/poster.jpg` and `poster-en.jpg` (~195 KB each) were
added as post covers, then both posts were switched to `image.png`. Nothing references them
now. Either delete them, or point the English post's `cover` back at `poster-en.jpg` — right
now both languages share one Chinese-made cover.
