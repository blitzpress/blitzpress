package pluginsdk

import (
	"github.com/dromara/carbon/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BaseModel struct {
	ID        uuid.UUID       `gorm:"type:char(36);primaryKey" json:"id"`
	CreatedAt carbon.DateTime `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt carbon.DateTime `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt gorm.DeletedAt  `gorm:"index" json:"deleted_at,omitempty"`
}

func (b *BaseModel) BeforeCreate(_ *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.Must(uuid.NewV7())
	}
	return nil
}
