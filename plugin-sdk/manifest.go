package pluginsdk

import (
	"errors"
	"regexp"
)

var (
	pluginIDPattern = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)
	versionPattern  = regexp.MustCompile(`^\d+\.\d+\.\d+$`)
	errMissingID    = errors.New("manifest id is required")
	errInvalidID    = errors.New("manifest id must be kebab-case")
	errMissingName  = errors.New("manifest name is required")
	errMissingVer   = errors.New("manifest version is required")
	errInvalidVer   = errors.New("manifest version must be semver")
)

func (m Manifest) Validate() error {
	switch {
	case m.ID == "":
		return errMissingID
	case !pluginIDPattern.MatchString(m.ID):
		return errInvalidID
	case m.Name == "":
		return errMissingName
	case m.Version == "":
		return errMissingVer
	case !versionPattern.MatchString(m.Version):
		return errInvalidVer
	default:
		return nil
	}
}
