# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

- **api-server** — Express + Drizzle backend at `/api`. Routes: `profile`, `debts`, `summary`, `payments`. Uses Replit-managed Clerk (`clerkMiddleware` + proxy at `/api/__clerk`). All routes behind `requireAuth`.
- **debts** (Diyoun) — Expo app at `/`. Bilingual EN/AR debt tracker with luxurious emerald + gold theme (Playfair Display serif for hero numbers, Inter for UI, deep-midnight gradient cards with gold accents). Auth via Replit-managed Clerk (Google SSO + email/password using `@clerk/expo` for `useSSO`/`useAuth` and `@clerk/expo/legacy` for `useSignIn`/`useSignUp`). Settings (currency, language, theme) persisted via AsyncStorage; profile + debts + payments synced to PostgreSQL via `/api`. Permanent delete for debts and payments. Each debt and payment carries a date.
- **mockup-sandbox** — Vite preview server for canvas component prototyping.

## Notes

- Replit's Expo Launch is iOS-only; for an Android APK use EAS cloud build:
  1. Sign up free at https://expo.dev and run `npx eas-cli login` (one-time).
  2. From the project root: `pnpm --filter @workspace/debts run build:apk`
     (this runs `eas build -p android --profile preview` defined in `artifacts/debts/eas.json`).
  3. EAS builds in the cloud and returns a downloadable APK URL.
  - Production AAB (Play Store): `pnpm --filter @workspace/debts run build:android`.
  - Android package name is `com.diyoun.app` (set in `app.json`).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
