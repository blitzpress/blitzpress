package plugins

import (
	"errors"
	"io"
	"log/slog"
	"strconv"
	"sync"
	"sync/atomic"

	"github.com/dromara/carbon/v2"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

const (
	defaultEventBusWorkerCount = 4
	defaultEventBusBufferSize  = 256
)

var (
	errEventBusNotStarted = errors.New("event bus not started")
	errEventBusStopped    = errors.New("event bus stopped")
	errEventBusBufferFull = errors.New("event bus buffer full")
)

type subscription struct {
	id      string
	name    string
	handler pluginsdk.EventHandler
}

type EventBusImpl struct {
	logger      *slog.Logger
	workerCount int
	bufferSize  int

	subs    map[string][]subscription
	subByID map[string]string
	subsMu  sync.RWMutex

	lifecycleMu sync.RWMutex
	started     bool
	stopped     bool
	queue       chan pluginsdk.Event
	wg          sync.WaitGroup

	nextID atomic.Uint64
}

var _ pluginsdk.EventBus = (*EventBusImpl)(nil)

func NewEventBus(logger *slog.Logger, workerCount int, bufferSize int) *EventBusImpl {
	if workerCount <= 0 {
		workerCount = defaultEventBusWorkerCount
	}
	if bufferSize <= 0 {
		bufferSize = defaultEventBusBufferSize
	}
	if logger == nil {
		logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}

	return &EventBusImpl{
		logger:      logger,
		workerCount: workerCount,
		bufferSize:  bufferSize,
		subs:        make(map[string][]subscription),
		subByID:     make(map[string]string),
		queue:       make(chan pluginsdk.Event, bufferSize),
	}
}

func (e *EventBusImpl) Start() {
	e.lifecycleMu.Lock()
	defer e.lifecycleMu.Unlock()

	if e.started || e.stopped {
		return
	}

	e.started = true
	for range e.workerCount {
		e.wg.Add(1)
		go e.worker()
	}
}

func (e *EventBusImpl) Stop() {
	e.lifecycleMu.Lock()
	if !e.started || e.stopped {
		e.lifecycleMu.Unlock()
		return
	}

	e.stopped = true
	close(e.queue)
	e.lifecycleMu.Unlock()

	e.wg.Wait()
}

func (e *EventBusImpl) Publish(name string, payload map[string]any) error {
	event := pluginsdk.Event{
		Name:      name,
		Payload:   cloneEventPayload(payload),
		Timestamp: *carbon.NewDateTime(carbon.Now()),
	}

	e.lifecycleMu.RLock()
	defer e.lifecycleMu.RUnlock()

	switch {
	case !e.started:
		return errEventBusNotStarted
	case e.stopped:
		return errEventBusStopped
	}

	select {
	case e.queue <- event:
		return nil
	default:
		return errEventBusBufferFull
	}
}

func (e *EventBusImpl) Subscribe(name string, handler pluginsdk.EventHandler) string {
	id := "sub_" + strconv.FormatUint(e.nextID.Add(1), 10)
	sub := subscription{
		id:      id,
		name:    name,
		handler: handler,
	}

	e.subsMu.Lock()
	defer e.subsMu.Unlock()

	e.subs[name] = append(e.subs[name], sub)
	e.subByID[id] = name

	return id
}

func (e *EventBusImpl) Unsubscribe(id string) bool {
	e.subsMu.Lock()
	defer e.subsMu.Unlock()

	name, ok := e.subByID[id]
	if !ok {
		return false
	}

	entries := e.subs[name]
	for idx, entry := range entries {
		if entry.id != id {
			continue
		}

		e.subs[name] = append(entries[:idx], entries[idx+1:]...)
		if len(e.subs[name]) == 0 {
			delete(e.subs, name)
		}
		delete(e.subByID, id)
		return true
	}

	delete(e.subByID, id)
	return false
}

func (e *EventBusImpl) worker() {
	defer e.wg.Done()

	for event := range e.queue {
		e.dispatch(event)
	}
}

func (e *EventBusImpl) dispatch(event pluginsdk.Event) {
	e.subsMu.RLock()
	subscribers := append([]subscription(nil), e.subs[event.Name]...)
	e.subsMu.RUnlock()

	for _, sub := range subscribers {
		if sub.handler == nil {
			continue
		}

		if err := sub.handler(event); err != nil {
			e.logger.Error("event handler failed", "event", event.Name, "subscription_id", sub.id, "error", err)
		}
	}
}

func cloneEventPayload(payload map[string]any) map[string]any {
	if payload == nil {
		return nil
	}

	cloned := make(map[string]any, len(payload))
	for key, value := range payload {
		cloned[key] = value
	}

	return cloned
}
