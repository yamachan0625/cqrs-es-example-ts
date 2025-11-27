import { AggregateId } from './AggregateId';

/**
 * Eventインターフェース
 * すべてのドメインイベントが実装すべきインターフェース
 */
export interface Event {
  /**
   * イベントID
   */
  getId(): string;

  /**
   * AggregateのID
   */
  getAggregateId(): AggregateId;

  /**
   * シーケンス番号
   */
  getSeqNr(): number;

  /**
   * イベントが発生した時刻（Unixタイムスタンプ ミリ秒）
   */
  getOccurredAt(): number;

  /**
   * イベントのタイプ名
   */
  getTypeName(): string;

  /**
   * JSON表現に変換
   */
  toJSON(): object;
}

/**
 * Event基底抽象クラス
 */
export abstract class BaseEvent implements Event {
  protected readonly id: string;
  protected readonly aggregateId: AggregateId;
  protected readonly seqNr: number;
  protected readonly occurredAt: number;

  constructor(id: string, aggregateId: AggregateId, seqNr: number, occurredAt?: number) {
    this.id = id;
    this.aggregateId = aggregateId;
    this.seqNr = seqNr;
    this.occurredAt = occurredAt ?? Date.now();
  }

  getId(): string {
    return this.id;
  }

  getAggregateId(): AggregateId {
    return this.aggregateId;
  }

  getSeqNr(): number {
    return this.seqNr;
  }

  getOccurredAt(): number {
    return this.occurredAt;
  }

  abstract getTypeName(): string;

  toJSON(): object {
    return {
      id: this.id,
      aggregateId: this.aggregateId.toJSON(),
      seqNr: this.seqNr,
      occurredAt: this.occurredAt,
      type_name: this.getTypeName(),
    };
  }
}
