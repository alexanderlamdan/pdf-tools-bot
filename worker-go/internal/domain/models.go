package domain

type Request struct {
	Action       string   `json:"action"`
	InputPath    string   `json:"inputPath"`
	InputPaths   []string `json:"inputPaths,omitempty"`
	Pages        string   `json:"pages,omitempty"`
	OriginalName string   `json:"originalName,omitempty"`
	Lang         string   `json:"lang"`
	Password     string   `json:"password,omitempty"`
}

type Response struct {
	Status     string      `json:"status"`
	Info       interface{} `json:"info,omitempty"`
	Error      string      `json:"error,omitempty"`
	Path       string      `json:"path,omitempty"`
	ZipPath    string      `json:"zipPath,omitempty"`
	Paths      []string    `json:"paths,omitempty"`
	IsFallback bool        `json:isFallback,omitempty`
}
