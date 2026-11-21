const TCON_VERSION = "0.1.0";
class TCONError extends Error {
    constructor(message, token) {
        const location = token
            ? ` at line ${token.line}, column ${token.column}`
            : "";
        super("TCON Error: " + message + location);
        this.name = "TCONError";
    }
}
function tokenizeTCON(source) {
    const tokens = [];
    let i = 0;
    let line = 1;
    let column = 1;
    function advance() {
        const char = source[i++];
        if (char === "\n") {
            line++;
            column = 1;
        } else {
            column++;
        }
        return char;
    }
    function add(type, value, startLine, startColumn) {
        tokens.push({
            type,
            value,
            line: startLine,
            column: startColumn
        });
    }
    while (i < source.length) {
        const char = source[i];
        if (/\s/.test(char)) {
            advance();
            continue;
        }
        if (source.slice(i, i + 2) === "//") {
            while (i < source.length && source[i] !== "\n") {
                advance();
            }
            continue;
        }
        if (source.slice(i, i + 2) === "/*") {
            const startLine = line;
            const startColumn = column;
            advance();
            advance();
            while (
                i < source.length &&
                source.slice(i, i + 2) !== "*/"
            ) {
                advance();
            }
            if (i >= source.length) {
                throw new TCONError(
                    "Unclosed comment",
                    { line: startLine, column: startColumn }
                );
            }
            advance();
            advance();
            continue;
        }
        const startLine = line;
        const startColumn = column;
        if (char === "'" || char === '"') {
            const quote = advance();
            let value = "";
            let closed = false;
            while (i < source.length) {
                let current = advance();
                if (current === quote) {
                    closed = true;
                    break;
                }
                if (current === "\\") {
                    if (i >= source.length) break;
                    const escaped = advance();
                    const escapes = {
                        n: "\n",
                        r: "\r",
                        t: "\t",
                        b: "\b",
                        f: "\f",
                        v: "\v",
                        "0": "\0",
                        "\\": "\\",
                        "'": "'",
                        '"': '"'
                    };
                    if (escaped === "u") {
                        const hex = source.slice(i, i + 4);
                        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
                            throw new TCONError(
                                "Invalid Unicode escape",
                                { line, column }
                            );
                        }
                        value += String.fromCharCode(
                            parseInt(hex, 16)
                        );
                        for (let n = 0; n < 4; n++) advance();
                    } else if (escaped === "x") {
                        const hex = source.slice(i, i + 2);
                        if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
                            throw new TCONError(
                                "Invalid hexadecimal escape",
                                { line, column }
                            );
                        }
                        value += String.fromCharCode(
                            parseInt(hex, 16)
                        );
                        advance();
                        advance();
                    } else {
                        value += Object.prototype.hasOwnProperty.call(
                            escapes, escaped
                        ) ? escapes[escaped] : escaped;
                    }
                    continue;
                }
                if (current === "\n" || current === "\r") {
                    throw new TCONError(
                        "Unescaped newline in string",
                        { line, column }
                    );
                }
                value += current;
            }
            if (!closed) {
                throw new TCONError(
                    "Unclosed string",
                    { line: startLine, column: startColumn }
                );
            }
            add("STRING", value, startLine, startColumn);
            continue;
        }
        const numberMatch = source.slice(i).match(
            /^-?(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/
        );
        if (numberMatch) {
            const raw = numberMatch[0];
            for (let n = 0; n < raw.length; n++) advance();
            const value = Number(raw);
            if (!Number.isFinite(value)) {
                throw new TCONError(
                    "Invalid number",
                    { line: startLine, column: startColumn }
                );
            }
            add("NUMBER", value, startLine, startColumn);
            continue;
        }
        const identifier = source.slice(i).match(
            /^[A-Za-z_$][A-Za-z0-9_$]*/
        );
        if (identifier) {
            const value = identifier[0];
            for (let n = 0; n < value.length; n++) advance();
            add("IDENTIFIER", value, startLine, startColumn);
            continue;
        }
        if ("()[]=,;".includes(char)) {
            add("SYMBOL", advance(), startLine, startColumn);
            continue;
        }
        throw new TCONError(
            "Unexpected character: " + char,
            { line, column }
        );
    }
    add("EOF", null, line, column);
    return tokens;
}
function parseTCON(source) {
    if (typeof source !== "string") {
        throw new TypeError("TCON input must be a string");
    }
    const tokens = tokenizeTCON(source);
    let position = 0;
    function peek() {
        return tokens[position];
    }
    function next() {
        return tokens[position++];
    }
    function expect(value) {
        const token = next();
        if (token.value !== value) {
            throw new TCONError(
                `Expected '${value}', got '${token.value}'`,
                token
            );
        }
        return token;
    }
    function getName() {
        const token = next();
        if (
            token.type !== "IDENTIFIER" &&
            token.type !== "STRING"
        ) {
            throw new TCONError("Expected an object name", token);
        }
        return token.value;
    }
    function setProperty(object, key, value, token) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            throw new TCONError(
                "Duplicate property: " + key,
                token
            );
        }
        Object.defineProperty(object, key, {
            value,
            writable: true,
            enumerable: true,
            configurable: true
        });
    }
    function parseValue() {
        const token = next();
        if (token.type === "STRING" || token.type === "NUMBER") {
            return token.value;
        }
        if (token.type === "IDENTIFIER") {
            switch (token.value) {
                case "true": return true;
                case "false": return false;
                case "null": return null;
                case "NaN": return NaN;
                case "undefined": return undefined;
                default:
                    throw new TCONError(
                        "Unknown value: " + token.value,
                        token
                    );
            }
        }
        if (token.value === "[") {
            return parseArray();
        }
        if (token.value === "(") {
            position--;
            return parseObject().value;
        }
        throw new TCONError("Invalid value", token);
    }
    function parseArray() {
        const array = [];
        while (peek().value !== "]") {
            if (peek().type === "EOF") {
                throw new TCONError("Unclosed array", peek());
            }
            array.push(parseValue());
            if (peek().value === ",") {
                next();
                if (peek().value === "]") break;
            } else if (peek().value !== "]") {
                throw new TCONError(
                    "Expected ',' or ']' in array",
                    peek()
                );
            }
        }
        expect("]");
        return array;
    }
    function parseObject() {
        expect("(");
        const name = getName();
        const object = {};
        while (peek().value !== ")") {
            if (peek().type === "EOF") {
                throw new TCONError(
                    "Unclosed object: " + name,
                    peek()
                );
            }
            if (peek().value === "(") {
                const nested = parseObject();
                setProperty(
                    object,
                    nested.name,
                    nested.value,
                    peek()
                );
                continue;
            }
            const keyToken = next();
            if (
                keyToken.type !== "IDENTIFIER" &&
                keyToken.type !== "STRING"
            ) {
                throw new TCONError(
                    "Expected property name",
                    keyToken
                );
            }
            expect("=");
            const value = parseValue();
            setProperty(
                object,
                keyToken.value,
                value,
                keyToken
            );
            if (
                peek().value === "," ||
                peek().value === ";"
            ) {
                next();
            }
        }
        expect(")");
        return {
            name,
            value: object
        };
    }
    const result = parseObject();
    if (peek().type !== "EOF") {
        throw new TCONError(
            "Unexpected content after root object",
            peek()
        );
    }
    return {
        [result.name]: result.value
    };
}
const TCON = {
    parse: parseTCON,
    tokenize: tokenizeTCON,
    Error: TCONError,
    version: TCON_VERSION
};
globalThis.TCON = TCON;
export {
    TCON,
    parseTCON,
    tokenizeTCON,
    TCONError,
    TCON_VERSION
};
export default TCON;