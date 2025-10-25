// Banco de dados de atividades físicas comuns
// MET (Metabolic Equivalent of Task) values para cálculo de calorias

export interface ActivityData {
  name: string;
  met: number; // MET value (múltiplo da taxa metabólica basal)
  category: string;
}

// Fórmula: Calorias = MET × peso(kg) × tempo(horas)
export const activitiesDatabase: ActivityData[] = [
  // Caminhada
  { name: 'Caminhada leve', met: 2.5, category: 'Caminhada' },
  { name: 'Caminhada moderada', met: 3.5, category: 'Caminhada' },
  { name: 'Caminhada rápida', met: 4.5, category: 'Caminhada' },
  { name: 'Caminhada na esteira', met: 3.8, category: 'Caminhada' },

  // Corrida
  { name: 'Corrida leve', met: 6.0, category: 'Corrida' },
  { name: 'Corrida moderada', met: 8.0, category: 'Corrida' },
  { name: 'Corrida rápida', met: 10.0, category: 'Corrida' },
  { name: 'Corrida intensa', met: 12.0, category: 'Corrida' },
  { name: 'Cooper', met: 9.0, category: 'Corrida' },
  { name: 'Trote', met: 7.0, category: 'Corrida' },

  // Ciclismo
  { name: 'Ciclismo leve', met: 4.0, category: 'Ciclismo' },
  { name: 'Ciclismo moderado', met: 6.8, category: 'Ciclismo' },
  { name: 'Ciclismo intenso', met: 10.0, category: 'Ciclismo' },
  { name: 'Bicicleta ergométrica leve', met: 3.5, category: 'Ciclismo' },
  { name: 'Bicicleta ergométrica moderada', met: 6.0, category: 'Ciclismo' },
  { name: 'Mountain bike', met: 8.5, category: 'Ciclismo' },

  // Natação
  { name: 'Natação leve', met: 6.0, category: 'Natação' },
  { name: 'Natação moderada', met: 8.0, category: 'Natação' },
  { name: 'Natação intensa', met: 10.0, category: 'Natação' },
  { name: 'Nado crawl', met: 9.0, category: 'Natação' },
  { name: 'Nado costas', met: 7.0, category: 'Natação' },
  { name: 'Hidroginástica', met: 5.3, category: 'Natação' },

  // Musculação
  { name: 'Musculação leve', met: 3.0, category: 'Musculação' },
  { name: 'Musculação moderada', met: 5.0, category: 'Musculação' },
  { name: 'Musculação intensa', met: 6.0, category: 'Musculação' },
  { name: 'CrossFit', met: 8.0, category: 'Musculação' },
  { name: 'Levantamento de peso', met: 6.0, category: 'Musculação' },

  // Esportes coletivos
  { name: 'Futebol', met: 7.0, category: 'Esportes' },
  { name: 'Futsal', met: 8.0, category: 'Esportes' },
  { name: 'Basquete', met: 6.5, category: 'Esportes' },
  { name: 'Vôlei', met: 4.0, category: 'Esportes' },
  { name: 'Tênis', met: 7.3, category: 'Esportes' },
  { name: 'Tênis de mesa', met: 4.0, category: 'Esportes' },
  { name: 'Handebol', met: 8.0, category: 'Esportes' },
  { name: 'Badminton', met: 5.5, category: 'Esportes' },

  // Artes marciais
  { name: 'Artes marciais leve', met: 5.3, category: 'Artes Marciais' },
  { name: 'Artes marciais moderada', met: 10.3, category: 'Artes Marciais' },
  { name: 'Boxe treino', met: 6.0, category: 'Artes Marciais' },
  { name: 'Boxe sparring', met: 9.0, category: 'Artes Marciais' },
  { name: 'Jiu-jitsu', met: 10.3, category: 'Artes Marciais' },
  { name: 'Judô', met: 10.0, category: 'Artes Marciais' },
  { name: 'Karatê', met: 10.0, category: 'Artes Marciais' },
  { name: 'Muay Thai', met: 10.3, category: 'Artes Marciais' },
  { name: 'Capoeira', met: 7.0, category: 'Artes Marciais' },

  // Ginástica e dança
  { name: 'Ginástica aeróbica', met: 7.3, category: 'Ginástica' },
  { name: 'Ginástica aeróbica intensa', met: 10.0, category: 'Ginástica' },
  { name: 'Step', met: 7.0, category: 'Ginástica' },
  { name: 'Zumba', met: 6.0, category: 'Ginástica' },
  { name: 'Dança moderna', met: 4.8, category: 'Ginástica' },
  { name: 'Balé', met: 4.8, category: 'Ginástica' },
  { name: 'Pilates', met: 3.0, category: 'Ginástica' },
  { name: 'Yoga', met: 2.5, category: 'Ginástica' },
  { name: 'Yoga Power', met: 4.0, category: 'Ginástica' },
  { name: 'Alongamento', met: 2.3, category: 'Ginástica' },

  // HIIT e Treinos intervalados
  { name: 'HIIT', met: 10.0, category: 'HIIT' },
  { name: 'Treino intervalado', met: 8.0, category: 'HIIT' },
  { name: 'Tabata', met: 12.0, category: 'HIIT' },
  { name: 'Circuit training', met: 8.0, category: 'HIIT' },

  // Esportes individuais
  { name: 'Escalada', met: 7.5, category: 'Esportes' },
  { name: 'Pular corda leve', met: 8.0, category: 'Esportes' },
  { name: 'Pular corda rápido', met: 12.0, category: 'Esportes' },
  { name: 'Skate', met: 5.0, category: 'Esportes' },
  { name: 'Patins', met: 7.0, category: 'Esportes' },
  { name: 'Remo', met: 7.0, category: 'Esportes' },
  { name: 'Remo competitivo', met: 12.0, category: 'Esportes' },

  // Atividades cotidianas
  { name: 'Subir escadas', met: 8.0, category: 'Cotidiano' },
  { name: 'Jardinagem', met: 4.0, category: 'Cotidiano' },
  { name: 'Limpeza doméstica', met: 3.5, category: 'Cotidiano' },
  { name: 'Carregar compras', met: 3.0, category: 'Cotidiano' },

  // Esportes aquáticos
  { name: 'Surf', met: 3.0, category: 'Aquáticos' },
  { name: 'Stand up paddle', met: 6.0, category: 'Aquáticos' },
  { name: 'Caiaque', met: 5.0, category: 'Aquáticos' },
  { name: 'Mergulho', met: 7.0, category: 'Aquáticos' },

  // Outros
  { name: 'Elíptico moderado', met: 5.0, category: 'Academia' },
  { name: 'Elíptico intenso', met: 8.0, category: 'Academia' },
  { name: 'Spinning', met: 8.5, category: 'Academia' },
  { name: 'Jump', met: 7.0, category: 'Academia' },
  { name: 'Funcional', met: 7.0, category: 'Academia' },
];

/**
 * Calcula calorias queimadas baseado em MET, peso e duração
 * Fórmula: Calorias = MET × peso(kg) × tempo(horas)
 */
export function calculateCaloriesBurned(
  met: number,
  weightKg: number,
  durationMinutes: number
): number {
  const hours = durationMinutes / 60;
  return Math.round(met * weightKg * hours);
}

/**
 * Busca atividades por termo
 */
export function searchActivities(searchTerm: string, limit: number = 10): string[] {
  const term = searchTerm.toLowerCase().trim();

  if (!term) {
    return [];
  }

  const results = activitiesDatabase
    .filter(activity => activity.name.toLowerCase().includes(term))
    .slice(0, limit)
    .map(activity => activity.name);

  return results;
}

/**
 * Obtém dados de uma atividade pelo nome
 */
export function getActivityData(activityName: string): ActivityData | null {
  return activitiesDatabase.find(
    activity => activity.name.toLowerCase() === activityName.toLowerCase()
  ) || null;
}

/**
 * Obtém MET de uma atividade pelo nome
 */
export function getActivityMET(activityName: string): number | null {
  const activity = getActivityData(activityName);
  return activity ? activity.met : null;
}
