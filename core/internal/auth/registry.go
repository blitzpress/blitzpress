package auth

import (
	"sync"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

type Registry struct {
	mu     sync.RWMutex
	driver pluginsdk.AuthDriver
}

func NewRegistry() *Registry {
	return &Registry{}
}

func (r *Registry) RegisterDriver(driver pluginsdk.AuthDriver) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.driver = driver
}

func (r *Registry) Driver() pluginsdk.AuthDriver {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.driver
}

func (r *Registry) HasDriver() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.driver != nil
}
