const ShortJS = {
  aliases: {
    fu: 'function', af: 'async function', gf: 'function*', agf: 'async function*',
    aw: 'await', rt: 'return', yld: 'yield', ct: 'const', lt: 'let', vr: 'var',
    cls: 'class', ext: 'extends', nw: 'new', th: 'this', spr: 'super',
    imp: 'import', exp: 'export', df: 'default', del: 'delete', vd: 'void', dbg: 'debugger',
    ifn: 'if', elf: 'else', sw: 'switch', cs: 'case', brk: 'break', cnt: 'continue',
    fr: 'for', wh: 'while', dw: 'do', tryc: 'try', ctch: 'catch', fnl: 'finally',
    thr: 'throw', tof: 'typeof', iof: 'instanceof', inop: 'in',
    tr: 'true', fl: 'false', nl: 'null', und: 'undefined', nanv: 'NaN', infv: 'Infinity',
    gbl: 'globalThis', cl: 'console.log', cw: 'console.warn', ce: 'console.error',
    jp: 'JSON.parse', js: 'JSON.stringify', rjs: 'JSON.rawJSON',
    sumpr: 'Math.sumPrecise', rxesc: 'RegExp.escape', fromas: 'Array.fromAsync', itcat: 'Iterator.concat'
  },
  chainAliases: {
    mp: 'map', flt: 'filter', rdc: 'reduce', fe: 'forEach', fnd: 'find', fndi: 'findIndex',
    fndl: 'findLast', sm: 'some', ev: 'every', inc: 'includes', idx: 'indexOf', lidx: 'lastIndexOf',
    slc: 'slice', spl: 'splice', jn: 'join', rv: 'reverse', srt: 'sort', flm: 'flatMap',
    psh: 'push', pp: 'pop', shf: 'shift', unsh: 'unshift', thn: 'then', cth: 'catch', fin: 'finally',
    trm: 'trim', trms: 'trimStart', trme: 'trimEnd', tupc: 'toUpperCase', tlwc: 'toLowerCase',
    rpl: 'replace', rpla: 'replaceAll', splt: 'split', sw: 'startsWith', ew: 'endsWith',
    padl: 'padStart', padr: 'padEnd'
  },
  protectedNames: new Set(),
  protect(...n) { n.flat().forEach(k => this.protectedNames.add(k)); return this; },
  unprotect(...n) { n.flat().forEach(k => this.protectedNames.delete(k)); return this; },
  add(a = {}, c = {}) { Object.assign(this.aliases, a); Object.assign(this.chainAliases, c); return this; },
  remove(a = [], c = []) { a.forEach(k => delete this.aliases[k]); c.forEach(k => delete this.chainAliases[k]); return this; },

  expandWithMap(code, extraA = {}, extraC = {}) {
    const map = { ...this.aliases, ...extraA };
    const cmap = { ...this.chainAliases, ...extraC };
    const prot = this.protectedNames;
    const rxKw = new Set(['return','throw','case','delete','void','typeof','instanceof','in','of','new','yield','await','else','do']);
    const isIdStart = c => /[a-zA-Z_$]/.test(c);
    const isId = c => /[a-zA-Z0-9_$]/.test(c);

    let out = '', i = 0, quote = null, braces = [], mode = 0, rxClass = false, needRx = true;
    // mode: 0 = code, 1 = // comment, 2 = /* comment, 3 = /regex/
    const lineMap = [];
    let srcLine = 1, outLine = 1, hasLine = false;

    const pushOut = s => {
      for (const c of s) {
        if (!hasLine) { lineMap[outLine - 1] = srcLine; hasLine = true; }
        out += c;
        if (c === '\n') { outLine++; hasLine = false; }
      }
    };
    const stepSrc = s => { for (const c of s) if (c === '\n') srcLine++; };
    const emit = (s, raw = s) => { pushOut(s); stepSrc(raw); };

    while (i < code.length) {
      const c = code[i], n = code[i + 1] || '', p = i ? code[i - 1] : '';

      if (mode === 1) { emit(c); if (c === '\n') { mode = 0; needRx = true; } i++; continue; }
      if (mode === 2) {
        if (c === '*' && n === '/') { emit('*/'); i += 2; mode = 0; }
        else { emit(c); i++; }
        continue;
      }
      if (mode === 3) {
        if (c === '\\' && n) { emit(c + n); i += 2; continue; }
        if (c === '[') rxClass = true;
        else if (c === ']' && rxClass) rxClass = false;
        else if (c === '/' && !rxClass) {
          let j = i + 1;
          while (j < code.length && /[a-zA-Z]/.test(code[j])) j++;
          emit(code.slice(i, j)); i = j; mode = 0; needRx = false; continue;
        }
        emit(c); i++; continue;
      }

      if (quote && (quote !== '`' || !braces.length)) {
        if (quote === '`' && c === '$' && n === '{') { emit('${'); braces.push(1); i += 2; needRx = true; continue; }
        if (c === '\\' && n) { emit(c + n); i += 2; continue; }
        emit(c);
        if (c === quote) { quote = null; needRx = false; }
        i++; continue;
      }

      if (quote === '`' && braces.length) {
        if (c === '{') braces[braces.length - 1]++;
        else if (c === '}' && --braces[braces.length - 1] === 0) { braces.pop(); emit('}'); i++; continue; }
      }

      if (c === '/' && n === '/') { emit('//'); i += 2; mode = 1; continue; }
      if (c === '/' && n === '*') { emit('/*'); i += 2; mode = 2; continue; }
      if (c === '"' || c === "'" || c === '`') { quote = c; emit(c); i++; continue; }
      if (c === '/') {
        if (needRx) { mode = 3; rxClass = false; emit('/'); }
        else { emit('/'); needRx = true; }
        i++; continue;
      }

      if (isIdStart(c) && !isId(p)) {
        let e = i + 1;
        while (e < code.length && isId(code[e])) e++;
        const tok = code.slice(i, e), after = code[e] || '';
        let exp = tok;
        if (!isId(after) && !prot.has(tok)) {
          exp = (p === '.' ? cmap : map)[tok] || tok;
        }
        pushOut(exp); stepSrc(tok);
        needRx = rxKw.has(exp);
        i = e; continue;
      }

      if (/\s/.test(c)) { emit(c); i++; continue; }
      emit(c);
      needRx = !')]}'.includes(c) && !(c === '+' && p === '+') && !(c === '-' && p === '-');
      i++;
    }

    return { code: out, lineMap };
  },

  expand(code, extraA, extraC) { return this.expandWithMap(code, extraA, extraC).code; },

  mapStack(err, lineMap) {
    if (!err?.stack || !Array.isArray(lineMap)) return err?.stack || '';
    return err.stack.replace(/:(\d+):(\d+)/g, (m, l, col) => {
      const orig = lineMap[Number(l) - 1];
      return orig ? `:${orig}:${col}` : m;
    });
  },

  run(code, extraA, extraC) {
    const { code: exp, lineMap } = this.expandWithMap(code, extraA, extraC);
    try { return new Function(exp)(); }
    catch (err) { err.stack = this.mapStack(err, lineMap); throw err; }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShortJS;
  module.exports.ShortJS = ShortJS;
}
if (typeof globalThis !== 'undefined') {
  globalThis.ShortJS = ShortJS;
}
