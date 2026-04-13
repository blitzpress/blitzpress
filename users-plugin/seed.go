package main

import (
	"os"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var defaultRoles = []struct {
	Slug         string
	Label        string
	Capabilities []string
}{
	{
		Slug:  "administrator",
		Label: "Administrator",
		Capabilities: []string{
			"settings.manage", "users.manage",
			"plugins.download", "plugins.activate", "plugins.upload", "plugins.deactivate", "plugins.settings",
			"posts.edit", "posts.edit-others", "posts.publish", "posts.delete",
			"pages.edit", "pages.edit-others", "pages.publish", "pages.delete",
			"site.read", "media.upload", "categories.manage",
			"comments.moderate", "comments.edit", "comments.delete",
			"themes.switch", "themes.edit-options",
		},
	},
	{
		Slug:  "editor",
		Label: "Editor",
		Capabilities: []string{
			"posts.edit", "posts.edit-others", "posts.publish", "posts.delete",
			"pages.edit", "pages.edit-others", "pages.publish", "pages.delete",
			"site.read", "media.upload", "categories.manage",
			"comments.moderate", "comments.edit", "comments.delete",
		},
	},
	{
		Slug:  "author",
		Label: "Author",
		Capabilities: []string{
			"posts.edit", "posts.publish", "posts.delete",
			"site.read", "media.upload",
		},
	},
	{
		Slug:  "contributor",
		Label: "Contributor",
		Capabilities: []string{
			"posts.edit", "posts.delete", "site.read",
		},
	},
	{
		Slug:  "subscriber",
		Label: "Subscriber",
		Capabilities: []string{
			"site.read",
		},
	},
}

func seedRolesAndCapabilities(db *gorm.DB) error {
	allCaps := map[string]bool{}
	for _, role := range defaultRoles {
		for _, cap := range role.Capabilities {
			allCaps[cap] = true
		}
	}

	for cap := range allCaps {
		result := db.Where("slug = ?", cap).FirstOrCreate(&UsersPluginCapability{
			Slug: cap,
		})
		if result.Error != nil {
			return result.Error
		}
	}

	for _, role := range defaultRoles {
		result := db.Where("slug = ?", role.Slug).FirstOrCreate(&UsersPluginRole{
			Slug:  role.Slug,
			Label: role.Label,
		})
		if result.Error != nil {
			return result.Error
		}

		for _, cap := range role.Capabilities {
			result := db.Where("role_slug = ? AND capability_slug = ?", role.Slug, cap).
				FirstOrCreate(&UsersPluginRoleCapability{
					RoleSlug:       role.Slug,
					CapabilitySlug: cap,
				})
			if result.Error != nil {
				return result.Error
			}
		}
	}

	return nil
}

func seedDefaultAdmin(db *gorm.DB) error {
	var count int64
	if err := db.Model(&UsersPluginUser{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	email := os.Getenv("BLITZPRESS_ADMIN_EMAIL")
	if email == "" {
		email = "admin@blitzpress.local"
	}
	password := os.Getenv("BLITZPRESS_ADMIN_PASSWORD")
	if password == "" {
		password = "admin"
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := UsersPluginUser{
		Email:        email,
		PasswordHash: string(hash),
		DisplayName:  "Administrator",
		IsActive:     true,
	}
	if err := db.Create(&user).Error; err != nil {
		return err
	}

	return db.Create(&UsersPluginUserRole{
		UserID:   user.ID,
		RoleSlug: "administrator",
	}).Error
}
