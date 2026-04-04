# BlitzPress Admin Shell + Navigation Prompt

Use the UI kit defined in `00-design-system-uikit.md` and design the **global admin shell** for BlitzPress.

## Goal

Create the persistent admin layout that all BlitzPress pages and plugin-contributed pages will live inside.

## Product constraints

BlitzPress needs a shell that:
- feels familiar to WordPress users
- supports plugin-contributed menu items
- supports dashboard, plugins, settings, and future extensions
- remains stable when pages are data-heavy or form-heavy
- works well on desktop first, then tablet and mobile

## Required navigation structure

Design the shell for these primary sections:
- Dashboard
- Plugins
- Settings

Inside Plugins, account for:
- Installed Plugins
- Plugin Settings pages
- Plugin-contributed admin pages injected through menu extensions

## What to design

Produce:
- left sidebar navigation
- top utility/header region
- page container behavior
- breadcrumb/back-link pattern
- page title and action bar pattern
- plugin-injected nav item treatment
- active, hover, expanded, collapsed, and disabled states

## Functional considerations

The shell must support:
- nested nav items
- long plugin names without breaking layout
- badges/status indicators in navigation when useful
- empty or sparse navigation gracefully
- future auth/user menu placement without over-designing it

## Responsive behavior

Show how the shell adapts for:
- full desktop sidebar
- collapsed icon-only sidebar
- tablet drawer
- mobile off-canvas navigation

## Deliverables

Provide:
- main shell screen
- collapsed-shell variant
- mobile nav variant
- annotation of spacing, sticky areas, and plugin-extension behavior
