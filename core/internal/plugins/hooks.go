package plugins

import (
	"errors"
	"sort"
	"strconv"
	"sync"
	"sync/atomic"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

const defaultHookPriority = 10

type hookEntry struct {
	id       pluginsdk.HookID
	priority int
	order    uint64
}

type actionEntry struct {
	hookEntry
	fn pluginsdk.ActionFunc
}

type filterEntry struct {
	hookEntry
	fn pluginsdk.FilterFunc
}

type HookEngine struct {
	actions map[string][]actionEntry
	filters map[string][]filterEntry
	mu      sync.RWMutex
	nextID  atomic.Uint64
}

var _ pluginsdk.HookRegistry = (*HookEngine)(nil)

func NewHookEngine() *HookEngine {
	return &HookEngine{
		actions: make(map[string][]actionEntry),
		filters: make(map[string][]filterEntry),
	}
}

func (h *HookEngine) AddAction(name string, fn pluginsdk.ActionFunc, opts ...pluginsdk.HookOptions) pluginsdk.HookID {
	entry := actionEntry{
		hookEntry: h.newHookEntry(opts...),
		fn:        fn,
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	h.ensureMapsLocked()
	h.actions[name] = append(h.actions[name], entry)
	sort.Slice(h.actions[name], func(i, j int) bool {
		return compareHookEntries(h.actions[name][i].hookEntry, h.actions[name][j].hookEntry)
	})

	return entry.id
}

func (h *HookEngine) DoAction(ctx *pluginsdk.HookContext, name string, args ...any) error {
	h.mu.RLock()
	entries := append([]actionEntry(nil), h.actions[name]...)
	h.mu.RUnlock()

	var errs []error

	for _, entry := range entries {
		if entry.fn == nil {
			continue
		}

		if err := entry.fn(ctx, args...); err != nil {
			errs = append(errs, err)
		}
	}

	return errors.Join(errs...)
}

func (h *HookEngine) RemoveAction(name string, id pluginsdk.HookID) bool {
	h.mu.Lock()
	defer h.mu.Unlock()

	entries := h.actions[name]
	for idx, entry := range entries {
		if entry.id != id {
			continue
		}

		h.actions[name] = append(entries[:idx], entries[idx+1:]...)
		if len(h.actions[name]) == 0 {
			delete(h.actions, name)
		}

		return true
	}

	return false
}

func (h *HookEngine) AddFilter(name string, fn pluginsdk.FilterFunc, opts ...pluginsdk.HookOptions) pluginsdk.HookID {
	entry := filterEntry{
		hookEntry: h.newHookEntry(opts...),
		fn:        fn,
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	h.ensureMapsLocked()
	h.filters[name] = append(h.filters[name], entry)
	sort.Slice(h.filters[name], func(i, j int) bool {
		return compareHookEntries(h.filters[name][i].hookEntry, h.filters[name][j].hookEntry)
	})

	return entry.id
}

func (h *HookEngine) ApplyFilters(ctx *pluginsdk.HookContext, name string, value any, args ...any) (any, error) {
	h.mu.RLock()
	entries := append([]filterEntry(nil), h.filters[name]...)
	h.mu.RUnlock()

	current := value
	for _, entry := range entries {
		if entry.fn == nil {
			continue
		}

		next, err := entry.fn(ctx, current, args...)
		if err != nil {
			return current, err
		}

		current = next
	}

	return current, nil
}

func (h *HookEngine) RemoveFilter(name string, id pluginsdk.HookID) bool {
	h.mu.Lock()
	defer h.mu.Unlock()

	entries := h.filters[name]
	for idx, entry := range entries {
		if entry.id != id {
			continue
		}

		h.filters[name] = append(entries[:idx], entries[idx+1:]...)
		if len(h.filters[name]) == 0 {
			delete(h.filters, name)
		}

		return true
	}

	return false
}

func (h *HookEngine) newHookEntry(opts ...pluginsdk.HookOptions) hookEntry {
	sequence := h.nextID.Add(1)

	return hookEntry{
		id:       pluginsdk.HookID("hook_" + strconv.FormatUint(sequence, 10)),
		priority: hookPriority(opts...),
		order:    sequence,
	}
}

func (h *HookEngine) ensureMapsLocked() {
	if h.actions == nil {
		h.actions = make(map[string][]actionEntry)
	}

	if h.filters == nil {
		h.filters = make(map[string][]filterEntry)
	}
}

func hookPriority(opts ...pluginsdk.HookOptions) int {
	if len(opts) == 0 {
		return defaultHookPriority
	}

	return opts[0].Priority
}

func compareHookEntries(left, right hookEntry) bool {
	if left.priority != right.priority {
		return left.priority < right.priority
	}

	return left.order < right.order
}
