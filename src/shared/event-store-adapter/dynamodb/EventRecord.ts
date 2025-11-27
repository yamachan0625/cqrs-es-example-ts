/**
 * DynamoDB Journal テーブルのレコード構造
 */
export interface JournalRow {
  pkey: string; // aid-{aggregateId}
  skey: string; // {seqNr}
  aid: string; // aggregateId
  seq_nr: number; // シーケンス番号
  event_id: string; // イベントID
  event_type: string; // イベントタイプ名
  payload: string; // JSONシリアライズされたイベントデータ
  occurred_at: number; // イベント発生時刻（UnixTime）
  version: number; // バージョン番号
}

/**
 * DynamoDB Snapshot テーブルのレコード構造
 */
export interface SnapshotRow {
  pkey: string; // aid-{aggregateId}
  skey: string; // snapshot
  aid: string; // aggregateId
  seq_nr: number; // スナップショット時点のシーケンス番号
  version: number; // バージョン番号
  payload: string; // JSONシリアライズされた集約状態
  created_at: number; // スナップショット作成時刻
}

/**
 * DynamoDBのキーを生成
 */
export class DynamoDBKeyGenerator {
  static journalPkey(aggregateId: string): string {
    return `aid-${aggregateId}`;
  }

  static journalSkey(seqNr: number): string {
    return seqNr.toString().padStart(16, '0');
  }

  static snapshotPkey(aggregateId: string): string {
    return `aid-${aggregateId}`;
  }

  static snapshotSkey(): string {
    return 'snapshot';
  }
}
