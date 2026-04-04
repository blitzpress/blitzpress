package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"text/tabwriter"
)

const usageText = `Usage:
  blitzpress-manager list
  blitzpress-manager build <plugin-directory>`

type commandRunner func(dir, name string, args ...string) error

type pluginManifest struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Version string `json:"version"`
}

type pluginInfo struct {
	ID      string
	Name    string
	Version string
	Status  string
}

func main() {
	cwd, err := os.Getwd()
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: determine working directory: %v\n", err)
		os.Exit(1)
	}

	os.Exit(run(os.Args[1:], cwd, os.Stdout, os.Stderr, newExecCommandRunner(os.Stdout, os.Stderr)))
}

func run(args []string, cwd string, stdout, stderr io.Writer, runner commandRunner) int {
	if len(args) == 0 {
		fmt.Fprintln(stderr, usageText)
		return 1
	}

	switch args[0] {
	case "list":
		repoRoot, err := findRepoRoot(cwd)
		if err != nil {
			return printError(stderr, err)
		}

		if len(args) != 1 {
			return printError(stderr, errors.New("usage: blitzpress-manager list"))
		}

		if err := runList(repoRoot, stdout); err != nil {
			return printError(stderr, err)
		}

		return 0
	case "build":
		repoRoot, err := findRepoRoot(cwd)
		if err != nil {
			return printError(stderr, err)
		}

		if err := runBuild(cwd, repoRoot, args[1:], runner); err != nil {
			return printError(stderr, err)
		}

		return 0
	default:
		return printError(stderr, fmt.Errorf("unknown command %q\n\n%s", args[0], usageText))
	}
}

func printError(w io.Writer, err error) int {
	fmt.Fprintf(w, "error: %v\n", err)
	return 1
}

func newExecCommandRunner(stdout, stderr io.Writer) commandRunner {
	return func(dir, name string, args ...string) error {
		cmd := exec.Command(name, args...)
		cmd.Dir = dir
		cmd.Stdout = stdout
		cmd.Stderr = stderr
		return cmd.Run()
	}
}

func runList(repoRoot string, out io.Writer) error {
	plugins, err := discoverBuiltPlugins(filepath.Join(repoRoot, "build", "plugins"))
	if err != nil {
		return err
	}

	return printPluginTable(out, plugins)
}

func runBuild(cwd, repoRoot string, args []string, runner commandRunner) error {
	if len(args) != 1 {
		return errors.New("usage: blitzpress-manager build <plugin-directory>")
	}

	pluginDir, err := resolvePluginDir(cwd, repoRoot, args[0])
	if err != nil {
		return err
	}

	manifestPath := filepath.Join(pluginDir, "plugin.json")
	if _, err := readManifest(manifestPath); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("plugin manifest not found: %s", manifestPath)
		}

		return fmt.Errorf("invalid plugin manifest %s: %w", manifestPath, err)
	}

	scriptPath := filepath.Join(repoRoot, "scripts", "build-plugin.sh")
	if err := ensureExecutable(scriptPath); err != nil {
		return err
	}

	if err := runner(repoRoot, scriptPath, pluginDir); err != nil {
		return fmt.Errorf("build plugin %s: %w", pluginDir, err)
	}

	return nil
}

func findRepoRoot(start string) (string, error) {
	current, err := filepath.Abs(start)
	if err != nil {
		return "", fmt.Errorf("resolve repository root from %s: %w", start, err)
	}

	for {
		goWorkPath := filepath.Join(current, "go.work")
		buildScriptPath := filepath.Join(current, "scripts", "build-plugin.sh")

		if fileExists(goWorkPath) && fileExists(buildScriptPath) {
			return current, nil
		}

		parent := filepath.Dir(current)
		if parent == current {
			return "", fmt.Errorf("could not locate BlitzPress repository root from %s", start)
		}

		current = parent
	}
}

func discoverBuiltPlugins(pluginsDir string) ([]pluginInfo, error) {
	entries, err := os.ReadDir(pluginsDir)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}

		return nil, fmt.Errorf("read plugins directory %s: %w", pluginsDir, err)
	}

	plugins := make([]pluginInfo, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		pluginDir := filepath.Join(pluginsDir, entry.Name())
		manifestPath := filepath.Join(pluginDir, "plugin.json")
		manifest, err := readManifest(manifestPath)
		if err != nil {
			return nil, fmt.Errorf("read manifest for %s: %w", entry.Name(), err)
		}

		status := "missing-plugin.so"
		if fileExists(filepath.Join(pluginDir, "plugin.so")) {
			status = "ready"
		}

		plugins = append(plugins, pluginInfo{
			ID:      manifest.ID,
			Name:    manifest.Name,
			Version: manifest.Version,
			Status:  status,
		})
	}

	sort.Slice(plugins, func(i, j int) bool {
		return plugins[i].ID < plugins[j].ID
	})

	return plugins, nil
}

func printPluginTable(out io.Writer, plugins []pluginInfo) error {
	writer := tabwriter.NewWriter(out, 0, 0, 2, ' ', 0)
	if _, err := fmt.Fprintln(writer, "ID\tNAME\tVERSION\tSTATUS"); err != nil {
		return err
	}

	for _, plugin := range plugins {
		if _, err := fmt.Fprintf(writer, "%s\t%s\t%s\t%s\n", plugin.ID, plugin.Name, plugin.Version, plugin.Status); err != nil {
			return err
		}
	}

	return writer.Flush()
}

func resolvePluginDir(cwd, repoRoot, input string) (string, error) {
	if strings.TrimSpace(input) == "" {
		return "", errors.New("usage: blitzpress-manager build <plugin-directory>")
	}

	candidates := make([]string, 0, 2)
	if filepath.IsAbs(input) {
		candidates = append(candidates, input)
	} else {
		candidates = append(candidates, filepath.Join(cwd, input))
		repoCandidate := filepath.Join(repoRoot, input)
		if repoCandidate != candidates[0] {
			candidates = append(candidates, repoCandidate)
		}
	}

	for _, candidate := range candidates {
		info, err := os.Stat(candidate)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				continue
			}

			return "", fmt.Errorf("inspect plugin directory %s: %w", input, err)
		}

		if !info.IsDir() {
			return "", fmt.Errorf("plugin path is not a directory: %s", input)
		}

		resolved, err := filepath.Abs(candidate)
		if err != nil {
			return "", fmt.Errorf("resolve plugin directory %s: %w", candidate, err)
		}

		return resolved, nil
	}

	return "", fmt.Errorf("plugin directory not found: %s", input)
}

func readManifest(path string) (pluginManifest, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return pluginManifest{}, err
	}

	var manifest pluginManifest
	if err := json.Unmarshal(content, &manifest); err != nil {
		return pluginManifest{}, err
	}

	manifest.ID = strings.TrimSpace(manifest.ID)
	manifest.Name = strings.TrimSpace(manifest.Name)
	manifest.Version = strings.TrimSpace(manifest.Version)

	switch {
	case manifest.ID == "":
		return pluginManifest{}, errors.New("manifest id is required")
	case manifest.Name == "":
		return pluginManifest{}, errors.New("manifest name is required")
	case manifest.Version == "":
		return pluginManifest{}, errors.New("manifest version is required")
	default:
		return manifest, nil
	}
}

func ensureExecutable(path string) error {
	info, err := os.Stat(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("build script not found: %s", path)
		}

		return fmt.Errorf("inspect build script %s: %w", path, err)
	}

	if info.IsDir() {
		return fmt.Errorf("build script path is a directory: %s", path)
	}

	if info.Mode()&0o111 == 0 {
		return fmt.Errorf("build script is not executable: %s", path)
	}

	return nil
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}
