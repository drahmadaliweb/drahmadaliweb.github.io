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

async function verifyTurnstile(token: string) {
  const secret = env("TURNSTILE_SECRET");
  if (!secret) throw new Error("turnstile_not_configured");
  if (!token) throw new Error("turnstile_required");

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!response.ok) throw new Error("turnstile_verification_failed");

  const result = await response.json();
  const hostname = String(result?.hostname || "").toLowerCase();
  const allowedHost = hostname === "profahmadali.com" || hostname === "www.profahmadali.com";
  const actionMatches = String(result?.action || "") === "contact_message";

  if (result?.success !== true || !allowedHost || !actionMatches) {
    throw new Error("turnstile_verification_failed");
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405, origin);

  try {
    const body = await req.json();

    if (cleanText(body?.website, 200)) return json({ ok: true }, 200, origin);

    await verifyTurnstile(cleanText(body?.turnstile_token, 3000));

    const fullName = cleanText(body?.full_name, 120);
    const email = cleanText(body?.email, 200);
    const phone = cleanText(body?.phone, 80);
    const subject = cleanText(body?.subject, 160);
    const subjectCode = cleanText(body?.subject_code, 80);
    const book = cleanText(body?.book, 300);
    const message = cleanText(body?.message, 10000);
    const page = cleanText(body?.page, 500);

    if (!fullName) return json({ ok: false, error: "Name is required." }, 400, origin);
    if (!email || !isEmail(email)) return json({ ok: false, error: "A valid email is required." }, 400, origin);
    if (!["book-order", "academic-discussion", "question", "other"].includes(subjectCode)) {
      return json({ ok: false, error: "Invalid subject." }, 400, origin);
    }
    if (!subject) return json({ ok: false, error: "Subject is required." }, 400, origin);
    if (!message) return json({ ok: false, error: "Message is required." }, 400, origin);
    if (subjectCode === "book-order" && !book) {
      return json({ ok: false, error: "Book title is required for book orders." }, 400, origin);
    }

    const endpoint = env("CONTACT_FORM_ENDPOINT");
    if (!endpoint || !endpoint.startsWith("https://formsubmit.co/")) {
      throw new Error("contact_endpoint_not_configured");
    }

    const payload: Record<string, string> = {
      _subject: `Dr. Ahmad Ali Website - ${subject}`,
      _template: "table",
      _honey: "",
      full_name: fullName,
      email,
      _replyto: email,
      phone,
      subject,
      message,
      page,
    };
    if (subjectCode === "book-order") payload.book = book;

    const forwarded = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resultText = await forwarded.text();
    if (!forwarded.ok) {
      throw new Error(`Contact delivery failed (${forwarded.status}): ${resultText.slice(0, 300)}`);
    }

    return json({ ok: true }, 200, origin);
  } catch (error: any) {
    const code = String(error?.code || error?.message || "");
    if (code === "turnstile_not_configured") {
      return json({ ok: false, code, error: "Security verification is not configured." }, 503, origin);
    }
    if (code === "turnstile_required" || code === "turnstile_verification_failed") {
      return json({ ok: false, code, error: "Security verification failed. Please try again." }, 400, origin);
    }
    if (code === "contact_endpoint_not_configured") {
      return json({ ok: false, code, error: "Contact delivery is not configured." }, 503, origin);
    }
    return json({ ok: false, error: String(error?.message || error) }, 400, origin);
  }
});
