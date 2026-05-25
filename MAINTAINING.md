# Maintaining this bundle

This is the **published mirror** of HTML visuals from `mechatronics/study/docs/{ee,me,em}/visuals/` and `_extras/` in the source workspace. The source is canonical; this bundle is a derivative.

Live site: <https://n0xide.github.io/mechatronics-visuals/>

## When editing — direction matters

- **Edit in the source workspace first**, then mirror the change into this bundle.
- The bundle's `index.html` has a `VISUALS` data array that lists every visual by `{discipline, phase, filename, title, description}`. When you add/remove/rename a visual, update this array.
- The folder layout here is flat: `ee/phase-N-xxx/file.html`. The source workspace nests under `docs/<disc>/visuals/phase-N-xxx/file.html` — drop the `docs/` and `visuals/` parts when mirroring.
- The `_extras/` folder in the source becomes `extras/` here (leading underscore breaks GitHub Pages' Jekyll layer).

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
<workspace-root>/mechatronics/study/docs/_extras/
```

See `docs/publish-pattern.md` in the source workspace for the canonical round-trip workflow agents follow.
