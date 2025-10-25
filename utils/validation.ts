/**
 * Schemas de Valida��o com Zod
 *
 * Este arquivo cont�m todos os schemas de valida��o usados na aplica��o.
 * Todos os dados de entrada do usu�rio DEVEM ser validados antes de serem processados.
 */

import { z } from 'zod';

// ====================
// AUTENTICA��O
// ====================

/**
 * Schema para cadastro de novo usu�rio
 * REQUISITOS DE SEGURAN�A:
 * - Email v�lido
 * - Senha forte: 12+ caracteres, mai�scula, min�scula, n�mero, s�mbolo
 */
export const signUpSchema = z.object({
  email: z
    .string()
    .email('Email inv�lido')
    .min(5, 'Email muito curto')
    .max(100, 'Email muito longo')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(12, 'A senha deve ter no m�nimo 12 caracteres')
    .max(100, 'Senha muito longa')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra mai�scula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra min�scula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um n�mero')
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
      { message: 'Esta senha � muito comum. Escolha uma senha mais �nica.' }
    ),
});

/**
 * Schema para login
 */
export const signInSchema = z.object({
  email: z.string().email('Email inv�lido').trim(),
  password: z.string().min(1, 'Senha � obrigat�ria'),
});

/**
 * Schema para altera��o de senha
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual � obrigat�ria'),
  newPassword: signUpSchema.shape.password,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas n�o coincidem',
  path: ['confirmPassword'],
});

// ====================
// PERFIL DO USU�RIO
// ====================

/**
 * Schema para dados pessoais do perfil
 */
export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Nome deve ter no m�nimo 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-Z�-�\s]+$/, 'Nome deve conter apenas letras e espa�os')
    .trim()
    .optional(),

  email: z
    .string()
    .email('Email inv�lido')
    .max(100, 'Email muito longo')
    .toLowerCase()
    .trim(),

  weight: z
    .number()
    .min(20, 'Peso deve ser no m�nimo 20 kg')
    .max(300, 'Peso deve ser no m�ximo 300 kg')
    .optional(),

  height: z
    .number()
    .min(50, 'Altura deve ser no m�nimo 50 cm')
    .max(250, 'Altura deve ser no m�ximo 250 cm')
    .optional(),

  age: z
    .number()
    .int('Idade deve ser um n�mero inteiro')
    .min(13, 'Voc� deve ter no m�nimo 13 anos')
    .max(120, 'Idade inv�lida')
    .optional(),

  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Sexo deve ser "masculino" ou "feminino"' }),
  }).optional(),
});

// ====================
// METAS DE SA�DE
// ====================

/**
 * Schema para metas de calorias por refei��o
 */
export const calorieGoalsSchema = z.object({
  mealsPerDay: z
    .number()
    .int('N�mero de refei��es deve ser inteiro')
    .min(1, 'M�nimo 1 refei��o por dia')
    .max(6, 'M�ximo 6 refei��es por dia')
    .optional(),

  breakfastCalories: z
    .number()
    .min(50, 'Calorias do caf� da manh�: m�nimo 50 kcal')
    .max(2000, 'Calorias do caf� da manh�: m�ximo 2000 kcal')
    .optional(),

  lunchCalories: z
    .number()
    .min(50, 'Calorias do almo�o: m�nimo 50 kcal')
    .max(2000, 'Calorias do almo�o: m�ximo 2000 kcal')
    .optional(),

  dinnerCalories: z
    .number()
    .min(50, 'Calorias do jantar: m�nimo 50 kcal')
    .max(2000, 'Calorias do jantar: m�ximo 2000 kcal')
    .optional(),

  snackCalories: z
    .number()
    .min(50, 'Calorias do lanche: m�nimo 50 kcal')
    .max(1000, 'Calorias do lanche: m�ximo 1000 kcal')
    .optional(),

  snackQuantity: z
    .number()
    .int('Quantidade de lanches deve ser inteiro')
    .min(0, 'Quantidade de lanches: m�nimo 0')
    .max(10, 'Quantidade de lanches: m�ximo 10')
    .optional(),
});

// ====================
// HIST�RICO DE PESO
// ====================

/**
 * Schema para registro de peso
 */
export const weightEntrySchema = z.object({
  weight: z
    .number()
    .min(20, 'Peso deve ser no m�nimo 20 kg')
    .max(300, 'Peso deve ser no m�ximo 300 kg'),
});

// ====================
// PLANEJAMENTO DE REFEI��ES
// ====================

/**
 * Schema para planejamento de refei��o
 */
export const mealPlanSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    errorMap: () => ({ message: 'Tipo de refei��o inv�lido' }),
  }),

  targetCalories: z
    .number()
    .min(50, 'Meta de calorias: m�nimo 50 kcal')
    .max(10000, 'Meta de calorias: m�ximo 10000 kcal'),

  foods: z
    .array(
      z
        .string()
        .min(2, 'Nome do alimento muito curto')
        .max(100, 'Nome do alimento muito longo')
        .regex(
          /^[a-zA-Z�-�0-9\s\-,().]+$/,
          'Alimento cont�m caracteres inv�lidos'
        )
        .trim()
    )
    .min(1, 'Adicione pelo menos 1 alimento')
    .max(20, 'M�ximo 20 alimentos por refei��o')
    .refine(
      (foods) => {
        // Verificar se h� duplicatas (case-insensitive)
        const uniqueFoods = new Set(foods.map((f) => f.toLowerCase()));
        return uniqueFoods.size === foods.length;
      },
      { message: 'H� alimentos duplicados na lista' }
    ),
});

// ====================
// ATIVIDADES F�SICAS
// ====================

/**
 * Schema para registro de atividade f�sica
 */
export const physicalActivitySchema = z.object({
  activityType: z
    .string()
    .min(2, 'Nome da atividade muito curto')
    .max(100, 'Nome da atividade muito longo')
    .regex(
      /^[a-zA-Z�-�0-9\s\-(),./]+$/,
      'Atividade cont�m caracteres inv�lidos'
    )
    .trim(),

  duration: z
    .number()
    .int('Dura��o deve ser um n�mero inteiro')
    .min(1, 'Dura��o m�nima: 1 minuto')
    .max(600, 'Dura��o m�xima: 600 minutos (10 horas)'),

  caloriesBurned: z
    .number()
    .min(1, 'Calorias queimadas: m�nimo 1 kcal')
    .max(10000, 'Calorias queimadas: m�ximo 10000 kcal')
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
    .min(1, 'Mensagem n�o pode estar vazia')
    .max(2000, 'Mensagem muito longa (m�ximo 2000 caracteres)')
    .trim()
    .refine(
      (msg) => {
        // Bloquear HTML/scripts
        return !/<[^>]*>/g.test(msg);
      },
      { message: 'Mensagem cont�m HTML n�o permitido' }
    ),
});

// ====================
// UTILIT�RIOS
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
    .replace(/\s+/g, ' '); // Normaliza espa�os m�ltiplos
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
