# BlitzPress Plugin Settings Prompt

Use the UI kit defined in `00-design-system-uikit.md` and the shell from `01-admin-shell-navigation.md`.

## Goal

Design the **Plugin Settings** page pattern for BlitzPress at `/admin/plugins/{id}/settings`.

## Product context

Plugin settings are schema-driven. The system supports fields like:
- string
- text
- number
- boolean
- select
- color
- url
- email
- custom component slot

A plugin may also replace the default generated form with a custom settings component.

## Page objectives

The page should:
- make schema-driven settings feel premium, not generic
- support long forms and multiple sections
- clearly communicate save/dirty/success/error states
- handle both simple forms and plugin-defined custom content gracefully

## What to design

Create a reusable settings page pattern with:
- plugin identity block in the header
- section navigation or section grouping
- field layout rules
- field descriptions/help text
- inline validation
- sticky save bar or equally strong save pattern
- custom component area treatment

## Required states

Show:
- default auto-generated settings form
- a section containing mixed field types
- custom component region replacing part or all of the standard form
- loading state while schema/values load
- validation error state
- saved state
- failed-save state
- empty state when a plugin has no configurable settings

## Responsive requirements

Show how the page behaves for:
- two-column desktop forms if appropriate
- single-column tablet/mobile fallback
- sticky actions that remain usable on small screens

## Deliverables

Provide:
- main plugin settings page
- state variations
- responsive adaptations
- annotation for schema-driven rendering and custom-component override behavior
