package pluginsdk

type SettingsSchema struct {
	Sections []SettingsSection
}

type SettingsSection struct {
	ID     string
	Title  string
	Fields []SettingsField
}

type SettingsField struct {
	ID          string
	Type        string
	Label       string
	Description string
	Default     any
	Required    bool
	Min         *float64
	Max         *float64
	Options     []SelectOption
	Component   string
}

type SelectOption struct {
	Value string
	Label string
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
