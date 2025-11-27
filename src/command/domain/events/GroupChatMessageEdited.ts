import { GroupChatEvent, generateEventId } from './GroupChatEvent';
import { GroupChatId } from '../models/GroupChatId';
import { Message } from '../models/Message';
import { UserAccountId } from '../models/UserAccountId';

/**
 * GroupChatMessageEdited - メッセージ編集イベント
 */
export class GroupChatMessageEdited extends GroupChatEvent {
  private readonly message: Message;

  constructor(
    id: string,
    aggregateId: GroupChatId,
    message: Message,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt?: number
  ) {
    super(id, aggregateId, seqNr, executorId, occurredAt);
    this.message = message;
  }

  static create(
    aggregateId: GroupChatId,
    message: Message,
    seqNr: number,
    executorId: UserAccountId
  ): GroupChatMessageEdited {
    return new GroupChatMessageEdited(
      generateEventId(),
      aggregateId,
      message,
      seqNr,
      executorId
    );
  }

  static reconstruct(
    id: string,
    aggregateId: GroupChatId,
    message: Message,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt: number
  ): GroupChatMessageEdited {
    return new GroupChatMessageEdited(id, aggregateId, message, seqNr, executorId, occurredAt);
  }

  getMessage(): Message {
    return this.message;
  }

  getTypeName(): string {
    return 'GroupChatMessageEdited';
  }

  override toJSON(): object {
    return {
      ...super.toJSON(),
      message: this.message.toJSON(),
    };
  }
}
