---
name: DualControl
description: Apple liquid glass over a Big Sur gradient field — neutral frosted panels, all colour from the ground behind them.
colors:
  field-violet: "#5f27b8"
  field-magenta: "#a92a9a"
  field-red: "#e83d5c"
  field-amber: "#ff8f2a"
  field-white: "#dfeaf6"
  field-blue: "#1a8ae0"
  base: "#15121c"
  scrim: "rgba(10,8,17,.84)"
  panel: "rgba(22,19,31,.34)"
  well: "rgba(0,0,0,.28)"
  screen-well: "#0d0b14"
  rim: "rgba(255,255,255,.2)"
  rim-hi: "rgba(255,255,255,.34)"
  hairline: "rgba(255,255,255,.09)"
  ink: "#f5f2f7"
  ink-2: "#c8bfcb"
  ink-3: "#b0a5b4"
  good: "#46e0a8"
  focus: "rgba(140,180,255,.9)"
  selection: "rgba(120,162,255,.34)"
  on-light: "#17102a"
typography:
  display:
    fontFamily: "Schibsted Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "clamp(42px, 6.6vw, 86px)"
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: "-0.038em"
  headline:
    fontFamily: "Schibsted Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "clamp(28px, 3.4vw, 42px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Schibsted Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  lede:
    fontFamily: "Schibsted Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "clamp(17px, 1.55vw, 20px)"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  body:
    fontFamily: "Schibsted Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  small:
    fontFamily: "Schibsted Grotesk, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  measure:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tabular-nums"
  code-face:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "clamp(28px, 3.4vw, 42px)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.18em"
  meta:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13.5px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11.5px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.06em"
rounded:
  xs: "6px"
  sm: "8px"
  nav: "10px"
  screen: "12px"
  control: "13px"
  glass: "18px"
  pane: "20px"
  pill: "99px"
spacing:
  gap-tight: "6px"
  gap: "11px"
  gap-wide: "14px"
  gutter: "22px"
  panel-x: "26px"
  panel-y: "30px"
  card: "40px"
  block: "44px"
  section: "112px"
  footer: "104px"
components:
  button-glass:
    backgroundColor: "rgba(255,255,255,.09)"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "14px 20px"
    typography: "600 15px/1 Schibsted Grotesk"
  button-glass-hover:
    backgroundColor: "rgba(255,255,255,.15)"
    textColor: "{colors.ink}"
  button-primary:
    backgroundColor: "linear-gradient(180deg,#fff,#e9ebf3)"
    textColor: "{colors.on-light}"
    rounded: "{rounded.control}"
    padding: "14px 20px"
    typography: "600 15px/1 Schibsted Grotesk"
  button-primary-hover:
    backgroundColor: "linear-gradient(180deg,#fff,#dfe2ed)"
  panel-glass:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.glass}"
  code-face:
    backgroundColor: "{colors.well}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "22px 0"
    typography: "{typography.code-face}"
  badge-pill:
    backgroundColor: "rgba(16,14,24,.88)"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  ledger-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "19px 26px"
  inline-code:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "3px 7px"
---

# Design System: DualControl

## Overview

**Creative North Star: "Liquid Glass Over Big Sur"**

The whole surface is one idea held consistently: a saturated Big Sur gradient
field burns underneath, a dark scrim holds it down to reading level, and every
piece of interface is a neutral frosted panel floating on top. The panels have
no colour of their own. Every hue a visitor sees — violet under the footer,
amber at the top right, the white band cutting diagonally through — is the
ground showing through 46px of blur. That single relationship is the identity;
it is inherited unchanged in spirit from the shipped Chrome extension popup,
where the same gradient, the same scrim and the same `.glass` recipe already
live, and extended here to page scale.

The personality is calm and measured rather than loud, even though the
background is the loudest thing in the product. Density is generous: a 1180px
container, 112px between sections, panels padded at 26–40px. Type is tight and
confident (display tracking runs to -0.038em at 86px) and the voice never
shouts in colour — emphasis comes from weight, from the brightness of the ink,
and from the white primary button, which is the only fully opaque, fully
bright object on the page.

Depth is deliberately shallow. There is one panel material, used identically
for the hero pair, the flow panel, the measurement ledger and the install card.
The finish reviewer raised the absence of an elevation hierarchy and then
explicitly accepted it: this is a **single-material world**, not an oversight.
Layering reads through the scrim and the blur, not through a stack of shadow
tiers.

**Key Characteristics:**
- One frosted panel material; no elevation tiers
- All colour comes from the ground behind the glass, never from a panel
- JetBrains Mono is reserved for measurements and the pairing code
- Hairline rims (1px, white at 20%) plus a bright inset top highlight on every panel
- Tight negative tracking on display and headline type
- Inline stroke SVG icons at a single 1.8 weight

## Colors

A neutral greyscale interface sitting on a six-stop spectral field; the only
chromatic token that lives *on* the interface is the mint status green.

### Primary

The primary is not a swatch, it is the field. A 24° linear gradient runs
violet → magenta → red → amber → a pale white band → blue, with six radial
blooms laid over it (blue and white at the top right, amber below them, a soft
red at centre, violet at the bottom left, magenta mid-left), the whole thing
blurred 24px and inset -12% so no seam reaches an edge.

- **Deep Violet** (`{colors.field-violet}`): gradient origin, bottom-left bloom; the dominant hue under the footer and install card.
- **Orchid Magenta** (`{colors.field-magenta}`): the 22% stop and the mid-left bloom.
- **Signal Red** (`{colors.field-red}`): the 42% stop; the warm core of the field.
- **Amber** (`{colors.field-amber}`): the 60% stop and the upper-right bloom; the page's only warm highlight.
- **Haze White** (`{colors.field-white}`): the 76% band; the bright diagonal that keeps the field from reading as a single wash.
- **Sky Blue** (`{colors.field-blue}`): the 100% stop and the strongest upper-right bloom; the hue behind the nav and headline.

### Secondary

- **Relay Mint** (`{colors.good}`): live-state green. Used only on the word
  "driving" in the active pane's tag and on the relay figure inside the link
  badge. Inherited unchanged from the extension popup's `--good`.

### Neutral

- **Void** (`{colors.base}`): the page background beneath the field; visible nowhere directly, it is the floor the gradient sits on.
- **Scrim** (`{colors.scrim}`): the fixed top-to-bottom darkening pass over the field, ramped `rgba(10,8,17,.55)` at 0%, `.7` at 40%, `.84` at 100% — the page grows darker as it descends so text legibility improves downward.
- **Panel** (`{colors.panel}`): the one glass fill. 34% opacity, which is why the field's hue still reads through it.
- **Well** (`{colors.well}`): recessed fill for the code face and inline code — black at 28%, the inverse move from panel.
- **Screen Well** (`{colors.screen-well}`): the opaque video-surface inside each browser pane; the only near-black solid on the page.
- **Rim** (`{colors.rim}`) / **Bright Rim** (`{colors.rim-hi}`): the 1px hairline border on every glass object, and its hover/emphasis state.
- **Hairline** (`{colors.hairline}`): internal dividers — the vertical rules between flow steps, the rows of the ledger (at `rgba(255,255,255,.07)`), the footer rule (`.08`).
- **Ink** (`{colors.ink}`), **Ink Two** (`{colors.ink-2}`), **Ink Three** (`{colors.ink-3}`): the three-step text ramp, a warm violet-tinted greyscale. Ink for headings, emphasis and the white-on-glass state; Ink Two for body, lede and nav; Ink Three for supporting detail — method notes, step numbers, footer.
- **On Light** (`{colors.on-light}`): text on the white primary button. Deep indigo, never pure black.

### Named Rules

**The Ground-Only Colour Rule.** A panel is never tinted. If a surface looks
violet, that is the field reading through 34% black at 46px blur. Any new panel
uses `{colors.panel}` and takes whatever hue it is standing on.

**The One Green Rule.** Relay Mint marks live truth only — a device currently
driving, a latency figure measured just now. It never becomes a brand accent,
never fills a button, never borders a panel.

**The Downward Scrim Rule.** The scrim ramps from 55% to 84% opacity top to
bottom. New sections added at the end inherit the darkest ground; do not
flatten the ramp to accommodate a lighter panel.

## Typography

**Display Font:** Schibsted Grotesk (with `-apple-system`, `BlinkMacSystemFont`, `system-ui`, `sans-serif`)
**Body Font:** Schibsted Grotesk — weights 400/500/600/700/800
**Label/Mono Font:** JetBrains Mono (with `ui-monospace`, `SFMono-Regular`, `Menlo`, `monospace`) — weights 400/500/600

**Character:** A tightly-tracked geometric grotesk doing all the talking, and a
machine face doing all the counting. The pairing is functional, not decorative:
you can tell at a glance which words on the page are claims and which are
measurements.

### Hierarchy

- **Display** (800, `clamp(42px, 6.6vw, 86px)`, lh 0.96, -0.038em): the hero headline only, capped at 16ch with `text-wrap:balance`. Its second line is set in Ink Two, so the sentence dims as it resolves.
- **Headline** (700, `clamp(28px, 3.4vw, 42px)`, lh 1.08, -0.03em): section openers. Sections begin on the headline — there is no eyebrow above it.
- **Title** (600, 19px, -0.02em): flow-step headings. The install card's heading runs heavier and larger (700, 24px, -0.025em) because it sits inside a padded card rather than a divided column.
- **Lede** (400, `clamp(17px, 1.55vw, 20px)`, lh 1.55, max 52ch): the hero paragraph, in Ink Two with Ink/600 bolds for the load-bearing claim. Section subheads use 17px at 58ch.
- **Body** (400, 17px, lh 1.6): the page default.
- **Small** (400, 15.5px, lh 1.55): flow-step and install-step copy. Supporting notes run 14–14.5px in Ink Three, capped at 64ch.
- **Measure** (mono 600, 19px, lh 1, -0.03em, tabular-nums): every ledger figure. Tabular numerals keep the column aligned at the decimal.
- **Code Face** (mono 600, `clamp(28px, 3.4vw, 42px)`, 0.18em tracking with a matching 0.18em text-indent so the letterspacing does not push the string off-centre): the six-digit pairing code, in pure white on the well.
- **Meta** (mono 500, 13.5px, -0.01em): the under-button fact line; inline `<code>` runs 13.5px/500, the install step numbers 12px/600 tabular.
- **Label** (mono 500, 11.5px, 0.06em, uppercase): the device tag inside each pane's window chrome. The link badge and timecode stamp are the same size and family at 600 with negative tracking.

### Named Rules

**The Measurement Face Rule.** JetBrains Mono is reserved for measured values
and the pairing code: every latency figure, every byte size, every timecode,
every duration, the six digits. Schibsted Grotesk carries everything else. A
hero measurement once drifted to sans and was reverted — this rule has teeth. A
number that is not a measurement (a step index that is only an ordinal, a year)
may be sans; a number a visitor could verify may not.

**The No-Eyebrow Rule.** Sections open on the headline. There are no kickers,
eyebrows, or uppercase category labels above a heading anywhere on the page.
The only uppercase tracked type is the device status tag inside the pane
chrome, which is a live UI label, not a section marker.

## Layout

A single centred column: `width: min(1180px, 100% - 48px)`, margin-inline auto,
with the field and scrim both `position: fixed` so the interface scrolls over a
static ground.

Vertical rhythm is coarse and regular: 112px above every section, 58px above
the hero, 44px between a section's intro and its panel, 42px from the hero
actions to the pair, 104px above the footer. Inside panels the rhythm tightens
to 26–40px of padding and 6/11/14/22px gaps.

Three distinct grids carry the page, all asymmetric on purpose:
- **The pair**: `1fr 92px 1fr` — two browser panes with a fixed 92px filament channel between them, the link SVG drawn across exactly that 92px span.
- **The flow**: `1fr 1.32fr 1fr` — the middle step is widened because it holds the code face.
- **The ledger**: `1.5fr auto 1.35fr`, baseline-aligned, so the label, the figure and the method sit on one optical line.
- **The install card**: `1.1fr 1fr`, centre-aligned.

One breakpoint, at **920px**. Below it every multi-column grid collapses to a
single column, the filament channel shrinks from 120px to 56px and its SVG is
hidden, flow-step dividers rotate from left borders to top borders, the ledger
drops to a two-column head with the method note spanning full width beneath,
the install card loses 10px of padding, section rhythm drops 112px → 84px, and
the nav keeps only the link marked `.keep`.

**The Fixed Ground Rule.** The gradient field and its scrim are `position:
fixed` and never scroll. Content moves across a stationary sky.

## Elevation & Depth

Hybrid, but deliberately single-tier. Depth is carried by the *material*, not by
a shadow scale: every panel is 34% black, blurred 46px with 150% saturation and
a 1.02 brightness lift, ringed by a 1px 20%-white hairline, and lit by a single
inset top highlight. There is exactly one panel recipe on the page and all four
panel instances use it unchanged — the hero pair, the flow panel, the
measurement ledger, the install card. This was raised in finish review and
confirmed as intentional.

Objects that recede do so with a dark well rather than a lighter surface: the
code face, inline code and the pane's video screen all use black fills, the
inverse of the glass move.

### Shadow Vocabulary

- **Panel** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.3), inset 0 -1px 0 rgba(0,0,0,.14), 0 20px 54px rgba(0,0,0,.4)`): every `.glass` surface. The two insets are the top light and the bottom grounding edge; the outer is a wide, soft, near-black ambient drop.
- **Glass Button** (`inset 0 1px 0 rgba(255,255,255,.22)`): highlight only, no drop. Secondary buttons sit *in* the surface.
- **Primary Button** (`inset 0 1px 0 #fff, 0 10px 26px rgba(0,0,0,.34)`): the only element with its own lift. It is the page's single call to action, and the only opaque white object.
- **Badge** (`inset 0 1px 0 rgba(255,255,255,.2), 0 6px 18px rgba(0,0,0,.45)`): the relay pill riding over the filament.
- **Well** (`inset 0 1px 0 rgba(255,255,255,.14)`): the top edge of a recessed fill.
- **Knob** (`0 2px 8px rgba(0,0,0,.5)`) and **Scanline** (`0 0 16px 2px rgba(255,255,255,.6)`): small object lifts inside the demo.

### Named Rules

**The Single Material Rule.** There is one panel tier. A new panel uses the
`.glass` recipe verbatim — same fill, same blur, same rim, same insets, same
drop. Do not invent an "elevated" or "sunken" panel variant to signal
importance; use placement, width and type weight instead.

**The Frost-Not-Fill Rule.** Depth on this page is backdrop blur. If a surface
needs to separate from the ground, increase the blur relationship, not the
opacity — a panel over 34% fill starts hiding the field and breaks the world.

## Shapes

Soft, evenly-rounded rectangles in a continuous family, with no sharp corners
anywhere. The scale is: 6px for inline code, 8px for the brand mark and the
focus ring, 10px for nav links, 12px for the video screen, 13px for buttons and
the code face, 18px for the canonical glass panel, 20px for the hero panes, and
99px for pills (the relay badge, the scrubber track and fill, the scrollbar
thumb). Circles (50%) are reserved for genuinely round objects: window-chrome
dots, the scrubber knob, the film blobs.

Borders are always hairlines — 1px, white, never above 34% opacity. Internal
structure is drawn with single-sided borders rather than boxes: a left border
between flow steps, a top border between ledger rows, a top border above the
footer.

The recurring silhouette is the **window**: a rounded rect with a three-dot
chrome strip above it and a scrubber below it. It appears twice, mirrored, and
is the page's hero form.

## Components

### Buttons

- **Shape:** Softly rounded (13px), pill-adjacent but still rectangular; icon and label in a 9px inline flex row.
- **Primary:** Vertical white gradient (`#fff` → `#e9ebf3`) with deep-indigo text (`{colors.on-light}`), a 70%-white border, a pure-white inset top edge and a real drop. Padding 14px 20px. Used twice on the page, for the same download.
- **Glass (secondary):** 9%-white fill over a 20px backdrop blur, hairline rim, Ink text. Same padding and type as primary.
- **Hover / Focus:** Glass fill lifts to 15% and the rim brightens to 34% over 180ms; primary's gradient darkens slightly. All buttons scale to 0.976 on `:active` over 160ms on `cubic-bezier(.32,.72,0,1)`.
- **Icons:** Inline stroke SVG, 17px, `stroke-width: 1.8`, `currentColor`, round caps and joins. Never an icon font or glyph.

### Cards / Containers

- **Corner Style:** 18px on the canonical glass panel; 20px on the two hero panes.
- **Background:** `{colors.panel}` over `blur(46px) saturate(150%) brightness(1.02)`.
- **Shadow Strategy:** the Panel entry in Elevation — identical on every instance. See The Single Material Rule.
- **Border:** 1px `{colors.rim}`.
- **Internal Padding:** 30px 28px 32px for a divided column, 19px 26px for a ledger row, 40px for the install card, 13px for a browser pane.

### Navigation

A borderless flex row at the very top with a radial darkening pseudo-element
behind it (`rgba(8,6,14,.5)` fading out at 72%) so links stay legible over the
brightest part of the field. Brand mark: 29px rounded-8px icon plus a 700/17px
wordmark at -0.015em. Links are 14.5px/500 in Ink Two, padded 8px 13px with a
10px radius; hover fills 7% white and lifts text to Ink. Below 920px, only the
link carrying `.keep` survives.

### Ledger

The measurement table. A `<dl>` inside a glass panel, one row per figure,
baseline-aligned across three columns: the label (16px/500 sans), the figure
(mono 600/19px, pure white, tabular numerals, `white-space: nowrap`) and the
method (14px Ink Three). Rows are separated by a `rgba(255,255,255,.07)` top
border, suppressed on the first. The figure is always white and always mono —
that contrast is the component's whole argument.

### Code Face

The six-digit pairing code. Mono 600 at display scale with 0.18em tracking, a
matching text-indent to keep it optically centred, pure white on the black
well, 13px radius, 22px vertical padding, hairline rim and an inset top
highlight. It cycles between sample codes on a 3.6s interval with a 520ms
opacity dip, suppressed under `prefers-reduced-motion`.

### Browser Pane (signature)

The hero form. A glass panel at 13px padding containing: a window-chrome strip
of three 9px 20%-white dots plus an uppercase mono device tag; a 16:10 screen
at 12px radius filled with four blurred colour blobs (red, amber, violet, blue
— the field's own palette, reused as fake video), vignetted by a radial
`rgba(0,0,0,.5)` edge; a 2px white scanline with a 16px glow marking the
playhead; a mono timecode stamp bottom-left with a text shadow; and a scrubber
below — a 4px 14%-white track, an 82%-white fill and an 18px white knob that
scales 1.14× on hover. The follower pane's knob drops to 66% white; that opacity
difference is the only signal distinguishing the two roles beyond the tag.

### Filament (signature)

The connection between the panes: a 92px horizontal dashed path
(`stroke-dasharray: 3 5`, 1.5px, 20% white) with a 3.5px white pip animating
across it on each command over 400ms, and a mono pill badge centred on it
showing the live round-trip to the relay. Hidden below 920px.

## Do's and Don'ts

### Do:
- **Do** build every panel from the one `.glass` recipe: `{colors.panel}`, `backdrop-filter: blur(46px) saturate(150%) brightness(1.02)`, 1px `{colors.rim}`, 18px radius, and the three-part Panel shadow.
- **Do** set every measured value in JetBrains Mono — latency, sizes, timecodes, the pairing code — and everything else in Schibsted Grotesk.
- **Do** let the fixed gradient field supply all colour; panels stay neutral.
- **Do** use tabular numerals (`font-variant-numeric: tabular-nums`) on any column of figures.
- **Do** draw icons as inline stroke SVG at `stroke-width: 1.8` with round caps and joins.
- **Do** keep hairline dividers at 1px white between 7% and 9% opacity, single-sided.
- **Do** honour `prefers-reduced-motion`: the page clamps all animation and transition to 0.01ms and disables the autoplay demo.
- **Do** keep measure caps: 16ch on the display headline, 52ch on the lede, 58ch on section subheads, 64ch on notes.

### Don't:
- **Don't** tint a panel. No coloured glass, no accent-bordered card, no chromatic fill on an interface surface.
- **Don't** introduce a second panel tier to signal importance. There is no elevated card and no sunken card.
- **Don't** spend Relay Mint on anything but live state.
- **Don't** put a kicker, eyebrow or uppercase category label above a section heading.
- **Don't** raise panel opacity past 34% to win contrast — the field must read through.
- **Don't** use an icon font, an emoji, or a `<img>` glyph where a stroke SVG belongs.
- **Don't** add a hard offset shadow; every shadow here is soft, wide and near-black.
