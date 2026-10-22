// Study notes, grouped by stack. Each page is a list of blocks:
//   { type: 'text', text }  — RichText markup (`code`, **bold**, "- " bullets, ``` fences)
//   { type: 'table', caption?, columns: [...], rows: [[...], ...] }  — cells support `code` / **bold**

const TEXT =
  'Floats were added to CSS so text could flow around a picture, the way it does in a printed newspaper. The lines next to the float get shorter, then return to full width once they pass its bottom edge. Keep reading and you will see the text wrap back underneath the image. ';

const FLOATS_PAGE = {
  id: 'css-floats',
  title: 'Floats',
  blocks: [
    {
      type: 'text',
      text: "**Where floats come from.** Print designers have always wrapped text around photos: newspapers and magazines call it a *runaround*. A photo sits at the edge of a column and the text flows beside it and continues underneath, so the reader never loses their place, the column keeps its width, and no space is wasted. Early browsers copied this with `<img align=\"left\">`, and CSS1 (1996) standardized it as `float`.\n\nFor about 15 years floats were then (ab)used for whole-page layouts — columns, grids, navbars — because nothing better existed. That era gave us clearfix hacks and collapsing parents. Flexbox and Grid replaced that job, and floats went back to what they were designed for: **letting inline content wrap around a box**.",
    },
    {
      type: 'demo',
      caption: 'The original use case: text wrapping around an image',
      html: `<div class="img photo">photo</div>\n<p>${TEXT}${TEXT}</p>`,
      css: '.photo {\n  float: left;\n  width: 120px;\n  height: 90px;\n  margin: 0 12px 6px 0;\n}\np { margin: 0; }',
      height: 210,
    },
    {
      type: 'text',
      text: "## The DNA of a float\n\n- **Shifted to the left or right** edge of its containing block, and placed as high as possible.\n- **Out of flow for block boxes, but not for text.** Following block boxes act as if the float isn't there (their backgrounds and borders run *under* it), but their **line boxes are shortened** so the text goes around it. This split is the single most important fact about floats.\n- **Blockified.** `display: inline` computes to `block` (and `inline-flex` to `flex`), so a floated `<span>` accepts `width`, `height` and vertical margins.\n- **Shrink-to-fit.** With `width: auto`, a float is only as wide as its content (up to the available width).\n- **Source order is kept vertically.** A float can't be placed higher than an earlier float, or higher than the line containing content that came before it in the source.\n- **Margins of floats never collapse** with anything.\n- **The parent doesn't grow to contain floats** unless the parent establishes a block formatting context (BFC). This is the \"collapsed parent\" bug.\n- **Ignored when it can't apply:** on `position: absolute`/`fixed` elements `float` computes to `none`, and on flex or grid items it has no effect.\n- **Logical values** `float: inline-start` / `inline-end` follow the writing direction, so they flip correctly in right-to-left languages.",
    },
    {
      type: 'demo',
      caption: 'Block boxes ignore the float; only their lines of text move aside',
      html: '<div class="img photo">float</div>\n<p class="box">This paragraph has a background and a dashed border. Its <b>box</b> starts at the left edge, underneath the float. Only its <b>lines of text</b> move aside to make room.</p>',
      css: '.photo {\n  float: left;\n  width: 120px;\n  height: 80px;\n  opacity: 0.85;\n}\n.box {\n  margin: 0;\n  background: #fef3c7;\n  border: 2px dashed #d97706;\n}',
      height: 150,
    },
    {
      type: 'demo',
      caption: 'Image and image: one floated left, one floated right, text runs between them',
      html: `<div class="img left">left photo</div>\n<div class="img right">right photo</div>\n<p>${TEXT}${TEXT}${TEXT}</p>`,
      css: '.left, .right { width: 110px; height: 90px; }\n.left { float: left; margin: 0 12px 6px 0; }\n.right { float: right; margin: 0 0 6px 12px; }\np { margin: 0; }',
      height: 250,
    },
    {
      type: 'demo',
      caption: 'Several floats line up side by side, and wrap — or get "snagged" on a taller one',
      html: '<div class="wrap">\n  <div class="img tall">1 (tall)</div>\n  <div class="img">2</div>\n  <div class="img">3</div>\n  <div class="img">4</div>\n</div>',
      css: '.wrap {\n  width: 320px;\n  display: flow-root;\n  outline: 1px dashed #999;\n}\n.wrap .img {\n  float: left;\n  width: 100px;\n  height: 60px;\n  margin: 2px;\n}\n.wrap .tall { height: 120px; }',
      height: 160,
    },
    {
      type: 'text',
      text: 'Item 4 has no room on the first row, so it moves down. It stops at the first spot where it fits — next to the tall float, not back at the left edge. This "staircase" effect is why float-based grids broke whenever one card was taller than the others.',
    },
    {
      type: 'text',
      text: '## The collapsed parent, and how to contain floats\n\nA parent only wraps around its **in-flow** content. If all its children are floats, its height collapses to just its padding and border — exactly the 4px "line" from the gallery question.',
    },
    {
      type: 'demo',
      caption: 'Same markup: the parent collapses, then display: flow-root contains the floats',
      html: '<div class="gallery">\n  <div class="img pic">A</div>\n  <div class="img pic">B</div>\n</div>\n<p>↑ border collapsed to a line</p>\n\n<div class="gallery fixed">\n  <div class="img pic">A</div>\n  <div class="img pic">B</div>\n</div>\n<p>↑ with display: flow-root</p>',
      css: '.gallery { border: 2px solid #4f46e5; }\n.pic {\n  float: left;\n  width: 80px;\n  height: 60px;\n  margin: 6px;\n}\n.fixed { display: flow-root; }\n/* clear: both stops the captions wrapping beside the floats */\np { clear: both; margin: 4px 0 14px; font-size: 13px; }',
      height: 230,
    },
    {
      type: 'table',
      caption: 'Ways to make a parent contain its floats',
      columns: ['Method', 'Why it works', 'Side effects'],
      rows: [
        ['`display: flow-root`', 'Creates a new BFC, and a BFC always contains its floats.', 'None. This is what it was made for — the modern answer.'],
        ['`overflow: hidden` / `auto`', 'Any `overflow` other than `visible`/`clip` creates a BFC.', '`hidden` clips shadows, dropdowns and focus rings; `auto` can show scrollbars.'],
        ['clearfix: `.parent::after { content: ""; display: block; clear: both; }`', 'Adds an in-flow last child that clears the floats, so the parent must grow to include it.', 'Works everywhere, but it\'s extra CSS. Legacy code uses `display: table` instead of `block`.'],
        ['`display: flex` or `grid` on the parent', 'The children become flex/grid items, and `float` stops applying to them.', "It's a different layout entirely — the floats are no longer floats."],
        ['Floating the parent too', 'A float contains its floated children.', 'The parent shrink-wraps, and the same problem moves one level up.'],
        ['A fixed `height`', 'The parent just has a height.', 'Breaks as soon as the content changes size. Avoid.'],
      ],
    },
    {
      type: 'text',
      text: '## `clear`: start below the floats\n\n`clear: left | right | both` moves an element down until its top border edge is below the earlier floats on that side. Typical use: a heading that should start a new section instead of wrapping beside an image. `clear` only looks at floats that come **earlier in the source** and are in the **same BFC**.',
    },
    {
      type: 'demo',
      caption: 'The heading clears the float instead of squeezing beside it',
      html: `<div class="img photo">photo</div>\n<p>A short intro paragraph.</p>\n<h3 class="next">Next section (clear: left)</h3>\n<p>${TEXT}</p>`,
      css: '.photo {\n  float: left;\n  width: 110px;\n  height: 100px;\n  margin-right: 12px;\n}\np { margin: 0 0 8px; }\n.next {\n  clear: left;\n  margin: 8px 0;\n}',
      height: 250,
    },
    {
      type: 'text',
      text: '## A BFC next to a float: the "media object"\n\nAn element that establishes a BFC (for example with `display: flow-root`) **never overlaps a float**. Instead of letting its text wrap underneath, its whole box narrows and sits beside the float. That\'s the classic avatar + comment layout.',
    },
    {
      type: 'demo',
      caption: 'Without a BFC the text wraps under the avatar; with flow-root it stays in a column',
      html: '<div class="media">\n  <div class="img avatar">img</div>\n  <div class="body">A long comment that wraps onto several lines, so you can see where the second and third lines go relative to the avatar.</div>\n</div>\n\n<div class="media">\n  <div class="img avatar">img</div>\n  <div class="body bfc">A long comment that wraps onto several lines, so you can see where the second and third lines go relative to the avatar.</div>\n</div>',
      css: '.media {\n  display: flow-root;\n  width: 300px;\n  margin-bottom: 14px;\n}\n.avatar {\n  float: left;\n  width: 48px;\n  height: 48px;\n  margin-right: 10px;\n  border-radius: 50%;\n}\n.body { background: #ecfdf5; }\n.bfc { display: flow-root; }',
      height: 260,
    },
    {
      type: 'text',
      text: '## Magazine tricks floats still do best\n\n`shape-outside` only works on floats. It lets the text follow a shape (a circle, a polygon, or the transparent edges of an image) instead of the float\'s rectangle. `shape-margin` adds space between the shape and the text.',
    },
    {
      type: 'demo',
      caption: 'Text wrapping around a circle with shape-outside',
      html: `<div class="circle"></div>\n<p>${TEXT}${TEXT}</p>`,
      css: '.circle {\n  float: left;\n  width: 140px;\n  height: 140px;\n  border-radius: 50%;\n  background: #c7d2fe;\n  shape-outside: circle(50%);\n  shape-margin: 12px;\n}\np { margin: 0; }',
      height: 210,
    },
    {
      type: 'demo',
      caption: 'A newspaper-style drop cap: a floated ::first-letter',
      html: `<p>${TEXT}${TEXT}</p>`,
      css: 'p { margin: 0; }\np::first-letter {\n  float: left;\n  font-size: 3.4em;\n  line-height: 1;\n  font-weight: 700;\n  margin: 2px 8px 0 0;\n  color: #4f46e5;\n}',
      height: 170,
    },
    {
      type: 'text',
      text: 'The newer `initial-letter` property does drop caps without manual tuning, but it isn\'t supported in every browser yet, so a floated `::first-letter` is still the portable way.',
    },
    {
      type: 'table',
      caption: 'Floats today: when to use them, and when not',
      columns: ['Job', 'Use', 'Why'],
      rows: [
        ['Text wrapping around an image or pull quote', '`float`', 'The only layout feature that makes **text** flow around a box.'],
        ['Text following a non-rectangular shape', '`float` + `shape-outside`', '`shape-outside` only works on floats.'],
        ['Drop caps', 'floated `::first-letter` (or `initial-letter`)', 'Portable and simple.'],
        ['A row of cards or a navbar', 'Flexbox', 'No clearing, no staircase, alignment built in.'],
        ['A page grid or a gallery', 'Grid', 'Rows and columns that stay aligned regardless of content height.'],
        ['Centering something', 'Flexbox / Grid / `margin: auto`', '`float: center` does not exist.'],
        ['Icon next to text', 'inline-flex/flex + `align-items: center`', 'A float would make the text wrap under the icon on the second line.'],
      ],
    },
  ],
};

export const NOTEBOOK = [
  {
    stack: 'html',
    label: 'HTML',
    pages: [
      {
        id: 'html-intro',
        title: 'Introduction',
        blocks: [
          {
            type: 'text',
            text: "HTML describes the **structure and meaning** of a page. The browser's parser turns markup into the DOM, and that DOM — not your source text — is what CSS, JavaScript, and assistive technology see.\n\nMental models that matter in screenings:\n- **The parser never fails.** Invalid markup is repaired by exact spec rules (`<div>` closes an open `<p>`, a stray `</p>` creates an empty `<p>`, a `<tr>` gets an implied `<tbody>`).\n- **Attributes vs properties.** Attributes are the initial markup; DOM properties are live state (`input.value` vs `getAttribute('value')`).\n- **Boolean attributes are on when present**, whatever their value (`disabled=\"false\"` still disables).\n- **Forms have defaults**: a `<button>` inside a form submits it unless `type=\"button\"`.\n- **Scripts block parsing** unless they are `defer`, `async`, or modules.\n- **Semantics drive accessibility**: a real `<button>` gets focus, keyboard activation, and a role for free; a `<div onclick>` gets none of them.",
          },
        ],
      },
    ],
  },
  {
    stack: 'css',
    label: 'CSS',
    pages: [
      {
        id: 'css-intro',
        title: 'Introduction',
        blocks: [
          {
            type: 'text',
            text: "CSS decides **which declarations win** (the cascade) and **how boxes are laid out** (formatting contexts). Most tricky questions come from not knowing which layout mode an element is in.\n\nMental models that matter in screenings:\n- **Cascade order**: origin and `!important` → cascade layers → specificity (IDs, classes, types) → source order. Inheritance only applies when no rule targets the element itself.\n- **Every box is in a layout mode**: block, inline, flex, grid, table, or positioned. Properties only work in some modes (`vertical-align` does nothing on block and flex items; `z-index` needs positioning *or* a flex/grid item).\n- **Inline content sits on a baseline** inside line boxes, and every line has an invisible \"strut\". That's why an `<img>` leaves a gap underneath and an icon looks misaligned next to text.\n- **Percentages resolve against something specific** — usually the containing block, but which dimension depends on the property (see the Units page).\n- **Stacking contexts** are created by `opacity < 1`, `transform`, `filter`, `position: fixed/sticky`, `z-index` on positioned/flex/grid items, `isolation: isolate`, and more. A child can never escape its parent's context.\n- **Containing blocks**: `absolute` uses the nearest positioned ancestor's padding box; `fixed` uses the viewport *unless* an ancestor has `transform`, `filter`, `perspective`, `will-change: transform`, or `contain: paint`.",
          },
        ],
      },
      {
        id: 'css-units',
        title: 'Units',
        blocks: [
          {
            type: 'text',
            text: 'A CSS length is a number plus a unit. **Absolute** units are fixed ratios of each other. **Relative** units depend on something else: a font, the viewport, a container, or (for `%`) a property-specific reference. A zero **length** may drop its unit (`margin: 0`), but that shortcut only applies to lengths: a time must be written `0s`.',
          },
          {
            type: 'table',
            caption: 'Absolute length units',
            columns: ['Unit', 'Name', 'Equals', 'Notes'],
            rows: [
              ['`px`', 'pixel', '1/96 in', 'The reference unit. A CSS pixel is not a device pixel: on a 2× screen, `1px` covers 2×2 device pixels.'],
              ['`in`', 'inch', '96px = 2.54cm', 'Only physically accurate when printing.'],
              ['`cm`', 'centimeter', '≈ 37.8px', ''],
              ['`mm`', 'millimeter', '≈ 3.78px', ''],
              ['`Q`', 'quarter-millimeter', '0.25mm ≈ 0.945px', 'Rarely used.'],
              ['`pt`', 'point', '1/72 in ≈ 1.333px', '`12pt` = `16px`. Common in print stylesheets.'],
              ['`pc`', 'pica', '12pt = 16px', ''],
            ],
          },
          {
            type: 'table',
            caption: 'Font-relative length units',
            columns: ['Unit', 'Relative to', 'Example (16px root, 20px element)', 'Gotcha'],
            rows: [
              ['`em`', "the element's own `font-size`", '`padding: 1em` → 20px', 'Inside `font-size` itself, `em` uses the **parent\'s** font size, so nested `1.2em` compounds.'],
              ['`rem`', 'the root (`<html>`) `font-size`', '`1rem` → 16px everywhere', "Doesn't compound. Respects the user's browser font-size setting (unlike `px`)."],
              ['`ex`', 'x-height of the element\'s font', '≈ 0.5em (font-dependent)', 'Varies a lot between fonts.'],
              ['`ch`', 'advance width of the "0" glyph', '`max-width: 65ch` ≈ 65 digits', 'Only exact for monospace fonts; a good-enough measure for readable line length.'],
              ['`cap`', 'cap height of the font', '≈ 0.7em (font-dependent)', 'Useful for aligning icons to capital letters.'],
              ['`ic`', 'advance of the CJK glyph "水"', '≈ 1em in CJK fonts', 'For East Asian typography.'],
              ['`lh`', "the element's computed `line-height`", '`line-height: 1.5` → `1lh` = 30px', 'Great for sizing things "one line tall".'],
              ['`rem`-style root versions: `rex`, `rch`, `rcap`, `ric`, `rlh`', 'same metric, taken from the root element', '`1rlh` = root line height', 'Newer; check browser support before relying on them.'],
            ],
          },
          {
            type: 'table',
            caption: 'Viewport units (1 unit = 1% of the viewport dimension)',
            columns: ['Unit', 'Relative to', 'Use it for', 'Gotcha'],
            rows: [
              ['`vw` / `vh`', 'viewport width / height', 'full-bleed sections, fluid type', '`100vw` includes a classic vertical scrollbar, so it can cause horizontal overflow. On mobile, `100vh` is the *largest* viewport (browser toolbars hidden), so content can sit under the toolbar.'],
              ['`vmin` / `vmax`', 'the smaller / larger of `vw` and `vh`', 'squares that fit any orientation', ''],
              ['`svh` / `svw`', 'small viewport (mobile toolbars shown)', 'content that must always be fully visible', ''],
              ['`lvh` / `lvw`', 'large viewport (toolbars hidden)', 'backgrounds that may extend under toolbars', 'Same as classic `vh` on mobile.'],
              ['`dvh` / `dvw`', 'dynamic viewport (changes as toolbars show/hide)', 'full-height app shells: `min-height: 100dvh`', 'Value changes while scrolling on mobile, which can cause relayout.'],
              ['`vi` / `vb`', 'viewport size in the inline / block axis', 'writing-mode-aware layouts', 'Equal to `vw` / `vh` in horizontal writing modes. Also exist as `svi`, `lvb`, `dvi`, etc.'],
            ],
          },
          {
            type: 'table',
            caption: 'Container query units (need an ancestor with `container-type`)',
            columns: ['Unit', 'Relative to', 'Notes'],
            rows: [
              ['`cqw` / `cqh`', "1% of the query container's width / height", '`cqh` needs `container-type: size` (not just `inline-size`).'],
              ['`cqi` / `cqb`', '1% of the container\'s inline / block size', 'Prefer `cqi` for typical width-based components.'],
              ['`cqmin` / `cqmax`', 'smaller / larger of `cqi` and `cqb`', ''],
              ['(no container)', '—', 'If no eligible container exists, they fall back to the **small viewport** units (`svw`, `svh`, …).'],
            ],
          },
          {
            type: 'table',
            caption: 'What `%` refers to (depends on the property!)',
            columns: ['Property', '`%` is relative to', 'Gotcha'],
            rows: [
              ['`width`, `left`, `right`, `max/min-width`', "containing block's width", ''],
              ['`height`, `top`, `bottom`, `max/min-height`', "containing block's height", 'If that height is not definite (e.g. `auto`), `height: %` behaves like `auto`.'],
              ['`margin` and `padding` (**all four sides**)', "containing block's **width**", '`padding-top: 50%` makes a 2:1 box — the classic aspect-ratio trick.'],
              ['`font-size`', "parent's font-size", '`150%` = `1.5em`.'],
              ['`line-height`', "element's own font-size", 'The computed **px value** is inherited, unlike a unitless number (which is inherited as a ratio).'],
              ['`vertical-align`', "element's own `line-height`", ''],
              ['`translate()` / `transform`', "element's own border box", 'So `translate(-50%, -50%)` centers by the element\'s own size.'],
              ['`border-radius`', "element's own border box (horizontal radius by width, vertical by height)", '`50%` on a non-square box gives an ellipse.'],
              ['`background-position`', "(container size − image size)", '`50%` centers the image; `100%` aligns its right edge to the box\'s right edge.'],
              ['`background-size`', 'the background positioning area', ''],
              ['`flex-basis`', "flex container's inner main size", 'An indefinite container size makes it behave like `content`.'],
              ['grid tracks (`grid-template-columns: 50%`)', "grid container's content box", 'Percentages ignore `gap`, so `50% 50%` plus a gap overflows. Use `fr` instead.'],
            ],
          },
          {
            type: 'table',
            caption: 'Other unit types',
            columns: ['Type', 'Units', 'Where you see them', 'Notes'],
            rows: [
              ['Flexible length', '`fr`', 'grid track sizes only', 'Share of the **leftover** space after fixed tracks and gaps. `1fr` = `minmax(auto, 1fr)`, so long content can still overflow; use `minmax(0, 1fr)`.'],
              ['Angle', '`deg`, `rad`, `grad`, `turn`', '`rotate()`, gradients, `hue-rotate()`', '`1turn` = `360deg` = `400grad` ≈ `6.2832rad`. In `linear-gradient`, `0deg` points up, angles go clockwise.'],
              ['Time', '`s`, `ms`', 'transitions, animations', 'A unitless `0` is invalid for times; write `0s`.'],
              ['Resolution', '`dppx` (= `x`), `dpi`, `dpcm`', 'media queries, `image-set()`', '`1dppx` = `96dpi`. `(min-resolution: 2dppx)` targets 2× screens.'],
              ['Frequency', '`Hz`, `kHz`', '(aural CSS)', 'Defined in the spec, but no current browser property uses them.'],
              ['Number (unitless)', '—', '`line-height`, `opacity`, `z-index`, `flex-grow`, `scale()`', 'Unitless `line-height` is inherited as a ratio — the safest choice.'],
            ],
          },
          {
            type: 'table',
            caption: 'Which unit should I reach for?',
            columns: ['Job', 'Good choice', 'Why'],
            rows: [
              ['Base font sizes', '`rem`', "Scales with the user's preferred font size, doesn't compound."],
              ['Spacing tied to a component\'s text (button padding, icon size)', '`em`', 'Scales automatically when that component\'s font size changes.'],
              ['Line height', 'unitless (`1.5`)', 'Recomputed for each element\'s own font size.'],
              ['Readable text width', '`ch` (`max-width: 65ch`)', 'Tracks the font\'s character width.'],
              ['Borders, hairlines, shadows', '`px`', 'Should stay crisp and not scale with text.'],
              ['Layout columns', '`fr`, `%`, `minmax()`', '`fr` accounts for gaps; `%` does not.'],
              ['Full-height screens on mobile', '`dvh` / `svh`', 'Classic `vh` ignores mobile toolbars.'],
              ['Fluid typography', '`clamp(1rem, 0.8rem + 1vw, 1.5rem)`', 'Mixing `rem` keeps zoom working; pure `vw` text ignores user zoom settings.'],
              ['Components that adapt to their slot', '`cqi`', 'Responds to the container, not the whole viewport.'],
            ],
          },
        ],
      },
      FLOATS_PAGE,
    ],
  },
  {
    stack: 'javascript',
    label: 'JavaScript',
    pages: [
      {
        id: 'javascript-intro',
        title: 'Introduction',
        blocks: [
          {
            type: 'text',
            text: "JavaScript is single-threaded with an **event loop**: run the current script to completion, drain **all microtasks** (promise callbacks, `await` continuations, `queueMicrotask`), then take the next **task** (`setTimeout`, events, I/O).\n\nMental models that matter in screenings:\n- **Closures capture variables, not values.** `var` is one binding per function; `let`/`const` in a loop get a fresh binding per iteration.\n- **Hoisting**: `var` is hoisted and initialized to `undefined`; `let`/`const`/`class` are hoisted but stay in the temporal dead zone until their line runs (even `typeof` throws).\n- **`this` depends on the call site** for normal functions (`obj.fn()` vs `fn()`), and on the **definition site** for arrow functions. Modules and classes are always strict, so a detached call gets `this === undefined`.\n- **Equality**: `===` never coerces; `==` follows a coercion algorithm (`null == undefined` is true, `null == 0` is false). `Object.is` distinguishes `+0`/`-0` and treats `NaN` as equal to itself.\n- **async functions run synchronously until the first `await`**, and always return a promise.",
          },
        ],
      },
    ],
  },
  {
    stack: 'react',
    label: 'React',
    pages: [
      {
        id: 'react-intro',
        title: 'Introduction',
        blocks: [
          {
            type: 'text',
            text: "A React component is a function of props and state that returns UI. Each render is a **snapshot**: the props, state, and event handlers inside it never change after the render.\n\nMental models that matter in screenings:\n- **Rules of hooks**: call hooks at the top level, in the same order every render — never inside conditions, loops, or after an early return.\n- **State updates are queued and batched.** `setCount(count + 1)` uses the snapshot value; `setCount(c => c + 1)` uses the latest pending value.\n- **Effects run after paint** and re-run when a dependency changes (compared with `Object.is`). The cleanup from the previous run always runs first. In development StrictMode runs setup → cleanup → setup once on mount.\n- **Stale closures**: a callback created in an old render keeps seeing that render's values.\n- **Re-renders**: a parent re-render re-renders its children unless they're memoized *and* their props are referentially equal. Setting state to the same value (`Object.is`) bails out.\n- **Keys give identity.** Index keys break when items are reordered or removed; changing a key remounts the component and resets its state.\n- **Controlled inputs** need `value` + `onChange`; `value={undefined}` means uncontrolled.",
          },
        ],
      },
    ],
  },
  {
    stack: 'typescript',
    label: 'TypeScript',
    pages: [
      {
        id: 'typescript-intro',
        title: 'Introduction',
        blocks: [
          {
            type: 'text',
            text: "TypeScript adds a **static, structural** type system on top of JavaScript. Types are erased at compile time, so they can't change runtime behavior and can't be checked at runtime (`instanceof` needs a class, not an interface).\n\nMental models that matter in screenings:\n- **Structural typing**: a value fits a type if it has the required shape. Fresh object literals also get **excess property checks**.\n- **Narrowing** follows real JS behavior: `typeof x === 'object'` still includes `null`; `in`, `instanceof`, discriminant properties, and type guards (`x is T`) narrow unions.\n- **Literal widening**: `let` and object properties widen (`'GET'` → `string`); `const` primitives and `as const` keep literal types.\n- **`unknown` vs `any` vs `never`**: `unknown` must be narrowed before use, `any` turns checking off (and spreads), `never` has no values — use it for exhaustiveness checks.\n- **Conditional types distribute over unions** when the checked type is a naked type parameter; wrap it in `[T]` to stop that.\n- **`keyof (A | B)`** is only the common keys; `keyof (A & B)` is all keys.",
          },
        ],
      },
    ],
  },
];
