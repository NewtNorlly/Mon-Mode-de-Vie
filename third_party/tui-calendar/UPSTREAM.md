# TUI Calendar provenance

MMV vendors the browser distribution from the user-provided source tree:

- Source snapshot: `C:\Users\47661\Downloads\tui.calendar-master`
- Package: `tui-calendar`
- Version: `1.13.0`
- Upstream repository declared by the package: `https://github.com/nhn/tui.calendar.git`
- License: MIT; see `LICENSE`
- Telemetry is disabled in MMV with `usageStatistics: false`
- Creation and detail popups are disabled; MMV uses the calendar as a read-only public view

Vendored upstream files:

- `tui-calendar.min.js` — SHA-256 `0C95BBB4457C71235BC612BB70166B113409C5313D4FACC0642067F750D7BA7E`
- `tui-calendar.min.css` — SHA-256 `385643272BE54AF7F386200B2C207C131698E30B2C12DDD8A3A68D3818642087`

## Required dependency

The TUI Calendar UMD build keeps `tui-code-snippet` external. MMV vendors the exact version locked by the supplied `package-lock.json`:

- Package: `tui-code-snippet`
- Version: `1.5.2`
- Registry archive: `https://registry.npmjs.org/tui-code-snippet/-/tui-code-snippet-1.5.2.tgz`
- Archive SHA-512: `E94A9395069A0B528B7260B41C0A2AE5DB65D46E0589BF91F8D0BBA66695EE4888959EC9A8A8549A73A819172B780CB377CD544CAFEF0AF86BC3D409B24A4215`
- Lockfile integrity verification: passed
- Browser file: `vendor/tui-code-snippet.min.js`
- Browser file SHA-256: `DECA28158C01C4363AB7F4F11356C3967A0C4DFDC1C1A1963CC3201703E3C48E`
- License: MIT; see `licenses/tui-code-snippet.LICENSE`

MMV-specific theming, localization, navigation, and the custom twelve-month year overview live in the project `script.js` and `calendar.css`; upstream minified files are kept unchanged.
