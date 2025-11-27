/**
 * MemberRole - メンバーの役割
 */
export enum Role {
  Admin = 'ADMIN',
  Member = 'MEMBER',
}

/**
 * MemberRole Value Object
 */
export class MemberRole {
  private readonly role: Role;

  private constructor(role: Role) {
    this.role = role;
  }

  static admin(): MemberRole {
    return new MemberRole(Role.Admin);
  }

  static member(): MemberRole {
    return new MemberRole(Role.Member);
  }

  static of(role: Role): MemberRole {
    return new MemberRole(role);
  }

  static fromString(value: string): MemberRole {
    switch (value.toUpperCase()) {
      case 'ADMIN':
        return MemberRole.admin();
      case 'MEMBER':
        return MemberRole.member();
      default:
        throw new Error(`Invalid role: ${value}`);
    }
  }

  isAdmin(): boolean {
    return this.role === Role.Admin;
  }

  isMember(): boolean {
    return this.role === Role.Member;
  }

  getValue(): Role {
    return this.role;
  }

  equals(other: MemberRole): boolean {
    return this.role === other.role;
  }

  toString(): string {
    return this.role;
  }

  toJSON(): object {
    return {
      value: this.role,
    };
  }
}
