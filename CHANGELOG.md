# Changelog

## 1.0.0 (2026-04-22)


### ✨ Features

* add emoji to Font Awesome icon mapping and implement seed script for MongoDB ([8bb67bf](https://github.com/BananaOps/Kudo/commit/8bb67bfd0ec15ebcdcb306c5a0c2cf18aff427e2))
* add release-please configuration and manifest files ([dd66132](https://github.com/BananaOps/Kudo/commit/dd6613221597d25182850e3e9922ffacbbb49ad8))
* AdminSettingsPage redesign — inline styles, corail, sections avec icônes, visualisation quota ([6a98341](https://github.com/BananaOps/Kudo/commit/6a983419fb3c6a6b70e743510271d4fbf6118727))
* composant ZapMascot SVG avec clin d'oeil et sourire ([794d83c](https://github.com/BananaOps/Kudo/commit/794d83c83fd800d76f034b09168f2c0f7e513d67))
* emoji picker visuel avec presets cliquables + input custom pour currency emoji ([3ff5db1](https://github.com/BananaOps/Kudo/commit/3ff5db10b856951041a7d665a8da1fa09fc2c76d))
* heatmap palette corail + section Team sparks dans le Leaderboard ([4ee61bd](https://github.com/BananaOps/Kudo/commit/4ee61bd6bd18f387a468cac1915d8927777238d1))
* HomePage couleurs arc-en-ciel, quota card corail ([418b7b7](https://github.com/BananaOps/Kudo/commit/418b7b705cf1df806ed2dfe99469fe64dfec30ff))
* KudoItem tags teal, badge jaune, avatars carrés ([9f8af90](https://github.com/BananaOps/Kudo/commit/9f8af90e314eb5dab8e625dc988fdbc031454900))
* Leaderboard podium pastel arc-en-ciel, filtres corail ([593d650](https://github.com/BananaOps/Kudo/commit/593d650437352027e294072b8ef5b0866fa6fe7f))
* MyKudosPage couleurs cohérentes arc-en-ciel ([5b997b3](https://github.com/BananaOps/Kudo/commit/5b997b33fdbf0036f1432ac759f273e89ff1f4c5))
* nouvelle palette pastel arc-en-ciel + radius Slack-like ([d18f613](https://github.com/BananaOps/Kudo/commit/d18f613a6994391cd95b48d0cd5202f57986b85c))
* podium top 3 — médaille + titre intégrés dans le header de carte ([6c75a56](https://github.com/BananaOps/Kudo/commit/6c75a56d5fa15240b48f7a72af9c36e6880027f1))
* SendSparkModal redesign pastel — sélecteur user, couleurs corail, état disabled ([0445e4b](https://github.com/BananaOps/Kudo/commit/0445e4b3fa0ccbde5c4329ad3f887f60b5d10ba8))
* sidebar corail Slack-like avec mascot ZapMascot ([79aa67b](https://github.com/BananaOps/Kudo/commit/79aa67b3946592d960a8bb68c1cfd00d95e69fd7))
* StatCard prop color rainbow pastel + bordure gauche colorée ([a4414b0](https://github.com/BananaOps/Kudo/commit/a4414b0c2e71e570947f4011b9140732328a8a65))
* update Vite configuration import and add vite-env type definitions ([966e680](https://github.com/BananaOps/Kudo/commit/966e680117b8ffd439b64785c4a6d549b8839f77))
* user selector — pick any user from kudo history ([fc3d589](https://github.com/BananaOps/Kudo/commit/fc3d589a3a1d96d39ce88e3dc5d78ddd4620b5a8))
* UserSelector avatars carrés sans violet ([ac6bc13](https://github.com/BananaOps/Kudo/commit/ac6bc136f58952811c8f9578de70a389a70f3996))
* word cloud arc-en-ciel pastel — top 5 mots en couleurs, reste neutre ([2602c8c](https://github.com/BananaOps/Kudo/commit/2602c8ca8b33e422a6fd56a6b47ac59b7130aafc))
* ZapMascot redesign fidèle à l'image — deux yeux ouverts, contour épais + favicon app icon ([4b6a5cb](https://github.com/BananaOps/Kudo/commit/4b6a5cb821084e1f80da865580b90d97d1e29af6))


### 🐛 Bug Fixes

* Avatar couleur texte adaptée par bg pour contraste WCAG AA ([1a1aa4f](https://github.com/BananaOps/Kudo/commit/1a1aa4fc9bc04b771fd4f1d5a5ba4e92b873ff8b))
* HomePage remplace var(--spark*) par var(--coral) dans tous les éléments ([6d63ae3](https://github.com/BananaOps/Kudo/commit/6d63ae3cd9655910643346b29a62f9cc91c4b176))
* mascot wrapper utilise var(--radius-lg) au lieu de 8 hardcodé ([3eeee6b](https://github.com/BananaOps/Kudo/commit/3eeee6bb1493358ef8909f6e3d04e781fe88a095))
* spark-deep WCAG AA contrast (#C89300 → [#9](https://github.com/BananaOps/Kudo/issues/9)A6C00) ([ccecff6](https://github.com/BananaOps/Kudo/commit/ccecff69504c8fa5746995c91d7dfd8a6e7242eb))
* supprime la heatmap Team sparks this year du Leaderboard ([8583df0](https://github.com/BananaOps/Kudo/commit/8583df0ea146465877ec34430d4982dd951acddb))
* supprime le bouton Export for review de MyKudosPage ([54436cc](https://github.com/BananaOps/Kudo/commit/54436cc7cf8125e32d5994445fb8e6e5b15b0d6b))
* supprime les filtres 30d/year/all de la heatmap — affiche uniquement l'année en cours ([6343d47](https://github.com/BananaOps/Kudo/commit/6343d4719798d14b6cb37eb6f4b7dbfbff669fc1))
* update leaderboard page test messages for clarity ([edbbbe3](https://github.com/BananaOps/Kudo/commit/edbbbe33f4a72fed5198be7670e96b8e9d60ac06))
* update UserRow component by removing unused avatar colors and improve MyKudosPage streak check ([966e680](https://github.com/BananaOps/Kudo/commit/966e680117b8ffd439b64785c4a6d549b8839f77))


### 🔧 Chores

* update CI workflows and dependencies ([376edb6](https://github.com/BananaOps/Kudo/commit/376edb63ebdf37ea9a592b117d281bed93df8dc9))
