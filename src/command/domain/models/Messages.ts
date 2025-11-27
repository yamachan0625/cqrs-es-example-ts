import { Message } from './Message';
import { MessageId } from './MessageId';
import { UserAccountId } from './UserAccountId';
import { Result, Ok, Err } from '../../../shared/event-store-adapter/types';

/**
 * Messages - メッセージのコレクション
 */
export class Messages {
  private readonly messages: ReadonlyArray<Message>;

  private constructor(messages: Message[]) {
    this.messages = Object.freeze([...messages]);
  }

  /**
   * 空のMessagesを作成
   */
  static empty(): Messages {
    return new Messages([]);
  }

  /**
   * 既存のメッセージリストからMessagesを作成
   */
  static of(messages: Message[]): Messages {
    return new Messages(messages);
  }

  /**
   * メッセージを追加
   */
  add(message: Message): Result<Messages, Error> {
    const exists = this.messages.some((m) => m.getId().equals(message.getId()));
    if (exists) {
      return Err(new Error('Message already exists'));
    }
    return Ok(new Messages([...this.messages, message]));
  }

  /**
   * メッセージを編集
   */
  edit(message: Message): Result<Messages, Error> {
    const index = this.messages.findIndex((m) => m.getId().equals(message.getId()));
    if (index === -1) {
      return Err(new Error('Message not found'));
    }

    const updated = [...this.messages];
    updated[index] = message;
    return Ok(new Messages(updated));
  }

  /**
   * メッセージを削除
   */
  remove(messageId: MessageId, executorId: UserAccountId): Result<Messages, Error> {
    const message = this.messages.find((m) => m.getId().equals(messageId));
    if (!message) {
      return Err(new Error('Message not found'));
    }

    // 送信者のみが削除可能
    if (!message.getSenderId().equals(executorId)) {
      return Err(new Error('Only sender can delete the message'));
    }

    const filtered = this.messages.filter((m) => !m.getId().equals(messageId));
    return Ok(new Messages(filtered));
  }

  /**
   * メッセージをIDで検索
   */
  findById(messageId: MessageId): Message | null {
    return this.messages.find((m) => m.getId().equals(messageId)) ?? null;
  }

  /**
   * メッセージ数を取得
   */
  size(): number {
    return this.messages.length;
  }

  /**
   * メッセージのリストを取得
   */
  getMessages(): ReadonlyArray<Message> {
    return this.messages;
  }

  equals(other: Messages): boolean {
    if (this.messages.length !== other.messages.length) {
      return false;
    }
    return this.messages.every((m, i) => m.equals(other.messages[i]));
  }

  toJSON(): object {
    return {
      messages: this.messages.map((m) => m.toJSON()),
    };
  }
}
