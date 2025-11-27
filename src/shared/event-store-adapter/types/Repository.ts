import { Aggregate } from './Aggregate';
import { AggregateId } from './AggregateId';
import { Event } from './Event';
import { Result } from './Result';

/**
 * Repositoryインターフェース
 * Aggregateの永続化・取得を担当
 */
export interface Repository<T extends Aggregate> {
  /**
   * IDでAggregateを検索
   * @param id AggregateのID
   * @returns Aggregateが見つかった場合はSome、見つからなかった場合はNone
   */
  findById(id: AggregateId): Promise<Result<T | null, Error>>;

  /**
   * Aggregateとイベントを保存
   * @param event 発生したイベント
   * @param aggregate 更新後のAggregate
   */
  store(event: Event, aggregate: T): Promise<Result<void, Error>>;

  /**
   * Aggregateとイベントのリストを保存
   * @param events 発生したイベントのリスト
   * @param aggregate 更新後のAggregate
   */
  storeEvents(events: Event[], aggregate: T): Promise<Result<void, Error>>;
}
