import { ulid } from 'ulid';
import { BaseAggregateId } from '../../../shared/event-store-adapter/types';

/**
 * UserAccountId - ユーザーアカウントのID
 */
export class UserAccountId extends BaseAggregateId {
  private constructor(value: string) {
    super(value);
  }

  /**
   * 新しいUserAccountIdを生成
   */
  static generate(): UserAccountId {
    return new UserAccountId(ulid());
  }

  /**
   * 既存の値からUserAccountIdを作成
   */
  static of(value: string): UserAccountId {
    if (!value || value.trim() === '') {
      throw new Error('UserAccountId value must not be empty');
    }
    return new UserAccountId(value);
  }

  getTypeName(): string {
    return 'UserAccountId';
  }

  toJSON(): object {
    return {
      type: this.getTypeName(),
      value: this.value,
    };
  }
}
