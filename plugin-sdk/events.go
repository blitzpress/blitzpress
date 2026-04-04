package pluginsdk

import "github.com/dromara/carbon/v2"

type Event struct {
	Name      string
	PluginID  string
	Payload   map[string]any
	Timestamp carbon.DateTime
}

type EventHandler func(event Event) error

type EventBus interface {
	Publish(name string, payload map[string]any) error
	Subscribe(name string, handler EventHandler) string
	Unsubscribe(id string) bool
}
