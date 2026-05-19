import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { google } from "googleapis";

// Template de email premium
const getPremiumEmail = (
  title: string,
  typeName: string,
  description: string,
  attachmentsHtml: string,
  deadlineStr: string,
) => `
<!DOCTYPE html>
<html>
<body style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09090b; margin: 0; padding: 40px 20px; color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border-radius: 12px; overflow: hidden; border: 1px solid #27272a; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);">
    <div style="background: linear-gradient(135deg, #0baf4d 0%, #165b3b 100%); padding: 30px 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">ENERGY JÚNIOR</h1>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: #0baf4d; font-size: 20px; margin-top: 0; margin-bottom: 8px;">Nova Demanda: ${title}</h2>
      <p style="font-size: 16px; color: #a1a1aa; margin-top: 0; margin-bottom: 24px;">
        Olá, você foi designado(a) para a ${typeName} <strong>${title}</strong>.
      </p>

      <div style="background-color: #27272a; border-left: 4px solid #0baf4d; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
        <span style="font-size: 12px; text-transform: uppercase; color: #a1a1aa; font-weight: 700; margin-bottom: 8px; display: block;">
          VOCÊ DEVE
        </span>
        <p style="font-size: 15px; color: #e4e4e7; line-height: 1.6; margin: 0; white-space: pre-wrap;">${description}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <span style="font-size: 12px; text-transform: uppercase; color: #71717a; font-weight: 700; margin-bottom: 8px; display: block;">
          DOCUMENTOS ANEXOS
        </span>
        <p style="font-size: 15px; color: #e4e4e7; margin: 0;">${attachmentsHtml}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <span style="font-size: 12px; text-transform: uppercase; color: #71717a; font-weight: 700; margin-bottom: 8px; display: block;">
          DEADLINE
        </span>
        <p style="font-size: 15px; color: #0baf4d; font-weight: 600; margin: 0;">${deadlineStr}</p>
      </div>
    </div>
    <div style="background-color: #09090b; padding: 30px; text-align: center; border-top: 1px solid #27272a;">
      <div style="color: #0baf4d; font-weight: 800; font-size: 18px; letter-spacing: 2px;">O QUE NÓS SOMOS? CAVEIRA!</div>
      <div style="color: #71717a; font-size: 12px; margin-top: 12px;">Gestão de Demandas • Energy Júnior</div>
    </div>
  </div>
</body>
</html>
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { demand, sprint, emails, newSprintAssignees } = body;

    // ── EMAIL ──────────────────────────────────────────────────────────────────
    const SMTP_EMAIL = process.env.SMTP_EMAIL;
    const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

    if (SMTP_EMAIL && SMTP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
      });

      if (sprint && newSprintAssignees && newSprintAssignees.length > 0) {
        // Email de Sprint
        const sprintAttachments =
          sprint.attachments?.length > 0
            ? sprint.attachments
                .map(
                  (a: { url: string; name: string }) =>
                    `<a href="${a.url}" target="_blank" style="color: #10b981; text-decoration: none;">${a.name}</a>`,
                )
                .join("<br/>")
            : "Nenhum documento anexado.";

        const htmlBody = getPremiumEmail(
          sprint.title,
          "sprint",
          sprint.objective || "Nenhuma meta principal informada.",
          sprintAttachments,
          new Date(sprint.endDate).toLocaleDateString("pt-BR"),
        );

        await transporter.sendMail({
          from: SMTP_EMAIL,
          to: newSprintAssignees.join(","),
          subject: `Nova Demanda: ${sprint.title}`,
          html: htmlBody,
        });
      } else if (!sprint && emails && emails.length > 0) {
        // Email de Demanda Avulsa
        const demandAttachments =
          demand.attachments?.length > 0
            ? demand.attachments
                .map(
                  (a: { url: string; name: string }) =>
                    `<a href="${a.url}" target="_blank" style="color: #10b981; text-decoration: none;">${a.name}</a>`,
                )
                .join("<br/>")
            : "Nenhum documento anexado.";

        const htmlBody = getPremiumEmail(
          demand.title,
          "demanda",
          demand.description || "Nenhuma descrição detalhada.",
          demandAttachments,
          demand.deadline
            ? new Date(demand.deadline).toLocaleDateString("pt-BR")
            : "Sem data",
        );

        await transporter.sendMail({
          from: SMTP_EMAIL,
          to: emails.join(","),
          subject: `Nova Demanda: ${demand.title}`,
          html: htmlBody,
        });
      }
    }

    // ── GOOGLE CALENDAR ────────────────────────────────────────────────────────
    const GCP_CLIENT_EMAIL = process.env.GCP_CLIENT_EMAIL;
    const GCP_PRIVATE_KEY = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const CALENDAR_ID = process.env.CALENDAR_ID;
    const assigneeEmails = Array.isArray(emails) ? emails.filter(Boolean) : [];

    if (GCP_CLIENT_EMAIL && GCP_PRIVATE_KEY && CALENDAR_ID && demand.deadline) {
      const jwtClient = new google.auth.JWT({
        email: GCP_CLIENT_EMAIL,
        key: GCP_PRIVATE_KEY,
        scopes: ["https://www.googleapis.com/auth/calendar.events"],
      });

      const calendar = google.calendar({ version: "v3", auth: jwtClient });

      let eventTitle = demand.title;
      if (sprint) {
        const sprintStart = new Date(sprint.startDate);
        const demandDead = new Date(demand.deadline);
        const diffDays = Math.ceil(
          (demandDead.getTime() - sprintStart.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const week = Math.max(1, Math.ceil(diffDays / 7));
        eventTitle = `Semana ${week} - ${sprint.title}`;
      }

      const eventDateStr = new Date(demand.deadline)
        .toISOString()
        .split("T")[0];
      const attendees = assigneeEmails.map((email: string) => ({ email }));

      await calendar.events.insert({
        calendarId: CALENDAR_ID,
        ...(attendees.length > 0 ? { sendUpdates: "all" } : {}),
        requestBody: {
          summary: eventTitle,
          description: `Demanda vinculada: ${demand.title}`,
          start: { date: eventDateStr, timeZone: "America/Sao_Paulo" },
          end: { date: eventDateStr, timeZone: "America/Sao_Paulo" },
          attendees,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API de integrações:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
