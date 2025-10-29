import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { Toast } from '../Toast';

describe('Toast component', () => {
  it('renderiza mensagem e fecha automaticamente após duração', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<Toast message="Operação concluída" type="success" duration={1500} onClose={onClose} />);

    expect(screen.getByText('Operação concluída')).toBeInTheDocument();

    vi.advanceTimersByTime(1500);

    expect(onClose).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('permite fechar manualmente', () => {
    const onClose = vi.fn();

    render(<Toast message="Erro" type="error" onClose={onClose} />);

    screen.getByRole('button').click();
    expect(onClose).toHaveBeenCalled();
  });
});
