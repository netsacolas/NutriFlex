/**
 * Cost Analysis Modal
 *
 * Exibe análise detalhada de custos de uso da API do Gemini
 * Com abas: Resumo e Extrato Detalhado
 */

import React, { useState, useEffect } from 'react';
import {
  getUserCostAnalysis,
  getRequestHistory,
  formatUSD,
  formatBRL,
  formatDateTime,
  formatDate,
  formatTime,
  translateRequestType,
  getRequestTypeIcon,
  type CostAnalysis,
  type RequestRecord,
  type RequestHistoryFilters,
} from '../../services/costAnalysisService';

interface CostAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'summary' | 'history';

const CostAnalysisModal: React.FC<CostAnalysisModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [analysis, setAnalysis] = useState<CostAnalysis | null>(null);
  const [history, setHistory] = useState<RequestRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState<1 | 7 | 30 | 90>(30);

  // Filtros do extrato
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'cost_desc' | 'cost_asc'>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  useEffect(() => {
    if (isOpen) {
      loadAnalysis();
      if (activeTab === 'history') {
        loadHistory();
      }
    }
  }, [isOpen, period]);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, filterType, sortBy, currentPage]);

  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      const data = await getUserCostAnalysis(period);
      setAnalysis(data);
    } catch (error) {
      console.error('Error loading cost analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const filters: RequestHistoryFilters = {
        requestType: filterType,
        startDate,
        endDate,
        sortBy,
        limit: recordsPerPage,
        offset: (currentPage - 1) * recordsPerPage,
      };

      const data = await getRequestHistory(filters);
      if (data) {
        setHistory(data.records);
        setTotalRecords(data.total);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-lg flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">💰 Análise de Custos da API</h2>
              <p className="text-green-100 text-sm">Gemini 2.0 Flash - Rastreamento de Uso</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-hover-bg flex-shrink-0">
          <div className="flex gap-2 p-4">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'summary'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-secondary-bg text-text-secondary hover:bg-hover-bg'
              }`}
            >
              📊 Resumo
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'history'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-secondary-bg text-text-secondary hover:bg-hover-bg'
              }`}
            >
              📋 Extrato Detalhado
            </button>
          </div>
        </div>

        {/* Filtro de Período (comum para ambas abas) */}
        <div className="p-4 border-b border-hover-bg flex-shrink-0">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setPeriod(1)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 1
                  ? 'bg-green-500 text-white'
                  : 'bg-secondary-bg text-text-secondary hover:bg-hover-bg'
              }`}
            >
              Último dia
            </button>
            <button
              onClick={() => setPeriod(7)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 7
                  ? 'bg-green-500 text-white'
                  : 'bg-secondary-bg text-text-secondary hover:bg-hover-bg'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => setPeriod(30)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 30
                  ? 'bg-green-500 text-white'
                  : 'bg-secondary-bg text-text-secondary hover:bg-hover-bg'
              }`}
            >
              Últimos 30 dias
            </button>
            <button
              onClick={() => setPeriod(90)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 90
                  ? 'bg-green-500 text-white'
                  : 'bg-secondary-bg text-text-secondary hover:bg-hover-bg'
              }`}
            >
              Últimos 90 dias
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading */}
          {isLoading && (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <p className="text-text-secondary mt-4">
                {activeTab === 'summary' ? 'Calculando custos...' : 'Carregando histórico...'}
              </p>
            </div>
          )}

          {/* Tab: Resumo */}
          {!isLoading && activeTab === 'summary' && analysis && (
            <div className="p-6">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-secondary-bg rounded-lg p-4">
                  <div className="text-text-secondary text-sm mb-1">Total de Requisições</div>
                  <div className="text-3xl font-bold text-green-500">{analysis.totalRequests}</div>
                </div>
                <div className="bg-secondary-bg rounded-lg p-4">
                  <div className="text-text-secondary text-sm mb-1">Custo Total (BRL)</div>
                  <div className="text-3xl font-bold text-green-500">
                    {formatBRL(analysis.costInBRL)}
                  </div>
                  <div className="text-xs text-text-muted mt-1">{formatUSD(analysis.totalCost)}</div>
                </div>
                <div className="bg-secondary-bg rounded-lg p-4">
                  <div className="text-text-secondary text-sm mb-1">Custo Médio/Req (BRL)</div>
                  <div className="text-3xl font-bold text-blue-500">
                    {analysis.totalRequests > 0 ? formatBRL(analysis.costInBRL / analysis.totalRequests) : 'R$ 0,000000'}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {analysis.totalRequests > 0 ? formatUSD(analysis.totalCost / analysis.totalRequests) : '$0.000000'}
                  </div>
                </div>
              </div>

              {/* Tokens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📥</span>
                    <div className="text-text-secondary text-sm">Tokens de Entrada (Input)</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {analysis.totalInputTokens.toLocaleString()}
                  </div>
                  <div className="text-text-muted text-xs">
                    Custo: {formatUSD((analysis.totalInputTokens / 1_000_000) * 0.10)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 rounded-lg p-4 border border-pink-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📤</span>
                    <div className="text-text-secondary text-sm">Tokens de Saída (Output)</div>
                  </div>
                  <div className="text-2xl font-bold text-pink-400 mb-1">
                    {analysis.totalOutputTokens.toLocaleString()}
                  </div>
                  <div className="text-text-muted text-xs">
                    Custo: {formatUSD((analysis.totalOutputTokens / 1_000_000) * 0.40)}
                  </div>
                </div>
              </div>

              {/* Breakdown por Tipo */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-text-primary mb-3">
                  📊 Detalhamento por Tipo de Requisição
                </h3>
                {analysis.breakdown.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    Nenhuma requisição encontrada no período selecionado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysis.breakdown.map((item) => (
                      <div
                        key={item.requestType}
                        className="bg-secondary-bg rounded-lg p-4 hover:bg-hover-bg transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getRequestTypeIcon(item.requestType)}</span>
                            <div>
                              <div className="font-semibold text-text-primary">
                                {translateRequestType(item.requestType)}
                              </div>
                              <div className="text-sm text-text-secondary">
                                {item.count} {item.count === 1 ? 'requisição' : 'requisições'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-500">{formatBRL(item.totalCost * 5.0)}</div>
                            <div className="text-xs text-text-muted">{formatUSD(item.totalCost)}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-primary-bg rounded p-2">
                            <div className="text-text-muted text-xs mb-1">Tokens Input</div>
                            <div className="text-text-primary font-medium">
                              {item.estimatedInputTokens.toLocaleString()}
                            </div>
                            <div className="text-text-muted text-xs mt-1">{formatBRL(item.inputCost * 5.0)}</div>
                          </div>
                          <div className="bg-primary-bg rounded p-2">
                            <div className="text-text-muted text-xs mb-1">Tokens Output</div>
                            <div className="text-text-primary font-medium">
                              {item.estimatedOutputTokens.toLocaleString()}
                            </div>
                            <div className="text-text-muted text-xs mt-1">{formatBRL(item.outputCost * 5.0)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custo Médio */}
              {analysis.totalRequests > 0 && (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-lg p-4 border border-green-500/20 mb-6">
                  <h4 className="font-semibold text-text-primary mb-2">📈 Custo Médio por Requisição</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-500">
                        {formatBRL(analysis.costInBRL / analysis.totalRequests)}
                      </div>
                      <div className="text-xs text-text-muted mt-1">BRL</div>
                      <div className="text-xs text-text-muted">{formatUSD(analysis.totalCost / analysis.totalRequests)}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-500">
                        {Math.round((analysis.totalInputTokens + analysis.totalOutputTokens) / analysis.totalRequests).toLocaleString()}
                      </div>
                      <div className="text-xs text-text-muted mt-1">Tokens</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-500">
                        {(analysis.totalRequests / (period === 1 ? 1 : period === 7 ? 7 : period === 30 ? 30 : 90)).toFixed(1)}
                      </div>
                      <div className="text-xs text-text-muted mt-1">Req/dia</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg p-4 border border-blue-500/20">
                <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <span>ℹ️</span>
                  Informações de Preço
                </h4>
                <div className="text-sm text-text-secondary space-y-1">
                  <p>• <strong>Modelo:</strong> Gemini 2.0 Flash Experimental</p>
                  <p>• <strong>Input:</strong> $0.10 por 1 milhão de tokens</p>
                  <p>• <strong>Output:</strong> $0.40 por 1 milhão de tokens</p>
                  <p>• <strong>Taxa de conversão:</strong> 1 USD ≈ 5.00 BRL (estimativa)</p>
                  <p className="text-yellow-500 mt-2">
                    ⚠️ Os valores de tokens são estimativas baseadas no tamanho médio das requisições.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Extrato Detalhado */}
          {!isLoading && activeTab === 'history' && (
            <div className="p-6">
              {/* Filtros */}
              <div className="mb-6 bg-secondary-bg rounded-lg p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">🔍 Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filtro de Tipo */}
                  <div>
                    <label className="block text-xs text-text-secondary mb-2">Tipo de Requisição</label>
                    <select
                      value={filterType}
                      onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-primary-bg text-text-primary px-3 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-green-500 focus:outline-none"
                    >
                      <option value="all">Todos os tipos</option>
                      <option value="meal_calculation">🍽️ Cálculo de Refeição</option>
                      <option value="weight-analysis">⚖️ Análise de Peso</option>
                      <option value="nutrition-chat">💬 Chat Nutricional</option>
                    </select>
                  </div>

                  {/* Filtro de Ordenação */}
                  <div>
                    <label className="block text-xs text-text-secondary mb-2">Ordenar por</label>
                    <select
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
                      className="w-full bg-primary-bg text-text-primary px-3 py-2 rounded-lg border border-border-color focus:ring-2 focus:ring-green-500 focus:outline-none"
                    >
                      <option value="date_desc">Data (mais recente)</option>
                      <option value="date_asc">Data (mais antigo)</option>
                      <option value="cost_desc">Custo (maior)</option>
                      <option value="cost_asc">Custo (menor)</option>
                    </select>
                  </div>
                </div>

                {/* Contador de registros */}
                <div className="mt-3 text-sm text-text-secondary">
                  Exibindo {history.length} de {totalRecords} requisições
                </div>
              </div>

              {/* Totais do Filtro */}
              {history.length > 0 && (
                <div className="mb-6 bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-lg p-5 border border-green-500/20">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <span>💰</span>
                    Total Apurado ({history.length} {history.length === 1 ? 'requisição' : 'requisições'} nesta página)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Total de Requisições */}
                    <div className="bg-secondary-bg rounded-lg p-3 text-center">
                      <div className="text-text-muted text-xs mb-1">Requisições</div>
                      <div className="text-2xl font-bold text-green-500">{history.length}</div>
                      <div className="text-text-muted text-xs mt-1">desta página</div>
                    </div>

                    {/* Total de Tokens Input */}
                    <div className="bg-secondary-bg rounded-lg p-3 text-center">
                      <div className="text-text-muted text-xs mb-1">Tokens Input</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {history.reduce((sum, r) => sum + r.estimatedInputTokens, 0).toLocaleString()}
                      </div>
                      <div className="text-text-muted text-xs mt-1">📥 entrada</div>
                    </div>

                    {/* Total de Tokens Output */}
                    <div className="bg-secondary-bg rounded-lg p-3 text-center">
                      <div className="text-text-muted text-xs mb-1">Tokens Output</div>
                      <div className="text-2xl font-bold text-pink-400">
                        {history.reduce((sum, r) => sum + r.estimatedOutputTokens, 0).toLocaleString()}
                      </div>
                      <div className="text-text-muted text-xs mt-1">📤 saída</div>
                    </div>

                    {/* Custo Total */}
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-lg p-3 text-center border border-green-500/30">
                      <div className="text-text-muted text-xs mb-1">Custo Total</div>
                      <div className="text-xl font-bold text-green-500">
                        {formatBRL(history.reduce((sum, r) => sum + r.estimatedCost, 0) * 5.0)}
                      </div>
                      <div className="text-text-muted text-xs mt-1">
                        {formatUSD(history.reduce((sum, r) => sum + r.estimatedCost, 0))}
                      </div>
                    </div>
                  </div>

                  {/* Nota sobre paginação */}
                  {totalRecords > recordsPerPage && (
                    <div className="mt-3 text-xs text-center text-yellow-500">
                      ℹ️ Total desta página. Use a paginação abaixo para ver mais registros.
                    </div>
                  )}
                </div>
              )}

              {/* Tabela de Requisições */}
              {history.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-lg">Nenhuma requisição encontrada</p>
                  <p className="text-sm mt-2">Tente ajustar os filtros ou selecionar um período diferente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="bg-secondary-bg rounded-lg p-4 hover:bg-hover-bg transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Info da requisição */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{getRequestTypeIcon(record.request_type)}</span>
                            <span className="font-semibold text-text-primary">
                              {translateRequestType(record.request_type)}
                            </span>
                          </div>
                          <div className="text-sm text-text-secondary">
                            📅 {formatDate(record.created_at)} às {formatTime(record.created_at)}
                          </div>
                        </div>

                        {/* Tokens e Custo */}
                        <div className="text-right">
                          <div className="font-bold text-green-500 mb-1">
                            {formatBRL(record.estimatedCost * 5.0)}
                          </div>
                          <div className="text-xs text-text-muted mb-2">
                            {formatUSD(record.estimatedCost)}
                          </div>
                          <div className="flex gap-2 text-xs">
                            <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                              📥 {record.estimatedInputTokens}
                            </div>
                            <div className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded">
                              📤 {record.estimatedOutputTokens}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-secondary-bg text-text-primary rounded-lg hover:bg-hover-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-green-500 text-white'
                              : 'bg-secondary-bg text-text-secondary hover:bg-hover-bg'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-secondary-bg text-text-primary rounded-lg hover:bg-hover-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-hover-bg flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CostAnalysisModal;
