# Léon Morales — AI Engineer Portfolio

Live: https://leon-afk1.github.io

Static, dependency-free portfolio (HTML / CSS / vanilla JS) with a Graph RAG assistant whose backend runs on Google Cloud Run.

## Front end
Bilingual EN/FR: every text lives in `texte.json`; the English HTML is the fallback before it loads.

| File | Role |
|---|---|
| `index.html` | Page structure |
| `base.css`, `nav.css`, `hero.css`, `projects.css`, `sections.css`, `mnist.css`, `chatbot.css` | Styles (tokens and palette in `base.css`) |
| `i18n.js` | Loads `texte.json`, applies static texts, dispatches `languageChanged` |
| `nav.js` | Mobile menu, smooth scrolling, active link |
| `hero-graph.js` | Hero: knowledge graph (`graph.json`) and question box; cited nodes light up |
| `projects.js` | Projects by year next to the sticky projects/skills graph |
| `experience-graph.js` | Constellation of experiences and projects over time |
| `timeline.js` | Experience timeline |
| `cypher-heads.js` | Cypher query shown at the top of Skills, Projects and Experience |
| `mnist-demo.js` | In-browser MNIST demo (ONNX Runtime Web, loaded on demand) |
| `chatbot-config.js`, `chatbot-client.js` | Floating chatbot calling the Cloud Run API |
| `contact-form.js` | Contact form (Formspree) |
| `enhancements.js` | Skills groups, certifications, CV links, ONNX loader, small UI texts |

Colours carry meaning: fir green = projects and actions, sky blue = skills, lilac = experience.

## Knowledge graph
The assistant answers from a Neo4j database. `graph.json` is a curated public export of it, built by `tools/export_graph.py` (read-only, precomputed layout); re-run it after changing the graph.

## Backend and infrastructure
- `backend/` — FastAPI Graph RAG API (Neo4j + Gemini), tests in `backend/tests` (`pip install -r requirements-dev.txt && pytest`). See `backend/README.md`.
- `infra/` — Terraform for Cloud Run, Artifact Registry, Secret Manager, Workload Identity Federation, budget and alerts. See `infra/README.md`.
- GitHub Actions: `deploy-backend.yml` (tests on pull requests, tests then deploy on `main`), `terraform.yml` (plan, then apply after approval), `keep-alive.yml` (keeps the free Neo4j Aura instance awake).

## Maintenance notes
- Bump the `?v=` query string of an asset in `index.html` after editing it.
- Add or change a project: `projects.js` (order, category, start date, links) and `texte.json` (`projects.cardN`).

## Contact
leon.morales@outlook.fr · https://github.com/Leon-afk1 · https://www.linkedin.com/in/léon-morales
