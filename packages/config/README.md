# @aisle/config

Shared TypeScript and ESLint configuration.

- `tsconfig/base.json` — strict TypeScript for every package (`strict`, `noUncheckedIndexedAccess`).
- `tsconfig/library.json` — base + DOM + JSX for React packages.
- `tsconfig/nextjs.json` — Next.js app settings.
- `eslint/base` and `eslint/react` — flat configs; import them from each package's `eslint.config.js`.
