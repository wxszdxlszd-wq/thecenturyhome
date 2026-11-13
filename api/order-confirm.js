/**
 * Order Confirmation form -> email notifier
 * Receives the mobile checklist submission and emails it to the sales order desk.
 *
 * Env vars (set in Vercel project settings, never in this repo):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   MAIL_TO            comma separated recipients (e.g. caspar@ygscs.com)
 *   MAIL_BCC           optional comma separated silent copies
 *   MAIL_FROM_NAME     display name for the From header
 */
const nodemailer = require("nodemailer");

const LIMIT_PER_HOUR = 6;
const hits = new Map(); // ip -> [timestamps]

let transporter = null;
function getTransporter(port, secure) {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.exmail.qq.com",
    port: port || Number(process.env.SMTP_PORT || 465),
    secure: secure !== false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: false,
    connectionTimeout: 9000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function clean(s, max) {
  return String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").trim().slice(0, max || 200);
}
function oneLine(s) {
  return clean(s, 120).replace(/[\r\n]+/g, " ");
}
function digits(s) {
  return String(s == null ? "" : s).replace(/[^0-9]/g, "").slice(0, 9);
}
function num(s) {
  const d = digits(s);
  return d ? Number(d) : 0;
}
function fmtNum(n) {
  return n ? n.toLocaleString("en-US") : "";
}
function isEmail(s) {
  const v = clean(s, 120);
  return /^[^\s@,;:<>"]+@[^\s@,;:<>"]+\.[^\s@,;:<>"]+$/.test(v) ? v : "";
}

const EN = {
  sec_products: "1. Selected Products",
  sec_logistics: "2. Logistics & Delivery",
  sec_specs: "3. Product Specifications",
  sec_packaging: "4. Packaging & Handling",
  incoterms: { fob: "FOB", cif: "CIF", other: "DDP / Others" },
  shipping: { sea: "Sea Freight", air: "Air Freight", land: "Land", tbd: "Not sure - please advise" },
  color: { default: "Factory Default Color", custom: "Custom Color (MOQ required)" },
  ui_language: { en: "English (Default)", pt: "Portuguese", other: "Others" },
  cert: { ce: "CE / RoHS (Default)", local: "Specific local certificate" },
  box: { neutral: "Neutral English Box (No Logo)", oem: "Custom OEM Box (Design needed)" },
  labels: { basic: "Factory Basic Labels", custom: "Custom SKU / Barcode Labels" },
  carton: { export: "General Export Carton", ecom: "E-commerce Drop-Test Packing" },
  pallet: { bulk: "Bulk Loading (No Pallets)", pallets: "With Pallets" },
};

function pick(map, v, other) {
  const base = map && map[v] ? map[v] : clean(v, 80);
  return other ? base + " — " + clean(other, 120) : base;
}

/* Products are sent by the page (the list is managed in config.json), so the email
   report adapts to whatever the order contains. */
function normProducts(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 12).map((p) => ({
    sku: clean(p && p.sku, 60) || "Item",
    name: clean(p && p.name, 120),
    qty: num(p && p.qty),
    remarks: clean(p && p.remarks, 300),
  })).filter((p) => p.qty > 0 || p.remarks);
}

function buildRows(products, a) {
  const rows = [];
  products.forEach((p) => {
    const label = p.sku + (p.name ? " · " + p.name : "");
    rows.push([EN.sec_products, label + " — Order Qty", p.qty ? fmtNum(p.qty) + " pcs" : "—"]);
    if (p.remarks) rows.push([EN.sec_products, p.sku + " — Remarks", p.remarks]);
  });

  rows.push([EN.sec_logistics, "Destination Country", clean(a.destination, 80) || "—"]);
  rows.push([EN.sec_logistics, "Incoterms", pick(EN.incoterms, a.incoterms, a.incoterms_other) || "—"]);
  rows.push([EN.sec_logistics, "Shipping Method", pick(EN.shipping, a.shipping) || "—"]);
  rows.push([EN.sec_logistics, "Expected Target Date", clean(a.target_date, 20) || "Flexible / not set"]);

  rows.push([EN.sec_specs, "Color Preference", pick(EN.color, a.color, a.color_other) || "—"]);
  rows.push([EN.sec_specs, "Language (Manual / UI)", pick(EN.ui_language, a.ui_language, a.ui_language_other) || "—"]);
  rows.push([EN.sec_specs, "Local Certification", pick(EN.cert, a.cert, a.cert_other) || "—"]);

  rows.push([EN.sec_packaging, "Packaging (Color Box)", pick(EN.box, a.box) || "—"]);
  rows.push([EN.sec_packaging, "Product / Carton Labels", pick(EN.labels, a.labels) || "—"]);
  rows.push([EN.sec_packaging, "Outer Carton Packing", pick(EN.carton, a.carton) || "—"]);
  rows.push([EN.sec_packaging, "Pallet & Height Limit", pick(EN.pallet, a.pallet, a.pallet === "pallets" ? (a.pallet_height ? "max height " + clean(a.pallet_height, 20) + " m" : "") : "") || "—"]);
  return rows;
}

function hhmmBeijing() {
  const d = new Date();
  try {
    return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(d) + " (Beijing)";
  } catch (e) {
    return d.toISOString();
  }
}

function buildEmail(body, products) {
  const a = body.answers || {};
  const ref = clean(body.ref, 40) || "OC";
  const client = clean(a.client_company, 80) || clean(a.client_name, 60) || "Client";
  const rows = buildRows(products, a);
  const parts = products.filter((p) => p.qty).map((p) => p.sku + " " + fmtNum(p.qty) + " pcs");
  const subject = ("[Order Confirmation] " + ref + " | " + oneLine(client) + (parts.length ? " | " + parts.join(", ") : "")).slice(0, 160);

  const meta = [
    ["Reference", ref],
    ["Submitted at", hhmmBeijing()],
    ["Client name", clean(a.client_name, 80) || "—"],
    ["Company", clean(a.client_company, 120) || "—"],
    ["Client email", isEmail(a.client_email) || "—"],
    ["Client timezone", clean(body.tz, 60) || "—"],
    ["Form language", body.lang === "pt" ? "Portuguese" : "English"],
    ["IP address", clean(body.ip, 60) || "—"],
    ["Form link", clean(body.site, 120) || "—"],
  ];

  const rowHtml = rows.map((r, i) =>
    '<tr>' +
    '<td style="padding:7px 10px;border-bottom:1px solid #eef1f6;color:#6b7280;font-size:12px;white-space:nowrap;vertical-align:top">' + esc(r[0]).replace(/^\d\.\s*/, "") + '</td>' +
    '<td style="padding:7px 10px;border-bottom:1px solid #eef1f6;font-size:13px;color:#111827;vertical-align:top">' + esc(r[1]) + '</td>' +
    '<td style="padding:7px 10px;border-bottom:1px solid #eef1f6;font-size:13px;font-weight:600;color:#111827;vertical-align:top">' + esc(r[2]) + '</td>' +
    '</tr>').join("");

  const metaHtml = meta.map((m) =>
    '<tr><td style="padding:3px 8px 3px 0;color:#6b7280;font-size:12px;white-space:nowrap">' + esc(m[0]) + '</td>' +
    '<td style="padding:3px 0;font-size:12px;color:#111827">' + esc(m[1]) + '</td></tr>').join("");

  const notes = clean(a.notes, 2000);

  const html =
'<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:18px 12px"><tr><td align="center">' +
'<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(16,24,40,.08)">' +
'<tr><td style="background:#1d4ed8;color:#fff;padding:16px 18px">' +
'<div style="font-size:17px;font-weight:700">Order Requirement Confirmation — client submitted</div>' +
'<div style="font-size:12.5px;opacity:.92;margin-top:4px">Ref ' + esc(ref) + ' &nbsp;·&nbsp; YG-M6pro / YG-Mt56i</div></td></tr>' +
'<tr><td style="padding:16px 18px 4px">' +
'<div style="font-size:13.5px;color:#111827">The client has reviewed and confirmed the order checklist online. All selections below are the client\'s final choices.</div>' +
'</td></tr>' +
'<tr><td style="padding:12px 18px 0"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #eef1f6;border-radius:10px"><tr><td style="padding:10px 12px"><table role="presentation" cellpadding="0" cellspacing="0">' + metaHtml + '</table></td></tr></table></td></tr>' +
'<tr><td style="padding:14px 18px 0"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #eef1f6;border-radius:10px;border-collapse:separate">' +
'<tr style="background:#f3f6fc"><th align="left" style="padding:8px 10px;font-size:11.5px;color:#6b7280;font-weight:600">Section</th>' +
'<th align="left" style="padding:8px 10px;font-size:11.5px;color:#6b7280;font-weight:600">Item</th>' +
'<th align="left" style="padding:8px 10px;font-size:11.5px;color:#6b7280;font-weight:600">Client\'s choice</th></tr>' +
rowHtml + '</table></td></tr>' +
(notes ? '<tr><td style="padding:14px 18px 0"><div style="font-size:12.5px;color:#6b7280;margin-bottom:5px">Notes / special requests</div><div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 12px;font-size:13px;color:#111827;white-space:pre-wrap">' + esc(notes) + '</div></td></tr>' : '') +
'<tr><td style="padding:14px 18px 18px"><div style="font-size:11.5px;color:#9aa2b1;line-height:1.6">Automated notification from the online order confirmation form. Reply to this email' + (isEmail(a.client_email) ? ' (Reply-To is set to the client\'s address)' : '') + ' to reach the submitter.</div></td></tr>' +
'</table></td></tr></table></body></html>';

  const text = [
    "Order Requirement Confirmation — client submitted",
    "Ref: " + ref,
    "",
    meta.map((m) => m[0] + ": " + m[1]).join("\n"),
    "",
    rows.map((r) => r[0] + " | " + r[1] + " | " + r[2]).join("\n"),
    notes ? "\nNotes: " + notes : "",
    "",
    "Automated notification from the online order confirmation form.",
  ].join("\n");

  return { subject, html, text, replyTo: isEmail(a.client_email), ref, rows };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }
  let body = req.body;
  try {
    if (typeof body === "string") body = JSON.parse(body);
  } catch (e) { body = null; }
  if (!body || typeof body !== "object") {
    res.status(400).json({ ok: false, error: "bad_body" });
    return;
  }
  if (JSON.stringify(body).length > 30000) {
    res.status(413).json({ ok: false, error: "too_large" });
    return;
  }
  if (clean(body.website, 50)) { // honeypot
    res.status(200).json({ ok: true });
    return;
  }
  const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((x) => now - x < 3600e3);
  if (arr.length >= LIMIT_PER_HOUR) {
    res.status(429).json({ ok: false, error: "rate_limited" });
    return;
  }
  arr.push(now);
  if (hits.size > 400) hits.clear();
  hits.set(ip, arr);

  const a = body.answers || {};
  body.ip = ip;
  let products = normProducts(body.products);
  if (!products.length) {  // legacy payload fallback (older page versions)
    if (num(a.m6pro_qty) || a.m6pro_remarks) products.push({ sku: "YG-M6pro", name: "Instant Camera Pro", qty: num(a.m6pro_qty), remarks: clean(a.m6pro_remarks, 300) });
    if (num(a.mt56i_qty) || a.mt56i_remarks) products.push({ sku: "YG-Mt56i", name: "Magnetic Portable Photo Printer", qty: num(a.mt56i_qty), remarks: clean(a.mt56i_remarks, 300) });
  }
  const missing = [];
  if (!clean(a.destination, 80)) missing.push("destination");
  if (!clean(a.incoterms, 20)) missing.push("incoterms");
  if (!clean(a.shipping, 20)) missing.push("shipping");
  if (!products.some((p) => p.qty > 0)) missing.push("qty");
  if (missing.length) {
    res.status(400).json({ ok: false, error: "missing_fields", fields: missing });
    return;
  }

  try {
    const mail = buildEmail(body, products);
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error("smtp_not_configured");
    const to = String(process.env.MAIL_TO || "").split(",").map((s) => s.trim()).filter(Boolean);
    const bcc = String(process.env.MAIL_BCC || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!to.length) throw new Error("no_recipient");
    const fromName = process.env.MAIL_FROM_NAME || "YG Order Form";
    const message = {
      from: fromName + " <" + process.env.SMTP_USER + ">",
      to,
      bcc: bcc.length ? bcc : undefined,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: mail.replyTo || undefined,
      headers: { "X-Order-Ref": mail.ref, "X-Form-Token": clean(body.token, 40) },
    };
    try {
      transporter = transporter || getTransporter();
      await transporter.sendMail(message);
    } catch (err1) {
      // fallback: STARTTLS on 587 in case 465 is unavailable
      transporter = getTransporter(587, false);
      await transporter.sendMail(message);
    }
    res.status(200).json({ ok: true, ref: mail.ref });
  } catch (e) {
    transporter = null;
    console.error("order-confirm send failed:", e && e.message, e && e.code);
    res.status(502).json({ ok: false, error: "send_failed", detail: String((e && e.message) || e).slice(0, 160) });
  }
};
