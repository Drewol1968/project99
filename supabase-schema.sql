-- PROJECT 99 global daily ranking
-- Run this once in the Supabase SQL Editor.

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_date date not null,
  expression text not null
    check (expression in ('surprise','smile','wink','angry','kiss')),
  score numeric(4,1) not null
    check (score >= 0 and score <= 99.9),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, challenge_date, expression)
);

create index if not exists scores_daily_rank_idx
  on public.scores (challenge_date, expression, score desc);

alter table public.scores enable row level security;

-- The table itself is not directly readable/writable from the app.
revoke all on table public.scores from anon, authenticated;

create or replace function public.submit_daily_score(
  p_challenge_date date,
  p_expression text,
  p_score numeric
)
returns table (
  rank bigint,
  total bigint,
  best_score numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_best numeric;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if p_expression not in ('surprise','smile','wink','angry','kiss') then
    raise exception 'Invalid expression';
  end if;

  if p_score < 0 or p_score > 99.9 then
    raise exception 'Invalid score';
  end if;

  insert into public.scores (
    user_id, challenge_date, expression, score
  )
  values (
    v_user, p_challenge_date, p_expression, round(p_score, 1)
  )
  on conflict (user_id, challenge_date, expression)
  do update set
    score = greatest(public.scores.score, excluded.score),
    updated_at = case
      when excluded.score > public.scores.score then now()
      else public.scores.updated_at
    end;

  select s.score
    into v_best
  from public.scores s
  where s.user_id = v_user
    and s.challenge_date = p_challenge_date
    and s.expression = p_expression;

  return query
  select
    (count(*) filter (where s.score > v_best) + 1)::bigint as rank,
    count(*)::bigint as total,
    v_best as best_score
  from public.scores s
  where s.challenge_date = p_challenge_date
    and s.expression = p_expression;
end;
$$;

revoke all on function public.submit_daily_score(date, text, numeric) from public, anon;
grant execute on function public.submit_daily_score(date, text, numeric) to authenticated;
