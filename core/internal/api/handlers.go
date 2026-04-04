package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"net/mail"
	"net/url"
	"path"
	"regexp"
	"strconv"
	"strings"

	"github.com/BlitzPress/BlitzPress/core/internal/database"
	"github.com/BlitzPress/BlitzPress/core/internal/plugins"
	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var colorPattern = regexp.MustCompile(`^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$`)

type pluginListResponse struct {
	Plugins []pluginListItem `json:"plugins"`
}

type pluginListItem struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Version       string `json:"version"`
	HasFrontend   bool   `json:"has_frontend"`
	FrontendEntry string `json:"frontend_entry,omitempty"`
	FrontendStyle string `json:"frontend_style,omitempty"`
}

type pluginSettingsResponse struct {
	Schema *pluginsdk.SettingsSchema `json:"schema"`
	Values map[string]any            `json:"values"`
}

type settingsPayload struct {
	Values map[string]any `json:"values"`
}

func CMSPluginsHandler(registry *plugins.PluginRegistry) fiber.Handler {
	return func(c *fiber.Ctx) error {
		items := make([]pluginListItem, 0)
		for _, plugin := range registry.ListPlugins() {
			if plugin.Status != "loaded" {
				continue
			}

			items = append(items, pluginListItem{
				ID:            plugin.Manifest.ID,
				Name:          plugin.Manifest.Name,
				Version:       plugin.Manifest.Version,
				HasFrontend:   plugin.ManifestFile.HasFrontend,
				FrontendEntry: plugin.ManifestFile.FrontendEntry,
				FrontendStyle: plugin.ManifestFile.FrontendStyle,
			})
		}

		return c.JSON(pluginListResponse{Plugins: items})
	}
}

func PluginSettingsGetHandler(registry *plugins.PluginRegistry, db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		plugin, ok := registry.GetPlugin(c.Params("id"))
		if !ok || plugin.SettingsSchema == nil {
			return fiber.NewError(fiber.StatusNotFound, "plugin settings not found")
		}

		values, err := plugins.NewPluginConfigReader(plugin.Manifest.ID, db).GetAll()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		schema := cloneSchema(*plugin.SettingsSchema)
		return c.JSON(pluginSettingsResponse{
			Schema: &schema,
			Values: values,
		})
	}
}

func PluginSettingsPutHandler(registry *plugins.PluginRegistry, db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		plugin, ok := registry.GetPlugin(c.Params("id"))
		if !ok || plugin.SettingsSchema == nil {
			return fiber.NewError(fiber.StatusNotFound, "plugin settings not found")
		}

		values, err := parseSettingsPayload(c.Body())
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		validated, validationErrors := validateSettings(*plugin.SettingsSchema, values)
		if len(validationErrors) > 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":  "settings validation failed",
				"fields": validationErrors,
			})
		}

		if err := savePluginSettings(db, plugin.Manifest.ID, validated); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		return c.JSON(fiber.Map{
			"values": validated,
		})
	}
}

func CMSModulesHandler(modules fs.FS) fiber.Handler {
	return func(c *fiber.Ctx) error {
		modulePath := strings.TrimPrefix(c.Params("*"), "/")
		modulePath = path.Clean(modulePath)
		if modulePath == "." || modulePath == "" || !fs.ValidPath(modulePath) {
			return fiber.NewError(fiber.StatusNotFound, "module not found")
		}

		contents, err := fs.ReadFile(modules, modulePath)
		if err != nil {
			if errors.Is(err, fs.ErrNotExist) {
				return fiber.NewError(fiber.StatusNotFound, "module not found")
			}

			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		c.Type(path.Ext(modulePath))
		return c.Send(contents)
	}
}

func parseSettingsPayload(body []byte) (map[string]any, error) {
	if len(body) == 0 {
		return map[string]any{}, nil
	}

	var wrapped settingsPayload
	if err := json.Unmarshal(body, &wrapped); err == nil && wrapped.Values != nil {
		return wrapped.Values, nil
	}

	var direct map[string]any
	if err := json.Unmarshal(body, &direct); err != nil {
		return nil, fmt.Errorf("invalid settings payload: %w", err)
	}

	return direct, nil
}

func savePluginSettings(db *gorm.DB, pluginID string, values map[string]any) error {
	for key, value := range values {
		encoded, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("encode plugin setting %q: %w", key, err)
		}

		record := database.PluginSetting{
			PluginID: pluginID,
			Key:      key,
			Value:    string(encoded),
		}

		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "plugin_id"}, {Name: "key"}},
			DoUpdates: clause.AssignmentColumns([]string{"value_json", "updated_at"}),
		}).Create(&record).Error; err != nil {
			return fmt.Errorf("save plugin setting %q: %w", key, err)
		}
	}

	return nil
}

func validateSettings(schema pluginsdk.SettingsSchema, values map[string]any) (map[string]any, map[string]string) {
	validated := make(map[string]any)
	fieldErrors := make(map[string]string)

	for _, section := range schema.Sections {
		for _, field := range section.Fields {
			value, hasValue := values[field.ID]
			if !hasValue {
				if field.Required {
					fieldErrors[field.ID] = "field is required"
				}
				continue
			}

			normalized, err := validateField(field, value)
			if err != nil {
				fieldErrors[field.ID] = err.Error()
				continue
			}

			validated[field.ID] = normalized
		}
	}

	return validated, fieldErrors
}

func validateField(field pluginsdk.SettingsField, value any) (any, error) {
	switch field.Type {
	case "string", "text":
		return requireString(value)
	case "number":
		number, err := asFloat64(value)
		if err != nil {
			return nil, err
		}
		if field.Min != nil && number < *field.Min {
			return nil, fmt.Errorf("must be greater than or equal to %v", *field.Min)
		}
		if field.Max != nil && number > *field.Max {
			return nil, fmt.Errorf("must be less than or equal to %v", *field.Max)
		}
		return number, nil
	case "boolean":
		return asBool(value)
	case "select":
		str, err := requireString(value)
		if err != nil {
			return nil, err
		}
		for _, option := range field.Options {
			if option.Value == str {
				return str, nil
			}
		}
		return nil, errors.New("must be one of the allowed options")
	case "color":
		str, err := requireString(value)
		if err != nil {
			return nil, err
		}
		if !colorPattern.MatchString(str) {
			return nil, errors.New("must be a valid hex color")
		}
		return str, nil
	case "url":
		str, err := requireString(value)
		if err != nil {
			return nil, err
		}
		if _, err := url.ParseRequestURI(str); err != nil {
			return nil, errors.New("must be a valid URL")
		}
		return str, nil
	case "email":
		str, err := requireString(value)
		if err != nil {
			return nil, err
		}
		if _, err := mail.ParseAddress(str); err != nil {
			return nil, errors.New("must be a valid email")
		}
		return str, nil
	case "custom":
		return value, nil
	default:
		return requireString(value)
	}
}

func requireString(value any) (string, error) {
	str, ok := value.(string)
	if !ok {
		return "", errors.New("must be a string")
	}

	return str, nil
}

func asFloat64(value any) (float64, error) {
	switch typed := value.(type) {
	case float64:
		return typed, nil
	case float32:
		return float64(typed), nil
	case int:
		return float64(typed), nil
	case int64:
		return float64(typed), nil
	case json.Number:
		return typed.Float64()
	case string:
		return strconv.ParseFloat(strings.TrimSpace(typed), 64)
	default:
		return 0, errors.New("must be a number")
	}
}

func asBool(value any) (bool, error) {
	switch typed := value.(type) {
	case bool:
		return typed, nil
	case string:
		parsed, err := strconv.ParseBool(strings.TrimSpace(typed))
		if err != nil {
			return false, errors.New("must be a boolean")
		}
		return parsed, nil
	default:
		return false, errors.New("must be a boolean")
	}
}

func cloneSchema(schema pluginsdk.SettingsSchema) pluginsdk.SettingsSchema {
	cloned := pluginsdk.SettingsSchema{
		Sections: make([]pluginsdk.SettingsSection, len(schema.Sections)),
	}

	for i, section := range schema.Sections {
		clonedSection := pluginsdk.SettingsSection{
			ID:     section.ID,
			Title:  section.Title,
			Fields: make([]pluginsdk.SettingsField, len(section.Fields)),
		}

		for j, field := range section.Fields {
			clonedField := field
			clonedField.Options = append([]pluginsdk.SelectOption(nil), field.Options...)
			clonedSection.Fields[j] = clonedField
		}

		cloned.Sections[i] = clonedSection
	}

	return cloned
}
