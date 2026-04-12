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
			"manage_options", "manage_users", "manage_plugins",
			"edit_posts", "edit_others_posts", "publish_posts", "delete_posts",
			"edit_pages", "edit_others_pages", "publish_pages", "delete_pages",
			"read", "upload_files", "manage_categories",
			"moderate_comments", "edit_comments", "delete_comments",
			"switch_themes", "edit_theme_options",
		},
	},
	{
		Slug:  "editor",
		Label: "Editor",
		Capabilities: []string{
			"edit_posts", "edit_others_posts", "publish_posts", "delete_posts",
			"edit_pages", "edit_others_pages", "publish_pages", "delete_pages",
			"read", "upload_files", "manage_categories",
			"moderate_comments", "edit_comments", "delete_comments",
		},
	},
	{
		Slug:  "author",
		Label: "Author",
		Capabilities: []string{
			"edit_posts", "publish_posts", "delete_posts",
			"read", "upload_files",
		},
	},
	{
		Slug:  "contributor",
		Label: "Contributor",
		Capabilities: []string{
			"edit_posts", "delete_posts", "read",
		},
	},
	{
		Slug:  "subscriber",
		Label: "Subscriber",
		Capabilities: []string{
			"read",
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
