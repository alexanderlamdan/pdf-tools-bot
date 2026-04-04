package service

import (
	"path/filepath"
	"sync"
	"time"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/logger"
	"pdf-worker/internal/service/ops"
)

type PdfService struct {
	log             *logger.Logger
	heavyTaskSem    chan struct{}
	compressMu      sync.Mutex
	compressActive  bool
	compressWaiters []chan struct{}
}

func NewPdfService(l *logger.Logger) *PdfService {
	return &PdfService{
		log:          l,
		heavyTaskSem: make(chan struct{}, 2),
	}
}

func (s *PdfService) executeHeavyTask(name string, inputPath string, task func() domain.Response) domain.Response {
	s.log.Info("Queueing heavy task: %s | File: %s", name, filepath.Base(inputPath))
	s.heavyTaskSem <- struct{}{}

	start := time.Now()
	s.log.Info("Started heavy task: %s | File: %s", name, filepath.Base(inputPath))
	defer func() {
		<-s.heavyTaskSem
		s.log.TrackTime(start, name, inputPath)
	}()

	return task()
}
func (s *PdfService) executeCompressExclusive(inputPath string, task func() domain.Response) domain.Response {

	s.log.Info("Compress: waiting for exclusive slot | File: %s", filepath.Base(inputPath))

	s.heavyTaskSem <- struct{}{}
	s.heavyTaskSem <- struct{}{}

	s.compressMu.Lock()
	s.compressActive = true
	s.compressMu.Unlock()

	start := time.Now()
	s.log.Info("Compress: exclusive mode ON | File: %s", filepath.Base(inputPath))

	defer func() {

		<-s.heavyTaskSem
		<-s.heavyTaskSem

		s.compressMu.Lock()
		s.compressActive = false

		for _, ch := range s.compressWaiters {

			close(ch)

		}

		s.compressWaiters = nil
		s.compressMu.Unlock()

		s.log.Info("Compress: exclusive mode OFF | took %s", time.Since(start))

	}()

	return task()

}

func (s *PdfService) IsCompressActive() bool {

	s.compressMu.Lock()
	defer s.compressMu.Unlock()
	return s.compressActive

}

func (s *PdfService) WaitForCompressFinish() <-chan struct{} {

	s.compressMu.Lock()
	defer s.compressMu.Unlock()

	ch := make(chan struct{})
	if !s.compressActive {

		close(ch)
		return ch

	}

	s.compressWaiters = append(s.compressWaiters, ch)
	return ch

}

// ── Public API ────────────────────────────────────────────────────────────────

func (s *PdfService) GetInfo(req domain.Request) domain.Response {
	return ops.GetInfo(req, s.log)
}

func (s *PdfService) Compress(req domain.Request) domain.Response {
	return s.executeCompressExclusive(req.InputPath, func() domain.Response {
		return ops.Compress(req, s.log)
	})
}

func (s *PdfService) Encrypt(req domain.Request) domain.Response {
	return ops.Encrypt(req, s.log)
}

func (s *PdfService) Decrypt(req domain.Request) domain.Response {
	return ops.Decrypt(req, s.log)
}

func (s *PdfService) Crack(req domain.Request) domain.Response {
	return s.executeHeavyTask("Crack", req.InputPath, func() domain.Response {
		return ops.Crack(req, s.log)
	})
}

func (s *PdfService) Repair(req domain.Request) domain.Response {
	return s.executeHeavyTask("Repair", req.InputPath, func() domain.Response {
		return ops.Repair(req, s.log)
	})
}

func (s *PdfService) Split(req domain.Request) domain.Response {
	return s.executeHeavyTask("Split", req.InputPath, func() domain.Response {
		return ops.Split(req, s.log)
	})
}

func (s *PdfService) Merge(req domain.Request) domain.Response {
	return s.executeHeavyTask("Merge", req.InputPaths[0], func() domain.Response {
		return ops.Merge(req, s.log)
	})
}

func (s *PdfService) ReadMetadata(req domain.Request) domain.Response {

	return ops.ReadMetadata(req, s.log)

}

func (s *PdfService) WipeMetadata(req domain.Request) domain.Response {

	return s.executeHeavyTask("WipeMetadata", req.InputPath, func() domain.Response {

		return ops.WipeMetadata(req, s.log)

	})

}
