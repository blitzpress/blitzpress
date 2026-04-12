package main

import (
	"embed"
	"errors"
	"fmt"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
)

const (
	pluginID      = "users-plugin"
	pluginName    = "Users & Authentication"
	pluginVersion = "0.1.0"
)

//go:embed all:frontend_embed
var frontendFiles embed.FS

type UsersPlugin struct{}

func (UsersPlugin) Manifest() pluginsdk.Manifest {
	return pluginsdk.Manifest{
		ID:          pluginID,
		Name:        pluginName,
		Version:     pluginVersion,
		Description: "User management, roles, capabilities, and authentication for BlitzPress.",
		Author:      "BlitzPress",
	}
}

func (p UsersPlugin) Register(r *pluginsdk.Registrar) error {
	if r == nil {
		return errors.New("registrar is required")
	}
	if r.DB == nil {
		return errors.New("database is required for users plugin")
	}
	if r.Auth == nil {
		return errors.New("auth registry is required for users plugin")
	}

	if err := r.DB.AutoMigrate(
		&UsersPluginUser{},
		&UsersPluginRole{},
		&UsersPluginCapability{},
		&UsersPluginRoleCapability{},
		&UsersPluginUserRole{},
	); err != nil {
		return fmt.Errorf("users plugin migration failed: %w", err)
	}

	if err := seedRolesAndCapabilities(r.DB); err != nil {
		return fmt.Errorf("seed roles failed: %w", err)
	}
	if err := seedDefaultAdmin(r.DB); err != nil {
		return fmt.Errorf("seed admin failed: %w", err)
	}

	cache := newRoleCapCache(r.DB)
	if err := cache.Load(); err != nil {
		return fmt.Errorf("load role cache failed: %w", err)
	}

	driver := newUsersAuthDriver(r.DB, cache)
	r.Auth.RegisterDriver(driver)

	if err := r.HTTP.API(func(router fiber.Router) {
		registerRoutes(router, driver, r.DB, cache)
	}); err != nil {
		return err
	}

	if err := r.HTTP.Static(frontendFiles, "frontend_embed/assets"); err != nil {
		return err
	}

	r.Hooks.AddFilter("admin.menu.items", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
		item := pluginsdk.MenuItem{
			ID:    pluginID + ".users",
			Label: "Users",
			Icon:  "users",
			Path:  "/users",
		}

		switch items := value.(type) {
		case nil:
			return []pluginsdk.MenuItem{item}, nil
		case []pluginsdk.MenuItem:
			return append(items, item), nil
		default:
			return value, fmt.Errorf("admin.menu.items expects []pluginsdk.MenuItem, got %T", value)
		}
	})

	if r.Logger != nil {
		r.Logger.Info("users plugin registered, auth driver active")
	}

	return nil
}

var Plugin UsersPlugin

func main() {}
