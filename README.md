# Léon Morales — AI Engineer Portfolio

Live: https://leon-afk1.github.io

Static, dependency-free portfolio (HTML / CSS / vanilla JS).

## Structure
- `index.html` — page; `styles.css` — base styles; `enhancements.css` / `enhancements.js` — a11y, floating chatbot, skills chips, project filters, CV links, lazy ONNX loader.
- `texte.json` — EN/FR content (language saved in `localStorage`).
- `neural-network.js` — interactive skills network (paused when off-screen, HiDPI aware).
- `script.js` — navigation, i18n, form, MNIST demo (ONNX Runtime Web is loaded only when the demo nears the viewport).
- `chatbot-*.js` — floating Graph RAG chatbot (backend on Hugging Face Space, woken up in the background on page load).
- `CV_Leon_Morales_AI_2027_English.pdf`, `CV_Leon_Morales_IA_2027_Francais.pdf` — CVs linked from the hero and contact sections.

## Maintenance notes
- Bump the `?v=` query string on assets in `index.html` after editing them.
- Dark theme only. Project filter categories are defined in `enhancements.js` (`CATS`).

## Contact
leon.morales@outlook.fr · https://github.com/Leon-afk1 · https://www.linkedin.com/in/léon-morales
