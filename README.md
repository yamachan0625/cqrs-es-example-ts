# cqrs-es-example-ts

TypeScriptで実装したCQRS/Event Sourcingの実装例

## 概要

このプロジェクトは、CQRS（Command Query Responsibility Segregation）とEvent Sourcingパターンを使用したグループチャットアプリケーションのTypeScript実装です。

## 機能

- ✅ Write API Server (GraphQL Mutation)
- ✅ Read API Server (GraphQL Query)
- ✅ Read Model Updater (Lambda / Local)
- ✅ Event Sourcing (InMemory + DynamoDB実装)
- ✅ Event Store with DynamoDB
- ✅ Read Model with MySQL

## 技術スタック

- **言語**: TypeScript 5.3
- **フレームワーク**: Express 4.18
- **GraphQL**: Apollo Server 3.13
- **Event Store**: DynamoDB (AWS SDK v3) / InMemory
- **Read Model DB**: MySQL (未実装)
- **テスト**: Jest 29.7
- **ビルド**: tsc

## セットアップ

### 前提条件

- Node.js 18.x以上
- npm 9.x以上

### インストール

```bash
cd /Users/yamashita/cqrs-es-example-ts
npm install
```

### 環境変数の設定

1. `.env.example`をコピーして`.env`ファイルを作成:

```bash
cp .env.example .env
```

2. `.env`ファイルを編集して、実際の環境に合わせて値を設定:

```bash
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=group_chat

# API Server Ports
WRITE_API_PORT=4000
READ_API_PORT=4001

# AWS Configuration
AWS_REGION=ap-northeast-1
JOURNAL_TABLE_NAME=journal
SNAPSHOT_TABLE_NAME=snapshot
```

### ビルド

```bash
npm run build
```

## 開発環境の起動

### Write API Server

```bash
# TypeScriptを直接実行（開発モード）
npm run dev:write-api

# またはビルド済みのJSを実行
node dist/apps/write-api/server.js
```

サーバーが起動すると以下のURLでアクセス可能：

- GraphQL Endpoint: http://localhost:4000/graphql
- Apollo Playground: http://localhost:4000/graphql

### Read API Server

```bash
# TypeScriptを直接実行（開発モード）
npm run dev:read-api

# またはビルド済みのJSを実行
node dist/apps/read-api/server.js
```

サーバーが起動すると以下のURLでアクセス可能：

- GraphQL Endpoint: http://localhost:4001/graphql
- Apollo Playground: http://localhost:4001/graphql

### Read Model Updater (Local)

```bash
# DynamoDBからイベントを読み取りMySQLのRead Modelを更新
npm run dev:local-rmu
```

※ 事前にMySQLでRead Modelスキーマを作成する必要があります：

```bash
mysql -u root -p < src/query/schema/schema.sql
```

※ すべてのサーバーは`.env`ファイルから環境変数を自動的に読み込みます。

## GraphQL APIの使い方

### Query（読み取り）

#### グループチャット一覧を取得

```graphql
query {
  groupChats(limit: 10) {
    id
    name
    ownerId
    memberCount
    messageCount
    createdAt
  }
}
```

#### グループチャット詳細を取得

```graphql
query {
  groupChat(id: "グループチャットID") {
    id
    name
    ownerId
    members {
      id
      userAccountId
      role
      joinedAt
    }
    messages {
      id
      senderId
      text
      deleted
      createdAt
      updatedAt
    }
  }
}
```

#### ユーザーが参加しているグループチャット一覧を取得

```graphql
query {
  myGroupChats(userAccountId: "user-001") {
    id
    name
    memberCount
    messageCount
    createdAt
  }
}
```

### Mutation（書き込み）

### グループチャットを作成

```graphql
mutation {
  createGroupChat(input: { name: "開発チーム", executorId: "user-001" }) {
    groupChatId
    success
  }
}
```

### グループチャット名を変更

```graphql
mutation {
  renameGroupChat(
    input: { groupChatId: "グループチャットID", name: "新しい名前", executorId: "user-001" }
  ) {
    groupChatId
    success
  }
}
```

### メンバーを追加

```graphql
mutation {
  addMember(
    input: {
      groupChatId: "グループチャットID"
      userAccountId: "user-002"
      role: MEMBER
      executorId: "user-001"
    }
  ) {
    groupChatId
    success
  }
}
```

### メッセージを投稿

```graphql
mutation {
  postMessage(
    input: { groupChatId: "グループチャットID", text: "こんにちは！", executorId: "user-001" }
  ) {
    groupChatId
    messageId
    success
  }
}
```

### メッセージを編集

```graphql
mutation {
  editMessage(
    input: {
      groupChatId: "グループチャットID"
      messageId: "メッセージID"
      text: "編集後のメッセージ"
      executorId: "user-001"
    }
  ) {
    groupChatId
    messageId
    success
  }
}
```

### メッセージを削除

```graphql
mutation {
  deleteMessage(
    input: { groupChatId: "グループチャットID", messageId: "メッセージID", executorId: "user-001" }
  ) {
    groupChatId
    messageId
    success
  }
}
```

### メンバーを削除

```graphql
mutation {
  removeMember(
    input: { groupChatId: "グループチャットID", userAccountId: "user-002", executorId: "user-001" }
  ) {
    groupChatId
    success
  }
}
```

### グループチャットを削除

```graphql
mutation {
  deleteGroupChat(input: { groupChatId: "グループチャットID", executorId: "user-001" }) {
    groupChatId
    success
  }
}
```

## テスト

```bash
# 全テスト実行
npm test

# テストウォッチモード
npm run test:watch

# カバレッジ
npm run test:coverage
```

## ディレクトリ構造

```
src/
├── command/              # Write側（CQRS - Command）
│   ├── domain/
│   │   ├── models/      # Value Objects
│   │   ├── events/      # Domain Events
│   │   ├── errors/      # Custom Errors
│   │   └── GroupChat.ts # Aggregate
│   ├── processor/       # Command Processor
│   │   └── GroupChatCommandProcessor.ts
│   └── infrastructure/
│       ├── graphql/     # GraphQL Schema & Resolvers
│       │   ├── schema.graphql
│       │   └── resolvers.ts
│       └── repository/  # Repository実装
│           ├── GroupChatRepository.ts
│           └── InMemoryGroupChatRepository.ts
├── query/               # Read側（CQRS - Query）
│   └── infrastructure/
│       └── graphql/
├── rmu/                 # Read Model Updater
│   ├── handler.ts       # Lambda handler
│   ├── UpdateReadModel.ts
│   └── dao/
│       └── GroupChatDao.ts
├── shared/              # 共通ライブラリ
│   └── event-store-adapter/ # Event Store実装
│       ├── core/
│       ├── dynamodb/
│       └── types/
└── apps/                # アプリケーションエントリポイント
    ├── write-api/       # Write API Server
    │   └── server.ts
    ├── read-api/        # Read API Server
    └── local-rmu/       # Local RMU
```

## アーキテクチャ

```
         Client
           │
    ┌──────┴──────┐
    ▼             ▼
┌───────────┐ ┌───────────┐
│  Write    │ │   Read    │
│    API    │ │    API    │
│  (Mutation)  │  (Query)  │
└─────┬─────┘ └─────┬─────┘
      │             │
      ▼             ▼
┌─────────────┐ ┌─────────────┐
│  Command    │ │    DAO      │
│ Processor   │ │ (MySQL)     │
└─────┬───────┘ └─────▲───────┘
      │               │
      ▼               │
┌─────────────┐       │
│ Aggregate   │       │
│ (GroupChat) │       │
└─────┬───────┘       │
      │               │
      ▼               │
┌─────────────┐       │
│ EventStore  │       │
│ (DynamoDB)  │       │
└─────┬───────┘       │
      │               │
      │ DynamoDB      │
      │  Streams      │
      ▼               │
┌─────────────────────┴─┐
│  Read Model Updater   │
│     (Lambda)          │
└───────────────────────┘

Event Flow:
Write → EventStore → Streams → RMU → Read Model
                                        ↓
                                   Read API
```

## 実装状況

### ✅ 完了

- プロジェクト基盤構築
- Event Store Adapter基本型定義
- Value Objects (10クラス)
- Domain Events (8イベント + reconstruct対応)
- GroupChat Aggregate (480行)
- Command Processor (340行)
- GraphQL Mutation Schema & Resolvers
- Write API Server (Express + Apollo)
- InMemory Repository
- DynamoDB EventStore (AWS SDK v3)
- EventSerializer (JSON変換)
- DynamoDB Repository
- Read Model スキーマ (MySQL)
- GroupChatDao (MySQL操作 + ユーザー参加チャット取得)
- EventHandler (8イベント対応)
- Read Model Updater (DynamoDB Streams)
- Lambda Handler (RMU)
- Local RMU
- GraphQL Query Schema & Resolvers
- Read API Server (Express + Apollo)

### 🚧 未実装

- Docker Compose
- テストコード
- AWS Lambda デプロイ (CDK/SAM)

## ライセンス

MIT
