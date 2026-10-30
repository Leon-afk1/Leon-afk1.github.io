# Notes for Claude Code

Personal portfolio of Léon Morales: static site on GitHub Pages (`main` is published as is) and a Graph RAG chatbot backend on Google Cloud Run. See `README.md` for the file map.

## Conventions
- All user-facing text is bilingual and lives in `texte.json` (`en` and `fr` must stay in sync). Scripts render on the `languageChanged` event (dispatched by `i18n.js` before it updates static texts, hence the `setTimeout(render, 0)` pattern).
- No build step and no front-end dependencies. Plain ES5/ES2015 in IIFEs, no modules.
- After editing an asset, bump its `?v=` in `index.html` (GitHub Pages caching).
- Design: graphite background, one font family (Schibsted Grotesk; JetBrains Mono only for real code). Colour encodes the kind of content: fir green = projects/actions (`--accent-primary` for fills with white text, `--accent-text` for text on dark), sky blue = skills, lilac = experience. No decorative animations; motion only in answer to the user, and `prefers-reduced-motion` is respected.
- The `frontend-design` skill in `.claude/skills/` guides visual work.
- Never use `<title>` inside the graph SVGs (browser tooltips hide the graph): use `aria-label`.

## Data
- The chatbot reads Neo4j. `graph.json` (hero and projects graphs) is exported from it by `tools/export_graph.py`; re-run the export after changing projects, skills or experiences in Neo4j, and keep `PROJECT_CARDS` in sync with `projects.js`.
- Writes to the production Neo4j database need the owner's approval; back up the touched nodes first.

## Backend
- `backend/main.py`: LLM-generated Cypher runs in read-only transactions; keep it that way. Per-IP rate limit, bounded session store, model rotation with quota recovery.
- Run `pytest` in `backend/` before pushing; CI runs it on pull requests and before every deploy.
- Secrets are in Secret Manager, never in the repo or in the Terraform state. `.env` is local only.

## Workflow
- Work on a branch, check locally (a static server on the repo root), then fast-forward `main`. Pushing `backend/**` to `main` redeploys Cloud Run; `infra/**` runs Terraform (apply needs approval).
