package main

import (
	"embed"
	"errors"
	"fmt"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

const (
	pluginID           = "users-plugin"
	pluginName         = "Users & Authentication"
	pluginVersion      = "0.1.0"
	defaultNewUserRole = "subscriber"
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
	if r.Settings != nil {
		schema, err := buildSettingsSchema(r.DB)
		if err != nil {
			return fmt.Errorf("build users plugin settings schema failed: %w", err)
		}
		r.Settings.Register(schema)
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

func buildSettingsSchema(db *gorm.DB) (pluginsdk.SettingsSchema, error) {
	roleOptions, defaultRole, err := buildRoleOptions(db)
	if err != nil {
		return pluginsdk.SettingsSchema{}, err
	}

	return pluginsdk.SettingsSchema{
		Sections: []pluginsdk.SettingsSection{
			{
				ID:    "registration",
				Title: "Registration",
				Fields: []pluginsdk.SettingsField{
					{
						ID:          "two_factor_required",
						Type:        "boolean",
						Label:       "Require Two-Factor Authentication",
						Description: "Require users to complete two-factor authentication when signing in.",
						Default:     false,
					},
					{
						ID:          "user_registration_allowed",
						Type:        "boolean",
						Label:       "Allow User Registration",
						Description: "Allow visitors to create their own accounts.",
						Default:     false,
					},
					{
						ID:          "new_user_role",
						Type:        "select",
						Label:       "Default Role For New Users",
						Description: "Assign this role to newly created users.",
						Default:     defaultRole,
						Required:    true,
						Options:     roleOptions,
					},
				},
			},
		},
	}, nil
}

func buildRoleOptions(db *gorm.DB) ([]pluginsdk.SelectOption, string, error) {
	var roles []UsersPluginRole
	if err := db.Order("label ASC, slug ASC").Find(&roles).Error; err != nil {
		return nil, "", err
	}

	options := make([]pluginsdk.SelectOption, 0, len(roles))
	defaultRole := ""
	for _, role := range roles {
		options = append(options, pluginsdk.SelectOption{
			Value: role.Slug,
			Label: role.Label,
		})
		if role.Slug == defaultNewUserRole {
			defaultRole = role.Slug
		}
	}

	if defaultRole == "" && len(options) > 0 {
		defaultRole = options[0].Value
	}

	return options, defaultRole, nil
}

var Plugin UsersPlugin

func main() {}
