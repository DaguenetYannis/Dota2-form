import React, { useEffect, useRef, useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { HeroMetricMap } from '@/domain/entities/player-hero-evaluation';
import { AppStateProvider, useAppState } from '@/lib/app-state';
import { HeroPoolManager } from './hero-pool-manager';

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

function ResolvedHeroPoolManager() {
  const { resolvePlayer, saveHeroEvaluation, snapshot } = useAppState();
  const [snapshotText, setSnapshotText] = useState('');
  const didResolve = useRef(false);

  useEffect(() => {
    if (didResolve.current) {
      return;
    }
    didResolve.current = true;
    void resolvePlayer('Collapse');
  }, [resolvePlayer]);

  return (
    <>
      <HeroPoolManager />
      <button
        type="button"
        onClick={async () => setSnapshotText(JSON.stringify(await snapshot()))}
      >
        Inspecter les donnÃ©es
      </button>
      <button
        type="button"
        onClick={async () => {
          await saveHeroEvaluation('axe', completeMetrics);
          setSnapshotText(JSON.stringify(await snapshot()));
        }}
      >
        Sauver evaluation Axe
      </button>
      <output aria-label="snapshot">{snapshotText}</output>
    </>
  );
}

async function readSnapshot() {
  await userEvent.click(screen.getByRole('button', { name: /inspecter/i }));
  const output = screen.getByLabelText('snapshot');
  await waitFor(() => expect(output.textContent).not.toBe(''));
  return JSON.parse(output.textContent ?? '');
}

async function addHeroFromCatalogue(
  user: ReturnType<typeof userEvent.setup>,
  heroName: string,
  tierValue: string,
) {
  const card = screen.getByText(heroName).closest('article');
  expect(card).not.toBeNull();
  await user.click(
    within(card as HTMLElement).getByRole('button', { name: /^Ajouter$/i }),
  );
  const dialog = screen.getByRole('dialog');
  await user.click(
    within(dialog).getByDisplayValue(tierValue) as HTMLInputElement,
  );
  await user.click(within(dialog).getByRole('button', { name: /^Ajouter$/i }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
}

async function createCategory(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.click(screen.getByRole('button', { name: /\+ nouvelle cat/i }));
  const dialog = screen.getByRole('dialog', { name: /nouvelle cat/i });
  await user.type(within(dialog).getByLabelText(/nom de la cat/i), name);
  await user.click(within(dialog).getByRole('button', { name: /^Cr/i }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
}

function categoryCard(name: string) {
  const heading = screen.getByRole('heading', { name });
  const card = heading.closest('section');
  expect(card).not.toBeNull();
  return card as HTMLElement;
}

describe('HeroPoolManager', () => {
  it('combines catalogue filters and lets the player clear or remove them', async () => {
    const user = userEvent.setup();

    render(
      <AppStateProvider>
        <ResolvedHeroPoolManager />
      </AppStateProvider>,
    );

    await screen.findByRole('tab', { name: /catalogue/i });
    await addHeroFromCatalogue(user, 'Axe', 'strong');
    await addHeroFromCatalogue(user, 'Bane', 'comfortable');
    await addHeroFromCatalogue(user, 'Phoenix', 'situational');

    await user.click(screen.getByRole('tab', { name: /mes cat/i }));
    await createCategory(user, 'Hunter');
    await createCategory(user, 'Timing Playmaker');

    await user.click(
      within(categoryCard('Hunter')).getByRole('button', {
        name: /\+ ajouter un héros/i,
      }),
    );
    let dialog = screen.getByRole('dialog', {
      name: /Ajouter des h.*Hunter/i,
    });
    await user.click(within(dialog).getByRole('checkbox', { name: /Axe/i }));
    await user.click(
      within(dialog).getByRole('button', { name: /enregistrer/i }),
    );

    await user.click(
      within(categoryCard('Timing Playmaker')).getByRole('button', {
        name: /\+ ajouter un héros/i,
      }),
    );
    dialog = screen.getByRole('dialog', {
      name: /Ajouter des h.*Timing Playmaker/i,
    });
    await user.click(within(dialog).getByRole('checkbox', { name: /Bane/i }));
    await user.click(
      within(dialog).getByRole('button', { name: /enregistrer/i }),
    );

    await user.click(screen.getByRole('tab', { name: /catalogue/i }));
    await user.click(screen.getByRole('checkbox', { name: 'Force' }));
    await user.click(
      screen.getByRole('checkbox', { name: /Tr.*confortable/i }),
    );
    await user.click(screen.getByRole('checkbox', { name: 'Hunter' }));

    expect(screen.getByRole('heading', { name: 'Axe' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Bane' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Phoenix' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /^Confortable$/i }));
    expect(screen.getByRole('heading', { name: 'Axe' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Hunter x/i }));
    expect(screen.getByRole('heading', { name: 'Axe' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Mon hero pool/i }));
    expect(screen.getByRole('heading', { name: 'Axe' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Earthshaker' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Force x/i }));
    await user.click(screen.getByRole('checkbox', { name: 'Intelligence' }));
    expect(
      screen.getByText(/Aucun heros ne correspond a ces filtres/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /effacer les filtres/i }),
    );
    expect(screen.getByRole('heading', { name: 'Axe' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bane' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Earthshaker' }),
    ).toBeInTheDocument();
  }, 10000);

  it('renders category cards and synchronizes assignments through the focused dialog', async () => {
    const user = userEvent.setup();

    render(
      <AppStateProvider>
        <ResolvedHeroPoolManager />
      </AppStateProvider>,
    );

    await screen.findByRole('tab', { name: /catalogue/i });
    await addHeroFromCatalogue(user, 'Axe', 'strong');
    await addHeroFromCatalogue(user, 'Bane', 'comfortable');
    await addHeroFromCatalogue(user, 'Phoenix', 'situational');

    await user.click(screen.getByRole('tab', { name: /mes cat/i }));
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

    await createCategory(user, 'Hunter');
    await createCategory(user, 'Timing Playmaker');

    const hunterCard = categoryCard('Hunter');
    const timingCard = categoryCard('Timing Playmaker');
    expect(within(hunterCard).getByText(/0 h.ros/)).toBeInTheDocument();
    expect(
      within(hunterCard).getByText(/Aucun h.ros dans cette cat/i),
    ).toBeInTheDocument();
    expect(within(timingCard).getByText(/0 h.ros/)).toBeInTheDocument();

    await user.click(
      within(hunterCard).getByRole('button', { name: /\+ ajouter un héros/i }),
    );
    let dialog = screen.getByRole('dialog', {
      name: /Ajouter des h.*Hunter/i,
    });
    expect(within(dialog).getByText(/pr.*sents/i)).toBeInTheDocument();
    expect(within(dialog).getByText('Axe')).toBeInTheDocument();
    expect(within(dialog).getByText('Bane')).toBeInTheDocument();
    expect(within(dialog).getByText('Phoenix')).toBeInTheDocument();
    expect(within(dialog).queryByText('Abaddon')).not.toBeInTheDocument();

    await user.type(
      within(dialog).getByLabelText(/rechercher dans ton hero pool/i),
      'ba',
    );
    expect(within(dialog).getByText('Bane')).toBeInTheDocument();
    expect(within(dialog).queryByText('Axe')).not.toBeInTheDocument();
    await user.clear(
      within(dialog).getByLabelText(/rechercher dans ton hero pool/i),
    );
    await user.click(
      within(dialog).getByRole('radio', { name: /^Confortable/i }),
    );
    expect(within(dialog).getByText('Bane')).toBeInTheDocument();
    expect(within(dialog).queryByText('Axe')).not.toBeInTheDocument();
    await user.type(
      within(dialog).getByLabelText(/rechercher dans ton hero pool/i),
      'bane',
    );
    expect(within(dialog).getByText('Bane')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /annuler/i }));
    expect(await readSnapshot()).toMatchObject({ playerHeroCategories: [] });

    await user.click(
      within(hunterCard).getByRole('button', { name: /\+ ajouter un héros/i }),
    );
    dialog = screen.getByRole('dialog', {
      name: /Ajouter des h.*Hunter/i,
    });
    await user.click(within(dialog).getByRole('checkbox', { name: /Axe/i }));
    await user.click(within(dialog).getByRole('checkbox', { name: /Bane/i }));
    expect(within(dialog).getByText(/2 h.ros s/i)).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole('button', { name: /enregistrer/i }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    let snapshot = await readSnapshot();
    expect(snapshot.playerHeroCategories).toHaveLength(2);
    expect(
      within(categoryCard('Hunter')).getByText(/2 h.ros/),
    ).toBeInTheDocument();
    expect(within(categoryCard('Hunter')).getByText('Axe')).toBeInTheDocument();
    expect(
      within(categoryCard('Hunter')).getByText('Bane'),
    ).toBeInTheDocument();

    await user.click(
      within(categoryCard('Hunter')).getByRole('button', {
        name: /\+ ajouter un héros/i,
      }),
    );
    dialog = screen.getByRole('dialog', {
      name: /Ajouter des h.*Hunter/i,
    });
    expect(
      within(dialog).getByRole('checkbox', { name: /Axe/i }),
    ).toBeChecked();
    expect(
      within(dialog).getByRole('checkbox', { name: /Bane/i }),
    ).toBeChecked();
    await user.click(within(dialog).getByRole('checkbox', { name: /Bane/i }));
    await user.click(
      within(dialog).getByRole('button', { name: /enregistrer/i }),
    );
    snapshot = await readSnapshot();
    expect(snapshot.playerHeroCategories).toHaveLength(1);
    expect(snapshot.playerHeroCategories[0].heroId).toBe('axe');
  }, 10000);

  it('uses focused create, rename, delete, and remove flows without deleting heroes or evaluations', async () => {
    const user = userEvent.setup();

    render(
      <AppStateProvider>
        <ResolvedHeroPoolManager />
      </AppStateProvider>,
    );

    await screen.findByRole('tab', { name: /catalogue/i });
    await addHeroFromCatalogue(user, 'Axe', 'signature');
    await user.click(
      screen.getByRole('button', { name: /sauver evaluation axe/i }),
    );
    await user.click(screen.getByRole('tab', { name: /mes cat/i }));
    await createCategory(user, 'Hunter');

    await user.click(
      within(categoryCard('Hunter')).getByRole('button', {
        name: /\+ ajouter un héros/i,
      }),
    );
    let dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('checkbox', { name: /Axe/i }));
    await user.click(
      within(dialog).getByRole('button', { name: /enregistrer/i }),
    );

    await user.click(
      within(categoryCard('Hunter')).getByRole('button', {
        name: /retirer de cette cat/i,
      }),
    );
    let snapshot = await readSnapshot();
    expect(snapshot.playerHeroes).toHaveLength(1);
    expect(snapshot.heroEvaluations).toHaveLength(1);
    expect(snapshot.playerHeroCategories).toHaveLength(0);

    const actions = within(categoryCard('Hunter')).getByText('Actions');
    await user.click(actions);
    await user.click(
      within(categoryCard('Hunter')).getByRole('button', { name: /renommer/i }),
    );
    dialog = screen.getByRole('dialog', { name: /renommer la cat/i });
    await user.clear(within(dialog).getByLabelText(/nom de la cat/i));
    await user.type(within(dialog).getByLabelText(/nom de la cat/i), 'Pickoff');
    await user.click(
      within(dialog).getByRole('button', { name: /enregistrer/i }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Pickoff' }),
    ).toBeInTheDocument();

    await user.click(within(categoryCard('Pickoff')).getByText('Actions'));
    await user.click(
      within(categoryCard('Pickoff')).getByRole('button', {
        name: /supprimer/i,
      }),
    );
    dialog = screen.getByRole('dialog', {
      name: /Supprimer la cat.*Pickoff/i,
    });
    expect(
      within(dialog).getByText(/Les héros resteront/i),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole('button', { name: /supprimer la cat/i }),
    );
    snapshot = await readSnapshot();
    expect(snapshot.heroCategories).toHaveLength(0);
    expect(snapshot.playerHeroes).toHaveLength(1);
    expect(snapshot.heroEvaluations).toHaveLength(1);
  });

  it('shows validation errors for empty and duplicate category names', async () => {
    const user = userEvent.setup();

    render(
      <AppStateProvider>
        <ResolvedHeroPoolManager />
      </AppStateProvider>,
    );

    await user.click(await screen.findByRole('tab', { name: /mes cat/i }));
    await user.click(screen.getByRole('button', { name: /\+ nouvelle cat/i }));
    let dialog = screen.getByRole('dialog', { name: /nouvelle cat/i });
    await user.click(within(dialog).getByRole('button', { name: /^Cr/i }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/obligatoire/i);
    await user.type(
      within(dialog).getByLabelText(/nom de la cat/i),
      'Initiation',
    );
    await user.click(within(dialog).getByRole('button', { name: /^Cr/i }));

    await user.click(screen.getByRole('button', { name: /\+ nouvelle cat/i }));
    dialog = screen.getByRole('dialog', { name: /nouvelle cat/i });
    await user.type(
      within(dialog).getByLabelText(/nom de la cat/i),
      ' initiation ',
    );
    await user.click(within(dialog).getByRole('button', { name: /^Cr/i }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/existe/i);
  });
});
