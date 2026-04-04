package config

import "testing"

func TestLoadReturnsDefaults(t *testing.T) {
	t.Parallel()

	cfg := Load()

	if cfg.Port != ":3000" {
		t.Fatalf("expected default port :3000, got %q", cfg.Port)
	}

	if cfg.DBDriver != "sqlite" {
		t.Fatalf("expected default driver sqlite, got %q", cfg.DBDriver)
	}

	if cfg.DBDSN != "blitzpress.db" {
		t.Fatalf("expected default dsn blitzpress.db, got %q", cfg.DBDSN)
	}

	if cfg.PluginsDir != "../build/plugins" {
		t.Fatalf("expected default plugins dir ../build/plugins, got %q", cfg.PluginsDir)
	}

	if cfg.LogLevel != "info" {
		t.Fatalf("expected default log level info, got %q", cfg.LogLevel)
	}
}

func TestLoadUsesEnvironmentOverrides(t *testing.T) {
	t.Setenv("BLITZPRESS_PORT", ":4000")
	t.Setenv("BLITZPRESS_DB_DRIVER", "postgres")
	t.Setenv("BLITZPRESS_DB_DSN", "postgres://localhost/blitzpress")
	t.Setenv("BLITZPRESS_PLUGINS_DIR", "C:/plugins")
	t.Setenv("BLITZPRESS_LOG_LEVEL", "debug")

	cfg := Load()

	if cfg.Port != ":4000" {
		t.Fatalf("expected overridden port :4000, got %q", cfg.Port)
	}

	if cfg.DBDriver != "postgres" {
		t.Fatalf("expected overridden driver postgres, got %q", cfg.DBDriver)
	}

	if cfg.DBDSN != "postgres://localhost/blitzpress" {
		t.Fatalf("expected overridden dsn, got %q", cfg.DBDSN)
	}

	if cfg.PluginsDir != "C:/plugins" {
		t.Fatalf("expected overridden plugins dir, got %q", cfg.PluginsDir)
	}

	if cfg.LogLevel != "debug" {
		t.Fatalf("expected overridden log level debug, got %q", cfg.LogLevel)
	}
}
