/**
 * - Input format: { userRequest: string, context?: { userId?: string, locale?: string, previousMessages?: string[] } }
 * - Output format: { budget?: { currency: string, max: number }, deadline?: string, preferences?: Record<string, string | number | boolean>, mustHaves?: string[], niceToHaves?: string[], clarifyingQuestions?: string[] }
 * - Communicates with: searchAgent.ts (sends normalized request), (user) (asks clarifying questions if needed)
 */

import OpenAI from "openai";
import { stdin as processStdin, stdout as processStdout } from "node:process";
import { createInterface } from "node:readline/promises";

export type RequestAgentInput = {
  userRequest: string;
  context?: {
    userId?: string;
    locale?: string;
    /**
     * The current date (ISO 8601 date, e.g. "2026-02-07") for resolving relative deadlines.
     * If not provided, the agent will compute it at runtime.
     */
    todayISO?: string;
    /**
     * Structured output from the prior turn (used to carry state across turns).
     * This is in-memory state managed by the conversation runner (or a caller).
     */
    previousOutput?: RequestAgentOutput;
    previousMessages?: string[];
  };
};

/**
 * This agent is used in a running conversation, so it must return a stable JSON shape
 * and at most one clarifying question per turn.
 */
export type ItemDecision = "yes" | "no" | "optional";

export type RequestAgentItems = {
  jackets: ItemDecision;
  pants: ItemDecision;
  baseLayer: ItemDecision;
  gloves: ItemDecision;
  boots: ItemDecision;
};

export type RequestAgentOutput = {
  budget: { currency: string; max: number } | null;
  deliveryDeadline: string | null;
  /**
   * Per-item decision signals. This is the canonical “what to shop for” output.
   */
  items: RequestAgentItems;
  preferences: {
    /**
     * User's preferred color or color palette for the ski outfit.
     * Examples: "black", "navy", "bright colors", "neutral", "white/black".
     */
    color: string | null;
  };
  mustHaves: string[];
  niceToHaves: string[];
  /**
   * Ask exactly ONE question when something essential is missing.
   * Otherwise, return null.
   */
  clarifyingQuestion: string | null;
};

export type RequestAgentOptions = {
  /**
   * Overrides the OpenAI model used for request normalization.
   * Defaults to `process.env.REQUEST_AGENT_MODEL ?? "gpt-4o-mini"`.
   */
  model?: string;
  /**
   * When true, includes more verbose context to the model.
   * Keep false by default to reduce prompt size / cost.
   */
  includePreviousMessages?: boolean;
};

const DEFAULT_MODEL = process.env.REQUEST_AGENT_MODEL ?? "gpt-4o-mini";

const SKI_RELATED_KEYWORDS = [
  // core
  "ski",
  "skiing",
  "ski trip",
  "ski outfit",
  "ski jacket",
  "ski pants",
  "ski bib",
  "ski bibs",
  "snow",
  "snowy",
  "resort",
  "slopes",
  "powder",
  "apres",
  // gear/clothing
  "base layer",
  "baselayer",
  "mid layer",
  "shell",
  "insulated",
  "waterproof",
  "gore-tex",
  "goretex",
  "helmet",
  "goggles",
  "mittens",
  "gloves",
  "ski socks",
  "thermal",
  // close-adjacent winter sports (treated as ski-related, but we can clarify)
  "snowboard",
  "snowboarding",
] as const;

const BOOT_RELATED_KEYWORDS = [
  "boot",
  "boots",
  "ski boot",
  "ski boots",
] as const;

function looksSkiRelated(userRequest: string, previousMessages?: string[]): boolean {
  const combined = [
    userRequest,
    ...(Array.isArray(previousMessages) ? previousMessages.slice(-20) : []),
  ]
    .join("\n")
    .toLowerCase();

  return SKI_RELATED_KEYWORDS.some((kw) => combined.includes(kw));
}

function mentionsBoots(userRequest: string, previousMessages?: string[]): boolean {
  const combined = [
    userRequest,
    ...(Array.isArray(previousMessages) ? previousMessages.slice(-20) : []),
  ]
    .join("\n")
    .toLowerCase();
  return BOOT_RELATED_KEYWORDS.some((kw) => combined.includes(kw));
}

function requireOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "Missing OPENAI_API_KEY. Set it in backend/.env (see backend/.env.example).",
    );
  }
  return key;
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function isoDateToday(): string {
  // Intentionally uses runtime environment timezone via Date() and truncates to date.
  // This is "good enough" for shopping deadline interpretation in this project.
  return new Date().toISOString().slice(0, 10);
}

function isItemDecision(value: unknown): value is ItemDecision {
  return value === "yes" || value === "no" || value === "optional";
}

function mergeOutputs(
  prev: RequestAgentOutput | undefined,
  next: RequestAgentOutput,
): RequestAgentOutput {
  if (!prev) return next;

  const mergeDecision = (prevD: ItemDecision, nextD: ItemDecision): ItemDecision => {
    // "yes/no" beats "optional". If both are "yes/no", prefer the newer value.
    if (nextD === "yes" || nextD === "no") return nextD;
    if (prevD === "yes" || prevD === "no") return prevD;
    return "optional";
  };

  const uniq = (arr: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of arr) {
      const key = s.trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    return out;
  };

  return {
    budget: next.budget ?? prev.budget,
    deliveryDeadline: next.deliveryDeadline ?? prev.deliveryDeadline,
    items: {
      jackets: mergeDecision(prev.items.jackets, next.items.jackets),
      pants: mergeDecision(prev.items.pants, next.items.pants),
      baseLayer: mergeDecision(prev.items.baseLayer, next.items.baseLayer),
      gloves: mergeDecision(prev.items.gloves, next.items.gloves),
      boots: mergeDecision(prev.items.boots, next.items.boots),
    },
    preferences: { color: next.preferences.color ?? prev.preferences.color },
    mustHaves: uniq([...prev.mustHaves, ...next.mustHaves]),
    niceToHaves: uniq([...prev.niceToHaves, ...next.niceToHaves]),
    // Turn-specific: do not carry forward.
    clarifyingQuestion: next.clarifyingQuestion,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((x) => typeof x === "string") as string[];
  return strings.length ? strings : undefined;
}

function combinedConversationText(input: RequestAgentInput): string {
  const msgs = input.context?.previousMessages ?? [];
  return [input.userRequest, ...(Array.isArray(msgs) ? msgs.slice(-20) : [])].join("\n");
}

function conversationHasAnyAlphaSize(conversationText: string): boolean {
  const text = conversationText.toLowerCase();
  return (
    /\b(xs|s|m|l|xl|xxl|xxxl)\b/.test(text) ||
    /\b(extra\s*small|small|medium|large|extra\s*large)\b/.test(text)
  );
}

function hasRequiredSkiSizes(mustHaves: string[], conversationText: string): boolean {
  const text = `${mustHaves.join("\n")}\n${conversationText}`.toLowerCase();

  // Top size signals (jacket/top).
  const hasTopSize =
    text.includes("jacket size") ||
    text.includes("top size") ||
    text.includes("upper size") ||
    /\b(xs|s|m|l|xl|xxl|xxxl)\b/.test(text);

  // Bottom size signals (pants waist + inseam).
  const hasBottomAlphaSize =
    text.includes("pants size") ||
    text.includes("bottom size") ||
    (text.includes("pants") && /\b(xs|s|m|l|xl|xxl|xxxl)\b/.test(text)) ||
    (text.includes("pants") && /\b(extra\s*small|small|medium|large|extra\s*large)\b/.test(text));

  const hasWaist =
    text.includes("waist") ||
    /\bw\s?\d{2}\b/.test(text) ||
    /\b\d{2}\s?waist\b/.test(text);

  const hasInseam =
    text.includes("inseam") ||
    /\bl\s?\d{2}\b/.test(text) ||
    /\b\d{2}\s?inseam\b/.test(text);

  // Common combined patterns like 32x30 or 32/30.
  const hasCombined = /\b\d{2}\s?[x/]\s?\d{2}\b/.test(text);

  return hasTopSize && (hasBottomAlphaSize || hasCombined || (hasWaist && hasInseam));
}

function hasBootOrShoeSizeMentioned(mustHaves: string[], conversationText: string): boolean {
  const text = `${mustHaves.join("\n")}\n${conversationText}`.toLowerCase();
  // Look for explicit "shoe/boot size" phrasing, or common sizing markers near boot/shoe.
  if (text.includes("shoe size") || text.includes("boot size")) return true;
  const hasSizingNumber = /\b\d{1,2}(\.\d)?\b/.test(text);
  const hasSizingSystem = /\b(us|eu|uk)\b/.test(text);
  const mentionsFootwear = /\b(boot|boots|shoe|shoes)\b/.test(text);
  return mentionsFootwear && (hasSizingSystem || hasSizingNumber);
}

type MissingKey =
  | "scope"
  | "items"
  | "budget"
  | "deliveryDeadline"
  | "sizes"
  | "bootSize";

const ALLOWED_ITEM_OPTIONS = ["jackets", "pants", "base layer", "gloves", "boots"] as const;

const ALLOWED_ITEM_KEYWORDS = [
  // jackets
  "jacket",
  "jackets",
  // pants
  "pants",
  "pant",
  // base layer
  "base layer",
  "base-layer",
  "baselayer",
  // gloves
  "glove",
  "gloves",
  // boots
  "boot",
  "boots",
] as const;

function anyItemYes(items: RequestAgentItems): boolean {
  return (
    items.jackets === "yes" ||
    items.pants === "yes" ||
    items.baseLayer === "yes" ||
    items.gloves === "yes" ||
    items.boots === "yes"
  );
}

function wantsFullSuit(conversationText: string): boolean {
  const text = conversationText.toLowerCase();
  return (
    text.includes("full suit") ||
    text.includes("full outfit") ||
    text.includes("full set") ||
    text.includes("complete outfit") ||
    // Common phrasing for "everything"
    text.includes("ski suit") ||
    text.includes("ski-suit")
  );
}

function applyItemInference(output: RequestAgentOutput, conversationText: string): RequestAgentOutput {
  const text = `${output.mustHaves.join("\n")}\n${output.niceToHaves.join("\n")}\n${conversationText}`.toLowerCase();

  const next: RequestAgentItems = { ...output.items };

  const setYesIf = (key: keyof RequestAgentItems, re: RegExp) => {
    if (next[key] !== "yes" && re.test(text)) next[key] = "yes";
  };
  const setNoIf = (key: keyof RequestAgentItems, re: RegExp) => {
    if (re.test(text)) next[key] = "no";
  };

  // Explicit negatives.
  setNoIf("boots", /\b(no|not|don't|do not|without|exclude)\b.{0,20}\bboots?\b/);
  setNoIf("gloves", /\b(no|not|don't|do not|without|exclude)\b.{0,20}\bgloves?\b/);
  setNoIf("baseLayer", /\b(no|not|don't|do not|without|exclude)\b.{0,20}\b(base[-\s]?layer|baselayer)\b/);
  setNoIf("pants", /\b(no|not|don't|do not|without|exclude)\b.{0,20}\bpants?\b/);
  setNoIf("jackets", /\b(no|not|don't|do not|without|exclude)\b.{0,20}\bjackets?\b/);

  // Positives.
  setYesIf("boots", /\bboots?\b/);
  setYesIf("gloves", /\bgloves?\b/);
  setYesIf("baseLayer", /\b(base[-\s]?layer|baselayer)\b/);
  setYesIf("pants", /\bpants?\b/);
  setYesIf("jackets", /\bjackets?\b/);

  return { ...output, items: next };
}

function ensureFullSuitItems(output: RequestAgentOutput, conversationText: string): RequestAgentOutput {
  if (!wantsFullSuit(conversationText)) return output;
  const withItems: RequestAgentOutput = {
    ...output,
    items: {
      jackets: "yes",
      pants: "yes",
      baseLayer: "yes",
      gloves: "yes",
      boots: "yes",
    },
  };
  const text = output.mustHaves.join("\n").toLowerCase();
  const itemAlreadyPresent = (item: (typeof ALLOWED_ITEM_OPTIONS)[number]) => {
    switch (item) {
      case "jackets":
        return /\bjacket(s)?\b/.test(text);
      case "pants":
        return /\bpant(s)?\b/.test(text);
      case "base layer":
        return /base[-\s]?layer|baselayer/.test(text);
      case "gloves":
        return /\bglove(s)?\b/.test(text);
      case "boots":
        return /\bboot(s)?\b/.test(text);
      default:
        return false;
    }
  };
  const mustHaves = [...output.mustHaves];
  for (const item of ALLOWED_ITEM_OPTIONS) {
    if (!itemAlreadyPresent(item)) mustHaves.push(item);
  }
  return { ...withItems, mustHaves };
}

function hasAnyRequestedItems(
  mustHaves: string[],
  niceToHaves: string[],
  conversationText: string,
): boolean {
  const text = `${mustHaves.join("\n")}\n${niceToHaves.join("\n")}\n${conversationText}`.toLowerCase();
  return ALLOWED_ITEM_KEYWORDS.some((kw) => text.includes(kw));
}

function missingKeysForReadiness(
  output: RequestAgentOutput,
  input: RequestAgentInput,
): MissingKey[] {
  const conversationText = combinedConversationText(input);
  const skiScoped = looksSkiRelated(input.userRequest, input.context?.previousMessages);
  const fullSuit = wantsFullSuit(conversationText);
  const hasAnyAlphaSize = conversationHasAnyAlphaSize(conversationText);
  const needBootSize = output.items.boots === "yes";

  const missing: MissingKey[] = [];
  if (!skiScoped) missing.push("scope");
  if (skiScoped) {
    if (
      !fullSuit &&
      !anyItemYes(output.items) &&
      !hasAnyRequestedItems(output.mustHaves, output.niceToHaves, conversationText)
    )
      missing.push("items");
    if (output.budget === null) missing.push("budget");
    if (output.deliveryDeadline === null) missing.push("deliveryDeadline");
    // If the user has given a single alpha size (e.g. "Medium"), that's good enough—don't keep asking.
    if (!hasAnyAlphaSize && !hasRequiredSkiSizes(output.mustHaves, conversationText))
      missing.push("sizes");
    if (needBootSize && !hasBootOrShoeSizeMentioned(output.mustHaves, conversationText))
      missing.push("bootSize");
  }
  return missing;
}

function userWantsBestGuess(conversationText: string): boolean {
  const text = conversationText.toLowerCase();
  return (
    text.includes("best guess") ||
    text.includes("do your best") ||
    text.includes("stop asking") ||
    text.includes("don't ask") ||
    text.includes("no more questions") ||
    text.includes("just pick") ||
    text.includes("use your judgment") ||
    text.includes("use your judgement")
  );
}

function generateOneClarifyingQuestion(params: {
  input: RequestAgentInput;
  missing: MissingKey[];
}): string {
  const { input, missing } = params;
  const conversationText = combinedConversationText(input);

  if (userWantsBestGuess(conversationText)) return "";

  // Deterministic, non-harassing questions only.
  if (missing.includes("scope")) return "Are you shopping for a ski outfit (jacket/pants/base layer/gloves/boots)?";
  if (missing.includes("items"))
    return `Which items do you want to shop for? Options: ${ALLOWED_ITEM_OPTIONS.join(", ")}.`;
  if (missing.includes("budget")) return "What’s your total budget (and currency)?";
  if (missing.includes("deliveryDeadline")) return "What delivery date do you need (or when is your trip)?";
  if (missing.includes("bootSize")) return "What boot size do you wear (US/EU/UK)?";
  if (missing.includes("sizes")) return "What size do you wear for jackets and pants (e.g., M, or waist/inseam like 32x30)?";
  return "";
}

function emptyOutput(): RequestAgentOutput {
  return {
    budget: null,
    deliveryDeadline: null,
    items: {
      jackets: "optional",
      pants: "optional",
      baseLayer: "optional",
      gloves: "optional",
      boots: "optional",
    },
    preferences: { color: null },
    mustHaves: [],
    niceToHaves: [],
    clarifyingQuestion: null,
  };
}

function sanitizeOutput(raw: unknown): RequestAgentOutput {
  const out = emptyOutput();
  if (!isRecord(raw)) return out;

  const itemsRaw = raw.items;
  if (isRecord(itemsRaw)) {
    const jackets = itemsRaw.jackets;
    const pants = itemsRaw.pants;
    const baseLayer = itemsRaw.baseLayer;
    const gloves = itemsRaw.gloves;
    const boots = itemsRaw.boots;
    if (isItemDecision(jackets)) out.items.jackets = jackets;
    if (isItemDecision(pants)) out.items.pants = pants;
    if (isItemDecision(baseLayer)) out.items.baseLayer = baseLayer;
    if (isItemDecision(gloves)) out.items.gloves = gloves;
    if (isItemDecision(boots)) out.items.boots = boots;
  }

  const budgetRaw = raw.budget;
  const budget =
    isRecord(budgetRaw) &&
    typeof budgetRaw.currency === "string" &&
    typeof budgetRaw.max === "number"
      ? { currency: budgetRaw.currency, max: budgetRaw.max }
      : undefined;

  const deliveryDeadline =
    typeof raw.deliveryDeadline === "string"
      ? raw.deliveryDeadline
      : typeof raw.deadline === "string"
        ? raw.deadline
        : undefined;

  const preferencesRaw = raw.preferences;
  const color =
    isRecord(preferencesRaw) && typeof preferencesRaw.color === "string"
      ? preferencesRaw.color
      : typeof raw.color === "string"
        ? raw.color
        : undefined;

  const mustHaves = toStringArray(raw.mustHaves) ?? [];
  const niceToHaves = toStringArray(raw.niceToHaves) ?? [];

  const clarifyingQuestion =
    typeof raw.clarifyingQuestion === "string"
      ? raw.clarifyingQuestion
      : Array.isArray(raw.clarifyingQuestions) && typeof raw.clarifyingQuestions[0] === "string"
        ? (raw.clarifyingQuestions[0] as string)
        : null;

  if (budget) out.budget = budget;
  if (deliveryDeadline) out.deliveryDeadline = deliveryDeadline;
  if (color) out.preferences.color = color;
  out.mustHaves = mustHaves;
  out.niceToHaves = niceToHaves;
  out.clarifyingQuestion = clarifyingQuestion;

  return out;
}

function requestAgentOutputJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "budget",
      "deliveryDeadline",
      "items",
      "preferences",
      "mustHaves",
      "niceToHaves",
      "clarifyingQuestion",
    ],
    properties: {
      budget: {
        anyOf: [
          { type: "null" },
          {
            type: "object",
            additionalProperties: false,
            required: ["currency", "max"],
            properties: {
              currency: {
                type: "string",
                description: "ISO 4217 code or common currency label (e.g., USD, EUR).",
              },
              max: { type: "number", description: "Maximum total budget as a number." },
            },
          },
        ],
      },
      deliveryDeadline: {
        anyOf: [
          { type: "null" },
          {
            type: "string",
            description:
              "Desired delivery deadline / arrival date. Prefer ISO 8601 if a date is provided.",
          },
        ],
      },
      items: {
        type: "object",
        additionalProperties: false,
        required: ["jackets", "pants", "baseLayer", "gloves", "boots"],
        properties: {
          jackets: { type: "string", enum: ["yes", "no", "optional"] },
          pants: { type: "string", enum: ["yes", "no", "optional"] },
          baseLayer: { type: "string", enum: ["yes", "no", "optional"] },
          gloves: { type: "string", enum: ["yes", "no", "optional"] },
          boots: { type: "string", enum: ["yes", "no", "optional"] },
        },
        description:
          "For each allowed item, output yes/no/optional. If user asks for a full suit/outfit, set all to yes.",
      },
      preferences: {
        type: "object",
        additionalProperties: false,
        required: ["color"],
        properties: {
          color: {
            anyOf: [
              { type: "null" },
              {
                type: "string",
                description: "Preferred color or color palette for the ski outfit.",
              },
            ],
          },
        },
      },
      mustHaves: {
        type: "array",
        items: { type: "string" },
        description:
          "Hard constraints for the ski outfit. Include sizing here if provided (e.g., 'jacket size M', 'waist 32').",
      },
      niceToHaves: {
        type: "array",
        items: { type: "string" },
        description: "Soft preferences for the ski outfit.",
      },
      clarifyingQuestion: {
        anyOf: [
          { type: "null" },
          {
            type: "string",
            description:
              "Ask exactly ONE question when essential info is missing. Otherwise null.",
          },
        ],
      },
    },
  } as const;
}

/**
 * Normalizes a free-form user prompt into a structured request.
 *
 * Returns:
 * - a `NormalizedRequest` with extracted fields, and/or
 * - `clarifyingQuestions` when the request is missing key info.
 */
export async function normalizeUserRequest(
  input: RequestAgentInput,
  options: RequestAgentOptions = {},
): Promise<RequestAgentOutput> {
  const userRequest = input.userRequest?.trim() ?? "";
  const context = input.context ?? {};
  const previousMessagesForScopeCheck = context.previousMessages;
  const todayISO = typeof context.todayISO === "string" && context.todayISO.trim()
    ? context.todayISO.trim()
    : isoDateToday();
  const previousOutput =
    context.previousOutput && typeof context.previousOutput === "object"
      ? sanitizeOutput(context.previousOutput as unknown)
      : undefined;
  const conversationText = combinedConversationText(input);
  const fullSuit = wantsFullSuit(conversationText);
  const bestGuess = userWantsBestGuess(conversationText);

  const client = new OpenAI({ apiKey: requireOpenAIKey() });
  const model = options.model ?? DEFAULT_MODEL;

  const previousMessages =
    options.includePreviousMessages && Array.isArray(context.previousMessages)
      ? context.previousMessages.slice(-10)
      : undefined;

  const systemInstructions = [
    "You are RequestAgent, a normalization layer for a SKI OUTFIT shopping assistant.",
    "Scope: ski outfits only (skiing / snow conditions / ski trip clothing).",
    `The ONLY items you should consider are: ${ALLOWED_ITEM_OPTIONS.join(", ")}.`,
    "If the user asks for a 'full suit' / full outfit, interpret it as wanting ALL of those items.",
    "If the user is not asking for a full suit and the items are unclear, ask which items they want (choose from the allowed list).",
    "You MUST set items.{jackets,pants,baseLayer,gloves,boots} to one of: yes | no | optional every turn.",
    "If the user asks for a full suit/outfit, set all items to yes.",
    `Today is ${todayISO}. Use this to resolve relative deadlines into ISO dates when possible.`,
    "This is a multi-turn conversation. If prior structured values are provided, carry them forward unless the user changes them.",
    "Output MUST be a single JSON object that matches the provided schema exactly.",
    "Only include these fields in the JSON: budget, deliveryDeadline, items, preferences.color, mustHaves, niceToHaves, clarifyingQuestion.",
    "Ask at most ONE clarifyingQuestion per turn (string) when essential info is missing. Otherwise set clarifyingQuestion to null.",
    "Try to gather as much concrete shopping information as possible, because the system will browse for these items later.",
    "Before deciding you are done, think through what's still missing for shopping (items, budget, delivery deadline, sizes, boot size if boots/shoes are included).",
    "Do not invent details. Populate only what the user actually provided.",
    "If the request isn't about skiing/snow, set clarifyingQuestion to a single question that steers the user to a ski outfit request.",
    "Ski sizing and functional constraints should go into mustHaves as plain strings (e.g., 'jacket size M', 'waist 32', 'insulated jacket', 'bib pants').",
    "If color is mentioned, set preferences.color (otherwise null).",
  ].join("\n");

  const userPayload = {
    userRequest,
    scope: {
      skiRelated: looksSkiRelated(userRequest, previousMessagesForScopeCheck),
      bootsMentioned: mentionsBoots(userRequest, previousMessagesForScopeCheck),
      fullSuitRequested: fullSuit,
    },
    context: {
      userId: context.userId,
      locale: context.locale,
      todayISO,
      previousMessages,
    },
    previousOutput,
    allowedItems: ALLOWED_ITEM_OPTIONS,
  };

  try {
    const response = await client.responses.create({
      model,
      input: [
        { role: "system", content: systemInstructions },
        {
          role: "user",
          content: [
            "Normalize this user request into JSON.",
            "Only use information present in the request/context; do not guess.",
            "",
            JSON.stringify(userPayload),
          ].join("\n"),
        },
      ],
      temperature: 0.2,
      text: {
        format: {
          type: "json_schema",
          name: "normalized_request",
          strict: true,
          schema: requestAgentOutputJsonSchema(),
        },
      },
    });

    // When using `text.format`, the SDK exposes the JSON as plain text.
    // We still parse+sanitize so our runtime output remains stable.
    const parsed = JSON.parse(response.output_text) as unknown;
    const out = mergeOutputs(
      previousOutput,
      ensureFullSuitItems(
        applyItemInference(sanitizeOutput(parsed), conversationText),
        conversationText,
      ),
    );
    // Never accept model-generated clarifying questions; keep them deterministic.
    const outNoModelQuestion = { ...out, clarifyingQuestion: null };
    const missing = missingKeysForReadiness(outNoModelQuestion, input);
    if (missing.length === 0 || bestGuess) return outNoModelQuestion;
    const q = normalizeWhitespace(generateOneClarifyingQuestion({ input, missing }));
    return { ...outNoModelQuestion, clarifyingQuestion: q || null };
  } catch (err) {
    // Fallback: if Structured Outputs fails (e.g., model mismatch), retry with JSON mode.
    // Also provides a softer failure mode for transient API issues.
    if (err instanceof OpenAI.APIError) {
      // eslint-disable-next-line no-console
      console.warn(
        `requestAgent OpenAI APIError (${err.status ?? "unknown"}): ${err.message}`,
      );
    }

    const fallback = await client.responses.create({
      model,
      input: [
        { role: "system", content: systemInstructions },
        {
          role: "user",
          content: [
            "Return ONLY valid JSON (no markdown) with EXACT keys: budget, deliveryDeadline, preferences, mustHaves, niceToHaves, clarifyingQuestion.",
            "Ask at most ONE clarifyingQuestion (string) if needed; otherwise set clarifyingQuestion to null.",
            "",
            JSON.stringify(userPayload),
          ].join("\n"),
        },
      ],
      temperature: 0.2,
      text: { format: { type: "json_object" } },
    });

    const parsed = JSON.parse(fallback.output_text) as unknown;
    const out = mergeOutputs(
      previousOutput,
      ensureFullSuitItems(
        applyItemInference(sanitizeOutput(parsed), conversationText),
        conversationText,
      ),
    );
    const outNoModelQuestion = { ...out, clarifyingQuestion: null };
    const missing = missingKeysForReadiness(outNoModelQuestion, input);
    if (missing.length === 0 || bestGuess) return outNoModelQuestion;
    const q = normalizeWhitespace(generateOneClarifyingQuestion({ input, missing }));
    return { ...outNoModelQuestion, clarifyingQuestion: q || null };
  }
}

export type ConversationRunnerOptions = {
  /**
   * Limits turns to avoid infinite loops during testing.
   * Defaults to 20.
   */
  maxTurns?: number;
  /**
   * Used for the first prompt if provided (otherwise asks user).
   */
  initialUserRequest?: string;
  /**
   * Passed through to `normalizeUserRequest`.
   */
  model?: string;
  /**
   * Defaults to true for the runner (it is a conversation).
   */
  includePreviousMessages?: boolean;
  /**
   * Optional context metadata.
   */
  userId?: string;
  locale?: string;
  /**
   * Debug-only: print the internal JSON after each turn.
   * Defaults to false (never show JSON to the user).
   */
  debugPrintJson?: boolean;
};

/**
 * Interactive CLI runner to simulate a running conversation.
 *
 * - Maintains `context.previousMessages`
 * - Calls `normalizeUserRequest()` each turn
 * - If `clarifyingQuestion` is returned, asks it as the next prompt
 * - When the agent has everything it needs (clarifyingQuestion === null),
 *   it tells the user it's starting the search and ends the conversation.
 *
 * Run:
 *   npx tsx src/requestAgent.ts
 */
export async function runRequestAgentConversation(
  opts: ConversationRunnerOptions = {},
): Promise<RequestAgentOutput> {
  const rl = createInterface({ input: processStdin, output: processStdout });
  const previousMessages: string[] = [];
  let lastOutput: RequestAgentOutput | undefined;
  const conversationTodayISO = isoDateToday();

  const includePreviousMessages = opts.includePreviousMessages ?? true;
  const maxTurns = opts.maxTurns ?? 20;
  const debugPrintJson = opts.debugPrintJson ?? false;

  try {
    let nextUserText =
      typeof opts.initialUserRequest === "string" && opts.initialUserRequest.trim()
        ? opts.initialUserRequest.trim()
        : await rl.question("User: ");

    for (let turn = 1; turn <= maxTurns; turn += 1) {
      previousMessages.push(`User: ${nextUserText}`);

      const result = await normalizeUserRequest(
        {
          userRequest: nextUserText,
          context: {
            userId: opts.userId,
            locale: opts.locale,
            todayISO: conversationTodayISO,
            previousOutput: lastOutput,
            previousMessages,
          },
        },
        {
          model: opts.model,
          includePreviousMessages,
        },
      );
      lastOutput = result;

      if (debugPrintJson) {
        // eslint-disable-next-line no-console
        console.log("[debug] internal JSON:");
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(result, null, 2));
      }

      if (result.clarifyingQuestion) {
        // Conversation material: ask the single clarifying question.
        // eslint-disable-next-line no-console
        console.log(`Assistant: ${result.clarifyingQuestion}`);
        previousMessages.push(`Assistant: ${result.clarifyingQuestion}`);
        nextUserText = await rl.question("User: ");
        continue;
      }

      // Conversation end: do NOT show JSON to user.
      const finalAssistantMessage =
        "Perfect — I have everything I need. I’m now searching for the items.";
      // eslint-disable-next-line no-console
      console.log(`Assistant: ${finalAssistantMessage}`);
      previousMessages.push(`Assistant: ${finalAssistantMessage}`);
      return result;
    }

    // eslint-disable-next-line no-console
    console.log(`Reached maxTurns=${maxTurns}. Exiting.`);
    return emptyOutput();
  } finally {
    rl.close();
  }
}

// Allow running this file directly via `tsx`.
// (tsconfig uses CommonJS; `require.main === module` is appropriate here.)
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (require.main === module) {
  runRequestAgentConversation()
    .then((finalJson) => {
      // Intentionally do not print JSON by default.
      // If you want it, run with debugPrintJson=true by importing the function in a small script.
      void finalJson;
    })
    .catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  });
}

