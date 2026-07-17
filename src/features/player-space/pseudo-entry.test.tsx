import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppStateProvider } from '@/lib/app-state';
import { PseudoEntry } from './pseudo-entry';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('PseudoEntry', () => {
  it('keeps the pseudo question, input, and validation accessible', async () => {
    render(
      <AppStateProvider>
        <PseudoEntry />
      </AppStateProvider>,
    );

    expect(
      screen.getByRole('textbox', { name: /quel est ton pseudo/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /continuer/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /pseudo est obligatoire/i,
    );
  });
});
