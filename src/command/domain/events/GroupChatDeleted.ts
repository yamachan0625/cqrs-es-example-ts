import { GroupChatEvent, generateEventId } from './GroupChatEvent';
import { GroupChatId } from '../models/GroupChatId';
import { UserAccountId } from '../models/UserAccountId';

/**
 * GroupChatDeleted - グループチャット削除イベント
 */
export class GroupChatDeleted extends GroupChatEvent {
  constructor(
    id: string,
    aggregateId: GroupChatId,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt?: number
  ) {
    super(id, aggregateId, seqNr, executorId, occurredAt);
  }

  static create(
    aggregateId: GroupChatId,
    seqNr: number,
    executorId: UserAccountId
  ): GroupChatDeleted {
    return new GroupChatDeleted(generateEventId(), aggregateId, seqNr, executorId);
  }

  static reconstruct(
    id: string,
    aggregateId: GroupChatId,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt: number
  ): GroupChatDeleted {
    return new GroupChatDeleted(id, aggregateId, seqNr, executorId, occurredAt);
  }

  getTypeName(): string {
    return 'GroupChatDeleted';
  }
}
