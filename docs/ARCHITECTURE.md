# Architecture

Boucle est une application monopage en JavaScript sans dépendance, livrée en un seul fichier HTML. Ce document décrit la chaîne de build, le modèle de données, le cycle de rendu et l'intégration avec l'hébergeur.

## De `src/` à `dist/`

```
src/index.html ──┐
src/styles/*.css ├─ scripts/build.mjs ──► dist/boucle.html (≈ 245 Ko, autonome)
src/fonts/*.woff2┤     • <link rel="stylesheet"> → <style> (url() des polices → data:font/woff2)
src/js/*.js ─────┘     • <script src> d'un même data-bundle → un seul <script>
```

- Le gabarit `src/index.html` référence les fichiers comme une page web classique ; les balises qui partagent un `data-bundle` sont concaténées dans l'ordre, sans séparateur. Le résultat est un script classique unique : les fonctions déclarées dans un module sont visibles de tous, comme dans le fichier d'origine.
- `npm run build -- --check` reconstruit en mémoire et compare octet par octet avec `dist/` ; la CI échoue au moindre écart.
- `scripts/lib.mjs` porte aussi les contrôles : ressources externes (balises `src`/`href`, `url()`, `@import`, `import()`) et données personnelles (adresses, jetons, liens privés, termes locaux de `.prive-termes.txt` jamais publiés).

## Modules

| Fichier | Rôle |
|---|---|
| `01-donnees.js` | saison d'exemple (FC Exemple, données fictives), référentiels : phases de jeu, structures, vues |
| `02-etat.js` | l'objet d'état `S` ; brouillon du débrief et vue courante dans `localStorage` |
| `03-utilitaires.js` | échappement HTML, dates, calculs : confiance d'un sujet, verdict d'une décision, biais du résultat, métriques de la chaîne |
| `04-rendu.js` | `render()`, en-tête (chaîne et onglets), bandeaux d'état |
| `05-debrief.js` … `09-boucles.js` | une fonction de vue par onglet, qui renvoie du HTML |
| `10-interactions.js` | délégation d'événements : `data-bind` (champs → état), `data-action` (boutons → actions) |
| `11-assistant.js` | appels au modèle de langage : extraction, sujets, exercices, mémoire ; messages d'erreur |
| `12-demarrage.js` | négociation avec l'hébergeur, bascule en démonstration, abonnements temps réel |

## Modèle de données

Cinq collections, toutes reliées par identifiant :

```
debriefs      { id, date, opponent, shape, us, them, text, createdAt }
observations  { id, debriefId, phase, principle, players[], period, valence, text, hypothesis, certainty }
topics        { id, title, summary, phase, valence, kpi, evidenceIds[], status, decisionId, createdAt }
decisions     { id, topicId, title, problem, phase, kpi, intervention, reviewAfter, status, outcome,
                evidenceIds[], reviews[{ debriefId, date, opponent, result, verdict, example, count }],
                createdAt, workedAt, closedAt }
meta/team     { name, level, category }
```

Les éléments de la saison d'exemple portent `example: true`, ce qui permet de les effacer d'un geste en version hébergée.

- La **confiance d'un sujet** dépend du nombre de matchs distincts parmi ses observations : 1–2 hypothèse, 3–5 tendance, 6 et plus récurrent.
- Le **verdict d'une décision** agrège les revues (mieux = +1, pareil = 0, pire = −1).
- Le **biais du résultat** est signalé quand, sur trois revues ou plus, chaque verdict suit le score du match (victoire → mieux, défaite → pire, nul → pareil) et que moins de deux revues s'appuient sur un comptage.

## Cycle de rendu

1. Une action (clic sur un `data-action`, saisie dans un `data-bind`) modifie `S`.
2. `render()` reconstruit l'en-tête puis la vue active par `innerHTML`.
3. Si le focus est dans un champ, le rendu est différé jusqu'à la sortie du champ (`focusout`) : la saisie n'est jamais interrompue par une mise à jour temps réel.

Toutes les valeurs insérées dans le HTML passent par `esc()`.

## Hébergeur et mode démonstration

Au démarrage, `12-demarrage.js` demande trois capacités à la plateforme d'hébergement (`window.claude.use`) : `db` (base de documents temps réel), `sample` (modèle de langage) et `user` (identité, droits).

- **Aucune capacité** (fichier ouvert depuis le disque, GitHub Pages) : mode démonstration, saison d'exemple en mémoire, lecture seule.
- **Base disponible** : cinq abonnements `onSnapshot` ; l'interface passe en mode connecté quand les cinq ont répondu. Les droits d'écriture viennent de `user.can("data.write")`.
- **Modèle indisponible** : la saisie manuelle reste possible ; les fonctions d'assistance sont masquées.

Les réponses du modèle sont demandées en JSON, puis filtrées et bornées côté client (valeurs d'énumération vérifiées, longueurs tronquées, 20 observations au plus) avant toute écriture.

## Tests

| Fichier | Vérifie |
|---|---|
| `tests/build.test.mjs` | `dist/` à jour, document complet (langue, encodage, viewport, titre, description), aucune ressource externe, aucun fichier orphelin dans `src/`, aucune donnée personnelle |
| `tests/e2e/app.spec.mjs` | ouverture hors ligne sans erreur ni requête, absence de débordement horizontal, parcours des cinq vues et de la chaîne ; en 1440 × 900 et en 390 × 844 tactile |

Les parcours sont décrits dans `build.config.json` (`e2e.flows`), ce qui garde le fichier de test générique.
