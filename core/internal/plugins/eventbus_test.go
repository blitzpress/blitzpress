package plugins

import (
	"bytes"
	"errors"
	"log/slog"
	"reflect"
	"strings"
	"sync"
	"testing"
	"time"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

func TestEventBusPublishSubscribeDelivery(t *testing.T) {
	t.Parallel()

	bus := NewEventBus(nil, 2, 8)
	bus.Start()
	t.Cleanup(bus.Stop)

	delivered := make(chan pluginsdk.Event, 1)

	subscriptionID := bus.Subscribe("post.published", func(event pluginsdk.Event) error {
		delivered <- event
		return nil
	})

	if subscriptionID == "" {
		t.Fatal("expected subscription ID")
	}

	if err := bus.Publish("post.published", map[string]any{"id": 42}); err != nil {
		t.Fatalf("Publish() error = %v", err)
	}

	select {
	case event := <-delivered:
		if event.Name != "post.published" {
			t.Fatalf("expected event name %q, got %q", "post.published", event.Name)
		}
		if event.Payload["id"] != 42 {
			t.Fatalf("expected payload id 42, got %v", event.Payload["id"])
		}
		if event.Timestamp.String() == "" {
			t.Fatal("expected event timestamp to be populated")
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for published event")
	}
}

func TestEventBusHandlerFailureIsolation(t *testing.T) {
	t.Parallel()

	var logOutput bytes.Buffer
	logger := slog.New(slog.NewTextHandler(&logOutput, nil))

	bus := NewEventBus(logger, 1, 8)
	bus.Start()
	t.Cleanup(bus.Stop)

	calls := make(chan string, 2)
	handlerErr := errors.New("boom")

	bus.Subscribe("post.published", func(event pluginsdk.Event) error {
		calls <- "first"
		return handlerErr
	})
	bus.Subscribe("post.published", func(event pluginsdk.Event) error {
		calls <- "second"
		return nil
	})

	if err := bus.Publish("post.published", map[string]any{"id": 7}); err != nil {
		t.Fatalf("Publish() error = %v", err)
	}

	gotCalls := waitForValues(t, calls, 2)
	if !reflect.DeepEqual(gotCalls, []string{"first", "second"}) {
		t.Fatalf("expected both handlers to run in order, got %v", gotCalls)
	}

	logged := logOutput.String()
	if !strings.Contains(logged, "event handler failed") {
		t.Fatalf("expected handler failure log, got %q", logged)
	}
	if !strings.Contains(logged, "boom") {
		t.Fatalf("expected handler error in log, got %q", logged)
	}
}

func TestEventBusPublishReturnsQuicklyWhenBufferIsFull(t *testing.T) {
	t.Parallel()

	bus := NewEventBus(nil, 1, 1)
	bus.Start()
	t.Cleanup(bus.Stop)

	release := make(chan struct{})
	started := make(chan struct{})
	var once sync.Once

	bus.Subscribe("buffer.test", func(event pluginsdk.Event) error {
		once.Do(func() {
			close(started)
		})
		<-release
		return nil
	})

	if err := bus.Publish("buffer.test", map[string]any{"seq": 1}); err != nil {
		t.Fatalf("first Publish() error = %v", err)
	}

	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for first event handler to start")
	}

	if err := bus.Publish("buffer.test", map[string]any{"seq": 2}); err != nil {
		t.Fatalf("second Publish() error = %v", err)
	}

	start := time.Now()
	err := bus.Publish("buffer.test", map[string]any{"seq": 3})
	elapsed := time.Since(start)
	if !errors.Is(err, errEventBusBufferFull) {
		t.Fatalf("expected buffer full error, got %v", err)
	}
	if elapsed > 100*time.Millisecond {
		t.Fatalf("expected Publish() to return quickly, took %s", elapsed)
	}

	close(release)
}

func TestEventBusUnsubscribe(t *testing.T) {
	t.Parallel()

	bus := NewEventBus(nil, 1, 8)
	bus.Start()
	t.Cleanup(bus.Stop)

	removedCalls := make(chan string, 1)
	keptCalls := make(chan string, 1)

	removedID := bus.Subscribe("user.registered", func(event pluginsdk.Event) error {
		removedCalls <- "removed"
		return nil
	})
	bus.Subscribe("user.registered", func(event pluginsdk.Event) error {
		keptCalls <- "kept"
		return nil
	})

	if !bus.Unsubscribe(removedID) {
		t.Fatal("expected unsubscribe to succeed")
	}
	if bus.Unsubscribe(removedID) {
		t.Fatal("expected unsubscribing twice to fail")
	}

	if err := bus.Publish("user.registered", map[string]any{"id": "u1"}); err != nil {
		t.Fatalf("Publish() error = %v", err)
	}

	select {
	case got := <-keptCalls:
		if got != "kept" {
			t.Fatalf("expected kept handler to run, got %q", got)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for kept subscription")
	}

	select {
	case got := <-removedCalls:
		t.Fatalf("expected removed handler not to run, got %q", got)
	case <-time.After(150 * time.Millisecond):
	}
}

func TestEventBusStopDrainsQueuedEvents(t *testing.T) {
	t.Parallel()

	bus := NewEventBus(nil, 1, 4)
	bus.Start()
	t.Cleanup(bus.Stop)

	release := make(chan struct{})
	started := make(chan struct{})
	processed := make(chan int, 3)
	var once sync.Once

	bus.Subscribe("drain.test", func(event pluginsdk.Event) error {
		seq := event.Payload["seq"].(int)
		if seq == 1 {
			once.Do(func() {
				close(started)
			})
			<-release
		}

		processed <- seq
		return nil
	})

	if err := bus.Publish("drain.test", map[string]any{"seq": 1}); err != nil {
		t.Fatalf("first Publish() error = %v", err)
	}

	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for first drain handler to start")
	}

	if err := bus.Publish("drain.test", map[string]any{"seq": 2}); err != nil {
		t.Fatalf("second Publish() error = %v", err)
	}
	if err := bus.Publish("drain.test", map[string]any{"seq": 3}); err != nil {
		t.Fatalf("third Publish() error = %v", err)
	}

	stopped := make(chan struct{})
	go func() {
		bus.Stop()
		close(stopped)
	}()

	select {
	case <-stopped:
		t.Fatal("Stop() returned before blocked handler was released")
	case <-time.After(50 * time.Millisecond):
	}

	close(release)

	select {
	case <-stopped:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for Stop() to drain queued events")
	}

	gotProcessed := waitForValues(t, processed, 3)
	if !reflect.DeepEqual(gotProcessed, []int{1, 2, 3}) {
		t.Fatalf("expected queued events to drain in order, got %v", gotProcessed)
	}
}

func waitForValues[T any](t *testing.T, ch <-chan T, count int) []T {
	t.Helper()

	values := make([]T, 0, count)
	timeout := time.After(time.Second)

	for len(values) < count {
		select {
		case value := <-ch:
			values = append(values, value)
		case <-timeout:
			t.Fatalf("timed out waiting for %d values, received %d", count, len(values))
		}
	}

	return values
}
