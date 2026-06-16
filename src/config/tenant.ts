export const tenantConfig = {
  // Phrases and slogans
  phrases: {
    loading: [
      "Vai energizar você!",
      "O que nós somos? ☠️",
      "Sexta-feira é hora de comemorar!",
      "Cravando a faca na caveira...",
      "Batendo metas pra valer...",
      "Já fez um kudo hoje?",
    ],
    sprintTagline: "Bate Meta pra Valer",
    emailFooter: "O QUE NÓS SOMOS? CAVEIRA!",
  },

  // Departments/Areas for timeline filtering
  departments: [
    { id: 'comercial', label: 'Comercial', keywords: ['COMERCIAL', 'VENDAS', 'MARKETING'] },
    { id: 'prodev', label: 'Desenvolvimento de Projetos', keywords: ['DESENVOLVIMENTO', 'PROJETOS', 'DEV', 'PRODEV'] },
    { id: 'rh', label: 'Recursos Humanos', keywords: ['RECURSOS HUMANOS', 'GENTE E GESTÃO', 'RH'] },
  ],

  // Project Types
  projectTypes: [
    { id: 'Interno', label: 'Projetos Internos', theme: 'primary' },
    { id: 'Externo', label: 'Serviços Empresa', theme: 'secondary' }
  ] as const,

  // Domain Mappings
  demandStatuses: [
    { id: 'backlog', label: 'Backlog', accentClass: 'bg-status-backlog', badgeClass: 'bg-status-backlog/20 text-status-backlog border-status-backlog/30' },
    { id: 'criando_escopo', label: 'Escopo', accentClass: 'bg-status-escopo', badgeClass: 'bg-status-escopo/20 text-status-escopo border-status-escopo/30' },
    { id: 'em_progresso', label: 'Em Progresso', accentClass: 'bg-status-progresso', badgeClass: 'bg-status-progresso/20 text-status-progresso border-status-progresso/30' },
    { id: 'em_revisao', label: 'Revisão', accentClass: 'bg-status-revisao', badgeClass: 'bg-status-revisao/20 text-status-revisao border-status-revisao/30' },
    { id: 'concluido', label: 'Concluído', accentClass: 'bg-status-concluido', badgeClass: 'bg-status-concluido/20 text-status-concluido border-status-concluido/30' }
  ] as const,

  priorities: [
    { id: 'baixa', label: 'Baixa', badgeClass: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30', cardClass: 'bg-priority-baixa' },
    { id: 'media', label: 'Média', badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/30', cardClass: 'bg-priority-media' },
    { id: 'alta', label: 'Alta', badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30', cardClass: 'bg-priority-alta' },
    { id: 'urgente', label: 'Urgente', badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30', cardClass: 'bg-priority-urgente' }
  ] as const,

  roles: [
    { id: 'diretor', label: 'Diretor' },
    { id: 'assessor', label: 'Assessor' }
  ] as const,

  userStatuses: [
    { id: 'ativo', label: 'Ativo' },
    { id: 'desligado', label: 'Desligado' },
    { id: 'pos_junior', label: 'Pós-Júnior' }
  ] as const,
};
