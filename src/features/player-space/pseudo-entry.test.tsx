import React, { useEffect, useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppStateProvider, useAppState } from '@/lib/app-state';
import { PseudoEntry } from './pseudo-entry';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('PseudoEntry', () => {
  beforeEach(() => {
    push.mockReset();
  });

  it('keeps the pseudo question, input, and validation accessible', async () => {
    render(
      <AppStateProvider>
        <PseudoEntry />
      </AppStateProvider>,
    );

    expect(
      screen.getByRole('textbox', { name: /quel est ton pseudo ou steam id/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /continuer/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /pseudo ou steam id est obligatoire/i,
    );
  });

  it('logs in with a registered Steam ID', async () => {
    render(
      <AppStateProvider>
        <SeededSteamIdEntry />
      </AppStateProvider>,
    );

    expect(await screen.findByText('Prêt')).toBeInTheDocument();
    await userEvent.type(
      screen.getByRole('textbox', { name: /pseudo ou steam id/i }),
      '123456789',
    );
    await userEvent.click(screen.getByRole('button', { name: /continuer/i }));

    expect(push).toHaveBeenCalledWith('/player');
  });
});

function SeededSteamIdEntry() {
  const { currentPlayer, resolvePlayer, updateSteamId } = useAppState();
  const didResolve = useRef(false);
  const didSaveSteam = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (didResolve.current) {
      return;
    }
    didResolve.current = true;
    void resolvePlayer('Nerros');
  }, [resolvePlayer]);

  useEffect(() => {
    if (!currentPlayer || didSaveSteam.current) {
      return;
    }
    didSaveSteam.current = true;
    void updateSteamId('123456789').then(() => setReady(true));
  }, [currentPlayer, updateSteamId]);

  return (
    <>
      {ready ? <p>Prêt</p> : <p>Chargement</p>}
      <PseudoEntry />
    </>
  );
}
