# BlitzPress Plugin-Contributed Admin Page Prompt

Use the UI kit defined in `00-design-system-uikit.md` (Minimalist Executive UI Kit) and the shell from `01-admin-shell-navigation.md`.

## Goal

Design the **default page pattern for plugin-contributed admin pages** inside BlitzPress.

## Design challenge

Create a flexible page template that maintains the "Digital Atelier" premium aesthetic regardless of the content injected by third-party plugins.

## What to design

Produce a reusable plugin page archetype that includes:
- page header pattern with Inter typography (`#141B2B`)
- primary content zone utilizing crisp white (`#FFFFFF`) cards with light diffuse shadows on a soft background (`#F9F9FF`)
- consistent spacing and empty/loading/error states that match the core design

## Native-feel constraints

The design should make third-party pages feel first-party by strictly enforcing:
- max widths and the 12-column grid rhythm
- 4-8px radius card and table behavior
- Electric Blue (`#0052FF`) for primary actions

## Deliverables

Provide:
- reusable plugin page template
- two filled examples (one data-heavy, one mixed content)
- annotations explaining how extensions inherit the premium visual language
