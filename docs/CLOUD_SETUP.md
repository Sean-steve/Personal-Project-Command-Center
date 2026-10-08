# V2: Dedicated cloud setup

The dashboard works locally without a backend. Cloud storage is optional, and **has not been provisioned or activated**. Do not apply this schema to the unrelated existing AGENCY OS database.

## Activation

1. Create a NEW dedicated Supabase project named Project Command Center.
2. In its SQL Editor, execute the migration from supabase/migrations/20261008155000_pcc_v2_snapshots.sql.
3. Verify the public.pcc_snapshots table has RLS enabled, the pcc_save_snapshot RPC exists, and unauthenticated users cannot read your data. Run Supabase security advisors.
4. Under Supabase Authentication > Providers > GitHub, enable GitHub sign-in. Create a GitHub OAuth App and set its callback URL to the one shown by Supabase (normally https://PROJECT-REF.supabase.co/auth/v1/callback).
5. Under Supabase Authentication > URL Configuration, allowlist https://sean-steve.github.io/Personal-Project-Command-Center/ and optionally http://localhost:8000/ for development.
6. Copy only the Supabase project URL and publishable key into Project Command Center > Cloud workspace. NEVER use service_role or sb_secret_ keys in browser code.
7. Sign in with GitHub, click Check cloud, then explicitly Upload local snapshot. The uploaded JSON contains portfolio records, derived conversation summaries and development checkpoints, not raw ChatGPT conversations.
8. On another trusted device, sign in as the same user and Download to browser. You must confirm replacing that browser's local records.

## Integrity and security

- Every row is protected by RLS binding owner_id to auth.uid(). The SQL function is SECURITY INVOKER with optimistic concurrency revision checking. This prevents stale overwrites.
- Upload and download are explicit actions; automatic merge is NOT implemented. On a revision conflict, download both versions and reconcile before uploading.
- No Supabase service role key, OpenAI key or GitHub PAT is committed. The public UI itself is not login-restricted; only database records require authentication.
- Snapshot contents are not end-to-end encrypted; use trusted devices and exclude sensitive secrets and unrelated personal conversations. Browser storage remains accessible to anyone using that browser profile.
- GitHub OAuth login is identity authentication. It does NOT grant repository-read permissions. Private repo discovery continues through the private Sites GitHub Actions workflow.
- The browser imports ChatGPT exports locally from conversations.json or ZIP; there is no automatic full-account ChatGPT history sync.
- A live Supabase migration, OAuth redirect, Pages deployment, and browser end-to-end checks are still required before the cloud feature is considered production-ready.

## Troubleshooting

OAuth redirects: check both the GitHub OAuth callback in Supabase and the dashboard URL allowlist.

Missing table: apply the migration in the correct dedicated project and verify Data API settings, RLS and grants.

Upload conflict: use Check cloud and resolve changes from the other device. Do not discard records blindly.

SDK loading: this prototype dynamically loads a pinned version of supabase-js. Bundle the dependency for production if your network blocks its CDN.

Official guidance:
- https://supabase.com/docs/guides/auth/social-login/auth-github
- https://supabase.com/docs/reference/javascript/auth-signinwithoauth
- https://supabase.com/docs/guides/api/securing-your-api
