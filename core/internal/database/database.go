package database

import (
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Config struct {
	Driver string
	DSN    string
}

func Initialize(cfg Config) (*gorm.DB, error) {
	var dialector gorm.Dialector

	switch cfg.Driver {
	case "postgres":
		dialector = postgres.Open(cfg.DSN)
	default:
		dialector = sqlite.Open(cfg.DSN)
	}

	db, err := gorm.Open(dialector, &gorm.Config{})
	if err != nil {
		return nil, err
	}

	if err := db.AutoMigrate(
		&User{},
		&Setting{},
		&PluginState{},
		&PluginSetting{},
	); err != nil {
		return nil, err
	}

	return db, nil
}
