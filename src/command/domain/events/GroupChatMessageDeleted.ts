import { GroupChatEvent, generateEventId } from './GroupChatEvent';
import { GroupChatId } from '../models/GroupChatId';
import { MessageId } from '../models/MessageId';
import { UserAccountId } from '../models/UserAccountId';

/**
 * GroupChatMessageDeleted - メッセージ削除イベント
 */
export class GroupChatMessageDeleted extends GroupChatEvent {
  private readonly messageId: MessageId;

  constructor(
    id: string,
    aggregateId: GroupChatId,
    messageId: MessageId,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt?: number
  ) {
    super(id, aggregateId, seqNr, executorId, occurredAt);
    this.messageId = messageId;
  }

  static create(
    aggregateId: GroupChatId,
    messageId: MessageId,
    seqNr: number,
    executorId: UserAccountId
  ): GroupChatMessageDeleted {
    return new GroupChatMessageDeleted(
      generateEventId(),
      aggregateId,
      messageId,
      seqNr,
      executorId
    );
  }

  static reconstruct(
    id: string,
    aggregateId: GroupChatId,
    messageId: MessageId,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt: number
  ): GroupChatMessageDeleted {
    return new GroupChatMessageDeleted(id, aggregateId, messageId, seqNr, executorId, occurredAt);
  }

  getMessageId(): MessageId {
    return this.messageId;
  }

  getTypeName(): string {
    return 'GroupChatMessageDeleted';
  }

  override toJSON(): object {
    return {
      ...super.toJSON(),
      messageId: this.messageId.toJSON(),
    };
  }
}
