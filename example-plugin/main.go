package main

import (
	"embed"
	"errors"
	"fmt"
	"sync"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
)

const (
	pluginID          = "example-plugin"
	pluginName        = "Example Plugin"
	pluginVersion     = "0.1.0"
	pluginDescription = "Reference backend plugin for BlitzPress."
	pluginAuthor      = "BlitzPress"
	staticAssetPath   = "/plugins/example-plugin/assets/hello.txt"

	defaultGreeting     = "Hello from Example Plugin"
	defaultMode         = "demo"
	defaultEnabled      = true
	defaultItemsPerPage = 5
)

//go:embed static/*
var staticFiles embed.FS

type ExamplePlugin struct{}

type hookEventState struct {
	mu             sync.Mutex
	coreReadyFired bool
	receivedEvents []receivedEvent
}

type receivedEvent struct {
	Name    string         `json:"name"`
	Payload map[string]any `json:"payload"`
}

var state hookEventState

type exampleSettings struct {
	Greeting     string
	Mode         string
	Enabled      bool
	ItemsPerPage int
}

func (ExamplePlugin) Manifest() pluginsdk.Manifest {
	return pluginsdk.Manifest{
		ID:          pluginID,
		Name:        pluginName,
		Version:     pluginVersion,
		Description: pluginDescription,
		Author:      pluginAuthor,
	}
}

func (p ExamplePlugin) Register(r *pluginsdk.Registrar) error {
	if r == nil {
		return errors.New("registrar is required")
	}

	if r.HTTP == nil || r.Hooks == nil || r.Settings == nil {
		return errors.New("registrar is missing required services")
	}

	r.Settings.Register(pluginsdk.SettingsSchema{
		Sections: []pluginsdk.SettingsSection{
			{
				ID:    "general",
				Title: "General",
				Fields: []pluginsdk.SettingsField{
					{
						ID:          "greeting",
						Type:        "string",
						Label:       "Greeting",
						Description: "Message returned by the example API endpoint.",
						Default:     defaultGreeting,
					},
					{
						ID:          "enabled",
						Type:        "boolean",
						Label:       "Enabled",
						Description: "Controls whether the example menu item is added.",
						Default:     defaultEnabled,
					},
					{
						ID:          "items_per_page",
						Type:        "number",
						Label:       "Items Per Page",
						Description: "Sample numeric setting consumed by the backend.",
						Default:     defaultItemsPerPage,
						Min:         float64Ptr(1),
						Max:         float64Ptr(50),
					},
					{
						ID:          "mode",
						Type:        "select",
						Label:       "Mode",
						Description: "Illustrative operating mode for the example backend.",
						Default:     defaultMode,
						Options: []pluginsdk.SelectOption{
							{Value: "demo", Label: "Demo"},
							{Value: "verbose", Label: "Verbose"},
						},
					},
				},
			},
		},
	})

	manifest := p.Manifest()
	settings := loadSettings(r)
	if r.Logger != nil {
		r.Logger.Info("registering example plugin backend", "enabled", settings.Enabled, "mode", settings.Mode)
	}

	if err := r.HTTP.API(func(router fiber.Router) {
		router.Get("/status", func(c *fiber.Ctx) error {
			current := loadSettings(r)
			if r.Logger != nil {
				r.Logger.Debug("example plugin status requested", "path", c.Path(), "mode", current.Mode)
			}

			return c.JSON(fiber.Map{
				"id":             manifest.ID,
				"name":           manifest.Name,
				"version":        manifest.Version,
				"description":    manifest.Description,
				"enabled":        current.Enabled,
				"greeting":       current.Greeting,
				"mode":           current.Mode,
				"items_per_page": current.ItemsPerPage,
				"static_asset":   staticAssetPath,
			})
		})

		router.Get("/hooks-status", func(c *fiber.Ctx) error {
			state.mu.Lock()
			coreReady := state.coreReadyFired
			state.mu.Unlock()

			menuItems, err := r.Hooks.ApplyFilters(
				&pluginsdk.HookContext{PluginID: pluginID},
				"admin.menu.items",
				[]pluginsdk.MenuItem(nil),
			)
			if err != nil {
				return fiber.NewError(fiber.StatusInternalServerError, err.Error())
			}

			type menuItemJSON struct {
				ID    string `json:"id"`
				Label string `json:"label"`
				Icon  string `json:"icon"`
				Path  string `json:"path"`
			}

			var items []menuItemJSON
			if resolved, ok := menuItems.([]pluginsdk.MenuItem); ok {
				for _, item := range resolved {
					items = append(items, menuItemJSON{
						ID:    item.ID,
						Label: item.Label,
						Icon:  item.Icon,
						Path:  item.Path,
					})
				}
			}

			return c.JSON(fiber.Map{
				"core_ready_received": coreReady,
				"menu_items":          items,
			})
		})

		router.Post("/events/publish", func(c *fiber.Ctx) error {
			var payload struct {
				Name string         `json:"name"`
				Data map[string]any `json:"data"`
			}
			if err := c.BodyParser(&payload); err != nil {
				return fiber.NewError(fiber.StatusBadRequest, err.Error())
			}
			if payload.Name == "" {
				return fiber.NewError(fiber.StatusBadRequest, "event name is required")
			}

			if err := r.Events.Publish(payload.Name, payload.Data); err != nil {
				return fiber.NewError(fiber.StatusInternalServerError, err.Error())
			}

			return c.JSON(fiber.Map{"published": true})
		})

		router.Get("/events/received", func(c *fiber.Ctx) error {
			state.mu.Lock()
			events := make([]receivedEvent, len(state.receivedEvents))
			copy(events, state.receivedEvents)
			state.mu.Unlock()

			return c.JSON(fiber.Map{"events": events})
		})
	}); err != nil {
		return err
	}

	if err := r.HTTP.Static(staticFiles, "static"); err != nil {
		return err
	}

	r.Hooks.AddAction("core.ready", func(ctx *pluginsdk.HookContext, args ...any) error {
		state.mu.Lock()
		state.coreReadyFired = true
		state.mu.Unlock()

		current := loadSettings(r)
		if r.Logger != nil {
			r.Logger.Info(
				"example plugin received core.ready",
				"plugin_id", ctx.PluginID,
				"enabled", current.Enabled,
				"mode", current.Mode,
			)
		}
		return nil
	})

	r.Events.Subscribe("example.ping", func(event pluginsdk.Event) error {
		state.mu.Lock()
		state.receivedEvents = append(state.receivedEvents, receivedEvent{
			Name:    event.Name,
			Payload: event.Payload,
		})
		state.mu.Unlock()
		return nil
	})

	r.Hooks.AddFilter("admin.menu.items", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
		if !loadSettings(r).Enabled {
			return value, nil
		}

		item := pluginsdk.MenuItem{
			ID:    pluginID + ".home",
			Label: pluginName,
			Icon:  "puzzle",
			Path:  "/plugins/" + pluginID,
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

	return nil
}

func loadSettings(r *pluginsdk.Registrar) exampleSettings {
	settings := exampleSettings{
		Greeting:     defaultGreeting,
		Mode:         defaultMode,
		Enabled:      defaultEnabled,
		ItemsPerPage: defaultItemsPerPage,
	}

	if r == nil || r.Config == nil {
		return settings
	}

	if value, err := r.Config.Get("greeting"); err == nil {
		settings.Greeting = value
	}
	if value, err := r.Config.Get("mode"); err == nil {
		settings.Mode = value
	}
	if value, err := r.Config.GetBool("enabled"); err == nil {
		settings.Enabled = value
	}
	if value, err := r.Config.GetInt("items_per_page"); err == nil {
		settings.ItemsPerPage = value
	}

	return settings
}

func float64Ptr(value float64) *float64 {
	return &value
}

var Plugin ExamplePlugin

func main() {}
