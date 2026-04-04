package plugins

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"strconv"
	"strings"

	"github.com/BlitzPress/BlitzPress/core/internal/database"
	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"gorm.io/gorm"
)

var (
	errPluginConfigReaderPluginIDRequired = errors.New("plugin id is required")
	errPluginConfigReaderDBRequired       = errors.New("database is required")
	errPluginConfigReaderKeyRequired      = errors.New("setting key is required")
	errPluginConfigReaderInvalidType      = errors.New("plugin setting type mismatch")
)

type pluginSettingsRegistry struct {
	pluginID string
	schema   *pluginsdk.SettingsSchema
}

type pluginConfigReader struct {
	pluginID string
	db       *gorm.DB
}

var _ pluginsdk.SettingsRegistry = (*pluginSettingsRegistry)(nil)
var _ pluginsdk.ConfigReader = (*pluginConfigReader)(nil)

func newPluginSettingsRegistry(pluginID string) *pluginSettingsRegistry {
	return &pluginSettingsRegistry{
		pluginID: strings.TrimSpace(pluginID),
	}
}

func (r *pluginSettingsRegistry) Register(schema pluginsdk.SettingsSchema) {
	cloned := cloneSettingsSchema(schema)
	r.schema = &cloned
}

func newPluginConfigReader(pluginID string, db *gorm.DB) *pluginConfigReader {
	return &pluginConfigReader{
		pluginID: strings.TrimSpace(pluginID),
		db:       db,
	}
}

func (r *pluginConfigReader) Get(key string) (string, error) {
	value, err := r.getDecoded(key)
	if err != nil {
		return "", err
	}

	result, err := configValueAsString(value)
	if err != nil {
		return "", fmt.Errorf("read plugin setting %q for %q as string: %w", key, r.pluginID, err)
	}

	return result, nil
}

func (r *pluginConfigReader) GetInt(key string) (int, error) {
	value, err := r.getDecoded(key)
	if err != nil {
		return 0, err
	}

	result, err := configValueAsInt(value)
	if err != nil {
		return 0, fmt.Errorf("read plugin setting %q for %q as int: %w", key, r.pluginID, err)
	}

	return result, nil
}

func (r *pluginConfigReader) GetFloat(key string) (float64, error) {
	value, err := r.getDecoded(key)
	if err != nil {
		return 0, err
	}

	result, err := configValueAsFloat(value)
	if err != nil {
		return 0, fmt.Errorf("read plugin setting %q for %q as float: %w", key, r.pluginID, err)
	}

	return result, nil
}

func (r *pluginConfigReader) GetBool(key string) (bool, error) {
	value, err := r.getDecoded(key)
	if err != nil {
		return false, err
	}

	result, err := configValueAsBool(value)
	if err != nil {
		return false, fmt.Errorf("read plugin setting %q for %q as bool: %w", key, r.pluginID, err)
	}

	return result, nil
}

func (r *pluginConfigReader) GetAll() (map[string]any, error) {
	if err := r.validate(); err != nil {
		return nil, err
	}

	var records []database.PluginSetting
	if err := r.db.
		Where("plugin_id = ?", r.pluginID).
		Order("key ASC").
		Find(&records).Error; err != nil {
		return nil, fmt.Errorf("load plugin settings for %q: %w", r.pluginID, err)
	}

	values := make(map[string]any, len(records))
	for _, record := range records {
		decoded, err := decodePluginSettingValue(record.Value)
		if err != nil {
			return nil, fmt.Errorf("decode plugin setting %q for %q: %w", record.Key, r.pluginID, err)
		}

		values[record.Key] = decoded
	}

	return values, nil
}

func (r *pluginConfigReader) getDecoded(key string) (any, error) {
	if err := r.validate(); err != nil {
		return nil, err
	}

	trimmedKey := strings.TrimSpace(key)
	if trimmedKey == "" {
		return nil, errPluginConfigReaderKeyRequired
	}

	var record database.PluginSetting
	if err := r.db.
		Where("plugin_id = ? AND key = ?", r.pluginID, trimmedKey).
		First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("load plugin setting %q for %q: %w", trimmedKey, r.pluginID, err)
		}

		return nil, fmt.Errorf("load plugin setting %q for %q: %w", trimmedKey, r.pluginID, err)
	}

	decoded, err := decodePluginSettingValue(record.Value)
	if err != nil {
		return nil, fmt.Errorf("decode plugin setting %q for %q: %w", trimmedKey, r.pluginID, err)
	}

	return decoded, nil
}

func (r *pluginConfigReader) validate() error {
	if strings.TrimSpace(r.pluginID) == "" {
		return errPluginConfigReaderPluginIDRequired
	}
	if r.db == nil {
		return errPluginConfigReaderDBRequired
	}

	return nil
}

func cloneSettingsSchema(schema pluginsdk.SettingsSchema) pluginsdk.SettingsSchema {
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
			clonedField.Min = cloneFloat64Pointer(field.Min)
			clonedField.Max = cloneFloat64Pointer(field.Max)
			clonedSection.Fields[j] = clonedField
		}

		cloned.Sections[i] = clonedSection
	}

	return cloned
}

func cloneFloat64Pointer(value *float64) *float64 {
	if value == nil {
		return nil
	}

	cloned := *value
	return &cloned
}

func decodePluginSettingValue(raw string) (any, error) {
	decoder := json.NewDecoder(strings.NewReader(raw))
	decoder.UseNumber()

	var value any
	if err := decoder.Decode(&value); err != nil {
		return nil, err
	}

	if err := ensureJSONEOF(decoder); err != nil {
		return nil, err
	}

	return normalizeDecodedJSONValue(value)
}

func ensureJSONEOF(decoder *json.Decoder) error {
	var trailing any
	if err := decoder.Decode(&trailing); err != nil {
		if errors.Is(err, io.EOF) {
			return nil
		}

		return err
	}

	return errors.New("unexpected trailing data")
}

func normalizeDecodedJSONValue(value any) (any, error) {
	switch typed := value.(type) {
	case map[string]any:
		normalized := make(map[string]any, len(typed))
		for key, child := range typed {
			next, err := normalizeDecodedJSONValue(child)
			if err != nil {
				return nil, err
			}

			normalized[key] = next
		}

		return normalized, nil
	case []any:
		normalized := make([]any, len(typed))
		for i, child := range typed {
			next, err := normalizeDecodedJSONValue(child)
			if err != nil {
				return nil, err
			}

			normalized[i] = next
		}

		return normalized, nil
	case json.Number:
		if integer, err := typed.Int64(); err == nil {
			return integer, nil
		}

		floating, err := typed.Float64()
		if err != nil {
			return nil, err
		}

		return floating, nil
	default:
		return typed, nil
	}
}

func configValueAsString(value any) (string, error) {
	switch typed := value.(type) {
	case string:
		return typed, nil
	case bool:
		return strconv.FormatBool(typed), nil
	case int:
		return strconv.Itoa(typed), nil
	case int8, int16, int32, int64:
		return strconv.FormatInt(reflectInt64(typed), 10), nil
	case uint, uint8, uint16, uint32, uint64:
		return strconv.FormatUint(reflectUint64(typed), 10), nil
	case float32:
		return strconv.FormatFloat(float64(typed), 'f', -1, 32), nil
	case float64:
		return strconv.FormatFloat(typed, 'f', -1, 64), nil
	default:
		return "", fmt.Errorf("%w: cannot convert %T to string", errPluginConfigReaderInvalidType, value)
	}
}

func configValueAsInt(value any) (int, error) {
	switch typed := value.(type) {
	case int:
		return typed, nil
	case int8, int16, int32, int64:
		return intFromInt64(reflectInt64(typed))
	case uint, uint8, uint16, uint32, uint64:
		return intFromUint64(reflectUint64(typed))
	case float32:
		return intFromFloat64(float64(typed))
	case float64:
		return intFromFloat64(typed)
	case string:
		return intFromString(typed)
	default:
		return 0, fmt.Errorf("%w: cannot convert %T to int", errPluginConfigReaderInvalidType, value)
	}
}

func configValueAsFloat(value any) (float64, error) {
	switch typed := value.(type) {
	case float64:
		return typed, nil
	case float32:
		return float64(typed), nil
	case int, int8, int16, int32, int64:
		return float64(reflectInt64(typed)), nil
	case uint, uint8, uint16, uint32, uint64:
		return float64(reflectUint64(typed)), nil
	case string:
		trimmed := strings.TrimSpace(typed)
		if trimmed == "" {
			return 0, fmt.Errorf("%w: cannot convert empty string to float", errPluginConfigReaderInvalidType)
		}

		floating, err := strconv.ParseFloat(trimmed, 64)
		if err != nil {
			return 0, fmt.Errorf("%w: cannot convert %q to float", errPluginConfigReaderInvalidType, typed)
		}

		return floating, nil
	default:
		return 0, fmt.Errorf("%w: cannot convert %T to float", errPluginConfigReaderInvalidType, value)
	}
}

func configValueAsBool(value any) (bool, error) {
	switch typed := value.(type) {
	case bool:
		return typed, nil
	case string:
		trimmed := strings.TrimSpace(typed)
		if trimmed == "" {
			return false, fmt.Errorf("%w: cannot convert empty string to bool", errPluginConfigReaderInvalidType)
		}

		boolean, err := strconv.ParseBool(trimmed)
		if err != nil {
			return false, fmt.Errorf("%w: cannot convert %q to bool", errPluginConfigReaderInvalidType, typed)
		}

		return boolean, nil
	case int, int8, int16, int32, int64:
		return boolFromInt64(reflectInt64(typed))
	case uint, uint8, uint16, uint32, uint64:
		return boolFromUint64(reflectUint64(typed))
	case float32:
		return boolFromFloat64(float64(typed))
	case float64:
		return boolFromFloat64(typed)
	default:
		return false, fmt.Errorf("%w: cannot convert %T to bool", errPluginConfigReaderInvalidType, value)
	}
}

func intFromString(value string) (int, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return 0, fmt.Errorf("%w: cannot convert empty string to int", errPluginConfigReaderInvalidType)
	}

	if integer, err := strconv.ParseInt(trimmed, 10, 64); err == nil {
		return intFromInt64(integer)
	}

	floating, err := strconv.ParseFloat(trimmed, 64)
	if err != nil {
		return 0, fmt.Errorf("%w: cannot convert %q to int", errPluginConfigReaderInvalidType, value)
	}

	return intFromFloat64(floating)
}

func intFromInt64(value int64) (int, error) {
	const (
		maxInt = int64(^uint(0) >> 1)
		minInt = -maxInt - 1
	)

	if value < minInt || value > maxInt {
		return 0, fmt.Errorf("%w: integer %d is out of range", errPluginConfigReaderInvalidType, value)
	}

	return int(value), nil
}

func intFromUint64(value uint64) (int, error) {
	const maxInt = uint64(^uint(0) >> 1)
	if value > maxInt {
		return 0, fmt.Errorf("%w: integer %d is out of range", errPluginConfigReaderInvalidType, value)
	}

	return int(value), nil
}

func intFromFloat64(value float64) (int, error) {
	if math.IsNaN(value) || math.IsInf(value, 0) || math.Trunc(value) != value {
		return 0, fmt.Errorf("%w: float %v cannot be converted to int", errPluginConfigReaderInvalidType, value)
	}

	return intFromInt64(int64(value))
}

func boolFromInt64(value int64) (bool, error) {
	switch value {
	case 0:
		return false, nil
	case 1:
		return true, nil
	default:
		return false, fmt.Errorf("%w: integer %d cannot be converted to bool", errPluginConfigReaderInvalidType, value)
	}
}

func boolFromUint64(value uint64) (bool, error) {
	switch value {
	case 0:
		return false, nil
	case 1:
		return true, nil
	default:
		return false, fmt.Errorf("%w: integer %d cannot be converted to bool", errPluginConfigReaderInvalidType, value)
	}
}

func boolFromFloat64(value float64) (bool, error) {
	if math.IsNaN(value) || math.IsInf(value, 0) || math.Trunc(value) != value {
		return false, fmt.Errorf("%w: float %v cannot be converted to bool", errPluginConfigReaderInvalidType, value)
	}

	return boolFromInt64(int64(value))
}

func reflectInt64(value any) int64 {
	switch typed := value.(type) {
	case int8:
		return int64(typed)
	case int16:
		return int64(typed)
	case int32:
		return int64(typed)
	case int64:
		return typed
	default:
		return int64(typed.(int))
	}
}

func reflectUint64(value any) uint64 {
	switch typed := value.(type) {
	case uint8:
		return uint64(typed)
	case uint16:
		return uint64(typed)
	case uint32:
		return uint64(typed)
	case uint64:
		return typed
	default:
		return uint64(typed.(uint))
	}
}
