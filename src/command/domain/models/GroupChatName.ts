/**
 * GroupChatName - グループチャットの名前
 */
export class GroupChatName {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * GroupChatNameを作成
   * @param value 名前
   */
  static of(value: string): GroupChatName {
    if (!value || value.trim() === '') {
      throw new Error('GroupChatName must not be empty');
    }
    if (value.length > 100) {
      throw new Error('GroupChatName must be 100 characters or less');
    }
    return new GroupChatName(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: GroupChatName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): object {
    return {
      value: this.value,
    };
  }
}
