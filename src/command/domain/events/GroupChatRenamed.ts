import { GroupChatEvent, generateEventId } from './GroupChatEvent';
import { GroupChatId } from '../models/GroupChatId';
import { GroupChatName } from '../models/GroupChatName';
import { UserAccountId } from '../models/UserAccountId';

/**
 * GroupChatRenamed - グループチャット名変更イベント
 */
export class GroupChatRenamed extends GroupChatEvent {
  private readonly name: GroupChatName;

  constructor(
    id: string,
    aggregateId: GroupChatId,
    name: GroupChatName,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt?: number
  ) {
    super(id, aggregateId, seqNr, executorId, occurredAt);
    this.name = name;
  }

  static create(
    aggregateId: GroupChatId,
    name: GroupChatName,
    seqNr: number,
    executorId: UserAccountId
  ): GroupChatRenamed {
    return new GroupChatRenamed(generateEventId(), aggregateId, name, seqNr, executorId);
  }

  static reconstruct(
    id: string,
    aggregateId: GroupChatId,
    name: GroupChatName,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt: number
  ): GroupChatRenamed {
    return new GroupChatRenamed(id, aggregateId, name, seqNr, executorId, occurredAt);
  }

  getName(): GroupChatName {
    return this.name;
  }

  getTypeName(): string {
    return 'GroupChatRenamed';
  }

  override toJSON(): object {
    return {
      ...super.toJSON(),
      name: this.name.toJSON(),
    };
  }
}
