import { DynamoDBStreamEvent, Context } from 'aws-lambda';
import mysql from 'mysql2/promise';
import { UpdateReadModel } from '../../rmu/UpdateReadModel';

/**
 * MySQLコネクションプールを作成
 * Lambda環境変数から設定を読み取る
 */
const createPool = () => {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'group_chat',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
};

// グローバルに保持してLambdaコンテナ再利用時に接続を維持
let pool: ReturnType<typeof createPool> | null = null;

/**
 * Lambda Handler
 * DynamoDB Streams トリガー
 */
export const handler = async (
  event: DynamoDBStreamEvent,
  context: Context
): Promise<{ statusCode: number; body: string }> => {
  console.log(`[Lambda] Received event with ${event.Records.length} records`);
  console.log(`[Lambda] Request ID: ${context.awsRequestId}`);

  try {
    // コネクションプールを作成（初回のみ）
    if (!pool) {
      console.log('[Lambda] Creating MySQL connection pool');
      pool = createPool();
    }

    // Read Model Updaterを実行
    const updater = new UpdateReadModel(pool);
    const result = await updater.processStreamEvent(event);

    if (!result.ok) {
      console.error('[Lambda] Error processing stream event:', result.error);
      throw result.error;
    }

    console.log('[Lambda] Successfully processed all records');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed DynamoDB Stream records',
        recordCount: event.Records.length,
      }),
    };
  } catch (error) {
    console.error('[Lambda] Fatal error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing DynamoDB Stream records',
        error: (error as Error).message,
      }),
    };
  }
};
