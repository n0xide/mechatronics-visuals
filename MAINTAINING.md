# Maintaining this bundle

This is the **published mirror** of HTML visuals from `mechatronics/study/docs/{ee,me,em}/visuals/` and `extras/` in the source workspace. The source is canonical; this bundle is a derivative.

Live site: <https://n0xide.github.io/mechatronics-visuals/>

## When editing — direction matters

- **Edit in the source workspace first**, then mirror the change into this bundle.
- The bundle's `index.html` has a `VISUALS` data array that lists every visual by `{discipline, phase, filename, title, description}`. When you add/remove/rename a visual, update this array.
- The folder layout here is flat: `ee/phase-N-xxx/file.html`. The source workspace nests under `docs/<disc>/visuals/phase-N-xxx/file.html` — drop the `docs/` and `visuals/` parts when mirroring.
- The source `extras/` folder mirrors directly to bundle `extras/` (it used to be named `_extras/` in source — the leading underscore was a convention violation; promoted on 2026-05-27).

## Before pushing — integrity checklist

```bash
# 1. No .md hrefs anywhere (those won't render on Pages)
grep -rcE 'href="[^"]+\.md"' . --include='*.html' | awk -F: '$2>0'

# 2. Every visual path in the SPA data array resolves on disk
python -c "
import re, os
content = open('index.html', encoding='utf-8').read()
m = re.findall(r'\{d:\"([a-z]+)\",p:(\d+),ps:\"([^\"]*)\",f:\"([^\"]+)\"', content)
miss = [('extras/' if d=='extras' else f'{d}/{ps}/') + f for d,p,ps,f in m
        if not os.path.exists(('extras/' if d=='extras' else f'{d}/{ps}/') + f)]
print(f'{len(m)-len(miss)} / {len(m)} resolve' + (f' — MISSING: {miss[:5]}' if miss else ''))
"

# 3. JS brace balance in index.html
awk '/<script>/{p=1;next}/<\/script>/{p=0}p' index.html | \
  awk '{for(i=1;i<=length;i++){c=substr($0,i,1); if(c=="{")o++; else if(c=="}")cl++}} END{print "{}", o, "/", cl}'
```

All three should pass before `git push`.

## Adding a new visual

1. Add the source `.html` in the source workspace under `mechatronics/study/docs/<disc>/visuals/phase-N-xxx/`.
2. Copy the file into this bundle at `<disc>/phase-N-xxx/<file>.html`.
3. Open `index.html` here, add a new entry to the `VISUALS` array:
   ```js
   {d:"ee",p:1,ps:"phase-1-dc-circuits",f:"new-visual.html",t:"Display Title",x:"One-line description."},
   ```
4. If the phase didn't exist before, also extend the `PHASES` object near the top of the script.
5. Run the integrity checklist above.
6. `git add -A; git commit -m "Add: <visual-name>"; git push`
7. Pages rebuilds in ~30s.

## Adding a whole new discipline or extras page

- Add to `DISC_ORDER`, `DISC_LABELS`, and `PHASES` in `index.html`.
- Mirror its CSS color class (`--ee`, `--me`, `--em`, `--extras` — add a new one if needed).
- The grid view and sidebar tree both pick up new disciplines automatically once the data is in.

## Footer back-links in visuals

Every visual in this bundle has a footer link with `target="_top"` going back to `../../index.html`. That's how clicking "back" inside an iframe-loaded visual returns to the SPA shell at the top level. Preserve that pattern when adding new visuals — don't strip the `target="_top"`.

## Cross-link path conventions (read before adding cross-track links)

The bundle layout is flat — `visuals-spa/<track>/<phase>/file.html`. The source layout has an extra segment — `docs/<track>/visuals/<phase>/file.html`. **Cross-links use bundle-relative paths**, which means the same `href` string resolves correctly in the bundle but not in the source-direct view. This is intentional: the bundle is what gets served; source-direct browsing of cross-track links is a non-goal.

Conventions for a visual at `<track>/<phase>/X.html`:

| Target | href format | Source-direct works? |
|---|---|---|
| Same phase, same track | `Y.html` | yes |
| Different phase, same track | `../phase-N-foo/Y.html` | yes |
| Different track | `../../<track>/phase-N-foo/Y.html` | no (resolves to `docs/<track>/<phase>/<other-track>/...`) |
| `extras/` from a phase visual | `../../extras/Y.html` | no (same reason) |
| Another extras from extras | `Y.html` | yes |
| Phase visual from an extras | `../<track>/phase-N-foo/Y.html` | no |

Validate after editing: run `node mechatronics/study/_audit_links.js` from the study root. It walks every source `.html`, categorizes its links, and reports which resolve in source vs bundle. The "true orphans" line (broken in both) must stay at 0; the "break in source only" count is expected to grow as the catalog grows.

## Deep-linking — URL-hash state pattern

Visuals built in May 2026 round 4 onward support shareable URLs: every slider value is encoded in the URL hash, so you can paste a link and land at the exact configuration. The pattern is ~12 lines of JS per visual.

```js
const SLIDERS = ['sliderId1','sliderId2','dropdownId',...];   // ID list of state-bearing controls

function loadHash(){
  const params = new URLSearchParams(location.hash.slice(1));
  for(const id of SLIDERS){
    const v = params.get(id);
    if(v !== null) document.getElementById(id).value = v;
  }
}
function saveHash(){
  const params = new URLSearchParams();
  for(const id of SLIDERS){ params.set(id, document.getElementById(id).value); }
  history.replaceState(null, '', '#' + params.toString());
}

// In render(): call saveHash() first
// On script load: loadHash() then render()
```

Add a "Share this configuration: [copy link]" affordance to the page (CSS class `.share` already styled). Helpful for teaching and bug reports — `<a onclick="navigator.clipboard?.writeText(location.href)">`.

Visuals with this pattern as of 2026-05-27: snubber-deep, gain-scheduling, imu-fusion, composites-laminate, secure-boot-ota, llc-resonant, refrigeration-cycle, fmea-fault-tree, lyapunov-stability, euler-buckling. To add to an existing visual, copy the helper functions + add the SLIDERS list at the top of `<script>`.

## Practice-quiz pattern

A self-contained "Check yourself" quiz block can be added at the end of any visual (before the `<footer>`). Pattern is a `<section class="quiz" id="quiz">` with `<div id="quizMount"></div>`, followed by a `<style>` block of `.quiz-*` rules and an inline `<script>` IIFE that:

- builds a `QUESTIONS` array of `{q, a[], correct, why}` objects
- keys state by `'quiz:' + location.pathname.replace(/.*\//,'')` so localStorage tracks per-visual answers
- renders each card; on click, locks in the choice, colors ✓/✗, shows the `why` explanation
- shows a final score + "Try again" button once all questions are answered

Three questions per visual is the target — enough to anchor the takeaway, short enough to skip. Distractors should be plausible (common student mistakes, off-by-one factors, swapped numerator/denominator), not nonsense. The `why` field is the teaching moment — even a right answer benefits from the one-line explanation.

Visuals with the quiz pattern as of 2026-05-28: voltage-divider-explorer, ohms-law-explorer, rlc-resonance, pid-explorer, mohrs-circle, kvl-kcl-explorer, series-parallel-explorer, thevenin-norton-explorer, rc-rl-time-constant, capacitor-explorer, inductor-explorer, stress-strain, fbd-builder, axial-stress-strain, wheatstone-bridge (15 total — heavy weighting on starter topics so beginners get checkpoint questions early in each track). To add to a new visual, copy the entire block from `voltage-divider-explorer.html` (everything between `<section class="quiz"...>` and the closing `</script>`) and rewrite the `QUESTIONS` array. The CSS uses the same `--bg-elev`, `--accent`, `--warn` variables every visual already has, so no theme work needed.

## Special files — intentional source/bundle drift

These five `extras/` files have **bundle copies that are NOT verbatim mirrors of source**. The bundle versions are hand-rewritten to render correctly inside the SPA iframe (back-links use `target="_top"` and `../index.html`; phase-deep links use `../index.html#<disc>-<n>` anchors instead of `../<track>/phase-N-...md` paths). A naive `cp` from source over bundle for these files will clobber those rewrites and break the bundle.

- `extras/study-path.html`
- `extras/circuits-cookbook.html`
- `extras/constants-units.html`
- `extras/antenna-calculator.html`
- `extras/filter-designer.html`

**Why these and not other extras:** `_publish.js`'s `.md`→`index.html` rewrite hardcodes `../../index.html`, which is correct only for phase visuals (2 dirs deep, `<disc>/phase-N/`). Files in `extras/` are 1 dir deep and need `../index.html`; they also carry hand-authored SPA anchors (`#ee-9`, `#ee-3`) the rewrite can't derive from a bare `.md` filename. **Any extras file that contains a `.md` link must be in `_publish.js`'s `DRIFT_FILES` set** — otherwise the next publish silently breaks its curriculum back-link. (As of 2026-06, that's exactly these five; `grep -l 'href="[^"]*\.md"' extras/*.html` in source lists them.)

If you edit the source of any of these, manually re-apply the link rewrites in the bundle copy (or skip the mirror and accept the drift). Long-term fix would be a depth-aware rewrite in `_publish.js` that also maps `.md` filenames to their SPA anchors; for now these files are edited independently.

## Style is local

This bundle uses a dark monospace theme — CSS variables `--bg`, `--accent`, `--ee`, `--me`, `--em`, `--extras`, etc. live inline in `index.html` and in each visual's `<style>` block.

The full template is at `mechatronics/study/docs/_visuals-template.html` in the source workspace. If you change the theme there, also propagate the change to every visual (and to the SPA's CSS in `index.html`). 162 inline copies is intentional — keeps each visual openable from `file://` without a server.

**Do NOT** copy in styles from sibling bundles (e.g., `arm-6dof-pa612-visuals` has its own look; don't merge).

## What lives where

| File | Purpose |
|---|---|
| `index.html` | The SPA + card-grid (812 lines, includes 162-entry `VISUALS` array) |
| `README.md` | Public-facing description of the bundle |
| `LICENSE` | MIT |
| `MAINTAINING.md` | This file |
| `ee/` `me/` `em/` `extras/` | The 162 visuals + 3 reference pages |

## Source workspace

These visuals are derived from a personal mechatronics study workspace. The source path is:

```
<workspace-root>/mechatronics/study/docs/{ee,me,em}/visuals/
<workspace-root>/mechatronics/study/docs/extras/
```

See `docs/publish-pattern.md` in the source workspace for the canonical round-trip workflow agents follow.
