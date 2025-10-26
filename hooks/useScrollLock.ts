import { useEffect } from 'react';

/**
 * Hook customizado para bloquear o scroll do body quando um modal está aberto
 * @param isOpen - Estado que indica se o modal está aberto
 */
export const useScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      // Salva o estado atual do overflow
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Calcula a largura da scrollbar para evitar "pulo" no layout
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Bloqueia o scroll e adiciona padding para compensar a scrollbar
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      // Cleanup function para restaurar o estado original
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);
};

export default useScrollLock;