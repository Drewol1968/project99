import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./ranking-config.js?v=2";

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

  const { data, error } = await supabase.rpc("submit_daily_score", {
    p_challenge_date: challengeDate,
    p_expression: expression,
    p_score: rounded
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Ranking response was empty");

  return {
    configured: true,
    rank: Number(row.rank || 0),
    total: Number(row.total || 0),
    bestScore: Number(row.best_score || rounded)
  };
}
