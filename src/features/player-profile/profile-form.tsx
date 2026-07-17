'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  MultiChoiceCards,
  SingleChoiceCards,
} from '@/components/form/choice-cards';
import { QuestionCard } from '@/components/form/question-card';
import { SegmentedScale } from '@/components/form/segmented-scale';
import { SaveStatus, type SaveState } from '@/components/save-status';
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
  fightPositionDescriptions,
  fightPositionLabels,
  individualPlaystyleDescriptions,
  individualPlaystyleLabels,
  roleDescriptions,
  roleLabels,
  teamPlaystyleDescriptions,
  teamPlaystyleLabels,
} from '@/lib/labels';

const roleOptions = roleIds.map((value) => ({
  value,
  label: roleLabels[value],
  description: roleDescriptions[value],
}));
const fightOptions = fightPositionIds.map((value) => ({
  value,
  label: fightPositionLabels[value],
  description: fightPositionDescriptions[value],
}));
const individualOptions = individualPlaystyleIds.map((value) => ({
  value,
  label: individualPlaystyleLabels[value],
  description: individualPlaystyleDescriptions[value],
}));
const teamOptions = teamPlaystyleIds.map((value) => ({
  value,
  label: teamPlaystyleLabels[value],
  description: teamPlaystyleDescriptions[value],
}));

const fightTimingOptions = fightOptions.filter((option) =>
  ['frontline', 'second_wave', 'backline'].includes(option.value),
);
const fightApproachOptions = fightOptions.filter((option) =>
  ['flank', 'high_ground'].includes(option.value),
);

const scaleLabels = {
  farmPriority: {
    low: 'Très peu de ressources',
    mid: 'Besoin modéré',
    high: 'Beaucoup de ressources',
  },
  preferredGamePace: {
    low: 'Patient et réactif',
    mid: 'Adaptable',
    high: 'Rapide et proactif',
  },
  cooldownDependencyComfort: {
    low: 'Je préfère être disponible souvent',
    mid: 'Cela dépend du héros',
    high: 'Les longs temps de recharge ne me dérangent pas',
  },
  sacrificeComfort: {
    low: 'Je protège mes ressources',
    mid: 'Je peux sacrifier si le plan est clair',
    high: "Je peux beaucoup sacrifier pour l'équipe",
  },
  shotCallingComfort: {
    low: 'Je préfère suivre les décisions',
    mid: "Je propose quand l'occasion est claire",
    high: "J'aime guider les décisions",
  },
};

export function ProfileForm() {
  const {
    createProfile,
    currentPlayer,
    currentPreferences,
    saveProfile,
    error,
  } = useAppState();
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
  const [saveStatus, setSaveStatus] = useState<SaveState>('idle');

  const secondaryRoleOptions = roleOptions.filter(
    (option) => option.value !== mainRole,
  );

  useEffect(() => {
    if (!currentPlayer) {
      return;
    }

    setPseudonym(currentPlayer.pseudonym);
    setMainRole(currentPlayer.mainRole);
    setSecondaryRoles(
      currentPlayer.secondaryRoles.filter(
        (roleId) => roleId !== currentPlayer.mainRole,
      ),
    );
  }, [currentPlayer]);

  useEffect(() => {
    if (!currentPreferences) {
      return;
    }

    setFarmPriority(currentPreferences.farmPriority);
    setPreferredGamePace(currentPreferences.preferredGamePace);
    setCooldownDependencyComfort(currentPreferences.cooldownDependencyComfort);
    setSacrificeComfort(currentPreferences.sacrificeComfort);
    setShotCallingComfort(currentPreferences.shotCallingComfort);
    setPreferredFightPositions(currentPreferences.preferredFightPositions);
    setPreferredIndividualPlaystyles(
      currentPreferences.preferredIndividualPlaystyles,
    );
    setPreferredTeamPlaystyles(currentPreferences.preferredTeamPlaystyles);
    setSaveStatus('saved');
  }, [currentPreferences]);

  function updateMainRole(value: RoleId) {
    setMainRole(value);
    setSecondaryRoles((roles) => roles.filter((roleId) => roleId !== value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveStatus('saving');

    const preferences = {
      farmPriority,
      preferredGamePace,
      cooldownDependencyComfort,
      sacrificeComfort,
      shotCallingComfort,
      preferredFightPositions,
      preferredIndividualPlaystyles,
      preferredTeamPlaystyles,
    };

    if (currentPlayer && currentPreferences) {
      const saved = await saveProfile({
        player: {
          ...currentPlayer,
          mainRole,
          secondaryRoles,
        },
        preferences: {
          ...currentPreferences,
          ...preferences,
        },
      });
      setSaveStatus(saved ? 'saved' : 'failed');
    } else {
      const saved = await createProfile({
        teamId: 'local-team',
        pseudonym,
        mainRole,
        secondaryRoles,
        preferences,
      });
      setSaveStatus(saved ? 'saved' : 'failed');
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-[820px] gap-6">
      <div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Profil joueur
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Réponds aux questions pour décrire tes préférences de jeu.
          </p>
        </div>
      </div>

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <SectionIntro
          description="Définis d'abord les positions que tu veux réellement jouer."
          title="Tes rôles"
        />
        <QuestionCard
          helperText="Choisis le rôle dans lequel tu te sens le plus utile et le plus naturel."
          id="mainRole"
          question="Quel rôle préfères-tu jouer lorsque tu peux choisir librement ?"
          sectionLabel="Tes rôles"
        >
          <SingleChoiceCards
            legend="Rôle préféré"
            name="mainRole"
            options={roleOptions}
            value={mainRole}
            onChange={updateMainRole}
          />
        </QuestionCard>

        <QuestionCard
          helperText="Sélectionne les rôles que tu peux assumer sans désorganiser l'équipe."
          id="secondaryRoles"
          question="Quels autres rôles peux-tu jouer confortablement lorsque tu veux jouer au mieux ?"
          sectionLabel="Tes rôles"
        >
          <MultiChoiceCards
            legend="Autres rôles confortables"
            options={secondaryRoleOptions}
            value={secondaryRoles}
            onChange={setSecondaryRoles}
          />
        </QuestionCard>

        <SectionIntro
          description="Ces réponses décrivent ton rythme naturel et tes compromis en partie."
          title="Ton rythme de jeu"
        />
        <QuestionCard
          helperText="Pense au farm, aux niveaux et aux objets dont ton héros a besoin avant de devenir pleinement efficace."
          id="farmPriority"
          question="De combien de ressources as-tu généralement besoin pour avoir un impact dans la partie ?"
          sectionLabel="Ton rythme de jeu"
        >
          <SegmentedScale
            labels={scaleLabels.farmPriority}
            legend="Besoin en ressources"
            name="farmPriority"
            value={farmPriority}
            onChange={setFarmPriority}
          />
        </QuestionCard>

        <QuestionCard
          helperText="Indique si tu préfères attendre les fenêtres sûres ou créer rapidement de l'action."
          id="preferredGamePace"
          question="À quel rythme préfères-tu jouer la partie ?"
          sectionLabel="Ton rythme de jeu"
        >
          <SegmentedScale
            labels={scaleLabels.preferredGamePace}
            legend="Rythme de jeu préféré"
            name="preferredGamePace"
            value={preferredGamePace}
            onChange={setPreferredGamePace}
          />
        </QuestionCard>

        <QuestionCard
          helperText="Certains héros traversent une période plus faible après avoir utilisé leurs sorts principaux."
          id="cooldownDependencyComfort"
          question="À quel point es-tu à l'aise avec des héros dont l'impact dépend de longs temps de recharge ?"
          sectionLabel="Ton rythme de jeu"
        >
          <SegmentedScale
            labels={scaleLabels.cooldownDependencyComfort}
            legend="Confort avec les longs temps de recharge"
            name="cooldownDependencyComfort"
            value={cooldownDependencyComfort}
            onChange={setCooldownDependencyComfort}
          />
        </QuestionCard>

        <QuestionCard
          helperText="Il n'y a pas de bonne réponse : cela mesure simplement le coût personnel que tu acceptes pour aider l'équipe."
          id="sacrificeComfort"
          question="À quel point es-tu prêt à sacrifier ton farm, ton positionnement ou ta survie pour créer un avantage collectif ?"
          sectionLabel="Ton rythme de jeu"
        >
          <SegmentedScale
            labels={scaleLabels.sacrificeComfort}
            legend="Confort avec le sacrifice personnel"
            name="sacrificeComfort"
            value={sacrificeComfort}
            onChange={setSacrificeComfort}
          />
        </QuestionCard>

        <QuestionCard
          helperText="Cela concerne ta manière de communiquer, pas ton niveau mécanique."
          id="shotCallingComfort"
          question="À quel point te sens-tu à l'aise pour proposer des décisions et guider l'équipe pendant la partie ?"
          sectionLabel="Ton rythme de jeu"
        >
          <SegmentedScale
            labels={scaleLabels.shotCallingComfort}
            legend="Confort pour guider les décisions"
            name="shotCallingComfort"
            value={shotCallingComfort}
            onChange={setShotCallingComfort}
          />
        </QuestionCard>

        <SectionIntro
          description="Précise où et comment tu préfères aborder les combats."
          title="Ton positionnement"
        />
        <QuestionCard
          helperText="Tu peux sélectionner plusieurs réponses si ton positionnement varie selon le héros ou la situation."
          id="preferredFightPositions"
          question="Où préfères-tu te positionner pendant les combats d'équipe ?"
          sectionLabel="Ton positionnement"
        >
          <div className="grid gap-5">
            <div className="grid gap-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Quand préfères-tu entrer dans le combat ?
              </h3>
              <MultiChoiceCards
                columns="one"
                legend="Moment d'entrée dans le combat"
                options={fightTimingOptions}
                value={preferredFightPositions}
                onChange={setPreferredFightPositions}
              />
            </div>
            <div className="grid gap-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Comment préfères-tu aborder le combat ?
              </h3>
              <MultiChoiceCards
                columns="one"
                legend="Approche du combat"
                options={fightApproachOptions}
                value={preferredFightPositions}
                onChange={setPreferredFightPositions}
              />
            </div>
          </div>
        </QuestionCard>

        <SectionIntro
          description="Décris ce que tu aimes naturellement faire en partie."
          title="Ton style personnel"
        />
        <QuestionCard
          helperText="Choisis les styles qui décrivent le plus naturellement tes actions en jeu."
          id="preferredIndividualPlaystyles"
          question="Quelles manières de jouer correspondent le mieux à ce que tu aimes faire en partie ?"
          sectionLabel="Ton style personnel"
        >
          <MultiChoiceCards
            legend="Styles de jeu personnels"
            options={individualOptions}
            value={preferredIndividualPlaystyles}
            onChange={setPreferredIndividualPlaystyles}
          />
        </QuestionCard>

        <SectionIntro
          description="Ces réponses aident à aligner les drafts et le plan collectif."
          title="Tes préférences collectives"
        />
        <QuestionCard
          helperText="Ces réponses permettront d'aligner les drafts et la manière de jouer collectivement."
          id="preferredTeamPlaystyles"
          question="Quels types de plans de jeu aimerais-tu que l'équipe privilégie ?"
          sectionLabel="Tes préférences collectives"
        >
          <MultiChoiceCards
            legend="Plans de jeu collectifs"
            options={teamOptions}
            value={preferredTeamPlaystyles}
            onChange={setPreferredTeamPlaystyles}
          />
        </QuestionCard>

        {error ? (
          <p
            className="rounded-md border border-[rgb(239_120_109_/_0.5)] bg-[rgb(239_120_109_/_0.12)] p-3 text-sm text-[var(--danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[rgb(9_13_20_/_0.92)] px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
          <SaveStatus state={saveStatus} />
          <button className="min-h-11 rounded-md bg-[var(--accent)] px-5 py-2 font-semibold text-white transition hover:bg-[var(--accent-hover)]">
            Enregistrer
          </button>
        </div>
      </form>
    </section>
  );
}

function SectionIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="pt-2">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-hover)]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}
