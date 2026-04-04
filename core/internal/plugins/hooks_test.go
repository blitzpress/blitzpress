package plugins

import (
	"errors"
	"fmt"
	"reflect"
	"sync"
	"sync/atomic"
	"testing"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

func TestHookEngineActionPriorityOrdering(t *testing.T) {
	t.Parallel()

	engine := NewHookEngine()
	var calls []string

	engine.AddAction("core.ready", func(ctx *pluginsdk.HookContext, args ...any) error {
		calls = append(calls, "priority-20")
		return nil
	}, pluginsdk.HookOptions{Priority: 20})

	engine.AddAction("core.ready", func(ctx *pluginsdk.HookContext, args ...any) error {
		calls = append(calls, "priority-10")
		return nil
	})

	engine.AddAction("core.ready", func(ctx *pluginsdk.HookContext, args ...any) error {
		calls = append(calls, "priority-5")
		return nil
	}, pluginsdk.HookOptions{Priority: 5})

	if err := engine.DoAction(&pluginsdk.HookContext{PluginID: "example-plugin"}, "core.ready"); err != nil {
		t.Fatalf("DoAction() error = %v", err)
	}

	want := []string{"priority-5", "priority-10", "priority-20"}
	if !reflect.DeepEqual(calls, want) {
		t.Fatalf("expected call order %v, got %v", want, calls)
	}
}

func TestHookEngineActionSamePriorityUsesRegistrationOrder(t *testing.T) {
	t.Parallel()

	engine := NewHookEngine()
	var calls []string

	engine.AddAction("plugin.loaded", func(ctx *pluginsdk.HookContext, args ...any) error {
		calls = append(calls, "first")
		return nil
	})
	engine.AddAction("plugin.loaded", func(ctx *pluginsdk.HookContext, args ...any) error {
		calls = append(calls, "second")
		return nil
	})
	engine.AddAction("plugin.loaded", func(ctx *pluginsdk.HookContext, args ...any) error {
		calls = append(calls, "third")
		return nil
	})

	if err := engine.DoAction(nil, "plugin.loaded"); err != nil {
		t.Fatalf("DoAction() error = %v", err)
	}

	want := []string{"first", "second", "third"}
	if !reflect.DeepEqual(calls, want) {
		t.Fatalf("expected call order %v, got %v", want, calls)
	}
}

func TestHookEngineDoActionCollectsErrors(t *testing.T) {
	t.Parallel()

	engine := NewHookEngine()
	errFirst := errors.New("first failure")
	errSecond := errors.New("second failure")
	var calls []string

	engine.AddAction("core.shutdown", func(ctx *pluginsdk.HookContext, args ...any) error {
		calls = append(calls, "first")
		return errFirst
	})
	engine.AddAction("core.shutdown", func(ctx *pluginsdk.HookContext, args ...any) error {
		calls = append(calls, "second")
		return nil
	})
	engine.AddAction("core.shutdown", func(ctx *pluginsdk.HookContext, args ...any) error {
		calls = append(calls, "third")
		return errSecond
	})

	err := engine.DoAction(nil, "core.shutdown")
	if err == nil {
		t.Fatal("expected joined error, got nil")
	}

	if !errors.Is(err, errFirst) {
		t.Fatalf("expected error to contain first failure, got %v", err)
	}

	if !errors.Is(err, errSecond) {
		t.Fatalf("expected error to contain second failure, got %v", err)
	}

	wantCalls := []string{"first", "second", "third"}
	if !reflect.DeepEqual(calls, wantCalls) {
		t.Fatalf("expected all actions to run in order %v, got %v", wantCalls, calls)
	}
}

func TestHookEngineApplyFiltersChainsValues(t *testing.T) {
	t.Parallel()

	engine := NewHookEngine()

	engine.AddFilter("dashboard.widgets", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
		return value.(string) + "-first", nil
	}, pluginsdk.HookOptions{Priority: 15})

	engine.AddFilter("dashboard.widgets", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
		return value.(string) + "-second", nil
	}, pluginsdk.HookOptions{Priority: 30})

	engine.AddFilter("dashboard.widgets", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
		return value.(string) + "-zero", nil
	}, pluginsdk.HookOptions{Priority: 0})

	got, err := engine.ApplyFilters(nil, "dashboard.widgets", "start")
	if err != nil {
		t.Fatalf("ApplyFilters() error = %v", err)
	}

	if got != "start-zero-first-second" {
		t.Fatalf("expected chained value %q, got %v", "start-zero-first-second", got)
	}
}

func TestHookEngineApplyFiltersStopsOnFirstError(t *testing.T) {
	t.Parallel()

	engine := NewHookEngine()
	stopErr := errors.New("stop")
	var calls []string

	engine.AddFilter("settings.schema", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
		calls = append(calls, "first")
		return value.(int) + 1, nil
	})
	engine.AddFilter("settings.schema", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
		calls = append(calls, "second")
		return nil, stopErr
	})
	engine.AddFilter("settings.schema", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
		calls = append(calls, "third")
		return value.(int) + 100, nil
	})

	got, err := engine.ApplyFilters(nil, "settings.schema", 10)
	if !errors.Is(err, stopErr) {
		t.Fatalf("expected stop error, got %v", err)
	}

	if got != 11 {
		t.Fatalf("expected last successful value 11, got %v", got)
	}

	wantCalls := []string{"first", "second"}
	if !reflect.DeepEqual(calls, wantCalls) {
		t.Fatalf("expected filter call order %v, got %v", wantCalls, calls)
	}
}

func TestHookEngineRemoveActionAndFilterByID(t *testing.T) {
	t.Parallel()

	engine := NewHookEngine()
	var actionCalls []string

	removedActionID := engine.AddAction("core.ready", func(ctx *pluginsdk.HookContext, args ...any) error {
		actionCalls = append(actionCalls, "removed")
		return nil
	})
	engine.AddAction("core.ready", func(ctx *pluginsdk.HookContext, args ...any) error {
		actionCalls = append(actionCalls, "kept")
		return nil
	})

	if !engine.RemoveAction("core.ready", removedActionID) {
		t.Fatal("expected action removal to succeed")
	}

	if engine.RemoveAction("core.ready", removedActionID) {
		t.Fatal("expected removing action twice to fail")
	}

	if err := engine.DoAction(nil, "core.ready"); err != nil {
		t.Fatalf("DoAction() error = %v", err)
	}

	if !reflect.DeepEqual(actionCalls, []string{"kept"}) {
		t.Fatalf("expected only kept action to run, got %v", actionCalls)
	}

	removedFilterID := engine.AddFilter("admin.menu.items", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
		return append(value.([]string), "removed"), nil
	})
	engine.AddFilter("admin.menu.items", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
		return append(value.([]string), "kept"), nil
	})

	if !engine.RemoveFilter("admin.menu.items", removedFilterID) {
		t.Fatal("expected filter removal to succeed")
	}

	if engine.RemoveFilter("admin.menu.items", removedFilterID) {
		t.Fatal("expected removing filter twice to fail")
	}

	got, err := engine.ApplyFilters(nil, "admin.menu.items", []string{"base"})
	if err != nil {
		t.Fatalf("ApplyFilters() error = %v", err)
	}

	want := []string{"base", "kept"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("expected filtered value %v, got %v", want, got)
	}
}

func TestHookEngineConcurrentAccess(t *testing.T) {
	t.Parallel()

	engine := NewHookEngine()
	const workers = 24

	var actionCalls atomic.Int64
	var filterCalls atomic.Int64
	errCh := make(chan error, workers*4)
	start := make(chan struct{})
	var wg sync.WaitGroup

	for i := range workers {
		wg.Add(1)

		go func(worker int) {
			defer wg.Done()
			<-start

			actionID := engine.AddAction("concurrent.action", func(ctx *pluginsdk.HookContext, args ...any) error {
				actionCalls.Add(1)
				return nil
			}, pluginsdk.HookOptions{Priority: worker % 5})

			filterID := engine.AddFilter("concurrent.filter", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
				filterCalls.Add(1)
				return value.(int) + 1, nil
			}, pluginsdk.HookOptions{Priority: worker % 5})

			if err := engine.DoAction(nil, "concurrent.action"); err != nil {
				errCh <- fmt.Errorf("DoAction() error = %w", err)
			}

			got, err := engine.ApplyFilters(nil, "concurrent.filter", 0)
			if err != nil {
				errCh <- fmt.Errorf("ApplyFilters() error = %w", err)
			}

			if got.(int) < 1 {
				errCh <- fmt.Errorf("expected filtered value to increment, got %v", got)
			}

			if !engine.RemoveAction("concurrent.action", actionID) {
				errCh <- errors.New("expected concurrent action removal to succeed")
			}

			if !engine.RemoveFilter("concurrent.filter", filterID) {
				errCh <- errors.New("expected concurrent filter removal to succeed")
			}
		}(i)
	}

	close(start)
	wg.Wait()
	close(errCh)

	for err := range errCh {
		t.Fatal(err)
	}

	if actionCalls.Load() == 0 {
		t.Fatal("expected concurrent actions to execute at least once")
	}

	if filterCalls.Load() == 0 {
		t.Fatal("expected concurrent filters to execute at least once")
	}

	got, err := engine.ApplyFilters(nil, "concurrent.filter", 0)
	if err != nil {
		t.Fatalf("final ApplyFilters() error = %v", err)
	}

	if got != 0 {
		t.Fatalf("expected all concurrent filters to be removed, got %v", got)
	}

	if err := engine.DoAction(nil, "concurrent.action"); err != nil {
		t.Fatalf("final DoAction() error = %v", err)
	}
}
