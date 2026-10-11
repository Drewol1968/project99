-- PROJECT 99: enable the Top 10 daily leaderboard.
-- Run once in Supabase SQL Editor.

create or replace function public.get_daily_leaderboard(
  p_challenge_date date,
  p_expression text,
  p_limit integer default 10
)
returns table (
  rank bigint,
  score numeric,
  is_you boolean
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    row_number() over (order by s.score desc, s.updated_at asc)::bigint as rank,
    s.score,
    (s.user_id = auth.uid()) as is_you
  from public.scores s
  where s.challenge_date = p_challenge_date
    and s.expression = p_expression
  order by s.score desc, s.updated_at asc
  limit greatest(1, least(coalesce(p_limit, 10), 20));
$$;

revoke all on function public.get_daily_leaderboard(date, text, integer) from public, anon;
grant execute on function public.get_daily_leaderboard(date, text, integer) to authenticated;
