# @totto/option-t-safe-try

This is a port of [neverthrow](https://github.com/supermacro/neverthrow)'s
`safeUnwrap` and `safeTry` to [option-t](https://github.com/gcanti/option-t).

## Usage

```bash
# Deno
deno add npm:option-t@49 jsr:@totto/option-t-safe-try

# Node.js
npm i option-t && npx jsr add @totto/option-t-safe-try
yarn add option-t && yarn dlx jsr add @totto/option-t-safe-try
pnpm add option-t && pnpx jsr add @totto/option-t-safe-try
bun add option-t && bunx jsr add @totto/option-t-safe-try
```

```ts
// Deno(unused import map)
import { safeTry, safeUnwrap } from "jsr:@totto/option-t-safe-try";

// Node.js and Deno(used import map), Bun
import { safeTry, safeUnwrap } from "@totto/option-t-safe-try";
```

Please refer to [the test file](./main_test.ts) for sample code.
