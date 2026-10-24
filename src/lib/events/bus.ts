import { EventEmitter } from "node:events";

export type SintiaEvent =
  | {
      type: "message:new";
      data: {
        conversationId: string;
        message: {
          id: string;
          sender: string;
          text: string;
          toolsUsed?: any;
          createdAt?: string;
        };
      };
    }
  | {
      type: "conversation:updated";
      data: {
        conversationId: string;
        lastMessageAt: string;
        status?: string;
        previewText?: string;
      };
    }
  | {
      type: "conversation:takeover";
      data: {
        conversationId: string;
        status: "bot" | "human" | "waiting";
      };
    };

const GLOBAL_BUS_KEY = Symbol.for("sintia.events.bus");

interface GlobalWithBus {
  [GLOBAL_BUS_KEY]?: EventEmitter;
}

const globalObj = globalThis as GlobalWithBus;

function getBus(): EventEmitter {
  if (!globalObj[GLOBAL_BUS_KEY]) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(200);
    globalObj[GLOBAL_BUS_KEY] = emitter;
  }
  return globalObj[GLOBAL_BUS_KEY]!;
}

export function emitEvent(event: SintiaEvent): void {
  try {
    getBus().emit("sintia:event", event);
  } catch (err) {
    console.error("[EventBus] Error al emitir evento:", err);
  }
}

export function subscribeEvents(callback: (event: SintiaEvent) => void): () => void {
  const bus = getBus();
  bus.on("sintia:event", callback);
  return () => {
    bus.off("sintia:event", callback);
  };
}
