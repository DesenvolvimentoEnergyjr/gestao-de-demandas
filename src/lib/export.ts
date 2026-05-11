import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sprint, Demand, User } from '@/types';
import { format } from 'date-fns';

export const exportSprintToPDF = async (sprint: Sprint, demands: Demand[], users: User[]) => {
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
    const labels: Record<string, string> = {
      backlog: 'Backlog',
      criando_escopo: 'Escopo',
      em_progresso: 'Progresso',
      em_revisao: 'Revisão',
      concluido: 'Concluído'
    };
    return labels[status] || status;
  };

  // Ordenar demandas cronologicamente para seguir a ordem das semanas (Semana 1, 2, 3...)
  const orderedDemands = [...demands].sort((a, b) => {
    const dateA = new Date(a.deadline || a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.deadline || b.startDate || b.createdAt || 0).getTime();
    return dateA - dateB;
  });

  // 1. Cabeçalho
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text('RELATÓRIO DE CICLO • ENERGY JÚNIOR', 15, 15);
  pdf.text(`Data de exportação: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 15, 15, { align: 'right' });

  pdf.setDrawColor(11, 175, 77); // Verde Energy
  pdf.setLineWidth(1);
  pdf.line(15, 18, pageWidth - 15, 18);

  // Título com suporte a múltiplas linhas (overflow)
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

  // 2. Objetivo e Resumo
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

  // 3. Tabela de Demandas
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
    headStyles: { fillColor: [11, 175, 77], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 75 }, // Aumentado um pouco para títulos de demanda
      1: { cellWidth: 55 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' } // Aumentado para evitar quebra em 'Esforço'
    }
  });

  // 4. Rodapé em todas as páginas
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  pdf.save(`Relatorio_Sprint_${sprint.number}_${sprint.title.replace(/\s+/g, '_')}.pdf`);
};
