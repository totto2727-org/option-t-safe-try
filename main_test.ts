/*
 * This is a port of [neverthrow](https://github.com/supermacro/neverthrow)'s `safeUnwrap` and `safeTry` to [option-t](https://github.com/gcanti/option-t).
 *
 * https://github.com/supermacro/neverthrow/blob/master/tests/safe-try.test.ts
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

import { describe, test } from "jsr:@std/testing@1.0.3/bdd";
import { expect } from "jsr:@std/expect@1.0.4";
import { Result as R } from "npm:option-t@49.2.0/plain_result/namespace";
import { safeTry, safeUnwrap } from "./main.ts";

describe("Returns what is returned from the generator function", () => {
  const val = "value";

  test("With synchronous Ok", () => {
    // deno-lint-ignore require-yield
    const res = safeTry(function* () {
      return R.createOk(val);
    });
    expect(R.isOk(res)).toBeTruthy();
    expect(R.unwrapOk(res)).toBe(val);
  });

  test("With synchronous Err", () => {
    // deno-lint-ignore require-yield
    const res = safeTry(function* () {
      return R.createErr(val);
    });
    expect(R.isErr(res)).toBeTruthy();
    expect(R.unwrapErr(res)).toBe(val);
  });

  test("With async Ok", async () => {
    // deno-lint-ignore require-yield
    const res = await safeTry(async function* () {
      return Promise.resolve(R.createOk(val));
    });
    expect(R.isOk(res)).toBeTruthy();
    expect(R.unwrapOk(res)).toBe(val);
  });

  test("With async Err", async () => {
    // deno-lint-ignore require-yield
    const res = await safeTry(async function* () {
      return Promise.resolve(R.createErr(val));
    });
    expect(R.isErr(res)).toBeTruthy();
    expect(R.unwrapErr(res)).toBe(val);
  });
});

describe("Returns the first occurence of Err instance as yiled*'s operand", () => {
  test("With synchronous results", () => {
    const errVal = "err";
    const okValues = Array<string>();

    const result = safeTry(function* () {
      const okFoo = yield* safeUnwrap(R.createOk("foo"));
      okValues.push(okFoo);

      const okBar = yield* safeUnwrap(R.createOk("bar"));
      okValues.push(okBar);

      yield* safeUnwrap(R.createErr(errVal));

      throw new Error("This line should not be executed");
    });

    expect(okValues).toEqual(["foo", "bar"]);

    expect(R.isErr(result)).toBeTruthy();
    expect(R.unwrapErr(result)).toBe(errVal);
  });

  test("With async results", async () => {
    const errVal = "err";
    const okValues = Array<string>();

    const result = await safeTry(async function* () {
      const okFoo = yield* safeUnwrap(Promise.resolve(R.createOk("foo")));
      okValues.push(okFoo);

      const okBar = yield* safeUnwrap(Promise.resolve(R.createOk("bar")));
      okValues.push(okBar);

      yield* safeUnwrap(Promise.resolve(R.createErr(errVal)));

      throw new Error("This line should not be executed");
    });

    expect(okValues).toEqual(["foo", "bar"]);

    expect(R.isErr(result)).toBeTruthy();
    expect(R.unwrapErr(result)).toBe(errVal);
  });

  test("Mix results of synchronous and async in AsyncGenerator", async () => {
    const errVal = "err";
    const okValues = Array<string>();

    const result = await safeTry(async function* () {
      const okFoo = yield* safeUnwrap(Promise.resolve(R.createOk("foo")));
      okValues.push(okFoo);

      const okBar = yield* safeUnwrap(R.createOk("bar"));
      okValues.push(okBar);

      yield* safeUnwrap(R.createErr(errVal));

      throw new Error("This line should not be executed");
    });

    expect(okValues).toEqual(["foo", "bar"]);

    expect(R.isErr(result)).toBeTruthy();
    expect(R.unwrapErr(result)).toBe(errVal);
  });
});

// describe("Tests if README's examples work", () => {
//   const okValue = 3;
//   const errValue = "err!";
//   function good(): Result<number, string> {
//     return R.createOk(okValue);
//   }
//   function bad(): Result<number, string> {
//     return R.createErr(errValue);
//   }
//   function promiseGood(): Promise<Result<number, string>> {
//     return Promise.resolve(R.createOk(okValue));
//   }
//   function promiseBad(): Promise<Result<number, string>> {
//     return Promise.resolve(R.createErr(errValue));
//   }
//   function asyncGood(): ResultAsync<number, string> {
//     return okAsync(okValue);
//   }
//   function asyncBad(): ResultAsync<number, string> {
//     return errAsync(errValue);
//   }

//   test("mayFail2 error", () => {
//     function myFunc(): Result<number, string> {
//       return safeTry<number, string>(function* () {
//         return R.createOk(
//           (yield* good()
//             .mapErr((e) => `1st, ${e}`)
//             .safeUnwrap()) +
//             (yield* bad()
//               .mapErr((e) => `2nd, ${e}`)
//               .safeUnwrap()),
//         );
//       });
//     }

//     const result = myFunc();
//     expect(result.isErr()).toBe(true);
//     expect(result._unsafeUnwrapErr()).toBe(`2nd, ${errValue}`);
//   });

//   test("all ok", () => {
//     function myFunc(): Result<number, string> {
//       return safeTry<number, string>(function* () {
//         return R.createOk(
//           (yield* good()
//             .mapErr((e) => `1st, ${e}`)
//             .safeUnwrap()) +
//             (yield* good()
//               .mapErr((e) => `2nd, ${e}`)
//               .safeUnwrap()),
//         );
//       });
//     }

//     const result = myFunc();
//     expect(result.isOk()).toBe(true);
//     expect(result._unsafeUnwrap()).toBe(okValue + okValue);
//   });

//   test("async mayFail1 error", async () => {
//     function myFunc(): ResultAsync<number, string> {
//       return safeTry<number, string>(async function* () {
//         return R.createOk(
//           (yield* (await promiseBad())
//             .mapErr((e) => `1st, ${e}`)
//             .safeUnwrap()) +
//             (yield* asyncGood()
//               .mapErr((e) => `2nd, ${e}`)
//               .safeUnwrap()),
//         );
//       });
//     }

//     const result = await myFunc();
//     expect(result.isErr()).toBe(true);
//     expect(result._unsafeUnwrapErr()).toBe(`1st, ${errValue}`);
//   });

//   test("async mayFail2 error", async () => {
//     function myFunc(): ResultAsync<number, string> {
//       return safeTry<number, string>(async function* () {
//         return R.createOk(
//           (yield* (await promiseGood())
//             .mapErr((e) => `1st, ${e}`)
//             .safeUnwrap()) +
//             (yield* asyncBad()
//               .mapErr((e) => `2nd, ${e}`)
//               .safeUnwrap()),
//         );
//       });
//     }

//     const result = await myFunc();
//     expect(result.isErr()).toBe(true);
//     expect(result._unsafeUnwrapErr()).toBe(`2nd, ${errValue}`);
//   });

//   test("promise async all ok", async () => {
//     function myFunc(): ResultAsync<number, string> {
//       return safeTry<number, string>(async function* () {
//         return R.createOk(
//           (yield* (await promiseGood())
//             .mapErr((e) => `1st, ${e}`)
//             .safeUnwrap()) +
//             (yield* asyncGood()
//               .mapErr((e) => `2nd, ${e}`)
//               .safeUnwrap()),
//         );
//       });
//     }

//     const result = await myFunc();
//     expect(result.isOk()).toBe(true);
//     expect(result._unsafeUnwrap()).toBe(okValue + okValue);
//   });
// });
