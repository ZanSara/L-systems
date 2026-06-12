# L-Systems Explorer (plain HTML + JS edition)

An interactive [L-System](https://en.wikipedia.org/wiki/L-system) editor and
visualizer, reimplemented from the Vue app in this repository as **plain
HTML + JavaScript with zero dependencies** — no framework, no build step, no
npm install.

Originally forked from <https://anvaka.github.io/lsystem> by Andrei Kashcha.
L-Systems themselves are described very well on
[Paul Bourke's website](http://paulbourke.net/fractals/lsys/).

## Running

Open `index.html` in a browser. That's it — everything is loaded with classic
`<script>` tags, so it also works straight from the filesystem (`file://`).
If you prefer a local server:

```sh
python3 -m http.server   # then visit http://localhost:8000
```

## Using the app

- Type an L-system definition in the editor; the drawing re-renders ~300 ms
  after you stop typing. Parse errors appear in a red banner below the editor.
- **Shift+Up / Shift+Down** with the cursor on a number nudges it by ±1 and
  re-renders immediately — great for animating angles.
- **Pan** by dragging the canvas, **zoom** with the mouse wheel or a pinch
  gesture. Until you touch the camera, the view automatically follows the
  growing drawing.
- The URL always reflects the current system (`?code=...`), so you can share
  a link to whatever you made.
- **Pick from Examples** loads a random entry from the album of well-known
  systems (also browsable in the list at the bottom of the sidebar). Entries
  marked with a **duplicate** badge define exactly the same system as an
  earlier entry; a **variant** badge means the same fractal with different
  colors, depth or angle. Hover a badge to see which entry it matches.
- **Random Values** generates a brand new random L-system.
- **Stop Generation** halts an in-progress drawing.
- **Save as SVG** lets you drag/resize a selection rectangle over the canvas
  and downloads that region as an SVG file.
- The view controls adjust the line width, toggle a reference grid, and
  rotate the canvas.
- The ☀/☾ button in the bottom-right corner switches between dark and light
  themes (remembered across visits). SVG export uses whichever theme is
  active.

## Definition syntax

A definition is a list of sections. Each section is a `key: value` line;
`rules:` and `actions:` are followed by one `SYMBOL => value` line per entry.
Lines starting with `//` are comments.

```
axiom: X
rules:
  X => -YF+XFX+FY-
  Y => +XF-YFY-FX+

depth: 5
angle: 90
```

| Section | Meaning |
| --- | --- |
| `axiom` | initial state of the system |
| `rules` | rewrite rules applied on each iteration |
| `depth` | how many times the rules are applied (default 5) |
| `angle` | default rotation angle in degrees for `+` and `-` (default 60) |
| `actions` | graphic commands triggered by matching characters (see below) |
| `width` | width in pixels of the drawn line |
| `color` | line color; accepts CSS names and hex (`blue`, `#0000ff`) |
| `stepsPerFrame` | actions executed per animation frame (default 42); `-1` renders everything at once |
| `direction` | initial heading as `x, y, z` |
| `position` | initial position as `x, y, z` |

Available actions:

| Action | Meaning |
| --- | --- |
| `draw(x)` | draw `x` units in the current direction (default 10) |
| `move(x)` | move `x` units without drawing |
| `rotate(deg)` | rotate the heading around the Z axis |
| `rotateX(deg)` / `rotateY(deg)` | rotate around the X / Y axis |
| `push()` / `pop()` | save / restore position, heading and color |
| `setColor(color)` | change the current line color |
| `swapAngle()` | swap the meaning of `+` and `-` |

These actions are bound by default (with `angle` substituted):

```
actions:
  F => draw(10)
  f => move(10)
  + => rotate(60)
  - => rotate(-60)
  & => swapAngle()
  [ => push()
  ] => pop()
```

The turtle state is fully 3D (so `rotateX`/`rotateY` and 3D `direction`
vectors work), but the rendering projects everything onto the XY plane — the
viewer is strictly 2D.

If the expanded system exceeds 1,000,000 characters, expansion stops and a
warning is shown; the first million characters are still rendered.

## Adding your own examples

The album lives in `examples.js` — it's a plain-text list wrapped in a single
JavaScript string, so the app keeps working straight from `file://`. To add
an example, open the file and append at the end (just before the closing
backtick):

```
---
// My Fractal
axiom: F
rules:
 F => F+F--F+F

depth: 4
angle: 60
```

Examples are separated by lines containing only `---`, and the first `// ...`
comment of each one becomes its display name in the sidebar. Only one rule:
don't use backticks or `${` inside an example, since they would terminate the
JavaScript string that wraps the album.

Duplicates are detected automatically when the list is built, so if your new
entry matches an existing system it gets a badge too.

## Code layout

| File | Role |
| --- | --- |
| `index.html` | page markup: sidebar, controls, canvas, selection overlay |
| `style.css` | the "blueprint" theme (dark + light) |
| `examples.js` | **user-editable** album of example systems (plain text in a JS string) |
| `js/parser.js` | parses the definition language into a settings object |
| `js/turtle.js` | 3D turtle that emits line segments |
| `js/lsystem.js` | rule expansion, action compilation, incremental render iterator |
| `js/scene.js` | Canvas 2D renderer: camera, animation loop, grid, SVG export |
| `js/album.js` | splits `examples.js` into the list and flags duplicates |
| `js/random.js` | random system generator |
| `js/app.js` | UI wiring, URL state, editor behavior |

The flow is: `app.js` reads the editor → `parser.js` produces a settings
object → `scene.setSystem()` builds an `LSystem` (which expands the axiom and
creates a `Turtle`) → a `requestAnimationFrame` loop advances the system a
few actions per frame, and the turtle's segments are drawn incrementally.

## Differences from the Vue version

- **No framework, no build, no dependencies.** Vue, CodeMirror, w-gl,
  tinycolor and query-state are replaced by a textarea, Canvas 2D,
  native CSS color strings and `URLSearchParams`.
- **Canvas 2D instead of WebGL**, and the camera is strictly 2D (the
  original already disallowed 3D camera rotation).
- **Simpler SVG export** — it renders the active theme directly instead of
  asking which theme(s) to save.
- **Auto-fit camera**: the view follows the drawing until you pan or zoom,
  so systems that wander off-screen stay visible.
- **Better "Random Values"**: continuous angles (not just 45/60/90),
  branching rules, varied axioms, and color actions that are actually
  referenced by the generated rules.
- Bug fixes: the `axiom`/`start` parser inconsistency is gone, parser errors
  report 1-based line numbers, and a missing `rules` section no longer
  crashes rendering.
