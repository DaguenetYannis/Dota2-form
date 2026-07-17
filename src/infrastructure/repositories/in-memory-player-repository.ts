import type { Player } from '@/domain/entities/player';
import type { PlayerRepository } from '@/domain/repositories/player-repository';

export class InMemoryPlayerRepository implements PlayerRepository {
  private readonly players = new Map<string, Player>();

  async save(player: Player): Promise<Player> {
    this.players.set(player.id, player);
    return player;
  }

  async findById(id: string): Promise<Player | null> {
    return this.players.get(id) ?? null;
  }

  async list(): Promise<Player[]> {
    return Array.from(this.players.values());
  }
}
