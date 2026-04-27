import { z } from 'zod';

// ─── Demanda ────────────────────────────────────────────────────────────────

export const demandaSchema = z
  .object({
    title: z
      .string()
      .min(3, 'O título deve ter pelo menos 3 caracteres.')
      .max(120, 'O título não pode ultrapassar 120 caracteres.'),

    description: z
      .string()
      .max(5000, 'A descrição não pode ultrapassar 5000 caracteres.')
      .optional()
      .default(''),

    status: z.enum(['backlog', 'criando_escopo', 'em_progresso', 'em_revisao', 'concluido'] as const),

    priority: z.enum(['baixa', 'media', 'alta', 'urgente'] as const),

    projectType: z.enum(['Interno', 'Externo'] as const),

    assignees: z.array(z.string()).optional().default([]),

    sprintId: z.string().optional().default(''),

    startDate: z.string().optional().default(''),

    deadline: z.string().optional().default(''),

    estimatedHours: z
      .number()
      .min(0, 'As horas estimadas não podem ser negativas.')
      .max(999, 'Valor de horas muito alto.'),

    createdAt: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.deadline) {
        return new Date(data.deadline) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'O deadline deve ser igual ou posterior à data de início.',
      path: ['deadline'],
    }
  )
  .refine(
    (data) => {
      if (!data.startDate) return true;
      return new Date(data.startDate).getFullYear() <= new Date().getFullYear();
    },
    { message: 'A data de início não pode ser para o ano que vem.', path: ['startDate'] }
  )
  .refine(
    (data) => {
      if (!data.deadline) return true;
      return new Date(data.deadline).getFullYear() <= new Date().getFullYear();
    },
    { message: 'O deadline não pode ser para o ano que vem.', path: ['deadline'] }
  );

export type DemandaFormData = z.infer<typeof demandaSchema>;

// ─── Sprint ─────────────────────────────────────────────────────────────────

export const sprintSchema = z
  .object({
    title: z
      .string()
      .min(3, 'O título deve ter pelo menos 3 caracteres.')
      .max(120, 'O título não pode ultrapassar 120 caracteres.'),

    objective: z
      .string()
      .min(10, 'O objetivo deve ter pelo menos 10 caracteres.')
      .max(500, 'O objetivo não pode ultrapassar 500 caracteres.'),

    description: z
      .string()
      .max(5000, 'A descrição não pode ultrapassar 5000 caracteres.')
      .optional()
      .default(''),

    startDate: z.string().min(1, 'A data de início é obrigatória.'),

    endDate: z.string().min(1, 'A data de término é obrigatória.'),

    totalPoints: z
      .number()
      .min(1, 'A meta de pontos deve ser pelo menos 1.')
      .max(10000, 'Valor de pontos muito alto.'),

    type: z.enum(['Interno', 'Externo'] as const).optional().default('Interno'),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'A data de término deve ser posterior à data de início.',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      if (!data.startDate) return true;
      return new Date(data.startDate).getFullYear() <= new Date().getFullYear();
    },
    { message: 'A data de início não pode ser para o ano que vem.', path: ['startDate'] }
  )
  .refine(
    (data) => {
      if (!data.endDate) return true;
      return new Date(data.endDate).getFullYear() <= new Date().getFullYear();
    },
    { message: 'A data de término não pode ser para o ano que vem.', path: ['endDate'] }
  );

export const sprintUpdateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  objective: z.string().min(10).max(500).optional(),
  description: z.string().max(2000).optional(),
  startDate: z.union([z.string(), z.date()]).optional(),
  endDate: z.union([z.string(), z.date()]).optional(),
  totalPoints: z.number().min(1).max(10000).optional(),
  type: z.enum(['Interno', 'Externo'] as const).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'A data de término deve ser posterior à data de início.',
    path: ['endDate'],
  }
)
.refine(
  (data) => {
    if (!data.startDate) return true;
    return new Date(data.startDate).getFullYear() <= new Date().getFullYear();
  },
  { message: 'A data de início não pode ser para o ano que vem.', path: ['startDate'] }
)
.refine(
  (data) => {
    if (!data.endDate) return true;
    return new Date(data.endDate).getFullYear() <= new Date().getFullYear();
  },
  { message: 'A data de término não pode ser para o ano que vem.', path: ['endDate'] }
);

export type SprintFormData = z.infer<typeof sprintSchema>;
export type SprintUpdateData = z.infer<typeof sprintUpdateSchema>;
