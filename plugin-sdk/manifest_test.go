package pluginsdk

import "testing"

func TestManifestValidate(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		manifest Manifest
		wantErr  bool
	}{
		{
			name:     "valid manifest",
			manifest: Manifest{ID: "example-plugin", Name: "Example Plugin", Version: "1.2.3"},
		},
		{
			name:     "missing id",
			manifest: Manifest{Name: "Example Plugin", Version: "1.2.3"},
			wantErr:  true,
		},
		{
			name:     "invalid id",
			manifest: Manifest{ID: "ExamplePlugin", Name: "Example Plugin", Version: "1.2.3"},
			wantErr:  true,
		},
		{
			name:     "missing name",
			manifest: Manifest{ID: "example-plugin", Version: "1.2.3"},
			wantErr:  true,
		},
		{
			name:     "invalid version",
			manifest: Manifest{ID: "example-plugin", Name: "Example Plugin", Version: "1.2"},
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			err := tt.manifest.Validate()
			if tt.wantErr && err == nil {
				t.Fatal("expected validation error")
			}
			if !tt.wantErr && err != nil {
				t.Fatalf("expected no error, got %v", err)
			}
		})
	}
}
