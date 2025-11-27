import { AggregateId, Event } from './types';
import { Result } from './types/Result';

/**
 * イベントストアのインターフェース
 * イベントの保存・読み込みを抽象化
 */
export interface EventStore {
  /**
   * イベントを保存
   * @param event 保存するイベント
   * @param version 期待されるバージョン（楽観的ロック）
   */
  storeEvent(event: Event, version: number): Promise<Result<void, Error>>;

  /**
   * 複数のイベントを一括保存
   * @param events 保存するイベントのリスト
   * @param version 期待されるバージョン（楽観的ロック）
   */
  storeEvents(events: Event[], version: number): Promise<Result<void, Error>>;

  /**
   * 集約IDに紐づくイベントを全て取得
   * @param aggregateId 集約ID
   * @param seqNrRange シーケンス番号の範囲（オプション）
   */
  getEventsByAggregateId(
    aggregateId: AggregateId,
    seqNrRange?: { start: number; end: number }
  ): Promise<Result<Event[], Error>>;

  /**
   * 最新のスナップショットを取得
   * @param aggregateId 集約ID
   */
  getLatestSnapshotById(aggregateId: AggregateId): Promise<Result<Event | null, Error>>;
}
