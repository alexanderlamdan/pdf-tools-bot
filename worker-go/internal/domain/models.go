package domain

type Request struct {
	Action    string `json:"action"`
	InputPath string `json:"inputPath"`
	Lang      string `json:"lang"`
	Password  string `json:"password,omitempty"`
}

type Response struct {
	Status string `json:"status"`
	Info   string `json:"info,omitempty"`
	Error  string `json:"error,omitempty"`
	Path   string `json:"path,omitempty"`
}
