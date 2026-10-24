import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { isValidSignature, isWindowOpen, parseWebhook, toWaId, WINDOW_MS } from "../src/lib/whatsapp/cloud";

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

test("parseWebhook extrae texto, caption, multimedia, botones y fallos", () => {
  const { messages, failed } = parseWebhook(payload);
  assert.deepEqual(
    messages.map((m) => [m.id, m.type, m.text, m.name]),
    [
      ["wamid.1", "text", "Hola", "Ana"],
      ["wamid.2", "image", "mi muela", "Ana"],
      ["wamid.3", "audio", "", "Ana"],
      ["wamid.4", "interactive", "Sí", "Ana"],
    ]
  );
  assert.equal(failed.length, 1);
  assert.equal(failed[0].error, "131047 Re-engagement message");
  assert.deepEqual(parseWebhook({}), { messages: [], failed: [] });
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
