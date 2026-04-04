# BlitzPress Admin Shell + Navigation Prompt

Use the UI kit defined in `00-design-system-uikit.md` (Minimalist Executive UI Kit) and design the **global admin shell** for BlitzPress.

## Goal

Create the persistent admin layout that all BlitzPress pages and plugin-contributed pages will live inside, adopting the "Digital Atelier" premium aesthetic.

## Product constraints

BlitzPress needs a shell that:
- feels like a high-end editorial workspace
- supports plugin-contributed menu items
- supports dashboard, plugins, settings, and future extensions
- works well on desktop first, then tablet and mobile

## Required navigation structure

Design the shell with these core elements:
- **Sidebar**: Fixed 256px width. Light grey/blue background. Features a vertical Electric Blue (`#0052FF`) indicator bar on the left edge of active nav items. Active items use a blue icon and bold text. Supports nested items with subtle indentation.
- **Top Nav**: Sticky positioning with a backdrop-blur effect. Includes a centered search bar (light gray background), utility icons (bell, gear), a prominent primary "Publish" button in Electric Blue, and a user profile indicator.
- **Content Area**: Soft blue-white background (`#F9F9FF`) that allows white content cards to pop.

## What to design

Produce:
- 256px left sidebar navigation
- sticky top utility/header region
- page container behavior
- plugin-injected nav item treatment
- active, hover, expanded, collapsed, and disabled states

## Functional considerations

The shell must support nested nav items (e.g., Dashboard, Posts -> All Posts / New Entry, Settings) and remain elegant even when populated with third-party plugin menus.

## Deliverables

Provide:
- main shell screen
- collapsed-shell variant
- mobile nav variant
- annotation of spacing, sticky areas, and the active state indicator
