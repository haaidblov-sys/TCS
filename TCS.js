const TCS_VERSION = "6.9.2";
const TCS_SERIES  = "8";
const TCS_BUILD   = "17";

const needsDOM = [
  "changeBodyCSS", "query", "queryAll", "setText", "setHTML", "setValue", "setStyle", 
  "show", "hide", "changePageTitle", "runHyperTextMarkupLanguage", "getValue", "changeTitle", 
  "openLink", "reloadPage", "copyToClipboard", "requstCurrentLoctationClosing", "makeTag", "getTagContent"
];
const needsStorage = ["saveData", "loadData", "deleteData", "wipeAllCurrentWebsiteData", "wipeTCSData"];
const needsSystem = [
  "getUserAgent", "getUserInfo", "now", "getYear", "getMonth", "getDay", 
  "getHours", "sleep", "wait", "alert", "prompt", "confirm", "getFullDate", "saveToLocalFileStorage", "updateToLocalFileStorage",
  "readFromLocalFileStorage"
];
const needsNetwork = [
  "fetchText", "fetchFn", "fetchTCSFn", "XTHttpsRequest", "fetchJSON", 
  "ws_connect", "ws_send", "ws_close", "loadJavaScriptTCSFunction"
];
const js = ["callJS", "javaScriptRunCodeAsText"];
const needsCFN = [];

const tcs = {
  version: "TCS_JS_" + TCS_SERIES,
  full_version: TCS_VERSION,
  license: "MIT",
  js: "JavaScript Eruda E2026",
  interpreter: "AST",
  build: TCS_BUILD,
  info: "TCS_JS_" + TCS_SERIES + "/JS_Eruda/JS_E2026/MIT" + "/B_" + TCS_BUILD + "/V_" + TCS_SERIES + "/FV_" + TCS_VERSION + "/AST"
};

function tokenize(src) {
  src = src.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"); 
  const tokens = [];
  let i = 0;
  let line = 1;
  const isDigit = c => c >= '0' && c <= '9';
  const isAlpha = c => /[a-zA-Z_]/.test(c);
  const isAlphaNum = c => isAlpha(c) || isDigit(c);
  
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { 
      if (c === '\n') line++;
      i++; continue; 
    }

    if (c === '/' && src[i+1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }

    if (c === '"') {
      i++;
      let s = "";
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\' && i + 1 < src.length) {
          const next = src[i + 1];
          if (next === '"')  { s += '"';  i += 2; continue; }
          if (next === "'")  { s += "'";  i += 2; continue; }
          if (next === '/')  { s += '/';  i += 2; continue; } 
          if (next === 'n')  { s += '\n'; i += 2; continue; }
          if (next === 't')  { s += '\t'; i += 2; continue; }
          if (next === 'r')  { s += '\r'; i += 2; continue; }
          if (next === '0')  { s += '\0'; i += 2; continue; }
          if (next === '\\') { s += '\\'; i += 2; continue; }
        }
        if (src[i] === '\n') line++;
        s += src[i++];
      }
      if (i >= src.length) throw new Error("Unterminated string literal at line " + line);
      i++;
      tokens.push({ type: "STRING", value: s, line: line });
      continue;
    }

    if (c === "'") {
      i++;
      let s = "";
      while (i < src.length && src[i] !== "'") {
        if (src[i] === '\\' && i + 1 < src.length) {
          const next = src[i + 1];
          if (next === "'")  { s += "'";  i += 2; continue; }
          if (next === '"')  { s += '"';  i += 2; continue; }
          if (next === '/')  { s += '/';  i += 2; continue; }  
          if (next === 'n')  { s += '\n'; i += 2; continue; }
          if (next === 't')  { s += '\t'; i += 2; continue; }
          if (next === 'r')  { s += '\r'; i += 2; continue; }
          if (next === '0')  { s += '\0'; i += 2; continue; }
          if (next === '\\') { s += '\\'; i += 2; continue; }
        }
        if (src[i] === '\n') line++;
        s += src[i++];
      }
      if (i >= src.length) throw new Error("Unterminated single-quoted string at line " + line);
      i++;
      tokens.push({ type: "STRING", value: s, line: line });
      continue;
    }

    if (c === '`') {
      i++;
      let s = "";
      while (i < src.length && src[i] !== '`') {
        if (src[i] === '\\' && i + 1 < src.length) {
          const next = src[i+1];
          if (next === '`')  { s += '`';  i += 2; continue; }
          if (next === '$')  { s += '$';  i += 2; continue; }
          if (next === 'n')  { s += '\n'; i += 2; continue; }
          if (next === 't')  { s += '\t'; i += 2; continue; }
          if (next === '\\') { s += '\\'; i += 2; continue; }
        }
        if (src[i] === '\n') { s += '\n'; line++; }
        else s += src[i];
        i++;
      }
      i++;
      tokens.push({ type: "TEMPLATE", value: s, line: line });
      continue;
    }

    if (isDigit(c)) {
      let n = "";
      while (i < src.length && isDigit(src[i])) n += src[i++];
      tokens.push({ type: "NUMBER", value: parseInt(n, 10), line: line });
      continue;
    }

    if (isAlpha(c)) {
      let w = "";
      while (i < src.length && isAlphaNum(src[i])) w += src[i++];
      tokens.push({ type: "WORD", value: w, line: line });
      continue;
    }

    const two = src.substr(i, 2);
    if (["==", "!=", "<=", ">=", "&&", "||", ".."].includes(two)) {
      tokens.push({ type: "OP", value: two, line: line });
      i += 2;
      continue;
    }

    if ("+-*/%<>()[]{},;.!?:=".includes(c)) {
      tokens.push({ type: "OP", value: c, line: line });
      i++;
      continue;
    }
    throw new Error("Unexpected character: " + c + " at line " + line);
  }
  tokens.push({ type: "EOF", line: line });
  return tokens;
}

function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos] || { type: "EOF", line: 0 };
  const at = (t, v) => peek().type === t && (v === undefined || peek().value === v);
  const eat = () => tokens[pos++];
  const expect = (t, v) => {
    if (!at(t, v)) throw new Error("Expected " + (v || t) + ", got '" + peek().value + "' at line " + peek().line);
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
    if (at("WORD", "import")) return parseImport();
    if (at("WORD", "if"))  return parseIf();
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
    if (at("WORD", "fn"))  return parseFn();
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
    if (at("WORD", "int") || at("WORD", "string") || at("WORD", "boolean")) {
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
    expect("WORD", "in");
    const start = parseExpression();
    expect("OP", "..");
    const end = parseExpression();
    expect("OP", "{");
    const body = parseBlock();
    expect("OP", "}");
    return node("For", { name, start, end, body });
  }

  function parseFn() {
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
    return node("Fn", { name, params, body });
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
        e = node("Member", { obj:e, prop });
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

class Env {
  constructor(parent=null) { 
    this.vars = new Map(); 
    this.consts = new Set();
    this.parent = parent; 
  }
  
  get(n) {
    if (this.vars.has(n)) return this.vars.get(n);
    if (this.parent) return this.parent.get(n);
    throw new Error("'" + n + "' is not defined");
  }
  
  has(n) {
    if (this.vars.has(n)) return true;
    if (this.parent) return this.parent.has(n);
    return false;
  }
  
  declare(n, v, isConst) {
    if (this.vars.has(n)) throw new Error("'" + n + "' already declared");
    this.vars.set(n, v);
    if (isConst) this.consts.add(n);
  }
  
  set(n, v) {
    if (this.consts.has(n)) throw new Error("Cannot reassign constant '" + n + "'");
    if (this.vars.has(n)) { this.vars.set(n, v); return; }
    if (this.parent) { this.parent.set(n, v); return; }
    throw new Error("'" + n + "' not declared");
  }
}

const FUNCS = {};
let TCS_PERMS = { dom: false, storage: false, system: false, js: false, network: false, cfn: false, blacklist: [] };
const TCS_SOCKETS = {};

FUNCS.console_log = function(text) { console.log(text); return 0; };
FUNCS.console_error = function(text) { console.error(text); return 0; };
FUNCS.console_warn = function(text) { console.warn(text); return 0; };
FUNCS.console_time = function(label) { console.time(label); return 0; };
FUNCS.urlEncode = function(s) {
    if (typeof s !== "string") throw new Error("urlEncode: expected a string");
    return encodeURIComponent(s);
};
FUNCS.console_timeEnd = function(label) {
    if (typeof label !== "string") throw new Error("console_timeEnd: label must be a string");
    console.timeEnd(label); return 0;
};
FUNCS.console_timeLog = function(label) {
    if (typeof label !== "string") throw new Error("console_timeLog: label must be a string");
    console.timeLog(label); return 0;
};
FUNCS.console_clear = function() { console.clear(); return 0; };

FUNCS.getInfo = function(key) {
    if (key === undefined) throw new Error("getInfo: key is not defined");
    if (typeof key !== "string") throw new Error("getInfo: key is not a string");
    if (typeof TCS_BC_INFO !== "undefined") return TCS_BC_INFO[key] || "Unknown";
    if (typeof tcs !== "undefined") return tcs[key] || "Unknown";
    return "Unknown";
};

FUNCS.upper = function(s) {
    if (s === undefined || s === null) throw new Error("upper: expected a string");
    return String(s).toUpperCase();
};
FUNCS.lower = function(s) {
    if (s === undefined || s === null) throw new Error("lower: expected a string");
    return String(s).toLowerCase();
};
FUNCS.trim = function(s) {
    if (s === undefined || s === null) throw new Error("trim: expected a string");
    return String(s).trim();
};
FUNCS.len = function(s) {
    if (s === undefined || s === null) throw new Error("len: expected a string or array");
    return Array.isArray(s) ? s.length : String(s).length;
};

FUNCS.ws_connect = function(url, onMessageFnName, onOpenFnName, onCloseFnName) {
    if (typeof url !== "string") throw new Error("ws_connect: URL must be a string");
    const ws = new WebSocket(url);
    const id = "ws_" + Math.random().toString(36).substr(2, 9);
    TCS_SOCKETS[id] = ws;
    ws.onopen = () => {
        if (onOpenFnName && FUNCS[onOpenFnName]) FUNCS[onOpenFnName](id);
    };
    ws.onmessage = (event) => {
        if (onMessageFnName && FUNCS[onMessageFnName]) FUNCS[onMessageFnName](event.data, id);
    };
    ws.onclose = () => {
        if (onCloseFnName && FUNCS[onCloseFnName]) FUNCS[onCloseFnName](id);
        delete TCS_SOCKETS[id]; 
    };
    return id;
};

FUNCS.ws_send = function(id, message) {
    const ws = TCS_SOCKETS[id];
    if (!ws) throw new Error("ws_send: invalid or closed socket ID");
    if (ws.readyState !== WebSocket.OPEN) throw new Error("ws_send: socket is not open");
    ws.send(String(message));
    return 0;
};

FUNCS.ws_close = function(id) {
    const ws = TCS_SOCKETS[id];
    if (ws) {
        ws.close();
        delete TCS_SOCKETS[id];
    }
    return 0;
};
FUNCS.charAt = function(s, i) {
    if (s === undefined || s === null) throw new Error("charAt: expected a string");
    if (typeof i !== "number") throw new Error("charAt: index must be a number");
    return String(s).charAt(i);
};
FUNCS.includes = function(s, sub) {
    if (s === undefined || s === null) throw new Error("includes: expected a string");
    if (typeof sub !== "string") throw new Error("includes: substring must be a string");
    return String(s).includes(sub);
};
FUNCS.replace = function(s, find, rep) {
    if (s === undefined || s === null) throw new Error("replace: expected a string");
    if (typeof find !== "string") throw new Error("replace: find must be a string");
    if (typeof rep !== "string") throw new Error("replace: replacement must be a string");
    return String(s).split(find).join(rep);
};
FUNCS.repeat = function(s, n) {
    if (s === undefined || s === null) throw new Error("repeat: expected a string");
    if (typeof n !== "number" || n < 0) throw new Error("repeat: count must be a non-negative number");
    return String(s).repeat(n);
};
FUNCS.updateToLocalFileStorage = async function(content, fileName) {
    if (typeof content !== "string") throw new Error("updateToLocalFileStorage: content must be a string");
    if (!window.showSaveFilePicker) {
        throw new Error("updateToLocalFileStorage: File System Access API not supported in this browser");
    }
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: fileName || "tcs_file.txt",
            types: [{
                description: "Text Files",
                accept: { "text/plain": [".txt", ".json", ".csv", ".html", ".tcs", ".cts", ".ctcs", ".js" ] }
            }]
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return 0;
    } catch (err) {
        throw new Error("updateToLocalFileStorage: " + err.message);
    }
};
FUNCS.split = function(text, by) {
    if (typeof text !== "string") throw new Error("split: expected a string, got " + typeof text);
    if (typeof by !== "string") throw new Error("split: separator must be a string");
    return text.split(by);
};
FUNCS.substring = function(str, start, end) {
    if (typeof str !== "string") throw new Error("substring: expected a string");
    if (typeof start !== "number") throw new Error("substring: start must be a number");
    if (end !== undefined && typeof end !== "number") throw new Error("substring: end must be a number");
    return str.substring(start, end);
};
FUNCS.startsWith = function(str, prefix) {
    if (typeof str !== "string") throw new Error("startsWith: expected a string");
    if (typeof prefix !== "string") throw new Error("startsWith: prefix must be a string");
    return str.startsWith(prefix);
};
FUNCS.endsWith = function(str, suffix) {
    if (typeof str !== "string") throw new Error("endsWith: expected a string");
    if (typeof suffix !== "string") throw new Error("endsWith: suffix must be a string");
    return str.endsWith(suffix);
};

FUNCS.abs = function(n) {
    if (typeof n !== "number") throw new Error("abs: expected a number");
    return Math.abs(n);
};
FUNCS.min = function(...args) {
    if (args.length === 0) throw new Error("min: needs at least one argument");
    for (const a of args) if (typeof a !== "number") throw new Error("min: all args must be numbers");
    return Math.min(...args);
};
FUNCS.max = function(...args) {
    if (args.length === 0) throw new Error("max: needs at least one argument");
    for (const a of args) if (typeof a !== "number") throw new Error("max: all args must be numbers");
    return Math.max(...args);
};
FUNCS.floor = function(n) {
    if (typeof n !== "number") throw new Error("floor: expected a number");
    return Math.floor(n);
};
FUNCS.ceil = function(n) {
    if (typeof n !== "number") throw new Error("ceil: expected a number");
    return Math.ceil(n);
};
FUNCS.round = function(n) {
    if (typeof n !== "number") throw new Error("round: expected a number");
    return Math.round(n);
};
FUNCS.sqrt = function(n) {
    if (typeof n !== "number") throw new Error("sqrt: expected a number");
    if (n < 0) throw new Error("sqrt: cannot take sqrt of negative number");
    return Math.sqrt(n);
};
FUNCS.pow = function(a, b) {
    if (typeof a !== "number" || typeof b !== "number") throw new Error("pow: both args must be numbers");
    return Math.pow(a, b);
};
FUNCS.random = function() { return Math.random(); };
FUNCS.randomInt = function(min, max) {
    if (typeof min !== "number" || typeof max !== "number") throw new Error("randomInt: min and max must be numbers");
    if (min > max) throw new Error("randomInt: min must be <= max");
    return Math.random() * (max - min + 1) + min;
};
FUNCS.floorNum = function(num) {
    if(typeof num !== "number") throw new Error("floorNum: arg must be number");
    return Math.floor(num);	
};
FUNCS.toNum = function(val) {
    if (val === null || val === undefined) throw new Error("toNum: cannot convert null/undefined");
    if (typeof val === "number") return val;
    const num = Number(val);
    if (isNaN(num)) throw new Error("toNum: '" + val + "' is not a valid number");
    return num;
};
FUNCS.clamp = function(val, min, max) {
    if (typeof val !== "number" || typeof min !== "number" || typeof max !== "number")
        throw new Error("clamp: all args must be numbers");
    if (min > max) throw new Error("clamp: min must be <= max");
    return Math.min(Math.max(val, min), max);
};
FUNCS.distance = function(x1, y1, x2, y2) {
    if ([x1, y1, x2, y2].some(v => typeof v !== "number"))
        throw new Error("distance: all args must be numbers");
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};
FUNCS.randomItem = function(arr) {
    if (!Array.isArray(arr)) throw new Error("randomItem: expected array");
    if (arr.length === 0) throw new Error("randomItem: array is empty");
    return arr[Math.floor(Math.random() * arr.length)];
};

FUNCS.push = function(arr, item) {
    if (!Array.isArray(arr)) throw new Error("push: expected array");
    arr.push(item);
    return arr.length;
};
FUNCS.pop = function(arr) {
    if (!Array.isArray(arr)) throw new Error("pop: expected array");
    return arr.pop();
};
FUNCS.shift = function(arr) {
    if (!Array.isArray(arr)) throw new Error("shift: expected array");
    return arr.shift();
};
FUNCS.unshift = function(arr, item) {
    if (!Array.isArray(arr)) throw new Error("unshift: expected array");
    arr.unshift(item);
    return arr.length;
};
FUNCS.join = function(arr, sep) {
    if (!Array.isArray(arr)) throw new Error("join: expected array");
    return arr.join(sep !== undefined ? String(sep) : ",");
};
FUNCS.reverse = function(arr) {
    if (!Array.isArray(arr)) throw new Error("reverse: expected array");
    return arr.reverse();
};
FUNCS.indexOf = function(target, item) {
    if (typeof target === "string") {
        return target.indexOf(String(item));
    }
    if (Array.isArray(target)) {
        return target.indexOf(item);
    }
    throw new Error("indexOf: expected a string or array");
};
FUNCS.lastIndexOf = function(target, item) {
    if (typeof target === "string") {
        return target.lastIndexOf(String(item));
    }
    if (Array.isArray(target)) {
        return target.lastIndexOf(item);
    }
    throw new Error("lastIndexOf: expected a string or array");
};
FUNCS.clearArray = function(arr) {
    if (!Array.isArray(arr)) throw new Error("clearArray: expected array");
    arr.length = 0;
    return 0;
};
FUNCS.arrayContains = function(arr, item) {
    if (!Array.isArray(arr)) throw new Error("arrayContains: expected array");
    return arr.includes(item);
};
FUNCS.contains = function(str, item) {
    if (!typeof str === "string") throw new Error("contains: expected string");
    return str.includes(item);
};
FUNCS.splice = function(arr, start, deleteCount, ...items) {
    if (arr === null || arr === undefined) throw new Error("splice: expected array or array-like");
    if (typeof start !== "number") throw new Error("splice: start must be a number");
    if (deleteCount !== undefined && typeof deleteCount !== "number")
        throw new Error("splice: deleteCount must be a number");  
    if (!Array.isArray(arr) && typeof arr.length !== "number")
        throw new Error("splice: expected array or array-like");  
    if (deleteCount === undefined) deleteCount = arr.length - start; 
    return Array.prototype.splice.call(arr, start, deleteCount, ...items);
};

FUNCS.slice = function(arr, start, end) {
    if (arr === null || arr === undefined) throw new Error("slice: expected array or array-like");
    if (!Array.isArray(arr) && typeof arr.length !== "number")
        throw new Error("slice: expected array or array-like");    
    if (start !== undefined && typeof start !== "number")
        throw new Error("slice: start must be a number");
    if (end !== undefined && typeof end !== "number")
        throw new Error("slice: end must be a number");   
    return Array.prototype.slice.call(arr, start, end);
};

FUNCS.typeOf = function(val) {
    if (val === null) return "null";
    if (Array.isArray(val)) return "array";
    return typeof val;
};
FUNCS.regexTest = function(str, pattern) {
    if (typeof str !== "string") throw new Error("regexTest: expected string");
    if (typeof pattern !== "string") throw new Error("regexTest: pattern must be a string");
    return new RegExp(pattern).test(str);
};
FUNCS.regexMatch = function(str, pattern) {
    if (typeof str !== "string") throw new Error("regexMatch: expected string");
    if (typeof pattern !== "string") throw new Error("regexMatch: pattern must be a string");
    const matches = str.match(new RegExp(pattern, "g"));
    return matches ? matches : [];
};
FUNCS.regexReplace = function(str, pattern, replacement) {
    if (typeof str !== "string") throw new Error("regexReplace: expected string");
    if (typeof pattern !== "string") throw new Error("regexReplace: pattern must be a string");
    if (typeof replacement !== "string") throw new Error("regexReplace: replacement must be a string");
    return str.replace(new RegExp(pattern, "g"), replacement);
};

function validateURL(url, caller) {
    if (typeof url !== "string") throw new Error(caller + ": expected a URL string");
    if (!/^https?:\/\//i.test(url))
        throw new Error(caller + ": URL must start with http:// or https://");
    return url;
}

FUNCS.fetchText = async function(url) {
    validateURL(url, "fetchText");
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP " + response.status);
        return await response.text();
    } catch (e) {
        throw new Error("fetchText failed: " + e.message);
    }
};
FUNCS.fetchJSON = async function(url) {
    validateURL(url, "fetchJSON");
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP " + response.status);
        return await response.json();
    } catch (e) {
        throw new Error("fetchJSON failed: " + e.message);
    }
};
FUNCS.fetchTCSFn = async function(url) {
    validateURL(url, "fetchTCSFn");
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP " + response.status);
        const code = await response.text();
        const result = await RunTCS(code, TCS_PERMS);
        if (!result.ok) throw new Error("TCS Import Error: " + result.error);
        return 0;
    } catch (e) {
        throw new Error("fetchTCSFn failed: " + e.message);
    }
};
FUNCS.fetchFn = async function(url) {
    validateURL(url, "fetchFn");
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = () => resolve(0);
        script.onerror = () => reject(new Error("fetchFn: failed to load " + url));
        document.head.appendChild(script);
    });
};
FUNCS.XTHttpsRequest = function(method, url, body) {
    validateURL(url, "XTHttpsRequest");
    if (method !== undefined && typeof method !== "string")
        throw new Error("XTHttpsRequest: method must be a string");
    if (body !== undefined && typeof body !== "string")
        throw new Error("XTHttpsRequest: body must be a string");
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method || "GET", url, true);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
            else reject(new Error("HTTP " + xhr.status));
        };
        xhr.onerror = function() { reject(new Error("Network Error")); };
        if (body) xhr.send(body); else xhr.send();
    });
};

FUNCS.saveData = function(key, value) {
    if (typeof key !== "string") throw new Error("saveData: key must be a string");
    localStorage.setItem("tcs_" + key, String(value));
    return 0;
};
FUNCS.loadData = function(key) {
    if (typeof key !== "string") throw new Error("loadData: key must be a string");
    const val = localStorage.getItem("tcs_" + key);
    return val === null ? "" : val;
};
FUNCS.deleteData = function(key) {
    if (typeof key !== "string") throw new Error("deleteData: key must be a string");
    localStorage.removeItem("tcs_" + key);
    return 0;
};
FUNCS.wipeAllCurrentWebsiteData = function() { localStorage.clear(); return 0; };
FUNCS.wipeTCSData = function() {
    const keys = Object.keys(localStorage);
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].startsWith("tcs_")) localStorage.removeItem(keys[i]);
    }
    return 0;
};

FUNCS.now = function() { return Date.now(); };
FUNCS.getYear = function() { return new Date().getFullYear(); };
FUNCS.getMonth = function() { return new Date().getMonth() + 1; };
FUNCS.getDay = function() { return new Date().getDate(); };
FUNCS.getHours = function() { return new Date().getHours(); };
FUNCS.getFullDate = function() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
};
FUNCS.sleep = function(ms) {
    if (typeof ms !== "number" || ms < 0) throw new Error("sleep: ms must be a non-negative number");
    const start = Date.now();
    while (Date.now() - start < ms) {}
    return 0;
};
FUNCS.wait = function(ms) {
    if (typeof ms !== "number" || ms < 0) throw new Error("wait: ms must be a non-negative number");
    return new Promise(resolve => setTimeout(resolve, ms));
};
FUNCS.setInterval = function(fnName, ms) {
    if (typeof ms !== "number" || ms <= 0) throw new Error("setInterval: ms must be a positive number");
    if (typeof FUNCS[fnName] === "function") {
        setInterval(() => { FUNCS[fnName](); }, ms);
        return 0;
    }
    const prog = FUNCS._program;
    if (prog && prog.functions && prog.functions[fnName]) {
        setInterval(() => {
            const sub = { bytecode: ["CALL", fnName, 0], varCount: 0, functions: prog.functions };
            runVM(sub).catch(e => console.error("setInterval TCS error:", e.message));
        }, ms);
        return 0;
    }
    throw new Error("setInterval: '" + fnName + "' is not a function");
};

FUNCS.query = function(selector) {
    if (typeof selector !== "string") throw new Error("query: selector must be a string");
    return document.querySelector(selector);
};
FUNCS.queryAll = function(selector) {
    if (typeof selector !== "string") throw new Error("query: selector must be a string");
    return document.querySelectorAll(selector);
};
FUNCS.setText = function(target, text) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) throw new Error("setText: no element matches '" + target + "'");
    el.textContent = text;
    return 0;
};
FUNCS.setHTML = function(target, html) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) throw new Error("setHTML: no element matches '" + target + "'");
    el.innerHTML = html;
    return 0;
};
FUNCS.getValue = function(target) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) throw new Error("getValue: no element matches '" + target + "'");
    return el.value;
};
FUNCS.setValue = function(target, text) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) throw new Error("setValue: no element matches '" + target + "'");
    el.value = text;
    return 0;
};
FUNCS.setStyle = function(target, prop, value) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) throw new Error("setStyle: no element matches '" + target + "'");
    if (typeof prop !== "string") throw new Error("setStyle: prop must be a string");
    el.style[prop] = value;
    return 0;
};
FUNCS.show = function(target) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) throw new Error("show: no element matches '" + target + "'");
    el.style.display = "";
    return 0;
};
FUNCS.hide = function(target) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) throw new Error("hide: no element matches '" + target + "'");
    el.style.display = "none";
    return 0;
};
FUNCS.changeBodyCSS = function(to) {
    if (typeof to !== "string") throw new Error("changeBodyCSS: expected a string");
    document.body.style.cssText = to;
    return 0;
};
FUNCS.currentCSS = function() { return document.body ? document.body.style.cssText : ""; };
FUNCS.changePageTitle = function(title) {
    if (typeof title !== "string") throw new Error("changePageTitle: title must be a string");
    document.title = title;
    return 0;
};
FUNCS.getTitle = function() { return document.title; };
FUNCS.changeTitle = function(to) {
    if (typeof to !== "string") throw new Error("changeTitle: title must be a string");
    document.title = to;
    return 0;
};
FUNCS.getUserAgent = function() {
    if (typeof navigator === "undefined") throw new Error("getUserAgent: not in a browser");
    return navigator.userAgent;
};
FUNCS.getUserInfo = function() {
    if (typeof navigator === "undefined") return "Not in a browser";
    const ua = navigator.userAgent;
    const os = navigator.platform || "Unknown";
    let browser = "Unknown";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";
    let device = "Desktop";
    if (/Mobi|Android/i.test(ua)) device = "Mobile";
    else if (/Tablet|iPad/i.test(ua)) device = "Tablet";
    let screenSize = "Unknown";
    if (typeof screen !== "undefined") screenSize = screen.width + "x" + screen.height;
    return "OS: " + os + " | Browser: " + browser + " | Device: " + device + " | Screen: " + screenSize;
};
FUNCS.openLink = function(url) {
    if (typeof url !== "string") throw new Error("openLink: URL must be a string");
    window.open(url, "_blank");
    return 0;
};
FUNCS.reloadPage = function() { window.location.reload(); return 0; };
FUNCS.copyToClipboard = function(text) {
    if (typeof text !== "string") throw new Error("copyToClipboard: text must be a string");
    navigator.clipboard.writeText(text).catch(e => console.error("Copy failed:", e));
    return 0;
};

FUNCS.alert = function(msg) {
    if (typeof window === "undefined" || typeof window.alert !== "function") throw new Error("alert: not available");
    window.alert(String(msg));
    return 0;
};
FUNCS.prompt = function(msg) {
    if (typeof window === "undefined" || typeof window.prompt !== "function") throw new Error("prompt: not available");
    return window.prompt(String(msg));
};
FUNCS.confirm = function(msg) {
    if (typeof window === "undefined" || typeof window.confirm !== "function") throw new Error("confirm: not available");
    return window.confirm(String(msg));
};

FUNCS.callJS = function(fnName, ...args) {
    if (!TCS_PERMS.js) throw new Error("Security Error: callJS requires 'js' permission");
    if (typeof fnName !== "string") throw new Error("callJS: fnName must be a string");
    if (fnName === "eval") return eval(args[0]);
    if (typeof window[fnName] === "function") return window[fnName](...args);
    if (typeof globalThis[fnName] === "function") return globalThis[fnName](...args);
    throw new Error("callJS: JavaScript function '" + fnName + "' not found");
};
FUNCS.javaScriptRunCodeAsText = function(text) {
    if (!TCS_PERMS.js) throw new Error("Security Error: javaScriptRunCodeAsText requires 'js' permission");
    if (typeof text !== "string") throw new Error("javaScriptRunCodeAsText: expected a string");
    return eval(text);
};
FUNCS.getGlobal = function(name) {
    if (typeof name !== "string") throw new Error("getGlobal: name must be a string");
    if (typeof window[name] !== "undefined") return window[name];
    if (typeof globalThis[name] !== "undefined") return globalThis[name];
    return undefined;
};
FUNCS.setGlobal = function(name, value) {
    if (!TCS_PERMS.js) throw new Error("Security Error: setGlobal requires 'js' permission");
    if (typeof name !== "string") throw new Error("setGlobal: name must be a string");
    const blocked = ["eval", "Function", "fetch", "XMLHttpRequest", "import", "require",
                     "window", "document", "globalThis", "prototype", "__proto__"];
    if (blocked.includes(name)) throw new Error("setGlobal: cannot overwrite '" + name + "'");
    window[name] = value;
    return 0;
};
FUNCS.requstCurrentLoctationClosing = function() {
    if (typeof window === "undefined") throw new Error("forceCloseBrowserTab: not in a browser");
    window.close();
    setTimeout(() => {
        console.warn("TCS: requstCurrentLoctationClosing() was blocked by the browser. Tabs can only be closed by scripts if the script opened them.");
    }, 100);
    return 0;
};

FUNCS.getCanvas = function(id) {
    if (typeof id !== "string") throw new Error("getCanvas: id must be a string");
    const canvas = document.getElementById(id);
    if (!canvas) throw new Error("getCanvas: no element with id '" + id + "'");
    return canvas.getContext("2d");
};
FUNCS.obj_keys = function(obj) {
    if (obj === null || typeof obj !== "object") throw new Error("keys: expected object");
    return Object.keys(obj);
};
FUNCS.obj_values = function(obj) {
    if (obj === null || typeof obj !== "object") throw new Error("values: expected object");
    return Object.values(obj);
};
FUNCS.loadJavaScriptTCSFunction = function(url) {
    if (typeof url !== "string") throw new Error("loadJavaScriptTCSFunction: expected a URL string");
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = () => resolve(0);
        script.onerror = () => reject(new Error("loadJavaScriptTCSFunction: failed to load " + url));
        document.head.appendChild(script);
    });
};
FUNCS.makeTag = function(tagName, renderFnName) {
    if (typeof tagName !== "string" || !tagName.includes("-")) {
        throw new Error("makeTag: tag name must contain a hyphen (e.g., 'my-tag')");
    }
    if (typeof renderFnName !== "string") {
        throw new Error("makeTag: expected a TCS function name");
    }
    class TCSLangTag extends HTMLElement {
        connectedCallback() {
            const fn = FUNCS[renderFnName];
            if (fn && fn.body) {
                const child = new Env(fn.closure);
                child.declare(fn.params[0], this);
                (async () => {
                    try {
                        for (const s of fn.body) await exec(s, child);
                    } catch (e) {
                        console.error("[TCS Tag Error]", e.message);
                    }
                })();
            } else {
                console.warn("makeTag: TCS function '" + renderFnName + "' not found");
            }
        }
    }
    if (!customElements.get(tagName)) {
        customElements.define(tagName, TCSLangTag);
    }
    return 0;
};
FUNCS.getTagContent = function(el) {
    if (!el) throw new Error("getTagContent: no element provided");
    return el.textContent || el.innerHTML || "";
};
FUNCS.JSON_stringify = function(obj) { return JSON.stringify(obj); };
FUNCS.JSON_parse = function(str) { return JSON.parse(str); };
FUNCS.fillRect = function(ctx, x, y, w, h, color) {
    if (!ctx || typeof ctx.fillRect !== "function") throw new Error("fillRect: invalid canvas context");
    if ([x, y, w, h].some(v => typeof v !== "number")) throw new Error("fillRect: all coords must be numbers");
    if (typeof color !== "string") throw new Error("fillRect: color must be a string");
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    return 0;
};
FUNCS.clearCanvas = function(ctx) {
    if (!ctx || typeof ctx.clearRect !== "function") throw new Error("clearCanvas: invalid canvas context");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return 0;
};
FUNCS.runHyperTextMarkupLanguage = function(html) {
    if (typeof html !== "string") throw new Error("runHTML: html must be a string");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    return 0;
};

FUNCS.runTCS = async function(code, perms) {
    if (typeof code !== "string") throw new Error("runTCS: expected a string of code");
    const result = await RunTCS(code, perms || TCS_PERMS);
    if (!result.ok) throw new Error("runTCS Error: " + result.error);
    return 0;
};

let currentAudio = null;
FUNCS.playAudio = function(url) {
    if (typeof Audio === "undefined") throw new Error("playAudio: not in a browser");
    if (typeof url !== "string") throw new Error("playAudio: URL must be a string");
    currentAudio = new Audio(url);
    currentAudio.play().catch(e => console.error("Audio error:", e));
    return 0;
};
FUNCS.stopAudio = function() {
    if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
    return 0;
};
FUNCS.setVolume = function(vol) {
    if (typeof vol !== "number") throw new Error("setVolume: volume must be a number");
    if (currentAudio) currentAudio.volume = Math.max(0, Math.min(1, vol));
    return 0;
};
FUNCS.getAttribute = function(el, attrName) {
    if (!el) throw new Error("getAttribute: no element provided");
    if (typeof attrName !== "string") throw new Error("getAttribute: attrName must be a string");
    return el.getAttribute(attrName) || "";
};
FUNCS.readFromLocalFileStorage = function(callbackFnName) {
    if (typeof callbackFnName !== "string") {
        throw new Error("readFromLocalFileStorage: expected a TCS function name");
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.json,.csv,.tcs,.md";
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const fn = FUNCS[callbackFnName];
            if (fn && fn.body) {
                const child = new Env(fn.closure);
                child.declare(fn.params[0], content);
                child.declare(fn.params[1], file.name);
                (async () => {
                    try {
                        for (const s of fn.body) await exec(s, child);
                    } catch (e) {
                        console.error("[TCS File Read Error]", e.message);
                    }
                })();
            }
        };
        reader.readAsText(file);
    };

    input.click();
    return 0;
};
FUNCS.saveToLocalFileStorage = function(content, mimeType, fileName) {
    if (typeof content !== "string") throw new Error("saveToLocalFileStorage: content must be a string");
    if (typeof mimeType !== "string") mimeType = "text/plain";
    if (typeof fileName !== "string") fileName = "tcs_TextFile.txt";

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();   
    document.body.removeChild(a);
    URL.revokeObjectURL(url);    
    return 0;
    } catch(err) {
    	throw new Error("saveToLocalFileStorage save err:" + err);
    }
};
FUNCS.pauseAudio = function() { if (currentAudio) currentAudio.pause(); return 0; };
FUNCS.resumeAudio = function() { if (currentAudio) currentAudio.play(); return 0; };

const SIGNAL_RETURN = "__return";
const SIGNAL_BREAK = "__break";
const SIGNAL_SWITCH_BREAK = "__switch_break";
const SIGNAL_CONTINUE = "__continue";

function isSignal(e) {
  return e && (e[SIGNAL_RETURN] !== undefined || e[SIGNAL_BREAK] !== undefined || e[SIGNAL_CONTINUE] !== undefined);
}

async function runFinally(body, env) { for (const s of body) await exec(s, env); }
async function run(ast, env) { for (const stmt of ast.body) await exec(stmt, env); }

async function exec(node, env) {
  try {
    switch (node.type) {
      case "Let": {
        const v = await evalExpr(node.value, env);
        if (node.declared) checkType(v, node.declared, node.name);
        env.declare(node.name, v, node.isConst);
        return;
      }
      case "Import": {
        await FUNCS.fetchFn(node.url);
        return;
      }
      case "Switch": {
        const switchVal = await evalExpr(node.expr, env);
        let matched = false;  
        try {
          for (let i = 0; i < node.cases.length; i++) {
            const c = node.cases[i];
            if (matched || (await evalExpr(c.val, env)) === switchVal) {
              matched = true;
              for (const s of c.body) await exec(s, env);
            }
          }
          if (!matched && node.defaultCase) {
            for (const s of node.defaultCase) await exec(s, env);
          }
        } catch (e) {
          if (e && e[SIGNAL_BREAK] !== undefined) return;
          throw e;
        }
        return;
      }
      case "Set": {
        if (!node.name) throw new Error("Invalid 'set' target");
        const v = await evalExpr(node.value, env);
        const old = env.get(node.name);
        if (typeof old !== typeof v) throw new Error("type mismatch on '" + node.name + "'");
        env.set(node.name, v);
        return;
      }
      case "SetMember": {
        const obj = await evalExpr(node.obj, env);
        const value = await evalExpr(node.value, env);
        if (obj === null || obj === undefined) throw new Error("cannot set property on null");
        if (typeof obj !== "object") throw new Error("cannot set property on non-object");
        obj[node.prop] = value;
        return;
      }
      case "SetIndex": {
        const obj = await evalExpr(node.obj, env);
        const idx = await evalExpr(node.index, env);
        const value = await evalExpr(node.value, env);
        if (obj === null || obj === undefined) throw new Error("cannot index undefined");
        obj[idx] = value;
        return;
      }
      case "If": {
        const c = await evalExpr(node.cond, env);
        if (typeof c !== "boolean") throw new Error("if condition must be boolean");
        const branch = c ? node.then : node.otherwise;
        if (branch) for (const s of branch) await exec(s, env);
        return;
      }
      case "While": {
        while (true) {
          const c = await evalExpr(node.cond, env);
          if (typeof c !== "boolean") throw new Error("while condition must be boolean");
          if (!c) break;
          const loopEnv = new Env(env);
          try {
            for (const s of node.body) await exec(s, loopEnv);
          } catch (e) {
            if (e && e[SIGNAL_BREAK] !== undefined) break;
            if (e && e[SIGNAL_CONTINUE] !== undefined) continue;
            throw e;
          }
        }
        return;
      }
      case "Until": {
        let loops = 0;
        while (true) {
          loops++;
          if (loops > 1000000) throw new Error("Infinite loop detected in until");    
          const c = await evalExpr(node.cond, env);
          if (typeof c !== "boolean") throw new Error("until condition must be boolean");
          if (c) break;   
          const loopEnv = new Env(env);
          try {
            for (const s of node.body) await exec(s, loopEnv);
          } catch (e) {
            if (e && e[SIGNAL_BREAK] !== undefined) break;
            if (e && e[SIGNAL_CONTINUE] !== undefined) continue;
            throw e;
          }
        }
        return;
      }
      case "For": {
        const a = await evalExpr(node.start, env);
        const b = await evalExpr(node.end, env);
        for (let i = a; i < b; i++) {
          const child = new Env(env);
          child.declare(node.name, i);
          try {
            for (const s of node.body) await exec(s, child);
          } catch (e) {
            if (e && e[SIGNAL_BREAK] !== undefined) break;
            if (e && e[SIGNAL_CONTINUE] !== undefined) continue;
            throw e;
          }
        }
        return;
      }
      case "Fn": {
        FUNCS[node.name] = { params: node.params, body: node.body, closure: env };
        return;
      }
      case "Return": throw { [SIGNAL_RETURN]: node.value ? await evalExpr(node.value, env) : 0 };
      case "Throw": throw new Error(String(await evalExpr(node.value, env)));
      case "Break": throw { [SIGNAL_BREAK]: true };
      case "Continue": throw { [SIGNAL_CONTINUE]: true };
      case "Try": {
        let threw = false, caughtError = null;
        try { for (const s of node.body) await exec(s, env); } 
        catch (e) {
          if (isSignal(e)) { if (node.finallyBody) await runFinally(node.finallyBody, env); throw e; }
          if (!node.catchBody) { if (node.finallyBody) await runFinally(node.finallyBody, env); throw e; }
          threw = true; caughtError = e;
        }
        if (threw) {
          const catchEnv = new Env(env);
          const msg = (caughtError && caughtError.message !== undefined) ? String(caughtError.message) : String(caughtError);
          catchEnv.declare(node.catchName, msg);
          try { for (const s of node.catchBody) await exec(s, catchEnv); } 
          catch (e) { if (node.finallyBody) await runFinally(node.finallyBody, env); throw e; }
        }
        if (node.finallyBody) await runFinally(node.finallyBody, env);
        return;
      }
      case "On": {
        if (!TCS_PERMS.dom) throw new Error("Security Error: 'on' handler requires DOM permission.");
        const els = document.querySelectorAll(node.selector);
        if (els.length === 0) throw new Error("'on " + node.event + " for " + node.selector + "': no matching element");
        const body = node.body, capturedEnv = env;
        els.forEach(el => {
          el.addEventListener(node.event, async () => {
            const handlerEnv = new Env(capturedEnv);
            try { for (const s of body) await exec(s, handlerEnv); } 
            catch (e) {
              if (isSignal(e)) {
                const which = e[SIGNAL_RETURN] !== undefined ? "return" : e[SIGNAL_BREAK] !== undefined ? "break" : "continue";
                console.error("[TCS] '" + which + "' outside loop/function in event handler");
                return;
              }
              console.error("[TCS] event handler error:", e.message);
            }
          });
        });
        return;
      }
      case "ExprStmt": await evalExpr(node.expr, env); return;
      default: throw new Error("unknown statement: " + node.type);
    }
  } catch (e) {
    if (e && !e.line && node.line) e.line = node.line;
    throw e;
  }
}

async function evalExpr(node, env) {
  if (node === undefined || node === null) return undefined;
  try {
    switch (node.type) {
      case "Undefined": return undefined;
      case "Null": return null;
      case "NaN": return NaN;
      case "Number": return node.value;
      case "String": return node.value;
      case "Version": return "TCS_JS_6";
      case "Info":    return "TCS_JS_6/JS_Eruda/JS_E2026/MIT/BUILD_9";
      case "Template": {
        const parts = node.value.split(/\$\{([^}]+)\}/);
        let result = "";
        for (let i = 0; i < parts.length; i++) {
          if (i % 2 === 0) {
            result += parts[i];
          } else {
            const exprCode = parts[i];
            const tokens = tokenize(exprCode);
            const exprAst = parse(tokens).body[0].expr;
            result += String(await evalExpr(exprAst, env));
          }
        }
        return result;
      }
      case "Bool":   return node.value;
      case "Array":  return Promise.all(node.elements.map(e => evalExpr(e, env)));
      case "Ident":  return env.get(node.name);
      case "Member": {
        const o = await evalExpr(node.obj, env);
        if (o === null || o === undefined) throw new Error("cannot read property '" + node.prop + "' of null");
        if (node.prop === "clientY") return o.clientY;
        if (node.prop === "clientX") return o.clientX;
        return o[node.prop];
      }
      case "Index": {
        const o = await evalExpr(node.obj, env);
        const i = await evalExpr(node.index, env);
        if (o === null || o === undefined) throw new Error("cannot index undefined");
        if (typeof o === "string") { 
            if (i < 0 || i >= o.length) throw new Error("index out of bounds"); 
            return o[i]; 
        }  
        if (!Array.isArray(o)) {
            return o[i]; 
        }
        if (i < 0 || i >= o.length) throw new Error("index out of bounds");
        return o[i];
      }
      case "Object": {
        const obj = {};
        for (let i = 0; i < node.properties.length; i++) {
          const key = node.properties[i].key;
          const value = await evalExpr(node.properties[i].value, env);
          obj[key] = value;
        }
        return obj;
      }
      case "Ternary": {
        const cond = await evalExpr(node.cond, env);
        if (cond) return await evalExpr(node.then, env);
        else return await evalExpr(node.else, env);
      }
      case "TypeOf": {
        const val = await evalExpr(node.expr, env);
        if (Array.isArray(val)) return "array";
        return typeof val;
      }
      case "Unary": {
        const v = await evalExpr(node.expr, env);
        if (node.op === "-") return -v;
        if (node.op === "!") return !v;
        throw new Error("unknown unary op");
      }
      case "Binary": {
        const l = await evalExpr(node.left, env);
        if (node.op === "&&") return l ? await evalExpr(node.right, env) : false;
        if (node.op === "||") return l ? true : await evalExpr(node.right, env);
        const r = await evalExpr(node.right, env);
        if (node.op === "/" && (typeof l === "string" || typeof r === "string")) return String(l) + String(r);
        switch (node.op) {
          case "+": return l + r;
          case "-": return l - r;
          case "*": return l * r;
          case "/": return Math.trunc(l / r);
          case "%": return l % r;
          case "==": return l === r;
          case "!=": return l !== r;
          case "<":  return l <  r;
          case ">":  return l >  r;
          case "<=": return l <= r;
          case ">=": return l >= r;
        }
        throw new Error("unknown op " + node.op);
      }
      case "Call": {
        const name = node.callee.type === "Ident" ? node.callee.name : null;
        const args = await Promise.all(node.args.map(a => evalExpr(a, env)));
    
        if (name && TCS_PERMS.blacklist.includes(name)) {
          throw new Error("Security Error: '" + name + "' is blocked by the host.");
        }
        if (name && needsCFN.includes(name) && !TCS_PERMS.cfn) {
          throw new Error("Security Error: '" + name + "' requires CFN permission.");
        }
        if (name && needsNetwork.includes(name) && !TCS_PERMS.network) {
          throw new Error(`Security Error: '${name}' requires Network permission.`);
        }
        if (name && needsDOM.includes(name) && !TCS_PERMS.dom) {
          throw new Error(`Security Error: '${name}' requires DOM permission.`);
        }
        if (name && needsStorage.includes(name) && !TCS_PERMS.storage) {
          throw new Error(`Security Error: '${name}' requires Storage permission.`);
        }
        if (name && needsSystem.includes(name) && !TCS_PERMS.system) {
          throw new Error(`Security Error: '${name}' requires System permission.`);
        }
        if (name && js.includes(name) && !TCS_PERMS.js) {
          throw new Error(`Security Error: '${name}' requires JavaScript (js) permission.`);
        }
        
        if (name && FUNCS[name]) {
          const fn = FUNCS[name];
          if (typeof fn === "function") {
            return await fn(...args);
          }
          const child = new Env(fn.closure);
          for (let i = 0; i < fn.params.length; i++) child.declare(fn.params[i], args[i]);
          try {
            for (const s of fn.body) await exec(s, child);
            return 0;
          } catch (e) {
            if (e && e[SIGNAL_RETURN] !== undefined) return e[SIGNAL_RETURN];
            if (e && e[SIGNAL_BREAK] !== undefined) throw new Error("'break' outside loop");
            if (e && e[SIGNAL_CONTINUE] !== undefined) throw new Error("'continue' outside loop");
            throw e;
          }
        }
        throw new Error("'" + (name || "?") + "' is not a function");
      }
      default: throw new Error("unknown expression: " + node.type);
    }
  } catch (e) {
    if (e && !e.line && node.line) e.line = node.line;
    throw e;
  }
}

function checkType(v, declared, name) {
  const { base, arr } = declared;
  if (arr === true && !Array.isArray(v)) throw new Error("'" + name + "' must be an array");
  if (arr === false && Array.isArray(v)) throw new Error("'" + name + "' must not be an array");
  if (Array.isArray(v)) return;
  if (typeof v !== base) throw new Error("'" + name + "' must be " + base);
}

async function RunTCS(code, perms = {}) {
  TCS_PERMS = {
    dom: perms.dom === true,
    storage: perms.storage === true,
    system: perms.system === true,
    js: perms.js === true,
    network: perms.network === true,
    cfn: perms.cfn === true,
    blacklist: perms.blacklist || []
  };
  try {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    const env = new Env();
    await run(ast, env);
    return { ok: true, error: null };
  } catch (e) {
    if (e && e[SIGNAL_RETURN] !== undefined) return { ok: false, error: "'return' outside function" };
    if (e && e[SIGNAL_BREAK] !== undefined) return { ok: false, error: "'break' outside loop" };
    if (e && e[SIGNAL_CONTINUE] !== undefined) return { ok: false, error: "'continue' outside loop" };
    
    let errMsg = e.message || String(e);
    if (e.line) errMsg += " at line " + e.line;
    return { ok: false, error: errMsg };
  }
}

if (typeof window !== "undefined") {
  window.RunTCS = RunTCS;
  window.FUNCS = FUNCS;

  window.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('script[type="text/tcs"]').forEach(script => {
      RunTCS(script.textContent, { dom: true, storage: true, system: true, js: true, network: true }).then(result => {
        if (!result.ok) console.error("TCS Script Error:", result.error);
      });
    });

    if (!customElements.get("tcs-run")) {
      class TCSElement extends HTMLElement {
        connectedCallback() {
          if (this.dataset.ran) return;
          this.dataset.ran = "true";
          let code = "";
          const template = this.querySelector("template");
          if (template) code = template.innerHTML;
          else code = this.textContent;

          this.innerHTML = "";       
          RunTCS(code, { dom: true, storage: true, system: true, js: true, network: true}).then(result => {
            if (!result.ok) {
              console.error("TCS Tag Error:", result.error);
              this.innerHTML = result.error;
            }
          });
        }
      }
      customElements.define("tcs-run", TCSElement);
      
      setTimeout(() => {
        document.querySelectorAll("tcs-run").forEach(el => {
          if (!el.dataset.ran && el.connectedCallback) el.connectedCallback();
        });
      }, 10);
    }
  });
}
function AddFN(name, fn, perms) {
    if (!TCS_PERMS.cfn) throw new Error("AddFN: CFN(cfn) permission is required to add custom functions");
    if (typeof name !== "string") throw new Error("AddFN: name must be a string");
    if (typeof fn !== "function") throw new Error("AddFN: fn must be a function");
    FUNCS[name] = fn;
    if (!needsCFN.includes(name)) needsCFN.push(name);
    if (perms && Array.isArray(perms)) {
        perms.forEach(p => {
            if (p === "dom" && !needsDOM.includes(name)) needsDOM.push(name);
            if (p === "network" && !needsNetwork.includes(name)) needsNetwork.push(name);
            if (p === "storage" && !needsStorage.includes(name)) needsStorage.push(name);
            if (p === "system" && !needsSystem.includes(name)) needsSystem.push(name);
            if (p === "js" && !js.includes(name)) js.push(name);
        });
    }
}