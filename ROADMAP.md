# Roadmap

This roadmap details the path from current scaffold to v1.0.

## 🟢 Phase 1: Engineer-First Core (Current)

_Goal: Solidify the parsing engine and data generation._

- [x] **Monorepo Setup**: Turbo, ESLint (v9), Prettier, TSConfig.
- [x] **Core Architecture**: `parser` -> `extractor` -> `generator`.
- [ ] **Advanced Type Extraction** (`packages/core`)
  - [ ] Support `Enum` extraction.
  - [ ] Support `TypeAlias` extraction.
  - [ ] Support Generics representation (`T`, `<T>`).
  - [ ] Handle inherited members (extends/implements).
  - [ ] Extract advanced JSDoc tags (`@deprecated`, `@example`, `@returns`).
- [ ] **JSON Schema Finalization**: Lock down the `autodocs.json` output format.

## 🟡 Phase 2: The Glue (CLI & UI Integration)

_Goal: Making `autodocs build` actually generate a website._

- [ ] **CLI Implementation** (`packages/cli`)
  - [ ] Implement `readConfig()` to load `autodocs.config.ts`.
  - [ ] **UI Injection**: `build` command must copy built assets from `packages/ui/dist` to user's `docs-dist`.
  - [ ] **Data Injection**: `build` command must write `autodocs.json` into `docs-dist/data.json`.
- [ ] **UI Data Consuming** (`packages/ui`)
  - [ ] Remove Mock Data (`App.tsx`).
  - [ ] Implement `useDocsData()` hook to fetch `window.AUTODOCS_DATA` or `data.json`.
  - [ ] Add loading states and error handling.
- [ ] **CLI Serve Command**
  - [ ] Implement static file server (using `sirv` or `express`) in `serve.ts`.
  - [ ] Support hot-reloading (watch mode) for `autodocs.config.ts` changes.

## 🟠 Phase 3: The "Wow" Factor (UI Polish)

_Goal: A beautiful, interactive documentation site._

- [ ] **Routing System**
  - [ ] Add React Router.
  - [ ] Routes: `/` (Home), `/api/:type` (Details), `/search` (Search).
- [ ] **Components**
  - [ ] `Sidebar`: Group by kind (Interfaces, Classes, Functions).
  - [ ] `SearchCmdK`: Command+K global search modal.
  - [ ] `CodeBlock`: Syntax highlighted examples (Shiki/Prism).
  - [ ] `PropsTable`: Interactive table for interface properties.
- [ ] **Theming**
  - [ ] Dark/Light mode toggle.
  - [ ] Custom accent color support via config.

## 🔵 Phase 4: Extensibility

_Goal: Plugins and custom content._

- [ ] **Plugin System** (`packages/core`)
  - [ ] Define `Plugin` interface.
  - [ ] Add hook points: `beforeParse`, `afterExtract`, `beforeGenerate`.
- [ ] **Markdown Support** (`packages/plugins/markdown`)
  - [ ] Parse `.md` files in `docs/`.
  - [ ] Inject markdown content into the simplified JSON output.
  - [ ] Render Markdown in UI.
- [ ] **Examples Support** (`packages/plugins/examples`)
  - [ ] Extract `@example` tags.
  - [ ] Create "Playground" or copy-pasteable blocks in UI.

## 🟣 Phase 5: Production Readiness (v1.0)

_Goal: Stability and public launch._

- [ ] **Testing Strategy**
  - [ ] Unit tests for 100% of `extractor` logic.
  - [ ] E2E tests: Build a real project and verify `dist/index.html`.
- [ ] **CI/CD**
  - [ ] Automate NPM publishing with Changesets.
  - [ ] Automated version bumping.
- [ ] **Documentation**
  - [ ] Dogfooding: The `autodocs` website is built with `autodocs`.
  - [ ] Complete configuration reference.

## Future Ideas

- [ ] VS Code Extension (Peek Definition style).
- [ ] AI Summary generation for undocumented code.
- [ ] Remote schema fetching (GitHub URL support).
