-- =====================================================
-- VERIFICAR QUAIS TABELAS EXISTEM NO BANCO
-- =====================================================
-- Execute este arquivo no SQL Editor do Supabase para ver quais tabelas existem
-- https://supabase.com/dashboard/project/keawapzxqoyesptwpwav

-- 1. Listar todas as tabelas do schema public
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar se tabelas críticas existem
SELECT
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
        THEN '✅' ELSE '❌' END as profiles,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'weight_history')
        THEN '✅' ELSE '❌' END as weight_history,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meal_consumption')
        THEN '✅' ELSE '❌' END as meal_consumption,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'physical_activities')
        THEN '✅' ELSE '❌' END as physical_activities,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gemini_requests')
        THEN '✅' ELSE '❌' END as gemini_requests;

-- 3. Contar registros em cada tabela
SELECT
    'profiles' as tabela,
    COUNT(*) as registros
FROM profiles
UNION ALL
SELECT
    'meal_consumption' as tabela,
    COUNT(*) as registros
FROM meal_consumption
UNION ALL
SELECT
    'physical_activities' as tabela,
    COUNT(*) as registros
FROM physical_activities
UNION ALL
SELECT
    'gemini_requests' as tabela,
    COUNT(*) as registros
FROM gemini_requests
ORDER BY tabela;
