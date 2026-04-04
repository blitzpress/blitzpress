package config

import "os"

type AppConfig struct {
	Port       string
	DBDriver   string
	DBDSN      string
	PluginsDir string
	LogLevel   string
}

func Load() *AppConfig {
	return &AppConfig{
		Port:       envOrDefault("BLITZPRESS_PORT", ":3000"),
		DBDriver:   envOrDefault("BLITZPRESS_DB_DRIVER", "sqlite"),
		DBDSN:      envOrDefault("BLITZPRESS_DB_DSN", "blitzpress.db"),
		PluginsDir: envOrDefault("BLITZPRESS_PLUGINS_DIR", "../build/plugins"),
		LogLevel:   envOrDefault("BLITZPRESS_LOG_LEVEL", "info"),
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
