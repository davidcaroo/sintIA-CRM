import { test } from "node:test";
import assert from "node:assert/strict";
import { emitEvent, subscribeEvents } from "../src/lib/events/bus";

test("eventBus emite y recibe eventos message:new correctamente", async () => {
  let received: any = null;
  const unsubscribe = subscribeEvents((event) => {
    if (event.type === "message:new") {
      received = event.data;
    }
  });

  emitEvent({
    type: "message:new",
    data: {
      conversationId: "conv-123",
      message: { id: "msg-1", text: "Hola test", sender: "client" },
    },
  });

  await new Promise((r) => setTimeout(r, 50));
  unsubscribe();

  assert.ok(received);
  assert.equal(received.conversationId, "conv-123");
  assert.equal(received.message.text, "Hola test");
});
