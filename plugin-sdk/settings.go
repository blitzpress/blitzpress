package pluginsdk

type SettingsSchema struct {
	Sections []SettingsSection `json:"sections"`
}

type SettingsSection struct {
	ID     string          `json:"id"`
	Title  string          `json:"title"`
	Fields []SettingsField `json:"fields"`
}

type SettingsField struct {
	ID          string         `json:"id"`
	Type        string         `json:"type"`
	Label       string         `json:"label"`
	Description string         `json:"description,omitempty"`
	Default     any            `json:"default,omitempty"`
	Required    bool           `json:"required"`
	Min         *float64       `json:"min,omitempty"`
	Max         *float64       `json:"max,omitempty"`
	Options     []SelectOption `json:"options,omitempty"`
	Component   string         `json:"component,omitempty"`
}

type SelectOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type SettingsRegistry interface {
	Register(schema SettingsSchema)
}

type ConfigReader interface {
	Get(key string) (string, error)
	GetInt(key string) (int, error)
	GetFloat(key string) (float64, error)
	GetBool(key string) (bool, error)
	GetAll() (map[string]any, error)
}
