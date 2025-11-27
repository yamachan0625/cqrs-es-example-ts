import { Result, Ok, Err } from '../../shared/event-store-adapter/types';
import { GroupChat } from '../domain/GroupChat';
import { GroupChatEvent } from '../domain/events';
import { GroupChatId } from '../domain/models/GroupChatId';
import { GroupChatName } from '../domain/models/GroupChatName';
import { UserAccountId } from '../domain/models/UserAccountId';
import { MemberId } from '../domain/models/MemberId';
import { MessageId } from '../domain/models/MessageId';
import { Message } from '../domain/models/Message';
import { MemberRole } from '../domain/models/MemberRole';
import { GroupChatRepository } from '../infrastructure/repository/GroupChatRepository';

/**
 * Command Processorのエラー基底クラス
 */
export class CommandProcessError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'CommandProcessError';
  }
}

/**
 * NotFoundError - Aggregateが見つからない
 */
export class NotFoundError extends CommandProcessError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * RepositoryError - Repository層でのエラー
 */
export class RepositoryError extends CommandProcessError {
  constructor(message: string, cause: Error) {
    super(message, cause);
    this.name = 'RepositoryError';
  }
}

/**
 * DomainLogicError - ドメインロジック実行時のエラー
 */
export class DomainLogicError extends CommandProcessError {
  constructor(message: string, cause: Error) {
    super(message, cause);
    this.name = 'DomainLogicError';
  }
}

/**
 * GroupChatCommandProcessor
 * グループチャットのコマンドを処理
 */
export class GroupChatCommandProcessor {
  constructor(private readonly repository: GroupChatRepository) {}

  /**
   * グループチャットを作成
   */
  async createGroupChat(
    name: GroupChatName,
    executorId: UserAccountId
  ): Promise<Result<GroupChatEvent, CommandProcessError>> {
    const { groupChat, event } = GroupChat.create(name, executorId);

    const storeResult = await this.repository.store(event, groupChat);
    if (!storeResult.ok) {
      return Err(
        new RepositoryError('グループチャットの保存に失敗しました', storeResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    return Ok(event) as Result<GroupChatEvent, CommandProcessError>;
  }

  /**
   * グループチャットを削除
   */
  async deleteGroupChat(
    groupChatId: GroupChatId,
    executorId: UserAccountId
  ): Promise<Result<GroupChatEvent, CommandProcessError>> {
    // Aggregateを取得
    const findResult = await this.repository.findById(groupChatId);
    if (!findResult.ok) {
      return Err(new RepositoryError('グループチャットの取得に失敗しました', findResult.error));
    }

    const groupChat = findResult.value;
    if (!groupChat) {
      return Err(new NotFoundError('グループチャットが見つかりません'));
    }

    // ドメインロジック実行
    const deleteResult = groupChat.delete(executorId);
    if (!deleteResult.ok) {
      return Err(
        new DomainLogicError('グループチャットの削除に失敗しました', deleteResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    // 保存
    const { groupChat: newGroupChat, event } = deleteResult.value;
    const storeResult = await this.repository.store(event, newGroupChat);
    if (!storeResult.ok) {
      return Err(
        new RepositoryError('グループチャットの保存に失敗しました', storeResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    return Ok(event) as Result<GroupChatEvent, CommandProcessError>;
  }

  /**
   * グループチャット名を変更
   */
  async renameGroupChat(
    groupChatId: GroupChatId,
    name: GroupChatName,
    executorId: UserAccountId
  ): Promise<Result<GroupChatEvent, CommandProcessError>> {
    const findResult = await this.repository.findById(groupChatId);
    if (!findResult.ok) {
      return Err(new RepositoryError('グループチャットの取得に失敗しました', findResult.error));
    }

    const groupChat = findResult.value;
    if (!groupChat) {
      return Err(new NotFoundError('グループチャットが見つかりません'));
    }

    const renameResult = groupChat.rename(name, executorId);
    if (!renameResult.ok) {
      return Err(
        new DomainLogicError('名前の変更に失敗しました', renameResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    const { groupChat: newGroupChat, event } = renameResult.value;
    const storeResult = await this.repository.store(event, newGroupChat);
    if (!storeResult.ok) {
      return Err(
        new RepositoryError('グループチャットの保存に失敗しました', storeResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    return Ok(event) as Result<GroupChatEvent, CommandProcessError>;
  }

  /**
   * メンバーを追加
   */
  async addMember(
    groupChatId: GroupChatId,
    userAccountId: UserAccountId,
    role: MemberRole,
    executorId: UserAccountId
  ): Promise<Result<GroupChatEvent, CommandProcessError>> {
    const findResult = await this.repository.findById(groupChatId);
    if (!findResult.ok) {
      return Err(new RepositoryError('グループチャットの取得に失敗しました', findResult.error));
    }

    const groupChat = findResult.value;
    if (!groupChat) {
      return Err(new NotFoundError('グループチャットが見つかりません'));
    }

    const memberId = MemberId.generate();
    const addResult = groupChat.addMember(memberId, userAccountId, role, executorId);
    if (!addResult.ok) {
      return Err(
        new DomainLogicError('メンバーの追加に失敗しました', addResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    const { groupChat: newGroupChat, event } = addResult.value;
    const storeResult = await this.repository.store(event, newGroupChat);
    if (!storeResult.ok) {
      return Err(
        new RepositoryError('グループチャットの保存に失敗しました', storeResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    return Ok(event) as Result<GroupChatEvent, CommandProcessError>;
  }

  /**
   * メンバーを削除
   */
  async removeMember(
    groupChatId: GroupChatId,
    userAccountId: UserAccountId,
    executorId: UserAccountId
  ): Promise<Result<GroupChatEvent, CommandProcessError>> {
    const findResult = await this.repository.findById(groupChatId);
    if (!findResult.ok) {
      return Err(new RepositoryError('グループチャットの取得に失敗しました', findResult.error));
    }

    const groupChat = findResult.value;
    if (!groupChat) {
      return Err(new NotFoundError('グループチャットが見つかりません'));
    }

    const removeResult = groupChat.removeMemberByUserAccountId(userAccountId, executorId);
    if (!removeResult.ok) {
      return Err(
        new DomainLogicError('メンバーの削除に失敗しました', removeResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    const { groupChat: newGroupChat, event } = removeResult.value;
    const storeResult = await this.repository.store(event, newGroupChat);
    if (!storeResult.ok) {
      return Err(
        new RepositoryError('グループチャットの保存に失敗しました', storeResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    return Ok(event) as Result<GroupChatEvent, CommandProcessError>;
  }

  /**
   * メッセージを投稿
   */
  async postMessage(
    groupChatId: GroupChatId,
    message: Message,
    executorId: UserAccountId
  ): Promise<Result<GroupChatEvent, CommandProcessError>> {
    const findResult = await this.repository.findById(groupChatId);
    if (!findResult.ok) {
      return Err(new RepositoryError('グループチャットの取得に失敗しました', findResult.error));
    }

    const groupChat = findResult.value;
    if (!groupChat) {
      return Err(new NotFoundError('グループチャットが見つかりません'));
    }

    const postResult = groupChat.postMessage(message, executorId);
    if (!postResult.ok) {
      return Err(
        new DomainLogicError('メッセージの投稿に失敗しました', postResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    const { groupChat: newGroupChat, event } = postResult.value;
    const storeResult = await this.repository.store(event, newGroupChat);
    if (!storeResult.ok) {
      return Err(
        new RepositoryError('グループチャットの保存に失敗しました', storeResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    return Ok(event) as Result<GroupChatEvent, CommandProcessError>;
  }

  /**
   * メッセージを編集
   */
  async editMessage(
    groupChatId: GroupChatId,
    message: Message,
    executorId: UserAccountId
  ): Promise<Result<GroupChatEvent, CommandProcessError>> {
    const findResult = await this.repository.findById(groupChatId);
    if (!findResult.ok) {
      return Err(new RepositoryError('グループチャットの取得に失敗しました', findResult.error));
    }

    const groupChat = findResult.value;
    if (!groupChat) {
      return Err(new NotFoundError('グループチャットが見つかりません'));
    }

    const editResult = groupChat.editMessage(message, executorId);
    if (!editResult.ok) {
      return Err(
        new DomainLogicError('メッセージの編集に失敗しました', editResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    const { groupChat: newGroupChat, event } = editResult.value;
    const storeResult = await this.repository.store(event, newGroupChat);
    if (!storeResult.ok) {
      return Err(
        new RepositoryError('グループチャットの保存に失敗しました', storeResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    return Ok(event) as Result<GroupChatEvent, CommandProcessError>;
  }

  /**
   * メッセージを削除
   */
  async deleteMessage(
    groupChatId: GroupChatId,
    messageId: MessageId,
    executorId: UserAccountId
  ): Promise<Result<GroupChatEvent, CommandProcessError>> {
    const findResult = await this.repository.findById(groupChatId);
    if (!findResult.ok) {
      return Err(new RepositoryError('グループチャットの取得に失敗しました', findResult.error));
    }

    const groupChat = findResult.value;
    if (!groupChat) {
      return Err(new NotFoundError('グループチャットが見つかりません'));
    }

    const deleteResult = groupChat.deleteMessage(messageId, executorId);
    if (!deleteResult.ok) {
      return Err(
        new DomainLogicError('メッセージの削除に失敗しました', deleteResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    const { groupChat: newGroupChat, event } = deleteResult.value;
    const storeResult = await this.repository.store(event, newGroupChat);
    if (!storeResult.ok) {
      return Err(
        new RepositoryError('グループチャットの保存に失敗しました', storeResult.error)
      ) as Result<GroupChatEvent, CommandProcessError>;
    }

    return Ok(event) as Result<GroupChatEvent, CommandProcessError>;
  }
}
