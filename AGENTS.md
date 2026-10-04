<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:deploy-rule -->
# Deploy: this repo auto-publishes the live site

The live site is served by GitHub Pages from the `master` branch. Every push to
`master` triggers `.github/workflows/deploy.yml`, which runs `next build` (static
export to `out/`) and deploys the result to https://artinamr.github.io/baybymaybe/.

**Rule: whenever you finish a code change to this project, commit it and
`git push` to `master`.** Do not leave the working tree ahead of the deployed
site — the website must reflect the code in the repo at all times.

Before pushing, make sure `npm run build` succeeds locally. If the build fails,
the Pages deploy job fails and the site stops updating until a green build is
pushed. Never commit the `out/` directory (it is gitignored).
<!-- END:deploy-rule -->

# Writing anything for the site: read docs/BLOG-GUIDE.md first

It is binding for blog articles and for all site copy. The hard rules: no em
dashes anywhere on the site (pages, metadata, structured data, feeds), plain
New Zealand English, photographs only from outside sources and only CC0 or
public domain (never the site's own film stills or renders), every fact cited
with the sources listed at the end. `npm run build` runs
`scripts/copy-guard.mjs`, which fails the build (and the deploy) on a breach.
Photos and their licence records live in `content/images.ts`.
