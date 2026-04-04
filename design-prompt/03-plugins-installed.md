# BlitzPress Plugins / Installed Plugins Prompt

Use the UI kit defined in `00-design-system-uikit.md` (Minimalist Executive UI Kit) and the shell from `01-admin-shell-navigation.md`.

## Goal

Design the **Installed Plugins** admin page for BlitzPress, elevating plugin management to a premium, highly readable experience.

## Product context

Plugins have statuses (loaded, disabled, error) and metadata (version, author, capabilities). 

## Page objectives

The page should:
- utilize generous whitespace and the Inter typography scale for maximum legibility
- present data tables that feel light and unobtrusive
- use Electric Blue (`#0052FF`) for primary actions and clear semantic colors for statuses

## What to design

Create a page that includes:
- premium page header and actions
- filter/search toolbar with 4-8px radius inputs
- clean table layout with subtle borders and ample padding
- crisp row status badges/pills
- inline or expandable error diagnostics that maintain the clean aesthetic
- elegant empty states

## Table requirements

The table should feel like an editorial data display, not a dense spreadsheet:
- plugin name (bold, `#141B2B`)
- description (soft, `#565E71`)
- status pills (clean background, bold dot/text)
- subtle row action menus

## Deliverables

Provide:
- primary installed plugins screen
- table row states for loaded/disabled/error
- empty state
- responsive/mobile adaptation (e.g., elegant card fallbacks)
