package plugins

import (
	"errors"
	"reflect"
	"testing"

	"github.com/BlitzPress/BlitzPress/core/internal/database"
	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"gorm.io/gorm"
)

func TestPluginSettingsRegistryRegisterStoresSchemaCopy(t *testing.T) {
	t.Parallel()

	min := 1.0
	max := 10.0
	schema := pluginsdk.SettingsSchema{
		Sections: []pluginsdk.SettingsSection{
			{
				ID:    "general",
				Title: "General",
				Fields: []pluginsdk.SettingsField{
					{
						ID:        "mode",
						Type:      "select",
						Label:     "Mode",
						Default:   "basic",
						Options:   []pluginsdk.SelectOption{{Value: "basic", Label: "Basic"}},
						Min:       &min,
						Max:       &max,
						Component: "example-plugin.mode",
					},
				},
			},
		},
	}

	registry := newPluginSettingsRegistry(" example-plugin ")
	registry.Register(schema)

	if registry.pluginID != "example-plugin" {
		t.Fatalf("expected trimmed plugin id %q, got %q", "example-plugin", registry.pluginID)
	}
	if registry.schema == nil {
		t.Fatal("expected registered schema to be stored")
	}
	if !reflect.DeepEqual(*registry.schema, schema) {
		t.Fatalf("expected stored schema %+v, got %+v", schema, *registry.schema)
	}

	schema.Sections[0].Title = "Mutated"
	schema.Sections[0].Fields[0].Label = "Changed"
	schema.Sections[0].Fields[0].Options[0].Label = "Changed option"
	*schema.Sections[0].Fields[0].Min = 99
	*schema.Sections[0].Fields[0].Max = 100

	if registry.schema.Sections[0].Title != "General" {
		t.Fatalf("expected stored section title to remain %q, got %q", "General", registry.schema.Sections[0].Title)
	}
	if registry.schema.Sections[0].Fields[0].Label != "Mode" {
		t.Fatalf("expected stored field label to remain %q, got %q", "Mode", registry.schema.Sections[0].Fields[0].Label)
	}
	if registry.schema.Sections[0].Fields[0].Options[0].Label != "Basic" {
		t.Fatalf("expected stored option label to remain %q, got %q", "Basic", registry.schema.Sections[0].Fields[0].Options[0].Label)
	}
	if registry.schema.Sections[0].Fields[0].Min == nil || *registry.schema.Sections[0].Fields[0].Min != 1 {
		t.Fatalf("expected stored min pointer to remain 1, got %v", registry.schema.Sections[0].Fields[0].Min)
	}
	if registry.schema.Sections[0].Fields[0].Max == nil || *registry.schema.Sections[0].Fields[0].Max != 10 {
		t.Fatalf("expected stored max pointer to remain 10, got %v", registry.schema.Sections[0].Fields[0].Max)
	}
}

func TestPluginConfigReaderGetAndGetAll(t *testing.T) {
	t.Parallel()

	db := newSettingsTestDB(t, "plugin_config_get_all")
	insertPluginSettings(t, db,
		database.PluginSetting{PluginID: "example-plugin", Key: "api_key", Value: `"secret-key"`},
		database.PluginSetting{PluginID: "example-plugin", Key: "max_items", Value: `25`},
		database.PluginSetting{PluginID: "example-plugin", Key: "advanced", Value: `{"enabled":true,"ratio":1.5,"tags":["alpha",2]}`},
		database.PluginSetting{PluginID: "other-plugin", Key: "api_key", Value: `"ignored"`},
	)

	reader := newPluginConfigReader(" example-plugin ", db)

	gotValue, err := reader.Get("api_key")
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if gotValue != "secret-key" {
		t.Fatalf("expected api_key %q, got %q", "secret-key", gotValue)
	}

	gotAll, err := reader.GetAll()
	if err != nil {
		t.Fatalf("GetAll() error = %v", err)
	}

	wantAll := map[string]any{
		"advanced": map[string]any{
			"enabled": true,
			"ratio":   1.5,
			"tags":    []any{"alpha", int64(2)},
		},
		"api_key":   "secret-key",
		"max_items": int64(25),
	}

	if !reflect.DeepEqual(gotAll, wantAll) {
		t.Fatalf("expected GetAll()=%#v, got %#v", wantAll, gotAll)
	}
}

func TestPluginConfigReaderTypeConversions(t *testing.T) {
	t.Parallel()

	db := newSettingsTestDB(t, "plugin_config_type_conversions")
	insertPluginSettings(t, db,
		database.PluginSetting{PluginID: "example-plugin", Key: "count_number", Value: `42`},
		database.PluginSetting{PluginID: "example-plugin", Key: "count_string", Value: `"42"`},
		database.PluginSetting{PluginID: "example-plugin", Key: "ratio_number", Value: `3.75`},
		database.PluginSetting{PluginID: "example-plugin", Key: "ratio_string", Value: `"3.75"`},
		database.PluginSetting{PluginID: "example-plugin", Key: "enabled_bool", Value: `true`},
		database.PluginSetting{PluginID: "example-plugin", Key: "enabled_string", Value: `"true"`},
		database.PluginSetting{PluginID: "example-plugin", Key: "enabled_number", Value: `1`},
	)

	reader := newPluginConfigReader("example-plugin", db)

	tests := []struct {
		name string
		run  func(*testing.T)
	}{
		{
			name: "Get converts number to string",
			run: func(t *testing.T) {
				t.Helper()

				got, err := reader.Get("count_number")
				if err != nil {
					t.Fatalf("Get() error = %v", err)
				}
				if got != "42" {
					t.Fatalf("expected %q, got %q", "42", got)
				}
			},
		},
		{
			name: "GetInt reads JSON number",
			run: func(t *testing.T) {
				t.Helper()

				got, err := reader.GetInt("count_number")
				if err != nil {
					t.Fatalf("GetInt() error = %v", err)
				}
				if got != 42 {
					t.Fatalf("expected %d, got %d", 42, got)
				}
			},
		},
		{
			name: "GetInt reads numeric string",
			run: func(t *testing.T) {
				t.Helper()

				got, err := reader.GetInt("count_string")
				if err != nil {
					t.Fatalf("GetInt() error = %v", err)
				}
				if got != 42 {
					t.Fatalf("expected %d, got %d", 42, got)
				}
			},
		},
		{
			name: "GetFloat reads JSON number",
			run: func(t *testing.T) {
				t.Helper()

				got, err := reader.GetFloat("ratio_number")
				if err != nil {
					t.Fatalf("GetFloat() error = %v", err)
				}
				if got != 3.75 {
					t.Fatalf("expected %v, got %v", 3.75, got)
				}
			},
		},
		{
			name: "GetFloat reads numeric string",
			run: func(t *testing.T) {
				t.Helper()

				got, err := reader.GetFloat("ratio_string")
				if err != nil {
					t.Fatalf("GetFloat() error = %v", err)
				}
				if got != 3.75 {
					t.Fatalf("expected %v, got %v", 3.75, got)
				}
			},
		},
		{
			name: "GetBool reads JSON boolean",
			run: func(t *testing.T) {
				t.Helper()

				got, err := reader.GetBool("enabled_bool")
				if err != nil {
					t.Fatalf("GetBool() error = %v", err)
				}
				if !got {
					t.Fatal("expected true, got false")
				}
			},
		},
		{
			name: "GetBool reads string boolean",
			run: func(t *testing.T) {
				t.Helper()

				got, err := reader.GetBool("enabled_string")
				if err != nil {
					t.Fatalf("GetBool() error = %v", err)
				}
				if !got {
					t.Fatal("expected true, got false")
				}
			},
		},
		{
			name: "GetBool reads numeric boolean",
			run: func(t *testing.T) {
				t.Helper()

				got, err := reader.GetBool("enabled_number")
				if err != nil {
					t.Fatalf("GetBool() error = %v", err)
				}
				if !got {
					t.Fatal("expected true, got false")
				}
			},
		},
		{
			name: "missing key returns record not found",
			run: func(t *testing.T) {
				t.Helper()

				_, err := reader.Get("missing")
				if !errors.Is(err, gorm.ErrRecordNotFound) {
					t.Fatalf("expected gorm.ErrRecordNotFound, got %v", err)
				}
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, tt.run)
	}
}

func newSettingsTestDB(t *testing.T, name string) *gorm.DB {
	t.Helper()

	db, err := database.Initialize(database.Config{
		Driver: "sqlite",
		DSN:    "file:" + name + "?mode=memory&cache=shared",
	})
	if err != nil {
		t.Fatalf("Initialize() error = %v", err)
	}

	return db
}

func insertPluginSettings(t *testing.T, db *gorm.DB, settings ...database.PluginSetting) {
	t.Helper()

	for _, setting := range settings {
		if err := db.Create(&setting).Error; err != nil {
			t.Fatalf("Create(%s/%s) error = %v", setting.PluginID, setting.Key, err)
		}
	}
}
