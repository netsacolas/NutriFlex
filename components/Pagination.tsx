import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 50,
  totalItems = 0,
}) => {
  if (totalPages <= 1) return null;

  // Calcula range de páginas para mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Número máximo de botões de página visíveis

    if (totalPages <= maxVisible) {
      // Se tem poucas páginas, mostra todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Sempre mostra primeira página
      pages.push(1);

      let startPage = Math.max(2, currentPage - 2);
      let endPage = Math.min(totalPages - 1, currentPage + 2);

      // Ajusta range se estiver perto do início
      if (currentPage <= 3) {
        startPage = 2;
        endPage = 5;
      }

      // Ajusta range se estiver perto do fim
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
        endPage = totalPages - 1;
      }

      // Adiciona reticências no início se necessário
      if (startPage > 2) {
        pages.push('...');
      }

      // Adiciona páginas do meio
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Adiciona reticências no fim se necessário
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // Sempre mostra última página
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Calcula range de itens sendo exibidos
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      {/* Informação de registros */}
      {totalItems > 0 && (
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-semibold text-gray-900">{startItem}</span> a{' '}
          <span className="font-semibold text-gray-900">{endItem}</span> de{' '}
          <span className="font-semibold text-gray-900">{totalItems}</span> registros
        </div>
      )}

      {/* Controles de paginação */}
      <div className="flex items-center gap-2">
        {/* Botão Primeira Página */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Primeira página"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Botão Página Anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Página anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Números de Página */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`min-w-[40px] px-3 py-2 rounded-lg border transition-all ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 font-semibold shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-orange-300'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Botão Próxima Página */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Próxima página"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Botão Última Página */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Última página"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Input de navegação direta */}
      <div className="flex items-center gap-2">
        <label htmlFor="page-input" className="text-sm text-gray-600">
          Ir para página:
        </label>
        <input
          id="page-input"
          type="number"
          min="1"
          max={totalPages}
          defaultValue={currentPage}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const input = e.target as HTMLInputElement;
              const page = parseInt(input.value);
              if (page >= 1 && page <= totalPages) {
                onPageChange(page);
              } else {
                input.value = currentPage.toString();
              }
            }
          }}
          onBlur={(e) => {
            const input = e.target as HTMLInputElement;
            const page = parseInt(input.value);
            if (page >= 1 && page <= totalPages && page !== currentPage) {
              onPageChange(page);
            } else {
              input.value = currentPage.toString();
            }
          }}
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <span className="text-sm text-gray-600">de {totalPages}</span>
      </div>
    </div>
  );
};

export default Pagination;
