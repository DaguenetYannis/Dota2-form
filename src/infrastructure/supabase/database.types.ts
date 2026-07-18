export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          team_id: string;
          pseudonym: string;
          normalized_pseudo: string;
          main_role: string;
          secondary_roles: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          team_id: string;
          pseudonym: string;
          normalized_pseudo: string;
          main_role: string;
          secondary_roles: string[];
          created_at: string;
          updated_at: string;
        };
        Update: Partial<Database['public']['Tables']['players']['Insert']>;
        Relationships: [];
      };
      player_preferences: {
        Row: {
          player_id: string;
          farm_priority: number;
          preferred_game_pace: number;
          cooldown_dependency_comfort: number;
          sacrifice_comfort: number;
          shot_calling_comfort: number;
          preferred_fight_positions: string[];
          preferred_individual_playstyles: string[];
          preferred_team_playstyles: string[];
        };
        Insert: {
          player_id: string;
          farm_priority: number;
          preferred_game_pace: number;
          cooldown_dependency_comfort: number;
          sacrifice_comfort: number;
          shot_calling_comfort: number;
          preferred_fight_positions: string[];
          preferred_individual_playstyles: string[];
          preferred_team_playstyles: string[];
        };
        Update: Partial<
          Database['public']['Tables']['player_preferences']['Insert']
        >;
        Relationships: [
          {
            foreignKeyName: 'player_preferences_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: true;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
      player_heroes: {
        Row: {
          id: string;
          player_id: string;
          hero_id: string;
          hero_order: number;
          roles: string[];
          pool_tier: string;
          comfort: number;
          confidence: number;
          recent_experience: number;
          blind_pick_confidence: number;
          flex_pick: boolean;
          preferred_draft_phase: string;
          preferred_playstyles: string[];
          required_allied_features: string[];
          personal_notes: string;
          fight_entry_start_minute: number | null;
          fight_entry_end_minute: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          player_id: string;
          hero_id: string;
          hero_order: number;
          roles: string[];
          pool_tier: string;
          comfort: number;
          confidence: number;
          recent_experience: number;
          blind_pick_confidence: number;
          flex_pick: boolean;
          preferred_draft_phase: string;
          preferred_playstyles: string[];
          required_allied_features: string[];
          personal_notes: string;
          fight_entry_start_minute: number | null;
          fight_entry_end_minute: number | null;
          created_at: string;
          updated_at: string;
        };
        Update: Partial<
          Database['public']['Tables']['player_heroes']['Insert']
        >;
        Relationships: [
          {
            foreignKeyName: 'player_heroes_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
      hero_categories: {
        Row: {
          id: string;
          owner_player_id: string;
          name: string;
          normalized_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          owner_player_id: string;
          name: string;
          normalized_name: string;
          created_at: string;
          updated_at: string;
        };
        Update: Partial<
          Database['public']['Tables']['hero_categories']['Insert']
        >;
        Relationships: [
          {
            foreignKeyName: 'hero_categories_owner_player_id_fkey';
            columns: ['owner_player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
      player_hero_categories: {
        Row: {
          player_id: string;
          hero_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          player_id: string;
          hero_id: string;
          category_id: string;
          created_at: string;
        };
        Update: Partial<
          Database['public']['Tables']['player_hero_categories']['Insert']
        >;
        Relationships: [
          {
            foreignKeyName: 'player_hero_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'hero_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'player_hero_categories_player_id_hero_id_fkey';
            columns: ['player_id', 'hero_id'];
            isOneToOne: false;
            referencedRelation: 'player_heroes';
            referencedColumns: ['player_id', 'hero_id'];
          },
        ];
      };
      player_hero_evaluations: {
        Row: {
          player_id: string;
          hero_id: string;
          metric_schema_version: number;
          metrics: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          player_id: string;
          hero_id: string;
          metric_schema_version: number;
          metrics: Json;
          created_at: string;
          updated_at: string;
        };
        Update: Partial<
          Database['public']['Tables']['player_hero_evaluations']['Insert']
        >;
        Relationships: [
          {
            foreignKeyName: 'player_hero_evaluations_player_id_hero_id_fkey';
            columns: ['player_id', 'hero_id'];
            isOneToOne: false;
            referencedRelation: 'player_heroes';
            referencedColumns: ['player_id', 'hero_id'];
          },
        ];
      };
      player_hero_matchups: {
        Row: {
          player_id: string;
          hero_id: string;
          opponent_hero_id: string;
          score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          player_id: string;
          hero_id: string;
          opponent_hero_id: string;
          score: number;
          created_at: string;
          updated_at: string;
        };
        Update: Partial<
          Database['public']['Tables']['player_hero_matchups']['Insert']
        >;
        Relationships: [
          {
            foreignKeyName: 'player_hero_matchups_player_id_hero_id_fkey';
            columns: ['player_id', 'hero_id'];
            isOneToOne: false;
            referencedRelation: 'player_heroes';
            referencedColumns: ['player_id', 'hero_id'];
          },
        ];
      };
      player_questionnaires: {
        Row: {
          player_id: string;
          status: string;
          current_step: string;
          identity: Json;
          general_preferences: Json;
          team_playstyles: Json;
          individual_playstyles: Json;
          vision: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          player_id: string;
          status: string;
          current_step: string;
          identity: Json;
          general_preferences: Json;
          team_playstyles: Json;
          individual_playstyles: Json;
          vision: Json;
          created_at: string;
          updated_at: string;
        };
        Update: Partial<
          Database['public']['Tables']['player_questionnaires']['Insert']
        >;
        Relationships: [
          {
            foreignKeyName: 'player_questionnaires_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: true;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
