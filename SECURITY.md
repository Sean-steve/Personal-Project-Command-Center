# Security and privacy

The public GitHub Pages application is a static **client-side** manager. No GitHub secret, password, personal access token or private account inventory belongs in this repository or GitHub Pages deployment.

- Public repos are discovered through GitHub's anonymous REST API.
- Private repo metadata may be imported manually from the private hub but is processed only in your browser, and is persisted in that browser's localStorage after consent. Do not import confidential data on shared computers.
- Dashboard edits are local and **do not write to GitHub**; use linked GitHub Issues as the durable team-wide source of truth.
- Private background discovery runs in the private Sites repository, not this public app. Metadata-only read token must be an Actions secret in that private repository.
- Imported/exported JSON files may contain private data. Never commit or publicly upload them.
- For a multi-device confidential dashboard, add a private authenticated backend rather than placing access tokens in browser code.

Please report security problems privately to the repository owner.
