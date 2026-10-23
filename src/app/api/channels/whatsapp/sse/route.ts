import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const state = await db.channelState.findUnique({
            where: { id: "whatsapp" },
          });

          const data = {
            status: state?.status || "disconnected",
            qrCode: state?.qrCode || null,
            connectedNumber: state?.connectedNumber || null,
            connectedName: state?.connectedName || null,
            updatedAt: state?.updatedAt || new Date(),
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          // Si el cliente desconecta
        }
      };

      // Enviar primer estado inmediato
      await sendUpdate();

      // Enviar actualizaciones periódicas
      const interval = setInterval(sendUpdate, 1500);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
