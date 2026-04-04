# BlitzPress Admin UI Kit + Design System Prompt

You are a senior product designer creating the master UI kit and design system for **BlitzPress**, a modern CMS.

## Product context

BlitzPress is:
- a Go-based CMS with a SolidJS admin SPA
- plugin-driven, with runtime-loaded backend and frontend plugins
- shifting from a utilitarian aesthetic to a premium, high-end editorial workspace

The admin panel must feel:
- like a "Digital Atelier" - a premium productivity tool for creators
- fast, clear, and highly polished
- extensible for third-party plugins
- far beyond classic CMS admin panels in terms of visual refinement

## Design goal

Create the **Minimalist Executive UI Kit** for BlitzPress. Establish a design language that feels like a high-end editorial tool, replacing utility-first clutter with subtlety, consistency, and generous whitespace.

## Visual direction

Design a system based on the "Digital Atelier" theme:
- **Primary Accent**: Electric Blue (`#0052FF`). Used for primary actions, active states, and key data visualization.
- **Surfaces & Backgrounds**: Soft blue-white backgrounds (`#F9F9FF` or `#F4F6F8`) with crisp, elevated white (`#FFFFFF`) cards.
- **Typography**: Clean sans-serif, exclusively **Inter**. Large, bold, high-contrast headings (`#141B2B`) and softer, legible body text (`#565E71`).
- **Shapes**: Professional 4-8px border radius for cards, buttons, and inputs.
- **Elevation**: Light, diffuse shadows that provide subtle depth without being overpowering.

## Required deliverables

Produce:
1. design tokens (colors, typography, spacing)
2. color system optimized for the "Digital Atelier" aesthetic
3. typography scale emphasizing clear hierarchy and editorial feel
4. spacing, radius (4-8px), border, shadow, and iconography rules
5. layout grid (12-column) and responsive behavior
6. complete component library with states and variants
7. clean table system for admin/data workflows
8. minimalist form system for schema-driven settings UIs
9. mobile and tablet responsive patterns
10. plugin-extensible patterns so third-party pages match the premium aesthetic

## Navigation and page inventory to support

The system must support these current-scope admin experiences:
- Admin shell and navigation
- Dashboard / Overview
- Plugins / Installed Plugins
- Plugin Settings
- Plugin-contributed Admin Pages
- Core / Global Settings

## Core layout patterns

Define layout rules for:
- app shell with 256px sidebar + sticky top bar + page content region
- page header with prominent title, description, and primary CTA
- 12-column grid for dashboard and data pages
- multi-column layouts that gracefully collapse on smaller screens

## Components the UI kit must include

Include all needed variants, hover/focus/disabled/error/loading states:
(Same foundational, navigation, action, feedback, data display, form, and overlay components as standard, but styled to the new premium aesthetic).

## Output format

Deliver:
- one page showing the full visual language
- component inventory with variants/states
- responsive references
- annotations explaining the system logic
