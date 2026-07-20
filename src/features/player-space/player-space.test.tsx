import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppStateProvider } from '@/lib/app-state';
import { PlayerSpace } from './player-space';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('PlayerSpace', () => {
  it('exposes both player tabs and switches without technical internals', async () => {
    render(
      <AppStateProvider>
        <PlayerSpace />
      </AppStateProvider>,
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /quel est ton pseudo ou steam id/i }),
      'Nerros',
    );
    await userEvent.click(screen.getByRole('button', { name: /continuer/i }));

    expect(
      await screen.findByRole('tab', { name: /profil joueur/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /hero pool/i })).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' && /^Enregistré$/.test(content)
        );
      }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /hero pool/i }));

    expect(
      await screen.findByRole('heading', { name: /hero pool/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/schema/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/repository/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/questionnaire/i)).not.toBeInTheDocument();
  });

  it('lets the player add and copy their Steam ID from the header', async () => {
    render(
      <AppStateProvider>
        <PlayerSpace />
      </AppStateProvider>,
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /pseudo ou steam id/i }),
      'Nerros',
    );
    await userEvent.click(screen.getByRole('button', { name: /continuer/i }));

    expect(await screen.findByText('Nerros')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /aide steam id/i }),
    ).toHaveAttribute(
      'title',
      "Tu peux trouver ton steam id sur ton profil Dota2 sous 'friend id'",
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /^steam id$/i }),
      '123456789',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /ajouter le steam id/i }),
    );

    expect(await screen.findByDisplayValue('123456789')).toHaveAttribute(
      'readonly',
    );
  });
});
