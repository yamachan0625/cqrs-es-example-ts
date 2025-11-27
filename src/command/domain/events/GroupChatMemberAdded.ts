import { GroupChatEvent, generateEventId } from './GroupChatEvent';
import { GroupChatId } from '../models/GroupChatId';
import { Member } from '../models/Member';
import { UserAccountId } from '../models/UserAccountId';

/**
 * GroupChatMemberAdded - メンバー追加イベント
 */
export class GroupChatMemberAdded extends GroupChatEvent {
  private readonly member: Member;

  constructor(
    id: string,
    aggregateId: GroupChatId,
    member: Member,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt?: number
  ) {
    super(id, aggregateId, seqNr, executorId, occurredAt);
    this.member = member;
  }

  static create(
    aggregateId: GroupChatId,
    member: Member,
    seqNr: number,
    executorId: UserAccountId
  ): GroupChatMemberAdded {
    return new GroupChatMemberAdded(generateEventId(), aggregateId, member, seqNr, executorId);
  }

  static reconstruct(
    id: string,
    aggregateId: GroupChatId,
    member: Member,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt: number
  ): GroupChatMemberAdded {
    return new GroupChatMemberAdded(id, aggregateId, member, seqNr, executorId, occurredAt);
  }

  getMember(): Member {
    return this.member;
  }

  getTypeName(): string {
    return 'GroupChatMemberAdded';
  }

  override toJSON(): object {
    return {
      ...super.toJSON(),
      member: this.member.toJSON(),
    };
  }
}
