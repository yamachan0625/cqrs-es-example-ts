import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { Pool } from 'mysql2/promise';
import { GroupChatDao } from './dao/GroupChatDao';
import { GroupChatEventHandler } from './handler/GroupChatEventHandler';
import { GroupChatEventSerializer } from '../command/infrastructure/serializer/GroupChatEventSerializer';
import { Result, Ok, Err } from '../shared/event-store-adapter/types/Result';
import { JournalRow } from '../shared/event-store-adapter/dynamodb/EventRecord';

/**
 * UpdateReadModel
 * DynamoDB StreamsからイベントをリードしてRead Modelを更新
 */
export class UpdateReadModel {
  private readonly pool: Pool;
  private readonly serializer: GroupChatEventSerializer;
  private readonly dao: GroupChatDao;
  private readonly eventHandler: GroupChatEventHandler;

  constructor(pool: Pool) {
    this.pool = pool;
    this.serializer = new GroupChatEventSerializer();
    this.dao = new GroupChatDao(pool);
    this.eventHandler = new GroupChatEventHandler(this.dao);
  }

  /**
   * DynamoDB Streamイベントを処理
   */
  async processStreamEvent(event: DynamoDBStreamEvent): Promise<Result<void, Error>> {
    try {
      console.log(`[UpdateReadModel] Processing ${event.Records.length} records`);

      for (const record of event.Records) {
        const result = await this.processRecord(record);
        if (!result.ok) {
          console.error(`[UpdateReadModel] Error processing record:`, result.error);
          return result;
        }
      }

      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * DynamoDBレコードを処理
   */
  private async processRecord(record: DynamoDBRecord): Promise<Result<void, Error>> {
    try {
      // INSERTイベントのみ処理（新しいイベントが追加された時）
      if (record.eventName !== 'INSERT') {
        return Ok(undefined);
      }

      if (!record.dynamodb?.NewImage) {
        return Ok(undefined);
      }

      // DynamoDBのレコードをJournalRowに変換
      const newImage = unmarshall(
        record.dynamodb.NewImage as Record<string, AttributeValue>
      ) as JournalRow;

      // イベントタイプとペイロードを取得
      const eventType = newImage.event_type;
      const payload = newImage.payload;

      console.log(`[UpdateReadModel] Processing event: ${eventType} (aid: ${newImage.aid})`);

      // イベントをデシリアライズ
      const deserializeResult = this.serializer.deserialize(eventType, payload);
      if (!deserializeResult.ok) {
        return Err(new Error(`Failed to deserialize event: ${deserializeResult.error.message}`));
      }

      const event = deserializeResult.value;

      // イベントハンドラーで処理
      const handleResult = await this.eventHandler.handleEvent(event);
      if (!handleResult.ok) {
        return Err(new Error(`Failed to handle event: ${handleResult.error.message}`));
      }

      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * リソースをクリーンアップ
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
