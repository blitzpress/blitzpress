# Design Specification: Minimalist Executive UI Kit

## 1. Creative North Star: "The Digital Atelier"
A high-end, editorial-inspired workspace that replaces the "utility-first" clutter of traditional CMS interfaces with a "content-first" focus. It feels like a premium productivity tool for creators, balancing professional depth with airy, modern aesthetics.

## 2. Visual Foundation & Theme
*   **Color Palette:**
    *   **Primary Accent:** `#0052FF` (Electric Blue) - Used for primary CTAs, active states, and progress indicators.
    *   **Surface (Light):** `#F9F9FF` (Soft Blue-White) - Base background.
    *   **Surface (Elevated):** `#FFFFFF` (Pure White) - Card backgrounds and modal surfaces.
    *   **Text (Heading):** `#141B2B` (Deep Navy) - High contrast for typography.
    *   **Text (Body/Secondary):** `#565E71` (Cool Slate) - For metadata and labels.
*   **Typography:**
    *   **Font Family:** Inter (or similar clean sans-serif).
    *   **Styles:** Large, bold headings (`font-semibold`) for page titles; medium weight (`font-medium`) for navigation; small, uppercase labels for categorization.
*   **Roundness:** `ROUND_FOUR` (4px or 8px) - Subtle, professional radius on buttons, cards, and input fields.
*   **Elevation:** Light, diffuse shadows (`shadow-sm`) to create depth without visual noise.

## 3. UI Components & Layout
*   **Sidebar (The Navigator):**
    *   **Width:** Fixed at 256px (64rem).
    *   **Structure:** Vertical stack with a top brand logo, primary navigation links with icons, and a footer section for settings/support.
    *   **Active State:** Vertical blue bar on the left edge, bold text, and a subtle background shift.
    *   **Nested Navigation:** Indented sub-items that appear on click/hover to manage high plugin density.
*   **Top Navigation (The Context Bar):**
    *   **Behavior:** Sticky at the top with a `backdrop-blur-xl` effect (70% opacity).
    *   **Content:** Centered or left-aligned search bar, notification/settings icons on the right, and a prominent "Publish" or "New Entry" primary CTA.
*   **Dashboard Cards (The Modules):**
    *   **Layout:** Responsive grid (12-column).
    *   **Design:** White backgrounds with subtle borders or soft shadows. Clear hierarchy: Big number (Metric) -> Label -> Trend Indicator.
*   **Activity Feed:**
    *   **Style:** Vertical list with status-colored dots (e.g., blue for "Draft", green for "Live").
    *   **Typography:** Small, high-contrast text for the action; muted text for the timestamp.

## 4. Interaction Principles
*   **Subtlety:** Hover states use soft background shifts (e.g., `hover:bg-white/50`) rather than harsh color changes.
*   **Consistency:** All interactive elements (buttons, links, inputs) follow the same rounding and spacing logic.
*   **Whitespace:** Generous padding (typically `p-6` or `p-8`) to prevent the "cluttered admin" feel.