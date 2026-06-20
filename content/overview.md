---
siteName: Example Site
referenceUrl: https://example.com
locale: ja
pages:
  - path: /
    file: home.md
    title: Home
microcms:
  required: false
  endpoints: []
  env:
    serviceDomain: MICROCMS_SERVICE_DOMAIN
    contentApiKey: MICROCMS_API_KEY
    managementApiKey: MICROCMS_MANAGEMENT_API_KEY
---

# Website overview

Replace this file with the website purpose, audience, design constraints, and sitemap.

The `referenceUrl` is the visual reference. Each `pages` entry maps a route to a Markdown file
under `content/pages/`. Only routes listed here are required.
