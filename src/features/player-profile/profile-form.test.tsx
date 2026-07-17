import React, { useEffect, useRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppStateProvider } from '@/lib/app-state';
import { useAppState } from '@/lib/app-state';
import { ProfileForm } from './profile-form';

function ResolvedProfileForm({ pseudo = 'Nisha' }: { pseudo?: string }) {
  const { resolvePlayer, snapshot } = useAppState();
  const [snapshotText, setSnapshotText] = useState('');
  const didResolve = useRef(false);

  useEffect(() => {
    if (didResolve.current) {
      return;
    }
    didResolve.current = true;
    void resolvePlayer(pseudo);
  }, [pseudo, resolvePlayer]);

  return (
    <>
      <ProfileForm />
      <button
        type="button"
        onClick={async () => {
          setSnapshotText(JSON.stringify(await snapshot()));
        }}
      >
        Inspecter les données
      </button>
      <output aria-label="snapshot">{snapshotText}</output>
    </>
  );
}

describe('ProfileForm', () => {
  it('renders complete French questions without database-like labels or pseudo fallback', async () => {
    render(
      <AppStateProvider>
        <ResolvedProfileForm />
      </AppStateProvider>,
    );

    expect(
      await screen.findByRole('heading', {
        name: /Quel rôle préfères-tu jouer lorsque tu peux choisir librement/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /Quels autres rôles peux-tu jouer confortablement lorsque tu veux jouer au mieux/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /De combien de ressources as-tu généralement besoin/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /À quel rythme préfères-tu jouer la partie/i,
      }),
    ).toBeInTheDocument();

    expect(screen.queryByText(/^Priorite farm$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Confort cooldowns$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Shotcalling$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/pseudonyme/i)).not.toBeInTheDocument();
  });

  it('keeps every profile field writable with accessible controls and stored values unchanged', async () => {
    const user = userEvent.setup();

    render(
      <AppStateProvider>
        <ResolvedProfileForm />
      </AppStateProvider>,
    );

    await screen.findByRole('heading', {
      name: /Quel rôle préfères-tu jouer/i,
    });

    await user.click(screen.getByRole('radio', { name: /Position 3/i }));
    await user.click(
      screen.getByRole('checkbox', { name: /Position 4.*Support mobile/i }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /Position 5.*Hard support/i }),
    );
    await user.click(
      screen.getByRole('radio', {
        name: /5 Beaucoup de ressources/i,
      }),
    );
    await user.click(
      screen.getByRole('radio', {
        name: /1 Patient et réactif/i,
      }),
    );
    await user.click(
      screen.getByRole('radio', {
        name: /5 Les longs temps de recharge ne me dérangent pas/i,
      }),
    );
    await user.click(
      screen.getByRole('radio', {
        name: /1 Je protège mes ressources/i,
      }),
    );
    await user.click(
      screen.getByRole('radio', {
        name: /5 J.*aime guider les décisions/i,
      }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /Frontline.*Jouer devant/i }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /Flanc.*Arriver depuis un côté/i }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /Initiateur.*Ouvrir les combats/i }),
    );
    await user.click(
      screen.getByRole('checkbox', {
        name: /Facilitateur.*Rendre les actions des alliés/i,
      }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /Pick-off.*éliminations ciblées/i }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /Teamfight.*combats groupés/i }),
    );

    await user.click(screen.getByRole('button', { name: /^enregistrer$/i }));

    expect(await screen.findByText(/^Enregistré$/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /inspecter les données/i }),
    );

    const snapshotOutput = screen.getByLabelText('snapshot');
    await waitFor(() => expect(snapshotOutput.textContent).not.toBe(''));
    const parsed = JSON.parse(snapshotOutput.textContent ?? '');
    const [player] = parsed.players;
    const [preferences] = parsed.preferences;

    expect(player.mainRole).toBe('position_3');
    expect(player.secondaryRoles).toEqual(['position_4', 'position_5']);
    expect(preferences.farmPriority).toBe(5);
    expect(preferences.preferredGamePace).toBe(1);
    expect(preferences.cooldownDependencyComfort).toBe(5);
    expect(preferences.sacrificeComfort).toBe(1);
    expect(preferences.shotCallingComfort).toBe(5);
    expect(preferences.preferredFightPositions).toEqual(['frontline', 'flank']);
    expect(preferences.preferredIndividualPlaystyles).toEqual([
      'initiator',
      'enabler',
    ]);
    expect(preferences.preferredTeamPlaystyles).toEqual([
      'pickoff',
      'teamfight',
    ]);
  }, 10000);

  it('does not offer the selected main role as an enabled secondary role', async () => {
    const user = userEvent.setup();

    render(
      <AppStateProvider>
        <ResolvedProfileForm />
      </AppStateProvider>,
    );

    await screen.findByRole('heading', {
      name: /Quel rôle préfères-tu jouer/i,
    });

    await user.click(screen.getByRole('radio', { name: /Position 3/i }));

    expect(
      screen.queryByRole('checkbox', { name: /Position 3/i }),
    ).not.toBeInTheDocument();
  });
});
