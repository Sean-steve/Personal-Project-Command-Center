-- Project Command Center V2: private multi-device portfolio snapshot.
-- Execute in a NEW dedicated Supabase project, not a client's or unrelated project.
-- This migration does not contain credentials or user data.

create table if not exists public.pcc_snapshots (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null default '{}'::jsonb,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint pcc_document_object check (jsonb_typeof(document) = 'object')
);

create index if not exists pcc_snapshots_updated_at_idx
  on public.pcc_snapshots (updated_at desc);

alter table public.pcc_snapshots enable row level security;
alter table public.pcc_snapshots force row level security;

revoke all on public.pcc_snapshots from public, anon;
grant select, insert, update, delete on public.pcc_snapshots to authenticated;

drop policy if exists "pcc_select_own" on public.pcc_snapshots;
create policy "pcc_select_own" on public.pcc_snapshots
  for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "pcc_insert_own" on public.pcc_snapshots;
create policy "pcc_insert_own" on public.pcc_snapshots
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "pcc_update_own" on public.pcc_snapshots;
create policy "pcc_update_own" on public.pcc_snapshots
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "pcc_delete_own" on public.pcc_snapshots;
create policy "pcc_delete_own" on public.pcc_snapshots
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Revision-checked saving prevents one browser tab/device from silently
-- overwriting a more recent server snapshot. RPC executes as caller,
-- without SECURITY DEFINER / RLS bypass.
create or replace function public.pcc_save_snapshot(
  p_document jsonb,
  p_expected_revision bigint
) returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
  v_revision bigint;
begin
  if v_id is null then
    raise exception 'Authentication required';
  end if;
  if p_document is null or jsonb_typeof(p_document) <> 'object' then
    raise exception 'Document must be a JSON object';
  end if;
  -- Limit saved JSON to 3MB: avoids unexpectedly uploading raw transcripts.
  if octet_length(p_document::text) > 3145728 then
    raise exception 'Portfolio snapshot exceeds 3MB limit';
  end if;

  if p_expected_revision is null then
    insert into public.pcc_snapshots(owner_id, document)
      values (v_id, p_document)
      on conflict (owner_id) do nothing
      returning revision into v_revision;
    if v_revision is null then
      raise exception 'Snapshot already exists; download and merge before uploading';
    end if;
  else
    update public.pcc_snapshots
       set document = p_document, revision = revision + 1, updated_at = now()
     where owner_id = v_id and revision = p_expected_revision
     returning revision into v_revision;
    if v_revision is null then
      raise exception 'Snapshot conflict. Another device changed the portfolio; reload first';
    end if;
  end if;
  return v_revision;
end;
$$;

revoke all on function public.pcc_save_snapshot(jsonb, bigint) from public, anon;
grant execute on function public.pcc_save_snapshot(jsonb, bigint) to authenticated;

comment on table public.pcc_snapshots is 'Per-user project portfolio, discoveries and checkpoints; never raw ChatGPT transcripts.';
comment on function public.pcc_save_snapshot(jsonb, bigint) is 'RLS-bound optimistic concurrency update; denies stale overwrites.';
