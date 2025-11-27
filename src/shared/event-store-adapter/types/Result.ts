/**
 * Result型 - Goのmo.Resultに相当
 * 成功または失敗を表現する型
 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * 成功を表すResultを作成
 */
export const Ok = <T>(value: T): Result<T> => ({
  ok: true,
  value,
});

/**
 * 失敗を表すResultを作成
 */
export const Err = <E = Error>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

/**
 * Resultのユーティリティ関数
 */
export namespace ResultUtils {
  export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
    return result.ok === true;
  }

  export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
    return result.ok === false;
  }

  export function unwrap<T, E>(result: Result<T, E>): T {
    if (result.ok) {
      return result.value;
    }
    throw result.error;
  }

  export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.ok) {
      return result.value;
    }
    return defaultValue;
  }

  export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (result.ok) {
      return { ok: true, value: fn(result.value) };
    }
    return result;
  }

  export function flatMap<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>
  ): Result<U, E> {
    if (result.ok) {
      return fn(result.value);
    }
    return result;
  }
}
