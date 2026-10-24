import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Extracción de conocimiento desde la web de un negocio.
 * Las funciones puras (texto, contactos, enlaces) no dependen de red ni de IA
 * y se prueban en tests/web-extract.test.ts.
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 SintiaBot/2.0";
const MAX_HTML_BYTES = 2_000_000;

/* ---------------- Seguridad: solo hosts públicos (anti-SSRF) ---------------- */

export function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateIp(mapped[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Solo se admiten URLs http(s).");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addrs = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true }).catch(() => {
        throw new Error(`No se encontró el dominio «${host}». Revisa que la dirección esté bien escrita.`);
      });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error("Esa dirección apunta a una red interna y no se puede importar.");
  }
  return url;
}

/** Descarga una página siguiendo redirecciones, validando cada salto. */
export async function fetchPage(raw: string, timeoutMs = 12000): Promise<{ url: string; html: string } | null> {
  let current = raw;
  for (let hop = 0; hop < 4; hop++) {
    const url = await assertPublicUrl(current);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "es-CO,es;q=0.9" },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, url).href;
      continue;
    }
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!type.includes("html")) return null;
    const html = (await res.text()).slice(0, MAX_HTML_BYTES);
    return { url: url.href, html };
  }
  return null;
}

/* ---------------- HTML → texto con estructura ---------------- */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", uuml: "ü", iexcl: "¡", iquest: "¿", euro: "€", copy: "©", reg: "®", middot: "·", ndash: "–", mdash: "—", laquo: "«", raquo: "»" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e] ?? m;
  });
}

/**
 * Convierte HTML en texto legible conservando títulos, listas, filas y saltos,
 * para que precios y nombres de servicio queden en la misma línea.
 * Conserva header/footer: ahí suelen estar teléfono, dirección y horarios.
 */
export function htmlToText(html: string): string {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<h([1-6])\b[^>]*>/gi, (_m, n) => `\n\n${"#".repeat(Number(n))} `)
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<(br|hr)\b[^>]*>/gi, "\n")
    .replace(/<\/(p|div|section|article|header|footer|nav|ul|ol|table|tr|form|address|blockquote|main|aside|dl|dt|dd)>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<img\b[^>]*alt=["']([^"']+)["'][^>]*>/gi, " $1 ")
    .replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  return s
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").replace(/(\s*\|\s*)+$/, "").trim())
    .filter((l, i, arr) => l && l !== "-" && !(l === arr[i - 1]))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ---------------- Contactos deterministas ---------------- */

export interface ContactInfo {
  phones: string[];
  whatsapp: string[];
  emails: string[];
  socials: Record<string, string>;
  addresses: string[];
  hours: string[];
  names: string[];
  description?: string;
}

const SOCIAL_HOSTS: Record<string, RegExp> = {
  facebook: /(^|\.)facebook\.com$|(^|\.)fb\.com$/,
  instagram: /(^|\.)instagram\.com$/,
  tiktok: /(^|\.)tiktok\.com$/,
  linkedin: /(^|\.)linkedin\.com$/,
  youtube: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/,
  x: /(^|\.)twitter\.com$|(^|\.)x\.com$/,
};

const cleanPhone = (p: string) => {
  const t = decodeURIComponent(p).replace(/[^\d+]/g, "");
  return t.replace(/(?!^)\+/g, "");
};

function addUnique(list: string[], v: string | undefined | null) {
  const val = v?.trim();
  if (val && !list.some((x) => x.toLowerCase() === val.toLowerCase())) list.push(val);
}

function jsonLdNodes(html: string): any[] {
  const out: any[] = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const stack = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (stack.length) {
        const n = stack.pop();
        if (!n || typeof n !== "object") continue;
        out.push(n);
        if (Array.isArray(n["@graph"])) stack.push(...n["@graph"]);
      }
    } catch {}
  }
  return out;
}

function formatAddress(a: any): string | undefined {
  if (!a) return undefined;
  if (typeof a === "string") return a;
  return [a.streetAddress, a.addressLocality, a.addressRegion, a.addressCountry?.name ?? a.addressCountry]
    .filter((x) => typeof x === "string" && x.trim())
    .join(", ");
}

export function extractContacts(html: string, pageUrl: string, into?: ContactInfo): ContactInfo {
  const c: ContactInfo = into ?? { phones: [], whatsapp: [], emails: [], socials: {}, addresses: [], hours: [], names: [] };
  const base = new URL(pageUrl);

  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = decodeEntities(m[1].trim());
    const lower = href.toLowerCase();
    if (lower.startsWith("tel:")) addUnique(c.phones, cleanPhone(href.slice(4)));
    else if (lower.startsWith("mailto:")) addUnique(c.emails, decodeURIComponent(href.slice(7).split("?")[0]).toLowerCase());
    else {
      try {
        const u = new URL(href, base);
        const host = u.hostname.replace(/^www\./, "");
        if (host === "wa.me" || host === "api.whatsapp.com" || host === "web.whatsapp.com" || host === "wa.link") {
          const num = host === "wa.me" ? u.pathname.slice(1) : u.searchParams.get("phone") || "";
          addUnique(c.whatsapp, num ? cleanPhone(num.startsWith("+") ? num : `+${num}`) : u.href);
        } else {
          for (const [name, re] of Object.entries(SOCIAL_HOSTS)) {
            if (re.test(host) && !c.socials[name] && u.pathname.length > 1 && !/\/(sharer|share|intent|dialog)/.test(u.pathname)) {
              // profile.php?id=… identifica la página: se conserva su query
              c.socials[name] = `${u.origin}${u.pathname}`.replace(/\/$/, "") + (u.pathname.endsWith("profile.php") ? u.search : "");
            }
          }
        }
      } catch {}
    }
  }

  for (const n of jsonLdNodes(html)) {
    const type = [].concat(n["@type"] ?? []).join(" ");
    if (!/Organization|Business|Store|Clinic|Dentist|Restaurant|Physician|Service|Place|Office|Shop|Agency|Center|Hotel/i.test(type)) continue;
    if (typeof n.name === "string") addUnique(c.names, n.name);
    if (typeof n.telephone === "string") addUnique(c.phones, cleanPhone(n.telephone));
    if (typeof n.email === "string") addUnique(c.emails, n.email.replace(/^mailto:/i, "").toLowerCase());
    addUnique(c.addresses, formatAddress(n.address));
    for (const h of [].concat(n.openingHours ?? [])) if (typeof h === "string") addUnique(c.hours, h);
    for (const spec of [].concat(n.openingHoursSpecification ?? []) as any[]) {
      const days = [].concat(spec?.dayOfWeek ?? []).map((d: string) => String(d).split("/").pop()).join(", ");
      if (spec?.opens) addUnique(c.hours, `${days}: ${spec.opens}–${spec.closes}`);
    }
    if (!c.description && typeof n.description === "string") c.description = n.description;
  }

  const meta = (name: string) =>
    html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["']`, "i"))?.[1];
  const siteName = meta("og:site_name");
  if (siteName) addUnique(c.names, decodeEntities(siteName));
  if (!c.description) {
    const d = meta("description") ?? meta("og:description");
    if (d) c.description = decodeEntities(d);
  }

  const text = htmlToText(html);
  for (const m of text.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) {
    if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(m[0])) addUnique(c.emails, m[0].toLowerCase());
  }
  // Teléfonos escritos con prefijo internacional (evita confundir precios con números)
  for (const m of text.matchAll(/\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,4}/g)) {
    const p = cleanPhone(m[0]);
    if (p.length >= 10 && p.length <= 16) addUnique(c.phones, p);
  }
  return c;
}

/* ---------------- Enlaces internos priorizados ---------------- */

const LINK_KEYWORDS: [RegExp, number][] = [
  [/servicio|service|tratamiento|especialidad|plan(es)?\b|paquete|soluci|tarifa|precio|pricing|price|costo|cotiza|menu|carta/i, 10],
  [/contact|ubicaci|location|sede|donde|horario|hours|sucursal|tienda(s)?-fisica/i, 10],
  [/faq|pregunta|ayuda|help|soporte|como-comprar|como-seleccionar|talla|guia/i, 9],
  [/envio|envío|shipping|entrega|devoluc|refund|cambio|garant|rastrea|pedido|pago|payment|medios-de-pago/i, 8],
  [/nosotros|about|quienes|quiénes|historia|empresa|equipo|team/i, 7],
  [/mayorista|distribuidor|revendedor|emprende|convenio|corporativo|franquicia|reserva|cita|agenda/i, 6],
  [/catalog|catálogo|coleccion|collection|categoria|categoría|productos$|tienda$|shop$/i, 4],
  [/terminos|términos|terms/i, 2],
];
// Fichas de un producto/entrada concreta: poco valor frente a las páginas del negocio
const DETAIL_PAGE = /^\/(products?|productos?|p|item|blog|blogs|noticias|news|post|articulo|article)s?\/[^/]+/i;
const SKIP_LINK = /\.(pdf|jpe?g|png|gif|webp|svg|zip|mp4|mp3|docx?|xlsx?)$|\/(wp-admin|wp-login|login|cart|carrito|checkout|account|cuenta|feed|tag|author|search|privacy|privacidad|cookies)\b|^#/i;

export function rankInternalLinks(html: string, pageUrl: string, limit = 8): string[] {
  const base = new URL(pageUrl);
  const scored = new Map<string, number>();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const u = new URL(decodeEntities(m[1]), base);
      u.hash = "";
      u.search = "";
      if (u.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
      if (SKIP_LINK.test(u.pathname) || u.pathname === base.pathname || u.pathname === "/") continue;
      const label = htmlToText(m[2]).toLowerCase();
      const hay = `${u.pathname} ${label}`;
      let score = 1;
      for (const [re, w] of LINK_KEYWORDS) if (re.test(hay)) score += w;
      if (DETAIL_PAGE.test(u.pathname)) score -= 12;
      score -= Math.max(0, u.pathname.split("/").filter(Boolean).length - 2); // penaliza solo rutas profundas
      const key = u.href.replace(/\/$/, "");
      scored.set(key, Math.max(scored.get(key) ?? -Infinity, score));
    } catch {}
  }
  return [...scored.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([u]) => u);
}

export function pageTitle(html: string): string {
  return decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
}

/* ---------------- Bloque importado en el conocimiento adicional ---------------- */

export function buildImportedBlock(host: string, contact: any, knowledge: string): string {
  const lines: string[] = [];
  const add = (label: string, v?: string | string[]) => {
    const val = Array.isArray(v) ? v.filter(Boolean).join(", ") : v;
    if (val) lines.push(`- ${label}: ${val}`);
  };
  add("Teléfonos", contact?.phones);
  add("WhatsApp", contact?.whatsapp);
  add("Correo", contact?.emails);
  add("Horario", contact?.hours);
  for (const [k, v] of Object.entries(contact?.socials || {})) add(k[0].toUpperCase() + k.slice(1), String(v));
  const parts = [`<!-- sintia:web:${host} -->`, `## Información importada de ${host}`];
  if (lines.length) parts.push("### Contacto", ...lines);
  if (knowledge?.trim()) parts.push(knowledge.trim());
  parts.push(`<!-- /sintia:web:${host} -->`);
  return parts.join("\n");
}

export function mergeNote(current: string, host: string, block: string): string {
  const re = new RegExp(`<!-- sintia:web:${host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} -->[\\s\\S]*?<!-- /sintia:web:[^>]+ -->`);
  return re.test(current) ? current.replace(re, block) : [current.trim(), block].filter(Boolean).join("\n\n");
}
