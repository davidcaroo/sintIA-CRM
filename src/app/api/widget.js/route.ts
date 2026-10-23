import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const channel = await db.channelState.findUnique({ where: { id: "webchat" } });
  const business = await db.businessInfo.findFirst();

  const color = channel?.widgetColor || "#0284c7";
  const welcome = channel?.welcomeText || "¡Hola! ¿En qué puedo ayudarte?";
  const businessName = business?.name || "Clínica Dental Lumen";
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const script = `
(function() {
  if (window.__sintia_widget_loaded) return;
  window.__sintia_widget_loaded = true;

  const CONFIG = {
    appUrl: "${appUrl}",
    color: "${color}",
    businessName: "${businessName}",
    welcome: "${welcome}"
  };

  // Crear contenedor del widget
  const container = document.createElement("div");
  container.id = "sintia-widget-container";
  container.innerHTML = \`
    <style>
      #sintia-bubble {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 30px;
        background: \${CONFIG.color};
        box-shadow: 0 4px 20px rgba(0,0,0,0.18);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        z-index: 999999;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      #sintia-bubble:hover {
        transform: scale(1.06);
      }
      #sintia-window {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 360px;
        height: 520px;
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        border: 1px solid #e2e8f0;
        z-index: 999999;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: system-ui, -apple-system, sans-serif;
      }
      #sintia-header {
        background: \${CONFIG.color};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      #sintia-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f8fafc;
      }
      .sintia-msg {
        max-width: 82%;
        padding: 10px 14px;
        font-size: 13px;
        line-height: 1.45;
        border-radius: 16px;
        word-break: break-word;
      }
      .sintia-msg-bot {
        background: #ffffff;
        color: #1e293b;
        align-self: flex-start;
        border: 1px solid #e2e8f0;
        border-top-left-radius: 4px;
      }
      .sintia-msg-user {
        background: \${CONFIG.color};
        color: white;
        align-self: flex-end;
        border-top-right-radius: 4px;
      }
      #sintia-form {
        display: flex;
        padding: 12px;
        background: #ffffff;
        border-top: 1px solid #e2e8f0;
        gap: 8px;
      }
      #sintia-input {
        flex: 1;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 8px 12px;
        font-size: 13px;
        outline: none;
      }
      #sintia-input:focus {
        border-color: \${CONFIG.color};
      }
      #sintia-send {
        background: \${CONFIG.color};
        color: white;
        border: none;
        border-radius: 12px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
    </style>

    <div id="sintia-window">
      <div id="sintia-header">
        <div>
          <div style="font-weight: bold; font-size: 14px;">\${CONFIG.businessName}</div>
          <div style="font-size: 11px; opacity: 0.9;">Atendido por Sintia (IA)</div>
        </div>
        <button id="sintia-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">&times;</button>
      </div>
      <div id="sintia-messages">
        <div class="sintia-msg sintia-msg-bot">\${CONFIG.welcome}</div>
      </div>
      <form id="sintia-form">
        <input id="sintia-input" type="text" placeholder="Escribe tu consulta..." autocomplete="off" />
        <button id="sintia-send" type="submit">Enviar</button>
      </form>
    </div>

    <div id="sintia-bubble">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
      </svg>
    </div>
  \`;

  document.body.appendChild(container);

  const bubble = document.getElementById("sintia-bubble");
  const win = document.getElementById("sintia-window");
  const closeBtn = document.getElementById("sintia-close");
  const form = document.getElementById("sintia-form");
  const input = document.getElementById("sintia-input");
  const messages = document.getElementById("sintia-messages");

  let isOpen = false;
  let sessionId = localStorage.getItem("sintia_session_id") || "sess_" + Math.random().toString(36).substring(2, 9);
  localStorage.setItem("sintia_session_id", sessionId);

  bubble.addEventListener("click", () => {
    isOpen = !isOpen;
    win.style.display = isOpen ? "flex" : "none";
    if (isOpen) input.focus();
  });

  closeBtn.addEventListener("click", () => {
    isOpen = false;
    win.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    input.value = "";

    // Mensaje usuario
    const userDiv = document.createElement("div");
    userDiv.className = "sintia-msg sintia-msg-user";
    userDiv.innerText = text;
    messages.appendChild(userDiv);
    messages.scrollTop = messages.scrollHeight;

    // Indicador escribiendo
    const typingDiv = document.createElement("div");
    typingDiv.className = "sintia-msg sintia-msg-bot";
    typingDiv.innerText = "Escribiendo...";
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch(CONFIG.appUrl + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId,
          contactName: "Visitante Web",
        })
      });
      const data = await res.json();
      typingDiv.innerText = data.reply || "No pudimos procesar tu mensaje.";
    } catch (err) {
      typingDiv.innerText = "Error de conexión con el asistente.";
    }
    messages.scrollTop = messages.scrollHeight;
  });
})();
`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
