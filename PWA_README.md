# 📱 NutriMais AI - Aplicativo Instalável

## 🚀 Início Rápido

### 1️⃣ Gerar Ícones e Splash Screens

**Passo 1: Gerar Ícones**
1. Abra no navegador: `scripts/generate-icons.html`
2. Clique "Baixar Todos"
3. Crie a pasta `public/icons/`
4. Mova os 8 arquivos PNG para `public/icons/`

**Passo 2: Gerar Splash Screens**
1. Abra no navegador: `scripts/generate-splash.html`
2. Clique "Baixar Todas"
3. Crie a pasta `public/splash/`
4. Mova os 13 arquivos PNG para `public/splash/`

### 2️⃣ Rodar o Aplicativo

```bash
npm install
npm run dev
```

Acesse: `http://localhost:3000`

### 3️⃣ Instalar no Celular

**Android:**
1. Abra o site no Chrome
2. Aguarde o prompt de instalação (5 segundos)
3. Toque em "Instalar App"

**iPhone:**
1. Abra no Safari
2. Toque no botão Compartilhar
3. "Adicionar à Tela de Início"

---

## ✨ Funcionalidades PWA

### O que funciona OFFLINE:
- ✅ Visualizar histórico de refeições
- ✅ Visualizar histórico de peso
- ✅ Visualizar histórico de atividades
- ✅ Navegar entre páginas
- ✅ Ver dados já carregados

### O que precisa de INTERNET:
- 📡 Calcular porções com IA (Gemini)
- 📡 Salvar novos dados no banco
- 📡 Chat com assistente nutricional
- 📡 Login/Cadastro

### Sincronização Automática
Quando você estiver offline e tentar salvar dados, eles ficarão numa **fila de sincronização**. Assim que a internet voltar, tudo será sincronizado automaticamente!

**Indicador:** Badge laranja no canto inferior direito mostra quantos itens estão pendentes.

---

## 🔧 Deploy em Produção

### Build

```bash
npm run build
```

Arquivos gerados em `dist/`

### Deploy Netlify

```bash
netlify deploy --prod --dir=dist
```

### Deploy Vercel

```bash
vercel --prod
```

**IMPORTANTE:** Certifique-se de que o domínio usa **HTTPS** (obrigatório para PWA).

---

## 🧪 Testar PWA

### Lighthouse Audit

1. Abra DevTools (F12)
2. Aba "Lighthouse"
3. Marque "Progressive Web App"
4. Clique "Analyze page load"

**Score esperado:** 90-100

### Teste Manual

1. Abra o app
2. DevTools → Application → Service Workers
3. Marque "Offline"
4. Recarregue a página
5. **Deve funcionar!** ✅

---

## 📂 Arquivos Criados

```
NutriMais/
├── public/
│   ├── manifest.json              # Configuração do PWA
│   ├── sw.js                      # Service Worker
│   ├── icons/                     # Ícones do app (8 tamanhos)
│   └── splash/                    # Splash screens iOS (13 tamanhos)
│
├── components/
│   └── PWAComponents.tsx          # Componentes React PWA
│       ├── OfflineDetector        # Banner de offline/online
│       ├── InstallPrompt          # Prompt de instalação
│       ├── UpdateNotification     # Notificação de update
│       └── PWAManager             # Gerenciador principal
│
├── utils/
│   └── backgroundSync.ts          # Sistema de sincronização
│       ├── addToSyncQueue         # Adicionar à fila
│       ├── syncPendingData        # Sincronizar tudo
│       ├── useBackgroundSync      # Hook React
│       └── SyncStatusBadge        # Badge visual
│
├── scripts/
│   ├── generate-icons.html        # Gerador de ícones
│   └── generate-splash.html       # Gerador de splash screens
│
├── vite.config.ts                 # Configuração PWA
└── PWA_SETUP_GUIDE.md            # Documentação completa
```

---

## 🎨 Personalizar

### Alterar Cores

Edite `public/manifest.json`:

```json
{
  "theme_color": "#ff6b35",       // Cor da barra superior
  "background_color": "#1e1e1e"   // Cor de fundo ao carregar
}
```

### Alterar Nome

```json
{
  "name": "Seu Nome do App",
  "short_name": "App"
}
```

### Alterar Ícone

1. Edite `scripts/generate-icons.html`
2. Modifique a função `drawIcon()`
3. Gere novamente os ícones

---

## ❓ Troubleshooting

### Prompt de instalação não aparece
- ✅ Verifique se está em **HTTPS**
- ✅ Verifique se `manifest.json` está acessível
- ✅ Verifique se ícones 192x192 e 512x512 existem

### Não funciona offline
- ✅ Abra DevTools → Application → Service Workers
- ✅ Verifique se está "activated and running"
- ✅ Verifique Cache Storage (deve ter 3 caches)

### Ícone não aparece
- ✅ Verifique `public/icons/icon-192x192.png`
- ✅ Verifique `public/icons/icon-512x512.png`
- ✅ Formato deve ser PNG

### Service Worker não registra
- ✅ Verifique console (F12)
- ✅ Deve mostrar: "✅ Service Worker registrado com sucesso!"
- ✅ Se erro, verifique caminho `/sw.js`

---

## 📚 Documentação Completa

Para detalhes técnicos, consulte: **[PWA_SETUP_GUIDE.md](PWA_SETUP_GUIDE.md)**

---

## 🎉 Pronto!

Seu aplicativo agora é um **PWA profissional**!

Os usuários terão:
- 📲 App instalável
- ⚡ Carregamento super rápido
- 🔄 Sincronização automática
- 📱 Experiência nativa

**Compartilhe e aproveite!** 🚀
