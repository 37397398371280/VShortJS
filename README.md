# ShortJS

An ultra-lightweight, collision-aware JavaScript shorthand preprocessor with template literal `${...}` interpolation support, regex literal awareness, identifier protection, and error stack-trace line remapping.

## Features

- **Zero dependencies:** Works in Node.js, browsers, Deno, Bun, Web Workers, and other standard JavaScript environments.
- **Standalone & dot-chain aliases:** Expands standalone keywords/globals (such as `fu` $\rightarrow$ `function`, `ct` $\rightarrow$ `const`, `rt` $\rightarrow$ `return`) and dot-prefixed method names (such as `.mp` $\rightarrow$ `.map`, `.flt` $\rightarrow$ `.filter`).
- **Context-aware scanner:** Uses a numeric `mode` state (`0` = code, `1` = `//` line comment, `2` = `/* */` block comment, `3` = `/regex/` literal) plus quote and template `${...}` brace tracking so literals and comments are preserved while template expressions still expand.
- **Collision protection:** Lets you protect variable, parameter, or property names from expansion with `protect(...)` and `unprotect(...)`.
- **Line mapping & stack remapping:** Tracks line numbers across expansions and remaps `:line:col` entries in thrown error stacks back to the original shorthand lines.

## Installation & Usage

### Node.js (CommonJS)

```javascript
const ShortJS = require('./shortjs.js');

const expanded = ShortJS.expand(`
  fu greet(name) {
    ct clean = name.trm().tupc();
    rt "Hello, " + clean + "!";
  }
  cl(greet("  ada  "));
`);

console.log(expanded);
```

### Browser (No Node.js Required)

```html
<script src="./shortjs.js"></script>
<script>
  const result = ShortJS.run(`
    ct nums = [1, 2, 3, 4];
    rt nums.flt(n => n % 2 === 0).mp(n => n * 10);
  `);
  console.log(result); // [20, 40]
</script>
```

> **Note on CSP / Sandboxes:** `ShortJS.run(...)` compiles expanded code via `new Function(...)`. Environments blocking `unsafe-eval` will disallow `run(...)`, while `expand(...)` and `expandWithMap(...)` continue to work as pure string transformers.

## API Reference

### `ShortJS.expand(code, extraA?, extraC?)`
Expands `code` using `ShortJS.aliases` and `ShortJS.chainAliases` (plus optional per-call `extraA` and `extraC` overrides) and returns the expanded JavaScript string.

### `ShortJS.expandWithMap(code, extraA?, extraC?)`
Returns `{ code, lineMap }`, where `code` is the expanded JavaScript string and `lineMap` maps 0-based output line indices to 1-based input source line numbers.

### `ShortJS.run(code, extraA?, extraC?)`
Expands `code` via `expandWithMap`, executes it with `new Function(exp)()`, and remaps any thrown error's `stack` using `mapStack(err, lineMap)` before rethrowing.

### `ShortJS.mapStack(err, lineMap)`
Rewrites `:line:col` line numbers in `err.stack` back to their original source line numbers using `lineMap`.

### `ShortJS.protect(...names)` & `ShortJS.unprotect(...names)`
Adds or removes identifier names in `ShortJS.protectedNames` so matching tokens are never expanded. Both return `this` for chaining.

```javascript
ShortJS.protect('fl', 'sw');
// `fl` and `sw` remain untouched during expansion
ShortJS.unprotect('fl');
```

### `ShortJS.add(a?, c?)` & `ShortJS.remove(a?, c?)`
Adds custom standalone (`a`) or chain (`c`) aliases, or removes existing keys by name. Both return `this` for chaining.

```javascript
ShortJS
  .add({ q1: 'document.querySelector' }, { thn0: 'then' })
  .remove(['vr'], ['pp']);
```

## Default Aliases

### Standalone Aliases (`ShortJS.aliases`)
- **Functions & async:** `fu` (`function`), `af` (`async function`), `gf` (`function*`), `agf` (`async function*`), `aw` (`await`), `rt` (`return`), `yld` (`yield`)
- **Declarations & classes:** `ct` (`const`), `lt` (`let`), `vr` (`var`), `cls` (`class`), `ext` (`extends`), `nw` (`new`), `th` (`this`), `spr` (`super`), `imp` (`import`), `exp` (`export`), `df` (`default`), `del` (`delete`), `vd` (`void`), `dbg` (`debugger`)
- **Control flow & operators:** `ifn` (`if`), `elf` (`else`), `sw` (`switch`), `cs` (`case`), `brk` (`break`), `cnt` (`continue`), `fr` (`for`), `wh` (`while`), `dw` (`do`), `tryc` (`try`), `ctch` (`catch`), `fnl` (`finally`), `thr` (`throw`), `tof` (`typeof`), `iof` (`instanceof`), `inop` (`in`)
- **Values, console & built-ins:** `tr` (`true`), `fl` (`false`), `nl` (`null`), `und` (`undefined`), `nanv` (`NaN`), `infv` (`Infinity`), `gbl` (`globalThis`), `cl` (`console.log`), `cw` (`console.warn`), `ce` (`console.error`), `jp` (`JSON.parse`), `js` (`JSON.stringify`), `rjs` (`JSON.rawJSON`), `sumpr` (`Math.sumPrecise`), `rxesc` (`RegExp.escape`), `fromas` (`Array.fromAsync`), `itcat` (`Iterator.concat`)

### Chain Aliases (`ShortJS.chainAliases`)
- **Array & iteration:** `mp` (`map`), `flt` (`filter`), `rdc` (`reduce`), `fe` (`forEach`), `fnd` (`find`), `fndi` (`findIndex`), `fndl` (`findLast`), `sm` (`some`), `ev` (`every`), `inc` (`includes`), `idx` (`indexOf`), `lidx` (`lastIndexOf`), `slc` (`slice`), `spl` (`splice`), `jn` (`join`), `rv` (`reverse`), `srt` (`sort`), `flm` (`flatMap`), `psh` (`push`), `pp` (`pop`), `shf` (`shift`), `unsh` (`unshift`)
- **Promise:** `thn` (`then`), `cth` (`catch`), `fin` (`finally`)
- **String:** `trm` (`trim`), `trms` (`trimStart`), `trme` (`trimEnd`), `tupc` (`toUpperCase`), `tlwc` (`toLowerCase`), `rpl` (`replace`), `rpla` (`replaceAll`), `splt` (`split`), `sw` (`startsWith`), `ew` (`endsWith`), `padl` (`padStart`), `padr` (`padEnd`)

## Documentation

See `docs.html` for an interactive-style reference page covering scanner modes, examples, and the full implementation.