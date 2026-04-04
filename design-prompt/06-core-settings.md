# BlitzPress Core / Global Settings Prompt

Use the UI kit defined in `00-design-system-uikit.md` and the shell from `01-admin-shell-navigation.md`.

## Goal

Design the **Core / Global Settings** page pattern for BlitzPress.

## Product context

The architecture strongly implies a settings experience beyond per-plugin settings. This page should establish how BlitzPress handles first-party settings in a WordPress-familiar but cleaner way.

## Important constraint

Do not invent final product requirements. Use representative placeholder settings only to demonstrate layout and interaction patterns.

## Page objectives

The page should:
- feel like the authoritative home for system-level configuration
- scale to multiple settings sections
- support schema-driven first-party forms
- stay readable even when the form becomes long and technical

## What to design

Create a core settings page with:
- page header
- section navigation or tabs
- grouped settings cards/panels
- strong label/help text hierarchy
- sticky save pattern
- success, validation, and failure feedback

Use representative placeholder groups such as:
- General
- Admin Experience
- Plugin Defaults
- System / Environment (read-only styling if helpful)

## Required states

Show:
- default populated state
- validation error state
- saved state
- loading state
- long-form scrolling behavior

## Responsive behavior

Show:
- desktop
- tablet
- mobile single-column flow

## Deliverables

Provide:
- main core settings screen
- state variations
- responsive adaptation
- annotations showing how this differs from plugin settings while remaining in the same design language
