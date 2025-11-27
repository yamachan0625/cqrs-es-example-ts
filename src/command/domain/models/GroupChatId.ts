import { ulid } from 'ulid';
import { BaseAggregateId } from '../../../shared/event-store-adapter/types';

/**
 * GroupChatId - グループチャットのID
 */
export class GroupChatId extends BaseAggregateId {
  private constructor(value: string) {
    super(value);
  }

  /**
   * 新しいGroupChatIdを生成
   */
  static generate(): GroupChatId {
    return new GroupChatId(ulid());
  }

  /**
   * 既存の値からGroupChatIdを作成
   */
  static of(value: string): GroupChatId {
    if (!value || value.trim() === '') {
      throw new Error('GroupChatId value must not be empty');
    }
    return new GroupChatId(value);
  }

  getTypeName(): string {
    return 'GroupChatId';
  }

  toJSON(): object {
    return {
      type: this.getTypeName(),
      value: this.value,
    };
  }
}
