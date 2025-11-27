import { AggregateId } from './AggregateId';
import { Event } from './Event';

/**
 * Aggregateインターフェース
 * すべてのAggregateが実装すべきインターフェース
 */
export interface Aggregate {
  /**
   * AggregateのIDを取得
   */
  getId(): AggregateId;

  /**
   * シーケンス番号を取得
   */
  getSeqNr(): number;

  /**
   * バージョンを取得
   */
  getVersion(): number;

  /**
   * 削除済みかどうか
   */
  isDeleted(): boolean;

  /**
   * バージョンを設定した新しいAggregateを返す
   */
  withVersion(version: number): Aggregate;

  /**
   * イベントを適用して新しいAggregateを返す
   */
  applyEvent(event: Event): Aggregate;

  /**
   * JSON表現に変換
   */
  toJSON(): object;
}

/**
 * Aggregate基底抽象クラス
 */
export abstract class BaseAggregate implements Aggregate {
  protected readonly id: AggregateId;
  protected readonly seqNr: number;
  protected readonly version: number;
  protected readonly deleted: boolean;

  constructor(id: AggregateId, seqNr: number, version: number, deleted: boolean = false) {
    this.id = id;
    this.seqNr = seqNr;
    this.version = version;
    this.deleted = deleted;
  }

  getId(): AggregateId {
    return this.id;
  }

  getSeqNr(): number {
    return this.seqNr;
  }

  getVersion(): number {
    return this.version;
  }

  isDeleted(): boolean {
    return this.deleted;
  }

  abstract withVersion(version: number): Aggregate;

  abstract applyEvent(event: Event): Aggregate;

  toJSON(): object {
    return {
      id: this.id.toJSON(),
      seqNr: this.seqNr,
      version: this.version,
      deleted: this.deleted,
    };
  }
}

/**
 * イベントのリストからAggregateを再構築
 */
export function replayEvents<T extends Aggregate>(
  events: Event[],
  snapshot: T
): T {
  let result = snapshot;
  for (const event of events) {
    result = result.applyEvent(event) as T;
  }
  return result;
}
