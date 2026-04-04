package database

import (
	"testing"

	"github.com/google/uuid"
)

func TestInitializeMigratesModelsAndGeneratesUUIDv7(t *testing.T) {
	t.Parallel()

	db, err := Initialize(Config{
		Driver: "sqlite",
		DSN:    "file:test_blitzpress_db_1?mode=memory&cache=shared",
	})
	if err != nil {
		t.Fatalf("Initialize() error = %v", err)
	}

	user := User{
		Email:    "admin@example.com",
		Password: "hashed-password",
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	if user.ID == uuid.Nil {
		t.Fatal("expected generated uuid")
	}

	if version := user.ID.Version(); version != 7 {
		t.Fatalf("expected uuid v7, got v%d", version)
	}

	if user.CreatedAt.String() == "" || user.UpdatedAt.String() == "" {
		t.Fatal("expected carbon datetime fields to be populated")
	}
}

func TestPluginSettingCompositeUniqueIndex(t *testing.T) {
	t.Parallel()

	db, err := Initialize(Config{
		Driver: "sqlite",
		DSN:    "file:test_blitzpress_db_2?mode=memory&cache=shared",
	})
	if err != nil {
		t.Fatalf("Initialize() error = %v", err)
	}

	setting := PluginSetting{
		PluginID: "example-plugin",
		Key:      "theme",
		Value:    `{"mode":"dark"}`,
	}
	if err := db.Create(&setting).Error; err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	duplicate := PluginSetting{
		PluginID: "example-plugin",
		Key:      "theme",
		Value:    `{"mode":"light"}`,
	}
	if err := db.Create(&duplicate).Error; err == nil {
		t.Fatal("expected duplicate plugin setting insert to fail")
	}

	differentPlugin := PluginSetting{
		PluginID: "another-plugin",
		Key:      "theme",
		Value:    `{"mode":"dark"}`,
	}
	if err := db.Create(&differentPlugin).Error; err != nil {
		t.Fatalf("Create() for different plugin error = %v", err)
	}
}

func TestCarbonDateTimePersistence(t *testing.T) {
	t.Parallel()

	db, err := Initialize(Config{
		Driver: "sqlite",
		DSN:    "file:test_blitzpress_db_3?mode=memory&cache=shared",
	})
	if err != nil {
		t.Fatalf("Initialize() error = %v", err)
	}

	setting := Setting{
		Key:   "site_name",
		Value: "BlitzPress",
	}
	if err := db.Create(&setting).Error; err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	var stored Setting
	if err := db.First(&stored, "id = ?", setting.ID).Error; err != nil {
		t.Fatalf("First() error = %v", err)
	}

	if stored.CreatedAt.String() == "" || stored.UpdatedAt.String() == "" {
		t.Fatal("expected persisted carbon datetime values")
	}

	if stored.CreatedAt.String() != setting.CreatedAt.String() {
		t.Fatalf("expected created_at %s, got %s", setting.CreatedAt, stored.CreatedAt)
	}
}
