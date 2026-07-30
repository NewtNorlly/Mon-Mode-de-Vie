# Chromium Runner reference

This directory preserves the upstream source material used to study the
endless-runner mechanics in MMV's right-hand mini game.

- Upstream project: Chromium
- Upstream path: `components/neterror/resources/dino_game`
- Upstream commit pinned during review: `3df770f57f6b7044c90e991962e93c05f2a68cb1`
- Upstream resources tree: `59edc9b83ed31d2ca2574f8071b682ddd3881e9d`
- Upstream dino-game tree: `c70798a68bbb7bf48bf9265e6b24371f3e74dedd`
- Retrieved from the user-provided local source snapshot on 2026-07-18
- License: Chromium BSD-style license, preserved in `LICENSE`

## What is preserved

`original/` contains the upstream TypeScript game sources, build declaration,
shared constants and OWNERS file without modification. Their copyright headers
remain intact.

## What is deliberately not shipped

The Chromium net-error page shell, Chrome-specific runtime imports, audio files,
and offline sprite sheets are not copied into MMV. The sprite sheets include
Chrome-branded restart frames, and the original page is not a standalone web
component. MMV therefore uses its own neutral canvas artwork, four-language
copy and themed presentation.

The adapted implementation lives in `game/game.js`. It is an MMV work derived
from the runner's public mechanics and configuration ideas; it does not claim
Chromium, Google, Chrome or Edge endorsement.
