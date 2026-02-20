# Story 5.8: Document Library & Markdown Viewer

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to browse all project artifacts in a file tree and read markdown documents with proper formatting directly in the editor panel,
so that I can review PRDs, architecture docs, and other artifacts without switching to external tools.

## Acceptance Criteria

1. **File Tree Navigation** — Given the editor panel is open, when the user navigates to the Docs view, then a file tree is displayed on the left showing files from configurable directories. The content area on the right displays the selected document. The file tree updates when files change (via existing file watcher).

2. **Configurable Doc Library Paths** — Given the VS Code settings, when the `bmad.docLibraryPaths` setting is configured, then the file tree displays files from the configured paths. The default value includes: `["{outputRoot}/planning-artifacts", "{outputRoot}/implementation-artifacts", "docs"]`. The user can add custom folder paths to this setting.

3. **File Selection and Content Loading** — Given the file tree is displayed, when the user clicks on a file in the tree, then the file content loads and displays in the main content area. The selected file is visually highlighted in the tree. The breadcrumb updates to "Dashboard / Docs / filename.md". Directories are expandable/collapsible.

4. **Markdown Rendering** — Given a .md file is selected, when the content renders, then markdown is rendered with proper formatting: headings, lists, tables, bold/italic, links, blockquotes. GFM extensions are supported (tables, task lists, strikethrough).

5. **Code/YAML Syntax Highlighting** — Given a .yaml, .yml, or code file is selected, when the content renders, then the content displays with syntax highlighting. A "Copy" button allows copying the raw content.

6. **Table of Contents** — Given a markdown document is rendered, when headings are present (H1-H4), then a table of contents appears as a collapsible section. Clicking a TOC entry scrolls to that heading.

7. **Dependencies** — Given the project dependencies, when the document library is implemented, then `react-markdown`, `remark-gfm`, and `rehype-highlight` are added as dependencies. They are used only in the editor panel webview bundle.

8. **Responsive Layout** — Given the Document Library view is displayed at any width, when the viewport width changes, then the layout adapts responsively (e.g., file tree collapses to a toggle at narrow widths, content area takes full width). Content remains usable at widths as narrow as 400px.

## Tasks / Subtasks

- [x] Task 1: Add new message types for file tree communication (AC: 1, 2, 3)
  - [x] 1.1 In `src/shared/messages.ts`, add `REQUEST_FILE_TREE` to `ToExtensionType` and `FILE_TREE` to `ToWebviewType`
  - [x] 1.2 Add `RequestFileTreeMessage` interface: `{ type: 'REQUEST_FILE_TREE' }` (no payload needed — extension reads configured paths from settings)
  - [x] 1.3 Add `FileTreeMessage` interface: `{ type: 'FILE_TREE'; payload: { roots: FileTreeNode[] } }` where `FileTreeNode = { name: string; path: string; type: 'file' | 'directory'; children?: FileTreeNode[] }`
  - [x] 1.4 Add `FileTreeNode` type to `src/shared/types/` (new file `file-tree.ts`) and export from barrel
  - [x] 1.5 Add factory functions `createRequestFileTreeMessage()` and `createFileTreeMessage(roots)` plus type guards
  - [x] 1.6 Add tests for new message types in `src/shared/messages.test.ts`

- [x] Task 2: Add `bmad.docLibraryPaths` VS Code setting (AC: 2)
  - [x] 2.1 In `package.json` `contributes.configuration.properties`, add `bmad.docLibraryPaths` with type `array`, items `{ type: "string" }`, default `["planning-artifacts", "implementation-artifacts", "docs"]`, description explaining these are relative to workspace root (outputRoot prefix is auto-prepended to paths that don't start with a real directory)
  - [x] 2.2 **Design decision:** Paths in the default array are simple folder names. The extension host resolves them: `planning-artifacts` and `implementation-artifacts` are resolved relative to the configured `bmad.outputRoot` (e.g., `_bmad-output/planning-artifacts`). `docs` is resolved relative to workspace root. Custom paths the user adds are resolved relative to workspace root.

- [x] Task 3: Implement file tree scanning in extension host (AC: 1, 2, 3)
  - [x] 3.1 Create `src/extension/services/file-tree-scanner.ts` — a service that reads configured `bmad.docLibraryPaths` setting, resolves paths (prepending outputRoot for known folders), uses `vscode.workspace.fs.readDirectory()` recursively to build a `FileTreeNode[]` tree
  - [x] 3.2 The scanner filters to only `.md`, `.yaml`, `.yml`, `.json`, `.ts`, `.tsx` files (ignore binary files, images, node_modules, etc.)
  - [x] 3.3 Sort directories first (alphabetically), then files (alphabetically). Put `index.md` first when present in a directory.
  - [x] 3.4 Write unit tests in `src/extension/services/file-tree-scanner.test.ts`

- [x] Task 4: Handle `REQUEST_FILE_TREE` in EditorPanelProvider (AC: 1)
  - [x] 4.1 In `src/extension/providers/editor-panel-provider.ts`, extend `handleLocalMessage()` to handle `REQUEST_FILE_TREE`: instantiate `FileTreeScanner`, call `scan()`, post `FILE_TREE` message back to webview
  - [x] 4.2 Reuse the existing `readAndSendDocumentContent()` method for `REQUEST_DOCUMENT_CONTENT` — no changes needed there

- [x] Task 5: Install markdown rendering dependencies (AC: 7)
  - [x] 5.1 Run `pnpm add react-markdown@^10.1.0 remark-gfm@^4.0.1 rehype-highlight@^7.0.2`
  - [x] 5.2 Verify `pnpm build` still works cleanly with new dependencies

- [x] Task 6: Add document library state to editor panel store (AC: 1, 3, 6)
  - [x] 6.1 In `src/webviews/editor-panel/store.ts`, add `DocumentLibraryState` interface: `{ fileTree: FileTreeNode[] | null; fileTreeLoading: boolean; selectedDocPath: string | null; selectedDocContent: string | null; selectedDocLoading: boolean }`
  - [x] 6.2 Extend `EditorPanelStore` interface with `DocumentLibraryState` and actions: `setFileTree(roots)`, `setFileTreeLoading(loading)`, `setSelectedDoc(path, content)`, `setSelectedDocLoading(loading)`, `clearSelectedDoc()`
  - [x] 6.3 Add initial state to `createInitialEditorPanelState()`
  - [x] 6.4 Add selector hooks: `useFileTree()`, `useFileTreeLoading()`, `useSelectedDocPath()`, `useSelectedDocContent()`, `useSelectedDocLoading()`
  - [x] 6.5 Add store tests in `src/webviews/editor-panel/store.test.ts`

- [x] Task 7: Update message handler for FILE_TREE and DOCUMENT_CONTENT for docs (AC: 1, 3)
  - [x] 7.1 In `src/webviews/editor-panel/hooks/use-message-handler.ts`, add handling for `FILE_TREE` message type: call `setFileTree(message.payload.roots)` and `setFileTreeLoading(false)`
  - [x] 7.2 Update `DOCUMENT_CONTENT` handling: if the current route is `docs` (check store), store the content via `setSelectedDoc(path, content)` instead of `setStoryDetail`. Use the `path` in the DOCUMENT_CONTENT payload to distinguish docs vs story content.
  - [x] 7.3 Add tests to verify message routing

- [x] Task 8: Create MarkdownRenderer component (AC: 4, 5, 6)
  - [x] 8.1 Create `src/webviews/editor-panel/components/markdown-renderer.tsx` — renders markdown content using `react-markdown` with `remarkPlugins={[remarkGfm]}` and `rehypePlugins={[rehypeHighlight]}`
  - [x] 8.2 Style rendered markdown with VS Code theme variables: headings use `--vscode-foreground` with appropriate font sizes, code blocks use `--vscode-textCodeBlock-background`, tables use `--vscode-panel-border` for borders, links use `--vscode-textLink-foreground`, blockquotes use `--vscode-textBlockQuote-background/border`
  - [x] 8.3 For code blocks: add a "Copy" button in the top-right corner of each code block using `components={{ pre: CustomPre }}` override. Use `navigator.clipboard.writeText()` in the webview
  - [x] 8.4 Add `id` attributes to rendered headings (H1-H4) based on slugified heading text, for TOC scroll-to linking
  - [x] 8.5 Create a `TableOfContents` subcomponent that extracts H1-H4 headings from the raw markdown, renders as a collapsible list, and clicking scrolls to the heading via `document.getElementById(slugId).scrollIntoView()`
  - [x] 8.6 Add `data-testid="markdown-renderer"` on root
  - [x] 8.7 Write tests in `src/webviews/editor-panel/components/markdown-renderer.test.tsx`: renders headings, lists, tables, code blocks, GFM features; TOC generates correctly; copy button exists on code blocks

- [x] Task 9: Create FileTree component (AC: 1, 3)
  - [x] 9.1 Create `src/webviews/editor-panel/components/file-tree.tsx` — recursive tree component rendering `FileTreeNode[]`
  - [x] 9.2 Directories are expandable/collapsible (use local state `expandedPaths: Set<string>`). Root directories start expanded by default.
  - [x] 9.3 File items show file name, directories show folder icon and name. Use lucide-react icons: `FileText` for .md files, `FileCode` for code files, `FolderOpen`/`FolderClosed` for directories, `File` for other files
  - [x] 9.4 Clicking a file calls `onFileSelect(path)` callback. Selected file is highlighted with `bg-[var(--vscode-list-activeSelectionBackground)]`
  - [x] 9.5 Ctrl/Cmd/Shift+click on a file opens the raw file in VS Code text editor (use `createOpenDocumentMessage`)
  - [x] 9.6 Tree has `data-testid="file-tree"`, items have `data-testid="file-tree-item-{path}"`
  - [x] 9.7 Write tests in `src/webviews/editor-panel/components/file-tree.test.tsx`: renders tree structure, expand/collapse directories, click selects file, highlights selected file, modifier-click opens raw file

- [x] Task 10: Create DocsView component (AC: 1, 3, 4, 5, 6, 8)
  - [x] 10.1 Create `src/webviews/editor-panel/views/docs-view.tsx` — split-pane layout with FileTree on left and content area on right
  - [x] 10.2 On mount, send `REQUEST_FILE_TREE` message to load the file tree
  - [x] 10.3 When a file is selected in the tree, send `REQUEST_DOCUMENT_CONTENT` with the file path, set `selectedDocLoading(true)`, update the route params with `{ filePath: path }` for breadcrumb display
  - [x] 10.4 Content area: if `.md` file selected, render with `<MarkdownRenderer>` including TOC. If `.yaml`/`.yml`/`.json`/code file, render with syntax-highlighted code view (raw content wrapped in a code block and rendered by MarkdownRenderer as a fenced code block with language tag)
  - [x] 10.5 Show skeleton loading states while file tree and document content are loading
  - [x] 10.6 Show empty state when no file is selected: "Select a document from the tree to view"
  - [x] 10.7 Responsive layout: at `md:` and above, show side-by-side with file tree `w-64` on left and content `flex-1` on right. Below `md:`, file tree becomes a collapsible toggle panel above the content area. Use a hamburger/sidebar toggle button to show/hide
  - [x] 10.8 Add `data-testid="docs-view"` on root, `data-testid="docs-content-area"` on content section
  - [x] 10.9 Write tests in `src/webviews/editor-panel/views/docs-view.test.tsx`: renders file tree and content area, requests file tree on mount, loads document on file select, shows skeleton while loading, shows empty state, responsive layout classes present

- [x] Task 11: Update NavigationShell routing and breadcrumbs (AC: 1, 3)
  - [x] 11.1 In `src/webviews/editor-panel/components/navigation-shell.tsx`, update `renderView()` to handle `'docs'` view: render `<DocsView />` instead of `PlaceholderView`
  - [x] 11.2 Import `DocsView` from `../views/docs-view`
  - [x] 11.3 In `src/webviews/editor-panel/store.ts`, update `buildBreadcrumbs()`: when `view === 'docs'` and `params?.filePath`, generate: `Dashboard / Docs / filename.md`. Extract filename from path. When no filePath, just: `Dashboard / Docs`
  - [x] 11.4 Update `PlaceholderView`: remove `docs` entry from `COMING_SOON_MAP` (the map should now be empty, but keep the component for future views)
  - [x] 11.5 Update navigation-shell tests: docs view route renders DocsView instead of PlaceholderView
  - [x] 11.6 Update store breadcrumb tests for docs view

- [x] Task 12: Update barrel exports (AC: all)
  - [x] 12.1 Add `export { DocsView } from './docs-view'` to `src/webviews/editor-panel/views/index.ts`
  - [x] 12.2 Export `MarkdownRenderer` and `FileTree` from `src/webviews/editor-panel/components/index.ts`
  - [x] 12.3 Export `FileTreeNode` from `src/shared/types/index.ts`

- [x] Task 13: Run validation pipeline (AC: all)
  - [x] 13.1 Run `pnpm typecheck` — all types compile cleanly
  - [x] 13.2 Run `pnpm lint` — no lint errors (run `pnpm format` if needed)
  - [x] 13.3 Run `pnpm test` — all tests pass
  - [x] 13.4 Run `pnpm build` — clean build, webview bundle produces output
  - [x] 13.5 Manual smoke test: open editor panel, click Docs tab, verify file tree loads, click a .md file, verify markdown renders with headings/tables/code blocks, verify TOC, verify copy button on code blocks, verify responsive layout, verify breadcrumbs

## Dev Notes

### Architecture Patterns and Constraints

- **Dual Webview Architecture:** The sidebar (WebviewView) and editor panel (WebviewPanel) share the same bundled JS/CSS. The editor panel is distinguished by `data-view="editor-panel"` on the root div. Both subscribe to the same extension host state via `STATE_UPDATE` messages but have separate Zustand stores. This story only touches the editor panel.

- **New Message Types Required:** Unlike stories (where `StorySummary[]` is sent via `STATE_UPDATE` for lightweight listing), the file tree requires an on-demand request/response pattern because: (a) it can be large and changes infrequently, (b) only the docs view needs it, (c) it includes the `docs/` folder which is outside the existing file watcher scope. Pattern: `REQUEST_FILE_TREE` → `FILE_TREE`.

- **Document Content Reuse:** The existing `REQUEST_DOCUMENT_CONTENT` → `DOCUMENT_CONTENT` message flow (handled in `EditorPanelProvider.readAndSendDocumentContent()`) is reusable for loading individual documents. The extension already reads files, parses frontmatter with gray-matter, and sends content back. No changes needed to this mechanism.

- **DOCUMENT_CONTENT Routing in Message Handler:** Currently, `use-message-handler.ts` routes ALL `DOCUMENT_CONTENT` messages to `setStoryDetail()` via `parseStoryContent()`. This MUST be updated to check the current context: if the user is in the docs view (check `currentRoute.view === 'docs'`), route to `setSelectedDoc()` instead. Use the `path` field in the payload to determine the routing target — if the path matches a story file pattern (e.g., in `implementation-artifacts/`), use `setStoryDetail`; otherwise use `setSelectedDoc`. **Alternatively, the simpler approach:** track whether a doc content request came from docs view by storing a pending request flag in the store. When `selectedDocLoading` is true and a `DOCUMENT_CONTENT` arrives, route to `setSelectedDoc`; when `storyDetailLoading` is true, route to `setStoryDetail`.

- **Navigation is Purely Client-Side:** No URL routing — the editor panel uses Zustand state (`currentRoute`, `breadcrumbs`, `navigationHistory`). `NavigationShell` reads `currentRoute.view` and renders the appropriate view.

- **Skeleton Loading, Not Spinners:** All loading states must use skeleton UI (placeholder shapes), not spinners. The docs view needs skeletons for both the file tree and the content area.

- **State Management:** File tree state and selected document state are added to the editor panel Zustand store. These are NOT view-local state because the message handler needs to update them from outside the component. Filter/expand state for the tree IS view-local (React useState).

### Document Content Routing — Critical Decision

The `DOCUMENT_CONTENT` message is shared between story detail loading and document library loading. To disambiguate:

**Recommended approach:** Use a `pendingDocRequest` field in the store:
```typescript
// When docs view requests content:
setSelectedDocLoading(true); // sets pendingDocRequest = 'docs'
vscodeApi.postMessage(createRequestDocumentContentMessage(path));

// In message handler, check which consumer is waiting:
case ToWebviewType.DOCUMENT_CONTENT: {
  if (get().selectedDocLoading) {
    // Route to docs view consumer
    setSelectedDoc(message.payload.path, message.payload.content);
  } else if (get().storyDetailLoading) {
    // Route to story detail consumer (existing behavior)
    const story = parseStoryContent(message.payload.content, message.payload.path);
    if (story) setStoryDetail(story);
    else setStoryDetailLoading(false);
  }
  break;
}
```

This is the simplest approach that avoids changing the message protocol.

### Markdown Rendering — Styling for VS Code Theme

The markdown renderer must look native in VS Code. Key style mappings:

```css
/* Headings */
h1, h2, h3, h4 { color: var(--vscode-foreground); }
h1 { font-size: 1.5rem; font-weight: 700; border-bottom: 1px solid var(--vscode-panel-border); }
h2 { font-size: 1.25rem; font-weight: 600; }
h3 { font-size: 1.1rem; font-weight: 600; }

/* Code blocks */
pre { background: var(--vscode-textCodeBlock-background); border-radius: 4px; padding: 1rem; overflow-x: auto; }
code { font-family: var(--vscode-editor-font-family); font-size: var(--vscode-editor-font-size); }

/* Tables */
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid var(--vscode-panel-border); padding: 0.5rem; }
th { background: var(--vscode-editor-inactiveSelectionBackground); }

/* Links */
a { color: var(--vscode-textLink-foreground); }
a:hover { color: var(--vscode-textLink-activeForeground); }

/* Blockquotes */
blockquote { border-left: 3px solid var(--vscode-textBlockQuote-border); background: var(--vscode-textBlockQuote-background); padding: 0.5rem 1rem; margin: 0.5rem 0; }

/* Task lists */
input[type="checkbox"] { accent-color: var(--vscode-focusBorder); }
```

Apply these via Tailwind's `@apply` or inline styles in the `components` prop of `react-markdown`, or via a CSS class wrapper. **Recommended:** Use a wrapper `<div className="markdown-content">` with a global stylesheet or Tailwind `@layer` for these styles.

### File Tree Scanner — Path Resolution Logic

The `bmad.docLibraryPaths` setting contains folder names. The extension must resolve them intelligently:

```typescript
// Default: ["planning-artifacts", "implementation-artifacts", "docs"]
// Resolution:
// - "planning-artifacts" → {outputRoot}/planning-artifacts (bmad output subfolder)
// - "implementation-artifacts" → {outputRoot}/implementation-artifacts (bmad output subfolder)
// - "docs" → {workspaceRoot}/docs (top-level folder)

// Logic: check if path exists under outputRoot first. If so, use that.
// If not, check relative to workspace root. If neither exists, skip silently.
```

The scanner should gracefully handle:
- Missing directories (skip, don't error)
- Permission errors (skip, don't error)
- Empty directories (show empty folder node)
- Very deep nesting (cap at 5 levels to prevent runaway)

### highlight.js CSS Theme

`rehype-highlight` uses highlight.js under the hood. It does NOT bundle CSS — you must include a highlight.js theme CSS. **For VS Code integration**, use the `github-dark` theme or, better yet, create minimal highlight.js CSS that maps to VS Code theme variables:

```css
/* Map highlight.js classes to VS Code token colors */
.hljs { color: var(--vscode-editor-foreground); background: var(--vscode-textCodeBlock-background); }
.hljs-keyword { color: var(--vscode-symbolIcon-keywordForeground, #569cd6); }
.hljs-string { color: var(--vscode-symbolIcon-stringForeground, #ce9178); }
.hljs-comment { color: var(--vscode-symbolIcon-commentForeground, #6a9955); font-style: italic; }
.hljs-number { color: var(--vscode-symbolIcon-numberForeground, #b5cea8); }
.hljs-title { color: var(--vscode-symbolIcon-functionForeground, #dcdcaa); }
```

Create this as `src/webviews/editor-panel/styles/hljs-vscode.css` and import it in the DocsView or MarkdownRenderer component. **Important:** Since Tailwind 4 + Vite handles CSS imports, this should just work when imported.

### Project Structure Notes

- **New files in editor-panel:**
  - `src/webviews/editor-panel/views/docs-view.tsx` + `.test.tsx`
  - `src/webviews/editor-panel/components/markdown-renderer.tsx` + `.test.tsx`
  - `src/webviews/editor-panel/components/file-tree.tsx` + `.test.tsx`
  - `src/webviews/editor-panel/styles/hljs-vscode.css`

- **New files in extension host:**
  - `src/extension/services/file-tree-scanner.ts` + `.test.ts`

- **New files in shared:**
  - `src/shared/types/file-tree.ts`

- **Modified files:**
  - `package.json` (dependencies + settings)
  - `src/shared/messages.ts` (new message types)
  - `src/shared/messages.test.ts` (tests for new messages)
  - `src/shared/types/index.ts` (barrel export)
  - `src/extension/providers/editor-panel-provider.ts` (handle REQUEST_FILE_TREE)
  - `src/webviews/editor-panel/store.ts` (doc library state + breadcrumbs)
  - `src/webviews/editor-panel/store.test.ts` (tests)
  - `src/webviews/editor-panel/hooks/use-message-handler.ts` (route FILE_TREE and DOCUMENT_CONTENT)
  - `src/webviews/editor-panel/components/navigation-shell.tsx` (route docs view)
  - `src/webviews/editor-panel/components/navigation-shell.test.tsx` (tests)
  - `src/webviews/editor-panel/components/index.ts` (barrel exports)
  - `src/webviews/editor-panel/views/index.ts` (barrel exports)
  - `src/webviews/editor-panel/views/placeholder-view.tsx` (remove docs entry)

### Previous Story Intelligence (from 5.7)

Key learnings from story 5.7 to apply here:
1. **DO NOT create a separate Zustand store** — extend the existing `useEditorPanelStore` with doc library state
2. **Zustand 5 selector stability:** If creating selectors that filter/map arrays, either memoize outside the component or use `useShallow` from `zustand/shallow` to prevent infinite re-render loops
3. **Build validation:** Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before marking complete
4. **Browser-safe utilities only** — all code in webviews must avoid Node.js APIs. No `fs`, `path`, etc.
5. The callback pattern for `createShiftOpenHandler()` works well for dual-action click handling — use it consistently
6. **DO NOT import from `src/extension/`** — all webview code must stay within the webview boundary
7. Filter state is view-local (React `useState`), not in Zustand store — applies to file tree expand/collapse state
8. The `parseStoryContent()` utility in `src/webviews/editor-panel/utils/` is browser-safe and parses markdown without Node.js APIs — this is the pattern to follow

### Git Intelligence

Recent commits show the project follows a pattern of:
- One commit per story: `feat: 5-7-stories-table-and-kanban-board-views`
- Build system: `pnpm` is used (not npm)
- 630 tests pass at last count
- Stories typically touch 10-30 files (new + modified)
- Validation pipeline: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

### Critical Warnings for Dev Agent

1. **DO NOT try to use Node.js `fs` or `path` in webview code.** The file tree data comes from the extension host via messages. The webview only renders it.
2. **DO NOT bundle highlight.js themes from node_modules.** Create a minimal CSS file mapping hljs classes to VS Code CSS variables. This keeps the bundle small and theme-consistent.
3. **DO NOT forget to update DOCUMENT_CONTENT routing** in `use-message-handler.ts`. Currently all DOCUMENT_CONTENT goes to `setStoryDetail()`. After this story, it must route to `setSelectedDoc()` when the docs view requested it.
4. **DO NOT add file tree to STATE_UPDATE payload.** File tree is requested on-demand via `REQUEST_FILE_TREE`, not sent with every state update. This keeps state updates fast.
5. **DO NOT forget to update `buildBreadcrumbs()`** in `store.ts` to handle `docs` view with `filePath` params.
6. **DO NOT forget the `bmad.docLibraryPaths` VS Code setting** in `package.json`. Without it, the extension doesn't know which directories to scan.
7. **DO NOT use `dangerouslySetInnerHTML`** for markdown rendering. Use `react-markdown` which safely parses markdown to React elements.
8. **DO NOT forget to add the highlight.js CSS.** Without it, `rehype-highlight` adds classes but they have no visual effect. Code blocks will appear unstyled.
9. **Build validation:** Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before marking complete.
10. **react-markdown v10.x** uses ESM only. Make sure Vite handles it correctly (it should since Vite natively supports ESM). If build issues arise with `react-markdown`, check that `vite.config.ts` does not force CJS mode for these packages.

### Library Versions (Latest Stable as of Feb 2026)

| Library | Version | Notes |
|---------|---------|-------|
| react-markdown | ^10.1.0 | ESM-only, works with React 19, uses `children` prop for markdown string |
| remark-gfm | ^4.0.1 | GFM support (tables, task lists, strikethrough). Works with react-markdown 10.x |
| rehype-highlight | ^7.0.2 | Syntax highlighting via lowlight/highlight.js. Bundles 37 common languages |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5, Story 5.8] — Full acceptance criteria and story requirements
- [Source: _bmad-output/planning-artifacts/architecture.md] — Dual webview architecture, message protocol, state management patterns, parsing stack (react-markdown, remark-gfm, rehype-highlight)
- [Source: _bmad-output/planning-artifacts/prd.md#Document Viewing] — FR16-FR20 document viewing requirements
- [Source: _bmad-output/implementation-artifacts/5-7-stories-table-and-kanban-board-views.md] — Previous story: state management patterns, build validation, Zustand 5 stability, responsive layout, test patterns
- [Source: src/shared/messages.ts] — Existing message protocol: REQUEST_DOCUMENT_CONTENT, DOCUMENT_CONTENT, factory functions, type guards
- [Source: src/shared/types/dashboard-state.ts] — DashboardState shape, outputRoot field, storySummaries
- [Source: src/extension/providers/editor-panel-provider.ts] — readAndSendDocumentContent() method, handleLocalMessage() pattern, gray-matter frontmatter parsing
- [Source: src/extension/services/file-watcher.ts] — FileSystemWatcher patterns, watches _bmad-output/**/*.md and **/*.yaml
- [Source: src/webviews/editor-panel/store.ts] — EditorPanelStore, NavigationState, StoryDetailState, buildBreadcrumbs(), selector hooks
- [Source: src/webviews/editor-panel/types.ts] — ViewType (includes 'docs'), ViewRoute, BreadcrumbItem
- [Source: src/webviews/editor-panel/hooks/use-message-handler.ts] — Current DOCUMENT_CONTENT routing (all goes to setStoryDetail)
- [Source: src/webviews/editor-panel/components/navigation-shell.tsx] — Current routing: 'docs' falls through to PlaceholderView default case
- [Source: src/webviews/editor-panel/views/placeholder-view.tsx] — COMING_SOON_MAP with docs entry
- [Source: src/webviews/editor-panel/views/dashboard-view.tsx] — TabBar with Docs tab already navigating to { view: 'docs' }
- [Source: src/webviews/editor-panel/views/story-detail-view.tsx] — On-demand content loading pattern via REQUEST_DOCUMENT_CONTENT
- [Source: src/webviews/shared/utils/document-link.ts] — createDocumentLinkHandler(), createShiftOpenHandler()
- [Source: package.json] — Current dependencies (no react-markdown/remark-gfm/rehype-highlight yet), bmad.outputRoot setting, bmad.defaultClickBehavior setting
- [Source: vite.config.ts] — Single webview entry point, Vite + React + Tailwind 4 build

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

None — all tasks completed without requiring debug sessions.

### Completion Notes List

- All 13 tasks implemented and validated successfully
- TypeScript compilation clean (extension + webview)
- ESLint clean (0 errors, 0 warnings)
- 694 tests passing across 38 test files (up from ~630)
- Production build clean
- DOCUMENT_CONTENT routing uses `selectedDocLoading` flag to disambiguate docs vs story content
- highlight.js CSS mapped to VS Code theme variables (no bundled theme)
- File tree scanner uses `vscode.workspace.fs` for remote development compatibility
- Math.random() removed from render path (skeleton widths are pre-computed constants)
- Task 13.5 (manual smoke test) requires human verification

### File List

**New files:**
- `src/shared/types/file-tree.ts` — FileTreeNode shared type
- `src/extension/services/file-tree-scanner.ts` — Extension host file tree scanning service
- `src/extension/services/file-tree-scanner.test.ts` — File tree scanner tests (Mocha + Sinon)
- `src/webviews/editor-panel/styles/hljs-vscode.css` — highlight.js to VS Code theme variable mapping
- `src/webviews/editor-panel/components/markdown-renderer.tsx` — Markdown renderer with TOC and copy button
- `src/webviews/editor-panel/components/markdown-renderer.test.tsx` — Markdown renderer tests (15 tests)
- `src/webviews/editor-panel/components/file-tree.tsx` — Recursive file tree component
- `src/webviews/editor-panel/components/file-tree.test.tsx` — File tree component tests (11 tests)
- `src/webviews/editor-panel/views/docs-view.tsx` — Document library view with split-pane layout
- `src/webviews/editor-panel/views/docs-view.test.tsx` — Docs view tests (13 tests)

**Modified files:**
- `package.json` — Added dependencies (react-markdown, remark-gfm, rehype-highlight) and bmad.docLibraryPaths setting
- `pnpm-lock.yaml` — Updated lock file
- `src/shared/types/index.ts` — Export file-tree types
- `src/shared/messages.ts` — Added FILE_TREE, REQUEST_FILE_TREE message types with factories/guards
- `src/shared/messages.test.ts` — Tests for new message types
- `src/extension/providers/editor-panel-provider.ts` — Handle REQUEST_FILE_TREE, scanAndSendFileTree()
- `src/extension/providers/message-handler.ts` — Added REQUEST_FILE_TREE to exhaustive switch
- `src/webviews/editor-panel/store.ts` — DocumentLibraryState, actions, selectors, breadcrumbs
- `src/webviews/editor-panel/store.test.ts` — Tests for doc library state and selectors
- `src/webviews/editor-panel/hooks/use-message-handler.ts` — FILE_TREE handling, DOCUMENT_CONTENT routing
- `src/webviews/editor-panel/hooks/use-message-handler.test.ts` — Tests for new message routing
- `src/webviews/editor-panel/components/navigation-shell.tsx` — Route docs view to DocsView
- `src/webviews/editor-panel/components/navigation-shell.test.tsx` — Updated test for docs route
- `src/webviews/editor-panel/components/index.ts` — Export MarkdownRenderer, FileTree
- `src/webviews/editor-panel/views/index.ts` — Export DocsView
- `src/webviews/editor-panel/views/placeholder-view.tsx` — Removed docs from COMING_SOON_MAP
