# microCMS provisioning

Use server-only `MICROCMS_SERVICE_DOMAIN`, `MICROCMS_API_KEY`, and optional
`MICROCMS_MANAGEMENT_API_KEY`. Declare endpoints in `microcms/manifest.json`, schemas under
`microcms/schemas/`, and typed Markdown fallback entries under `content/dynamic/`.

Run `npm run microcms:check`. If the documented Management API cannot create the required endpoint,
give the user the generated schema and printed dashboard steps, pause for confirmation, then rerun
the check. Never invent an undocumented API route or expose credentials to browser code.
