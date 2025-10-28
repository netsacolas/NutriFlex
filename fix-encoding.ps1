# Script para corrigir encoding UTF-8 mal interpretado
$files = @(
    "pages\ChatPage.tsx"
)

$replacements = @{
    'â³' = '⏳'
    'histÃ³rico' = 'histórico'
    'refeiÃ§Ãµes' = 'refeições'
    'alÃ©m' = 'além'
    'usuÃ¡rio' = 'usuário'
    'ðŸ"„' = '📄'
    'Ãºltima' = 'última'
    'Ãºltimas' = 'últimas'
    'fÃ­sicas' = 'físicas'
    'OlÃ¡' = 'Olá'
    'ðŸ'‹' = '👋'
    'prÃ¡tico' = 'prático'
    'vocÃª' = 'você'
    'almoÃ§o' = 'almoço'
    'proteÃ­na' = 'proteína'
    'porÃ§Ãµes' = 'porções'
    'nutriÃ§Ã£o' = 'nutrição'
    'SugestÃµes' = 'Sugestões'
    'informaÃ§Ãµes' = 'informações'
    'sÃ£o' = 'são'
    'apÃ³s' = 'após'
    'padrÃ£o' = 'padrão'
}

foreach ($file in $files) {
    Write-Host "Corrigindo $file..."
    $content = Get-Content -Path $file -Encoding UTF8 -Raw

    foreach ($key in $replacements.Keys) {
        $content = $content -replace [regex]::Escape($key), $replacements[$key]
    }

    Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
    Write-Host "✅ $file corrigido!"
}

Write-Host ""
Write-Host "✅ Todos os arquivos foram corrigidos!"
