/**
 * AggregateIdインターフェース
 * すべてのAggregateのIDが実装すべきインターフェース
 */
export interface AggregateId {
  /**
   * ID値を取得
   */
  getValue(): string;

  /**
   * 型名を取得
   */
  getTypeName(): string;

  /**
   * 等価性チェック
   */
  equals(other: AggregateId): boolean;

  /**
   * 文字列表現
   */
  toString(): string;

  /**
   * JSON表現
   */
  toJSON(): object;
}

/**
 * AggregateIdの基底抽象クラス
 */
export abstract class BaseAggregateId implements AggregateId {
  constructor(protected readonly value: string) {}

  getValue(): string {
    return this.value;
  }

  abstract getTypeName(): string;

  equals(other: AggregateId): boolean {
    return this.getTypeName() === other.getTypeName() && this.value === other.getValue();
  }

  toString(): string {
    return `${this.getTypeName()}(${this.value})`;
  }

  toJSON(): object {
    return {
      type: this.getTypeName(),
      value: this.value,
    };
  }
}
