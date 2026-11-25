# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versions datées.

## [1.0.0] — 2026-11-25

### Ajouté

- Sources découpées en modules (`src/js`, `src/styles`) et build vers un fichier unique `dist/boucle.html`.
- Polices embarquées (Barlow Condensed, Source Sans 3, IBM Plex Mono) : plus aucune requête réseau.
- Tests d'intégrité (node:test) et parcours de bout en bout bureau et mobile (Playwright), CI GitHub Actions.
- Publication de la démonstration sur GitHub Pages.
- Documentation : architecture, captures, sécurité, contribution.

### Modifié

- En-tête HTML complet (langue, description, couleur de thème, icône).
- Mode démonstration : un seul bandeau explicite au lieu de deux.
