import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// --- Types ---
type ItemDecision = "yes" | "no" | "optional";
type RequestAgentItems = { jackets: ItemDecision; pants: ItemDecision; baseLayer: ItemDecision; gloves: ItemDecision; boots: ItemDecision };
type RequestAgentOutput = {
  budget: { currency: string; max: number } | null;
  deliveryDeadline: string | null;
  items: RequestAgentItems;
  preferences: { color: string | null };
  mustHaves: string[];
  niceToHaves: string[];
  clarifyingQuestion: string | null;
};

// --- Helpers ---
function emptyOutput(): RequestAgentOutput {
  return { budget: null, deliveryDeadline: null, items: { jackets: "optional", pants: "optional", baseLayer: "optional", gloves: "optional", boots: "optional" }, preferences: { color: null }, mustHaves: [], niceToHaves: [], clarifyingQuestion: null };
}

function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === "object" && v !== null && !Array.isArray(v); }
function isItemDecision(v: unknown): v is ItemDecision { return v === "yes" || v === "no" || v === "optional"; }
function toStringArray(v: unknown): string[] | undefined { if (!Array.isArray(v)) return undefined; const s = v.filter((x) => typeof x === "string") as string[]; return s.length ? s : undefined; }

function sanitizeOutput(raw: unknown): RequestAgentOutput {
  const out = emptyOutput();
  if (!isRecord(raw)) return out;
  const ir = raw.items;
  if (isRecord(ir)) { if (isItemDecision(ir.jackets)) out.items.jackets = ir.jackets; if (isItemDecision(ir.pants)) out.items.pants = ir.pants; if (isItemDecision(ir.baseLayer)) out.items.baseLayer = ir.baseLayer; if (isItemDecision(ir.gloves)) out.items.gloves = ir.gloves; if (isItemDecision(ir.boots)) out.items.boots = ir.boots; }
  const br = raw.budget;
  if (isRecord(br) && typeof br.currency === "string" && typeof br.max === "number") out.budget = { currency: br.currency, max: br.max };
  if (typeof raw.deliveryDeadline === "string") out.deliveryDeadline = raw.deliveryDeadline;
  else if (typeof raw.deadline === "string") out.deliveryDeadline = raw.deadline;
  const pr = raw.preferences;
  if (isRecord(pr) && typeof pr.color === "string") out.preferences.color = pr.color;
  else if (typeof raw.color === "string") out.preferences.color = raw.color;
  out.mustHaves = toStringArray(raw.mustHaves) ?? [];
  out.niceToHaves = toStringArray(raw.niceToHaves) ?? [];
  if (typeof raw.clarifyingQuestion === "string") out.clarifyingQuestion = raw.clarifyingQuestion;
  return out;
}

function mergeOutputs(prev: RequestAgentOutput | undefined, next: RequestAgentOutput): RequestAgentOutput {
  if (!prev) return next;
  const md = (p: ItemDecision, n: ItemDecision): ItemDecision => { if (n === "yes" || n === "no") return n; if (p === "yes" || p === "no") return p; return "optional"; };
  const uniq = (arr: string[]) => { const seen = new Set<string>(); return arr.filter(s => { const k = s.trim().toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; }); };
  return { budget: next.budget ?? prev.budget, deliveryDeadline: next.deliveryDeadline ?? prev.deliveryDeadline, items: { jackets: md(prev.items.jackets, next.items.jackets), pants: md(prev.items.pants, next.items.pants), baseLayer: md(prev.items.baseLayer, next.items.baseLayer), gloves: md(prev.items.gloves, next.items.gloves), boots: md(prev.items.boots, next.items.boots) }, preferences: { color: next.preferences.color ?? prev.preferences.color }, mustHaves: uniq([...prev.mustHaves, ...next.mustHaves]), niceToHaves: uniq([...prev.niceToHaves, ...next.niceToHaves]), clarifyingQuestion: next.clarifyingQuestion };
}

const SKI_KEYWORDS = ["ski","skiing","ski trip","ski outfit","ski jacket","ski pants","snow","snowy","resort","slopes","powder","base layer","baselayer","shell","insulated","waterproof","gore-tex","goggles","thermal","snowboard","snowboarding","gloves","boots","helmet"];
const ALLOWED_ITEMS = ["jackets", "pants", "base layer", "gloves", "boots"];
const ITEM_KEYWORDS = ["jacket","jackets","pants","pant","base layer","base-layer","baselayer","glove","gloves","boot","boots"];

function looksSkiRelated(req: string, prev?: string[]): boolean {
  const t = [req, ...(prev?.slice(-20) ?? [])].join("\n").toLowerCase();
  return SKI_KEYWORDS.some(kw => t.includes(kw));
}

function wantsFullSuit(t: string): boolean {
  const l = t.toLowerCase();
  return ["full suit","full outfit","full set","complete outfit","ski suit","ski-suit","full ski outfit","full ski set"].some(p => l.includes(p));
}

function anyItemYes(items: RequestAgentItems): boolean {
  return Object.values(items).some(v => v === "yes");
}

function hasAlphaSize(t: string): boolean {
  const l = t.toLowerCase();
  return /\b(xs|s|m|l|xl|xxl|xxxl)\b/.test(l) || /\b(extra\s*small|small|medium|large|extra\s*large)\b/.test(l);
}

function hasBootSize(mustHaves: string[], t: string): boolean {
  const l = `${mustHaves.join("\n")}\n${t}`.toLowerCase();
  if (l.includes("shoe size") || l.includes("boot size")) return true;
  return /\b(boot|boots)\b/.test(l) && (/\b(us|eu|uk)\b/.test(l) || /\b\d{1,2}(\.\d)?\b/.test(l));
}

function hasAnyItems(mustHaves: string[], niceToHaves: string[], t: string): boolean {
  const l = `${mustHaves.join("\n")}\n${niceToHaves.join("\n")}\n${t}`.toLowerCase();
  return ITEM_KEYWORDS.some(kw => l.includes(kw));
}

function userWantsBestGuess(t: string): boolean {
  const l = t.toLowerCase();
  return ["best guess","do your best","stop asking","don't ask","no more questions","just pick","use your judgment","use your judgement"].some(p => l.includes(p));
}

function applyItemInference(output: RequestAgentOutput, t: string): RequestAgentOutput {
  const text = `${output.mustHaves.join("\n")}\n${output.niceToHaves.join("\n")}\n${t}`.toLowerCase();
  const next = { ...output.items };
  const setNo = (k: keyof RequestAgentItems, re: RegExp) => { if (re.test(text)) next[k] = "no"; };
  const setYes = (k: keyof RequestAgentItems, re: RegExp) => { if (next[k] !== "yes" && re.test(text)) next[k] = "yes"; };
  setNo("boots", /\b(no|not|don't|without|exclude)\b.{0,20}\bboots?\b/);
  setNo("gloves", /\b(no|not|don't|without|exclude)\b.{0,20}\bgloves?\b/);
  setNo("baseLayer", /\b(no|not|don't|without|exclude)\b.{0,20}\b(base[-\s]?layer|baselayer)\b/);
  setNo("pants", /\b(no|not|don't|without|exclude)\b.{0,20}\bpants?\b/);
  setNo("jackets", /\b(no|not|don't|without|exclude)\b.{0,20}\bjackets?\b/);
  setYes("boots", /\bboots?\b/);
  setYes("gloves", /\bgloves?\b/);
  setYes("baseLayer", /\b(base[-\s]?layer|baselayer)\b/);
  setYes("pants", /\bpants?\b/);
  setYes("jackets", /\bjackets?\b/);
  return { ...output, items: next };
}

function ensureFullSuitItems(output: RequestAgentOutput, t: string): RequestAgentOutput {
  if (!wantsFullSuit(t)) return output;
  return { ...output, items: { jackets: "yes", pants: "yes", baseLayer: "yes", gloves: "yes", boots: "yes" } };
}

type MissingKey = "scope" | "items" | "budget" | "deliveryDeadline" | "sizes" | "bootSize";

function missingKeys(output: RequestAgentOutput, req: string, prev?: string[]): MissingKey[] {
  const t = [req, ...(prev ?? [])].join("\n");
  const ski = looksSkiRelated(req, prev);
  const full = wantsFullSuit(t);
  const missing: MissingKey[] = [];
  if (!ski) { missing.push("scope"); return missing; }
  if (!full && !anyItemYes(output.items) && !hasAnyItems(output.mustHaves, output.niceToHaves, t)) missing.push("items");
  if (!output.budget) missing.push("budget");
  if (!output.deliveryDeadline) missing.push("deliveryDeadline");
  if (!hasAlphaSize(t)) missing.push("sizes");
  if (output.items.boots === "yes" && !hasBootSize(output.mustHaves, t)) missing.push("bootSize");
  return missing;
}

function generateQuestion(missing: MissingKey[], t: string): string {
  if (userWantsBestGuess(t)) return "";
  if (missing.includes("scope")) return "Are you shopping for a ski outfit (jacket/pants/base layer/gloves/boots)?";
  if (missing.includes("items")) return `Which items do you want to shop for? Options: ${ALLOWED_ITEMS.join(", ")}.`;
  if (missing.includes("budget")) return "What's your total budget (and currency)?";
  if (missing.includes("deliveryDeadline")) return "What delivery date do you need (or when is your trip)?";
  if (missing.includes("bootSize")) return "What boot size do you wear (US/EU/UK)?";
  if (missing.includes("sizes")) return "What size do you wear for jackets and pants (e.g., M, or waist/inseam like 32x30)?";
  return "";
}

function isoDateToday(): string { return new Date().toISOString().slice(0, 10); }

const SYSTEM_PROMPT = (todayISO: string) => [
  "You are RequestAgent, a normalization layer for a SKI OUTFIT shopping assistant.",
  "Scope: ski outfits only.",
  `The ONLY items: ${ALLOWED_ITEMS.join(", ")}.`,
  "If user asks for full suit/outfit, set all items to yes.",
  `Today is ${todayISO}.`,
  "Output MUST be a single JSON object with keys: budget, deliveryDeadline, items, preferences, mustHaves, niceToHaves, clarifyingQuestion.",
  "items must have: jackets, pants, baseLayer, gloves, boots (each yes/no/optional).",
  "preferences must have: color (string or null).",
  "Ask at most ONE clarifyingQuestion. Otherwise null.",
  "Do not invent details.",
].join("\n");

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userRequest, context } = await req.json();
    if (!userRequest || typeof userRequest !== "string") {
      return new Response(JSON.stringify({ error: "Missing userRequest" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const prevOutput = context?.previousOutput ? sanitizeOutput(context.previousOutput) : undefined;
    const prevMessages: string[] = context?.previousMessages ?? [];
    const todayISO = isoDateToday();
    const conversationText = [userRequest, ...prevMessages.slice(-20)].join("\n");
    const bestGuess = userWantsBestGuess(conversationText);

    console.log("[request-agent] Processing:", userRequest.slice(0, 100));

    // Call Lovable AI (Gemini)
    const aiResponse = await fetch("https://iqbsjfvmutibnnxvvxyi.supabase.co/functions/v1/ai-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT(todayISO) },
          {
            role: "user",
            content: `Normalize this user request into JSON. Only use info present.\n\n${JSON.stringify({
              userRequest,
              previousOutput: prevOutput,
              previousMessages: prevMessages.slice(-10),
              scope: { skiRelated: looksSkiRelated(userRequest, prevMessages), fullSuitRequested: wantsFullSuit(conversationText) },
            })}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    const aiData = await aiResponse.json();
    console.log("[request-agent] AI response status:", aiResponse.status);

    let parsed: unknown;
    try {
      const content = aiData.choices?.[0]?.message?.content ?? aiData.content ?? "{}";
      // Strip markdown code fences if present
      const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[request-agent] Failed to parse AI response:", JSON.stringify(aiData).slice(0, 500));
      parsed = {};
    }

    let out = mergeOutputs(prevOutput, ensureFullSuitItems(applyItemInference(sanitizeOutput(parsed), conversationText), conversationText));

    // Deterministic clarifying questions
    const outNoQ = { ...out, clarifyingQuestion: null };
    const miss = missingKeys(outNoQ, userRequest, prevMessages);

    if (miss.length === 0 || bestGuess) {
      return new Response(JSON.stringify(outNoQ), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const q = generateQuestion(miss, conversationText).trim();
    const final = { ...outNoQ, clarifyingQuestion: q || null };
    console.log("[request-agent] Clarifying:", q);
    return new Response(JSON.stringify(final), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error("[request-agent] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
