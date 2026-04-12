package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/spf13/cobra"
)

const (
	managerPIDEnv              = "BLITZPRESS_MANAGER_PID"
	defaultWatchInterval       = 500 * time.Millisecond
	defaultWatchDebounce       = 1500 * time.Millisecond
	defaultStopTimeout         = 5 * time.Second
	defaultRestartDelay        = time.Second
	defaultMaxRestartDelay     = 10 * time.Second
	defaultStableRestartWindow = 30 * time.Second
)

type serveConfig struct {
	RepoRoot            string
	CorePath            string
	PluginsDir          string
	WatchPlugins        bool
	WatchInterval       time.Duration
	WatchDebounce       time.Duration
	StopTimeout         time.Duration
	RestartDelay        time.Duration
	MaxRestartDelay     time.Duration
	StableRestartWindow time.Duration
}

type managedCoreProcess struct {
	cmd       *exec.Cmd
	waitCh    chan error
	startedAt time.Time
}

type pluginArtifactStamp struct {
	Path    string
	Size    int64
	ModTime time.Time
}

func newServeCommand(cwd string, stdout, stderr io.Writer) *cobra.Command {
	var (
		corePathFlag     string
		pluginsDirFlag   string
		watchPlugins     bool
		watchInterval    time.Duration
		watchDebounce    time.Duration
		stopTimeout      time.Duration
		restartDelay     time.Duration
		maxRestartDelay  time.Duration
		stableCrashReset time.Duration
	)

	cmd := &cobra.Command{
		Use:   "serve",
		Short: "Run the core binary under manager supervision",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			repoRoot, err := findRepoRoot(cwd)
			if err != nil {
				return err
			}

			corePath, err := resolveServeFilePath(cwd, repoRoot, corePathFlag, cmd.Flags().Changed("core"), filepath.Join(repoRoot, "build", "blitzpress"))
			if err != nil {
				return err
			}

			pluginsDir, err := resolveServeDirPath(cwd, repoRoot, pluginsDirFlag, cmd.Flags().Changed("plugins-dir"), filepath.Join(repoRoot, "build", "plugins"))
			if err != nil {
				return err
			}

			return runServe(serveConfig{
				RepoRoot:            repoRoot,
				CorePath:            corePath,
				PluginsDir:          pluginsDir,
				WatchPlugins:        watchPlugins,
				WatchInterval:       watchInterval,
				WatchDebounce:       watchDebounce,
				StopTimeout:         stopTimeout,
				RestartDelay:        restartDelay,
				MaxRestartDelay:     maxRestartDelay,
				StableRestartWindow: stableCrashReset,
			}, stdout, stderr)
		},
	}

	cmd.Flags().StringVar(&corePathFlag, "core", "./build/blitzpress", "Path to the BlitzPress core binary")
	cmd.Flags().StringVar(&pluginsDirFlag, "plugins-dir", "./build/plugins", "Directory containing built plugin artifacts")
	cmd.Flags().BoolVar(&watchPlugins, "watch-plugins", true, "Restart the core when built plugin shared objects change")
	cmd.Flags().DurationVar(&watchInterval, "watch-interval", defaultWatchInterval, "Polling interval for built plugin artifacts")
	cmd.Flags().DurationVar(&watchDebounce, "watch-debounce", defaultWatchDebounce, "How long plugin artifact changes must stay stable before restart")
	cmd.Flags().DurationVar(&stopTimeout, "stop-timeout", defaultStopTimeout, "How long to wait for graceful core shutdown before force kill")
	cmd.Flags().DurationVar(&restartDelay, "restart-delay", defaultRestartDelay, "Initial delay before restarting after an unexpected core exit")
	cmd.Flags().DurationVar(&maxRestartDelay, "max-restart-delay", defaultMaxRestartDelay, "Maximum delay between crash restarts")
	cmd.Flags().DurationVar(&stableCrashReset, "stable-window", defaultStableRestartWindow, "Reset crash backoff after the core stays up for this long")

	return cmd
}

func runServe(cfg serveConfig, stdout, stderr io.Writer) error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	restartSignals := make(chan os.Signal, 1)
	signal.Notify(restartSignals, syscall.SIGUSR1)
	defer signal.Stop(restartSignals)

	return runServeLoop(ctx, restartSignals, cfg, stdout, stderr)
}

func runServeLoop(ctx context.Context, restartSignals <-chan os.Signal, cfg serveConfig, stdout, stderr io.Writer) error {
	cfg = normalizeServeConfig(cfg)

	if err := ensureExecutable(cfg.CorePath); err != nil {
		return fmt.Errorf("core binary is not executable: %w", err)
	}

	signalCh := restartSignals
	restartDelay := cfg.RestartDelay

	for {
		stableSnapshot, err := scanPluginArtifacts(cfg.PluginsDir)
		if err != nil {
			return err
		}

		child, err := startManagedCore(cfg, stdout, stderr)
		if err != nil {
			return fmt.Errorf("start core %s: %w", cfg.CorePath, err)
		}
		logManager(stderr, "started core: %s", cfg.CorePath)

		var (
			pendingRestart  bool
			pendingSnapshot map[string]pluginArtifactStamp
			pendingDeadline time.Time
			watchTicker     *time.Ticker
		)

		if cfg.WatchPlugins {
			watchTicker = time.NewTicker(cfg.WatchInterval)
		}

	sessionLoop:
		for {
			var watchC <-chan time.Time
			if watchTicker != nil {
				watchC = watchTicker.C
			}

			select {
			case <-ctx.Done():
				if watchTicker != nil {
					watchTicker.Stop()
				}

				logManager(stderr, "stopping managed core")
				if err := stopManagedCore(child, cfg.StopTimeout); err != nil {
					return err
				}

				return nil
			case sig, ok := <-signalCh:
				if !ok {
					signalCh = nil
					continue
				}

				if watchTicker != nil {
					watchTicker.Stop()
				}

				logManager(stderr, "received %s from managed core; restarting", sig.String())
				if err := stopManagedCore(child, cfg.StopTimeout); err != nil {
					return err
				}

				restartDelay = cfg.RestartDelay
				break sessionLoop
			case <-watchC:
				nextSnapshot, err := scanPluginArtifacts(cfg.PluginsDir)
				if err != nil {
					logManager(stderr, "plugin watch scan failed: %v", err)
					continue
				}

				if pendingRestart {
					if pluginSnapshotsEqual(pendingSnapshot, nextSnapshot) {
						if time.Now().After(pendingDeadline) {
							if watchTicker != nil {
								watchTicker.Stop()
							}

							logManager(stderr, "plugin artifact update settled; restarting core")
							if err := stopManagedCore(child, cfg.StopTimeout); err != nil {
								return err
							}

							restartDelay = cfg.RestartDelay
							break sessionLoop
						}

						continue
					}

					pendingSnapshot = clonePluginSnapshot(nextSnapshot)
					pendingDeadline = time.Now().Add(cfg.WatchDebounce)
					continue
				}

				if hasRelevantPluginUpdate(stableSnapshot, nextSnapshot) {
					pendingRestart = true
					pendingSnapshot = clonePluginSnapshot(nextSnapshot)
					pendingDeadline = time.Now().Add(cfg.WatchDebounce)
					logManager(stderr, "detected plugin artifact change; waiting %s before restart", cfg.WatchDebounce)
				}
			case err := <-child.waitCh:
				if watchTicker != nil {
					watchTicker.Stop()
				}

				logManager(stderr, "core exited unexpectedly (%s); restarting in %s", formatProcessExit(err), restartDelay)
				if err := sleepContext(ctx, restartDelay); err != nil {
					if errors.Is(err, context.Canceled) {
						return nil
					}

					return err
				}

				if time.Since(child.startedAt) >= cfg.StableRestartWindow {
					restartDelay = cfg.RestartDelay
				} else {
					restartDelay *= 2
					if restartDelay > cfg.MaxRestartDelay {
						restartDelay = cfg.MaxRestartDelay
					}
				}

				break sessionLoop
			}
		}
	}
}

func normalizeServeConfig(cfg serveConfig) serveConfig {
	if cfg.WatchInterval <= 0 {
		cfg.WatchInterval = defaultWatchInterval
	}
	if cfg.WatchDebounce <= 0 {
		cfg.WatchDebounce = defaultWatchDebounce
	}
	if cfg.StopTimeout <= 0 {
		cfg.StopTimeout = defaultStopTimeout
	}
	if cfg.RestartDelay <= 0 {
		cfg.RestartDelay = defaultRestartDelay
	}
	if cfg.MaxRestartDelay < cfg.RestartDelay {
		cfg.MaxRestartDelay = cfg.RestartDelay
	}
	if cfg.StableRestartWindow <= 0 {
		cfg.StableRestartWindow = defaultStableRestartWindow
	}
	if strings.TrimSpace(cfg.RepoRoot) == "" {
		cfg.RepoRoot = filepath.Dir(cfg.CorePath)
	}
	if strings.TrimSpace(cfg.PluginsDir) == "" {
		cfg.PluginsDir = filepath.Join(cfg.RepoRoot, "build", "plugins")
	}

	return cfg
}

func resolveServeFilePath(cwd, repoRoot, input string, changed bool, fallback string) (string, error) {
	if !changed {
		return filepath.Clean(fallback), nil
	}

	resolved, err := resolveCLIPath(cwd, input)
	if err != nil {
		return "", err
	}

	return resolved, nil
}

func resolveServeDirPath(cwd, repoRoot, input string, changed bool, fallback string) (string, error) {
	if !changed {
		return filepath.Clean(fallback), nil
	}

	resolved, err := resolveCLIPath(cwd, input)
	if err != nil {
		return "", err
	}

	return resolved, nil
}

func resolveCLIPath(cwd, input string) (string, error) {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return "", errors.New("path must not be empty")
	}

	if filepath.IsAbs(trimmed) {
		return filepath.Clean(trimmed), nil
	}

	resolved, err := filepath.Abs(filepath.Join(cwd, trimmed))
	if err != nil {
		return "", fmt.Errorf("resolve path %s: %w", input, err)
	}

	return resolved, nil
}

func startManagedCore(cfg serveConfig, stdout, stderr io.Writer) (*managedCoreProcess, error) {
	cmd := exec.Command(cfg.CorePath)
	cmd.Dir = cfg.RepoRoot
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	cmd.Env = replaceEnvVar(os.Environ(), managerPIDEnv, strconv.Itoa(os.Getpid()))
	cmd.Env = replaceEnvVar(cmd.Env, "BLITZPRESS_PLUGINS_DIR", cfg.PluginsDir)

	if err := cmd.Start(); err != nil {
		return nil, err
	}

	process := &managedCoreProcess{
		cmd:       cmd,
		waitCh:    make(chan error, 1),
		startedAt: time.Now(),
	}

	go func() {
		process.waitCh <- cmd.Wait()
	}()

	return process, nil
}

func stopManagedCore(child *managedCoreProcess, timeout time.Duration) error {
	if child == nil || child.cmd == nil || child.cmd.Process == nil {
		return nil
	}

	if err := child.cmd.Process.Signal(syscall.SIGTERM); err != nil && !errors.Is(err, os.ErrProcessDone) {
		if err := child.cmd.Process.Kill(); err != nil && !errors.Is(err, os.ErrProcessDone) {
			return fmt.Errorf("stop core process: %w", err)
		}
	}

	timer := time.NewTimer(timeout)
	defer timer.Stop()

	select {
	case <-child.waitCh:
		return nil
	case <-timer.C:
		if err := child.cmd.Process.Kill(); err != nil && !errors.Is(err, os.ErrProcessDone) {
			return fmt.Errorf("kill core process: %w", err)
		}

		<-child.waitCh
		return nil
	}
}

func scanPluginArtifacts(pluginsDir string) (map[string]pluginArtifactStamp, error) {
	snapshot := make(map[string]pluginArtifactStamp)

	entries, err := os.ReadDir(pluginsDir)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return snapshot, nil
		}

		return nil, fmt.Errorf("read plugins directory %s: %w", pluginsDir, err)
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		artifactPath := filepath.Join(pluginsDir, entry.Name(), "plugin.so")
		info, err := os.Stat(artifactPath)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				continue
			}

			return nil, fmt.Errorf("inspect plugin artifact %s: %w", artifactPath, err)
		}

		if info.IsDir() {
			continue
		}

		snapshot[entry.Name()] = pluginArtifactStamp{
			Path:    artifactPath,
			Size:    info.Size(),
			ModTime: info.ModTime().UTC(),
		}
	}

	return snapshot, nil
}

func hasRelevantPluginUpdate(previous, current map[string]pluginArtifactStamp) bool {
	for pluginID, currentStamp := range current {
		previousStamp, ok := previous[pluginID]
		if !ok {
			return true
		}

		if previousStamp.Path != currentStamp.Path || previousStamp.Size != currentStamp.Size || !previousStamp.ModTime.Equal(currentStamp.ModTime) {
			return true
		}
	}

	return false
}

func pluginSnapshotsEqual(left, right map[string]pluginArtifactStamp) bool {
	if len(left) != len(right) {
		return false
	}

	for pluginID, leftStamp := range left {
		rightStamp, ok := right[pluginID]
		if !ok {
			return false
		}

		if leftStamp.Path != rightStamp.Path || leftStamp.Size != rightStamp.Size || !leftStamp.ModTime.Equal(rightStamp.ModTime) {
			return false
		}
	}

	return true
}

func clonePluginSnapshot(snapshot map[string]pluginArtifactStamp) map[string]pluginArtifactStamp {
	cloned := make(map[string]pluginArtifactStamp, len(snapshot))
	for pluginID, stamp := range snapshot {
		cloned[pluginID] = stamp
	}

	return cloned
}

func replaceEnvVar(env []string, key, value string) []string {
	prefix := key + "="
	filtered := make([]string, 0, len(env)+1)
	for _, entry := range env {
		if strings.HasPrefix(entry, prefix) {
			continue
		}

		filtered = append(filtered, entry)
	}

	return append(filtered, prefix+value)
}

func sleepContext(ctx context.Context, delay time.Duration) error {
	timer := time.NewTimer(delay)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}

func formatProcessExit(err error) string {
	if err == nil {
		return "clean exit"
	}

	return err.Error()
}

func logManager(w io.Writer, format string, args ...any) {
	if w == nil {
		return
	}

	fmt.Fprintf(w, "manager: "+format+"\n", args...)
}
