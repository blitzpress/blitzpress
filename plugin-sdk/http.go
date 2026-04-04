package pluginsdk

import (
	"io/fs"

	"github.com/gofiber/fiber/v2"
)

type HTTPRegistry interface {
	API(fn func(router fiber.Router)) error
	Static(filesystem fs.FS, stripPrefix string) error
}
