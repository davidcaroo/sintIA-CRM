import { db } from "@/lib/db";
import { downloadMedia, metaErrorMessage } from "@/lib/whatsapp/cloud";

export const dynamic = "force-dynamic";

/**
 * Sirve al panel (con sesión) un adjunto entrante de WhatsApp descargándolo de Meta.
 * Solo ids que pertenecen a un mensaje guardado: no es un proxy abierto a la Graph API.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{5,30}$/.test(id)) return new Response(null, { status: 400 });

  const msg = await db.message.findFirst({ where: { mediaId: id }, select: { mediaMime: true } });
  if (!msg) return new Response(null, { status: 404 });

  try {
    const file = await downloadMedia(id);
    const mime = (msg.mediaMime || file.mime).split(";")[0].trim().toLowerCase();
    // Solo tipos que no ejecutan código se muestran en línea (un SVG/HTML del cliente podría hacer XSS)
    const inline = /^(image\/(jpeg|png|webp|gif)|audio\/[\w.+-]+|video\/[\w.+-]+|application\/pdf)$/.test(mime);
    return new Response(new Uint8Array(file.data), {
      headers: {
        "Content-Type": inline ? mime : "application/octet-stream",
        "Content-Disposition": inline ? "inline" : "attachment",
        "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; media-src 'self'; object-src 'self'",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    return Response.json({ error: metaErrorMessage(err) }, { status: 422 });
  }
}
