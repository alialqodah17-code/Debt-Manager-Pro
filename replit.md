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
- **debts** (Diyoun) — Expo app at `/`. Bilingual EN/AR debt tracker with luxurious emerald + gold theme. Auth via Replit-managed Clerk (Google SSO + email/password using `@clerk/expo` for `useSSO`/`useAuth` and `@clerk/expo/legacy` for `useSignIn`/`useSignUp`). Settings (currency, language, theme) persisted via AsyncStorage; profile synced to backend. Permanent delete for debts and payments.
- **mockup-sandbox** — Vite preview server for canvas component prototyping.

## Notes

- APK export is not supported by Replit's Expo Launch (iOS only). User can build APK locally with `eas build --platform android` if they configure EAS.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
