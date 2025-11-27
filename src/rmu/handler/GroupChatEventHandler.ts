import { Event } from '../../shared/event-store-adapter/types';
import { Result, Ok, Err } from '../../shared/event-store-adapter/types/Result';
import { GroupChatDao } from '../dao/GroupChatDao';
import {
  GroupChatCreated,
  GroupChatDeleted,
  GroupChatRenamed,
  GroupChatMemberAdded,
  GroupChatMemberRemoved,
  GroupChatMessagePosted,
  GroupChatMessageEdited,
  GroupChatMessageDeleted,
} from '../../command/domain/events';

/**
 * GroupChatEventHandler
 * ドメインイベントを受け取りRead Modelを更新
 */
export class GroupChatEventHandler {
  private readonly dao: GroupChatDao;

  constructor(dao: GroupChatDao) {
    this.dao = dao;
  }

  /**
   * イベントを処理してRead Modelを更新
   */
  async handleEvent(event: Event): Promise<Result<void, Error>> {
    try {
      if (event instanceof GroupChatCreated) {
        return await this.handleGroupChatCreated(event);
      } else if (event instanceof GroupChatDeleted) {
        return await this.handleGroupChatDeleted(event);
      } else if (event instanceof GroupChatRenamed) {
        return await this.handleGroupChatRenamed(event);
      } else if (event instanceof GroupChatMemberAdded) {
        return await this.handleGroupChatMemberAdded(event);
      } else if (event instanceof GroupChatMemberRemoved) {
        return await this.handleGroupChatMemberRemoved(event);
      } else if (event instanceof GroupChatMessagePosted) {
        return await this.handleGroupChatMessagePosted(event);
      } else if (event instanceof GroupChatMessageEdited) {
        return await this.handleGroupChatMessageEdited(event);
      } else if (event instanceof GroupChatMessageDeleted) {
        return await this.handleGroupChatMessageDeleted(event);
      }

      // 未知のイベントタイプ
      console.warn(`Unknown event type: ${event.getTypeName()}`);
      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  /**
   * GroupChatCreated イベントを処理
   */
  private async handleGroupChatCreated(event: GroupChatCreated): Promise<Result<void, Error>> {
    const groupChatId = event.getAggregateId().getValue();
    const name = event.getName().getValue();
    const ownerId = event.getExecutorId().getValue();

    // グループチャットを作成
    const createResult = await this.dao.createGroupChat(groupChatId, name, ownerId);
    if (!createResult.ok) {
      return createResult;
    }

    // 管理者メンバーを追加
    const members = event.getMembers().getMembers();
    for (const member of members) {
      const result = await this.dao.addMember(
        member.getId().getValue(),
        groupChatId,
        member.getUserAccountId().getValue(),
        member.getRole().toString() as 'ADMIN' | 'MEMBER'
      );
      if (!result.ok) {
        return result;
      }
    }

    console.log(`[EventHandler] GroupChatCreated: ${groupChatId}`);
    return Ok(undefined);
  }

  /**
   * GroupChatDeleted イベントを処理
   */
  private async handleGroupChatDeleted(event: GroupChatDeleted): Promise<Result<void, Error>> {
    const groupChatId = event.getAggregateId().getValue();
    const result = await this.dao.deleteGroupChat(groupChatId);

    if (result.ok) {
      console.log(`[EventHandler] GroupChatDeleted: ${groupChatId}`);
    }

    return result;
  }

  /**
   * GroupChatRenamed イベントを処理
   */
  private async handleGroupChatRenamed(event: GroupChatRenamed): Promise<Result<void, Error>> {
    const groupChatId = event.getAggregateId().getValue();
    const newName = event.getName().getValue();

    const result = await this.dao.updateGroupChatName(groupChatId, newName);

    if (result.ok) {
      console.log(`[EventHandler] GroupChatRenamed: ${groupChatId} -> ${newName}`);
    }

    return result;
  }

  /**
   * GroupChatMemberAdded イベントを処理
   */
  private async handleGroupChatMemberAdded(
    event: GroupChatMemberAdded
  ): Promise<Result<void, Error>> {
    const groupChatId = event.getAggregateId().getValue();
    const member = event.getMember();

    const result = await this.dao.addMember(
      member.getId().getValue(),
      groupChatId,
      member.getUserAccountId().getValue(),
      member.getRole().toString() as 'ADMIN' | 'MEMBER'
    );

    if (result.ok) {
      console.log(
        `[EventHandler] GroupChatMemberAdded: ${groupChatId} + ${member.getUserAccountId().getValue()}`
      );
    }

    return result;
  }

  /**
   * GroupChatMemberRemoved イベントを処理
   */
  private async handleGroupChatMemberRemoved(
    event: GroupChatMemberRemoved
  ): Promise<Result<void, Error>> {
    const groupChatId = event.getAggregateId().getValue();
    const userAccountId = event.getUserAccountId().getValue();

    const result = await this.dao.removeMember(groupChatId, userAccountId);

    if (result.ok) {
      console.log(`[EventHandler] GroupChatMemberRemoved: ${groupChatId} - ${userAccountId}`);
    }

    return result;
  }

  /**
   * GroupChatMessagePosted イベントを処理
   */
  private async handleGroupChatMessagePosted(
    event: GroupChatMessagePosted
  ): Promise<Result<void, Error>> {
    const groupChatId = event.getAggregateId().getValue();
    const message = event.getMessage();

    const result = await this.dao.addMessage(
      message.getId().getValue(),
      groupChatId,
      message.getSenderId().getValue(),
      message.getText(),
      message.getCreatedAt(),
      message.getUpdatedAt()
    );

    if (result.ok) {
      console.log(`[EventHandler] GroupChatMessagePosted: ${groupChatId} + ${message.getId().getValue()}`);
    }

    return result;
  }

  /**
   * GroupChatMessageEdited イベントを処理
   */
  private async handleGroupChatMessageEdited(
    event: GroupChatMessageEdited
  ): Promise<Result<void, Error>> {
    const message = event.getMessage();

    const result = await this.dao.updateMessage(
      message.getId().getValue(),
      message.getText(),
      message.getUpdatedAt()
    );

    if (result.ok) {
      console.log(`[EventHandler] GroupChatMessageEdited: ${message.getId().getValue()}`);
    }

    return result;
  }

  /**
   * GroupChatMessageDeleted イベントを処理
   */
  private async handleGroupChatMessageDeleted(
    event: GroupChatMessageDeleted
  ): Promise<Result<void, Error>> {
    const messageId = event.getMessageId().getValue();

    const result = await this.dao.deleteMessage(messageId);

    if (result.ok) {
      console.log(`[EventHandler] GroupChatMessageDeleted: ${messageId}`);
    }

    return result;
  }
}
