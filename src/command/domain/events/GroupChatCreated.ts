import { GroupChatEvent, generateEventId } from './GroupChatEvent';
import { GroupChatId } from '../models/GroupChatId';
import { GroupChatName } from '../models/GroupChatName';
import { Members } from '../models/Members';
import { UserAccountId } from '../models/UserAccountId';

/**
 * GroupChatCreated - グループチャット作成イベント
 */
export class GroupChatCreated extends GroupChatEvent {
  private readonly name: GroupChatName;
  private readonly members: Members;

  constructor(
    id: string,
    aggregateId: GroupChatId,
    name: GroupChatName,
    members: Members,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt?: number
  ) {
    super(id, aggregateId, seqNr, executorId, occurredAt);
    this.name = name;
    this.members = members;
  }

  static create(
    aggregateId: GroupChatId,
    name: GroupChatName,
    members: Members,
    seqNr: number,
    executorId: UserAccountId
  ): GroupChatCreated {
    return new GroupChatCreated(
      generateEventId(),
      aggregateId,
      name,
      members,
      seqNr,
      executorId
    );
  }

  /**
   * イベントストアから復元する際に使用
   */
  static reconstruct(
    id: string,
    aggregateId: GroupChatId,
    name: GroupChatName,
    members: Members,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt: number
  ): GroupChatCreated {
    return new GroupChatCreated(
      id,
      aggregateId,
      name,
      members,
      seqNr,
      executorId,
      occurredAt
    );
  }

  getName(): GroupChatName {
    return this.name;
  }

  getMembers(): Members {
    return this.members;
  }

  getTypeName(): string {
    return 'GroupChatCreated';
  }

  override toJSON(): object {
    return {
      ...super.toJSON(),
      name: this.name.toJSON(),
      members: this.members.toJSON(),
    };
  }
}
