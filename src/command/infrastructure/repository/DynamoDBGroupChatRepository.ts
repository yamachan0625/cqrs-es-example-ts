import { GroupChatRepository } from './GroupChatRepository';
import { GroupChat } from '../../domain/GroupChat';
import { EventStore } from '../../../shared/event-store-adapter/EventStore';
import { AggregateId, Event } from '../../../shared/event-store-adapter/types';
import { Result, Ok, Err } from '../../../shared/event-store-adapter/types/Result';

/**
 * DynamoDBGroupChatRepository
 * DynamoDB EventStoreを使用したRepository実装
 */
export class DynamoDBGroupChatRepository implements GroupChatRepository {
  private readonly eventStore: EventStore;

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  async findById(id: AggregateId): Promise<Result<GroupChat | null, Error>> {
    try {
      // EventStoreからイベント履歴を取得
      const eventsResult = await this.eventStore.getEventsByAggregateId(id);

      if (!eventsResult.ok) {
        return Err(eventsResult.error);
      }

      const events = eventsResult.value;

      // イベントが存在しない場合はnullを返す
      if (events.length === 0) {
        return Ok(null);
      }

      // 最初のイベントから初期状態を作成し、残りのイベントを再生
      const firstEvent = events[0];
      const remainingEvents = events.slice(1);

      // 最初のイベントを適用して初期状態を作成
      let groupChat = GroupChat.createEmpty().applyEvent(firstEvent) as GroupChat;

      // 残りのイベントを再生
      if (remainingEvents.length > 0) {
        groupChat = GroupChat.replay(remainingEvents, groupChat);
      }

      return Ok(groupChat);
    } catch (error) {
      return Err(error as Error);
    }
  }

  async store(event: Event, aggregate: GroupChat): Promise<Result<void, Error>> {
    return this.storeEvents([event], aggregate);
  }

  async storeEvents(events: Event[], aggregate: GroupChat): Promise<Result<void, Error>> {
    try {
      // EventStoreにイベントを保存（楽観的ロック）
      const storeResult = await this.eventStore.storeEvents(events, aggregate.getVersion());

      if (!storeResult.ok) {
        return Err(storeResult.error);
      }

      console.log(
        `[DynamoDBRepository] Stored ${events.length} event(s) for: ${aggregate.getId().getValue()} (version: ${aggregate.getVersion()})`
      );

      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }
}
