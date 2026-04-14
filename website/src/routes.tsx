import type { RouteDefinition } from "@solidjs/router";
import ContentPage from "~/components/ContentPage";
import Home from "~/pages/Home";
import NotFound from "~/pages/NotFound";

import WhyBlitzPress from "~/pages/WhyBlitzPress";
import Features from "~/pages/Features";
import PluginSystem from "~/pages/PluginSystem";
import AdminExperience from "~/pages/AdminExperience";
import DeveloperExperience from "~/pages/DeveloperExperience";
import Architecture from "~/pages/Architecture";
import Roadmap from "~/pages/Roadmap";
import GetStarted from "~/pages/GetStarted";

const routes: RouteDefinition[] = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/why-blitzpress",
    component: WhyBlitzPress,
  },
  {
    path: "/features",
    component: Features,
  },
  {
    path: "/plugin-system",
    component: PluginSystem,
  },
  {
    path: "/admin-experience",
    component: AdminExperience,
  },
  {
    path: "/developer-experience",
    component: DeveloperExperience,
  },
  {
    path: "/architecture",
    component: Architecture,
  },
  {
    path: "/security-performance",
    component: ContentPage,
  },
  {
    path: "/roadmap",
    component: Roadmap,
  },
  {
    path: "/get-started",
    component: GetStarted,
  },
  {
    path: "*404",
    component: NotFound,
  },
];

export default routes;
