import { Event } from '../types';
import { Result, Ok, Err } from '../types/Result';

/**
 * イベントのペイロード型
 */
export interface EventPayload {
  eventId: string;
  aggregateId: string;
  seqNr: number;
  occurredAt: number;
  data: Record<string, any>;
}

/**
 * イベントシリアライザーのインターフェース
 */
export interface EventSerializer {
  /**
   * イベントをJSONにシリアライズ
   */
  serialize(event: Event): Result<string, Error>;

  /**
   * JSONからイベントをデシリアライズ
   */
  deserialize(eventType: string, json: string): Result<Event, Error>;
}

/**
 * デフォルトのイベントシリアライザー実装
 * イベントタイプに応じて適切なファクトリ関数を呼び出す
 */
export class DefaultEventSerializer implements EventSerializer {
  private eventFactories: Map<string, (payload: EventPayload) => Event>;

  constructor() {
    this.eventFactories = new Map();
  }

  /**
   * イベントタイプに対するファクトリ関数を登録
   */
  registerEventFactory(eventType: string, factory: (payload: EventPayload) => Event): void {
    this.eventFactories.set(eventType, factory);
  }

  serialize(event: Event): Result<string, Error> {
    try {
      const payload: EventPayload = {
        eventId: event.getId(),
        aggregateId: event.getAggregateId().getValue(),
        seqNr: event.getSeqNr(),
        occurredAt: event.getOccurredAt(),
        data: this.extractEventData(event),
      };

      return Ok(JSON.stringify(payload));
    } catch (error) {
      return Err(error as Error);
    }
  }

  deserialize(eventType: string, json: string): Result<Event, Error> {
    try {
      const payload = JSON.parse(json) as EventPayload;
      const factory = this.eventFactories.get(eventType);

      if (!factory) {
        return Err(new Error(`Unknown event type: ${eventType}`));
      }

      const event = factory(payload);
      return Ok(event);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * イベントから追加データを抽出
   * サブクラスでオーバーライド可能
   */
  protected extractEventData(_event: Event): Record<string, any> {
    // デフォルトでは空のオブジェクトを返す
    // 各イベントタイプに応じてオーバーライドする
    return {};
  }
}
