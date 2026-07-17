'use client';

import { useState, type FormEvent } from 'react';
import { Field } from '@/components/form/field';
import { MultiCheckbox } from '@/components/form/multi-checkbox';
import { RatingSelect } from '@/components/form/rating-select';
import {
  fightPositionIds,
  individualPlaystyleIds,
  roleIds,
  teamPlaystyleIds,
  type FightPositionId,
  type IndividualPlaystyleId,
  type RoleId,
  type TeamPlaystyleId,
} from '@/domain/value-objects/vocabularies';
import { useAppState } from '@/lib/app-state';
import {
  fightPositionLabels,
  individualPlaystyleLabels,
  roleLabels,
  teamPlaystyleLabels,
} from '@/lib/labels';

const roleOptions = roleIds.map((value) => ({
  value,
  label: roleLabels[value],
}));
const fightOptions = fightPositionIds.map((value) => ({
  value,
  label: fightPositionLabels[value],
}));
const individualOptions = individualPlaystyleIds.map((value) => ({
  value,
  label: individualPlaystyleLabels[value],
}));
const teamOptions = teamPlaystyleIds.map((value) => ({
  value,
  label: teamPlaystyleLabels[value],
}));

export function ProfileForm() {
  const { createProfile, currentPlayer, error } = useAppState();
  const [pseudonym, setPseudonym] = useState('');
  const [mainRole, setMainRole] = useState<RoleId>('position_1');
  const [secondaryRoles, setSecondaryRoles] = useState<RoleId[]>([]);
  const [farmPriority, setFarmPriority] = useState(3);
  const [preferredGamePace, setPreferredGamePace] = useState(3);
  const [cooldownDependencyComfort, setCooldownDependencyComfort] = useState(3);
  const [sacrificeComfort, setSacrificeComfort] = useState(3);
  const [shotCallingComfort, setShotCallingComfort] = useState(3);
  const [preferredFightPositions, setPreferredFightPositions] = useState<
    FightPositionId[]
  >([]);
  const [preferredIndividualPlaystyles, setPreferredIndividualPlaystyles] =
    useState<IndividualPlaystyleId[]>([]);
  const [preferredTeamPlaystyles, setPreferredTeamPlaystyles] = useState<
    TeamPlaystyleId[]
  >([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createProfile({
      teamId: 'local-team',
      pseudonym,
      mainRole,
      secondaryRoles,
      preferences: {
        farmPriority,
        preferredGamePace,
        cooldownDependencyComfort,
        sacrificeComfort,
        shotCallingComfort,
        preferredFightPositions,
        preferredIndividualPlaystyles,
        preferredTeamPlaystyles,
      },
    });
  }

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Profil joueur</h1>
        <p className="text-slate-700">
          Renseignez le role principal, les roles secondaires et les preferences
          de jeu.
        </p>
      </div>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-2">
          <Field htmlFor="pseudonym" label="Pseudonyme">
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              id="pseudonym"
              value={pseudonym}
              onChange={(event) => setPseudonym(event.target.value)}
            />
          </Field>
          <Field htmlFor="mainRole" label="Role principal">
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2"
              id="mainRole"
              value={mainRole}
              onChange={(event) => setMainRole(event.target.value as RoleId)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <MultiCheckbox
              legend="Roles secondaires"
              options={roleOptions}
              value={secondaryRoles}
              onChange={setSecondaryRoles}
            />
          </div>
        </div>
        <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-5">
          <RatingSelect
            id="farmPriority"
            label="Priorite farm"
            min={1}
            value={farmPriority}
            onChange={setFarmPriority}
          />
          <RatingSelect
            id="preferredGamePace"
            label="Rythme prefere"
            min={1}
            value={preferredGamePace}
            onChange={setPreferredGamePace}
          />
          <RatingSelect
            id="cooldownDependencyComfort"
            label="Confort cooldowns"
            min={1}
            value={cooldownDependencyComfort}
            onChange={setCooldownDependencyComfort}
          />
          <RatingSelect
            id="sacrificeComfort"
            label="Confort sacrifice"
            min={1}
            value={sacrificeComfort}
            onChange={setSacrificeComfort}
          />
          <RatingSelect
            id="shotCallingComfort"
            label="Shotcalling"
            min={1}
            value={shotCallingComfort}
            onChange={setShotCallingComfort}
          />
        </div>
        <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-3">
          <MultiCheckbox
            legend="Positions en combat"
            options={fightOptions}
            value={preferredFightPositions}
            onChange={setPreferredFightPositions}
          />
          <MultiCheckbox
            legend="Styles individuels"
            options={individualOptions}
            value={preferredIndividualPlaystyles}
            onChange={setPreferredIndividualPlaystyles}
          />
          <MultiCheckbox
            legend="Styles d'equipe"
            options={teamOptions}
            value={preferredTeamPlaystyles}
            onChange={setPreferredTeamPlaystyles}
          />
        </div>
        {error ? (
          <p
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {currentPlayer ? (
          <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Profil enregistre pour {currentPlayer.pseudonym}.
          </p>
        ) : null}
        <button className="w-fit rounded-md bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800">
          Enregistrer le profil
        </button>
      </form>
    </section>
  );
}
