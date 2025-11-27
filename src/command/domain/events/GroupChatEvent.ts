import { ulid } from 'ulid';
import { BaseEvent } from '../../../shared/event-store-adapter/types';
import { GroupChatId } from '../models/GroupChatId';
import { UserAccountId } from '../models/UserAccountId';

/**
 * GroupChatEvent基底クラス
 */
export abstract class GroupChatEvent extends BaseEvent {
  protected readonly executorId: UserAccountId;

  constructor(
    id: string,
    aggregateId: GroupChatId,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt?: number
  ) {
    super(id, aggregateId, seqNr, occurredAt);
    this.executorId = executorId;
  }

  getExecutorId(): UserAccountId {
    return this.executorId;
  }

  override toJSON(): object {
    return {
      ...super.toJSON(),
      executorId: this.executorId.toJSON(),
    };
  }
}

/**
 * イベントIDを生成
 */
export function generateEventId(): string {
  return ulid();
}
