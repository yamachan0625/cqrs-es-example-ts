import dotenv from 'dotenv';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GroupChatCommandProcessor } from '../../command/processor/GroupChatCommandProcessor';
import { InMemoryGroupChatRepository } from '../../command/infrastructure/repository/InMemoryGroupChatRepository';
import { resolvers, GraphQLContext } from '../../command/infrastructure/graphql/resolvers';

// .envファイルから環境変数を読み込み
dotenv.config();

/**
 * Write API Server
 * GraphQL Mutationを提供
 */
async function startServer() {
  const app = express();

  // GraphQL Schemaを読み込み
  const typeDefs = readFileSync(
    join(__dirname, '../../command/infrastructure/graphql/schema.graphql'),
    'utf-8'
  );

  // Repositoryとプロセッサーの初期化
  const repository = new InMemoryGroupChatRepository();
  const commandProcessor = new GroupChatCommandProcessor(repository);

  // Apollo Serverの設定
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: (): GraphQLContext => ({
      commandProcessor,
    }),
  });

  // Apollo Serverを起動
  await server.start();

  // ExpressにApollo Serverを統合
  server.applyMiddleware({ app: app as any, path: '/graphql' });

  const PORT = process.env.WRITE_API_PORT || 4000;

  app.listen(PORT, () => {
    console.log('🚀 Write API Server起動しました');
    console.log(`📍 GraphQL Endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`📊 Apollo Playground: http://localhost:${PORT}${server.graphqlPath}`);
    console.log('');
    console.log('サンプルMutation:');
    console.log(`
mutation {
  createGroupChat(input: {
    name: "テストグループ"
    executorId: "user-001"
  }) {
    groupChatId
    success
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
