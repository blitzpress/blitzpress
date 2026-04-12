package main

import (
	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/google/uuid"
)

type UsersPluginUser struct {
	pluginsdk.BaseModel
	Email        string `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string `gorm:"not null" json:"-"`
	DisplayName  string `gorm:"not null" json:"display_name"`
	IsActive     bool   `gorm:"default:true" json:"is_active"`
}

func (UsersPluginUser) TableName() string {
	return "users_plugin_users"
}

type UsersPluginRole struct {
	pluginsdk.BaseModel
	Slug  string `gorm:"uniqueIndex;not null" json:"slug"`
	Label string `gorm:"not null" json:"label"`
}

func (UsersPluginRole) TableName() string {
	return "users_plugin_roles"
}

type UsersPluginCapability struct {
	pluginsdk.BaseModel
	Slug        string `gorm:"uniqueIndex;not null" json:"slug"`
	Description string `json:"description,omitempty"`
}

func (UsersPluginCapability) TableName() string {
	return "users_plugin_capabilities"
}

type UsersPluginRoleCapability struct {
	pluginsdk.BaseModel
	RoleSlug       string `gorm:"uniqueIndex:idx_role_cap;not null" json:"role_slug"`
	CapabilitySlug string `gorm:"uniqueIndex:idx_role_cap;not null" json:"capability_slug"`
}

func (UsersPluginRoleCapability) TableName() string {
	return "users_plugin_role_capabilities"
}

type UsersPluginUserRole struct {
	pluginsdk.BaseModel
	UserID   uuid.UUID `gorm:"uniqueIndex:idx_user_role;not null" json:"user_id"`
	RoleSlug string    `gorm:"uniqueIndex:idx_user_role;not null" json:"role_slug"`
}

func (UsersPluginUserRole) TableName() string {
	return "users_plugin_user_roles"
}
