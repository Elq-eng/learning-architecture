import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('Home page', () => {
  it('shows the platform name', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Plataforma de estudio de arquitectura de software' }),
    ).toBeInTheDocument();
  });
});
