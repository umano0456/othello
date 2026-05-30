<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## npm scripts (project conventions)

- `npm run dev` — Next.js dev server
- `npm run build` / `npm start` — production build & start
- `npm run lint` — ESLint (`eslint-config-next`)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` / `npm run test:watch` — Vitest + jsdom
- `npm run test:bench` — SC-005 CPU strength self-play bench (currently `describe.skip`; toggle to run)

## Quality gates (Constitution V)

Game logic changes MUST add or update unit tests under `tests/game/` or `tests/cpu/`. UI changes
require a browser-based golden-path verification recorded in the PR body.
