import dotenv from 'dotenv';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { readFileSync } from 'fs';
import { join } from 'path';
import mysql from 'mysql2/promise';
import { GroupChatDao } from '../../rmu/dao/GroupChatDao';
import { resolvers, GraphQLContext } from '../../query/infrastructure/graphql/resolvers';

// .envファイルから環境変数を読み込み
dotenv.config();

/**
 * Read API Server
 * GraphQL Queryを提供
 */
async function startServer() {
  const app = express();

  // GraphQL Schemaを読み込み
  const typeDefs = readFileSync(
    join(__dirname, '../../query/infrastructure/graphql/schema.graphql'),
    'utf-8'
  );

  // MySQL接続プール作成
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'group_chat',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // DAOの初期化
  const dao = new GroupChatDao(pool);

  // Apollo Serverの設定
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: (): GraphQLContext => ({
      dao,
    }),
  });

  // Apollo Serverを起動
  await server.start();

  // ExpressにApollo Serverを統合
  server.applyMiddleware({ app: app as any, path: '/graphql' });

  const PORT = process.env.READ_API_PORT || 4001;

  app.listen(PORT, () => {
    console.log('🚀 Read API Server起動しました');
    console.log(`📍 GraphQL Endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`📊 Apollo Playground: http://localhost:${PORT}${server.graphqlPath}`);
    console.log('');
    console.log('サンプルQuery:');
    console.log(`
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
    `);
    console.log(`
query {
  groupChat(id: "グループチャットID") {
    id
    name
    members {
      userAccountId
      role
    }
    messages {
      senderId
      text
      createdAt
    }
  }
}
    `);
  });
}

// サーバー起動
startServer().catch((error) => {
  console.error('サーバー起動エラー:', error);
  process.exit(1);
});
