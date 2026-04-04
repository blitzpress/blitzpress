# BlitzPress Dashboard / Overview Prompt

Use the UI kit defined in `00-design-system-uikit.md` (Minimalist Executive UI Kit) and the shell from `01-admin-shell-navigation.md`.

## Goal

Design the BlitzPress **Dashboard** page, serving as a premium "At a Glance" pulse of the digital publication.

## Product context

The dashboard uses a 12-column responsive grid to host both core widgets and plugin-contributed widgets, all adhering to the clean, elevated aesthetic of the Digital Atelier.

## Page objectives

The dashboard should:
- give a fast, visually pleasing sense of system health and activity
- feel premium, spacious, and highly legible
- allow plugin widgets to fit naturally into the page

## What to design

Create a dashboard with specific widget archetypes:
- **Page Header**: "At a Glance" with a soft, editorial subtitle.
- **Bar Chart Card ("Impression Volume")**: Clean white card, light diffuse shadow. Simple bar chart where the active data point is Electric Blue (`#0052FF`) and others are soft light gray.
- **Primary Stat Card ("Total Subscribers")**: Bold card with an Electric Blue background, crisp white typography, and a subtle watermark/icon graphic to add depth.
- **Secondary Stat Card ("Average Read Time")**: White background, massive clean typography for the main metric, accompanied by status indicators.
- **List/Feed Card ("Recent Activity")**: Crisp list items with icons in rounded squares, high-contrast titles (`#141B2B`), subtle meta text (`#565E71`), and status dots (e.g., blue for Draft, green for Live).
- **Media/Insight Card ("Featured Insight")**: Image placed seamlessly at the top of the card with clean typography below.

## Widget behavior

Design a widget container pattern that supports 4-8px radius, crisp white backgrounds (`#FFFFFF`), and light diffuse shadows.

## Deliverables

Provide:
- primary dashboard design using the 12-column grid
- the specific widget variations described above
- responsive layouts (stacking rules for mobile)
