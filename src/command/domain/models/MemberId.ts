import { ulid } from 'ulid';
import { BaseAggregateId } from '../../../shared/event-store-adapter/types';

/**
 * MemberId - メンバーのID
 */
export class MemberId extends BaseAggregateId {
  private constructor(value: string) {
    super(value);
  }

  /**
   * 新しいMemberIdを生成
   */
  static generate(): MemberId {
    return new MemberId(ulid());
  }

  /**
   * 既存の値からMemberIdを作成
   */
  static of(value: string): MemberId {
    if (!value || value.trim() === '') {
      throw new Error('MemberId value must not be empty');
    }
    return new MemberId(value);
  }

  getTypeName(): string {
    return 'MemberId';
  }

  toJSON(): object {
    return {
      type: this.getTypeName(),
      value: this.value,
    };
  }
}
