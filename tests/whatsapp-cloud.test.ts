import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describeTemplate, isValidSignature, isWindowOpen, parseWebhook, renderTemplate, toWaId, WINDOW_MS } from "../src/lib/whatsapp/cloud";

const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          field: "messages",
          value: {
            contacts: [{ wa_id: "573001112233", profile: { name: "Ana" } }],
            messages: [
              { id: "wamid.1", from: "573001112233", type: "text", text: { body: "Hola" } },
              { id: "wamid.2", from: "573001112233", type: "image", image: { id: "m1", caption: "mi muela" } },
              { id: "wamid.3", from: "573001112233", type: "audio", audio: { id: "m2" } },
              { id: "wamid.4", from: "573001112233", type: "interactive", interactive: { button_reply: { title: "Sí" } } },
              { id: "wamid.5", from: "573001112233", type: "location", location: { latitude: 10.4, longitude: -75.5, name: "Bocagrande" } },
              { id: "wamid.6", from: "573001112233", type: "document", document: { id: "m3", mime_type: "application/pdf", filename: "orden.pdf" } },
            ],
            statuses: [
              { id: "wamid.out", status: "delivered" },
              { id: "wamid.bad", status: "failed", recipient_id: "573009", errors: [{ code: 131047, title: "Re-engagement message" }] },
            ],
          },
        },
      ],
    },
  ],
};

test("parseWebhook extrae texto, caption, adjuntos, ubicación, botones y estados", () => {
  const { messages, statuses } = parseWebhook(payload);
  assert.deepEqual(
    messages.map((m) => [m.id, m.type, m.text, m.mediaId, m.name]),
    [
      ["wamid.1", "text", "Hola", null, "Ana"],
      ["wamid.2", "image", "mi muela", "m1", "Ana"],
      ["wamid.3", "audio", "", "m2", "Ana"],
      ["wamid.4", "interactive", "Sí", null, "Ana"],
      ["wamid.5", "location", "📍 Ubicación compartida: Bocagrande\nhttps://maps.google.com/?q=10.4,-75.5", null, "Ana"],
      ["wamid.6", "document", "", "m3", "Ana"],
    ]
  );
  assert.equal(messages[5].filename, "orden.pdf");
  assert.equal(messages[5].mime, "application/pdf");
  assert.deepEqual(
    statuses.map((s) => [s.id, s.status, s.error]),
    [
      ["wamid.out", "delivered", null],
      ["wamid.bad", "failed", "131047 Re-engagement message"],
    ]
  );
  assert.deepEqual(parseWebhook({}), { messages: [], statuses: [] });
});

test("plantillas: variables, soporte y render", () => {
  const t = describeTemplate({
    name: "recordatorio",
    language: "es",
    category: "UTILITY",
    components: [{ type: "BODY", text: "Hola {{1}}, tu cita de {{2}} es a las {{3}}. {{1}}" }],
  });
  assert.equal(t.params, 3);
  assert.equal(t.supported, true);
  assert.equal(renderTemplate(t.body, ["Ana", "limpieza", "10:00"]), "Hola Ana, tu cita de limpieza es a las 10:00. Ana");
  const withImage = describeTemplate({ name: "promo", language: "es", components: [{ type: "HEADER", format: "IMAGE" }, { type: "BODY", text: "Hola" }] });
  assert.equal(withImage.supported, false);
});

test("isValidSignature valida HMAC-SHA256 del body crudo", () => {
  const body = JSON.stringify(payload);
  const sig = "sha256=" + createHmac("sha256", "secreto").update(body).digest("hex");
  assert.equal(isValidSignature(body, sig, "secreto"), true);
  assert.equal(isValidSignature(body + " ", sig, "secreto"), false);
  assert.equal(isValidSignature(body, null, "secreto"), false);
  assert.equal(isValidSignature(body, null, undefined), true); // capa desactivada sin secreto
});

test("isWindowOpen respeta la ventana de 24 h", () => {
  const now = new Date("2026-10-23T12:00:00Z");
  assert.equal(isWindowOpen(new Date(now.getTime() - WINDOW_MS + 1000), now), true);
  assert.equal(isWindowOpen(new Date(now.getTime() - WINDOW_MS - 1000), now), false);
  assert.equal(isWindowOpen(null, now), false);
  assert.equal(isWindowOpen(new Date(now.getTime() + 60_000), now), false);
  assert.equal(toWaId("+57 300-111 2233"), "573001112233");
});
