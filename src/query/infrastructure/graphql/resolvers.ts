import { GroupChatDao } from '../../../rmu/dao/GroupChatDao';

/**
 * GraphQL Context
 */
export interface GraphQLContext {
  dao: GroupChatDao;
}

/**
 * Read Model GraphQL Resolvers
 */
export const resolvers = {
  Query: {
    /**
     * ヘルスチェック
     */
    health: () => 'OK',

    /**
     * グループチャット一覧を取得
     */
    groupChats: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const limit = args.limit ?? 100;
      const offset = args.offset ?? 0;

      const result = await context.dao.findAllGroupChats(limit, offset);

      if (!result.ok) {
        throw new Error(`グループチャット一覧の取得に失敗しました: ${result.error.message}`);
      }

      return result.value.map((gc) => ({
        id: gc.id,
        name: gc.name,
        ownerId: gc.ownerId,
        memberCount: gc.memberCount,
        messageCount: gc.messageCount,
        deleted: gc.deleted,
        createdAt: gc.createdAt.toISOString(),
        updatedAt: gc.updatedAt.toISOString(),
        members: null, // 一覧取得時はnull
        messages: null, // 一覧取得時はnull
      }));
    },

    /**
     * グループチャットの詳細を取得
     */
    groupChat: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      const result = await context.dao.findGroupChatDetailById(args.id);

      if (!result.ok) {
        throw new Error(`グループチャット詳細の取得に失敗しました: ${result.error.message}`);
      }

      if (!result.value) {
        return null;
      }

      const detail = result.value;

      return {
        id: detail.id,
        name: detail.name,
        ownerId: detail.ownerId,
        memberCount: detail.memberCount,
        messageCount: detail.messageCount,
        deleted: detail.deleted,
        createdAt: detail.createdAt.toISOString(),
        updatedAt: detail.updatedAt.toISOString(),
        members: detail.members.map((m) => ({
          id: m.id,
          groupChatId: m.groupChatId,
          userAccountId: m.userAccountId,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
        })),
        messages: detail.messages.map((msg) => ({
          id: msg.id,
          groupChatId: msg.groupChatId,
          senderId: msg.senderId,
          text: msg.text,
          deleted: msg.deleted,
          createdAt: msg.createdAt.toISOString(),
          updatedAt: msg.updatedAt.toISOString(),
        })),
      };
    },

    /**
     * ユーザーが参加しているグループチャット一覧を取得
     */
    myGroupChats: async (
      _parent: unknown,
      args: { userAccountId: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const limit = args.limit ?? 100;
      const offset = args.offset ?? 0;

      const result = await context.dao.findGroupChatsByUserId(args.userAccountId, limit, offset);

      if (!result.ok) {
        throw new Error(
          `ユーザーのグループチャット一覧の取得に失敗しました: ${result.error.message}`
        );
      }

      return result.value.map((gc) => ({
        id: gc.id,
        name: gc.name,
        ownerId: gc.ownerId,
        memberCount: gc.memberCount,
        messageCount: gc.messageCount,
        deleted: gc.deleted,
        createdAt: gc.createdAt.toISOString(),
        updatedAt: gc.updatedAt.toISOString(),
        members: null, // 一覧取得時はnull
        messages: null, // 一覧取得時はnull
      }));
    },
  },
};
