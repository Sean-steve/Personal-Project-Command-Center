# Phase 2 — ChatGPT conversation intake (local-first)

The Command Center does **not** have automatic access to your entire ChatGPT history. It supports an owner-supplied ChatGPT export: `conversations.json` or the ChatGPT export ZIP. The file is read in the browser; raw transcripts are not uploaded to this public repository or stored by the app.

## Workflow

1. Export ChatGPT data using **ChatGPT Settings → Data Controls → Export Data**. Keep the ZIP private.
2. Optional: download the **private** project crosswalk `Sean-steve/Sites/portfolio/chatgpt-initiative-crosswalk.json` from your authorized GitHub account. Do **not** commit its contents into the public Command Center repository.
3. In Command Center → **Settings**, import the crosswalk JSON as a **portfolio import**. It contains `projects` records for verified GitHub mapping candidates, with aliases and related repositories. Existing user-maintained project statuses/notes are not overwritten by import. Entries without a confirmed repository remain pending review in the private crosswalk's `initiatives` array.
4. In **Conversation Discovery**, import the ChatGPT export. Preview proposed topics and requests, then explicitly approve saving redacted summaries. Never assume all conversations have been captured by a partial import.
5. Review suggested matches. A canonical project can have multiple related repositories; do not create a separate project solely because there is a V2 prototype or old repository.
6. For unmatched conversations, first search existing repositories, folders, and project issues. Use **Add to portfolio** only for genuinely untracked work; this does *not* create a GitHub repo.
7. Create development issues after reviewing requirements for scope, privacy, duplicate detection, and acceptance tests. Match confidence and activity links are **not** implementation verification.

## Critical limits

- Import currently uses a bounded sample of messages and extracts a bounded number of summarized requests. A ChatGPT export import is discovery, not a lossless archival transcription or complete requirements extraction.
- Auto-detection is heuristic. Confirm synonyms, old names, repository relationships, and product boundaries manually.
- Export backup files (including discovered requirements and checkpoint exports) can contain private business information. Save them only in a trusted location.
- The public GitHub Pages app is local-first; cloud sync and two-way issue updates are not activated by importing a crosswalk.
- This process does not automatically start Codex or perform background development. Development orchestration comes later, with separate permissions and gates.

Canonical private tracking: `Sean-steve/Sites` Phase 2 GitHub issue.
