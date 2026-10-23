import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return NextResponse.json({
      configured: false,
      balance: null,
      usage: null,
      limit: null,
      label: null,
    });
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/key", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      const info = data.data || {};
      const limit = info.limit !== null ? parseFloat(info.limit) : null;
      const usage = info.usage !== null ? parseFloat(info.usage) : 0;
      const balance = limit !== null ? Math.max(0, limit - usage) : null;

      return NextResponse.json({
        configured: true,
        balance: balance !== null ? parseFloat(balance.toFixed(2)) : null,
        usage: parseFloat(usage.toFixed(2)),
        limit,
        label: info.label || "Clave Principal",
      });
    }

    return NextResponse.json({
      configured: true,
      balance: null,
      usage: null,
      limit: null,
      label: "Clave válida (saldo no consultable)",
    });
  } catch {
    return NextResponse.json({
      configured: true,
      balance: null,
      usage: null,
      limit: null,
      label: "Clave configurada",
    });
  }
}
