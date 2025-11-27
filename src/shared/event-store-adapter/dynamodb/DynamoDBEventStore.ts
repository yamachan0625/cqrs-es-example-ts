import {
  DynamoDBClient,
  QueryCommand,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { EventStore } from '../EventStore';
import { AggregateId, Event } from '../types';
import { Result, Ok, Err } from '../types/Result';
import { EventSerializer } from './EventSerializer';
import { JournalRow, DynamoDBKeyGenerator } from './EventRecord';

/**
 * DynamoDBEventStoreの設定
 */
export interface DynamoDBEventStoreConfig {
  client: DynamoDBClient;
  journalTableName: string;
  snapshotTableName: string;
  serializer: EventSerializer;
}

/**
 * DynamoDB Event Store実装
 */
export class DynamoDBEventStore implements EventStore {
  private readonly client: DynamoDBClient;
  private readonly journalTableName: string;
  private readonly snapshotTableName: string;
  private readonly serializer: EventSerializer;

  constructor(config: DynamoDBEventStoreConfig) {
    this.client = config.client;
    this.journalTableName = config.journalTableName;
    this.snapshotTableName = config.snapshotTableName;
    this.serializer = config.serializer;
  }

  async storeEvent(event: Event, version: number): Promise<Result<void, Error>> {
    return this.storeEvents([event], version);
  }

  async storeEvents(events: Event[], version: number): Promise<Result<void, Error>> {
    if (events.length === 0) {
      return Ok(undefined);
    }

    try {
      // トランザクションで全イベントを保存
      const transactItems = events.map((event) => {
        const serializeResult = this.serializer.serialize(event);
        if (!serializeResult.ok) {
          throw serializeResult.error;
        }

        const row: JournalRow = {
          pkey: DynamoDBKeyGenerator.journalPkey(event.getAggregateId().getValue()),
          skey: DynamoDBKeyGenerator.journalSkey(event.getSeqNr()),
          aid: event.getAggregateId().getValue(),
          seq_nr: event.getSeqNr(),
          event_id: event.getId(),
          event_type: event.getTypeName(),
          payload: serializeResult.value,
          occurred_at: event.getOccurredAt(),
          version: version,
        };

        return {
          Put: {
            TableName: this.journalTableName,
            Item: marshall(row),
            // 楽観的ロック: 同じseq_nrが既に存在する場合は失敗
            ConditionExpression: 'attribute_not_exists(pkey)',
          },
        };
      });

      await this.client.send(
        new TransactWriteItemsCommand({
          TransactItems: transactItems,
        })
      );

      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  async getEventsByAggregateId(
    aggregateId: AggregateId,
    seqNrRange?: { start: number; end: number }
  ): Promise<Result<Event[], Error>> {
    try {
      const pkey = DynamoDBKeyGenerator.journalPkey(aggregateId.getValue());

      let keyConditionExpression = 'pkey = :pkey';
      const expressionAttributeValues: Record<string, any> = {
        ':pkey': { S: pkey },
      };

      // シーケンス番号範囲が指定されている場合
      if (seqNrRange) {
        const startSkey = DynamoDBKeyGenerator.journalSkey(seqNrRange.start);
        const endSkey = DynamoDBKeyGenerator.journalSkey(seqNrRange.end);
        keyConditionExpression += ' AND skey BETWEEN :start AND :end';
        expressionAttributeValues[':start'] = { S: startSkey };
        expressionAttributeValues[':end'] = { S: endSkey };
      }

      const result = await this.client.send(
        new QueryCommand({
          TableName: this.journalTableName,
          KeyConditionExpression: keyConditionExpression,
          ExpressionAttributeValues: expressionAttributeValues,
          ScanIndexForward: true, // 昇順でソート
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return Ok([]);
      }

      const events: Event[] = [];
      for (const item of result.Items) {
        const row = unmarshall(item) as JournalRow;
        const deserializeResult = this.serializer.deserialize(row.event_type, row.payload);

        if (!deserializeResult.ok) {
          return Err(deserializeResult.error);
        }

        events.push(deserializeResult.value);
      }

      return Ok(events);
    } catch (error) {
      return Err(error as Error);
    }
  }

  async getLatestSnapshotById(aggregateId: AggregateId): Promise<Result<Event | null, Error>> {
    try {
      const pkey = DynamoDBKeyGenerator.snapshotPkey(aggregateId.getValue());
      const skey = DynamoDBKeyGenerator.snapshotSkey();

      const result = await this.client.send(
        new QueryCommand({
          TableName: this.snapshotTableName,
          KeyConditionExpression: 'pkey = :pkey AND skey = :skey',
          ExpressionAttributeValues: {
            ':pkey': { S: pkey },
            ':skey': { S: skey },
          },
          Limit: 1,
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return Ok(null);
      }

      const row = unmarshall(result.Items[0]);
      const deserializeResult = this.serializer.deserialize('Snapshot', row.payload as string);

      if (!deserializeResult.ok) {
        return Err(deserializeResult.error);
      }

      return Ok(deserializeResult.value);
    } catch (error) {
      return Err(error as Error);
    }
  }
}
