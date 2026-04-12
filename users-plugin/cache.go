package main

import (
	"sync"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"gorm.io/gorm"
)

type roleCapCache struct {
	mu    sync.RWMutex
	roles map[string]pluginsdk.RoleDefinition
	db    *gorm.DB
}

func newRoleCapCache(db *gorm.DB) *roleCapCache {
	return &roleCapCache{
		roles: make(map[string]pluginsdk.RoleDefinition),
		db:    db,
	}
}

func (c *roleCapCache) Load() error {
	var roles []UsersPluginRole
	if err := c.db.Find(&roles).Error; err != nil {
		return err
	}

	var roleCaps []UsersPluginRoleCapability
	if err := c.db.Find(&roleCaps).Error; err != nil {
		return err
	}

	capsByRole := make(map[string][]string)
	for _, rc := range roleCaps {
		capsByRole[rc.RoleSlug] = append(capsByRole[rc.RoleSlug], rc.CapabilitySlug)
	}

	newRoles := make(map[string]pluginsdk.RoleDefinition, len(roles))
	for _, role := range roles {
		newRoles[role.Slug] = pluginsdk.RoleDefinition{
			Slug:         role.Slug,
			Label:        role.Label,
			Capabilities: capsByRole[role.Slug],
		}
	}

	c.mu.Lock()
	c.roles = newRoles
	c.mu.Unlock()
	return nil
}

func (c *roleCapCache) GetRoles() []pluginsdk.RoleDefinition {
	c.mu.RLock()
	defer c.mu.RUnlock()

	result := make([]pluginsdk.RoleDefinition, 0, len(c.roles))
	for _, role := range c.roles {
		result = append(result, role)
	}
	return result
}

func (c *roleCapCache) HasCapability(roleSlugs []string, capability string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()

	for _, slug := range roleSlugs {
		role, ok := c.roles[slug]
		if !ok {
			continue
		}
		for _, cap := range role.Capabilities {
			if cap == capability {
				return true
			}
		}
	}
	return false
}
