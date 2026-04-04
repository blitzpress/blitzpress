package pluginsdk

import "gorm.io/gorm"

const SDKVersion = "0.1.0"

type Manifest struct {
	ID          string
	Name        string
	Version     string
	Description string
	Author      string
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
}
