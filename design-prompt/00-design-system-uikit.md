# BlitzPress Admin UI Kit + Design System Prompt

You are a senior product designer creating the master UI kit and design system for **BlitzPress**, a modern CMS inspired by WordPress but rebuilt for speed, plugin extensibility, and a cleaner admin experience.

## Product context

BlitzPress is:
- a Go-based CMS with a SolidJS admin SPA
- plugin-driven, with runtime-loaded backend and frontend plugins
- architecturally inspired by WordPress hooks, filters, widgets, menus, and settings flows
- intended to feel familiar to WordPress users without looking dated or overly heavy

The admin panel must feel:
- trustworthy and operational
- fast, clear, and slightly technical
- extensible for third-party plugins
- simpler and more premium than classic WordPress admin

## Design goal

Create a **complete UI kit and admin design language** for BlitzPress that can scale across current pages and future plugin-contributed pages.

## Visual direction

Design a system that is:
- structurally familiar to WordPress admin
- visually more modern, spacious, and polished
- optimized for data-heavy admin workflows
- strong in tables, forms, cards, empty states, and settings pages
- clean enough for developers, approachable enough for content/admin users

Use a restrained visual language:
- neutral foundations
- one primary accent color system
- clear semantic colors for success, warning, danger, info
- subtle depth, not flashy gradients everywhere
- strong typography hierarchy and dense-but-readable spacing options

## Required deliverables

Produce:
1. design tokens
2. color system for light mode and optional dark mode direction
3. typography scale
4. spacing, radius, border, shadow, and iconography rules
5. layout grid and responsive behavior
6. complete component library with states and variants
7. table system for admin/data workflows
8. form system for schema-driven settings UIs
9. mobile and tablet responsive patterns
10. accessibility guidance for contrast, focus, keyboard flow, and touch targets
11. plugin-extensible patterns so third-party pages still feel native to BlitzPress

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
- app shell with sidebar + top bar + page content region
- page header with title, description, actions, breadcrumbs/back link
- content widths for dashboard, settings, and data-heavy pages
- multi-column layouts that gracefully collapse on smaller screens
- sticky save bars, filter bars, and table toolbars where appropriate

## Components the UI kit must include

Include all needed variants, hover/focus/disabled/error/loading states, and mobile adaptations for:

### Foundations
- color tokens
- typography tokens
- spacing scale
- elevation/shadows
- borders/dividers
- radii
- icon rules
- motion/interaction guidance

### Navigation
- sidebar
- nav section labels
- nav item
- nested nav item
- top bar
- breadcrumb
- tabs / segmented controls
- contextual sub-navigation

### Actions
- primary button
- secondary button
- tertiary button
- destructive button
- icon button
- split button or dropdown action button
- button group

### Feedback
- badge
- status pill
- inline validation message
- banner / alert
- toast / snackbar
- skeleton loader
- spinner
- progress indicator
- empty state
- error state
- success confirmation pattern

### Data display
- stat card
- metric card
- standard card
- widget container
- table
- table toolbar
- sortable header
- row actions
- pagination
- list item
- description list / key-value block
- log/error panel
- code/JSON snippet display
- chart container patterns suitable for plugin widgets

### Forms
- text input
- textarea
- number input
- select
- checkbox
- radio group
- toggle / switch
- color input
- URL input
- email input
- search input
- field group
- section card
- sticky save bar
- helper text / hint / description
- custom component slot container for plugin-defined fields

### Overlays and utility surfaces
- modal
- confirmation dialog
- drawer / side panel
- dropdown menu
- tooltip
- contextual menu

## Table system requirements

The table design is critical. Create a reusable admin table system with:
- comfortable and compact density options
- bulk selection pattern
- sortable columns
- filter/search toolbar
- inline status badges
- row-level action menus
- expandable rows or detail reveal for errors/diagnostics
- horizontal overflow handling for smaller screens
- a mobile card-list fallback pattern

## Settings system requirements

BlitzPress supports schema-driven settings UIs. The form system must feel excellent for:
- long settings forms
- multiple sections
- mixed field types
- validation states
- autosave vs explicit save exploration
- custom plugin settings components that replace or augment the default form
- clear dirty, saving, saved, and failed-save states

Supported field types to visualize:
- string
- text
- number
- boolean
- select
- color
- url
- email
- custom component slot

## Responsiveness

Show how the system works at:
- desktop admin workspace
- tablet
- mobile

Specifically solve for:
- collapsing the sidebar into a drawer
- stacking dashboard widgets
- converting wide tables into usable responsive patterns
- turning multi-column settings layouts into single-column flows
- keeping action areas accessible without crowding the screen

## Accessibility and UX constraints

Ensure:
- AA-friendly contrast
- visible keyboard focus
- minimum tap target comfort
- predictable interaction states
- good readability in dense admin views
- status colors are not the only signal

## Output format

Deliver:
- one page showing the full visual language
- component inventory with variants/states
- responsive references
- annotations explaining the system logic
- a concise rationale for why this feels like “modern WordPress for developers” without copying WordPress visually
