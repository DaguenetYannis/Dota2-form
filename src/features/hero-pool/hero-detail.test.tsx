import React, { useEffect, useRef, useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { HeroMetricMap } from '@/domain/entities/player-hero-evaluation';
import { AppStateProvider, useAppState } from '@/lib/app-state';
import { HeroDetail } from './hero-detail';

const completeMetrics: HeroMetricMap = {
  mobility: 4,
  hero_damage: 4,
  farm_dependency: 2,
  building_damage: 3,
  enabler: 2,
  save: 1,
  control: 5,
  teamfight: 5,
  initiation: 5,
};

function ResolvedHeroDetail() {
  const { currentPlayer, resolvePlayer, addHero, saveHeroEvaluation } =
    useAppState();
  const didResolve = useRef(false);
  const didSetup = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (didResolve.current) {
      return;
    }
    didResolve.current = true;
    void resolvePlayer('Collapse');
  }, [resolvePlayer]);

  useEffect(() => {
    if (!currentPlayer || didSetup.current) {
      return;
    }
    didSetup.current = true;
    const player = currentPlayer;
    async function setup() {
      await addHero({
        playerId: player.id,
        heroId: 'axe',
        roles: [],
        poolTier: 'signature',
        comfort: 3,
        confidence: 3,
        recentExperience: 3,
        blindPickConfidence: 3,
        flexPick: false,
        preferredDraftPhase: 'flexible',
        preferredPlaystyles: [],
        requiredAlliedFeatures: [],
        personalNotes: '',
      });
      await addHero({
        playerId: player.id,
        heroId: 'bane',
        roles: [],
        poolTier: 'comfortable',
        comfort: 3,
        confidence: 3,
        recentExperience: 3,
        blindPickConfidence: 3,
        flexPick: false,
        preferredDraftPhase: 'flexible',
        preferredPlaystyles: [],
        requiredAlliedFeatures: [],
        personalNotes: '',
      });
      await saveHeroEvaluation('bane', completeMetrics);
      setReady(true);
    }
    void setup();
  }, [addHero, currentPlayer, saveHeroEvaluation]);

  return ready ? <HeroDetail heroId="axe" /> : <p>Chargement</p>;
}

describe('HeroDetail', () => {
  it('saves all nine subjective metrics, renders exact values, radar, and comparison', async () => {
    const user = userEvent.setup();

    render(
      <AppStateProvider>
        <ResolvedHeroDetail />
      </AppStateProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Axe' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/0\/9/i)).toBeInTheDocument();
    expect(screen.getByText(/Dépendance au farm/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Une valeur elevee represente/i),
    ).toBeInTheDocument();

    await user.click(metricRadio(/te d.placer/i, /5 La mobilit/i));
    await user.click(metricRadio(/pression de d.g.ts/i, /4/i));
    await user.click(metricRadio(/farm, de niveaux/i, /3 Besoin/i));
    await user.click(metricRadio(/b.timents adverses/i, /2/i));
    await user.click(metricRadio(/actions de tes alli/i, /4/i));
    await user.click(metricRadio(/alli. de mourir/i, /1 Aucun/i));
    await user.click(metricRadio(/mouvements ou les actions/i, /5 Le contr/i));
    await user.click(metricRadio(/combat impliquant plusieurs/i, /4/i));
    await user.click(metricRadio(/engagement favorable/i, /5 L'initiation/i));

    await user.click(
      screen.getByRole('button', { name: /enregistrer l'.valuation/i }),
    );

    expect(
      await screen.findByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' && /^Enregistr/.test(content)
        );
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('img', {
        name: /Radar personnel comparant Axe/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('Mobilité');
    expect(screen.getByRole('table')).toHaveTextContent('Dépendance au farm');
    expect(screen.getByRole('table')).not.toHaveTextContent('Pick-off');

    await user.click(await screen.findByRole('checkbox', { name: /Bane/i }));
    await user.click(screen.getByRole('button', { name: /^Comparer$/i }));

    expect(await screen.findByText(/S.*rie 2: Bane/i)).toBeInTheDocument();
    expect(screen.getAllByRole('table').at(-1)).toHaveTextContent('Bane');
  });
});

function metricRadio(question: RegExp, name: RegExp) {
  const legend = screen
    .getAllByText(question)
    .find((element) => element.tagName.toLowerCase() === 'legend');
  const fieldset = legend?.closest('fieldset');
  expect(fieldset).not.toBeNull();
  return within(fieldset as HTMLElement).getByRole('radio', { name });
}
