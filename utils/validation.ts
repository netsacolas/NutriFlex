/**
 * Schemas de Validação com Zod
 *
 * Este arquivo contém todos os schemas de validação usados na aplicação.
 * Todos os dados de entrada do usuário DEVEM ser validados antes de serem processados.
 */

import { z } from 'zod';

// ====================
// AUTENTICAÇÃO
// ====================

/**
 * Schema para cadastro de novo usuário
 * REQUISITOS DE SEGURANÇA:
 * - Email válido
 * - Senha forte: 12+ caracteres, maiúscula, minúscula, número, símbolo
 */
export const signUpSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .min(5, 'Email muito curto')
    .max(100, 'Email muito longo')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(12, 'A senha deve ter no mínimo 12 caracteres')
    .max(100, 'Senha muito longa')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
    .regex(
      /[^A-Za-z0-9]/,
      'A senha deve conter pelo menos um caractere especial (!@#$%&*)'
    )
    .refine(
      (password) => {
        // Lista de senhas comuns que devem ser rejeitadas
        const commonPasswords = [
          'password123!',
          'password1234',
          '123456789abc',
          'qwerty123456',
          'admin123456!',
        ];
        return !commonPasswords.includes(password.toLowerCase());
      },
      { message: 'Esta senha é muito comum. Escolha uma senha mais única.' }
    ),
});

/**
 * Schema para login
 */
export const signInSchema = z.object({
  email: z.string().email('Email inválido').trim(),
  password: z.string().min(1, 'Senha é obrigatória'),
});

/**
 * Schema para alteração de senha
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: signUpSchema.shape.password,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// ====================
// PERFIL DO USUÁRIO
// ====================

/**
 * Schema para dados pessoais do perfil
 */
export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .trim()
    .optional(),

  email: z
    .string()
    .email('Email inválido')
    .max(100, 'Email muito longo')
    .toLowerCase()
    .trim(),

  weight: z
    .number()
    .min(20, 'Peso deve ser no mínimo 20 kg')
    .max(300, 'Peso deve ser no máximo 300 kg')
    .optional(),

  height: z
    .number()
    .min(50, 'Altura deve ser no mínimo 50 cm')
    .max(250, 'Altura deve ser no máximo 250 cm')
    .optional(),

  age: z
    .number()
    .int('Idade deve ser um número inteiro')
    .min(13, 'Você deve ter no mínimo 13 anos')
    .max(120, 'Idade inválida')
    .optional(),

  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Sexo deve ser "masculino" ou "feminino"' }),
  }).optional(),
});

// ====================
// METAS DE SAÚDE
// ====================

/**
 * Schema para metas de calorias por refeição
 */
export const calorieGoalsSchema = z.object({
  mealsPerDay: z
    .number()
    .int('Número de refeições deve ser inteiro')
    .min(1, 'Mínimo 1 refeição por dia')
    .max(6, 'Máximo 6 refeições por dia')
    .optional(),

  breakfastCalories: z
    .number()
    .min(50, 'Calorias do café da manhã: mínimo 50 kcal')
    .max(2000, 'Calorias do café da manhã: máximo 2000 kcal')
    .optional(),

  lunchCalories: z
    .number()
    .min(50, 'Calorias do almoço: mínimo 50 kcal')
    .max(2000, 'Calorias do almoço: máximo 2000 kcal')
    .optional(),

  dinnerCalories: z
    .number()
    .min(50, 'Calorias do jantar: mínimo 50 kcal')
    .max(2000, 'Calorias do jantar: máximo 2000 kcal')
    .optional(),

  snackCalories: z
    .number()
    .min(50, 'Calorias do lanche: mínimo 50 kcal')
    .max(1000, 'Calorias do lanche: máximo 1000 kcal')
    .optional(),

  snackQuantity: z
    .number()
    .int('Quantidade de lanches deve ser inteiro')
    .min(0, 'Quantidade de lanches: mínimo 0')
    .max(10, 'Quantidade de lanches: máximo 10')
    .optional(),
});

// ====================
// HISTÓRICO DE PESO
// ====================

/**
 * Schema para registro de peso
 */
export const weightEntrySchema = z.object({
  weight: z
    .number()
    .min(20, 'Peso deve ser no mínimo 20 kg')
    .max(300, 'Peso deve ser no máximo 300 kg'),
});

// ====================
// PLANEJAMENTO DE REFEIÇÕES
// ====================

/**
 * Schema para planejamento de refeição
 */
export const mealPlanSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    errorMap: () => ({ message: 'Tipo de refeição inválido' }),
  }),

  targetCalories: z
    .number()
    .min(50, 'Meta de calorias: mínimo 50 kcal')
    .max(10000, 'Meta de calorias: máximo 10000 kcal'),

  foods: z
    .array(
      z
        .string()
        .min(2, 'Nome do alimento muito curto')
        .max(100, 'Nome do alimento muito longo')
        .regex(
          /^[a-zA-ZÀ-ÿ0-9\s\-,().]+$/,
          'Alimento contém caracteres inválidos'
        )
        .trim()
    )
    .min(1, 'Adicione pelo menos 1 alimento')
    .max(20, 'Máximo 20 alimentos por refeição')
    .refine(
      (foods) => {
        // Verificar se há duplicatas (case-insensitive)
        const uniqueFoods = new Set(foods.map((f) => f.toLowerCase()));
        return uniqueFoods.size === foods.length;
      },
      { message: 'Há alimentos duplicados na lista' }
    ),
});

// ====================
// ATIVIDADES FÍSICAS
// ====================

/**
 * Schema para registro de atividade física
 */
export const physicalActivitySchema = z.object({
  activityType: z
    .string()
    .min(2, 'Nome da atividade muito curto')
    .max(100, 'Nome da atividade muito longo')
    .regex(
      /^[a-zA-ZÀ-ÿ0-9\s\-(),./]+$/,
      'Atividade contém caracteres inválidos'
    )
    .trim(),

  duration: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(1, 'Duração mínima: 1 minuto')
    .max(600, 'Duração máxima: 600 minutos (10 horas)'),

  caloriesBurned: z
    .number()
    .min(1, 'Calorias queimadas: mínimo 1 kcal')
    .max(10000, 'Calorias queimadas: máximo 10000 kcal')
    .optional(),
});

// ====================
// CHAT NUTRICIONAL
// ====================

/**
 * Schema para mensagem do chat
 */
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Mensagem não pode estar vazia')
    .max(2000, 'Mensagem muito longa (máximo 2000 caracteres)')
    .trim()
    .refine(
      (msg) => {
        // Bloquear HTML/scripts
        return !/<[^>]*>/g.test(msg);
      },
      { message: 'Mensagem contém HTML não permitido' }
    ),
});

// ====================
// UTILITÁRIOS
// ====================

/**
 * Helper para validar dados de forma segura
 * Retorna { success: true, data } ou { success: false, errors }
 */
export function validateData<T>(
  schema: z.Schema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.errors.map((err) => err.message);
    return { success: false, errors };
  }
}

/**
 * Helper para sanitizar strings (remover caracteres perigosos)
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>\"']/g, '') // Remove <, >, ", '
    .replace(/\s+/g, ' '); // Normaliza espaços múltiplos
}

/**
 * Helper para sanitizar HTML (para textareas)
 */
export function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ====================
// EXPORTS
// ====================

export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type ProfileData = z.infer<typeof profileSchema>;
export type CalorieGoalsData = z.infer<typeof calorieGoalsSchema>;
export type WeightEntryData = z.infer<typeof weightEntrySchema>;
export type MealPlanData = z.infer<typeof mealPlanSchema>;
export type PhysicalActivityData = z.infer<typeof physicalActivitySchema>;
export type ChatMessageData = z.infer<typeof chatMessageSchema>;
