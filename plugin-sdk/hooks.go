package pluginsdk

type HookID string

type HookOptions struct {
	Priority int `json:"priority"`
}

type HookContext struct {
	PluginID  string         `json:"plugin_id"`
	RequestID string         `json:"request_id,omitempty"`
	Metadata  map[string]any `json:"metadata,omitempty"`
}

type ActionFunc func(ctx *HookContext, args ...any) error
type FilterFunc func(ctx *HookContext, value any, args ...any) (any, error)

type HookRegistry interface {
	AddAction(name string, fn ActionFunc, opts ...HookOptions) HookID
	DoAction(ctx *HookContext, name string, args ...any) error
	RemoveAction(name string, id HookID) bool

	AddFilter(name string, fn FilterFunc, opts ...HookOptions) HookID
	ApplyFilters(ctx *HookContext, name string, value any, args ...any) (any, error)
	RemoveFilter(name string, id HookID) bool
}
