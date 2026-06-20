# Cloudflare Pages deployment

Use Cloudflare Pages Git integration for production and preview deployments. The site is static, so
the Astro Cloudflare adapter is unnecessary unless the project later adds SSR or Pages Functions.

## Connect GitHub

1. Create a fresh GitHub repository for the generated project and push the `main` branch.
2. In Cloudflare, open **Workers & Pages**, create a Pages application, and import that repository.
3. Configure production branch `main`, build command `npm run build`, and output directory `dist`.
4. Add the variables from `.env.example` in the Pages project settings. Store API keys as encrypted
   secrets and keep them out of GitHub.
5. Keep `.github/workflows/ci.yml` enabled so pull requests must pass content, type, build, browser,
   interaction, and accessibility checks. Cloudflare separately creates preview deployments.

Reference: [Cloudflare Astro guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
and [GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/).

## Rebuild after microCMS changes

Skip this section when `CONTENT_SOURCE=markdown`.

1. In the Pages project, open **Settings > Builds** and add a deploy hook for branch `main`.
2. Treat the generated URL as a secret: anyone who has it can trigger a deployment.
3. In microCMS, create a webhook that sends an HTTP `POST` to the deploy-hook URL for content
   publish, update, unpublish, and delete events that affect the website.
4. Trigger a test event and verify a new Pages build appears with the deploy hook as its source.

Reference: [Cloudflare Pages Deploy Hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/).

## Optional direct deployment

For a manual fallback after the Pages project exists:

```text
npm run deploy:cloudflare -- --project-name YOUR_PROJECT_NAME
```

Wrangler is pinned as a development dependency. Git integration remains the normal deployment path.
