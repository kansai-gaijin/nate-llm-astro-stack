# microCMS provisioning contract

Use `MICROCMS_SERVICE_DOMAIN` and `MICROCMS_API_KEY` from `.env`. Set
`MICROCMS_MANAGEMENT_API_KEY` when a separate key has API-information permission; otherwise the
checker reuses `MICROCMS_API_KEY`. Never expose either key to browser code or commit `.env`.

Declare required endpoints in `microcms/manifest.json` and place importable schema JSON under
`microcms/schemas/`. Generate fields from the approved dynamic content model, not speculative
future requirements. Keep Markdown fallback entries under `content/dynamic/<endpoint>/`; pages
must read through `src/lib/content/` so switching `CONTENT_SOURCE` does not change components.

The currently documented Management API exposes schema inspection but not API creation. Run
`npm run microcms:check`. If endpoints are absent or management access is unavailable, give the
user the generated schema files and the dashboard steps printed by the command, then pause for
confirmation. Re-run the check after manual import. Never guess an undocumented write endpoint.
