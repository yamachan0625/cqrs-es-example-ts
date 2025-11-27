/**
 * Domain層のカスタムエラー
 */

export class AlreadyDeletedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AlreadyDeletedError';
  }
}

export class NotMemberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotMemberError';
  }
}

export class NotAdministratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotAdministratorError';
  }
}

export class AlreadyExistsNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AlreadyExistsNameError';
  }
}

export class MismatchedUserAccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MismatchedUserAccountError';
  }
}
