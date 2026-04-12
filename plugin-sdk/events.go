package pluginsdk

import "github.com/dromara/carbon/v2"

type Event struct {
	Name      string          `json:"name"`
	PluginID  string          `json:"plugin_id"`
	Payload   map[string]any  `json:"payload,omitempty"`
	Timestamp carbon.DateTime `json:"timestamp"`
}

type EventHandler func(event Event) error

type EventBus interface {
	Publish(name string, payload map[string]any) error
	Subscribe(name string, handler EventHandler) string
	Unsubscribe(id string) bool
}
