export type NavLink = {
  href: string;
  label: string;
};

export type SectionItem = {
  title: string;
  description: string;
  eyebrow?: string;
};

export type PageSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: SectionItem[];
};

export type PageDefinition = {
  href: string;
  navLabel: string;
  title: string;
  intro: string;
  lead: string;
  supporting: string;
  heroLabel: string;
  heroStat: string;
  heroStatLabel: string;
  sections: PageSection[];
  ctaTitle: string;
  ctaDescription: string;
  ctaHref: string;
  ctaLabel: string;
};

export const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/why-blitzpress", label: "Why BlitzPress" },
  { href: "/features", label: "Features" },
  { href: "/plugin-system", label: "Plugin System" },
  { href: "/admin-experience", label: "Admin Experience" },
  { href: "/developer-experience", label: "Developer Experience" },
  { href: "/architecture", label: "Architecture" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/get-started", label: "Get Started" },
];

export const footerLinks: NavLink[] = [
  { href: "/security-performance", label: "Security & Performance" },
  { href: "/architecture", label: "Architecture" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/get-started", label: "Get Started" },
];

export const homeFeatureCards: SectionItem[] = [
  {
    eyebrow: "Core",
    title: "Go-first CMS runtime",
    description:
      "A modern CMS core built for performance, typed contracts, and explicit lifecycle control.",
  },
  {
    eyebrow: "Plugins",
    title: "Compiled plugin architecture",
    description:
      "Manifest-driven `.so` plugins mount routes, assets, settings, and hooks without rebuilding the core.",
  },
  {
    eyebrow: "Frontend",
    title: "Dynamic SolidJS admin",
    description:
      "Plugin frontends load at runtime through shared modules and a registrar-based extension model.",
  },
  {
    eyebrow: "DX",
    title: "Monorepo with real workflows",
    description:
      "Build scripts, hot reload, example plugins, and a manager CLI make the platform practical to adopt.",
  },
];

export const homeHighlights: SectionItem[] = [
  {
    eyebrow: "Reason",
    title: "Keep extensibility, replace the old runtime",
    description:
      "BlitzPress preserves the plugin mindset that made WordPress powerful while moving the platform to Go and typed interfaces.",
  },
  {
    eyebrow: "Difference",
    title: "A CMS product and a plugin platform",
    description:
      "The value is not only content management. It is the system for building structured CMS extensions with cleaner contracts.",
  },
  {
    eyebrow: "Audience",
    title: "Made for teams that build on top of their CMS",
    description:
      "Use it when you need admin workflows, extension points, and a system that developers can reason about.",
  },
];

export const homeArchitectureSteps: SectionItem[] = [
  {
    eyebrow: "1",
    title: "Core binary",
    description: "Hosts the API, database layer, plugin registry, hooks, and embedded admin app.",
  },
  {
    eyebrow: "2",
    title: "Plugin runtime",
    description: "Loads compatible plugins, validates manifests, mounts routes, and exposes extension surfaces.",
  },
  {
    eyebrow: "3",
    title: "Shared frontend modules",
    description: "Runtime-loaded admin modules register pages, widgets, and settings UI without a core rebuild.",
  },
  {
    eyebrow: "4",
    title: "Composable admin experience",
    description: "Editors and operators see one coherent CMS while plugins extend the product surface behind the scenes.",
  },
];

export const pageDefinitions: PageDefinition[] = [
  {
    href: "/why-blitzpress",
    navLabel: "Why BlitzPress",
    title: "WordPress-style extensibility, rebuilt for Go.",
    intro: "Why BlitzPress",
    lead: "The project exists to keep the flexibility people value in classic CMS platforms while replacing the older runtime model with typed, modern primitives.",
    supporting:
      "BlitzPress is not positioned as a faster clone. It is a new platform that respects the same extensibility philosophy while giving teams a cleaner architecture to build on.",
    heroLabel: "Positioning",
    heroStat: "Go + plugins + SolidJS",
    heroStatLabel: "The product thesis in one line",
    sections: [
      {
        id: "problem",
        eyebrow: "The gap",
        title: "What needed to change",
        description:
          "The legacy CMS model proved the value of hooks and plugin ecosystems, but the surrounding runtime and extension contracts now feel dated for teams shipping modern products.",
        items: [
          {
            title: "Runtime structure",
            description: "Older extension models make it harder to reason about boundaries, packaging, and lifecycle behavior.",
          },
          {
            title: "Type guarantees",
            description: "Loose contracts slow down teams that want safer integrations and more predictable extension points.",
          },
          {
            title: "Frontend extensibility",
            description: "Modern admin products need dynamic UI composition, not only backend hook injection.",
          },
        ],
      },
      {
        id: "answer",
        eyebrow: "The answer",
        title: "How BlitzPress responds",
        description:
          "The platform keeps familiar concepts such as hooks, filters, and plugin registration while shifting the implementation toward compiled Go plugins and a modern admin runtime.",
        items: [
          {
            title: "Go core",
            description: "Performance, concurrency, and explicit application structure become platform defaults.",
          },
          {
            title: "Stable SDK",
            description: "Plugin authors build against a public contract instead of reaching into internal implementation details.",
          },
          {
            title: "Runtime-loaded admin modules",
            description: "Backend and frontend extensibility evolve together rather than living in separate worlds.",
          },
        ],
      },
      {
        id: "audience",
        eyebrow: "Who it serves",
        title: "Built for product teams, plugin authors, and custom CMS builders",
        description:
          "BlitzPress fits teams that want a CMS foundation they can extend heavily without giving up architectural clarity.",
        items: [
          {
            title: "Custom platforms",
            description: "Teams building internal or client-facing admin products on top of content workflows.",
          },
          {
            title: "Extension-heavy products",
            description: "Projects where plugins, modules, and isolated capabilities are part of the long-term roadmap.",
          },
          {
            title: "Developer-led adoption",
            description: "Builders who care about performance, structure, and typed interfaces as much as editor features.",
          },
        ],
      },
    ],
    ctaTitle: "See how the plugin model becomes the product differentiator.",
    ctaDescription: "The strongest proof point is the extension system itself, not a generic feature checklist.",
    ctaHref: "/plugin-system",
    ctaLabel: "Explore Plugin System",
  },
  {
    href: "/features",
    navLabel: "Features",
    title: "A CMS surface backed by a platform architecture.",
    intro: "Platform Features",
    lead: "BlitzPress combines core CMS capabilities, plugin runtime mechanics, admin extensibility, and developer tooling into one stack.",
    supporting:
      "This page should make it easy to evaluate what exists today, what is already represented in the codebase, and what extends naturally from the architecture.",
    heroLabel: "Feature Surface",
    heroStat: "Core + runtime + admin + tooling",
    heroStatLabel: "Four layers working together",
    sections: [
      {
        id: "cms",
        eyebrow: "CMS foundations",
        title: "The core product layer",
        description: "The repository already frames BlitzPress as a real CMS rather than a plugin demo.",
        items: [
          {
            title: "Embedded admin SPA",
            description: "The frontend ships with the core and becomes part of the application binary and runtime.",
          },
          {
            title: "API routing and data access",
            description: "The backend exposes structured routes and a database layer with SQLite and PostgreSQL support.",
          },
          {
            title: "Content-oriented admin areas",
            description: "The admin surface includes dashboards, content areas, media handling, settings, and plugin management.",
          },
        ],
      },
      {
        id: "runtime",
        eyebrow: "Plugin runtime",
        title: "How capabilities are added safely",
        description: "Plugins are discovered, validated, loaded, and mounted through explicit runtime behavior.",
        items: [
          {
            title: "Manifest-driven discovery",
            description: "Plugin metadata controls identity, compatibility, assets, and frontend integration points.",
          },
          {
            title: "Lifecycle loading",
            description: "The runtime manages enablement, loading, route registration, and extension hook participation.",
          },
          {
            title: "Static assets and backend routes",
            description: "Plugins can bring both API behavior and UI resources into the product surface.",
          },
        ],
      },
      {
        id: "extensibility",
        eyebrow: "Extensibility",
        title: "More than backend hooks",
        description: "The extension model spans both server behavior and admin composition.",
        items: [
          {
            title: "Hooks, actions, and filters",
            description: "Familiar concepts remain, but they sit inside typed contracts instead of loose convention.",
          },
          {
            title: "Settings schemas and plugin config",
            description: "Plugins register structured settings instead of inventing ad hoc configuration flows.",
          },
          {
            title: "Events and frontend hooks",
            description: "The architecture supports asynchronous events and plugin-aware UI composition.",
          },
        ],
      },
    ],
    ctaTitle: "See the extension model in detail.",
    ctaDescription: "The feature story becomes much clearer once the plugin runtime is visible.",
    ctaHref: "/plugin-system",
    ctaLabel: "View Plugin System",
  },
  {
    href: "/plugin-system",
    navLabel: "Plugin System",
    title: "The plugin runtime is the headline feature.",
    intro: "Plugin System",
    lead: "BlitzPress makes extensibility a first-class product capability, not an afterthought attached to a CMS.",
    supporting:
      "The strongest strategic difference is the way compiled Go plugins, route namespacing, settings registration, and runtime frontend modules fit together.",
    heroLabel: "Differentiator",
    heroStat: ".so plugins + typed SDK",
    heroStatLabel: "Extensibility with explicit contracts",
    sections: [
      {
        id: "lifecycle",
        eyebrow: "Lifecycle",
        title: "How a plugin enters the system",
        description: "The runtime follows a predictable sequence from identity to registration.",
        items: [
          {
            title: "Manifest",
            description: "Each plugin declares identity, compatibility, frontend assets, and structural metadata.",
          },
          {
            title: "Compiled module",
            description: "The backend loads a `.so` plugin and resolves the exported `Plugin` symbol.",
          },
          {
            title: "Registration",
            description: "The plugin registers routes, hooks, events, settings, and UI extension points through the SDK.",
          },
        ],
      },
      {
        id: "contracts",
        eyebrow: "Contracts",
        title: "What the SDK gives plugin authors",
        description: "The public SDK separates plugin development from core internals.",
        items: [
          {
            title: "Stable public surface",
            description: "Authors work with `Manifest()` and `Register()` plus registrar-provided services.",
          },
          {
            title: "Structured access",
            description: "The registrar exposes HTTP, hooks, events, settings, config, database, and auth-related capabilities.",
          },
          {
            title: "Safer boundaries",
            description: "Core internals remain private so the ecosystem grows around contracts instead of hidden coupling.",
          },
        ],
      },
      {
        id: "namespacing",
        eyebrow: "Namespacing",
        title: "Built to stay organized as the ecosystem grows",
        description: "Routes and assets live in predictable locations that make plugins easier to reason about.",
        items: [
          {
            title: "Core APIs",
            description: "Core routes remain under `/api/core/` so the product surface stays explicit.",
          },
          {
            title: "Plugin APIs",
            description: "Plugin routes live under `/api/plugins/:id/` with the plugin identity built into the URL.",
          },
          {
            title: "Plugin assets",
            description: "Frontend resources are served with consistent namespacing so dynamic loading stays clean.",
          },
        ],
      },
    ],
    ctaTitle: "Move from architecture to the actual admin experience.",
    ctaDescription: "The runtime matters most when it becomes visible in the product interface.",
    ctaHref: "/admin-experience",
    ctaLabel: "See Admin Experience",
  },
  {
    href: "/admin-experience",
    navLabel: "Admin Experience",
    title: "A modern admin that plugins can extend at runtime.",
    intro: "Admin Experience",
    lead: "BlitzPress is not only a backend plugin engine. It already points toward a usable CMS interface with plugin-aware pages, widgets, settings, and navigation.",
    supporting:
      "This page should demonstrate the visible product surface while staying honest about which areas are mature, emerging, or planned next.",
    heroLabel: "Operator View",
    heroStat: "Dashboard to settings",
    heroStatLabel: "A coherent admin surface",
    sections: [
      {
        id: "workspace",
        eyebrow: "Core experience",
        title: "What the admin already communicates",
        description: "The admin is structured like a real operational product, not just a plugin sandbox.",
        items: [
          {
            title: "Dashboard and widgets",
            description: "Overview screens aggregate product state and open the door to plugin-provided runtime content.",
          },
          {
            title: "Content areas",
            description: "Posts, pages, editors, and media management give the platform recognizable CMS workflows.",
          },
          {
            title: "Settings and plugins",
            description: "Operators can manage system behavior and extension-specific configuration from one interface.",
          },
        ],
      },
      {
        id: "extending-ui",
        eyebrow: "Dynamic UI",
        title: "How plugins become visible in the admin",
        description: "Frontend modules can extend navigation, pages, widgets, and settings components at runtime.",
        items: [
          {
            title: "Page registration",
            description: "Plugins can add full admin destinations instead of being limited to hidden integrations.",
          },
          {
            title: "Widget registration",
            description: "The dashboard can surface plugin-aware content without rebuilding the core app.",
          },
          {
            title: "Settings UI",
            description: "Extension-specific controls can live alongside the broader admin model in a structured way.",
          },
        ],
      },
      {
        id: "auth",
        eyebrow: "Access model",
        title: "Authentication and role direction",
        description: "The broader repository plans show a growing investment in users, roles, and capability-driven access.",
        items: [
          {
            title: "Login flow",
            description: "Authentication is already part of the product story, not an afterthought for later.",
          },
          {
            title: "Users and roles",
            description: "The `users-plugin` expands the system toward richer operational administration.",
          },
          {
            title: "Capability-based direction",
            description: "Permissions are being modeled as structured capabilities rather than scattered checks.",
          },
        ],
      },
    ],
    ctaTitle: "Look at the developer workflow behind the admin experience.",
    ctaDescription: "The product becomes more compelling when the build and extension workflow is equally clear.",
    ctaHref: "/developer-experience",
    ctaLabel: "Explore Developer Experience",
  },
  {
    href: "/developer-experience",
    navLabel: "Developer Experience",
    title: "A developer platform, not only a CMS codebase.",
    intro: "Developer Experience",
    lead: "BlitzPress is organized as a monorepo with a stable SDK, example plugin, build scripts, and local workflows that make platform adoption realistic.",
    supporting:
      "The best pitch to developers is not abstract performance language. It is a practical story about how the repository is meant to be worked in.",
    heroLabel: "Builder Focus",
    heroStat: "core + sdk + manager + examples",
    heroStatLabel: "A workspace with clear roles",
    sections: [
      {
        id: "workspace",
        eyebrow: "Structure",
        title: "A repository organized around platform boundaries",
        description: "The monorepo already communicates separation of concerns clearly.",
        items: [
          {
            title: "Core",
            description: "Owns the CMS server, admin app, internal systems, and runtime behavior.",
          },
          {
            title: "Plugin SDK",
            description: "Defines the public contract that plugin authors can depend on safely.",
          },
          {
            title: "Manager and examples",
            description: "The CLI and example plugins make local adoption much easier to understand and test.",
          },
        ],
      },
      {
        id: "workflow",
        eyebrow: "Workflow",
        title: "Local development feels intentional",
        description: "Build scripts and hot reload tooling make the platform easier to run and extend.",
        items: [
          {
            title: "Build scripts",
            description: "Core and plugin build flows are already captured as repeatable scripts instead of tribal knowledge.",
          },
          {
            title: "Hot reload",
            description: "Air-based development loops support faster iteration for both the core and sample plugin.",
          },
          {
            title: "Testing surface",
            description: "Go tests, frontend tests, and type checking support a more disciplined platform story.",
          },
        ],
      },
      {
        id: "authoring",
        eyebrow: "Plugin authoring",
        title: "Why plugin builders can move faster",
        description: "The project reduces friction by giving plugin authors a clearer frame for both backend and frontend work.",
        items: [
          {
            title: "No dependency on core internals",
            description: "The SDK boundary reduces breakage risk and makes plugin code easier to maintain.",
          },
          {
            title: "Declarative extension points",
            description: "Settings, assets, routes, and UI registration follow platform conventions instead of custom glue.",
          },
          {
            title: "Reference implementation",
            description: "The example plugin acts as a living tutorial for the intended development path.",
          },
        ],
      },
    ],
    ctaTitle: "Understand how the full system fits together.",
    ctaDescription: "The architecture page turns repository structure into a technical mental model.",
    ctaHref: "/architecture",
    ctaLabel: "View Architecture",
  },
  {
    href: "/architecture",
    navLabel: "Architecture",
    title: "A system designed to compose backend and frontend extensibility.",
    intro: "Architecture",
    lead: "BlitzPress ties together a Go application core, plugin runtime, embedded admin frontend, and shared module loading strategy into one platform model.",
    supporting:
      "This page is for technical readers who need to trust the mental model before they trust the product itself.",
    heroLabel: "System Model",
    heroStat: "Browser -> core -> plugins -> admin",
    heroStatLabel: "A clean request and runtime flow",
    sections: [
      {
        id: "stack",
        eyebrow: "System",
        title: "What the stack is made of",
        description: "The architecture combines several layers without hiding how they connect.",
        items: [
          {
            title: "Core binary",
            description: "Owns the API, configuration, database integrations, plugin registry, and lifecycle management.",
          },
          {
            title: "Embedded frontend",
            description: "The admin app ships with the core so the backend and UI evolve as one product.",
          },
          {
            title: "Plugin runtime",
            description: "Plugins provide backend behavior and frontend modules that are loaded into the admin experience.",
          },
        ],
      },
      {
        id: "flow",
        eyebrow: "Flow",
        title: "How requests and UI composition move through the system",
        description: "The system is easier to trust when the runtime path is explicit.",
        items: [
          {
            title: "Initial app load",
            description: "The browser loads the embedded admin shell served by the core application.",
          },
          {
            title: "Plugin discovery",
            description: "The runtime exposes plugin metadata so the frontend can determine what modules to load.",
          },
          {
            title: "Dynamic composition",
            description: "Shared ESM modules and registrars let plugin UI become part of the active admin session.",
          },
        ],
      },
      {
        id: "deployment",
        eyebrow: "Packaging",
        title: "The deployment model stays understandable",
        description: "The build output reflects the architecture instead of obscuring it.",
        items: [
          {
            title: "Embedded assets",
            description: "Frontend assets are packaged with the core so the application can ship as a coherent unit.",
          },
          {
            title: "Plugin bundles",
            description: "Plugin artifacts live in predictable build directories, which helps both development and operations.",
          },
          {
            title: "Operational clarity",
            description: "Enablement, compatibility, and lifecycle control all map cleanly to the runtime design.",
          },
        ],
      },
    ],
    ctaTitle: "Translate the architecture into trust signals.",
    ctaDescription: "Security and performance messaging should emerge from design decisions that already exist.",
    ctaHref: "/security-performance",
    ctaLabel: "Review Security & Performance",
  },
  {
    href: "/security-performance",
    navLabel: "Security & Performance",
    title: "Designed for faster, safer extensibility.",
    intro: "Security & Performance",
    lead: "BlitzPress should talk about trust through architectural discipline: Go, typed boundaries, manifest validation, namespacing, and explicit lifecycle management.",
    supporting:
      "The right claim is not perfect isolation. The right claim is that the platform is intentionally designed to reduce ambiguity and operational risk as extensions grow.",
    heroLabel: "Trust Signals",
    heroStat: "Go runtime + explicit boundaries",
    heroStatLabel: "Architecture as product value",
    sections: [
      {
        id: "performance",
        eyebrow: "Performance",
        title: "Why the Go foundation matters",
        description: "Performance is part of the platform story, but it should be explained through concrete properties.",
        items: [
          {
            title: "Compiled runtime",
            description: "The core benefits from Go's execution model and a server architecture built for sustained workloads.",
          },
          {
            title: "Concurrency model",
            description: "The platform can handle operational work with a runtime designed for concurrent services.",
          },
          {
            title: "Embedded delivery",
            description: "Bundling the admin experience with the core reduces deployment ambiguity and keeps the surface cohesive.",
          },
        ],
      },
      {
        id: "boundaries",
        eyebrow: "Safety",
        title: "Why the extension story is easier to reason about",
        description: "Safety comes from clearer boundaries, not vague promises.",
        items: [
          {
            title: "Stable SDK boundary",
            description: "Plugins build against a defined public contract rather than internal implementation details.",
          },
          {
            title: "Manifest validation and compatibility",
            description: "Plugins declare their identity and compatibility up front before they participate in the runtime.",
          },
          {
            title: "Namespaced routes and assets",
            description: "Operational visibility improves when every plugin capability has a predictable place in the system.",
          },
        ],
      },
      {
        id: "control",
        eyebrow: "Control",
        title: "Operational clarity supports trust",
        description: "The system already points toward explicit control over how extensions behave.",
        items: [
          {
            title: "Lifecycle hooks",
            description: "Loading, enabling, and shutting down plugins follow a controlled application model.",
          },
          {
            title: "Capability direction",
            description: "The user and role plans show a move toward structured permission logic rather than ad hoc checks.",
          },
          {
            title: "Consistent data patterns",
            description: "UUID v7 and explicit model conventions reinforce predictability across the platform.",
          },
        ],
      },
    ],
    ctaTitle: "See what the team is building toward next.",
    ctaDescription: "The roadmap should be aspirational without blurring the line between shipped and planned work.",
    ctaHref: "/roadmap",
    ctaLabel: "Open Roadmap",
  },
  {
    href: "/roadmap",
    navLabel: "Roadmap",
    title: "A clear direction without pretending everything is finished.",
    intro: "Roadmap",
    lead: "BlitzPress should present momentum honestly: what exists now, what is actively taking shape, and which product areas naturally follow from the architecture.",
    supporting:
      "That honesty makes the website more credible for early adopters who will evaluate both the codebase and the product direction.",
    heroLabel: "Progress Model",
    heroStat: "Available now / in progress / planned next",
    heroStatLabel: "A maturity model that stays explicit",
    sections: [
      {
        id: "available",
        eyebrow: "Available now",
        title: "The platform foundations are already visible",
        description: "The current repository already supports a strong first-generation product story.",
        items: [
          {
            title: "Plugin runtime and SDK",
            description: "The architecture for loading, validating, and integrating plugins is the present-day core strength.",
          },
          {
            title: "Admin foundations",
            description: "Dashboards, content areas, settings, and plugin-aware navigation are already part of the product shape.",
          },
          {
            title: "Developer workflow",
            description: "Build scripts, examples, hot reload, and the manager CLI give the platform practical momentum.",
          },
        ],
      },
      {
        id: "progress",
        eyebrow: "In progress",
        title: "Capability layers that are clearly taking shape",
        description: "Some modules are already represented in the codebase and planning docs even if they are still evolving.",
        items: [
          {
            title: "Users, roles, and capabilities",
            description: "The `users-plugin` and related plans show a growing access-control layer around the core system.",
          },
          {
            title: "Richer admin modules",
            description: "Plugin-provided pages, widgets, and settings indicate a broader extension-ready admin ecosystem.",
          },
          {
            title: "Operational controls",
            description: "Lifecycle and management flows are moving toward a more complete platform operator experience.",
          },
        ],
      },
      {
        id: "next",
        eyebrow: "Planned next",
        title: "Natural product expansion areas",
        description: "The architecture points clearly toward new product layers that can be added without changing the core thesis.",
        items: [
          {
            title: "Appearance, tools, and system modules",
            description: "Themes, menus, import/export, site health, and related modules fit the existing direction naturally.",
          },
          {
            title: "Comments, privacy, and discussion",
            description: "Traditional CMS management areas can become structured modules instead of bloated defaults.",
          },
          {
            title: "Ecosystem maturity",
            description: "More plugins, stronger marketplace readiness, and dependency handling can grow from the current design.",
          },
        ],
      },
    ],
    ctaTitle: "Start evaluating or running BlitzPress locally.",
    ctaDescription: "A product website should end with adoption paths, not only positioning language.",
    ctaHref: "/get-started",
    ctaLabel: "Get Started",
  },
  {
    href: "/get-started",
    navLabel: "Get Started",
    title: "Move from product interest to hands-on evaluation.",
    intro: "Get Started",
    lead: "The quickest path to understanding BlitzPress is to run it, inspect the repo structure, and build a plugin against the public SDK.",
    supporting:
      "This page turns the architectural story into concrete first steps for developers and technical evaluators.",
    heroLabel: "Adoption",
    heroStat: "Run core, inspect plugins, build next",
    heroStatLabel: "The first journey through the repo",
    sections: [
      {
        id: "repo",
        eyebrow: "What is inside",
        title: "The main pieces you should inspect first",
        description: "The monorepo already tells new users how to think about the platform.",
        items: [
          {
            title: "Core",
            description: "The CMS server and embedded admin app define the baseline product surface.",
          },
          {
            title: "Plugin SDK and example plugin",
            description: "These show how the extension model is intended to be used without depending on internal implementation details.",
          },
          {
            title: "Manager and scripts",
            description: "These are the fastest route to building, running, and understanding the local workflow.",
          },
        ],
      },
      {
        id: "first-steps",
        eyebrow: "First 15 minutes",
        title: "A practical starting sequence",
        description: "New users should be guided toward immediate traction rather than abstract reading.",
        items: [
          {
            title: "Clone and install dependencies",
            description: "Set up the frontend dependencies and make sure the workspace can build cleanly.",
          },
          {
            title: "Build plugins, then the core",
            description: "Run the existing scripts so the relationship between plugin artifacts and the core binary becomes obvious.",
          },
          {
            title: "Inspect the example plugin",
            description: "Use the sample to understand route registration, settings, assets, and frontend integration in one place.",
          },
        ],
      },
      {
        id: "next-paths",
        eyebrow: "Where to go next",
        title: "Choose the path that matches your role",
        description: "Different visitors need different next actions once the local environment works.",
        items: [
          {
            title: "Platform evaluator",
            description: "Review the architecture, feature surface, and roadmap to understand the strategic fit.",
          },
          {
            title: "Plugin author",
            description: "Move directly into the SDK and example plugin to build an extension with the intended patterns.",
          },
          {
            title: "Product team",
            description: "Review the admin experience and extension model to see whether BlitzPress fits your operating model.",
          },
        ],
      },
    ],
    ctaTitle: "Return to the homepage narrative.",
    ctaDescription: "The homepage connects the product story, plugin thesis, and adoption path in one view.",
    ctaHref: "/",
    ctaLabel: "Back to Home",
  },
];

export const pageMap = new Map(pageDefinitions.map(page => [page.href, page]));
