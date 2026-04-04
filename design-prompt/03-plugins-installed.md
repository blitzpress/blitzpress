# BlitzPress Plugins / Installed Plugins Prompt

Use the UI kit defined in `00-design-system-uikit.md` and the shell from `01-admin-shell-navigation.md`.

## Goal

Design the **Installed Plugins** admin page for BlitzPress, inspired by WordPress plugin management but cleaner, more structured, and more operational.

## Product context

BlitzPress tracks plugins with statuses such as:
- loaded
- disabled
- error

Plugins may also have:
- version
- author
- description
- capabilities
- frontend presence
- settings availability
- load/runtime errors

## Page objectives

The page should help admins:
- understand what is installed
- scan status quickly
- enable/disable plugins confidently
- open plugin settings or plugin pages
- inspect failures without leaving the page

## What to design

Create a page that includes:
- page header and actions
- filter/search toolbar
- strong table-first layout
- row status badges
- row action menu
- inline or expandable error diagnostics
- empty state for no plugins
- error/partial-load state when some plugins fail

## Table requirements

The table should support columns such as:
- plugin name
- id/slug
- version
- author
- capabilities
- frontend
- status
- actions

Show how to handle:
- long descriptions
- multi-line metadata
- dense technical data without visual mess
- mobile fallback where rows become cards

## Actions to account for

Design affordances for:
- enable
- disable
- open settings
- open plugin page
- view errors / diagnostics

## Deliverables

Provide:
- primary installed plugins screen
- table row states for loaded/disabled/error
- expanded diagnostics example
- empty state
- responsive/mobile adaptation
