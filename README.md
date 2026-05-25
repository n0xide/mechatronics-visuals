# Curriculum Visuals

162 self-contained interactive HTML visuals spanning a complete EE / ME / EM
deep-dive curriculum for mechatronics and robotics learners — plus 3
supplementary reference pages. Every file is offline-capable: open `index.html`
in any modern browser, no server or build step required.

**Live site:** <https://n0xide.github.io/mechatronics-visuals/>

## What's inside

| Discipline | Phases | Visuals |
|---|---|---|
| **EE** — Electrical | 9 | 55 |
| **ME** — Mechanical | 9 | 48 |
| **EM** — Electro-Mechanical (robotics bridge) | 8 | 56 |
| **Extras** — Study path · Cookbook · Constants | — | 3 |
| **Total** | **26 phases** | **162** |

Every visual ships with an interactive figure (sliders, plots, animations) plus
a built-in cheat sheet (formulas / memorize-cold / common pitfalls).

## How to use

**Online** — open the live URL above.

**Offline** — clone or download the repo and open `index.html`:

```bash
git clone https://github.com/n0xide/mechatronics-visuals.git
cd mechatronics-visuals
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

The landing page is a card-grid index. Click any card to open the visual in
the in-page viewer. The left sidebar gives a collapsible tree with search,
and keyboard navigation works throughout.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `/` | Focus search box |
| `Esc` | Clear search / close mobile sidebar |
| `j` `↓` `n` | Next visual |
| `k` `↑` `p` | Previous visual |
| `r` | Random visual |
| `o` | Open current visual in new tab |
| `g` `h` | Return to grid (home) view |
| `1`–`4` | Jump sidebar to EE / ME / EM / Extras |
| `?` | Toggle keyboard-shortcut help |

## Deep linking

Every visual has a stable URL fragment. Bookmark or share any visual:

```
index.html#em/phase-4-feedback-control/pid-explorer
index.html#me/phase-7-mechanisms-kinematics/four-bar-grashof
index.html#extras/study-path
```

## Highlights

A few of the more ambitious visuals worth opening first:

- **★ PID Explorer** (`em/phase-4-feedback-control/pid-explorer.html`) —
  mass-spring-damper plant with live Kp / Ki / Kd sliders, anti-windup,
  D-on-measurement, and saturation handling
- **Forward & Inverse Kinematics** (`em/phase-8-robotics-mechatronics/`) —
  2-link planar arm with workspace envelope and singularity visualisation
- **FOC Overview** (`em/phase-3-motor-control/foc-overview.html`) —
  full Clarke + Park + dual-PI + SVPWM block diagram with rotating-frame intuition
- **Kalman Filter** (`em/phase-4-feedback-control/kalman-filter.html`) —
  predict/update cycle with Gaussian fusion + complementary-filter comparison
- **Smith Chart Matching** (`ee/phase-9-rf-wireless/matching-smith.html`) —
  L-network impedance match with live VSWR readout
- **📍 Study Path** (`extras/study-path.html`) — recommended order through the
  26 phases plus a robotics critical-path callout

## Structure

```
.
├── index.html                          ← the unified SPA + card grid
├── README.md                           ← this file
├── LICENSE                             ← MIT
├── ee/                                 ← Electrical (55 visuals across 9 phases)
│   ├── phase-1-dc-circuits/
│   ├── phase-2-passive-components/
│   └── …
├── me/                                 ← Mechanical (48 / 9)
├── em/                                 ← Electro-Mechanical (56 / 8)
└── extras/                            ← Reference pages (3)
    ├── study-path.html
    ├── circuits-cookbook.html
    └── constants-units.html
```

## Technical notes

- **Self-contained:** every visual has its CSS and JS inline. No CDN, no
  webfonts, no images, no build step.
- **Offline-first:** all paths are relative. Works from `file://` URLs, from
  a USB stick, from any static host, or from a `python -m http.server`.
- **Dark theme:** all visuals share a single dark colour palette (defined in
  `_visuals-template.html` in the source workspace — the visuals here are the
  rendered output).
- **Total size:** ~4 MB across 163 HTML files.

## License

Released under the [MIT License](LICENSE). The visuals are educational
artefacts; the curriculum itself is the author's personal study material.

## Source

These visuals are generated from a personal study workspace at path
`mechatronics/study/docs/`. The bundle here is the published-static form;
the workspace is where new visuals get added before being re-exported here.
