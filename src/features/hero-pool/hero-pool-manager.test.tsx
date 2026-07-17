import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppStateProvider } from '@/lib/app-state';
import { HeroPoolManager } from './hero-pool-manager';
import { ProfileForm } from '@/features/player-profile/profile-form';

describe('HeroPoolManager', () => {
  it('adds, edits, and removes a hero through the form', async () => {
    render(
      <AppStateProvider>
        <ProfileForm />
        <HeroPoolManager />
      </AppStateProvider>,
    );

    await userEvent.type(screen.getByLabelText(/pseudonyme/i), 'Collapse');
    await userEvent.click(
      screen.getByRole('button', { name: /enregistrer le profil/i }),
    );
    await screen.findByText(/Profil enregistre pour Collapse/i);

    await userEvent.selectOptions(screen.getByLabelText(/^heros$/i), 'axe');
    await userEvent.click(
      screen.getByRole('button', { name: /ajouter le heros/i }),
    );

    const card = await screen.findByRole('article');
    expect(
      within(card).getByRole('heading', { name: 'Axe' }),
    ).toBeInTheDocument();

    await userEvent.selectOptions(
      within(card).getByLabelText(/confort joueur/i),
      '5',
    );
    await userEvent.click(
      within(card).getByRole('button', { name: /modifier/i }),
    );
    expect(within(card).getByLabelText(/confort joueur/i)).toHaveValue('5');

    await userEvent.click(
      within(card).getByRole('button', { name: /retirer/i }),
    );
    expect(
      await screen.findByText(/Aucun heros dans le pool/i),
    ).toBeInTheDocument();
  });
});
