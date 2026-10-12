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

async function verifyTurnstile(token: string, expectedAction: string) {
  const secret = env("TURNSTILE_SECRET");
  if (!secret) {
    const error: any = new Error("turnstile_not_configured");
    error.code = "turnstile_not_configured";
    throw error;
  }
  if (!token) {
    const error: any = new Error("turnstile_required");
    error.code = "turnstile_required";
    throw error;
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!response.ok) {
    const error: any = new Error("turnstile_verification_failed");
    error.code = "turnstile_verification_failed";
    throw error;
  }

  const result = await response.json();
  const hostname = String(result?.hostname || "").toLowerCase();
  const allowedHost = hostname === "profahmadali.com" || hostname === "www.profahmadali.com";
  const actionMatches = String(result?.action || "") === expectedAction;

  if (result?.success !== true || !allowedHost || !actionMatches) {
    const error: any = new Error("turnstile_verification_failed");
    error.code = "turnstile_verification_failed";
    throw error;
  }
}

async function translate(text: string, from: "Bengali" | "English", to: "Bengali" | "English") {
  const apiKey = env("GEMINI_API_KEY");
  if (!apiKey) {
    const error: any = new Error("translation_not_configured");
    error.code = "translation_not_configured";
    throw error;
  }

  const model = env("GEMINI_TRANSLATION_MODEL") || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text:
              `Translate this reader review faithfully from ${from} to ${to}. The review concerns Islamic scholarship, Islamic law, Qur'anic studies, Hadith, theology, da'wah, Arabic terminology, or related religious subjects. ` +
              "Treat Islamic terminology with special care. Verify each Islamic term against its immediate context before choosing an equivalent. " +
              "Preserve established Arabic/Islamic technical terms when an English or Bengali rendering could distort the meaning; use a clear conventional translation where one is well established. " +
              "Preserve Arabic script, Qur'anic quotations, hadith quotations, du'a, names, book titles, madhhab names, honorifics, transliterations, and technical fiqh/usul terms accurately. " +
              "Do not invent, correct, normalize, or add Qur'an verse numbers, hadith references, legal rulings, theological claims, citations, or scholarly attributions that are not present in the source. " +
              "Do not reinterpret or 'improve' the author's religious position. Preserve nuance, degree of certainty, praise, criticism, and respectful tone. " +
              "If a religious term is genuinely ambiguous, prefer retaining the transliterated term rather than guessing. " +
              "Preserve paragraph breaks and quotations. Do not summarize, omit, add commentary, soften criticism, or invent information. " +
              "Return only the translated review, with no translator notes or preface."
          }]
        },
        contents: [{
          role: "user",
          parts: [{ text }]
        }],
        generationConfig: {
          temperature: 0.2
        }
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini translation request failed (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const translated = (Array.isArray(data?.candidates?.[0]?.content?.parts)
    ? data.candidates[0].content.parts
        .filter((part: any) => typeof part?.text === "string")
        .map((part: any) => part.text)
        .join("")
        .trim()
    : "");

  if (!translated) throw new Error("Translation returned no text.");
  return translated;
}

async function insertReview(row: Record<string, unknown>) {
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
    body: JSON.stringify(row),
  });

  if (!insert.ok) {
    throw new Error(`Review insert failed (${insert.status}): ${await insert.text()}`);
  }

  const rows = await insert.json();
  return Array.isArray(rows) && rows[0] ? rows[0].id : null;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char] || char));
}

function languageLabel(value: string) {
  if (value === "bn") return "Bengali";
  if (value === "en") return "English";
  if (value === "mixed") return "Bengali + English";
  return value || "Unknown";
}

async function sendReviewNotification(review: {
  id: unknown;
  bookTitle: string;
  reviewerName: string;
  reviewerEmail: string;
  sourceLanguage: string;
  reviewBn: string;
  reviewEn: string;
}) {
  const apiKey = env("BREVO_API_KEY");
  if (!apiKey) {
    console.warn("Review notification skipped: BREVO_API_KEY is not configured.");
    return;
  }

  const toEmail = env("REVIEW_NOTIFICATION_TO") || "admin@profahmadali.com";
  const fromEmail = env("REVIEW_NOTIFICATION_FROM") || "contact@profahmadali.com";
  const fromName = env("REVIEW_NOTIFICATION_FROM_NAME") || "Dr. Ahmad Ali Website";
  const reviewId = String(review.id ?? "").trim();

  const submittedAt = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const sectionsText: string[] = [];
  const reviewHtml: string[] = [];

  if (review.sourceLanguage === "bn") {
    sectionsText.push(`Original Bengali review:\n\n${review.reviewBn}`);
    reviewHtml.push(`<h3 style="margin:22px 0 8px">Original Bengali review</h3><div dir="auto" style="white-space:pre-wrap;line-height:1.7">${escapeHtml(review.reviewBn)}</div>`);
  } else if (review.sourceLanguage === "en") {
    sectionsText.push(`Original English review:\n\n${review.reviewEn}`);
    reviewHtml.push(`<h3 style="margin:22px 0 8px">Original English review</h3><div dir="auto" style="white-space:pre-wrap;line-height:1.7">${escapeHtml(review.reviewEn)}</div>`);
  } else {
    if (review.reviewBn) {
      sectionsText.push(`Bengali review:\n\n${review.reviewBn}`);
      reviewHtml.push(`<h3 style="margin:22px 0 8px">Bengali review</h3><div dir="auto" style="white-space:pre-wrap;line-height:1.7">${escapeHtml(review.reviewBn)}</div>`);
    }
    if (review.reviewEn) {
      sectionsText.push(`English review:\n\n${review.reviewEn}`);
      reviewHtml.push(`<h3 style="margin:22px 0 8px">English review</h3><div dir="auto" style="white-space:pre-wrap;line-height:1.7">${escapeHtml(review.reviewEn)}</div>`);
    }
  }

  const metaText = [
    `Book: ${review.bookTitle}`,
    `Reviewer: ${review.reviewerName}`,
    `Reviewer email: ${review.reviewerEmail || "Not provided"}`,
    `Language: ${languageLabel(review.sourceLanguage)}`,
    `Submitted: ${submittedAt} (Dhaka time)`,
    "Status: Awaiting approval",
    reviewId ? `Review ID: ${reviewId}` : "",
  ].filter(Boolean).join("\n");

  const textContent =
    `A new reader review has been submitted on profahmadali.com.\n\n${metaText}\n\n` +
    sectionsText.join("\n\n------------------------------\n\n");

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;color:#1f2d29;max-width:720px;margin:0 auto">
      <h2 style="margin:0 0 8px">New reader review submitted</h2>
      <p style="margin:0 0 20px;color:#66736e">A new review on profahmadali.com is awaiting approval.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr><td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top">Book</td><td style="padding:6px 0">${escapeHtml(review.bookTitle)}</td></tr>
        <tr><td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top">Reviewer</td><td style="padding:6px 0">${escapeHtml(review.reviewerName)}</td></tr>
        <tr><td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top">Email</td><td style="padding:6px 0">${escapeHtml(review.reviewerEmail || "Not provided")}</td></tr>
        <tr><td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top">Language</td><td style="padding:6px 0">${escapeHtml(languageLabel(review.sourceLanguage))}</td></tr>
        <tr><td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top">Submitted</td><td style="padding:6px 0">${escapeHtml(submittedAt)} (Dhaka time)</td></tr>
        <tr><td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top">Status</td><td style="padding:6px 0">Awaiting approval</td></tr>
        ${reviewId ? `<tr><td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top">Review ID</td><td style="padding:6px 0">${escapeHtml(reviewId)}</td></tr>` : ""}
      </table>
      ${reviewHtml.join("")}
    </div>`;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: toEmail }],
      subject: `New reader review — ${review.bookTitle}`,
      htmlContent,
      textContent,
      tags: ["reader-review", "profahmadali"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo notification failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  }
}

async function notifyReviewSafely(review: Parameters<typeof sendReviewNotification>[0]) {
  try {
    await sendReviewNotification(review);
  } catch (error) {
    console.error("Review was saved, but the notification email could not be sent.", error);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405, origin);

  try {
    const body = await req.json();

    // Honeypot: silently accept bot submissions without writing them.
    if (cleanText(body?.website, 200)) return json({ ok: true }, 200, origin);

    const submissionType = cleanText(body?.submission_type, 40);
    const expectedAction =
      submissionType === "book-page" ? "book_review" :
      submissionType === "reader-review-page" ? "reader_review" : "";

    if (!expectedAction) return json({ ok: false, error: "Invalid submission type." }, 400, origin);

    const turnstileToken = cleanText(body?.turnstile_token, 3000);
    await verifyTurnstile(turnstileToken, expectedAction);

    const name = cleanText(body?.name, 100);
    const email = cleanText(body?.email, 200);
    const bookId = cleanText(body?.book_id, 160);
    const bookTitle = cleanText(body?.book_title, 300);

    if (!name) return json({ ok: false, error: "Name is required." }, 400, origin);
    if (email && !isEmail(email)) return json({ ok: false, error: "Invalid email." }, 400, origin);
    if (!/^[A-Za-z0-9-]{1,160}$/.test(bookId)) return json({ ok: false, error: "Invalid book." }, 400, origin);
    if (!bookTitle) return json({ ok: false, error: "Book title is required." }, 400, origin);

    if (submissionType === "book-page") {
      const reviewText = cleanText(body?.review, 10000);
      const pageLanguage = cleanText(body?.page_language, 10);
      if (!reviewText) return json({ ok: false, error: "Review is required." }, 400, origin);
      if (!["bn", "en"].includes(pageLanguage)) return json({ ok: false, error: "Invalid page language." }, 400, origin);

      const id = await insertReview({
        book_id: bookId,
        book_title: bookTitle,
        name,
        email: email || null,
        review: reviewText,
        review_en: pageLanguage === "en" ? reviewText : null,
        review_original: reviewText,
        source_language: pageLanguage,
        source: "website",
        source_url: null,
        external_review_id: null,
        source_date: null,
        approved: false,
        ai_translation_consent: false,
      });

      await notifyReviewSafely({
        id,
        bookTitle,
        reviewerName: name,
        reviewerEmail: email,
        sourceLanguage: pageLanguage,
        reviewBn: pageLanguage === "bn" ? reviewText : "",
        reviewEn: pageLanguage === "en" ? reviewText : "",
      });

      return json({ ok: true, id }, 200, origin);
    }

    const language = cleanText(body?.language, 10);
    let reviewBn = cleanText(body?.review_bn, 10000);
    let reviewEn = cleanText(body?.review_en, 10000);
    const aiConsent = body?.ai_consent === true;

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

    const id = await insertReview({
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
    });

    await notifyReviewSafely({
      id,
      bookTitle,
      reviewerName: name,
      reviewerEmail: email,
      sourceLanguage,
      reviewBn,
      reviewEn,
    });

    return json({ ok: true, id }, 200, origin);
  } catch (error: any) {
    const code = String(error?.code || error?.message || "");
    if (code === "translation_not_configured") {
      return json({ ok: false, code, error: "AI translation is not configured." }, 503, origin);
    }
    if (code === "turnstile_not_configured") {
      return json({ ok: false, code, error: "Security verification is not configured." }, 503, origin);
    }
    if (code === "turnstile_required" || code === "turnstile_verification_failed") {
      return json({ ok: false, code, error: "Security verification failed. Please try again." }, 400, origin);
    }
    return json({ ok: false, error: String(error?.message || error) }, 400, origin);
  }
});
