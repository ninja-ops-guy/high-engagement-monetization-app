# Cratefall

Simulated collection game, adapted from the supplied application archive for GitHub Pages.

**[Open the app](https://ninja-ops-guy.github.io/high-engagement-monetization-app/)**

Open crates, collect items, claim daily rewards, explore the pass and simulate gem purchases. Progress and pretend spending persist across reloads.

## Browser-local edition

This is an interactive local demo. Data lives in this browser's IndexedDB (PGlite), with a separate namespace for this app. It survives page refreshes. Clearing site data removes it. Each device/browser has its own workspace. There is no shared server, payment processing, real inbox access, real messaging to other people, or enforceable lease signing. Sample people and financial activity are fictional. External sample photos and fonts require internet access.

The app runs one database tab at a time to prevent competing writes. Close the other tab before opening it again. Local accounts are demo profiles, not a security boundary; avoid real passwords or sensitive personal information.

## Develop and verify

Node.js 22 or newer is required.

```sh
npm ci
npm run dev
```

For the production export and browser tests:

```sh
npm run lint -- --quiet
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

"npm start" serves the exported site at http://127.0.0.1:3000/high-engagement-monetization-app/. The development server uses http://localhost:3000/.

## Deployment

Every push to main runs lint, TypeScript, a production build and end-to-end browser tests. Successful checks deploy out/ through GitHub Actions to Pages. Repository Pages settings must use **GitHub Actions** as the source. next.config.ts sets the repository subpath and trailing slashes for direct links and refreshes.

## Implementation notes

Moved the complete game engine and economy to local storage; serialized operations; fixed repeated shield consumption and incorrect item names in the feed.

The original PostgreSQL schema and domain logic are reused with PGlite in IndexedDB. Former server handlers are explicit browser functions in src/local-api, called through src/lib/local-fetch.ts; they do not make network API calls. Initialization and schema creation are transactional. The browser database assets are copied from the pinned dependency during the build. The first Git commit preserves the source archive before conversion.

The framework was updated to Next.js 16.3.8 after dependency review. Windows static-export RSC filenames are normalized after building for parity with the Linux Pages build.

References: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports), [PGlite browser persistence](https://pglite.dev/docs/filesystems).
