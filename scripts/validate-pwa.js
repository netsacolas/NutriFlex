/**
 * Script de Validação PWA
 * Verifica se todos os arquivos necessários estão presentes
 *
 * Uso: node scripts/validate-pwa.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Emojis
const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

let errors = 0;
let warnings = 0;
let passed = 0;

// Funções auxiliares
function log(message, color = 'reset', icon = '') {
  console.log(`${icon} ${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, required = true) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    log(`${filePath}`, 'green', icons.success);
    passed++;
    return true;
  } else {
    if (required) {
      log(`${filePath} (OBRIGATÓRIO)`, 'red', icons.error);
      errors++;
    } else {
      log(`${filePath} (Opcional)`, 'yellow', icons.warning);
      warnings++;
    }
    return false;
  }
}

function checkManifest() {
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    log('manifest.json não encontrado', 'red', icons.error);
    errors++;
    return false;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Verificar campos obrigatórios
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];

    requiredFields.forEach(field => {
      if (manifest[field]) {
        log(`manifest.json → ${field}`, 'green', icons.success);
        passed++;
      } else {
        log(`manifest.json → ${field} (FALTANDO)`, 'red', icons.error);
        errors++;
      }
    });

    // Verificar ícones mínimos
    if (manifest.icons && Array.isArray(manifest.icons)) {
      const has192 = manifest.icons.some(icon => icon.sizes === '192x192');
      const has512 = manifest.icons.some(icon => icon.sizes === '512x512');

      if (has192 && has512) {
        log('Ícones mínimos (192x192 e 512x512)', 'green', icons.success);
        passed++;
      } else {
        log('Faltam ícones 192x192 ou 512x512', 'red', icons.error);
        errors++;
      }
    }

    return true;
  } catch (error) {
    log(`Erro ao ler manifest.json: ${error.message}`, 'red', icons.error);
    errors++;
    return false;
  }
}

function checkServiceWorker() {
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');

  if (!fs.existsSync(swPath)) {
    log('sw.js não encontrado', 'red', icons.error);
    errors++;
    return false;
  }

  const swContent = fs.readFileSync(swPath, 'utf-8');

  // Verificar elementos essenciais
  const checks = [
    { pattern: /addEventListener\(['"]install['"]/, name: 'Install event' },
    { pattern: /addEventListener\(['"]activate['"]/, name: 'Activate event' },
    { pattern: /addEventListener\(['"]fetch['"]/, name: 'Fetch event' },
    { pattern: /caches\.open/, name: 'Cache API' },
  ];

  checks.forEach(({ pattern, name }) => {
    if (pattern.test(swContent)) {
      log(`sw.js → ${name}`, 'green', icons.success);
      passed++;
    } else {
      log(`sw.js → ${name} (FALTANDO)`, 'red', icons.error);
      errors++;
    }
  });

  return true;
}

function checkIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const requiredSizes = [72, 96, 128, 144, 152, 192, 384, 512];

  if (!fs.existsSync(iconsDir)) {
    log('Pasta public/icons/ não encontrada', 'red', icons.error);
    errors++;
    return false;
  }

  requiredSizes.forEach(size => {
    const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    if (fs.existsSync(iconPath)) {
      log(`Ícone ${size}x${size}`, 'green', icons.success);
      passed++;
    } else {
      log(`Ícone ${size}x${size} (FALTANDO)`, 'red', icons.error);
      errors++;
    }
  });

  return true;
}

function checkSplashScreens() {
  const splashDir = path.join(__dirname, '..', 'public', 'splash');

  if (!fs.existsSync(splashDir)) {
    log('Pasta public/splash/ não encontrada (Opcional para Android)', 'yellow', icons.warning);
    warnings++;
    return false;
  }

  const requiredSplash = [
    '640x1136',
    '750x1334',
    '1125x2436',
    '828x1792',
    '1170x2532',
    '1242x2688',
    '1284x2778',
    '1179x2556',
    '1290x2796',
    '1536x2048',
    '1668x2224',
    '1668x2388',
    '2048x2732',
  ];

  requiredSplash.forEach(size => {
    const splashPath = path.join(splashDir, `splash-${size}.png`);
    if (fs.existsSync(splashPath)) {
      passed++;
    } else {
      log(`Splash ${size} (FALTANDO - iOS)`, 'yellow', icons.warning);
      warnings++;
    }
  });

  return true;
}

function checkIndexHTML() {
  const indexPath = path.join(__dirname, '..', 'index.html');

  if (!fs.existsSync(indexPath)) {
    log('index.html não encontrado', 'red', icons.error);
    errors++;
    return false;
  }

  const htmlContent = fs.readFileSync(indexPath, 'utf-8');

  const checks = [
    { pattern: /<link.*manifest\.json/, name: 'Link para manifest.json' },
    { pattern: /viewport.*width=device-width/, name: 'Viewport meta tag' },
    { pattern: /theme-color/, name: 'Theme color meta tag' },
    { pattern: /apple-mobile-web-app-capable/, name: 'iOS web app meta tags' },
    { pattern: /serviceWorker\.register/, name: 'Service Worker registration' },
  ];

  checks.forEach(({ pattern, name }) => {
    if (pattern.test(htmlContent)) {
      log(`index.html → ${name}`, 'green', icons.success);
      passed++;
    } else {
      log(`index.html → ${name} (FALTANDO)`, 'red', icons.error);
      errors++;
    }
  });

  return true;
}

// Executar validações
console.log('\n' + '='.repeat(60));
log('🔍 VALIDAÇÃO PWA - NutriMais AI', 'cyan');
console.log('='.repeat(60) + '\n');

// 1. Arquivos principais
log('\n📁 Arquivos Principais:', 'blue');
checkFile('public/manifest.json', true);
checkFile('public/sw.js', true);
checkFile('index.html', true);

// 2. Componentes PWA
log('\n⚛️  Componentes PWA:', 'blue');
checkFile('components/PWAComponents.tsx', true);
checkFile('utils/backgroundSync.tsx', true);

// 3. Scripts
log('\n🛠️  Scripts:', 'blue');
checkFile('scripts/generate-icons.html', false);
checkFile('scripts/generate-splash.html', false);

// 4. Validação do manifest
log('\n📋 Manifest.json:', 'blue');
checkManifest();

// 5. Service Worker
log('\n⚙️  Service Worker:', 'blue');
checkServiceWorker();

// 6. Ícones
log('\n🎨 Ícones:', 'blue');
checkIcons();

// 7. Splash Screens
log('\n🌅 Splash Screens (iOS):', 'blue');
checkSplashScreens();

// 8. HTML
log('\n📄 index.html:', 'blue');
checkIndexHTML();

// Resultado final
console.log('\n' + '='.repeat(60));
log('📊 RESULTADO DA VALIDAÇÃO', 'cyan');
console.log('='.repeat(60));

log(`${icons.success} Passou: ${passed}`, 'green');
if (warnings > 0) log(`${icons.warning} Avisos: ${warnings}`, 'yellow');
if (errors > 0) log(`${icons.error} Erros: ${errors}`, 'red');

console.log('\n');

if (errors === 0 && warnings === 0) {
  log('🎉 PERFEITO! Seu PWA está completo e pronto para produção!', 'green', icons.success);
  log('Próximo passo: npm run build && npm run preview', 'cyan', icons.info);
  process.exit(0);
} else if (errors === 0) {
  log('✅ PWA funcional! Alguns itens opcionais faltando.', 'green', icons.success);
  log('Avisos são opcionais, mas recomendados para melhor experiência.', 'yellow', icons.warning);
  process.exit(0);
} else {
  log('❌ PWA incompleto. Corrija os erros acima.', 'red', icons.error);
  log('\nPassos sugeridos:', 'cyan');
  log('1. Gerar ícones: Abrir scripts/generate-icons.html', 'cyan');
  log('2. Gerar splash: Abrir scripts/generate-splash.html', 'cyan');
  log('3. Verificar manifest.json e sw.js em public/', 'cyan');
  log('4. Executar novamente: node scripts/validate-pwa.js', 'cyan');
  process.exit(1);
}
