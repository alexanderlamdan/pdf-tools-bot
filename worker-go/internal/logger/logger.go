package logger

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"
)

type Logger struct {
	infoLog  *log.Logger
	errorLog *log.Logger
	debugLog *log.Logger
}

func NewLogger() *Logger {

	logDir := "logs"
	if err := os.MkdirAll(logDir, 0755); err != nil {

		fmt.Printf("Failed to create log directory: %v\n", err)

	}

	logFile := filepath.Join(logDir, "worker.log")
	file, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {

		fmt.Printf("Failed to open log file: %v\n", err)

	}

	multiWriter := io.MultiWriter(os.Stdout, file)
	return &Logger{

		infoLog:  log.New(multiWriter, "[INFO] ", log.Ldate|log.Ltime),
		errorLog: log.New(multiWriter, "[ERROR] ", log.Ldate|log.Ltime|log.Lshortfile),
		debugLog: log.New(multiWriter, "[DEBUG] ", log.Ldate|log.Ltime),
	}

}

func (l *Logger) Info(format string, v ...interface{}) {

	l.infoLog.Printf(format, v...)

}

func (l *Logger) Error(format string, v ...interface{}) {

	l.errorLog.Printf(format, v...)

}

func (l *Logger) Debug(format string, v ...interface{}) {

	l.debugLog.Printf(format, v...)

}

func (l *Logger) TrackTime(start time.Time, action string, filename string) {

	elapsed := time.Since(start)
	l.Info("Action '%s' for file '%s' took '%s'", action, filepath.Base(filename), elapsed)

}
