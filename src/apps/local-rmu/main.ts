import mysql from 'mysql2/promise';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { GroupChatDao } from '../../rmu/dao/GroupChatDao';
import { GroupChatEventHandler } from '../../rmu/handler/GroupChatEventHandler';
import { GroupChatEventSerializer } from '../../command/infrastructure/serializer/GroupChatEventSerializer';
import { JournalRow } from '../../shared/event-store-adapter/dynamodb/EventRecord';

/**
 * Local Read Model Updater
 * ローカル環境でDynamoDBのイベントを読み取りRead Modelを更新
 */
async function main() {
  console.log('[Local RMU] Starting...');

  // MySQL接続プール作成
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'group_chat',
    waitForConnections: true,
    connectionLimit: 10,
  });

  // DynamoDB Client作成
  const dynamodbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-northeast-1',
    endpoint: process.env.DYNAMODB_ENDPOINT, // LocalStack用
  });

  const tableName = process.env.JOURNAL_TABLE_NAME || 'journal';

  try {
    console.log(`[Local RMU] Scanning DynamoDB table: ${tableName}`);

    // DynamoDBからイベント履歴を全件取得
    const scanResult = await dynamodbClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('[Local RMU] No events found in DynamoDB');
      return;
    }

    console.log(`[Local RMU] Found ${scanResult.Items.length} events`);

    // イベントをseq_nrでソート
    const events = scanResult.Items.map((item) => unmarshall(item) as JournalRow).sort(
      (a, b) => a.seq_nr - b.seq_nr
    );

    // DAO、Serializer、EventHandlerを初期化
    const dao = new GroupChatDao(pool);
    const serializer = new GroupChatEventSerializer();
    const eventHandler = new GroupChatEventHandler(dao);

    // イベントを順番に処理
    let successCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        // イベントをデシリアライズ
        const deserializeResult = serializer.deserialize(event.event_type, event.payload);

        if (!deserializeResult.ok) {
          console.error(
            `[Local RMU] Failed to deserialize event ${event.event_id}:`,
            deserializeResult.error
          );
          errorCount++;
          continue;
        }

        // イベントハンドラーで処理
        const handleResult = await eventHandler.handleEvent(deserializeResult.value);

        if (!handleResult.ok) {
          console.error(
            `[Local RMU] Failed to handle event ${event.event_id}:`,
            handleResult.error
          );
          errorCount++;
          continue;
        }

        successCount++;
      } catch (error) {
        console.error(`[Local RMU] Error processing event ${event.event_id}:`, error);
        errorCount++;
      }
    }

    console.log(`[Local RMU] Processing completed`);
    console.log(`[Local RMU] Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('[Local RMU] Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('[Local RMU] Finished');
  }
}

// 実行
main().catch((error) => {
  console.error('[Local RMU] Unhandled error:', error);
  process.exit(1);
});
