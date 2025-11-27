import { MessageId } from './MessageId';
import { UserAccountId } from './UserAccountId';

/**
 * Message - チャットメッセージ
 */
export class Message {
  private readonly id: MessageId;
  private readonly senderId: UserAccountId;
  private readonly text: string;
  private readonly createdAt: Date;
  private readonly updatedAt: Date;

  constructor(
    id: MessageId,
    senderId: UserAccountId,
    text: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    if (!text || text.trim() === '') {
      throw new Error('Message text must not be empty');
    }
    if (text.length > 1000) {
      throw new Error('Message text must be 1000 characters or less');
    }

    this.id = id;
    this.senderId = senderId;
    this.text = text.trim();
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? this.createdAt;
  }

  static create(
    id: MessageId,
    senderId: UserAccountId,
    text: string,
    createdAt?: Date,
    updatedAt?: Date
  ): Message {
    return new Message(id, senderId, text, createdAt, updatedAt);
  }

  static reconstruct(
    id: MessageId,
    senderId: UserAccountId,
    text: string,
    createdAt: number,
    updatedAt: number
  ): Message {
    return new Message(id, senderId, text, new Date(createdAt), new Date(updatedAt));
  }

  getId(): MessageId {
    return this.id;
  }

  getSenderId(): UserAccountId {
    return this.senderId;
  }

  getText(): string {
    return this.text;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * メッセージを編集した新しいインスタンスを返す
   */
  withText(newText: string): Message {
    return new Message(this.id, this.senderId, newText, this.createdAt, new Date());
  }

  equals(other: Message): boolean {
    return (
      this.id.equals(other.id) &&
      this.senderId.equals(other.senderId) &&
      this.text === other.text &&
      this.createdAt.getTime() === other.createdAt.getTime() &&
      this.updatedAt.getTime() === other.updatedAt.getTime()
    );
  }

  toJSON(): object {
    return {
      id: this.id.toJSON(),
      senderId: this.senderId.toJSON(),
      text: this.text,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
