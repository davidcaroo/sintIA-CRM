import { NextRequest } from "next/server";
import { subscribeEvents, SintiaEvent } from "@/lib/events/bus";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let lastSeenTime = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Enviar evento de conexión inicial
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected", time: new Date().toISOString() })}\n\n`)
      );

      // 2. Suscribirse al bus en memoria local (mismo proceso)
      const unsubscribe = subscribeEvents((event: SintiaEvent) => {
        try {
          const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Si el controlador ya está cerrado
        }
      });

      // 3. Polling de base de datos para sincronizar eventos creados por el worker independiente (multiproceso)
      const dbSyncInterval = setInterval(async () => {
        try {
          const newMessages = await db.message.findMany({
            where: { createdAt: { gt: lastSeenTime } },
            orderBy: { createdAt: "asc" },
            take: 20,
          });

          if (newMessages.length > 0) {
            lastSeenTime = newMessages[newMessages.length - 1].createdAt;
            for (const msg of newMessages) {
              const payload = `event: message:new\ndata: ${JSON.stringify({
                conversationId: msg.conversationId,
                message: {
                  id: msg.id,
                  sender: msg.sender,
                  text: msg.text,
                  toolsUsed: msg.toolsUsed,
                  createdAt: msg.createdAt.toISOString(),
                },
              })}\n\n`;
              controller.enqueue(encoder.encode(payload));
            }
          }
        } catch {
          // Silencioso ante desconexiones
        }
      }, 1500);

      // 4. Heartbeat periódico para mantener la conexión viva a través de proxies/firewalls
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 25000);

      // 5. Limpieza cuando el cliente cierra la conexión
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        clearInterval(dbSyncInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Ya cerrado
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
