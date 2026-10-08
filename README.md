# Project Command Center

A personal portfolio-management web app for tracking GitHub repositories, local project ideas, milestones and blockers.

This repository contains **public application source only**. Private repository inventories and tracking issues remain in the private `Sean-steve/Sites` hub.

## Capabilities
- Repository discovery from the public GitHub API, with refresh and browser-side automatic polling.
- Dashboard, portfolio table, drag-and-drop board, roadmap and analytics.
- Project details, priority, status, milestones, blockers and notes.
- Local additions for projects not yet in GitHub.
- JSON import/export, including optional import of the private register (processed locally in your browser).
- Works as a static site (GitHub Pages) with no shared backend secrets.

## Privacy
The public site does not contain your private repository inventory or GitHub credentials. By default project notes stay in the browser's local storage. This is an MVP, **not** cross-device cloud storage or an authenticated private dashboard; avoid sensitive project details on shared devices.

## Auto-sync
The private repository-sync GitHub Actions workflow lives in [Sites](https://github.com/Sean-steve/Sites). It runs on a schedule and creates private triage issues; its workflow requires a one-time optional read-only token to discover newly created private repositories. The public dashboard can discover newly created **public** repositories directly through the GitHub API.

## Run
Serve the folder (ES modules need an HTTP origin): `python3 -m http.server 8000`, then open `http://localhost:8000`.

## Deploy
GitHub Actions includes a Pages workflow. Enable GitHub Pages with **Settings → Pages → Source: GitHub Actions**. Do not publish the private hub's inventory to this Pages site.

## User guide

1. **Overview:** review the active work limit and the attention queue.
2. **All projects:** search, filter, open and edit project details; each row shows the latest GitHub push when available.
3. **Kanban:** drag projects across lanes. A fourth active project is rejected until another is paused or completed.
4. **Roadmap:** give a project a target date and milestone to place it on the roadmap.
5. **Automations:** refresh public repositories, then review newly discovered ones in Inbox.
6. **Settings:** import a portfolio JSON export or make a local backup.

### Relationship to the private portfolio hub

The private Sites register and issue trackers remain the durable GitHub source of truth. This web UI has no authenticated backend; project edits are saved to browser storage and do **not** update GitHub issues or GitHub Projects boards. To reconcile edits across computers, export and import a backup, or update the linked GitHub tracker issue directly. Never commit exported private backups to this public repository.

The public app auto-discovers public repositories only. Private repositories can be brought into the browser using JSON import from the private hub. For true automatic private-project rendering across devices, the future release needs an authenticated server-side GitHub integration.

### Status

- Application code: committed to `main`.
- CI and GitHub Pages workflows: committed.
- Live GitHub Pages hosting: requires repository-level Pages activation if not already enabled.
- [Implementation milestone and backlog](https://github.com/Sean-steve/Personal-Project-Command-Center/issues/1).



## V2 — implemented modules (2026-10-08)

The original dashboard remains available. V2 adds three workspaces:

1. **Conversation discovery** — Import a ChatGPT conversations.json or export ZIP. The importer processes user messages locally, groups project topics, matches known repositories, flags topics with no repository match, and extracts conversation requirements with explicit unverified status. Review/approve summaries before saving. You can register unlinked ideas into the portfolio, manually link topics to projects, and record evidence links. The "Search GitHub" action suggests relevant public PRs/issues/commits, but **does not claim implementation**.
2. **Development checkpoints** — Record completed work, current branch, blockers, next action, self-reported tests and supporting commit/PR URLs. Checkpoints remain local until you explicitly enable and use cloud backups.
3. **Cloud workspace** — Optional dedicated Supabase GitHub OAuth authentication, owner-scoped RLS, revision-checked snapshot upload/download, and manual cross-device restore. See [Cloud setup](docs/CLOUD_SETUP.md).

### How to find missing ChatGPT ideas

Export ChatGPT data from Settings > Data Controls > Export Data, and import the ZIP or its conversations.json under **Conversation discovery**. Select **Save findings** after reviewing the topic summaries. Missing-repository findings can become Inbox projects in one click. The importer saves *only derived project summaries*, not raw transcripts, and never sends the conversation file to a server.

### Current evidence limits

Finding a matching repository/PR/commit does not prove feature implementation. The system keeps requests **unverified** until manually linked to supporting evidence. Full code/test verification needs a future authorized repository-analysis service. Automatic ongoing access to ChatGPT conversations is not available through the normal OpenAI API.

### Activation and privacy

- GitHub Pages publishes all static UI modules (index.html, app.js, data.js, discovery.js, evidence.js, v2.js, cloud.js, cloud-ui.js and styles.css).
- Discovery, checkpoints, and portfolio edits are local-first and available without Supabase.
- Cloud requires **your own new dedicated** Supabase database and GitHub OAuth provider configuration; the code/migration are committed but no live cloud deployment has been activated or tested.
- Public GitHub repository auto-refresh and the separate private Sites workflow remain active paths. Private repository data is not exposed in this public repository.
- JSON findings/checkpoint exports are PRIVATE documents; do not commit them to GitHub.
- Run validation using npm run check. GitHub Actions workflow runs still need to be confirmed.

### Unfinished V2 capabilities

End-to-end deployed cloud sign-in, fully automatic private GitHub API access from the UI, GitHub Projects two-way synchronization, ChatGPT live history ingestion, automated source-code coverage audits, and local VS Code agent capture are not implemented yet. They are tracked separately; do not treat them as completed.
