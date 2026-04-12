package database

import pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"

type Setting struct {
	pluginsdk.BaseModel
	Key   string `gorm:"uniqueIndex;not null"`
	Value string `gorm:"type:text"`
}

type PluginState struct {
	pluginsdk.BaseModel
	PluginID string `gorm:"uniqueIndex;not null"`
	Enabled  bool   `gorm:"default:true"`
	Version  string
}

type PluginSetting struct {
	pluginsdk.BaseModel
	PluginID string `gorm:"uniqueIndex:idx_plugin_settings_plugin_key;not null"`
	Key      string `gorm:"uniqueIndex:idx_plugin_settings_plugin_key;not null"`
	Value    string `gorm:"column:value_json;type:text"`
}
