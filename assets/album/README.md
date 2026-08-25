# MMV Album Asset Guide

The album is a data-driven gallery. Every published work is declared in
`album-data.js`; `album-module.js` renders all declared items in groups of three
per row and keeps six additional unpublished slots hidden after the last item.

## Adding a work

1. Export the artwork as a 4:3 or 3:2 landscape WebP into the matching folder below.
2. Append one item to that album's `items` array in `album-data.js`.
3. Supply `title`, `caption`, and `scene` in `zh`, `en`, `fr`, and `de`.
4. Run `node tools/verify-album-data.js` from the project root to catch missing
   translations, duplicate IDs, or missing files.
5. Run `python tools/verify-album-images.py` to verify decodability, landscape sizing,
   and accidental duplicate assets.

No row markup or slot count needs to be edited. A seventh work automatically
starts row three; later works continue downward without a fixed limit.

## Folder map

- `portraits/` — adult portrait studies
- `life/` — everyday street and home scenes
- `animals/` — companion and wild-animal studies
- `archives/` — artistic archive reconstructions, not primary historical records
- `illustrations/` — standalone fantasy and decorative illustrations
- `comics/` — quiet single-panel narrative scenes
- `landscapes/` — natural and lived-in landscapes

## Visual direction

The initial collection contains 42 original landscape artworks made for MMV with
the built-in image generator, then stored locally as quality WebP files. Their
4:3 and 3:2 source ratios are both framed by consistent 4:3 gallery cards. The
shared direction is warm watercolor and colored pencil on lightly textured paper:
natural light, tactile pigment, believable small imperfections, restrained
detail, no typography, no watermark, and no imitation of a named living artist.

Portrait subjects are unambiguously adult Chinese women (18+). The archive
folder uses invented still-life arrangements and stylized reproductions so its
images cannot be mistaken for authentic historical documents.
