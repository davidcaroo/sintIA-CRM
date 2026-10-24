import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Consulta si la instancia necesita configuración inicial
export async function GET() {
  try {
    const userCount = await db.user.count();
    return NextResponse.json({
      needsSetup: userCount === 0,
      hasOwner: userCount > 0,
    });
  } catch (error) {
    console.error("Error al consultar estado de configuración:", error);
    return NextResponse.json({ needsSetup: false, hasOwner: true }, { status: 500 });
  }
}

// POST: Crea la cuenta inicial de propietario/admin (bloqueado permanentemente tras el primer usuario)
export async function POST(req: NextRequest) {
  try {
    // 1. BLOQUEO DE SEGURIDAD ESTRICTO: Si ya existe al menos un usuario, rechazar con 403
    const userCount = await db.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        {
          error:
            "La cuenta inicial de esta instalación ya ha sido configurada y verificada. Por seguridad, no se permiten registros adicionales.",
        },
        { status: 403 }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Por favor, completa tu nombre, correo electrónico y contraseña." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener un mínimo de 6 caracteres." },
        { status: 400 }
      );
    }

    // 2. Crear el usuario como propietario/admin principal
    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "admin",
      },
    });

    // 3. Iniciar sesión automáticamente
    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Error en registro inicial:", error);
    return NextResponse.json(
      { error: error.message || "Ocurrió un error al crear la cuenta inicial." },
      { status: 500 }
    );
  }
}
