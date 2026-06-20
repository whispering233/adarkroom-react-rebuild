---
name: A Dark Room
description: Monochrome minimalist design system for a text-based survival adventure game
colors:
  primary: "#000000"
  secondary: "#333333"
  accent: "#000000"
  neutral: "#ffffff"
  surface: "#f5f5f5"
  on-surface: "#333333"
  border: "rgba(0,0,0,0.1)"
  dark-primary: "#e0e0e0"
  dark-secondary: "#c8c8c8"
  dark-surface: "#0d0d1a"
  dark-bg: "#1a1a2e"
  dark-accent: "#e0e0e0"
  dark-border: "rgba(255,255,255,0.15)"
typography:
  body-mono:
    fontFamily: "'Courier New', Courier, monospace"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label-sm:
    fontFamily: "'Courier New', Courier, monospace"
    fontSize: 12px
    fontWeight: 600
    letterSpacing: 0.15em
  label-xs:
    fontFamily: "'Courier New', Courier, monospace"
    fontSize: 11px
    fontWeight: 400
    letterSpacing: 0.1em
    lineHeight: 1.6
rounded:
  sm: 4px
  md: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  panel-padding: 16px
  panel-gap: 12px
components:
  button:
    backgroundColor: "rgba(0,0,0,0.05)"
    textColor: "#000000"
    borderColor: "rgba(0,0,0,0.25)"
    rounded: "{rounded.sm}"
    padding: "8px 20px"
    minWidth: 11rem
    fontFamily: "{typography.body-mono.fontFamily}"
  button-hover:
    backgroundColor: "rgba(0,0,0,0.1)"
  button-disabled:
    opacity: 0.4
  header-tab:
    textColor: "#333333"
    borderColor: "transparent"
    fontWeight: 400
    padding: "12px 16px"
  header-tab-active:
    textColor: "#000000"
    borderColor: "#000000"
    fontWeight: 700
  event-overlay:
    backgroundColor: "#ffffff"
    borderColor: "rgba(0,0,0,0.1)"
    rounded: "{rounded.md}"
    maxWidth: 32rem
  tooltip:
    backgroundColor: "#ffffff"
    borderColor: "rgba(0,0,0,0.1)"
    rounded: "{rounded.sm}"
    textColor: "#333333"
  world-tile:
    fontFamily: "monospace"
    fontSize: 12px
---

## Overview

This design system powers **A Dark Room**, a text-based survival adventure game rebuilt in React and TypeScript. The aesthetic is defined as **"黑白极简风" (monochrome minimalism)**.

Every part of the UI uses a black-and-white grayscale palette. No color is used for emphasis. Instead, the game communicates hierarchy through font weight (600 for labels, 700 for active elements and headings) and underline decoration. This constraint preserves the text-adventure immersion and keeps the player focused on the narrative.

The monospace font (Courier New) reinforces the retro terminal feel. Layout borders are used only on buttons and modal panels, never for layout separation. The dark theme shifts to deep navy backgrounds (`#1a1a2e`) while keeping the same typographic and spacing system.

**Key principles:**
- Monochrome only: black, white, grays
- Emphasis through weight and underline, never color
- Courier New monospace for all text
- Borders only on interactive elements, never for layout
- Dark theme with deep navy backgrounds

## Colors

The palette is intentionally limited to black, white, and grays. UI emphasis is conveyed through font-weight (600/700) or underlines.

### Light theme

| Token | Value | Usage |
|-------|-------|-------|
| `--game-bg-primary` | `#ffffff` | Page and panel backgrounds |
| `--game-bg-header` | `#f5f5f5` | Header bar background |
| `--game-bg-panel` | `rgba(0,0,0,0.03)` | Subtle panel tint |
| `--game-text-primary` | `#000000` | Headlines, titles, primary labels |
| `--game-text-body` | `#333333` | Body text, descriptions |
| `--game-text-muted` | `#333333` | Muted/secondary text |
| `--game-accent` | `#000000` | Data values, counts, emphasis |
| `--game-btn-text` | `#000000` | Button label text |
| `--game-btn-bg` | `rgba(0,0,0,0.05)` | Button background |
| `--game-btn-border` | `rgba(0,0,0,0.25)` | Button border |
| `--game-btn-hover-bg` | `rgba(0,0,0,0.1)` | Button hover fill |
| `--game-border` | `rgba(0,0,0,0.1)` | Modal and tooltip borders |

### Dark theme

| Token | Value | Usage |
|-------|-------|-------|
| `--game-bg-primary` | `#1a1a2e` | Page and panel backgrounds |
| `--game-bg-header` | `#0d0d1a` | Header bar background (darker layer) |
| `--game-bg-panel` | `rgba(0,0,0,0.3)` | Subtle panel tint |
| `--game-text-primary` | `#e0e0e0` | Headlines, titles, primary labels |
| `--game-text-body` | `#c8c8c8` | Body text, descriptions |
| `--game-text-muted` | `#666666` | Muted/secondary text |
| `--game-accent` | `#e0e0e0` | Data values, counts, emphasis |
| `--game-btn-text` | `#e0e0e0` | Button label text |
| `--game-btn-bg` | `rgba(255,255,255,0.08)` | Button background |
| `--game-btn-border` | `rgba(255,255,255,0.25)` | Button border |
| `--game-btn-hover-bg` | `rgba(255,255,255,0.12)` | Button hover fill |
| `--game-border` | `rgba(255,255,255,0.15)` | Modal and tooltip borders |

## Typography

The typography system is monospace-only. All text uses the same font family with three size levels.

### Font family

```
font-family: 'Courier New', Courier, monospace;
```

### Size scale

| Level | Size | Weight | Tracking | Line height | Usage |
|-------|------|--------|----------|-------------|-------|
| body | 16px | 400 | default | 1.6 | All body text, buttons, panels |
| label-sm | 12px | 600 | 0.15em | 1.25 | Section titles, uppercase labels |
| label-xs | 11px | 400 | 0.1em | 1.6 | Narrative entries, tooltips |
| map-tile | 12px | 400 | default | 1.2em | World map characters |
| button | 14px | 400 | default | 1.25 | Button labels |

### Tracking scale

| Level | Value | Usage |
|-------|-------|-------|
| Wide (`--game-tracking-wide`) | `0.3em` | Uppercase panel headers |
| Standard (`--game-tracking`) | `0.15em` | `label-sm` section titles |
| Tight (`--game-tracking-tight`) | `0.1em` | `label-xs` narrative text, event titles |

### Emphasis

- **Bold (600)**: Section titles, row labels, muted data labels
- **Bold (700)**: Active header tabs, event overlay titles, building counts
- Underline: Not used in current UI (reserved for future link-style interactions)

## Layout

### Grid structure

The root layout is a three-column grid defined in `App.tsx`:

```
grid-cols-[1fr_3fr_1.5fr]
```

| Column | Fraction | Content |
|--------|----------|---------|
| Left | 1fr | Narrative panel (story text, status, delta log) |
| Center | 3fr | Header tabs + scene content (interactions) |
| Right | 1.5fr | Stores panel (buildings, inventory, weapons) |

### Content width

The entire layout is wrapped in a container with `max-width: 75%` (`--game-content-max-width`), centered horizontally.

### Spacing

All spacing values derive from CSS custom properties:

| Token | Value | Usage |
|-------|-------|-------|
| `--game-panel-padding` | `1rem` (16px) | Side panel inner padding |
| `--game-panel-gap` | `0.75rem` (12px) | Gap between panel sections |
| `xs` | 4px | Button progress bar, small gaps |
| `sm` | 8px | Element groups, form spacing |
| `md` | 16px | Section spacing, panel padding |
| `lg` | 24px | Large section breaks |
| `xl` | 32px | Page-level margins |

### Header

- Height: `41px` (`--game-header-h`)
- Consists of scene navigation tabs (Room, Outside, Path, World, etc.)
- Tabs have border-bottom active indicator

### Button sizing

- Minimum width: `11rem` (`--game-btn-min-width`)
- Padding: `0.5rem 1.25rem` (8px 20px)
- Full-width variant: `w-full` for event overlay actions

## Elevation and Depth

The design is intentionally flat. No box-shadows are used on surfaces or cards.

### Interactive feedback

| Element | Feedback |
|---------|----------|
| Button press | `transform: scale(0.95)` on `:active` |
| Button hover | Background darkens from `--game-btn-bg` to `--game-btn-hover-bg` |
| Tab hover | No transform; color transitions only |
| Clickable map tile | `cursor: pointer` |

### Modal elevation

The event overlay is the only element with visual depth. It uses:

```
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4)
```

This creates a floating modal effect against a semi-transparent backdrop (`rgba(0, 0, 0, 0.4)`).

### Dark theme tonal layering

In dark mode, depth is suggested through tonal layering:

- Page background: `#1a1a2e`
- Header background: `#0d0d1a` (darker, recedes)
- Event overlay: `#1a1a2e` (same as page, with border separation)

### Transitions

- Interactive elements: `0.15s ease` (buttons, tabs, hover effects)
- HP bar fills: `0.3s ease`
- Narrative opacity: `1s`

## Shapes

| Element | Radius | Token |
|---------|--------|-------|
| Buttons | 4px (0.25rem) | `{rounded.sm}` |
| Event overlays, panels | 8px (0.5rem) | `{rounded.md}` |
| Tooltips | 4px (0.25rem) | `{rounded.sm}` |
| HP bars | 4px | - |
| Legacy small action buttons | 3px | - |

No fully rounded (pill) shapes are used anywhere.

Small action buttons (WorkersPanel +/- buttons, Path item +/- buttons) use `border-radius: 3px`. This is a legacy holdover. The standard for new buttons is 4px.

## Components

### Button

**File:** `src/components/Button.tsx` + `Button.module.css`

The shared game action button. All interactive game actions must use this component, not inline styled `<button>` elements.

- Fixed minimum width `11rem` (`--game-btn-min-width`)
- Left-aligned label with right-aligned count display
- Cooldown progress bar: fills from `--game-btn-hover-bg`, shrinks left-to-right with CSS transition
- Cost tooltip on hover: structured list of resource name | amount
- Disabled state: `opacity: 0.4`, `cursor: not-allowed`
- Hover: background transitions from `--game-btn-bg` to `--game-btn-hover-bg`
- Press: `transform: scale(0.95)`
- Transition: `all 0.15s ease`

### Header Tab

**File:** `src/components/Header.tsx` + `Header.module.css`

Scene navigation tabs at the top of the center column.

- Active tab: `color: var(--game-text-primary)`, `font-weight: 700`, `border-bottom: 2px solid`, `opacity: 1`
- Inactive tab: `color: var(--game-text-body)`, `border-color: transparent`, `opacity: 0.45`
- Padding: `12px 16px`
- Font: monospace, `0.875rem` (14px)

### Event Overlay

**File:** `src/components/EventOverlay.tsx` + `EventOverlay.module.css`

Modal overlay for random events and encounters.

- Fixed inset positioning with `15vh` top offset
- Semi-transparent backdrop (`rgba(0, 0, 0, 0.4)`)
- White panel with `max-width: 32rem`
- `border-radius: 8px` (`{rounded.md}`)
- `box-shadow: 0 10px 40px rgba(0,0,0,0.4)`
- Fade-in animation: `eventFadeIn 0.2s ease-out` (opacity 0 to 1, translateY -16px to 0)
- Title: `font-weight: 700`, `letter-spacing: var(--game-tracking-tight)`
- Body text: `0.875rem`, `line-height: 1.5`
- Action buttons stacked vertically, full width

### Combat Overlay

**File:** `src/combat/CombatOverlay.tsx` + `CombatOverlay.module.css`

Combat UI, rendered inside the EventOverlay panel.

- Two-column fighter display (player vs enemy)
- HP bar: `8px` height, `--game-accent` fill color, `0.3s` width transition
- Weapons grid: `grid-template-columns: 1fr 1fr`, small action buttons
- Damage float animation: `dmgFloat 0.7s ease-out` (upward fade, translateY -24px)
- Heal row: two side-by-side buttons
- Flee button: full width, muted text color

### Workers Panel

**File:** `src/components/WorkersPanel.tsx` + `WorkersPanel.module.css`

Worker assignment panel displayed in the Outside scene.

- 2-column grid layout: left = job name + count, right = action buttons
- Action buttons: `+1`, `+10`, `-1`, `-10` pattern
- Small compact buttons: `padding: 0.1rem 0.4rem`, `font-size: 0.65rem`
- Hover resource tooltip: absolute positioned overlay showing per-worker income rates
- Disabled buttons: `opacity: 0.35`

### Narrative Entry

**File:** `src/components/NarrativeSection.tsx`

Individual narrative text entries in the left panel.

- Font: `0.7rem` (11.2px), `line-height: 1.6`
- Opacity transitions: `1s` for older entries fading toward 0.5
- Newest entry: slide-in animation (`narrSlideIn 0.4s ease-out`)
- Index-based opacity decay: `max(1 - index * 0.08, 0.5)`

### World Map Tile

**File:** `src/rooms/World.tsx` + `World.module.css`

CSS Grid world map tiles in the World scene.

- Grid: 61 columns x 61 rows (`repeat(61, 1.6ch)` x `repeat(61, 1.2em)`)
- Font: `monospace`, `0.75rem`
- Player marker: `@` character
- Current tile: `2px solid var(--game-accent)` outline
- Masked (unexplored) tiles: `visibility: hidden`
- Terrain backgrounds: `forest (#1a3a1a)`, `field (#3a3a1a)`, `barrens (#2a2a2a)`, `road (#3a2a1a)`
- Landmark tiles: bold accent color, colored terrain character

## Do's and Don'ts

- Do use the shared `Button` component for all game actions; don't inline button styles with Tailwind
- Do reference `var(--game-*)` CSS tokens for colors, fonts, spacing; don't hardcode values
- Do use CSS Modules (`.module.css`) for component-scoped styles; don't use global class names for isolated components
- Do maintain the monochrome palette; don't add colored highlights for UI elements
- Do use font-weight (600/700) or underlines for emphasis; don't add colored highlights
- Don't duplicate small button patterns (like +/- in WorkersPanel, World HUD, Path); extract shared tokens
- Don't mix border-radius values; buttons 4px, modals 8px, small action buttons 3px (legacy)
- Don't mix transition durations; standardize on `0.15s ease` for interactive elements
- Don't use border for layout separation; only buttons and modals have borders
- Don't use Tailwind color classes directly (e.g. `text-gray-500`); always use `text-(--game-*)`
- Don't add new CSS animations without registering keyframes in `index.css`
