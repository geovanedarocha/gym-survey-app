import emailjs from "@emailjs/browser";

export interface AlertDetails {
  tags: string[];
  timestamp: string;
}

export async function sendCriticalAlertEmail(
  emailGestor: string,
  details: AlertDetails
): Promise<void> {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn(
      "⚠️ EmailJS não configurado. Defina NEXT_PUBLIC_EMAILJS_SERVICE_ID, " +
      "NEXT_PUBLIC_EMAILJS_TEMPLATE_ID e NEXT_PUBLIC_EMAILJS_PUBLIC_KEY."
    );
    return;
  }

  await emailjs.send(
    serviceId,
    templateId,
    {
      to_email: emailGestor,
      alerta: "🚨 ALERTA CRÍTICO — Avaliações Péssimo Consecutivas",
      detalhes: `3 avaliações "Péssimo" consecutivas foram registradas no totem às ${details.timestamp}.`,
      tags: details.tags.length > 0 ? details.tags.join(", ") : "Nenhuma tag selecionada",
      timestamp: details.timestamp,
    },
    publicKey
  );
}
