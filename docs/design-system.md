# Kudo — Design System & Spécifications UI

> Document de référence pour l'implémentation React/Tailwind.  
> Niveau de détail : prêt à coder.

---

## Table des matières

1. [Vision globale & principes](#1-vision-globale--principes)
2. [Palette de couleurs](#2-palette-de-couleurs)
3. [Typographie](#3-typographie)
4. [Élévations & surfaces](#4-élévations--surfaces)
5. [Navigation globale](#5-navigation-globale)
6. [Bibliothèque de composants](#6-bibliothèque-de-composants)
7. [Écran 1 — Home](#7-écran-1--home)
8. [Écran 2 — Leaderboard](#8-écran-2--leaderboard)
9. [Écran 3 — Mes kudos](#9-écran-3--mes-kudos)
10. [Écran 4 — Admin Settings](#10-écran-4--admin-settings)
11. [UX Copy — lexique français](#11-ux-copy--lexique-français)
12. [Responsive & breakpoints](#12-responsive--breakpoints)

---

## 1. Vision globale & principes

### Identité

Kudo doit évoquer **l'énergie positive donnée aux autres** — pas un tableau de scores sportifs.
Le symbole ⚡ représente l'étincelle qu'on transmet à un collègue : une reconnaissance sincère
qui « recharge » l'équipe. L'interface doit amplifier ce sentiment sans jamais le gamifier
de façon agressive.

### Principes directeurs

| Principe | Traduction visuelle |
|---|---|
| **Warm & human** | Avatars ronds, texte à la première personne, messages réels mis en avant |
| **Signal > bruit** | Un seul accent couleur (l'ambre ⚡), beaucoup d'espace blanc |
| **Célébration, pas compétition** | Pas de classement rouge/vert, pas de « perdant » mis en évidence |
| **Accessible** | Contraste ≥ 4.5:1, taille de texte ≥ 14px partout, focus visible |
| **Cohérence** | 4 composants de base couvrent 80 % des surfaces |

### Références de ton

- **Spacing & propreté** : Linear, Notion
- **Chaleur & cartes** : HeyTaco (sans les tacos), Fellow.app
- **Hierarchy typographique** : Loom, Figma

---

## 2. Palette de couleurs

### Couleurs principales

| Rôle | Nom | Hex | Tailwind class |
|---|---|---|---|
| **Accent primaire** | Amber 500 | `#F59E0B` | `amber-500` |
| **Accent sombre** (hover, texte coloré) | Amber 600 | `#D97706` | `amber-600` |
| **Accent doux** (badge, tag) | Amber 100 | `#FEF3C7` | `amber-100` |
| **Accent très doux** (fond de carte spéciale) | Amber 50 | `#FFFBEB` | `amber-50` |
| **Fond global** | Stone 50 | `#FAFAF9` | `stone-50` |
| **Surface (carte, panel)** | White | `#FFFFFF` | `white` |
| **Bordure subtile** | Stone 200 | `#E7E5E4` | `stone-200` |
| **Texte principal** | Stone 900 | `#1C1917` | `stone-900` |
| **Texte secondaire** | Stone 500 | `#78716C` | `stone-500` |
| **Texte désactivé** | Stone 400 | `#A8A29E` | `stone-400` |
| **Succès** | Emerald 500 | `#10B981` | `emerald-500` |
| **Erreur** | Red 500 | `#EF4444` | `red-500` |

### Règle d'usage

```
Fond global  →  stone-50
Carte        →  white   +  shadow-sm  +  border border-stone-200
Accent ⚡    →  amber-500 (icône, badge, highlight)
Texte body   →  stone-900
Texte meta   →  stone-500
```

> Ne jamais utiliser l'ambre sur fond ambre. Ne jamais mettre deux couleurs d'accent
> sur le même écran (amber est le seul accent).

---

## 3. Typographie

### Police

**Inter** (Google Fonts) — `font-sans` avec la variable CSS `--font-inter`.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Échelle typographique

| Rôle | Taille | Graisse | Tailwind |
|---|---|---|---|
| Page title | 28px | Bold 700 | `text-2xl font-bold text-stone-900` |
| Section title | 20px | Semibold 600 | `text-xl font-semibold text-stone-900` |
| Card title / label | 14px | Semibold 600 | `text-sm font-semibold text-stone-700` |
| Big number (stat) | 36px | Bold 700 | `text-4xl font-bold text-stone-900` |
| Body | 15px | Regular 400 | `text-[15px] text-stone-700` |
| Caption / méta | 13px | Regular 400 | `text-xs text-stone-500` |
| Badge / tag | 12px | Medium 500 | `text-xs font-medium` |

---

## 4. Élévations & surfaces

```
Niveau 0  →  bg-stone-50          (fond de page)
Niveau 1  →  bg-white shadow-sm border border-stone-200 rounded-xl    (carte standard)
Niveau 2  →  bg-white shadow-md border border-stone-200 rounded-xl    (modal, dropdown)
Niveau 3  →  bg-white shadow-xl rounded-2xl                           (panel flottant)
```

**Rayon de bordure standard :** `rounded-xl` (12px)  
**Rayon grand :** `rounded-2xl` (16px) pour les modals  
**Rayon badge :** `rounded-full`

---

## 5. Navigation globale

### Layout desktop (≥ 1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar 240px  │  Contenu principal — max-w-5xl centré         │
│                 │                                                │
│  Logo ⚡ Kudo   │                                                │
│  ─────────────  │                                                │
│  🏠 Accueil     │                                                │
│  🏆 Leaderboard │                                                │
│  ⚡ Mes kudos   │                                                │
│  ─────────────  │                                                │
│  ⚙️ Admin        │                                                │
│                 │                                                │
│  ─────────────  │                                                │
│  [Avatar]       │                                                │
│  Alice Martin   │                                                │
│  5 ⚡ restants  │                                                │
└─────────────────┴────────────────────────────────────────────────┘
```

**Sidebar specs :**
- `w-60 bg-white border-r border-stone-200 flex flex-col`
- Logo : `text-xl font-bold text-amber-500` + emoji ⚡
- Nav item actif : `bg-amber-50 text-amber-700 font-medium rounded-lg`
- Nav item inactif : `text-stone-600 hover:bg-stone-100 rounded-lg`
- En bas : avatar utilisateur + quota restant aujourd'hui (badge ambre)

### Layout mobile (< 1024px)

- Sidebar remplacée par une **bottom navigation bar** à 4 icônes
- `fixed bottom-0 w-full bg-white border-t border-stone-200`
- Icônes : Home · Leaderboard · Mes kudos · Profil

---

## 6. Bibliothèque de composants

### 6.1 `StatCard`

**Rôle :** afficher une métrique clé avec titre, valeur et contexte.

```
┌────────────────────────────┐
│  ⚡  ← icône ambre         │
│                            │
│  37                        │  ← text-4xl font-bold
│  ⚡ reçus ce mois          │  ← text-sm text-stone-500
│  +12 vs mois dernier       │  ← text-xs text-emerald-500 (delta positif)
└────────────────────────────┘
```

**Props :** `icon`, `value`, `label`, `delta?`, `deltaLabel?`, `highlight?` (ambre si true)

**Tailwind :**
```
bg-white rounded-xl border border-stone-200 shadow-sm p-5
```

Quand `highlight=true` (ex : quota restant faible) :
```
bg-amber-50 border-amber-200
```

---

### 6.2 `UserRow`

**Rôle :** ligne de leaderboard avec rang, avatar, nom, score.

```
  #1  [Avatar]  Alice Martin          ⚡ 142
  #2  [Avatar]  Bob Dupont            ⚡ 98
  #3  [Avatar]  Carol Smith           ⚡ 71
```

**Structure interne :**
```
flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-stone-50
│
├─ RankBadge   → #1 en or (#F59E0B), #2 en argent (#94A3B8), #3 en bronze (#B45309), reste en stone-400
├─ Avatar      → w-10 h-10 rounded-full object-cover
├─ Nom         → flex-1 text-sm font-medium text-stone-900
└─ Score badge → bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1 rounded-full
                 « ⚡ 142 »
```

**Rang 1 spécial :** ajouter un léger fond `bg-amber-50` sur toute la ligne + une couronne 👑 en caption sous le nom.

---

### 6.3 `KudoItem`

**Rôle :** élément de timeline/liste pour afficher un kudo reçu ou donné.

```
┌─────────────────────────────────────────────────────────┐
│  [Avatar]  Alice Martin   ⚡⚡⚡                          │
│            "Merci pour ton aide sur le déploiement de   │
│             vendredi, tu nous as sauvé la mise !"       │
│            #dev-ops · il y a 2 heures                   │
└─────────────────────────────────────────────────────────┘
```

**Specs :**
```
flex gap-3 p-4 rounded-xl border border-stone-200 bg-white hover:border-amber-200 transition
│
├─ Avatar       → w-10 h-10 rounded-full shrink-0
├─ Bloc texte
│   ├─ Header : nom (font-semibold) + badge ⚡ (amber, rounded-full)
│   ├─ Message : text-[15px] text-stone-700 mt-1 leading-relaxed
│   └─ Footer  : #canal · date → text-xs text-stone-400 mt-2
```

**Badge ⚡ count :**
- 1 ⚡ → `bg-amber-100 text-amber-700` + texte « ⚡ 1 »
- 3+ ⚡ → `bg-amber-200 text-amber-800` (légèrement plus saturé)
- 5 ⚡ (max quota) → `bg-amber-400 text-white` (festif)

---

### 6.4 `SettingsSection`

**Rôle :** bloc de formulaire admin avec titre, description et contenu.

```
┌─────────────────────────────────────────────────────────────┐
│  Monnaie de reconnaissance                                  │  ← text-xl font-semibold
│  Choisissez l'emoji et le nom utilisés dans Slack.          │  ← text-sm text-stone-500
│  ─────────────────────────────────────────────────────────  │
│  [champs formulaire]                                        │
└─────────────────────────────────────────────────────────────┘
```

**Tailwind :**
```
bg-white rounded-xl border border-stone-200 shadow-sm p-6
```

---

### 6.5 Composants utilitaires

| Composant | Description | Tailwind clé |
|---|---|---|
| `Avatar` | Photo + fallback initiales | `rounded-full object-cover bg-amber-100 text-amber-700` |
| `Badge` | Tag inline coloré | `rounded-full px-2.5 py-0.5 text-xs font-medium` |
| `Divider` | Séparateur horizontal | `border-t border-stone-200 my-4` |
| `EmptyState` | Écran vide avec illustration ⚡ | centré, icône 64px, texte stone-500 |
| `Skeleton` | Placeholder de chargement | `animate-pulse bg-stone-200 rounded-lg` |
| `Button` primaire | CTA principal | `bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg px-4 py-2` |
| `Button` secondaire | Action secondaire | `border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-lg px-4 py-2` |
| `Input` | Champ texte | `border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400` |

---

## 7. Écran 1 — Home

### Objectif

En 5 secondes, l'utilisateur voit : combien de ⚡ il a reçus cette semaine, combien il lui reste à donner aujourd'hui, et les derniers messages de reconnaissance qu'il a reçus.

### Layout desktop

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar (240px)  │  Contenu (flex-col gap-8 max-w-4xl)      │
│                   │                                           │
│                   │  ┌─────────────────────────────────────┐ │
│                   │  │  HEADER                              │ │
│                   │  │  Bonjour, Alice 👋                   │ │
│                   │  │  Voici ton énergie ⚡ cette semaine  │ │
│                   │  └─────────────────────────────────────┘ │
│                   │                                           │
│                   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│                   │  │Stat  │ │Stat  │ │Stat  │ │Quota │   │
│                   │  │Card  │ │Card  │ │Card  │ │Card  │   │
│                   │  └──────┘ └──────┘ └──────┘ └──────┘   │
│                   │                                           │
│                   │  ┌─────────────────────────────────────┐ │
│                   │  │  Derniers kudos reçus         [Voir] │ │
│                   │  │  KudoItem                            │ │
│                   │  │  KudoItem                            │ │
│                   │  │  KudoItem                            │ │
│                   │  │  KudoItem                            │ │
│                   │  └─────────────────────────────────────┘ │
│                   │                                           │
│                   │  ┌─────────────────────────────────────┐ │
│                   │  │  🏆 Voir le leaderboard de l'équipe → │
│                   │  └─────────────────────────────────────┘ │
└───────────────────┴───────────────────────────────────────────┘
```

### Détail section par section

#### Header

```
Bonjour, Alice 👋                                     ← text-2xl font-bold text-stone-900
Voici ton énergie ⚡ cette semaine                    ← text-sm text-stone-500 mt-1
```

Pas de fond coloré — fond `stone-50` de la page. Simple, aéré.

#### Grille de StatCards (4 colonnes desktop, 2×2 mobile)

```
grid grid-cols-2 lg:grid-cols-4 gap-4
```

| Card | Valeur | Label | Delta |
|---|---|---|---|
| 1 | 12 | ⚡ reçus cette semaine | +3 vs sem. dernière |
| 2 | 37 | ⚡ reçus ce mois | +8 vs mois dernier |
| 3 | 8 | ⚡ donnés cette semaine | — |
| 4 | **3** | ⚡ restants aujourd'hui | fond amber-50, bordure amber-200 |

La 4ᵉ card (quota) est `highlight=true` : c'est le seul "call to action" implicite
(tu as encore de l'énergie à donner !).

#### Section "Derniers kudos reçus"

```
Section header :
  flex justify-between items-center mb-4
  ├─ text-xl font-semibold "Derniers kudos reçus"
  └─ Button secondaire small "Voir tout →"

Liste : flex flex-col gap-3
  KudoItem × 4 (les plus récents)
```

Limite à 4 items sur la page Home. Pas de pagination — le lien "Voir tout" mène à l'écran "Mes kudos".

#### CTA Leaderboard

```
bg-white rounded-xl border border-stone-200 shadow-sm p-4
flex items-center justify-between

├─ 🏆  text-sm font-medium "Voir le leaderboard de l'équipe"
└─ → chevron-right text-stone-400
```

Hover : `hover:border-amber-300 hover:shadow-md transition`

### Structure de composants

```
HomePage
├── PageHeader (titre + sous-titre)
├── StatCardGrid
│   ├── StatCard (reçus semaine)
│   ├── StatCard (reçus mois)
│   ├── StatCard (donnés semaine)
│   └── StatCard (quota restant, highlight)
├── Section "Derniers kudos reçus"
│   ├── SectionHeader + ButtonLink
│   └── KudoItem × 4
└── LeaderboardCTA
```

---

## 8. Écran 2 — Leaderboard

### Objectif

Célébrer les personnes les plus reconnues. Ton : festif mais pas agressif.
Pas de rouge, pas de "perdant".

### Layout desktop

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar │  Contenu max-w-4xl                                │
│          │                                                    │
│          │  Leaderboard ⚡                 ← page title       │
│          │  Les personnes les plus reconnues cette semaine    │
│          │                                                    │
│          │  ┌────────────────────────────────────────────┐   │
│          │  │  Filtres                                    │   │
│          │  │  [Semaine ▾]  [Mois ▾]  [Tout temps ▾]     │   │
│          │  │  [Équipe ▾]  — grisé "Bientôt disponible"  │   │
│          │  └────────────────────────────────────────────┘   │
│          │                                                    │
│          │  ┌──────────────────┐  ┌──────────────────────┐   │
│          │  │ Onglet: Receveurs│  │ Onglet: Donneurs     │   │  ← Tab switcher
│          │  └──────────────────┘  └──────────────────────┘   │
│          │                                                    │
│          │  ┌────────────────────────────────────────────┐   │
│          │  │ Podium top 3 (cartes visuelles)             │   │
│          │  │                                             │   │
│          │  │  [#2]     [#1 👑]     [#3]                  │   │
│          │  │  Bob      Alice       Carol                  │   │
│          │  │  ⚡ 98    ⚡ 142      ⚡ 71                  │   │
│          │  └────────────────────────────────────────────┘   │
│          │                                                    │
│          │  ┌────────────────────────────────────────────┐   │
│          │  │ #4  [Avatar]  Dave Thomas      ⚡ 58        │   │
│          │  │ #5  [Avatar]  Emma Lefebvre    ⚡ 45        │   │
│          │  │ #6  [Avatar]  Franck Nguyen    ⚡ 39        │   │
│          │  │ ...                                         │   │
│          │  └────────────────────────────────────────────┘   │
└──────────┴────────────────────────────────────────────────────┘
```

### Détail section par section

#### Filtres

```
flex items-center gap-3 flex-wrap

Boutons radio stylisés (non des vrais <select>) :
  actif   → bg-amber-500 text-white rounded-full px-4 py-1.5 text-sm font-medium
  inactif → border border-stone-300 text-stone-600 rounded-full px-4 py-1.5 text-sm hover:bg-stone-50
  disabled → opacity-40 cursor-not-allowed (filtre Équipe)
```

#### Tab switcher (Receveurs / Donneurs)

```
flex border-b border-stone-200 mb-6

Tab actif   : border-b-2 border-amber-500 text-amber-600 font-semibold
Tab inactif : text-stone-500 hover:text-stone-700
```

#### Podium Top 3

Disposition : `flex items-end justify-center gap-6`  
Le #1 est plus haut visuellement (mb-0), #2 et #3 ont un décalage vers le bas (mb-6).

```
Chaque carte podium :
  flex flex-col items-center gap-2 p-5 rounded-2xl border

  #1 → bg-amber-50 border-amber-300   (médaille dorée)
  #2 → bg-stone-50 border-stone-300   (argent)
  #3 → bg-orange-50 border-orange-200 (bronze)

  Contenu :
  ├─ Couronne 👑 (uniquement #1, text-amber-400 text-xl)
  ├─ Avatar w-16 h-16 rounded-full border-4 (bordure couleur médaille)
  ├─ Nom text-sm font-semibold
  └─ Score badge ⚡ (plus grand, text-lg font-bold)
```

#### Liste #4 et au-delà

```
bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden
divide-y divide-stone-100

Chaque UserRow :
  px-5 py-3 flex items-center gap-4 hover:bg-stone-50
```

**Pas de "load more"** sur cette page — afficher jusqu'à 20 rangs, scroll naturel.

### Variante cards (mobile / future évolution)

Sur mobile, le podium s'empile verticalement.
Les rangs 4+ deviennent des cards fullwidth (même layout que `KudoItem` mais sans message).

### Structure de composants

```
LeaderboardPage
├── PageHeader
├── PeriodFilter (boutons radio)
├── TabSwitcher (Receveurs | Donneurs)
├── PodiumBlock
│   ├── PodiumCard (rank=2)
│   ├── PodiumCard (rank=1, elevated)
│   └── PodiumCard (rank=3)
└── UserRankList
    └── UserRow × n
```

---

## 9. Écran 3 — Mes kudos

### Objectif

Vue personnelle exhaustive. L'utilisateur doit pouvoir relire ses messages reçus
lors d'un feedback 360 ou d'un entretien annuel → **le message est roi**.

### Layout desktop

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar │  Contenu max-w-3xl                                │
│          │                                                    │
│          │  ┌──────────────────────────────────────────────┐ │
│          │  │  PROFIL HEADER                               │ │
│          │  │  [Avatar 64px]  Alice Martin                 │ │
│          │  │                 Tu as reçu 37 ⚡ ce mois     │ │
│          │  └──────────────────────────────────────────────┘ │
│          │                                                    │
│          │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│          │  │Stat  │ │Stat  │ │Stat  │ │Streak│            │
│          │  └──────┘ └──────┘ └──────┘ └──────┘            │
│          │                                                    │
│          │  ┌──────────────────────────────────────────────┐ │
│          │  │  Activité — graphique barres (7 derniers j.) │ │
│          │  └──────────────────────────────────────────────┘ │
│          │                                                    │
│          │  ┌──────────────────┐  ┌──────────────────┐      │
│          │  │ Reçus            │  │ Donnés           │      │  ← Tab switcher
│          │  └──────────────────┘  └──────────────────┘      │
│          │                                                    │
│          │  KudoItem                                         │
│          │  KudoItem                                         │
│          │  KudoItem                                         │
│          │  KudoItem                                         │
│          │  [Charger plus]                                   │
└──────────┴────────────────────────────────────────────────────┘
```

### Détail section par section

#### Profil header

```
flex items-center gap-5 p-6 bg-white rounded-xl border border-stone-200 shadow-sm

├─ Avatar w-16 h-16 rounded-full
└─ Bloc texte
    ├─ Nom : text-2xl font-bold text-stone-900
    ├─ "Tu as reçu" + span text-amber-600 font-bold "37 ⚡" + " ce mois"
    └─ Sous-texte : text-sm text-stone-500 "@alice · Développeur Front-end"
```

#### StatCards (4 cols)

Identiques à la Home mais centrées sur cette personne :
- ⚡ reçus cette semaine
- ⚡ reçus ce mois
- ⚡ donnés cette semaine
- 🔥 Streak actuel (jours consécutifs avec au moins 1 ⚡ donné)

La card Streak utilise une icône 🔥 (emoji) et `bg-orange-50 border-orange-200` pour se différencier.

#### Graphique d'activité

**Barres verticales simples** — pas besoin de lib externe lourde.  
Implémentation : divs à hauteur variable en CSS.

```
Conteneur : bg-white rounded-xl border border-stone-200 p-5

Label section : "Activité des 7 derniers jours"

Barres :
  flex items-end gap-2 h-20
  Chaque barre :
    flex-1
    bg-amber-400 rounded-t
    height proportionnelle (style={{ height: `${(value/max)*100}%` }})
    hover:bg-amber-500 transition

  Label jour : text-xs text-stone-400 text-center mt-2 (Lun, Mar, Mer...)
```

Tooltip au hover : `absolute` card montrant la valeur exacte.

#### Tab switcher + liste

Tab "Reçus" / "Donnés" (même pattern que Leaderboard).

Liste de `KudoItem` :

- **Reçus** → Le donneur est mis en avant (avatar + nom à gauche)
- **Donnés** → Le receveur est mis en avant (même layout, label "Tu as donné à X")

**Bouton "Charger plus" :**
```
w-full py-2.5 text-sm text-stone-600 border border-stone-300 rounded-lg
hover:bg-stone-50 mt-2
```

Pas de pagination numérotée — scroll + load more, plus naturel.

### Structure de composants

```
MyKudosPage
├── ProfileHeader (avatar + résumé)
├── StatCardGrid (4 cards)
├── ActivityChart (7 barres)
├── TabSwitcher (Reçus | Donnés)
├── KudoList
│   └── KudoItem × n
└── LoadMoreButton
```

---

## 10. Écran 4 — Admin Settings

### Objectif

Simple et rassurant. L'admin doit pouvoir changer les règles en 2 minutes sans risquer de tout casser.

### Layout desktop

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar │  Contenu max-w-2xl                                │
│          │                                                    │
│          │  Paramètres du workspace             ← page title │
│          │  Configurez la monnaie et les règles              │
│          │                                                    │
│          │  ┌──────────────────────────────────────────────┐ │
│          │  │  SettingsSection                              │ │
│          │  │  Monnaie de reconnaissance                   │ │
│          │  │                                               │ │
│          │  │  Emoji         [⚡]  (input text 4 chars max) │ │
│          │  │  Nom (sing.)   [Spark       ]                 │ │
│          │  │  Nom (plur.)   [Sparks      ]                 │ │
│          │  │                                               │ │
│          │  │  Aperçu Slack ─────────────────────────────  │ │
│          │  │  ┌ # général ──────────────────────────────┐ │ │
│          │  │  │ @alice  ⚡⚡⚡ Bravo pour le déploiement │ │ │
│          │  │  └─────────────────────────────────────────┘ │ │
│          │  └──────────────────────────────────────────────┘ │
│          │                                                    │
│          │  ┌──────────────────────────────────────────────┐ │
│          │  │  SettingsSection                              │ │
│          │  │  Règles                                      │ │
│          │  │                                               │ │
│          │  │  Quota quotidien    [  5  ] ⚡ / personne    │ │
│          │  │  Aide : Nombre de ⚡ que chaque personne      │ │
│          │  │  peut donner par jour.                       │ │
│          │  │                                               │ │
│          │  │  Canaux actifs                                │ │
│          │  │  ☑ #général    ☑ #dev    ☐ #aléatoire       │ │
│          │  │  Aide : La reconnaissance n'est détectée     │ │
│          │  │  que dans les canaux sélectionnés.           │ │
│          │  └──────────────────────────────────────────────┘ │
│          │                                                    │
│          │  [Enregistrer les paramètres]  ← bouton primaire  │
│          │                                                    │
│          │  ✅ Paramètres mis à jour avec succès.            │
└──────────┴────────────────────────────────────────────────────┘
```

### Détail section par section

#### Section "Monnaie de reconnaissance"

**Champ Emoji :**
```
Label : "Emoji de reconnaissance"
Input : text-center text-2xl w-16 border border-stone-300 rounded-lg p-2
        focus:ring-2 focus:ring-amber-400
Helper : text-xs text-stone-400 mt-1
         "L'emoji qui déclenche la reconnaissance dans Slack."
```

**Champs Nom singulier / pluriel :**
```
Label + Input standard (voir composant Input §6.5)
Helper sous chaque champ, text-xs text-stone-400
  singulier : "Ex : « Spark », « Étoile »"
  pluriel   : "Ex : « Sparks », « Étoiles »"
```

**Aperçu Slack (mock) :**
```
bg-stone-900 rounded-xl p-4 mt-4

  text-stone-400 text-xs mb-2 "# général"

  flex items-start gap-3
  ├─ Avatar 32px rounded
  └─ Bloc
      ├─ "@bob" text-white text-sm font-semibold
      └─ message interpolé avec l'emoji et le nombre
         ex: "⚡⚡⚡ Merci pour la revue de code !"
         → le texte se met à jour en temps réel quand l'admin tape
```

**Pattern réactif :** `useWatch` sur le champ emoji pour mettre à jour le mock.

#### Section "Règles"

**Input quota :**
```
flex items-center gap-3
├─ Input number (w-24, min=1, max=99, step=1)
├─ texte " ⚡ par personne et par jour"
```

Validation inline : si valeur < 1 → bordure rouge + message sous le champ.

**Checkboxes canaux :**
```
Chaque canal :
  flex items-center gap-2
  ├─ input[type=checkbox] accent-amber-500 (CSS accent-color)
  └─ label text-sm text-stone-700 "#général"

Liste : grid grid-cols-2 gap-2 mt-2
```

#### Bouton + feedback

```
Bouton "Enregistrer les paramètres" :
  type=submit bg-amber-500 hover:bg-amber-600 ...
  État loading : spinner inline + texte "Enregistrement..."
  disabled pendant le save

Message de succès (après save) :
  flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50
  border border-emerald-200 rounded-lg px-4 py-3 mt-4
  ├─ ✅
  └─ "Paramètres mis à jour avec succès."

Message d'erreur :
  même layout, rouge (red-50, red-700, red-200)
  ├─ ❌
  └─ "Erreur lors de la mise à jour. Veuillez réessayer."
```

Les messages disparaissent après 4 secondes (`setTimeout` + état local).

### Structure de composants

```
AdminSettingsPage
├── PageHeader
├── SettingsSection "Monnaie"
│   ├── EmojiInput
│   ├── Field (singulier)
│   ├── Field (pluriel)
│   └── SlackPreviewMock
├── SettingsSection "Règles"
│   ├── QuotaInput
│   └── ChannelCheckboxList
├── SaveButton (+ loading state)
└── FeedbackBanner (succès | erreur)
```

---

## 11. UX Copy — lexique français

| Clé | Texte |
|---|---|
| `home.greeting` | Bonjour, {prénom} 👋 |
| `home.subtitle` | Voici ton énergie ⚡ cette semaine |
| `home.kudosReceived.week` | ⚡ reçus cette semaine |
| `home.kudosReceived.month` | ⚡ reçus ce mois |
| `home.kudosGiven.week` | ⚡ donnés cette semaine |
| `home.quotaRemaining` | ⚡ restants aujourd'hui |
| `home.recentKudos` | Derniers kudos reçus |
| `home.viewAll` | Voir tout → |
| `home.leaderboardCTA` | Voir le leaderboard de l'équipe |
| `leaderboard.title` | Leaderboard ⚡ |
| `leaderboard.subtitle` | Les personnes les plus reconnues |
| `leaderboard.tab.receivers` | Receveurs |
| `leaderboard.tab.givers` | Donneurs |
| `leaderboard.filter.week` | Cette semaine |
| `leaderboard.filter.month` | Ce mois |
| `leaderboard.filter.allTime` | Tout temps |
| `myKudos.title` | Mes kudos |
| `myKudos.summary` | Tu as reçu **{n} ⚡** ce mois |
| `myKudos.tab.received` | Reçus |
| `myKudos.tab.given` | Donnés |
| `myKudos.chart.label` | Activité des 7 derniers jours |
| `myKudos.loadMore` | Charger plus |
| `myKudos.empty` | Tu n'as pas encore reçu de kudos. Donne l'exemple ! ⚡ |
| `admin.title` | Paramètres du workspace |
| `admin.subtitle` | Configurez la monnaie et les règles de reconnaissance |
| `admin.section.currency` | Monnaie de reconnaissance |
| `admin.section.rules` | Règles |
| `admin.field.emoji` | Emoji de reconnaissance |
| `admin.field.singular` | Nom au singulier |
| `admin.field.plural` | Nom au pluriel |
| `admin.field.quota` | Quota quotidien |
| `admin.field.channels` | Canaux actifs |
| `admin.save` | Enregistrer les paramètres |
| `admin.saving` | Enregistrement… |
| `admin.success` | Paramètres mis à jour avec succès. |
| `admin.error` | Erreur lors de la mise à jour. Veuillez réessayer. |

---

## 12. Responsive & breakpoints

### Breakpoints (Tailwind defaults)

| Nom | Largeur | Usage |
|---|---|---|
| `sm` | 640px | — (peu utilisé) |
| `md` | 768px | Passer 2 cols → 4 cols sur StatGrid |
| `lg` | 1024px | Afficher la sidebar (masquée en dessous) |
| `xl` | 1280px | Augmenter padding latéral |

### Règles clés

```
// Sidebar
hidden lg:flex           ← cachée sur mobile
w-60 shrink-0

// Bottom nav (mobile uniquement)
flex lg:hidden fixed bottom-0 w-full

// StatGrid
grid-cols-2 md:grid-cols-4

// Podium
flex-col md:flex-row     ← empilé sur mobile, côte à côte sur desktop

// KudoItem message
line-clamp-3             ← tronqué sur mobile, visible entier sur desktop
```

### Mobile — spécificités

- **Sidebar → Bottom nav** : 4 icônes (Home, Leaderboard, Mes kudos, Admin)
- **Podium** : les 3 cartes s'empilent verticalement, #1 en premier
- **StatGrid** : 2 colonnes au lieu de 4
- **AdminSettings** : sections fullwidth, pas de layout en 2 colonnes
- **Aperçu Slack** : masqué sur < md pour gagner de la place

---

*Document généré le 2026-04-20 — à mettre à jour au fil des itérations design.*
