-- ============================================================================
-- Migration: 008_add_hydration_system.sql
-- Descrição: Adiciona tabelas para sistema de hidratação personalizada
-- Data: 2025-01-27
-- ============================================================================

-- Tabela de configurações de hidratação do usuário
CREATE TABLE IF NOT EXISTS hydration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_goal_ml INTEGER NOT NULL DEFAULT 2000,
    wake_time TIME NOT NULL DEFAULT '07:00',
    sleep_time TIME NOT NULL DEFAULT '23:00',
    intake_size_ml INTEGER NOT NULL DEFAULT 250,
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    unit VARCHAR(10) DEFAULT 'ml' CHECK (unit IN ('ml', 'liters')),
    language VARCHAR(10) DEFAULT 'pt-BR',
    silent_start TIME,
    silent_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_user_settings UNIQUE (user_id),
    CONSTRAINT valid_daily_goal CHECK (daily_goal_ml >= 500 AND daily_goal_ml <= 10000),
    CONSTRAINT valid_intake_size CHECK (intake_size_ml >= 50 AND intake_size_ml <= 1000)
);

-- Tabela de ingestões de água
CREATE TABLE IF NOT EXISTS hydration_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_ml INTEGER NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    actual_time TIMESTAMPTZ,
    completed BOOLEAN DEFAULT false,
    snoozed BOOLEAN DEFAULT false,
    snooze_count INTEGER DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_amount CHECK (amount_ml > 0 AND amount_ml <= 2000),
    CONSTRAINT valid_snooze_count CHECK (snooze_count >= 0 AND snooze_count <= 10)
);

-- Índices para melhor performance
CREATE INDEX idx_hydration_settings_user_id ON hydration_settings(user_id);
CREATE INDEX idx_hydration_intakes_user_id ON hydration_intakes(user_id);
CREATE INDEX idx_hydration_intakes_date ON hydration_intakes(date);
CREATE INDEX idx_hydration_intakes_user_date ON hydration_intakes(user_id, date);

-- Row Level Security (RLS)
ALTER TABLE hydration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_intakes ENABLE ROW LEVEL SECURITY;

-- Policies para hydration_settings
CREATE POLICY "Users can view their own hydration settings"
    ON hydration_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hydration settings"
    ON hydration_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hydration settings"
    ON hydration_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hydration settings"
    ON hydration_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Policies para hydration_intakes
CREATE POLICY "Users can view their own hydration intakes"
    ON hydration_intakes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hydration intakes"
    ON hydration_intakes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hydration intakes"
    ON hydration_intakes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hydration intakes"
    ON hydration_intakes FOR DELETE
    USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_hydration_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER trigger_update_hydration_settings_updated_at
    BEFORE UPDATE ON hydration_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_hydration_settings_updated_at();

-- Função auxiliar para incrementar snooze_count
CREATE OR REPLACE FUNCTION increment_snooze(intake_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT snooze_count INTO current_count
    FROM hydration_intakes
    WHERE id = intake_id;

    RETURN current_count + 1;
END;
$$ LANGUAGE plpgsql;

-- View para estatísticas diárias de hidratação
CREATE OR REPLACE VIEW hydration_daily_stats AS
SELECT
    user_id,
    date,
    SUM(CASE WHEN completed THEN amount_ml ELSE 0 END) as consumed_ml,
    COUNT(*) as total_intakes,
    COUNT(CASE WHEN completed THEN 1 END) as completed_intakes,
    AVG(CASE WHEN completed THEN amount_ml END) as avg_intake_ml,
    MAX(actual_time) as last_intake_time
FROM hydration_intakes
GROUP BY user_id, date;

-- Comentários nas tabelas
COMMENT ON TABLE hydration_settings IS 'Configurações personalizadas de hidratação por usuário';
COMMENT ON TABLE hydration_intakes IS 'Registro de ingestões de água programadas e realizadas';
COMMENT ON VIEW hydration_daily_stats IS 'Estatísticas agregadas de hidratação por dia e usuário';

-- Comentários nas colunas
COMMENT ON COLUMN hydration_settings.daily_goal_ml IS 'Meta diária de água em mililitros';
COMMENT ON COLUMN hydration_settings.wake_time IS 'Horário que o usuário acorda';
COMMENT ON COLUMN hydration_settings.sleep_time IS 'Horário que o usuário dorme';
COMMENT ON COLUMN hydration_settings.intake_size_ml IS 'Quantidade padrão de cada ingestão em ml';
COMMENT ON COLUMN hydration_intakes.scheduled_time IS 'Horário programado para o lembrete';
COMMENT ON COLUMN hydration_intakes.actual_time IS 'Horário real que a água foi bebida';
COMMENT ON COLUMN hydration_intakes.snooze_count IS 'Quantas vezes o lembrete foi adiado';

-- ============================================================================
-- Fim da Migration
-- ============================================================================
