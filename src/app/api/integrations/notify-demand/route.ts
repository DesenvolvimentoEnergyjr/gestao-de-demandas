import { NextResponse } from "next/server";
import { tenantConfig } from "@/config/tenant";
import nodemailer from "nodemailer";

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
    <div style="background: linear-gradient(135deg, ${getThemeColor("secondary")} 0%, ${getThemeColor("secondary-dark")} 100%); padding: 30px 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">${process.env.NEXT_PUBLIC_COMPANY_NAME || "EMPRESA JÚNIOR"}</h1>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: ${getThemeColor("secondary")}; font-size: 20px; margin-top: 0; margin-bottom: 8px;">Nova Demanda: ${title}</h2>
      <p style="font-size: 16px; color: #a1a1aa; margin-top: 0; margin-bottom: 24px;">
        Olá, você foi designado(a) para a ${typeName} <strong>${title}</strong>.
      </p>

      <div style="background-color: #27272a; border-left: 4px solid ${getThemeColor("secondary")}; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
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
        <p style="font-size: 15px; color: ${getThemeColor("secondary")}; font-weight: 600; margin: 0;">${deadlineStr}</p>
      </div>
    </div>
    <div style="background-color: #09090b; padding: 30px; text-align: center; border-top: 1px solid #27272a;">
      <div style="color: ${getThemeColor("secondary")}; font-weight: 800; font-size: 18px; letter-spacing: 2px;">${tenantConfig.phrases.emailFooter}</div>
      <div style="color: #71717a; font-size: 12px; margin-top: 12px;">Gestão de Demandas • ${process.env.NEXT_PUBLIC_COMPANY_NAME || "Empresa Júnior"}</div>
    </div>
  </div>
</body>
</html>
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { demand, sprint, emails, newSprintAssignees, action } = body;

    // Email
    const SMTP_EMAIL = process.env.SMTP_EMAIL;
    const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

    if (SMTP_EMAIL && SMTP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
      });

      if (sprint && newSprintAssignees && newSprintAssignees.length > 0) {
        let htmlBody = "";
        let subject = sprint.title;
        let prefix = "NOVA SPRINT";

        if (action === "pause") {
          prefix = "SPRINT PAUSADA";
          subject = `[PAUSADA] ${sprint.title}`;
          htmlBody = getPremiumEmail(
            sprint.title,
            "sprint",
            "Atenção: A sprint foi PAUSADA. O tempo parou de contar para os prazos enquanto aguardamos novas definições.",
            "Nenhum documento aplicável à pausa.",
            "Prazos congelados",
          );
        } else if (action === "resume") {
          prefix = "SPRINT RETOMADA";
          subject = `[RETOMADA] ${sprint.title}`;
          htmlBody = getPremiumEmail(
            sprint.title,
            "sprint",
            "A sprint foi RETOMADA. Os prazos de todas as suas demandas foram automaticamente recalculados e estendidos.",
            "Nenhum documento aplicável à retomada.",
            "Prazos recalculados",
          );
        } else {
          const sprintAttachments =
            sprint.attachments?.length > 0
              ? sprint.attachments
                  .map(
                    (a: { url: string; name: string }) =>
                      `<a href="${a.url}" target="_blank" style="color: ${getThemeColor("secondary")}; text-decoration: none;">${a.name}</a>`,
                  )
                  .join("<br/>")
              : "Nenhum documento anexado.";

          htmlBody = getPremiumEmail(
            sprint.title,
            "sprint",
            sprint.objective || "Nenhuma meta principal informada.",
            sprintAttachments,
            new Date(sprint.endDate).toLocaleDateString("pt-BR"),
          );
        }

        await transporter.sendMail({
          from: `${prefix} <${SMTP_EMAIL}>`,
          to: newSprintAssignees.join(","),
          subject: subject,
          html: htmlBody,
        });
      } else if (!sprint && emails && emails.length > 0) {
        // Individual Demand Email
        const demandAttachments =
          demand.attachments?.length > 0
            ? demand.attachments
                .map(
                  (a: { url: string; name: string }) =>
                    `<a href="${a.url}" target="_blank" style="color: ${getThemeColor("secondary")}; text-decoration: none;">${a.name}</a>`,
                )
                .join("<br/>")
            : "Nenhum documento anexado.";

        const htmlBody = getPremiumEmail(
          demand.title,
          "demanda",
          demand.description || "Nenhuma descrição detalhada.",
          demandAttachments,
          demand.deadline
            ? new Date(demand.deadline).toLocaleDateString("pt-BR", {
                timeZone: "UTC",
              })
            : "Sem data",
        );

        await transporter.sendMail({
          from: `NOVA DEMANDA <${SMTP_EMAIL}>`,
          to: emails.join(","),
          subject: demand.title,
          html: htmlBody,
        });

        console.log(transporter);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API de integrações:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
