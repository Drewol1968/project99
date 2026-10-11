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


export async function getDailyLeaderboard({ challengeDate, expression, limit = 10 }) {
  const supabase = getClient();
  if (!supabase) return { configured: false, rows: [] };

  const user = await ensureAnonymousUser();
  if (!user) throw new Error("Could not create anonymous ranking session");

  const { data, error } = await supabase.rpc("get_daily_leaderboard", {
    p_challenge_date: challengeDate,
    p_expression: expression,
    p_limit: Math.max(1, Math.min(20, Number(limit) || 10))
  });

  if (error) throw error;
  return {
    configured: true,
    rows: (Array.isArray(data) ? data : []).map(row => ({
      rank: Number(row.rank || 0),
      score: Number(row.score || 0),
      isYou: Boolean(row.is_you)
    }))
  };
}


export async function getDailyStats({ challengeDate, expression }) {
  const supabase = getClient();
  if (!supabase) return { configured:false, total:0, bestScore:null };
  const { data, error } = await supabase.rpc("get_daily_stats", {
    p_challenge_date: challengeDate,
    p_expression: expression
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    configured:true,
    total:Number(row?.total || 0),
    bestScore: row?.best_score == null ? null : Number(row.best_score)
  };
}

export async function logAppEvent({ eventType, challengeDate, expression, source = null }) {
  const supabase = getClient();
  if (!supabase) return false;
  const user = await ensureAnonymousUser();
  if (!user) return false;
  const { error } = await supabase.rpc("log_app_event", {
    p_event_type: eventType,
    p_challenge_date: challengeDate,
    p_expression: expression,
    p_source: source
  });
  if (error) {
    console.warn("Event log failed", error);
    return false;
  }
  return true;
}


export async function submitSponsorLead({ company, email, message = "" }) {
  const supabase = getClient();
  if (!supabase) return false;
  const user = await ensureAnonymousUser();
  if (!user) return false;
  const { data, error } = await supabase.rpc("submit_sponsor_lead", {
    p_company: company,
    p_email: email,
    p_message: message
  });
  if (error) throw error;
  return Boolean(data);
}


export async function getPublicBetaMetrics() {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_public_beta_metrics");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    playersToday: Number(row.players_today || 0),
    startsToday: Number(row.starts_today || 0),
    completesToday: Number(row.completes_today || 0),
    sharesToday: Number(row.shares_today || 0),
    completionRate: Number(row.completion_rate || 0)
  };
}

export async function getPublicSourcesToday() {
  const supabase = getClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_public_sources_today");
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(row => ({
    source: String(row.source || "direct"),
    visits: Number(row.visits || 0)
  }));
}
