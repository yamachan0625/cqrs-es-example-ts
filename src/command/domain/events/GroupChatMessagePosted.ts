import { GroupChatEvent, generateEventId } from './GroupChatEvent';
import { GroupChatId } from '../models/GroupChatId';
import { Message } from '../models/Message';
import { UserAccountId } from '../models/UserAccountId';

/**
 * GroupChatMessagePosted - メッセージ投稿イベント
 */
export class GroupChatMessagePosted extends GroupChatEvent {
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
  ): GroupChatMessagePosted {
    return new GroupChatMessagePosted(
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
  ): GroupChatMessagePosted {
    return new GroupChatMessagePosted(id, aggregateId, message, seqNr, executorId, occurredAt);
  }

  getMessage(): Message {
    return this.message;
  }

  getTypeName(): string {
    return 'GroupChatMessagePosted';
  }

  override toJSON(): object {
    return {
      ...super.toJSON(),
      message: this.message.toJSON(),
    };
  }
}
