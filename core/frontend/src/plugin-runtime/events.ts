import type { FrontendEvent, FrontendEventBus, FrontendEventHandler } from "./types";

type SubscriptionEntry = {
  id: string;
  name: string;
  handler: FrontendEventHandler<unknown>;
};

class FrontendEventBusImpl implements FrontendEventBus {
  private subscriptions = new Map<string, SubscriptionEntry[]>();
  private nextID = 0;

  publish<TPayload>(name: string, payload: TPayload): void {
    const event: FrontendEvent<TPayload> = {
      name,
      payload,
      timestamp: Date.now(),
    };

    for (const subscription of this.subscriptions.get(name) ?? []) {
      queueMicrotask(() => {
        try {
          subscription.handler(event);
        } catch (error) {
          console.error(`frontend event handler failed: ${name}`, error);
        }
      });
    }
  }

  subscribe<TPayload>(name: string, handler: FrontendEventHandler<TPayload>): string {
    const entry: SubscriptionEntry = {
      id: `event-${++this.nextID}`,
      name,
      handler: handler as FrontendEventHandler<unknown>,
    };

    this.subscriptions.set(name, [...(this.subscriptions.get(name) ?? []), entry]);
    return entry.id;
  }

  unsubscribe(id: string): boolean {
    for (const [name, subscriptions] of this.subscriptions.entries()) {
      const nextSubscriptions = subscriptions.filter((subscription) => subscription.id !== id);
      if (nextSubscriptions.length === subscriptions.length) {
        continue;
      }

      if (nextSubscriptions.length === 0) {
        this.subscriptions.delete(name);
      } else {
        this.subscriptions.set(name, nextSubscriptions);
      }

      return true;
    }

    return false;
  }

  reset(): void {
    this.subscriptions.clear();
    this.nextID = 0;
  }
}

export function createEventBus(): FrontendEventBus & { reset(): void } {
  return new FrontendEventBusImpl();
}

export const events = createEventBus();
