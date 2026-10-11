import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./ranking-config.js?v=1";

let client = null;

export function isRankingConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

function getClient() {
  if (!isRankingConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }
  return client;
}

async function ensureAnonymousUser() {
  const supabase = getClient();
  if (!supabase) return null;

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user) return sessionData.session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}

export async function submitScoreAndRank({ challengeDate, expression, score }) {
  const supabase = getClient();
  if (!supabase) return { configured: false };

  const user = await ensureAnonymousUser();
  if (!user) throw new Error("Could not create anonymous ranking session");

  const rounded = Math.max(0, Math.min(99.9, Math.round(Number(score) * 10) / 10));

  const { data: existing, error: existingError } = await supabase
    .from("scores")
    .select("id,score")
    .eq("user_id", user.id)
    .eq("challenge_date", challengeDate)
    .eq("expression", expression)
    .maybeSingle();

  if (existingError) throw existingError;

  if (!existing) {
    const { error } = await supabase.from("scores").insert({
      user_id: user.id,
      challenge_date: challengeDate,
      expression,
      score: rounded
    });
    if (error) throw error;
  } else if (rounded > Number(existing.score)) {
    const { error } = await supabase
      .from("scores")
      .update({ score: rounded, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
  }

  const { data: bestRow, error: bestError } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", user.id)
    .eq("challenge_date", challengeDate)
    .eq("expression", expression)
    .single();

  if (bestError) throw bestError;
  const bestScore = Number(bestRow.score);

  const { count: betterCount, error: betterError } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .eq("challenge_date", challengeDate)
    .eq("expression", expression)
    .gt("score", bestScore);

  if (betterError) throw betterError;

  const { count: totalCount, error: totalError } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .eq("challenge_date", challengeDate)
    .eq("expression", expression);

  if (totalError) throw totalError;

  return {
    configured: true,
    rank: Number(betterCount || 0) + 1,
    total: Number(totalCount || 0),
    bestScore
  };
}
