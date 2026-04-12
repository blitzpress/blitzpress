package pluginsdk

import "gorm.io/gorm"

const SDKVersion = "0.1.0"

type Manifest struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Version     string `json:"version"`
	Description string `json:"description,omitempty"`
	Author      string `json:"author,omitempty"`
}

type Plugin interface {
	Manifest() Manifest
	Register(r *Registrar) error
}

type Registrar struct {
	Hooks    HookRegistry
	HTTP     HTTPRegistry
	Events   EventBus
	DB       *gorm.DB
	Settings SettingsRegistry
	Logger   Logger
	Config   ConfigReader
	Auth     AuthRegistry
}
