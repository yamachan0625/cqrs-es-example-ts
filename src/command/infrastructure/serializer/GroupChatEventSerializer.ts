import { Event } from '../../../shared/event-store-adapter/types';
import {
  DefaultEventSerializer,
  EventPayload,
} from '../../../shared/event-store-adapter/dynamodb/EventSerializer';
import {
  GroupChatCreated,
  GroupChatDeleted,
  GroupChatRenamed,
  GroupChatMemberAdded,
  GroupChatMemberRemoved,
  GroupChatMessagePosted,
  GroupChatMessageEdited,
  GroupChatMessageDeleted,
} from '../../domain/events';
import { GroupChatId } from '../../domain/models/GroupChatId';
import { GroupChatName } from '../../domain/models/GroupChatName';
import { UserAccountId } from '../../domain/models/UserAccountId';
import { Members } from '../../domain/models/Members';
import { Member } from '../../domain/models/Member';
import { MemberId } from '../../domain/models/MemberId';
import { MemberRole } from '../../domain/models/MemberRole';
import { Message } from '../../domain/models/Message';
import { MessageId } from '../../domain/models/MessageId';

/**
 * GroupChatイベント専用のシリアライザー
 */
export class GroupChatEventSerializer extends DefaultEventSerializer {
  constructor() {
    super();
    this.registerEventFactories();
  }

  protected extractEventData(event: Event): Record<string, any> {
    if (event instanceof GroupChatCreated) {
      return {
        name: event.getName().getValue(),
        members: this.serializeMembers(event.getMembers()),
        executorId: event.getExecutorId().getValue(),
      };
    } else if (event instanceof GroupChatDeleted) {
      return {
        executorId: event.getExecutorId().getValue(),
      };
    } else if (event instanceof GroupChatRenamed) {
      return {
        name: event.getName().getValue(),
        executorId: event.getExecutorId().getValue(),
      };
    } else if (event instanceof GroupChatMemberAdded) {
      return {
        member: this.serializeMember(event.getMember()),
        executorId: event.getExecutorId().getValue(),
      };
    } else if (event instanceof GroupChatMemberRemoved) {
      return {
        member: this.serializeMember(event.getMember()),
        executorId: event.getExecutorId().getValue(),
      };
    } else if (event instanceof GroupChatMessagePosted) {
      return {
        message: this.serializeMessage(event.getMessage()),
        executorId: event.getExecutorId().getValue(),
      };
    } else if (event instanceof GroupChatMessageEdited) {
      return {
        message: this.serializeMessage(event.getMessage()),
        executorId: event.getExecutorId().getValue(),
      };
    } else if (event instanceof GroupChatMessageDeleted) {
      return {
        messageId: event.getMessageId().getValue(),
        executorId: event.getExecutorId().getValue(),
      };
    }

    return {};
  }

  private registerEventFactories(): void {
    // GroupChatCreated
    this.registerEventFactory('GroupChatCreated', (payload: EventPayload) => {
      return GroupChatCreated.reconstruct(
        payload.eventId,
        GroupChatId.of(payload.aggregateId),
        GroupChatName.of(payload.data.name),
        this.deserializeMembers(payload.data.members),
        payload.seqNr,
        UserAccountId.of(payload.data.executorId),
        payload.occurredAt
      );
    });

    // GroupChatDeleted
    this.registerEventFactory('GroupChatDeleted', (payload: EventPayload) => {
      return GroupChatDeleted.reconstruct(
        payload.eventId,
        GroupChatId.of(payload.aggregateId),
        payload.seqNr,
        UserAccountId.of(payload.data.executorId),
        payload.occurredAt
      );
    });

    // GroupChatRenamed
    this.registerEventFactory('GroupChatRenamed', (payload: EventPayload) => {
      return GroupChatRenamed.reconstruct(
        payload.eventId,
        GroupChatId.of(payload.aggregateId),
        GroupChatName.of(payload.data.name),
        payload.seqNr,
        UserAccountId.of(payload.data.executorId),
        payload.occurredAt
      );
    });

    // GroupChatMemberAdded
    this.registerEventFactory('GroupChatMemberAdded', (payload: EventPayload) => {
      return GroupChatMemberAdded.reconstruct(
        payload.eventId,
        GroupChatId.of(payload.aggregateId),
        this.deserializeMember(payload.data.member),
        payload.seqNr,
        UserAccountId.of(payload.data.executorId),
        payload.occurredAt
      );
    });

    // GroupChatMemberRemoved
    this.registerEventFactory('GroupChatMemberRemoved', (payload: EventPayload) => {
      return GroupChatMemberRemoved.reconstruct(
        payload.eventId,
        GroupChatId.of(payload.aggregateId),
        this.deserializeMember(payload.data.member),
        payload.seqNr,
        UserAccountId.of(payload.data.executorId),
        payload.occurredAt
      );
    });

    // GroupChatMessagePosted
    this.registerEventFactory('GroupChatMessagePosted', (payload: EventPayload) => {
      return GroupChatMessagePosted.reconstruct(
        payload.eventId,
        GroupChatId.of(payload.aggregateId),
        this.deserializeMessage(payload.data.message),
        payload.seqNr,
        UserAccountId.of(payload.data.executorId),
        payload.occurredAt
      );
    });

    // GroupChatMessageEdited
    this.registerEventFactory('GroupChatMessageEdited', (payload: EventPayload) => {
      return GroupChatMessageEdited.reconstruct(
        payload.eventId,
        GroupChatId.of(payload.aggregateId),
        this.deserializeMessage(payload.data.message),
        payload.seqNr,
        UserAccountId.of(payload.data.executorId),
        payload.occurredAt
      );
    });

    // GroupChatMessageDeleted
    this.registerEventFactory('GroupChatMessageDeleted', (payload: EventPayload) => {
      return GroupChatMessageDeleted.reconstruct(
        payload.eventId,
        GroupChatId.of(payload.aggregateId),
        MessageId.of(payload.data.messageId),
        payload.seqNr,
        UserAccountId.of(payload.data.executorId),
        payload.occurredAt
      );
    });
  }

  private serializeMembers(members: Members): any[] {
    return members.getMembers().map((member) => this.serializeMember(member));
  }

  private serializeMember(member: Member): any {
    return {
      id: member.getId().getValue(),
      userAccountId: member.getUserAccountId().getValue(),
      role: member.getRole().toString(),
    };
  }

  private deserializeMembers(data: any[]): Members {
    const members = data.map((m) => this.deserializeMember(m));
    return Members.of(members);
  }

  private deserializeMember(data: any): Member {
    return Member.create(
      MemberId.of(data.id),
      UserAccountId.of(data.userAccountId),
      MemberRole.fromString(data.role)
    );
  }

  private serializeMessage(message: Message): any {
    return {
      id: message.getId().getValue(),
      senderId: message.getSenderId().getValue(),
      text: message.getText(),
      createdAt: message.getCreatedAt().getTime(),
      updatedAt: message.getUpdatedAt().getTime(),
    };
  }

  private deserializeMessage(data: any): Message {
    return Message.reconstruct(
      MessageId.of(data.id),
      UserAccountId.of(data.senderId),
      data.text,
      data.createdAt,
      data.updatedAt
    );
  }
}
