const TCS_VERSION = "7.4.0";
const TCS_SERIES  = "13";
const TCS_BUILD   = "23";
const needsDOM = [
  "changeBodyCSS", "query", "queryAll", "setText", "setHTML", "setValue", "setStyle", 
  "show", "hide", "changePageTitle", "runHyperTextMarkupLanguage", "getValue", "changeTitle", 
  "openLink", "reloadCurrentWebPage", "copyToClipboard", "requstCurrentLoctationClosing", "makeTag", 
  "getTagContent", "getAttribute", "createElement", "getElementById", "setKey",
  "load3D", "add3D", "run3D", "loadModel3D", "setTexture3D", "applyPhysics3D", "addLight3D", "addText3D",
  "getProp", "setProp", "css", "notify", "on", "setCssText"
];
const needsStorage = ["saveData", "loadData", "deleteData", "wipeAllCurrentWebsiteData", "wipeTCSData", "saveJSON", "loadJSON"];
const needsSystem = [
  "getUserAgent", "getUserInfo", "now", "getYear", "getMonth", "getDay", 
  "getHours", "sleep", "wait", "alert", "prompt", "confirm", "getFullDate", "saveToLocalFileStorage", "updateToLocalFileStorage",
  "readFromLocalFileStorage"
];
const needsNetwork = [
  "fetchText", "fetchFn", "fetchTCSFn", "XTHttpsRequest", "fetchJSON", 
  "ws_connect", "ws_send", "ws_close", "loadJavaScriptTCSFunction",
  "FBInit", "FBAdd", "FBGet", "FBWatch", "FBUpdate", "FBInc", "FBDelete",
  "FBQuery", "FBSignUp", "FBSignIn", "FBAnon", "FBSignOut", "FBUser",
  "FBRtdbSet", "FBRtdbGet", "FBRtdbUpdate", "FBRtdbPush", "FBRtdbDelete", "FBRtdbWatch", "fetchVal"
];
const js = ["callJS", "javaScriptRunCodeAsText", "fetchFn", "loadJavaScriptTCSFunction"];
const needsCFN = [];
const tcs = {
  version: "TCS_JS_" + TCS_SERIES,
  full_version: TCS_VERSION,
  license: "MIT",
  js: "JavaScript Eruda E2026",
  interpreter: "JIT",
  build: TCS_BUILD,
  info: "TCS_JS_" + TCS_SERIES + "/JS_Eruda/JS_E2026/MIT" + "/B_" + TCS_BUILD + "/V_" + TCS_SERIES + "/FV_" + TCS_VERSION + "/JIT"
};
function tokenize(src) {
  src = src.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"); 
  const tokens = [];
  let i = 0;
  let line = 1;
  let col = 1;
  const isDigit = c => c >= '0' && c <= '9';
  const isAlpha = c => /[a-zA-Z_]/.test(c);
  const isAlphaNum = c => isAlpha(c) || isDigit(c);
  const isHex = c => /[0-9a-fA-F]/.test(c);
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { 
      if (c === '\n') { line++; col = 1; }
      else { col++; }
      i++; continue; 
    }
    if (c === '/' && src[i+1] === '/') {
      while (i < src.length && src[i] !== '\n') { i++; col++; }
      continue;
    }
    if (c === 'r' && src[i+1] === '"') {
      i += 2; col += 2;
      let s = "";
      while (i < src.length && src[i] !== '"') { s += src[i++]; col++; }
      i++; col++;
      tokens.push({ type: "STRING", value: s, line: line, col: col });
      continue;
    }
    if (c === '"') {
      i++; col++;
      let s = "";
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\' && i + 1 < src.length) {
          const next = src[i + 1];
          if (next === '"')  { s += '"';  i += 2; col += 2; continue; }
          if (next === "'")  { s += "'";  i += 2; col += 2; continue; }
          if (next === '/')  { s += '/';  i += 2; col += 2; continue; }
          if (next === 'n')  { s += '\n'; i += 2; col += 2; continue; }
          if (next === 't')  { s += '\t'; i += 2; col += 2; continue; }
          if (next === 'r')  { s += '\r'; i += 2; col += 2; continue; }
          if (next === '0')  { s += '\0'; i += 2; col += 2; continue; }
          if (next === '\\') { s += '\\'; i += 2; col += 2; continue; }
          if (next === 'u' && i + 5 < src.length) {
            const hex = src.substr(i + 2, 4);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
              s += String.fromCharCode(parseInt(hex, 16));
              i += 6; col += 6; continue;
            }
          }
        }
        if (src[i] === '\n') { line++; col = 1; }
        else { col++; }
        s += src[i++];
      }
      if (i >= src.length) throw new Error("Unterminated string literal at line " + line);
      i++; col++;
      tokens.push({ type: "STRING", value: s, line: line, col: col });
      continue;
    }
    if (c === "'") {
      i++; col++;
      let s = "";
      while (i < src.length && src[i] !== "'") {
        if (src[i] === '\\' && i + 1 < src.length) {
          const next = src[i + 1];
          if (next === "'")  { s += "'";  i += 2; col += 2; continue; }
          if (next === '"')  { s += '"';  i += 2; col += 2; continue; }
          if (next === '/')  { s += '/';  i += 2; col += 2; continue; }
          if (next === 'n')  { s += '\n'; i += 2; col += 2; continue; }
          if (next === 't')  { s += '\t'; i += 2; col += 2; continue; }
          if (next === 'r')  { s += '\r'; i += 2; col += 2; continue; }
          if (next === '0')  { s += '\0'; i += 2; col += 2; continue; }
          if (next === '\\') { s += '\\'; i += 2; col += 2; continue; }
        }
        if (src[i] === '\n') { line++; col = 1; }
        else { col++; }
        s += src[i++];
      }
      if (i >= src.length) throw new Error("Unterminated single-quoted string at line " + line);
      i++; col++;
      tokens.push({ type: "STRING", value: s, line: line, col: col });
      continue;
    }
    if (c === '`') {
      i++; col++;
      let s = "";
      while (i < src.length && src[i] !== '`') {
        if (src[i] === '\\' && i + 1 < src.length) {
          const next = src[i+1];
          if (next === '`')  { s += '`';  i += 2; col += 2; continue; }
          if (next === '$')  { s += '$';  i += 2; col += 2; continue; }
          if (next === 'n')  { s += '\n'; i += 2; col += 2; continue; }
          if (next === 't')  { s += '\t'; i += 2; col += 2; continue; }
          if (next === '\\') { s += '\\'; i += 2; col += 2; continue; }
        }
        if (src[i] === '\n') { s += '\n'; line++; col = 1; }
        else { s += src[i]; col++; }
        i++;
      }
      i++; col++;
      tokens.push({ type: "TEMPLATE", value: s, line: line, col: col });
      continue;
    }
    if (isDigit(c)) {
      let n = "";
      let startCol = col;
      if (c === '0' && src[i + 1] === 'x') {
        n = "0x";
        i += 2; col += 2;
        while (i < src.length && isHex(src[i])) { n += src[i++]; col++; }
        tokens.push({ type: "NUMBER", value: parseInt(n, 16), line: line, col: startCol });
        continue;
      }
      while (i < src.length && isDigit(src[i])) { n += src[i++]; col++; }
      if (src[i] === '.' && isDigit(src[i + 1])) {
        n += src[i++]; col++;
        while (i < src.length && isDigit(src[i])) { n += src[i++]; col++; }
      }
      if (src[i] === 'e' || src[i] === 'E') {
        const eStart = i;
        i++; col++;
        if (src[i] === '+' || src[i] === '-') { i++; col++; }
        if (isDigit(src[i])) {
          n += src.substr(eStart, i - eStart);
          while (i < src.length && isDigit(src[i])) { n += src[i++]; col++; }
        } else {
          i = eStart;
          col = startCol;
        }
      }
      tokens.push({ type: "NUMBER", value: parseFloat(n), line: line, col: startCol });
      continue;
    }
    if (isAlpha(c)) {
      let w = "";
      let startCol = col;
      while (i < src.length && isAlphaNum(src[i])) { w += src[i++]; col++; }
      tokens.push({ type: "WORD", value: w, line: line, col: startCol });
      continue;
    }
    const two = src.substr(i, 2);
    if (["==", "!=", "<=", ">=", "&&", "||", "..", "++", "--"].includes(two)) {
      tokens.push({ type: "OP", value: two, line: line, col: col });
      i += 2; col += 2;
      continue;
    }
    if ("+-*/%<>()[]{},;.!?:=".includes(c)) {
      tokens.push({ type: "OP", value: c, line: line, col: col });
      i++; col++;
      continue;
    }
    throw new Error("Unexpected character: " + c + " at line " + line + ", column " + col);
  }
  tokens.push({ type: "EOF", line: line, col: col });
  return tokens;
}
function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos] || { type: "EOF", line: 0 };
  const at = (t, v) => peek().type === t && (v === undefined || peek().value === v);
  const eat = () => tokens[pos++];
  const expect = (t, v) => {
    if (!at(t, v)) {
        const tok = peek();
        throw new Error(
            "Expected " + (v || t) + 
            ", got '" + tok.value + "'" +
            " at line " + tok.line + 
            ", column " + tok.col
        );
    }
    return eat();
};
  function node(type, props) {
    return { type, line: peek().line, ...props };
  }
  function parseProgram() {
    const body = [];
    while (!at("EOF")) {
      if (at("OP", ";")) { eat(); continue; }
      body.push(parseStatement());
    }
    return node("Program", { body });
  }
  function parseStatement() {
    if (at("WORD", "let")) return parseLet(false);
    if (at("WORD", "const")) return parseLet(true);
    if (at("WORD", "new")) {
      eat();
      const val = parseExpression();
      return node("New", { val });
    }
    if (at("WORD", "import")) return parseImport();
    if (at("WORD", "await")) {
    eat();
    const expr = parseExpression();
    return node("Await", { expr });
}
    if (at("WORD", "if"))  return parseIf();
    if (at("WORD", "dojs")) {
  eat();
  expect("OP", "{");
  let jsCode = "";
  while (!at("OP", "}") && !at("EOF")) {
    let tok = eat();
    if (tok.type === "STRING") jsCode += '"' + tok.value + '" ';
    else if (tok.type === "NUMBER") jsCode += tok.value + ' ';
    else jsCode += tok.value + ' ';
  }
  expect("OP", "}");
  return node("DoJS", { code: jsCode.trim() });
}
if (at("WORD", "jsfn")) {
  eat();
  const name = expect("WORD").value;
  expect("OP", "(");
  const params = [];
  while (!at("OP", ")")) {
    params.push(expect("WORD").value);
    if (at("OP", ",")) eat(); else break;
  }
  expect("OP", ")");
  expect("OP", "{");
  let jsCode = "";
  while (!at("OP", "}") && !at("EOF")) {
    let tok = eat();
    if (tok.type === "STRING") jsCode += '"' + tok.value + '" ';
    else if (tok.type === "NUMBER") jsCode += tok.value + ' ';
    else jsCode += tok.value + ' ';
  }
  expect("OP", "}");
  return node("JSFn", { name: name, params: params, code: jsCode.trim() });
}
    if (at("WORD", "switch")) {
      eat();
      expect("OP", "(");
      const expr = parseExpression();
      expect("OP", ")");
      expect("OP", "{");
      const cases = [];
      let defaultCase = null;
      while (!at("OP", "}") && !at("EOF")) {
        if (at("WORD", "case")) {
          eat();
          const val = parseExpression();
          expect("OP", ":");
          const body = [];
          while (!at("WORD", "case") && !at("WORD", "default") && !at("OP", "}") && !at("EOF")) {
            body.push(parseStatement());
          }
          cases.push({ val, body });
        } 
        else if (at("WORD", "default")) {
          eat();
          expect("OP", ":");
          const body = [];
          while (!at("WORD", "case") && !at("WORD", "default") && !at("OP", "}") && !at("EOF")) {
            body.push(parseStatement());
          }
          defaultCase = body;
        } 
        else {
          throw new Error("Expected 'case' or 'default' inside switch at line " + peek().line);
        }
      }
      expect("OP", "}");
      return node("Switch", { expr, cases, defaultCase });
    }
    if (at("WORD", "while")) return parseWhile();
    if (at("WORD", "until")) {
      eat();
      expect("OP", "(");
      const cond = parseExpression();
      expect("OP", ")");
      expect("OP", "{");
      const body = parseBlock();
      expect("OP", "}");
      return node("Until", { cond, body });
    }
    if (at("WORD", "for")) return parseFor();
    if (
  at("WORD", "fn") ||
  (
    at("WORD", "async") &&
    tokens[pos + 1] &&
    tokens[pos + 1].value === "fn"
  )
) {
  return parseFn();
}
    if (at("WORD", "try")) return parseTry();
    if (at("WORD", "throw")) return parseThrow();
    if (at("WORD", "on")) return parseOn();
    if (at("WORD", "break")) { eat(); if (at("OP", ";")) eat(); return node("Break", {}); }
    if (at("WORD", "continue")) { eat(); if (at("OP", ";")) eat(); return node("Continue", {}); }
    if (at("WORD", "return")) {
      eat();
      const v = at("OP", "}") ? null : parseExpression();
      if (at("OP", ";")) eat();
      return node("Return", { value: v });
    }
    const expr = parseExpression();
    if (at("OP", "=")) {
      eat();
      const value = parseExpression();
      if (at("OP", ";")) eat();
      if (expr.type === "Member") {
        return node("SetMember", { obj: expr.obj, prop: expr.prop, value });
      }
      if (expr.type === "Index") {
        return node("SetIndex", { obj: expr.obj, index: expr.index, value });
      }
      return node("Set", { name: expr.name, value });
    }
    if (at("WORD", "set")) {
      eat();
      expect("OP", "=");
      const value = parseExpression();
      if (at("OP", ";")) eat();
      return node("Set", { name: expr.name, value });
    }
    if (at("OP", ";")) eat();
    return node("ExprStmt", { expr });
  }
  function parseImport() {
    expect("WORD", "import");
    const url = expect("STRING").value;
    let alias = null;
    if (at("WORD", "as")) {
      eat();
      alias = expect("WORD").value;
    }
    if (at("OP", ";")) eat();
    return node("Import", { url, alias });
  }
  function parseLet(isConst) {
    eat(); 
    let declared = null;
    if (at("WORD", "number") || at("WORD", "string") || at("WORD", "boolean")) {
      const base = eat().value;
      let arr = null;
      if (at("OP", "(")) {
        eat();
        expect("WORD", "arr");
        expect("OP", "=");
        arr = eat().value === "true";
        expect("OP", ")");
      }
      declared = { base, arr };
    }
    const name = expect("WORD").value;
    expect("OP", "=");
    const value = parseExpression();
    if (at("OP", ";")) eat();
    return node("Let", { name, value, declared, isConst });
  }
  function parseOn() {
    expect("WORD", "on");
    const event = expect("STRING").value;
    expect("WORD", "for");
    const selector = expect("STRING").value;
    expect("OP", "{");
    const body = parseBlock();
    expect("OP", "}");
    return node("On", { event, selector, body });
  }
  function parseIf() {
    expect("WORD", "if");
    const cond = parseExpression();
    expect("OP", "{");
    const then = parseBlock();
    expect("OP", "}");
    let otherwise = null;
    if (at("WORD", "else")) {
      eat();
      if (at("WORD", "if")) otherwise = [parseIf()];
      else {
        expect("OP", "{");
        otherwise = parseBlock();
        expect("OP", "}");
      }
    }
    return node("If", { cond, then, otherwise });
  }
  function parseWhile() {
    expect("WORD", "while");
    const cond = parseExpression();
    expect("OP", "{");
    const body = parseBlock();
    expect("OP", "}");
    return node("While", { cond, body });
  }
 function parseFor() {
    expect("WORD", "for");
    const name = expect("WORD").value;
    expect("WORD", "until");
    let op = "<";
    if (at("OP","==") || at("OP","<") || at("OP",">") ||
        at("OP","<=") || at("OP",">=") || at("OP","!=")) {
        op = eat().value;
    }
    const end = parseExpression();
    let UOD;
    if (at("OP", "++"))      { eat(); UOD = "++"; }
    else if (at("OP", "--")) { eat(); UOD = "--"; }
    else {
        const tok = peek();
        throw new Error(
            "for: expected '++' or '--' after loop bound, got '" +
            (tok.value !== undefined ? tok.value : tok.type) +
            "' at line " + tok.line + ", column " + tok.col
        );
    }
    expect("OP", "{");
    const body = parseBlock();
    expect("OP", "}");
    return node("For", { name, op, start: { type: "Number", value: 0 }, end, body, UOD });
}
  function parseFn() {
  	let isAsync = false;
  	if(at("WORD", "async")) { 
  	  eat();
  	  isAsync = true;
  	} 
    expect("WORD", "fn");
    const name = expect("WORD").value;
    expect("OP", "(");
    const params = [];
    while (!at("OP", ")")) {
      params.push(expect("WORD").value);
      if (at("OP", ",")) eat(); else break;
    }
    expect("OP", ")");
    expect("OP", "{");
    const body = parseBlock();
    expect("OP", "}");
    return node("Fn", { name, params, body, isAsync });
  }
  function parseTry() {
    expect("WORD", "try");
    expect("OP", "{");
    const body = parseBlock();
    expect("OP", "}");
    let catchName = null, catchBody = null, finallyBody = null;
    if (at("WORD", "catch")) {
      eat();
      catchName = expect("WORD").value;
      expect("OP", "{");
      catchBody = parseBlock();
      expect("OP", "}");
    }
    if (at("WORD", "finally")) {
      eat();
      expect("OP", "{");
      finallyBody = parseBlock();
      expect("OP", "}");
    }
    if (!catchBody && !finallyBody) throw new Error("try: needs 'catch' or 'finally' at line " + peek().line);
    return node("Try", { body, catchName, catchBody, finallyBody });
  }
  function parseThrow() {
    expect("WORD", "throw");
    const value = parseExpression();
    if (at("OP", ";")) eat();
    return node("Throw", { value });
  }
  function parseBlock() {
    const stmts = [];
    while (!at("OP", "}") && !at("EOF")) {
      if (at("OP", ";")) { eat(); continue; }
      stmts.push(parseStatement());
    }
    return stmts;
  }
  function parseExpression() {
    let expr = parseOr();
    if (at("OP", "?")) {
      eat();
      const thenExpr = parseExpression();
      expect("OP", ":");
      const elseExpr = parseExpression();
      return node("Ternary", { cond: expr, then: thenExpr, else: elseExpr });
    }
    return expr;
  }
  function parseOr() {
    let l = parseAnd();
    while (at("OP", "||")) { const op = eat().value; l = node("Binary", { op, left:l, right:parseAnd() }); }
    return l;
  }
  function parseAnd() {
    let l = parseEquality();
    while (at("OP", "&&")) { const op = eat().value; l = node("Binary", { op, left:l, right:parseEquality() }); }
    return l;
  }
  function parseEquality() {
    let l = parseComparison();
    while (at("OP","==") || at("OP","!=")) { const op = eat().value; l = node("Binary", { op, left:l, right:parseComparison() }); }
    return l;
  }
  function parseComparison() {
    let l = parseTerm();
    while (at("OP","<")||at("OP",">")||at("OP","<=")||at("OP",">=")) {
      const op = eat().value; l = node("Binary", { op, left:l, right:parseTerm() });
    }
    return l;
  }
  function parseTerm() {
    let l = parseFactor();
    while (at("OP","+")||at("OP","-")) { const op = eat().value; l = node("Binary", { op, left:l, right:parseFactor() }); }
    return l;
  }
  function parseFactor() {
    let l = parseUnary();
    while (at("OP","*")||at("OP","/")||at("OP","%")) { const op = eat().value; l = node("Binary", { op, left:l, right:parseUnary() }); }
    return l;
  }
  function parseUnary() {
    if (at("OP","-")) { eat(); return node("Unary", { op:"-", expr:parseUnary() }); }
    if (at("WORD", "await")) {
  eat();
  return node("Await", { expr: parseUnary() });
}
    if (at("OP","!")) { eat(); return node("Unary", { op:"!", expr:parseUnary() }); }
    return parsePostfix();
  }
  function parsePostfix(baseExpr) {
    let e = baseExpr || parsePrimary();
    while (true) {
      if (at("OP","[")) {
        eat();
        const idx = parseExpression();
        expect("OP","]");
        e = node("Index", { obj:e, index:idx });
      } else if (at("OP","(")) {
        eat();
        const args = [];
        while (!at("OP",")")) { args.push(parseExpression()); if (at("OP",",")) eat(); else break; }
        expect("OP",")");
        e = node("Call", { callee:e, args });
      } else if (at("OP",".")) {
    eat();
    const prop = expect("WORD").value;
    if (at("OP", "(")) {
        eat();
        const args = [];
        while (!at("OP", ")")) { 
            args.push(parseExpression()); 
            if (at("OP", ",")) eat(); else break; 
        }
        expect("OP", ")");
        e = node("Call", { 
            callee: node("Ident", { name: prop }), 
            args: [e, ...args] 
        });
    } else {
        e = node("Member", { obj: e, prop });
    }
} else break;
    }
    return e;
  }
  function parsePrimary() {
    if (at("NUMBER")) return node("Number", { value: eat().value });
    if (at("STRING")) return node("String", { value: eat().value });
    if (at("TEMPLATE")) return node("Template", { value: eat().value });
    if (at("WORD","true"))  { eat(); return node("Bool", { value:true  }); }
    if (at("WORD","false")) { eat(); return node("Bool", { value:false }); }
    if (at("WORD", "undefined")) { eat(); return node("Undefined", {}); }
    if (at("WORD", "null"))      { eat(); return node("Null", {}); }
    if (at("WORD", "NaN"))       { eat(); return node("NaN", {}); }
    if (at("WORD", "typeof")) {
      eat();
      const expr = parseUnary();
      return node("TypeOf", { expr });
    }
    if (at("OP","(")) { eat(); const e = parseExpression(); expect("OP",")"); return e; }
    if (at("OP","[")) {
      eat();
      const el = [];
      while (!at("OP","]")) { el.push(parseExpression()); if (at("OP",",")) eat(); else break; }
      expect("OP","]");
      return node("Array", { elements:el });
    }
    if (at("OP", "{")) {
      eat();
      const properties = [];
      while (!at("OP", "}")) {
        const key = expect("WORD").value;
        expect("OP", ":");
        const value = parseExpression();
        properties.push({ key, value });
        if (at("OP", ",")) eat();
        else break;
      }
      expect("OP", "}");
      return node("Object", { properties });
    }
    if (at("WORD")) {
        let ident = node("Ident", { name: eat().value });
        return parsePostfix(ident);
    }
    throw new Error("Unexpected token: " + peek().value + " at line " + peek().line);
  }
  return parseProgram();
}
const FUNCS = {};
let TCS_PERMS = { 
  dom: false, storage: false, system: false, js: false, 
  dojs: false, jsfn: false, network: false, cfn: false, 
  blacklist: [] 
};
["log", "error", "warn", "time", "timeLog", "timeEnd"].forEach(m => {
    FUNCS["console_" + m] = (t) => {
        if (t === undefined && m.startsWith("time")) throw new Error("console_" + m + ": label is required");
        console[m](t);
        return 0;
    };
});
FUNCS.console_clear = function() { console.clear(); return 0; };
FUNCS.on = function(event, selector, handler) {
    const els = document.querySelectorAll(selector);
    if (els.length === 0) throw new Error("on: no matching element for '" + selector + "'");
    els.forEach(el => el.addEventListener(event, handler));
    return 0;
};
FUNCS.urlEncode = function(s) { if (typeof s !== "string") throw new Error("urlEncode: expected a string"); return encodeURIComponent(s); };
FUNCS.TCS_Tokenize = function(src) { if (typeof src !== "string") throw new Error("TCS_Tokenize: expected a string"); return tokenize(src); };
FUNCS.getInfo = function(key) { if (typeof tcs !== "undefined") return tcs[key] || "Unknown"; return "Unknown"; };
FUNCS.createElement = function(tagName) { if (typeof tagName !== "string") throw new Error("createElement: expected a string"); return document.createElement(tagName); };
FUNCS.upper = function(s) { return String(s).toUpperCase(); };
FUNCS.lower = function(s) { return String(s).toLowerCase(); };
FUNCS.trim = function(s) { return String(s).trim(); };
FUNCS.len = function(s) { return Array.isArray(s) ? s.length : String(s).length; };
FUNCS.sin = function(n) { return Math.sin(n); };
FUNCS.cos = function(n) { return Math.cos(n); };
FUNCS.tan = function(n) { return Math.tan(n); };
FUNCS.asin = function(n) { return Math.asin(n); };
FUNCS.acos = function(n) { return Math.acos(n); };
FUNCS.atan = function(n) { return Math.atan(n); };
FUNCS.atan2 = function(y, x) { return Math.atan2(y, x); };
FUNCS.log = function(n) { return Math.log(n); };
FUNCS.log10 = function(n) { return Math.log10(n); };
FUNCS.exp = function(n) { return Math.exp(n); };
FUNCS.cbrt = function(n) { return Math.cbrt(n); };
FUNCS.sign = function(n) { return Math.sign(n); };
FUNCS.trunc = function(n) { return Math.trunc(n); };
FUNCS.PI = Math.PI;
FUNCS.E = Math.E;
FUNCS.lerp = function(a, b, t) { return a + (b - a) * t; };
FUNCS.degToRad = function(deg) { return deg * (Math.PI / 180); };
FUNCS.radToDeg = function(rad) { return rad * (180 / Math.PI); };
FUNCS.hypot = function(x, y) { return Math.hypot(x, y); };
FUNCS.angleTo = function(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); };
FUNCS.moveTowards = function(current, target, maxDelta) { if (Math.abs(target - current) <= maxDelta) return target; return current + Math.sign(target - current) * maxDelta; };
FUNCS.wrap = function(value, min, max) { const range = max - min; return ((((value - min) % range) + range) % range) + min; };
FUNCS.notify = function(title, body) { if (!("Notification" in window)) throw new Error("notify: unsupported"); if (Notification.permission === "granted") { new Notification(title, { body: body || "" }); return 0; } if (Notification.permission !== "denied") { Notification.requestPermission().then(p => { if (p === "granted") new Notification(title, { body: body || "" }); }); return 0; } throw new Error("notify: permission denied"); };
FUNCS.getElementById = function(id) { return document.getElementById(id); };
FUNCS.ws_connect = function(url, onMsg, onOpen, onClose) { const ws = new WebSocket(url); const id = "ws_" + Math.random().toString(36).substr(2, 9); TCS_SOCKETS[id] = ws; ws.onopen = () => { if (onOpen && FUNCS[onOpen]) FUNCS[onOpen](id); }; ws.onmessage = (ev) => { if (onMsg && FUNCS[onMsg]) FUNCS[onMsg](ev.data, id); }; ws.onclose = () => { if (onClose && FUNCS[onClose]) FUNCS[onClose](id); delete TCS_SOCKETS[id]; }; return id; };
FUNCS.ws_send = function(id, msg) { const ws = TCS_SOCKETS[id]; if (!ws) throw new Error("ws_send: invalid socket"); if (ws.readyState !== WebSocket.OPEN) throw new Error("ws_send: not open"); ws.send(String(msg)); return 0; };
FUNCS.ws_close = function(id) { const ws = TCS_SOCKETS[id]; if (ws) { ws.close(); delete TCS_SOCKETS[id]; } return 0; };
FUNCS.charAt = function(s, i) { return String(s).charAt(i); };
FUNCS.includes = function(s, sub) { return String(s).includes(sub); };
FUNCS.replace = function(s, find, rep) { return String(s).split(find).join(rep); };
FUNCS.repeat = function(s, n) { return String(s).repeat(n); };
FUNCS.split = function(text, by) { return text.split(by); };
FUNCS.substring = function(str, start, end) { return str.substring(start, end); };
FUNCS.startsWith = function(str, prefix) { return str.startsWith(prefix); };
FUNCS.endsWith = function(str, suffix) { return str.endsWith(suffix); };
FUNCS.fullRand = function(num, digts, sh_be_str) { if(typeof num !== "number" || isNaN(num)) { throw new Error("fullRand: num is not an number"); } if(typeof digts !== "number" || isNaN(digts)) { throw new Error("fullRand: decmals is not an number"); } if(typeof sh_be_str !== "boolean") { throw new Error("fullRand: should_be_string is not an boolean"); } let m1 = String(Math.random() * num); let m2 = String(Math.floor(Math.random() * digts)); for(let L = 0; L <= m2; L++) { m1 += m2; m2 = String(Math.floor(Math.random() * digts)); } if(sh_be_str !== true) { return m1; } else { return Number(m1); } }
FUNCS.isNaN = function(num) { return isNaN(num); }
FUNCS.abs = function(n) { return Math.abs(n); };
FUNCS.min = function(...args) { return Math.min(...args); };
FUNCS.max = function(...args) { return Math.max(...args); };
FUNCS.floor = function(n) { return Math.floor(n); };
FUNCS.ceil = function(n) { return Math.ceil(n); };
FUNCS.round = function(n) { return Math.round(n); };
FUNCS.sqrt = function(n) { if (n < 0) throw new Error("sqrt: negative"); return Math.sqrt(n); };
FUNCS.pow = function(a, b) { return Math.pow(a, b); };
FUNCS.random = function() { return Math.random(); };
FUNCS.randomInt = function(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); };
FUNCS.randomNumber = function(min, max) { return Math.random() * (max - min + 1) + min; };
FUNCS.floorNum = function(n) { return Math.floor(n); };
FUNCS.toNum = function(val) { const n = Number(val); if (isNaN(n)) throw new Error("toNum: invalid"); return n; };
FUNCS.toStr = function(val) { if (val === undefined || val === null) return ""; return String(val); };
FUNCS.clamp = function(val, min, max) { return Math.min(Math.max(val, min), max); };
FUNCS.distance = function(x1, y1, x2, y2) { return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)); };
FUNCS.randomItem = function(arr) { return arr[Math.floor(Math.random() * arr.length)]; };
FUNCS.push = function(arr, item) { arr.push(item); return arr.length; };
FUNCS.pop = function(arr) { return arr.pop(); };
FUNCS.shift = function(arr) { return arr.shift(); };
FUNCS.unshift = function(arr, item) { arr.unshift(item); return arr.length; };
FUNCS.join = function(arr, sep) { return arr.join(sep !== undefined ? String(sep) : ","); };
FUNCS.reverse = function(arr) { return arr.reverse(); };
FUNCS.indexOf = function(target, item) { if (typeof target === "string") return target.indexOf(String(item)); return target.indexOf(item); };
FUNCS.lastIndexOf = function(target, item) { if (typeof target === "string") return target.lastIndexOf(String(item)); return target.lastIndexOf(item); };
FUNCS.clearArray = function(arr) { arr.length = 0; return 0; };
FUNCS.arrayContains = function(arr, item) { return arr.includes(item); };
FUNCS.contains = function(str, item) { return String(str).includes(item); };
FUNCS.splice = function(arr, start, del, ...items) { return Array.prototype.splice.call(arr, start, del, ...items); };
FUNCS.slice = function(arr, start, end) { return Array.prototype.slice.call(arr, start, end); };
FUNCS.typeOf = function(val) { if (val === null) return "null"; if (Array.isArray(val)) return "array"; return typeof val; };
FUNCS.regexTest = function(str, pat) { return new RegExp(pat).test(str); };
FUNCS.regexMatch = function(str, pat, ab) { const m = str.match(new RegExp(pat, ab)); return m ? m : []; };
FUNCS.regexReplace = function(str, pat, rep, ab) { return str.replace(new RegExp(pat, ab), rep); };
function validateURL(url, caller) { if (typeof url !== "string") throw new Error(caller + ": expected string"); return url; }
FUNCS.fetchText = async function(url) { validateURL(url, "fetchText"); try { const res = await fetch(url); if (!res.ok) throw new Error("HTTP " + res.status); return await res.text(); } catch (e) { throw new Error("fetchText failed: " + e.message); } };
FUNCS.fetchJSON = async function(url) { validateURL(url, "fetchJSON"); try { const res = await fetch(url); if (!res.ok) throw new Error("HTTP " + res.status); return await res.json(); } catch (e) { throw new Error("fetchJSON failed: " + e.message); } };
FUNCS.fetchVal = async function(url, val, opts) { validateURL(url, "fetchVal"); try { let fOpts = { method: "GET" }; if (opts) { if (opts.method) fOpts.method = opts.method; if (opts.headers) fOpts.headers = opts.headers; if (opts.body) fOpts.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body); } const res = await fetch(url, fOpts); if (!res.ok) throw new Error("HTTP " + res.status); return await res[val](); } catch (e) { throw new Error("fetchVal failed: " + e.message); } };
FUNCS.fetchTCSFn = async function(url) { validateURL(url, "fetchTCSFn"); try { const res = await fetch(url); if (!res.ok) throw new Error("HTTP " + res.status); const code = await res.text(); const result = await JITRunTCS(code, TCS_PERMS); if (!result.ok) throw new Error("TCS Import Error: " + result.error); return 0; } catch (e) { throw new Error("fetchTCSFn failed: " + e.message); } };
FUNCS.fetchFn = async function(url) { validateURL(url, "fetchFn"); return new Promise((resolve, reject) => { const s = document.createElement("script"); s.src = url; s.onload = () => resolve(0); s.onerror = () => reject(new Error("fetchFn: failed")); document.head.appendChild(s); }); };
FUNCS.XTHttpsRequest = function(method, url, body) { validateURL(url, "XTHttpsRequest"); return new Promise((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open(method || "GET", url, true); xhr.onload = function() { if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText); else reject(new Error("HTTP " + xhr.status)); }; xhr.onerror = function() { reject(new Error("Network Error")); }; if (body) xhr.send(body); else xhr.send(); }); };
FUNCS.saveData = function(key, value) { localStorage.setItem("tcs_" + key, String(value)); return 0; };
FUNCS.loadData = function(key) { const val = localStorage.getItem("tcs_" + key); return val === null ? "" : val; };
FUNCS.deleteData = function(key) { localStorage.removeItem("tcs_" + key); return 0; };
FUNCS.wipeAllCurrentWebsiteData = function() { localStorage.clear(); return 0; };
FUNCS.wipeTCSData = function() { const keys = Object.keys(localStorage); for (let i = 0; i < keys.length; i++) { if (keys[i].startsWith("tcs_")) localStorage.removeItem(keys[i]); } return 0; };
FUNCS.UUID = function() { return crypto.randomUUID(); };
FUNCS.now = function() { return Date.now(); };
FUNCS.getYear = function() { return new Date().getFullYear(); };
FUNCS.getMonth = function() { return new Date().getMonth() + 1; };
FUNCS.getDay = function() { return new Date().getDate(); };
FUNCS.getHours = function() { return new Date().getHours(); };
FUNCS.getFullDate = function() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0'); };
FUNCS.sleep = function(ms) { const start = Date.now(); while (Date.now() - start < ms) {} return 0; };
FUNCS.wait = function(ms) { return new Promise(resolve => setTimeout(resolve, ms)); };
FUNCS.setInterval = function(fnName, ms) { if (typeof FUNCS[fnName] === "function") { setInterval(() => { FUNCS[fnName](); }, ms); return 0; } throw new Error("setInterval: not a function"); };
FUNCS.query = function(selector) { return document.querySelector(selector); };
FUNCS.queryAll = function(selector) { return document.querySelectorAll(selector); };
FUNCS.setText = function(target, text) { const el = typeof target === "string" ? document.querySelector(target) : target; if (!el) throw new Error("setText: no match"); el.textContent = text; return 0; };
FUNCS.setHTML = function(target, html) { const el = typeof target === "string" ? document.querySelector(target) : target; if (!el) throw new Error("setHTML: no match"); el.innerHTML = html; return 0; };
FUNCS.getValue = function(target) { const el = typeof target === "string" ? document.querySelector(target) : target; if (!el) throw new Error("getValue: no match"); return el.value; };
FUNCS.setValue = function(target, text) { const el = typeof target === "string" ? document.querySelector(target) : target; if (!el) throw new Error("setValue: no match"); el.value = text; return 0; };
FUNCS.setStyle = function(target, prop, value) { const el = typeof target === "string" ? document.querySelector(target) : target; if (!el) throw new Error("setStyle: no match"); el.style[prop] = value; return 0; };
FUNCS.show = function(target) { const el = typeof target === "string" ? document.querySelector(target) : target; if (!el) throw new Error("show: no match"); el.style.display = ""; return 0; };
FUNCS.hide = function(target) { const el = typeof target === "string" ? document.querySelector(target) : target; if (!el) throw new Error("hide: no match"); el.style.display = "none"; return 0; };
FUNCS.changeBodyCSS = function(to) { document.body.style.cssText = to; return 0; };
FUNCS.currentCSS = function() { return document.body ? document.body.style.cssText : ""; };
FUNCS.changePageTitle = function(title) { document.title = title; return 0; };
FUNCS.getTitle = function() { return document.title; };
FUNCS.changeTitle = function(to) { document.title = to; return 0; };
FUNCS.getUserAgent = function() { return navigator.userAgent; };
FUNCS.getUserInfo = function() { const ua = navigator.userAgent; const os = navigator.platform; let browser = "Unknown"; if (ua.includes("Firefox")) browser = "Firefox"; else if (ua.includes("Edg")) browser = "Edge"; else if (ua.includes("Chrome")) browser = "Chrome"; else if (ua.includes("Safari")) browser = "Safari"; let device = "Desktop"; if (/Mobi|Android/i.test(ua)) device = "Mobile"; else if (/Tablet|iPad/i.test(ua)) device = "Tablet"; let screenSize = "Unknown"; if (typeof screen !== "undefined") screenSize = screen.width + "x" + screen.height; return "OS: " + os + " | Browser: " + browser + " | Device: " + device + " | Screen: " + screenSize; };
FUNCS.openLink = function(url) { window.open(url, "_blank"); return 0; };
FUNCS.reloadCurrentWebPage = function() { window.location.reload(); return 0; };
FUNCS.copyToClipboard = function(text) { navigator.clipboard.writeText(text); return 0; };
FUNCS.alert = function(msg) { window.alert(String(msg)); return 0; };
FUNCS.prompt = function(msg) { return window.prompt(String(msg)); };
FUNCS.confirm = function(msg) { return window.confirm(String(msg)); };
FUNCS.callJS = function(fnName, ...args) { if (!TCS_PERMS.js) throw new Error("Security Error: requires js permission"); if (fnName === "eval") return eval(args[0]); if (typeof window[fnName] === "function") return window[fnName](...args); throw new Error("callJS: not found"); };
FUNCS.javaScriptRunCodeAsText = function(text) { if (!TCS_PERMS.js) throw new Error("Security Error: requires js permission"); return eval(text); };
FUNCS.getGlobal = function(name) { if (typeof window[name] !== "undefined") return window[name]; return undefined; };
FUNCS.setGlobal = function(name, value) { window[name] = value; return 0; };
FUNCS.requstCurrentLoctationClosing = function() { window.close(); return 0; };
let _fb = { app: null, db: null, auth: null, rtdb: null, ready: false, mod: null, authMod: null, rtdbMod: null };
FUNCS.FBInit = async function(config, rtdbUrl) { try { const appMod = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"); const dbMod = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"); const authMod = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"); const rtdbMod = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js"); _fb.mod = dbMod; _fb.authMod = authMod; _fb.rtdbMod = rtdbMod; _fb.app = appMod.initializeApp(config); _fb.db = dbMod.getFirestore(_fb.app); _fb.auth = authMod.getAuth(_fb.app); if (rtdbUrl) _fb.rtdb = rtdbMod.getDatabase(_fb.app, rtdbUrl); _fb.ready = true; return 0; } catch (e) { throw new Error("FBInit failed: " + e.message); } };
FUNCS.FBAdd = async function(col, data) { const ref = await _fb.mod.addDoc(_fb.mod.collection(_fb.db, col), data); return ref.id; };
FUNCS.FBGet = async function(col, n) { const q = n ? _fb.mod.query(_fb.mod.collection(_fb.db, col), _fb.mod.limit(n)) : _fb.mod.collection(_fb.db, col); const snap = await _fb.mod.getDocs(q); const out = []; snap.forEach(d => out.push({ id: d.id, ...d.data() })); return out; };
FUNCS.FBWatch = function(col, cbName, n) { const q = n ? _fb.mod.query(_fb.mod.collection(_fb.db, col), _fb.mod.limit(n)) : _fb.mod.collection(_fb.db, col); return _fb.mod.onSnapshot(q, (snap) => { const out = []; snap.forEach(d => out.push({ id: d.id, ...d.data() })); const fn = FUNCS[cbName]; if (fn && fn.body) { const child = new Env(fn.closure); child.declare(fn.params[0], out); (async () => { for (const s of fn.body) await exec(s, child); })(); } }); };
FUNCS.FBUpdate = async function(col, id, data) { await _fb.mod.updateDoc(_fb.mod.doc(_fb.db, col, id), data); return 0; };
FUNCS.FBInc = async function(col, id, field, amt) { await _fb.mod.updateDoc(_fb.mod.doc(_fb.db, col, id), { [field]: _fb.mod.increment(amt || 1) }); return 0; };
FUNCS.FBDelete = async function(col, id) { await _fb.mod.deleteDoc(_fb.mod.doc(_fb.db, col, id)); return 0; };
FUNCS.FBQuery = async function(col, field, op, value, sortField, sortDir, max) { let constraints = []; if (field && op && value !== undefined) { let ops = { "==": "==", "!=": "!=", ">": ">", "<": "<", ">=": ">=", "<=": "<=", "array-contains": "array-contains", "in": "in", "not-in": "not-in" }; if (!ops[op]) throw new Error("FBQuery: unknown op"); constraints.push(_fb.mod.where(field, ops[op], value)); } if (sortField) constraints.push(_fb.mod.orderBy(sortField, sortDir === "desc" ? "desc" : "asc")); if (max) constraints.push(_fb.mod.limit(max)); const q = _fb.mod.query(_fb.mod.collection(_fb.db, col), ...constraints); const snap = await _fb.mod.getDocs(q); const out = []; snap.forEach(d => out.push({ id: d.id, ...d.data() })); return out; };
FUNCS.FBSignUp = async function(email, pass) { const user = await _fb.authMod.createUserWithEmailAndPassword(_fb.auth, email, pass); return user.user.uid; };
FUNCS.FBSignIn = async function(email, pass) { const user = await _fb.authMod.signInWithEmailAndPassword(_fb.auth, email, pass); return user.user.uid; };
FUNCS.FBAnon = async function() { const user = await _fb.authMod.signInAnonymously(_fb.auth); return user.user.uid; };
FUNCS.FBSignOut = async function() { await _fb.authMod.signOut(_fb.auth); return 0; };
FUNCS.FBUser = function() { if (!_fb.auth || !_fb.auth.currentUser) return null; return { uid: _fb.auth.currentUser.uid, email: _fb.auth.currentUser.email, anon: _fb.auth.currentUser.isAnonymous }; };
FUNCS.FBRtdbSet = async function(path, value) { await _fb.rtdbMod.set(_fb.rtdbMod.ref(_fb.rtdb, path), value); return 0; };
FUNCS.FBRtdbGet = async function(path) { const snap = await _fb.rtdbMod.get(_fb.rtdbMod.ref(_fb.rtdb, path)); return snap.exists() ? snap.val() : null; };
FUNCS.FBRtdbUpdate = async function(path, value) { await _fb.rtdbMod.update(_fb.rtdbMod.ref(_fb.rtdb, path), value); return 0; };
FUNCS.FBRtdbPush = async function(path, value) { const ref = _fb.rtdbMod.push(_fb.rtdbMod.ref(_fb.rtdb, path), value); return ref.key; };
FUNCS.FBRtdbDelete = async function(path) { await _fb.rtdbMod.remove(_fb.rtdbMod.ref(_fb.rtdb, path)); return 0; };
FUNCS.FBRtdbWatch = function(path, cbName) { _fb.rtdbMod.onValue(_fb.rtdbMod.ref(_fb.rtdb, path), (snap) => { const val = snap.exists() ? snap.val() : null; const fn = FUNCS[cbName]; if (fn && fn.body) { const child = new Env(fn.closure); child.declare(fn.params[0], val); (async () => { for (const s of fn.body) await exec(s, child); })(); } }); return 0; };
FUNCS.getCanvas = function(id) { const c = document.getElementById(id); return c.getContext("2d"); };
let _tcs3d = { scene: null, camera: null, renderer: null, objects: {}, clock: null, mixer: null, animations: {} };
FUNCS.load3D = async function(canvasId, bgColor) { if (typeof THREE === "undefined") { await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"; s.onload = res; s.onerror = () => rej(new Error("load3D: failed")); document.head.appendChild(s); }); } const canvas = document.getElementById(canvasId); _tcs3d.scene = new THREE.Scene(); _tcs3d.scene.background = new THREE.Color(bgColor || 0x111111); _tcs3d.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); _tcs3d.camera.position.set(0, 0, 5); _tcs3d.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); _tcs3d.renderer.setSize(window.innerWidth, window.innerHeight); _tcs3d.renderer.shadowMap.enabled = true; _tcs3d.clock = new THREE.Clock(); _tcs3d.mixer = new THREE.AnimationMixer(_tcs3d.scene); window.addEventListener("resize", () => { _tcs3d.camera.aspect = window.innerWidth / window.innerHeight; _tcs3d.camera.updateProjectionMatrix(); _tcs3d.renderer.setSize(window.innerWidth, window.innerHeight); }); return 0; };
FUNCS.add3D = function(type, id, x, y, z, a, b, c, color) { const mat = new THREE.MeshStandardMaterial({ color: color || 0x00ffcc }); let geo; if (type === "cube") geo = new THREE.BoxGeometry(a, b, c); else if (type === "sphere") geo = new THREE.SphereGeometry(a, 32, 32); else throw new Error("add3D: unknown type"); const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; _tcs3d.scene.add(mesh); _tcs3d.objects[id] = mesh; if (!_tcs3d.light) { _tcs3d.light = new THREE.DirectionalLight(0xffffff, 1); _tcs3d.light.position.set(5, 5, 5); _tcs3d.scene.add(_tcs3d.light); _tcs3d.scene.add(new THREE.AmbientLight(0x404040)); } return 0; };
FUNCS.run3D = function(id, rotX, rotY, rotZ) { if (id && _tcs3d.objects[id]) { const obj = _tcs3d.objects[id]; if (rotX) obj.rotation.x += rotX; if (rotY) obj.rotation.y += rotY; if (rotZ) obj.rotation.z += rotZ; if (_tcs3d.physics && _tcs3d.physics[id]) { const p = _tcs3d.physics[id]; p.velocityY += p.gravity; obj.position.y += p.velocityY; if (obj.position.y < 0) { obj.position.y = 0; p.velocityY = -p.velocityY * p.bounce; } } } _tcs3d.mixer.update(_tcs3d.clock.getDelta()); _tcs3d.renderer.render(_tcs3d.scene, _tcs3d.camera); return 0; };
FUNCS.loadModel3D = async function(id, url, x, y, z, scale) { const loader = new THREE.GLTFLoader(); return new Promise((res, rej) => { loader.load(url, (gltf) => { const model = gltf.scene; model.position.set(x, y, z); if (scale) model.scale.set(scale, scale, scale); model.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } }); _tcs3d.scene.add(model); _tcs3d.objects[id] = model; if (gltf.animations && gltf.animations.length > 0) { _tcs3d.animations[id] = _tcs3d.mixer.clipAction(gltf.animations[0]); _tcs3d.animations[id].play(); } res(0); }, undefined, (e) => rej(new Error("loadModel3D failed: " + e))); }); };
FUNCS.setTexture3D = function(id, url) { const textureLoader = new THREE.TextureLoader(); textureLoader.load(url, (texture) => { const mesh = _tcs3d.objects[id]; if (mesh.material) { mesh.material.map = texture; mesh.material.needsUpdate = true; } }); return 0; };
FUNCS.applyPhysics3D = function(id, gravity, bounce) { if (!_tcs3d.physics) _tcs3d.physics = {}; _tcs3d.physics[id] = { velocityY: 0, gravity: gravity || -0.01, bounce: bounce || 0.8 }; return 0; };
FUNCS.addLight3D = function(type, x, y, z, color, intensity) { let light; const col = new THREE.Color(color || 0xffffff); if (type === "point") light = new THREE.PointLight(col, intensity || 1); else if (type === "spot") light = new THREE.SpotLight(col, intensity || 1); else light = new THREE.DirectionalLight(col, intensity || 1); light.position.set(x, y, z); light.castShadow = true; _tcs3d.scene.add(light); return 0; };
FUNCS.addText3D = function(text, x, y, z, size, color) { const loader = new THREE.FontLoader(); loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) { const geometry = new THREE.TextGeometry(text, { font: font, size: size || 1, height: 0.2 }); const material = new THREE.MeshStandardMaterial({ color: color || 0xffffff }); const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); _tcs3d.scene.add(mesh); _tcs3d.objects["text_" + text] = mesh; }); return 0; };
FUNCS.evalTCSCond = function(condStr) { try { const tokens = tokenize(condStr); const ast = parse(tokens); if (!ast.body || ast.body.length === 0) throw new Error("Empty condition"); const expr = ast.body[0].expr || ast.body[0]; const env = new Env(); const result = evalExpr(expr, env); return Boolean(result); } catch (e) { throw new Error("evalTCSCond failed: " + e.message); } };
FUNCS.evalTCSMath = function(mathStr) { try { const tokens = tokenize(mathStr); const ast = parse(tokens); if (!ast.body || ast.body.length === 0) throw new Error("Empty math string"); const expr = ast.body[0].expr || ast.body[0]; function evalMath(node) { if (node.type === "Number") return node.value; if (node.type === "Binary") { const l = evalMath(node.left); const r = evalMath(node.right); switch (node.op) { case "+": return l + r; case "-": return l - r; case "*": return l * r; case "/": return Math.trunc(l / r); case "%": return l % r; default: throw new Error("Unsupported op"); } } if (node.type === "Unary") { const v = evalMath(node.expr); return node.op === "-" ? -v : !v; } if (node.type === "Call") { const fnName = node.callee.name; const args = node.args.map(evalMath); if (!FUNCS[fnName]) throw new Error("Unknown function: " + fnName); return FUNCS[fnName](...args); } throw new Error("Unsupported math node"); } const result = evalMath(expr); if (typeof result !== "number" || isNaN(result)) throw new Error("Invalid result"); return result; } catch (e) { throw new Error("evalTCSMath failed: " + e.message); } };
FUNCS.css = function(cssText) { const style = document.createElement("style"); style.type = "text/css"; style.appendChild(document.createTextNode(cssText)); document.head.appendChild(style); return 0; };
FUNCS.obj_keys = function(obj) { return Object.keys(obj); };
FUNCS.setCssText = function(el, cssTxt) {
  if(typeof cssTxt !== "string") throw new Error('setCssText: cssTxt must bs a string')
  el.style.cssText = cssTxt;
};
FUNCS.obj_values = function(obj) { return Object.values(obj); };
FUNCS.loadJavaScriptTCSFunction = function(url) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = url; s.onload = () => res(0); s.onerror = () => rej(new Error("loadJS failed")); document.head.appendChild(s); }); };
FUNCS.makeTag = function(tagName, renderFn) {
  if (typeof tagName !== "string") {
    throw new TypeError("makeTag: tag name must be a string");
  }
  const fn = typeof renderFn === "function" ?
    renderFn :
    FUNCS[renderFn];
  if (typeof fn !== "function") {
    throw new Error("makeTag: callback must be a function");
  }
  if (customElements.get(tagName)) {
    return 0;
  }
  class TCSLangTag extends HTMLElement {
    connectedCallback() {
      if (this.__tcsInitialized) return;
      this.__tcsInitialized = true;
      Promise.resolve(fn(this)).catch(error => {
        console.error("TCS+ Custom Element Error:", error);
      });
    }
  }
  customElements.define(tagName, TCSLangTag);
  return 0;
};
FUNCS.getTagContent = function(el) { return el.textContent || el.innerHTML || ""; };
FUNCS.JSON_stringify = function(obj) { return JSON.stringify(obj); };
FUNCS.JSON_parse = function(str) { return JSON.parse(str); };
FUNCS.fillRect = function(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); return 0; };
FUNCS.clearCanvas = function(ctx) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); return 0; };
FUNCS.saveJSON = function(key, value) { localStorage.setItem("tcs_" + key, JSON.stringify(value)); return 0; };
FUNCS.loadJSON = function(key) { const val = localStorage.getItem("tcs_" + key); if (val === null) return null; return JSON.parse(val); };
FUNCS.runHyperTextMarkupLanguage = function(html) { const c = document.createElement("div"); c.innerHTML = html; document.body.appendChild(c); return 0; };
FUNCS.runTCS = async function(code, perms) { const r = await JITRunTCS(code, perms || TCS_PERMS); if (!r.ok) throw new Error("runTCS Error: " + r.error); return 0; };
let currentAudio = null;
FUNCS.playAudio = function(url) { currentAudio = new Audio(url); currentAudio.play(); return 0; };
FUNCS.stopAudio = function() { if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; } return 0; };
FUNCS.setVolume = function(vol) { if (currentAudio) currentAudio.volume = Math.max(0, Math.min(1, vol)); return 0; };
FUNCS.getElementInputs = function(el, attrName) {
  if (el instanceof Element) {
    return el.getAttribute(attrName) || "";
  }
  if (el instanceof NodeList || Array.isArray(el)) {
    return Array.from(el).map(element =>
      element.getAttribute(attrName) || ""
    );
  }
  throw new TypeError(
    "getElementInputs: expected an Element or collection"
  );
};
FUNCS.getProp = function(target, prop) { const el = typeof target === "string" ? document.querySelector(target) : target; return el[prop]; };
FUNCS.setProp = function(target, prop, value) { const el = typeof target === "string" ? document.querySelector(target) : target; el[prop] = value; return 0; };
FUNCS.readFromLocalFileStorage = function(cbName) { const input = document.createElement("input"); input.type = "file"; input.onchange = (ev) => { const file = ev.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { const content = e.target.result; const fn = FUNCS[cbName]; if (fn && fn.body) { const child = new Env(fn.closure); child.declare(fn.params[0], content); child.declare(fn.params[1], file.name); (async () => { for (const s of fn.body) await exec(s, child); })(); } }; reader.readAsText(file); }; input.click(); return 0; };
FUNCS.saveToLocalFileStorage = function(content, mime, name) { const blob = new Blob([content], { type: mime }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); return 0; };
FUNCS.pauseAudio = function() { if (currentAudio) currentAudio.pause(); return 0; };
FUNCS.resumeAudio = function() { if (currentAudio) currentAudio.play(); return 0; };
function jitCompile(ast, TCS_PERMS) {
    let jsBody = "";
    let varCounter = 0;
    const scopeStack = [new Set()];
    function pushScope() { scopeStack.push(new Set()); }
    function popScope() { scopeStack.pop(); }
    function declare(name) { scopeStack[scopeStack.length - 1].add(name); }
    function isDeclared(name) {
        for (let i = scopeStack.length - 1; i >= 0; i--) {
            if (scopeStack[i].has(name)) return true;
        }
        return false;
    }
    function genExpr(node) {
        if (node.type === "Number") return String(node.value);
        if (node.type === "String") return JSON.stringify(node.value);
        if (node.type === "Bool") return String(node.value);
        if (node.type === "Null") return "null";
        if (node.type === "Undefined") return "undefined";
        if (node.type === "NaN") return "NaN";
        if (node.type === "Ident") {
            if (isDeclared(node.name)) return node.name;
            return `__globals[${JSON.stringify(node.name)}]`;
        }
        if (node.type === "Await") {
  return `(await ${genExpr(node.expr)})`;
}
        if (node.type === "Binary") {
            return `(${genExpr(node.left)} ${node.op} ${genExpr(node.right)})`;
        }
        if (node.type === "Unary") {
            return `(${node.op}${genExpr(node.expr)})`;
        }
        if (node.type === "Ternary") {
            return `(${genExpr(node.cond)} ? ${genExpr(node.then)} : ${genExpr(node.else)})`;
        }
        if (node.type === "Array") {
            return `[${node.elements.map(genExpr).join(", ")}]`;
        }
        if (node.type === "Object") {
            return `{${node.properties.map(p => `${JSON.stringify(p.key)}: ${genExpr(p.value)}`).join(", ")}}`;
        }
        if (node.type === "Index") {
            return `${genExpr(node.obj)}[${genExpr(node.index)}]`;
        }
        if (node.type === "Member") {
            return `${genExpr(node.obj)}.${node.prop}`;
        }
        if (node.type === "Call") {
    const name = node.callee.name;
    const args = node.args.map(genExpr).join(", ");
    const mathInlines = {
        "sin": "Math.sin", "cos": "Math.cos", "tan": "Math.tan",
        "asin": "Math.asin", "acos": "Math.acos", "atan": "Math.atan",
        "atan2": "Math.atan2", "sqrt": "Math.sqrt", "cbrt": "Math.cbrt",
        "abs": "Math.abs", "floor": "Math.floor", "ceil": "Math.ceil",
        "round": "Math.round", "pow": "Math.pow", "min": "Math.min",
        "max": "Math.max", "random": "Math.random", "exp": "Math.exp",
        "log": "Math.log", "log10": "Math.log10", "sign": "Math.sign",
        "trunc": "Math.trunc", "hypot": "Math.hypot"
    };
    if (mathInlines[name]) {
        return `${mathInlines[name]}(${args})`;
    }
    if (name === "console_log") return `console.log(${args})`;
    if (name === "console_error") return `console.error(${args})`;
    if (name === "console_warn") return `console.warn(${args})`;
    if (name && TCS_PERMS.blacklist.includes(name)) throw new Error("Security Error: '" + name + "' blocked.");
    if (name && needsNetwork.includes(name) && !TCS_PERMS.network) throw new Error("Security Error: '" + name + "' requires Network permission.");
    if (name && needsDOM.includes(name) && !TCS_PERMS.dom) throw new Error("Security Error: '" + name + "' requires DOM permission.");
    if (name && needsStorage.includes(name) && !TCS_PERMS.storage) throw new Error("Security Error: '" + name + "' requires Storage permission.");
    if (name && needsSystem.includes(name) && !TCS_PERMS.system) throw new Error("Security Error: '" + name + "' requires System permission.");
    if (name && js.includes(name) && !TCS_PERMS.js) throw new Error("Security Error: '" + name + "' requires JavaScript (js) permission.");
    const asyncFuncs = ["fetchJSON", "fetchText", "fetchVal", "fetchFn", "wait", "FBGet", "FBAdd", "FBInit", "FBSignUp", "FBSignIn"];
    if (asyncFuncs.includes(name)) {
        return `await __funcs[${JSON.stringify(name)}](${args})`;
    }
    return `__funcs[${JSON.stringify(name)}](${args})`;
}
        if (node.type === "Template") {
            const parts = node.value.split(/\$\{([^}]+)\}/);
            let result = "`";
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 0) result += parts[i];
                else result += "${" + genExpr(parse(tokenize(parts[i])).body[0].expr) + "}";
            }
            return result + "`";
        }
        if (node.type === "TypeOf") {
            return `typeof ${genExpr(node.expr)}`;
        }
        throw new Error("JIT: unsupported expression " + node.type);
    }
    function genStmt(node) {
        if (node.type === "Let") {
            declare(node.name);
            return `let ${node.name} = ${genExpr(node.value)};\n`;
        }
        if (node.type === "Await") {
  return `await ${genExpr(node.expr)};\n`;
}
        if (node.type === "Set") {
            return `${node.name} = ${genExpr(node.value)};\n`;
        }
        if (node.type === "SetMember") {
            return `${genExpr(node.obj)}.${node.prop} = ${genExpr(node.value)};\n`;
        }
        if (node.type === "SetIndex") {
            return `${genExpr(node.obj)}[${genExpr(node.index)}] = ${genExpr(node.value)};\n`;
        }
        if (node.type === "ExprStmt") {
            return `${genExpr(node.expr)};\n`;
        }
        if (node.type === "Await") {
    return `await ${genExpr(node.expr)}`;
}
if (node.type === "New") {
  return `new ${genExpr(node.Thing)}`;
}
        if (node.type === "If") {
            let code = `if (${genExpr(node.cond)}) {\n`;
            pushScope();
            for (const s of node.then) code += genStmt(s);
            popScope();
            code += `}\n`;
            if (node.otherwise) {
                code += `else {\n`;
                pushScope();
                for (const s of node.otherwise) code += genStmt(s);
                popScope();
                code += `}\n`;
            }
            return code;
        }
        if (node.type === "While") {
            let code = `while (${genExpr(node.cond)}) {\n`;
            pushScope();
            for (const s of node.body) code += genStmt(s);
            popScope();
            code += `}\n`;
            return code;
        }
if (node.type === "For") {
    const name = node.name;
    const op   = node.op || "<";
    const step = node.UOD === "--" ? "__i--" : "__i++";
    let code = `for (let __i = 0; __i ${op} ${genExpr(node.end)}; ${step}) {\n`;
    pushScope();
    declare(name);
    code += `let ${name} = __i;\n`;
    for (const s of node.body) code += genStmt(s);
    code += `__i = ${name};\n`; 
    popScope();
    code += `}\n`;
    return code;
}
     if (node.type === "Fn") {
    const name = node.name;
    declare(name);
    let code = "";
    if (node.isAsync === true) {
        code = `async function ${name}(${node.params.join(", ")}) {\n`;
    } else {
        code = `function ${name}(${node.params.join(", ")}) {\n`;
    }
    pushScope();
    for (const p of node.params) declare(p);
    for (const s of node.body) {
        code += genStmt(s);
    }
    popScope();
    code += `}\n`;
    code += `__funcs[${JSON.stringify(name)}] = ${name};\n`;
    return code;
}
        if (node.type === "Return") {
            return `return ${node.value ? genExpr(node.value) : "0"};\n`;
        }
        if (node.type === "Break") return `break;\n`;
        if (node.type === "Continue") return `continue;\n`;
        if (node.type === "Throw") {
            return `throw ${genExpr(node.value)};\n`;
        }
        if (node.type === "Try") {
            let code = `try {\n`;
            pushScope();
            for (const s of node.body) code += genStmt(s);
            popScope();
            code += `}\n`;
            if (node.catchBody) {
                code += `catch (__err) {\n`;
                pushScope();
                declare(node.catchName);
                code += `let ${node.catchName} = __err;\n`;
                for (const s of node.catchBody) code += genStmt(s);
                popScope();
                code += `}\n`;
            }
            if (node.finallyBody) {
                code += `finally {\n`;
                pushScope();
                for (const s of node.finallyBody) code += genStmt(s);
                popScope();
                code += `}\n`;
            }
            return code;
        }
        if (node.type === "Switch") {
            let code = `switch (${genExpr(node.expr)}) {\n`;
            for (const c of node.cases) {
                code += `case ${genExpr(c.val)}:\n`;
                pushScope();
                for (const s of c.body) code += genStmt(s);
                popScope();
                code += `break;\n`;
            }
            if (node.defaultCase) {
                code += `default:\n`;
                pushScope();
                for (const s of node.defaultCase) code += genStmt(s);
                popScope();
            }
            code += `}\n`;
            return code;
        }
        if (node.type === "Match") {
            let code = `let __match_${varCounter} = ${genExpr(node.expr)};\n`;
            let first = true;
            for (const c of node.cases) {
                code += `${first ? "if" : "else if"} (${genExpr(c.cond)}) {\n`;
                pushScope();
                for (const s of c.body) code += genStmt(s);
                popScope();
                code += `}\n`;
                first = false;
            }
            if (node.noMatch) {
                code += `else {\nthrow ${genExpr(node.noMatch)};\n}\n`;
            }
            varCounter++;
            return code;
        }
        if (node.type === "On") {
            let code = `await __funcs.on(${JSON.stringify(node.event)}, ${JSON.stringify(node.selector)}, async function() {\n`;
            pushScope();
            for (const s of node.body) code += genStmt(s);
            popScope();
            code += `});\n`;
            return code;
        }
        throw new Error("JIT: unsupported statement " + node.type);
    }
    for (const node of ast.body) {
        if (node.type === "Program") {
            for (const s of node.body) jsBody += genStmt(s);
        } else {
            jsBody += genStmt(node);
        }
    }
    return jsBody;
}
async function RunTCSP(code, perms = {}) {
    TCS_PERMS = {
        dom: perms.dom === true,
        storage: perms.storage === true,
        system: perms.system === true,
        js: perms.js === true,
        dojs: perms.dojs === true,
        jsfn: perms.jsfn === true,
        network: perms.network === true,
        cfn: perms.cfn === true,
        blacklist: perms.blacklist || []
    };
    const capturedOutput = [];
    const originalLog = FUNCS.console_log;
    FUNCS.console_log = function(val) {
        capturedOutput.push(val);
        return originalLog(val);
    };
    try {
        const tokens = tokenize(code);
        const ast = parse(tokens);
        const jsCode = jitCompile(ast, TCS_PERMS);
        const fn = new Function("__funcs", "__globals",
            "return (async function() {\n" + jsCode + "\n})();"
        );
        const __globals = {
            console_log: FUNCS.console_log,
            console_error: FUNCS.console_error,
            PI: Math.PI,
            E: Math.E
        };
        await fn(FUNCS, __globals);
        return { ok: true, error: null, output: capturedOutput };
    } catch (e) {
        return { ok: false, error: e.message, output: capturedOutput };
    } finally {
        FUNCS.console_log = originalLog;
    }
}
if (typeof window !== "undefined") {
  window.JITRunTCS = RunTCSP;
  window.FUNCS = FUNCS;
  window.tokenize = tokenize;
  window.parse = parse;
  window.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('script[type="text/tcsp"]').forEach(script => {
      RunTCSP(script.textContent, { dom: true, storage: true, system: true, js: true, network: true }).then(result => {
        if (!result.ok) console.error("TCS+ Script Error:", result.error);
      });
    });
    if (!customElements.get("tcsp-run")) {
      class TCSPElement extends HTMLElement {
  async connectedCallback() {
    if (this.dataset.ran) return;
    this.dataset.ran = "true";
    let code = "";
    const src = this.getAttribute("src");
    const template = this.querySelector("template");
    const perms = (this.getAttribute("perms") || "").split('/')
    const __blacklist = (this.getAttribute("blacklist") || "").split('/')
    try {
      if (src) {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }
        code = await response.text();
      } else if (template) {
        code = template.innerHTML;
      } else {
        code = this.textContent;
      }
      this.innerHTML = "";
      let options = {
        dom: perms.includes("dom"),
        network: perms.includes("network"),
        dojs: perms.includes("dojs"),
        jsfn: perms.includes("jsfn"),
        system: perms.includes("system"),
        storage: perms.includes("storage"),
        blacklist: __blacklist
      };
const result = await RunTCSP(code, options);
      if (!result.ok) {
        console.error("TCS+ Tag Error:", result.error);
      }
    } catch (error) {
      console.error("TCS+ Tag Error:", error);
    }
  }
}
      customElements.define("tcs-run", TCSPElement);
      setTimeout(() => {
        document.querySelectorAll("tcs-run").forEach(el => {
          if (!el.dataset.ran && el.connectedCallback) el.connectedCallback();
        });
      }, 10);
    }
 function registerTCSP() {
  if (customElements.get("tcs-run")) return;
  customElements.define("tcs-run", TCSPElement);
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", registerTCSP);
} else {
  registerTCSP();
}
  });
}