import type {
  QuestionnaireStepId,
  QuestionnaireStatus,
} from '@/domain/value-objects/vocabularies';
import {
  questionnaireStepIds,
  questionnaireStatusIds,
} from '@/domain/value-objects/vocabularies';
import type { PlayerQuestionnaire } from '@/domain/entities/questionnaire';

export class QuestionnaireStepService {
  private readonly steps = questionnaireStepIds;

  constructor(private questionnaire: PlayerQuestionnaire) {}

  get currentStep(): QuestionnaireStepId {
    return this.questionnaire.currentStep;
  }

  get status(): QuestionnaireStatus {
    return this.questionnaire.status;
  }

  get progress(): number {
    return this.steps.indexOf(this.currentStep) + 1;
  }

  get totalSteps(): number {
    return this.steps.length;
  }

  canAdvance(): boolean {
    return this.steps.indexOf(this.currentStep) < this.steps.length - 1;
  }

  canGoBack(): boolean {
    return this.steps.indexOf(this.currentStep) > 0;
  }

  advance(): void {
    const index = this.steps.indexOf(this.currentStep);
    if (index < 0 || index >= this.steps.length - 1) {
      return;
    }
    this.questionnaire.currentStep = this.steps[index + 1];
    this.questionnaire.updatedAt = new Date().toISOString();
  }

  back(): void {
    const index = this.steps.indexOf(this.currentStep);
    if (index <= 0) {
      return;
    }
    this.questionnaire.currentStep = this.steps[index - 1];
    this.questionnaire.updatedAt = new Date().toISOString();
  }

  markCompleted(): void {
    this.questionnaire.status = 'completed';
    this.questionnaire.updatedAt = new Date().toISOString();
  }

  markConfirmed(): void {
    this.questionnaire.status = 'confirmed';
    this.questionnaire.updatedAt = new Date().toISOString();
  }

  isStepValid(step: QuestionnaireStepId): boolean {
    switch (step) {
      case 'identity':
        return Boolean(
          this.questionnaire.identity.pseudonym &&
          this.questionnaire.identity.pseudonym.trim().length >= 2 &&
          this.questionnaire.identity.masteredPositions.length > 0 &&
          this.questionnaire.identity.primaryPosition &&
          this.questionnaire.identity.masteredPositions.includes(
            this.questionnaire.identity.primaryPosition,
          ),
        );
      case 'general_preferences':
        return (
          this.questionnaire.generalPreferences.responsibilities.length > 0 &&
          Boolean(
            this.questionnaire.generalPreferences.primaryResponsibility,
          ) &&
          this.questionnaire.generalPreferences.preferredGamePace !==
            undefined &&
          this.questionnaire.generalPreferences.sacrificeComfort !==
            undefined &&
          this.questionnaire.generalPreferences.preferredGameLength !==
            undefined &&
          this.questionnaire.generalPreferences.callTakingComfort !==
            undefined &&
          this.questionnaire.generalPreferences.preferredFightPositions.length >
            0
        );
      case 'team_playstyles':
        return this.questionnaire.teamPlaystyles.choices.length > 0;
      case 'individual_playstyles':
        return this.questionnaire.individualPlaystyles.choices.length > 0;
      case 'vision':
        return (
          this.questionnaire.vision.laneImportance !== undefined &&
          this.questionnaire.vision.weakLaneTolerance !== undefined &&
          this.questionnaire.vision.timingPreference !== undefined &&
          this.questionnaire.vision.smokeCoordination !== undefined &&
          this.questionnaire.vision.pickoffVersusTeamfight !== undefined &&
          this.questionnaire.vision.groupedVersusSplitMap !== undefined &&
          this.questionnaire.vision.initiativeVersusReaction !== undefined &&
          this.questionnaire.vision.draftFlexibilityPreference !== undefined
        );
      case 'summary':
        return (
          this.isStepValid('identity') &&
          this.isStepValid('general_preferences') &&
          this.isStepValid('team_playstyles') &&
          this.isStepValid('individual_playstyles') &&
          this.isStepValid('vision')
        );
      case 'hero_pool':
        return true;
      default:
        return false;
    }
  }

  isReadyForSummary(): boolean {
    return this.isStepValid('summary');
  }
}
