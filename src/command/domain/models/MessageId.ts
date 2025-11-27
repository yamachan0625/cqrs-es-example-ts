import { ulid } from 'ulid';
import { BaseAggregateId } from '../../../shared/event-store-adapter/types';

/**
 * MessageId - メッセージのID
 */
export class MessageId extends BaseAggregateId {
  private constructor(value: string) {
    super(value);
  }

  /**
   * 新しいMessageIdを生成
   */
  static generate(): MessageId {
    return new MessageId(ulid());
  }

  /**
   * 既存の値からMessageIdを作成
   */
  static of(value: string): MessageId {
    if (!value || value.trim() === '') {
      throw new Error('MessageId value must not be empty');
    }
    return new MessageId(value);
  }

  getTypeName(): string {
    return 'MessageId';
  }

  toJSON(): object {
    return {
      type: this.getTypeName(),
      value: this.value,
    };
  }
}
