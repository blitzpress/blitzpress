package pluginsdk

import "errors"

var (
	ErrManifestMismatch   = errors.New("plugin manifest does not match plugin.json")
	ErrIncompatibleSDK    = errors.New("plugin sdk_version is incompatible with host")
	ErrSymbolNotFound     = errors.New("exported Plugin symbol not found in .so")
	ErrInvalidManifest    = errors.New("plugin.json is missing or invalid")
	ErrRegistrationFailed = errors.New("plugin registration failed")
)
