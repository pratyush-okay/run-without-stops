<!-- seoagent:skill -->

## SEOAgent

This repo uses SEOAgent — a persistent AI SEO agent. Its state lives in `.seoagent/`.

- At session start, read `.agents/skills/seoagent/SKILL.md` — the working contract for all SEO tasks.
- Each session: run `seoagent sync`, then triage `.seoagent/inbox/` for pending actions.
- Run `seoagent ack <id>` after completing each inbox action.
