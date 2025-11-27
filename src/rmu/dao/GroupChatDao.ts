import { Pool, RowDataPacket } from 'mysql2/promise';
import {
  GroupChatReadModel,
  GroupChatMemberReadModel,
  GroupChatMessageReadModel,
  GroupChatDetailReadModel,
} from '../../query/models/GroupChatReadModel';
import { Result, Ok, Err } from '../../shared/event-store-adapter/types/Result';

/**
 * GroupChatDao
 * Read ModelのMySQLアクセス層
 */
export class GroupChatDao {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * グループチャットを作成
   */
  async createGroupChat(
    id: string,
    name: string,
    ownerId: string
  ): Promise<Result<void, Error>> {
    try {
      await this.pool.execute(
        `INSERT INTO group_chats (id, name, owner_id, member_count, message_count, deleted)
         VALUES (?, ?, ?, 0, 0, false)`,
        [id, name, ownerId]
      );
      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * グループチャット名を更新
   */
  async updateGroupChatName(id: string, name: string): Promise<Result<void, Error>> {
    try {
      await this.pool.execute(`UPDATE group_chats SET name = ? WHERE id = ?`, [name, id]);
      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * グループチャットを削除（論理削除）
   */
  async deleteGroupChat(id: string): Promise<Result<void, Error>> {
    try {
      await this.pool.execute(`UPDATE group_chats SET deleted = true WHERE id = ?`, [id]);
      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * メンバーを追加
   */
  async addMember(
    memberId: string,
    groupChatId: string,
    userAccountId: string,
    role: 'ADMIN' | 'MEMBER'
  ): Promise<Result<void, Error>> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // メンバーを追加
      await connection.execute(
        `INSERT INTO group_chat_members (id, group_chat_id, user_account_id, role)
         VALUES (?, ?, ?, ?)`,
        [memberId, groupChatId, userAccountId, role]
      );

      // メンバー数をインクリメント
      await connection.execute(
        `UPDATE group_chats SET member_count = member_count + 1 WHERE id = ?`,
        [groupChatId]
      );

      await connection.commit();
      return Ok(undefined);
    } catch (error) {
      await connection.rollback();
      return Err(error as Error);
    } finally {
      connection.release();
    }
  }

  /**
   * メンバーを削除
   */
  async removeMember(groupChatId: string, userAccountId: string): Promise<Result<void, Error>> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // メンバーを削除
      await connection.execute(
        `DELETE FROM group_chat_members WHERE group_chat_id = ? AND user_account_id = ?`,
        [groupChatId, userAccountId]
      );

      // メンバー数をデクリメント
      await connection.execute(
        `UPDATE group_chats SET member_count = member_count - 1 WHERE id = ?`,
        [groupChatId]
      );

      await connection.commit();
      return Ok(undefined);
    } catch (error) {
      await connection.rollback();
      return Err(error as Error);
    } finally {
      connection.release();
    }
  }

  /**
   * メッセージを追加
   */
  async addMessage(
    messageId: string,
    groupChatId: string,
    senderId: string,
    text: string,
    createdAt: Date,
    updatedAt: Date
  ): Promise<Result<void, Error>> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // メッセージを追加
      await connection.execute(
        `INSERT INTO group_chat_messages (id, group_chat_id, sender_id, text, deleted, created_at, updated_at)
         VALUES (?, ?, ?, ?, false, ?, ?)`,
        [messageId, groupChatId, senderId, text, createdAt, updatedAt]
      );

      // メッセージ数をインクリメント
      await connection.execute(
        `UPDATE group_chats SET message_count = message_count + 1 WHERE id = ?`,
        [groupChatId]
      );

      await connection.commit();
      return Ok(undefined);
    } catch (error) {
      await connection.rollback();
      return Err(error as Error);
    } finally {
      connection.release();
    }
  }

  /**
   * メッセージを更新
   */
  async updateMessage(
    messageId: string,
    text: string,
    updatedAt: Date
  ): Promise<Result<void, Error>> {
    try {
      await this.pool.execute(
        `UPDATE group_chat_messages SET text = ?, updated_at = ? WHERE id = ?`,
        [text, updatedAt, messageId]
      );
      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * メッセージを削除（論理削除）
   */
  async deleteMessage(messageId: string): Promise<Result<void, Error>> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // メッセージを削除済みにマーク
      await connection.execute(`UPDATE group_chat_messages SET deleted = true WHERE id = ?`, [
        messageId,
      ]);

      // メッセージ数をデクリメント
      await connection.execute(
        `UPDATE group_chats
         SET message_count = message_count - 1
         WHERE id = (SELECT group_chat_id FROM group_chat_messages WHERE id = ?)`,
        [messageId]
      );

      await connection.commit();
      return Ok(undefined);
    } catch (error) {
      await connection.rollback();
      return Err(error as Error);
    } finally {
      connection.release();
    }
  }

  /**
   * グループチャットを取得
   */
  async findGroupChatById(id: string): Promise<Result<GroupChatReadModel | null, Error>> {
    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT id, name, owner_id, member_count, message_count, deleted, created_at, updated_at
         FROM group_chats WHERE id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return Ok(null);
      }

      const row = rows[0];
      const groupChat: GroupChatReadModel = {
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        memberCount: row.member_count,
        messageCount: row.message_count,
        deleted: row.deleted === 1,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };

      return Ok(groupChat);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * グループチャットの詳細を取得（メンバーとメッセージを含む）
   */
  async findGroupChatDetailById(id: string): Promise<Result<GroupChatDetailReadModel | null, Error>> {
    try {
      // グループチャットを取得
      const groupChatResult = await this.findGroupChatById(id);
      if (!groupChatResult.ok || !groupChatResult.value) {
        return groupChatResult as Result<null, Error>;
      }

      // メンバーを取得
      const [memberRows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT id, group_chat_id, user_account_id, role, joined_at
         FROM group_chat_members WHERE group_chat_id = ?`,
        [id]
      );

      const members: GroupChatMemberReadModel[] = memberRows.map((row) => ({
        id: row.id,
        groupChatId: row.group_chat_id,
        userAccountId: row.user_account_id,
        role: row.role,
        joinedAt: new Date(row.joined_at),
      }));

      // メッセージを取得
      const [messageRows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT id, group_chat_id, sender_id, text, deleted, created_at, updated_at
         FROM group_chat_messages WHERE group_chat_id = ?
         ORDER BY created_at ASC`,
        [id]
      );

      const messages: GroupChatMessageReadModel[] = messageRows.map((row) => ({
        id: row.id,
        groupChatId: row.group_chat_id,
        senderId: row.sender_id,
        text: row.text,
        deleted: row.deleted === 1,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      const detail: GroupChatDetailReadModel = {
        ...groupChatResult.value,
        members,
        messages,
      };

      return Ok(detail);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * 全グループチャットを取得
   */
  async findAllGroupChats(limit = 100, offset = 0): Promise<Result<GroupChatReadModel[], Error>> {
    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT id, name, owner_id, member_count, message_count, deleted, created_at, updated_at
         FROM group_chats WHERE deleted = false
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const groupChats: GroupChatReadModel[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        memberCount: row.member_count,
        messageCount: row.message_count,
        deleted: row.deleted === 1,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return Ok(groupChats);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * ユーザーが参加しているグループチャット一覧を取得
   */
  async findGroupChatsByUserId(
    userAccountId: string,
    limit = 100,
    offset = 0
  ): Promise<Result<GroupChatReadModel[], Error>> {
    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT gc.id, gc.name, gc.owner_id, gc.member_count, gc.message_count, gc.deleted, gc.created_at, gc.updated_at
         FROM group_chats gc
         INNER JOIN group_chat_members m ON gc.id = m.group_chat_id
         WHERE m.user_account_id = ? AND gc.deleted = false
         ORDER BY gc.created_at DESC
         LIMIT ? OFFSET ?`,
        [userAccountId, limit, offset]
      );

      const groupChats: GroupChatReadModel[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        memberCount: row.member_count,
        messageCount: row.message_count,
        deleted: row.deleted === 1,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return Ok(groupChats);
    } catch (error) {
      return Err(error as Error);
    }
  }
}
