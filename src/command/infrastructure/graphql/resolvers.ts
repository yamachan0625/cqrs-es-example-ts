import { GroupChatCommandProcessor } from '../../processor/GroupChatCommandProcessor';
import { GroupChatId } from '../../domain/models/GroupChatId';
import { GroupChatName } from '../../domain/models/GroupChatName';
import { UserAccountId } from '../../domain/models/UserAccountId';
import { MessageId } from '../../domain/models/MessageId';
import { Message } from '../../domain/models/Message';
import { MemberRole } from '../../domain/models/MemberRole';
import {
  GroupChatCreated,
  GroupChatMessagePosted,
  GroupChatMessageEdited,
  GroupChatMessageDeleted,
} from '../../domain/events';

/**
 * GraphQL Context
 */
export interface GraphQLContext {
  commandProcessor: GroupChatCommandProcessor;
}

/**
 * GraphQL Resolvers
 */
export const resolvers = {
  Query: {
    health: () => 'OK',
  },

  Mutation: {
    /**
     * グループチャットを作成
     */
    createGroupChat: async (
      _parent: unknown,
      args: { input: { name: string; executorId: string } },
      context: GraphQLContext
    ) => {
      const { name, executorId } = args.input;

      const groupChatName = GroupChatName.of(name);
      const executorAccountId = UserAccountId.of(executorId);

      const result = await context.commandProcessor.createGroupChat(
        groupChatName,
        executorAccountId
      );

      if (!result.ok) {
        throw new Error(`グループチャットの作成に失敗しました: ${result.error.message}`);
      }

      const event = result.value as GroupChatCreated;
      return {
        groupChatId: event.getAggregateId().getValue(),
        success: true,
      };
    },

    /**
     * グループチャットを削除
     */
    deleteGroupChat: async (
      _parent: unknown,
      args: { input: { groupChatId: string; executorId: string } },
      context: GraphQLContext
    ) => {
      const { groupChatId, executorId } = args.input;

      const id = GroupChatId.of(groupChatId);
      const executorAccountId = UserAccountId.of(executorId);

      const result = await context.commandProcessor.deleteGroupChat(id, executorAccountId);

      if (!result.ok) {
        throw new Error(`グループチャットの削除に失敗しました: ${result.error.message}`);
      }

      return {
        groupChatId: id.getValue(),
        success: true,
      };
    },

    /**
     * グループチャット名を変更
     */
    renameGroupChat: async (
      _parent: unknown,
      args: { input: { groupChatId: string; name: string; executorId: string } },
      context: GraphQLContext
    ) => {
      const { groupChatId, name, executorId } = args.input;

      const id = GroupChatId.of(groupChatId);
      const groupChatName = GroupChatName.of(name);
      const executorAccountId = UserAccountId.of(executorId);

      const result = await context.commandProcessor.renameGroupChat(
        id,
        groupChatName,
        executorAccountId
      );

      if (!result.ok) {
        throw new Error(`名前の変更に失敗しました: ${result.error.message}`);
      }

      return {
        groupChatId: id.getValue(),
        success: true,
      };
    },

    /**
     * メンバーを追加
     */
    addMember: async (
      _parent: unknown,
      args: {
        input: {
          groupChatId: string;
          userAccountId: string;
          role: 'ADMIN' | 'MEMBER';
          executorId: string;
        };
      },
      context: GraphQLContext
    ) => {
      const { groupChatId, userAccountId, role, executorId } = args.input;

      const id = GroupChatId.of(groupChatId);
      const userId = UserAccountId.of(userAccountId);
      const memberRole = MemberRole.fromString(role);
      const executorAccountId = UserAccountId.of(executorId);

      const result = await context.commandProcessor.addMember(
        id,
        userId,
        memberRole,
        executorAccountId
      );

      if (!result.ok) {
        throw new Error(`メンバーの追加に失敗しました: ${result.error.message}`);
      }

      return {
        groupChatId: id.getValue(),
        success: true,
      };
    },

    /**
     * メンバーを削除
     */
    removeMember: async (
      _parent: unknown,
      args: { input: { groupChatId: string; userAccountId: string; executorId: string } },
      context: GraphQLContext
    ) => {
      const { groupChatId, userAccountId, executorId } = args.input;

      const id = GroupChatId.of(groupChatId);
      const userId = UserAccountId.of(userAccountId);
      const executorAccountId = UserAccountId.of(executorId);

      const result = await context.commandProcessor.removeMember(
        id,
        userId,
        executorAccountId
      );

      if (!result.ok) {
        throw new Error(`メンバーの削除に失敗しました: ${result.error.message}`);
      }

      return {
        groupChatId: id.getValue(),
        success: true,
      };
    },

    /**
     * メッセージを投稿
     */
    postMessage: async (
      _parent: unknown,
      args: { input: { groupChatId: string; text: string; executorId: string } },
      context: GraphQLContext
    ) => {
      const { groupChatId, text, executorId } = args.input;

      const id = GroupChatId.of(groupChatId);
      const executorAccountId = UserAccountId.of(executorId);

      const messageId = MessageId.generate();
      const message = Message.create(messageId, executorAccountId, text);

      const result = await context.commandProcessor.postMessage(
        id,
        message,
        executorAccountId
      );

      if (!result.ok) {
        throw new Error(`メッセージの投稿に失敗しました: ${result.error.message}`);
      }

      const event = result.value as GroupChatMessagePosted;
      return {
        groupChatId: id.getValue(),
        messageId: event.getMessage().getId().getValue(),
        success: true,
      };
    },

    /**
     * メッセージを編集
     */
    editMessage: async (
      _parent: unknown,
      args: {
        input: { groupChatId: string; messageId: string; text: string; executorId: string };
      },
      context: GraphQLContext
    ) => {
      const { groupChatId, messageId, text, executorId } = args.input;

      const id = GroupChatId.of(groupChatId);
      const msgId = MessageId.of(messageId);
      const executorAccountId = UserAccountId.of(executorId);

      const message = Message.create(msgId, executorAccountId, text);

      const result = await context.commandProcessor.editMessage(
        id,
        message,
        executorAccountId
      );

      if (!result.ok) {
        throw new Error(`メッセージの編集に失敗しました: ${result.error.message}`);
      }

      const event = result.value as GroupChatMessageEdited;
      return {
        groupChatId: id.getValue(),
        messageId: event.getMessage().getId().getValue(),
        success: true,
      };
    },

    /**
     * メッセージを削除
     */
    deleteMessage: async (
      _parent: unknown,
      args: { input: { groupChatId: string; messageId: string; executorId: string } },
      context: GraphQLContext
    ) => {
      const { groupChatId, messageId, executorId } = args.input;

      const id = GroupChatId.of(groupChatId);
      const msgId = MessageId.of(messageId);
      const executorAccountId = UserAccountId.of(executorId);

      const result = await context.commandProcessor.deleteMessage(
        id,
        msgId,
        executorAccountId
      );

      if (!result.ok) {
        throw new Error(`メッセージの削除に失敗しました: ${result.error.message}`);
      }

      const event = result.value as GroupChatMessageDeleted;
      return {
        groupChatId: id.getValue(),
        messageId: event.getMessageId().getValue(),
        success: true,
      };
    },
  },
};
