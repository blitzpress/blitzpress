# BlitzPress Dashboard / Overview Prompt

Use the UI kit defined in `00-design-system-uikit.md` and the shell from `01-admin-shell-navigation.md`.

## Goal

Design the BlitzPress **Dashboard** page: the first screen after entering the admin panel.

## Product context

BlitzPress exposes a `dashboard.widgets` extension point, so the dashboard must work for both core widgets and plugin-contributed widgets.

## Page objectives

The dashboard should:
- give a fast sense of system health and activity
- feel operational and trustworthy
- allow plugin widgets to fit naturally into the page
- avoid feeling cluttered or overly enterprise-heavy

## What to design

Create a dashboard with a responsive widget system that can support:
- welcome/overview card
- key stats cards
- recent activity or event stream
- plugin status summary
- plugin-contributed widgets of varying content density
- quick actions area if it helps orientation

## Widget behavior

Design a widget container pattern that supports:
- title
- optional description
- action menu
- body content with different densities
- loading state
- empty state
- error state

## Layout requirements

Show:
- desktop multi-column widget grid
- tablet adaptation
- mobile stacked layout
- rules for balancing system widgets and plugin widgets

## Deliverables

Provide:
- primary dashboard design
- example widget variations
- loading/empty/error widget states
- responsive layouts
- short rationale for how plugin widgets stay visually native
