'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  filterHeroCatalogue,
  formatCatalogueResultCount,
  removeInvalidCategoryFilters,
  type CataloguePoolScope,
  type FilteredHeroCatalogueResult,
} from '@/application/queries/filter-hero-catalogue';
import { SaveStatus, type SaveState } from '@/components/save-status';
import { HeroThumbnail } from '@/components/hero-thumbnail';
import type { Hero } from '@/domain/entities/hero';
import {
  normalizeHeroCategoryName,
  type HeroCategory,
  type PlayerHeroCategory,
} from '@/domain/entities/hero-category';
import type { PlayerHero } from '@/domain/entities/player-hero';
import {
  poolTierIds,
  primaryAttributeIds,
  type PoolTierId,
  type PrimaryAttributeId,
} from '@/domain/value-objects/vocabularies';
import { useAppState } from '@/lib/app-state';
import { poolTierDescriptions, poolTierLabels } from '@/lib/labels';
import { sortHeroesByDisplayName } from '@/lib/sort-heroes';

type HeroPoolView = 'catalogue' | 'comfort' | 'categories';

const primaryAttributeLabels: Record<PrimaryAttributeId, string> = {
  strength: 'Force',
  agility: 'Agilit\u00e9',
  intelligence: 'Intelligence',
  universal: 'Universel',
};

export function HeroPoolManager() {
  const {
    currentPlayer,
    heroes,
    heroPool,
    heroCategories,
    playerHeroCategories,
    addHero,
    updateHeroComfortTier,
    removeHero,
    createHeroCategory,
    renameHeroCategory,
    deleteHeroCategory,
    assignHeroCategory,
    syncHeroCategoryAssignments,
    error,
  } = useAppState();
  const [activeView, setActiveView] = useState<HeroPoolView>('catalogue');
  const [query, setQuery] = useState('');
  const [selectedAttributes, setSelectedAttributes] = useState<
    PrimaryAttributeId[]
  >([]);
  const [selectedComfortTiers, setSelectedComfortTiers] = useState<
    PoolTierId[]
  >([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [poolScope, setPoolScope] = useState<CataloguePoolScope>('all');
  const [pendingHero, setPendingHero] = useState<Hero | null>(null);
  const [pendingTier, setPendingTier] = useState<PoolTierId | ''>('');
  const [pendingCategoryIds, setPendingCategoryIds] = useState<string[]>([]);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createCategoryName, setCreateCategoryName] = useState('');
  const [categoryFormError, setCategoryFormError] = useState('');
  const [renameCategory, setRenameCategory] = useState<HeroCategory | null>(
    null,
  );
  const [renameCategoryName, setRenameCategoryName] = useState('');
  const [deleteCategoryTarget, setDeleteCategoryTarget] =
    useState<HeroCategory | null>(null);
  const [assignmentCategory, setAssignmentCategory] =
    useState<HeroCategory | null>(null);
  const [assignmentSelection, setAssignmentSelection] = useState<string[]>([]);
  const [assignmentQuery, setAssignmentQuery] = useState('');
  const [assignmentTierFilter, setAssignmentTierFilter] = useState<
    PoolTierId | 'all'
  >('all');
  const [status, setStatus] = useState<SaveState>('idle');

  const heroesById = useMemo(
    () => new Map(heroes.map((hero) => [hero.id, hero])),
    [heroes],
  );

  const categoriesByHero = useMemo(() => {
    const map = new Map<string, string[]>();
    playerHeroCategories.forEach((assignment) => {
      const existing = map.get(assignment.heroId) ?? [];
      map.set(assignment.heroId, [...existing, assignment.categoryId]);
    });
    return map;
  }, [playerHeroCategories]);

  useEffect(() => {
    setSelectedCategoryIds((current) =>
      removeInvalidCategoryFilters(current, heroCategories),
    );
  }, [heroCategories]);

  useEffect(() => {
    setSelectedComfortTiers([]);
    setSelectedCategoryIds([]);
  }, [currentPlayer?.id]);

  const filteredCatalogue = useMemo(
    () =>
      filterHeroCatalogue({
        heroes,
        playerHeroes: heroPool,
        categories: heroCategories,
        assignments: playerHeroCategories,
        filters: {
          search: query,
          selectedAttributes,
          selectedComfortTiers,
          selectedCategoryIds,
          poolScope,
        },
      }),
    [
      heroes,
      heroPool,
      heroCategories,
      playerHeroCategories,
      poolScope,
      query,
      selectedAttributes,
      selectedCategoryIds,
      selectedComfortTiers,
    ],
  );

  if (!currentPlayer) {
    return (
      <section className="grid gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Hero pool
        </h1>
        <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text-secondary)]">
          Crée d&apos;abord un profil joueur avant d&apos;ajouter des héros.
        </p>
      </section>
    );
  }

  async function handleAddHero() {
    if (!currentPlayer || !pendingHero || !pendingTier) {
      return;
    }

    setStatus('saving');
    const saved = await addHero({
      playerId: currentPlayer.id,
      heroId: pendingHero.id,
      roles: [],
      poolTier: pendingTier,
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

    if (!saved) {
      setStatus('failed');
      return;
    }

    for (const categoryId of pendingCategoryIds) {
      await assignHeroCategory(pendingHero.id, categoryId);
    }

    setPendingHero(null);
    setPendingTier('');
    setPendingCategoryIds([]);
    setStatus('saved');
  }

  async function handleTierChange(playerHero: PlayerHero, tier: PoolTierId) {
    setStatus('saving');
    const saved = await updateHeroComfortTier(playerHero, tier);
    setStatus(saved ? 'saved' : 'failed');
  }

  async function handleRemoveHero(playerHero: PlayerHero) {
    setStatus('saving');
    const saved = await removeHero(playerHero.id);
    setStatus(saved ? 'saved' : 'failed');
  }

  async function handleCreateCategory() {
    const validation = validateCategoryName(createCategoryName, heroCategories);
    if (validation) {
      setCategoryFormError(validation);
      return;
    }

    setStatus('saving');
    const saved = await createHeroCategory(createCategoryName);
    setStatus(saved ? 'saved' : 'failed');
    if (saved) {
      setCreateCategoryName('');
      setCategoryFormError('');
      setCreateCategoryOpen(false);
    }
  }

  async function handleRenameCategory() {
    if (!renameCategory) {
      return;
    }
    const validation = validateCategoryName(
      renameCategoryName,
      heroCategories,
      renameCategory.id,
    );
    if (validation) {
      setCategoryFormError(validation);
      return;
    }

    setStatus('saving');
    const saved = await renameHeroCategory(
      renameCategory.id,
      renameCategoryName,
    );
    setStatus(saved ? 'saved' : 'failed');
    if (saved) {
      setRenameCategory(null);
      setRenameCategoryName('');
      setCategoryFormError('');
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCategoryTarget) {
      return;
    }

    setStatus('saving');
    const saved = await deleteHeroCategory(deleteCategoryTarget.id);
    setStatus(saved ? 'saved' : 'failed');
    if (saved) {
      setDeleteCategoryTarget(null);
    }
  }

  async function handleSyncCategoryAssignments() {
    if (!assignmentCategory) {
      return;
    }

    setStatus('saving');
    const saved = await syncHeroCategoryAssignments(
      assignmentCategory.id,
      assignmentSelection,
    );
    setStatus(saved ? 'saved' : 'failed');
    if (saved) {
      closeAssignmentDialog();
    }
  }

  async function handleRemoveCategoryAssignment(
    heroId: string,
    categoryId: string,
  ) {
    const currentHeroIds = playerHeroCategories
      .filter((assignment) => assignment.categoryId === categoryId)
      .map((assignment) => assignment.heroId)
      .filter((id) => id !== heroId);
    setStatus('saving');
    const saved = await syncHeroCategoryAssignments(categoryId, currentHeroIds);
    setStatus(saved ? 'saved' : 'failed');
  }

  function openAssignmentDialog(category: HeroCategory) {
    setAssignmentCategory(category);
    setAssignmentSelection(
      playerHeroCategories
        .filter((assignment) => assignment.categoryId === category.id)
        .map((assignment) => assignment.heroId),
    );
    setAssignmentQuery('');
    setAssignmentTierFilter('all');
  }

  function closeAssignmentDialog() {
    setAssignmentCategory(null);
    setAssignmentSelection([]);
    setAssignmentQuery('');
    setAssignmentTierFilter('all');
  }
  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Hero pool
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Découvre, classe et organise les héros que tu veux jouer.
          </p>
        </div>
        <SaveStatus state={status} />
      </div>

      <div
        aria-label="Vues du hero pool"
        className="inline-flex w-fit flex-wrap rounded-md border border-[var(--border)] bg-[var(--surface)] p-1"
        role="tablist"
      >
        <ViewTab
          active={activeView === 'catalogue'}
          label="Catalogue"
          onClick={() => setActiveView('catalogue')}
        />
        <ViewTab
          active={activeView === 'comfort'}
          label="Niveaux de confort"
          onClick={() => setActiveView('comfort')}
        />
        <ViewTab
          active={activeView === 'categories'}
          label="Mes catégories"
          onClick={() => setActiveView('categories')}
        />
      </div>

      {error ? (
        <p
          className="rounded-md border border-[rgb(239_120_109_/_0.5)] bg-[rgb(239_120_109_/_0.12)] p-3 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {activeView === 'catalogue' ? (
        <CatalogueView
          heroCategories={heroCategories}
          poolScope={poolScope}
          query={query}
          results={filteredCatalogue}
          selectedAttributes={selectedAttributes}
          selectedCategoryIds={selectedCategoryIds}
          selectedComfortTiers={selectedComfortTiers}
          onAdd={(hero) => {
            setPendingHero(hero);
            setPendingTier('');
            setPendingCategoryIds([]);
          }}
          onClearFilters={() => {
            setQuery('');
            setSelectedAttributes([]);
            setSelectedComfortTiers([]);
            setSelectedCategoryIds([]);
            setPoolScope('all');
          }}
          onPoolScopeChange={setPoolScope}
          onQueryChange={setQuery}
          onRemoveAttribute={(attributeId) =>
            setSelectedAttributes((current) =>
              current.filter((id) => id !== attributeId),
            )
          }
          onRemoveCategory={(categoryId) =>
            setSelectedCategoryIds((current) =>
              current.filter((id) => id !== categoryId),
            )
          }
          onRemoveComfortTier={(tierId) =>
            setSelectedComfortTiers((current) =>
              current.filter((id) => id !== tierId),
            )
          }
          onToggleAttribute={(attributeId) =>
            setSelectedAttributes((current) =>
              toggleArrayValue(current, attributeId),
            )
          }
          onToggleCategory={(categoryId) =>
            setSelectedCategoryIds((current) =>
              toggleArrayValue(current, categoryId),
            )
          }
          onToggleComfortTier={(tierId) =>
            setSelectedComfortTiers((current) =>
              toggleArrayValue(current, tierId),
            )
          }
        />
      ) : null}

      {activeView === 'comfort' ? (
        <ComfortView
          categoriesByHero={categoriesByHero}
          heroCategories={heroCategories}
          heroPool={heroPool}
          heroesById={heroesById}
          onRemoveHero={handleRemoveHero}
          onTierChange={handleTierChange}
        />
      ) : null}

      {activeView === 'categories' ? (
        <CategoriesView
          heroCategories={heroCategories}
          heroPool={heroPool}
          heroesById={heroesById}
          playerHeroCategories={playerHeroCategories}
          onCreateCategory={() => {
            setCreateCategoryName('');
            setCategoryFormError('');
            setCreateCategoryOpen(true);
          }}
          onDeleteCategory={setDeleteCategoryTarget}
          onRemoveAssignment={handleRemoveCategoryAssignment}
          onRenameCategory={(category) => {
            setRenameCategory(category);
            setRenameCategoryName(category.name);
            setCategoryFormError('');
          }}
          onShowAssignmentDialog={openAssignmentDialog}
        />
      ) : null}

      {pendingHero ? (
        <AddHeroDialog
          categoryIds={pendingCategoryIds}
          categories={heroCategories}
          hero={pendingHero}
          tier={pendingTier}
          onCancel={() => {
            setPendingHero(null);
            setPendingTier('');
            setPendingCategoryIds([]);
          }}
          onCategoryToggle={(categoryId) =>
            setPendingCategoryIds((current) =>
              current.includes(categoryId)
                ? current.filter((id) => id !== categoryId)
                : [...current, categoryId],
            )
          }
          onSubmit={handleAddHero}
          onTierChange={setPendingTier}
        />
      ) : null}

      {createCategoryOpen ? (
        <CategoryNameDialog
          error={categoryFormError}
          name={createCategoryName}
          submitLabel="Créer"
          title="Nouvelle catégorie"
          onCancel={() => {
            setCreateCategoryOpen(false);
            setCreateCategoryName('');
            setCategoryFormError('');
          }}
          onNameChange={setCreateCategoryName}
          onSubmit={handleCreateCategory}
        />
      ) : null}

      {renameCategory ? (
        <CategoryNameDialog
          error={categoryFormError}
          name={renameCategoryName}
          submitLabel="Enregistrer"
          title="Renommer la catégorie"
          onCancel={() => {
            setRenameCategory(null);
            setRenameCategoryName('');
            setCategoryFormError('');
          }}
          onNameChange={setRenameCategoryName}
          onSubmit={handleRenameCategory}
        />
      ) : null}

      {deleteCategoryTarget ? (
        <DeleteCategoryDialog
          category={deleteCategoryTarget}
          onCancel={() => setDeleteCategoryTarget(null)}
          onDelete={handleDeleteCategory}
        />
      ) : null}

      {assignmentCategory ? (
        <CategoryAssignmentDialog
          category={assignmentCategory}
          heroPool={heroPool}
          heroesById={heroesById}
          query={assignmentQuery}
          selectedHeroIds={assignmentSelection}
          tierFilter={assignmentTierFilter}
          onCancel={closeAssignmentDialog}
          onQueryChange={setAssignmentQuery}
          onSubmit={handleSyncCategoryAssignments}
          onTierFilterChange={setAssignmentTierFilter}
          onToggleHero={(heroId) =>
            setAssignmentSelection((current) =>
              current.includes(heroId)
                ? current.filter((id) => id !== heroId)
                : [...current, heroId],
            )
          }
        />
      ) : null}
    </section>
  );
}

function ViewTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-selected={active}
      className={`min-h-10 rounded px-3 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-[var(--accent)] text-white'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
      role="tab"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function CatalogueView({
  heroCategories,
  poolScope,
  query,
  results,
  selectedAttributes,
  selectedCategoryIds,
  selectedComfortTiers,
  onAdd,
  onClearFilters,
  onPoolScopeChange,
  onQueryChange,
  onRemoveAttribute,
  onRemoveCategory,
  onRemoveComfortTier,
  onToggleAttribute,
  onToggleCategory,
  onToggleComfortTier,
}: {
  heroCategories: HeroCategory[];
  poolScope: CataloguePoolScope;
  query: string;
  results: FilteredHeroCatalogueResult[];
  selectedAttributes: PrimaryAttributeId[];
  selectedCategoryIds: string[];
  selectedComfortTiers: PoolTierId[];
  onAdd: (hero: Hero) => void;
  onClearFilters: () => void;
  onPoolScopeChange: (value: CataloguePoolScope) => void;
  onQueryChange: (value: string) => void;
  onRemoveAttribute: (value: PrimaryAttributeId) => void;
  onRemoveCategory: (value: string) => void;
  onRemoveComfortTier: (value: PoolTierId) => void;
  onToggleAttribute: (value: PrimaryAttributeId) => void;
  onToggleCategory: (value: string) => void;
  onToggleComfortTier: (value: PoolTierId) => void;
}) {
  const categoryById = new Map(
    heroCategories.map((category) => [category.id, category]),
  );
  const activeFilters = [
    ...selectedAttributes.map((attributeId) => ({
      id: `attribute-${attributeId}`,
      label: primaryAttributeLabels[attributeId],
      onRemove: () => onRemoveAttribute(attributeId),
    })),
    ...selectedComfortTiers.map((tierId) => ({
      id: `tier-${tierId}`,
      label: poolTierLabels[tierId],
      onRemove: () => onRemoveComfortTier(tierId),
    })),
    ...selectedCategoryIds.map((categoryId) => ({
      id: `category-${categoryId}`,
      label: categoryById.get(categoryId)?.name ?? categoryId,
      onRemove: () => onRemoveCategory(categoryId),
    })),
  ];
  const hasFilters = activeFilters.length > 0 || query || poolScope !== 'all';

  return (
    <div className="grid gap-5">
      <section className="grid gap-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)] sm:p-5">
        <div
          aria-label="Portee du catalogue"
          className="inline-flex w-fit flex-wrap rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-1"
        >
          <button
            aria-pressed={poolScope === 'all'}
            className={`min-h-10 rounded px-3 py-2 text-sm font-semibold ${
              poolScope === 'all'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            type="button"
            onClick={() => onPoolScopeChange('all')}
          >
            Tous les heros
          </button>
          <button
            aria-pressed={poolScope === 'pool'}
            className={`min-h-10 rounded px-3 py-2 text-sm font-semibold ${
              poolScope === 'pool'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            type="button"
            onClick={() => onPoolScopeChange('pool')}
          >
            Mon hero pool
          </button>
        </div>

        <label
          className="grid gap-2 text-sm font-medium text-[var(--text-primary)]"
          htmlFor="heroSearch"
        >
          Rechercher un heros
          <input
            className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--text-primary)]"
            id="heroSearch"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>

        <CatalogueFilterGroup legend="Attributs">
          {primaryAttributeIds.map((attributeId) => (
            <FilterCheckbox
              key={attributeId}
              checked={selectedAttributes.includes(attributeId)}
              label={primaryAttributeLabels[attributeId]}
              onChange={() => onToggleAttribute(attributeId)}
            />
          ))}
        </CatalogueFilterGroup>

        <CatalogueFilterGroup legend="Niveaux de confort">
          {poolTierIds.map((tierId) => (
            <FilterCheckbox
              key={tierId}
              checked={selectedComfortTiers.includes(tierId)}
              label={poolTierLabels[tierId]}
              onChange={() => onToggleComfortTier(tierId)}
            />
          ))}
        </CatalogueFilterGroup>

        {heroCategories.length > 0 ? (
          <CatalogueFilterGroup legend="Categories">
            {heroCategories.map((category) => (
              <FilterCheckbox
                key={category.id}
                checked={selectedCategoryIds.includes(category.id)}
                label={category.name}
                onChange={() => onToggleCategory(category.id)}
              />
            ))}
          </CatalogueFilterGroup>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {formatCatalogueResultCount(results.length)}
          </p>
          {hasFilters ? (
            <button
              className="min-h-10 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
              type="button"
              onClick={onClearFilters}
            >
              Effacer les filtres
            </button>
          ) : null}
        </div>

        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap gap-2" aria-label="Filtres actifs">
            {activeFilters.map((filter) => (
              <button
                key={filter.id}
                className="min-h-9 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1 text-sm text-[var(--text-primary)] hover:border-[var(--accent)]"
                type="button"
                onClick={filter.onRemove}
              >
                {filter.label} x
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {results.length === 0 ? (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text-secondary)] shadow-[var(--shadow-panel)]">
          Aucun heros ne correspond a ces filtres.
        </section>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((result) => {
            const { hero, playerHero } = result;
            const selected = playerHero !== null;
            return (
              <article
                key={hero.id}
                className={`grid gap-3 rounded-md border p-3 ${
                  selected
                    ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.16)]'
                    : 'border-[var(--border)] bg-[var(--surface-elevated)]'
                }`}
              >
                <HeroThumbnail
                  hero={hero}
                  size="large"
                  className="rounded-md"
                />
                <div>
                  <h2 className="font-semibold text-[var(--text-primary)]">
                    {hero.displayName}
                  </h2>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                    {primaryAttributeLabels[hero.primaryAttribute]}
                  </p>
                  {playerHero ? (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {poolTierLabels[playerHero.poolTier]}
                    </p>
                  ) : null}
                  {result.categories.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {result.categories.slice(0, 2).map((category) => (
                        <span
                          key={category.id}
                          className="rounded-full border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)]"
                        >
                          {category.name}
                        </span>
                      ))}
                      {result.categories.length > 2 ? (
                        <span className="rounded-full border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                          +{result.categories.length - 2}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {selected ? (
                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-[var(--success)]">
                      Deja dans ton pool
                    </span>
                    <Link
                      className="min-h-10 rounded-md border border-[var(--border)] px-3 py-2 text-center text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)]"
                      href={`/player/heroes/${hero.id}`}
                    >
                      Voir le profil
                    </Link>
                  </div>
                ) : (
                  <button
                    className="min-h-10 rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                    type="button"
                    onClick={() => onAdd(hero)}
                  >
                    Ajouter
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CatalogueFilterGroup({
  children,
  legend,
}: {
  children: ReactNode;
  legend: string;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-[var(--text-primary)]">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function FilterCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
        checked
          ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.16)] text-[var(--text-primary)]'
          : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]'
      }`}
    >
      <input
        checked={checked}
        className="h-4 w-4 accent-[var(--accent)]"
        type="checkbox"
        onChange={onChange}
      />
      {label}
    </label>
  );
}

function AddHeroDialog({
  categoryIds,
  categories,
  hero,
  tier,
  onCancel,
  onCategoryToggle,
  onSubmit,
  onTierChange,
}: {
  categoryIds: string[];
  categories: { id: string; name: string }[];
  hero: Hero;
  tier: PoolTierId | '';
  onCancel: () => void;
  onCategoryToggle: (categoryId: string) => void;
  onSubmit: () => void;
  onTierChange: (value: PoolTierId) => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      role="dialog"
    >
      <div className="grid w-full max-w-xl gap-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)]">
        <div className="flex items-center gap-3">
          <HeroThumbnail hero={hero} size="small" className="rounded-md" />
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Ajouter {hero.displayName} à ton hero pool
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Dans quel niveau de confort veux-tu le placer ?
            </p>
          </div>
        </div>

        <fieldset className="grid gap-3">
          <legend className="sr-only">Niveau de confort</legend>
          {poolTierIds.map((tierId) => (
            <label
              key={tierId}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                tier === tierId
                  ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.18)]'
                  : 'border-[var(--border)] bg-[var(--surface-elevated)]'
              }`}
            >
              <input
                checked={tier === tierId}
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
                name="addHeroTier"
                type="radio"
                value={tierId}
                onChange={() => onTierChange(tierId)}
              />
              <span>
                <span className="block font-semibold text-[var(--text-primary)]">
                  {poolTierLabels[tierId]}
                </span>
                <span className="block text-sm text-[var(--text-secondary)]">
                  {poolTierDescriptions[tierId]}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        {categories.length > 0 ? (
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold text-[var(--text-primary)]">
              Catégories optionnelles
            </legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <input
                    checked={categoryIds.includes(category.id)}
                    className="h-4 w-4 accent-[var(--accent)]"
                    type="checkbox"
                    onChange={() => onCategoryToggle(category.id)}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="min-h-10 rounded-md border border-[var(--border)] px-4 py-2 font-medium text-[var(--text-primary)]"
            type="button"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className="min-h-10 rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!tier}
            type="button"
            onClick={onSubmit}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

function ComfortView({
  categoriesByHero,
  heroCategories,
  heroPool,
  heroesById,
  onRemoveHero,
  onTierChange,
}: {
  categoriesByHero: Map<string, string[]>;
  heroCategories: { id: string; name: string }[];
  heroPool: PlayerHero[];
  heroesById: Map<string, Hero>;
  onRemoveHero: (playerHero: PlayerHero) => void;
  onTierChange: (playerHero: PlayerHero, tier: PoolTierId) => void;
}) {
  if (heroPool.length === 0) {
    return <EmptyPool />;
  }

  return (
    <div className="grid gap-5">
      {poolTierIds.map((tierId) => {
        const tierHeroes = sortHeroesByDisplayName(
          heroPool.filter((playerHero) => playerHero.poolTier === tierId),
          (playerHero) => heroesById.get(playerHero.heroId),
        );
        return (
          <section
            key={tierId}
            className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)]"
          >
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {poolTierLabels[tierId]}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {poolTierDescriptions[tierId]}
              </p>
            </div>
            {tierHeroes.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Aucun héros dans ce niveau.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {tierHeroes.map((playerHero) => (
                  <PoolHeroCard
                    key={playerHero.id}
                    categoryNames={categoryNamesForHero(
                      playerHero.heroId,
                      categoriesByHero,
                      heroCategories,
                    )}
                    hero={heroesById.get(playerHero.heroId) ?? null}
                    playerHero={playerHero}
                    onRemove={() => onRemoveHero(playerHero)}
                    onTierChange={(nextTier) =>
                      onTierChange(playerHero, nextTier)
                    }
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function PoolHeroCard({
  categoryNames,
  hero,
  playerHero,
  onRemove,
  onTierChange,
}: {
  categoryNames: string[];
  hero: Hero | null;
  playerHero: PlayerHero;
  onRemove: () => void;
  onTierChange: (tier: PoolTierId) => void;
}) {
  return (
    <article className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
      <div className="flex gap-3">
        {hero ? (
          <HeroThumbnail hero={hero} size="large" className="w-28 rounded-md" />
        ) : null}
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)]">
            {hero?.displayName ?? playerHero.heroId}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {poolTierLabels[playerHero.poolTier]}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {categoryNames.map((name) => (
              <span
                key={name}
                className="rounded-full border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Link
        className="min-h-10 rounded-md border border-[var(--border)] px-3 py-2 text-center text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
        href={`/player/heroes/${playerHero.heroId}`}
      >
        Ouvrir le détail
      </Link>
      <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
        Changer le niveau de confort
        <select
          className="min-h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]"
          value={playerHero.poolTier}
          onChange={(event) => onTierChange(event.target.value as PoolTierId)}
        >
          {poolTierIds.map((tierId) => (
            <option key={tierId} value={tierId}>
              {poolTierLabels[tierId]}
            </option>
          ))}
        </select>
      </label>
      <button
        className="min-h-10 rounded-md border border-[rgb(239_120_109_/_0.5)] px-3 py-2 text-sm font-medium text-[var(--danger)] hover:bg-[rgb(239_120_109_/_0.12)]"
        type="button"
        onClick={onRemove}
      >
        Retirer
      </button>
    </article>
  );
}

function CategoriesView({
  heroCategories,
  heroPool,
  heroesById,
  playerHeroCategories,
  onCreateCategory,
  onDeleteCategory,
  onRemoveAssignment,
  onRenameCategory,
  onShowAssignmentDialog,
}: {
  heroCategories: HeroCategory[];
  heroPool: PlayerHero[];
  heroesById: Map<string, Hero>;
  playerHeroCategories: PlayerHeroCategory[];
  onCreateCategory: () => void;
  onDeleteCategory: (category: HeroCategory) => void;
  onRemoveAssignment: (heroId: string, categoryId: string) => void;
  onRenameCategory: (category: HeroCategory) => void;
  onShowAssignmentDialog: (category: HeroCategory) => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Mes catégories
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Organise les héros de ton pool selon tes propres critères.
          </p>
        </div>
        <button
          className="min-h-11 rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--accent-hover)]"
          type="button"
          onClick={onCreateCategory}
        >
          + Nouvelle catégorie
        </button>
      </div>

      {heroCategories.length === 0 ? (
        <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text-secondary)] shadow-[var(--shadow-panel)]">
          Aucune catégorie pour le moment.
        </p>
      ) : (
        <div className="grid gap-4">
          {heroCategories.map((category) => {
            const assignedHeroIds = playerHeroCategories
              .filter((assignment) => assignment.categoryId === category.id)
              .map((assignment) => assignment.heroId);
            const assignedHeroes = sortHeroesByDisplayName(
              heroPool.filter((playerHero) =>
                assignedHeroIds.includes(playerHero.heroId),
              ),
              (playerHero) => heroesById.get(playerHero.heroId),
            );

            return (
              <section
                key={category.id}
                aria-labelledby={`category-${category.id}`}
                className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-panel)] sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3
                      className="text-lg font-semibold text-[var(--text-primary)]"
                      id={`category-${category.id}`}
                    >
                      {category.name}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {formatHeroCount(assignedHeroes.length)}
                    </p>
                  </div>
                  <details className="relative">
                    <summary className="flex min-h-10 cursor-pointer list-none items-center rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] marker:hidden">
                      Actions
                    </summary>
                    <div className="absolute right-0 z-10 mt-2 grid min-w-40 gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-2 shadow-[var(--shadow-panel)]">
                      <button
                        className="rounded px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[rgb(255_255_255_/_0.06)]"
                        type="button"
                        onClick={() => onRenameCategory(category)}
                      >
                        Renommer
                      </button>
                      <button
                        className="rounded px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[rgb(239_120_109_/_0.12)]"
                        type="button"
                        onClick={() => onDeleteCategory(category)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </details>
                </div>

                {assignedHeroes.length === 0 ? (
                  <p className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
                    Aucun héros dans cette catégorie.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {assignedHeroes.map((playerHero) => (
                      <CategoryHeroCard
                        key={`${category.id}-${playerHero.heroId}`}
                        categoryId={category.id}
                        hero={heroesById.get(playerHero.heroId) ?? null}
                        playerHero={playerHero}
                        onRemove={onRemoveAssignment}
                      />
                    ))}
                  </div>
                )}

                <div className="flex justify-start">
                  <button
                    className="min-h-10 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)]"
                    type="button"
                    onClick={() => onShowAssignmentDialog(category)}
                  >
                    + Ajouter un héros
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryHeroCard({
  categoryId,
  hero,
  playerHero,
  onRemove,
}: {
  categoryId: string;
  hero: Hero | null;
  playerHero: PlayerHero;
  onRemove: (heroId: string, categoryId: string) => void;
}) {
  const heroName = hero?.displayName ?? playerHero.heroId;

  return (
    <article className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
      <Link
        className="flex min-w-0 gap-3 rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        href={`/player/heroes/${playerHero.heroId}`}
      >
        {hero ? (
          <HeroThumbnail hero={hero} size="small" className="rounded" />
        ) : null}
        <span className="min-w-0">
          <span className="block truncate font-semibold text-[var(--text-primary)]">
            {heroName}
          </span>
          <span className="block text-sm text-[var(--text-secondary)]">
            {poolTierLabels[playerHero.poolTier]}
          </span>
        </span>
      </Link>
      <button
        className="min-h-10 rounded-md border border-[rgb(239_120_109_/_0.45)] px-3 py-2 text-sm font-medium text-[var(--danger)] hover:bg-[rgb(239_120_109_/_0.12)]"
        type="button"
        onClick={() => onRemove(playerHero.heroId, categoryId)}
      >
        Retirer de cette catégorie
      </button>
    </article>
  );
}

function CategoryNameDialog({
  error,
  name,
  submitLabel,
  title,
  onCancel,
  onNameChange,
  onSubmit,
}: {
  error: string;
  name: string;
  submitLabel: string;
  title: string;
  onCancel: () => void;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div
      aria-labelledby="categoryNameDialogTitle"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      role="dialog"
    >
      <div className="grid w-full max-w-md gap-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)]">
        <h2
          className="text-xl font-bold text-[var(--text-primary)]"
          id="categoryNameDialogTitle"
        >
          {title}
        </h2>
        <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
          Nom de la catégorie
          <input
            autoFocus
            className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--text-primary)]"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>
        {error ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="min-h-10 rounded-md border border-[var(--border)] px-4 py-2 font-medium text-[var(--text-primary)]"
            type="button"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className="min-h-10 rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-white"
            type="button"
            onClick={onSubmit}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteCategoryDialog({
  category,
  onCancel,
  onDelete,
}: {
  category: HeroCategory;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      aria-labelledby="deleteCategoryDialogTitle"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      role="dialog"
    >
      <div className="grid w-full max-w-lg gap-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)]">
        <div>
          <h2
            className="text-xl font-bold text-[var(--text-primary)]"
            id="deleteCategoryDialogTitle"
          >
            Supprimer la catégorie « {category.name} » ?
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Les héros resteront dans ton hero pool. Seule cette catégorie et ses
            associations seront supprimées.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="min-h-10 rounded-md border border-[var(--border)] px-4 py-2 font-medium text-[var(--text-primary)]"
            type="button"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className="min-h-10 rounded-md bg-[var(--danger)] px-4 py-2 font-semibold text-white"
            type="button"
            onClick={onDelete}
          >
            Supprimer la catégorie
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryAssignmentDialog({
  category,
  heroPool,
  heroesById,
  query,
  selectedHeroIds,
  tierFilter,
  onCancel,
  onQueryChange,
  onSubmit,
  onTierFilterChange,
  onToggleHero,
}: {
  category: HeroCategory;
  heroPool: PlayerHero[];
  heroesById: Map<string, Hero>;
  query: string;
  selectedHeroIds: string[];
  tierFilter: PoolTierId | 'all';
  onCancel: () => void;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  onTierFilterChange: (tier: PoolTierId | 'all') => void;
  onToggleHero: (heroId: string) => void;
}) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredPool = sortHeroesByDisplayName(
    heroPool
      .filter((playerHero) =>
        tierFilter === 'all' ? true : playerHero.poolTier === tierFilter,
      )
      .filter((playerHero) => {
        const hero = heroesById.get(playerHero.heroId);
        return normalizedQuery
          ? (hero?.displayName ?? playerHero.heroId)
              .toLocaleLowerCase()
              .includes(normalizedQuery)
          : true;
      }),
    (playerHero) => heroesById.get(playerHero.heroId),
  );

  return (
    <div
      aria-labelledby="categoryAssignmentDialogTitle"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      role="dialog"
    >
      <div className="grid max-h-[90vh] w-full max-w-3xl gap-5 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)]">
        <div>
          <h2
            className="text-xl font-bold text-[var(--text-primary)]"
            id="categoryAssignmentDialogTitle"
          >
            Ajouter des héros à « {category.name} »
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Choisis parmi les héros déjà présents dans ton hero pool.
          </p>
        </div>

        <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
          Rechercher dans ton hero pool
          <input
            autoFocus
            className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[var(--text-primary)]"
            placeholder="Rechercher dans ton hero pool..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold text-[var(--text-primary)]">
            Niveau de confort
          </legend>
          <div className="flex flex-wrap gap-2">
            <FilterRadio
              checked={tierFilter === 'all'}
              label="Tous"
              name="categoryComfortFilter"
              onChange={() => onTierFilterChange('all')}
            />
            {poolTierIds.map((tierId) => (
              <FilterRadio
                key={tierId}
                checked={tierFilter === tierId}
                label={poolTierLabels[tierId]}
                name="categoryComfortFilter"
                onChange={() => onTierFilterChange(tierId)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="sr-only">Héros à classer</legend>
          {filteredPool.length === 0 ? (
            <p className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
              Aucun héros de ton pool ne correspond à cette recherche.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredPool.map((playerHero) => {
                const hero = heroesById.get(playerHero.heroId);
                const selected = selectedHeroIds.includes(playerHero.heroId);
                return (
                  <label
                    key={playerHero.id}
                    className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-md border p-3 ${
                      selected
                        ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.18)]'
                        : 'border-[var(--border)] bg-[var(--surface-elevated)]'
                    }`}
                  >
                    <input
                      checked={selected}
                      className="h-4 w-4 accent-[var(--accent)]"
                      type="checkbox"
                      onChange={() => onToggleHero(playerHero.heroId)}
                    />
                    {hero ? (
                      <HeroThumbnail
                        hero={hero}
                        size="small"
                        className="rounded"
                      />
                    ) : null}
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[var(--text-primary)]">
                        {hero?.displayName ?? playerHero.heroId}
                      </span>
                      <span className="block text-sm text-[var(--text-secondary)]">
                        {poolTierLabels[playerHero.poolTier]}
                      </span>
                    </span>
                    {selected ? (
                      <span className="ml-auto text-sm font-semibold text-[var(--success)]">
                        Sélectionné
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        <p className="text-sm font-medium text-[var(--text-primary)]">
          {formatHeroCount(selectedHeroIds.length)} sélectionné
          {selectedHeroIds.length > 1 ? 's' : ''}
        </p>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="min-h-10 rounded-md border border-[var(--border)] px-4 py-2 font-medium text-[var(--text-primary)]"
            type="button"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className="min-h-10 rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-white"
            type="button"
            onClick={onSubmit}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterRadio({
  checked,
  label,
  name,
  onChange,
}: {
  checked: boolean;
  label: string;
  name: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
        checked
          ? 'border-[var(--accent)] bg-[rgb(201_71_56_/_0.18)] text-[var(--text-primary)]'
          : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]'
      }`}
    >
      <input
        checked={checked}
        className="h-4 w-4 accent-[var(--accent)]"
        name={name}
        type="radio"
        onChange={onChange}
      />
      {label}
    </label>
  );
}

function toggleArrayValue<T>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];
}

function formatHeroCount(count: number): string {
  return `${count} h\u00e9ros`;
}

function validateCategoryName(
  name: string,
  categories: HeroCategory[],
  currentCategoryId?: string,
): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Le nom de catégorie est obligatoire.';
  }

  const normalizedName = normalizeHeroCategoryName(trimmed);
  const duplicate = categories.some(
    (category) =>
      category.id !== currentCategoryId &&
      category.normalizedName === normalizedName,
  );
  return duplicate ? 'Une catégorie avec ce nom existe déjà.' : '';
}

function EmptyPool() {
  return (
    <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text-secondary)]">
      Aucun héros dans le pool pour le moment.
    </p>
  );
}

function categoryNamesForHero(
  heroId: string,
  categoriesByHero: Map<string, string[]>,
  categories: { id: string; name: string }[],
): string[] {
  const ids = categoriesByHero.get(heroId) ?? [];
  return ids
    .map((id) => categories.find((category) => category.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}
