import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppStateProvider } from '@/lib/app-state';
import { ProfileForm } from './profile-form';

describe('ProfileForm', () => {
  it('shows a validation message when pseudonym is empty', async () => {
    render(
      <AppStateProvider>
        <ProfileForm />
      </AppStateProvider>,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /enregistrer le profil/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Le pseudonyme est obligatoire',
    );
  });

  it('creates a player profile with valid input', async () => {
    render(
      <AppStateProvider>
        <ProfileForm />
      </AppStateProvider>,
    );

    await userEvent.type(screen.getByLabelText(/pseudonyme/i), 'Nisha');
    await userEvent.click(
      screen.getByRole('button', { name: /enregistrer le profil/i }),
    );

    expect(
      await screen.findByText(/Profil enregistre pour Nisha/i),
    ).toBeInTheDocument();
  });
});
