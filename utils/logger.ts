/**
 * Sistema de Logging Seguro
 *
 * Apenas mostra logs em ambiente de desenvolvimento.
 * Em produção, os logs não são exibidos para proteger informações sensíveis.
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Lista de padrões que NUNCA devem aparecer nos logs, mesmo em desenvolvimento
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /api[_-]?key/i,
  /secret/i,
  /credential/i,
  /auth/i,
];

/**
 * Verifica se o dado contém informações sensíveis
 */
function containsSensitiveData(data: unknown): boolean {
  const dataStr = JSON.stringify(data);
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(dataStr));
}

/**
 * Mascara dados sensíveis antes de logar
 */
function maskSensitiveData(data: unknown): unknown {
  if (typeof data === 'string') {
    return data.replace(/([A-Za-z0-9]{10,})/g, '****');
  }

  if (typeof data === 'object' && data !== null) {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
        masked[key] = '****';
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

  return data;
}

/**
 * Logger seguro
 */
export const logger = {
  /**
   * Log de informação geral
   */
  info: (...args: unknown[]) => {
    if (!isDevelopment) return;

    const safeArgs = args.map(arg =>
      containsSensitiveData(arg) ? maskSensitiveData(arg) : arg
    );
    console.info('[INFO]', ...safeArgs);
  },

  /**
   * Log de erro
   */
  error: (...args: unknown[]) => {
    if (!isDevelopment) return;

    const safeArgs = args.map(arg =>
      containsSensitiveData(arg) ? maskSensitiveData(arg) : arg
    );
    console.error('[ERROR]', ...safeArgs);
  },

  /**
   * Log de aviso
   */
  warn: (...args: unknown[]) => {
    if (!isDevelopment) return;

    const safeArgs = args.map(arg =>
      containsSensitiveData(arg) ? maskSensitiveData(arg) : arg
    );
    console.warn('[WARN]', ...safeArgs);
  },

  /**
   * Log de debug (muito verboso, apenas em desenvolvimento)
   */
  debug: (...args: unknown[]) => {
    if (!isDevelopment) return;

    const safeArgs = args.map(arg =>
      containsSensitiveData(arg) ? maskSensitiveData(arg) : arg
    );
    console.log('[DEBUG]', ...safeArgs);
  },

  /**
   * Log de erro em produção (apenas erros críticos que precisam ser reportados)
   * Use com moderação - idealmente integrado com serviço de monitoramento como Sentry
   */
  criticalError: (message: string, error?: Error) => {
    // Em produção, você poderia enviar para um serviço de monitoramento
    if (isDevelopment) {
      console.error('[CRITICAL]', message, error);
    } else {
      // TODO: Integrar com Sentry ou outro serviço de monitoramento
      // Sentry.captureException(error, { message });
    }
  },
};

export default logger;
