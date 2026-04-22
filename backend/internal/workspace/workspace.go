package workspace

import "errors"

var ErrNotFound = errors.New("workspace not found")

type AdminUser struct {
	ID   string `json:"id"   bson:"id"`
	Name string `json:"name" bson:"name"`
}

type Workspace struct {
	ID               string      `json:"id"`
	Name             string      `json:"name"`
	BotToken         string      `json:"-"`
	DailyQuota       int         `json:"daily_quota"`
	KudoEmoji        string      `json:"kudo_emoji"`
	CurrencySingular string      `json:"currencySingular"`
	CurrencyPlural   string      `json:"currencyPlural"`
	ColorCoral       string      `json:"colorCoral"`
	ColorTeal        string      `json:"colorTeal"`
	AdminUsers       []AdminUser `json:"adminUsers"`
	InstalledAt      string      `json:"installed_at"`
}

type Service interface {
	GetByID(id string) (*Workspace, error)
	Upsert(ws *Workspace) error
}
