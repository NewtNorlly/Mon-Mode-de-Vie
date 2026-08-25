# MMV Brand & Interface Specification

## Identity

- **Name:** Mon Mode de Vie
- **Canonical abbreviation:** MMV
- **Author / conversation host:** `NewtNorlly` in every visible language and module.
- **Planned domain:** `newtnorlly.xyz`
- **Visible logo:** Not yet defined. The v0 uses the full name as plain typographic identity and does not invent a logo.
- **Product metaphor:** A quiet digital salon where a visitor gets to know the author by choosing where the conversation goes.

## Design direction

**Paper Salon / 纸上会客厅 + Neko Glass** combines a warm editorial conversation with a stable three-column shell floating above a soft ambient colour field. It borrows interaction principles from the supplied references without copying their branded surfaces or identity:

- XiaDown supplies the exact theme palettes and restrained translucent surface language.
- Stardew Valley inspires the idea that a decorative cloud can also be a functional setting entrance.
- VS Code supplies the independently collapsible and resizable side-column logic.
- MMV itself supplies the paper, correspondence, calendar and salon metaphors.
- Neko supplies the low-saturation moving colour field, translucent bubble material, compact type hierarchy and dual-tone icon feedback.

The central Home is a restrained, continuously growing social conversation rather than a decorated landing card. NewtNorlly speaks in short, left-aligned messages; the visitor can reply only by selecting one of NewtNorlly's left-side choices, after which that choice appears as the visitor's right-side message. Text, original images and internal-link previews remain inside the same flow. Every completed branch returns the original choices at the bottom while preserving the conversation above it. Theme or language changes preserve and translate that history.

## Design calibration

- Visual variance: 4/10 on Home; 8/10 across the broader themed shell
- Motion intensity: 2/10 on Home; ambient theme motion remains restrained elsewhere
- Information density: 3/10 on Home
- Asset dependence: 7/10 on Home because the two authored portraits carry its identity
- XiaDown palette fidelity: 8/10

## Default palette

The default is the MMV `neko` theme: a low-saturation mint, aqua, leaf and lemon colour field inspired by the material language of the supplied Neko reference, without copying its cat identity or content.

- Brand mint: `#35BFAB`
- Secondary aqua: `#1FC9E7`
- Primary text: `#334F52`
- Secondary text: `#7B888E`
- Ambient lemon: `#EDDD62`
- Ambient mint: `#9EE7D1`
- Ambient leaf: `#84D68A`
- Ambient aqua: `#88E6E5`
- Glass surfaces: translucent white at approximately 40–80%, depending on hierarchy

New visitors start in Neko. A valid theme previously stored under `mmv-theme` remains respected. The original XiaDown-derived packs remain selectable and retain their semantic colour roles.

## Typography

- Site-wide mixed-script stack: `Times New Roman` first for Latin text, followed by `Songti SC`, `SimSun`, `STSong`, then serif for Chinese and remaining glyphs.
- Display, body and interface roles share this stack so language switching does not change the site's voice.
- Shared type ladder: `12 / 14 / 16 / 18 / 24 / 32 / 44px`; no visible interface text may render below 12px.
- Ordinary body copy is 16px at 1.65 line height. Long-form journal copy is 15px at 1.8 line height.
- Essential controls keep at least a 44px target even when their visible label is smaller.

## Shape and spacing

- Base spacing unit: 4px.
- Main rhythm: 8 / 12 / 16 / 24 / 32 / 48px.
- Controls: 12–20px radius; circular and capsule controls use full rounding.
- Glass cards and floating menus: 32–40px radius.
- The three structural columns float above one shared ambient colour field while keeping their existing resize and collapse contracts.
- Primary navigation is fixed and has no shared background block. The active module colour wash reaches the top edge behind it; downward scrolling fades the icons to 14% while preserving their outline, and hover, focus, upward scrolling or Cloud expansion restores them.
- Sidebar section headings do not use decorative index numbers.

## External media cards

- Each preview carries one centered, translated category marker (Book / Film / Music). Provider names and consent explanations never overlay the artwork.
- The clickable card keeps a translated accessible name with the provider context, while the visible surface stays limited to the category marker and play symbol.
- Each selection uses an original, locally stored square preview artwork before consent. The artwork is decorative (`alt=""`); the surrounding translated article label carries the Book / Film / Music meaning.
- Preview artwork: `assets/picks/book-pencil-garden.png`, `assets/picks/film-pencil-rainlight.png`, and `assets/picks/music-pencil-jasmine.png`.
- Media is embedded from Bilibili and is never stored by MMV.
- Third-party players load only after a visitor explicitly asks to play them, reducing initial bandwidth and avoiding an automatic third-party connection on page load.
- Confirmed Book source: Bilibili `BV1aZ4y167bp`, `aid=382415897`, `cid=555406606`, `p=1`.
- Confirmed Film source: Bilibili `BV1kZWVzWEfC`, `aid=115230768105995`, `cid=32489736991`, `p=1`.
- Confirmed Music source: Bilibili `BV1DK4y1G7uX`, `aid=888306970`, `cid=352497928`, `p=1`.

## Home conversation

- The thread is centered at a maximum width of 760px with no enclosing card, masthead, timeline, decorative rule or persistent Enter control.
- Host messages, continuation actions and selectable replies sit on the left. A visitor message appears on the right only after the visitor selects one of those replies; there is no free-form visitor input.
- Appending a visitor reply, typing state, host turn, image or choice never changes the main-stage scroll position programmatically; the visitor keeps full control of the reading position.
- Host avatar: a silver-gray moon cat with jade eyes and jasmine, designed for clear recognition at 42px.
- Visitor avatar: a cream young deer traveller with a linen scarf and blank luggage tag, paired to the host illustration without duplicating it.
- The greeting is computed from local time (early morning, morning, noon, afternoon, evening or late night) and is translated in all four languages.
- The opening introduces NewtNorlly in about twenty short turns grounded in PDF pages 3–6 and 52: Geometry's website / LaTeX / Overleaf introduction, literate programming, the compatibility of programmer / writer / designer identities, recording habits, companions, and the declared reading list. Personal contacts, school, address, family and pending journal material stay private.
- Every “Continue” click creates a new host turn with a fresh NewtNorlly avatar and one new short message, matching an ordinary QQ-style conversation. A turn that offers choices never also offers “Continue”.
- The anniversary is not a modal, card or overlay. It is an ordinary selectable branch, clearly distinguishes the edited relationship material on PDF pages 39–40 from the author's own “柴桑氏曰” on page 41, unfolds one illustrated message at a time, ends with the translated equivalent of “以上就是今天的纪念日茶话了，你还要了解什么？”, and restores the full original choice set.
- Every standard branch similarly ends with a short return question and restores the same choice set. No branch erases earlier conversation.
- Home transitions use the shared 160ms motion token with no more than 6px of vertical travel.

## Right-column mini game

- Public name: 纸上漫游 / Paper Run / Course de papier / Papierlauf.
- Runtime: a local `sandbox="allow-scripts"` iframe constrained to the right column.
- Visuals: MMV paper cat, book piles and ruled-paper scene; no Google, Chrome or Edge names, logos, sounds or branded sprite frames.
- Interaction: click/tap, Space or Arrow Up to jump; closing the right column pauses progression.
- Theme and language are sent from the parent shell with `postMessage`.
- Chromium runner source mechanics are retained as a pinned reference under `third_party/chromium-runner-reference/` with the BSD-style root license, copyright headers and modification notice.

## Journal reading

- The Chinese text extracted from the source PDF, plus the hand-authored site-session entry, remains the canonical record and the permanent per-field fallback.
- Every article has reviewed English, French and German sidecars under `journals/data/i18n/`. Translations preserve the original block order, nicknames, proper nouns, code, rough language and factual detail; they do not silently polish or omit the writer's voice.
- The article bar provides `中 / EN / FR / DE` controls. Switching language updates the date, location, body paragraphs, notes, command blocks, image alternatives, captions, source labels, adjacent-entry dates and accessible navigation labels without reloading the page.
- Missing localized content falls back only for the affected field and is explicitly marked as Chinese for assistive technology. It never blanks the article or forces an all-page fallback.
- Journal cards on the main page localize their location, excerpt, source label and image alternative from the same generated manifest.
- Every Journal card keeps a right-side visual cue. Entries with source images use the first image; text-only entries use an honest ruled-paper excerpt preview built from the entry's localized date and text instead of invented photography.
- Missing or failed source images fall back to the ruled-paper preview, and the compact mobile layout preserves a 44 px preview rather than hiding the visual column.
- Standalone article and archive pages inherit `mmv-theme`, `mmv-mode` and `mmv-language`. Their paper, ink, note, border, accent and media surfaces are derived from the same 13 XiaDown/MMV palettes; changes in another open tab are synchronized through storage events.
- `tools/build_journals.py` is the source of truth for generated HTML, `journal.css`, `journal.js` and manifests. The frozen `journal-themes.js` palette mirrors the root theme registry exactly. Body nodes keep stable block indices, and `tools/verify_journal_i18n.py` verifies all locale, block, image and theme-runtime contracts after a rebuild.

## Album gallery

- Seven translated books are presented in this order: Portraits, Everyday Life, Animals, Archives, Illustrations, Comics, and Landscapes.
- Every book opens with six works in a three-column, two-row desktop grid. The renderer has no six-item ceiling: newly declared works continue into later rows.
- The album opens directly on the book tabs, without a visible module heading, outer divider, book-level summary, or “works per row” counter. Titles, scene labels, and explanations remain attached to individual works.
- Six unpublished DOM slots are always kept hidden after the final declared work. They document the next two rows of capacity without exposing empty cards to visitors.
- Theme-coloured veils soften every resting thumbnail; hover, keyboard focus, and press reveal the original artwork clearly.
- Selecting a work opens a native modal viewer with its translated title, scene, caption, position, previous/next controls, keyboard navigation, backdrop close, and focus restoration.
- Album choice persists under `mmv-album-book`. Language changes rerender all live labels and artwork descriptions; light and dark themes inherit the existing semantic colour tokens.
- The initial 42 works are original, locally stored 4:3 or 3:2 watercolor-and-coloured-pencil WebP artworks, consistently framed by 4:3 gallery cards. Portrait subjects are explicitly adult; archive works are artistic reconstructions rather than primary historical records.
- Extension instructions and the shared art direction live in `assets/album/README.md`.

## Motion

- Fast: 110ms
- Base: 160ms
- Slow: 240ms
- Expressive: 360ms
- Standard easing: `cubic-bezier(0.2, 0, 0.38, 0.9)`
- Enter easing: `cubic-bezier(0.12, 0, 0.32, 1)`
- Reduced-motion mode collapses decorative movement while keeping every state change understandable.

## Asset inventory

- Neko design reference: `https://lvyovo-wiki.tech/` and `/blog`, plus the two user-supplied screenshots
- Retained, inactive historical font asset: `assets/fonts/averia-gruesa-libre-latin.woff2`
- Retained historical font license: `assets/fonts/Averia-Gruesa-Libre-OFL.txt`
- XiaDown theme source: `参考资料/xiadown-main/frontend/src/shared/styles/xiadown-theme.ts`
- XiaDown appearance reference: `参考资料/xiadown-main/images/appearance.webp`
- Journal source: `参考资料/朝花夕拾小故事（乙巳年第壹册）.pdf`
- Book / Film / Music embeds: confirmed
- Book / Film / Music outer card art: three original local watercolor-and-colored-pencil PNG previews under `assets/picks/`; artwork contains no text, while the centered translated Book / Film / Music label remains live UI text.
- Original Home host avatar, generated for this project with the built-in image generator: `assets/avatars/host-mooncat.png`
- Original Home visitor avatar, generated for this project with the built-in image generator: `assets/avatars/guest-little-deer.png`
- Album collection: 42 original local WebP artworks under `assets/album/`, six in each of seven books; source scenes and four-language captions are declared in `album-data.js`.
- Formal MMV logo or wordmark: pending
- Mini-game runtime: `game/`
- Chromium license/reference: `third_party/chromium-runner-reference/`
