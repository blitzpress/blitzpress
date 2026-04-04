# BlitzPress Plugin-Contributed Admin Page Prompt

Use the UI kit defined in `00-design-system-uikit.md` and the shell from `01-admin-shell-navigation.md`.

## Goal

Design the **default page pattern for plugin-contributed admin pages** inside BlitzPress.

## Product context

Plugins can register frontend pages and menu items dynamically. Their pages must feel native to BlitzPress even though the content can vary widely.

## Design challenge

Create a flexible page template that can host:
- data tables
- settings-like forms
- widget/card dashboards
- lists and detail panels
- plugin-specific operational content

## What to design

Produce a reusable plugin page archetype that includes:
- page header pattern
- optional breadcrumb/back link
- action area
- primary content zone
- optional secondary side panel
- tabs or sub-navigation if needed
- consistent spacing and empty/loading/error states

## Required examples

Show at least these page compositions:
1. data-heavy page with table + filters + actions
2. mixed content page with cards/widgets + side information panel

## Native-feel constraints

The design should make third-party pages feel first-party by defining:
- max widths and spacing rhythm
- card and table behavior
- action placement rules
- typography and metadata rules
- plugin branding constraints so pages do not feel visually fragmented

## Responsive behavior

Show:
- desktop layout
- tablet adaptation
- mobile stacking rules

## Deliverables

Provide:
- reusable plugin page template
- two filled examples
- loading/empty/error states
- annotations that explain how extensions remain visually consistent with the core admin
