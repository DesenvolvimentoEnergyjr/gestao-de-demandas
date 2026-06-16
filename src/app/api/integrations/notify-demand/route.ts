import { NextResponse } from "next/server";
import { tenantConfig } from '@/config/tenant';
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { getThemeColor } from "@/lib/colors";

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
    <div style="background: linear-gradient(135deg, ${getThemeColor('secondary')} 0%, ${getThemeColor('secondary-dark')} 100%); padding: 30px 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">${process.env.NEXT_PUBLIC_COMPANY_NAME || 'EMPRESA JÚNIOR'}</h1>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: ${getThemeColor('secondary')}; font-size: 20px; margin-top: 0; margin-bottom: 8px;">Nova Demanda: ${title}</h2>
      <p style="font-size: 16px; color: #a1a1aa; margin-top: 0; margin-bottom: 24px;">
        Olá, você foi designado(a) para a ${typeName} <strong>${title}</strong>.
      </p>

      <div style="background-color: #27272a; border-left: 4px solid ${getThemeColor('secondary')}; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
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
        <p style="font-size: 15px; color: ${getThemeColor('secondary')}; font-weight: 600; margin: 0;">${deadlineStr}</p>
      </div>
    </div>
    <div style="background-color: #09090b; padding: 30px; text-align: center; border-top: 1px solid #27272a;">
      <div style="color: ${getThemeColor('secondary')}; font-weight: 800; font-size: 18px; letter-spacing: 2px;">${tenantConfig.phrases.emailFooter}</div>
      <div style="color: #71717a; font-size: 12px; margin-top: 12px;">Gestão de Demandas • ${process.env.NEXT_PUBLIC_COMPANY_NAME || 'Empresa Júnior'}</div>
    </div>
  </div>
</body>
</html>
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { demand, sprint, emails, newSprintAssignees } = body;

    // Email
    const SMTP_EMAIL = process.env.SMTP_EMAIL;
    const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

    if (SMTP_EMAIL && SMTP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
      });

      if (sprint && newSprintAssignees && newSprintAssignees.length > 0) {
        // Sprint Email
        const sprintAttachments =
          sprint.attachments?.length > 0
            ? sprint.attachments
              .map(
                (a: { url: string; name: string }) =>
                  `<a href="${a.url}" target="_blank" style="color: ${getThemeColor('secondary')}; text-decoration: none;">${a.name}</a>`,
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
        // Individual Demand Email
        const demandAttachments =
          demand.attachments?.length > 0
            ? demand.attachments
              .map(
                (a: { url: string; name: string }) =>
                  `<a href="${a.url}" target="_blank" style="color: ${getThemeColor('secondary')}; text-decoration: none;">${a.name}</a>`,
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

    // Google Calendar
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
