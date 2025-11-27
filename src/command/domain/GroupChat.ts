import { BaseAggregate, Event } from '../../shared/event-store-adapter/types';
import { Result, Ok, Err } from '../../shared/event-store-adapter/types';
import { GroupChatId } from './models/GroupChatId';
import { GroupChatName } from './models/GroupChatName';
import { Members } from './models/Members';
import { Messages } from './models/Messages';
import { UserAccountId } from './models/UserAccountId';
import { MemberId } from './models/MemberId';
import { MessageId } from './models/MessageId';
import { Message } from './models/Message';
import { MemberRole } from './models/MemberRole';
import {
  AlreadyDeletedError,
  NotMemberError,
  NotAdministratorError,
  AlreadyExistsNameError,
  MismatchedUserAccountError,
} from './errors';
import {
  GroupChatEvent,
  GroupChatCreated,
  GroupChatDeleted,
  GroupChatRenamed,
  GroupChatMemberAdded,
  GroupChatMemberRemoved,
  GroupChatMessagePosted,
  GroupChatMessageEdited,
  GroupChatMessageDeleted,
} from './events';

/**
 * GroupChatとEventのペア
 */
export type GroupChatWithEventPair = {
  groupChat: GroupChat;
  event: GroupChatEvent;
};

/**
 * GroupChat Aggregate
 * グループチャットのドメインロジックを管理
 */
export class GroupChat extends BaseAggregate {
  private readonly groupChatId: GroupChatId;
  private readonly name: GroupChatName;
  private readonly members: Members;
  private readonly messages: Messages;

  private constructor(
    id: GroupChatId,
    name: GroupChatName,
    members: Members,
    messages: Messages,
    seqNr: number,
    version: number,
    deleted: boolean,
  ) {
    super(id, seqNr, version, deleted);
    this.groupChatId = id;
    this.name = name;
    this.members = members;
    this.messages = messages;
  }

  /**
   * 新しいGroupChatを作成
   */
  static create(name: GroupChatName, executorId: UserAccountId): GroupChatWithEventPair {
    const id = GroupChatId.generate();
    const members = Members.create(executorId);
    const seqNr = 1;
    const version = 1;

    const event = GroupChatCreated.create(id, name, members, seqNr, executorId);
    const groupChat = new GroupChat(id, name, members, Messages.empty(), seqNr, version, false);

    return { groupChat, event };
  }

  /**
   * 空のGroupChatを作成（イベントリプレイ用）
   */
  static createEmpty(): GroupChat {
    return new GroupChat(
      GroupChatId.of('temp'),
      GroupChatName.of('temp'),
      Members.empty(),
      Messages.empty(),
      0,
      0,
      false,
    );
  }

  /**
   * 既存の値からGroupChatを構築
   */
  static reconstruct(
    id: GroupChatId,
    name: GroupChatName,
    members: Members,
    messages: Messages,
    seqNr: number,
    version: number,
    deleted: boolean,
  ): GroupChat {
    return new GroupChat(id, name, members, messages, seqNr, version, deleted);
  }

  /**
   * イベントをリプレイしてAggregateを再構築
   */
  static replay(events: Event[], snapshot: GroupChat): GroupChat {
    let result = snapshot;
    for (const event of events) {
      result = result.applyEvent(event) as GroupChat;
    }
    return result;
  }

  // Getters
  getGroupChatId(): GroupChatId {
    return this.groupChatId;
  }

  getName(): GroupChatName {
    return this.name;
  }

  getMembers(): Members {
    return this.members;
  }

  getMessages(): Messages {
    return this.messages;
  }

  // Withメソッド（不変更新）
  private withName(name: GroupChatName): GroupChat {
    return new GroupChat(
      this.groupChatId,
      name,
      this.members,
      this.messages,
      this.seqNr,
      this.version,
      this.deleted,
    );
  }

  private withMembers(members: Members): GroupChat {
    return new GroupChat(
      this.groupChatId,
      this.name,
      members,
      this.messages,
      this.seqNr,
      this.version,
      this.deleted,
    );
  }

  private withMessages(messages: Messages): GroupChat {
    return new GroupChat(
      this.groupChatId,
      this.name,
      this.members,
      messages,
      this.seqNr,
      this.version,
      this.deleted,
    );
  }

  withVersion(version: number): GroupChat {
    return new GroupChat(
      this.groupChatId,
      this.name,
      this.members,
      this.messages,
      this.seqNr,
      version,
      this.deleted,
    );
  }

  private withDeleted(): GroupChat {
    return new GroupChat(
      this.groupChatId,
      this.name,
      this.members,
      this.messages,
      this.seqNr,
      this.version,
      true,
    );
  }

  private incrementSeqNr(): GroupChat {
    return new GroupChat(
      this.groupChatId,
      this.name,
      this.members,
      this.messages,
      this.seqNr + 1,
      this.version,
      this.deleted,
    );
  }

  /**
   * イベントを適用して新しいAggregateを返す
   */
  applyEvent(event: Event): GroupChat {
    if (event instanceof GroupChatDeleted) {
      const result = this.delete(event.getExecutorId());
      if (!result.ok) {
        throw result.error;
      }
      return result.value.groupChat;
    } else if (event instanceof GroupChatMemberAdded) {
      const member = event.getMember();
      const result = this.addMember(
        member.getId(),
        member.getUserAccountId(),
        member.getRole(),
        event.getExecutorId(),
      );
      if (!result.ok) {
        throw result.error;
      }
      return result.value.groupChat;
    } else if (event instanceof GroupChatMemberRemoved) {
      const result = this.removeMemberByUserAccountId(
        event.getUserAccountId(),
        event.getExecutorId(),
      );
      if (!result.ok) {
        throw result.error;
      }
      return result.value.groupChat;
    } else if (event instanceof GroupChatRenamed) {
      const result = this.rename(event.getName(), event.getExecutorId());
      if (!result.ok) {
        throw result.error;
      }
      return result.value.groupChat;
    } else if (event instanceof GroupChatMessagePosted) {
      const result = this.postMessage(event.getMessage(), event.getExecutorId());
      if (!result.ok) {
        throw result.error;
      }
      return result.value.groupChat;
    } else if (event instanceof GroupChatMessageEdited) {
      const result = this.editMessage(event.getMessage(), event.getExecutorId());
      if (!result.ok) {
        throw result.error;
      }
      return result.value.groupChat;
    } else if (event instanceof GroupChatMessageDeleted) {
      const result = this.deleteMessage(event.getMessageId(), event.getExecutorId());
      if (!result.ok) {
        throw result.error;
      }
      return result.value.groupChat;
    }
    return this;
  }

  /**
   * メンバーを追加
   */
  addMember(
    memberId: MemberId,
    userAccountId: UserAccountId,
    role: MemberRole,
    executorId: UserAccountId,
  ): Result<GroupChatWithEventPair, Error> {
    // 制約チェック
    if (this.deleted) {
      return Err(new AlreadyDeletedError('グループチャットは削除されています'));
    }
    if (this.members.isMember(userAccountId)) {
      return Err(new NotMemberError('このユーザーはすでにメンバーです'));
    }
    if (!this.members.isAdministrator(executorId)) {
      return Err(new NotAdministratorError('実行者は管理者ではありません'));
    }

    // 新しい状態を作成
    const newMembers = this.members.addMemberWith(memberId, userAccountId, role);
    const newState = this.withMembers(newMembers).incrementSeqNr();

    const member = newMembers.getMembers().find((m) => m.getUserAccountId().equals(userAccountId))!;
    const event = GroupChatMemberAdded.create(this.groupChatId, member, newState.seqNr, executorId);

    return Ok({ groupChat: newState, event });
  }

  /**
   * メンバーを削除
   */
  removeMemberByUserAccountId(
    userAccountId: UserAccountId,
    executorId: UserAccountId,
  ): Result<GroupChatWithEventPair, Error> {
    if (this.deleted) {
      return Err(new AlreadyDeletedError('グループチャットは削除されています'));
    }
    if (!this.members.isMember(userAccountId)) {
      return Err(new NotMemberError('このユーザーはメンバーではありません'));
    }
    if (!this.members.isAdministrator(executorId)) {
      return Err(new NotAdministratorError('実行者は管理者ではありません'));
    }

    // 削除するメンバーを取得
    const member = this.members
      .getMembers()
      .find((m) => m.getUserAccountId().equals(userAccountId))!;

    const newMembers = this.members.removeMemberByUserAccountId(userAccountId);
    const newState = this.withMembers(newMembers).incrementSeqNr();

    const event = GroupChatMemberRemoved.create(
      this.groupChatId,
      member,
      newState.seqNr,
      executorId,
    );

    return Ok({ groupChat: newState, event });
  }

  /**
   * グループ名を変更
   */
  rename(name: GroupChatName, executorId: UserAccountId): Result<GroupChatWithEventPair, Error> {
    if (this.deleted) {
      return Err(new AlreadyDeletedError('グループチャットは削除されています'));
    }
    if (!this.members.isMember(executorId)) {
      return Err(new NotMemberError('実行者はメンバーではありません'));
    }
    if (!this.members.isAdministrator(executorId)) {
      return Err(new NotAdministratorError('実行者は管理者ではありません'));
    }
    if (this.name.equals(name)) {
      return Err(new AlreadyExistsNameError('名前は既に同じです'));
    }

    const newState = this.withName(name).incrementSeqNr();
    const event = GroupChatRenamed.create(this.groupChatId, name, newState.seqNr, executorId);

    return Ok({ groupChat: newState, event });
  }

  /**
   * グループチャットを削除
   */
  delete(executorId: UserAccountId): Result<GroupChatWithEventPair, Error> {
    if (this.deleted) {
      return Err(new AlreadyDeletedError('グループチャットは既に削除されています'));
    }
    if (!this.members.isMember(executorId)) {
      return Err(new NotMemberError('実行者はメンバーではありません'));
    }
    if (!this.members.isAdministrator(executorId)) {
      return Err(new NotAdministratorError('実行者は管理者ではありません'));
    }

    const newState = this.withDeleted().incrementSeqNr();
    const event = GroupChatDeleted.create(this.groupChatId, newState.seqNr, executorId);

    return Ok({ groupChat: newState, event });
  }

  /**
   * メッセージを投稿
   */
  postMessage(message: Message, executorId: UserAccountId): Result<GroupChatWithEventPair, Error> {
    if (this.deleted) {
      return Err(new AlreadyDeletedError('グループチャットは削除されています'));
    }
    if (!this.members.isMember(message.getSenderId())) {
      return Err(new NotMemberError('送信者はメンバーではありません'));
    }
    if (!this.members.isMember(executorId)) {
      return Err(new NotMemberError('実行者はメンバーではありません'));
    }
    if (!message.getSenderId().equals(executorId)) {
      return Err(new MismatchedUserAccountError('実行者と送信者が一致しません'));
    }

    const addResult = this.messages.add(message);
    if (!addResult.ok) {
      return Err(addResult.error);
    }

    const newState = this.withMessages(addResult.value).incrementSeqNr();
    const event = GroupChatMessagePosted.create(
      this.groupChatId,
      message,
      newState.seqNr,
      executorId,
    );

    return Ok({ groupChat: newState, event });
  }

  /**
   * メッセージを編集
   */
  editMessage(message: Message, executorId: UserAccountId): Result<GroupChatWithEventPair, Error> {
    if (this.deleted) {
      return Err(new AlreadyDeletedError('グループチャットは削除されています'));
    }
    if (!this.members.isMember(message.getSenderId())) {
      return Err(new NotMemberError('送信者はメンバーではありません'));
    }
    if (!this.members.isMember(executorId)) {
      return Err(new NotMemberError('実行者はメンバーではありません'));
    }
    if (!message.getSenderId().equals(executorId)) {
      return Err(new MismatchedUserAccountError('実行者と送信者が一致しません'));
    }

    const editResult = this.messages.edit(message);
    if (!editResult.ok) {
      return Err(editResult.error);
    }

    const newState = this.withMessages(editResult.value).incrementSeqNr();
    const event = GroupChatMessageEdited.create(
      this.groupChatId,
      message,
      newState.seqNr,
      executorId,
    );

    return Ok({ groupChat: newState, event });
  }

  /**
   * メッセージを削除
   */
  deleteMessage(
    messageId: MessageId,
    executorId: UserAccountId,
  ): Result<GroupChatWithEventPair, Error> {
    if (this.deleted) {
      return Err(new AlreadyDeletedError('グループチャットは削除されています'));
    }
    if (!this.members.isMember(executorId)) {
      return Err(new NotMemberError('実行者はメンバーではありません'));
    }

    const removeResult = this.messages.remove(messageId, executorId);
    if (!removeResult.ok) {
      return Err(removeResult.error);
    }

    const newState = this.withMessages(removeResult.value).incrementSeqNr();
    const event = GroupChatMessageDeleted.create(
      this.groupChatId,
      messageId,
      newState.seqNr,
      executorId,
    );

    return Ok({ groupChat: newState, event });
  }

  /**
   * 等価性チェック
   */
  equals(other: GroupChat): boolean {
    return (
      this.groupChatId.equals(other.groupChatId) &&
      this.name.equals(other.name) &&
      this.members.equals(other.members) &&
      this.messages.equals(other.messages) &&
      this.seqNr === other.seqNr &&
      this.version === other.version &&
      this.deleted === other.deleted
    );
  }

  /**
   * JSON表現
   */
  override toJSON(): object {
    return {
      ...super.toJSON(),
      groupChatId: this.groupChatId.toJSON(),
      name: this.name.toJSON(),
      members: this.members.toJSON(),
      messages: this.messages.toJSON(),
    };
  }
}
