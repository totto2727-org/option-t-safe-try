/*
 * The following code is modified for option-t.
 *
 * https://github.com/supermacro/neverthrow/blob/master/src/result.ts
 * https://github.com/supermacro/neverthrow/blob/master/src/result-async.ts
 *
 * MIT License
 *
 * Copyright (c) 2019 Giorgio Delgado
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Result as R } from "npm:option-t@49/plain_result/namespace";

// type InferOkTypes<T> = T extends R.Result<infer OK, unknown> ? OK : never;
// type InferErrTypes<T> = T extends R.Result<unknown, infer ERR> ? ERR : never;
type InferOk<T extends R.Result<unknown, unknown>> = T extends R.Ok<infer O> ? O
  : never;
type InferErr<T extends R.Result<unknown, unknown>> = T extends R.Err<infer E>
  ? E
  : never;

/**
 * Evaluates the given generator to a Result returned or an Err yielded from it, whichever comes first.
 *
 * This function, in combination with `safeUnwrap()`, is intended to emulate Rust's ? operator.
 * See `./main_test.ts` for examples.
 *
 * @param body - What is evaluated. In body, `yield* safeUnwrap(result)` works as Rust's `result?` expression.
 * @returns The first occurrence of either an yielded Err or a returned Result.
 */
// Synchronous
export function safeTry<T, E>(
  body: () => Generator<R.Err<E>, R.Result<T, E>>,
): R.Result<T, E>;
export function safeTry<
  YieldErr extends R.Err<unknown>,
  GeneratorReturnResult extends R.Result<unknown, unknown>,
>(
  body: () => Generator<YieldErr, GeneratorReturnResult>,
): R.Result<
  InferOk<GeneratorReturnResult>,
  InferErr<YieldErr> | InferErr<GeneratorReturnResult>
>;

// Asynchronous
export function safeTry<T, E>(
  body: () => AsyncGenerator<R.Err<E>, R.Result<T, E>>,
): Promise<R.Result<T, E>>;
export function safeTry<
  YieldErr extends R.Err<unknown>,
  GeneratorReturnResult extends R.Result<unknown, unknown>,
>(
  body: () => AsyncGenerator<YieldErr, GeneratorReturnResult>,
): Promise<
  R.Result<
    InferOk<GeneratorReturnResult>,
    InferErr<YieldErr> | InferErr<GeneratorReturnResult>
  >
>;

export function safeTry<T, E>(
  generator:
    | (() => Generator<R.Err<E>, R.Result<T, E>>)
    | (() => AsyncGenerator<R.Err<E>, R.Result<T, E>>),
): R.Result<T, E> | Promise<R.Result<T, E>> {
  const n = generator().next();
  if (n instanceof Promise) {
    return n.then((r) => r.value);
  }
  return n.value;
}

function _safeUnwrapOk<const RESULT extends R.Result<unknown, unknown>>(
  result: RESULT,
): Generator<R.Err<InferErr<RESULT>>, InferOk<RESULT>> {
  if (R.isErr(result)) {
    throw new TypeError("This is not Ok type");
  }

  // deno-lint-ignore require-yield
  return (function* () {
    return result.val as InferOk<RESULT>;
  })();
}

function _safeUnwrapErr<const RESULT extends R.Result<unknown, unknown>>(
  result: RESULT,
): Generator<R.Err<InferErr<RESULT>>, InferOk<RESULT>> {
  if (R.isOk(result)) {
    throw new TypeError("This is not Err type");
  }

  return (function* () {
    yield result as R.Err<InferErr<RESULT>>;

    throw new Error("Do not use this generator out of `safeTry`");
  })();
}

function _safeUnwrap<const RESULT extends R.Result<unknown, unknown>>(
  result: RESULT,
): Generator<R.Err<InferErr<RESULT>>, InferOk<RESULT>> {
  if (R.isOk(result)) {
    return _safeUnwrapOk(result);
  } else if (R.isErr(result)) {
    return _safeUnwrapErr(result);
  }

  throw new TypeError("This is not Result type");
}

function _safeUnwrapAsync<
  const RESULT extends R.Result<unknown, unknown>,
>(
  result: PromiseLike<RESULT>,
): AsyncGenerator<R.Err<InferErr<RESULT>>, InferOk<RESULT>> {
  return (async function* () {
    const r = await result;

    if (R.isOk(r)) {
      return yield* _safeUnwrapOk(r as RESULT);
    } else if (R.isErr(r)) {
      return yield* _safeUnwrapErr(r as RESULT);
    } else {
      throw new TypeError("This is not Result type");
    }
  })();
}

/**
 * Emulates Rust's `?` operator in `safeTry`'s body. See also `safeTry`.
 *
 * @param result
 */
// Synchronous
export function safeUnwrap<const RESULT extends R.Result<unknown, unknown>>(
  result: RESULT,
): Generator<R.Err<InferErr<RESULT>>, InferOk<RESULT>>;
// Asynchronous
export function safeUnwrap<
  const RESULT extends R.Result<unknown, unknown>,
>(
  result: Promise<RESULT>,
): AsyncGenerator<R.Err<InferErr<RESULT>>, InferOk<RESULT>>;
export function safeUnwrap<const RESULT extends R.Result<unknown, unknown>>(
  result: RESULT | PromiseLike<RESULT>,
):
  | Generator<R.Err<InferErr<RESULT>>, InferOk<RESULT>>
  | AsyncGenerator<R.Err<InferErr<RESULT>>, InferOk<RESULT>> {
  if ("then" in result) {
    return _safeUnwrapAsync(result);
  }
  return _safeUnwrap(result);
}
