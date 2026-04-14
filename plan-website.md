# BlitzPress Presentation Website Plan

## Planning Goal

Create a presentation website that explains BlitzPress as both:

1. A modern CMS platform
2. A Go-powered plugin platform inspired by WordPress's extensibility model

The site should communicate the product idea clearly before it tries to sell individual features:

- BlitzPress keeps the extensibility mindset people understand from WordPress.
- It replaces the old PHP-style model with Go, compiled plugins, typed contracts, and a modern SolidJS admin UI.
- It is not just a CMS app; it is a developer platform for building CMS extensions safely and cleanly.
- It should present implemented features separately from roadmap or in-progress areas.

## Core Product Story To Reflect

Based on `BLITZPRESS-OVERVIEW.md`, the Kiro specs, and the other markdown plans, the main story behind BlitzPress is:

- A high-performance CMS written in Go.
- A plugin-first architecture with runtime-loaded `.so` plugins.
- A stable public SDK for plugin authors.
- WordPress-style hooks, actions, and filters, but with typed interfaces.
- A SolidJS admin frontend that can load plugin frontends dynamically without rebuilding the core.
- Automatic route namespacing, plugin manifests, settings schemas, and frontend/runtime registration.
- A monorepo developer workflow with build scripts, hot reload, example plugin, and manager CLI.
- Emerging auth and role/capability architecture through `users-plugin`.

## Website Positioning Principle

The website should avoid sounding like a generic CMS homepage. It should position BlitzPress as:

- "WordPress-style extensibility, rebuilt for Go"
- "A plugin-driven CMS for developers who want speed, structure, and type safety"
- "A modern admin runtime where backend plugins and frontend extensions meet"

## Recommended Page List

### 1. Home

**Purpose**
Introduce BlitzPress quickly, establish the value proposition, and direct visitors to the right next step.

**Key Information**

- Hero statement explaining BlitzPress in one sentence:
  "A Go-powered CMS with WordPress-style extensibility, compiled plugins, and a modern SolidJS admin."
- Supporting subheadline focused on performance, security, and plugin architecture.
- Primary calls to action:
  - Explore the platform
  - View plugin architecture
  - Get started / read docs
- A short "Why it exists" section:
  - Traditional CMS flexibility is valuable
  - BlitzPress keeps extensibility but modernizes the stack
- A feature snapshot section with 4 to 6 cards:
  - Compiled Go plugins
  - Typed plugin SDK
  - Dynamic frontend plugin loading
  - Hook and event system
  - Built-in settings system
  - Dev-friendly monorepo workflow
- A visual architecture preview:
  - Core binary
  - Plugin runtime
  - Embedded SPA
  - Shared frontend modules
- A final CTA block for developers and plugin authors.

**Why This Page Matters**

- It gives non-technical visitors the elevator pitch.
- It gives technical visitors fast confidence that BlitzPress is more than another admin template.

### 2. Why BlitzPress

**Purpose**
Explain the idea behind the project and the problem it solves.

**Key Information**

- The inspiration from WordPress:
  - hooks
  - actions
  - filters
  - plugin ecosystem mindset
- The limitations BlitzPress is trying to improve:
  - older runtime model
  - weaker type guarantees
  - fragmented plugin integration
  - less modern frontend extension patterns
- The BlitzPress answer:
  - Go core
  - compiled plugins
  - stable SDK
  - runtime frontend module loading
  - better namespacing and cleaner contracts
- A comparison section framed around principles, not attacks:
  - familiarity of WordPress concepts
  - performance and structure of Go
  - modern frontend runtime
- A short section on who BlitzPress is for:
  - developers building custom CMS systems
  - teams that want extension points without PHP
  - product teams building admin-heavy platforms
  - plugin authors who want typed APIs

**Why This Page Matters**

- It sells the reasoning, not just the features.
- It helps users understand why BlitzPress exists at all.

### 3. Platform Features

**Purpose**
Present the complete feature set in a product-focused way.

**Key Information**

- Core CMS foundations:
  - embedded admin SPA
  - API routing
  - database layer with SQLite and PostgreSQL support
  - UUID v7 model strategy
- Plugin runtime:
  - manifest-driven discovery
  - compatibility validation
  - lifecycle loading
  - backend route mounting
  - static asset serving
- Extensibility:
  - hooks, actions, filters
  - async event bus
  - settings schema registration
  - plugin config access
- Frontend extension model:
  - plugin pages
  - widgets
  - frontend hooks
  - dynamic ES module loading
  - shared SolidJS runtime through import maps
- Operations and tooling:
  - build scripts
  - hot reload with Air
  - manager CLI
  - example plugin reference
- Honest status markers:
  - "implemented now"
  - "available in example/reference form"
  - "planned next"

**Why This Page Matters**

- This becomes the central reference page for the product surface.
- It supports both technical buyers and developer evaluators.

### 4. Plugin System

**Purpose**
Make the plugin architecture one of the headline differentiators of the website.

**Key Information**

- How plugins work:
  - plugin manifest
  - compiled `.so` module
  - exported `Plugin` symbol
  - registration lifecycle
- The SDK contract:
  - `Manifest()`
  - `Register()`
  - registrar access to hooks, HTTP, events, DB, settings, auth/config
- Route namespacing:
  - core routes under `/api/core/`
  - plugin routes under `/api/plugins/:id/`
  - plugin assets under `/plugins/:id/assets/`
- Extensibility primitives:
  - hooks
  - filters
  - events
  - settings schemas
- Frontend plugin story:
  - runtime plugin registration
  - plugin pages
  - widgets
  - custom settings components
  - shared dependency loading via import maps
- Example plugin walkthrough:
  - API route
  - admin page
  - settings
  - frontend bundle
  - static asset

**Why This Page Matters**

- This is likely the strongest strategic differentiator in the whole project.
- It deserves its own page instead of being buried inside a generic features page.

### 5. Admin Experience

**Purpose**
Show what BlitzPress feels like as a CMS product, not only as an engineering platform.

**Key Information**

- Dashboard overview:
  - widgets
  - quick status
  - plugin-aware runtime content
- Content management areas already represented in the admin:
  - posts
  - post editor
  - pages
  - media library
- System and extension areas:
  - plugins management
  - plugin settings pages
  - global settings
- Authentication and user management:
  - login flow
  - users
  - roles
  - capability-based access model
- Dynamic admin navigation that can be extended by plugins.
- Important honesty note:
  - comments, appearance, tools, updates, discussion, and privacy should be presented as planned/admin roadmap areas if they are not fully implemented yet.

**Why This Page Matters**

- Many visitors need proof that BlitzPress is a usable CMS, not only a backend framework.
- It translates architecture into a visible product experience.

### 6. Developer Experience

**Purpose**
Speak directly to builders who might adopt BlitzPress or create plugins for it.

**Key Information**

- Monorepo structure:
  - `core`
  - `plugin-sdk`
  - `manager`
  - example plugins
- Developer workflow:
  - Go workspace
  - build scripts
  - plugin build pipeline
  - frontend build flow
  - hot reload
- Tooling highlights:
  - manager CLI for listing, building, and serving
  - shared Vite plugin for plugin authors
  - example plugin as learning path
- Plugin author experience:
  - clear SDK boundaries
  - no dependency on core internals
  - typed extension surfaces
  - declarative settings and frontend registration
- Testing and reliability story:
  - Go tests
  - frontend tests
  - integration flow

**Why This Page Matters**

- Developers are a primary audience.
- This page turns the repo architecture into a product advantage.

### 7. Architecture

**Purpose**
Give technical visitors a clear mental model of how the whole system fits together.

**Key Information**

- High-level system diagram:
  - browser
  - embedded SPA
  - core binary
  - plugin runtime
  - shared ESM modules
  - database
- Request flow examples:
  - load core frontend
  - fetch plugin manifest list
  - dynamically import plugin frontend
  - call plugin API route
  - render plugin page
- Backend architecture:
  - config
  - database
  - plugin registry
  - hooks
  - event bus
  - auth registry
- Frontend architecture:
  - runtime registrar
  - page registry
  - widget registry
  - hook engine
  - import-map-based dependency sharing
- Deployment/packaging concept:
  - embedded frontend assets
  - plugin bundles in `build/plugins`

**Why This Page Matters**

- This page helps technical decision-makers trust the design.
- It also reduces friction for contributors and plugin authors.

### 8. Security And Performance

**Purpose**
Turn the project's architectural choices into concrete trust signals.

**Key Information**

- Why Go matters here:
  - performance
  - concurrency model
  - typed interfaces
  - explicit lifecycle control
- Plugin isolation through namespacing and manifest validation.
- Stable SDK boundary between core and plugins.
- Capability-driven auth direction via `users-plugin`.
- UUID v7 and explicit model patterns.
- Embedded assets and structured build output.
- Operational clarity:
  - lifecycle hooks
  - graceful shutdown
  - plugin enable/disable states
  - compatibility checks
- Messaging note:
  - focus on "designed for safer extensibility" rather than claiming perfect isolation.

**Why This Page Matters**

- It converts architectural decisions into business value.
- It is especially useful for engineering leads and technical founders.

### 9. Roadmap

**Purpose**
Show where the project is heading without confusing roadmap items with shipped functionality.

**Key Information**

- Near-term product expansion areas already hinted by docs and placeholder pages:
  - comments moderation
  - appearance/themes/menus/widgets
  - tools/import/export/site health
  - updates management
  - privacy/discussion settings
- Ecosystem growth:
  - more plugins
  - stronger auth and role management
  - richer admin modules
  - future plugin dependency handling
- Platform maturity directions:
  - better management flows
  - more plugin marketplace readiness
  - deeper frontend extensibility
- Suggested format:
  - "Available now"
  - "In progress"
  - "Planned next"

**Why This Page Matters**

- It creates momentum while staying honest.
- It helps early adopters understand the strategic direction.

### 10. Get Started

**Purpose**
Convert interest into action for developers.

**Key Information**

- What BlitzPress includes in the repo.
- Basic setup path:
  - clone
  - install frontend deps
  - build plugins
  - build core
  - run the app
- Quick paths for different audiences:
  - run the CMS
  - build your first plugin
  - inspect the example plugin
  - use the manager CLI
- Links to:
  - overview
  - SDK concepts
  - example plugin
  - architecture docs
- A short "first 15 minutes" walkthrough section.

**Why This Page Matters**

- A presentation website should not stop at storytelling.
- This page bridges marketing and adoption.

## Recommended Navigation

Top-level navigation:

- Home
- Why BlitzPress
- Features
- Plugin System
- Admin Experience
- Developer Experience
- Architecture
- Roadmap
- Get Started

Footer/support navigation:

- Security & Performance
- Docs
- GitHub / repository
- Changelog / updates later

## Recommended Page Priority

If the first version of the presentation site should stay lean, build these first:

1. Home
2. Why BlitzPress
3. Platform Features
4. Plugin System
5. Developer Experience
6. Get Started

Second wave:

1. Admin Experience
2. Architecture
3. Security And Performance
4. Roadmap

## Content Guardrails

The site should be careful about how it presents maturity:

- Present implemented systems as concrete product capabilities.
- Present placeholder admin sections as roadmap or planned modules.
- Present `users-plugin` as a major capability area, but be explicit when something is plugin-provided versus core.
- Do not market BlitzPress only as "faster WordPress"; market it as a new platform that respects the same extensibility philosophy.
- Keep the homepage clear for non-experts, and move deeper technical detail into dedicated pages.

## Final Recommendation

The strongest website structure for BlitzPress is not a single long landing page. It should be a compact multi-page presentation site with one strong narrative arc:

1. Why the project exists
2. What makes the platform different
3. How the plugin system works
4. What the admin experience looks like
5. How developers start building with it

That structure matches the actual project best, because BlitzPress is simultaneously a CMS product, a developer platform, and an extensibility architecture.
