const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
});

const json = (body: unknown, status = 200, origin: string | null = "*") =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });

const env = (key: string) => Deno.env.get(key) || "";

function cleanText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function outputText(data: any) {
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      if (part?.type === "output_text" && typeof part?.text === "string") {
        return part.text.trim();
      }
    }
  }
  return "";
}

async function translate(text: string, from: "Bengali" | "English", to: "Bengali" | "English") {
  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) {
    const error: any = new Error("translation_not_configured");
    error.code = "translation_not_configured";
    throw error;
  }

  const model = env("OPENAI_TRANSLATION_MODEL") || "gpt-6-luna";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      instructions:
        `Translate reader book reviews faithfully from ${from} to ${to}. ` +
        "Preserve paragraph breaks, names, titles, quotations, Arabic/Islamic terms, tone, and meaning. " +
        "Do not summarize, add commentary, soften criticism, or invent information. " +
        "Return only the translated review.",
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation request failed (${response.status}).`);
  }

  const data = await response.json();
  const translated = outputText(data);
  if (!translated) throw new Error("Translation returned no text.");
  return translated;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405, origin);

  try {
    const body = await req.json();

    // Honeypot: silently accept bot submissions without writing them.
    if (cleanText(body?.website, 200)) return json({ ok: true }, 200, origin);

    const name = cleanText(body?.name, 100);
    const email = cleanText(body?.email, 200);
    const bookId = cleanText(body?.book_id, 160);
    const bookTitle = cleanText(body?.book_title, 300);
    const language = cleanText(body?.language, 10);
    let reviewBn = cleanText(body?.review_bn, 10000);
    let reviewEn = cleanText(body?.review_en, 10000);
    const aiConsent = body?.ai_consent === true;

    if (!name) return json({ ok: false, error: "Name is required." }, 400, origin);
    if (email && !isEmail(email)) return json({ ok: false, error: "Invalid email." }, 400, origin);
    if (!/^[A-Za-z0-9-]{1,160}$/.test(bookId)) return json({ ok: false, error: "Invalid book." }, 400, origin);
    if (!bookTitle) return json({ ok: false, error: "Book title is required." }, 400, origin);
    if (!["bn", "en", "both"].includes(language)) return json({ ok: false, error: "Invalid language." }, 400, origin);

    if (language === "bn") {
      if (reviewBn.length < 2) return json({ ok: false, error: "Bengali review is required." }, 400, origin);
      if (!aiConsent) return json({ ok: false, error: "AI translation consent is required." }, 400, origin);
      reviewEn = await translate(reviewBn, "Bengali", "English");
    } else if (language === "en") {
      if (reviewEn.length < 2) return json({ ok: false, error: "English review is required." }, 400, origin);
      if (!aiConsent) return json({ ok: false, error: "AI translation consent is required." }, 400, origin);
      reviewBn = await translate(reviewEn, "English", "Bengali");
    } else {
      if (reviewBn.length < 2 || reviewEn.length < 2) {
        return json({ ok: false, error: "Both review versions are required." }, 400, origin);
      }
    }

    const sourceLanguage = language === "both" ? "mixed" : language;
    const reviewOriginal = language === "bn" ? reviewBn : language === "en" ? reviewEn : null;

    const supabaseUrl = env("SUPABASE_URL");
    const serviceRole = env("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) throw new Error("Supabase service configuration is missing.");

    const insert = await fetch(`${supabaseUrl}/rest/v1/book_reviews`, {
      method: "POST",
      headers: {
        "apikey": serviceRole,
        "Authorization": `Bearer ${serviceRole}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        book_id: bookId,
        book_title: bookTitle,
        name,
        email: email || null,
        review: reviewBn,
        review_en: reviewEn,
        review_original: reviewOriginal,
        source_language: sourceLanguage,
        source: "website",
        source_url: null,
        external_review_id: null,
        source_date: null,
        approved: false,
        ai_translation_consent: language === "both" ? false : aiConsent,
      }),
    });

    if (!insert.ok) {
      throw new Error(`Review insert failed (${insert.status}): ${await insert.text()}`);
    }

    const rows = await insert.json();
    const id = Array.isArray(rows) && rows[0] ? rows[0].id : null;
    return json({ ok: true, id }, 200, origin);
  } catch (error: any) {
    if (error?.code === "translation_not_configured" || error?.message === "translation_not_configured") {
      return json({ ok: false, code: "translation_not_configured", error: "AI translation is not configured." }, 503, origin);
    }
    return json({ ok: false, error: String(error?.message || error) }, 400, origin);
  }
});
