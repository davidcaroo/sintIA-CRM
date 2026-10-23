import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const service = await db.service.create({
      data: {
        name: data.name,
        description: data.description || "",
        durationMinutes: parseInt(data.durationMinutes, 10) || 30,
        price: data.price !== undefined && data.price !== "" ? parseFloat(data.price) : null,
        isFromPrice: !!data.isFromPrice,
        requiresValuation: !!data.requiresValuation,
        stripeDeposit: data.stripeDeposit ? parseFloat(data.stripeDeposit) : null,
      },
    });
    return NextResponse.json(service);
  } catch (error) {
    console.error("Error al crear servicio:", error);
    return NextResponse.json({ error: "Error al crear el servicio." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const service = await db.service.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description || "",
        durationMinutes: parseInt(data.durationMinutes, 10) || 30,
        price: data.price !== undefined && data.price !== "" ? parseFloat(data.price) : null,
        isFromPrice: !!data.isFromPrice,
        requiresValuation: !!data.requiresValuation,
        stripeDeposit: data.stripeDeposit ? parseFloat(data.stripeDeposit) : null,
      },
    });
    return NextResponse.json(service);
  } catch (error) {
    console.error("Error al editar servicio:", error);
    return NextResponse.json({ error: "Error al actualizar el servicio." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID no proporcionado." }, { status: 400 });

    await db.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    return NextResponse.json({ error: "Error al eliminar el servicio." }, { status: 500 });
  }
}
