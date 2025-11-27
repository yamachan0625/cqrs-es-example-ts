/**
 * Read Model - グループチャット
 */
export interface GroupChatReadModel {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  messageCount: number;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Read Model - グループチャットメンバー
 */
export interface GroupChatMemberReadModel {
  id: string;
  groupChatId: string;
  userAccountId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: Date;
}

/**
 * Read Model - グループチャットメッセージ
 */
export interface GroupChatMessageReadModel {
  id: string;
  groupChatId: string;
  senderId: string;
  text: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * グループチャットの詳細（メンバーとメッセージを含む）
 */
export interface GroupChatDetailReadModel extends GroupChatReadModel {
  members: GroupChatMemberReadModel[];
  messages: GroupChatMessageReadModel[];
}
