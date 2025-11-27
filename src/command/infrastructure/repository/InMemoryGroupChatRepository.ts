import { GroupChatRepository } from './GroupChatRepository';
import { GroupChat } from '../../domain/GroupChat';
import { AggregateId, Event, Result, Ok, Err } from '../../../shared/event-store-adapter/types';

/**
 * InMemoryGroupChatRepository
 * テスト・開発用のインメモリRepository
 */
export class InMemoryGroupChatRepository implements GroupChatRepository {
  private aggregates: Map<string, GroupChat> = new Map();

  async findById(id: AggregateId): Promise<Result<GroupChat | null, Error>> {
    const groupChat = this.aggregates.get(id.getValue());
    return Ok(groupChat ?? null);
  }

  async store(_event: Event, aggregate: GroupChat): Promise<Result<void, Error>> {
    try {
      this.aggregates.set(aggregate.getId().getValue(), aggregate);
      console.log(
        `[InMemoryRepository] Stored: ${aggregate.getId().getValue()} (seqNr: ${aggregate.getSeqNr()})`
      );
      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  async storeEvents(events: Event[], aggregate: GroupChat): Promise<Result<void, Error>> {
    try {
      this.aggregates.set(aggregate.getId().getValue(), aggregate);
      console.log(
        `[InMemoryRepository] Stored ${events.length} events for: ${aggregate.getId().getValue()}`
      );
      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * デバッグ用: 全データをクリア
   */
  clear(): void {
    this.aggregates.clear();
  }

  /**
   * デバッグ用: 現在の件数を取得
   */
  size(): number {
    return this.aggregates.size;
  }
}
