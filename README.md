## Yokai Chat

Vue 3 + TypeScript chat UI for local AI models. Current branch focuses on LM Studio with an updated UI and testing stack.

### Features

- Multi-backend architecture: LM Studio (active on this branch). Ollama support exists on main.
- Streaming responses with typing indicator and stop control.
- Markdown rendering with code blocks.
- Context management: add, load, and send multiple saved contexts.
- Fixed bottom input, centered modals, modern responsive UI.
- Model selector: load/refresh available models, set current model.
- Error handling during streaming and network issues.
- Context persistence across sessions.
- Type-safe codebase with Vue + Pinia + Vite.
- Testing: Vitest (unit) and Playwright (e2e).

### Requirements

- Node.js 20.19.0+ (or 22.12.0+)
- LM Studio installed and running with a loaded model
- Modern browser

### Quick start

```bash
git checkout lm_studio
npm install
npm run dev
```

App: `http://localhost:5173`

### Backend configuration (LM Studio)

- Default proxy: requests to `/api/lmstudio` are proxied to `http://localhost:1234/v1` (see `vite.config.ts`).
- Change base URL in `src/constants/index.ts` if needed.

### Scripts

- `npm run dev` — start dev server with HMR
- `npm run build` — production build
- `npm run preview` — preview build locally
- `npm run type-check` — TypeScript checks
- `npm run lint` — ESLint with auto-fix
- `npm run format` — Prettier format

### Testing

Unit (Vitest + Testing Library):

```bash
npm run test          # run once
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

End-to-end (Playwright):

```bash
npx playwright install --with-deps  # one-time; may require sudo
npm run dev                         # in one terminal
npm run e2e                         # in another terminal
```

If sudo is unavailable, install a single browser: `npx playwright install chromium`.

### Project structure

```
src/
  components/      # UI components (MessageInput, MessageList, ModelSelector, TypingIndicator, Context*)
  composables/     # Composition utilities (loading, forms, markdown, modal)
  constants/       # App constants
  services/        # Backends (lmstudio.ts)
  stores/          # Pinia store (chat.ts)
  types/           # Type definitions
  views/           # Pages (ChatView, LandingPage, ModelDownloadView)
```

### Troubleshooting

- LM Studio connection: ensure it runs on port 1234 with a loaded model.
- CORS/Proxy issues: see `vite.config.ts` and `CORS_TROUBLESHOOTING.md`.
- Playwright errors about missing browsers: run the install step above.

### License

MIT. See `LICENSE`.
