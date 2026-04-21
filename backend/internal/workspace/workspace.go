package workspace

import "errors"

var ErrNotFound = errors.New("workspace not found")

type Workspace struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	BotToken         string `json:"-"`
	DailyQuota       int    `json:"daily_quota"`
	KudoEmoji        string `json:"kudo_emoji"`
	CurrencySingular string `json:"currencySingular"`
	CurrencyPlural   string `json:"currencyPlural"`
	InstalledAt      string `json:"installed_at"`
}

type Service interface {
	GetByID(id string) (*Workspace, error)
	Upsert(ws *Workspace) error
}
