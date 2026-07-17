import type { Player } from '@/domain/entities/player';

export interface PlayerRepository {
  save(player: Player): Promise<Player>;
  findById(id: string): Promise<Player | null>;
  list(): Promise<Player[]>;
}
