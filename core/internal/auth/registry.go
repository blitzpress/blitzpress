package auth

import (
	"fmt"
	"sync"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

const (
	HookDriverRegistered  = "auth.driver.registered"
	HookUserAuthenticated = "auth.user.authenticated"
	HookCheckCapability   = "auth.check.capability"
)

type HookEngine interface {
	DoAction(ctx *pluginsdk.HookContext, name string, args ...any) error
	ApplyFilters(ctx *pluginsdk.HookContext, name string, value any, args ...any) (any, error)
}

type Registry struct {
	mu     sync.RWMutex
	driver pluginsdk.AuthDriver
	hooks  HookEngine
}

func NewRegistry() *Registry {
	return &Registry{}
}

func (r *Registry) SetHooks(hooks HookEngine) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.hooks = hooks
}

func (r *Registry) RegisterDriver(driver pluginsdk.AuthDriver) {
	r.mu.Lock()
	r.driver = driver
	hooks := r.hooks
	r.mu.Unlock()

	if hooks != nil {
		_ = hooks.DoAction(&pluginsdk.HookContext{}, HookDriverRegistered, driver)
	}
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

func (r *Registry) NotifyUserAuthenticated(user *pluginsdk.AuthUser) error {
	r.mu.RLock()
	hooks := r.hooks
	r.mu.RUnlock()

	if hooks == nil {
		return nil
	}

	return hooks.DoAction(&pluginsdk.HookContext{}, HookUserAuthenticated, user)
}

func (r *Registry) CheckCapability(user *pluginsdk.AuthUser, capability string) (bool, error) {
	driver := r.Driver()
	if driver == nil {
		return true, nil
	}

	allowed := driver.HasCapability(user, capability)

	r.mu.RLock()
	hooks := r.hooks
	r.mu.RUnlock()
	if hooks == nil {
		return allowed, nil
	}

	filtered, err := hooks.ApplyFilters(&pluginsdk.HookContext{}, HookCheckCapability, allowed, user, capability)
	if err != nil {
		return false, err
	}

	result, ok := filtered.(bool)
	if !ok {
		return false, fmt.Errorf("%s filter must return bool, got %T", HookCheckCapability, filtered)
	}

	return result, nil
}
