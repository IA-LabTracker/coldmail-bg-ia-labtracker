/**
 * Rule-based classifier for cold-email replies.
 *
 * Returns one of six intents based on keyword matching against the
 * reply body, in pt-BR and en. Order matters — specific patterns
 * (unsubscribe, ooo) are checked first because they often contain
 * generic words that would otherwise misclassify.
 */

export type ReplyIntent =
  | "positive"
  | "objection"
  | "negative"
  | "ooo"
  | "unsubscribe"
  | "other";

const PATTERNS: Array<{ intent: ReplyIntent; re: RegExp }> = [
  // 1) Unsubscribe — must come before "negative" since it overlaps
  {
    intent: "unsubscribe",
    re: /\b(unsubscribe|remove me|opt[- ]?out|stop sending|please remove from your list|descadastrar|me remova|remover meu (e-?mail|cadastro)|n[aã]o me envi(e|em) mais|sair da lista|cancelar inscri[cç][aã]o)\b/i,
  },
  // 2) OOO / auto-reply — specific markers
  {
    intent: "ooo",
    re: /\b(out of (the )?office|on (vacation|holiday|leave|pto)|i am (currently )?(out|away)|will be back on|automatic(ally)? generated|auto[- ]?reply|automatic reply|do not reply to this email|fora do escrit[oó]rio|estou (de )?f[eé]rias|estou ausente|retorno em|estarei de volta|resposta autom[aá]tica|mensagem autom[aá]tica)\b/i,
  },
  // 3) Negative — clear "no" signals
  {
    intent: "negative",
    re: /\b(not interested|no thanks?|stop contacting|stop emailing|please stop|do not contact|n[aã]o (tenho|temos) interesse|sem interesse|n[aã]o obrigad[oa]|n[aã]o me contate|por favor pare|n[aã]o mande mais)\b/i,
  },
  // 4) Objection — soft no / "later" / price / fit
  {
    intent: "objection",
    re: /\b(too expensive|too costly|out of budget|no budget|not (a )?(good )?fit|wrong (person|contact)|maybe later|reach out (in|next)|not the right time|next quarter|next year|circle back|muito caro|fora do (or[cç]amento|nosso (or[cç]amento|budget))|sem or[cç]amento|n[aã]o [eé] o momento|talvez (depois|mais tarde)|pr[oó]ximo (trimestre|ano|m[eê]s)|me retorne (em|no|pr[oó]ximo)|n[aã]o (sou|somos) a pessoa)\b/i,
  },
  // 5) Positive — explicit interest
  {
    intent: "positive",
    re: /\b(interested|sounds (good|great|interesting)|tell me more|let'?s (chat|talk|schedule|meet)|book a (call|meeting|demo)|happy to (chat|talk|schedule)|when (are you|can we) available|send me (more|info|details)|i'?d love to|count me in|interessad[oa]|tem (meu )?interesse|me conte mais|vamos (conversar|agendar|marcar)|agendar (uma )?(reuni[aã]o|call|demo)|envie mais (informa[cç][oõ]es|detalhes)|adoraria (saber|conversar)|topo|estou dispon[ií]vel|qual (o melhor|seu) hor[aá]rio)\b/i,
  },
];

export function classifyReply(reply: string | null | undefined): ReplyIntent {
  if (!reply) return "other";
  const body = reply.trim();
  if (body.length === 0) return "other";

  for (const { intent, re } of PATTERNS) {
    if (re.test(body)) return intent;
  }
  return "other";
}

export const INTENT_LABELS: Record<ReplyIntent, string> = {
  positive: "Interested",
  objection: "Objection",
  negative: "Not interested",
  ooo: "Out of office",
  unsubscribe: "Unsubscribe",
  other: "Other",
};

export const INTENT_COLORS: Record<ReplyIntent, string> = {
  positive: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  objection: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  negative: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  ooo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  unsubscribe: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  other: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export const INTENT_ORDER: ReplyIntent[] = [
  "positive",
  "objection",
  "negative",
  "ooo",
  "unsubscribe",
  "other",
];
