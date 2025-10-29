import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';

describe('LandingPage', () => {
  it('exibe hero e chamada principal', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    const heroTextMatches = screen.getAllByText(/IA calcula as por/i);
    expect(heroTextMatches.length).toBeGreaterThan(0);
  });
});
