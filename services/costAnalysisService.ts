/**
 * Cost Analysis Service
 *
 * Calcula custos estimados de uso da API do Gemini
 * Baseado em preços oficiais do Gemini 2.0 Flash:
 * - Input: $0.10 por 1 milhão de tokens
 * - Output: $0.40 por 1 milhão de tokens
 */

import { supabase } from './supabaseClient';

// Preços por milhão de tokens (USD)
const PRICING = {
  INPUT_PER_MILLION: 0.10,
  OUTPUT_PER_MILLION: 0.40,
};

// Estimativas médias de tokens por tipo de requisição
// Baseado em observações reais do sistema
const TOKEN_ESTIMATES = {
  meal_calculation: {
    input: 800,   // Prompt detalhado com macros, alimentos, instruções
    output: 600,  // JSON com porções, macros, sugestões
  },
  'weight-analysis': {
    input: 400,   // Contexto de peso, histórico resumido
    output: 150,  // Análise curta e objetiva
  },
  'nutrition-chat': {
    input: 600,   // Contexto completo do usuário + mensagem
    output: 400,  // Resposta conversacional
  },
};

export interface CostBreakdown {
  requestType: string;
  count: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface CostAnalysis {
  totalRequests: number;
  breakdown: CostBreakdown[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  costInBRL: number; // Convertido para reais (taxa aproximada)
  period: {
    start: string;
    end: string;
  };
}

export interface RequestRecord {
  id: string;
  user_id: string;
  request_type: string;
  created_at: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
}

export interface RequestHistoryFilters {
  requestType?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'date_desc' | 'date_asc' | 'cost_desc' | 'cost_asc';
  limit?: number;
  offset?: number;
  userId?: string; // Para admin filtrar por usuário específico
}

export interface UserInfo {
  id: string;
  email: string;
  full_name: string | null;
}

/**
 * Calcula custo de uma única requisição
 */
export function calculateRequestCost(
  requestType: string,
  inputTokens?: number,
  outputTokens?: number
): number {
  const estimate = TOKEN_ESTIMATES[requestType as keyof typeof TOKEN_ESTIMATES] || {
    input: 500,
    output: 300,
  };

  const input = inputTokens || estimate.input;
  const output = outputTokens || estimate.output;

  const inputCost = (input / 1_000_000) * PRICING.INPUT_PER_MILLION;
  const outputCost = (output / 1_000_000) * PRICING.OUTPUT_PER_MILLION;

  return inputCost + outputCost;
}

/**
 * Busca análise de custos para o usuário autenticado
 */
export async function getUserCostAnalysis(
  periodDays: number = 30
): Promise<CostAnalysis | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Período de análise
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Buscar requisições do período
    const { data: requests, error } = await supabase
      .from('gemini_requests')
      .select('request_type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    if (!requests || requests.length === 0) {
      return {
        totalRequests: 0,
        breakdown: [],
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        costInBRL: 0,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };
    }

    // Agrupar por tipo de requisição
    const grouped = requests.reduce((acc, req) => {
      const type = req.request_type || 'unknown';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {} as Record<string, number>);

    // Calcular breakdown por tipo
    const breakdown: CostBreakdown[] = Object.entries(grouped).map(([type, count]) => {
      const estimate = TOKEN_ESTIMATES[type as keyof typeof TOKEN_ESTIMATES] || {
        input: 500,
        output: 300,
      };

      const totalInputTokens = estimate.input * count;
      const totalOutputTokens = estimate.output * count;

      const inputCost = (totalInputTokens / 1_000_000) * PRICING.INPUT_PER_MILLION;
      const outputCost = (totalOutputTokens / 1_000_000) * PRICING.OUTPUT_PER_MILLION;

      return {
        requestType: type,
        count,
        estimatedInputTokens: totalInputTokens,
        estimatedOutputTokens: totalOutputTokens,
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
      };
    });

    // Totais
    const totalInputTokens = breakdown.reduce((sum, b) => sum + b.estimatedInputTokens, 0);
    const totalOutputTokens = breakdown.reduce((sum, b) => sum + b.estimatedOutputTokens, 0);
    const totalCost = breakdown.reduce((sum, b) => sum + b.totalCost, 0);

    // Conversão aproximada USD -> BRL (taxa 5.0)
    const USD_TO_BRL = 5.0;
    const costInBRL = totalCost * USD_TO_BRL;

    return {
      totalRequests: requests.length,
      breakdown,
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      costInBRL,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error getting cost analysis:', error);
    return null;
  }
}

/**
 * Formata valor em dólares
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(value);
}

/**
 * Formata valor em reais
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(value);
}

/**
 * Traduz tipo de requisição para português
 */
export function translateRequestType(type: string): string {
  const translations: Record<string, string> = {
    meal_calculation: 'Cálculo de Refeição',
    'weight-analysis': 'Análise de Peso',
    'nutrition-chat': 'Chat Nutricional',
    unknown: 'Desconhecido',
  };

  return translations[type] || type;
}

/**
 * Retorna ícone para tipo de requisição
 */
export function getRequestTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    meal_calculation: '🍽️',
    'weight-analysis': '⚖️',
    'nutrition-chat': '💬',
    unknown: '❓',
  };

  return icons[type] || '📊';
}

/**
 * Busca histórico detalhado de requisições com filtros
 */
export async function getRequestHistory(
  filters: RequestHistoryFilters = {}
): Promise<{ records: RequestRecord[]; total: number } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Construir query base
    let query = supabase
      .from('gemini_requests')
      .select('id, user_id, request_type, created_at', { count: 'exact' })
      .eq('user_id', user.id);

    // Aplicar filtro de tipo
    if (filters.requestType && filters.requestType !== 'all') {
      query = query.eq('request_type', filters.requestType);
    }

    // Aplicar filtro de data
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    // Aplicar ordenação
    const sortBy = filters.sortBy || 'date_desc';
    if (sortBy === 'date_desc') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'date_asc') {
      query = query.order('created_at', { ascending: true });
    }
    // Para ordenação por custo, vamos fazer no frontend após calcular

    // Aplicar paginação
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: requests, error, count } = await query;

    if (error) throw error;

    if (!requests) {
      return { records: [], total: 0 };
    }

    // Processar cada requisição para calcular custos estimados
    const records: RequestRecord[] = requests.map((req) => {
      const estimate = TOKEN_ESTIMATES[req.request_type as keyof typeof TOKEN_ESTIMATES] || {
        input: 500,
        output: 300,
      };

      const inputCost = (estimate.input / 1_000_000) * PRICING.INPUT_PER_MILLION;
      const outputCost = (estimate.output / 1_000_000) * PRICING.OUTPUT_PER_MILLION;

      return {
        id: req.id,
        user_id: req.user_id,
        request_type: req.request_type,
        created_at: req.created_at,
        estimatedInputTokens: estimate.input,
        estimatedOutputTokens: estimate.output,
        estimatedCost: inputCost + outputCost,
      };
    });

    // Ordenar por custo se necessário (no frontend)
    if (sortBy === 'cost_desc') {
      records.sort((a, b) => b.estimatedCost - a.estimatedCost);
    } else if (sortBy === 'cost_asc') {
      records.sort((a, b) => a.estimatedCost - b.estimatedCost);
    }

    return {
      records,
      total: count || 0,
    };
  } catch (error) {
    console.error('Error getting request history:', error);
    return null;
  }
}

/**
 * Formata data e hora para exibição
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

/**
 * Formata data para exibição (sem hora)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formata hora para exibição
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

/**
 * Email do administrador do sistema
 */
const ADMIN_EMAIL = 'mariocromia@gmail.com';

/**
 * Verifica se o usuário atual é administrador
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    return user.email === ADMIN_EMAIL;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Busca todos os usuários do sistema (apenas para admin)
 * Busca direto de gemini_requests para garantir que todos os usuários com requests apareçam
 */
export async function getAllUsers(): Promise<UserInfo[]> {
  try {
    const admin = await isAdmin();
    if (!admin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Buscar todos os user_ids únicos que fizeram requisições
    const { data: requestUsers, error: requestError } = await supabase
      .from('gemini_requests')
      .select('user_id')
      .order('user_id');

    if (requestError) throw requestError;

    // Obter IDs únicos
    const uniqueUserIds = [...new Set(requestUsers?.map(r => r.user_id) || [])];

    // Buscar dados de profiles para esses usuários
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', uniqueUserIds);

    if (profileError) {
      console.warn('Error fetching profiles:', profileError);
    }

    // Criar map de profiles
    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

    // Tentar buscar emails via auth (pode falhar sem permissão admin)
    let emailMap = new Map<string, string>();
    try {
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
      if (!authError && users) {
        emailMap = new Map(users.map(u => [u.id, u.email || '']));
      }
    } catch (authErr) {
      console.warn('Could not fetch auth users:', authErr);
    }

    // Combinar todos os dados
    const userList: UserInfo[] = uniqueUserIds.map(userId => ({
      id: userId,
      email: emailMap.get(userId) || userId,
      full_name: profileMap.get(userId) || null,
    }));

    // Ordenar por email
    userList.sort((a, b) => a.email.localeCompare(b.email));

    return userList;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

/**
 * Busca ID do usuário por email
 */
async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error || !users) return null;

    const user = users.find(u => u.email === email);
    return user?.id || null;
  } catch (error) {
    console.error('Error getting user ID by email:', error);
    return null;
  }
}

/**
 * Busca análise de custos de todos os usuários (apenas para admin)
 * @param periodDays - Período em dias
 * @param userEmailOrId - Email ou ID do usuário (aceita ambos)
 */
export async function getAllUsersCostAnalysis(
  periodDays: number = 30,
  userEmailOrId?: string
): Promise<CostAnalysis | null> {
  try {
    const admin = await isAdmin();
    if (!admin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Período de análise
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Determinar se é email ou ID
    let userId: string | null = null;
    if (userEmailOrId && userEmailOrId !== 'all') {
      // Se contém @, é email - buscar o ID
      if (userEmailOrId.includes('@')) {
        userId = await getUserIdByEmail(userEmailOrId);
        if (!userId) {
          console.warn('User not found for email:', userEmailOrId);
          return null;
        }
      } else {
        userId = userEmailOrId;
      }
    }

    // Construir query base
    let query = supabase
      .from('gemini_requests')
      .select('request_type, created_at, user_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Se userId fornecido, filtrar por usuário específico
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: requests, error } = await query;

    if (error) throw error;

    if (!requests || requests.length === 0) {
      return {
        totalRequests: 0,
        breakdown: [],
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        costInBRL: 0,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };
    }

    // Agrupar por tipo de requisição
    const grouped = requests.reduce((acc, req) => {
      const type = req.request_type || 'unknown';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {} as Record<string, number>);

    // Calcular breakdown por tipo
    const breakdown: CostBreakdown[] = Object.entries(grouped).map(([type, count]) => {
      const estimate = TOKEN_ESTIMATES[type as keyof typeof TOKEN_ESTIMATES] || {
        input: 500,
        output: 300,
      };

      const totalInputTokens = estimate.input * count;
      const totalOutputTokens = estimate.output * count;

      const inputCost = (totalInputTokens / 1_000_000) * PRICING.INPUT_PER_MILLION;
      const outputCost = (totalOutputTokens / 1_000_000) * PRICING.OUTPUT_PER_MILLION;

      return {
        requestType: type,
        count,
        estimatedInputTokens: totalInputTokens,
        estimatedOutputTokens: totalOutputTokens,
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
      };
    });

    // Totais
    const totalInputTokens = breakdown.reduce((sum, b) => sum + b.estimatedInputTokens, 0);
    const totalOutputTokens = breakdown.reduce((sum, b) => sum + b.estimatedOutputTokens, 0);
    const totalCost = breakdown.reduce((sum, b) => sum + b.totalCost, 0);

    // Conversão aproximada USD -> BRL (taxa 5.0)
    const USD_TO_BRL = 5.0;
    const costInBRL = totalCost * USD_TO_BRL;

    return {
      totalRequests: requests.length,
      breakdown,
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      costInBRL,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error getting all users cost analysis:', error);
    return null;
  }
}

/**
 * Busca histórico detalhado de requisições com filtros (com suporte admin)
 */
export async function getAdminRequestHistory(
  filters: RequestHistoryFilters = {}
): Promise<{ records: RequestRecord[]; total: number } | null> {
  try {
    const admin = await isAdmin();
    if (!admin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Determinar userId a partir de email se necessário
    let userId: string | null = null;
    if (filters.userId && filters.userId !== 'all') {
      // Se contém @, é email - buscar o ID
      if (filters.userId.includes('@')) {
        userId = await getUserIdByEmail(filters.userId);
        if (!userId) {
          console.warn('User not found for email:', filters.userId);
          return { records: [], total: 0 };
        }
      } else {
        userId = filters.userId;
      }
    }

    // Construir query base
    let query = supabase
      .from('gemini_requests')
      .select('id, user_id, request_type, created_at', { count: 'exact' });

    // Se userId fornecido, filtrar por usuário
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Aplicar filtro de tipo
    if (filters.requestType && filters.requestType !== 'all') {
      query = query.eq('request_type', filters.requestType);
    }

    // Aplicar filtro de data
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    // Aplicar ordenação
    const sortBy = filters.sortBy || 'date_desc';
    if (sortBy === 'date_desc') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'date_asc') {
      query = query.order('created_at', { ascending: true });
    }

    // Aplicar paginação
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: requests, error, count } = await query;

    if (error) throw error;

    if (!requests) {
      return { records: [], total: 0 };
    }

    // Processar cada requisição para calcular custos estimados
    const records: RequestRecord[] = requests.map((req) => {
      const estimate = TOKEN_ESTIMATES[req.request_type as keyof typeof TOKEN_ESTIMATES] || {
        input: 500,
        output: 300,
      };

      const inputCost = (estimate.input / 1_000_000) * PRICING.INPUT_PER_MILLION;
      const outputCost = (estimate.output / 1_000_000) * PRICING.OUTPUT_PER_MILLION;

      return {
        id: req.id,
        user_id: req.user_id,
        request_type: req.request_type,
        created_at: req.created_at,
        estimatedInputTokens: estimate.input,
        estimatedOutputTokens: estimate.output,
        estimatedCost: inputCost + outputCost,
      };
    });

    // Ordenar por custo se necessário (no frontend)
    if (sortBy === 'cost_desc') {
      records.sort((a, b) => b.estimatedCost - a.estimatedCost);
    } else if (sortBy === 'cost_asc') {
      records.sort((a, b) => a.estimatedCost - b.estimatedCost);
    }

    return {
      records,
      total: count || 0,
    };
  } catch (error) {
    console.error('Error getting admin request history:', error);
    return null;
  }
}
