import { test } from "node:test";
import assert from "node:assert/strict";
import { buildImportedBlock, extractContacts, htmlToText, isPrivateIp, mergeNote, rankInternalLinks } from "../src/lib/knowledge/web-extract";

const html = `<html><head><title>Clínica Sol | Odontología</title>
<meta name="description" content="Odontología integral en Cartagena">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Dentist","name":"Clínica Sol","telephone":"+57 300 111 2233","email":"hola@clinicasol.co","address":{"streetAddress":"Cra 3 # 6-45","addressLocality":"Cartagena"},"openingHours":"Mo-Fr 08:00-18:00"}</script>
<style>.x{}</style></head><body>
<nav><a href="/servicios">Servicios</a> <a href="/contacto">Contáctanos</a> <a href="/blog/post-1">Blog</a> <a href="https://otro.com/precios">Externo</a> <a href="/login">Entrar</a></nav>
<h1>Limpieza dental</h1><ul><li>Limpieza básica: $80.000</li><li>Blanqueamiento desde $350.000</li></ul>
<table><tr><td>Ortodoncia</td><td>$2.500.000</td></tr></table>
<footer>Escríbenos: <a href="mailto:citas@clinicasol.co">citas@clinicasol.co</a> · <a href="tel:+57 (5) 600-1234">Llamar</a>
<a href="https://wa.me/573001112233">WhatsApp</a> <a href="https://www.instagram.com/clinicasol/">IG</a> <a href="https://facebook.com/sharer/sharer.php?u=x">Compartir</a>
Tel. +57 311 606 1807 &amp; Calle 5</footer></body></html>`;

test("htmlToText conserva estructura, filas de tabla y pie de página", () => {
  const t = htmlToText(html);
  assert.match(t, /# Limpieza dental/);
  assert.match(t, /- Limpieza básica: \$80\.000/);
  assert.match(t, /Ortodoncia \| \$2\.500\.000/);
  assert.match(t, /Escríbenos/);
  assert.doesNotMatch(t, /\.x\{\}/);
  assert.match(t, /& Calle 5/);
});

test("extractContacts une JSON-LD, tel:, mailto:, wa.me, redes y texto", () => {
  const c = extractContacts(html, "https://clinicasol.co/");
  assert.deepEqual(c.phones, ["+5756001234", "+573001112233", "+573116061807"]);
  assert.deepEqual(c.whatsapp, ["+573001112233"]);
  assert.deepEqual(c.emails, ["citas@clinicasol.co", "hola@clinicasol.co"]);
  assert.deepEqual(c.socials, { instagram: "https://www.instagram.com/clinicasol" });
  assert.deepEqual(c.addresses, ["Cra 3 # 6-45, Cartagena"]);
  assert.deepEqual(c.hours, ["Mo-Fr 08:00-18:00"]);
  assert.equal(c.names[0], "Clínica Sol");
});

test("rankInternalLinks prioriza servicios/contacto y descarta externos y login", () => {
  const links = rankInternalLinks(html, "https://clinicasol.co/");
  assert.deepEqual(links.slice(0, 2).sort(), ["https://clinicasol.co/contacto", "https://clinicasol.co/servicios"]);
  assert.ok(!links.some((l) => l.includes("otro.com") || l.includes("login")));
});

test("isPrivateIp bloquea redes internas", () => {
  for (const ip of ["127.0.0.1", "10.0.0.5", "192.168.1.97", "172.16.0.1", "169.254.169.254", "::1", "fd00::1", "::ffff:10.0.0.1"]) assert.equal(isPrivateIp(ip), true, ip);
  for (const ip of ["8.8.8.8", "172.32.0.1", "2606:4700::1111"]) assert.equal(isPrivateIp(ip), false, ip);
});

test("mergeNote reemplaza el bloque importado de la misma web sin duplicar", () => {
  const b1 = buildImportedBlock("clinicasol.co", { phones: ["+57300"] }, "## Horarios\nL-V");
  const once = mergeNote("Notas propias", "clinicasol.co", b1);
  const b2 = buildImportedBlock("clinicasol.co", { phones: ["+57999"] }, "");
  const twice = mergeNote(once, "clinicasol.co", b2);
  assert.match(twice, /^Notas propias/);
  assert.match(twice, /\+57999/);
  assert.doesNotMatch(twice, /\+57300/);
  assert.equal(twice.match(/<!-- sintia:web:clinicasol\.co -->/g)?.length, 1);
});
