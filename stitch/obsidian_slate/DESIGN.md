```markdown
# Design System Document: The Editorial Executive

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Atelier"**
This design system moves away from the "utility-first" clutter of traditional WordPress dashboards and toward a high-end, editorial experience. It treats data and CMS controls with the same reverence as a luxury fashion layout. By prioritizing breathing room (whitespace), hyper-refined typography, and a "No-Line" philosophy, we transform a functional tool into a premium workspace. The goal is to reduce cognitive load while making the user feel like a curator rather than a data-entry clerk.

## 2. Colors: Tonal Depth & The "No-Line" Rule
We reject the rigid, boxed-in nature of standard dashboards. Instead of using lines to separate ideas, we use light.

*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a sidebar using `surface-container-low` (#f1f3ff) should sit directly against a `surface` (#f9f9ff) main content area.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of physical layers. 
    *   **Level 0 (Base):** `surface` (#f9f9ff)
    *   **Level 1 (Sections):** `surface-container-low` (#f1f3ff) or `surface-container` (#e9edff)
    *   **Level 2 (Cards/Interaction):** `surface-container-lowest` (#ffffff)
*   **The "Glass & Gradient" Rule:** To provide "soul," floating modals or navigation overlays should use Glassmorphism. Utilize `surface` colors with a 70% opacity and a `24px` backdrop-blur. 
*   **Signature Textures:** For high-impact actions (e.g., "Publish" or "Update"), use a subtle linear gradient from `primary` (#003ec7) to `primary-container` (#0052ff) at a 135-degree angle. This adds a "lithographic" depth that flat colors lack.

## 3. Typography: The Editorial Voice
We use **Inter** as our typographic engine. It provides the mechanical precision required for a dashboard while maintaining an elegant, Swiss-inspired aesthetic.

*   **Display & Headlines:** Use `display-md` and `headline-lg` for dashboard overviews. These should be set with a slightly tighter letter-spacing (-0.02em) to feel authoritative and "inked."
*   **The Body-Label Relationship:** `body-md` (0.875rem) is our workhorse for content. However, we elevate the interface by using `label-md` (0.75rem) in `secondary` (#565e71) for meta-data and descriptions. This creates a clear visual distinction between user-generated content and system-generated UI labels.
*   **Weight as Hierarchy:** Never use "Bold" (700) for body text; stick to "Medium" (500) or "Semi-Bold" (600) to maintain the premium, light-handed feel.

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often too "heavy" for a clean, modern WordPress experience. We use **Tonal Layering** to create a sense of object permanence.

*   **The Layering Principle:** Depth is achieved by "stacking." A white card (`surface-container-lowest`) placed on a light grey background (`surface-container-low`) creates a natural lift without a single shadow pixel.
*   **Ambient Shadows:** For floating elements like dropdown menus or popovers, use an "Ambient Light" shadow: 
    *   `box-shadow: 0 12px 40px rgba(20, 27, 43, 0.06);` (Using a tint of `on-surface` rather than pure black).
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge (e.g., in high-contrast modes), use a "Ghost Border." Apply the `outline-variant` (#c3c5d9) at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use semi-transparent `surface_container_highest` for "pinned" headers. This allows the page content to "bleed through" as the user scrolls, creating a sense of continuity.

## 5. Components: Refined Primitives

*   **Buttons:**
    *   **Primary:** Gradient of `primary` to `primary-container`, `xl` (0.75rem) roundedness.
    *   **Secondary:** `surface-container-high` background with `on-secondary-container` text. No border.
    *   **Tertiary:** Pure text using `primary` with a `surface-container-low` background on hover.
*   **Cards:** No borders. Use `surface-container-lowest` (#ffffff) with `xl` (0.75rem) corner radius. Use vertical whitespace (32px or 48px) to separate card sections instead of dividers.
*   **Input Fields:** Use `surface-container-low` as the field background. On focus, transition to `surface-container-lowest` with a 1px "Ghost Border" of `primary`.
*   **Checkboxes & Radios:** Use the `tertiary` (#005a3d / Emerald) color for "Success" or "On" states to provide a sophisticated alternative to the standard blue.
*   **Status Badges (Chips):** Use `surface-container-high` with `label-sm` text. For status (e.g., "Draft" or "Published"), use a small 6px circle of the accent color (Emerald for Published, Electric Blue for Draft) next to the text rather than coloring the whole pill.
*   **The Navigation Sidebar:** Use `surface-container-low`. Active states should not use a "block" of color, but rather a `primary` color vertical pill (4px wide) on the left edge with a subtle weight change in the typography.

## 6. Do's and Don'ts

### Do
*   **DO** use asymmetric layouts. For example, a wide main content column balanced by a much narrower, "floating" settings rail.
*   **DO** embrace white space. If a section feels "busy," double the padding before you try adding a line.
*   **DO** use `tertiary` (Emerald) for growth-oriented metrics and `error` (Refined Red) only for critical system failures.

### Don't
*   **DON'T** use 100% black (#000000). Use `on-surface` (#141b2b) for all "black" text to maintain tonal harmony with the charcoal/blue palette.
*   **DON'T** use standard 1px dividers. If you must separate content, use a 8px or 12px gap of the background color (`surface`).
*   **DON'T** use "sharp" corners. Everything should have at least a `md` (0.375rem) radius to feel approachable and modern.
*   **DON'T** overcrowd the sidebar. WordPress dashboards are notorious for "plugin-creep." Use collapsible "Surface Tiers" to hide secondary functions.```