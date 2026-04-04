import "./styles.css";

import { registerPlugin } from "@blitzpress/plugin-sdk";

import { examplePluginManifest, registerExamplePlugin } from "./plugin";

registerPlugin(examplePluginManifest, registerExamplePlugin);
