import { describe, expect, test } from "bun:test";

import { createEventBus } from "./events";

describe("frontend event bus", () => {
  test("publishes events asynchronously to subscribers", async () => {
    const eventBus = createEventBus();
    const received: Array<{ name: string; payload: string }> = [];

    eventBus.subscribe<string>("plugin.loaded", (event) => {
      received.push({ name: event.name, payload: event.payload });
    });

    eventBus.publish("plugin.loaded", "example-plugin");
    expect(received).toHaveLength(0);

    await Promise.resolve();
    expect(received).toEqual([{ name: "plugin.loaded", payload: "example-plugin" }]);
  });

  test("unsubscribes handlers by id", async () => {
    const eventBus = createEventBus();
    const received: string[] = [];

    const id = eventBus.subscribe<string>("plugin.loaded", (event) => {
      received.push(event.payload);
    });

    expect(eventBus.unsubscribe(id)).toBeTrue();
    expect(eventBus.unsubscribe(id)).toBeFalse();

    eventBus.publish("plugin.loaded", "example-plugin");
    await Promise.resolve();
    expect(received).toEqual([]);
  });
});
