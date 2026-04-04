import type {
  FrontendAction,
  FrontendFilter,
  FrontendHookEngine,
  FrontendHookOptions,
} from "./types";

type ActionEntry = {
  id: string;
  priority: number;
  order: number;
  fn: FrontendAction;
};

type FilterEntry = {
  id: string;
  priority: number;
  order: number;
  fn: FrontendFilter<unknown>;
};

const defaultPriority = 10;

function normalizePriority(opts?: FrontendHookOptions): number {
  if (typeof opts?.priority === "number" && Number.isFinite(opts.priority)) {
    return opts.priority;
  }

  return defaultPriority;
}

function sortEntries<T extends { priority: number; order: number }>(entries: T[]): T[] {
  return [...entries].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return left.order - right.order;
  });
}

class FrontendHookEngineImpl implements FrontendHookEngine {
  private actions = new Map<string, ActionEntry[]>();
  private filters = new Map<string, FilterEntry[]>();
  private nextID = 0;
  private nextOrder = 0;

  addAction(name: string, fn: FrontendAction, opts?: FrontendHookOptions): string {
    const entry: ActionEntry = {
      id: this.createID("action"),
      priority: normalizePriority(opts),
      order: this.nextOrder++,
      fn,
    };

    this.actions.set(name, sortEntries([...(this.actions.get(name) ?? []), entry]));
    return entry.id;
  }

  addFilter<TValue>(name: string, fn: FrontendFilter<TValue>, opts?: FrontendHookOptions): string {
    const entry: FilterEntry = {
      id: this.createID("filter"),
      priority: normalizePriority(opts),
      order: this.nextOrder++,
      fn: fn as FrontendFilter<unknown>,
    };

    this.filters.set(name, sortEntries([...(this.filters.get(name) ?? []), entry]));
    return entry.id;
  }

  doAction(name: string, ...args: unknown[]): void {
    for (const entry of this.actions.get(name) ?? []) {
      try {
        entry.fn(...args);
      } catch (error) {
        console.error(`frontend action hook failed: ${name}`, error);
      }
    }
  }

  applyFilters<TValue>(name: string, value: TValue, ...args: unknown[]): TValue {
    let nextValue = value;

    for (const entry of this.filters.get(name) ?? []) {
      try {
        nextValue = entry.fn(nextValue, ...args) as TValue;
      } catch (error) {
        console.error(`frontend filter hook failed: ${name}`, error);
      }
    }

    return nextValue;
  }

  removeAction(name: string, id: string): boolean {
    return this.removeEntry(this.actions, name, id);
  }

  removeFilter(name: string, id: string): boolean {
    return this.removeEntry(this.filters, name, id);
  }

  reset(): void {
    this.actions.clear();
    this.filters.clear();
    this.nextID = 0;
    this.nextOrder = 0;
  }

  private createID(prefix: string): string {
    this.nextID += 1;
    return `${prefix}-${this.nextID}`;
  }

  private removeEntry<T extends { id: string }>(collection: Map<string, T[]>, name: string, id: string): boolean {
    const entries = collection.get(name);
    if (!entries) {
      return false;
    }

    const nextEntries = entries.filter((entry) => entry.id !== id);
    if (nextEntries.length === entries.length) {
      return false;
    }

    if (nextEntries.length === 0) {
      collection.delete(name);
      return true;
    }

    collection.set(name, nextEntries);
    return true;
  }
}

export function createHookEngine(): FrontendHookEngine & { reset(): void } {
  return new FrontendHookEngineImpl();
}

export const hooks = createHookEngine();
