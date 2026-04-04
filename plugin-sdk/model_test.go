package pluginsdk

import (
	"encoding/json"
	"testing"

	"github.com/dromara/carbon/v2"
	"github.com/google/uuid"
)

func TestBaseModelBeforeCreateGeneratesUUIDv7(t *testing.T) {
	t.Parallel()

	var model BaseModel
	if err := model.BeforeCreate(nil); err != nil {
		t.Fatalf("BeforeCreate() error = %v", err)
	}
	if model.ID == uuid.Nil {
		t.Fatal("expected generated uuid")
	}
	if got := model.ID.Version(); got != 7 {
		t.Fatalf("expected uuid version 7, got %d", got)
	}
}

func TestBaseModelBeforeCreatePreservesExistingUUID(t *testing.T) {
	t.Parallel()

	id := uuid.Must(uuid.NewV7())
	model := BaseModel{ID: id}
	if err := model.BeforeCreate(nil); err != nil {
		t.Fatalf("BeforeCreate() error = %v", err)
	}
	if model.ID != id {
		t.Fatalf("expected existing uuid %s to be preserved, got %s", id, model.ID)
	}
}

func TestCarbonDateTimeJSONRoundTrip(t *testing.T) {
	t.Parallel()

	type payload struct {
		CreatedAt carbon.DateTime `json:"created_at"`
	}

	original := payload{CreatedAt: *carbon.NewDateTime(carbon.CreateFromDateTime(2026, 4, 4, 12, 30, 45))}
	raw, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}

	var decoded payload
	if err := json.Unmarshal(raw, &decoded); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}

	if decoded.CreatedAt.String() != original.CreatedAt.String() {
		t.Fatalf("expected %s, got %s", original.CreatedAt, decoded.CreatedAt)
	}
}
