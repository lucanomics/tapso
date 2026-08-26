-- TAPSO waitlist and support payment schema.
--
-- Apply with the Supabase SQL editor or `supabase db push`.
-- Every table denies anon and authenticated access. Only the service role key,
-- which is held by the Vercel Functions in `apps/web/api`, may read or write.

create extension if not exists "pgcrypto";

-- Waitlist ---------------------------------------------------------------

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null,
  rider_type text not null,
  status text not null default 'registered',
  source text not null default 'web',
  privacy_consent_version text not null,
  privacy_consent_at timestamptz not null,
  confirmation_email_status text not null default 'pending',
  confirmation_sent_at timestamptz,
  confirmation_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint waitlist_entries_status_check
    check (status in ('registered', 'unsubscribed')),
  constraint waitlist_entries_email_status_check
    check (confirmation_email_status in ('pending', 'sent', 'failed')),
  constraint waitlist_entries_email_length_check
    check (char_length(email) between 3 and 254)
);

-- Duplicate protection lives in the database, not in the browser.
create unique index if not exists waitlist_entries_email_normalized_key
  on public.waitlist_entries (email_normalized);

create index if not exists waitlist_entries_confirmation_retry_idx
  on public.waitlist_entries (confirmation_email_status, created_at)
  where confirmation_email_status <> 'sent';

-- Support payments -------------------------------------------------------

create table if not exists public.support_payments (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_payment_id text,
  order_id text not null,
  amount integer not null,
  currency text not null default 'KRW',
  status text not null default 'pending',
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  -- Toss captures at confirm time, so there is no separate authorization
  -- state. `awaiting_deposit` is the real virtual-account (가상계좌) case.
  constraint support_payments_status_check
    check (status in ('pending', 'awaiting_deposit', 'paid', 'cancelled', 'failed', 'refunded')),
  constraint support_payments_amount_check
    check (amount > 0)
);

-- `order_id` is generated server-side and is the idempotency anchor for the
-- whole payment lifecycle.
create unique index if not exists support_payments_order_id_key
  on public.support_payments (order_id);

create unique index if not exists support_payments_provider_payment_id_key
  on public.support_payments (provider, provider_payment_id)
  where provider_payment_id is not null;

-- Provider webhooks retry. Recording the event id makes replay a no-op.
create table if not exists public.support_webhook_events (
  id bigint generated always as identity primary key,
  provider text not null,
  event_id text not null,
  event_type text,
  received_at timestamptz not null default now()
);

create unique index if not exists support_webhook_events_provider_event_key
  on public.support_webhook_events (provider, event_id);

-- Rate limiting ----------------------------------------------------------

-- Serverless instances do not share memory, so the durable limiter is a
-- fixed-window counter in Postgres.
create table if not exists public.rate_limit_hits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);

create index if not exists rate_limit_hits_window_start_idx
  on public.rate_limit_hits (window_start);

-- Atomically increments the current window and reports whether the caller is
-- still under `p_limit`. One round trip, no read-modify-write race.
create or replace function public.consume_rate_limit(
  p_bucket text,
  p_window_seconds integer,
  p_limit integer
)
returns table (allowed boolean, hits integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_start timestamptz;
  v_hits integer;
begin
  if p_window_seconds <= 0 or p_limit <= 0 then
    raise exception 'invalid rate limit parameters';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_hits as r (bucket, window_start, hits)
  values (p_bucket, v_window_start, 1)
  on conflict (bucket, window_start)
    do update set hits = r.hits + 1
  returning r.hits into v_hits;

  return query
    select
      v_hits <= p_limit,
      v_hits,
      greatest(
        1,
        ceil(
          extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - now()))
        )::integer
      );
end;
$$;

-- Housekeeping helper. Schedule it, or call it manually; the limiter stays
-- correct either way because old windows are never read.
create or replace function public.prune_rate_limit_hits(p_older_than interval default interval '1 day')
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.rate_limit_hits where window_start < now() - p_older_than;
$$;

-- Access control ---------------------------------------------------------

alter table public.waitlist_entries enable row level security;
alter table public.support_payments enable row level security;
alter table public.support_webhook_events enable row level security;
alter table public.rate_limit_hits enable row level security;

-- No policies are defined on purpose. With RLS on and no policy, anon and
-- authenticated see nothing. The service role bypasses RLS.
revoke all on public.waitlist_entries from anon, authenticated;
revoke all on public.support_payments from anon, authenticated;
revoke all on public.support_webhook_events from anon, authenticated;
revoke all on public.rate_limit_hits from anon, authenticated;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.prune_rate_limit_hits(interval) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
grant execute on function public.prune_rate_limit_hits(interval) to service_role;
