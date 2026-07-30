# Internationalization

This feature owns product UI locale selection and translation catalogs.

## Ownership

- `config.ts`: supported locales, fallback behavior, and the locale cookie.
- `I18nProvider.tsx`: Pages Router integration and message delivery.
- `LocaleSwitcher.tsx`: standalone selector for unauthenticated surfaces.
- `useLocaleSwitcher.ts`: locale navigation, persistence, and analytics.
- `messages/*.json`: English source catalog and Simplified Chinese catalog.
- `messages/auto.*.json`: mechanically extracted static JSX text. Prefer
  semantic feature keys for new or substantially edited components.

## Conventions

- English (`en`) is the default locale and keeps the existing unprefixed URLs.
- Simplified Chinese (`zh-CN`) uses Next.js locale-prefixed routes.
- Use semantic keys grouped by product surface. Do not use English copy as a
  key.
- Keep both catalogs structurally identical. The catalog test enforces this.
- Use ICU arguments for interpolation and pluralization. Do not assemble
  translated sentences from fragments.
- Do not translate user data, code, JSON keys, API field names, model names, or
  identity-provider brand names.
- Use `next-intl` formatters for locale-sensitive dates, numbers, lists, and
  relative time in newly migrated code.

The catalogs are loaded at the app shell. Static JSX messages are kept in a
separate generated namespace so they can be split into feature bundles without
changing semantic feature catalogs.
