import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sprint, Demand, User } from '@/types';
import { format } from 'date-fns';
import tailwindConfig from '../../tailwind.config';
import { tenantConfig } from '@/config/tenant';

export const exportSprintToPDF = async (sprint: Sprint, demands: Demand[], users: User[]) => {
  const secondaryColor = (tailwindConfig.theme?.extend?.colors as Record<string, string>)?.secondary || '#0baf4d';
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  const formatDate = (date: Date | string | number | null | undefined) => {
    if (!date) return '—';
    return format(new Date(date), "dd/MM/yyyy");
  };

  const getUserNames = (uids: string[]) => {
    return uids.map(uid => users.find(u => u.uid === uid)?.name || 'Unknown').join(', ');
  };

  const getStatusLabel = (status: string) => {
    const configStatus = tenantConfig.demandStatuses.find(s => s.id === status);
    return configStatus?.label || status;
  };

  // Sort demands cronologically to follow the order of the weeks (Week 1, 2, 3...)
  const orderedDemands = [...demands].sort((a, b) => {
    const dateA = new Date(a.deadline || a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.deadline || b.startDate || b.createdAt || 0).getTime();
    return dateA - dateB;
  });

  // 1. Header
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`RELATÓRIO DE CICLO • ${(process.env.NEXT_PUBLIC_COMPANY_NAME || 'EMPRESA JÚNIOR').toUpperCase()}`, 15, 15);
  pdf.text(`Data de exportação: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 15, 15, { align: 'right' });

  pdf.setDrawColor(secondaryColor);
  pdf.setLineWidth(1);
  pdf.line(15, 18, pageWidth - 15, 18);

  pdf.setFontSize(22);
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  const titleText = `Sprint #${sprint.number}: ${sprint.title}`;
  const splitTitle = pdf.splitTextToSize(titleText, pageWidth - 30);
  pdf.text(splitTitle, 15, 30);

  const titleHeight = (splitTitle.length * 8);
  const afterTitleY = 30 + titleHeight;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80);
  pdf.text(`${formatDate(sprint.startDate)} até ${formatDate(sprint.endDate)}`, 15, afterTitleY);

  // 2. Strategic objective
  const objectiveY = afterTitleY + 15;
  pdf.setFontSize(14);
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Objetivo Estratégico', 15, objectiveY);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  const splitObjective = pdf.splitTextToSize(sprint.objective || 'Nenhum objetivo definido.', pageWidth - 30);
  pdf.text(splitObjective, 15, objectiveY + 7);

  const currentY = objectiveY + 7 + (splitObjective.length * 6) + 12;

  // 3. Table of demands
  pdf.setFontSize(14);
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Escopo de Atividades', 15, currentY);

  const tableData = orderedDemands.map(d => [
    d.title,
    getUserNames(d.assignees),
    getStatusLabel(d.status),
    `${d.estimatedHours}h`
  ]);

  autoTable(pdf, {
    startY: currentY + 5,
    head: [['Demanda', 'Responsáveis', 'Status', 'Esforço']],
    body: tableData,
    headStyles: { fillColor: secondaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 75 },
      1: { cellWidth: 55 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' }
    }
  });

  // 4. Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  pdf.save(`Relatorio_Sprint_${sprint.number}_${sprint.title.replace(/\s+/g, '_')}.pdf`);
};
