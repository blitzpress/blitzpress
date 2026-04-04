package pluginsdk

type Logger interface {
	Debug(msg string, args ...any)
	Info(msg string, args ...any)
	Warn(msg string, args ...any)
	Error(msg string, args ...any)
}

type MenuItem struct {
	ID    string
	Label string
	Icon  string
	Path  string
}
