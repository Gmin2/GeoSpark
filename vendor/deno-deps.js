// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const encoder = new TextEncoder();
function getTypeName(value) {
    const type = typeof value;
    if (type !== "object") {
        return type;
    } else if (value === null) {
        return "null";
    } else {
        return value?.constructor?.name ?? "object";
    }
}
function validateBinaryLike(source) {
    if (typeof source === "string") {
        return encoder.encode(source);
    } else if (source instanceof Uint8Array) {
        return source;
    } else if (source instanceof ArrayBuffer) {
        return new Uint8Array(source);
    }
    throw new TypeError(`The input must be a Uint8Array, a string, or an ArrayBuffer. Received a value of the type ${getTypeName(source)}.`);
}
const hexTable = new TextEncoder().encode("0123456789abcdef");
new TextEncoder();
const textDecoder = new TextDecoder();
function encodeHex(src) {
    const u8 = validateBinaryLike(src);
    const dst = new Uint8Array(u8.length * 2);
    for(let i = 0; i < dst.length; i++){
        const v = u8[i];
        dst[i * 2] = hexTable[v >> 4];
        dst[i * 2 + 1] = hexTable[v & 0x0f];
    }
    return textDecoder.decode(dst);
}
const MaxUInt64 = 18446744073709551615n;
const REST = 0x7f;
const SHIFT = 7;
function decode(buf, offset = 0) {
    for(let i = offset, len = Math.min(buf.length, offset + 10), shift = 0, decoded = 0n; i < len; i += 1, shift += SHIFT){
        let __byte = buf[i];
        decoded += BigInt((__byte & REST) * Math.pow(2, shift));
        if (!(__byte & 0x80) && decoded > MaxUInt64) {
            throw new RangeError("overflow varint");
        }
        if (!(__byte & 0x80)) return [
            decoded,
            i + 1
        ];
    }
    throw new RangeError("malformed or overflow varint");
}
class AssertionError extends Error {
    name = "AssertionError";
    constructor(message){
        super(message);
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new AssertionError(msg);
    }
}
class RetryError extends Error {
    constructor(cause, attempts){
        super(`Retrying exceeded the maxAttempts (${attempts}).`);
        this.name = "RetryError";
        this.cause = cause;
    }
}
const defaultRetryOptions = {
    multiplier: 2,
    maxTimeout: 60000,
    maxAttempts: 5,
    minTimeout: 1000,
    jitter: 1
};
async function retry(fn, opts) {
    const options = {
        ...defaultRetryOptions,
        ...opts
    };
    assert(options.maxTimeout >= 0, "maxTimeout is less than 0");
    assert(options.minTimeout <= options.maxTimeout, "minTimeout is greater than maxTimeout");
    assert(options.jitter <= 1, "jitter is greater than 1");
    let attempt = 0;
    while(true){
        try {
            return await fn();
        } catch (error) {
            if (attempt + 1 >= options.maxAttempts) {
                throw new RetryError(error, options.maxAttempts);
            }
            const timeout = _exponentialBackoffWithJitter(options.maxTimeout, options.minTimeout, attempt, options.multiplier, options.jitter);
            await new Promise((r)=>setTimeout(r, timeout));
        }
        attempt++;
    }
}
function _exponentialBackoffWithJitter(cap, base, attempt, multiplier, jitter) {
    const exp = Math.min(cap, base * multiplier ** attempt);
    return (1 - jitter * Math.random()) * exp;
}
const __$G = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const version = "6.13.5";
function checkType(value, type, name) {
    const types = type.split("|").map((t)=>t.trim());
    for(let i = 0; i < types.length; i++){
        switch(type){
            case "any":
                return;
            case "bigint":
            case "boolean":
            case "number":
            case "string":
                if (typeof value === type) {
                    return;
                }
        }
    }
    const error = new Error(`invalid value for type ${type}`);
    error.code = "INVALID_ARGUMENT";
    error.argument = `value.${name}`;
    error.value = value;
    throw error;
}
async function resolveProperties(value) {
    const keys = Object.keys(value);
    const results = await Promise.all(keys.map((k)=>Promise.resolve(value[k])));
    return results.reduce((accum, v, index)=>{
        accum[keys[index]] = v;
        return accum;
    }, {});
}
function defineProperties(target, values, types) {
    for(let key in values){
        let value = values[key];
        const type = types ? types[key] : null;
        if (type) {
            checkType(value, type, key);
        }
        Object.defineProperty(target, key, {
            enumerable: true,
            value: value,
            writable: false
        });
    }
}
function stringify$1(value) {
    if (value == null) {
        return "null";
    }
    if (Array.isArray(value)) {
        return "[ " + value.map(stringify$1).join(", ") + " ]";
    }
    if (value instanceof Uint8Array) {
        const HEX = "0123456789abcdef";
        let result = "0x";
        for(let i = 0; i < value.length; i++){
            result += HEX[value[i] >> 4];
            result += HEX[value[i] & 15];
        }
        return result;
    }
    if (typeof value === "object" && typeof value.toJSON === "function") {
        return stringify$1(value.toJSON());
    }
    switch(typeof value){
        case "boolean":
        case "symbol":
            return value.toString();
        case "bigint":
            return BigInt(value).toString();
        case "number":
            return value.toString();
        case "string":
            return JSON.stringify(value);
        case "object":
            {
                const keys = Object.keys(value);
                keys.sort();
                return "{ " + keys.map((k)=>`${stringify$1(k)}: ${stringify$1(value[k])}`).join(", ") + " }";
            }
    }
    return `[ COULD NOT SERIALIZE ]`;
}
function isError(error, code) {
    return error && error.code === code;
}
function isCallException(error) {
    return isError(error, "CALL_EXCEPTION");
}
function makeError(message, code, info) {
    let shortMessage = message;
    {
        const details = [];
        if (info) {
            if ("message" in info || "code" in info || "name" in info) {
                throw new Error(`value will overwrite populated values: ${stringify$1(info)}`);
            }
            for(const key in info){
                if (key === "shortMessage") {
                    continue;
                }
                const value = info[key];
                details.push(key + "=" + stringify$1(value));
            }
        }
        details.push(`code=${code}`);
        details.push(`version=${version}`);
        if (details.length) {
            message += " (" + details.join(", ") + ")";
        }
    }
    let error;
    switch(code){
        case "INVALID_ARGUMENT":
            error = new TypeError(message);
            break;
        case "NUMERIC_FAULT":
        case "BUFFER_OVERRUN":
            error = new RangeError(message);
            break;
        default:
            error = new Error(message);
    }
    defineProperties(error, {
        code: code
    });
    if (info) {
        Object.assign(error, info);
    }
    if (error.shortMessage == null) {
        defineProperties(error, {
            shortMessage: shortMessage
        });
    }
    return error;
}
function assert1(check, message, code, info) {
    if (!check) {
        throw makeError(message, code, info);
    }
}
function assertArgument(check, message, name, value) {
    assert1(check, message, "INVALID_ARGUMENT", {
        argument: name,
        value: value
    });
}
function assertArgumentCount(count, expectedCount, message) {
    if (message == null) {
        message = "";
    }
    if (message) {
        message = ": " + message;
    }
    assert1(count >= expectedCount, "missing argument" + message, "MISSING_ARGUMENT", {
        count: count,
        expectedCount: expectedCount
    });
    assert1(count <= expectedCount, "too many arguments" + message, "UNEXPECTED_ARGUMENT", {
        count: count,
        expectedCount: expectedCount
    });
}
const _normalizeForms = [
    "NFD",
    "NFC",
    "NFKD",
    "NFKC"
].reduce((accum, form)=>{
    try {
        if ("test".normalize(form) !== "test") {
            throw new Error("bad");
        }
        if (form === "NFD") {
            const check = String.fromCharCode(233).normalize("NFD");
            const expected = String.fromCharCode(101, 769);
            if (check !== expected) {
                throw new Error("broken");
            }
        }
        accum.push(form);
    } catch (error) {}
    return accum;
}, []);
function assertNormalize(form) {
    assert1(_normalizeForms.indexOf(form) >= 0, "platform missing String.prototype.normalize", "UNSUPPORTED_OPERATION", {
        operation: "String.prototype.normalize",
        info: {
            form: form
        }
    });
}
function assertPrivate(givenGuard, guard, className) {
    if (className == null) {
        className = "";
    }
    if (givenGuard !== guard) {
        let method = className, operation = "new";
        if (className) {
            method += ".";
            operation += " " + className;
        }
        assert1(false, `private constructor; use ${method}from* methods`, "UNSUPPORTED_OPERATION", {
            operation: operation
        });
    }
}
function _getBytes(value, name, copy) {
    if (value instanceof Uint8Array) {
        if (copy) {
            return new Uint8Array(value);
        }
        return value;
    }
    if (typeof value === "string" && value.match(/^0x(?:[0-9a-f][0-9a-f])*$/i)) {
        const result = new Uint8Array((value.length - 2) / 2);
        let offset = 2;
        for(let i = 0; i < result.length; i++){
            result[i] = parseInt(value.substring(offset, offset + 2), 16);
            offset += 2;
        }
        return result;
    }
    assertArgument(false, "invalid BytesLike value", name || "value", value);
}
function getBytes(value, name) {
    return _getBytes(value, name, false);
}
function getBytesCopy(value, name) {
    return _getBytes(value, name, true);
}
function isHexString(value, length) {
    if (typeof value !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
        return false;
    }
    if (typeof length === "number" && value.length !== 2 + 2 * length) {
        return false;
    }
    if (length === true && value.length % 2 !== 0) {
        return false;
    }
    return true;
}
function isBytesLike(value) {
    return isHexString(value, true) || value instanceof Uint8Array;
}
const HexCharacters = "0123456789abcdef";
function hexlify(data) {
    const bytes = getBytes(data);
    let result = "0x";
    for(let i = 0; i < bytes.length; i++){
        const v = bytes[i];
        result += HexCharacters[(v & 240) >> 4] + HexCharacters[v & 15];
    }
    return result;
}
function concat(datas) {
    return "0x" + datas.map((d)=>hexlify(d).substring(2)).join("");
}
function dataLength(data) {
    if (isHexString(data, true)) {
        return (data.length - 2) / 2;
    }
    return getBytes(data).length;
}
function dataSlice(data, start, end) {
    const bytes = getBytes(data);
    if (end != null && end > bytes.length) {
        assert1(false, "cannot slice beyond data bounds", "BUFFER_OVERRUN", {
            buffer: bytes,
            length: bytes.length,
            offset: end
        });
    }
    return hexlify(bytes.slice(start == null ? 0 : start, end == null ? bytes.length : end));
}
function stripZerosLeft(data) {
    let bytes = hexlify(data).substring(2);
    while(bytes.startsWith("00")){
        bytes = bytes.substring(2);
    }
    return "0x" + bytes;
}
function zeroPad(data, length, left) {
    const bytes = getBytes(data);
    assert1(length >= bytes.length, "padding exceeds data length", "BUFFER_OVERRUN", {
        buffer: new Uint8Array(bytes),
        length: length,
        offset: length + 1
    });
    const result = new Uint8Array(length);
    result.fill(0);
    if (left) {
        result.set(bytes, length - bytes.length);
    } else {
        result.set(bytes, 0);
    }
    return hexlify(result);
}
function zeroPadValue(data, length) {
    return zeroPad(data, length, true);
}
function zeroPadBytes(data, length) {
    return zeroPad(data, length, false);
}
const BN_0$a = BigInt(0);
const BN_1$5 = BigInt(1);
function fromTwos(_value, _width) {
    const value = getUint(_value, "value");
    const width = BigInt(getNumber(_width, "width"));
    assert1(value >> width === BN_0$a, "overflow", "NUMERIC_FAULT", {
        operation: "fromTwos",
        fault: "overflow",
        value: _value
    });
    if (value >> width - BN_1$5) {
        const mask = (BN_1$5 << width) - BN_1$5;
        return -((~value & mask) + BN_1$5);
    }
    return value;
}
function toTwos(_value, _width) {
    let value = getBigInt(_value, "value");
    const width = BigInt(getNumber(_width, "width"));
    const limit = BN_1$5 << width - BN_1$5;
    if (value < BN_0$a) {
        value = -value;
        assert1(value <= limit, "too low", "NUMERIC_FAULT", {
            operation: "toTwos",
            fault: "overflow",
            value: _value
        });
        const mask = (BN_1$5 << width) - BN_1$5;
        return (~value & mask) + BN_1$5;
    } else {
        assert1(value < limit, "too high", "NUMERIC_FAULT", {
            operation: "toTwos",
            fault: "overflow",
            value: _value
        });
    }
    return value;
}
function mask(_value, _bits) {
    const value = getUint(_value, "value");
    const bits = BigInt(getNumber(_bits, "bits"));
    return value & (BN_1$5 << bits) - BN_1$5;
}
function getBigInt(value, name) {
    switch(typeof value){
        case "bigint":
            return value;
        case "number":
            assertArgument(Number.isInteger(value), "underflow", name || "value", value);
            assertArgument(value >= -9007199254740991 && value <= 9007199254740991, "overflow", name || "value", value);
            return BigInt(value);
        case "string":
            try {
                if (value === "") {
                    throw new Error("empty string");
                }
                if (value[0] === "-" && value[1] !== "-") {
                    return -BigInt(value.substring(1));
                }
                return BigInt(value);
            } catch (e) {
                assertArgument(false, `invalid BigNumberish string: ${e.message}`, name || "value", value);
            }
    }
    assertArgument(false, "invalid BigNumberish value", name || "value", value);
}
function getUint(value, name) {
    const result = getBigInt(value, name);
    assert1(result >= BN_0$a, "unsigned value cannot be negative", "NUMERIC_FAULT", {
        fault: "overflow",
        operation: "getUint",
        value: value
    });
    return result;
}
const Nibbles$1 = "0123456789abcdef";
function toBigInt(value) {
    if (value instanceof Uint8Array) {
        let result = "0x0";
        for (const v of value){
            result += Nibbles$1[v >> 4];
            result += Nibbles$1[v & 15];
        }
        return BigInt(result);
    }
    return getBigInt(value);
}
function getNumber(value, name) {
    switch(typeof value){
        case "bigint":
            assertArgument(value >= -9007199254740991 && value <= 9007199254740991, "overflow", name || "value", value);
            return Number(value);
        case "number":
            assertArgument(Number.isInteger(value), "underflow", name || "value", value);
            assertArgument(value >= -9007199254740991 && value <= 9007199254740991, "overflow", name || "value", value);
            return value;
        case "string":
            try {
                if (value === "") {
                    throw new Error("empty string");
                }
                return getNumber(BigInt(value), name);
            } catch (e) {
                assertArgument(false, `invalid numeric string: ${e.message}`, name || "value", value);
            }
    }
    assertArgument(false, "invalid numeric value", name || "value", value);
}
function toNumber(value) {
    return getNumber(toBigInt(value));
}
function toBeHex(_value, _width) {
    const value = getUint(_value, "value");
    let result = value.toString(16);
    if (_width == null) {
        if (result.length % 2) {
            result = "0" + result;
        }
    } else {
        const width = getNumber(_width, "width");
        assert1(width * 2 >= result.length, `value exceeds width (${width} bytes)`, "NUMERIC_FAULT", {
            operation: "toBeHex",
            fault: "overflow",
            value: _value
        });
        while(result.length < width * 2){
            result = "0" + result;
        }
    }
    return "0x" + result;
}
function toBeArray(_value) {
    const value = getUint(_value, "value");
    if (value === BN_0$a) {
        return new Uint8Array([]);
    }
    let hex = value.toString(16);
    if (hex.length % 2) {
        hex = "0" + hex;
    }
    const result = new Uint8Array(hex.length / 2);
    for(let i = 0; i < result.length; i++){
        const offset = i * 2;
        result[i] = parseInt(hex.substring(offset, offset + 2), 16);
    }
    return result;
}
function toQuantity(value) {
    let result = hexlify(isBytesLike(value) ? value : toBeArray(value)).substring(2);
    while(result.startsWith("0")){
        result = result.substring(1);
    }
    if (result === "") {
        result = "0";
    }
    return "0x" + result;
}
const Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
let Lookup = null;
function getAlpha(letter) {
    if (Lookup == null) {
        Lookup = {};
        for(let i = 0; i < Alphabet.length; i++){
            Lookup[Alphabet[i]] = BigInt(i);
        }
    }
    const result = Lookup[letter];
    assertArgument(result != null, `invalid base58 value`, "letter", letter);
    return result;
}
const BN_0$9 = BigInt(0);
const BN_58 = BigInt(58);
function encodeBase58(_value) {
    const bytes = getBytes(_value);
    let value = toBigInt(bytes);
    let result = "";
    while(value){
        result = Alphabet[Number(value % BN_58)] + result;
        value /= BN_58;
    }
    for(let i = 0; i < bytes.length; i++){
        if (bytes[i]) {
            break;
        }
        result = Alphabet[0] + result;
    }
    return result;
}
function decodeBase58(value) {
    let result = BN_0$9;
    for(let i = 0; i < value.length; i++){
        result *= BN_58;
        result += getAlpha(value[i]);
    }
    return result;
}
function decodeBase64(textData) {
    textData = atob(textData);
    const data = new Uint8Array(textData.length);
    for(let i = 0; i < textData.length; i++){
        data[i] = textData.charCodeAt(i);
    }
    return getBytes(data);
}
function encodeBase64(_data) {
    const data = getBytes(_data);
    let textData = "";
    for(let i = 0; i < data.length; i++){
        textData += String.fromCharCode(data[i]);
    }
    return btoa(textData);
}
class EventPayload {
    filter;
    emitter;
    #listener;
    constructor(emitter, listener, filter){
        this.#listener = listener;
        defineProperties(this, {
            emitter: emitter,
            filter: filter
        });
    }
    async removeListener() {
        if (this.#listener == null) {
            return;
        }
        await this.emitter.off(this.filter, this.#listener);
    }
}
function errorFunc(reason, offset, bytes, output, badCodepoint) {
    assertArgument(false, `invalid codepoint at offset ${offset}; ${reason}`, "bytes", bytes);
}
function ignoreFunc(reason, offset, bytes, output, badCodepoint) {
    if (reason === "BAD_PREFIX" || reason === "UNEXPECTED_CONTINUE") {
        let i = 0;
        for(let o = offset + 1; o < bytes.length; o++){
            if (bytes[o] >> 6 !== 2) {
                break;
            }
            i++;
        }
        return i;
    }
    if (reason === "OVERRUN") {
        return bytes.length - offset - 1;
    }
    return 0;
}
function replaceFunc(reason, offset, bytes, output, badCodepoint) {
    if (reason === "OVERLONG") {
        assertArgument(typeof badCodepoint === "number", "invalid bad code point for replacement", "badCodepoint", badCodepoint);
        output.push(badCodepoint);
        return 0;
    }
    output.push(65533);
    return ignoreFunc(reason, offset, bytes);
}
const Utf8ErrorFuncs = Object.freeze({
    error: errorFunc,
    ignore: ignoreFunc,
    replace: replaceFunc
});
function getUtf8CodePoints(_bytes, onError) {
    if (onError == null) {
        onError = Utf8ErrorFuncs.error;
    }
    const bytes = getBytes(_bytes, "bytes");
    const result = [];
    let i = 0;
    while(i < bytes.length){
        const c = bytes[i++];
        if (c >> 7 === 0) {
            result.push(c);
            continue;
        }
        let extraLength = null;
        let overlongMask = null;
        if ((c & 224) === 192) {
            extraLength = 1;
            overlongMask = 127;
        } else if ((c & 240) === 224) {
            extraLength = 2;
            overlongMask = 2047;
        } else if ((c & 248) === 240) {
            extraLength = 3;
            overlongMask = 65535;
        } else {
            if ((c & 192) === 128) {
                i += onError("UNEXPECTED_CONTINUE", i - 1, bytes, result);
            } else {
                i += onError("BAD_PREFIX", i - 1, bytes, result);
            }
            continue;
        }
        if (i - 1 + extraLength >= bytes.length) {
            i += onError("OVERRUN", i - 1, bytes, result);
            continue;
        }
        let res = c & (1 << 8 - extraLength - 1) - 1;
        for(let j = 0; j < extraLength; j++){
            let nextChar = bytes[i];
            if ((nextChar & 192) != 128) {
                i += onError("MISSING_CONTINUE", i, bytes, result);
                res = null;
                break;
            }
            res = res << 6 | nextChar & 63;
            i++;
        }
        if (res === null) {
            continue;
        }
        if (res > 1114111) {
            i += onError("OUT_OF_RANGE", i - 1 - extraLength, bytes, result, res);
            continue;
        }
        if (res >= 55296 && res <= 57343) {
            i += onError("UTF16_SURROGATE", i - 1 - extraLength, bytes, result, res);
            continue;
        }
        if (res <= overlongMask) {
            i += onError("OVERLONG", i - 1 - extraLength, bytes, result, res);
            continue;
        }
        result.push(res);
    }
    return result;
}
function toUtf8Bytes(str, form) {
    assertArgument(typeof str === "string", "invalid string value", "str", str);
    if (form != null) {
        assertNormalize(form);
        str = str.normalize(form);
    }
    let result = [];
    for(let i = 0; i < str.length; i++){
        const c = str.charCodeAt(i);
        if (c < 128) {
            result.push(c);
        } else if (c < 2048) {
            result.push(c >> 6 | 192);
            result.push(c & 63 | 128);
        } else if ((c & 64512) == 55296) {
            i++;
            const c2 = str.charCodeAt(i);
            assertArgument(i < str.length && (c2 & 64512) === 56320, "invalid surrogate pair", "str", str);
            const pair = 65536 + ((c & 1023) << 10) + (c2 & 1023);
            result.push(pair >> 18 | 240);
            result.push(pair >> 12 & 63 | 128);
            result.push(pair >> 6 & 63 | 128);
            result.push(pair & 63 | 128);
        } else {
            result.push(c >> 12 | 224);
            result.push(c >> 6 & 63 | 128);
            result.push(c & 63 | 128);
        }
    }
    return new Uint8Array(result);
}
function _toUtf8String(codePoints) {
    return codePoints.map((codePoint)=>{
        if (codePoint <= 65535) {
            return String.fromCharCode(codePoint);
        }
        codePoint -= 65536;
        return String.fromCharCode((codePoint >> 10 & 1023) + 55296, (codePoint & 1023) + 56320);
    }).join("");
}
function toUtf8String(bytes, onError) {
    return _toUtf8String(getUtf8CodePoints(bytes, onError));
}
function toUtf8CodePoints(str, form) {
    return getUtf8CodePoints(toUtf8Bytes(str, form));
}
function createGetUrl(options) {
    async function getUrl(req, _signal) {
        assert1(_signal == null || !_signal.cancelled, "request cancelled before sending", "CANCELLED");
        const protocol = req.url.split(":")[0].toLowerCase();
        assert1(protocol === "http" || protocol === "https", `unsupported protocol ${protocol}`, "UNSUPPORTED_OPERATION", {
            info: {
                protocol: protocol
            },
            operation: "request"
        });
        assert1(protocol === "https" || !req.credentials || req.allowInsecureAuthentication, "insecure authorized connections unsupported", "UNSUPPORTED_OPERATION", {
            operation: "request"
        });
        let error = null;
        const controller = new AbortController;
        const timer = setTimeout(()=>{
            error = makeError("request timeout", "TIMEOUT");
            controller.abort();
        }, req.timeout);
        if (_signal) {
            _signal.addListener(()=>{
                error = makeError("request cancelled", "CANCELLED");
                controller.abort();
            });
        }
        const init = {
            method: req.method,
            headers: new Headers(Array.from(req)),
            body: req.body || undefined,
            signal: controller.signal
        };
        let resp;
        try {
            resp = await fetch(req.url, init);
        } catch (_error) {
            clearTimeout(timer);
            if (error) {
                throw error;
            }
            throw _error;
        }
        clearTimeout(timer);
        const headers = {};
        resp.headers.forEach((value, key)=>{
            headers[key.toLowerCase()] = value;
        });
        const respBody = await resp.arrayBuffer();
        const body = respBody == null ? null : new Uint8Array(respBody);
        return {
            statusCode: resp.status,
            statusMessage: resp.statusText,
            headers: headers,
            body: body
        };
    }
    return getUrl;
}
const MAX_ATTEMPTS = 12;
const SLOT_INTERVAL = 250;
let defaultGetUrlFunc = createGetUrl();
const reData = new RegExp("^data:([^;:]*)?(;base64)?,(.*)$", "i");
const reIpfs = new RegExp("^ipfs://(ipfs/)?(.*)$", "i");
let locked$5 = false;
async function dataGatewayFunc(url, signal) {
    try {
        const match = url.match(reData);
        if (!match) {
            throw new Error("invalid data");
        }
        return new FetchResponse(200, "OK", {
            "content-type": match[1] || "text/plain"
        }, match[2] ? decodeBase64(match[3]) : unpercent(match[3]));
    } catch (error) {
        return new FetchResponse(599, "BAD REQUEST (invalid data: URI)", {}, null, new FetchRequest(url));
    }
}
function getIpfsGatewayFunc(baseUrl) {
    async function gatewayIpfs(url, signal) {
        try {
            const match = url.match(reIpfs);
            if (!match) {
                throw new Error("invalid link");
            }
            return new FetchRequest(`${baseUrl}${match[2]}`);
        } catch (error) {
            return new FetchResponse(599, "BAD REQUEST (invalid IPFS URI)", {}, null, new FetchRequest(url));
        }
    }
    return gatewayIpfs;
}
const Gateways = {
    data: dataGatewayFunc,
    ipfs: getIpfsGatewayFunc("https://gateway.ipfs.io/ipfs/")
};
const fetchSignals = new WeakMap;
class FetchCancelSignal {
    #listeners;
    #cancelled;
    constructor(request){
        this.#listeners = [];
        this.#cancelled = false;
        fetchSignals.set(request, ()=>{
            if (this.#cancelled) {
                return;
            }
            this.#cancelled = true;
            for (const listener of this.#listeners){
                setTimeout(()=>{
                    listener();
                }, 0);
            }
            this.#listeners = [];
        });
    }
    addListener(listener) {
        assert1(!this.#cancelled, "singal already cancelled", "UNSUPPORTED_OPERATION", {
            operation: "fetchCancelSignal.addCancelListener"
        });
        this.#listeners.push(listener);
    }
    get cancelled() {
        return this.#cancelled;
    }
    checkSignal() {
        assert1(!this.cancelled, "cancelled", "CANCELLED", {});
    }
}
function checkSignal(signal) {
    if (signal == null) {
        throw new Error("missing signal; should not happen");
    }
    signal.checkSignal();
    return signal;
}
class FetchRequest {
    #allowInsecure;
    #gzip;
    #headers;
    #method;
    #timeout;
    #url;
    #body;
    #bodyType;
    #creds;
    #preflight;
    #process;
    #retry;
    #signal;
    #throttle;
    #getUrlFunc;
    get url() {
        return this.#url;
    }
    set url(url) {
        this.#url = String(url);
    }
    get body() {
        if (this.#body == null) {
            return null;
        }
        return new Uint8Array(this.#body);
    }
    set body(body) {
        if (body == null) {
            this.#body = undefined;
            this.#bodyType = undefined;
        } else if (typeof body === "string") {
            this.#body = toUtf8Bytes(body);
            this.#bodyType = "text/plain";
        } else if (body instanceof Uint8Array) {
            this.#body = body;
            this.#bodyType = "application/octet-stream";
        } else if (typeof body === "object") {
            this.#body = toUtf8Bytes(JSON.stringify(body));
            this.#bodyType = "application/json";
        } else {
            throw new Error("invalid body");
        }
    }
    hasBody() {
        return this.#body != null;
    }
    get method() {
        if (this.#method) {
            return this.#method;
        }
        if (this.hasBody()) {
            return "POST";
        }
        return "GET";
    }
    set method(method) {
        if (method == null) {
            method = "";
        }
        this.#method = String(method).toUpperCase();
    }
    get headers() {
        const headers = Object.assign({}, this.#headers);
        if (this.#creds) {
            headers["authorization"] = `Basic ${encodeBase64(toUtf8Bytes(this.#creds))}`;
        }
        if (this.allowGzip) {
            headers["accept-encoding"] = "gzip";
        }
        if (headers["content-type"] == null && this.#bodyType) {
            headers["content-type"] = this.#bodyType;
        }
        if (this.body) {
            headers["content-length"] = String(this.body.length);
        }
        return headers;
    }
    getHeader(key) {
        return this.headers[key.toLowerCase()];
    }
    setHeader(key, value) {
        this.#headers[String(key).toLowerCase()] = String(value);
    }
    clearHeaders() {
        this.#headers = {};
    }
    [Symbol.iterator]() {
        const headers = this.headers;
        const keys = Object.keys(headers);
        let index = 0;
        return {
            next: ()=>{
                if (index < keys.length) {
                    const key = keys[index++];
                    return {
                        value: [
                            key,
                            headers[key]
                        ],
                        done: false
                    };
                }
                return {
                    value: undefined,
                    done: true
                };
            }
        };
    }
    get credentials() {
        return this.#creds || null;
    }
    setCredentials(username, password) {
        assertArgument(!username.match(/:/), "invalid basic authentication username", "username", "[REDACTED]");
        this.#creds = `${username}:${password}`;
    }
    get allowGzip() {
        return this.#gzip;
    }
    set allowGzip(value) {
        this.#gzip = !!value;
    }
    get allowInsecureAuthentication() {
        return !!this.#allowInsecure;
    }
    set allowInsecureAuthentication(value) {
        this.#allowInsecure = !!value;
    }
    get timeout() {
        return this.#timeout;
    }
    set timeout(timeout) {
        assertArgument(timeout >= 0, "timeout must be non-zero", "timeout", timeout);
        this.#timeout = timeout;
    }
    get preflightFunc() {
        return this.#preflight || null;
    }
    set preflightFunc(preflight) {
        this.#preflight = preflight;
    }
    get processFunc() {
        return this.#process || null;
    }
    set processFunc(process) {
        this.#process = process;
    }
    get retryFunc() {
        return this.#retry || null;
    }
    set retryFunc(retry) {
        this.#retry = retry;
    }
    get getUrlFunc() {
        return this.#getUrlFunc || defaultGetUrlFunc;
    }
    set getUrlFunc(value) {
        this.#getUrlFunc = value;
    }
    constructor(url){
        this.#url = String(url);
        this.#allowInsecure = false;
        this.#gzip = true;
        this.#headers = {};
        this.#method = "";
        this.#timeout = 3e5;
        this.#throttle = {
            slotInterval: SLOT_INTERVAL,
            maxAttempts: MAX_ATTEMPTS
        };
        this.#getUrlFunc = null;
    }
    toString() {
        return `<FetchRequest method=${JSON.stringify(this.method)} url=${JSON.stringify(this.url)} headers=${JSON.stringify(this.headers)} body=${this.#body ? hexlify(this.#body) : "null"}>`;
    }
    setThrottleParams(params) {
        if (params.slotInterval != null) {
            this.#throttle.slotInterval = params.slotInterval;
        }
        if (params.maxAttempts != null) {
            this.#throttle.maxAttempts = params.maxAttempts;
        }
    }
    async #send(attempt, expires, delay, _request, _response) {
        if (attempt >= this.#throttle.maxAttempts) {
            return _response.makeServerError("exceeded maximum retry limit");
        }
        assert1(getTime$2() <= expires, "timeout", "TIMEOUT", {
            operation: "request.send",
            reason: "timeout",
            request: _request
        });
        if (delay > 0) {
            await wait(delay);
        }
        let req = this.clone();
        const scheme = (req.url.split(":")[0] || "").toLowerCase();
        if (scheme in Gateways) {
            const result = await Gateways[scheme](req.url, checkSignal(_request.#signal));
            if (result instanceof FetchResponse) {
                let response = result;
                if (this.processFunc) {
                    checkSignal(_request.#signal);
                    try {
                        response = await this.processFunc(req, response);
                    } catch (error) {
                        if (error.throttle == null || typeof error.stall !== "number") {
                            response.makeServerError("error in post-processing function", error).assertOk();
                        }
                    }
                }
                return response;
            }
            req = result;
        }
        if (this.preflightFunc) {
            req = await this.preflightFunc(req);
        }
        const resp = await this.getUrlFunc(req, checkSignal(_request.#signal));
        let response1 = new FetchResponse(resp.statusCode, resp.statusMessage, resp.headers, resp.body, _request);
        if (response1.statusCode === 301 || response1.statusCode === 302) {
            try {
                const location = response1.headers.location || "";
                return req.redirect(location).#send(attempt + 1, expires, 0, _request, response1);
            } catch (error1) {}
            return response1;
        } else if (response1.statusCode === 429) {
            if (this.retryFunc == null || await this.retryFunc(req, response1, attempt)) {
                const retryAfter = response1.headers["retry-after"];
                let delay1 = this.#throttle.slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
                if (typeof retryAfter === "string" && retryAfter.match(/^[1-9][0-9]*$/)) {
                    delay1 = parseInt(retryAfter);
                }
                return req.clone().#send(attempt + 1, expires, delay1, _request, response1);
            }
        }
        if (this.processFunc) {
            checkSignal(_request.#signal);
            try {
                response1 = await this.processFunc(req, response1);
            } catch (error2) {
                if (error2.throttle == null || typeof error2.stall !== "number") {
                    response1.makeServerError("error in post-processing function", error2).assertOk();
                }
                let delay2 = this.#throttle.slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
                if (error2.stall >= 0) {
                    delay2 = error2.stall;
                }
                return req.clone().#send(attempt + 1, expires, delay2, _request, response1);
            }
        }
        return response1;
    }
    send() {
        assert1(this.#signal == null, "request already sent", "UNSUPPORTED_OPERATION", {
            operation: "fetchRequest.send"
        });
        this.#signal = new FetchCancelSignal(this);
        return this.#send(0, getTime$2() + this.timeout, 0, this, new FetchResponse(0, "", {}, null, this));
    }
    cancel() {
        assert1(this.#signal != null, "request has not been sent", "UNSUPPORTED_OPERATION", {
            operation: "fetchRequest.cancel"
        });
        const signal = fetchSignals.get(this);
        if (!signal) {
            throw new Error("missing signal; should not happen");
        }
        signal();
    }
    redirect(location) {
        const current = this.url.split(":")[0].toLowerCase();
        const target = location.split(":")[0].toLowerCase();
        assert1(this.method === "GET" && (current !== "https" || target !== "http") && location.match(/^https?:/), `unsupported redirect`, "UNSUPPORTED_OPERATION", {
            operation: `redirect(${this.method} ${JSON.stringify(this.url)} => ${JSON.stringify(location)})`
        });
        const req = new FetchRequest(location);
        req.method = "GET";
        req.allowGzip = this.allowGzip;
        req.timeout = this.timeout;
        req.#headers = Object.assign({}, this.#headers);
        if (this.#body) {
            req.#body = new Uint8Array(this.#body);
        }
        req.#bodyType = this.#bodyType;
        return req;
    }
    clone() {
        const clone = new FetchRequest(this.url);
        clone.#method = this.#method;
        if (this.#body) {
            clone.#body = this.#body;
        }
        clone.#bodyType = this.#bodyType;
        clone.#headers = Object.assign({}, this.#headers);
        clone.#creds = this.#creds;
        if (this.allowGzip) {
            clone.allowGzip = true;
        }
        clone.timeout = this.timeout;
        if (this.allowInsecureAuthentication) {
            clone.allowInsecureAuthentication = true;
        }
        clone.#preflight = this.#preflight;
        clone.#process = this.#process;
        clone.#retry = this.#retry;
        clone.#throttle = Object.assign({}, this.#throttle);
        clone.#getUrlFunc = this.#getUrlFunc;
        return clone;
    }
    static lockConfig() {
        locked$5 = true;
    }
    static getGateway(scheme) {
        return Gateways[scheme.toLowerCase()] || null;
    }
    static registerGateway(scheme, func) {
        scheme = scheme.toLowerCase();
        if (scheme === "http" || scheme === "https") {
            throw new Error(`cannot intercept ${scheme}; use registerGetUrl`);
        }
        if (locked$5) {
            throw new Error("gateways locked");
        }
        Gateways[scheme] = func;
    }
    static registerGetUrl(getUrl) {
        if (locked$5) {
            throw new Error("gateways locked");
        }
        defaultGetUrlFunc = getUrl;
    }
    static createGetUrlFunc(options) {
        return createGetUrl();
    }
    static createDataGateway() {
        return dataGatewayFunc;
    }
    static createIpfsGatewayFunc(baseUrl) {
        return getIpfsGatewayFunc(baseUrl);
    }
}
class FetchResponse {
    #statusCode;
    #statusMessage;
    #headers;
    #body;
    #request;
    #error;
    toString() {
        return `<FetchResponse status=${this.statusCode} body=${this.#body ? hexlify(this.#body) : "null"}>`;
    }
    get statusCode() {
        return this.#statusCode;
    }
    get statusMessage() {
        return this.#statusMessage;
    }
    get headers() {
        return Object.assign({}, this.#headers);
    }
    get body() {
        return this.#body == null ? null : new Uint8Array(this.#body);
    }
    get bodyText() {
        try {
            return this.#body == null ? "" : toUtf8String(this.#body);
        } catch (error) {
            assert1(false, "response body is not valid UTF-8 data", "UNSUPPORTED_OPERATION", {
                operation: "bodyText",
                info: {
                    response: this
                }
            });
        }
    }
    get bodyJson() {
        try {
            return JSON.parse(this.bodyText);
        } catch (error) {
            assert1(false, "response body is not valid JSON", "UNSUPPORTED_OPERATION", {
                operation: "bodyJson",
                info: {
                    response: this
                }
            });
        }
    }
    [Symbol.iterator]() {
        const headers = this.headers;
        const keys = Object.keys(headers);
        let index = 0;
        return {
            next: ()=>{
                if (index < keys.length) {
                    const key = keys[index++];
                    return {
                        value: [
                            key,
                            headers[key]
                        ],
                        done: false
                    };
                }
                return {
                    value: undefined,
                    done: true
                };
            }
        };
    }
    constructor(statusCode, statusMessage, headers, body, request){
        this.#statusCode = statusCode;
        this.#statusMessage = statusMessage;
        this.#headers = Object.keys(headers).reduce((accum, k)=>{
            accum[k.toLowerCase()] = String(headers[k]);
            return accum;
        }, {});
        this.#body = body == null ? null : new Uint8Array(body);
        this.#request = request || null;
        this.#error = {
            message: ""
        };
    }
    makeServerError(message, error) {
        let statusMessage;
        if (!message) {
            message = `${this.statusCode} ${this.statusMessage}`;
            statusMessage = `CLIENT ESCALATED SERVER ERROR (${message})`;
        } else {
            statusMessage = `CLIENT ESCALATED SERVER ERROR (${this.statusCode} ${this.statusMessage}; ${message})`;
        }
        const response = new FetchResponse(599, statusMessage, this.headers, this.body, this.#request || undefined);
        response.#error = {
            message: message,
            error: error
        };
        return response;
    }
    throwThrottleError(message, stall) {
        if (stall == null) {
            stall = -1;
        } else {
            assertArgument(Number.isInteger(stall) && stall >= 0, "invalid stall timeout", "stall", stall);
        }
        const error = new Error(message || "throttling requests");
        defineProperties(error, {
            stall: stall,
            throttle: true
        });
        throw error;
    }
    getHeader(key) {
        return this.headers[key.toLowerCase()];
    }
    hasBody() {
        return this.#body != null;
    }
    get request() {
        return this.#request;
    }
    ok() {
        return this.#error.message === "" && this.statusCode >= 200 && this.statusCode < 300;
    }
    assertOk() {
        if (this.ok()) {
            return;
        }
        let { message , error  } = this.#error;
        if (message === "") {
            message = `server response ${this.statusCode} ${this.statusMessage}`;
        }
        let requestUrl = null;
        if (this.request) {
            requestUrl = this.request.url;
        }
        let responseBody = null;
        try {
            if (this.#body) {
                responseBody = toUtf8String(this.#body);
            }
        } catch (e) {}
        assert1(false, message, "SERVER_ERROR", {
            request: this.request || "unknown request",
            response: this,
            error: error,
            info: {
                requestUrl: requestUrl,
                responseBody: responseBody,
                responseStatus: `${this.statusCode} ${this.statusMessage}`
            }
        });
    }
}
function getTime$2() {
    return (new Date).getTime();
}
function unpercent(value) {
    return toUtf8Bytes(value.replace(/%([0-9a-f][0-9a-f])/gi, (all, code)=>{
        return String.fromCharCode(parseInt(code, 16));
    }));
}
function wait(delay) {
    return new Promise((resolve)=>setTimeout(resolve, delay));
}
const BN_N1 = BigInt(-1);
const BN_0$8 = BigInt(0);
const BN_1$4 = BigInt(1);
const BN_5 = BigInt(5);
const _guard$5 = {};
let Zeros$1 = "0000";
while(Zeros$1.length < 80){
    Zeros$1 += Zeros$1;
}
function getTens(decimals) {
    let result = Zeros$1;
    while(result.length < decimals){
        result += result;
    }
    return BigInt("1" + result.substring(0, decimals));
}
function checkValue(val, format, safeOp) {
    const width = BigInt(format.width);
    if (format.signed) {
        const limit = BN_1$4 << width - BN_1$4;
        assert1(safeOp == null || val >= -limit && val < limit, "overflow", "NUMERIC_FAULT", {
            operation: safeOp,
            fault: "overflow",
            value: val
        });
        if (val > BN_0$8) {
            val = fromTwos(mask(val, width), width);
        } else {
            val = -fromTwos(mask(-val, width), width);
        }
    } else {
        const limit1 = BN_1$4 << width;
        assert1(safeOp == null || val >= 0 && val < limit1, "overflow", "NUMERIC_FAULT", {
            operation: safeOp,
            fault: "overflow",
            value: val
        });
        val = (val % limit1 + limit1) % limit1 & limit1 - BN_1$4;
    }
    return val;
}
function getFormat(value) {
    if (typeof value === "number") {
        value = `fixed128x${value}`;
    }
    let signed = true;
    let width = 128;
    let decimals = 18;
    if (typeof value === "string") {
        if (value === "fixed") ;
        else if (value === "ufixed") {
            signed = false;
        } else {
            const match = value.match(/^(u?)fixed([0-9]+)x([0-9]+)$/);
            assertArgument(match, "invalid fixed format", "format", value);
            signed = match[1] !== "u";
            width = parseInt(match[2]);
            decimals = parseInt(match[3]);
        }
    } else if (value) {
        const v = value;
        const check = (key, type, defaultValue)=>{
            if (v[key] == null) {
                return defaultValue;
            }
            assertArgument(typeof v[key] === type, "invalid fixed format (" + key + " not " + type + ")", "format." + key, v[key]);
            return v[key];
        };
        signed = check("signed", "boolean", signed);
        width = check("width", "number", width);
        decimals = check("decimals", "number", decimals);
    }
    assertArgument(width % 8 === 0, "invalid FixedNumber width (not byte aligned)", "format.width", width);
    assertArgument(decimals <= 80, "invalid FixedNumber decimals (too large)", "format.decimals", decimals);
    const name = (signed ? "" : "u") + "fixed" + String(width) + "x" + String(decimals);
    return {
        signed: signed,
        width: width,
        decimals: decimals,
        name: name
    };
}
function toString(val, decimals) {
    let negative = "";
    if (val < BN_0$8) {
        negative = "-";
        val *= BN_N1;
    }
    let str = val.toString();
    if (decimals === 0) {
        return negative + str;
    }
    while(str.length <= decimals){
        str = Zeros$1 + str;
    }
    const index = str.length - decimals;
    str = str.substring(0, index) + "." + str.substring(index);
    while(str[0] === "0" && str[1] !== "."){
        str = str.substring(1);
    }
    while(str[str.length - 1] === "0" && str[str.length - 2] !== "."){
        str = str.substring(0, str.length - 1);
    }
    return negative + str;
}
class FixedNumber {
    format;
    #format;
    #val;
    #tens;
    _value;
    constructor(guard, value, format){
        assertPrivate(guard, _guard$5, "FixedNumber");
        this.#val = value;
        this.#format = format;
        const _value = toString(value, format.decimals);
        defineProperties(this, {
            format: format.name,
            _value: _value
        });
        this.#tens = getTens(format.decimals);
    }
    get signed() {
        return this.#format.signed;
    }
    get width() {
        return this.#format.width;
    }
    get decimals() {
        return this.#format.decimals;
    }
    get value() {
        return this.#val;
    }
    #checkFormat(other) {
        assertArgument(this.format === other.format, "incompatible format; use fixedNumber.toFormat", "other", other);
    }
    #checkValue(val, safeOp) {
        val = checkValue(val, this.#format, safeOp);
        return new FixedNumber(_guard$5, val, this.#format);
    }
    #add(o, safeOp1) {
        this.#checkFormat(o);
        return this.#checkValue(this.#val + o.#val, safeOp1);
    }
    addUnsafe(other) {
        return this.#add(other);
    }
    add(other) {
        return this.#add(other, "add");
    }
    #sub(o1, safeOp2) {
        this.#checkFormat(o1);
        return this.#checkValue(this.#val - o1.#val, safeOp2);
    }
    subUnsafe(other) {
        return this.#sub(other);
    }
    sub(other) {
        return this.#sub(other, "sub");
    }
    #mul(o2, safeOp3) {
        this.#checkFormat(o2);
        return this.#checkValue(this.#val * o2.#val / this.#tens, safeOp3);
    }
    mulUnsafe(other) {
        return this.#mul(other);
    }
    mul(other) {
        return this.#mul(other, "mul");
    }
    mulSignal(other) {
        this.#checkFormat(other);
        const value = this.#val * other.#val;
        assert1(value % this.#tens === BN_0$8, "precision lost during signalling mul", "NUMERIC_FAULT", {
            operation: "mulSignal",
            fault: "underflow",
            value: this
        });
        return this.#checkValue(value / this.#tens, "mulSignal");
    }
    #div(o3, safeOp4) {
        assert1(o3.#val !== BN_0$8, "division by zero", "NUMERIC_FAULT", {
            operation: "div",
            fault: "divide-by-zero",
            value: this
        });
        this.#checkFormat(o3);
        return this.#checkValue(this.#val * this.#tens / o3.#val, safeOp4);
    }
    divUnsafe(other) {
        return this.#div(other);
    }
    div(other) {
        return this.#div(other, "div");
    }
    divSignal(other) {
        assert1(other.#val !== BN_0$8, "division by zero", "NUMERIC_FAULT", {
            operation: "div",
            fault: "divide-by-zero",
            value: this
        });
        this.#checkFormat(other);
        const value = this.#val * this.#tens;
        assert1(value % other.#val === BN_0$8, "precision lost during signalling div", "NUMERIC_FAULT", {
            operation: "divSignal",
            fault: "underflow",
            value: this
        });
        return this.#checkValue(value / other.#val, "divSignal");
    }
    cmp(other) {
        let a = this.value, b = other.value;
        const delta = this.decimals - other.decimals;
        if (delta > 0) {
            b *= getTens(delta);
        } else if (delta < 0) {
            a *= getTens(-delta);
        }
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    }
    eq(other) {
        return this.cmp(other) === 0;
    }
    lt(other) {
        return this.cmp(other) < 0;
    }
    lte(other) {
        return this.cmp(other) <= 0;
    }
    gt(other) {
        return this.cmp(other) > 0;
    }
    gte(other) {
        return this.cmp(other) >= 0;
    }
    floor() {
        let val = this.#val;
        if (this.#val < BN_0$8) {
            val -= this.#tens - BN_1$4;
        }
        val = this.#val / this.#tens * this.#tens;
        return this.#checkValue(val, "floor");
    }
    ceiling() {
        let val = this.#val;
        if (this.#val > BN_0$8) {
            val += this.#tens - BN_1$4;
        }
        val = this.#val / this.#tens * this.#tens;
        return this.#checkValue(val, "ceiling");
    }
    round(decimals) {
        if (decimals == null) {
            decimals = 0;
        }
        if (decimals >= this.decimals) {
            return this;
        }
        const delta = this.decimals - decimals;
        const bump = BN_5 * getTens(delta - 1);
        let value = this.value + bump;
        const tens = getTens(delta);
        value = value / tens * tens;
        checkValue(value, this.#format, "round");
        return new FixedNumber(_guard$5, value, this.#format);
    }
    isZero() {
        return this.#val === BN_0$8;
    }
    isNegative() {
        return this.#val < BN_0$8;
    }
    toString() {
        return this._value;
    }
    toUnsafeFloat() {
        return parseFloat(this.toString());
    }
    toFormat(format) {
        return FixedNumber.fromString(this.toString(), format);
    }
    static fromValue(_value, _decimals, _format) {
        const decimals = _decimals == null ? 0 : getNumber(_decimals);
        const format = getFormat(_format);
        let value = getBigInt(_value, "value");
        const delta = decimals - format.decimals;
        if (delta > 0) {
            const tens = getTens(delta);
            assert1(value % tens === BN_0$8, "value loses precision for format", "NUMERIC_FAULT", {
                operation: "fromValue",
                fault: "underflow",
                value: _value
            });
            value /= tens;
        } else if (delta < 0) {
            value *= getTens(-delta);
        }
        checkValue(value, format, "fromValue");
        return new FixedNumber(_guard$5, value, format);
    }
    static fromString(_value, _format) {
        const match = _value.match(/^(-?)([0-9]*)\.?([0-9]*)$/);
        assertArgument(match && match[2].length + match[3].length > 0, "invalid FixedNumber string value", "value", _value);
        const format = getFormat(_format);
        let whole = match[2] || "0", decimal = match[3] || "";
        while(decimal.length < format.decimals){
            decimal += Zeros$1;
        }
        assert1(decimal.substring(format.decimals).match(/^0*$/), "too many decimals for format", "NUMERIC_FAULT", {
            operation: "fromString",
            fault: "underflow",
            value: _value
        });
        decimal = decimal.substring(0, format.decimals);
        const value = BigInt(match[1] + whole + decimal);
        checkValue(value, format, "fromString");
        return new FixedNumber(_guard$5, value, format);
    }
    static fromBytes(_value, _format) {
        let value = toBigInt(getBytes(_value, "value"));
        const format = getFormat(_format);
        if (format.signed) {
            value = fromTwos(value, format.width);
        }
        checkValue(value, format, "fromBytes");
        return new FixedNumber(_guard$5, value, format);
    }
}
function hexlifyByte(value) {
    let result = value.toString(16);
    while(result.length < 2){
        result = "0" + result;
    }
    return "0x" + result;
}
function unarrayifyInteger(data, offset, length) {
    let result = 0;
    for(let i = 0; i < length; i++){
        result = result * 256 + data[offset + i];
    }
    return result;
}
function _decodeChildren(data, offset, childOffset, length) {
    const result = [];
    while(childOffset < offset + 1 + length){
        const decoded = _decode(data, childOffset);
        result.push(decoded.result);
        childOffset += decoded.consumed;
        assert1(childOffset <= offset + 1 + length, "child data too short", "BUFFER_OVERRUN", {
            buffer: data,
            length: length,
            offset: offset
        });
    }
    return {
        consumed: 1 + length,
        result: result
    };
}
function _decode(data, offset) {
    assert1(data.length !== 0, "data too short", "BUFFER_OVERRUN", {
        buffer: data,
        length: 0,
        offset: 1
    });
    const checkOffset = (offset)=>{
        assert1(offset <= data.length, "data short segment too short", "BUFFER_OVERRUN", {
            buffer: data,
            length: data.length,
            offset: offset
        });
    };
    if (data[offset] >= 248) {
        const lengthLength = data[offset] - 247;
        checkOffset(offset + 1 + lengthLength);
        const length = unarrayifyInteger(data, offset + 1, lengthLength);
        checkOffset(offset + 1 + lengthLength + length);
        return _decodeChildren(data, offset, offset + 1 + lengthLength, lengthLength + length);
    } else if (data[offset] >= 192) {
        const length1 = data[offset] - 192;
        checkOffset(offset + 1 + length1);
        return _decodeChildren(data, offset, offset + 1, length1);
    } else if (data[offset] >= 184) {
        const lengthLength1 = data[offset] - 183;
        checkOffset(offset + 1 + lengthLength1);
        const length2 = unarrayifyInteger(data, offset + 1, lengthLength1);
        checkOffset(offset + 1 + lengthLength1 + length2);
        const result = hexlify(data.slice(offset + 1 + lengthLength1, offset + 1 + lengthLength1 + length2));
        return {
            consumed: 1 + lengthLength1 + length2,
            result: result
        };
    } else if (data[offset] >= 128) {
        const length3 = data[offset] - 128;
        checkOffset(offset + 1 + length3);
        const result1 = hexlify(data.slice(offset + 1, offset + 1 + length3));
        return {
            consumed: 1 + length3,
            result: result1
        };
    }
    return {
        consumed: 1,
        result: hexlifyByte(data[offset])
    };
}
function decodeRlp(_data) {
    const data = getBytes(_data, "data");
    const decoded = _decode(data, 0);
    assertArgument(decoded.consumed === data.length, "unexpected junk after rlp payload", "data", _data);
    return decoded.result;
}
function arrayifyInteger(value) {
    const result = [];
    while(value){
        result.unshift(value & 255);
        value >>= 8;
    }
    return result;
}
function _encode(object) {
    if (Array.isArray(object)) {
        let payload = [];
        object.forEach(function(child) {
            payload = payload.concat(_encode(child));
        });
        if (payload.length <= 55) {
            payload.unshift(192 + payload.length);
            return payload;
        }
        const length = arrayifyInteger(payload.length);
        length.unshift(247 + length.length);
        return length.concat(payload);
    }
    const data = Array.prototype.slice.call(getBytes(object, "object"));
    if (data.length === 1 && data[0] <= 127) {
        return data;
    } else if (data.length <= 55) {
        data.unshift(128 + data.length);
        return data;
    }
    const length1 = arrayifyInteger(data.length);
    length1.unshift(183 + length1.length);
    return length1.concat(data);
}
const nibbles = "0123456789abcdef";
function encodeRlp(object) {
    let result = "0x";
    for (const v of _encode(object)){
        result += nibbles[v >> 4];
        result += nibbles[v & 15];
    }
    return result;
}
const names = [
    "wei",
    "kwei",
    "mwei",
    "gwei",
    "szabo",
    "finney",
    "ether"
];
function formatUnits(value, unit) {
    let decimals = 18;
    if (typeof unit === "string") {
        const index = names.indexOf(unit);
        assertArgument(index >= 0, "invalid unit", "unit", unit);
        decimals = 3 * index;
    } else if (unit != null) {
        decimals = getNumber(unit, "unit");
    }
    return FixedNumber.fromValue(value, decimals, {
        decimals: decimals,
        width: 512
    }).toString();
}
function parseUnits$1(value, unit) {
    assertArgument(typeof value === "string", "value must be a string", "value", value);
    let decimals = 18;
    if (typeof unit === "string") {
        const index = names.indexOf(unit);
        assertArgument(index >= 0, "invalid unit", "unit", unit);
        decimals = 3 * index;
    } else if (unit != null) {
        decimals = getNumber(unit, "unit");
    }
    return FixedNumber.fromString(value, {
        decimals: decimals,
        width: 512
    }).value;
}
function formatEther(wei) {
    return formatUnits(wei, 18);
}
function parseEther(ether) {
    return parseUnits$1(ether, 18);
}
function uuidV4(randomBytes) {
    const bytes = getBytes(randomBytes, "randomBytes");
    bytes[6] = bytes[6] & 15 | 64;
    bytes[8] = bytes[8] & 63 | 128;
    const value = hexlify(bytes);
    return [
        value.substring(2, 10),
        value.substring(10, 14),
        value.substring(14, 18),
        value.substring(18, 22),
        value.substring(22, 34)
    ].join("-");
}
const WordSize = 32;
const Padding = new Uint8Array(32);
const passProperties$1 = [
    "then"
];
const _guard$4 = {};
const resultNames = new WeakMap;
function getNames(result) {
    return resultNames.get(result);
}
function setNames(result, names) {
    resultNames.set(result, names);
}
function throwError(name, error) {
    const wrapped = new Error(`deferred error during ABI decoding triggered accessing ${name}`);
    wrapped.error = error;
    throw wrapped;
}
function toObject(names, items, deep) {
    if (names.indexOf(null) >= 0) {
        return items.map((item, index)=>{
            if (item instanceof Result) {
                return toObject(getNames(item), item, deep);
            }
            return item;
        });
    }
    return names.reduce((accum, name, index)=>{
        let item = items.getValue(name);
        if (!(name in accum)) {
            if (deep && item instanceof Result) {
                item = toObject(getNames(item), item, deep);
            }
            accum[name] = item;
        }
        return accum;
    }, {});
}
class Result extends Array {
    #names;
    constructor(...args){
        const guard = args[0];
        let items = args[1];
        let names = (args[2] || []).slice();
        let wrap = true;
        if (guard !== _guard$4) {
            items = args;
            names = [];
            wrap = false;
        }
        super(items.length);
        items.forEach((item, index)=>{
            this[index] = item;
        });
        const nameCounts = names.reduce((accum, name)=>{
            if (typeof name === "string") {
                accum.set(name, (accum.get(name) || 0) + 1);
            }
            return accum;
        }, new Map);
        setNames(this, Object.freeze(items.map((item, index)=>{
            const name = names[index];
            if (name != null && nameCounts.get(name) === 1) {
                return name;
            }
            return null;
        })));
        this.#names = [];
        if (this.#names == null) {
            void this.#names;
        }
        if (!wrap) {
            return;
        }
        Object.freeze(this);
        const proxy = new Proxy(this, {
            get: (target, prop, receiver)=>{
                if (typeof prop === "string") {
                    if (prop.match(/^[0-9]+$/)) {
                        const index = getNumber(prop, "%index");
                        if (index < 0 || index >= this.length) {
                            throw new RangeError("out of result range");
                        }
                        const item = target[index];
                        if (item instanceof Error) {
                            throwError(`index ${index}`, item);
                        }
                        return item;
                    }
                    if (passProperties$1.indexOf(prop) >= 0) {
                        return Reflect.get(target, prop, receiver);
                    }
                    const value = target[prop];
                    if (value instanceof Function) {
                        return function(...args) {
                            return value.apply(this === receiver ? target : this, args);
                        };
                    } else if (!(prop in target)) {
                        return target.getValue.apply(this === receiver ? target : this, [
                            prop
                        ]);
                    }
                }
                return Reflect.get(target, prop, receiver);
            }
        });
        setNames(proxy, getNames(this));
        return proxy;
    }
    toArray(deep) {
        const result = [];
        this.forEach((item, index)=>{
            if (item instanceof Error) {
                throwError(`index ${index}`, item);
            }
            if (deep && item instanceof Result) {
                item = item.toArray(deep);
            }
            result.push(item);
        });
        return result;
    }
    toObject(deep) {
        const names = getNames(this);
        return names.reduce((accum, name, index)=>{
            assert1(name != null, `value at index ${index} unnamed`, "UNSUPPORTED_OPERATION", {
                operation: "toObject()"
            });
            return toObject(names, this, deep);
        }, {});
    }
    slice(start, end) {
        if (start == null) {
            start = 0;
        }
        if (start < 0) {
            start += this.length;
            if (start < 0) {
                start = 0;
            }
        }
        if (end == null) {
            end = this.length;
        }
        if (end < 0) {
            end += this.length;
            if (end < 0) {
                end = 0;
            }
        }
        if (end > this.length) {
            end = this.length;
        }
        const _names = getNames(this);
        const result = [], names = [];
        for(let i = start; i < end; i++){
            result.push(this[i]);
            names.push(_names[i]);
        }
        return new Result(_guard$4, result, names);
    }
    filter(callback, thisArg) {
        const _names = getNames(this);
        const result = [], names = [];
        for(let i = 0; i < this.length; i++){
            const item = this[i];
            if (item instanceof Error) {
                throwError(`index ${i}`, item);
            }
            if (callback.call(thisArg, item, i, this)) {
                result.push(item);
                names.push(_names[i]);
            }
        }
        return new Result(_guard$4, result, names);
    }
    map(callback, thisArg) {
        const result = [];
        for(let i = 0; i < this.length; i++){
            const item = this[i];
            if (item instanceof Error) {
                throwError(`index ${i}`, item);
            }
            result.push(callback.call(thisArg, item, i, this));
        }
        return result;
    }
    getValue(name) {
        const index = getNames(this).indexOf(name);
        if (index === -1) {
            return undefined;
        }
        const value = this[index];
        if (value instanceof Error) {
            throwError(`property ${JSON.stringify(name)}`, value.error);
        }
        return value;
    }
    static fromItems(items, keys) {
        return new Result(_guard$4, items, keys);
    }
}
function checkResultErrors(result) {
    const errors = [];
    const checkErrors = function(path, object) {
        if (!Array.isArray(object)) {
            return;
        }
        for(let key in object){
            const childPath = path.slice();
            childPath.push(key);
            try {
                checkErrors(childPath, object[key]);
            } catch (error) {
                errors.push({
                    path: childPath,
                    error: error
                });
            }
        }
    };
    checkErrors([], result);
    return errors;
}
function getValue$1(value) {
    let bytes = toBeArray(value);
    assert1(bytes.length <= 32, "value out-of-bounds", "BUFFER_OVERRUN", {
        buffer: bytes,
        length: 32,
        offset: bytes.length
    });
    if (bytes.length !== 32) {
        bytes = getBytesCopy(concat([
            Padding.slice(bytes.length % WordSize),
            bytes
        ]));
    }
    return bytes;
}
class Coder {
    name;
    type;
    localName;
    dynamic;
    constructor(name, type, localName, dynamic){
        defineProperties(this, {
            name: name,
            type: type,
            localName: localName,
            dynamic: dynamic
        }, {
            name: "string",
            type: "string",
            localName: "string",
            dynamic: "boolean"
        });
    }
    _throwError(message, value) {
        assertArgument(false, message, this.localName, value);
    }
}
class Writer {
    #data;
    #dataLength;
    constructor(){
        this.#data = [];
        this.#dataLength = 0;
    }
    get data() {
        return concat(this.#data);
    }
    get length() {
        return this.#dataLength;
    }
    #writeData(data) {
        this.#data.push(data);
        this.#dataLength += data.length;
        return data.length;
    }
    appendWriter(writer) {
        return this.#writeData(getBytesCopy(writer.data));
    }
    writeBytes(value) {
        let bytes = getBytesCopy(value);
        const paddingOffset = bytes.length % 32;
        if (paddingOffset) {
            bytes = getBytesCopy(concat([
                bytes,
                Padding.slice(paddingOffset)
            ]));
        }
        return this.#writeData(bytes);
    }
    writeValue(value) {
        return this.#writeData(getValue$1(value));
    }
    writeUpdatableValue() {
        const offset = this.#data.length;
        this.#data.push(Padding);
        this.#dataLength += WordSize;
        return (value)=>{
            this.#data[offset] = getValue$1(value);
        };
    }
}
class Reader {
    allowLoose;
    #data;
    #offset;
    #bytesRead;
    #parent;
    #maxInflation;
    constructor(data, allowLoose, maxInflation){
        defineProperties(this, {
            allowLoose: !!allowLoose
        });
        this.#data = getBytesCopy(data);
        this.#bytesRead = 0;
        this.#parent = null;
        this.#maxInflation = maxInflation != null ? maxInflation : 1024;
        this.#offset = 0;
    }
    get data() {
        return hexlify(this.#data);
    }
    get dataLength() {
        return this.#data.length;
    }
    get consumed() {
        return this.#offset;
    }
    get bytes() {
        return new Uint8Array(this.#data);
    }
    #incrementBytesRead(count) {
        if (this.#parent) {
            return this.#parent.#incrementBytesRead(count);
        }
        this.#bytesRead += count;
        assert1(this.#maxInflation < 1 || this.#bytesRead <= this.#maxInflation * this.dataLength, `compressed ABI data exceeds inflation ratio of ${this.#maxInflation} ( see: https:/\/github.com/ethers-io/ethers.js/issues/4537 )`, "BUFFER_OVERRUN", {
            buffer: getBytesCopy(this.#data),
            offset: this.#offset,
            length: count,
            info: {
                bytesRead: this.#bytesRead,
                dataLength: this.dataLength
            }
        });
    }
    #peekBytes(offset, length, loose) {
        let alignedLength = Math.ceil(length / 32) * 32;
        if (this.#offset + alignedLength > this.#data.length) {
            if (this.allowLoose && loose && this.#offset + length <= this.#data.length) {
                alignedLength = length;
            } else {
                assert1(false, "data out-of-bounds", "BUFFER_OVERRUN", {
                    buffer: getBytesCopy(this.#data),
                    length: this.#data.length,
                    offset: this.#offset + alignedLength
                });
            }
        }
        return this.#data.slice(this.#offset, this.#offset + alignedLength);
    }
    subReader(offset) {
        const reader = new Reader(this.#data.slice(this.#offset + offset), this.allowLoose, this.#maxInflation);
        reader.#parent = this;
        return reader;
    }
    readBytes(length, loose) {
        let bytes = this.#peekBytes(0, length, !!loose);
        this.#incrementBytesRead(length);
        this.#offset += bytes.length;
        return bytes.slice(0, length);
    }
    readValue() {
        return toBigInt(this.readBytes(32));
    }
    readIndex() {
        return toNumber(this.readBytes(32));
    }
}
function number(n) {
    if (!Number.isSafeInteger(n) || n < 0) throw new Error(`Wrong positive integer: ${n}`);
}
function bytes(b, ...lengths) {
    if (!(b instanceof Uint8Array)) throw new Error("Expected Uint8Array");
    if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
}
function hash(hash) {
    if (typeof hash !== "function" || typeof hash.create !== "function") throw new Error("Hash should be wrapped by utils.wrapConstructor");
    number(hash.outputLen);
    number(hash.blockLen);
}
function exists(instance, checkFinished = true) {
    if (instance.destroyed) throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
}
function output(out, instance) {
    bytes(out);
    const min = instance.outputLen;
    if (out.length < min) {
        throw new Error(`digestInto() expects output buffer of length at least ${min}`);
    }
}
const crypto$1 = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : undefined;
const u8a$1 = (a)=>a instanceof Uint8Array;
const u32 = (arr)=>new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
const createView = (arr)=>new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
const rotr = (word, shift)=>word << 32 - shift | word >>> shift;
const isLE = new Uint8Array(new Uint32Array([
    287454020
]).buffer)[0] === 68;
if (!isLE) throw new Error("Non little-endian hardware is not supported");
const nextTick = async ()=>{};
async function asyncLoop(iters, tick, cb) {
    let ts = Date.now();
    for(let i = 0; i < iters; i++){
        cb(i);
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick) continue;
        await nextTick();
        ts += diff;
    }
}
function utf8ToBytes$1(str) {
    if (typeof str !== "string") throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
    return new Uint8Array((new TextEncoder).encode(str));
}
function toBytes(data) {
    if (typeof data === "string") data = utf8ToBytes$1(data);
    if (!u8a$1(data)) throw new Error(`expected Uint8Array, got ${typeof data}`);
    return data;
}
function concatBytes$1(...arrays) {
    const r = new Uint8Array(arrays.reduce((sum, a)=>sum + a.length, 0));
    let pad = 0;
    arrays.forEach((a)=>{
        if (!u8a$1(a)) throw new Error("Uint8Array expected");
        r.set(a, pad);
        pad += a.length;
    });
    return r;
}
class Hash {
    clone() {
        return this._cloneInto();
    }
}
const toStr = {}.toString;
function checkOpts(defaults, opts) {
    if (opts !== undefined && toStr.call(opts) !== "[object Object]") throw new Error("Options should be object or undefined");
    const merged = Object.assign(defaults, opts);
    return merged;
}
function wrapConstructor(hashCons) {
    const hashC = (msg)=>hashCons().update(toBytes(msg)).digest();
    const tmp = hashCons();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = ()=>hashCons();
    return hashC;
}
function randomBytes$2(bytesLength = 32) {
    if (crypto$1 && typeof crypto$1.getRandomValues === "function") {
        return crypto$1.getRandomValues(new Uint8Array(bytesLength));
    }
    throw new Error("crypto.getRandomValues must be defined");
}
class HMAC extends Hash {
    constructor(hash$1, _key){
        super();
        this.finished = false;
        this.destroyed = false;
        hash(hash$1);
        const key = toBytes(_key);
        this.iHash = hash$1.create();
        if (typeof this.iHash.update !== "function") throw new Error("Expected instance of class which extends utils.Hash");
        this.blockLen = this.iHash.blockLen;
        this.outputLen = this.iHash.outputLen;
        const blockLen = this.blockLen;
        const pad = new Uint8Array(blockLen);
        pad.set(key.length > blockLen ? hash$1.create().update(key).digest() : key);
        for(let i = 0; i < pad.length; i++)pad[i] ^= 54;
        this.iHash.update(pad);
        this.oHash = hash$1.create();
        for(let i1 = 0; i1 < pad.length; i1++)pad[i1] ^= 54 ^ 92;
        this.oHash.update(pad);
        pad.fill(0);
    }
    update(buf) {
        exists(this);
        this.iHash.update(buf);
        return this;
    }
    digestInto(out) {
        exists(this);
        bytes(out, this.outputLen);
        this.finished = true;
        this.iHash.digestInto(out);
        this.oHash.update(out);
        this.oHash.digestInto(out);
        this.destroy();
    }
    digest() {
        const out = new Uint8Array(this.oHash.outputLen);
        this.digestInto(out);
        return out;
    }
    _cloneInto(to) {
        to || (to = Object.create(Object.getPrototypeOf(this), {}));
        const { oHash , iHash , finished , destroyed , blockLen , outputLen  } = this;
        to = to;
        to.finished = finished;
        to.destroyed = destroyed;
        to.blockLen = blockLen;
        to.outputLen = outputLen;
        to.oHash = oHash._cloneInto(to.oHash);
        to.iHash = iHash._cloneInto(to.iHash);
        return to;
    }
    destroy() {
        this.destroyed = true;
        this.oHash.destroy();
        this.iHash.destroy();
    }
}
const hmac = (hash, key, message)=>new HMAC(hash, key).update(message).digest();
hmac.create = (hash, key)=>new HMAC(hash, key);
function pbkdf2Init(hash$1, _password, _salt, _opts) {
    hash(hash$1);
    const opts = checkOpts({
        dkLen: 32,
        asyncTick: 10
    }, _opts);
    const { c , dkLen , asyncTick  } = opts;
    number(c);
    number(dkLen);
    number(asyncTick);
    if (c < 1) throw new Error("PBKDF2: iterations (c) should be >= 1");
    const password = toBytes(_password);
    const salt = toBytes(_salt);
    const DK = new Uint8Array(dkLen);
    const PRF = hmac.create(hash$1, password);
    const PRFSalt = PRF._cloneInto().update(salt);
    return {
        c: c,
        dkLen: dkLen,
        asyncTick: asyncTick,
        DK: DK,
        PRF: PRF,
        PRFSalt: PRFSalt
    };
}
function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
    PRF.destroy();
    PRFSalt.destroy();
    if (prfW) prfW.destroy();
    u.fill(0);
    return DK;
}
function pbkdf2$1(hash, password, salt, opts) {
    const { c , dkLen , DK , PRF , PRFSalt  } = pbkdf2Init(hash, password, salt, opts);
    let prfW;
    const arr = new Uint8Array(4);
    const view = createView(arr);
    const u = new Uint8Array(PRF.outputLen);
    for(let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen){
        const Ti = DK.subarray(pos, pos + PRF.outputLen);
        view.setInt32(0, ti, false);
        (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
        Ti.set(u.subarray(0, Ti.length));
        for(let ui = 1; ui < c; ui++){
            PRF._cloneInto(prfW).update(u).digestInto(u);
            for(let i = 0; i < Ti.length; i++)Ti[i] ^= u[i];
        }
    }
    return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
}
function setBigUint64(view, byteOffset, value, isLE) {
    if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE);
    const _32n = BigInt(32);
    const _u32_max = BigInt(4294967295);
    const wh = Number(value >> _32n & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE ? 4 : 0;
    const l = isLE ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE);
    view.setUint32(byteOffset + l, wl, isLE);
}
class SHA2 extends Hash {
    constructor(blockLen, outputLen, padOffset, isLE){
        super();
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE;
        this.finished = false;
        this.length = 0;
        this.pos = 0;
        this.destroyed = false;
        this.buffer = new Uint8Array(blockLen);
        this.view = createView(this.buffer);
    }
    update(data) {
        exists(this);
        const { view , buffer , blockLen  } = this;
        data = toBytes(data);
        const len = data.length;
        for(let pos = 0; pos < len;){
            const take = Math.min(blockLen - this.pos, len - pos);
            if (take === blockLen) {
                const dataView = createView(data);
                for(; blockLen <= len - pos; pos += blockLen)this.process(dataView, pos);
                continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
                this.process(view, 0);
                this.pos = 0;
            }
        }
        this.length += data.length;
        this.roundClean();
        return this;
    }
    digestInto(out) {
        exists(this);
        output(out, this);
        this.finished = true;
        const { buffer , view , blockLen , isLE  } = this;
        let { pos  } = this;
        buffer[pos++] = 128;
        this.buffer.subarray(pos).fill(0);
        if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
        }
        for(let i = pos; i < blockLen; i++)buffer[i] = 0;
        setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
        this.process(view, 0);
        const oview = createView(out);
        const len = this.outputLen;
        if (len % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
        const outLen = len / 4;
        const state = this.get();
        if (outLen > state.length) throw new Error("_sha2: outputLen bigger than state");
        for(let i1 = 0; i1 < outLen; i1++)oview.setUint32(4 * i1, state[i1], isLE);
    }
    digest() {
        const { buffer , outputLen  } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
    _cloneInto(to) {
        to || (to = new this.constructor);
        to.set(...this.get());
        const { blockLen , buffer , length , finished , destroyed , pos  } = this;
        to.length = length;
        to.pos = pos;
        to.finished = finished;
        to.destroyed = destroyed;
        if (length % blockLen) to.buffer.set(buffer);
        return to;
    }
}
const Chi = (a, b, c)=>a & b ^ ~a & c;
const Maj = (a, b, c)=>a & b ^ a & c ^ b & c;
const SHA256_K = new Uint32Array([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
]);
const IV = new Uint32Array([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
]);
const SHA256_W = new Uint32Array(64);
class SHA256 extends SHA2 {
    constructor(){
        super(64, 32, 8, false);
        this.A = IV[0] | 0;
        this.B = IV[1] | 0;
        this.C = IV[2] | 0;
        this.D = IV[3] | 0;
        this.E = IV[4] | 0;
        this.F = IV[5] | 0;
        this.G = IV[6] | 0;
        this.H = IV[7] | 0;
    }
    get() {
        const { A , B , C , D , E , F , G , H  } = this;
        return [
            A,
            B,
            C,
            D,
            E,
            F,
            G,
            H
        ];
    }
    set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
    }
    process(view, offset) {
        for(let i = 0; i < 16; i++, offset += 4)SHA256_W[i] = view.getUint32(offset, false);
        for(let i1 = 16; i1 < 64; i1++){
            const W15 = SHA256_W[i1 - 15];
            const W2 = SHA256_W[i1 - 2];
            const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
            const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
            SHA256_W[i1] = s1 + SHA256_W[i1 - 7] + s0 + SHA256_W[i1 - 16] | 0;
        }
        let { A , B , C , D , E , F , G , H  } = this;
        for(let i2 = 0; i2 < 64; i2++){
            const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
            const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i2] + SHA256_W[i2] | 0;
            const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
            const T2 = sigma0 + Maj(A, B, C) | 0;
            H = G;
            G = F;
            F = E;
            E = D + T1 | 0;
            D = C;
            C = B;
            B = A;
            A = T1 + T2 | 0;
        }
        A = A + this.A | 0;
        B = B + this.B | 0;
        C = C + this.C | 0;
        D = D + this.D | 0;
        E = E + this.E | 0;
        F = F + this.F | 0;
        G = G + this.G | 0;
        H = H + this.H | 0;
        this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
        SHA256_W.fill(0);
    }
    destroy() {
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        this.buffer.fill(0);
    }
}
const sha256$1 = wrapConstructor(()=>new SHA256);
const U32_MASK64 = BigInt(2 ** 32 - 1);
const _32n = BigInt(32);
function fromBig(n, le = false) {
    if (le) return {
        h: Number(n & U32_MASK64),
        l: Number(n >> _32n & U32_MASK64)
    };
    return {
        h: Number(n >> _32n & U32_MASK64) | 0,
        l: Number(n & U32_MASK64) | 0
    };
}
function split$1(lst, le = false) {
    let Ah = new Uint32Array(lst.length);
    let Al = new Uint32Array(lst.length);
    for(let i = 0; i < lst.length; i++){
        const { h , l  } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [
            h,
            l
        ];
    }
    return [
        Ah,
        Al
    ];
}
const toBig = (h, l)=>BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
const shrSH = (h, _l, s)=>h >>> s;
const shrSL = (h, l, s)=>h << 32 - s | l >>> s;
const rotrSH = (h, l, s)=>h >>> s | l << 32 - s;
const rotrSL = (h, l, s)=>h << 32 - s | l >>> s;
const rotrBH = (h, l, s)=>h << 64 - s | l >>> s - 32;
const rotrBL = (h, l, s)=>h >>> s - 32 | l << 64 - s;
const rotr32H = (_h, l)=>l;
const rotr32L = (h, _l)=>h;
const rotlSH = (h, l, s)=>h << s | l >>> 32 - s;
const rotlSL = (h, l, s)=>l << s | h >>> 32 - s;
const rotlBH = (h, l, s)=>l << s - 32 | h >>> 64 - s;
const rotlBL = (h, l, s)=>h << s - 32 | l >>> 64 - s;
function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return {
        h: Ah + Bh + (l / 2 ** 32 | 0) | 0,
        l: l | 0
    };
}
const add3L = (Al, Bl, Cl)=>(Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
const add3H = (low, Ah, Bh, Ch)=>Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
const add4L = (Al, Bl, Cl, Dl)=>(Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
const add4H = (low, Ah, Bh, Ch, Dh)=>Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
const add5L = (Al, Bl, Cl, Dl, El)=>(Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
const add5H = (low, Ah, Bh, Ch, Dh, Eh)=>Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
const u64 = {
    fromBig: fromBig,
    split: split$1,
    toBig: toBig,
    shrSH: shrSH,
    shrSL: shrSL,
    rotrSH: rotrSH,
    rotrSL: rotrSL,
    rotrBH: rotrBH,
    rotrBL: rotrBL,
    rotr32H: rotr32H,
    rotr32L: rotr32L,
    rotlSH: rotlSH,
    rotlSL: rotlSL,
    rotlBH: rotlBH,
    rotlBL: rotlBL,
    add: add,
    add3L: add3L,
    add3H: add3H,
    add4L: add4L,
    add4H: add4H,
    add5H: add5H,
    add5L: add5L
};
const [SHA512_Kh, SHA512_Kl] = (()=>u64.split([
        "0x428a2f98d728ae22",
        "0x7137449123ef65cd",
        "0xb5c0fbcfec4d3b2f",
        "0xe9b5dba58189dbbc",
        "0x3956c25bf348b538",
        "0x59f111f1b605d019",
        "0x923f82a4af194f9b",
        "0xab1c5ed5da6d8118",
        "0xd807aa98a3030242",
        "0x12835b0145706fbe",
        "0x243185be4ee4b28c",
        "0x550c7dc3d5ffb4e2",
        "0x72be5d74f27b896f",
        "0x80deb1fe3b1696b1",
        "0x9bdc06a725c71235",
        "0xc19bf174cf692694",
        "0xe49b69c19ef14ad2",
        "0xefbe4786384f25e3",
        "0x0fc19dc68b8cd5b5",
        "0x240ca1cc77ac9c65",
        "0x2de92c6f592b0275",
        "0x4a7484aa6ea6e483",
        "0x5cb0a9dcbd41fbd4",
        "0x76f988da831153b5",
        "0x983e5152ee66dfab",
        "0xa831c66d2db43210",
        "0xb00327c898fb213f",
        "0xbf597fc7beef0ee4",
        "0xc6e00bf33da88fc2",
        "0xd5a79147930aa725",
        "0x06ca6351e003826f",
        "0x142929670a0e6e70",
        "0x27b70a8546d22ffc",
        "0x2e1b21385c26c926",
        "0x4d2c6dfc5ac42aed",
        "0x53380d139d95b3df",
        "0x650a73548baf63de",
        "0x766a0abb3c77b2a8",
        "0x81c2c92e47edaee6",
        "0x92722c851482353b",
        "0xa2bfe8a14cf10364",
        "0xa81a664bbc423001",
        "0xc24b8b70d0f89791",
        "0xc76c51a30654be30",
        "0xd192e819d6ef5218",
        "0xd69906245565a910",
        "0xf40e35855771202a",
        "0x106aa07032bbd1b8",
        "0x19a4c116b8d2d0c8",
        "0x1e376c085141ab53",
        "0x2748774cdf8eeb99",
        "0x34b0bcb5e19b48a8",
        "0x391c0cb3c5c95a63",
        "0x4ed8aa4ae3418acb",
        "0x5b9cca4f7763e373",
        "0x682e6ff3d6b2b8a3",
        "0x748f82ee5defb2fc",
        "0x78a5636f43172f60",
        "0x84c87814a1f0ab72",
        "0x8cc702081a6439ec",
        "0x90befffa23631e28",
        "0xa4506cebde82bde9",
        "0xbef9a3f7b2c67915",
        "0xc67178f2e372532b",
        "0xca273eceea26619c",
        "0xd186b8c721c0c207",
        "0xeada7dd6cde0eb1e",
        "0xf57d4f7fee6ed178",
        "0x06f067aa72176fba",
        "0x0a637dc5a2c898a6",
        "0x113f9804bef90dae",
        "0x1b710b35131c471b",
        "0x28db77f523047d84",
        "0x32caab7b40c72493",
        "0x3c9ebe0a15c9bebc",
        "0x431d67c49c100d4c",
        "0x4cc5d4becb3e42b6",
        "0x597f299cfc657e2a",
        "0x5fcb6fab3ad6faec",
        "0x6c44198c4a475817"
    ].map((n)=>BigInt(n))))();
const SHA512_W_H = new Uint32Array(80);
const SHA512_W_L = new Uint32Array(80);
class SHA512 extends SHA2 {
    constructor(){
        super(128, 64, 16, false);
        this.Ah = 1779033703 | 0;
        this.Al = 4089235720 | 0;
        this.Bh = 3144134277 | 0;
        this.Bl = 2227873595 | 0;
        this.Ch = 1013904242 | 0;
        this.Cl = 4271175723 | 0;
        this.Dh = 2773480762 | 0;
        this.Dl = 1595750129 | 0;
        this.Eh = 1359893119 | 0;
        this.El = 2917565137 | 0;
        this.Fh = 2600822924 | 0;
        this.Fl = 725511199 | 0;
        this.Gh = 528734635 | 0;
        this.Gl = 4215389547 | 0;
        this.Hh = 1541459225 | 0;
        this.Hl = 327033209 | 0;
    }
    get() {
        const { Ah , Al , Bh , Bl , Ch , Cl , Dh , Dl , Eh , El , Fh , Fl , Gh , Gl , Hh , Hl  } = this;
        return [
            Ah,
            Al,
            Bh,
            Bl,
            Ch,
            Cl,
            Dh,
            Dl,
            Eh,
            El,
            Fh,
            Fl,
            Gh,
            Gl,
            Hh,
            Hl
        ];
    }
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
        this.Ah = Ah | 0;
        this.Al = Al | 0;
        this.Bh = Bh | 0;
        this.Bl = Bl | 0;
        this.Ch = Ch | 0;
        this.Cl = Cl | 0;
        this.Dh = Dh | 0;
        this.Dl = Dl | 0;
        this.Eh = Eh | 0;
        this.El = El | 0;
        this.Fh = Fh | 0;
        this.Fl = Fl | 0;
        this.Gh = Gh | 0;
        this.Gl = Gl | 0;
        this.Hh = Hh | 0;
        this.Hl = Hl | 0;
    }
    process(view, offset) {
        for(let i = 0; i < 16; i++, offset += 4){
            SHA512_W_H[i] = view.getUint32(offset);
            SHA512_W_L[i] = view.getUint32(offset += 4);
        }
        for(let i1 = 16; i1 < 80; i1++){
            const W15h = SHA512_W_H[i1 - 15] | 0;
            const W15l = SHA512_W_L[i1 - 15] | 0;
            const s0h = u64.rotrSH(W15h, W15l, 1) ^ u64.rotrSH(W15h, W15l, 8) ^ u64.shrSH(W15h, W15l, 7);
            const s0l = u64.rotrSL(W15h, W15l, 1) ^ u64.rotrSL(W15h, W15l, 8) ^ u64.shrSL(W15h, W15l, 7);
            const W2h = SHA512_W_H[i1 - 2] | 0;
            const W2l = SHA512_W_L[i1 - 2] | 0;
            const s1h = u64.rotrSH(W2h, W2l, 19) ^ u64.rotrBH(W2h, W2l, 61) ^ u64.shrSH(W2h, W2l, 6);
            const s1l = u64.rotrSL(W2h, W2l, 19) ^ u64.rotrBL(W2h, W2l, 61) ^ u64.shrSL(W2h, W2l, 6);
            const SUMl = u64.add4L(s0l, s1l, SHA512_W_L[i1 - 7], SHA512_W_L[i1 - 16]);
            const SUMh = u64.add4H(SUMl, s0h, s1h, SHA512_W_H[i1 - 7], SHA512_W_H[i1 - 16]);
            SHA512_W_H[i1] = SUMh | 0;
            SHA512_W_L[i1] = SUMl | 0;
        }
        let { Ah , Al , Bh , Bl , Ch , Cl , Dh , Dl , Eh , El , Fh , Fl , Gh , Gl , Hh , Hl  } = this;
        for(let i2 = 0; i2 < 80; i2++){
            const sigma1h = u64.rotrSH(Eh, El, 14) ^ u64.rotrSH(Eh, El, 18) ^ u64.rotrBH(Eh, El, 41);
            const sigma1l = u64.rotrSL(Eh, El, 14) ^ u64.rotrSL(Eh, El, 18) ^ u64.rotrBL(Eh, El, 41);
            const CHIh = Eh & Fh ^ ~Eh & Gh;
            const CHIl = El & Fl ^ ~El & Gl;
            const T1ll = u64.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i2], SHA512_W_L[i2]);
            const T1h = u64.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i2], SHA512_W_H[i2]);
            const T1l = T1ll | 0;
            const sigma0h = u64.rotrSH(Ah, Al, 28) ^ u64.rotrBH(Ah, Al, 34) ^ u64.rotrBH(Ah, Al, 39);
            const sigma0l = u64.rotrSL(Ah, Al, 28) ^ u64.rotrBL(Ah, Al, 34) ^ u64.rotrBL(Ah, Al, 39);
            const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
            const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
            Hh = Gh | 0;
            Hl = Gl | 0;
            Gh = Fh | 0;
            Gl = Fl | 0;
            Fh = Eh | 0;
            Fl = El | 0;
            ({ h: Eh , l: El  } = u64.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
            Dh = Ch | 0;
            Dl = Cl | 0;
            Ch = Bh | 0;
            Cl = Bl | 0;
            Bh = Ah | 0;
            Bl = Al | 0;
            const All = u64.add3L(T1l, sigma0l, MAJl);
            Ah = u64.add3H(All, T1h, sigma0h, MAJh);
            Al = All | 0;
        }
        ({ h: Ah , l: Al  } = u64.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
        ({ h: Bh , l: Bl  } = u64.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
        ({ h: Ch , l: Cl  } = u64.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
        ({ h: Dh , l: Dl  } = u64.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
        ({ h: Eh , l: El  } = u64.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
        ({ h: Fh , l: Fl  } = u64.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
        ({ h: Gh , l: Gl  } = u64.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
        ({ h: Hh , l: Hl  } = u64.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
        SHA512_W_H.fill(0);
        SHA512_W_L.fill(0);
    }
    destroy() {
        this.buffer.fill(0);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
const sha512$1 = wrapConstructor(()=>new SHA512);
function getGlobal$1() {
    if (typeof self !== "undefined") {
        return self;
    }
    if (typeof window !== "undefined") {
        return window;
    }
    if (typeof global !== "undefined") {
        return global;
    }
    throw new Error("unable to locate global object");
}
const anyGlobal = getGlobal$1();
const crypto = anyGlobal.crypto || anyGlobal.msCrypto;
function createHash(algo) {
    switch(algo){
        case "sha256":
            return sha256$1.create();
        case "sha512":
            return sha512$1.create();
    }
    assertArgument(false, "invalid hashing algorithm name", "algorithm", algo);
}
function createHmac(_algo, key) {
    const algo = {
        sha256: sha256$1,
        sha512: sha512$1
    }[_algo];
    assertArgument(algo != null, "invalid hmac algorithm", "algorithm", _algo);
    return hmac.create(algo, key);
}
function pbkdf2Sync(password, salt, iterations, keylen, _algo) {
    const algo = {
        sha256: sha256$1,
        sha512: sha512$1
    }[_algo];
    assertArgument(algo != null, "invalid pbkdf2 algorithm", "algorithm", _algo);
    return pbkdf2$1(algo, password, salt, {
        c: iterations,
        dkLen: keylen
    });
}
function randomBytes$1(length) {
    assert1(crypto != null, "platform does not support secure random numbers", "UNSUPPORTED_OPERATION", {
        operation: "randomBytes"
    });
    assertArgument(Number.isInteger(length) && length > 0 && length <= 1024, "invalid length", "length", length);
    const result = new Uint8Array(length);
    crypto.getRandomValues(result);
    return result;
}
let locked$4 = false;
const _computeHmac = function(algorithm, key, data) {
    return createHmac(algorithm, key).update(data).digest();
};
let __computeHmac = _computeHmac;
function computeHmac(algorithm, _key, _data) {
    const key = getBytes(_key, "key");
    const data = getBytes(_data, "data");
    return hexlify(__computeHmac(algorithm, key, data));
}
computeHmac._ = _computeHmac;
computeHmac.lock = function() {
    locked$4 = true;
};
computeHmac.register = function(func) {
    if (locked$4) {
        throw new Error("computeHmac is locked");
    }
    __computeHmac = func;
};
Object.freeze(computeHmac);
const [SHA3_PI, SHA3_ROTL, _SHA3_IOTA] = [
    [],
    [],
    []
];
const _0n$4 = BigInt(0);
const _1n$5 = BigInt(1);
const _2n$3 = BigInt(2);
const _7n = BigInt(7);
const _256n = BigInt(256);
const _0x71n = BigInt(113);
for(let round = 0, R = _1n$5, x = 1, y = 0; round < 24; round++){
    [x, y] = [
        y,
        (2 * x + 3 * y) % 5
    ];
    SHA3_PI.push(2 * (5 * y + x));
    SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
    let t = _0n$4;
    for(let j = 0; j < 7; j++){
        R = (R << _1n$5 ^ (R >> _7n) * _0x71n) % _256n;
        if (R & _2n$3) t ^= _1n$5 << (_1n$5 << BigInt(j)) - _1n$5;
    }
    _SHA3_IOTA.push(t);
}
const [SHA3_IOTA_H, SHA3_IOTA_L] = split$1(_SHA3_IOTA, true);
const rotlH = (h, l, s)=>s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
const rotlL = (h, l, s)=>s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
function keccakP(s, rounds = 24) {
    const B = new Uint32Array(5 * 2);
    for(let round = 24 - rounds; round < 24; round++){
        for(let x = 0; x < 10; x++)B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
        for(let x1 = 0; x1 < 10; x1 += 2){
            const idx1 = (x1 + 8) % 10;
            const idx0 = (x1 + 2) % 10;
            const B0 = B[idx0];
            const B1 = B[idx0 + 1];
            const Th = rotlH(B0, B1, 1) ^ B[idx1];
            const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
            for(let y = 0; y < 50; y += 10){
                s[x1 + y] ^= Th;
                s[x1 + y + 1] ^= Tl;
            }
        }
        let curH = s[2];
        let curL = s[3];
        for(let t = 0; t < 24; t++){
            const shift = SHA3_ROTL[t];
            const Th1 = rotlH(curH, curL, shift);
            const Tl1 = rotlL(curH, curL, shift);
            const PI = SHA3_PI[t];
            curH = s[PI];
            curL = s[PI + 1];
            s[PI] = Th1;
            s[PI + 1] = Tl1;
        }
        for(let y1 = 0; y1 < 50; y1 += 10){
            for(let x2 = 0; x2 < 10; x2++)B[x2] = s[y1 + x2];
            for(let x3 = 0; x3 < 10; x3++)s[y1 + x3] ^= ~B[(x3 + 2) % 10] & B[(x3 + 4) % 10];
        }
        s[0] ^= SHA3_IOTA_H[round];
        s[1] ^= SHA3_IOTA_L[round];
    }
    B.fill(0);
}
class Keccak extends Hash {
    constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24){
        super();
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.rounds = rounds;
        this.pos = 0;
        this.posOut = 0;
        this.finished = false;
        this.destroyed = false;
        number(outputLen);
        if (0 >= this.blockLen || this.blockLen >= 200) throw new Error("Sha3 supports only keccak-f1600 function");
        this.state = new Uint8Array(200);
        this.state32 = u32(this.state);
    }
    keccak() {
        keccakP(this.state32, this.rounds);
        this.posOut = 0;
        this.pos = 0;
    }
    update(data) {
        exists(this);
        const { blockLen , state  } = this;
        data = toBytes(data);
        const len = data.length;
        for(let pos = 0; pos < len;){
            const take = Math.min(blockLen - this.pos, len - pos);
            for(let i = 0; i < take; i++)state[this.pos++] ^= data[pos++];
            if (this.pos === blockLen) this.keccak();
        }
        return this;
    }
    finish() {
        if (this.finished) return;
        this.finished = true;
        const { state , suffix , pos , blockLen  } = this;
        state[pos] ^= suffix;
        if ((suffix & 128) !== 0 && pos === blockLen - 1) this.keccak();
        state[blockLen - 1] ^= 128;
        this.keccak();
    }
    writeInto(out) {
        exists(this, false);
        bytes(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen  } = this;
        for(let pos = 0, len = out.length; pos < len;){
            if (this.posOut >= blockLen) this.keccak();
            const take = Math.min(blockLen - this.posOut, len - pos);
            out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
            this.posOut += take;
            pos += take;
        }
        return out;
    }
    xofInto(out) {
        if (!this.enableXOF) throw new Error("XOF is not possible for this instance");
        return this.writeInto(out);
    }
    xof(bytes) {
        number(bytes);
        return this.xofInto(new Uint8Array(bytes));
    }
    digestInto(out) {
        output(out, this);
        if (this.finished) throw new Error("digest() was already called");
        this.writeInto(out);
        this.destroy();
        return out;
    }
    digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
    }
    destroy() {
        this.destroyed = true;
        this.state.fill(0);
    }
    _cloneInto(to) {
        const { blockLen , suffix , outputLen , rounds , enableXOF  } = this;
        to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
    }
}
const gen = (suffix, blockLen, outputLen)=>wrapConstructor(()=>new Keccak(blockLen, suffix, outputLen));
const keccak_256 = gen(1, 136, 256 / 8);
let locked$3 = false;
const _keccak256 = function(data) {
    return keccak_256(data);
};
let __keccak256 = _keccak256;
function keccak256(_data) {
    const data = getBytes(_data, "data");
    return hexlify(__keccak256(data));
}
keccak256._ = _keccak256;
keccak256.lock = function() {
    locked$3 = true;
};
keccak256.register = function(func) {
    if (locked$3) {
        throw new TypeError("keccak256 is locked");
    }
    __keccak256 = func;
};
Object.freeze(keccak256);
const Rho = new Uint8Array([
    7,
    4,
    13,
    1,
    10,
    6,
    15,
    3,
    12,
    0,
    9,
    5,
    2,
    14,
    11,
    8
]);
const Id = Uint8Array.from({
    length: 16
}, (_, i)=>i);
const Pi = Id.map((i)=>(9 * i + 5) % 16);
let idxL = [
    Id
];
let idxR = [
    Pi
];
for(let i = 0; i < 4; i++)for (let j1 of [
    idxL,
    idxR
])j1.push(j1[i].map((k)=>Rho[k]));
const shifts = [
    [
        11,
        14,
        15,
        12,
        5,
        8,
        7,
        9,
        11,
        13,
        14,
        15,
        6,
        7,
        9,
        8
    ],
    [
        12,
        13,
        11,
        15,
        6,
        9,
        9,
        7,
        12,
        15,
        11,
        13,
        7,
        8,
        7,
        7
    ],
    [
        13,
        15,
        14,
        11,
        7,
        7,
        6,
        8,
        13,
        14,
        13,
        12,
        5,
        5,
        6,
        9
    ],
    [
        14,
        11,
        12,
        14,
        8,
        6,
        5,
        5,
        15,
        12,
        15,
        14,
        9,
        9,
        8,
        6
    ],
    [
        15,
        12,
        13,
        13,
        9,
        5,
        8,
        6,
        14,
        11,
        12,
        11,
        8,
        6,
        5,
        5
    ]
].map((i)=>new Uint8Array(i));
const shiftsL = idxL.map((idx, i)=>idx.map((j)=>shifts[i][j]));
const shiftsR = idxR.map((idx, i)=>idx.map((j)=>shifts[i][j]));
const Kl = new Uint32Array([
    0,
    1518500249,
    1859775393,
    2400959708,
    2840853838
]);
const Kr = new Uint32Array([
    1352829926,
    1548603684,
    1836072691,
    2053994217,
    0
]);
const rotl$1 = (word, shift)=>word << shift | word >>> 32 - shift;
function f(group, x, y, z) {
    if (group === 0) return x ^ y ^ z;
    else if (group === 1) return x & y | ~x & z;
    else if (group === 2) return (x | ~y) ^ z;
    else if (group === 3) return x & z | y & ~z;
    else return x ^ (y | ~z);
}
const BUF = new Uint32Array(16);
class RIPEMD160 extends SHA2 {
    constructor(){
        super(64, 20, 8, true);
        this.h0 = 1732584193 | 0;
        this.h1 = 4023233417 | 0;
        this.h2 = 2562383102 | 0;
        this.h3 = 271733878 | 0;
        this.h4 = 3285377520 | 0;
    }
    get() {
        const { h0 , h1 , h2 , h3 , h4  } = this;
        return [
            h0,
            h1,
            h2,
            h3,
            h4
        ];
    }
    set(h0, h1, h2, h3, h4) {
        this.h0 = h0 | 0;
        this.h1 = h1 | 0;
        this.h2 = h2 | 0;
        this.h3 = h3 | 0;
        this.h4 = h4 | 0;
    }
    process(view, offset) {
        for(let i = 0; i < 16; i++, offset += 4)BUF[i] = view.getUint32(offset, true);
        let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
        for(let group = 0; group < 5; group++){
            const rGroup = 4 - group;
            const hbl = Kl[group], hbr = Kr[group];
            const rl = idxL[group], rr = idxR[group];
            const sl = shiftsL[group], sr = shiftsR[group];
            for(let i1 = 0; i1 < 16; i1++){
                const tl = rotl$1(al + f(group, bl, cl, dl) + BUF[rl[i1]] + hbl, sl[i1]) + el | 0;
                al = el, el = dl, dl = rotl$1(cl, 10) | 0, cl = bl, bl = tl;
            }
            for(let i2 = 0; i2 < 16; i2++){
                const tr = rotl$1(ar + f(rGroup, br, cr, dr) + BUF[rr[i2]] + hbr, sr[i2]) + er | 0;
                ar = er, er = dr, dr = rotl$1(cr, 10) | 0, cr = br, br = tr;
            }
        }
        this.set(this.h1 + cl + dr | 0, this.h2 + dl + er | 0, this.h3 + el + ar | 0, this.h4 + al + br | 0, this.h0 + bl + cr | 0);
    }
    roundClean() {
        BUF.fill(0);
    }
    destroy() {
        this.destroyed = true;
        this.buffer.fill(0);
        this.set(0, 0, 0, 0, 0);
    }
}
const ripemd160$1 = wrapConstructor(()=>new RIPEMD160);
let locked$2 = false;
const _ripemd160 = function(data) {
    return ripemd160$1(data);
};
let __ripemd160 = _ripemd160;
function ripemd160(_data) {
    const data = getBytes(_data, "data");
    return hexlify(__ripemd160(data));
}
ripemd160._ = _ripemd160;
ripemd160.lock = function() {
    locked$2 = true;
};
ripemd160.register = function(func) {
    if (locked$2) {
        throw new TypeError("ripemd160 is locked");
    }
    __ripemd160 = func;
};
Object.freeze(ripemd160);
let locked$1 = false;
const _pbkdf2 = function(password, salt, iterations, keylen, algo) {
    return pbkdf2Sync(password, salt, iterations, keylen, algo);
};
let __pbkdf2 = _pbkdf2;
function pbkdf2(_password, _salt, iterations, keylen, algo) {
    const password = getBytes(_password, "password");
    const salt = getBytes(_salt, "salt");
    return hexlify(__pbkdf2(password, salt, iterations, keylen, algo));
}
pbkdf2._ = _pbkdf2;
pbkdf2.lock = function() {
    locked$1 = true;
};
pbkdf2.register = function(func) {
    if (locked$1) {
        throw new Error("pbkdf2 is locked");
    }
    __pbkdf2 = func;
};
Object.freeze(pbkdf2);
let locked = false;
const _randomBytes = function(length) {
    return new Uint8Array(randomBytes$1(length));
};
let __randomBytes = _randomBytes;
function randomBytes(length) {
    return __randomBytes(length);
}
randomBytes._ = _randomBytes;
randomBytes.lock = function() {
    locked = true;
};
randomBytes.register = function(func) {
    if (locked) {
        throw new Error("randomBytes is locked");
    }
    __randomBytes = func;
};
Object.freeze(randomBytes);
const rotl = (a, b)=>a << b | a >>> 32 - b;
function XorAndSalsa(prev, pi, input, ii, out, oi) {
    let y00 = prev[pi++] ^ input[ii++], y01 = prev[pi++] ^ input[ii++];
    let y02 = prev[pi++] ^ input[ii++], y03 = prev[pi++] ^ input[ii++];
    let y04 = prev[pi++] ^ input[ii++], y05 = prev[pi++] ^ input[ii++];
    let y06 = prev[pi++] ^ input[ii++], y07 = prev[pi++] ^ input[ii++];
    let y08 = prev[pi++] ^ input[ii++], y09 = prev[pi++] ^ input[ii++];
    let y10 = prev[pi++] ^ input[ii++], y11 = prev[pi++] ^ input[ii++];
    let y12 = prev[pi++] ^ input[ii++], y13 = prev[pi++] ^ input[ii++];
    let y14 = prev[pi++] ^ input[ii++], y15 = prev[pi++] ^ input[ii++];
    let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
    for(let i = 0; i < 8; i += 2){
        x04 ^= rotl(x00 + x12 | 0, 7);
        x08 ^= rotl(x04 + x00 | 0, 9);
        x12 ^= rotl(x08 + x04 | 0, 13);
        x00 ^= rotl(x12 + x08 | 0, 18);
        x09 ^= rotl(x05 + x01 | 0, 7);
        x13 ^= rotl(x09 + x05 | 0, 9);
        x01 ^= rotl(x13 + x09 | 0, 13);
        x05 ^= rotl(x01 + x13 | 0, 18);
        x14 ^= rotl(x10 + x06 | 0, 7);
        x02 ^= rotl(x14 + x10 | 0, 9);
        x06 ^= rotl(x02 + x14 | 0, 13);
        x10 ^= rotl(x06 + x02 | 0, 18);
        x03 ^= rotl(x15 + x11 | 0, 7);
        x07 ^= rotl(x03 + x15 | 0, 9);
        x11 ^= rotl(x07 + x03 | 0, 13);
        x15 ^= rotl(x11 + x07 | 0, 18);
        x01 ^= rotl(x00 + x03 | 0, 7);
        x02 ^= rotl(x01 + x00 | 0, 9);
        x03 ^= rotl(x02 + x01 | 0, 13);
        x00 ^= rotl(x03 + x02 | 0, 18);
        x06 ^= rotl(x05 + x04 | 0, 7);
        x07 ^= rotl(x06 + x05 | 0, 9);
        x04 ^= rotl(x07 + x06 | 0, 13);
        x05 ^= rotl(x04 + x07 | 0, 18);
        x11 ^= rotl(x10 + x09 | 0, 7);
        x08 ^= rotl(x11 + x10 | 0, 9);
        x09 ^= rotl(x08 + x11 | 0, 13);
        x10 ^= rotl(x09 + x08 | 0, 18);
        x12 ^= rotl(x15 + x14 | 0, 7);
        x13 ^= rotl(x12 + x15 | 0, 9);
        x14 ^= rotl(x13 + x12 | 0, 13);
        x15 ^= rotl(x14 + x13 | 0, 18);
    }
    out[oi++] = y00 + x00 | 0;
    out[oi++] = y01 + x01 | 0;
    out[oi++] = y02 + x02 | 0;
    out[oi++] = y03 + x03 | 0;
    out[oi++] = y04 + x04 | 0;
    out[oi++] = y05 + x05 | 0;
    out[oi++] = y06 + x06 | 0;
    out[oi++] = y07 + x07 | 0;
    out[oi++] = y08 + x08 | 0;
    out[oi++] = y09 + x09 | 0;
    out[oi++] = y10 + x10 | 0;
    out[oi++] = y11 + x11 | 0;
    out[oi++] = y12 + x12 | 0;
    out[oi++] = y13 + x13 | 0;
    out[oi++] = y14 + x14 | 0;
    out[oi++] = y15 + x15 | 0;
}
function BlockMix(input, ii, out, oi, r) {
    let head = oi + 0;
    let tail = oi + 16 * r;
    for(let i = 0; i < 16; i++)out[tail + i] = input[ii + (2 * r - 1) * 16 + i];
    for(let i1 = 0; i1 < r; i1++, head += 16, ii += 16){
        XorAndSalsa(out, tail, input, ii, out, head);
        if (i1 > 0) tail += 16;
        XorAndSalsa(out, head, input, ii += 16, out, tail);
    }
}
function scryptInit(password, salt, _opts) {
    const opts = checkOpts({
        dkLen: 32,
        asyncTick: 10,
        maxmem: 1024 ** 3 + 1024
    }, _opts);
    const { N , r , p , dkLen , asyncTick , maxmem , onProgress  } = opts;
    number(N);
    number(r);
    number(p);
    number(dkLen);
    number(asyncTick);
    number(maxmem);
    if (onProgress !== undefined && typeof onProgress !== "function") throw new Error("progressCb should be function");
    const blockSize = 128 * r;
    const blockSize32 = blockSize / 4;
    if (N <= 1 || (N & N - 1) !== 0 || N >= 2 ** (blockSize / 8) || N > 2 ** 32) {
        throw new Error("Scrypt: N must be larger than 1, a power of 2, less than 2^(128 * r / 8) and less than 2^32");
    }
    if (p < 0 || p > (2 ** 32 - 1) * 32 / blockSize) {
        throw new Error("Scrypt: p must be a positive integer less than or equal to ((2^32 - 1) * 32) / (128 * r)");
    }
    if (dkLen < 0 || dkLen > (2 ** 32 - 1) * 32) {
        throw new Error("Scrypt: dkLen should be positive integer less than or equal to (2^32 - 1) * 32");
    }
    const memUsed = blockSize * (N + p);
    if (memUsed > maxmem) {
        throw new Error(`Scrypt: parameters too large, ${memUsed} (128 * r * (N + p)) > ${maxmem} (maxmem)`);
    }
    const B = pbkdf2$1(sha256$1, password, salt, {
        c: 1,
        dkLen: blockSize * p
    });
    const B32 = u32(B);
    const V = u32(new Uint8Array(blockSize * N));
    const tmp = u32(new Uint8Array(blockSize));
    let blockMixCb = ()=>{};
    if (onProgress) {
        const totalBlockMix = 2 * N * p;
        const callbackPer = Math.max(Math.floor(totalBlockMix / 1e4), 1);
        let blockMixCnt = 0;
        blockMixCb = ()=>{
            blockMixCnt++;
            if (onProgress && (!(blockMixCnt % callbackPer) || blockMixCnt === totalBlockMix)) onProgress(blockMixCnt / totalBlockMix);
        };
    }
    return {
        N: N,
        r: r,
        p: p,
        dkLen: dkLen,
        blockSize32: blockSize32,
        V: V,
        B32: B32,
        B: B,
        tmp: tmp,
        blockMixCb: blockMixCb,
        asyncTick: asyncTick
    };
}
function scryptOutput(password, dkLen, B, V, tmp) {
    const res = pbkdf2$1(sha256$1, password, B, {
        c: 1,
        dkLen: dkLen
    });
    B.fill(0);
    V.fill(0);
    tmp.fill(0);
    return res;
}
function scrypt$1(password, salt, opts) {
    const { N , r , p , dkLen , blockSize32 , V , B32 , B , tmp , blockMixCb  } = scryptInit(password, salt, opts);
    for(let pi = 0; pi < p; pi++){
        const Pi = blockSize32 * pi;
        for(let i = 0; i < blockSize32; i++)V[i] = B32[Pi + i];
        for(let i1 = 0, pos = 0; i1 < N - 1; i1++){
            BlockMix(V, pos, V, pos += blockSize32, r);
            blockMixCb();
        }
        BlockMix(V, (N - 1) * blockSize32, B32, Pi, r);
        blockMixCb();
        for(let i2 = 0; i2 < N; i2++){
            const j = B32[Pi + blockSize32 - 16] % N;
            for(let k = 0; k < blockSize32; k++)tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
            BlockMix(tmp, 0, B32, Pi, r);
            blockMixCb();
        }
    }
    return scryptOutput(password, dkLen, B, V, tmp);
}
async function scryptAsync(password, salt, opts) {
    const { N , r , p , dkLen , blockSize32 , V , B32 , B , tmp , blockMixCb , asyncTick  } = scryptInit(password, salt, opts);
    for(let pi = 0; pi < p; pi++){
        const Pi = blockSize32 * pi;
        for(let i = 0; i < blockSize32; i++)V[i] = B32[Pi + i];
        let pos = 0;
        await asyncLoop(N - 1, asyncTick, ()=>{
            BlockMix(V, pos, V, pos += blockSize32, r);
            blockMixCb();
        });
        BlockMix(V, (N - 1) * blockSize32, B32, Pi, r);
        blockMixCb();
        await asyncLoop(N, asyncTick, ()=>{
            const j = B32[Pi + blockSize32 - 16] % N;
            for(let k = 0; k < blockSize32; k++)tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
            BlockMix(tmp, 0, B32, Pi, r);
            blockMixCb();
        });
    }
    return scryptOutput(password, dkLen, B, V, tmp);
}
let lockedSync = false, lockedAsync = false;
const _scryptAsync = async function(passwd, salt, N, r, p, dkLen, onProgress) {
    return await scryptAsync(passwd, salt, {
        N: N,
        r: r,
        p: p,
        dkLen: dkLen,
        onProgress: onProgress
    });
};
const _scryptSync = function(passwd, salt, N, r, p, dkLen) {
    return scrypt$1(passwd, salt, {
        N: N,
        r: r,
        p: p,
        dkLen: dkLen
    });
};
let __scryptAsync = _scryptAsync;
let __scryptSync = _scryptSync;
async function scrypt(_passwd, _salt, N, r, p, dkLen, progress) {
    const passwd = getBytes(_passwd, "passwd");
    const salt = getBytes(_salt, "salt");
    return hexlify(await __scryptAsync(passwd, salt, N, r, p, dkLen, progress));
}
scrypt._ = _scryptAsync;
scrypt.lock = function() {
    lockedAsync = true;
};
scrypt.register = function(func) {
    if (lockedAsync) {
        throw new Error("scrypt is locked");
    }
    __scryptAsync = func;
};
Object.freeze(scrypt);
function scryptSync(_passwd, _salt, N, r, p, dkLen) {
    const passwd = getBytes(_passwd, "passwd");
    const salt = getBytes(_salt, "salt");
    return hexlify(__scryptSync(passwd, salt, N, r, p, dkLen));
}
scryptSync._ = _scryptSync;
scryptSync.lock = function() {
    lockedSync = true;
};
scryptSync.register = function(func) {
    if (lockedSync) {
        throw new Error("scryptSync is locked");
    }
    __scryptSync = func;
};
Object.freeze(scryptSync);
const _sha256 = function(data) {
    return createHash("sha256").update(data).digest();
};
const _sha512 = function(data) {
    return createHash("sha512").update(data).digest();
};
let __sha256 = _sha256;
let __sha512 = _sha512;
let locked256 = false, locked512 = false;
function sha256(_data) {
    const data = getBytes(_data, "data");
    return hexlify(__sha256(data));
}
sha256._ = _sha256;
sha256.lock = function() {
    locked256 = true;
};
sha256.register = function(func) {
    if (locked256) {
        throw new Error("sha256 is locked");
    }
    __sha256 = func;
};
Object.freeze(sha256);
function sha512(_data) {
    const data = getBytes(_data, "data");
    return hexlify(__sha512(data));
}
sha512._ = _sha512;
sha512.lock = function() {
    locked512 = true;
};
sha512.register = function(func) {
    if (locked512) {
        throw new Error("sha512 is locked");
    }
    __sha512 = func;
};
Object.freeze(sha256);
const _0n$3 = BigInt(0);
const _1n$4 = BigInt(1);
const _2n$2 = BigInt(2);
const u8a = (a)=>a instanceof Uint8Array;
const hexes = Array.from({
    length: 256
}, (_, i)=>i.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
    if (!u8a(bytes)) throw new Error("Uint8Array expected");
    let hex = "";
    for(let i = 0; i < bytes.length; i++){
        hex += hexes[bytes[i]];
    }
    return hex;
}
function numberToHexUnpadded(num) {
    const hex = num.toString(16);
    return hex.length & 1 ? `0${hex}` : hex;
}
function hexToNumber(hex) {
    if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
    return BigInt(hex === "" ? "0" : `0x${hex}`);
}
function hexToBytes(hex) {
    if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
    const len = hex.length;
    if (len % 2) throw new Error("padded hex string expected, got unpadded hex of length " + len);
    const array = new Uint8Array(len / 2);
    for(let i = 0; i < array.length; i++){
        const j = i * 2;
        const hexByte = hex.slice(j, j + 2);
        const __byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(__byte) || __byte < 0) throw new Error("Invalid byte sequence");
        array[i] = __byte;
    }
    return array;
}
function bytesToNumberBE(bytes) {
    return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
    if (!u8a(bytes)) throw new Error("Uint8Array expected");
    return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
}
function numberToBytesBE(n, len) {
    return hexToBytes(n.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
    return numberToBytesBE(n, len).reverse();
}
function numberToVarBytesBE(n) {
    return hexToBytes(numberToHexUnpadded(n));
}
function ensureBytes(title, hex, expectedLength) {
    let res;
    if (typeof hex === "string") {
        try {
            res = hexToBytes(hex);
        } catch (e) {
            throw new Error(`${title} must be valid hex string, got "${hex}". Cause: ${e}`);
        }
    } else if (u8a(hex)) {
        res = Uint8Array.from(hex);
    } else {
        throw new Error(`${title} must be hex string or Uint8Array`);
    }
    const len = res.length;
    if (typeof expectedLength === "number" && len !== expectedLength) throw new Error(`${title} expected ${expectedLength} bytes, got ${len}`);
    return res;
}
function concatBytes(...arrays) {
    const r = new Uint8Array(arrays.reduce((sum, a)=>sum + a.length, 0));
    let pad = 0;
    arrays.forEach((a)=>{
        if (!u8a(a)) throw new Error("Uint8Array expected");
        r.set(a, pad);
        pad += a.length;
    });
    return r;
}
function equalBytes(b1, b2) {
    if (b1.length !== b2.length) return false;
    for(let i = 0; i < b1.length; i++)if (b1[i] !== b2[i]) return false;
    return true;
}
function utf8ToBytes(str) {
    if (typeof str !== "string") throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
    return new Uint8Array((new TextEncoder).encode(str));
}
function bitLen(n) {
    let len;
    for(len = 0; n > _0n$3; n >>= _1n$4, len += 1);
    return len;
}
function bitGet(n, pos) {
    return n >> BigInt(pos) & _1n$4;
}
const bitSet = (n, pos, value)=>{
    return n | (value ? _1n$4 : _0n$3) << BigInt(pos);
};
const bitMask = (n)=>(_2n$2 << BigInt(n - 1)) - _1n$4;
const u8n = (data)=>new Uint8Array(data);
const u8fr = (arr)=>Uint8Array.from(arr);
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
    if (typeof hashLen !== "number" || hashLen < 2) throw new Error("hashLen must be a number");
    if (typeof qByteLen !== "number" || qByteLen < 2) throw new Error("qByteLen must be a number");
    if (typeof hmacFn !== "function") throw new Error("hmacFn must be a function");
    let v = u8n(hashLen);
    let k = u8n(hashLen);
    let i = 0;
    const reset = ()=>{
        v.fill(1);
        k.fill(0);
        i = 0;
    };
    const h = (...b)=>hmacFn(k, v, ...b);
    const reseed = (seed = u8n())=>{
        k = h(u8fr([
            0
        ]), seed);
        v = h();
        if (seed.length === 0) return;
        k = h(u8fr([
            1
        ]), seed);
        v = h();
    };
    const gen = ()=>{
        if (i++ >= 1e3) throw new Error("drbg: tried 1000 values");
        let len = 0;
        const out = [];
        while(len < qByteLen){
            v = h();
            const sl = v.slice();
            out.push(sl);
            len += v.length;
        }
        return concatBytes(...out);
    };
    const genUntil = (seed, pred)=>{
        reset();
        reseed(seed);
        let res = undefined;
        while(!(res = pred(gen())))reseed();
        reset();
        return res;
    };
    return genUntil;
}
const validatorFns = {
    bigint: (val)=>typeof val === "bigint",
    function: (val)=>typeof val === "function",
    boolean: (val)=>typeof val === "boolean",
    string: (val)=>typeof val === "string",
    stringOrUint8Array: (val)=>typeof val === "string" || val instanceof Uint8Array,
    isSafeInteger: (val)=>Number.isSafeInteger(val),
    array: (val)=>Array.isArray(val),
    field: (val, object)=>object.Fp.isValid(val),
    hash: (val)=>typeof val === "function" && Number.isSafeInteger(val.outputLen)
};
function validateObject(object, validators, optValidators = {}) {
    const checkField = (fieldName, type, isOptional)=>{
        const checkVal = validatorFns[type];
        if (typeof checkVal !== "function") throw new Error(`Invalid validator "${type}", expected function`);
        const val = object[fieldName];
        if (isOptional && val === undefined) return;
        if (!checkVal(val, object)) {
            throw new Error(`Invalid param ${String(fieldName)}=${val} (${typeof val}), expected ${type}`);
        }
    };
    for (const [fieldName, type] of Object.entries(validators))checkField(fieldName, type, false);
    for (const [fieldName1, type1] of Object.entries(optValidators))checkField(fieldName1, type1, true);
    return object;
}
var ut = Object.freeze({
    __proto__: null,
    bitGet: bitGet,
    bitLen: bitLen,
    bitMask: bitMask,
    bitSet: bitSet,
    bytesToHex: bytesToHex,
    bytesToNumberBE: bytesToNumberBE,
    bytesToNumberLE: bytesToNumberLE,
    concatBytes: concatBytes,
    createHmacDrbg: createHmacDrbg,
    ensureBytes: ensureBytes,
    equalBytes: equalBytes,
    hexToBytes: hexToBytes,
    hexToNumber: hexToNumber,
    numberToBytesBE: numberToBytesBE,
    numberToBytesLE: numberToBytesLE,
    numberToHexUnpadded: numberToHexUnpadded,
    numberToVarBytesBE: numberToVarBytesBE,
    utf8ToBytes: utf8ToBytes,
    validateObject: validateObject
});
const _0n$2 = BigInt(0), _1n$3 = BigInt(1), _2n$1 = BigInt(2), _3n$1 = BigInt(3);
const _4n = BigInt(4), _5n = BigInt(5), _8n = BigInt(8);
BigInt(9);
BigInt(16);
function mod(a, b) {
    const result = a % b;
    return result >= _0n$2 ? result : b + result;
}
function pow(num, power, modulo) {
    if (modulo <= _0n$2 || power < _0n$2) throw new Error("Expected power/modulo > 0");
    if (modulo === _1n$3) return _0n$2;
    let res = _1n$3;
    while(power > _0n$2){
        if (power & _1n$3) res = res * num % modulo;
        num = num * num % modulo;
        power >>= _1n$3;
    }
    return res;
}
function pow2(x, power, modulo) {
    let res = x;
    while(power-- > _0n$2){
        res *= res;
        res %= modulo;
    }
    return res;
}
function invert(number, modulo) {
    if (number === _0n$2 || modulo <= _0n$2) {
        throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
    }
    let a = mod(number, modulo);
    let b = modulo;
    let x = _0n$2, u = _1n$3;
    while(a !== _0n$2){
        const q = b / a;
        const r = b % a;
        const m = x - u * q;
        b = a, a = r, x = u, u = m;
    }
    const gcd = b;
    if (gcd !== _1n$3) throw new Error("invert: does not exist");
    return mod(x, modulo);
}
function tonelliShanks(P) {
    const legendreC = (P - _1n$3) / _2n$1;
    let Q, S, Z;
    for(Q = P - _1n$3, S = 0; Q % _2n$1 === _0n$2; Q /= _2n$1, S++);
    for(Z = _2n$1; Z < P && pow(Z, legendreC, P) !== P - _1n$3; Z++);
    if (S === 1) {
        const p1div4 = (P + _1n$3) / _4n;
        return function tonelliFast(Fp, n) {
            const root = Fp.pow(n, p1div4);
            if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
            return root;
        };
    }
    const Q1div2 = (Q + _1n$3) / _2n$1;
    return function tonelliSlow(Fp, n) {
        if (Fp.pow(n, legendreC) === Fp.neg(Fp.ONE)) throw new Error("Cannot find square root");
        let r = S;
        let g = Fp.pow(Fp.mul(Fp.ONE, Z), Q);
        let x = Fp.pow(n, Q1div2);
        let b = Fp.pow(n, Q);
        while(!Fp.eql(b, Fp.ONE)){
            if (Fp.eql(b, Fp.ZERO)) return Fp.ZERO;
            let m = 1;
            for(let t2 = Fp.sqr(b); m < r; m++){
                if (Fp.eql(t2, Fp.ONE)) break;
                t2 = Fp.sqr(t2);
            }
            const ge = Fp.pow(g, _1n$3 << BigInt(r - m - 1));
            g = Fp.sqr(ge);
            x = Fp.mul(x, ge);
            b = Fp.mul(b, g);
            r = m;
        }
        return x;
    };
}
function FpSqrt(P) {
    if (P % _4n === _3n$1) {
        const p1div4 = (P + _1n$3) / _4n;
        return function sqrt3mod4(Fp, n) {
            const root = Fp.pow(n, p1div4);
            if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
            return root;
        };
    }
    if (P % _8n === _5n) {
        const c1 = (P - _5n) / _8n;
        return function sqrt5mod8(Fp, n) {
            const n2 = Fp.mul(n, _2n$1);
            const v = Fp.pow(n2, c1);
            const nv = Fp.mul(n, v);
            const i = Fp.mul(Fp.mul(nv, _2n$1), v);
            const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
            if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
            return root;
        };
    }
    return tonelliShanks(P);
}
const FIELD_FIELDS = [
    "create",
    "isValid",
    "is0",
    "neg",
    "inv",
    "sqrt",
    "sqr",
    "eql",
    "add",
    "sub",
    "mul",
    "pow",
    "div",
    "addN",
    "subN",
    "mulN",
    "sqrN"
];
function validateField(field) {
    const initial = {
        ORDER: "bigint",
        MASK: "bigint",
        BYTES: "isSafeInteger",
        BITS: "isSafeInteger"
    };
    const opts = FIELD_FIELDS.reduce((map, val)=>{
        map[val] = "function";
        return map;
    }, initial);
    return validateObject(field, opts);
}
function FpPow(f, num, power) {
    if (power < _0n$2) throw new Error("Expected power > 0");
    if (power === _0n$2) return f.ONE;
    if (power === _1n$3) return num;
    let p = f.ONE;
    let d = num;
    while(power > _0n$2){
        if (power & _1n$3) p = f.mul(p, d);
        d = f.sqr(d);
        power >>= _1n$3;
    }
    return p;
}
function FpInvertBatch(f, nums) {
    const tmp = new Array(nums.length);
    const lastMultiplied = nums.reduce((acc, num, i)=>{
        if (f.is0(num)) return acc;
        tmp[i] = acc;
        return f.mul(acc, num);
    }, f.ONE);
    const inverted = f.inv(lastMultiplied);
    nums.reduceRight((acc, num, i)=>{
        if (f.is0(num)) return acc;
        tmp[i] = f.mul(acc, tmp[i]);
        return f.mul(acc, num);
    }, inverted);
    return tmp;
}
function nLength(n, nBitLength) {
    const _nBitLength = nBitLength !== undefined ? nBitLength : n.toString(2).length;
    const nByteLength = Math.ceil(_nBitLength / 8);
    return {
        nBitLength: _nBitLength,
        nByteLength: nByteLength
    };
}
function Field(ORDER, bitLen, isLE = false, redef = {}) {
    if (ORDER <= _0n$2) throw new Error(`Expected Field ORDER > 0, got ${ORDER}`);
    const { nBitLength: BITS , nByteLength: BYTES  } = nLength(ORDER, bitLen);
    if (BYTES > 2048) throw new Error("Field lengths over 2048 bytes are not supported");
    const sqrtP = FpSqrt(ORDER);
    const f = Object.freeze({
        ORDER: ORDER,
        BITS: BITS,
        BYTES: BYTES,
        MASK: bitMask(BITS),
        ZERO: _0n$2,
        ONE: _1n$3,
        create: (num)=>mod(num, ORDER),
        isValid: (num)=>{
            if (typeof num !== "bigint") throw new Error(`Invalid field element: expected bigint, got ${typeof num}`);
            return _0n$2 <= num && num < ORDER;
        },
        is0: (num)=>num === _0n$2,
        isOdd: (num)=>(num & _1n$3) === _1n$3,
        neg: (num)=>mod(-num, ORDER),
        eql: (lhs, rhs)=>lhs === rhs,
        sqr: (num)=>mod(num * num, ORDER),
        add: (lhs, rhs)=>mod(lhs + rhs, ORDER),
        sub: (lhs, rhs)=>mod(lhs - rhs, ORDER),
        mul: (lhs, rhs)=>mod(lhs * rhs, ORDER),
        pow: (num, power)=>FpPow(f, num, power),
        div: (lhs, rhs)=>mod(lhs * invert(rhs, ORDER), ORDER),
        sqrN: (num)=>num * num,
        addN: (lhs, rhs)=>lhs + rhs,
        subN: (lhs, rhs)=>lhs - rhs,
        mulN: (lhs, rhs)=>lhs * rhs,
        inv: (num)=>invert(num, ORDER),
        sqrt: redef.sqrt || ((n)=>sqrtP(f, n)),
        invertBatch: (lst)=>FpInvertBatch(f, lst),
        cmov: (a, b, c)=>c ? b : a,
        toBytes: (num)=>isLE ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES),
        fromBytes: (bytes)=>{
            if (bytes.length !== BYTES) throw new Error(`Fp.fromBytes: expected ${BYTES}, got ${bytes.length}`);
            return isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
        }
    });
    return Object.freeze(f);
}
function getFieldBytesLength(fieldOrder) {
    if (typeof fieldOrder !== "bigint") throw new Error("field order must be bigint");
    const bitLength = fieldOrder.toString(2).length;
    return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
    const length = getFieldBytesLength(fieldOrder);
    return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE = false) {
    const len = key.length;
    const fieldLen = getFieldBytesLength(fieldOrder);
    const minLen = getMinHashLength(fieldOrder);
    if (len < 16 || len < minLen || len > 1024) throw new Error(`expected ${minLen}-1024 bytes of input, got ${len}`);
    const num = isLE ? bytesToNumberBE(key) : bytesToNumberLE(key);
    const reduced = mod(num, fieldOrder - _1n$3) + _1n$3;
    return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
const _0n$1 = BigInt(0);
const _1n$2 = BigInt(1);
function wNAF(c, bits) {
    const constTimeNegate = (condition, item)=>{
        const neg = item.negate();
        return condition ? neg : item;
    };
    const opts = (W)=>{
        const windows = Math.ceil(bits / W) + 1;
        const windowSize = 2 ** (W - 1);
        return {
            windows: windows,
            windowSize: windowSize
        };
    };
    return {
        constTimeNegate: constTimeNegate,
        unsafeLadder (elm, n) {
            let p = c.ZERO;
            let d = elm;
            while(n > _0n$1){
                if (n & _1n$2) p = p.add(d);
                d = d.double();
                n >>= _1n$2;
            }
            return p;
        },
        precomputeWindow (elm, W) {
            const { windows , windowSize  } = opts(W);
            const points = [];
            let p = elm;
            let base = p;
            for(let window1 = 0; window1 < windows; window1++){
                base = p;
                points.push(base);
                for(let i = 1; i < windowSize; i++){
                    base = base.add(p);
                    points.push(base);
                }
                p = base.double();
            }
            return points;
        },
        wNAF (W, precomputes, n) {
            const { windows , windowSize  } = opts(W);
            let p = c.ZERO;
            let f = c.BASE;
            const mask = BigInt(2 ** W - 1);
            const maxNumber = 2 ** W;
            const shiftBy = BigInt(W);
            for(let window1 = 0; window1 < windows; window1++){
                const offset = window1 * windowSize;
                let wbits = Number(n & mask);
                n >>= shiftBy;
                if (wbits > windowSize) {
                    wbits -= maxNumber;
                    n += _1n$2;
                }
                const offset1 = offset;
                const offset2 = offset + Math.abs(wbits) - 1;
                const cond1 = window1 % 2 !== 0;
                const cond2 = wbits < 0;
                if (wbits === 0) {
                    f = f.add(constTimeNegate(cond1, precomputes[offset1]));
                } else {
                    p = p.add(constTimeNegate(cond2, precomputes[offset2]));
                }
            }
            return {
                p: p,
                f: f
            };
        },
        wNAFCached (P, precomputesMap, n, transform) {
            const W = P._WINDOW_SIZE || 1;
            let comp = precomputesMap.get(P);
            if (!comp) {
                comp = this.precomputeWindow(P, W);
                if (W !== 1) {
                    precomputesMap.set(P, transform(comp));
                }
            }
            return this.wNAF(W, comp, n);
        }
    };
}
function validateBasic(curve) {
    validateField(curve.Fp);
    validateObject(curve, {
        n: "bigint",
        h: "bigint",
        Gx: "field",
        Gy: "field"
    }, {
        nBitLength: "isSafeInteger",
        nByteLength: "isSafeInteger"
    });
    return Object.freeze({
        ...nLength(curve.n, curve.nBitLength),
        ...curve,
        ...{
            p: curve.Fp.ORDER
        }
    });
}
function validatePointOpts(curve) {
    const opts = validateBasic(curve);
    validateObject(opts, {
        a: "field",
        b: "field"
    }, {
        allowedPrivateKeyLengths: "array",
        wrapPrivateKey: "boolean",
        isTorsionFree: "function",
        clearCofactor: "function",
        allowInfinityPoint: "boolean",
        fromBytes: "function",
        toBytes: "function"
    });
    const { endo , Fp , a  } = opts;
    if (endo) {
        if (!Fp.eql(a, Fp.ZERO)) {
            throw new Error("Endomorphism can only be defined for Koblitz curves that have a=0");
        }
        if (typeof endo !== "object" || typeof endo.beta !== "bigint" || typeof endo.splitScalar !== "function") {
            throw new Error("Expected endomorphism with beta: bigint and splitScalar: function");
        }
    }
    return Object.freeze({
        ...opts
    });
}
const { bytesToNumberBE: b2n , hexToBytes: h2b  } = ut;
const DER = {
    Err: class DERErr extends Error {
        constructor(m = ""){
            super(m);
        }
    },
    _parseInt (data) {
        const { Err: E  } = DER;
        if (data.length < 2 || data[0] !== 2) throw new E("Invalid signature integer tag");
        const len = data[1];
        const res = data.subarray(2, len + 2);
        if (!len || res.length !== len) throw new E("Invalid signature integer: wrong length");
        if (res[0] & 128) throw new E("Invalid signature integer: negative");
        if (res[0] === 0 && !(res[1] & 128)) throw new E("Invalid signature integer: unnecessary leading zero");
        return {
            d: b2n(res),
            l: data.subarray(len + 2)
        };
    },
    toSig (hex) {
        const { Err: E  } = DER;
        const data = typeof hex === "string" ? h2b(hex) : hex;
        if (!(data instanceof Uint8Array)) throw new Error("ui8a expected");
        let l = data.length;
        if (l < 2 || data[0] != 48) throw new E("Invalid signature tag");
        if (data[1] !== l - 2) throw new E("Invalid signature: incorrect length");
        const { d: r , l: sBytes  } = DER._parseInt(data.subarray(2));
        const { d: s , l: rBytesLeft  } = DER._parseInt(sBytes);
        if (rBytesLeft.length) throw new E("Invalid signature: left bytes after parsing");
        return {
            r: r,
            s: s
        };
    },
    hexFromSig (sig) {
        const slice = (s)=>Number.parseInt(s[0], 16) & 8 ? "00" + s : s;
        const h = (num)=>{
            const hex = num.toString(16);
            return hex.length & 1 ? `0${hex}` : hex;
        };
        const s = slice(h(sig.s));
        const r = slice(h(sig.r));
        const shl = s.length / 2;
        const rhl = r.length / 2;
        const sl = h(shl);
        const rl = h(rhl);
        return `30${h(rhl + shl + 4)}02${rl}${r}02${sl}${s}`;
    }
};
const _0n = BigInt(0), _1n$1 = BigInt(1);
BigInt(2);
const _3n = BigInt(3);
BigInt(4);
function weierstrassPoints(opts) {
    const CURVE = validatePointOpts(opts);
    const { Fp  } = CURVE;
    const toBytes = CURVE.toBytes || ((_c, point, _isCompressed)=>{
        const a = point.toAffine();
        return concatBytes(Uint8Array.from([
            4
        ]), Fp.toBytes(a.x), Fp.toBytes(a.y));
    });
    const fromBytes = CURVE.fromBytes || ((bytes)=>{
        const tail = bytes.subarray(1);
        const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
        const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
        return {
            x: x,
            y: y
        };
    });
    function weierstrassEquation(x) {
        const { a , b  } = CURVE;
        const x2 = Fp.sqr(x);
        const x3 = Fp.mul(x2, x);
        return Fp.add(Fp.add(x3, Fp.mul(x, a)), b);
    }
    if (!Fp.eql(Fp.sqr(CURVE.Gy), weierstrassEquation(CURVE.Gx))) throw new Error("bad generator point: equation left != right");
    function isWithinCurveOrder(num) {
        return typeof num === "bigint" && _0n < num && num < CURVE.n;
    }
    function assertGE(num) {
        if (!isWithinCurveOrder(num)) throw new Error("Expected valid bigint: 0 < bigint < curve.n");
    }
    function normPrivateKeyToScalar(key) {
        const { allowedPrivateKeyLengths: lengths , nByteLength , wrapPrivateKey , n  } = CURVE;
        if (lengths && typeof key !== "bigint") {
            if (key instanceof Uint8Array) key = bytesToHex(key);
            if (typeof key !== "string" || !lengths.includes(key.length)) throw new Error("Invalid key");
            key = key.padStart(nByteLength * 2, "0");
        }
        let num;
        try {
            num = typeof key === "bigint" ? key : bytesToNumberBE(ensureBytes("private key", key, nByteLength));
        } catch (error) {
            throw new Error(`private key must be ${nByteLength} bytes, hex or bigint, not ${typeof key}`);
        }
        if (wrapPrivateKey) num = mod(num, n);
        assertGE(num);
        return num;
    }
    const pointPrecomputes = new Map;
    function assertPrjPoint(other) {
        if (!(other instanceof Point)) throw new Error("ProjectivePoint expected");
    }
    class Point {
        constructor(px, py, pz){
            this.px = px;
            this.py = py;
            this.pz = pz;
            if (px == null || !Fp.isValid(px)) throw new Error("x required");
            if (py == null || !Fp.isValid(py)) throw new Error("y required");
            if (pz == null || !Fp.isValid(pz)) throw new Error("z required");
        }
        static fromAffine(p) {
            const { x , y  } = p || {};
            if (!p || !Fp.isValid(x) || !Fp.isValid(y)) throw new Error("invalid affine point");
            if (p instanceof Point) throw new Error("projective point not allowed");
            const is0 = (i)=>Fp.eql(i, Fp.ZERO);
            if (is0(x) && is0(y)) return Point.ZERO;
            return new Point(x, y, Fp.ONE);
        }
        get x() {
            return this.toAffine().x;
        }
        get y() {
            return this.toAffine().y;
        }
        static normalizeZ(points) {
            const toInv = Fp.invertBatch(points.map((p)=>p.pz));
            return points.map((p, i)=>p.toAffine(toInv[i])).map(Point.fromAffine);
        }
        static fromHex(hex) {
            const P = Point.fromAffine(fromBytes(ensureBytes("pointHex", hex)));
            P.assertValidity();
            return P;
        }
        static fromPrivateKey(privateKey) {
            return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
        }
        _setWindowSize(windowSize) {
            this._WINDOW_SIZE = windowSize;
            pointPrecomputes.delete(this);
        }
        assertValidity() {
            if (this.is0()) {
                if (CURVE.allowInfinityPoint && !Fp.is0(this.py)) return;
                throw new Error("bad point: ZERO");
            }
            const { x , y  } = this.toAffine();
            if (!Fp.isValid(x) || !Fp.isValid(y)) throw new Error("bad point: x or y not FE");
            const left = Fp.sqr(y);
            const right = weierstrassEquation(x);
            if (!Fp.eql(left, right)) throw new Error("bad point: equation left != right");
            if (!this.isTorsionFree()) throw new Error("bad point: not in prime-order subgroup");
        }
        hasEvenY() {
            const { y  } = this.toAffine();
            if (Fp.isOdd) return !Fp.isOdd(y);
            throw new Error("Field doesn't support isOdd");
        }
        equals(other) {
            assertPrjPoint(other);
            const { px: X1 , py: Y1 , pz: Z1  } = this;
            const { px: X2 , py: Y2 , pz: Z2  } = other;
            const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
            const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
            return U1 && U2;
        }
        negate() {
            return new Point(this.px, Fp.neg(this.py), this.pz);
        }
        double() {
            const { a , b  } = CURVE;
            const b3 = Fp.mul(b, _3n);
            const { px: X1 , py: Y1 , pz: Z1  } = this;
            let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
            let t0 = Fp.mul(X1, X1);
            let t1 = Fp.mul(Y1, Y1);
            let t2 = Fp.mul(Z1, Z1);
            let t3 = Fp.mul(X1, Y1);
            t3 = Fp.add(t3, t3);
            Z3 = Fp.mul(X1, Z1);
            Z3 = Fp.add(Z3, Z3);
            X3 = Fp.mul(a, Z3);
            Y3 = Fp.mul(b3, t2);
            Y3 = Fp.add(X3, Y3);
            X3 = Fp.sub(t1, Y3);
            Y3 = Fp.add(t1, Y3);
            Y3 = Fp.mul(X3, Y3);
            X3 = Fp.mul(t3, X3);
            Z3 = Fp.mul(b3, Z3);
            t2 = Fp.mul(a, t2);
            t3 = Fp.sub(t0, t2);
            t3 = Fp.mul(a, t3);
            t3 = Fp.add(t3, Z3);
            Z3 = Fp.add(t0, t0);
            t0 = Fp.add(Z3, t0);
            t0 = Fp.add(t0, t2);
            t0 = Fp.mul(t0, t3);
            Y3 = Fp.add(Y3, t0);
            t2 = Fp.mul(Y1, Z1);
            t2 = Fp.add(t2, t2);
            t0 = Fp.mul(t2, t3);
            X3 = Fp.sub(X3, t0);
            Z3 = Fp.mul(t2, t1);
            Z3 = Fp.add(Z3, Z3);
            Z3 = Fp.add(Z3, Z3);
            return new Point(X3, Y3, Z3);
        }
        add(other) {
            assertPrjPoint(other);
            const { px: X1 , py: Y1 , pz: Z1  } = this;
            const { px: X2 , py: Y2 , pz: Z2  } = other;
            let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
            const a = CURVE.a;
            const b3 = Fp.mul(CURVE.b, _3n);
            let t0 = Fp.mul(X1, X2);
            let t1 = Fp.mul(Y1, Y2);
            let t2 = Fp.mul(Z1, Z2);
            let t3 = Fp.add(X1, Y1);
            let t4 = Fp.add(X2, Y2);
            t3 = Fp.mul(t3, t4);
            t4 = Fp.add(t0, t1);
            t3 = Fp.sub(t3, t4);
            t4 = Fp.add(X1, Z1);
            let t5 = Fp.add(X2, Z2);
            t4 = Fp.mul(t4, t5);
            t5 = Fp.add(t0, t2);
            t4 = Fp.sub(t4, t5);
            t5 = Fp.add(Y1, Z1);
            X3 = Fp.add(Y2, Z2);
            t5 = Fp.mul(t5, X3);
            X3 = Fp.add(t1, t2);
            t5 = Fp.sub(t5, X3);
            Z3 = Fp.mul(a, t4);
            X3 = Fp.mul(b3, t2);
            Z3 = Fp.add(X3, Z3);
            X3 = Fp.sub(t1, Z3);
            Z3 = Fp.add(t1, Z3);
            Y3 = Fp.mul(X3, Z3);
            t1 = Fp.add(t0, t0);
            t1 = Fp.add(t1, t0);
            t2 = Fp.mul(a, t2);
            t4 = Fp.mul(b3, t4);
            t1 = Fp.add(t1, t2);
            t2 = Fp.sub(t0, t2);
            t2 = Fp.mul(a, t2);
            t4 = Fp.add(t4, t2);
            t0 = Fp.mul(t1, t4);
            Y3 = Fp.add(Y3, t0);
            t0 = Fp.mul(t5, t4);
            X3 = Fp.mul(t3, X3);
            X3 = Fp.sub(X3, t0);
            t0 = Fp.mul(t3, t1);
            Z3 = Fp.mul(t5, Z3);
            Z3 = Fp.add(Z3, t0);
            return new Point(X3, Y3, Z3);
        }
        subtract(other) {
            return this.add(other.negate());
        }
        is0() {
            return this.equals(Point.ZERO);
        }
        wNAF(n) {
            return wnaf.wNAFCached(this, pointPrecomputes, n, (comp)=>{
                const toInv = Fp.invertBatch(comp.map((p)=>p.pz));
                return comp.map((p, i)=>p.toAffine(toInv[i])).map(Point.fromAffine);
            });
        }
        multiplyUnsafe(n) {
            const I = Point.ZERO;
            if (n === _0n) return I;
            assertGE(n);
            if (n === _1n$1) return this;
            const { endo  } = CURVE;
            if (!endo) return wnaf.unsafeLadder(this, n);
            let { k1neg , k1 , k2neg , k2  } = endo.splitScalar(n);
            let k1p = I;
            let k2p = I;
            let d = this;
            while(k1 > _0n || k2 > _0n){
                if (k1 & _1n$1) k1p = k1p.add(d);
                if (k2 & _1n$1) k2p = k2p.add(d);
                d = d.double();
                k1 >>= _1n$1;
                k2 >>= _1n$1;
            }
            if (k1neg) k1p = k1p.negate();
            if (k2neg) k2p = k2p.negate();
            k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
            return k1p.add(k2p);
        }
        multiply(scalar) {
            assertGE(scalar);
            let n = scalar;
            let point, fake;
            const { endo  } = CURVE;
            if (endo) {
                const { k1neg , k1 , k2neg , k2  } = endo.splitScalar(n);
                let { p: k1p , f: f1p  } = this.wNAF(k1);
                let { p: k2p , f: f2p  } = this.wNAF(k2);
                k1p = wnaf.constTimeNegate(k1neg, k1p);
                k2p = wnaf.constTimeNegate(k2neg, k2p);
                k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
                point = k1p.add(k2p);
                fake = f1p.add(f2p);
            } else {
                const { p , f  } = this.wNAF(n);
                point = p;
                fake = f;
            }
            return Point.normalizeZ([
                point,
                fake
            ])[0];
        }
        multiplyAndAddUnsafe(Q, a, b) {
            const G = Point.BASE;
            const mul = (P, a)=>a === _0n || a === _1n$1 || !P.equals(G) ? P.multiplyUnsafe(a) : P.multiply(a);
            const sum = mul(this, a).add(mul(Q, b));
            return sum.is0() ? undefined : sum;
        }
        toAffine(iz) {
            const { px: x , py: y , pz: z  } = this;
            const is0 = this.is0();
            if (iz == null) iz = is0 ? Fp.ONE : Fp.inv(z);
            const ax = Fp.mul(x, iz);
            const ay = Fp.mul(y, iz);
            const zz = Fp.mul(z, iz);
            if (is0) return {
                x: Fp.ZERO,
                y: Fp.ZERO
            };
            if (!Fp.eql(zz, Fp.ONE)) throw new Error("invZ was invalid");
            return {
                x: ax,
                y: ay
            };
        }
        isTorsionFree() {
            const { h: cofactor , isTorsionFree  } = CURVE;
            if (cofactor === _1n$1) return true;
            if (isTorsionFree) return isTorsionFree(Point, this);
            throw new Error("isTorsionFree() has not been declared for the elliptic curve");
        }
        clearCofactor() {
            const { h: cofactor , clearCofactor  } = CURVE;
            if (cofactor === _1n$1) return this;
            if (clearCofactor) return clearCofactor(Point, this);
            return this.multiplyUnsafe(CURVE.h);
        }
        toRawBytes(isCompressed = true) {
            this.assertValidity();
            return toBytes(Point, this, isCompressed);
        }
        toHex(isCompressed = true) {
            return bytesToHex(this.toRawBytes(isCompressed));
        }
    }
    Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
    Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
    const _bits = CURVE.nBitLength;
    const wnaf = wNAF(Point, CURVE.endo ? Math.ceil(_bits / 2) : _bits);
    return {
        CURVE: CURVE,
        ProjectivePoint: Point,
        normPrivateKeyToScalar: normPrivateKeyToScalar,
        weierstrassEquation: weierstrassEquation,
        isWithinCurveOrder: isWithinCurveOrder
    };
}
function validateOpts(curve) {
    const opts = validateBasic(curve);
    validateObject(opts, {
        hash: "hash",
        hmac: "function",
        randomBytes: "function"
    }, {
        bits2int: "function",
        bits2int_modN: "function",
        lowS: "boolean"
    });
    return Object.freeze({
        lowS: true,
        ...opts
    });
}
function weierstrass(curveDef) {
    const CURVE = validateOpts(curveDef);
    const { Fp , n: CURVE_ORDER  } = CURVE;
    const compressedLen = Fp.BYTES + 1;
    const uncompressedLen = 2 * Fp.BYTES + 1;
    function isValidFieldElement(num) {
        return _0n < num && num < Fp.ORDER;
    }
    function modN(a) {
        return mod(a, CURVE_ORDER);
    }
    function invN(a) {
        return invert(a, CURVE_ORDER);
    }
    const { ProjectivePoint: Point , normPrivateKeyToScalar , weierstrassEquation , isWithinCurveOrder  } = weierstrassPoints({
        ...CURVE,
        toBytes (_c, point, isCompressed) {
            const a = point.toAffine();
            const x = Fp.toBytes(a.x);
            const cat = concatBytes;
            if (isCompressed) {
                return cat(Uint8Array.from([
                    point.hasEvenY() ? 2 : 3
                ]), x);
            } else {
                return cat(Uint8Array.from([
                    4
                ]), x, Fp.toBytes(a.y));
            }
        },
        fromBytes (bytes) {
            const len = bytes.length;
            const head = bytes[0];
            const tail = bytes.subarray(1);
            if (len === compressedLen && (head === 2 || head === 3)) {
                const x = bytesToNumberBE(tail);
                if (!isValidFieldElement(x)) throw new Error("Point is not on curve");
                const y2 = weierstrassEquation(x);
                let y = Fp.sqrt(y2);
                const isYOdd = (y & _1n$1) === _1n$1;
                const isHeadOdd = (head & 1) === 1;
                if (isHeadOdd !== isYOdd) y = Fp.neg(y);
                return {
                    x: x,
                    y: y
                };
            } else if (len === uncompressedLen && head === 4) {
                const x1 = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
                const y1 = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
                return {
                    x: x1,
                    y: y1
                };
            } else {
                throw new Error(`Point of length ${len} was invalid. Expected ${compressedLen} compressed bytes or ${uncompressedLen} uncompressed bytes`);
            }
        }
    });
    const numToNByteStr = (num)=>bytesToHex(numberToBytesBE(num, CURVE.nByteLength));
    function isBiggerThanHalfOrder(number) {
        const HALF = CURVE_ORDER >> _1n$1;
        return number > HALF;
    }
    function normalizeS(s) {
        return isBiggerThanHalfOrder(s) ? modN(-s) : s;
    }
    const slcNum = (b, from, to)=>bytesToNumberBE(b.slice(from, to));
    class Signature {
        constructor(r, s, recovery){
            this.r = r;
            this.s = s;
            this.recovery = recovery;
            this.assertValidity();
        }
        static fromCompact(hex) {
            const l = CURVE.nByteLength;
            hex = ensureBytes("compactSignature", hex, l * 2);
            return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
        }
        static fromDER(hex) {
            const { r , s  } = DER.toSig(ensureBytes("DER", hex));
            return new Signature(r, s);
        }
        assertValidity() {
            if (!isWithinCurveOrder(this.r)) throw new Error("r must be 0 < r < CURVE.n");
            if (!isWithinCurveOrder(this.s)) throw new Error("s must be 0 < s < CURVE.n");
        }
        addRecoveryBit(recovery) {
            return new Signature(this.r, this.s, recovery);
        }
        recoverPublicKey(msgHash) {
            const { r , s , recovery: rec  } = this;
            const h = bits2int_modN(ensureBytes("msgHash", msgHash));
            if (rec == null || ![
                0,
                1,
                2,
                3
            ].includes(rec)) throw new Error("recovery id invalid");
            const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
            if (radj >= Fp.ORDER) throw new Error("recovery id 2 or 3 invalid");
            const prefix = (rec & 1) === 0 ? "02" : "03";
            const R = Point.fromHex(prefix + numToNByteStr(radj));
            const ir = invN(radj);
            const u1 = modN(-h * ir);
            const u2 = modN(s * ir);
            const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
            if (!Q) throw new Error("point at infinify");
            Q.assertValidity();
            return Q;
        }
        hasHighS() {
            return isBiggerThanHalfOrder(this.s);
        }
        normalizeS() {
            return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
        }
        toDERRawBytes() {
            return hexToBytes(this.toDERHex());
        }
        toDERHex() {
            return DER.hexFromSig({
                r: this.r,
                s: this.s
            });
        }
        toCompactRawBytes() {
            return hexToBytes(this.toCompactHex());
        }
        toCompactHex() {
            return numToNByteStr(this.r) + numToNByteStr(this.s);
        }
    }
    const utils = {
        isValidPrivateKey (privateKey) {
            try {
                normPrivateKeyToScalar(privateKey);
                return true;
            } catch (error) {
                return false;
            }
        },
        normPrivateKeyToScalar: normPrivateKeyToScalar,
        randomPrivateKey: ()=>{
            const length = getMinHashLength(CURVE.n);
            return mapHashToField(CURVE.randomBytes(length), CURVE.n);
        },
        precompute (windowSize = 8, point = Point.BASE) {
            point._setWindowSize(windowSize);
            point.multiply(BigInt(3));
            return point;
        }
    };
    function getPublicKey(privateKey, isCompressed = true) {
        return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
    }
    function isProbPub(item) {
        const arr = item instanceof Uint8Array;
        const str = typeof item === "string";
        const len = (arr || str) && item.length;
        if (arr) return len === compressedLen || len === uncompressedLen;
        if (str) return len === 2 * compressedLen || len === 2 * uncompressedLen;
        if (item instanceof Point) return true;
        return false;
    }
    function getSharedSecret(privateA, publicB, isCompressed = true) {
        if (isProbPub(privateA)) throw new Error("first arg must be private key");
        if (!isProbPub(publicB)) throw new Error("second arg must be public key");
        const b = Point.fromHex(publicB);
        return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
    }
    const bits2int = CURVE.bits2int || function(bytes) {
        const num = bytesToNumberBE(bytes);
        const delta = bytes.length * 8 - CURVE.nBitLength;
        return delta > 0 ? num >> BigInt(delta) : num;
    };
    const bits2int_modN = CURVE.bits2int_modN || function(bytes) {
        return modN(bits2int(bytes));
    };
    const ORDER_MASK = bitMask(CURVE.nBitLength);
    function int2octets(num) {
        if (typeof num !== "bigint") throw new Error("bigint expected");
        if (!(_0n <= num && num < ORDER_MASK)) throw new Error(`bigint expected < 2^${CURVE.nBitLength}`);
        return numberToBytesBE(num, CURVE.nByteLength);
    }
    function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
        if ([
            "recovered",
            "canonical"
        ].some((k)=>k in opts)) throw new Error("sign() legacy options not supported");
        const { hash , randomBytes  } = CURVE;
        let { lowS , prehash , extraEntropy: ent  } = opts;
        if (lowS == null) lowS = true;
        msgHash = ensureBytes("msgHash", msgHash);
        if (prehash) msgHash = ensureBytes("prehashed msgHash", hash(msgHash));
        const h1int = bits2int_modN(msgHash);
        const d = normPrivateKeyToScalar(privateKey);
        const seedArgs = [
            int2octets(d),
            int2octets(h1int)
        ];
        if (ent != null) {
            const e = ent === true ? randomBytes(Fp.BYTES) : ent;
            seedArgs.push(ensureBytes("extraEntropy", e));
        }
        const seed = concatBytes(...seedArgs);
        const m = h1int;
        function k2sig(kBytes) {
            const k = bits2int(kBytes);
            if (!isWithinCurveOrder(k)) return;
            const ik = invN(k);
            const q = Point.BASE.multiply(k).toAffine();
            const r = modN(q.x);
            if (r === _0n) return;
            const s = modN(ik * modN(m + r * d));
            if (s === _0n) return;
            let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n$1);
            let normS = s;
            if (lowS && isBiggerThanHalfOrder(s)) {
                normS = normalizeS(s);
                recovery ^= 1;
            }
            return new Signature(r, normS, recovery);
        }
        return {
            seed: seed,
            k2sig: k2sig
        };
    }
    const defaultSigOpts = {
        lowS: CURVE.lowS,
        prehash: false
    };
    const defaultVerOpts = {
        lowS: CURVE.lowS,
        prehash: false
    };
    function sign(msgHash, privKey, opts = defaultSigOpts) {
        const { seed , k2sig  } = prepSig(msgHash, privKey, opts);
        const C = CURVE;
        const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
        return drbg(seed, k2sig);
    }
    Point.BASE._setWindowSize(8);
    function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
        const sg = signature;
        msgHash = ensureBytes("msgHash", msgHash);
        publicKey = ensureBytes("publicKey", publicKey);
        if ("strict" in opts) throw new Error("options.strict was renamed to lowS");
        const { lowS , prehash  } = opts;
        let _sig = undefined;
        let P;
        try {
            if (typeof sg === "string" || sg instanceof Uint8Array) {
                try {
                    _sig = Signature.fromDER(sg);
                } catch (derError) {
                    if (!(derError instanceof DER.Err)) throw derError;
                    _sig = Signature.fromCompact(sg);
                }
            } else if (typeof sg === "object" && typeof sg.r === "bigint" && typeof sg.s === "bigint") {
                const { r , s  } = sg;
                _sig = new Signature(r, s);
            } else {
                throw new Error("PARSE");
            }
            P = Point.fromHex(publicKey);
        } catch (error) {
            if (error.message === "PARSE") throw new Error(`signature must be Signature instance, Uint8Array or hex string`);
            return false;
        }
        if (lowS && _sig.hasHighS()) return false;
        if (prehash) msgHash = CURVE.hash(msgHash);
        const { r: r1 , s: s1  } = _sig;
        const h = bits2int_modN(msgHash);
        const is = invN(s1);
        const u1 = modN(h * is);
        const u2 = modN(r1 * is);
        const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine();
        if (!R) return false;
        const v = modN(R.x);
        return v === r1;
    }
    return {
        CURVE: CURVE,
        getPublicKey: getPublicKey,
        getSharedSecret: getSharedSecret,
        sign: sign,
        verify: verify,
        ProjectivePoint: Point,
        Signature: Signature,
        utils: utils
    };
}
function getHash(hash) {
    return {
        hash: hash,
        hmac: (key, ...msgs)=>hmac(hash, key, concatBytes$1(...msgs)),
        randomBytes: randomBytes$2
    };
}
function createCurve(curveDef, defHash) {
    const create = (hash)=>weierstrass({
            ...curveDef,
            ...getHash(hash)
        });
    return Object.freeze({
        ...create(defHash),
        create: create
    });
}
const secp256k1P = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
const secp256k1N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
const _1n = BigInt(1);
const _2n = BigInt(2);
const divNearest = (a, b)=>(a + b / _2n) / b;
function sqrtMod(y) {
    const P = secp256k1P;
    const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
    const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
    const b2 = y * y * y % P;
    const b3 = b2 * b2 * y % P;
    const b6 = pow2(b3, _3n, P) * b3 % P;
    const b9 = pow2(b6, _3n, P) * b3 % P;
    const b11 = pow2(b9, _2n, P) * b2 % P;
    const b22 = pow2(b11, _11n, P) * b11 % P;
    const b44 = pow2(b22, _22n, P) * b22 % P;
    const b88 = pow2(b44, _44n, P) * b44 % P;
    const b176 = pow2(b88, _88n, P) * b88 % P;
    const b220 = pow2(b176, _44n, P) * b44 % P;
    const b223 = pow2(b220, _3n, P) * b3 % P;
    const t1 = pow2(b223, _23n, P) * b22 % P;
    const t2 = pow2(t1, _6n, P) * b2 % P;
    const root = pow2(t2, _2n, P);
    if (!Fp.eql(Fp.sqr(root), y)) throw new Error("Cannot find square root");
    return root;
}
const Fp = Field(secp256k1P, undefined, undefined, {
    sqrt: sqrtMod
});
const secp256k1 = createCurve({
    a: BigInt(0),
    b: BigInt(7),
    Fp: Fp,
    n: secp256k1N,
    Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
    Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
    h: BigInt(1),
    lowS: true,
    endo: {
        beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
        splitScalar: (k)=>{
            const n = secp256k1N;
            const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
            const b1 = -_1n * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
            const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
            const b2 = a1;
            const POW_2_128 = BigInt("0x100000000000000000000000000000000");
            const c1 = divNearest(b2 * k, n);
            const c2 = divNearest(-b1 * k, n);
            let k1 = mod(k - c1 * a1 - c2 * a2, n);
            let k2 = mod(-c1 * b1 - c2 * b2, n);
            const k1neg = k1 > POW_2_128;
            const k2neg = k2 > POW_2_128;
            if (k1neg) k1 = n - k1;
            if (k2neg) k2 = n - k2;
            if (k1 > POW_2_128 || k2 > POW_2_128) {
                throw new Error("splitScalar: Endomorphism failed, k=" + k);
            }
            return {
                k1neg: k1neg,
                k1: k1,
                k2neg: k2neg,
                k2: k2
            };
        }
    }
}, sha256$1);
BigInt(0);
secp256k1.ProjectivePoint;
const ZeroAddress = "0x0000000000000000000000000000000000000000";
const ZeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
const N$1 = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
const WeiPerEther = BigInt("1000000000000000000");
const MaxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
const MinInt256 = BigInt("0x8000000000000000000000000000000000000000000000000000000000000000") * BigInt(-1);
const MaxInt256 = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
const EtherSymbol = "Ξ";
const MessagePrefix = "Ethereum Signed Message:\n";
const BN_0$7 = BigInt(0);
const BN_1$3 = BigInt(1);
const BN_2$3 = BigInt(2);
const BN_27$1 = BigInt(27);
const BN_28$1 = BigInt(28);
const BN_35$1 = BigInt(35);
const _guard$3 = {};
function toUint256(value) {
    return zeroPadValue(toBeArray(value), 32);
}
class Signature {
    #r;
    #s;
    #v;
    #networkV;
    get r() {
        return this.#r;
    }
    set r(value) {
        assertArgument(dataLength(value) === 32, "invalid r", "value", value);
        this.#r = hexlify(value);
    }
    get s() {
        return this.#s;
    }
    set s(_value) {
        assertArgument(dataLength(_value) === 32, "invalid s", "value", _value);
        const value = hexlify(_value);
        assertArgument(parseInt(value.substring(0, 3)) < 8, "non-canonical s", "value", value);
        this.#s = value;
    }
    get v() {
        return this.#v;
    }
    set v(value) {
        const v = getNumber(value, "value");
        assertArgument(v === 27 || v === 28, "invalid v", "v", value);
        this.#v = v;
    }
    get networkV() {
        return this.#networkV;
    }
    get legacyChainId() {
        const v = this.networkV;
        if (v == null) {
            return null;
        }
        return Signature.getChainId(v);
    }
    get yParity() {
        return this.v === 27 ? 0 : 1;
    }
    get yParityAndS() {
        const yParityAndS = getBytes(this.s);
        if (this.yParity) {
            yParityAndS[0] |= 128;
        }
        return hexlify(yParityAndS);
    }
    get compactSerialized() {
        return concat([
            this.r,
            this.yParityAndS
        ]);
    }
    get serialized() {
        return concat([
            this.r,
            this.s,
            this.yParity ? "0x1c" : "0x1b"
        ]);
    }
    constructor(guard, r, s, v){
        assertPrivate(guard, _guard$3, "Signature");
        this.#r = r;
        this.#s = s;
        this.#v = v;
        this.#networkV = null;
    }
    [Symbol.for("nodejs.util.inspect.custom")]() {
        return `Signature { r: "${this.r}", s: "${this.s}", yParity: ${this.yParity}, networkV: ${this.networkV} }`;
    }
    clone() {
        const clone = new Signature(_guard$3, this.r, this.s, this.v);
        if (this.networkV) {
            clone.#networkV = this.networkV;
        }
        return clone;
    }
    toJSON() {
        const networkV = this.networkV;
        return {
            _type: "signature",
            networkV: networkV != null ? networkV.toString() : null,
            r: this.r,
            s: this.s,
            v: this.v
        };
    }
    static getChainId(v) {
        const bv = getBigInt(v, "v");
        if (bv == BN_27$1 || bv == BN_28$1) {
            return BN_0$7;
        }
        assertArgument(bv >= BN_35$1, "invalid EIP-155 v", "v", v);
        return (bv - BN_35$1) / BN_2$3;
    }
    static getChainIdV(chainId, v) {
        return getBigInt(chainId) * BN_2$3 + BigInt(35 + v - 27);
    }
    static getNormalizedV(v) {
        const bv = getBigInt(v);
        if (bv === BN_0$7 || bv === BN_27$1) {
            return 27;
        }
        if (bv === BN_1$3 || bv === BN_28$1) {
            return 28;
        }
        assertArgument(bv >= BN_35$1, "invalid v", "v", v);
        return bv & BN_1$3 ? 27 : 28;
    }
    static from(sig) {
        function assertError(check, message) {
            assertArgument(check, message, "signature", sig);
        }
        if (sig == null) {
            return new Signature(_guard$3, ZeroHash, ZeroHash, 27);
        }
        if (typeof sig === "string") {
            const bytes = getBytes(sig, "signature");
            if (bytes.length === 64) {
                const r = hexlify(bytes.slice(0, 32));
                const s = bytes.slice(32, 64);
                const v = s[0] & 128 ? 28 : 27;
                s[0] &= 127;
                return new Signature(_guard$3, r, hexlify(s), v);
            }
            if (bytes.length === 65) {
                const r1 = hexlify(bytes.slice(0, 32));
                const s1 = bytes.slice(32, 64);
                assertError((s1[0] & 128) === 0, "non-canonical s");
                const v1 = Signature.getNormalizedV(bytes[64]);
                return new Signature(_guard$3, r1, hexlify(s1), v1);
            }
            assertError(false, "invalid raw signature length");
        }
        if (sig instanceof Signature) {
            return sig.clone();
        }
        const _r = sig.r;
        assertError(_r != null, "missing r");
        const r2 = toUint256(_r);
        const s2 = function(s, yParityAndS) {
            if (s != null) {
                return toUint256(s);
            }
            if (yParityAndS != null) {
                assertError(isHexString(yParityAndS, 32), "invalid yParityAndS");
                const bytes = getBytes(yParityAndS);
                bytes[0] &= 127;
                return hexlify(bytes);
            }
            assertError(false, "missing s");
        }(sig.s, sig.yParityAndS);
        assertError((getBytes(s2)[0] & 128) == 0, "non-canonical s");
        const { networkV , v: v2  } = function(_v, yParityAndS, yParity) {
            if (_v != null) {
                const v = getBigInt(_v);
                return {
                    networkV: v >= BN_35$1 ? v : undefined,
                    v: Signature.getNormalizedV(v)
                };
            }
            if (yParityAndS != null) {
                assertError(isHexString(yParityAndS, 32), "invalid yParityAndS");
                return {
                    v: getBytes(yParityAndS)[0] & 128 ? 28 : 27
                };
            }
            if (yParity != null) {
                switch(getNumber(yParity, "sig.yParity")){
                    case 0:
                        return {
                            v: 27
                        };
                    case 1:
                        return {
                            v: 28
                        };
                }
                assertError(false, "invalid yParity");
            }
            assertError(false, "missing v");
        }(sig.v, sig.yParityAndS, sig.yParity);
        const result = new Signature(_guard$3, r2, s2, v2);
        if (networkV) {
            result.#networkV = networkV;
        }
        assertError(sig.yParity == null || getNumber(sig.yParity, "sig.yParity") === result.yParity, "yParity mismatch");
        assertError(sig.yParityAndS == null || sig.yParityAndS === result.yParityAndS, "yParityAndS mismatch");
        return result;
    }
}
class SigningKey {
    #privateKey;
    constructor(privateKey){
        assertArgument(dataLength(privateKey) === 32, "invalid private key", "privateKey", "[REDACTED]");
        this.#privateKey = hexlify(privateKey);
    }
    get privateKey() {
        return this.#privateKey;
    }
    get publicKey() {
        return SigningKey.computePublicKey(this.#privateKey);
    }
    get compressedPublicKey() {
        return SigningKey.computePublicKey(this.#privateKey, true);
    }
    sign(digest) {
        assertArgument(dataLength(digest) === 32, "invalid digest length", "digest", digest);
        const sig = secp256k1.sign(getBytesCopy(digest), getBytesCopy(this.#privateKey), {
            lowS: true
        });
        return Signature.from({
            r: toBeHex(sig.r, 32),
            s: toBeHex(sig.s, 32),
            v: sig.recovery ? 28 : 27
        });
    }
    computeSharedSecret(other) {
        const pubKey = SigningKey.computePublicKey(other);
        return hexlify(secp256k1.getSharedSecret(getBytesCopy(this.#privateKey), getBytes(pubKey), false));
    }
    static computePublicKey(key, compressed) {
        let bytes = getBytes(key, "key");
        if (bytes.length === 32) {
            const pubKey = secp256k1.getPublicKey(bytes, !!compressed);
            return hexlify(pubKey);
        }
        if (bytes.length === 64) {
            const pub = new Uint8Array(65);
            pub[0] = 4;
            pub.set(bytes, 1);
            bytes = pub;
        }
        const point = secp256k1.ProjectivePoint.fromHex(bytes);
        return hexlify(point.toRawBytes(compressed));
    }
    static recoverPublicKey(digest, signature) {
        assertArgument(dataLength(digest) === 32, "invalid digest length", "digest", digest);
        const sig = Signature.from(signature);
        let secpSig = secp256k1.Signature.fromCompact(getBytesCopy(concat([
            sig.r,
            sig.s
        ])));
        secpSig = secpSig.addRecoveryBit(sig.yParity);
        const pubKey = secpSig.recoverPublicKey(getBytesCopy(digest));
        assertArgument(pubKey != null, "invalid signautre for digest", "signature", signature);
        return "0x" + pubKey.toHex(false);
    }
    static addPoints(p0, p1, compressed) {
        const pub0 = secp256k1.ProjectivePoint.fromHex(SigningKey.computePublicKey(p0).substring(2));
        const pub1 = secp256k1.ProjectivePoint.fromHex(SigningKey.computePublicKey(p1).substring(2));
        return "0x" + pub0.add(pub1).toHex(!!compressed);
    }
}
function lock() {
    computeHmac.lock();
    keccak256.lock();
    pbkdf2.lock();
    randomBytes.lock();
    ripemd160.lock();
    scrypt.lock();
    scryptSync.lock();
    sha256.lock();
    sha512.lock();
    randomBytes.lock();
}
const BN_0$6 = BigInt(0);
const BN_36 = BigInt(36);
function getChecksumAddress(address) {
    address = address.toLowerCase();
    const chars = address.substring(2).split("");
    const expanded = new Uint8Array(40);
    for(let i = 0; i < 40; i++){
        expanded[i] = chars[i].charCodeAt(0);
    }
    const hashed = getBytes(keccak256(expanded));
    for(let i1 = 0; i1 < 40; i1 += 2){
        if (hashed[i1 >> 1] >> 4 >= 8) {
            chars[i1] = chars[i1].toUpperCase();
        }
        if ((hashed[i1 >> 1] & 15) >= 8) {
            chars[i1 + 1] = chars[i1 + 1].toUpperCase();
        }
    }
    return "0x" + chars.join("");
}
const ibanLookup = {};
for(let i1 = 0; i1 < 10; i1++){
    ibanLookup[String(i1)] = String(i1);
}
for(let i2 = 0; i2 < 26; i2++){
    ibanLookup[String.fromCharCode(65 + i2)] = String(10 + i2);
}
function ibanChecksum(address) {
    address = address.toUpperCase();
    address = address.substring(4) + address.substring(0, 2) + "00";
    let expanded = address.split("").map((c)=>{
        return ibanLookup[c];
    }).join("");
    while(expanded.length >= 15){
        let block = expanded.substring(0, 15);
        expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
    }
    let checksum = String(98 - parseInt(expanded, 10) % 97);
    while(checksum.length < 2){
        checksum = "0" + checksum;
    }
    return checksum;
}
const Base36 = function() {
    const result = {};
    for(let i = 0; i < 36; i++){
        const key = "0123456789abcdefghijklmnopqrstuvwxyz"[i];
        result[key] = BigInt(i);
    }
    return result;
}();
function fromBase36(value) {
    value = value.toLowerCase();
    let result = BN_0$6;
    for(let i = 0; i < value.length; i++){
        result = result * BN_36 + Base36[value[i]];
    }
    return result;
}
function getAddress(address) {
    assertArgument(typeof address === "string", "invalid address", "address", address);
    if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
        if (!address.startsWith("0x")) {
            address = "0x" + address;
        }
        const result = getChecksumAddress(address);
        assertArgument(!address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) || result === address, "bad address checksum", "address", address);
        return result;
    }
    if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
        assertArgument(address.substring(2, 4) === ibanChecksum(address), "bad icap checksum", "address", address);
        let result1 = fromBase36(address.substring(4)).toString(16);
        while(result1.length < 40){
            result1 = "0" + result1;
        }
        return getChecksumAddress("0x" + result1);
    }
    assertArgument(false, "invalid address", "address", address);
}
function getIcapAddress(address) {
    let base36 = BigInt(getAddress(address)).toString(36).toUpperCase();
    while(base36.length < 30){
        base36 = "0" + base36;
    }
    return "XE" + ibanChecksum("XE00" + base36) + base36;
}
function getCreateAddress(tx) {
    const from = getAddress(tx.from);
    const nonce = getBigInt(tx.nonce, "tx.nonce");
    let nonceHex = nonce.toString(16);
    if (nonceHex === "0") {
        nonceHex = "0x";
    } else if (nonceHex.length % 2) {
        nonceHex = "0x0" + nonceHex;
    } else {
        nonceHex = "0x" + nonceHex;
    }
    return getAddress(dataSlice(keccak256(encodeRlp([
        from,
        nonceHex
    ])), 12));
}
function getCreate2Address(_from, _salt, _initCodeHash) {
    const from = getAddress(_from);
    const salt = getBytes(_salt, "salt");
    const initCodeHash = getBytes(_initCodeHash, "initCodeHash");
    assertArgument(salt.length === 32, "salt must be 32 bytes", "salt", _salt);
    assertArgument(initCodeHash.length === 32, "initCodeHash must be 32 bytes", "initCodeHash", _initCodeHash);
    return getAddress(dataSlice(keccak256(concat([
        "0xff",
        from,
        salt,
        initCodeHash
    ])), 12));
}
function isAddressable(value) {
    return value && typeof value.getAddress === "function";
}
function isAddress(value) {
    try {
        getAddress(value);
        return true;
    } catch (error) {}
    return false;
}
async function checkAddress(target, promise) {
    const result = await promise;
    if (result == null || result === "0x0000000000000000000000000000000000000000") {
        assert1(typeof target !== "string", "unconfigured name", "UNCONFIGURED_NAME", {
            value: target
        });
        assertArgument(false, "invalid AddressLike value; did not resolve to a value address", "target", target);
    }
    return getAddress(result);
}
function resolveAddress(target, resolver) {
    if (typeof target === "string") {
        if (target.match(/^0x[0-9a-f]{40}$/i)) {
            return getAddress(target);
        }
        assert1(resolver != null, "ENS resolution requires a provider", "UNSUPPORTED_OPERATION", {
            operation: "resolveName"
        });
        return checkAddress(target, resolver.resolveName(target));
    } else if (isAddressable(target)) {
        return checkAddress(target, target.getAddress());
    } else if (target && typeof target.then === "function") {
        return checkAddress(target, target);
    }
    assertArgument(false, "unsupported addressable value", "target", target);
}
const _gaurd = {};
function n(value, width) {
    let signed = false;
    if (width < 0) {
        signed = true;
        width *= -1;
    }
    return new Typed(_gaurd, `${signed ? "" : "u"}int${width}`, value, {
        signed: signed,
        width: width
    });
}
function b(value, size) {
    return new Typed(_gaurd, `bytes${size ? size : ""}`, value, {
        size: size
    });
}
const _typedSymbol = Symbol.for("_ethers_typed");
class Typed {
    type;
    value;
    #options;
    _typedSymbol;
    constructor(gaurd, type, value, options){
        if (options == null) {
            options = null;
        }
        assertPrivate(_gaurd, gaurd, "Typed");
        defineProperties(this, {
            _typedSymbol: _typedSymbol,
            type: type,
            value: value
        });
        this.#options = options;
        this.format();
    }
    format() {
        if (this.type === "array") {
            throw new Error("");
        } else if (this.type === "dynamicArray") {
            throw new Error("");
        } else if (this.type === "tuple") {
            return `tuple(${this.value.map((v)=>v.format()).join(",")})`;
        }
        return this.type;
    }
    defaultValue() {
        return 0;
    }
    minValue() {
        return 0;
    }
    maxValue() {
        return 0;
    }
    isBigInt() {
        return !!this.type.match(/^u?int[0-9]+$/);
    }
    isData() {
        return this.type.startsWith("bytes");
    }
    isString() {
        return this.type === "string";
    }
    get tupleName() {
        if (this.type !== "tuple") {
            throw TypeError("not a tuple");
        }
        return this.#options;
    }
    get arrayLength() {
        if (this.type !== "array") {
            throw TypeError("not an array");
        }
        if (this.#options === true) {
            return -1;
        }
        if (this.#options === false) {
            return this.value.length;
        }
        return null;
    }
    static from(type, value) {
        return new Typed(_gaurd, type, value);
    }
    static uint8(v) {
        return n(v, 8);
    }
    static uint16(v) {
        return n(v, 16);
    }
    static uint24(v) {
        return n(v, 24);
    }
    static uint32(v) {
        return n(v, 32);
    }
    static uint40(v) {
        return n(v, 40);
    }
    static uint48(v) {
        return n(v, 48);
    }
    static uint56(v) {
        return n(v, 56);
    }
    static uint64(v) {
        return n(v, 64);
    }
    static uint72(v) {
        return n(v, 72);
    }
    static uint80(v) {
        return n(v, 80);
    }
    static uint88(v) {
        return n(v, 88);
    }
    static uint96(v) {
        return n(v, 96);
    }
    static uint104(v) {
        return n(v, 104);
    }
    static uint112(v) {
        return n(v, 112);
    }
    static uint120(v) {
        return n(v, 120);
    }
    static uint128(v) {
        return n(v, 128);
    }
    static uint136(v) {
        return n(v, 136);
    }
    static uint144(v) {
        return n(v, 144);
    }
    static uint152(v) {
        return n(v, 152);
    }
    static uint160(v) {
        return n(v, 160);
    }
    static uint168(v) {
        return n(v, 168);
    }
    static uint176(v) {
        return n(v, 176);
    }
    static uint184(v) {
        return n(v, 184);
    }
    static uint192(v) {
        return n(v, 192);
    }
    static uint200(v) {
        return n(v, 200);
    }
    static uint208(v) {
        return n(v, 208);
    }
    static uint216(v) {
        return n(v, 216);
    }
    static uint224(v) {
        return n(v, 224);
    }
    static uint232(v) {
        return n(v, 232);
    }
    static uint240(v) {
        return n(v, 240);
    }
    static uint248(v) {
        return n(v, 248);
    }
    static uint256(v) {
        return n(v, 256);
    }
    static uint(v) {
        return n(v, 256);
    }
    static int8(v) {
        return n(v, -8);
    }
    static int16(v) {
        return n(v, -16);
    }
    static int24(v) {
        return n(v, -24);
    }
    static int32(v) {
        return n(v, -32);
    }
    static int40(v) {
        return n(v, -40);
    }
    static int48(v) {
        return n(v, -48);
    }
    static int56(v) {
        return n(v, -56);
    }
    static int64(v) {
        return n(v, -64);
    }
    static int72(v) {
        return n(v, -72);
    }
    static int80(v) {
        return n(v, -80);
    }
    static int88(v) {
        return n(v, -88);
    }
    static int96(v) {
        return n(v, -96);
    }
    static int104(v) {
        return n(v, -104);
    }
    static int112(v) {
        return n(v, -112);
    }
    static int120(v) {
        return n(v, -120);
    }
    static int128(v) {
        return n(v, -128);
    }
    static int136(v) {
        return n(v, -136);
    }
    static int144(v) {
        return n(v, -144);
    }
    static int152(v) {
        return n(v, -152);
    }
    static int160(v) {
        return n(v, -160);
    }
    static int168(v) {
        return n(v, -168);
    }
    static int176(v) {
        return n(v, -176);
    }
    static int184(v) {
        return n(v, -184);
    }
    static int192(v) {
        return n(v, -192);
    }
    static int200(v) {
        return n(v, -200);
    }
    static int208(v) {
        return n(v, -208);
    }
    static int216(v) {
        return n(v, -216);
    }
    static int224(v) {
        return n(v, -224);
    }
    static int232(v) {
        return n(v, -232);
    }
    static int240(v) {
        return n(v, -240);
    }
    static int248(v) {
        return n(v, -248);
    }
    static int256(v) {
        return n(v, -256);
    }
    static int(v) {
        return n(v, -256);
    }
    static bytes1(v) {
        return b(v, 1);
    }
    static bytes2(v) {
        return b(v, 2);
    }
    static bytes3(v) {
        return b(v, 3);
    }
    static bytes4(v) {
        return b(v, 4);
    }
    static bytes5(v) {
        return b(v, 5);
    }
    static bytes6(v) {
        return b(v, 6);
    }
    static bytes7(v) {
        return b(v, 7);
    }
    static bytes8(v) {
        return b(v, 8);
    }
    static bytes9(v) {
        return b(v, 9);
    }
    static bytes10(v) {
        return b(v, 10);
    }
    static bytes11(v) {
        return b(v, 11);
    }
    static bytes12(v) {
        return b(v, 12);
    }
    static bytes13(v) {
        return b(v, 13);
    }
    static bytes14(v) {
        return b(v, 14);
    }
    static bytes15(v) {
        return b(v, 15);
    }
    static bytes16(v) {
        return b(v, 16);
    }
    static bytes17(v) {
        return b(v, 17);
    }
    static bytes18(v) {
        return b(v, 18);
    }
    static bytes19(v) {
        return b(v, 19);
    }
    static bytes20(v) {
        return b(v, 20);
    }
    static bytes21(v) {
        return b(v, 21);
    }
    static bytes22(v) {
        return b(v, 22);
    }
    static bytes23(v) {
        return b(v, 23);
    }
    static bytes24(v) {
        return b(v, 24);
    }
    static bytes25(v) {
        return b(v, 25);
    }
    static bytes26(v) {
        return b(v, 26);
    }
    static bytes27(v) {
        return b(v, 27);
    }
    static bytes28(v) {
        return b(v, 28);
    }
    static bytes29(v) {
        return b(v, 29);
    }
    static bytes30(v) {
        return b(v, 30);
    }
    static bytes31(v) {
        return b(v, 31);
    }
    static bytes32(v) {
        return b(v, 32);
    }
    static address(v) {
        return new Typed(_gaurd, "address", v);
    }
    static bool(v) {
        return new Typed(_gaurd, "bool", !!v);
    }
    static bytes(v) {
        return new Typed(_gaurd, "bytes", v);
    }
    static string(v) {
        return new Typed(_gaurd, "string", v);
    }
    static array(v, dynamic) {
        throw new Error("not implemented yet");
    }
    static tuple(v, name) {
        throw new Error("not implemented yet");
    }
    static overrides(v) {
        return new Typed(_gaurd, "overrides", Object.assign({}, v));
    }
    static isTyped(value) {
        return value && typeof value === "object" && "_typedSymbol" in value && value._typedSymbol === _typedSymbol;
    }
    static dereference(value, type) {
        if (Typed.isTyped(value)) {
            if (value.type !== type) {
                throw new Error(`invalid type: expecetd ${type}, got ${value.type}`);
            }
            return value.value;
        }
        return value;
    }
}
class AddressCoder extends Coder {
    constructor(localName){
        super("address", "address", localName, false);
    }
    defaultValue() {
        return "0x0000000000000000000000000000000000000000";
    }
    encode(writer, _value) {
        let value = Typed.dereference(_value, "string");
        try {
            value = getAddress(value);
        } catch (error) {
            return this._throwError(error.message, _value);
        }
        return writer.writeValue(value);
    }
    decode(reader) {
        return getAddress(toBeHex(reader.readValue(), 20));
    }
}
class AnonymousCoder extends Coder {
    coder;
    constructor(coder){
        super(coder.name, coder.type, "_", coder.dynamic);
        this.coder = coder;
    }
    defaultValue() {
        return this.coder.defaultValue();
    }
    encode(writer, value) {
        return this.coder.encode(writer, value);
    }
    decode(reader) {
        return this.coder.decode(reader);
    }
}
function pack(writer, coders, values) {
    let arrayValues = [];
    if (Array.isArray(values)) {
        arrayValues = values;
    } else if (values && typeof values === "object") {
        let unique = {};
        arrayValues = coders.map((coder)=>{
            const name = coder.localName;
            assert1(name, "cannot encode object for signature with missing names", "INVALID_ARGUMENT", {
                argument: "values",
                info: {
                    coder: coder
                },
                value: values
            });
            assert1(!unique[name], "cannot encode object for signature with duplicate names", "INVALID_ARGUMENT", {
                argument: "values",
                info: {
                    coder: coder
                },
                value: values
            });
            unique[name] = true;
            return values[name];
        });
    } else {
        assertArgument(false, "invalid tuple value", "tuple", values);
    }
    assertArgument(coders.length === arrayValues.length, "types/value length mismatch", "tuple", values);
    let staticWriter = new Writer;
    let dynamicWriter = new Writer;
    let updateFuncs = [];
    coders.forEach((coder, index)=>{
        let value = arrayValues[index];
        if (coder.dynamic) {
            let dynamicOffset = dynamicWriter.length;
            coder.encode(dynamicWriter, value);
            let updateFunc = staticWriter.writeUpdatableValue();
            updateFuncs.push((baseOffset)=>{
                updateFunc(baseOffset + dynamicOffset);
            });
        } else {
            coder.encode(staticWriter, value);
        }
    });
    updateFuncs.forEach((func)=>{
        func(staticWriter.length);
    });
    let length = writer.appendWriter(staticWriter);
    length += writer.appendWriter(dynamicWriter);
    return length;
}
function unpack(reader, coders) {
    let values = [];
    let keys = [];
    let baseReader = reader.subReader(0);
    coders.forEach((coder)=>{
        let value = null;
        if (coder.dynamic) {
            let offset = reader.readIndex();
            let offsetReader = baseReader.subReader(offset);
            try {
                value = coder.decode(offsetReader);
            } catch (error) {
                if (isError(error, "BUFFER_OVERRUN")) {
                    throw error;
                }
                value = error;
                value.baseType = coder.name;
                value.name = coder.localName;
                value.type = coder.type;
            }
        } else {
            try {
                value = coder.decode(reader);
            } catch (error1) {
                if (isError(error1, "BUFFER_OVERRUN")) {
                    throw error1;
                }
                value = error1;
                value.baseType = coder.name;
                value.name = coder.localName;
                value.type = coder.type;
            }
        }
        if (value == undefined) {
            throw new Error("investigate");
        }
        values.push(value);
        keys.push(coder.localName || null);
    });
    return Result.fromItems(values, keys);
}
class ArrayCoder extends Coder {
    coder;
    length;
    constructor(coder, length, localName){
        const type = coder.type + "[" + (length >= 0 ? length : "") + "]";
        const dynamic = length === -1 || coder.dynamic;
        super("array", type, localName, dynamic);
        defineProperties(this, {
            coder: coder,
            length: length
        });
    }
    defaultValue() {
        const defaultChild = this.coder.defaultValue();
        const result = [];
        for(let i = 0; i < this.length; i++){
            result.push(defaultChild);
        }
        return result;
    }
    encode(writer, _value) {
        const value = Typed.dereference(_value, "array");
        if (!Array.isArray(value)) {
            this._throwError("expected array value", value);
        }
        let count = this.length;
        if (count === -1) {
            count = value.length;
            writer.writeValue(value.length);
        }
        assertArgumentCount(value.length, count, "coder array" + (this.localName ? " " + this.localName : ""));
        let coders = [];
        for(let i = 0; i < value.length; i++){
            coders.push(this.coder);
        }
        return pack(writer, coders, value);
    }
    decode(reader) {
        let count = this.length;
        if (count === -1) {
            count = reader.readIndex();
            assert1(count * 32 <= reader.dataLength, "insufficient data length", "BUFFER_OVERRUN", {
                buffer: reader.bytes,
                offset: count * 32,
                length: reader.dataLength
            });
        }
        let coders = [];
        for(let i = 0; i < count; i++){
            coders.push(new AnonymousCoder(this.coder));
        }
        return unpack(reader, coders);
    }
}
class BooleanCoder extends Coder {
    constructor(localName){
        super("bool", "bool", localName, false);
    }
    defaultValue() {
        return false;
    }
    encode(writer, _value) {
        const value = Typed.dereference(_value, "bool");
        return writer.writeValue(value ? 1 : 0);
    }
    decode(reader) {
        return !!reader.readValue();
    }
}
class DynamicBytesCoder extends Coder {
    constructor(type, localName){
        super(type, type, localName, true);
    }
    defaultValue() {
        return "0x";
    }
    encode(writer, value) {
        value = getBytesCopy(value);
        let length = writer.writeValue(value.length);
        length += writer.writeBytes(value);
        return length;
    }
    decode(reader) {
        return reader.readBytes(reader.readIndex(), true);
    }
}
class BytesCoder extends DynamicBytesCoder {
    constructor(localName){
        super("bytes", localName);
    }
    decode(reader) {
        return hexlify(super.decode(reader));
    }
}
class FixedBytesCoder extends Coder {
    size;
    constructor(size, localName){
        let name = "bytes" + String(size);
        super(name, name, localName, false);
        defineProperties(this, {
            size: size
        }, {
            size: "number"
        });
    }
    defaultValue() {
        return "0x0000000000000000000000000000000000000000000000000000000000000000".substring(0, 2 + this.size * 2);
    }
    encode(writer, _value) {
        let data = getBytesCopy(Typed.dereference(_value, this.type));
        if (data.length !== this.size) {
            this._throwError("incorrect data length", _value);
        }
        return writer.writeBytes(data);
    }
    decode(reader) {
        return hexlify(reader.readBytes(this.size));
    }
}
const Empty = new Uint8Array([]);
class NullCoder extends Coder {
    constructor(localName){
        super("null", "", localName, false);
    }
    defaultValue() {
        return null;
    }
    encode(writer, value) {
        if (value != null) {
            this._throwError("not null", value);
        }
        return writer.writeBytes(Empty);
    }
    decode(reader) {
        reader.readBytes(0);
        return null;
    }
}
const BN_0$5 = BigInt(0);
const BN_1$2 = BigInt(1);
const BN_MAX_UINT256$1 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
class NumberCoder extends Coder {
    size;
    signed;
    constructor(size, signed, localName){
        const name = (signed ? "int" : "uint") + size * 8;
        super(name, name, localName, false);
        defineProperties(this, {
            size: size,
            signed: signed
        }, {
            size: "number",
            signed: "boolean"
        });
    }
    defaultValue() {
        return 0;
    }
    encode(writer, _value) {
        let value = getBigInt(Typed.dereference(_value, this.type));
        let maxUintValue = mask(BN_MAX_UINT256$1, 32 * 8);
        if (this.signed) {
            let bounds = mask(maxUintValue, this.size * 8 - 1);
            if (value > bounds || value < -(bounds + BN_1$2)) {
                this._throwError("value out-of-bounds", _value);
            }
            value = toTwos(value, 8 * WordSize);
        } else if (value < BN_0$5 || value > mask(maxUintValue, this.size * 8)) {
            this._throwError("value out-of-bounds", _value);
        }
        return writer.writeValue(value);
    }
    decode(reader) {
        let value = mask(reader.readValue(), this.size * 8);
        if (this.signed) {
            value = fromTwos(value, this.size * 8);
        }
        return value;
    }
}
class StringCoder extends DynamicBytesCoder {
    constructor(localName){
        super("string", localName);
    }
    defaultValue() {
        return "";
    }
    encode(writer, _value) {
        return super.encode(writer, toUtf8Bytes(Typed.dereference(_value, "string")));
    }
    decode(reader) {
        return toUtf8String(super.decode(reader));
    }
}
class TupleCoder extends Coder {
    coders;
    constructor(coders, localName){
        let dynamic = false;
        const types = [];
        coders.forEach((coder)=>{
            if (coder.dynamic) {
                dynamic = true;
            }
            types.push(coder.type);
        });
        const type = "tuple(" + types.join(",") + ")";
        super("tuple", type, localName, dynamic);
        defineProperties(this, {
            coders: Object.freeze(coders.slice())
        });
    }
    defaultValue() {
        const values = [];
        this.coders.forEach((coder)=>{
            values.push(coder.defaultValue());
        });
        const uniqueNames = this.coders.reduce((accum, coder)=>{
            const name = coder.localName;
            if (name) {
                if (!accum[name]) {
                    accum[name] = 0;
                }
                accum[name]++;
            }
            return accum;
        }, {});
        this.coders.forEach((coder, index)=>{
            let name = coder.localName;
            if (!name || uniqueNames[name] !== 1) {
                return;
            }
            if (name === "length") {
                name = "_length";
            }
            if (values[name] != null) {
                return;
            }
            values[name] = values[index];
        });
        return Object.freeze(values);
    }
    encode(writer, _value) {
        const value = Typed.dereference(_value, "tuple");
        return pack(writer, this.coders, value);
    }
    decode(reader) {
        return unpack(reader, this.coders);
    }
}
function id(value) {
    return keccak256(toUtf8Bytes(value));
}
var COMPRESSED$1 = "AEEUdwmgDS8BxQKKAP4BOgDjATAAngDUAIMAoABoAOAAagCOAEQAhABMAHIAOwA9ACsANgAmAGIAHgAuACgAJwAXAC0AGgAjAB8ALwAUACkAEgAeAAkAGwARABkAFgA5ACgALQArADcAFQApABAAHgAiABAAGgAeABMAGAUhBe8BFxREN8sF2wC5AK5HAW8ArQkDzQCuhzc3NzcBP68NEfMABQdHBuw5BV8FYAA9MzkI9r4ZBg7QyQAWA9CeOwLNCjcCjqkChuA/lm+RAsXTAoP6ASfnEQDytQFJAjWVCkeXAOsA6godAB/cwdAUE0WlBCN/AQUCQRjFD/MRBjHxDQSJbw0jBzUAswBxme+tnIcAYwabAysG8QAjAEMMmxcDqgPKQyDXCMMxA7kUQwD3NXOrAKmFIAAfBC0D3x4BJQDBGdUFAhEgVD8JnwmQJiNWYUzrg0oAGwAUAB0AFnNcACkAFgBP9h3gPfsDOWDKneY2ChglX1UDYD30ABsAFAAdABZzIGRAnwDD8wAjAEEMzRbDqgMB2sAFYwXqAtCnAsS4AwpUJKRtFHsadUz9AMMVbwLpABM1NJEX0ZkCgYMBEyMAxRVvAukAEzUBUFAtmUwSAy4DBTER33EftQHfSwB5MxJ/AjkWKQLzL8E/cwBB6QH9LQDPDtO9ASNriQC5DQANAwCK21EFI91zHwCoL9kBqQcHBwcHKzUDowBvAQohPvU3fAQgHwCyAc8CKQMA5zMSezr7ULgFmDp/LzVQBgEGAi8FYQVgt8AFcTtlQhpCWEmfe5tmZ6IAExsDzQ8t+X8rBKtTAltbAn0jsy8Bl6utPWMDTR8Ei2kRANkDBrNHNysDBzECQWUAcwFpJ3kAiyUhAJ0BUb8AL3EfAbfNAz81KUsFWwF3YQZtAm0A+VEfAzEJDQBRSQCzAQBlAHsAM70GD/v3IZWHBwARKQAxALsjTwHZAeMPEzmXgIHwABIAGQA8AEUAQDt3gdvIEGcQZAkGTRFMdEIVEwK0D64L7REdDNkq09PgADSxB/MDWwfzA1sDWwfzB/MDWwfzA1sDWwNbA1scEvAi28gQZw9QBHUFlgWTBN4IiyZREYkHMAjaVBV0JhxPA00BBCMtSSQ7mzMTJUpMFE0LCAQ2SmyvfUADTzGzVP2QqgPTMlc5dAkGHnkSqAAyD3skNb1OhnpPcagKU0+2tYdJak5vAsY6sEAACikJm2/Dd1YGRRAfJ6kQ+ww3AbkBPw3xS9wE9QY/BM0fgRkdD9GVoAipLeEM8SbnLqWAXiP5KocF8Uv4POELUVFsD10LaQnnOmeBUgMlAREijwrhDT0IcRD3Cs1vDekRSQc9A9lJngCpBwULFR05FbkmFGKwCw05ewb/GvoLkyazEy17AAXXGiUGUQEtGwMA0y7rhbRaNVwgT2MGBwspI8sUrFAkDSlAu3hMGh8HGSWtApVDdEqLUToelyH6PEENai4XUYAH+TwJGVMLhTyiRq9FEhHWPpE9TCJNTDAEOYMsMyePCdMPiQy9fHYBXQklCbUMdRM1ERs3yQg9Bx0xlygnGQglRplgngT7owP3E9UDDwVDCUUHFwO5HDETMhUtBRGBKNsC9zbZLrcCk1aEARsFzw8pH+MQVEfkDu0InwJpA4cl7wAxFSUAGyKfCEdnAGOP3FMJLs8Iy2pwI3gDaxTrZRF3B5UOWwerHDcVwxzlcMxeD4YMKKezCV8BeQmdAWME5wgNNV+MpCBFZ1eLXBifIGVBQ14AAjUMaRWjRMGHfAKPD28SHwE5AXcHPQ0FAnsR8RFvEJkI74YINbkz/DopBFMhhyAVCisDU2zSCysm/Qz8bQGnEmYDEDRBd/Jnr2C6KBgBBx0yyUFkIfULlk/RDKAaxRhGVDIZ6AfDA/ca9yfuQVsGAwOnBxc6UTPyBMELbQiPCUMATQ6nGwfbGG4KdYzUATWPAbudA1uVhwJzkwY7Bw8Aaw+LBX3pACECqwinAAkA0wNbAD0CsQehAB0AiUUBQQMrMwEl6QKTA5cINc8BmTMB9y0EH8cMGQD7O25OAsO1AoBuZqYF4VwCkgJNOQFRKQQJUktVA7N15QDfAE8GF+NLARmvTs8e50cB43MvAMsA/wAJOQcJRQHRAfdxALsBYws1Caa3uQFR7S0AhwAZbwHbAo0A4QA5AIP1AVcAUQVd/QXXAlNNARU1HC9bZQG/AyMBNwERAH0Gz5GpzQsjBHEH1wIQHxXlAu8yB7kFAyLjE9FCyQK94lkAMhoKPAqrCqpgX2Q3CjV2PVQAEh+sPss/UgVVO1c7XDtXO1w7VztcO1c7XDtXO1wDm8Pmw+YKcF9JYe8Mqg3YRMw6TRPfYFVgNhPMLbsUxRXSJVoZQRrAJwkl6FUNDwgt12Y0CDA0eRfAAEMpbINFY4oeNApPHOtTlVT8LR8AtUumM7MNsBsZREQFS3XxYi4WEgomAmSFAmJGX1GzAV83JAKh+wJonAJmDQKfiDgfDwJmPwJmKgRyBIMDfxcDfpY5Cjl7GzmGOicnAmwhAjI6OA4CbcsCbbLzjgM3a0kvAWsA4gDlAE4JB5wMkQECD8YAEbkCdzMCdqZDAnlPRwJ4viFg30WyRvcCfEMCeswCfQ0CfPRIBEiBZygALxlJXEpfGRtK0ALRBQLQ0EsrA4hTA4fqRMmRNgLypV0HAwOyS9JMMSkH001QTbMCi0MCitzFHwshR2sJuwKOOwKOYESbhQKO3QKOYHxRuFM5AQ5S2FSJApP/ApMQAO0AIFUiVbNV1AosHymZijLleGpFPz0Cl6MC77ZYJawAXSkClpMCloCgAK1ZsFoNhVEAPwKWuQKWUlxIXNUCmc8CmWhczl0LHQKcnznGOqECnBoCn58CnryOACETNS4TAp31Ap6WALlBYThh8wKe1wKgcgGtAp6jIwKeUqljzGQrKS8CJ7MCJoICoP8CoFDbAqYzAqXSAqgDAIECp/ZogGi1AAdNaiBq1QKs5wKssgKtawKtBgJXIQJV4AKx5dsDH1JsmwKywRECsuwbbORtZ21MYwMl0QK2YD9DbpQDKUkCuGICuUsZArkue3A6cOUCvR0DLbYDMhUCvoxyBgMzdQK+HnMmc1MCw88CwwhzhnRPOUl05AM8qwEDPJ4DPcMCxYACxksCxhSNAshtVQLISALJUwLJMgJkoQLd1nh9ZXiyeSlL1AMYp2cGAmH4GfeVKHsPXpZevxUCz28Cz3AzT1fW9xejAMqxAs93AS3uA04Wfk8JAtwrAtuOAtJTA1JgA1NjAQUDVZCAjUMEzxrxZEl5A4LSg5EC2ssC2eKEFIRNp0ADhqkAMwNkEoZ1Xf0AWQLfaQLevHd7AuIz7RgB8zQrAfSfAfLWiwLr9wLpdH0DAur9AuroAP1LAb0C7o0C66CWrpcHAu5DA4XkmH1w5HGlAvMHAG0DjhqZlwL3FwORcgOSiwL3nAL53QL4apogmq+/O5siA52HAv7+AR8APZ8gAZ+3AwWRA6ZuA6bdANXJAwZuoYyiCQ0DDE0BEwEjB3EGZb1rCQC/BG/DFY8etxEAG3k9ACcDNxJRA42DAWcrJQCM8wAlAOanC6OVCLsGI6fJBgCvBRnDBvElRUYFFoAFcD9GSDNCKUK8X3kZX8QAls0FOgCQVCGbwTsuYDoZutcONxjOGJHJ/gVfBWAFXwVgBWsFYAVfBWAFXwVgBV8FYAVfBWBOHQjfjW8KCgoKbF7xMwTRA7kGN8PDAMMEr8MA70gxFroFTj5xPnhCR0K+X30/X/AAWBkzswCNBsxzzASm70aCRS4rDDMeLz49fnXfcsH5GcoscQFz13Y4HwVnBXLJycnACNdRYwgICAqEXoWTxgA7P4kACxbZBu21Kw0AjMsTAwkVAOVtJUUsJ1JCuULESUArXy9gPi9AKwnJRQYKTD9LPoA+iT54PnkCkULEUUpDX9NWV3JVEjQAc1w3A3IBE3YnX+g7QiMJb6MKaiszRCUuQrNCxDPMCcwEX9EWJzYREBEEBwIHKn6l33JCNVIfybPJtAltydPUCmhBZw/tEKsZAJOVJU1CLRuxbUHOQAo7P0s+eEJHHA8SJVRPdGM0NVrpvBoKhfUlM0JHHGUQUhEWO1xLSj8MO0ucNAqJIzVCRxv9EFsqKyA4OQgNj2nwZgp5ZNFgE2A1K3YHS2AhQQojJmC7DgpzGG1WYFUZCQYHZO9gHWCdYIVgu2BTYJlwFh8GvRbcXbG8YgtDHrMBwzPVyQonHQgkCyYBgQJ0Ajc4nVqIAwGSCsBPIgDsK3SWEtIVBa5N8gGjAo+kVwVIZwD/AEUSCDweX4ITrRQsJ8K3TwBXFDwEAB0TvzVcAtoTS20RIwDgVgZ9BBImYgA5AL4Coi8LFnezOkCnIQFjAY4KBAPh9RcGsgZSBsEAJctdsWIRu2kTkQstRw7DAcMBKgpPBGIGMDAwKCYnKTQaLg4AKRSVAFwCdl+YUZ0JdicFD3lPAdt1F9ZZKCGxuE3yBxkFVGcA/wBFEgiCBwAOLHQSjxOtQDg1z7deFRMAZ8QTAGtKb1ApIiPHADkAvgKiLy1DFtYCmBiDAlDDWNB0eo7fpaMO/aEVRRv0ATEQZBIODyMEAc8JQhCbDRgzFD4TAEMAu9YBCgCsAOkAm5I3ABwAYxvONnR+MhXJAxgKQyxL2+kkJhMbhQKDBMkSsvF0AD9BNQ6uQC7WqSQHwxEAEEIu1hkhAH2z4iQPwyJPHNWpdyYBRSpnJALzoBAEVPPsH20MxA0CCEQKRgAFyAtFAlMNwwjEDUQJRArELtapMg7DDZgJIw+TGukEIwvDFkMAqAtDEMMMBhioe+QAO3MMRAACrgnEBSPY9Q0FDnbSBoMAB8MSYxkSxAEJAPIJAAB8FWMOFtMc/HcXwxhDAC7DAvOowwAewwJdKDKHAAHDAALrFUQVwwAbwyvzpWMWv8wA/ABpAy++bcYDUKPD0KhDCwKmJ1MAAmMA5+UZwxAagwipBRL/eADfw6fDGOMCGsOjk3l6BwOpo4sAEsMOGxMAA5sAbcMOAAvDp0MJGkMDwgipnNIPAwfIqUMGAOGDAAPzABXDAAcDAAnDAGmTABrDAA7DChjDjnEWAwABYwAOcwAuUyYABsMAF8MIKQANUgC6wy4AA8MADqMq8wCyYgAcIwAB8wqpAAXOCx0V4wAHowBCwwEKAGnDAAuDAB3DAAjDCakABdIAbqcZ3QCZCCkABdIAAAFDAAfjAB2jCCkABqIACYMAGzMAbSMA5sOIAAhjAAhDABTDBAkpAAbSAOOTAAlDC6kOzPtnAAdDAG6kQFAATwAKwwwAA0MACbUDPwAHIwAZgwACE6cDAAojAApDAAoDp/MGwwAJIwADEwAQQwgAFEMAEXMAD5MADfMADcMAGRMOFiMAFUMAbqMWuwHDAMIAE0MLAGkzEgDhUwACQwAEWgAXgwUjAAbYABjDBSYBgzBaAEFNALcQBxUMegAwMngBrA0IZgJ0KxQHBREPd1N0ZzKRJwaIHAZqNT4DqQq8BwngAB4DAwt2AX56T1ocKQNXAh1GATQGC3tOxYNagkgAMQA5CQADAQEAWxLjAIOYNAEzAH7tFRk6TglSAF8NAAlYAQ+S1ACAQwQorQBiAN4dAJ1wPyeTANVzuQDX3AIeEMp9eyMgXiUAEdkBkJizKltbVVAaRMqRAAEAhyQ/SDEz6BmfVwB6ATEsOClKIRcDOF0E/832AFNt5AByAnkCRxGCOs94NjXdAwINGBonDBwPALW2AwICAgAAAAAAAAYDBQMDARrUAwAtAAAAAgEGBgYGBgYFBQUFBQUEBQYHCAkEBQUFBQQAAAICAAAAIgCNAJAAlT0A6gC7ANwApEQAwgCyAK0AqADuAKYA2gCjAOcBCAEDAMcAgQBiANIA1AEDAN4A8gCQAKkBMQDqAN8A3AsBCQ8yO9ra2tq8xuLT1tRJOB0BUgFcNU0BWgFpAWgBWwFMUUlLbhMBUxsNEAs6PhMOACcUKy0vMj5AQENDQ0RFFEYGJFdXV1dZWVhZL1pbXVxcI2NnZ2ZoZypsbnZ1eHh4eHh4enp6enp6enp6enp8fH18e2IARPIASQCaAHgAMgBm+ACOAFcAVwA3AnbvAIsABfj4AGQAk/IAnwBPAGIAZP//sACFAIUAaQBWALEAJAC2AIMCQAJDAPwA5wD+AP4A6AD/AOkA6QDoAOYALwJ7AVEBQAE+AVQBPgE+AT4BOQE4ATgBOAEcAVgXADEQCAEAUx8SHgsdHhYAjgCWAKYAUQBqIAIxAHYAbwCXAxUDJzIDIUlGTzEAkQJPAMcCVwKkAMAClgKWApYClgKWApYCiwKWApYClgKWApYClgKVApUCmAKgApcClgKWApQClAKUApQCkgKVAnUB1AKXAp8ClgKWApUeAIETBQD+DQOfAmECOh8BVBg9AuIZEjMbAU4/G1WZAXusRAFpYQEFA0FPAQYAmTEeIJdyADFoAHEANgCRA5zMk/C2jGINwjMWygIZCaXdfDILBCs5dAE7YnQBugDlhoiHhoiGiYqKhouOjIaNkI6Ij4qQipGGkoaThpSSlYaWhpeKmIaZhpqGm4aci52QnoqfhuIC4XTpAt90AIp0LHSoAIsAdHQEQwRABEIERQRDBEkERgRBBEcESQRIBEQERgRJAJ5udACrA490ALxuAQ10ANFZdHQA13QCFHQA/mJ0AP4BIQD+APwA/AD9APwDhGZ03ASMK23HAP4A/AD8AP0A/CR0dACRYnQA/gCRASEA/gCRAvQA/gCRA4RmdNwEjCttxyR0AP9idAEhAP4A/gD8APwA/QD8AP8A/AD8AP0A/AOEZnTcBIwrbcckdHQAkWJ0ASEA/gCRAP4AkQL0AP4AkQOEZnTcBIwrbcckdAJLAT50AlIBQXQCU8l0dAJfdHQDpgL0A6YDpgOnA6cDpwOnA4RmdNwEjCttxyR0dACRYnQBIQOmAJEDpgCRAvQDpgCRA4RmdNwEjCttxyR0BDh0AJEEOQCRDpU5dSgCADR03gV2CwArdAEFAM5iCnR0AF1iAAYcOgp0dACRCnQAXAEIwWZ0CnRmdHQAkWZ0CnRmdEXgAFF03gp0dEY0tlT2u3SOAQTwscwhjZZKrhYcBSfFp9XNbKiVDOD2b+cpe4/Z17mQnbtzzhaeQtE2GGj0IDNTjRUSyTxxw/RPHW/+vS7d1NfRt9z9QPZg4X7QFfhCnkvgNPIItOsC2eV6hPannZNHlZ9xrwZXIMOlu3jSoQSq78WEjwLjw1ELSlF1aBvfzwk5ZX7AUvQzjPQKbDuQ+sm4wNOp4A6AdVuRS0t1y/DZpg4R6m7FNjM9HgvW7Bi88zaMjOo6lM8wtBBdj8LP4ylv3zCXPhebMKJc066o9sF71oFW/8JXu86HJbwDID5lzw5GWLR/LhT0Qqnp2JQxNZNfcbLIzPy+YypqRm/lBmGmex+82+PisxUumSeJkALIT6rJezxMH+CTJmQtt5uwTVbL3ptmjDUQzlSIvWi8Tl7ng1NpuRn1Ng4n14Qc+3Iil7OwkvNWogLSPkn3pihIFytyIGmMhOe3n1tWsuMy9BdKyqF4Z3v2SgggTL9KVvMXPnCbRe+oOuFFP3HejBG/w9gvmfNYvg6JuWia2lcSSN1uIjBktzoIazOHPJZ7kKHPz8mRWVdW3lA8WGF9dQF6Bm673boov3BUWDU2JNcahR23GtfHKLOz/viZ+rYnZFaIznXO67CYEJ1fXuTRpZhYZkKe54xeoagkNGLs+NTZHE0rX45/XvQ2RGADX6vcAvdxIUBV27wxGm2zjZo4X3ILgAlrOFheuZ6wtsvaIj4yLY7qqawlliaIcrz2G+c3vscAnCkCuMzMmZvMfu9lLwTvfX+3cVSyPdN9ZwgDZhfjRgNJcLiJ67b9xx8JHswprbiE3v9UphotAPIgnXVIN5KmMc0piXhc6cChPnN+MRhG9adtdttQTTwSIpl8I4/j//d3sz1326qTBTpPRM/Hgh3kzqEXs8ZAk4ErQhNO8hzrQ0DLkWMA/N+91tn2MdOJnWC2FCZehkQrwzwbKOjhvZsbM95QoeL9skYyMf4srVPVJSgg7pOLUtr/n9eT99oe9nLtFRpjA9okV2Kj8h9k5HaC0oivRD8VyXkJ81tcd4fHNXPCfloIQasxsuO18/46dR2jgul/UIet2G0kRvnyONMKhHs6J26FEoqSqd+rfYjeEGwHWVDpX1fh1jBBcKGMqRepju9Y00mDVHC+Xdij/j44rKfvfjGinNs1jO/0F3jB83XCDINN/HB84axlP+3E/klktRo+vl3U/aiyMJbIodE1XSsDn6UAzIoMtUObY2+k/4gY/l+AkZJ5Sj2vQrkyLm3FoxjhDX+31UXBFf9XrAH31fFqoBmDEZvhvvpnZ87N+oZEu7U9O/nnk+QWj3x8uyoRbEnf+O5UMr9i0nHP38IF5AvzrBW8YWBUR0mIAzIvndQq9N3v/Jto3aPjPXUPl8ASdPPyAp7jENf8bk7VMM9ol9XGmlBmeDMuGqt+WzuL6CXAxXjIhCPM5vACchgMJ/8XBGLO/D1isVvGhwwHHr1DLaI5mn2Jr/b1pUD90uciDaS8cXNDzCWvNmT/PhQe5e8nTnnnkt8Ds/SIjibcum/fqDhKopxAY8AkSrPn+IGDEKOO+U3XOP6djFs2H5N9+orhOahiQk5KnEUWa+CzkVzhp8bMHRbg81qhjjXuIKbHjSLSIBKWqockGtKinY+z4/RdBUF6pcc3JmnlxVcNgrI4SEzKUZSwcD2QCyxzKve+gAmg6ZuSRkpPFa6mfThu7LJNu3H5K42uCpNvPAsoedolKV/LHe/eJ+BbaG5MG0NaSGVPRUmNFMFFSSpXEcXwbVh7UETOZZtoVNRGOIbbkig3McEtR68cG0RZAoJevWYo7Dg/lZ1CQzblWeUvVHmr8fY4Nqd9JJiH/zEX24mJviH60fAyFr0A3c4bC1j3yZU60VgJxXn8JgJXLUIsiBnmKmMYz+7yBQFBvqb2eYnuW59joZBf56/wXvWIR4R8wTmV80i1mZy+S4+BUES+hzjk0uXpC///z/IlqHZ1monzlXp8aCfhGKMti73FI1KbL1q6IKO4fuBuZ59gagjn5xU79muMpHXg6S+e+gDM/U9BKLHbl9l6o8czQKl4RUkJJiqftQG2i3BMg/TQlUYFkJDYBOOvAugYuzYSDnZbDDd/aSd9x0Oe6F+bJcHfl9+gp6L5/TgA+BdFFovbfCrQ40s5vMPw8866pNX8zyFGeFWdxIpPVp9Rg1UPOVFbFZrvaFq/YAzHQgqMWpahMYfqHpmwXfHL1/kpYmGuHFwT55mQu0dylfNuq2Oq0hTMCPwqfxnuBIPLXfci4Y1ANy+1CUipQxld/izVh16WyG2Q0CQQ9NqtAnx1HCHwDj7sYxOSB0wopZSnOzxQOcExmxrVTF2BkOthVpGfuhaGECfCJpJKpjnihY+xOT2QJxN61+9K6QSqtv2Shr82I3jgJrqBg0wELFZPjvHpvzTtaJnLK6Vb97Yn933koO/saN7fsjwNKzp4l2lJVx2orjCGzC/4ZL4zCver6aQYtC5sdoychuFE6ufOiog+VWi5UDkbmvmtah/3aArEBIi39s5ILUnlFLgilcGuz9CQshEY7fw2ouoILAYPVT/gyAIq3TFAIwVsl+ktkRz/qGfnCDGrm5gsl/l9QdvCWGsjPz3dU7XuqKfdUrr/6XIgjp4rey6AJBmCmUJMjITHVdFb5m1p+dLMCL8t55zD42cmftmLEJC0Da04YiRCVUBLLa8D071/N5UBNBXDh0LFsmhV/5B5ExOB4j3WVG/S3lfK5o+V6ELHvy6RR9n4ac+VsK4VE4yphPvV+kG9FegTBH4ZRXL2HytUHCduJazB/KykjfetYxOXTLws267aGOd+I+JhKP//+VnXmS90OD/jvLcVu0asyqcuYN1mSb6XTlCkqv1vigZPIYwNF/zpWcT1GR/6aEIRjkh0yhg4LXJfaGobYJTY4JI58KiAKgmmgAKWdl5nYCeLqavRJGQNuYuZtZFGx+IkI4w4NS2xwbetNMunOjBu/hmKCI/w7tfiiyUd//4rbTeWt4izBY8YvGIN6vyKYmP/8X8wHKCeN+WRcKM70+tXKNGyevU9H2Dg5BsljnTf8YbsJ1TmMs74Ce2XlHisleguhyeg44rQOHZuw/6HTkhnnurK2d62q6yS7210SsAIaR+jXMQA+svkrLpsUY+F30Uw89uOdGAR6vo4FIME0EfVVeHTu6eKicfhSqOeXJhbftcd08sWEnNUL1C9fnprTgd83IMut8onVUF0hvqzZfHduPjbjwEXIcoYmy+P6tcJZHmeOv6VrvEdkHDJecjHuHeWANe79VG662qTjA/HCvumVv3qL+LrOcpqGps2ZGwQdFJ7PU4iuyRlBrwfO+xnPyr47s2cXVbWzAyznDiBGjCM3ksxjjqM62GE9C8f5U38kB3VjtabKp/nRdvMESPGDG90bWRLAt1Qk5DyLuazRR1YzdC1c+hZXvAWV8xA72S4A8B67vjVhbba3MMop293FeEXpe7zItMWrJG/LOH9ByOXmYnNJfjmfuX9KbrpgLOba4nZ+fl8Gbdv/ihv+6wFGKHCYrVwmhFC0J3V2bn2tIB1wCc1CST3d3X2OyxhguXcs4sm679UngzofuSeBewMFJboIQHbUh/m2JhW2hG9DIvG2t7yZIzKBTz9wBtnNC+2pCRYhSIuQ1j8xsz5VvqnyUIthvuoyyu7fNIrg/KQUVmGQaqkqZk/Vx5b33/gsEs8yX7SC1J+NV4icz6bvIE7C5G6McBaI8rVg56q5QBJWxn/87Q1sPK4+sQa8fLU5gXo4paaq4cOcQ4wR0VBHPGjKh+UlPCbA1nLXyEUX45qZ8J7/Ln4FPJE2TdzD0Z8MLSNQiykMMmSyOCiFfy84Rq60emYB2vD09KjYwsoIpeDcBDTElBbXxND72yhd9pC/1CMid/5HUMvAL27OtcIJDzNKpRPNqPOpyt2aPGz9QWIs9hQ9LiX5s8m9hjTUu/f7MyIatjjd+tSfQ3ufZxPpmJhTaBtZtKLUcfOCUqADuO+QoH8B9v6U+P0HV1GLQmtoNFTb3s74ivZgjES0qfK+8RdGgBbcCMSy8eBvh98+et1KIFqSe1KQPyXULBMTsIYnysIwiZBJYdI20vseV+wuJkcqGemehKjaAb9L57xZm3g2zX0bZ2xk/fU+bCo7TlnbW7JuF1YdURo/2Gw7VclDG1W7LOtas2LX4upifZ/23rzpsnY/ALfRgrcWP5hYmV9VxVOQA1fZvp9F2UNU+7d7xRyVm5wiLp3/0dlV7vdw1PMiZrbDAYzIVqEjRY2YU03sJhPnlwIPcZUG5ltL6S8XCxU1eYS5cjr34veBmXAvy7yN4ZjArIG0dfD/5UpBNlX1ZPoxJOwyqRi3wQWtOzd4oNKh0LkoTm8cwqgIfKhqqGOhwo71I+zXnMemTv2B2AUzABWyFztGgGULjDDzWYwJUVBTjKCn5K2QGMK1CQT7SzziOjo+BhAmqBjzuc3xYym2eedGeOIRJVyTwDw37iCMe4g5Vbnsb5ZBdxOAnMT7HU4DHpxWGuQ7GeiY30Cpbvzss55+5Km1YsbD5ea3NI9QNYIXol5apgSu9dZ8f8xS5dtHpido5BclDuLWY4lhik0tbJa07yJhH0BOyEut/GRbYTS6RfiTYWGMCkNpfSHi7HvdiTglEVHKZXaVhezH4kkXiIvKopYAlPusftpE4a5IZwvw1x/eLvoDIh/zpo9FiQInsTb2SAkKHV42XYBjpJDg4374XiVb3ws4qM0s9eSQ5HzsMU4OZJKuopFjBM+dAZEl8RUMx5uU2N486Kr141tVsGQfGjORYMCJAMsxELeNT4RmWjRcpdTGBwcx6XN9drWqPmJzcrGrH4+DRc7+n1w3kPZwu0BkNr6hQrqgo7JTB9A5kdJ/H7P4cWBMwsmuixAzJB3yrQpnGIq90lxAXLzDCdn1LPibsRt7rHNjgQBklRgPZ8vTbjXdgXrTWQsK5MdrXXQVPp0Rinq3frzZKJ0qD6Qhc40VzAraUXlob1gvkhK3vpmHgI6FRlQZNx6eRqkp0zy4AQlX813fAPtL3jMRaitGFFjo0zmErloC+h+YYdVQ6k4F/epxAoF0BmqEoKNTt6j4vQZNQ2BoqF9Vj53TOIoNmDiu9Xp15RkIgQIGcoLpfoIbenzpGUAtqFJp5W+LLnx38jHeECTJ/navKY1NWfN0sY1T8/pB8kIH3DU3DX+u6W3YwpypBMYOhbSxGjq84RZ84fWJow8pyHqn4S/9J15EcCMsXqrfwyd9mhiu3+rEo9pPpoJkdZqHjra4NvzFwuThNKy6hao/SlLw3ZADUcUp3w3SRVfW2rhl80zOgTYnKE0Hs2qp1J6H3xqPqIkvUDRMFDYyRbsFI3M9MEyovPk8rlw7/0a81cDVLmBsR2ze2pBuKb23fbeZC0uXoIvDppfTwIDxk1Oq2dGesGc+oJXWJLGkOha3CX+DUnzgAp9HGH9RsPZN63Hn4RMA5eSVhPHO+9RcRb/IOgtW31V1Q5IPGtoxPjC+MEJbVlIMYADd9aHYWUIQKopuPOHmoqSkubnAKnzgKHqgIOfW5RdAgotN6BN+O2ZYHkuemLnvQ8U9THVrS1RtLmKbcC7PeeDsYznvqzeg6VCNwmr0Yyx1wnLjyT84BZz3EJyCptD3yeueAyDWIs0L2qs/VQ3HUyqfrja0V1LdDzqAikeWuV4sc7RLIB69jEIBjCkyZedoUHqCrOvShVzyd73OdrJW0hPOuQv2qOoHDc9xVb6Yu6uq3Xqp2ZaH46A7lzevbxQEmfrzvAYSJuZ4WDk1Hz3QX1LVdiUK0EvlAGAYlG3Md30r7dcPN63yqBCIj25prpvZP0nI4+EgWoFG95V596CurXpKRBGRjQlHCvy5Ib/iW8nZJWwrET3mgd6mEhfP4KCuaLjopWs7h+MdXFdIv8dHQJgg1xi1eYqB0uDYjxwVmri0Sv5XKut/onqapC+FQiC2C1lvYJ9MVco6yDYsS3AANUfMtvtbYI2hfwZatiSsnoUeMZd34GVjkMMKA+XnjJpXgRW2SHTZplVowPmJsvXy6w3cfO1AK2dvtZEKTkC/TY9LFiKHCG0DnrMQdGm2lzlBHM9iEYynH2UcVMhUEjsc0oDBTgo2ZSQ1gzkAHeWeBXYFjYLuuf8yzTCy7/RFR81WDjXMbq2BOH5dURnxo6oivmxL3cKzKInlZkD31nvpHB9Kk7GfcfE1t+1V64b9LtgeJGlpRFxQCAqWJ5DoY77ski8gsOEOr2uywZaoO/NGa0X0y1pNQHBi3b2SUGNpcZxDT7rLbBf1FSnQ8guxGW3W+36BW0gBje4DOz6Ba6SVk0xiKgt+q2JOFyr4SYfnu+Ic1QZYIuwHBrgzr6UvOcSCzPTOo7D6IC4ISeS7zkl4h+2VoeHpnG/uWR3+ysNgPcOIXQbv0n4mr3BwQcdKJxgPSeyuP/z1Jjg4e9nUvoXegqQVIE30EHx5GHv+FAVUNTowYDJgyFhf5IvlYmEqRif6+WN1MkEJmDcQITx9FX23a4mxy1AQRsOHO/+eImX9l8EMJI3oPWzVXxSOeHU1dUWYr2uAA7AMb+vAEZSbU3qob9ibCyXeypEMpZ6863o6QPqlqGHZkuWABSTVNd4cOh9hv3qEpSx2Zy/DJMP6cItEmiBJ5PFqQnDEIt3NrA3COlOSgz43D7gpNFNJ5MBh4oFzhDPiglC2ypsNU4ISywY2erkyb1NC3Qh/IfWj0eDgZI4/ln8WPfBsT3meTjq1Uqt1E7Zl/qftqkx6aM9KueMCekSnMrcHj1CqTWWzEzPsZGcDe3Ue4Ws+XFYVxNbOFF8ezkvQGR6ZOtOLU2lQEnMBStx47vE6Pb7AYMBRj2OOfZXfisjJnpTfSNjo6sZ6qSvNxZNmDeS7Gk3yYyCk1HtKN2UnhMIjOXUzAqDv90lx9O/q/AT1ZMnit5XQe9wmQxnE/WSH0CqZ9/2Hy+Sfmpeg8RwsHI5Z8kC8H293m/LHVVM/BA7HaTJYg5Enk7M/xWpq0192ACfBai2LA/qrCjCr6Dh1BIMzMXINBmX96MJ5Hn2nxln/RXPFhwHxUmSV0EV2V0jm86/dxxuYSU1W7sVkEbN9EzkG0QFwPhyHKyb3t+Fj5WoUUTErcazE/N6EW6Lvp0d//SDPj7EV9UdJN+Amnf3Wwk3A0SlJ9Z00yvXZ7n3z70G47Hfsow8Wq1JXcfwnA+Yxa5mFsgV464KKP4T31wqIgzFPd3eCe3j5ory5fBF2hgCFyVFrLzI9eetNXvM7oQqyFgDo4CTp/hDV9NMX9JDHQ/nyHTLvZLNLF6ftn2OxjGm8+PqOwhxnPHWipkE/8wbtyri80Sr7pMNkQGMfo4ZYK9OcCC4ESVFFbLMIvlxSoRqWie0wxqnLfcLSXMSpMMQEJYDVObYsXIQNv4TGNwjq1kvT1UOkicTrG3IaBZ3XdScS3u8sgeZPVpOLkbiF940FjbCeNRINNvDbd01EPBrTCPpm12m43ze1bBB59Ia6Ovhnur/Nvx3IxwSWol+3H2qfCJR8df6aQf4v6WiONxkK+IqT4pKQrZK/LplgDI/PJZbOep8dtbV7oCr6CgfpWa8NczOkPx81iSHbsNhVSJBOtrLIMrL31LK9TqHqAbAHe0RLmmV806kRLDLNEhUEJfm9u0sxpkL93Zgd6rw+tqBfTMi59xqXHLXSHwSbSBl0EK0+loECOPtrl+/nsaFe197di4yUgoe4jKoAJDXc6DGDjrQOoFDWZJ9HXwt8xDrQP+7aRwWKWI1GF8s8O4KzxWBBcwnl3vnl1Oez3oh6Ea1vjR7/z7DDTrFtqU2W/KAEzAuXDNZ7MY73MF216dzdSbWmUp4lcm7keJfWaMHgut9x5C9mj66Z0lJ+yhsjVvyiWrfk1lzPOTdhG15Y7gQlXtacvI7qv/XNSscDwqkgwHT/gUsD5yB7LdRRvJxQGYINn9hTpodKFVSTPrtGvyQw+HlRFXIkodErAGu9Iy1YpfSPc3jkFh5CX3lPxv7aqjE/JAfTIpEjGb/H7MO0e2vsViSW1qa/Lmi4/n4DEI3g7lYrcanspDfEpKkdV1OjSLOy0BCUqVoECaB55vs06rXl4jqmLsPsFM/7vYJ0vrBhDCm/00A/H81l1uekJ/6Lml3Hb9+NKiLqATJmDpyzfYZFHumEjC662L0Bwkxi7E9U4cQA0XMVDuMYAIeLMPgQaMVOd8fmt5SflFIfuBoszeAw7ow5gXPE2Y/yBc/7jExARUf/BxIHQBF5Sn3i61w4z5xJdCyO1F1X3+3ax+JSvMeZ7S6QSKp1Fp/sjYz6Z+VgCZzibGeEoujryfMulH7Rai5kAft9ebcW50DyJr2uo2z97mTWIu45YsSnNSMrrNUuG1XsYBtD9TDYzQffKB87vWbkM4EbPAFgoBV4GQS+vtFDUqOFAoi1nTtmIOvg38N4hT2Sn8r8clmBCXspBlMBYTnrqFJGBT3wZOzAyJDre9dHH7+x7qaaKDOB4UQALD5ecS0DE4obubQEiuJZ0EpBVpLuYcce8Aa4PYd/V4DLDAJBYKQPCWTcrEaZ5HYbJi11Gd6hjGom1ii18VHYnG28NKpkz2UKVPxlhYSp8uZr367iOmoy7zsxehW9wzcy2zG0a80PBMCRQMb32hnaHeOR8fnNDzZhaNYhkOdDsBUZ3loDMa1YP0uS0cjUP3b/6DBlqmZOeNABDsLl5BI5QJups8uxAuWJdkUB/pO6Zax6tsg7fN5mjjDgMGngO+DPcKqiHIDbFIGudxtPTIyDi9SFMKBDcfdGQRv41q1AqmxgkVfJMnP8w/Bc7N9/TR6C7mGObFqFkIEom8sKi2xYqJLTCHK7cxzaZvqODo22c3wisBCP4HeAgcRbNPAsBkNRhSmD48dHupdBRw4mIvtS5oeF6zeT1KMCyhMnmhpkFAGWnGscoNkwvQ8ZM5lE/vgTHFYL99OuNxdFBxTEDd5v2qLR8y9WkXsWgG6kZNndFG+pO/UAkOCipqIhL3hq7cRSdrCq7YhUsTocEcnaFa6nVkhnSeRYUA1YO0z5itF9Sly3VlxYDw239TJJH6f3EUfYO5lb7bcFcz8Bp7Oo8QmnsUHOz/fagVUBtKEw1iT88j+aKkv8cscKNkMxjYr8344D1kFoZ7/td1W6LCNYN594301tUGRmFjAzeRg5vyoM1F6+bJZ/Q54jN/k8SFd3DxPTYaAUsivsBfgTn7Mx8H2SpPt4GOdYRnEJOH6jHM2p6SgB0gzIRq6fHxGMmSmqaPCmlfwxiuloaVIitLGN8wie2CDWhkzLoCJcODh7KIOAqbHEvXdUxaS4TTTs07Clzj/6GmVs9kiZDerMxEnhUB6QQPlcfqkG9882RqHoLiHGBoHfQuXIsAG8GTAtao2KVwRnvvam8jo1e312GQAKWEa4sUVEAMG4G6ckcONDwRcg1e2D3+ohXgY4UAWF8wHKQMrSnzCgfFpsxh+aHXMGtPQroQasRY4U6UdG0rz1Vjbka0MekOGRZQEvqQFlxseFor8zWFgHek3v29+WqN6gaK5gZOTOMZzpQIC1201LkMCXild3vWXSc5UX9xcFYfbRPzGFa1FDcPfPB/jUEq/FeGt419CI3YmBlVoHsa4KdcwQP5ZSwHHhFJ7/Ph/Rap/4vmG91eDwPP0lDfCDRCLszTqfzM71xpmiKi2HwS4WlqvGNwtvwF5Dqpn6KTq8ax00UMPkxDcZrEEEsIvHiUXXEphdb4GB4FymlPwBz4Gperqq5pW7TQ6/yNRhW8VT5NhuP0udlxo4gILq5ZxAZk8ZGh3g4CqxJlPKY7AQxupfUcVpWT5VItp1+30UqoyP4wWsRo3olRRgkWZZ2ZN6VC3OZFeXB8NbnUrSdikNptD1QiGuKkr8EmSR/AK9Rw+FF3s5uwuPbvHGiPeFOViltMK7AUaOsq9+x9cndk3iJEE5LKZRlWJbKOZweROzmPNVPkjE3K/TyA57Rs68TkZ3MR8akKpm7cFjnjPd/DdkWjgYoKHSr5Wu5ssoBYU4acRs5g2DHxUmdq8VXOXRbunD8QN0LhgkssgahcdoYsNvuXGUK/KXD/7oFb+VGdhqIn02veuM5bLudJOc2Ky0GMaG4W/xWBxIJcL7yliJOXOpx0AkBqUgzlDczmLT4iILXDxxtRR1oZa2JWFgiAb43obrJnG/TZC2KSK2wqOzRZTXavZZFMb1f3bXvVaNaK828w9TO610gk8JNf3gMfETzXXsbcvRGCG9JWQZ6+cDPqc4466Yo2RcKH+PILeKOqtnlbInR3MmBeGG3FH10yzkybuqEC2HSQwpA0An7d9+73BkDUTm30bZmoP/RGbgFN+GrCOfADgqr0WbI1a1okpFms8iHYw9hm0zUvlEMivBRxModrbJJ+9/p3jUdQQ9BCtQdxnOGrT5dzRUmw0593/mbRSdBg0nRvRZM5/E16m7ZHmDEtWhwvfdZCZ8J8M12W0yRMszXamWfQTwIZ4ayYktrnscQuWr8idp3PjT2eF/jmtdhIfcpMnb+IfZY2FebW6UY/AK3jP4u3Tu4zE4qlnQgLFbM19EBIsNf7KhjdbqQ/D6yiDb+NlEi2SKD+ivXVUK8ib0oBo366gXkR8ZxGjpJIDcEgZPa9TcYe0TIbiPl/rPUQDu3XBJ9X/GNq3FAUsKsll57DzaGMrjcT+gctp+9MLYXCq+sqP81eVQ0r9lt+gcQfZbACRbEjvlMskztZG8gbC8Qn9tt26Q7y7nDrbZq/LEz7kR6Jc6pg3N9rVX8Y5MJrGlML9p9lU4jbTkKqCveeZUJjHB03m2KRKR2TytoFkTXOLg7keU1s1lrPMQJpoOKLuAAC+y1HlJucU6ysB5hsXhvSPPLq5J7JtnqHKZ4vYjC4Vy8153QY+6780xDuGARsGbOs1WqzH0QS765rnSKEbbKlkO8oI/VDwUd0is13tKpqILu1mDJFNy/iJAWcvDgjxvusIT+PGz3ST/J9r9Mtfd0jpaGeiLYIqXc7DiHSS8TcjFVksi66PEkxW1z6ujbLLUGNNYnzOWpH8BZGK4bCK7iR+MbIv8ncDAz1u4StN3vTTzewr9IQjk9wxFxn+6N1ddKs0vffJiS08N3a4G1SVrlZ97Q/M+8G9fe5AP6d9/Qq4WRnORVhofPIKEdCr3llspUfE0oKIIYoByBRPh+bX1HLS3JWGJRhIvE1aW4NTd8ePi4Z+kXb+Z8snYfSNcqijhAgVsx4RCM54cXUiYkjeBmmC4ajOHrChoELscJJC7+9jjMjw5BagZKlgRMiSNYz7h7vvZIoQqbtQmspc0cUk1G/73iXtSpROl5wtLgQi0mW2Ex8i3WULhcggx6E1LMVHUsdc9GHI1PH3U2Ko0PyGdn9KdVOLm7FPBui0i9a0HpA60MsewVE4z8CAt5d401Gv6zXlIT5Ybit1VIA0FCs7wtvYreru1fUyW3oLAZ/+aTnZrOcYRNVA8spoRtlRoWflsRClFcgzkqiHOrf0/SVw+EpVaFlJ0g4Kxq1MMOmiQdpMNpte8lMMQqm6cIFXlnGbfJllysKDi+0JJMotkqgIxOSQgU9dn/lWkeVf8nUm3iwX2Nl3WDw9i6AUK3vBAbZZrcJpDQ/N64AVwjT07Jef30GSSmtNu2WlW7YoyW2FlWfZFQUwk867EdLYKk9VG6JgEnBiBxkY7LMo4YLQJJlAo9l/oTvJkSARDF/XtyAzM8O2t3eT/iXa6wDN3WewNmQHdPfsxChU/KtLG2Mn8i4ZqKdSlIaBZadxJmRzVS/o4yA65RTSViq60oa395Lqw0pzY4SipwE0SXXsKV+GZraGSkr/RW08wPRvqvSUkYBMA9lPx4m24az+IHmCbXA+0faxTRE9wuGeO06DIXa6QlKJ3puIyiuAVfPr736vzo2pBirS+Vxel3TMm3JKhz9o2ZoRvaFVpIkykb0Hcm4oHFBMcNSNj7/4GJt43ogonY2Vg4nsDQIWxAcorpXACzgBqQPjYsE/VUpXpwNManEru4NwMCFPkXvMoqvoeLN3qyu/N1eWEHttMD65v19l/0kH2mR35iv/FI+yjoHJ9gPMz67af3Mq/BoWXqu3rphiWMXVkmnPSEkpGpUI2h1MThideGFEOK6YZHPwYzMBvpNC7+ZHxPb7epfefGyIB4JzO9DTNEYnDLVVHdQyvOEVefrk6Uv5kTQYVYWWdqrdcIl7yljwwIWdfQ/y+2QB3eR/qxYObuYyB4gTbo2in4PzarU1sO9nETkmj9/AoxDA+JM3GMqQtJR4jtduHtnoCLxd1gQUscHRB/MoRYIEsP2pDZ9KvHgtlk1iTbWWbHhohwFEYX7y51fUV2nuUmnoUcqnWIQAAgl9LTVX+Bc0QGNEhChxHR4YjfE51PUdGfsSFE6ck7BL3/hTf9jLq4G1IafINxOLKeAtO7quulYvH5YOBc+zX7CrMgWnW47/jfRsWnJjYYoE7xMfWV2HN2iyIqLI";
const FENCED = new Map([
    [
        8217,
        "apostrophe"
    ],
    [
        8260,
        "fraction slash"
    ],
    [
        12539,
        "middle dot"
    ]
]);
function decode_arithmetic(bytes) {
    let pos = 0;
    function u16() {
        return bytes[pos++] << 8 | bytes[pos++];
    }
    let symbol_count = u16();
    let total = 1;
    let acc = [
        0,
        1
    ];
    for(let i = 1; i < symbol_count; i++){
        acc.push(total += u16());
    }
    let skip = u16();
    let pos_payload = pos;
    pos += skip;
    let read_width = 0;
    let read_buffer = 0;
    function read_bit() {
        if (read_width == 0) {
            read_buffer = read_buffer << 8 | bytes[pos++];
            read_width = 8;
        }
        return read_buffer >> --read_width & 1;
    }
    const FULL = 2 ** 31;
    const HALF = FULL >>> 1;
    const QRTR = HALF >> 1;
    const MASK = FULL - 1;
    let register = 0;
    for(let i1 = 0; i1 < 31; i1++)register = register << 1 | read_bit();
    let symbols = [];
    let low = 0;
    let range = FULL;
    while(true){
        let value = Math.floor(((register - low + 1) * total - 1) / range);
        let start = 0;
        let end = symbol_count;
        while(end - start > 1){
            let mid = start + end >>> 1;
            if (value < acc[mid]) {
                end = mid;
            } else {
                start = mid;
            }
        }
        if (start == 0) break;
        symbols.push(start);
        let a = low + Math.floor(range * acc[start] / total);
        let b = low + Math.floor(range * acc[start + 1] / total) - 1;
        while(((a ^ b) & HALF) == 0){
            register = register << 1 & MASK | read_bit();
            a = a << 1 & MASK;
            b = b << 1 & MASK | 1;
        }
        while(a & ~b & QRTR){
            register = register & HALF | register << 1 & MASK >>> 1 | read_bit();
            a = a << 1 ^ HALF;
            b = (b ^ HALF) << 1 | HALF | 1;
        }
        low = a;
        range = 1 + b - a;
    }
    let offset = symbol_count - 4;
    return symbols.map((x)=>{
        switch(x - offset){
            case 3:
                return offset + 65792 + (bytes[pos_payload++] << 16 | bytes[pos_payload++] << 8 | bytes[pos_payload++]);
            case 2:
                return offset + 256 + (bytes[pos_payload++] << 8 | bytes[pos_payload++]);
            case 1:
                return offset + bytes[pos_payload++];
            default:
                return x - 1;
        }
    });
}
function read_payload(v) {
    let pos = 0;
    return ()=>v[pos++];
}
function read_compressed_payload(s) {
    return read_payload(decode_arithmetic(unsafe_atob(s)));
}
function unsafe_atob(s) {
    let lookup = [];
    [
        ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    ].forEach((c, i)=>lookup[c.charCodeAt(0)] = i);
    let n = s.length;
    let ret = new Uint8Array(6 * n >> 3);
    for(let i = 0, pos = 0, width = 0, carry = 0; i < n; i++){
        carry = carry << 6 | lookup[s.charCodeAt(i)];
        width += 6;
        if (width >= 8) {
            ret[pos++] = carry >> (width -= 8);
        }
    }
    return ret;
}
function signed(i) {
    return i & 1 ? ~i >> 1 : i >> 1;
}
function read_deltas(n, next) {
    let v = Array(n);
    for(let i = 0, x = 0; i < n; i++)v[i] = x += signed(next());
    return v;
}
function read_sorted(next, prev = 0) {
    let ret = [];
    while(true){
        let x = next();
        let n = next();
        if (!n) break;
        prev += x;
        for(let i = 0; i < n; i++){
            ret.push(prev + i);
        }
        prev += n + 1;
    }
    return ret;
}
function read_sorted_arrays(next) {
    return read_array_while(()=>{
        let v = read_sorted(next);
        if (v.length) return v;
    });
}
function read_mapped(next) {
    let ret = [];
    while(true){
        let w = next();
        if (w == 0) break;
        ret.push(read_linear_table(w, next));
    }
    while(true){
        let w1 = next() - 1;
        if (w1 < 0) break;
        ret.push(read_replacement_table(w1, next));
    }
    return ret.flat();
}
function read_array_while(next) {
    let v = [];
    while(true){
        let x = next(v.length);
        if (!x) break;
        v.push(x);
    }
    return v;
}
function read_transposed(n, w, next) {
    let m = Array(n).fill().map(()=>[]);
    for(let i = 0; i < w; i++){
        read_deltas(n, next).forEach((x, j)=>m[j].push(x));
    }
    return m;
}
function read_linear_table(w, next) {
    let dx = 1 + next();
    let dy = next();
    let vN = read_array_while(next);
    let m = read_transposed(vN.length, 1 + w, next);
    return m.flatMap((v, i)=>{
        let [x, ...ys] = v;
        return Array(vN[i]).fill().map((_, j)=>{
            let j_dy = j * dy;
            return [
                x + j * dx,
                ys.map((y)=>y + j_dy)
            ];
        });
    });
}
function read_replacement_table(w, next) {
    let n = 1 + next();
    let m = read_transposed(n, 1 + w, next);
    return m.map((v)=>[
            v[0],
            v.slice(1)
        ]);
}
function read_trie(next) {
    let ret = [];
    let sorted = read_sorted(next);
    expand(decode([]), []);
    return ret;
    function decode(Q) {
        let S = next();
        let B = read_array_while(()=>{
            let cps = read_sorted(next).map((i)=>sorted[i]);
            if (cps.length) return decode(cps);
        });
        return {
            S: S,
            B: B,
            Q: Q
        };
    }
    function expand({ S , B  }, cps, saved) {
        if (S & 4 && saved === cps[cps.length - 1]) return;
        if (S & 2) saved = cps[cps.length - 1];
        if (S & 1) ret.push(cps);
        for (let br of B){
            for (let cp of br.Q){
                expand(br, [
                    ...cps,
                    cp
                ], saved);
            }
        }
    }
}
function hex_cp(cp) {
    return cp.toString(16).toUpperCase().padStart(2, "0");
}
function quote_cp(cp) {
    return `{${hex_cp(cp)}}`;
}
function explode_cp(s) {
    let cps = [];
    for(let pos = 0, len = s.length; pos < len;){
        let cp = s.codePointAt(pos);
        pos += cp < 65536 ? 1 : 2;
        cps.push(cp);
    }
    return cps;
}
function str_from_cps(cps) {
    const chunk = 4096;
    let len = cps.length;
    if (len < 4096) return String.fromCodePoint(...cps);
    let buf = [];
    for(let i = 0; i < len;){
        buf.push(String.fromCodePoint(...cps.slice(i, i += chunk)));
    }
    return buf.join("");
}
function compare_arrays(a, b) {
    let n = a.length;
    let c = n - b.length;
    for(let i = 0; c == 0 && i < n; i++)c = a[i] - b[i];
    return c;
}
var COMPRESSED = "AEUDTAHBCFQATQDRADAAcgAgADQAFAAsABQAHwAOACQADQARAAoAFwAHABIACAAPAAUACwAFAAwABAAQAAMABwAEAAoABQAIAAIACgABAAQAFAALAAIACwABAAIAAQAHAAMAAwAEAAsADAAMAAwACgANAA0AAwAKAAkABAAdAAYAZwDSAdsDJgC0CkMB8xhZAqfoC190UGcThgBurwf7PT09Pb09AjgJum8OjDllxHYUKXAPxzq6tABAxgK8ysUvWAgMPT09PT09PSs6LT2HcgWXWwFLoSMEEEl5RFVMKvO0XQ8ExDdJMnIgsj26PTQyy8FfEQ8AY8IPAGcEbwRwBHEEcgRzBHQEdQR2BHcEeAR6BHsEfAR+BIAEgfndBQoBYgULAWIFDAFiBNcE2ATZBRAFEQUvBdALFAsVDPcNBw13DYcOMA4xDjMB4BllHI0B2grbAMDpHLkQ7QHVAPRNQQFnGRUEg0yEB2uaJF8AJpIBpob5AERSMAKNoAXqaQLUBMCzEiACnwRZEkkVsS7tANAsBG0RuAQLEPABv9HICTUBXigPZwRBApMDOwAamhtaABqEAY8KvKx3LQ4ArAB8UhwEBAVSagD8AEFZADkBIadVj2UMUgx5Il4ANQC9AxIB1BlbEPMAs30CGxlXAhwZKQIECBc6EbsCoxngzv7UzRQA8M0BawL6ZwkN7wABAD33OQRcsgLJCjMCjqUChtw/km+NAsXPAoP2BT84PwURAK0RAvptb6cApQS/OMMey5HJS84UdxpxTPkCogVFITaTOwERAK5pAvkNBOVyA7q3BKlOJSALAgUIBRcEdASpBXqzABXFSWZOawLCOqw//AolCZdvv3dSBkEQGyelEPcMMwG1ATsN7UvYBPEGOwTJH30ZGQ/NlZwIpS3dDO0m4y6hgFoj9SqDBe1L9DzdC01RaA9ZC2UJ4zpjgU4DIQENIosK3Q05CG0Q8wrJaw3lEUUHOQPVSZoApQcBCxEdNRW1JhBirAsJOXcG+xr2C48mrxMpevwF0xohBk0BKRr/AM8u54WwWjFcHE9fBgMLJSPHFKhQIA0lQLd4SBobBxUlqQKRQ3BKh1E2HpMh9jw9DWYuE1F8B/U8BRlPC4E8nkarRQ4R0j6NPUgiSUwsBDV/LC8niwnPD4UMuXxyAVkJIQmxDHETMREXN8UIOQcZLZckJxUIIUaVYJoE958D8xPRAwsFPwlBBxMDtRwtEy4VKQUNgSTXAvM21S6zAo9WgAEXBcsPJR/fEFBH4A7pCJsCZQODJesALRUhABcimwhDYwBfj9hTBS7LCMdqbCN0A2cU52ERcweRDlcHpxwzFb8c4XDIXguGCCijrwlbAXUJmQFfBOMICTVbjKAgQWdTi1gYmyBhQT9d/AIxDGUVn0S9h3gCiw9rEhsBNQFzBzkNAQJ3Ee0RaxCVCOuGBDW1M/g6JQRPIYMgEQonA09szgsnJvkM+GkBoxJiAww0PXfuZ6tgtiQX/QcZMsVBYCHxC5JPzQycGsEYQlQuGeQHvwPzGvMn6kFXBf8DowMTOk0z7gS9C2kIiwk/AEkOoxcH1xhqCnGM0AExiwG3mQNXkYMCb48GNwcLAGcLhwV55QAdAqcIowAFAM8DVwA5Aq0HnQAZAIVBAT0DJy8BIeUCjwOTCDHLAZUvAfMpBBvDDBUA9zduSgLDsQKAamaiBd1YAo4CSTUBTSUEBU5HUQOvceEA2wBLBhPfRwEVq0rLGuNDAd9vKwDHAPsABTUHBUEBzQHzbQC3AV8LMQmis7UBTekpAIMAFWsB1wKJAN0ANQB/8QFTAE0FWfkF0wJPSQERMRgrV2EBuwMfATMBDQB5BsuNpckHHwRtB9MCEBsV4QLvLge1AQMi3xPNQsUCvd5VoWACZIECYkJbTa9bNyACofcCaJgCZgkCn4Q4GwsCZjsCZiYEbgR/A38TA36SOQY5dxc5gjojIwJsHQIyNjgKAm3HAm2u74ozZ0UrAWcA3gDhAEoFB5gMjQD+C8IADbUCdy8CdqI/AnlLQwJ4uh1c20WuRtcCfD8CesgCfQkCfPAFWQUgSABIfWMkAoFtAoAAAoAFAn+uSVhKWxUXSswC0QEC0MxLJwOITwOH5kTFkTIC8qFdAwMDrkvOTC0lA89NTE2vAos/AorYwRsHHUNnBbcCjjcCjlxAl4ECjtkCjlx4UbRTNQpS1FSFApP7ApMMAOkAHFUeVa9V0AYsGymVhjLheGZFOzkCl58C77JYIagAWSUClo8ClnycAKlZrFoJgU0AOwKWtQKWTlxEXNECmcsCmWRcyl0HGQKcmznCOp0CnBYCn5sCnriKAB0PMSoPAp3xAp6SALU9YTRh7wKe0wKgbgGpAp6fHwKeTqVjyGQnJSsCJ68CJn4CoPsCoEwCot0CocQCpi8Cpc4Cp/8AfQKn8mh8aLEAA0lqHGrRAqzjAqyuAq1nAq0CAlcdAlXcArHh1wMfTmyXArK9DQKy6Bds4G1jbUhfAyXNArZcOz9ukAMpRQK4XgK5RxUCuSp3cDZw4QK9GQK72nCWAzIRAr6IcgIDM3ECvhpzInNPAsPLAsMEc4J0SzVFdOADPKcDPJoDPb8CxXwCxkcCxhCJAshpUQLIRALJTwLJLgJknQLd0nh5YXiueSVL0AMYo2cCAmH0GfOVJHsLXpJeuxECz2sCz2wvS1PS8xOfAMatAs9zASnqA04SfksFAtwnAtuKAtJPA1JcA1NfAQEDVYyAiT8AyxbtYEWCHILTgs6DjQLaxwLZ3oQQhEmnPAOGpQAvA2QOhnFZ+QBVAt9lAt64c3cC4i/tFAHzMCcB9JsB8tKHAuvzAulweQLq+QLq5AD5RwG5Au6JAuuclqqXAwLuPwOF4Jh5cOBxoQLzAwBpA44WmZMC9xMDkW4DkocC95gC+dkC+GaaHJqruzebHgOdgwL++gEbADmfHJ+zAwWNA6ZqA6bZANHFAwZqoYiiBQkDDEkCwAA/AwDhQRdTARHzA2sHl2cFAJMtK7evvdsBiZkUfxEEOQH7KQUhDp0JnwCS/SlXxQL3AZ0AtwW5AG8LbUEuFCaNLgFDAYD8AbUmAHUDDgRtACwCFgyhAAAKAj0CagPdA34EkQEgRQUhfAoABQBEABMANhICdwEABdUDa+8KxQIA9wqfJ7+xt+UBkSFBQgHpFH8RNMCJAAQAGwBaAkUChIsABjpTOpSNbQC4Oo860ACNOME63AClAOgAywE6gTo7Ofw5+Tt2iTpbO56JOm85GAFWATMBbAUvNV01njWtNWY1dTW2NcU1gjWRNdI14TWeNa017jX9NbI1wTYCNhE1xjXVNhY2JzXeNe02LjY9Ni41LSE2OjY9Njw2yTcIBJA8VzY4Nt03IDcPNsogN4k3MAoEsDxnNiQ3GTdsOo03IULUQwdC4EMLHA8PCZsobShRVQYA6X8A6bABFCnXAukBowC9BbcAbwNzBL8MDAMMAQgDAAkKCwsLCQoGBAVVBI/DvwDz9b29kaUCb0QtsRTNLt4eGBcSHAMZFhYZEhYEARAEBUEcQRxBHEEcQRxBHEEaQRxBHEFCSTxBPElISUhBNkM2QTYbNklISVmBVIgBFLWZAu0BhQCjBcEAbykBvwGJAaQcEZ0ePCklMAAhMvAIMAL54gC7Bm8EescjzQMpARQpKgDUABavAj626xQAJP0A3etzuf4NNRA7efy2Z9NQrCnC0OSyANz5BBIbJ5IFDR6miIavYS6tprjjmuKebxm5C74Q225X1pkaYYPb6f1DK4k3xMEBb9S2WMjEibTNWhsRJIA+vwNVEiXTE5iXs/wezV66oFLfp9NZGYW+Gk19J2+bCT6Ye2w6LDYdgzKMUabk595eLBCXANz9HUpWbATq9vqXVx9XDg+Pc9Xp4+bsS005SVM/BJBM4687WUuf+Uj9dEi8aDNaPxtpbDxcG1THTImUMZq4UCaaNYpsVqraNyKLJXDYsFZ/5jl7bLRtO88t7P3xZaAxhb5OdPMXqsSkp1WCieG8jXm1U99+blvLlXzPCS+M93VnJCiK+09LfaSaBAVBomyDgJua8dfUzR7ga34IvR2Nvj+A9heJ6lsl1KG4NkI1032Cnff1m1wof2B9oHJK4bi6JkEdSqeNeiuo6QoZZincoc73/TH9SXF8sCE7XyuYyW8WSgbGFCjPV0ihLKhdPs08Tx82fYAkLLc4I2wdl4apY7GU5lHRFzRWJep7Ww3wbeA3qmd59/86P4xuNaqDpygXt6M85glSBHOCGgJDnt+pN9bK7HApMguX6+06RZNjzVmcZJ+wcUrJ9//bpRNxNuKpNl9uFds+S9tdx7LaM5ZkIrPj6nIU9mnbFtVbs9s/uLgl8MVczAwet+iOEzzBlYW7RCMgE6gyNLeq6+1tIx4dpgZnd0DksJS5f+JNDpwwcPNXaaVspq1fbQajOrJgK0ofKtJ1Ne90L6VO4MOl5S886p7u6xo7OLjG8TGL+HU1JXGJgppg4nNbNJ5nlzSpuPYy21JUEcUA94PoFiZfjZue+QnyQ80ekOuZVkxx4g+cvhJfHgNl4hy1/a6+RKcKlar/J29y//EztlbVPHVUeQ1zX86eQVAjR/M3dA9w4W8LfaXp4EgM85wOWasli837PzVMOnsLzR+k3o75/lRPAJSE1xAKQzEi5v10ke+VBvRt1cwQRMd+U5mLCTGVd6XiZtgBG5cDi0w22GKcVNvHiu5LQbZEDVtz0onn7k5+heuKXVsZtSzilkLRAUmjMXEMB3J9YC50XBxPiz53SC+EhnPl9WsKCv92SM/OFFIMJZYfl0WW8tIO3UxYcwdMAj7FSmgrsZ2aAZO03BOhP1bNNZItyXYQFTpC3SG1VuPDqH9GkiCDmE+JwxyIVSO5siDErAOpEXFgjy6PQtOVDj+s6e1r8heWVvmZnTciuf4EiNZzCAd7SOMhXERIOlsHIMG399i9aLTy3m2hRLZjJVDNLS53iGIK11dPqQt0zBDyg6qc7YqkDm2M5Ve6dCWCaCbTXX2rToaIgz6+zh4lYUi/+6nqcFMAkQJKHYLK0wYk5N9szV6xihDbDDFr45lN1K4aCXBq/FitPSud9gLt5ZVn+ZqGX7cwm2z5EGMgfFpIFyhGGuDPmso6TItTMwny+7uPnLCf4W6goFQFV0oQSsc9VfMmVLcLr6ZetDZbaSFTLqnSO/bIPjA3/zAUoqgGFAEQS4IhuMzEp2I3jJzbzkk/IEmyax+rhZTwd6f+CGtwPixu8IvzACquPWPREu9ZvGkUzpRwvRRuaNN6cr0W1wWits9ICdYJ7ltbgMiSL3sTPeufgNcVqMVWFkCPDH4jG2jA0XcVgQj62Cb29v9f/z/+2KbYvIv/zzjpQAPkliaVDzNrW57TZ/ZOyZD0nlfMmAIBIAGAI0D3k/mdN4xr9v85ZbZbbqfH2jGd5hUqNZWwl5SPfoGmfElmazUIeNL1j/mkF7VNAzTq4jNt8JoQ11NQOcmhprXoxSxfRGJ9LDEOAQ+dmxAQH90iti9e2u/MoeuaGcDTHoC+xsmEeWmxEKefQuIzHbpw5Tc5cEocboAD09oipWQhtTO1wivf/O+DRe2rpl/E9wlrzBorjJsOeG1B/XPW4EaJEFdNlECEZga5ZoGRHXgYouGRuVkm8tDESiEyFNo+3s5M5puSdTyUL2llnINVHEt91XUNW4ewdMgJ4boJfEyt/iY5WXqbA+A2Fkt5Z0lutiWhe9nZIyIUjyXDC3UsaG1t+eNx6z4W/OYoTB7A6x+dNSTOi9AInctbESqm5gvOLww7OWXPrmHwVZasrl4eD113pm+JtT7JVOvnCXqdzzdTRHgJ0PiGTFYW5Gvt9R9LD6Lzfs0v/TZZHSmyVNq7viIHE6DBK7Qp07Iz55EM8SYtQvZf/obBniTWi5C2/ovHfw4VndkE5XYdjOhCMRjDeOEfXeN/CwfGduiUIfsoFeUxXeQXba7c7972XNv8w+dTjjUM0QeNAReW+J014dKAD/McQYXT7c0GQPIkn3Ll6R7gGjuiQoZD0TEeEqQpKoZ15g/0OPQI17QiSv9AUROa/V/TQN3dvLArec3RrsYlvBm1b8LWzltdugsC50lNKYLEp2a+ZZYqPejULRlOJh5zj/LVMyTDvwKhMxxwuDkxJ1QpoNI0OTWLom4Z71SNzI9TV1iXJrIu9Wcnd+MCaAw8o1jSXd94YU/1gnkrC9BUEOtQvEIQ7g0i6h+KL2JKk8Ydl7HruvgWMSAmNe+LshGhV4qnWHhO9/RIPQzY1tHRj2VqOyNsDpK0cww+56AdDC4gsWwY0XxoucIWIqs/GcwnWqlaT0KPr8mbK5U94/301i1WLt4YINTVvCFBrFZbIbY8eycOdeJ2teD5IfPLCRg7jjcFTwlMFNl9zdh/o3E/hHPwj7BWg0MU09pPrBLbrCgm54A6H+I6v27+jL5gkjWg/iYdks9jbfVP5y/n0dlgWEMlKasl7JvFZd56LfybW1eeaVO0gxTfXZwD8G4SI116yx7UKVRgui6Ya1YpixqXeNLc8IxtAwCU5IhwQgn+NqHnRaDv61CxKhOq4pOX7M6pkA+Pmpd4j1vn6ACUALoLLc4vpXci8VidLxzm7qFBe7s+quuJs6ETYmnpgS3LwSZxPIltgBDXz8M1k/W2ySNv2f9/NPhxLGK2D21dkHeSGmenRT3Yqcdl0m/h3OYr8V+lXNYGf8aCCpd4bWjE4QIPj7vUKN4Nrfs7ML6Y2OyS830JCnofg/k7lpFpt4SqZc5HGg1HCOrHvOdC8bP6FGDbE/VV0mX4IakzbdS/op+Kt3G24/8QbBV7y86sGSQ/vZzU8FXs7u6jIvwchsEP2BpIhW3G8uWNwa3HmjfH/ZjhhCWvluAcF+nMf14ClKg5hGgtPLJ98ueNAkc5Hs2WZlk2QHvfreCK1CCGO6nMZVSb99VM/ajr8WHTte9JSmkXq/i/U943HEbdzW6Re/S88dKgg8pGOLlAeNiqrcLkUR3/aClFpMXcOUP3rmETcWSfMXZE3TUOi8i+fqRnTYLflVx/Vb/6GJ7eIRZUA6k3RYR3iFSK9c4iDdNwJuZL2FKz/IK5VimcNWEqdXjSoxSgmF0UPlDoUlNrPcM7ftmA8Y9gKiqKEHuWN+AZRIwtVSxye2Kf8rM3lhJ5XcBXU9n4v0Oy1RU2M+4qM8AQPVwse8ErNSob5oFPWxuqZnVzo1qB/IBxkM3EVUKFUUlO3e51259GgNcJbCmlvrdjtoTW7rChm1wyCKzpCTwozUUEOIcWLneRLgMXh+SjGSFkAllzbGS5HK7LlfCMRNRDSvbQPjcXaenNYxCvu2Qyznz6StuxVj66SgI0T8B6/sfHAJYZaZ78thjOSIFumNWLQbeZixDCCC+v0YBtkxiBB3jefHqZ/dFHU+crbj6OvS1x/JDD7vlm7zOVPwpUC01nhxZuY/63E7g";
const N_COUNT = 21 * 28;
const S_COUNT = 19 * N_COUNT;
const S1 = 44032 + S_COUNT;
const L1 = 4352 + 19;
const V1 = 4449 + 21;
const T1$1 = 4519 + 28;
function unpack_cc(packed) {
    return packed >> 24 & 255;
}
function unpack_cp(packed) {
    return packed & 16777215;
}
let SHIFTED_RANK, EXCLUSIONS, DECOMP, RECOMP;
function init$1() {
    let r = read_compressed_payload(COMPRESSED);
    SHIFTED_RANK = new Map(read_sorted_arrays(r).flatMap((v, i)=>v.map((x)=>[
                x,
                i + 1 << 24
            ])));
    EXCLUSIONS = new Set(read_sorted(r));
    DECOMP = new Map;
    RECOMP = new Map;
    for (let [cp, cps] of read_mapped(r)){
        if (!EXCLUSIONS.has(cp) && cps.length == 2) {
            let [a, b] = cps;
            let bucket = RECOMP.get(a);
            if (!bucket) {
                bucket = new Map;
                RECOMP.set(a, bucket);
            }
            bucket.set(b, cp);
        }
        DECOMP.set(cp, cps.reverse());
    }
}
function is_hangul(cp) {
    return cp >= 44032 && cp < S1;
}
function compose_pair(a, b) {
    if (a >= 4352 && a < L1 && b >= 4449 && b < V1) {
        return 44032 + (a - 4352) * N_COUNT + (b - 4449) * 28;
    } else if (is_hangul(a) && b > 4519 && b < T1$1 && (a - 44032) % 28 == 0) {
        return a + (b - 4519);
    } else {
        let recomp = RECOMP.get(a);
        if (recomp) {
            recomp = recomp.get(b);
            if (recomp) {
                return recomp;
            }
        }
        return -1;
    }
}
function decomposed(cps) {
    if (!SHIFTED_RANK) init$1();
    let ret = [];
    let buf = [];
    let check_order = false;
    function add(cp) {
        let cc = SHIFTED_RANK.get(cp);
        if (cc) {
            check_order = true;
            cp |= cc;
        }
        ret.push(cp);
    }
    for (let cp of cps){
        while(true){
            if (cp < 128) {
                ret.push(cp);
            } else if (is_hangul(cp)) {
                let s_index = cp - 44032;
                let l_index = s_index / N_COUNT | 0;
                let v_index = s_index % N_COUNT / 28 | 0;
                let t_index = s_index % 28;
                add(4352 + l_index);
                add(4449 + v_index);
                if (t_index > 0) add(4519 + t_index);
            } else {
                let mapped = DECOMP.get(cp);
                if (mapped) {
                    buf.push(...mapped);
                } else {
                    add(cp);
                }
            }
            if (!buf.length) break;
            cp = buf.pop();
        }
    }
    if (check_order && ret.length > 1) {
        let prev_cc = unpack_cc(ret[0]);
        for(let i = 1; i < ret.length; i++){
            let cc = unpack_cc(ret[i]);
            if (cc == 0 || prev_cc <= cc) {
                prev_cc = cc;
                continue;
            }
            let j = i - 1;
            while(true){
                let tmp = ret[j + 1];
                ret[j + 1] = ret[j];
                ret[j] = tmp;
                if (!j) break;
                prev_cc = unpack_cc(ret[--j]);
                if (prev_cc <= cc) break;
            }
            prev_cc = unpack_cc(ret[i]);
        }
    }
    return ret;
}
function composed_from_decomposed(v) {
    let ret = [];
    let stack = [];
    let prev_cp = -1;
    let prev_cc = 0;
    for (let packed of v){
        let cc = unpack_cc(packed);
        let cp = unpack_cp(packed);
        if (prev_cp == -1) {
            if (cc == 0) {
                prev_cp = cp;
            } else {
                ret.push(cp);
            }
        } else if (prev_cc > 0 && prev_cc >= cc) {
            if (cc == 0) {
                ret.push(prev_cp, ...stack);
                stack.length = 0;
                prev_cp = cp;
            } else {
                stack.push(cp);
            }
            prev_cc = cc;
        } else {
            let composed = compose_pair(prev_cp, cp);
            if (composed >= 0) {
                prev_cp = composed;
            } else if (prev_cc == 0 && cc == 0) {
                ret.push(prev_cp);
                prev_cp = cp;
            } else {
                stack.push(cp);
                prev_cc = cc;
            }
        }
    }
    if (prev_cp >= 0) {
        ret.push(prev_cp, ...stack);
    }
    return ret;
}
function nfd(cps) {
    return decomposed(cps).map(unpack_cp);
}
function nfc(cps) {
    return composed_from_decomposed(decomposed(cps));
}
const STOP_CH = ".";
const Array_from = (x)=>Array.from(x);
function group_has_cp(g, cp) {
    return g.P.has(cp) || g.Q.has(cp);
}
class Emoji extends Array {
    get is_emoji() {
        return true;
    }
}
let MAPPED, IGNORED, CM, NSM, ESCAPE, GROUPS, WHOLE_VALID, WHOLE_MAP, VALID, EMOJI_LIST, EMOJI_ROOT;
function init() {
    if (MAPPED) return;
    let r = read_compressed_payload(COMPRESSED$1);
    const read_sorted_array = ()=>read_sorted(r);
    const read_sorted_set = ()=>new Set(read_sorted_array());
    const set_add_many = (set, v)=>v.forEach((x)=>set.add(x));
    MAPPED = new Map(read_mapped(r));
    IGNORED = read_sorted_set();
    CM = read_sorted_array();
    NSM = new Set(read_sorted_array().map((i)=>CM[i]));
    CM = new Set(CM);
    ESCAPE = read_sorted_set();
    read_sorted_set();
    let chunks = read_sorted_arrays(r);
    let unrestricted = r();
    const read_chunked = ()=>{
        let set = new Set;
        read_sorted_array().forEach((i)=>set_add_many(set, chunks[i]));
        set_add_many(set, read_sorted_array());
        return set;
    };
    GROUPS = read_array_while((i)=>{
        let N = read_array_while(r).map((x)=>x + 96);
        if (N.length) {
            let R = i >= unrestricted;
            N[0] -= 32;
            N = str_from_cps(N);
            if (R) N = `Restricted[${N}]`;
            let P = read_chunked();
            let Q = read_chunked();
            let M = !r();
            return {
                N: N,
                P: P,
                Q: Q,
                M: M,
                R: R
            };
        }
    });
    WHOLE_VALID = read_sorted_set();
    WHOLE_MAP = new Map;
    let wholes = read_sorted_array().concat(Array_from(WHOLE_VALID)).sort((a, b)=>a - b);
    wholes.forEach((cp, i)=>{
        let d = r();
        let w = wholes[i] = d ? wholes[i - d] : {
            V: [],
            M: new Map
        };
        w.V.push(cp);
        if (!WHOLE_VALID.has(cp)) {
            WHOLE_MAP.set(cp, w);
        }
    });
    for (let { V , M  } of new Set(WHOLE_MAP.values())){
        let recs = [];
        for (let cp of V){
            let gs = GROUPS.filter((g)=>group_has_cp(g, cp));
            let rec = recs.find(({ G  })=>gs.some((g)=>G.has(g)));
            if (!rec) {
                rec = {
                    G: new Set,
                    V: []
                };
                recs.push(rec);
            }
            rec.V.push(cp);
            set_add_many(rec.G, gs);
        }
        let union = recs.flatMap((x)=>Array_from(x.G));
        for (let { G , V: V1  } of recs){
            let complement = new Set(union.filter((g)=>!G.has(g)));
            for (let cp1 of V1){
                M.set(cp1, complement);
            }
        }
    }
    VALID = new Set;
    let multi = new Set;
    const add_to_union = (cp)=>VALID.has(cp) ? multi.add(cp) : VALID.add(cp);
    for (let g of GROUPS){
        for (let cp2 of g.P)add_to_union(cp2);
        for (let cp3 of g.Q)add_to_union(cp3);
    }
    for (let cp4 of VALID){
        if (!WHOLE_MAP.has(cp4) && !multi.has(cp4)) {
            WHOLE_MAP.set(cp4, 1);
        }
    }
    set_add_many(VALID, nfd(VALID));
    EMOJI_LIST = read_trie(r).map((v)=>Emoji.from(v)).sort(compare_arrays);
    EMOJI_ROOT = new Map;
    for (let cps of EMOJI_LIST){
        let prev = [
            EMOJI_ROOT
        ];
        for (let cp5 of cps){
            let next = prev.map((node)=>{
                let child = node.get(cp5);
                if (!child) {
                    child = new Map;
                    node.set(cp5, child);
                }
                return child;
            });
            if (cp5 === 65039) {
                prev.push(...next);
            } else {
                prev = next;
            }
        }
        for (let x of prev){
            x.V = cps;
        }
    }
}
function quoted_cp(cp) {
    return (should_escape(cp) ? "" : `${bidi_qq(safe_str_from_cps([
        cp
    ]))} `) + quote_cp(cp);
}
function bidi_qq(s) {
    return `"${s}"\u200E`;
}
function check_label_extension(cps) {
    if (cps.length >= 4 && cps[2] == 45 && cps[3] == 45) {
        throw new Error(`invalid label extension: "${str_from_cps(cps.slice(0, 4))}"`);
    }
}
function check_leading_underscore(cps) {
    for(let i = cps.lastIndexOf(95); i > 0;){
        if (cps[--i] !== 95) {
            throw new Error("underscore allowed only at start");
        }
    }
}
function check_fenced(cps) {
    let cp = cps[0];
    let prev = FENCED.get(cp);
    if (prev) throw error_placement(`leading ${prev}`);
    let n = cps.length;
    let last = -1;
    for(let i = 1; i < n; i++){
        cp = cps[i];
        let match = FENCED.get(cp);
        if (match) {
            if (last == i) throw error_placement(`${prev} + ${match}`);
            last = i + 1;
            prev = match;
        }
    }
    if (last == n) throw error_placement(`trailing ${prev}`);
}
function safe_str_from_cps(cps, max = Infinity, quoter = quote_cp) {
    let buf = [];
    if (is_combining_mark(cps[0])) buf.push("◌");
    if (cps.length > max) {
        max >>= 1;
        cps = [
            ...cps.slice(0, max),
            8230,
            ...cps.slice(-max)
        ];
    }
    let prev = 0;
    let n = cps.length;
    for(let i = 0; i < n; i++){
        let cp = cps[i];
        if (should_escape(cp)) {
            buf.push(str_from_cps(cps.slice(prev, i)));
            buf.push(quoter(cp));
            prev = i + 1;
        }
    }
    buf.push(str_from_cps(cps.slice(prev, n)));
    return buf.join("");
}
function is_combining_mark(cp) {
    init();
    return CM.has(cp);
}
function should_escape(cp) {
    init();
    return ESCAPE.has(cp);
}
function ens_normalize(name) {
    return flatten(split(name, nfc, filter_fe0f));
}
function split(name, nf, ef) {
    if (!name) return [];
    init();
    let offset = 0;
    return name.split(STOP_CH).map((label)=>{
        let input = explode_cp(label);
        let info = {
            input: input,
            offset: offset
        };
        offset += input.length + 1;
        try {
            let tokens = info.tokens = tokens_from_str(input, nf, ef);
            let token_count = tokens.length;
            let type;
            if (!token_count) {
                throw new Error(`empty label`);
            }
            let norm = info.output = tokens.flat();
            check_leading_underscore(norm);
            let emoji = info.emoji = token_count > 1 || tokens[0].is_emoji;
            if (!emoji && norm.every((cp)=>cp < 128)) {
                check_label_extension(norm);
                type = "ASCII";
            } else {
                let chars = tokens.flatMap((x)=>x.is_emoji ? [] : x);
                if (!chars.length) {
                    type = "Emoji";
                } else {
                    if (CM.has(norm[0])) throw error_placement("leading combining mark");
                    for(let i = 1; i < token_count; i++){
                        let cps = tokens[i];
                        if (!cps.is_emoji && CM.has(cps[0])) {
                            throw error_placement(`emoji + combining mark: "${str_from_cps(tokens[i - 1])} + ${safe_str_from_cps([
                                cps[0]
                            ])}"`);
                        }
                    }
                    check_fenced(norm);
                    let unique = Array_from(new Set(chars));
                    let [g] = determine_group(unique);
                    check_group(g, chars);
                    check_whole(g, unique);
                    type = g.N;
                }
            }
            info.type = type;
        } catch (err) {
            info.error = err;
        }
        return info;
    });
}
function check_whole(group, unique) {
    let maker;
    let shared = [];
    for (let cp of unique){
        let whole = WHOLE_MAP.get(cp);
        if (whole === 1) return;
        if (whole) {
            let set = whole.M.get(cp);
            maker = maker ? maker.filter((g)=>set.has(g)) : Array_from(set);
            if (!maker.length) return;
        } else {
            shared.push(cp);
        }
    }
    if (maker) {
        for (let g of maker){
            if (shared.every((cp)=>group_has_cp(g, cp))) {
                throw new Error(`whole-script confusable: ${group.N}/${g.N}`);
            }
        }
    }
}
function determine_group(unique) {
    let groups = GROUPS;
    for (let cp of unique){
        let gs = groups.filter((g)=>group_has_cp(g, cp));
        if (!gs.length) {
            if (!GROUPS.some((g)=>group_has_cp(g, cp))) {
                throw error_disallowed(cp);
            } else {
                throw error_group_member(groups[0], cp);
            }
        }
        groups = gs;
        if (gs.length == 1) break;
    }
    return groups;
}
function flatten(split) {
    return split.map(({ input , error , output  })=>{
        if (error) {
            let msg = error.message;
            throw new Error(split.length == 1 ? msg : `Invalid label ${bidi_qq(safe_str_from_cps(input, 63))}: ${msg}`);
        }
        return str_from_cps(output);
    }).join(STOP_CH);
}
function error_disallowed(cp) {
    return new Error(`disallowed character: ${quoted_cp(cp)}`);
}
function error_group_member(g, cp) {
    let quoted = quoted_cp(cp);
    let gg = GROUPS.find((g)=>g.P.has(cp));
    if (gg) {
        quoted = `${gg.N} ${quoted}`;
    }
    return new Error(`illegal mixture: ${g.N} + ${quoted}`);
}
function error_placement(where) {
    return new Error(`illegal placement: ${where}`);
}
function check_group(g, cps) {
    for (let cp of cps){
        if (!group_has_cp(g, cp)) {
            throw error_group_member(g, cp);
        }
    }
    if (g.M) {
        let decomposed = nfd(cps);
        for(let i = 1, e = decomposed.length; i < e; i++){
            if (NSM.has(decomposed[i])) {
                let j = i + 1;
                for(let cp1; j < e && NSM.has(cp1 = decomposed[j]); j++){
                    for(let k = i; k < j; k++){
                        if (decomposed[k] == cp1) {
                            throw new Error(`duplicate non-spacing marks: ${quoted_cp(cp1)}`);
                        }
                    }
                }
                if (j - i > 4) {
                    throw new Error(`excessive non-spacing marks: ${bidi_qq(safe_str_from_cps(decomposed.slice(i - 1, j)))} (${j - i}/${4})`);
                }
                i = j;
            }
        }
    }
}
function tokens_from_str(input, nf, ef) {
    let ret = [];
    let chars = [];
    input = input.slice().reverse();
    while(input.length){
        let emoji = consume_emoji_reversed(input);
        if (emoji) {
            if (chars.length) {
                ret.push(nf(chars));
                chars = [];
            }
            ret.push(ef(emoji));
        } else {
            let cp = input.pop();
            if (VALID.has(cp)) {
                chars.push(cp);
            } else {
                let cps = MAPPED.get(cp);
                if (cps) {
                    chars.push(...cps);
                } else if (!IGNORED.has(cp)) {
                    throw error_disallowed(cp);
                }
            }
        }
    }
    if (chars.length) {
        ret.push(nf(chars));
    }
    return ret;
}
function filter_fe0f(cps) {
    return cps.filter((cp)=>cp != 65039);
}
function consume_emoji_reversed(cps, eaten) {
    let node = EMOJI_ROOT;
    let emoji;
    let pos = cps.length;
    while(pos){
        node = node.get(cps[--pos]);
        if (!node) break;
        let { V  } = node;
        if (V) {
            emoji = V;
            cps.length = pos;
        }
    }
    return emoji;
}
const Zeros = new Uint8Array(32);
Zeros.fill(0);
function checkComponent(comp) {
    assertArgument(comp.length !== 0, "invalid ENS name; empty component", "comp", comp);
    return comp;
}
function ensNameSplit(name) {
    const bytes = toUtf8Bytes(ensNormalize(name));
    const comps = [];
    if (name.length === 0) {
        return comps;
    }
    let last = 0;
    for(let i = 0; i < bytes.length; i++){
        const d = bytes[i];
        if (d === 46) {
            comps.push(checkComponent(bytes.slice(last, i)));
            last = i + 1;
        }
    }
    assertArgument(last < bytes.length, "invalid ENS name; empty component", "name", name);
    comps.push(checkComponent(bytes.slice(last)));
    return comps;
}
function ensNormalize(name) {
    try {
        if (name.length === 0) {
            throw new Error("empty label");
        }
        return ens_normalize(name);
    } catch (error) {
        assertArgument(false, `invalid ENS name (${error.message})`, "name", name);
    }
}
function isValidName(name) {
    try {
        return ensNameSplit(name).length !== 0;
    } catch (error) {}
    return false;
}
function namehash(name) {
    assertArgument(typeof name === "string", "invalid ENS name; not a string", "name", name);
    assertArgument(name.length, `invalid ENS name (empty label)`, "name", name);
    let result = Zeros;
    const comps = ensNameSplit(name);
    while(comps.length){
        result = keccak256(concat([
            result,
            keccak256(comps.pop())
        ]));
    }
    return hexlify(result);
}
function dnsEncode(name, _maxLength) {
    const length = _maxLength != null ? _maxLength : 63;
    assertArgument(length <= 255, "DNS encoded label cannot exceed 255", "length", length);
    return hexlify(concat(ensNameSplit(name).map((comp)=>{
        assertArgument(comp.length <= length, `label ${JSON.stringify(name)} exceeds ${length} bytes`, "name", name);
        const bytes = new Uint8Array(comp.length + 1);
        bytes.set(comp, 1);
        bytes[0] = bytes.length - 1;
        return bytes;
    }))) + "00";
}
function accessSetify(addr, storageKeys) {
    return {
        address: getAddress(addr),
        storageKeys: storageKeys.map((storageKey, index)=>{
            assertArgument(isHexString(storageKey, 32), "invalid slot", `storageKeys[${index}]`, storageKey);
            return storageKey.toLowerCase();
        })
    };
}
function accessListify(value) {
    if (Array.isArray(value)) {
        return value.map((set, index)=>{
            if (Array.isArray(set)) {
                assertArgument(set.length === 2, "invalid slot set", `value[${index}]`, set);
                return accessSetify(set[0], set[1]);
            }
            assertArgument(set != null && typeof set === "object", "invalid address-slot set", "value", value);
            return accessSetify(set.address, set.storageKeys);
        });
    }
    assertArgument(value != null && typeof value === "object", "invalid access list", "value", value);
    const result = Object.keys(value).map((addr)=>{
        const storageKeys = value[addr].reduce((accum, storageKey)=>{
            accum[storageKey] = true;
            return accum;
        }, {});
        return accessSetify(addr, Object.keys(storageKeys).sort());
    });
    result.sort((a, b)=>a.address.localeCompare(b.address));
    return result;
}
function computeAddress(key) {
    let pubkey;
    if (typeof key === "string") {
        pubkey = SigningKey.computePublicKey(key, false);
    } else {
        pubkey = key.publicKey;
    }
    return getAddress(keccak256("0x" + pubkey.substring(4)).substring(26));
}
function recoverAddress(digest, signature) {
    return computeAddress(SigningKey.recoverPublicKey(digest, signature));
}
const BN_0$4 = BigInt(0);
const BN_2$2 = BigInt(2);
const BN_27 = BigInt(27);
const BN_28 = BigInt(28);
const BN_35 = BigInt(35);
const BN_MAX_UINT = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
const BLOB_SIZE = 4096 * 32;
function getVersionedHash(version, hash) {
    let versioned = version.toString(16);
    while(versioned.length < 2){
        versioned = "0" + versioned;
    }
    versioned += sha256(hash).substring(4);
    return "0x" + versioned;
}
function handleAddress(value) {
    if (value === "0x") {
        return null;
    }
    return getAddress(value);
}
function handleAccessList(value, param) {
    try {
        return accessListify(value);
    } catch (error) {
        assertArgument(false, error.message, param, value);
    }
}
function handleNumber(_value, param) {
    if (_value === "0x") {
        return 0;
    }
    return getNumber(_value, param);
}
function handleUint(_value, param) {
    if (_value === "0x") {
        return BN_0$4;
    }
    const value = getBigInt(_value, param);
    assertArgument(value <= BN_MAX_UINT, "value exceeds uint size", param, value);
    return value;
}
function formatNumber(_value, name) {
    const value = getBigInt(_value, "value");
    const result = toBeArray(value);
    assertArgument(result.length <= 32, `value too large`, `tx.${name}`, value);
    return result;
}
function formatAccessList(value) {
    return accessListify(value).map((set)=>[
            set.address,
            set.storageKeys
        ]);
}
function formatHashes(value, param) {
    assertArgument(Array.isArray(value), `invalid ${param}`, "value", value);
    for(let i = 0; i < value.length; i++){
        assertArgument(isHexString(value[i], 32), "invalid ${ param } hash", `value[${i}]`, value[i]);
    }
    return value;
}
function _parseLegacy(data) {
    const fields = decodeRlp(data);
    assertArgument(Array.isArray(fields) && (fields.length === 9 || fields.length === 6), "invalid field count for legacy transaction", "data", data);
    const tx = {
        type: 0,
        nonce: handleNumber(fields[0], "nonce"),
        gasPrice: handleUint(fields[1], "gasPrice"),
        gasLimit: handleUint(fields[2], "gasLimit"),
        to: handleAddress(fields[3]),
        value: handleUint(fields[4], "value"),
        data: hexlify(fields[5]),
        chainId: BN_0$4
    };
    if (fields.length === 6) {
        return tx;
    }
    const v = handleUint(fields[6], "v");
    const r = handleUint(fields[7], "r");
    const s = handleUint(fields[8], "s");
    if (r === BN_0$4 && s === BN_0$4) {
        tx.chainId = v;
    } else {
        let chainId = (v - BN_35) / BN_2$2;
        if (chainId < BN_0$4) {
            chainId = BN_0$4;
        }
        tx.chainId = chainId;
        assertArgument(chainId !== BN_0$4 || v === BN_27 || v === BN_28, "non-canonical legacy v", "v", fields[6]);
        tx.signature = Signature.from({
            r: zeroPadValue(fields[7], 32),
            s: zeroPadValue(fields[8], 32),
            v: v
        });
    }
    return tx;
}
function _serializeLegacy(tx, sig) {
    const fields = [
        formatNumber(tx.nonce, "nonce"),
        formatNumber(tx.gasPrice || 0, "gasPrice"),
        formatNumber(tx.gasLimit, "gasLimit"),
        tx.to || "0x",
        formatNumber(tx.value, "value"),
        tx.data
    ];
    let chainId = BN_0$4;
    if (tx.chainId != BN_0$4) {
        chainId = getBigInt(tx.chainId, "tx.chainId");
        assertArgument(!sig || sig.networkV == null || sig.legacyChainId === chainId, "tx.chainId/sig.v mismatch", "sig", sig);
    } else if (tx.signature) {
        const legacy = tx.signature.legacyChainId;
        if (legacy != null) {
            chainId = legacy;
        }
    }
    if (!sig) {
        if (chainId !== BN_0$4) {
            fields.push(toBeArray(chainId));
            fields.push("0x");
            fields.push("0x");
        }
        return encodeRlp(fields);
    }
    let v = BigInt(27 + sig.yParity);
    if (chainId !== BN_0$4) {
        v = Signature.getChainIdV(chainId, sig.v);
    } else if (BigInt(sig.v) !== v) {
        assertArgument(false, "tx.chainId/sig.v mismatch", "sig", sig);
    }
    fields.push(toBeArray(v));
    fields.push(toBeArray(sig.r));
    fields.push(toBeArray(sig.s));
    return encodeRlp(fields);
}
function _parseEipSignature(tx, fields) {
    let yParity;
    try {
        yParity = handleNumber(fields[0], "yParity");
        if (yParity !== 0 && yParity !== 1) {
            throw new Error("bad yParity");
        }
    } catch (error) {
        assertArgument(false, "invalid yParity", "yParity", fields[0]);
    }
    const r = zeroPadValue(fields[1], 32);
    const s = zeroPadValue(fields[2], 32);
    const signature = Signature.from({
        r: r,
        s: s,
        yParity: yParity
    });
    tx.signature = signature;
}
function _parseEip1559(data) {
    const fields = decodeRlp(getBytes(data).slice(1));
    assertArgument(Array.isArray(fields) && (fields.length === 9 || fields.length === 12), "invalid field count for transaction type: 2", "data", hexlify(data));
    const tx = {
        type: 2,
        chainId: handleUint(fields[0], "chainId"),
        nonce: handleNumber(fields[1], "nonce"),
        maxPriorityFeePerGas: handleUint(fields[2], "maxPriorityFeePerGas"),
        maxFeePerGas: handleUint(fields[3], "maxFeePerGas"),
        gasPrice: null,
        gasLimit: handleUint(fields[4], "gasLimit"),
        to: handleAddress(fields[5]),
        value: handleUint(fields[6], "value"),
        data: hexlify(fields[7]),
        accessList: handleAccessList(fields[8], "accessList")
    };
    if (fields.length === 9) {
        return tx;
    }
    _parseEipSignature(tx, fields.slice(9));
    return tx;
}
function _serializeEip1559(tx, sig) {
    const fields = [
        formatNumber(tx.chainId, "chainId"),
        formatNumber(tx.nonce, "nonce"),
        formatNumber(tx.maxPriorityFeePerGas || 0, "maxPriorityFeePerGas"),
        formatNumber(tx.maxFeePerGas || 0, "maxFeePerGas"),
        formatNumber(tx.gasLimit, "gasLimit"),
        tx.to || "0x",
        formatNumber(tx.value, "value"),
        tx.data,
        formatAccessList(tx.accessList || [])
    ];
    if (sig) {
        fields.push(formatNumber(sig.yParity, "yParity"));
        fields.push(toBeArray(sig.r));
        fields.push(toBeArray(sig.s));
    }
    return concat([
        "0x02",
        encodeRlp(fields)
    ]);
}
function _parseEip2930(data) {
    const fields = decodeRlp(getBytes(data).slice(1));
    assertArgument(Array.isArray(fields) && (fields.length === 8 || fields.length === 11), "invalid field count for transaction type: 1", "data", hexlify(data));
    const tx = {
        type: 1,
        chainId: handleUint(fields[0], "chainId"),
        nonce: handleNumber(fields[1], "nonce"),
        gasPrice: handleUint(fields[2], "gasPrice"),
        gasLimit: handleUint(fields[3], "gasLimit"),
        to: handleAddress(fields[4]),
        value: handleUint(fields[5], "value"),
        data: hexlify(fields[6]),
        accessList: handleAccessList(fields[7], "accessList")
    };
    if (fields.length === 8) {
        return tx;
    }
    _parseEipSignature(tx, fields.slice(8));
    return tx;
}
function _serializeEip2930(tx, sig) {
    const fields = [
        formatNumber(tx.chainId, "chainId"),
        formatNumber(tx.nonce, "nonce"),
        formatNumber(tx.gasPrice || 0, "gasPrice"),
        formatNumber(tx.gasLimit, "gasLimit"),
        tx.to || "0x",
        formatNumber(tx.value, "value"),
        tx.data,
        formatAccessList(tx.accessList || [])
    ];
    if (sig) {
        fields.push(formatNumber(sig.yParity, "recoveryParam"));
        fields.push(toBeArray(sig.r));
        fields.push(toBeArray(sig.s));
    }
    return concat([
        "0x01",
        encodeRlp(fields)
    ]);
}
function _parseEip4844(data) {
    let fields = decodeRlp(getBytes(data).slice(1));
    let typeName = "3";
    let blobs = null;
    if (fields.length === 4 && Array.isArray(fields[0])) {
        typeName = "3 (network format)";
        const fBlobs = fields[1], fCommits = fields[2], fProofs = fields[3];
        assertArgument(Array.isArray(fBlobs), "invalid network format: blobs not an array", "fields[1]", fBlobs);
        assertArgument(Array.isArray(fCommits), "invalid network format: commitments not an array", "fields[2]", fCommits);
        assertArgument(Array.isArray(fProofs), "invalid network format: proofs not an array", "fields[3]", fProofs);
        assertArgument(fBlobs.length === fCommits.length, "invalid network format: blobs/commitments length mismatch", "fields", fields);
        assertArgument(fBlobs.length === fProofs.length, "invalid network format: blobs/proofs length mismatch", "fields", fields);
        blobs = [];
        for(let i = 0; i < fields[1].length; i++){
            blobs.push({
                data: fBlobs[i],
                commitment: fCommits[i],
                proof: fProofs[i]
            });
        }
        fields = fields[0];
    }
    assertArgument(Array.isArray(fields) && (fields.length === 11 || fields.length === 14), `invalid field count for transaction type: ${typeName}`, "data", hexlify(data));
    const tx = {
        type: 3,
        chainId: handleUint(fields[0], "chainId"),
        nonce: handleNumber(fields[1], "nonce"),
        maxPriorityFeePerGas: handleUint(fields[2], "maxPriorityFeePerGas"),
        maxFeePerGas: handleUint(fields[3], "maxFeePerGas"),
        gasPrice: null,
        gasLimit: handleUint(fields[4], "gasLimit"),
        to: handleAddress(fields[5]),
        value: handleUint(fields[6], "value"),
        data: hexlify(fields[7]),
        accessList: handleAccessList(fields[8], "accessList"),
        maxFeePerBlobGas: handleUint(fields[9], "maxFeePerBlobGas"),
        blobVersionedHashes: fields[10]
    };
    if (blobs) {
        tx.blobs = blobs;
    }
    assertArgument(tx.to != null, `invalid address for transaction type: ${typeName}`, "data", data);
    assertArgument(Array.isArray(tx.blobVersionedHashes), "invalid blobVersionedHashes: must be an array", "data", data);
    for(let i1 = 0; i1 < tx.blobVersionedHashes.length; i1++){
        assertArgument(isHexString(tx.blobVersionedHashes[i1], 32), `invalid blobVersionedHash at index ${i1}: must be length 32`, "data", data);
    }
    if (fields.length === 11) {
        return tx;
    }
    _parseEipSignature(tx, fields.slice(11));
    return tx;
}
function _serializeEip4844(tx, sig, blobs) {
    const fields = [
        formatNumber(tx.chainId, "chainId"),
        formatNumber(tx.nonce, "nonce"),
        formatNumber(tx.maxPriorityFeePerGas || 0, "maxPriorityFeePerGas"),
        formatNumber(tx.maxFeePerGas || 0, "maxFeePerGas"),
        formatNumber(tx.gasLimit, "gasLimit"),
        tx.to || ZeroAddress,
        formatNumber(tx.value, "value"),
        tx.data,
        formatAccessList(tx.accessList || []),
        formatNumber(tx.maxFeePerBlobGas || 0, "maxFeePerBlobGas"),
        formatHashes(tx.blobVersionedHashes || [], "blobVersionedHashes")
    ];
    if (sig) {
        fields.push(formatNumber(sig.yParity, "yParity"));
        fields.push(toBeArray(sig.r));
        fields.push(toBeArray(sig.s));
        if (blobs) {
            return concat([
                "0x03",
                encodeRlp([
                    fields,
                    blobs.map((b)=>b.data),
                    blobs.map((b)=>b.commitment),
                    blobs.map((b)=>b.proof)
                ])
            ]);
        }
    }
    return concat([
        "0x03",
        encodeRlp(fields)
    ]);
}
class Transaction {
    #type;
    #to;
    #data;
    #nonce;
    #gasLimit;
    #gasPrice;
    #maxPriorityFeePerGas;
    #maxFeePerGas;
    #value;
    #chainId;
    #sig;
    #accessList;
    #maxFeePerBlobGas;
    #blobVersionedHashes;
    #kzg;
    #blobs;
    get type() {
        return this.#type;
    }
    set type(value) {
        switch(value){
            case null:
                this.#type = null;
                break;
            case 0:
            case "legacy":
                this.#type = 0;
                break;
            case 1:
            case "berlin":
            case "eip-2930":
                this.#type = 1;
                break;
            case 2:
            case "london":
            case "eip-1559":
                this.#type = 2;
                break;
            case 3:
            case "cancun":
            case "eip-4844":
                this.#type = 3;
                break;
            default:
                assertArgument(false, "unsupported transaction type", "type", value);
        }
    }
    get typeName() {
        switch(this.type){
            case 0:
                return "legacy";
            case 1:
                return "eip-2930";
            case 2:
                return "eip-1559";
            case 3:
                return "eip-4844";
        }
        return null;
    }
    get to() {
        const value = this.#to;
        if (value == null && this.type === 3) {
            return ZeroAddress;
        }
        return value;
    }
    set to(value) {
        this.#to = value == null ? null : getAddress(value);
    }
    get nonce() {
        return this.#nonce;
    }
    set nonce(value) {
        this.#nonce = getNumber(value, "value");
    }
    get gasLimit() {
        return this.#gasLimit;
    }
    set gasLimit(value) {
        this.#gasLimit = getBigInt(value);
    }
    get gasPrice() {
        const value = this.#gasPrice;
        if (value == null && (this.type === 0 || this.type === 1)) {
            return BN_0$4;
        }
        return value;
    }
    set gasPrice(value) {
        this.#gasPrice = value == null ? null : getBigInt(value, "gasPrice");
    }
    get maxPriorityFeePerGas() {
        const value = this.#maxPriorityFeePerGas;
        if (value == null) {
            if (this.type === 2 || this.type === 3) {
                return BN_0$4;
            }
            return null;
        }
        return value;
    }
    set maxPriorityFeePerGas(value) {
        this.#maxPriorityFeePerGas = value == null ? null : getBigInt(value, "maxPriorityFeePerGas");
    }
    get maxFeePerGas() {
        const value = this.#maxFeePerGas;
        if (value == null) {
            if (this.type === 2 || this.type === 3) {
                return BN_0$4;
            }
            return null;
        }
        return value;
    }
    set maxFeePerGas(value) {
        this.#maxFeePerGas = value == null ? null : getBigInt(value, "maxFeePerGas");
    }
    get data() {
        return this.#data;
    }
    set data(value) {
        this.#data = hexlify(value);
    }
    get value() {
        return this.#value;
    }
    set value(value) {
        this.#value = getBigInt(value, "value");
    }
    get chainId() {
        return this.#chainId;
    }
    set chainId(value) {
        this.#chainId = getBigInt(value);
    }
    get signature() {
        return this.#sig || null;
    }
    set signature(value) {
        this.#sig = value == null ? null : Signature.from(value);
    }
    get accessList() {
        const value = this.#accessList || null;
        if (value == null) {
            if (this.type === 1 || this.type === 2 || this.type === 3) {
                return [];
            }
            return null;
        }
        return value;
    }
    set accessList(value) {
        this.#accessList = value == null ? null : accessListify(value);
    }
    get maxFeePerBlobGas() {
        const value = this.#maxFeePerBlobGas;
        if (value == null && this.type === 3) {
            return BN_0$4;
        }
        return value;
    }
    set maxFeePerBlobGas(value) {
        this.#maxFeePerBlobGas = value == null ? null : getBigInt(value, "maxFeePerBlobGas");
    }
    get blobVersionedHashes() {
        let value = this.#blobVersionedHashes;
        if (value == null && this.type === 3) {
            return [];
        }
        return value;
    }
    set blobVersionedHashes(value) {
        if (value != null) {
            assertArgument(Array.isArray(value), "blobVersionedHashes must be an Array", "value", value);
            value = value.slice();
            for(let i = 0; i < value.length; i++){
                assertArgument(isHexString(value[i], 32), "invalid blobVersionedHash", `value[${i}]`, value[i]);
            }
        }
        this.#blobVersionedHashes = value;
    }
    get blobs() {
        if (this.#blobs == null) {
            return null;
        }
        return this.#blobs.map((b)=>Object.assign({}, b));
    }
    set blobs(_blobs) {
        if (_blobs == null) {
            this.#blobs = null;
            return;
        }
        const blobs = [];
        const versionedHashes = [];
        for(let i = 0; i < _blobs.length; i++){
            const blob = _blobs[i];
            if (isBytesLike(blob)) {
                assert1(this.#kzg, "adding a raw blob requires a KZG library", "UNSUPPORTED_OPERATION", {
                    operation: "set blobs()"
                });
                let data = getBytes(blob);
                assertArgument(data.length <= BLOB_SIZE, "blob is too large", `blobs[${i}]`, blob);
                if (data.length !== BLOB_SIZE) {
                    const padded = new Uint8Array(BLOB_SIZE);
                    padded.set(data);
                    data = padded;
                }
                const commit = this.#kzg.blobToKzgCommitment(data);
                const proof = hexlify(this.#kzg.computeBlobKzgProof(data, commit));
                blobs.push({
                    data: hexlify(data),
                    commitment: hexlify(commit),
                    proof: proof
                });
                versionedHashes.push(getVersionedHash(1, commit));
            } else {
                const commit1 = hexlify(blob.commitment);
                blobs.push({
                    data: hexlify(blob.data),
                    commitment: commit1,
                    proof: hexlify(blob.proof)
                });
                versionedHashes.push(getVersionedHash(1, commit1));
            }
        }
        this.#blobs = blobs;
        this.#blobVersionedHashes = versionedHashes;
    }
    get kzg() {
        return this.#kzg;
    }
    set kzg(kzg) {
        this.#kzg = kzg;
    }
    constructor(){
        this.#type = null;
        this.#to = null;
        this.#nonce = 0;
        this.#gasLimit = BN_0$4;
        this.#gasPrice = null;
        this.#maxPriorityFeePerGas = null;
        this.#maxFeePerGas = null;
        this.#data = "0x";
        this.#value = BN_0$4;
        this.#chainId = BN_0$4;
        this.#sig = null;
        this.#accessList = null;
        this.#maxFeePerBlobGas = null;
        this.#blobVersionedHashes = null;
        this.#blobs = null;
        this.#kzg = null;
    }
    get hash() {
        if (this.signature == null) {
            return null;
        }
        return keccak256(this.#getSerialized(true, false));
    }
    get unsignedHash() {
        return keccak256(this.unsignedSerialized);
    }
    get from() {
        if (this.signature == null) {
            return null;
        }
        return recoverAddress(this.unsignedHash, this.signature);
    }
    get fromPublicKey() {
        if (this.signature == null) {
            return null;
        }
        return SigningKey.recoverPublicKey(this.unsignedHash, this.signature);
    }
    isSigned() {
        return this.signature != null;
    }
    #getSerialized(signed1, sidecar) {
        assert1(!signed1 || this.signature != null, "cannot serialize unsigned transaction; maybe you meant .unsignedSerialized", "UNSUPPORTED_OPERATION", {
            operation: ".serialized"
        });
        const sig = signed1 ? this.signature : null;
        switch(this.inferType()){
            case 0:
                return _serializeLegacy(this, sig);
            case 1:
                return _serializeEip2930(this, sig);
            case 2:
                return _serializeEip1559(this, sig);
            case 3:
                return _serializeEip4844(this, sig, sidecar ? this.blobs : null);
        }
        assert1(false, "unsupported transaction type", "UNSUPPORTED_OPERATION", {
            operation: ".serialized"
        });
    }
    get serialized() {
        return this.#getSerialized(true, true);
    }
    get unsignedSerialized() {
        return this.#getSerialized(false, false);
    }
    inferType() {
        const types = this.inferTypes();
        if (types.indexOf(2) >= 0) {
            return 2;
        }
        return types.pop();
    }
    inferTypes() {
        const hasGasPrice = this.gasPrice != null;
        const hasFee = this.maxFeePerGas != null || this.maxPriorityFeePerGas != null;
        const hasAccessList = this.accessList != null;
        const hasBlob = this.#maxFeePerBlobGas != null || this.#blobVersionedHashes;
        if (this.maxFeePerGas != null && this.maxPriorityFeePerGas != null) {
            assert1(this.maxFeePerGas >= this.maxPriorityFeePerGas, "priorityFee cannot be more than maxFee", "BAD_DATA", {
                value: this
            });
        }
        assert1(!hasFee || this.type !== 0 && this.type !== 1, "transaction type cannot have maxFeePerGas or maxPriorityFeePerGas", "BAD_DATA", {
            value: this
        });
        assert1(this.type !== 0 || !hasAccessList, "legacy transaction cannot have accessList", "BAD_DATA", {
            value: this
        });
        const types = [];
        if (this.type != null) {
            types.push(this.type);
        } else {
            if (hasFee) {
                types.push(2);
            } else if (hasGasPrice) {
                types.push(1);
                if (!hasAccessList) {
                    types.push(0);
                }
            } else if (hasAccessList) {
                types.push(1);
                types.push(2);
            } else if (hasBlob && this.to) {
                types.push(3);
            } else {
                types.push(0);
                types.push(1);
                types.push(2);
                types.push(3);
            }
        }
        types.sort();
        return types;
    }
    isLegacy() {
        return this.type === 0;
    }
    isBerlin() {
        return this.type === 1;
    }
    isLondon() {
        return this.type === 2;
    }
    isCancun() {
        return this.type === 3;
    }
    clone() {
        return Transaction.from(this);
    }
    toJSON() {
        const s = (v)=>{
            if (v == null) {
                return null;
            }
            return v.toString();
        };
        return {
            type: this.type,
            to: this.to,
            data: this.data,
            nonce: this.nonce,
            gasLimit: s(this.gasLimit),
            gasPrice: s(this.gasPrice),
            maxPriorityFeePerGas: s(this.maxPriorityFeePerGas),
            maxFeePerGas: s(this.maxFeePerGas),
            value: s(this.value),
            chainId: s(this.chainId),
            sig: this.signature ? this.signature.toJSON() : null,
            accessList: this.accessList
        };
    }
    static from(tx) {
        if (tx == null) {
            return new Transaction;
        }
        if (typeof tx === "string") {
            const payload = getBytes(tx);
            if (payload[0] >= 127) {
                return Transaction.from(_parseLegacy(payload));
            }
            switch(payload[0]){
                case 1:
                    return Transaction.from(_parseEip2930(payload));
                case 2:
                    return Transaction.from(_parseEip1559(payload));
                case 3:
                    return Transaction.from(_parseEip4844(payload));
            }
            assert1(false, "unsupported transaction type", "UNSUPPORTED_OPERATION", {
                operation: "from"
            });
        }
        const result = new Transaction;
        if (tx.type != null) {
            result.type = tx.type;
        }
        if (tx.to != null) {
            result.to = tx.to;
        }
        if (tx.nonce != null) {
            result.nonce = tx.nonce;
        }
        if (tx.gasLimit != null) {
            result.gasLimit = tx.gasLimit;
        }
        if (tx.gasPrice != null) {
            result.gasPrice = tx.gasPrice;
        }
        if (tx.maxPriorityFeePerGas != null) {
            result.maxPriorityFeePerGas = tx.maxPriorityFeePerGas;
        }
        if (tx.maxFeePerGas != null) {
            result.maxFeePerGas = tx.maxFeePerGas;
        }
        if (tx.maxFeePerBlobGas != null) {
            result.maxFeePerBlobGas = tx.maxFeePerBlobGas;
        }
        if (tx.data != null) {
            result.data = tx.data;
        }
        if (tx.value != null) {
            result.value = tx.value;
        }
        if (tx.chainId != null) {
            result.chainId = tx.chainId;
        }
        if (tx.signature != null) {
            result.signature = Signature.from(tx.signature);
        }
        if (tx.accessList != null) {
            result.accessList = tx.accessList;
        }
        if (tx.blobVersionedHashes != null) {
            result.blobVersionedHashes = tx.blobVersionedHashes;
        }
        if (tx.kzg != null) {
            result.kzg = tx.kzg;
        }
        if (tx.blobs != null) {
            result.blobs = tx.blobs;
        }
        if (tx.hash != null) {
            assertArgument(result.isSigned(), "unsigned transaction cannot define '.hash'", "tx", tx);
            assertArgument(result.hash === tx.hash, "hash mismatch", "tx", tx);
        }
        if (tx.from != null) {
            assertArgument(result.isSigned(), "unsigned transaction cannot define '.from'", "tx", tx);
            assertArgument(result.from.toLowerCase() === (tx.from || "").toLowerCase(), "from mismatch", "tx", tx);
        }
        return result;
    }
}
function hashMessage(message) {
    if (typeof message === "string") {
        message = toUtf8Bytes(message);
    }
    return keccak256(concat([
        toUtf8Bytes(MessagePrefix),
        toUtf8Bytes(String(message.length)),
        message
    ]));
}
function verifyMessage(message, sig) {
    const digest = hashMessage(message);
    return recoverAddress(digest, sig);
}
const regexBytes = new RegExp("^bytes([0-9]+)$");
const regexNumber = new RegExp("^(u?int)([0-9]*)$");
const regexArray = new RegExp("^(.*)\\[([0-9]*)\\]$");
function _pack(type, value, isArray) {
    switch(type){
        case "address":
            if (isArray) {
                return getBytes(zeroPadValue(value, 32));
            }
            return getBytes(getAddress(value));
        case "string":
            return toUtf8Bytes(value);
        case "bytes":
            return getBytes(value);
        case "bool":
            value = !!value ? "0x01" : "0x00";
            if (isArray) {
                return getBytes(zeroPadValue(value, 32));
            }
            return getBytes(value);
    }
    let match = type.match(regexNumber);
    if (match) {
        let signed = match[1] === "int";
        let size = parseInt(match[2] || "256");
        assertArgument((!match[2] || match[2] === String(size)) && size % 8 === 0 && size !== 0 && size <= 256, "invalid number type", "type", type);
        if (isArray) {
            size = 256;
        }
        if (signed) {
            value = toTwos(value, size);
        }
        return getBytes(zeroPadValue(toBeArray(value), size / 8));
    }
    match = type.match(regexBytes);
    if (match) {
        const size1 = parseInt(match[1]);
        assertArgument(String(size1) === match[1] && size1 !== 0 && size1 <= 32, "invalid bytes type", "type", type);
        assertArgument(dataLength(value) === size1, `invalid value for ${type}`, "value", value);
        if (isArray) {
            return getBytes(zeroPadBytes(value, 32));
        }
        return value;
    }
    match = type.match(regexArray);
    if (match && Array.isArray(value)) {
        const baseType = match[1];
        const count = parseInt(match[2] || String(value.length));
        assertArgument(count === value.length, `invalid array length for ${type}`, "value", value);
        const result = [];
        value.forEach(function(value) {
            result.push(_pack(baseType, value, true));
        });
        return getBytes(concat(result));
    }
    assertArgument(false, "invalid type", "type", type);
}
function solidityPacked(types, values) {
    assertArgument(types.length === values.length, "wrong number of values; expected ${ types.length }", "values", values);
    const tight = [];
    types.forEach(function(type, index) {
        tight.push(_pack(type, values[index]));
    });
    return hexlify(concat(tight));
}
function solidityPackedKeccak256(types, values) {
    return keccak256(solidityPacked(types, values));
}
function solidityPackedSha256(types, values) {
    return sha256(solidityPacked(types, values));
}
const padding = new Uint8Array(32);
padding.fill(0);
const BN__1 = BigInt(-1);
const BN_0$3 = BigInt(0);
const BN_1$1 = BigInt(1);
const BN_MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
function hexPadRight(value) {
    const bytes = getBytes(value);
    const padOffset = bytes.length % 32;
    if (padOffset) {
        return concat([
            bytes,
            padding.slice(padOffset)
        ]);
    }
    return hexlify(bytes);
}
const hexTrue = toBeHex(BN_1$1, 32);
const hexFalse = toBeHex(BN_0$3, 32);
const domainFieldTypes = {
    name: "string",
    version: "string",
    chainId: "uint256",
    verifyingContract: "address",
    salt: "bytes32"
};
const domainFieldNames = [
    "name",
    "version",
    "chainId",
    "verifyingContract",
    "salt"
];
function checkString(key) {
    return function(value) {
        assertArgument(typeof value === "string", `invalid domain value for ${JSON.stringify(key)}`, `domain.${key}`, value);
        return value;
    };
}
const domainChecks = {
    name: checkString("name"),
    version: checkString("version"),
    chainId: function(_value) {
        const value = getBigInt(_value, "domain.chainId");
        assertArgument(value >= 0, "invalid chain ID", "domain.chainId", _value);
        if (Number.isSafeInteger(value)) {
            return Number(value);
        }
        return toQuantity(value);
    },
    verifyingContract: function(value) {
        try {
            return getAddress(value).toLowerCase();
        } catch (error) {}
        assertArgument(false, `invalid domain value "verifyingContract"`, "domain.verifyingContract", value);
    },
    salt: function(value) {
        const bytes = getBytes(value, "domain.salt");
        assertArgument(bytes.length === 32, `invalid domain value "salt"`, "domain.salt", value);
        return hexlify(bytes);
    }
};
function getBaseEncoder(type) {
    {
        const match = type.match(/^(u?)int(\d+)$/);
        if (match) {
            const signed = match[1] === "";
            const width = parseInt(match[2]);
            assertArgument(width % 8 === 0 && width !== 0 && width <= 256 && match[2] === String(width), "invalid numeric width", "type", type);
            const boundsUpper = mask(BN_MAX_UINT256, signed ? width - 1 : width);
            const boundsLower = signed ? (boundsUpper + BN_1$1) * BN__1 : BN_0$3;
            return function(_value) {
                const value = getBigInt(_value, "value");
                assertArgument(value >= boundsLower && value <= boundsUpper, `value out-of-bounds for ${type}`, "value", value);
                return toBeHex(signed ? toTwos(value, 256) : value, 32);
            };
        }
    }
    {
        const match1 = type.match(/^bytes(\d+)$/);
        if (match1) {
            const width1 = parseInt(match1[1]);
            assertArgument(width1 !== 0 && width1 <= 32 && match1[1] === String(width1), "invalid bytes width", "type", type);
            return function(value) {
                const bytes = getBytes(value);
                assertArgument(bytes.length === width1, `invalid length for ${type}`, "value", value);
                return hexPadRight(value);
            };
        }
    }
    switch(type){
        case "address":
            return function(value) {
                return zeroPadValue(getAddress(value), 32);
            };
        case "bool":
            return function(value) {
                return !value ? hexFalse : hexTrue;
            };
        case "bytes":
            return function(value) {
                return keccak256(value);
            };
        case "string":
            return function(value) {
                return id(value);
            };
    }
    return null;
}
function encodeType(name, fields) {
    return `${name}(${fields.map(({ name , type  })=>type + " " + name).join(",")})`;
}
function splitArray(type) {
    const match = type.match(/^([^\x5b]*)((\x5b\d*\x5d)*)(\x5b(\d*)\x5d)$/);
    if (match) {
        return {
            base: match[1],
            index: match[2] + match[4],
            array: {
                base: match[1],
                prefix: match[1] + match[2],
                count: match[5] ? parseInt(match[5]) : -1
            }
        };
    }
    return {
        base: type
    };
}
class TypedDataEncoder {
    primaryType;
    #types;
    get types() {
        return JSON.parse(this.#types);
    }
    #fullTypes;
    #encoderCache;
    constructor(_types){
        this.#fullTypes = new Map;
        this.#encoderCache = new Map;
        const links = new Map;
        const parents = new Map;
        const subtypes = new Map;
        const types = {};
        Object.keys(_types).forEach((type)=>{
            types[type] = _types[type].map(({ name , type  })=>{
                let { base , index  } = splitArray(type);
                if (base === "int" && !_types["int"]) {
                    base = "int256";
                }
                if (base === "uint" && !_types["uint"]) {
                    base = "uint256";
                }
                return {
                    name: name,
                    type: base + (index || "")
                };
            });
            links.set(type, new Set);
            parents.set(type, []);
            subtypes.set(type, new Set);
        });
        this.#types = JSON.stringify(types);
        for(const name in types){
            const uniqueNames = new Set;
            for (const field of types[name]){
                assertArgument(!uniqueNames.has(field.name), `duplicate variable name ${JSON.stringify(field.name)} in ${JSON.stringify(name)}`, "types", _types);
                uniqueNames.add(field.name);
                const baseType = splitArray(field.type).base;
                assertArgument(baseType !== name, `circular type reference to ${JSON.stringify(baseType)}`, "types", _types);
                const encoder = getBaseEncoder(baseType);
                if (encoder) {
                    continue;
                }
                assertArgument(parents.has(baseType), `unknown type ${JSON.stringify(baseType)}`, "types", _types);
                parents.get(baseType).push(name);
                links.get(name).add(baseType);
            }
        }
        const primaryTypes = Array.from(parents.keys()).filter((n)=>parents.get(n).length === 0);
        assertArgument(primaryTypes.length !== 0, "missing primary type", "types", _types);
        assertArgument(primaryTypes.length === 1, `ambiguous primary types or unused types: ${primaryTypes.map((t)=>JSON.stringify(t)).join(", ")}`, "types", _types);
        defineProperties(this, {
            primaryType: primaryTypes[0]
        });
        function checkCircular(type, found) {
            assertArgument(!found.has(type), `circular type reference to ${JSON.stringify(type)}`, "types", _types);
            found.add(type);
            for (const child of links.get(type)){
                if (!parents.has(child)) {
                    continue;
                }
                checkCircular(child, found);
                for (const subtype of found){
                    subtypes.get(subtype).add(child);
                }
            }
            found.delete(type);
        }
        checkCircular(this.primaryType, new Set);
        for (const [name1, set] of subtypes){
            const st = Array.from(set);
            st.sort();
            this.#fullTypes.set(name1, encodeType(name1, types[name1]) + st.map((t)=>encodeType(t, types[t])).join(""));
        }
    }
    getEncoder(type) {
        let encoder = this.#encoderCache.get(type);
        if (!encoder) {
            encoder = this.#getEncoder(type);
            this.#encoderCache.set(type, encoder);
        }
        return encoder;
    }
    #getEncoder(type) {
        {
            const encoder1 = getBaseEncoder(type);
            if (encoder1) {
                return encoder1;
            }
        }
        const array = splitArray(type).array;
        if (array) {
            const subtype = array.prefix;
            const subEncoder = this.getEncoder(subtype);
            return (value)=>{
                assertArgument(array.count === -1 || array.count === value.length, `array length mismatch; expected length ${array.count}`, "value", value);
                let result = value.map(subEncoder);
                if (this.#fullTypes.has(subtype)) {
                    result = result.map(keccak256);
                }
                return keccak256(concat(result));
            };
        }
        const fields = this.types[type];
        if (fields) {
            const encodedType = id(this.#fullTypes.get(type));
            return (value)=>{
                const values = fields.map(({ name , type  })=>{
                    const result = this.getEncoder(type)(value[name]);
                    if (this.#fullTypes.has(type)) {
                        return keccak256(result);
                    }
                    return result;
                });
                values.unshift(encodedType);
                return concat(values);
            };
        }
        assertArgument(false, `unknown type: ${type}`, "type", type);
    }
    encodeType(name) {
        const result = this.#fullTypes.get(name);
        assertArgument(result, `unknown type: ${JSON.stringify(name)}`, "name", name);
        return result;
    }
    encodeData(type, value) {
        return this.getEncoder(type)(value);
    }
    hashStruct(name, value) {
        return keccak256(this.encodeData(name, value));
    }
    encode(value) {
        return this.encodeData(this.primaryType, value);
    }
    hash(value) {
        return this.hashStruct(this.primaryType, value);
    }
    _visit(type, value, callback) {
        {
            const encoder = getBaseEncoder(type);
            if (encoder) {
                return callback(type, value);
            }
        }
        const array = splitArray(type).array;
        if (array) {
            assertArgument(array.count === -1 || array.count === value.length, `array length mismatch; expected length ${array.count}`, "value", value);
            return value.map((v)=>this._visit(array.prefix, v, callback));
        }
        const fields = this.types[type];
        if (fields) {
            return fields.reduce((accum, { name , type  })=>{
                accum[name] = this._visit(type, value[name], callback);
                return accum;
            }, {});
        }
        assertArgument(false, `unknown type: ${type}`, "type", type);
    }
    visit(value, callback) {
        return this._visit(this.primaryType, value, callback);
    }
    static from(types) {
        return new TypedDataEncoder(types);
    }
    static getPrimaryType(types) {
        return TypedDataEncoder.from(types).primaryType;
    }
    static hashStruct(name, types, value) {
        return TypedDataEncoder.from(types).hashStruct(name, value);
    }
    static hashDomain(domain) {
        const domainFields = [];
        for(const name in domain){
            if (domain[name] == null) {
                continue;
            }
            const type = domainFieldTypes[name];
            assertArgument(type, `invalid typed-data domain key: ${JSON.stringify(name)}`, "domain", domain);
            domainFields.push({
                name: name,
                type: type
            });
        }
        domainFields.sort((a, b)=>{
            return domainFieldNames.indexOf(a.name) - domainFieldNames.indexOf(b.name);
        });
        return TypedDataEncoder.hashStruct("EIP712Domain", {
            EIP712Domain: domainFields
        }, domain);
    }
    static encode(domain, types, value) {
        return concat([
            "0x1901",
            TypedDataEncoder.hashDomain(domain),
            TypedDataEncoder.from(types).hash(value)
        ]);
    }
    static hash(domain, types, value) {
        return keccak256(TypedDataEncoder.encode(domain, types, value));
    }
    static async resolveNames(domain, types, value, resolveName) {
        domain = Object.assign({}, domain);
        for(const key in domain){
            if (domain[key] == null) {
                delete domain[key];
            }
        }
        const ensCache = {};
        if (domain.verifyingContract && !isHexString(domain.verifyingContract, 20)) {
            ensCache[domain.verifyingContract] = "0x";
        }
        const encoder = TypedDataEncoder.from(types);
        encoder.visit(value, (type, value)=>{
            if (type === "address" && !isHexString(value, 20)) {
                ensCache[value] = "0x";
            }
            return value;
        });
        for(const name in ensCache){
            ensCache[name] = await resolveName(name);
        }
        if (domain.verifyingContract && ensCache[domain.verifyingContract]) {
            domain.verifyingContract = ensCache[domain.verifyingContract];
        }
        value = encoder.visit(value, (type, value)=>{
            if (type === "address" && ensCache[value]) {
                return ensCache[value];
            }
            return value;
        });
        return {
            domain: domain,
            value: value
        };
    }
    static getPayload(domain, types, value) {
        TypedDataEncoder.hashDomain(domain);
        const domainValues = {};
        const domainTypes = [];
        domainFieldNames.forEach((name)=>{
            const value = domain[name];
            if (value == null) {
                return;
            }
            domainValues[name] = domainChecks[name](value);
            domainTypes.push({
                name: name,
                type: domainFieldTypes[name]
            });
        });
        const encoder = TypedDataEncoder.from(types);
        types = encoder.types;
        const typesWithDomain = Object.assign({}, types);
        assertArgument(typesWithDomain.EIP712Domain == null, "types must not contain EIP712Domain type", "types.EIP712Domain", types);
        typesWithDomain.EIP712Domain = domainTypes;
        encoder.encode(value);
        return {
            types: typesWithDomain,
            domain: domainValues,
            primaryType: encoder.primaryType,
            message: encoder.visit(value, (type, value)=>{
                if (type.match(/^bytes(\d*)/)) {
                    return hexlify(getBytes(value));
                }
                if (type.match(/^u?int/)) {
                    return getBigInt(value).toString();
                }
                switch(type){
                    case "address":
                        return value.toLowerCase();
                    case "bool":
                        return !!value;
                    case "string":
                        assertArgument(typeof value === "string", "invalid string", "value", value);
                        return value;
                }
                assertArgument(false, "unsupported type", "type", type);
            })
        };
    }
}
function verifyTypedData(domain, types, value, signature) {
    return recoverAddress(TypedDataEncoder.hash(domain, types, value), signature);
}
function setify(items) {
    const result = new Set;
    items.forEach((k)=>result.add(k));
    return Object.freeze(result);
}
const _kwVisibDeploy = "external public payable override";
const KwVisibDeploy = setify(_kwVisibDeploy.split(" "));
const _kwVisib = "constant external internal payable private public pure view override";
const KwVisib = setify(_kwVisib.split(" "));
const _kwTypes = "constructor error event fallback function receive struct";
const KwTypes = setify(_kwTypes.split(" "));
const _kwModifiers = "calldata memory storage payable indexed";
const KwModifiers = setify(_kwModifiers.split(" "));
const _kwOther = "tuple returns";
const _keywords = [
    _kwTypes,
    _kwModifiers,
    _kwOther,
    _kwVisib
].join(" ");
const Keywords = setify(_keywords.split(" "));
const SimpleTokens = {
    "(": "OPEN_PAREN",
    ")": "CLOSE_PAREN",
    "[": "OPEN_BRACKET",
    "]": "CLOSE_BRACKET",
    ",": "COMMA",
    "@": "AT"
};
const regexWhitespacePrefix = new RegExp("^(\\s*)");
const regexNumberPrefix = new RegExp("^([0-9]+)");
const regexIdPrefix = new RegExp("^([a-zA-Z$_][a-zA-Z0-9$_]*)");
const regexId = new RegExp("^([a-zA-Z$_][a-zA-Z0-9$_]*)$");
const regexType = new RegExp("^(address|bool|bytes([0-9]*)|string|u?int([0-9]*))$");
class TokenString {
    #offset;
    #tokens;
    get offset() {
        return this.#offset;
    }
    get length() {
        return this.#tokens.length - this.#offset;
    }
    constructor(tokens){
        this.#offset = 0;
        this.#tokens = tokens.slice();
    }
    clone() {
        return new TokenString(this.#tokens);
    }
    reset() {
        this.#offset = 0;
    }
    #subTokenString(from = 0, to = 0) {
        return new TokenString(this.#tokens.slice(from, to).map((t)=>{
            return Object.freeze(Object.assign({}, t, {
                match: t.match - from,
                linkBack: t.linkBack - from,
                linkNext: t.linkNext - from
            }));
        }));
    }
    popKeyword(allowed) {
        const top = this.peek();
        if (top.type !== "KEYWORD" || !allowed.has(top.text)) {
            throw new Error(`expected keyword ${top.text}`);
        }
        return this.pop().text;
    }
    popType(type) {
        if (this.peek().type !== type) {
            const top = this.peek();
            throw new Error(`expected ${type}; got ${top.type} ${JSON.stringify(top.text)}`);
        }
        return this.pop().text;
    }
    popParen() {
        const top = this.peek();
        if (top.type !== "OPEN_PAREN") {
            throw new Error("bad start");
        }
        const result = this.#subTokenString(this.#offset + 1, top.match + 1);
        this.#offset = top.match + 1;
        return result;
    }
    popParams() {
        const top = this.peek();
        if (top.type !== "OPEN_PAREN") {
            throw new Error("bad start");
        }
        const result = [];
        while(this.#offset < top.match - 1){
            const link = this.peek().linkNext;
            result.push(this.#subTokenString(this.#offset + 1, link));
            this.#offset = link;
        }
        this.#offset = top.match + 1;
        return result;
    }
    peek() {
        if (this.#offset >= this.#tokens.length) {
            throw new Error("out-of-bounds");
        }
        return this.#tokens[this.#offset];
    }
    peekKeyword(allowed) {
        const top = this.peekType("KEYWORD");
        return top != null && allowed.has(top) ? top : null;
    }
    peekType(type) {
        if (this.length === 0) {
            return null;
        }
        const top = this.peek();
        return top.type === type ? top.text : null;
    }
    pop() {
        const result = this.peek();
        this.#offset++;
        return result;
    }
    toString() {
        const tokens = [];
        for(let i = this.#offset; i < this.#tokens.length; i++){
            const token = this.#tokens[i];
            tokens.push(`${token.type}:${token.text}`);
        }
        return `<TokenString ${tokens.join(" ")}>`;
    }
}
function lex(text) {
    const tokens = [];
    const throwError = (message)=>{
        const token = offset < text.length ? JSON.stringify(text[offset]) : "$EOI";
        throw new Error(`invalid token ${token} at ${offset}: ${message}`);
    };
    let brackets = [];
    let commas = [];
    let offset = 0;
    while(offset < text.length){
        let cur = text.substring(offset);
        let match = cur.match(regexWhitespacePrefix);
        if (match) {
            offset += match[1].length;
            cur = text.substring(offset);
        }
        const token = {
            depth: brackets.length,
            linkBack: -1,
            linkNext: -1,
            match: -1,
            type: "",
            text: "",
            offset: offset,
            value: -1
        };
        tokens.push(token);
        let type = SimpleTokens[cur[0]] || "";
        if (type) {
            token.type = type;
            token.text = cur[0];
            offset++;
            if (type === "OPEN_PAREN") {
                brackets.push(tokens.length - 1);
                commas.push(tokens.length - 1);
            } else if (type == "CLOSE_PAREN") {
                if (brackets.length === 0) {
                    throwError("no matching open bracket");
                }
                token.match = brackets.pop();
                tokens[token.match].match = tokens.length - 1;
                token.depth--;
                token.linkBack = commas.pop();
                tokens[token.linkBack].linkNext = tokens.length - 1;
            } else if (type === "COMMA") {
                token.linkBack = commas.pop();
                tokens[token.linkBack].linkNext = tokens.length - 1;
                commas.push(tokens.length - 1);
            } else if (type === "OPEN_BRACKET") {
                token.type = "BRACKET";
            } else if (type === "CLOSE_BRACKET") {
                let suffix = tokens.pop().text;
                if (tokens.length > 0 && tokens[tokens.length - 1].type === "NUMBER") {
                    const value = tokens.pop().text;
                    suffix = value + suffix;
                    tokens[tokens.length - 1].value = getNumber(value);
                }
                if (tokens.length === 0 || tokens[tokens.length - 1].type !== "BRACKET") {
                    throw new Error("missing opening bracket");
                }
                tokens[tokens.length - 1].text += suffix;
            }
            continue;
        }
        match = cur.match(regexIdPrefix);
        if (match) {
            token.text = match[1];
            offset += token.text.length;
            if (Keywords.has(token.text)) {
                token.type = "KEYWORD";
                continue;
            }
            if (token.text.match(regexType)) {
                token.type = "TYPE";
                continue;
            }
            token.type = "ID";
            continue;
        }
        match = cur.match(regexNumberPrefix);
        if (match) {
            token.text = match[1];
            token.type = "NUMBER";
            offset += token.text.length;
            continue;
        }
        throw new Error(`unexpected token ${JSON.stringify(cur[0])} at position ${offset}`);
    }
    return new TokenString(tokens.map((t)=>Object.freeze(t)));
}
function allowSingle(set, allowed) {
    let included = [];
    for(const key in allowed.keys()){
        if (set.has(key)) {
            included.push(key);
        }
    }
    if (included.length > 1) {
        throw new Error(`conflicting types: ${included.join(", ")}`);
    }
}
function consumeName(type, tokens) {
    if (tokens.peekKeyword(KwTypes)) {
        const keyword = tokens.pop().text;
        if (keyword !== type) {
            throw new Error(`expected ${type}, got ${keyword}`);
        }
    }
    return tokens.popType("ID");
}
function consumeKeywords(tokens, allowed) {
    const keywords = new Set;
    while(true){
        const keyword = tokens.peekType("KEYWORD");
        if (keyword == null || allowed && !allowed.has(keyword)) {
            break;
        }
        tokens.pop();
        if (keywords.has(keyword)) {
            throw new Error(`duplicate keywords: ${JSON.stringify(keyword)}`);
        }
        keywords.add(keyword);
    }
    return Object.freeze(keywords);
}
function consumeMutability(tokens) {
    let modifiers = consumeKeywords(tokens, KwVisib);
    allowSingle(modifiers, setify("constant payable nonpayable".split(" ")));
    allowSingle(modifiers, setify("pure view payable nonpayable".split(" ")));
    if (modifiers.has("view")) {
        return "view";
    }
    if (modifiers.has("pure")) {
        return "pure";
    }
    if (modifiers.has("payable")) {
        return "payable";
    }
    if (modifiers.has("nonpayable")) {
        return "nonpayable";
    }
    if (modifiers.has("constant")) {
        return "view";
    }
    return "nonpayable";
}
function consumeParams(tokens, allowIndexed) {
    return tokens.popParams().map((t)=>ParamType.from(t, allowIndexed));
}
function consumeGas(tokens) {
    if (tokens.peekType("AT")) {
        tokens.pop();
        if (tokens.peekType("NUMBER")) {
            return getBigInt(tokens.pop().text);
        }
        throw new Error("invalid gas");
    }
    return null;
}
function consumeEoi(tokens) {
    if (tokens.length) {
        throw new Error(`unexpected tokens at offset ${tokens.offset}: ${tokens.toString()}`);
    }
}
const regexArrayType = new RegExp(/^(.*)\[([0-9]*)\]$/);
function verifyBasicType(type) {
    const match = type.match(regexType);
    assertArgument(match, "invalid type", "type", type);
    if (type === "uint") {
        return "uint256";
    }
    if (type === "int") {
        return "int256";
    }
    if (match[2]) {
        const length = parseInt(match[2]);
        assertArgument(length !== 0 && length <= 32, "invalid bytes length", "type", type);
    } else if (match[3]) {
        const size = parseInt(match[3]);
        assertArgument(size !== 0 && size <= 256 && size % 8 === 0, "invalid numeric width", "type", type);
    }
    return type;
}
const _guard$2 = {};
const internal$1 = Symbol.for("_ethers_internal");
const ParamTypeInternal = "_ParamTypeInternal";
const ErrorFragmentInternal = "_ErrorInternal";
const EventFragmentInternal = "_EventInternal";
const ConstructorFragmentInternal = "_ConstructorInternal";
const FallbackFragmentInternal = "_FallbackInternal";
const FunctionFragmentInternal = "_FunctionInternal";
const StructFragmentInternal = "_StructInternal";
class ParamType {
    name;
    type;
    baseType;
    indexed;
    components;
    arrayLength;
    arrayChildren;
    constructor(guard, name, type, baseType, indexed, components, arrayLength, arrayChildren){
        assertPrivate(guard, _guard$2, "ParamType");
        Object.defineProperty(this, internal$1, {
            value: ParamTypeInternal
        });
        if (components) {
            components = Object.freeze(components.slice());
        }
        if (baseType === "array") {
            if (arrayLength == null || arrayChildren == null) {
                throw new Error("");
            }
        } else if (arrayLength != null || arrayChildren != null) {
            throw new Error("");
        }
        if (baseType === "tuple") {
            if (components == null) {
                throw new Error("");
            }
        } else if (components != null) {
            throw new Error("");
        }
        defineProperties(this, {
            name: name,
            type: type,
            baseType: baseType,
            indexed: indexed,
            components: components,
            arrayLength: arrayLength,
            arrayChildren: arrayChildren
        });
    }
    format(format) {
        if (format == null) {
            format = "sighash";
        }
        if (format === "json") {
            const name = this.name || "";
            if (this.isArray()) {
                const result = JSON.parse(this.arrayChildren.format("json"));
                result.name = name;
                result.type += `[${this.arrayLength < 0 ? "" : String(this.arrayLength)}]`;
                return JSON.stringify(result);
            }
            const result1 = {
                type: this.baseType === "tuple" ? "tuple" : this.type,
                name: name
            };
            if (typeof this.indexed === "boolean") {
                result1.indexed = this.indexed;
            }
            if (this.isTuple()) {
                result1.components = this.components.map((c)=>JSON.parse(c.format(format)));
            }
            return JSON.stringify(result1);
        }
        let result2 = "";
        if (this.isArray()) {
            result2 += this.arrayChildren.format(format);
            result2 += `[${this.arrayLength < 0 ? "" : String(this.arrayLength)}]`;
        } else {
            if (this.isTuple()) {
                result2 += "(" + this.components.map((comp)=>comp.format(format)).join(format === "full" ? ", " : ",") + ")";
            } else {
                result2 += this.type;
            }
        }
        if (format !== "sighash") {
            if (this.indexed === true) {
                result2 += " indexed";
            }
            if (format === "full" && this.name) {
                result2 += " " + this.name;
            }
        }
        return result2;
    }
    isArray() {
        return this.baseType === "array";
    }
    isTuple() {
        return this.baseType === "tuple";
    }
    isIndexable() {
        return this.indexed != null;
    }
    walk(value, process) {
        if (this.isArray()) {
            if (!Array.isArray(value)) {
                throw new Error("invalid array value");
            }
            if (this.arrayLength !== -1 && value.length !== this.arrayLength) {
                throw new Error("array is wrong length");
            }
            const _this = this;
            return value.map((v)=>_this.arrayChildren.walk(v, process));
        }
        if (this.isTuple()) {
            if (!Array.isArray(value)) {
                throw new Error("invalid tuple value");
            }
            if (value.length !== this.components.length) {
                throw new Error("array is wrong length");
            }
            const _this1 = this;
            return value.map((v, i)=>_this1.components[i].walk(v, process));
        }
        return process(this.type, value);
    }
    #walkAsync(promises, value, process, setValue) {
        if (this.isArray()) {
            if (!Array.isArray(value)) {
                throw new Error("invalid array value");
            }
            if (this.arrayLength !== -1 && value.length !== this.arrayLength) {
                throw new Error("array is wrong length");
            }
            const childType = this.arrayChildren;
            const result1 = value.slice();
            result1.forEach((value, index)=>{
                childType.#walkAsync(promises, value, process, (value)=>{
                    result1[index] = value;
                });
            });
            setValue(result1);
            return;
        }
        if (this.isTuple()) {
            const components = this.components;
            let result2;
            if (Array.isArray(value)) {
                result2 = value.slice();
            } else {
                if (value == null || typeof value !== "object") {
                    throw new Error("invalid tuple value");
                }
                result2 = components.map((param)=>{
                    if (!param.name) {
                        throw new Error("cannot use object value with unnamed components");
                    }
                    if (!(param.name in value)) {
                        throw new Error(`missing value for component ${param.name}`);
                    }
                    return value[param.name];
                });
            }
            if (result2.length !== this.components.length) {
                throw new Error("array is wrong length");
            }
            result2.forEach((value, index)=>{
                components[index].#walkAsync(promises, value, process, (value)=>{
                    result2[index] = value;
                });
            });
            setValue(result2);
            return;
        }
        const result3 = process(this.type, value);
        if (result3.then) {
            promises.push(async function() {
                setValue(await result3);
            }());
        } else {
            setValue(result3);
        }
    }
    async walkAsync(value, process) {
        const promises = [];
        const result = [
            value
        ];
        this.#walkAsync(promises, value, process, (value)=>{
            result[0] = value;
        });
        if (promises.length) {
            await Promise.all(promises);
        }
        return result[0];
    }
    static from(obj, allowIndexed) {
        if (ParamType.isParamType(obj)) {
            return obj;
        }
        if (typeof obj === "string") {
            try {
                return ParamType.from(lex(obj), allowIndexed);
            } catch (error) {
                assertArgument(false, "invalid param type", "obj", obj);
            }
        } else if (obj instanceof TokenString) {
            let type = "", baseType = "";
            let comps = null;
            if (consumeKeywords(obj, setify([
                "tuple"
            ])).has("tuple") || obj.peekType("OPEN_PAREN")) {
                baseType = "tuple";
                comps = obj.popParams().map((t)=>ParamType.from(t));
                type = `tuple(${comps.map((c)=>c.format()).join(",")})`;
            } else {
                type = verifyBasicType(obj.popType("TYPE"));
                baseType = type;
            }
            let arrayChildren = null;
            let arrayLength = null;
            while(obj.length && obj.peekType("BRACKET")){
                const bracket = obj.pop();
                arrayChildren = new ParamType(_guard$2, "", type, baseType, null, comps, arrayLength, arrayChildren);
                arrayLength = bracket.value;
                type += bracket.text;
                baseType = "array";
                comps = null;
            }
            let indexed = null;
            const keywords = consumeKeywords(obj, KwModifiers);
            if (keywords.has("indexed")) {
                if (!allowIndexed) {
                    throw new Error("");
                }
                indexed = true;
            }
            const name = obj.peekType("ID") ? obj.pop().text : "";
            if (obj.length) {
                throw new Error("leftover tokens");
            }
            return new ParamType(_guard$2, name, type, baseType, indexed, comps, arrayLength, arrayChildren);
        }
        const name1 = obj.name;
        assertArgument(!name1 || typeof name1 === "string" && name1.match(regexId), "invalid name", "obj.name", name1);
        let indexed1 = obj.indexed;
        if (indexed1 != null) {
            assertArgument(allowIndexed, "parameter cannot be indexed", "obj.indexed", obj.indexed);
            indexed1 = !!indexed1;
        }
        let type1 = obj.type;
        let arrayMatch = type1.match(regexArrayType);
        if (arrayMatch) {
            const arrayLength1 = parseInt(arrayMatch[2] || "-1");
            const arrayChildren1 = ParamType.from({
                type: arrayMatch[1],
                components: obj.components
            });
            return new ParamType(_guard$2, name1 || "", type1, "array", indexed1, null, arrayLength1, arrayChildren1);
        }
        if (type1 === "tuple" || type1.startsWith("tuple(") || type1.startsWith("(")) {
            const comps1 = obj.components != null ? obj.components.map((c)=>ParamType.from(c)) : null;
            const tuple = new ParamType(_guard$2, name1 || "", type1, "tuple", indexed1, comps1, null, null);
            return tuple;
        }
        type1 = verifyBasicType(obj.type);
        return new ParamType(_guard$2, name1 || "", type1, type1, indexed1, null, null, null);
    }
    static isParamType(value) {
        return value && value[internal$1] === ParamTypeInternal;
    }
}
class Fragment {
    type;
    inputs;
    constructor(guard, type, inputs){
        assertPrivate(guard, _guard$2, "Fragment");
        inputs = Object.freeze(inputs.slice());
        defineProperties(this, {
            type: type,
            inputs: inputs
        });
    }
    static from(obj) {
        if (typeof obj === "string") {
            try {
                Fragment.from(JSON.parse(obj));
            } catch (e) {}
            return Fragment.from(lex(obj));
        }
        if (obj instanceof TokenString) {
            const type = obj.peekKeyword(KwTypes);
            switch(type){
                case "constructor":
                    return ConstructorFragment.from(obj);
                case "error":
                    return ErrorFragment.from(obj);
                case "event":
                    return EventFragment.from(obj);
                case "fallback":
                case "receive":
                    return FallbackFragment.from(obj);
                case "function":
                    return FunctionFragment.from(obj);
                case "struct":
                    return StructFragment.from(obj);
            }
        } else if (typeof obj === "object") {
            switch(obj.type){
                case "constructor":
                    return ConstructorFragment.from(obj);
                case "error":
                    return ErrorFragment.from(obj);
                case "event":
                    return EventFragment.from(obj);
                case "fallback":
                case "receive":
                    return FallbackFragment.from(obj);
                case "function":
                    return FunctionFragment.from(obj);
                case "struct":
                    return StructFragment.from(obj);
            }
            assert1(false, `unsupported type: ${obj.type}`, "UNSUPPORTED_OPERATION", {
                operation: "Fragment.from"
            });
        }
        assertArgument(false, "unsupported frgament object", "obj", obj);
    }
    static isConstructor(value) {
        return ConstructorFragment.isFragment(value);
    }
    static isError(value) {
        return ErrorFragment.isFragment(value);
    }
    static isEvent(value) {
        return EventFragment.isFragment(value);
    }
    static isFunction(value) {
        return FunctionFragment.isFragment(value);
    }
    static isStruct(value) {
        return StructFragment.isFragment(value);
    }
}
class NamedFragment extends Fragment {
    name;
    constructor(guard, type, name, inputs){
        super(guard, type, inputs);
        assertArgument(typeof name === "string" && name.match(regexId), "invalid identifier", "name", name);
        inputs = Object.freeze(inputs.slice());
        defineProperties(this, {
            name: name
        });
    }
}
function joinParams(format, params) {
    return "(" + params.map((p)=>p.format(format)).join(format === "full" ? ", " : ",") + ")";
}
class ErrorFragment extends NamedFragment {
    constructor(guard, name, inputs){
        super(guard, "error", name, inputs);
        Object.defineProperty(this, internal$1, {
            value: ErrorFragmentInternal
        });
    }
    get selector() {
        return id(this.format("sighash")).substring(0, 10);
    }
    format(format) {
        if (format == null) {
            format = "sighash";
        }
        if (format === "json") {
            return JSON.stringify({
                type: "error",
                name: this.name,
                inputs: this.inputs.map((input)=>JSON.parse(input.format(format)))
            });
        }
        const result = [];
        if (format !== "sighash") {
            result.push("error");
        }
        result.push(this.name + joinParams(format, this.inputs));
        return result.join(" ");
    }
    static from(obj) {
        if (ErrorFragment.isFragment(obj)) {
            return obj;
        }
        if (typeof obj === "string") {
            return ErrorFragment.from(lex(obj));
        } else if (obj instanceof TokenString) {
            const name = consumeName("error", obj);
            const inputs = consumeParams(obj);
            consumeEoi(obj);
            return new ErrorFragment(_guard$2, name, inputs);
        }
        return new ErrorFragment(_guard$2, obj.name, obj.inputs ? obj.inputs.map(ParamType.from) : []);
    }
    static isFragment(value) {
        return value && value[internal$1] === ErrorFragmentInternal;
    }
}
class EventFragment extends NamedFragment {
    anonymous;
    constructor(guard, name, inputs, anonymous){
        super(guard, "event", name, inputs);
        Object.defineProperty(this, internal$1, {
            value: EventFragmentInternal
        });
        defineProperties(this, {
            anonymous: anonymous
        });
    }
    get topicHash() {
        return id(this.format("sighash"));
    }
    format(format) {
        if (format == null) {
            format = "sighash";
        }
        if (format === "json") {
            return JSON.stringify({
                type: "event",
                anonymous: this.anonymous,
                name: this.name,
                inputs: this.inputs.map((i)=>JSON.parse(i.format(format)))
            });
        }
        const result = [];
        if (format !== "sighash") {
            result.push("event");
        }
        result.push(this.name + joinParams(format, this.inputs));
        if (format !== "sighash" && this.anonymous) {
            result.push("anonymous");
        }
        return result.join(" ");
    }
    static getTopicHash(name, params) {
        params = (params || []).map((p)=>ParamType.from(p));
        const fragment = new EventFragment(_guard$2, name, params, false);
        return fragment.topicHash;
    }
    static from(obj) {
        if (EventFragment.isFragment(obj)) {
            return obj;
        }
        if (typeof obj === "string") {
            try {
                return EventFragment.from(lex(obj));
            } catch (error) {
                assertArgument(false, "invalid event fragment", "obj", obj);
            }
        } else if (obj instanceof TokenString) {
            const name = consumeName("event", obj);
            const inputs = consumeParams(obj, true);
            const anonymous = !!consumeKeywords(obj, setify([
                "anonymous"
            ])).has("anonymous");
            consumeEoi(obj);
            return new EventFragment(_guard$2, name, inputs, anonymous);
        }
        return new EventFragment(_guard$2, obj.name, obj.inputs ? obj.inputs.map((p)=>ParamType.from(p, true)) : [], !!obj.anonymous);
    }
    static isFragment(value) {
        return value && value[internal$1] === EventFragmentInternal;
    }
}
class ConstructorFragment extends Fragment {
    payable;
    gas;
    constructor(guard, type, inputs, payable, gas){
        super(guard, type, inputs);
        Object.defineProperty(this, internal$1, {
            value: ConstructorFragmentInternal
        });
        defineProperties(this, {
            payable: payable,
            gas: gas
        });
    }
    format(format) {
        assert1(format != null && format !== "sighash", "cannot format a constructor for sighash", "UNSUPPORTED_OPERATION", {
            operation: "format(sighash)"
        });
        if (format === "json") {
            return JSON.stringify({
                type: "constructor",
                stateMutability: this.payable ? "payable" : "undefined",
                payable: this.payable,
                gas: this.gas != null ? this.gas : undefined,
                inputs: this.inputs.map((i)=>JSON.parse(i.format(format)))
            });
        }
        const result = [
            `constructor${joinParams(format, this.inputs)}`
        ];
        if (this.payable) {
            result.push("payable");
        }
        if (this.gas != null) {
            result.push(`@${this.gas.toString()}`);
        }
        return result.join(" ");
    }
    static from(obj) {
        if (ConstructorFragment.isFragment(obj)) {
            return obj;
        }
        if (typeof obj === "string") {
            try {
                return ConstructorFragment.from(lex(obj));
            } catch (error) {
                assertArgument(false, "invalid constuctor fragment", "obj", obj);
            }
        } else if (obj instanceof TokenString) {
            consumeKeywords(obj, setify([
                "constructor"
            ]));
            const inputs = consumeParams(obj);
            const payable = !!consumeKeywords(obj, KwVisibDeploy).has("payable");
            const gas = consumeGas(obj);
            consumeEoi(obj);
            return new ConstructorFragment(_guard$2, "constructor", inputs, payable, gas);
        }
        return new ConstructorFragment(_guard$2, "constructor", obj.inputs ? obj.inputs.map(ParamType.from) : [], !!obj.payable, obj.gas != null ? obj.gas : null);
    }
    static isFragment(value) {
        return value && value[internal$1] === ConstructorFragmentInternal;
    }
}
class FallbackFragment extends Fragment {
    payable;
    constructor(guard, inputs, payable){
        super(guard, "fallback", inputs);
        Object.defineProperty(this, internal$1, {
            value: FallbackFragmentInternal
        });
        defineProperties(this, {
            payable: payable
        });
    }
    format(format) {
        const type = this.inputs.length === 0 ? "receive" : "fallback";
        if (format === "json") {
            const stateMutability = this.payable ? "payable" : "nonpayable";
            return JSON.stringify({
                type: type,
                stateMutability: stateMutability
            });
        }
        return `${type}()${this.payable ? " payable" : ""}`;
    }
    static from(obj) {
        if (FallbackFragment.isFragment(obj)) {
            return obj;
        }
        if (typeof obj === "string") {
            try {
                return FallbackFragment.from(lex(obj));
            } catch (error) {
                assertArgument(false, "invalid fallback fragment", "obj", obj);
            }
        } else if (obj instanceof TokenString) {
            const errorObj = obj.toString();
            const topIsValid = obj.peekKeyword(setify([
                "fallback",
                "receive"
            ]));
            assertArgument(topIsValid, "type must be fallback or receive", "obj", errorObj);
            const type = obj.popKeyword(setify([
                "fallback",
                "receive"
            ]));
            if (type === "receive") {
                const inputs = consumeParams(obj);
                assertArgument(inputs.length === 0, `receive cannot have arguments`, "obj.inputs", inputs);
                consumeKeywords(obj, setify([
                    "payable"
                ]));
                consumeEoi(obj);
                return new FallbackFragment(_guard$2, [], true);
            }
            let inputs1 = consumeParams(obj);
            if (inputs1.length) {
                assertArgument(inputs1.length === 1 && inputs1[0].type === "bytes", "invalid fallback inputs", "obj.inputs", inputs1.map((i)=>i.format("minimal")).join(", "));
            } else {
                inputs1 = [
                    ParamType.from("bytes")
                ];
            }
            const mutability = consumeMutability(obj);
            assertArgument(mutability === "nonpayable" || mutability === "payable", "fallback cannot be constants", "obj.stateMutability", mutability);
            if (consumeKeywords(obj, setify([
                "returns"
            ])).has("returns")) {
                const outputs = consumeParams(obj);
                assertArgument(outputs.length === 1 && outputs[0].type === "bytes", "invalid fallback outputs", "obj.outputs", outputs.map((i)=>i.format("minimal")).join(", "));
            }
            consumeEoi(obj);
            return new FallbackFragment(_guard$2, inputs1, mutability === "payable");
        }
        if (obj.type === "receive") {
            return new FallbackFragment(_guard$2, [], true);
        }
        if (obj.type === "fallback") {
            const inputs2 = [
                ParamType.from("bytes")
            ];
            const payable = obj.stateMutability === "payable";
            return new FallbackFragment(_guard$2, inputs2, payable);
        }
        assertArgument(false, "invalid fallback description", "obj", obj);
    }
    static isFragment(value) {
        return value && value[internal$1] === FallbackFragmentInternal;
    }
}
class FunctionFragment extends NamedFragment {
    constant;
    outputs;
    stateMutability;
    payable;
    gas;
    constructor(guard, name, stateMutability, inputs, outputs, gas){
        super(guard, "function", name, inputs);
        Object.defineProperty(this, internal$1, {
            value: FunctionFragmentInternal
        });
        outputs = Object.freeze(outputs.slice());
        const constant = stateMutability === "view" || stateMutability === "pure";
        const payable = stateMutability === "payable";
        defineProperties(this, {
            constant: constant,
            gas: gas,
            outputs: outputs,
            payable: payable,
            stateMutability: stateMutability
        });
    }
    get selector() {
        return id(this.format("sighash")).substring(0, 10);
    }
    format(format) {
        if (format == null) {
            format = "sighash";
        }
        if (format === "json") {
            return JSON.stringify({
                type: "function",
                name: this.name,
                constant: this.constant,
                stateMutability: this.stateMutability !== "nonpayable" ? this.stateMutability : undefined,
                payable: this.payable,
                gas: this.gas != null ? this.gas : undefined,
                inputs: this.inputs.map((i)=>JSON.parse(i.format(format))),
                outputs: this.outputs.map((o)=>JSON.parse(o.format(format)))
            });
        }
        const result = [];
        if (format !== "sighash") {
            result.push("function");
        }
        result.push(this.name + joinParams(format, this.inputs));
        if (format !== "sighash") {
            if (this.stateMutability !== "nonpayable") {
                result.push(this.stateMutability);
            }
            if (this.outputs && this.outputs.length) {
                result.push("returns");
                result.push(joinParams(format, this.outputs));
            }
            if (this.gas != null) {
                result.push(`@${this.gas.toString()}`);
            }
        }
        return result.join(" ");
    }
    static getSelector(name, params) {
        params = (params || []).map((p)=>ParamType.from(p));
        const fragment = new FunctionFragment(_guard$2, name, "view", params, [], null);
        return fragment.selector;
    }
    static from(obj) {
        if (FunctionFragment.isFragment(obj)) {
            return obj;
        }
        if (typeof obj === "string") {
            try {
                return FunctionFragment.from(lex(obj));
            } catch (error) {
                assertArgument(false, "invalid function fragment", "obj", obj);
            }
        } else if (obj instanceof TokenString) {
            const name = consumeName("function", obj);
            const inputs = consumeParams(obj);
            const mutability = consumeMutability(obj);
            let outputs = [];
            if (consumeKeywords(obj, setify([
                "returns"
            ])).has("returns")) {
                outputs = consumeParams(obj);
            }
            const gas = consumeGas(obj);
            consumeEoi(obj);
            return new FunctionFragment(_guard$2, name, mutability, inputs, outputs, gas);
        }
        let stateMutability = obj.stateMutability;
        if (stateMutability == null) {
            stateMutability = "payable";
            if (typeof obj.constant === "boolean") {
                stateMutability = "view";
                if (!obj.constant) {
                    stateMutability = "payable";
                    if (typeof obj.payable === "boolean" && !obj.payable) {
                        stateMutability = "nonpayable";
                    }
                }
            } else if (typeof obj.payable === "boolean" && !obj.payable) {
                stateMutability = "nonpayable";
            }
        }
        return new FunctionFragment(_guard$2, obj.name, stateMutability, obj.inputs ? obj.inputs.map(ParamType.from) : [], obj.outputs ? obj.outputs.map(ParamType.from) : [], obj.gas != null ? obj.gas : null);
    }
    static isFragment(value) {
        return value && value[internal$1] === FunctionFragmentInternal;
    }
}
class StructFragment extends NamedFragment {
    constructor(guard, name, inputs){
        super(guard, "struct", name, inputs);
        Object.defineProperty(this, internal$1, {
            value: StructFragmentInternal
        });
    }
    format() {
        throw new Error("@TODO");
    }
    static from(obj) {
        if (typeof obj === "string") {
            try {
                return StructFragment.from(lex(obj));
            } catch (error) {
                assertArgument(false, "invalid struct fragment", "obj", obj);
            }
        } else if (obj instanceof TokenString) {
            const name = consumeName("struct", obj);
            const inputs = consumeParams(obj);
            consumeEoi(obj);
            return new StructFragment(_guard$2, name, inputs);
        }
        return new StructFragment(_guard$2, obj.name, obj.inputs ? obj.inputs.map(ParamType.from) : []);
    }
    static isFragment(value) {
        return value && value[internal$1] === StructFragmentInternal;
    }
}
const PanicReasons$1 = new Map;
PanicReasons$1.set(0, "GENERIC_PANIC");
PanicReasons$1.set(1, "ASSERT_FALSE");
PanicReasons$1.set(17, "OVERFLOW");
PanicReasons$1.set(18, "DIVIDE_BY_ZERO");
PanicReasons$1.set(33, "ENUM_RANGE_ERROR");
PanicReasons$1.set(34, "BAD_STORAGE_DATA");
PanicReasons$1.set(49, "STACK_UNDERFLOW");
PanicReasons$1.set(50, "ARRAY_RANGE_ERROR");
PanicReasons$1.set(65, "OUT_OF_MEMORY");
PanicReasons$1.set(81, "UNINITIALIZED_FUNCTION_CALL");
const paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);
let defaultCoder = null;
let defaultMaxInflation = 1024;
function getBuiltinCallException(action, tx, data, abiCoder) {
    let message = "missing revert data";
    let reason = null;
    let revert = null;
    if (data) {
        message = "execution reverted";
        const bytes = getBytes(data);
        data = hexlify(data);
        if (bytes.length === 0) {
            message += " (no data present; likely require(false) occurred";
            reason = "require(false)";
        } else if (bytes.length % 32 !== 4) {
            message += " (could not decode reason; invalid data length)";
        } else if (hexlify(bytes.slice(0, 4)) === "0x08c379a0") {
            try {
                reason = abiCoder.decode([
                    "string"
                ], bytes.slice(4))[0];
                revert = {
                    signature: "Error(string)",
                    name: "Error",
                    args: [
                        reason
                    ]
                };
                message += `: ${JSON.stringify(reason)}`;
            } catch (error) {
                message += " (could not decode reason; invalid string data)";
            }
        } else if (hexlify(bytes.slice(0, 4)) === "0x4e487b71") {
            try {
                const code = Number(abiCoder.decode([
                    "uint256"
                ], bytes.slice(4))[0]);
                revert = {
                    signature: "Panic(uint256)",
                    name: "Panic",
                    args: [
                        code
                    ]
                };
                reason = `Panic due to ${PanicReasons$1.get(code) || "UNKNOWN"}(${code})`;
                message += `: ${reason}`;
            } catch (error1) {
                message += " (could not decode panic code)";
            }
        } else {
            message += " (unknown custom error)";
        }
    }
    const transaction = {
        to: tx.to ? getAddress(tx.to) : null,
        data: tx.data || "0x"
    };
    if (tx.from) {
        transaction.from = getAddress(tx.from);
    }
    return makeError(message, "CALL_EXCEPTION", {
        action: action,
        data: data,
        reason: reason,
        transaction: transaction,
        invocation: null,
        revert: revert
    });
}
class AbiCoder {
    #getCoder(param) {
        if (param.isArray()) {
            return new ArrayCoder(this.#getCoder(param.arrayChildren), param.arrayLength, param.name);
        }
        if (param.isTuple()) {
            return new TupleCoder(param.components.map((c)=>this.#getCoder(c)), param.name);
        }
        switch(param.baseType){
            case "address":
                return new AddressCoder(param.name);
            case "bool":
                return new BooleanCoder(param.name);
            case "string":
                return new StringCoder(param.name);
            case "bytes":
                return new BytesCoder(param.name);
            case "":
                return new NullCoder(param.name);
        }
        let match = param.type.match(paramTypeNumber);
        if (match) {
            let size = parseInt(match[2] || "256");
            assertArgument(size !== 0 && size <= 256 && size % 8 === 0, "invalid " + match[1] + " bit length", "param", param);
            return new NumberCoder(size / 8, match[1] === "int", param.name);
        }
        match = param.type.match(paramTypeBytes);
        if (match) {
            let size1 = parseInt(match[1]);
            assertArgument(size1 !== 0 && size1 <= 32, "invalid bytes length", "param", param);
            return new FixedBytesCoder(size1, param.name);
        }
        assertArgument(false, "invalid type", "type", param.type);
    }
    getDefaultValue(types) {
        const coders = types.map((type)=>this.#getCoder(ParamType.from(type)));
        const coder = new TupleCoder(coders, "_");
        return coder.defaultValue();
    }
    encode(types, values) {
        assertArgumentCount(values.length, types.length, "types/values length mismatch");
        const coders = types.map((type)=>this.#getCoder(ParamType.from(type)));
        const coder = new TupleCoder(coders, "_");
        const writer = new Writer;
        coder.encode(writer, values);
        return writer.data;
    }
    decode(types, data, loose) {
        const coders = types.map((type)=>this.#getCoder(ParamType.from(type)));
        const coder = new TupleCoder(coders, "_");
        return coder.decode(new Reader(data, loose, defaultMaxInflation));
    }
    static _setDefaultMaxInflation(value) {
        assertArgument(typeof value === "number" && Number.isInteger(value), "invalid defaultMaxInflation factor", "value", value);
        defaultMaxInflation = value;
    }
    static defaultAbiCoder() {
        if (defaultCoder == null) {
            defaultCoder = new AbiCoder;
        }
        return defaultCoder;
    }
    static getBuiltinCallException(action, tx, data) {
        return getBuiltinCallException(action, tx, data, AbiCoder.defaultAbiCoder());
    }
}
function encodeBytes32String(text) {
    const bytes = toUtf8Bytes(text);
    if (bytes.length > 31) {
        throw new Error("bytes32 string must be less than 32 bytes");
    }
    return zeroPadBytes(bytes, 32);
}
function decodeBytes32String(_bytes) {
    const data = getBytes(_bytes, "bytes");
    if (data.length !== 32) {
        throw new Error("invalid bytes32 - not 32 bytes long");
    }
    if (data[31] !== 0) {
        throw new Error("invalid bytes32 string - no null terminator");
    }
    let length = 31;
    while(data[length - 1] === 0){
        length--;
    }
    return toUtf8String(data.slice(0, length));
}
class LogDescription {
    fragment;
    name;
    signature;
    topic;
    args;
    constructor(fragment, topic, args){
        const name = fragment.name, signature = fragment.format();
        defineProperties(this, {
            fragment: fragment,
            name: name,
            signature: signature,
            topic: topic,
            args: args
        });
    }
}
class TransactionDescription {
    fragment;
    name;
    args;
    signature;
    selector;
    value;
    constructor(fragment, selector, args, value){
        const name = fragment.name, signature = fragment.format();
        defineProperties(this, {
            fragment: fragment,
            name: name,
            args: args,
            signature: signature,
            selector: selector,
            value: value
        });
    }
}
class ErrorDescription {
    fragment;
    name;
    args;
    signature;
    selector;
    constructor(fragment, selector, args){
        const name = fragment.name, signature = fragment.format();
        defineProperties(this, {
            fragment: fragment,
            name: name,
            args: args,
            signature: signature,
            selector: selector
        });
    }
}
class Indexed {
    hash;
    _isIndexed;
    static isIndexed(value) {
        return !!(value && value._isIndexed);
    }
    constructor(hash){
        defineProperties(this, {
            hash: hash,
            _isIndexed: true
        });
    }
}
const PanicReasons = {
    0: "generic panic",
    1: "assert(false)",
    17: "arithmetic overflow",
    18: "division or modulo by zero",
    33: "enum overflow",
    34: "invalid encoded storage byte array accessed",
    49: "out-of-bounds array access; popping on an empty array",
    50: "out-of-bounds access of an array or bytesN",
    65: "out of memory",
    81: "uninitialized function"
};
const BuiltinErrors = {
    "0x08c379a0": {
        signature: "Error(string)",
        name: "Error",
        inputs: [
            "string"
        ],
        reason: (message)=>{
            return `reverted with reason string ${JSON.stringify(message)}`;
        }
    },
    "0x4e487b71": {
        signature: "Panic(uint256)",
        name: "Panic",
        inputs: [
            "uint256"
        ],
        reason: (code)=>{
            let reason = "unknown panic code";
            if (code >= 0 && code <= 255 && PanicReasons[code.toString()]) {
                reason = PanicReasons[code.toString()];
            }
            return `reverted with panic code 0x${code.toString(16)} (${reason})`;
        }
    }
};
class Interface {
    fragments;
    deploy;
    fallback;
    receive;
    #errors;
    #events;
    #functions;
    #abiCoder;
    constructor(fragments){
        let abi = [];
        if (typeof fragments === "string") {
            abi = JSON.parse(fragments);
        } else {
            abi = fragments;
        }
        this.#functions = new Map;
        this.#errors = new Map;
        this.#events = new Map;
        const frags = [];
        for (const a of abi){
            try {
                frags.push(Fragment.from(a));
            } catch (error) {
                console.log(`[Warning] Invalid Fragment ${JSON.stringify(a)}:`, error.message);
            }
        }
        defineProperties(this, {
            fragments: Object.freeze(frags)
        });
        let fallback = null;
        let receive = false;
        this.#abiCoder = this.getAbiCoder();
        this.fragments.forEach((fragment, index)=>{
            let bucket;
            switch(fragment.type){
                case "constructor":
                    if (this.deploy) {
                        console.log("duplicate definition - constructor");
                        return;
                    }
                    defineProperties(this, {
                        deploy: fragment
                    });
                    return;
                case "fallback":
                    if (fragment.inputs.length === 0) {
                        receive = true;
                    } else {
                        assertArgument(!fallback || fragment.payable !== fallback.payable, "conflicting fallback fragments", `fragments[${index}]`, fragment);
                        fallback = fragment;
                        receive = fallback.payable;
                    }
                    return;
                case "function":
                    bucket = this.#functions;
                    break;
                case "event":
                    bucket = this.#events;
                    break;
                case "error":
                    bucket = this.#errors;
                    break;
                default:
                    return;
            }
            const signature = fragment.format();
            if (bucket.has(signature)) {
                return;
            }
            bucket.set(signature, fragment);
        });
        if (!this.deploy) {
            defineProperties(this, {
                deploy: ConstructorFragment.from("constructor()")
            });
        }
        defineProperties(this, {
            fallback: fallback,
            receive: receive
        });
    }
    format(minimal) {
        const format = minimal ? "minimal" : "full";
        const abi = this.fragments.map((f)=>f.format(format));
        return abi;
    }
    formatJson() {
        const abi = this.fragments.map((f)=>f.format("json"));
        return JSON.stringify(abi.map((j)=>JSON.parse(j)));
    }
    getAbiCoder() {
        return AbiCoder.defaultAbiCoder();
    }
    #getFunction(key, values, forceUnique) {
        if (isHexString(key)) {
            const selector = key.toLowerCase();
            for (const fragment of this.#functions.values()){
                if (selector === fragment.selector) {
                    return fragment;
                }
            }
            return null;
        }
        if (key.indexOf("(") === -1) {
            const matching = [];
            for (const [name, fragment1] of this.#functions){
                if (name.split("(")[0] === key) {
                    matching.push(fragment1);
                }
            }
            if (values) {
                const lastValue = values.length > 0 ? values[values.length - 1] : null;
                let valueLength = values.length;
                let allowOptions = true;
                if (Typed.isTyped(lastValue) && lastValue.type === "overrides") {
                    allowOptions = false;
                    valueLength--;
                }
                for(let i3 = matching.length - 1; i3 >= 0; i3--){
                    const inputs = matching[i3].inputs.length;
                    if (inputs !== valueLength && (!allowOptions || inputs !== valueLength - 1)) {
                        matching.splice(i3, 1);
                    }
                }
                for(let i4 = matching.length - 1; i4 >= 0; i4--){
                    const inputs1 = matching[i4].inputs;
                    for(let j2 = 0; j2 < values.length; j2++){
                        if (!Typed.isTyped(values[j2])) {
                            continue;
                        }
                        if (j2 >= inputs1.length) {
                            if (values[j2].type === "overrides") {
                                continue;
                            }
                            matching.splice(i4, 1);
                            break;
                        }
                        if (values[j2].type !== inputs1[j2].baseType) {
                            matching.splice(i4, 1);
                            break;
                        }
                    }
                }
            }
            if (matching.length === 1 && values && values.length !== matching[0].inputs.length) {
                const lastArg = values[values.length - 1];
                if (lastArg == null || Array.isArray(lastArg) || typeof lastArg !== "object") {
                    matching.splice(0, 1);
                }
            }
            if (matching.length === 0) {
                return null;
            }
            if (matching.length > 1 && forceUnique) {
                const matchStr = matching.map((m)=>JSON.stringify(m.format())).join(", ");
                assertArgument(false, `ambiguous function description (i.e. matches ${matchStr})`, "key", key);
            }
            return matching[0];
        }
        const result4 = this.#functions.get(FunctionFragment.from(key).format());
        if (result4) {
            return result4;
        }
        return null;
    }
    getFunctionName(key) {
        const fragment = this.#getFunction(key, null, false);
        assertArgument(fragment, "no matching function", "key", key);
        return fragment.name;
    }
    hasFunction(key) {
        return !!this.#getFunction(key, null, false);
    }
    getFunction(key, values) {
        return this.#getFunction(key, values || null, true);
    }
    forEachFunction(callback) {
        const names = Array.from(this.#functions.keys());
        names.sort((a, b)=>a.localeCompare(b));
        for(let i = 0; i < names.length; i++){
            const name = names[i];
            callback(this.#functions.get(name), i);
        }
    }
    #getEvent(key1, values1, forceUnique1) {
        if (isHexString(key1)) {
            const eventTopic = key1.toLowerCase();
            for (const fragment2 of this.#events.values()){
                if (eventTopic === fragment2.topicHash) {
                    return fragment2;
                }
            }
            return null;
        }
        if (key1.indexOf("(") === -1) {
            const matching1 = [];
            for (const [name1, fragment3] of this.#events){
                if (name1.split("(")[0] === key1) {
                    matching1.push(fragment3);
                }
            }
            if (values1) {
                for(let i5 = matching1.length - 1; i5 >= 0; i5--){
                    if (matching1[i5].inputs.length < values1.length) {
                        matching1.splice(i5, 1);
                    }
                }
                for(let i6 = matching1.length - 1; i6 >= 0; i6--){
                    const inputs2 = matching1[i6].inputs;
                    for(let j3 = 0; j3 < values1.length; j3++){
                        if (!Typed.isTyped(values1[j3])) {
                            continue;
                        }
                        if (values1[j3].type !== inputs2[j3].baseType) {
                            matching1.splice(i6, 1);
                            break;
                        }
                    }
                }
            }
            if (matching1.length === 0) {
                return null;
            }
            if (matching1.length > 1 && forceUnique1) {
                const matchStr1 = matching1.map((m)=>JSON.stringify(m.format())).join(", ");
                assertArgument(false, `ambiguous event description (i.e. matches ${matchStr1})`, "key", key1);
            }
            return matching1[0];
        }
        const result5 = this.#events.get(EventFragment.from(key1).format());
        if (result5) {
            return result5;
        }
        return null;
    }
    getEventName(key) {
        const fragment = this.#getEvent(key, null, false);
        assertArgument(fragment, "no matching event", "key", key);
        return fragment.name;
    }
    hasEvent(key) {
        return !!this.#getEvent(key, null, false);
    }
    getEvent(key, values) {
        return this.#getEvent(key, values || null, true);
    }
    forEachEvent(callback) {
        const names = Array.from(this.#events.keys());
        names.sort((a, b)=>a.localeCompare(b));
        for(let i = 0; i < names.length; i++){
            const name = names[i];
            callback(this.#events.get(name), i);
        }
    }
    getError(key, values) {
        if (isHexString(key)) {
            const selector = key.toLowerCase();
            if (BuiltinErrors[selector]) {
                return ErrorFragment.from(BuiltinErrors[selector].signature);
            }
            for (const fragment of this.#errors.values()){
                if (selector === fragment.selector) {
                    return fragment;
                }
            }
            return null;
        }
        if (key.indexOf("(") === -1) {
            const matching = [];
            for (const [name, fragment1] of this.#errors){
                if (name.split("(")[0] === key) {
                    matching.push(fragment1);
                }
            }
            if (matching.length === 0) {
                if (key === "Error") {
                    return ErrorFragment.from("error Error(string)");
                }
                if (key === "Panic") {
                    return ErrorFragment.from("error Panic(uint256)");
                }
                return null;
            } else if (matching.length > 1) {
                const matchStr = matching.map((m)=>JSON.stringify(m.format())).join(", ");
                assertArgument(false, `ambiguous error description (i.e. ${matchStr})`, "name", key);
            }
            return matching[0];
        }
        key = ErrorFragment.from(key).format();
        if (key === "Error(string)") {
            return ErrorFragment.from("error Error(string)");
        }
        if (key === "Panic(uint256)") {
            return ErrorFragment.from("error Panic(uint256)");
        }
        const result = this.#errors.get(key);
        if (result) {
            return result;
        }
        return null;
    }
    forEachError(callback) {
        const names = Array.from(this.#errors.keys());
        names.sort((a, b)=>a.localeCompare(b));
        for(let i = 0; i < names.length; i++){
            const name = names[i];
            callback(this.#errors.get(name), i);
        }
    }
    _decodeParams(params, data) {
        return this.#abiCoder.decode(params, data);
    }
    _encodeParams(params, values) {
        return this.#abiCoder.encode(params, values);
    }
    encodeDeploy(values) {
        return this._encodeParams(this.deploy.inputs, values || []);
    }
    decodeErrorResult(fragment, data) {
        if (typeof fragment === "string") {
            const f = this.getError(fragment);
            assertArgument(f, "unknown error", "fragment", fragment);
            fragment = f;
        }
        assertArgument(dataSlice(data, 0, 4) === fragment.selector, `data signature does not match error ${fragment.name}.`, "data", data);
        return this._decodeParams(fragment.inputs, dataSlice(data, 4));
    }
    encodeErrorResult(fragment, values) {
        if (typeof fragment === "string") {
            const f = this.getError(fragment);
            assertArgument(f, "unknown error", "fragment", fragment);
            fragment = f;
        }
        return concat([
            fragment.selector,
            this._encodeParams(fragment.inputs, values || [])
        ]);
    }
    decodeFunctionData(fragment, data) {
        if (typeof fragment === "string") {
            const f = this.getFunction(fragment);
            assertArgument(f, "unknown function", "fragment", fragment);
            fragment = f;
        }
        assertArgument(dataSlice(data, 0, 4) === fragment.selector, `data signature does not match function ${fragment.name}.`, "data", data);
        return this._decodeParams(fragment.inputs, dataSlice(data, 4));
    }
    encodeFunctionData(fragment, values) {
        if (typeof fragment === "string") {
            const f = this.getFunction(fragment);
            assertArgument(f, "unknown function", "fragment", fragment);
            fragment = f;
        }
        return concat([
            fragment.selector,
            this._encodeParams(fragment.inputs, values || [])
        ]);
    }
    decodeFunctionResult(fragment, data) {
        if (typeof fragment === "string") {
            const f = this.getFunction(fragment);
            assertArgument(f, "unknown function", "fragment", fragment);
            fragment = f;
        }
        let message = "invalid length for result data";
        const bytes = getBytesCopy(data);
        if (bytes.length % 32 === 0) {
            try {
                return this.#abiCoder.decode(fragment.outputs, bytes);
            } catch (error) {
                message = "could not decode result data";
            }
        }
        assert1(false, message, "BAD_DATA", {
            value: hexlify(bytes),
            info: {
                method: fragment.name,
                signature: fragment.format()
            }
        });
    }
    makeError(_data, tx) {
        const data = getBytes(_data, "data");
        const error = AbiCoder.getBuiltinCallException("call", tx, data);
        const customPrefix = "execution reverted (unknown custom error)";
        if (error.message.startsWith(customPrefix)) {
            const selector = hexlify(data.slice(0, 4));
            const ef = this.getError(selector);
            if (ef) {
                try {
                    const args = this.#abiCoder.decode(ef.inputs, data.slice(4));
                    error.revert = {
                        name: ef.name,
                        signature: ef.format(),
                        args: args
                    };
                    error.reason = error.revert.signature;
                    error.message = `execution reverted: ${error.reason}`;
                } catch (e) {
                    error.message = `execution reverted (coult not decode custom error)`;
                }
            }
        }
        const parsed = this.parseTransaction(tx);
        if (parsed) {
            error.invocation = {
                method: parsed.name,
                signature: parsed.signature,
                args: parsed.args
            };
        }
        return error;
    }
    encodeFunctionResult(fragment, values) {
        if (typeof fragment === "string") {
            const f = this.getFunction(fragment);
            assertArgument(f, "unknown function", "fragment", fragment);
            fragment = f;
        }
        return hexlify(this.#abiCoder.encode(fragment.outputs, values || []));
    }
    encodeFilterTopics(fragment, values) {
        if (typeof fragment === "string") {
            const f = this.getEvent(fragment);
            assertArgument(f, "unknown event", "eventFragment", fragment);
            fragment = f;
        }
        assert1(values.length <= fragment.inputs.length, `too many arguments for ${fragment.format()}`, "UNEXPECTED_ARGUMENT", {
            count: values.length,
            expectedCount: fragment.inputs.length
        });
        const topics = [];
        if (!fragment.anonymous) {
            topics.push(fragment.topicHash);
        }
        const encodeTopic = (param, value)=>{
            if (param.type === "string") {
                return id(value);
            } else if (param.type === "bytes") {
                return keccak256(hexlify(value));
            }
            if (param.type === "bool" && typeof value === "boolean") {
                value = value ? "0x01" : "0x00";
            } else if (param.type.match(/^u?int/)) {
                value = toBeHex(value);
            } else if (param.type.match(/^bytes/)) {
                value = zeroPadBytes(value, 32);
            } else if (param.type === "address") {
                this.#abiCoder.encode([
                    "address"
                ], [
                    value
                ]);
            }
            return zeroPadValue(hexlify(value), 32);
        };
        values.forEach((value, index)=>{
            const param = fragment.inputs[index];
            if (!param.indexed) {
                assertArgument(value == null, "cannot filter non-indexed parameters; must be null", "contract." + param.name, value);
                return;
            }
            if (value == null) {
                topics.push(null);
            } else if (param.baseType === "array" || param.baseType === "tuple") {
                assertArgument(false, "filtering with tuples or arrays not supported", "contract." + param.name, value);
            } else if (Array.isArray(value)) {
                topics.push(value.map((value)=>encodeTopic(param, value)));
            } else {
                topics.push(encodeTopic(param, value));
            }
        });
        while(topics.length && topics[topics.length - 1] === null){
            topics.pop();
        }
        return topics;
    }
    encodeEventLog(fragment, values) {
        if (typeof fragment === "string") {
            const f = this.getEvent(fragment);
            assertArgument(f, "unknown event", "eventFragment", fragment);
            fragment = f;
        }
        const topics = [];
        const dataTypes = [];
        const dataValues = [];
        if (!fragment.anonymous) {
            topics.push(fragment.topicHash);
        }
        assertArgument(values.length === fragment.inputs.length, "event arguments/values mismatch", "values", values);
        fragment.inputs.forEach((param, index)=>{
            const value = values[index];
            if (param.indexed) {
                if (param.type === "string") {
                    topics.push(id(value));
                } else if (param.type === "bytes") {
                    topics.push(keccak256(value));
                } else if (param.baseType === "tuple" || param.baseType === "array") {
                    throw new Error("not implemented");
                } else {
                    topics.push(this.#abiCoder.encode([
                        param.type
                    ], [
                        value
                    ]));
                }
            } else {
                dataTypes.push(param);
                dataValues.push(value);
            }
        });
        return {
            data: this.#abiCoder.encode(dataTypes, dataValues),
            topics: topics
        };
    }
    decodeEventLog(fragment, data, topics) {
        if (typeof fragment === "string") {
            const f = this.getEvent(fragment);
            assertArgument(f, "unknown event", "eventFragment", fragment);
            fragment = f;
        }
        if (topics != null && !fragment.anonymous) {
            const eventTopic = fragment.topicHash;
            assertArgument(isHexString(topics[0], 32) && topics[0].toLowerCase() === eventTopic, "fragment/topic mismatch", "topics[0]", topics[0]);
            topics = topics.slice(1);
        }
        const indexed = [];
        const nonIndexed = [];
        const dynamic = [];
        fragment.inputs.forEach((param, index)=>{
            if (param.indexed) {
                if (param.type === "string" || param.type === "bytes" || param.baseType === "tuple" || param.baseType === "array") {
                    indexed.push(ParamType.from({
                        type: "bytes32",
                        name: param.name
                    }));
                    dynamic.push(true);
                } else {
                    indexed.push(param);
                    dynamic.push(false);
                }
            } else {
                nonIndexed.push(param);
                dynamic.push(false);
            }
        });
        const resultIndexed = topics != null ? this.#abiCoder.decode(indexed, concat(topics)) : null;
        const resultNonIndexed = this.#abiCoder.decode(nonIndexed, data, true);
        const values = [];
        const keys = [];
        let nonIndexedIndex = 0, indexedIndex = 0;
        fragment.inputs.forEach((param, index)=>{
            let value = null;
            if (param.indexed) {
                if (resultIndexed == null) {
                    value = new Indexed(null);
                } else if (dynamic[index]) {
                    value = new Indexed(resultIndexed[indexedIndex++]);
                } else {
                    try {
                        value = resultIndexed[indexedIndex++];
                    } catch (error) {
                        value = error;
                    }
                }
            } else {
                try {
                    value = resultNonIndexed[nonIndexedIndex++];
                } catch (error1) {
                    value = error1;
                }
            }
            values.push(value);
            keys.push(param.name || null);
        });
        return Result.fromItems(values, keys);
    }
    parseTransaction(tx) {
        const data = getBytes(tx.data, "tx.data");
        const value = getBigInt(tx.value != null ? tx.value : 0, "tx.value");
        const fragment = this.getFunction(hexlify(data.slice(0, 4)));
        if (!fragment) {
            return null;
        }
        const args = this.#abiCoder.decode(fragment.inputs, data.slice(4));
        return new TransactionDescription(fragment, fragment.selector, args, value);
    }
    parseCallResult(data) {
        throw new Error("@TODO");
    }
    parseLog(log) {
        const fragment = this.getEvent(log.topics[0]);
        if (!fragment || fragment.anonymous) {
            return null;
        }
        return new LogDescription(fragment, fragment.topicHash, this.decodeEventLog(fragment, log.data, log.topics));
    }
    parseError(data) {
        const hexData = hexlify(data);
        const fragment = this.getError(dataSlice(hexData, 0, 4));
        if (!fragment) {
            return null;
        }
        const args = this.#abiCoder.decode(fragment.inputs, dataSlice(hexData, 4));
        return new ErrorDescription(fragment, fragment.selector, args);
    }
    static from(value) {
        if (value instanceof Interface) {
            return value;
        }
        if (typeof value === "string") {
            return new Interface(JSON.parse(value));
        }
        if (typeof value.formatJson === "function") {
            return new Interface(value.formatJson());
        }
        if (typeof value.format === "function") {
            return new Interface(value.format("json"));
        }
        return new Interface(value);
    }
}
const BN_0$2 = BigInt(0);
function getValue(value) {
    if (value == null) {
        return null;
    }
    return value;
}
function toJson(value) {
    if (value == null) {
        return null;
    }
    return value.toString();
}
class FeeData {
    gasPrice;
    maxFeePerGas;
    maxPriorityFeePerGas;
    constructor(gasPrice, maxFeePerGas, maxPriorityFeePerGas){
        defineProperties(this, {
            gasPrice: getValue(gasPrice),
            maxFeePerGas: getValue(maxFeePerGas),
            maxPriorityFeePerGas: getValue(maxPriorityFeePerGas)
        });
    }
    toJSON() {
        const { gasPrice , maxFeePerGas , maxPriorityFeePerGas  } = this;
        return {
            _type: "FeeData",
            gasPrice: toJson(gasPrice),
            maxFeePerGas: toJson(maxFeePerGas),
            maxPriorityFeePerGas: toJson(maxPriorityFeePerGas)
        };
    }
}
function copyRequest(req) {
    const result = {};
    if (req.to) {
        result.to = req.to;
    }
    if (req.from) {
        result.from = req.from;
    }
    if (req.data) {
        result.data = hexlify(req.data);
    }
    const bigIntKeys = "chainId,gasLimit,gasPrice,maxFeePerBlobGas,maxFeePerGas,maxPriorityFeePerGas,value".split(/,/);
    for (const key of bigIntKeys){
        if (!(key in req) || req[key] == null) {
            continue;
        }
        result[key] = getBigInt(req[key], `request.${key}`);
    }
    const numberKeys = "type,nonce".split(/,/);
    for (const key1 of numberKeys){
        if (!(key1 in req) || req[key1] == null) {
            continue;
        }
        result[key1] = getNumber(req[key1], `request.${key1}`);
    }
    if (req.accessList) {
        result.accessList = accessListify(req.accessList);
    }
    if ("blockTag" in req) {
        result.blockTag = req.blockTag;
    }
    if ("enableCcipRead" in req) {
        result.enableCcipRead = !!req.enableCcipRead;
    }
    if ("customData" in req) {
        result.customData = req.customData;
    }
    if ("blobVersionedHashes" in req && req.blobVersionedHashes) {
        result.blobVersionedHashes = req.blobVersionedHashes.slice();
    }
    if ("kzg" in req) {
        result.kzg = req.kzg;
    }
    if ("blobs" in req && req.blobs) {
        result.blobs = req.blobs.map((b)=>{
            if (isBytesLike(b)) {
                return hexlify(b);
            }
            return Object.assign({}, b);
        });
    }
    return result;
}
class Block {
    provider;
    number;
    hash;
    timestamp;
    parentHash;
    parentBeaconBlockRoot;
    nonce;
    difficulty;
    gasLimit;
    gasUsed;
    stateRoot;
    receiptsRoot;
    blobGasUsed;
    excessBlobGas;
    miner;
    prevRandao;
    extraData;
    baseFeePerGas;
    #transactions;
    constructor(block, provider){
        this.#transactions = block.transactions.map((tx)=>{
            if (typeof tx !== "string") {
                return new TransactionResponse(tx, provider);
            }
            return tx;
        });
        defineProperties(this, {
            provider: provider,
            hash: getValue(block.hash),
            number: block.number,
            timestamp: block.timestamp,
            parentHash: block.parentHash,
            parentBeaconBlockRoot: block.parentBeaconBlockRoot,
            nonce: block.nonce,
            difficulty: block.difficulty,
            gasLimit: block.gasLimit,
            gasUsed: block.gasUsed,
            blobGasUsed: block.blobGasUsed,
            excessBlobGas: block.excessBlobGas,
            miner: block.miner,
            prevRandao: getValue(block.prevRandao),
            extraData: block.extraData,
            baseFeePerGas: getValue(block.baseFeePerGas),
            stateRoot: block.stateRoot,
            receiptsRoot: block.receiptsRoot
        });
    }
    get transactions() {
        return this.#transactions.map((tx)=>{
            if (typeof tx === "string") {
                return tx;
            }
            return tx.hash;
        });
    }
    get prefetchedTransactions() {
        const txs = this.#transactions.slice();
        if (txs.length === 0) {
            return [];
        }
        assert1(typeof txs[0] === "object", "transactions were not prefetched with block request", "UNSUPPORTED_OPERATION", {
            operation: "transactionResponses()"
        });
        return txs;
    }
    toJSON() {
        const { baseFeePerGas , difficulty , extraData , gasLimit , gasUsed , hash , miner , prevRandao , nonce , number , parentHash , parentBeaconBlockRoot , stateRoot , receiptsRoot , timestamp , transactions  } = this;
        return {
            _type: "Block",
            baseFeePerGas: toJson(baseFeePerGas),
            difficulty: toJson(difficulty),
            extraData: extraData,
            gasLimit: toJson(gasLimit),
            gasUsed: toJson(gasUsed),
            blobGasUsed: toJson(this.blobGasUsed),
            excessBlobGas: toJson(this.excessBlobGas),
            hash: hash,
            miner: miner,
            prevRandao: prevRandao,
            nonce: nonce,
            number: number,
            parentHash: parentHash,
            timestamp: timestamp,
            parentBeaconBlockRoot: parentBeaconBlockRoot,
            stateRoot: stateRoot,
            receiptsRoot: receiptsRoot,
            transactions: transactions
        };
    }
    [Symbol.iterator]() {
        let index = 0;
        const txs = this.transactions;
        return {
            next: ()=>{
                if (index < this.length) {
                    return {
                        value: txs[index++],
                        done: false
                    };
                }
                return {
                    value: undefined,
                    done: true
                };
            }
        };
    }
    get length() {
        return this.#transactions.length;
    }
    get date() {
        if (this.timestamp == null) {
            return null;
        }
        return new Date(this.timestamp * 1e3);
    }
    async getTransaction(indexOrHash) {
        let tx = undefined;
        if (typeof indexOrHash === "number") {
            tx = this.#transactions[indexOrHash];
        } else {
            const hash = indexOrHash.toLowerCase();
            for (const v of this.#transactions){
                if (typeof v === "string") {
                    if (v !== hash) {
                        continue;
                    }
                    tx = v;
                    break;
                } else {
                    if (v.hash !== hash) {
                        continue;
                    }
                    tx = v;
                    break;
                }
            }
        }
        if (tx == null) {
            throw new Error("no such tx");
        }
        if (typeof tx === "string") {
            return await this.provider.getTransaction(tx);
        } else {
            return tx;
        }
    }
    getPrefetchedTransaction(indexOrHash) {
        const txs = this.prefetchedTransactions;
        if (typeof indexOrHash === "number") {
            return txs[indexOrHash];
        }
        indexOrHash = indexOrHash.toLowerCase();
        for (const tx of txs){
            if (tx.hash === indexOrHash) {
                return tx;
            }
        }
        assertArgument(false, "no matching transaction", "indexOrHash", indexOrHash);
    }
    isMined() {
        return !!this.hash;
    }
    isLondon() {
        return !!this.baseFeePerGas;
    }
    orphanedEvent() {
        if (!this.isMined()) {
            throw new Error("");
        }
        return createOrphanedBlockFilter(this);
    }
}
class Log {
    provider;
    transactionHash;
    blockHash;
    blockNumber;
    removed;
    address;
    data;
    topics;
    index;
    transactionIndex;
    constructor(log, provider){
        this.provider = provider;
        const topics = Object.freeze(log.topics.slice());
        defineProperties(this, {
            transactionHash: log.transactionHash,
            blockHash: log.blockHash,
            blockNumber: log.blockNumber,
            removed: log.removed,
            address: log.address,
            data: log.data,
            topics: topics,
            index: log.index,
            transactionIndex: log.transactionIndex
        });
    }
    toJSON() {
        const { address , blockHash , blockNumber , data , index , removed , topics , transactionHash , transactionIndex  } = this;
        return {
            _type: "log",
            address: address,
            blockHash: blockHash,
            blockNumber: blockNumber,
            data: data,
            index: index,
            removed: removed,
            topics: topics,
            transactionHash: transactionHash,
            transactionIndex: transactionIndex
        };
    }
    async getBlock() {
        const block = await this.provider.getBlock(this.blockHash);
        assert1(!!block, "failed to find transaction", "UNKNOWN_ERROR", {});
        return block;
    }
    async getTransaction() {
        const tx = await this.provider.getTransaction(this.transactionHash);
        assert1(!!tx, "failed to find transaction", "UNKNOWN_ERROR", {});
        return tx;
    }
    async getTransactionReceipt() {
        const receipt = await this.provider.getTransactionReceipt(this.transactionHash);
        assert1(!!receipt, "failed to find transaction receipt", "UNKNOWN_ERROR", {});
        return receipt;
    }
    removedEvent() {
        return createRemovedLogFilter(this);
    }
}
class TransactionReceipt {
    provider;
    to;
    from;
    contractAddress;
    hash;
    index;
    blockHash;
    blockNumber;
    logsBloom;
    gasUsed;
    blobGasUsed;
    cumulativeGasUsed;
    gasPrice;
    blobGasPrice;
    type;
    status;
    root;
    #logs;
    constructor(tx, provider){
        this.#logs = Object.freeze(tx.logs.map((log)=>{
            return new Log(log, provider);
        }));
        let gasPrice = BN_0$2;
        if (tx.effectiveGasPrice != null) {
            gasPrice = tx.effectiveGasPrice;
        } else if (tx.gasPrice != null) {
            gasPrice = tx.gasPrice;
        }
        defineProperties(this, {
            provider: provider,
            to: tx.to,
            from: tx.from,
            contractAddress: tx.contractAddress,
            hash: tx.hash,
            index: tx.index,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            logsBloom: tx.logsBloom,
            gasUsed: tx.gasUsed,
            cumulativeGasUsed: tx.cumulativeGasUsed,
            blobGasUsed: tx.blobGasUsed,
            gasPrice: gasPrice,
            blobGasPrice: tx.blobGasPrice,
            type: tx.type,
            status: tx.status,
            root: tx.root
        });
    }
    get logs() {
        return this.#logs;
    }
    toJSON() {
        const { to , from , contractAddress , hash , index , blockHash , blockNumber , logsBloom , logs , status , root  } = this;
        return {
            _type: "TransactionReceipt",
            blockHash: blockHash,
            blockNumber: blockNumber,
            contractAddress: contractAddress,
            cumulativeGasUsed: toJson(this.cumulativeGasUsed),
            from: from,
            gasPrice: toJson(this.gasPrice),
            blobGasUsed: toJson(this.blobGasUsed),
            blobGasPrice: toJson(this.blobGasPrice),
            gasUsed: toJson(this.gasUsed),
            hash: hash,
            index: index,
            logs: logs,
            logsBloom: logsBloom,
            root: root,
            status: status,
            to: to
        };
    }
    get length() {
        return this.logs.length;
    }
    [Symbol.iterator]() {
        let index = 0;
        return {
            next: ()=>{
                if (index < this.length) {
                    return {
                        value: this.logs[index++],
                        done: false
                    };
                }
                return {
                    value: undefined,
                    done: true
                };
            }
        };
    }
    get fee() {
        return this.gasUsed * this.gasPrice;
    }
    async getBlock() {
        const block = await this.provider.getBlock(this.blockHash);
        if (block == null) {
            throw new Error("TODO");
        }
        return block;
    }
    async getTransaction() {
        const tx = await this.provider.getTransaction(this.hash);
        if (tx == null) {
            throw new Error("TODO");
        }
        return tx;
    }
    async getResult() {
        return await this.provider.getTransactionResult(this.hash);
    }
    async confirmations() {
        return await this.provider.getBlockNumber() - this.blockNumber + 1;
    }
    removedEvent() {
        return createRemovedTransactionFilter(this);
    }
    reorderedEvent(other) {
        assert1(!other || other.isMined(), "unmined 'other' transction cannot be orphaned", "UNSUPPORTED_OPERATION", {
            operation: "reorderedEvent(other)"
        });
        return createReorderedTransactionFilter(this, other);
    }
}
class TransactionResponse {
    provider;
    blockNumber;
    blockHash;
    index;
    hash;
    type;
    to;
    from;
    nonce;
    gasLimit;
    gasPrice;
    maxPriorityFeePerGas;
    maxFeePerGas;
    maxFeePerBlobGas;
    data;
    value;
    chainId;
    signature;
    accessList;
    blobVersionedHashes;
    #startBlock;
    constructor(tx, provider){
        this.provider = provider;
        this.blockNumber = tx.blockNumber != null ? tx.blockNumber : null;
        this.blockHash = tx.blockHash != null ? tx.blockHash : null;
        this.hash = tx.hash;
        this.index = tx.index;
        this.type = tx.type;
        this.from = tx.from;
        this.to = tx.to || null;
        this.gasLimit = tx.gasLimit;
        this.nonce = tx.nonce;
        this.data = tx.data;
        this.value = tx.value;
        this.gasPrice = tx.gasPrice;
        this.maxPriorityFeePerGas = tx.maxPriorityFeePerGas != null ? tx.maxPriorityFeePerGas : null;
        this.maxFeePerGas = tx.maxFeePerGas != null ? tx.maxFeePerGas : null;
        this.maxFeePerBlobGas = tx.maxFeePerBlobGas != null ? tx.maxFeePerBlobGas : null;
        this.chainId = tx.chainId;
        this.signature = tx.signature;
        this.accessList = tx.accessList != null ? tx.accessList : null;
        this.blobVersionedHashes = tx.blobVersionedHashes != null ? tx.blobVersionedHashes : null;
        this.#startBlock = -1;
    }
    toJSON() {
        const { blockNumber , blockHash , index , hash , type , to , from , nonce , data , signature , accessList , blobVersionedHashes  } = this;
        return {
            _type: "TransactionResponse",
            accessList: accessList,
            blockNumber: blockNumber,
            blockHash: blockHash,
            blobVersionedHashes: blobVersionedHashes,
            chainId: toJson(this.chainId),
            data: data,
            from: from,
            gasLimit: toJson(this.gasLimit),
            gasPrice: toJson(this.gasPrice),
            hash: hash,
            maxFeePerGas: toJson(this.maxFeePerGas),
            maxPriorityFeePerGas: toJson(this.maxPriorityFeePerGas),
            maxFeePerBlobGas: toJson(this.maxFeePerBlobGas),
            nonce: nonce,
            signature: signature,
            to: to,
            index: index,
            type: type,
            value: toJson(this.value)
        };
    }
    async getBlock() {
        let blockNumber = this.blockNumber;
        if (blockNumber == null) {
            const tx = await this.getTransaction();
            if (tx) {
                blockNumber = tx.blockNumber;
            }
        }
        if (blockNumber == null) {
            return null;
        }
        const block = this.provider.getBlock(blockNumber);
        if (block == null) {
            throw new Error("TODO");
        }
        return block;
    }
    async getTransaction() {
        return this.provider.getTransaction(this.hash);
    }
    async confirmations() {
        if (this.blockNumber == null) {
            const { tx , blockNumber  } = await resolveProperties({
                tx: this.getTransaction(),
                blockNumber: this.provider.getBlockNumber()
            });
            if (tx == null || tx.blockNumber == null) {
                return 0;
            }
            return blockNumber - tx.blockNumber + 1;
        }
        const blockNumber1 = await this.provider.getBlockNumber();
        return blockNumber1 - this.blockNumber + 1;
    }
    async wait(_confirms, _timeout) {
        const confirms = _confirms == null ? 1 : _confirms;
        const timeout = _timeout == null ? 0 : _timeout;
        let startBlock = this.#startBlock;
        let nextScan = -1;
        let stopScanning = startBlock === -1 ? true : false;
        const checkReplacement = async ()=>{
            if (stopScanning) {
                return null;
            }
            const { blockNumber , nonce  } = await resolveProperties({
                blockNumber: this.provider.getBlockNumber(),
                nonce: this.provider.getTransactionCount(this.from)
            });
            if (nonce < this.nonce) {
                startBlock = blockNumber;
                return;
            }
            if (stopScanning) {
                return null;
            }
            const mined = await this.getTransaction();
            if (mined && mined.blockNumber != null) {
                return;
            }
            if (nextScan === -1) {
                nextScan = startBlock - 3;
                if (nextScan < this.#startBlock) {
                    nextScan = this.#startBlock;
                }
            }
            while(nextScan <= blockNumber){
                if (stopScanning) {
                    return null;
                }
                const block = await this.provider.getBlock(nextScan, true);
                if (block == null) {
                    return;
                }
                for (const hash of block){
                    if (hash === this.hash) {
                        return;
                    }
                }
                for(let i = 0; i < block.length; i++){
                    const tx = await block.getTransaction(i);
                    if (tx.from === this.from && tx.nonce === this.nonce) {
                        if (stopScanning) {
                            return null;
                        }
                        const receipt = await this.provider.getTransactionReceipt(tx.hash);
                        if (receipt == null) {
                            return;
                        }
                        if (blockNumber - receipt.blockNumber + 1 < confirms) {
                            return;
                        }
                        let reason = "replaced";
                        if (tx.data === this.data && tx.to === this.to && tx.value === this.value) {
                            reason = "repriced";
                        } else if (tx.data === "0x" && tx.from === tx.to && tx.value === BN_0$2) {
                            reason = "cancelled";
                        }
                        assert1(false, "transaction was replaced", "TRANSACTION_REPLACED", {
                            cancelled: reason === "replaced" || reason === "cancelled",
                            reason: reason,
                            replacement: tx.replaceableTransaction(startBlock),
                            hash: tx.hash,
                            receipt: receipt
                        });
                    }
                }
                nextScan++;
            }
            return;
        };
        const checkReceipt = (receipt)=>{
            if (receipt == null || receipt.status !== 0) {
                return receipt;
            }
            assert1(false, "transaction execution reverted", "CALL_EXCEPTION", {
                action: "sendTransaction",
                data: null,
                reason: null,
                invocation: null,
                revert: null,
                transaction: {
                    to: receipt.to,
                    from: receipt.from,
                    data: ""
                },
                receipt: receipt
            });
        };
        const receipt = await this.provider.getTransactionReceipt(this.hash);
        if (confirms === 0) {
            return checkReceipt(receipt);
        }
        if (receipt) {
            if (await receipt.confirmations() >= confirms) {
                return checkReceipt(receipt);
            }
        } else {
            await checkReplacement();
            if (confirms === 0) {
                return null;
            }
        }
        const waiter = new Promise((resolve, reject)=>{
            const cancellers = [];
            const cancel = ()=>{
                cancellers.forEach((c)=>c());
            };
            cancellers.push(()=>{
                stopScanning = true;
            });
            if (timeout > 0) {
                const timer = setTimeout(()=>{
                    cancel();
                    reject(makeError("wait for transaction timeout", "TIMEOUT"));
                }, timeout);
                cancellers.push(()=>{
                    clearTimeout(timer);
                });
            }
            const txListener = async (receipt)=>{
                if (await receipt.confirmations() >= confirms) {
                    cancel();
                    try {
                        resolve(checkReceipt(receipt));
                    } catch (error) {
                        reject(error);
                    }
                }
            };
            cancellers.push(()=>{
                this.provider.off(this.hash, txListener);
            });
            this.provider.on(this.hash, txListener);
            if (startBlock >= 0) {
                const replaceListener = async ()=>{
                    try {
                        await checkReplacement();
                    } catch (error) {
                        if (isError(error, "TRANSACTION_REPLACED")) {
                            cancel();
                            reject(error);
                            return;
                        }
                    }
                    if (!stopScanning) {
                        this.provider.once("block", replaceListener);
                    }
                };
                cancellers.push(()=>{
                    this.provider.off("block", replaceListener);
                });
                this.provider.once("block", replaceListener);
            }
        });
        return await waiter;
    }
    isMined() {
        return this.blockHash != null;
    }
    isLegacy() {
        return this.type === 0;
    }
    isBerlin() {
        return this.type === 1;
    }
    isLondon() {
        return this.type === 2;
    }
    isCancun() {
        return this.type === 3;
    }
    removedEvent() {
        assert1(this.isMined(), "unmined transaction canot be orphaned", "UNSUPPORTED_OPERATION", {
            operation: "removeEvent()"
        });
        return createRemovedTransactionFilter(this);
    }
    reorderedEvent(other) {
        assert1(this.isMined(), "unmined transaction canot be orphaned", "UNSUPPORTED_OPERATION", {
            operation: "removeEvent()"
        });
        assert1(!other || other.isMined(), "unmined 'other' transaction canot be orphaned", "UNSUPPORTED_OPERATION", {
            operation: "removeEvent()"
        });
        return createReorderedTransactionFilter(this, other);
    }
    replaceableTransaction(startBlock) {
        assertArgument(Number.isInteger(startBlock) && startBlock >= 0, "invalid startBlock", "startBlock", startBlock);
        const tx = new TransactionResponse(this, this.provider);
        tx.#startBlock = startBlock;
        return tx;
    }
}
function createOrphanedBlockFilter(block) {
    return {
        orphan: "drop-block",
        hash: block.hash,
        number: block.number
    };
}
function createReorderedTransactionFilter(tx, other) {
    return {
        orphan: "reorder-transaction",
        tx: tx,
        other: other
    };
}
function createRemovedTransactionFilter(tx) {
    return {
        orphan: "drop-transaction",
        tx: tx
    };
}
function createRemovedLogFilter(log) {
    return {
        orphan: "drop-log",
        log: {
            transactionHash: log.transactionHash,
            blockHash: log.blockHash,
            blockNumber: log.blockNumber,
            address: log.address,
            data: log.data,
            topics: Object.freeze(log.topics.slice()),
            index: log.index
        }
    };
}
class EventLog extends Log {
    interface;
    fragment;
    args;
    constructor(log, iface, fragment){
        super(log, log.provider);
        const args = iface.decodeEventLog(fragment, log.data, log.topics);
        defineProperties(this, {
            args: args,
            fragment: fragment,
            interface: iface
        });
    }
    get eventName() {
        return this.fragment.name;
    }
    get eventSignature() {
        return this.fragment.format();
    }
}
class UndecodedEventLog extends Log {
    error;
    constructor(log, error){
        super(log, log.provider);
        defineProperties(this, {
            error: error
        });
    }
}
class ContractTransactionReceipt extends TransactionReceipt {
    #iface;
    constructor(iface, provider, tx){
        super(tx, provider);
        this.#iface = iface;
    }
    get logs() {
        return super.logs.map((log)=>{
            const fragment = log.topics.length ? this.#iface.getEvent(log.topics[0]) : null;
            if (fragment) {
                try {
                    return new EventLog(log, this.#iface, fragment);
                } catch (error) {
                    return new UndecodedEventLog(log, error);
                }
            }
            return log;
        });
    }
}
class ContractTransactionResponse extends TransactionResponse {
    #iface;
    constructor(iface, provider, tx){
        super(tx, provider);
        this.#iface = iface;
    }
    async wait(confirms, timeout) {
        const receipt = await super.wait(confirms, timeout);
        if (receipt == null) {
            return null;
        }
        return new ContractTransactionReceipt(this.#iface, this.provider, receipt);
    }
}
class ContractUnknownEventPayload extends EventPayload {
    log;
    constructor(contract, listener, filter, log){
        super(contract, listener, filter);
        defineProperties(this, {
            log: log
        });
    }
    async getBlock() {
        return await this.log.getBlock();
    }
    async getTransaction() {
        return await this.log.getTransaction();
    }
    async getTransactionReceipt() {
        return await this.log.getTransactionReceipt();
    }
}
class ContractEventPayload extends ContractUnknownEventPayload {
    constructor(contract, listener, filter, fragment, _log){
        super(contract, listener, filter, new EventLog(_log, contract.interface, fragment));
        const args = contract.interface.decodeEventLog(fragment, this.log.data, this.log.topics);
        defineProperties(this, {
            args: args,
            fragment: fragment
        });
    }
    get eventName() {
        return this.fragment.name;
    }
    get eventSignature() {
        return this.fragment.format();
    }
}
const BN_0$1 = BigInt(0);
function canCall(value) {
    return value && typeof value.call === "function";
}
function canEstimate(value) {
    return value && typeof value.estimateGas === "function";
}
function canResolve(value) {
    return value && typeof value.resolveName === "function";
}
function canSend(value) {
    return value && typeof value.sendTransaction === "function";
}
function getResolver(value) {
    if (value != null) {
        if (canResolve(value)) {
            return value;
        }
        if (value.provider) {
            return value.provider;
        }
    }
    return undefined;
}
class PreparedTopicFilter {
    #filter;
    fragment;
    constructor(contract, fragment, args){
        defineProperties(this, {
            fragment: fragment
        });
        if (fragment.inputs.length < args.length) {
            throw new Error("too many arguments");
        }
        const runner = getRunner(contract.runner, "resolveName");
        const resolver = canResolve(runner) ? runner : null;
        this.#filter = async function() {
            const resolvedArgs = await Promise.all(fragment.inputs.map((param, index)=>{
                const arg = args[index];
                if (arg == null) {
                    return null;
                }
                return param.walkAsync(args[index], (type, value)=>{
                    if (type === "address") {
                        if (Array.isArray(value)) {
                            return Promise.all(value.map((v)=>resolveAddress(v, resolver)));
                        }
                        return resolveAddress(value, resolver);
                    }
                    return value;
                });
            }));
            return contract.interface.encodeFilterTopics(fragment, resolvedArgs);
        }();
    }
    getTopicFilter() {
        return this.#filter;
    }
}
function getRunner(value, feature) {
    if (value == null) {
        return null;
    }
    if (typeof value[feature] === "function") {
        return value;
    }
    if (value.provider && typeof value.provider[feature] === "function") {
        return value.provider;
    }
    return null;
}
function getProvider(value) {
    if (value == null) {
        return null;
    }
    return value.provider || null;
}
async function copyOverrides(arg, allowed) {
    const _overrides = Typed.dereference(arg, "overrides");
    assertArgument(typeof _overrides === "object", "invalid overrides parameter", "overrides", arg);
    const overrides = copyRequest(_overrides);
    assertArgument(overrides.to == null || (allowed || []).indexOf("to") >= 0, "cannot override to", "overrides.to", overrides.to);
    assertArgument(overrides.data == null || (allowed || []).indexOf("data") >= 0, "cannot override data", "overrides.data", overrides.data);
    if (overrides.from) {
        overrides.from = overrides.from;
    }
    return overrides;
}
async function resolveArgs(_runner, inputs, args) {
    const runner = getRunner(_runner, "resolveName");
    const resolver = canResolve(runner) ? runner : null;
    return await Promise.all(inputs.map((param, index)=>{
        return param.walkAsync(args[index], (type, value)=>{
            value = Typed.dereference(value, type);
            if (type === "address") {
                return resolveAddress(value, resolver);
            }
            return value;
        });
    }));
}
function buildWrappedFallback(contract) {
    const populateTransaction = async function(overrides) {
        const tx = await copyOverrides(overrides, [
            "data"
        ]);
        tx.to = await contract.getAddress();
        if (tx.from) {
            tx.from = await resolveAddress(tx.from, getResolver(contract.runner));
        }
        const iface = contract.interface;
        const noValue = getBigInt(tx.value || BN_0$1, "overrides.value") === BN_0$1;
        const noData = (tx.data || "0x") === "0x";
        if (iface.fallback && !iface.fallback.payable && iface.receive && !noData && !noValue) {
            assertArgument(false, "cannot send data to receive or send value to non-payable fallback", "overrides", overrides);
        }
        assertArgument(iface.fallback || noData, "cannot send data to receive-only contract", "overrides.data", tx.data);
        const payable = iface.receive || iface.fallback && iface.fallback.payable;
        assertArgument(payable || noValue, "cannot send value to non-payable fallback", "overrides.value", tx.value);
        assertArgument(iface.fallback || noData, "cannot send data to receive-only contract", "overrides.data", tx.data);
        return tx;
    };
    const staticCall = async function(overrides) {
        const runner = getRunner(contract.runner, "call");
        assert1(canCall(runner), "contract runner does not support calling", "UNSUPPORTED_OPERATION", {
            operation: "call"
        });
        const tx = await populateTransaction(overrides);
        try {
            return await runner.call(tx);
        } catch (error) {
            if (isCallException(error) && error.data) {
                throw contract.interface.makeError(error.data, tx);
            }
            throw error;
        }
    };
    const send = async function(overrides) {
        const runner = contract.runner;
        assert1(canSend(runner), "contract runner does not support sending transactions", "UNSUPPORTED_OPERATION", {
            operation: "sendTransaction"
        });
        const tx = await runner.sendTransaction(await populateTransaction(overrides));
        const provider = getProvider(contract.runner);
        return new ContractTransactionResponse(contract.interface, provider, tx);
    };
    const estimateGas = async function(overrides) {
        const runner = getRunner(contract.runner, "estimateGas");
        assert1(canEstimate(runner), "contract runner does not support gas estimation", "UNSUPPORTED_OPERATION", {
            operation: "estimateGas"
        });
        return await runner.estimateGas(await populateTransaction(overrides));
    };
    const method = async (overrides)=>{
        return await send(overrides);
    };
    defineProperties(method, {
        _contract: contract,
        estimateGas: estimateGas,
        populateTransaction: populateTransaction,
        send: send,
        staticCall: staticCall
    });
    return method;
}
function buildWrappedMethod(contract, key) {
    const getFragment = function(...args) {
        const fragment = contract.interface.getFunction(key, args);
        assert1(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
            operation: "fragment",
            info: {
                key: key,
                args: args
            }
        });
        return fragment;
    };
    const populateTransaction = async function(...args) {
        const fragment = getFragment(...args);
        let overrides = {};
        if (fragment.inputs.length + 1 === args.length) {
            overrides = await copyOverrides(args.pop());
            if (overrides.from) {
                overrides.from = await resolveAddress(overrides.from, getResolver(contract.runner));
            }
        }
        if (fragment.inputs.length !== args.length) {
            throw new Error("internal error: fragment inputs doesn't match arguments; should not happen");
        }
        const resolvedArgs = await resolveArgs(contract.runner, fragment.inputs, args);
        return Object.assign({}, overrides, await resolveProperties({
            to: contract.getAddress(),
            data: contract.interface.encodeFunctionData(fragment, resolvedArgs)
        }));
    };
    const staticCall = async function(...args) {
        const result = await staticCallResult(...args);
        if (result.length === 1) {
            return result[0];
        }
        return result;
    };
    const send = async function(...args) {
        const runner = contract.runner;
        assert1(canSend(runner), "contract runner does not support sending transactions", "UNSUPPORTED_OPERATION", {
            operation: "sendTransaction"
        });
        const tx = await runner.sendTransaction(await populateTransaction(...args));
        const provider = getProvider(contract.runner);
        return new ContractTransactionResponse(contract.interface, provider, tx);
    };
    const estimateGas = async function(...args) {
        const runner = getRunner(contract.runner, "estimateGas");
        assert1(canEstimate(runner), "contract runner does not support gas estimation", "UNSUPPORTED_OPERATION", {
            operation: "estimateGas"
        });
        return await runner.estimateGas(await populateTransaction(...args));
    };
    const staticCallResult = async function(...args) {
        const runner = getRunner(contract.runner, "call");
        assert1(canCall(runner), "contract runner does not support calling", "UNSUPPORTED_OPERATION", {
            operation: "call"
        });
        const tx = await populateTransaction(...args);
        let result = "0x";
        try {
            result = await runner.call(tx);
        } catch (error) {
            if (isCallException(error) && error.data) {
                throw contract.interface.makeError(error.data, tx);
            }
            throw error;
        }
        const fragment = getFragment(...args);
        return contract.interface.decodeFunctionResult(fragment, result);
    };
    const method = async (...args)=>{
        const fragment = getFragment(...args);
        if (fragment.constant) {
            return await staticCall(...args);
        }
        return await send(...args);
    };
    defineProperties(method, {
        name: contract.interface.getFunctionName(key),
        _contract: contract,
        _key: key,
        getFragment: getFragment,
        estimateGas: estimateGas,
        populateTransaction: populateTransaction,
        send: send,
        staticCall: staticCall,
        staticCallResult: staticCallResult
    });
    Object.defineProperty(method, "fragment", {
        configurable: false,
        enumerable: true,
        get: ()=>{
            const fragment = contract.interface.getFunction(key);
            assert1(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
                operation: "fragment",
                info: {
                    key: key
                }
            });
            return fragment;
        }
    });
    return method;
}
function buildWrappedEvent(contract, key) {
    const getFragment = function(...args) {
        const fragment = contract.interface.getEvent(key, args);
        assert1(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
            operation: "fragment",
            info: {
                key: key,
                args: args
            }
        });
        return fragment;
    };
    const method = function(...args) {
        return new PreparedTopicFilter(contract, getFragment(...args), args);
    };
    defineProperties(method, {
        name: contract.interface.getEventName(key),
        _contract: contract,
        _key: key,
        getFragment: getFragment
    });
    Object.defineProperty(method, "fragment", {
        configurable: false,
        enumerable: true,
        get: ()=>{
            const fragment = contract.interface.getEvent(key);
            assert1(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
                operation: "fragment",
                info: {
                    key: key
                }
            });
            return fragment;
        }
    });
    return method;
}
const internal = Symbol.for("_ethersInternal_contract");
const internalValues = new WeakMap;
function setInternal(contract, values) {
    internalValues.set(contract[internal], values);
}
function getInternal(contract) {
    return internalValues.get(contract[internal]);
}
function isDeferred(value) {
    return value && typeof value === "object" && "getTopicFilter" in value && typeof value.getTopicFilter === "function" && value.fragment;
}
async function getSubInfo(contract, event) {
    let topics;
    let fragment = null;
    if (Array.isArray(event)) {
        const topicHashify = function(name) {
            if (isHexString(name, 32)) {
                return name;
            }
            const fragment = contract.interface.getEvent(name);
            assertArgument(fragment, "unknown fragment", "name", name);
            return fragment.topicHash;
        };
        topics = event.map((e)=>{
            if (e == null) {
                return null;
            }
            if (Array.isArray(e)) {
                return e.map(topicHashify);
            }
            return topicHashify(e);
        });
    } else if (event === "*") {
        topics = [
            null
        ];
    } else if (typeof event === "string") {
        if (isHexString(event, 32)) {
            topics = [
                event
            ];
        } else {
            fragment = contract.interface.getEvent(event);
            assertArgument(fragment, "unknown fragment", "event", event);
            topics = [
                fragment.topicHash
            ];
        }
    } else if (isDeferred(event)) {
        topics = await event.getTopicFilter();
    } else if ("fragment" in event) {
        fragment = event.fragment;
        topics = [
            fragment.topicHash
        ];
    } else {
        assertArgument(false, "unknown event name", "event", event);
    }
    topics = topics.map((t)=>{
        if (t == null) {
            return null;
        }
        if (Array.isArray(t)) {
            const items = Array.from(new Set(t.map((t)=>t.toLowerCase())).values());
            if (items.length === 1) {
                return items[0];
            }
            items.sort();
            return items;
        }
        return t.toLowerCase();
    });
    const tag = topics.map((t)=>{
        if (t == null) {
            return "null";
        }
        if (Array.isArray(t)) {
            return t.join("|");
        }
        return t;
    }).join("&");
    return {
        fragment: fragment,
        tag: tag,
        topics: topics
    };
}
async function hasSub(contract, event) {
    const { subs  } = getInternal(contract);
    return subs.get((await getSubInfo(contract, event)).tag) || null;
}
async function getSub(contract, operation, event) {
    const provider = getProvider(contract.runner);
    assert1(provider, "contract runner does not support subscribing", "UNSUPPORTED_OPERATION", {
        operation: operation
    });
    const { fragment , tag , topics  } = await getSubInfo(contract, event);
    const { addr , subs  } = getInternal(contract);
    let sub = subs.get(tag);
    if (!sub) {
        const address = addr ? addr : contract;
        const filter = {
            address: address,
            topics: topics
        };
        const listener = (log)=>{
            let foundFragment = fragment;
            if (foundFragment == null) {
                try {
                    foundFragment = contract.interface.getEvent(log.topics[0]);
                } catch (error) {}
            }
            if (foundFragment) {
                const _foundFragment = foundFragment;
                const args = fragment ? contract.interface.decodeEventLog(fragment, log.data, log.topics) : [];
                emit(contract, event, args, (listener)=>{
                    return new ContractEventPayload(contract, listener, event, _foundFragment, log);
                });
            } else {
                emit(contract, event, [], (listener)=>{
                    return new ContractUnknownEventPayload(contract, listener, event, log);
                });
            }
        };
        let starting = [];
        const start = ()=>{
            if (starting.length) {
                return;
            }
            starting.push(provider.on(filter, listener));
        };
        const stop = async ()=>{
            if (starting.length == 0) {
                return;
            }
            let started = starting;
            starting = [];
            await Promise.all(started);
            provider.off(filter, listener);
        };
        sub = {
            tag: tag,
            listeners: [],
            start: start,
            stop: stop
        };
        subs.set(tag, sub);
    }
    return sub;
}
let lastEmit = Promise.resolve();
async function _emit(contract, event, args, payloadFunc) {
    await lastEmit;
    const sub = await hasSub(contract, event);
    if (!sub) {
        return false;
    }
    const count = sub.listeners.length;
    sub.listeners = sub.listeners.filter(({ listener , once  })=>{
        const passArgs = Array.from(args);
        if (payloadFunc) {
            passArgs.push(payloadFunc(once ? null : listener));
        }
        try {
            listener.call(contract, ...passArgs);
        } catch (error) {}
        return !once;
    });
    if (sub.listeners.length === 0) {
        sub.stop();
        getInternal(contract).subs.delete(sub.tag);
    }
    return count > 0;
}
async function emit(contract, event, args, payloadFunc) {
    try {
        await lastEmit;
    } catch (error) {}
    const resultPromise = _emit(contract, event, args, payloadFunc);
    lastEmit = resultPromise;
    return await resultPromise;
}
const passProperties = [
    "then"
];
class BaseContract {
    target;
    interface;
    runner;
    filters;
    [internal];
    fallback;
    constructor(target, abi, runner, _deployTx){
        assertArgument(typeof target === "string" || isAddressable(target), "invalid value for Contract target", "target", target);
        if (runner == null) {
            runner = null;
        }
        const iface = Interface.from(abi);
        defineProperties(this, {
            target: target,
            runner: runner,
            interface: iface
        });
        Object.defineProperty(this, internal, {
            value: {}
        });
        let addrPromise;
        let addr = null;
        let deployTx = null;
        if (_deployTx) {
            const provider = getProvider(runner);
            deployTx = new ContractTransactionResponse(this.interface, provider, _deployTx);
        }
        let subs = new Map;
        if (typeof target === "string") {
            if (isHexString(target)) {
                addr = target;
                addrPromise = Promise.resolve(target);
            } else {
                const resolver = getRunner(runner, "resolveName");
                if (!canResolve(resolver)) {
                    throw makeError("contract runner does not support name resolution", "UNSUPPORTED_OPERATION", {
                        operation: "resolveName"
                    });
                }
                addrPromise = resolver.resolveName(target).then((addr)=>{
                    if (addr == null) {
                        throw makeError("an ENS name used for a contract target must be correctly configured", "UNCONFIGURED_NAME", {
                            value: target
                        });
                    }
                    getInternal(this).addr = addr;
                    return addr;
                });
            }
        } else {
            addrPromise = target.getAddress().then((addr)=>{
                if (addr == null) {
                    throw new Error("TODO");
                }
                getInternal(this).addr = addr;
                return addr;
            });
        }
        setInternal(this, {
            addrPromise: addrPromise,
            addr: addr,
            deployTx: deployTx,
            subs: subs
        });
        const filters = new Proxy({}, {
            get: (target, prop, receiver)=>{
                if (typeof prop === "symbol" || passProperties.indexOf(prop) >= 0) {
                    return Reflect.get(target, prop, receiver);
                }
                try {
                    return this.getEvent(prop);
                } catch (error) {
                    if (!isError(error, "INVALID_ARGUMENT") || error.argument !== "key") {
                        throw error;
                    }
                }
                return undefined;
            },
            has: (target, prop)=>{
                if (passProperties.indexOf(prop) >= 0) {
                    return Reflect.has(target, prop);
                }
                return Reflect.has(target, prop) || this.interface.hasEvent(String(prop));
            }
        });
        defineProperties(this, {
            filters: filters
        });
        defineProperties(this, {
            fallback: iface.receive || iface.fallback ? buildWrappedFallback(this) : null
        });
        return new Proxy(this, {
            get: (target, prop, receiver)=>{
                if (typeof prop === "symbol" || prop in target || passProperties.indexOf(prop) >= 0) {
                    return Reflect.get(target, prop, receiver);
                }
                try {
                    return target.getFunction(prop);
                } catch (error) {
                    if (!isError(error, "INVALID_ARGUMENT") || error.argument !== "key") {
                        throw error;
                    }
                }
                return undefined;
            },
            has: (target, prop)=>{
                if (typeof prop === "symbol" || prop in target || passProperties.indexOf(prop) >= 0) {
                    return Reflect.has(target, prop);
                }
                return target.interface.hasFunction(prop);
            }
        });
    }
    connect(runner) {
        return new BaseContract(this.target, this.interface, runner);
    }
    attach(target) {
        return new BaseContract(target, this.interface, this.runner);
    }
    async getAddress() {
        return await getInternal(this).addrPromise;
    }
    async getDeployedCode() {
        const provider = getProvider(this.runner);
        assert1(provider, "runner does not support .provider", "UNSUPPORTED_OPERATION", {
            operation: "getDeployedCode"
        });
        const code = await provider.getCode(await this.getAddress());
        if (code === "0x") {
            return null;
        }
        return code;
    }
    async waitForDeployment() {
        const deployTx = this.deploymentTransaction();
        if (deployTx) {
            await deployTx.wait();
            return this;
        }
        const code = await this.getDeployedCode();
        if (code != null) {
            return this;
        }
        const provider = getProvider(this.runner);
        assert1(provider != null, "contract runner does not support .provider", "UNSUPPORTED_OPERATION", {
            operation: "waitForDeployment"
        });
        return new Promise((resolve, reject)=>{
            const checkCode = async ()=>{
                try {
                    const code = await this.getDeployedCode();
                    if (code != null) {
                        return resolve(this);
                    }
                    provider.once("block", checkCode);
                } catch (error) {
                    reject(error);
                }
            };
            checkCode();
        });
    }
    deploymentTransaction() {
        return getInternal(this).deployTx;
    }
    getFunction(key) {
        if (typeof key !== "string") {
            key = key.format();
        }
        const func = buildWrappedMethod(this, key);
        return func;
    }
    getEvent(key) {
        if (typeof key !== "string") {
            key = key.format();
        }
        return buildWrappedEvent(this, key);
    }
    async queryTransaction(hash) {
        throw new Error("@TODO");
    }
    async queryFilter(event, fromBlock, toBlock) {
        if (fromBlock == null) {
            fromBlock = 0;
        }
        if (toBlock == null) {
            toBlock = "latest";
        }
        const { addr , addrPromise  } = getInternal(this);
        const address = addr ? addr : await addrPromise;
        const { fragment , topics  } = await getSubInfo(this, event);
        const filter = {
            address: address,
            topics: topics,
            fromBlock: fromBlock,
            toBlock: toBlock
        };
        const provider = getProvider(this.runner);
        assert1(provider, "contract runner does not have a provider", "UNSUPPORTED_OPERATION", {
            operation: "queryFilter"
        });
        return (await provider.getLogs(filter)).map((log)=>{
            let foundFragment = fragment;
            if (foundFragment == null) {
                try {
                    foundFragment = this.interface.getEvent(log.topics[0]);
                } catch (error) {}
            }
            if (foundFragment) {
                try {
                    return new EventLog(log, this.interface, foundFragment);
                } catch (error1) {
                    return new UndecodedEventLog(log, error1);
                }
            }
            return new Log(log, provider);
        });
    }
    async on(event, listener) {
        const sub = await getSub(this, "on", event);
        sub.listeners.push({
            listener: listener,
            once: false
        });
        sub.start();
        return this;
    }
    async once(event, listener) {
        const sub = await getSub(this, "once", event);
        sub.listeners.push({
            listener: listener,
            once: true
        });
        sub.start();
        return this;
    }
    async emit(event, ...args) {
        return await emit(this, event, args, null);
    }
    async listenerCount(event) {
        if (event) {
            const sub = await hasSub(this, event);
            if (!sub) {
                return 0;
            }
            return sub.listeners.length;
        }
        const { subs  } = getInternal(this);
        let total = 0;
        for (const { listeners  } of subs.values()){
            total += listeners.length;
        }
        return total;
    }
    async listeners(event) {
        if (event) {
            const sub = await hasSub(this, event);
            if (!sub) {
                return [];
            }
            return sub.listeners.map(({ listener  })=>listener);
        }
        const { subs  } = getInternal(this);
        let result = [];
        for (const { listeners  } of subs.values()){
            result = result.concat(listeners.map(({ listener  })=>listener));
        }
        return result;
    }
    async off(event, listener) {
        const sub = await hasSub(this, event);
        if (!sub) {
            return this;
        }
        if (listener) {
            const index = sub.listeners.map(({ listener  })=>listener).indexOf(listener);
            if (index >= 0) {
                sub.listeners.splice(index, 1);
            }
        }
        if (listener == null || sub.listeners.length === 0) {
            sub.stop();
            getInternal(this).subs.delete(sub.tag);
        }
        return this;
    }
    async removeAllListeners(event) {
        if (event) {
            const sub = await hasSub(this, event);
            if (!sub) {
                return this;
            }
            sub.stop();
            getInternal(this).subs.delete(sub.tag);
        } else {
            const { subs  } = getInternal(this);
            for (const { tag , stop  } of subs.values()){
                stop();
                subs.delete(tag);
            }
        }
        return this;
    }
    async addListener(event, listener) {
        return await this.on(event, listener);
    }
    async removeListener(event, listener) {
        return await this.off(event, listener);
    }
    static buildClass(abi) {
        class CustomContract extends BaseContract {
            constructor(address, runner = null){
                super(address, abi, runner);
            }
        }
        return CustomContract;
    }
    static from(target, abi, runner) {
        if (runner == null) {
            runner = null;
        }
        const contract = new this(target, abi, runner);
        return contract;
    }
}
function _ContractBase() {
    return BaseContract;
}
class Contract extends _ContractBase() {
}
class ContractFactory {
    interface;
    bytecode;
    runner;
    constructor(abi, bytecode, runner){
        const iface = Interface.from(abi);
        if (bytecode instanceof Uint8Array) {
            bytecode = hexlify(getBytes(bytecode));
        } else {
            if (typeof bytecode === "object") {
                bytecode = bytecode.object;
            }
            if (!bytecode.startsWith("0x")) {
                bytecode = "0x" + bytecode;
            }
            bytecode = hexlify(getBytes(bytecode));
        }
        defineProperties(this, {
            bytecode: bytecode,
            interface: iface,
            runner: runner || null
        });
    }
    attach(target) {
        return new BaseContract(target, this.interface, this.runner);
    }
    async getDeployTransaction(...args) {
        let overrides = {};
        const fragment = this.interface.deploy;
        if (fragment.inputs.length + 1 === args.length) {
            overrides = await copyOverrides(args.pop());
        }
        if (fragment.inputs.length !== args.length) {
            throw new Error("incorrect number of arguments to constructor");
        }
        const resolvedArgs = await resolveArgs(this.runner, fragment.inputs, args);
        const data = concat([
            this.bytecode,
            this.interface.encodeDeploy(resolvedArgs)
        ]);
        return Object.assign({}, overrides, {
            data: data
        });
    }
    async deploy(...args) {
        const tx = await this.getDeployTransaction(...args);
        assert1(this.runner && typeof this.runner.sendTransaction === "function", "factory runner does not support sending transactions", "UNSUPPORTED_OPERATION", {
            operation: "sendTransaction"
        });
        const sentTx = await this.runner.sendTransaction(tx);
        const address = getCreateAddress(sentTx);
        return new BaseContract(address, this.interface, this.runner, sentTx);
    }
    connect(runner) {
        return new ContractFactory(this.interface, this.bytecode, runner);
    }
    static fromSolidity(output, runner) {
        assertArgument(output != null, "bad compiler output", "output", output);
        if (typeof output === "string") {
            output = JSON.parse(output);
        }
        const abi = output.abi;
        let bytecode = "";
        if (output.bytecode) {
            bytecode = output.bytecode;
        } else if (output.evm && output.evm.bytecode) {
            bytecode = output.evm.bytecode;
        }
        return new this(abi, bytecode, runner);
    }
}
function getIpfsLink(link) {
    if (link.match(/^ipfs:\/\/ipfs\//i)) {
        link = link.substring(12);
    } else if (link.match(/^ipfs:\/\//i)) {
        link = link.substring(7);
    } else {
        assertArgument(false, "unsupported IPFS format", "link", link);
    }
    return `https:/\/gateway.ipfs.io/ipfs/${link}`;
}
class MulticoinProviderPlugin {
    name;
    constructor(name){
        defineProperties(this, {
            name: name
        });
    }
    connect(proivder) {
        return this;
    }
    supportsCoinType(coinType) {
        return false;
    }
    async encodeAddress(coinType, address) {
        throw new Error("unsupported coin");
    }
    async decodeAddress(coinType, data) {
        throw new Error("unsupported coin");
    }
}
const matcherIpfs = new RegExp("^(ipfs)://(.*)$", "i");
const matchers = [
    new RegExp("^(https)://(.*)$", "i"),
    new RegExp("^(data):(.*)$", "i"),
    matcherIpfs,
    new RegExp("^eip155:[0-9]+/(erc[0-9]+):(.*)$", "i")
];
class EnsResolver {
    provider;
    address;
    name;
    #supports2544;
    #resolver;
    constructor(provider, address, name){
        defineProperties(this, {
            provider: provider,
            address: address,
            name: name
        });
        this.#supports2544 = null;
        this.#resolver = new Contract(address, [
            "function supportsInterface(bytes4) view returns (bool)",
            "function resolve(bytes, bytes) view returns (bytes)",
            "function addr(bytes32) view returns (address)",
            "function addr(bytes32, uint) view returns (bytes)",
            "function text(bytes32, string) view returns (string)",
            "function contenthash(bytes32) view returns (bytes)"
        ], provider);
    }
    async supportsWildcard() {
        if (this.#supports2544 == null) {
            this.#supports2544 = (async ()=>{
                try {
                    return await this.#resolver.supportsInterface("0x9061b923");
                } catch (error) {
                    if (isError(error, "CALL_EXCEPTION")) {
                        return false;
                    }
                    this.#supports2544 = null;
                    throw error;
                }
            })();
        }
        return await this.#supports2544;
    }
    async #fetch(funcName, params) {
        params = (params || []).slice();
        const iface = this.#resolver.interface;
        params.unshift(namehash(this.name));
        let fragment4 = null;
        if (await this.supportsWildcard()) {
            fragment4 = iface.getFunction(funcName);
            assert1(fragment4, "missing fragment", "UNKNOWN_ERROR", {
                info: {
                    funcName: funcName
                }
            });
            params = [
                dnsEncode(this.name, 255),
                iface.encodeFunctionData(fragment4, params)
            ];
            funcName = "resolve(bytes,bytes)";
        }
        params.push({
            enableCcipRead: true
        });
        try {
            const result6 = await this.#resolver[funcName](...params);
            if (fragment4) {
                return iface.decodeFunctionResult(fragment4, result6)[0];
            }
            return result6;
        } catch (error3) {
            if (!isError(error3, "CALL_EXCEPTION")) {
                throw error3;
            }
        }
        return null;
    }
    async getAddress(coinType) {
        if (coinType == null) {
            coinType = 60;
        }
        if (coinType === 60) {
            try {
                const result = await this.#fetch("addr(bytes32)");
                if (result == null || result === ZeroAddress) {
                    return null;
                }
                return result;
            } catch (error) {
                if (isError(error, "CALL_EXCEPTION")) {
                    return null;
                }
                throw error;
            }
        }
        if (coinType >= 0 && coinType < 2147483648) {
            let ethCoinType = coinType + 2147483648;
            const data = await this.#fetch("addr(bytes32,uint)", [
                ethCoinType
            ]);
            if (isHexString(data, 20)) {
                return getAddress(data);
            }
        }
        let coinPlugin = null;
        for (const plugin of this.provider.plugins){
            if (!(plugin instanceof MulticoinProviderPlugin)) {
                continue;
            }
            if (plugin.supportsCoinType(coinType)) {
                coinPlugin = plugin;
                break;
            }
        }
        if (coinPlugin == null) {
            return null;
        }
        const data1 = await this.#fetch("addr(bytes32,uint)", [
            coinType
        ]);
        if (data1 == null || data1 === "0x") {
            return null;
        }
        const address = await coinPlugin.decodeAddress(coinType, data1);
        if (address != null) {
            return address;
        }
        assert1(false, `invalid coin data`, "UNSUPPORTED_OPERATION", {
            operation: `getAddress(${coinType})`,
            info: {
                coinType: coinType,
                data: data1
            }
        });
    }
    async getText(key) {
        const data = await this.#fetch("text(bytes32,string)", [
            key
        ]);
        if (data == null || data === "0x") {
            return null;
        }
        return data;
    }
    async getContentHash() {
        const data = await this.#fetch("contenthash(bytes32)");
        if (data == null || data === "0x") {
            return null;
        }
        const ipfs = data.match(/^0x(e3010170|e5010172)(([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f]*))$/);
        if (ipfs) {
            const scheme = ipfs[1] === "e3010170" ? "ipfs" : "ipns";
            const length = parseInt(ipfs[4], 16);
            if (ipfs[5].length === length * 2) {
                return `${scheme}:/\/${encodeBase58("0x" + ipfs[2])}`;
            }
        }
        const swarm = data.match(/^0xe40101fa011b20([0-9a-f]*)$/);
        if (swarm && swarm[1].length === 64) {
            return `bzz:/\/${swarm[1]}`;
        }
        assert1(false, `invalid or unsupported content hash data`, "UNSUPPORTED_OPERATION", {
            operation: "getContentHash()",
            info: {
                data: data
            }
        });
    }
    async getAvatar() {
        const avatar = await this._getAvatar();
        return avatar.url;
    }
    async _getAvatar() {
        const linkage = [
            {
                type: "name",
                value: this.name
            }
        ];
        try {
            const avatar = await this.getText("avatar");
            if (avatar == null) {
                linkage.push({
                    type: "!avatar",
                    value: ""
                });
                return {
                    url: null,
                    linkage: linkage
                };
            }
            linkage.push({
                type: "avatar",
                value: avatar
            });
            for(let i = 0; i < matchers.length; i++){
                const match = avatar.match(matchers[i]);
                if (match == null) {
                    continue;
                }
                const scheme = match[1].toLowerCase();
                switch(scheme){
                    case "https":
                    case "data":
                        linkage.push({
                            type: "url",
                            value: avatar
                        });
                        return {
                            linkage: linkage,
                            url: avatar
                        };
                    case "ipfs":
                        {
                            const url = getIpfsLink(avatar);
                            linkage.push({
                                type: "ipfs",
                                value: avatar
                            });
                            linkage.push({
                                type: "url",
                                value: url
                            });
                            return {
                                linkage: linkage,
                                url: url
                            };
                        }
                    case "erc721":
                    case "erc1155":
                        {
                            const selector = scheme === "erc721" ? "tokenURI(uint256)" : "uri(uint256)";
                            linkage.push({
                                type: scheme,
                                value: avatar
                            });
                            const owner = await this.getAddress();
                            if (owner == null) {
                                linkage.push({
                                    type: "!owner",
                                    value: ""
                                });
                                return {
                                    url: null,
                                    linkage: linkage
                                };
                            }
                            const comps = (match[2] || "").split("/");
                            if (comps.length !== 2) {
                                linkage.push({
                                    type: `!${scheme}caip`,
                                    value: match[2] || ""
                                });
                                return {
                                    url: null,
                                    linkage: linkage
                                };
                            }
                            const tokenId = comps[1];
                            const contract = new Contract(comps[0], [
                                "function tokenURI(uint) view returns (string)",
                                "function ownerOf(uint) view returns (address)",
                                "function uri(uint) view returns (string)",
                                "function balanceOf(address, uint256) view returns (uint)"
                            ], this.provider);
                            if (scheme === "erc721") {
                                const tokenOwner = await contract.ownerOf(tokenId);
                                if (owner !== tokenOwner) {
                                    linkage.push({
                                        type: "!owner",
                                        value: tokenOwner
                                    });
                                    return {
                                        url: null,
                                        linkage: linkage
                                    };
                                }
                                linkage.push({
                                    type: "owner",
                                    value: tokenOwner
                                });
                            } else if (scheme === "erc1155") {
                                const balance = await contract.balanceOf(owner, tokenId);
                                if (!balance) {
                                    linkage.push({
                                        type: "!balance",
                                        value: "0"
                                    });
                                    return {
                                        url: null,
                                        linkage: linkage
                                    };
                                }
                                linkage.push({
                                    type: "balance",
                                    value: balance.toString()
                                });
                            }
                            let metadataUrl = await contract[selector](tokenId);
                            if (metadataUrl == null || metadataUrl === "0x") {
                                linkage.push({
                                    type: "!metadata-url",
                                    value: ""
                                });
                                return {
                                    url: null,
                                    linkage: linkage
                                };
                            }
                            linkage.push({
                                type: "metadata-url-base",
                                value: metadataUrl
                            });
                            if (scheme === "erc1155") {
                                metadataUrl = metadataUrl.replace("{id}", toBeHex(tokenId, 32).substring(2));
                                linkage.push({
                                    type: "metadata-url-expanded",
                                    value: metadataUrl
                                });
                            }
                            if (metadataUrl.match(/^ipfs:/i)) {
                                metadataUrl = getIpfsLink(metadataUrl);
                            }
                            linkage.push({
                                type: "metadata-url",
                                value: metadataUrl
                            });
                            let metadata = {};
                            const response = await new FetchRequest(metadataUrl).send();
                            response.assertOk();
                            try {
                                metadata = response.bodyJson;
                            } catch (error1) {
                                try {
                                    linkage.push({
                                        type: "!metadata",
                                        value: response.bodyText
                                    });
                                } catch (error) {
                                    const bytes = response.body;
                                    if (bytes) {
                                        linkage.push({
                                            type: "!metadata",
                                            value: hexlify(bytes)
                                        });
                                    }
                                    return {
                                        url: null,
                                        linkage: linkage
                                    };
                                }
                                return {
                                    url: null,
                                    linkage: linkage
                                };
                            }
                            if (!metadata) {
                                linkage.push({
                                    type: "!metadata",
                                    value: ""
                                });
                                return {
                                    url: null,
                                    linkage: linkage
                                };
                            }
                            linkage.push({
                                type: "metadata",
                                value: JSON.stringify(metadata)
                            });
                            let imageUrl = metadata.image;
                            if (typeof imageUrl !== "string") {
                                linkage.push({
                                    type: "!imageUrl",
                                    value: ""
                                });
                                return {
                                    url: null,
                                    linkage: linkage
                                };
                            }
                            if (imageUrl.match(/^(https:\/\/|data:)/i)) {} else {
                                const ipfs = imageUrl.match(matcherIpfs);
                                if (ipfs == null) {
                                    linkage.push({
                                        type: "!imageUrl-ipfs",
                                        value: imageUrl
                                    });
                                    return {
                                        url: null,
                                        linkage: linkage
                                    };
                                }
                                linkage.push({
                                    type: "imageUrl-ipfs",
                                    value: imageUrl
                                });
                                imageUrl = getIpfsLink(imageUrl);
                            }
                            linkage.push({
                                type: "url",
                                value: imageUrl
                            });
                            return {
                                linkage: linkage,
                                url: imageUrl
                            };
                        }
                }
            }
        } catch (error2) {}
        return {
            linkage: linkage,
            url: null
        };
    }
    static async getEnsAddress(provider) {
        const network = await provider.getNetwork();
        const ensPlugin = network.getPlugin("org.ethers.plugins.network.Ens");
        assert1(ensPlugin, "network does not support ENS", "UNSUPPORTED_OPERATION", {
            operation: "getEnsAddress",
            info: {
                network: network
            }
        });
        return ensPlugin.address;
    }
    static async #getResolver(provider, name2) {
        const ensAddr = await EnsResolver.getEnsAddress(provider);
        try {
            const contract = new Contract(ensAddr, [
                "function resolver(bytes32) view returns (address)"
            ], provider);
            const addr = await contract.resolver(namehash(name2), {
                enableCcipRead: true
            });
            if (addr === ZeroAddress) {
                return null;
            }
            return addr;
        } catch (error4) {
            throw error4;
        }
        return null;
    }
    static async fromName(provider, name) {
        let currentName = name;
        while(true){
            if (currentName === "" || currentName === ".") {
                return null;
            }
            if (name !== "eth" && currentName === "eth") {
                return null;
            }
            const addr = await EnsResolver.#getResolver(provider, currentName);
            if (addr != null) {
                const resolver = new EnsResolver(provider, addr, name);
                if (currentName !== name && !await resolver.supportsWildcard()) {
                    return null;
                }
                return resolver;
            }
            currentName = currentName.split(".").slice(1).join(".");
        }
    }
}
const BN_0 = BigInt(0);
function allowNull(format, nullValue) {
    return function(value) {
        if (value == null) {
            return nullValue;
        }
        return format(value);
    };
}
function arrayOf(format, allowNull) {
    return (array)=>{
        if (allowNull && array == null) {
            return null;
        }
        if (!Array.isArray(array)) {
            throw new Error("not an array");
        }
        return array.map((i)=>format(i));
    };
}
function object(format, altNames) {
    return (value)=>{
        const result = {};
        for(const key in format){
            let srcKey = key;
            if (altNames && key in altNames && !(srcKey in value)) {
                for (const altKey of altNames[key]){
                    if (altKey in value) {
                        srcKey = altKey;
                        break;
                    }
                }
            }
            try {
                const nv = format[key](value[srcKey]);
                if (nv !== undefined) {
                    result[key] = nv;
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "not-an-error";
                assert1(false, `invalid value for value.${key} (${message})`, "BAD_DATA", {
                    value: value
                });
            }
        }
        return result;
    };
}
function formatBoolean(value) {
    switch(value){
        case true:
        case "true":
            return true;
        case false:
        case "false":
            return false;
    }
    assertArgument(false, `invalid boolean; ${JSON.stringify(value)}`, "value", value);
}
function formatData(value) {
    assertArgument(isHexString(value, true), "invalid data", "value", value);
    return value;
}
function formatHash(value) {
    assertArgument(isHexString(value, 32), "invalid hash", "value", value);
    return value;
}
const _formatLog = object({
    address: getAddress,
    blockHash: formatHash,
    blockNumber: getNumber,
    data: formatData,
    index: getNumber,
    removed: allowNull(formatBoolean, false),
    topics: arrayOf(formatHash),
    transactionHash: formatHash,
    transactionIndex: getNumber
}, {
    index: [
        "logIndex"
    ]
});
function formatLog(value) {
    return _formatLog(value);
}
const _formatBlock = object({
    hash: allowNull(formatHash),
    parentHash: formatHash,
    parentBeaconBlockRoot: allowNull(formatHash, null),
    number: getNumber,
    timestamp: getNumber,
    nonce: allowNull(formatData),
    difficulty: getBigInt,
    gasLimit: getBigInt,
    gasUsed: getBigInt,
    stateRoot: allowNull(formatHash, null),
    receiptsRoot: allowNull(formatHash, null),
    blobGasUsed: allowNull(getBigInt, null),
    excessBlobGas: allowNull(getBigInt, null),
    miner: allowNull(getAddress),
    prevRandao: allowNull(formatHash, null),
    extraData: formatData,
    baseFeePerGas: allowNull(getBigInt)
}, {
    prevRandao: [
        "mixHash"
    ]
});
function formatBlock(value) {
    const result = _formatBlock(value);
    result.transactions = value.transactions.map((tx)=>{
        if (typeof tx === "string") {
            return tx;
        }
        return formatTransactionResponse(tx);
    });
    return result;
}
const _formatReceiptLog = object({
    transactionIndex: getNumber,
    blockNumber: getNumber,
    transactionHash: formatHash,
    address: getAddress,
    topics: arrayOf(formatHash),
    data: formatData,
    index: getNumber,
    blockHash: formatHash
}, {
    index: [
        "logIndex"
    ]
});
function formatReceiptLog(value) {
    return _formatReceiptLog(value);
}
const _formatTransactionReceipt = object({
    to: allowNull(getAddress, null),
    from: allowNull(getAddress, null),
    contractAddress: allowNull(getAddress, null),
    index: getNumber,
    root: allowNull(hexlify),
    gasUsed: getBigInt,
    blobGasUsed: allowNull(getBigInt, null),
    logsBloom: allowNull(formatData),
    blockHash: formatHash,
    hash: formatHash,
    logs: arrayOf(formatReceiptLog),
    blockNumber: getNumber,
    cumulativeGasUsed: getBigInt,
    effectiveGasPrice: allowNull(getBigInt),
    blobGasPrice: allowNull(getBigInt, null),
    status: allowNull(getNumber),
    type: allowNull(getNumber, 0)
}, {
    effectiveGasPrice: [
        "gasPrice"
    ],
    hash: [
        "transactionHash"
    ],
    index: [
        "transactionIndex"
    ]
});
function formatTransactionReceipt(value) {
    return _formatTransactionReceipt(value);
}
function formatTransactionResponse(value) {
    if (value.to && getBigInt(value.to) === BN_0) {
        value.to = "0x0000000000000000000000000000000000000000";
    }
    const result = object({
        hash: formatHash,
        index: allowNull(getNumber, undefined),
        type: (value)=>{
            if (value === "0x" || value == null) {
                return 0;
            }
            return getNumber(value);
        },
        accessList: allowNull(accessListify, null),
        blobVersionedHashes: allowNull(arrayOf(formatHash, true), null),
        blockHash: allowNull(formatHash, null),
        blockNumber: allowNull(getNumber, null),
        transactionIndex: allowNull(getNumber, null),
        from: getAddress,
        gasPrice: allowNull(getBigInt),
        maxPriorityFeePerGas: allowNull(getBigInt),
        maxFeePerGas: allowNull(getBigInt),
        maxFeePerBlobGas: allowNull(getBigInt, null),
        gasLimit: getBigInt,
        to: allowNull(getAddress, null),
        value: getBigInt,
        nonce: getNumber,
        data: formatData,
        creates: allowNull(getAddress, null),
        chainId: allowNull(getBigInt, null)
    }, {
        data: [
            "input"
        ],
        gasLimit: [
            "gas"
        ],
        index: [
            "transactionIndex"
        ]
    })(value);
    if (result.to == null && result.creates == null) {
        result.creates = getCreateAddress(result);
    }
    if ((value.type === 1 || value.type === 2) && value.accessList == null) {
        result.accessList = [];
    }
    if (value.signature) {
        result.signature = Signature.from(value.signature);
    } else {
        result.signature = Signature.from(value);
    }
    if (result.chainId == null) {
        const chainId = result.signature.legacyChainId;
        if (chainId != null) {
            result.chainId = chainId;
        }
    }
    if (result.blockHash && getBigInt(result.blockHash) === BN_0) {
        result.blockHash = null;
    }
    return result;
}
const EnsAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
class NetworkPlugin {
    name;
    constructor(name){
        defineProperties(this, {
            name: name
        });
    }
    clone() {
        return new NetworkPlugin(this.name);
    }
}
class GasCostPlugin extends NetworkPlugin {
    effectiveBlock;
    txBase;
    txCreate;
    txDataZero;
    txDataNonzero;
    txAccessListStorageKey;
    txAccessListAddress;
    constructor(effectiveBlock, costs){
        if (effectiveBlock == null) {
            effectiveBlock = 0;
        }
        super(`org.ethers.network.plugins.GasCost#${effectiveBlock || 0}`);
        const props = {
            effectiveBlock: effectiveBlock
        };
        function set(name, nullish) {
            let value = (costs || {})[name];
            if (value == null) {
                value = nullish;
            }
            assertArgument(typeof value === "number", `invalud value for ${name}`, "costs", costs);
            props[name] = value;
        }
        set("txBase", 21e3);
        set("txCreate", 32e3);
        set("txDataZero", 4);
        set("txDataNonzero", 16);
        set("txAccessListStorageKey", 1900);
        set("txAccessListAddress", 2400);
        defineProperties(this, props);
    }
    clone() {
        return new GasCostPlugin(this.effectiveBlock, this);
    }
}
class EnsPlugin extends NetworkPlugin {
    address;
    targetNetwork;
    constructor(address, targetNetwork){
        super("org.ethers.plugins.network.Ens");
        defineProperties(this, {
            address: address || EnsAddress,
            targetNetwork: targetNetwork == null ? 1 : targetNetwork
        });
    }
    clone() {
        return new EnsPlugin(this.address, this.targetNetwork);
    }
}
class FeeDataNetworkPlugin extends NetworkPlugin {
    #feeDataFunc;
    get feeDataFunc() {
        return this.#feeDataFunc;
    }
    constructor(feeDataFunc){
        super("org.ethers.plugins.network.FeeData");
        this.#feeDataFunc = feeDataFunc;
    }
    async getFeeData(provider) {
        return await this.#feeDataFunc(provider);
    }
    clone() {
        return new FeeDataNetworkPlugin(this.#feeDataFunc);
    }
}
class FetchUrlFeeDataNetworkPlugin extends NetworkPlugin {
    #url;
    #processFunc;
    get url() {
        return this.#url;
    }
    get processFunc() {
        return this.#processFunc;
    }
    constructor(url, processFunc){
        super("org.ethers.plugins.network.FetchUrlFeeDataPlugin");
        this.#url = url;
        this.#processFunc = processFunc;
    }
    clone() {
        return this;
    }
}
const Networks = new Map;
class Network {
    #name;
    #chainId;
    #plugins;
    constructor(name, chainId){
        this.#name = name;
        this.#chainId = getBigInt(chainId);
        this.#plugins = new Map;
    }
    toJSON() {
        return {
            name: this.name,
            chainId: String(this.chainId)
        };
    }
    get name() {
        return this.#name;
    }
    set name(value) {
        this.#name = value;
    }
    get chainId() {
        return this.#chainId;
    }
    set chainId(value) {
        this.#chainId = getBigInt(value, "chainId");
    }
    matches(other) {
        if (other == null) {
            return false;
        }
        if (typeof other === "string") {
            try {
                return this.chainId === getBigInt(other);
            } catch (error) {}
            return this.name === other;
        }
        if (typeof other === "number" || typeof other === "bigint") {
            try {
                return this.chainId === getBigInt(other);
            } catch (error1) {}
            return false;
        }
        if (typeof other === "object") {
            if (other.chainId != null) {
                try {
                    return this.chainId === getBigInt(other.chainId);
                } catch (error2) {}
                return false;
            }
            if (other.name != null) {
                return this.name === other.name;
            }
            return false;
        }
        return false;
    }
    get plugins() {
        return Array.from(this.#plugins.values());
    }
    attachPlugin(plugin) {
        if (this.#plugins.get(plugin.name)) {
            throw new Error(`cannot replace existing plugin: ${plugin.name} `);
        }
        this.#plugins.set(plugin.name, plugin.clone());
        return this;
    }
    getPlugin(name) {
        return this.#plugins.get(name) || null;
    }
    getPlugins(basename) {
        return this.plugins.filter((p)=>p.name.split("#")[0] === basename);
    }
    clone() {
        const clone = new Network(this.name, this.chainId);
        this.plugins.forEach((plugin)=>{
            clone.attachPlugin(plugin.clone());
        });
        return clone;
    }
    computeIntrinsicGas(tx) {
        const costs = this.getPlugin("org.ethers.plugins.network.GasCost") || new GasCostPlugin;
        let gas = costs.txBase;
        if (tx.to == null) {
            gas += costs.txCreate;
        }
        if (tx.data) {
            for(let i = 2; i < tx.data.length; i += 2){
                if (tx.data.substring(i, i + 2) === "00") {
                    gas += costs.txDataZero;
                } else {
                    gas += costs.txDataNonzero;
                }
            }
        }
        if (tx.accessList) {
            const accessList = accessListify(tx.accessList);
            for(const addr in accessList){
                gas += costs.txAccessListAddress + costs.txAccessListStorageKey * accessList[addr].storageKeys.length;
            }
        }
        return gas;
    }
    static from(network) {
        injectCommonNetworks();
        if (network == null) {
            return Network.from("mainnet");
        }
        if (typeof network === "number") {
            network = BigInt(network);
        }
        if (typeof network === "string" || typeof network === "bigint") {
            const networkFunc = Networks.get(network);
            if (networkFunc) {
                return networkFunc();
            }
            if (typeof network === "bigint") {
                return new Network("unknown", network);
            }
            assertArgument(false, "unknown network", "network", network);
        }
        if (typeof network.clone === "function") {
            const clone = network.clone();
            return clone;
        }
        if (typeof network === "object") {
            assertArgument(typeof network.name === "string" && typeof network.chainId === "number", "invalid network object name or chainId", "network", network);
            const custom = new Network(network.name, network.chainId);
            if (network.ensAddress || network.ensNetwork != null) {
                custom.attachPlugin(new EnsPlugin(network.ensAddress, network.ensNetwork));
            }
            return custom;
        }
        assertArgument(false, "invalid network", "network", network);
    }
    static register(nameOrChainId, networkFunc) {
        if (typeof nameOrChainId === "number") {
            nameOrChainId = BigInt(nameOrChainId);
        }
        const existing = Networks.get(nameOrChainId);
        if (existing) {
            assertArgument(false, `conflicting network for ${JSON.stringify(existing.name)}`, "nameOrChainId", nameOrChainId);
        }
        Networks.set(nameOrChainId, networkFunc);
    }
}
function parseUnits(_value, decimals) {
    const value = String(_value);
    if (!value.match(/^[0-9.]+$/)) {
        throw new Error(`invalid gwei value: ${_value}`);
    }
    const comps = value.split(".");
    if (comps.length === 1) {
        comps.push("");
    }
    if (comps.length !== 2) {
        throw new Error(`invalid gwei value: ${_value}`);
    }
    while(comps[1].length < decimals){
        comps[1] += "0";
    }
    if (comps[1].length > 9) {
        let frac = BigInt(comps[1].substring(0, 9));
        if (!comps[1].substring(9).match(/^0+$/)) {
            frac++;
        }
        comps[1] = frac.toString();
    }
    return BigInt(comps[0] + comps[1]);
}
function getGasStationPlugin(url) {
    return new FetchUrlFeeDataNetworkPlugin(url, async (fetchFeeData, provider, request)=>{
        request.setHeader("User-Agent", "ethers");
        let response;
        try {
            const [_response, _feeData] = await Promise.all([
                request.send(),
                fetchFeeData()
            ]);
            response = _response;
            const payload = response.bodyJson.standard;
            const feeData = {
                gasPrice: _feeData.gasPrice,
                maxFeePerGas: parseUnits(payload.maxFee, 9),
                maxPriorityFeePerGas: parseUnits(payload.maxPriorityFee, 9)
            };
            return feeData;
        } catch (error) {
            assert1(false, `error encountered with polygon gas station (${JSON.stringify(request.url)})`, "SERVER_ERROR", {
                request: request,
                response: response,
                error: error
            });
        }
    });
}
let injected = false;
function injectCommonNetworks() {
    if (injected) {
        return;
    }
    injected = true;
    function registerEth(name, chainId, options) {
        const func = function() {
            const network = new Network(name, chainId);
            if (options.ensNetwork != null) {
                network.attachPlugin(new EnsPlugin(null, options.ensNetwork));
            }
            network.attachPlugin(new GasCostPlugin);
            (options.plugins || []).forEach((plugin)=>{
                network.attachPlugin(plugin);
            });
            return network;
        };
        Network.register(name, func);
        Network.register(chainId, func);
        if (options.altNames) {
            options.altNames.forEach((name)=>{
                Network.register(name, func);
            });
        }
    }
    registerEth("mainnet", 1, {
        ensNetwork: 1,
        altNames: [
            "homestead"
        ]
    });
    registerEth("ropsten", 3, {
        ensNetwork: 3
    });
    registerEth("rinkeby", 4, {
        ensNetwork: 4
    });
    registerEth("goerli", 5, {
        ensNetwork: 5
    });
    registerEth("kovan", 42, {
        ensNetwork: 42
    });
    registerEth("sepolia", 11155111, {
        ensNetwork: 11155111
    });
    registerEth("holesky", 17e3, {
        ensNetwork: 17e3
    });
    registerEth("classic", 61, {});
    registerEth("classicKotti", 6, {});
    registerEth("arbitrum", 42161, {
        ensNetwork: 1
    });
    registerEth("arbitrum-goerli", 421613, {});
    registerEth("arbitrum-sepolia", 421614, {});
    registerEth("base", 8453, {
        ensNetwork: 1
    });
    registerEth("base-goerli", 84531, {});
    registerEth("base-sepolia", 84532, {});
    registerEth("bnb", 56, {
        ensNetwork: 1
    });
    registerEth("bnbt", 97, {});
    registerEth("linea", 59144, {
        ensNetwork: 1
    });
    registerEth("linea-goerli", 59140, {});
    registerEth("linea-sepolia", 59141, {});
    registerEth("matic", 137, {
        ensNetwork: 1,
        plugins: [
            getGasStationPlugin("https://gasstation.polygon.technology/v2")
        ]
    });
    registerEth("matic-amoy", 80002, {});
    registerEth("matic-mumbai", 80001, {
        altNames: [
            "maticMumbai",
            "maticmum"
        ],
        plugins: [
            getGasStationPlugin("https://gasstation-testnet.polygon.technology/v2")
        ]
    });
    registerEth("optimism", 10, {
        ensNetwork: 1,
        plugins: []
    });
    registerEth("optimism-goerli", 420, {});
    registerEth("optimism-sepolia", 11155420, {});
    registerEth("xdai", 100, {
        ensNetwork: 1
    });
}
function copy$2(obj) {
    return JSON.parse(JSON.stringify(obj));
}
class PollingBlockSubscriber {
    #provider;
    #poller;
    #interval;
    #blockNumber;
    constructor(provider){
        this.#provider = provider;
        this.#poller = null;
        this.#interval = 4e3;
        this.#blockNumber = -2;
    }
    get pollingInterval() {
        return this.#interval;
    }
    set pollingInterval(value) {
        this.#interval = value;
    }
    async #poll() {
        try {
            const blockNumber = await this.#provider.getBlockNumber();
            if (this.#blockNumber === -2) {
                this.#blockNumber = blockNumber;
                return;
            }
            if (blockNumber !== this.#blockNumber) {
                for(let b1 = this.#blockNumber + 1; b1 <= blockNumber; b1++){
                    if (this.#poller == null) {
                        return;
                    }
                    await this.#provider.emit("block", b1);
                }
                this.#blockNumber = blockNumber;
            }
        } catch (error5) {}
        if (this.#poller == null) {
            return;
        }
        this.#poller = this.#provider._setTimeout(this.#poll.bind(this), this.#interval);
    }
    start() {
        if (this.#poller) {
            return;
        }
        this.#poller = this.#provider._setTimeout(this.#poll.bind(this), this.#interval);
        this.#poll();
    }
    stop() {
        if (!this.#poller) {
            return;
        }
        this.#provider._clearTimeout(this.#poller);
        this.#poller = null;
    }
    pause(dropWhilePaused) {
        this.stop();
        if (dropWhilePaused) {
            this.#blockNumber = -2;
        }
    }
    resume() {
        this.start();
    }
}
class OnBlockSubscriber {
    #provider;
    #poll;
    #running;
    constructor(provider){
        this.#provider = provider;
        this.#running = false;
        this.#poll = (blockNumber)=>{
            this._poll(blockNumber, this.#provider);
        };
    }
    async _poll(blockNumber, provider) {
        throw new Error("sub-classes must override this");
    }
    start() {
        if (this.#running) {
            return;
        }
        this.#running = true;
        this.#poll(-2);
        this.#provider.on("block", this.#poll);
    }
    stop() {
        if (!this.#running) {
            return;
        }
        this.#running = false;
        this.#provider.off("block", this.#poll);
    }
    pause(dropWhilePaused) {
        this.stop();
    }
    resume() {
        this.start();
    }
}
class PollingBlockTagSubscriber extends OnBlockSubscriber {
    #tag;
    #lastBlock;
    constructor(provider, tag){
        super(provider);
        this.#tag = tag;
        this.#lastBlock = -2;
    }
    pause(dropWhilePaused) {
        if (dropWhilePaused) {
            this.#lastBlock = -2;
        }
        super.pause(dropWhilePaused);
    }
    async _poll(blockNumber, provider) {
        const block = await provider.getBlock(this.#tag);
        if (block == null) {
            return;
        }
        if (this.#lastBlock === -2) {
            this.#lastBlock = block.number;
        } else if (block.number > this.#lastBlock) {
            provider.emit(this.#tag, block.number);
            this.#lastBlock = block.number;
        }
    }
}
class PollingOrphanSubscriber extends OnBlockSubscriber {
    #filter;
    constructor(provider, filter){
        super(provider);
        this.#filter = copy$2(filter);
    }
    async _poll(blockNumber, provider) {
        throw new Error("@TODO");
    }
}
class PollingTransactionSubscriber extends OnBlockSubscriber {
    #hash;
    constructor(provider, hash){
        super(provider);
        this.#hash = hash;
    }
    async _poll(blockNumber, provider) {
        const tx = await provider.getTransactionReceipt(this.#hash);
        if (tx) {
            provider.emit(this.#hash, tx);
        }
    }
}
class PollingEventSubscriber {
    #provider;
    #filter;
    #poller;
    #running;
    #blockNumber;
    constructor(provider, filter){
        this.#provider = provider;
        this.#filter = copy$2(filter);
        this.#poller = this.#poll.bind(this);
        this.#running = false;
        this.#blockNumber = -2;
    }
    async #poll(blockNumber1) {
        if (this.#blockNumber === -2) {
            return;
        }
        const filter = copy$2(this.#filter);
        filter.fromBlock = this.#blockNumber + 1;
        filter.toBlock = blockNumber1;
        const logs = await this.#provider.getLogs(filter);
        if (logs.length === 0) {
            if (this.#blockNumber < blockNumber1 - 60) {
                this.#blockNumber = blockNumber1 - 60;
            }
            return;
        }
        for (const log of logs){
            this.#provider.emit(this.#filter, log);
            this.#blockNumber = log.blockNumber;
        }
    }
    start() {
        if (this.#running) {
            return;
        }
        this.#running = true;
        if (this.#blockNumber === -2) {
            this.#provider.getBlockNumber().then((blockNumber)=>{
                this.#blockNumber = blockNumber;
            });
        }
        this.#provider.on("block", this.#poller);
    }
    stop() {
        if (!this.#running) {
            return;
        }
        this.#running = false;
        this.#provider.off("block", this.#poller);
    }
    pause(dropWhilePaused) {
        this.stop();
        if (dropWhilePaused) {
            this.#blockNumber = -2;
        }
    }
    resume() {
        this.start();
    }
}
const BN_2$1 = BigInt(2);
function isPromise$1(value) {
    return value && typeof value.then === "function";
}
function getTag(prefix, value) {
    return prefix + ":" + JSON.stringify(value, (k, v)=>{
        if (v == null) {
            return "null";
        }
        if (typeof v === "bigint") {
            return `bigint:${v.toString()}`;
        }
        if (typeof v === "string") {
            return v.toLowerCase();
        }
        if (typeof v === "object" && !Array.isArray(v)) {
            const keys = Object.keys(v);
            keys.sort();
            return keys.reduce((accum, key)=>{
                accum[key] = v[key];
                return accum;
            }, {});
        }
        return v;
    });
}
class UnmanagedSubscriber {
    name;
    constructor(name){
        defineProperties(this, {
            name: name
        });
    }
    start() {}
    stop() {}
    pause(dropWhilePaused) {}
    resume() {}
}
function copy$1(value) {
    return JSON.parse(JSON.stringify(value));
}
function concisify(items) {
    items = Array.from(new Set(items).values());
    items.sort();
    return items;
}
async function getSubscription(_event, provider) {
    if (_event == null) {
        throw new Error("invalid event");
    }
    if (Array.isArray(_event)) {
        _event = {
            topics: _event
        };
    }
    if (typeof _event === "string") {
        switch(_event){
            case "block":
            case "debug":
            case "error":
            case "finalized":
            case "network":
            case "pending":
            case "safe":
                {
                    return {
                        type: _event,
                        tag: _event
                    };
                }
        }
    }
    if (isHexString(_event, 32)) {
        const hash = _event.toLowerCase();
        return {
            type: "transaction",
            tag: getTag("tx", {
                hash: hash
            }),
            hash: hash
        };
    }
    if (_event.orphan) {
        const event = _event;
        return {
            type: "orphan",
            tag: getTag("orphan", event),
            filter: copy$1(event)
        };
    }
    if (_event.address || _event.topics) {
        const event1 = _event;
        const filter = {
            topics: (event1.topics || []).map((t)=>{
                if (t == null) {
                    return null;
                }
                if (Array.isArray(t)) {
                    return concisify(t.map((t)=>t.toLowerCase()));
                }
                return t.toLowerCase();
            })
        };
        if (event1.address) {
            const addresses = [];
            const promises = [];
            const addAddress = (addr)=>{
                if (isHexString(addr)) {
                    addresses.push(addr);
                } else {
                    promises.push((async ()=>{
                        addresses.push(await resolveAddress(addr, provider));
                    })());
                }
            };
            if (Array.isArray(event1.address)) {
                event1.address.forEach(addAddress);
            } else {
                addAddress(event1.address);
            }
            if (promises.length) {
                await Promise.all(promises);
            }
            filter.address = concisify(addresses.map((a)=>a.toLowerCase()));
        }
        return {
            filter: filter,
            tag: getTag("event", filter),
            type: "event"
        };
    }
    assertArgument(false, "unknown ProviderEvent", "event", _event);
}
function getTime$1() {
    return (new Date).getTime();
}
const defaultOptions$1 = {
    cacheTimeout: 250,
    pollingInterval: 4e3
};
class AbstractProvider {
    #subs;
    #plugins;
    #pausedState;
    #destroyed;
    #networkPromise;
    #anyNetwork;
    #performCache;
    #lastBlockNumber;
    #nextTimer;
    #timers;
    #disableCcipRead;
    #options;
    constructor(_network, options){
        this.#options = Object.assign({}, defaultOptions$1, options || {});
        if (_network === "any") {
            this.#anyNetwork = true;
            this.#networkPromise = null;
        } else if (_network) {
            const network = Network.from(_network);
            this.#anyNetwork = false;
            this.#networkPromise = Promise.resolve(network);
            setTimeout(()=>{
                this.emit("network", network, null);
            }, 0);
        } else {
            this.#anyNetwork = false;
            this.#networkPromise = null;
        }
        this.#lastBlockNumber = -1;
        this.#performCache = new Map;
        this.#subs = new Map;
        this.#plugins = new Map;
        this.#pausedState = null;
        this.#destroyed = false;
        this.#nextTimer = 1;
        this.#timers = new Map;
        this.#disableCcipRead = false;
    }
    get pollingInterval() {
        return this.#options.pollingInterval;
    }
    get provider() {
        return this;
    }
    get plugins() {
        return Array.from(this.#plugins.values());
    }
    attachPlugin(plugin) {
        if (this.#plugins.get(plugin.name)) {
            throw new Error(`cannot replace existing plugin: ${plugin.name} `);
        }
        this.#plugins.set(plugin.name, plugin.connect(this));
        return this;
    }
    getPlugin(name) {
        return this.#plugins.get(name) || null;
    }
    get disableCcipRead() {
        return this.#disableCcipRead;
    }
    set disableCcipRead(value) {
        this.#disableCcipRead = !!value;
    }
    async #perform(req1) {
        const timeout = this.#options.cacheTimeout;
        if (timeout < 0) {
            return await this._perform(req1);
        }
        const tag = getTag(req1.method, req1);
        let perform = this.#performCache.get(tag);
        if (!perform) {
            perform = this._perform(req1);
            this.#performCache.set(tag, perform);
            setTimeout(()=>{
                if (this.#performCache.get(tag) === perform) {
                    this.#performCache.delete(tag);
                }
            }, timeout);
        }
        return await perform;
    }
    async ccipReadFetch(tx, calldata, urls) {
        if (this.disableCcipRead || urls.length === 0 || tx.to == null) {
            return null;
        }
        const sender = tx.to.toLowerCase();
        const data = calldata.toLowerCase();
        const errorMessages = [];
        for(let i = 0; i < urls.length; i++){
            const url = urls[i];
            const href = url.replace("{sender}", sender).replace("{data}", data);
            const request = new FetchRequest(href);
            if (url.indexOf("{data}") === -1) {
                request.body = {
                    data: data,
                    sender: sender
                };
            }
            this.emit("debug", {
                action: "sendCcipReadFetchRequest",
                request: request,
                index: i,
                urls: urls
            });
            let errorMessage = "unknown error";
            let resp;
            try {
                resp = await request.send();
            } catch (error) {
                errorMessages.push(error.message);
                this.emit("debug", {
                    action: "receiveCcipReadFetchError",
                    request: request,
                    result: {
                        error: error
                    }
                });
                continue;
            }
            try {
                const result = resp.bodyJson;
                if (result.data) {
                    this.emit("debug", {
                        action: "receiveCcipReadFetchResult",
                        request: request,
                        result: result
                    });
                    return result.data;
                }
                if (result.message) {
                    errorMessage = result.message;
                }
                this.emit("debug", {
                    action: "receiveCcipReadFetchError",
                    request: request,
                    result: result
                });
            } catch (error1) {}
            assert1(resp.statusCode < 400 || resp.statusCode >= 500, `response not found during CCIP fetch: ${errorMessage}`, "OFFCHAIN_FAULT", {
                reason: "404_MISSING_RESOURCE",
                transaction: tx,
                info: {
                    url: url,
                    errorMessage: errorMessage
                }
            });
            errorMessages.push(errorMessage);
        }
        assert1(false, `error encountered during CCIP fetch: ${errorMessages.map((m)=>JSON.stringify(m)).join(", ")}`, "OFFCHAIN_FAULT", {
            reason: "500_SERVER_ERROR",
            transaction: tx,
            info: {
                urls: urls,
                errorMessages: errorMessages
            }
        });
    }
    _wrapBlock(value, network) {
        return new Block(formatBlock(value), this);
    }
    _wrapLog(value, network) {
        return new Log(formatLog(value), this);
    }
    _wrapTransactionReceipt(value, network) {
        return new TransactionReceipt(formatTransactionReceipt(value), this);
    }
    _wrapTransactionResponse(tx, network) {
        return new TransactionResponse(formatTransactionResponse(tx), this);
    }
    _detectNetwork() {
        assert1(false, "sub-classes must implement this", "UNSUPPORTED_OPERATION", {
            operation: "_detectNetwork"
        });
    }
    async _perform(req) {
        assert1(false, `unsupported method: ${req.method}`, "UNSUPPORTED_OPERATION", {
            operation: req.method,
            info: req
        });
    }
    async getBlockNumber() {
        const blockNumber = getNumber(await this.#perform({
            method: "getBlockNumber"
        }), "%response");
        if (this.#lastBlockNumber >= 0) {
            this.#lastBlockNumber = blockNumber;
        }
        return blockNumber;
    }
    _getAddress(address) {
        return resolveAddress(address, this);
    }
    _getBlockTag(blockTag) {
        if (blockTag == null) {
            return "latest";
        }
        switch(blockTag){
            case "earliest":
                return "0x0";
            case "finalized":
            case "latest":
            case "pending":
            case "safe":
                return blockTag;
        }
        if (isHexString(blockTag)) {
            if (isHexString(blockTag, 32)) {
                return blockTag;
            }
            return toQuantity(blockTag);
        }
        if (typeof blockTag === "bigint") {
            blockTag = getNumber(blockTag, "blockTag");
        }
        if (typeof blockTag === "number") {
            if (blockTag >= 0) {
                return toQuantity(blockTag);
            }
            if (this.#lastBlockNumber >= 0) {
                return toQuantity(this.#lastBlockNumber + blockTag);
            }
            return this.getBlockNumber().then((b)=>toQuantity(b + blockTag));
        }
        assertArgument(false, "invalid blockTag", "blockTag", blockTag);
    }
    _getFilter(filter) {
        const topics = (filter.topics || []).map((t)=>{
            if (t == null) {
                return null;
            }
            if (Array.isArray(t)) {
                return concisify(t.map((t)=>t.toLowerCase()));
            }
            return t.toLowerCase();
        });
        const blockHash = "blockHash" in filter ? filter.blockHash : undefined;
        const resolve = (_address, fromBlock, toBlock)=>{
            let address = undefined;
            switch(_address.length){
                case 0:
                    break;
                case 1:
                    address = _address[0];
                    break;
                default:
                    _address.sort();
                    address = _address;
            }
            if (blockHash) {
                if (fromBlock != null || toBlock != null) {
                    throw new Error("invalid filter");
                }
            }
            const filter = {};
            if (address) {
                filter.address = address;
            }
            if (topics.length) {
                filter.topics = topics;
            }
            if (fromBlock) {
                filter.fromBlock = fromBlock;
            }
            if (toBlock) {
                filter.toBlock = toBlock;
            }
            if (blockHash) {
                filter.blockHash = blockHash;
            }
            return filter;
        };
        let address = [];
        if (filter.address) {
            if (Array.isArray(filter.address)) {
                for (const addr of filter.address){
                    address.push(this._getAddress(addr));
                }
            } else {
                address.push(this._getAddress(filter.address));
            }
        }
        let fromBlock = undefined;
        if ("fromBlock" in filter) {
            fromBlock = this._getBlockTag(filter.fromBlock);
        }
        let toBlock = undefined;
        if ("toBlock" in filter) {
            toBlock = this._getBlockTag(filter.toBlock);
        }
        if (address.filter((a)=>typeof a !== "string").length || fromBlock != null && typeof fromBlock !== "string" || toBlock != null && typeof toBlock !== "string") {
            return Promise.all([
                Promise.all(address),
                fromBlock,
                toBlock
            ]).then((result)=>{
                return resolve(result[0], result[1], result[2]);
            });
        }
        return resolve(address, fromBlock, toBlock);
    }
    _getTransactionRequest(_request) {
        const request = copyRequest(_request);
        const promises = [];
        [
            "to",
            "from"
        ].forEach((key)=>{
            if (request[key] == null) {
                return;
            }
            const addr = resolveAddress(request[key], this);
            if (isPromise$1(addr)) {
                promises.push(async function() {
                    request[key] = await addr;
                }());
            } else {
                request[key] = addr;
            }
        });
        if (request.blockTag != null) {
            const blockTag = this._getBlockTag(request.blockTag);
            if (isPromise$1(blockTag)) {
                promises.push(async function() {
                    request.blockTag = await blockTag;
                }());
            } else {
                request.blockTag = blockTag;
            }
        }
        if (promises.length) {
            return async function() {
                await Promise.all(promises);
                return request;
            }();
        }
        return request;
    }
    async getNetwork() {
        if (this.#networkPromise == null) {
            const detectNetwork = (async ()=>{
                try {
                    const network = await this._detectNetwork();
                    this.emit("network", network, null);
                    return network;
                } catch (error) {
                    if (this.#networkPromise === detectNetwork) {
                        this.#networkPromise = null;
                    }
                    throw error;
                }
            })();
            this.#networkPromise = detectNetwork;
            return (await detectNetwork).clone();
        }
        const networkPromise = this.#networkPromise;
        const [expected, actual] = await Promise.all([
            networkPromise,
            this._detectNetwork()
        ]);
        if (expected.chainId !== actual.chainId) {
            if (this.#anyNetwork) {
                this.emit("network", actual, expected);
                if (this.#networkPromise === networkPromise) {
                    this.#networkPromise = Promise.resolve(actual);
                }
            } else {
                assert1(false, `network changed: ${expected.chainId} => ${actual.chainId} `, "NETWORK_ERROR", {
                    event: "changed"
                });
            }
        }
        return expected.clone();
    }
    async getFeeData() {
        const network = await this.getNetwork();
        const getFeeDataFunc = async ()=>{
            const { _block , gasPrice , priorityFee  } = await resolveProperties({
                _block: this.#getBlock("latest", false),
                gasPrice: (async ()=>{
                    try {
                        const value = await this.#perform({
                            method: "getGasPrice"
                        });
                        return getBigInt(value, "%response");
                    } catch (error) {}
                    return null;
                })(),
                priorityFee: (async ()=>{
                    try {
                        const value = await this.#perform({
                            method: "getPriorityFee"
                        });
                        return getBigInt(value, "%response");
                    } catch (error) {}
                    return null;
                })()
            });
            let maxFeePerGas = null;
            let maxPriorityFeePerGas = null;
            const block = this._wrapBlock(_block, network);
            if (block && block.baseFeePerGas) {
                maxPriorityFeePerGas = priorityFee != null ? priorityFee : BigInt("1000000000");
                maxFeePerGas = block.baseFeePerGas * BN_2$1 + maxPriorityFeePerGas;
            }
            return new FeeData(gasPrice, maxFeePerGas, maxPriorityFeePerGas);
        };
        const plugin = network.getPlugin("org.ethers.plugins.network.FetchUrlFeeDataPlugin");
        if (plugin) {
            const req = new FetchRequest(plugin.url);
            const feeData = await plugin.processFunc(getFeeDataFunc, this, req);
            return new FeeData(feeData.gasPrice, feeData.maxFeePerGas, feeData.maxPriorityFeePerGas);
        }
        return await getFeeDataFunc();
    }
    async estimateGas(_tx) {
        let tx = this._getTransactionRequest(_tx);
        if (isPromise$1(tx)) {
            tx = await tx;
        }
        return getBigInt(await this.#perform({
            method: "estimateGas",
            transaction: tx
        }), "%response");
    }
    async #call(tx, blockTag, attempt1) {
        assert1(attempt1 < 10, "CCIP read exceeded maximum redirections", "OFFCHAIN_FAULT", {
            reason: "TOO_MANY_REDIRECTS",
            transaction: Object.assign({}, tx, {
                blockTag: blockTag,
                enableCcipRead: true
            })
        });
        const transaction = copyRequest(tx);
        try {
            return hexlify(await this._perform({
                method: "call",
                transaction: transaction,
                blockTag: blockTag
            }));
        } catch (error8) {
            if (!this.disableCcipRead && isCallException(error8) && error8.data && attempt1 >= 0 && blockTag === "latest" && transaction.to != null && dataSlice(error8.data, 0, 4) === "0x556f1830") {
                const data1 = error8.data;
                const txSender = await resolveAddress(transaction.to, this);
                let ccipArgs;
                try {
                    ccipArgs = parseOffchainLookup(dataSlice(error8.data, 4));
                } catch (error6) {
                    assert1(false, error6.message, "OFFCHAIN_FAULT", {
                        reason: "BAD_DATA",
                        transaction: transaction,
                        info: {
                            data: data1
                        }
                    });
                }
                assert1(ccipArgs.sender.toLowerCase() === txSender.toLowerCase(), "CCIP Read sender mismatch", "CALL_EXCEPTION", {
                    action: "call",
                    data: data1,
                    reason: "OffchainLookup",
                    transaction: transaction,
                    invocation: null,
                    revert: {
                        signature: "OffchainLookup(address,string[],bytes,bytes4,bytes)",
                        name: "OffchainLookup",
                        args: ccipArgs.errorArgs
                    }
                });
                const ccipResult = await this.ccipReadFetch(transaction, ccipArgs.calldata, ccipArgs.urls);
                assert1(ccipResult != null, "CCIP Read failed to fetch data", "OFFCHAIN_FAULT", {
                    reason: "FETCH_FAILED",
                    transaction: transaction,
                    info: {
                        data: error8.data,
                        errorArgs: ccipArgs.errorArgs
                    }
                });
                const tx1 = {
                    to: txSender,
                    data: concat([
                        ccipArgs.selector,
                        encodeBytes([
                            ccipResult,
                            ccipArgs.extraData
                        ])
                    ])
                };
                this.emit("debug", {
                    action: "sendCcipReadCall",
                    transaction: tx1
                });
                try {
                    const result7 = await this.#call(tx1, blockTag, attempt1 + 1);
                    this.emit("debug", {
                        action: "receiveCcipReadCallResult",
                        transaction: Object.assign({}, tx1),
                        result: result7
                    });
                    return result7;
                } catch (error7) {
                    this.emit("debug", {
                        action: "receiveCcipReadCallError",
                        transaction: Object.assign({}, tx1),
                        error: error7
                    });
                    throw error7;
                }
            }
            throw error8;
        }
    }
    async #checkNetwork(promise) {
        const { value: value1  } = await resolveProperties({
            network: this.getNetwork(),
            value: promise
        });
        return value1;
    }
    async call(_tx) {
        const { tx , blockTag  } = await resolveProperties({
            tx: this._getTransactionRequest(_tx),
            blockTag: this._getBlockTag(_tx.blockTag)
        });
        return await this.#checkNetwork(this.#call(tx, blockTag, _tx.enableCcipRead ? 0 : -1));
    }
    async #getAccountValue(request, _address, _blockTag) {
        let address = this._getAddress(_address);
        let blockTag1 = this._getBlockTag(_blockTag);
        if (typeof address !== "string" || typeof blockTag1 !== "string") {
            [address, blockTag1] = await Promise.all([
                address,
                blockTag1
            ]);
        }
        return await this.#checkNetwork(this.#perform(Object.assign(request, {
            address: address,
            blockTag: blockTag1
        })));
    }
    async getBalance(address, blockTag) {
        return getBigInt(await this.#getAccountValue({
            method: "getBalance"
        }, address, blockTag), "%response");
    }
    async getTransactionCount(address, blockTag) {
        return getNumber(await this.#getAccountValue({
            method: "getTransactionCount"
        }, address, blockTag), "%response");
    }
    async getCode(address, blockTag) {
        return hexlify(await this.#getAccountValue({
            method: "getCode"
        }, address, blockTag));
    }
    async getStorage(address, _position, blockTag) {
        const position = getBigInt(_position, "position");
        return hexlify(await this.#getAccountValue({
            method: "getStorage",
            position: position
        }, address, blockTag));
    }
    async broadcastTransaction(signedTx) {
        const { blockNumber , hash , network  } = await resolveProperties({
            blockNumber: this.getBlockNumber(),
            hash: this._perform({
                method: "broadcastTransaction",
                signedTransaction: signedTx
            }),
            network: this.getNetwork()
        });
        const tx = Transaction.from(signedTx);
        if (tx.hash !== hash) {
            throw new Error("@TODO: the returned hash did not match");
        }
        return this._wrapTransactionResponse(tx, network).replaceableTransaction(blockNumber);
    }
    async #getBlock(block, includeTransactions) {
        if (isHexString(block, 32)) {
            return await this.#perform({
                method: "getBlock",
                blockHash: block,
                includeTransactions: includeTransactions
            });
        }
        let blockTag2 = this._getBlockTag(block);
        if (typeof blockTag2 !== "string") {
            blockTag2 = await blockTag2;
        }
        return await this.#perform({
            method: "getBlock",
            blockTag: blockTag2,
            includeTransactions: includeTransactions
        });
    }
    async getBlock(block, prefetchTxs) {
        const { network , params  } = await resolveProperties({
            network: this.getNetwork(),
            params: this.#getBlock(block, !!prefetchTxs)
        });
        if (params == null) {
            return null;
        }
        return this._wrapBlock(params, network);
    }
    async getTransaction(hash) {
        const { network , params  } = await resolveProperties({
            network: this.getNetwork(),
            params: this.#perform({
                method: "getTransaction",
                hash: hash
            })
        });
        if (params == null) {
            return null;
        }
        return this._wrapTransactionResponse(params, network);
    }
    async getTransactionReceipt(hash) {
        const { network , params  } = await resolveProperties({
            network: this.getNetwork(),
            params: this.#perform({
                method: "getTransactionReceipt",
                hash: hash
            })
        });
        if (params == null) {
            return null;
        }
        if (params.gasPrice == null && params.effectiveGasPrice == null) {
            const tx = await this.#perform({
                method: "getTransaction",
                hash: hash
            });
            if (tx == null) {
                throw new Error("report this; could not find tx or effectiveGasPrice");
            }
            params.effectiveGasPrice = tx.gasPrice;
        }
        return this._wrapTransactionReceipt(params, network);
    }
    async getTransactionResult(hash) {
        const { result  } = await resolveProperties({
            network: this.getNetwork(),
            result: this.#perform({
                method: "getTransactionResult",
                hash: hash
            })
        });
        if (result == null) {
            return null;
        }
        return hexlify(result);
    }
    async getLogs(_filter) {
        let filter = this._getFilter(_filter);
        if (isPromise$1(filter)) {
            filter = await filter;
        }
        const { network , params  } = await resolveProperties({
            network: this.getNetwork(),
            params: this.#perform({
                method: "getLogs",
                filter: filter
            })
        });
        return params.map((p)=>this._wrapLog(p, network));
    }
    _getProvider(chainId) {
        assert1(false, "provider cannot connect to target network", "UNSUPPORTED_OPERATION", {
            operation: "_getProvider()"
        });
    }
    async getResolver(name) {
        return await EnsResolver.fromName(this, name);
    }
    async getAvatar(name) {
        const resolver = await this.getResolver(name);
        if (resolver) {
            return await resolver.getAvatar();
        }
        return null;
    }
    async resolveName(name) {
        const resolver = await this.getResolver(name);
        if (resolver) {
            return await resolver.getAddress();
        }
        return null;
    }
    async lookupAddress(address) {
        address = getAddress(address);
        const node = namehash(address.substring(2).toLowerCase() + ".addr.reverse");
        try {
            const ensAddr = await EnsResolver.getEnsAddress(this);
            const ensContract = new Contract(ensAddr, [
                "function resolver(bytes32) view returns (address)"
            ], this);
            const resolver = await ensContract.resolver(node);
            if (resolver == null || resolver === ZeroAddress) {
                return null;
            }
            const resolverContract = new Contract(resolver, [
                "function name(bytes32) view returns (string)"
            ], this);
            const name = await resolverContract.name(node);
            const check = await this.resolveName(name);
            if (check !== address) {
                return null;
            }
            return name;
        } catch (error) {
            if (isError(error, "BAD_DATA") && error.value === "0x") {
                return null;
            }
            if (isError(error, "CALL_EXCEPTION")) {
                return null;
            }
            throw error;
        }
        return null;
    }
    async waitForTransaction(hash, _confirms, timeout) {
        const confirms = _confirms != null ? _confirms : 1;
        if (confirms === 0) {
            return this.getTransactionReceipt(hash);
        }
        return new Promise(async (resolve, reject)=>{
            let timer = null;
            const listener = async (blockNumber)=>{
                try {
                    const receipt = await this.getTransactionReceipt(hash);
                    if (receipt != null) {
                        if (blockNumber - receipt.blockNumber + 1 >= confirms) {
                            resolve(receipt);
                            if (timer) {
                                clearTimeout(timer);
                                timer = null;
                            }
                            return;
                        }
                    }
                } catch (error) {
                    console.log("EEE", error);
                }
                this.once("block", listener);
            };
            if (timeout != null) {
                timer = setTimeout(()=>{
                    if (timer == null) {
                        return;
                    }
                    timer = null;
                    this.off("block", listener);
                    reject(makeError("timeout", "TIMEOUT", {
                        reason: "timeout"
                    }));
                }, timeout);
            }
            listener(await this.getBlockNumber());
        });
    }
    async waitForBlock(blockTag) {
        assert1(false, "not implemented yet", "NOT_IMPLEMENTED", {
            operation: "waitForBlock"
        });
    }
    _clearTimeout(timerId) {
        const timer = this.#timers.get(timerId);
        if (!timer) {
            return;
        }
        if (timer.timer) {
            clearTimeout(timer.timer);
        }
        this.#timers.delete(timerId);
    }
    _setTimeout(_func, timeout) {
        if (timeout == null) {
            timeout = 0;
        }
        const timerId = this.#nextTimer++;
        const func = ()=>{
            this.#timers.delete(timerId);
            _func();
        };
        if (this.paused) {
            this.#timers.set(timerId, {
                timer: null,
                func: func,
                time: timeout
            });
        } else {
            const timer = setTimeout(func, timeout);
            this.#timers.set(timerId, {
                timer: timer,
                func: func,
                time: getTime$1()
            });
        }
        return timerId;
    }
    _forEachSubscriber(func) {
        for (const sub of this.#subs.values()){
            func(sub.subscriber);
        }
    }
    _getSubscriber(sub) {
        switch(sub.type){
            case "debug":
            case "error":
            case "network":
                return new UnmanagedSubscriber(sub.type);
            case "block":
                {
                    const subscriber = new PollingBlockSubscriber(this);
                    subscriber.pollingInterval = this.pollingInterval;
                    return subscriber;
                }
            case "safe":
            case "finalized":
                return new PollingBlockTagSubscriber(this, sub.type);
            case "event":
                return new PollingEventSubscriber(this, sub.filter);
            case "transaction":
                return new PollingTransactionSubscriber(this, sub.hash);
            case "orphan":
                return new PollingOrphanSubscriber(this, sub.filter);
        }
        throw new Error(`unsupported event: ${sub.type}`);
    }
    _recoverSubscriber(oldSub, newSub) {
        for (const sub of this.#subs.values()){
            if (sub.subscriber === oldSub) {
                if (sub.started) {
                    sub.subscriber.stop();
                }
                sub.subscriber = newSub;
                if (sub.started) {
                    newSub.start();
                }
                if (this.#pausedState != null) {
                    newSub.pause(this.#pausedState);
                }
                break;
            }
        }
    }
    async #hasSub(event, emitArgs) {
        let sub = await getSubscription(event, this);
        if (sub.type === "event" && emitArgs && emitArgs.length > 0 && emitArgs[0].removed === true) {
            sub = await getSubscription({
                orphan: "drop-log",
                log: emitArgs[0]
            }, this);
        }
        return this.#subs.get(sub.tag) || null;
    }
    async #getSub(event1) {
        const subscription = await getSubscription(event1, this);
        const tag1 = subscription.tag;
        let sub1 = this.#subs.get(tag1);
        if (!sub1) {
            const subscriber = this._getSubscriber(subscription);
            const addressableMap = new WeakMap;
            const nameMap = new Map;
            sub1 = {
                subscriber: subscriber,
                tag: tag1,
                addressableMap: addressableMap,
                nameMap: nameMap,
                started: false,
                listeners: []
            };
            this.#subs.set(tag1, sub1);
        }
        return sub1;
    }
    async on(event, listener) {
        const sub = await this.#getSub(event);
        sub.listeners.push({
            listener: listener,
            once: false
        });
        if (!sub.started) {
            sub.subscriber.start();
            sub.started = true;
            if (this.#pausedState != null) {
                sub.subscriber.pause(this.#pausedState);
            }
        }
        return this;
    }
    async once(event, listener) {
        const sub = await this.#getSub(event);
        sub.listeners.push({
            listener: listener,
            once: true
        });
        if (!sub.started) {
            sub.subscriber.start();
            sub.started = true;
            if (this.#pausedState != null) {
                sub.subscriber.pause(this.#pausedState);
            }
        }
        return this;
    }
    async emit(event, ...args) {
        const sub = await this.#hasSub(event, args);
        if (!sub || sub.listeners.length === 0) {
            return false;
        }
        const count = sub.listeners.length;
        sub.listeners = sub.listeners.filter(({ listener , once  })=>{
            const payload = new EventPayload(this, once ? null : listener, event);
            try {
                listener.call(this, ...args, payload);
            } catch (error) {}
            return !once;
        });
        if (sub.listeners.length === 0) {
            if (sub.started) {
                sub.subscriber.stop();
            }
            this.#subs.delete(sub.tag);
        }
        return count > 0;
    }
    async listenerCount(event) {
        if (event) {
            const sub = await this.#hasSub(event);
            if (!sub) {
                return 0;
            }
            return sub.listeners.length;
        }
        let total = 0;
        for (const { listeners  } of this.#subs.values()){
            total += listeners.length;
        }
        return total;
    }
    async listeners(event) {
        if (event) {
            const sub = await this.#hasSub(event);
            if (!sub) {
                return [];
            }
            return sub.listeners.map(({ listener  })=>listener);
        }
        let result = [];
        for (const { listeners  } of this.#subs.values()){
            result = result.concat(listeners.map(({ listener  })=>listener));
        }
        return result;
    }
    async off(event, listener) {
        const sub = await this.#hasSub(event);
        if (!sub) {
            return this;
        }
        if (listener) {
            const index = sub.listeners.map(({ listener  })=>listener).indexOf(listener);
            if (index >= 0) {
                sub.listeners.splice(index, 1);
            }
        }
        if (!listener || sub.listeners.length === 0) {
            if (sub.started) {
                sub.subscriber.stop();
            }
            this.#subs.delete(sub.tag);
        }
        return this;
    }
    async removeAllListeners(event) {
        if (event) {
            const { tag , started , subscriber  } = await this.#getSub(event);
            if (started) {
                subscriber.stop();
            }
            this.#subs.delete(tag);
        } else {
            for (const [tag1, { started: started1 , subscriber: subscriber1  }] of this.#subs){
                if (started1) {
                    subscriber1.stop();
                }
                this.#subs.delete(tag1);
            }
        }
        return this;
    }
    async addListener(event, listener) {
        return await this.on(event, listener);
    }
    async removeListener(event, listener) {
        return this.off(event, listener);
    }
    get destroyed() {
        return this.#destroyed;
    }
    destroy() {
        this.removeAllListeners();
        for (const timerId of this.#timers.keys()){
            this._clearTimeout(timerId);
        }
        this.#destroyed = true;
    }
    get paused() {
        return this.#pausedState != null;
    }
    set paused(pause) {
        if (!!pause === this.paused) {
            return;
        }
        if (this.paused) {
            this.resume();
        } else {
            this.pause(false);
        }
    }
    pause(dropWhilePaused) {
        this.#lastBlockNumber = -1;
        if (this.#pausedState != null) {
            if (this.#pausedState == !!dropWhilePaused) {
                return;
            }
            assert1(false, "cannot change pause type; resume first", "UNSUPPORTED_OPERATION", {
                operation: "pause"
            });
        }
        this._forEachSubscriber((s)=>s.pause(dropWhilePaused));
        this.#pausedState = !!dropWhilePaused;
        for (const timer of this.#timers.values()){
            if (timer.timer) {
                clearTimeout(timer.timer);
            }
            timer.time = getTime$1() - timer.time;
        }
    }
    resume() {
        if (this.#pausedState == null) {
            return;
        }
        this._forEachSubscriber((s)=>s.resume());
        this.#pausedState = null;
        for (const timer of this.#timers.values()){
            let timeout = timer.time;
            if (timeout < 0) {
                timeout = 0;
            }
            timer.time = getTime$1();
            setTimeout(timer.func, timeout);
        }
    }
}
function _parseString(result, start) {
    try {
        const bytes = _parseBytes(result, start);
        if (bytes) {
            return toUtf8String(bytes);
        }
    } catch (error) {}
    return null;
}
function _parseBytes(result, start) {
    if (result === "0x") {
        return null;
    }
    try {
        const offset = getNumber(dataSlice(result, start, start + 32));
        const length = getNumber(dataSlice(result, offset, offset + 32));
        return dataSlice(result, offset + 32, offset + 32 + length);
    } catch (error) {}
    return null;
}
function numPad(value) {
    const result = toBeArray(value);
    if (result.length > 32) {
        throw new Error("internal; should not happen");
    }
    const padded = new Uint8Array(32);
    padded.set(result, 32 - result.length);
    return padded;
}
function bytesPad(value) {
    if (value.length % 32 === 0) {
        return value;
    }
    const result = new Uint8Array(Math.ceil(value.length / 32) * 32);
    result.set(value);
    return result;
}
const empty = new Uint8Array([]);
function encodeBytes(datas) {
    const result = [];
    let byteCount = 0;
    for(let i = 0; i < datas.length; i++){
        result.push(empty);
        byteCount += 32;
    }
    for(let i1 = 0; i1 < datas.length; i1++){
        const data = getBytes(datas[i1]);
        result[i1] = numPad(byteCount);
        result.push(numPad(data.length));
        result.push(bytesPad(data));
        byteCount += 32 + Math.ceil(data.length / 32) * 32;
    }
    return concat(result);
}
const zeros = "0x0000000000000000000000000000000000000000000000000000000000000000";
function parseOffchainLookup(data) {
    const result = {
        sender: "",
        urls: [],
        calldata: "",
        selector: "",
        extraData: "",
        errorArgs: []
    };
    assert1(dataLength(data) >= 5 * 32, "insufficient OffchainLookup data", "OFFCHAIN_FAULT", {
        reason: "insufficient OffchainLookup data"
    });
    const sender = dataSlice(data, 0, 32);
    assert1(dataSlice(sender, 0, 12) === dataSlice(zeros, 0, 12), "corrupt OffchainLookup sender", "OFFCHAIN_FAULT", {
        reason: "corrupt OffchainLookup sender"
    });
    result.sender = dataSlice(sender, 12);
    try {
        const urls = [];
        const urlsOffset = getNumber(dataSlice(data, 32, 64));
        const urlsLength = getNumber(dataSlice(data, urlsOffset, urlsOffset + 32));
        const urlsData = dataSlice(data, urlsOffset + 32);
        for(let u = 0; u < urlsLength; u++){
            const url = _parseString(urlsData, u * 32);
            if (url == null) {
                throw new Error("abort");
            }
            urls.push(url);
        }
        result.urls = urls;
    } catch (error) {
        assert1(false, "corrupt OffchainLookup urls", "OFFCHAIN_FAULT", {
            reason: "corrupt OffchainLookup urls"
        });
    }
    try {
        const calldata = _parseBytes(data, 64);
        if (calldata == null) {
            throw new Error("abort");
        }
        result.calldata = calldata;
    } catch (error1) {
        assert1(false, "corrupt OffchainLookup calldata", "OFFCHAIN_FAULT", {
            reason: "corrupt OffchainLookup calldata"
        });
    }
    assert1(dataSlice(data, 100, 128) === dataSlice(zeros, 0, 28), "corrupt OffchainLookup callbaackSelector", "OFFCHAIN_FAULT", {
        reason: "corrupt OffchainLookup callbaackSelector"
    });
    result.selector = dataSlice(data, 96, 100);
    try {
        const extraData = _parseBytes(data, 128);
        if (extraData == null) {
            throw new Error("abort");
        }
        result.extraData = extraData;
    } catch (error2) {
        assert1(false, "corrupt OffchainLookup extraData", "OFFCHAIN_FAULT", {
            reason: "corrupt OffchainLookup extraData"
        });
    }
    result.errorArgs = "sender,urls,calldata,selector,extraData".split(/,/).map((k)=>result[k]);
    return result;
}
function checkProvider(signer, operation) {
    if (signer.provider) {
        return signer.provider;
    }
    assert1(false, "missing provider", "UNSUPPORTED_OPERATION", {
        operation: operation
    });
}
async function populate(signer, tx) {
    let pop = copyRequest(tx);
    if (pop.to != null) {
        pop.to = resolveAddress(pop.to, signer);
    }
    if (pop.from != null) {
        const from = pop.from;
        pop.from = Promise.all([
            signer.getAddress(),
            resolveAddress(from, signer)
        ]).then(([address, from])=>{
            assertArgument(address.toLowerCase() === from.toLowerCase(), "transaction from mismatch", "tx.from", from);
            return address;
        });
    } else {
        pop.from = signer.getAddress();
    }
    return await resolveProperties(pop);
}
class AbstractSigner {
    provider;
    constructor(provider){
        defineProperties(this, {
            provider: provider || null
        });
    }
    async getNonce(blockTag) {
        return checkProvider(this, "getTransactionCount").getTransactionCount(await this.getAddress(), blockTag);
    }
    async populateCall(tx) {
        const pop = await populate(this, tx);
        return pop;
    }
    async populateTransaction(tx) {
        const provider = checkProvider(this, "populateTransaction");
        const pop = await populate(this, tx);
        if (pop.nonce == null) {
            pop.nonce = await this.getNonce("pending");
        }
        if (pop.gasLimit == null) {
            pop.gasLimit = await this.estimateGas(pop);
        }
        const network = await this.provider.getNetwork();
        if (pop.chainId != null) {
            const chainId = getBigInt(pop.chainId);
            assertArgument(chainId === network.chainId, "transaction chainId mismatch", "tx.chainId", tx.chainId);
        } else {
            pop.chainId = network.chainId;
        }
        const hasEip1559 = pop.maxFeePerGas != null || pop.maxPriorityFeePerGas != null;
        if (pop.gasPrice != null && (pop.type === 2 || hasEip1559)) {
            assertArgument(false, "eip-1559 transaction do not support gasPrice", "tx", tx);
        } else if ((pop.type === 0 || pop.type === 1) && hasEip1559) {
            assertArgument(false, "pre-eip-1559 transaction do not support maxFeePerGas/maxPriorityFeePerGas", "tx", tx);
        }
        if ((pop.type === 2 || pop.type == null) && pop.maxFeePerGas != null && pop.maxPriorityFeePerGas != null) {
            pop.type = 2;
        } else if (pop.type === 0 || pop.type === 1) {
            const feeData = await provider.getFeeData();
            assert1(feeData.gasPrice != null, "network does not support gasPrice", "UNSUPPORTED_OPERATION", {
                operation: "getGasPrice"
            });
            if (pop.gasPrice == null) {
                pop.gasPrice = feeData.gasPrice;
            }
        } else {
            const feeData1 = await provider.getFeeData();
            if (pop.type == null) {
                if (feeData1.maxFeePerGas != null && feeData1.maxPriorityFeePerGas != null) {
                    pop.type = 2;
                    if (pop.gasPrice != null) {
                        const gasPrice = pop.gasPrice;
                        delete pop.gasPrice;
                        pop.maxFeePerGas = gasPrice;
                        pop.maxPriorityFeePerGas = gasPrice;
                    } else {
                        if (pop.maxFeePerGas == null) {
                            pop.maxFeePerGas = feeData1.maxFeePerGas;
                        }
                        if (pop.maxPriorityFeePerGas == null) {
                            pop.maxPriorityFeePerGas = feeData1.maxPriorityFeePerGas;
                        }
                    }
                } else if (feeData1.gasPrice != null) {
                    assert1(!hasEip1559, "network does not support EIP-1559", "UNSUPPORTED_OPERATION", {
                        operation: "populateTransaction"
                    });
                    if (pop.gasPrice == null) {
                        pop.gasPrice = feeData1.gasPrice;
                    }
                    pop.type = 0;
                } else {
                    assert1(false, "failed to get consistent fee data", "UNSUPPORTED_OPERATION", {
                        operation: "signer.getFeeData"
                    });
                }
            } else if (pop.type === 2 || pop.type === 3) {
                if (pop.maxFeePerGas == null) {
                    pop.maxFeePerGas = feeData1.maxFeePerGas;
                }
                if (pop.maxPriorityFeePerGas == null) {
                    pop.maxPriorityFeePerGas = feeData1.maxPriorityFeePerGas;
                }
            }
        }
        return await resolveProperties(pop);
    }
    async estimateGas(tx) {
        return checkProvider(this, "estimateGas").estimateGas(await this.populateCall(tx));
    }
    async call(tx) {
        return checkProvider(this, "call").call(await this.populateCall(tx));
    }
    async resolveName(name) {
        const provider = checkProvider(this, "resolveName");
        return await provider.resolveName(name);
    }
    async sendTransaction(tx) {
        const provider = checkProvider(this, "sendTransaction");
        const pop = await this.populateTransaction(tx);
        delete pop.from;
        const txObj = Transaction.from(pop);
        return await provider.broadcastTransaction(await this.signTransaction(txObj));
    }
}
class VoidSigner extends AbstractSigner {
    address;
    constructor(address, provider){
        super(provider);
        defineProperties(this, {
            address: address
        });
    }
    async getAddress() {
        return this.address;
    }
    connect(provider) {
        return new VoidSigner(this.address, provider);
    }
    #throwUnsupported(suffix, operation) {
        assert1(false, `VoidSigner cannot sign ${suffix}`, "UNSUPPORTED_OPERATION", {
            operation: operation
        });
    }
    async signTransaction(tx) {
        this.#throwUnsupported("transactions", "signTransaction");
    }
    async signMessage(message) {
        this.#throwUnsupported("messages", "signMessage");
    }
    async signTypedData(domain, types, value) {
        this.#throwUnsupported("typed-data", "signTypedData");
    }
}
const shown = new Set;
function showThrottleMessage(service) {
    if (shown.has(service)) {
        return;
    }
    shown.add(service);
    console.log("========= NOTICE =========");
    console.log(`Request-Rate Exceeded for ${service} (this message will not be repeated)`);
    console.log("");
    console.log("The default API keys for each service are provided as a highly-throttled,");
    console.log("community resource for low-traffic projects and early prototyping.");
    console.log("");
    console.log("While your application will continue to function, we highly recommended");
    console.log("signing up for your own API keys to improve performance, increase your");
    console.log("request rate/limit and enable other perks, such as metrics and advanced APIs.");
    console.log("");
    console.log("For more details: https://docs.ethers.org/api-keys/");
    console.log("==========================");
}
function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}
class FilterIdSubscriber {
    #provider;
    #filterIdPromise;
    #poller;
    #running;
    #network;
    #hault;
    constructor(provider){
        this.#provider = provider;
        this.#filterIdPromise = null;
        this.#poller = this.#poll.bind(this);
        this.#running = false;
        this.#network = null;
        this.#hault = false;
    }
    _subscribe(provider) {
        throw new Error("subclasses must override this");
    }
    _emitResults(provider, result) {
        throw new Error("subclasses must override this");
    }
    _recover(provider) {
        throw new Error("subclasses must override this");
    }
    async #poll(blockNumber2) {
        try {
            if (this.#filterIdPromise == null) {
                this.#filterIdPromise = this._subscribe(this.#provider);
            }
            let filterId = null;
            try {
                filterId = await this.#filterIdPromise;
            } catch (error9) {
                if (!isError(error9, "UNSUPPORTED_OPERATION") || error9.operation !== "eth_newFilter") {
                    throw error9;
                }
            }
            if (filterId == null) {
                this.#filterIdPromise = null;
                this.#provider._recoverSubscriber(this, this._recover(this.#provider));
                return;
            }
            const network = await this.#provider.getNetwork();
            if (!this.#network) {
                this.#network = network;
            }
            if (this.#network.chainId !== network.chainId) {
                throw new Error("chaid changed");
            }
            if (this.#hault) {
                return;
            }
            const result8 = await this.#provider.send("eth_getFilterChanges", [
                filterId
            ]);
            await this._emitResults(this.#provider, result8);
        } catch (error10) {
            console.log("@TODO", error10);
        }
        this.#provider.once("block", this.#poller);
    }
    #teardown() {
        const filterIdPromise = this.#filterIdPromise;
        if (filterIdPromise) {
            this.#filterIdPromise = null;
            filterIdPromise.then((filterId)=>{
                if (this.#provider.destroyed) {
                    return;
                }
                this.#provider.send("eth_uninstallFilter", [
                    filterId
                ]);
            });
        }
    }
    start() {
        if (this.#running) {
            return;
        }
        this.#running = true;
        this.#poll(-2);
    }
    stop() {
        if (!this.#running) {
            return;
        }
        this.#running = false;
        this.#hault = true;
        this.#teardown();
        this.#provider.off("block", this.#poller);
    }
    pause(dropWhilePaused) {
        if (dropWhilePaused) {
            this.#teardown();
        }
        this.#provider.off("block", this.#poller);
    }
    resume() {
        this.start();
    }
}
class FilterIdEventSubscriber extends FilterIdSubscriber {
    #event;
    constructor(provider, filter){
        super(provider);
        this.#event = copy(filter);
    }
    _recover(provider) {
        return new PollingEventSubscriber(provider, this.#event);
    }
    async _subscribe(provider) {
        const filterId = await provider.send("eth_newFilter", [
            this.#event
        ]);
        return filterId;
    }
    async _emitResults(provider, results) {
        for (const result of results){
            provider.emit(this.#event, provider._wrapLog(result, provider._network));
        }
    }
}
class FilterIdPendingSubscriber extends FilterIdSubscriber {
    async _subscribe(provider) {
        return await provider.send("eth_newPendingTransactionFilter", []);
    }
    async _emitResults(provider, results) {
        for (const result of results){
            provider.emit("pending", result);
        }
    }
}
const Primitive = "bigint,boolean,function,number,string,symbol".split(/,/g);
function deepCopy(value) {
    if (value == null || Primitive.indexOf(typeof value) >= 0) {
        return value;
    }
    if (typeof value.getAddress === "function") {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(deepCopy);
    }
    if (typeof value === "object") {
        return Object.keys(value).reduce((accum, key)=>{
            accum[key] = value[key];
            return accum;
        }, {});
    }
    throw new Error(`should not happen: ${value} (${typeof value})`);
}
function stall$3(duration) {
    return new Promise((resolve)=>{
        setTimeout(resolve, duration);
    });
}
function getLowerCase(value) {
    if (value) {
        return value.toLowerCase();
    }
    return value;
}
function isPollable(value) {
    return value && typeof value.pollingInterval === "number";
}
const defaultOptions = {
    polling: false,
    staticNetwork: null,
    batchStallTime: 10,
    batchMaxSize: 1 << 20,
    batchMaxCount: 100,
    cacheTimeout: 250,
    pollingInterval: 4e3
};
class JsonRpcSigner extends AbstractSigner {
    address;
    constructor(provider, address){
        super(provider);
        address = getAddress(address);
        defineProperties(this, {
            address: address
        });
    }
    connect(provider) {
        assert1(false, "cannot reconnect JsonRpcSigner", "UNSUPPORTED_OPERATION", {
            operation: "signer.connect"
        });
    }
    async getAddress() {
        return this.address;
    }
    async populateTransaction(tx) {
        return await this.populateCall(tx);
    }
    async sendUncheckedTransaction(_tx) {
        const tx = deepCopy(_tx);
        const promises = [];
        if (tx.from) {
            const _from = tx.from;
            promises.push((async ()=>{
                const from = await resolveAddress(_from, this.provider);
                assertArgument(from != null && from.toLowerCase() === this.address.toLowerCase(), "from address mismatch", "transaction", _tx);
                tx.from = from;
            })());
        } else {
            tx.from = this.address;
        }
        if (tx.gasLimit == null) {
            promises.push((async ()=>{
                tx.gasLimit = await this.provider.estimateGas({
                    ...tx,
                    from: this.address
                });
            })());
        }
        if (tx.to != null) {
            const _to = tx.to;
            promises.push((async ()=>{
                tx.to = await resolveAddress(_to, this.provider);
            })());
        }
        if (promises.length) {
            await Promise.all(promises);
        }
        const hexTx = this.provider.getRpcTransaction(tx);
        return this.provider.send("eth_sendTransaction", [
            hexTx
        ]);
    }
    async sendTransaction(tx) {
        const blockNumber = await this.provider.getBlockNumber();
        const hash = await this.sendUncheckedTransaction(tx);
        return await new Promise((resolve, reject)=>{
            const timeouts = [
                1e3,
                100
            ];
            let invalids = 0;
            const checkTx = async ()=>{
                try {
                    const tx = await this.provider.getTransaction(hash);
                    if (tx != null) {
                        resolve(tx.replaceableTransaction(blockNumber));
                        return;
                    }
                } catch (error) {
                    if (isError(error, "CANCELLED") || isError(error, "BAD_DATA") || isError(error, "NETWORK_ERROR") || isError(error, "UNSUPPORTED_OPERATION")) {
                        if (error.info == null) {
                            error.info = {};
                        }
                        error.info.sendTransactionHash = hash;
                        reject(error);
                        return;
                    }
                    if (isError(error, "INVALID_ARGUMENT")) {
                        invalids++;
                        if (error.info == null) {
                            error.info = {};
                        }
                        error.info.sendTransactionHash = hash;
                        if (invalids > 10) {
                            reject(error);
                            return;
                        }
                    }
                    this.provider.emit("error", makeError("failed to fetch transation after sending (will try again)", "UNKNOWN_ERROR", {
                        error: error
                    }));
                }
                this.provider._setTimeout(()=>{
                    checkTx();
                }, timeouts.pop() || 4e3);
            };
            checkTx();
        });
    }
    async signTransaction(_tx) {
        const tx = deepCopy(_tx);
        if (tx.from) {
            const from = await resolveAddress(tx.from, this.provider);
            assertArgument(from != null && from.toLowerCase() === this.address.toLowerCase(), "from address mismatch", "transaction", _tx);
            tx.from = from;
        } else {
            tx.from = this.address;
        }
        const hexTx = this.provider.getRpcTransaction(tx);
        return await this.provider.send("eth_signTransaction", [
            hexTx
        ]);
    }
    async signMessage(_message) {
        const message = typeof _message === "string" ? toUtf8Bytes(_message) : _message;
        return await this.provider.send("personal_sign", [
            hexlify(message),
            this.address.toLowerCase()
        ]);
    }
    async signTypedData(domain, types, _value) {
        const value = deepCopy(_value);
        const populated = await TypedDataEncoder.resolveNames(domain, types, value, async (value)=>{
            const address = await resolveAddress(value);
            assertArgument(address != null, "TypedData does not support null address", "value", value);
            return address;
        });
        return await this.provider.send("eth_signTypedData_v4", [
            this.address.toLowerCase(),
            JSON.stringify(TypedDataEncoder.getPayload(populated.domain, types, populated.value))
        ]);
    }
    async unlock(password) {
        return this.provider.send("personal_unlockAccount", [
            this.address.toLowerCase(),
            password,
            null
        ]);
    }
    async _legacySignMessage(_message) {
        const message = typeof _message === "string" ? toUtf8Bytes(_message) : _message;
        return await this.provider.send("eth_sign", [
            this.address.toLowerCase(),
            hexlify(message)
        ]);
    }
}
class JsonRpcApiProvider extends AbstractProvider {
    #options;
    #nextId;
    #payloads;
    #drainTimer;
    #notReady;
    #network;
    #pendingDetectNetwork;
    #scheduleDrain() {
        if (this.#drainTimer) {
            return;
        }
        const stallTime = this._getOption("batchMaxCount") === 1 ? 0 : this._getOption("batchStallTime");
        this.#drainTimer = setTimeout(()=>{
            this.#drainTimer = null;
            const payloads = this.#payloads;
            this.#payloads = [];
            while(payloads.length){
                const batch = [
                    payloads.shift()
                ];
                while(payloads.length){
                    if (batch.length === this.#options.batchMaxCount) {
                        break;
                    }
                    batch.push(payloads.shift());
                    const bytes = JSON.stringify(batch.map((p)=>p.payload));
                    if (bytes.length > this.#options.batchMaxSize) {
                        payloads.unshift(batch.pop());
                        break;
                    }
                }
                (async ()=>{
                    const payload = batch.length === 1 ? batch[0].payload : batch.map((p)=>p.payload);
                    this.emit("debug", {
                        action: "sendRpcPayload",
                        payload: payload
                    });
                    try {
                        const result = await this._send(payload);
                        this.emit("debug", {
                            action: "receiveRpcResult",
                            result: result
                        });
                        for (const { resolve , reject , payload: payload1  } of batch){
                            if (this.destroyed) {
                                reject(makeError("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", {
                                    operation: payload1.method
                                }));
                                continue;
                            }
                            const resp = result.filter((r)=>r.id === payload1.id)[0];
                            if (resp == null) {
                                const error = makeError("missing response for request", "BAD_DATA", {
                                    value: result,
                                    info: {
                                        payload: payload1
                                    }
                                });
                                this.emit("error", error);
                                reject(error);
                                continue;
                            }
                            if ("error" in resp) {
                                reject(this.getRpcError(payload1, resp));
                                continue;
                            }
                            resolve(resp.result);
                        }
                    } catch (error1) {
                        this.emit("debug", {
                            action: "receiveRpcError",
                            error: error1
                        });
                        for (const { reject: reject1  } of batch){
                            reject1(error1);
                        }
                    }
                })();
            }
        }, stallTime);
    }
    constructor(network, options){
        super(network, options);
        this.#nextId = 1;
        this.#options = Object.assign({}, defaultOptions, options || {});
        this.#payloads = [];
        this.#drainTimer = null;
        this.#network = null;
        this.#pendingDetectNetwork = null;
        {
            let resolve = null;
            const promise = new Promise((_resolve)=>{
                resolve = _resolve;
            });
            this.#notReady = {
                promise: promise,
                resolve: resolve
            };
        }
        const staticNetwork = this._getOption("staticNetwork");
        if (typeof staticNetwork === "boolean") {
            assertArgument(!staticNetwork || network !== "any", "staticNetwork cannot be used on special network 'any'", "options", options);
            if (staticNetwork && network != null) {
                this.#network = Network.from(network);
            }
        } else if (staticNetwork) {
            assertArgument(network == null || staticNetwork.matches(network), "staticNetwork MUST match network object", "options", options);
            this.#network = staticNetwork;
        }
    }
    _getOption(key) {
        return this.#options[key];
    }
    get _network() {
        assert1(this.#network, "network is not available yet", "NETWORK_ERROR");
        return this.#network;
    }
    async _perform(req) {
        if (req.method === "call" || req.method === "estimateGas") {
            let tx = req.transaction;
            if (tx && tx.type != null && getBigInt(tx.type)) {
                if (tx.maxFeePerGas == null && tx.maxPriorityFeePerGas == null) {
                    const feeData = await this.getFeeData();
                    if (feeData.maxFeePerGas == null && feeData.maxPriorityFeePerGas == null) {
                        req = Object.assign({}, req, {
                            transaction: Object.assign({}, tx, {
                                type: undefined
                            })
                        });
                    }
                }
            }
        }
        const request = this.getRpcRequest(req);
        if (request != null) {
            return await this.send(request.method, request.args);
        }
        return super._perform(req);
    }
    async _detectNetwork() {
        const network = this._getOption("staticNetwork");
        if (network) {
            if (network === true) {
                if (this.#network) {
                    return this.#network;
                }
            } else {
                return network;
            }
        }
        if (this.#pendingDetectNetwork) {
            return await this.#pendingDetectNetwork;
        }
        if (this.ready) {
            this.#pendingDetectNetwork = (async ()=>{
                try {
                    const result = Network.from(getBigInt(await this.send("eth_chainId", [])));
                    this.#pendingDetectNetwork = null;
                    return result;
                } catch (error) {
                    this.#pendingDetectNetwork = null;
                    throw error;
                }
            })();
            return await this.#pendingDetectNetwork;
        }
        this.#pendingDetectNetwork = (async ()=>{
            const payload = {
                id: this.#nextId++,
                method: "eth_chainId",
                params: [],
                jsonrpc: "2.0"
            };
            this.emit("debug", {
                action: "sendRpcPayload",
                payload: payload
            });
            let result;
            try {
                result = (await this._send(payload))[0];
                this.#pendingDetectNetwork = null;
            } catch (error) {
                this.#pendingDetectNetwork = null;
                this.emit("debug", {
                    action: "receiveRpcError",
                    error: error
                });
                throw error;
            }
            this.emit("debug", {
                action: "receiveRpcResult",
                result: result
            });
            if ("result" in result) {
                return Network.from(getBigInt(result.result));
            }
            throw this.getRpcError(payload, result);
        })();
        return await this.#pendingDetectNetwork;
    }
    _start() {
        if (this.#notReady == null || this.#notReady.resolve == null) {
            return;
        }
        this.#notReady.resolve();
        this.#notReady = null;
        (async ()=>{
            while(this.#network == null && !this.destroyed){
                try {
                    this.#network = await this._detectNetwork();
                } catch (error) {
                    if (this.destroyed) {
                        break;
                    }
                    console.log("JsonRpcProvider failed to detect network and cannot start up; retry in 1s (perhaps the URL is wrong or the node is not started)");
                    this.emit("error", makeError("failed to bootstrap network detection", "NETWORK_ERROR", {
                        event: "initial-network-discovery",
                        info: {
                            error: error
                        }
                    }));
                    await stall$3(1e3);
                }
            }
            this.#scheduleDrain();
        })();
    }
    async _waitUntilReady() {
        if (this.#notReady == null) {
            return;
        }
        return await this.#notReady.promise;
    }
    _getSubscriber(sub) {
        if (sub.type === "pending") {
            return new FilterIdPendingSubscriber(this);
        }
        if (sub.type === "event") {
            if (this._getOption("polling")) {
                return new PollingEventSubscriber(this, sub.filter);
            }
            return new FilterIdEventSubscriber(this, sub.filter);
        }
        if (sub.type === "orphan" && sub.filter.orphan === "drop-log") {
            return new UnmanagedSubscriber("orphan");
        }
        return super._getSubscriber(sub);
    }
    get ready() {
        return this.#notReady == null;
    }
    getRpcTransaction(tx) {
        const result = {};
        [
            "chainId",
            "gasLimit",
            "gasPrice",
            "type",
            "maxFeePerGas",
            "maxPriorityFeePerGas",
            "nonce",
            "value"
        ].forEach((key)=>{
            if (tx[key] == null) {
                return;
            }
            let dstKey = key;
            if (key === "gasLimit") {
                dstKey = "gas";
            }
            result[dstKey] = toQuantity(getBigInt(tx[key], `tx.${key}`));
        });
        [
            "from",
            "to",
            "data"
        ].forEach((key)=>{
            if (tx[key] == null) {
                return;
            }
            result[key] = hexlify(tx[key]);
        });
        if (tx.accessList) {
            result["accessList"] = accessListify(tx.accessList);
        }
        if (tx.blobVersionedHashes) {
            result["blobVersionedHashes"] = tx.blobVersionedHashes.map((h)=>h.toLowerCase());
        }
        return result;
    }
    getRpcRequest(req) {
        switch(req.method){
            case "chainId":
                return {
                    method: "eth_chainId",
                    args: []
                };
            case "getBlockNumber":
                return {
                    method: "eth_blockNumber",
                    args: []
                };
            case "getGasPrice":
                return {
                    method: "eth_gasPrice",
                    args: []
                };
            case "getPriorityFee":
                return {
                    method: "eth_maxPriorityFeePerGas",
                    args: []
                };
            case "getBalance":
                return {
                    method: "eth_getBalance",
                    args: [
                        getLowerCase(req.address),
                        req.blockTag
                    ]
                };
            case "getTransactionCount":
                return {
                    method: "eth_getTransactionCount",
                    args: [
                        getLowerCase(req.address),
                        req.blockTag
                    ]
                };
            case "getCode":
                return {
                    method: "eth_getCode",
                    args: [
                        getLowerCase(req.address),
                        req.blockTag
                    ]
                };
            case "getStorage":
                return {
                    method: "eth_getStorageAt",
                    args: [
                        getLowerCase(req.address),
                        "0x" + req.position.toString(16),
                        req.blockTag
                    ]
                };
            case "broadcastTransaction":
                return {
                    method: "eth_sendRawTransaction",
                    args: [
                        req.signedTransaction
                    ]
                };
            case "getBlock":
                if ("blockTag" in req) {
                    return {
                        method: "eth_getBlockByNumber",
                        args: [
                            req.blockTag,
                            !!req.includeTransactions
                        ]
                    };
                } else if ("blockHash" in req) {
                    return {
                        method: "eth_getBlockByHash",
                        args: [
                            req.blockHash,
                            !!req.includeTransactions
                        ]
                    };
                }
                break;
            case "getTransaction":
                return {
                    method: "eth_getTransactionByHash",
                    args: [
                        req.hash
                    ]
                };
            case "getTransactionReceipt":
                return {
                    method: "eth_getTransactionReceipt",
                    args: [
                        req.hash
                    ]
                };
            case "call":
                return {
                    method: "eth_call",
                    args: [
                        this.getRpcTransaction(req.transaction),
                        req.blockTag
                    ]
                };
            case "estimateGas":
                {
                    return {
                        method: "eth_estimateGas",
                        args: [
                            this.getRpcTransaction(req.transaction)
                        ]
                    };
                }
            case "getLogs":
                if (req.filter && req.filter.address != null) {
                    if (Array.isArray(req.filter.address)) {
                        req.filter.address = req.filter.address.map(getLowerCase);
                    } else {
                        req.filter.address = getLowerCase(req.filter.address);
                    }
                }
                return {
                    method: "eth_getLogs",
                    args: [
                        req.filter
                    ]
                };
        }
        return null;
    }
    getRpcError(payload, _error) {
        const { method  } = payload;
        const { error  } = _error;
        if (method === "eth_estimateGas" && error.message) {
            const msg = error.message;
            if (!msg.match(/revert/i) && msg.match(/insufficient funds/i)) {
                return makeError("insufficient funds", "INSUFFICIENT_FUNDS", {
                    transaction: payload.params[0],
                    info: {
                        payload: payload,
                        error: error
                    }
                });
            }
        }
        if (method === "eth_call" || method === "eth_estimateGas") {
            const result = spelunkData(error);
            const e = AbiCoder.getBuiltinCallException(method === "eth_call" ? "call" : "estimateGas", payload.params[0], result ? result.data : null);
            e.info = {
                error: error,
                payload: payload
            };
            return e;
        }
        const message = JSON.stringify(spelunkMessage(error));
        if (typeof error.message === "string" && error.message.match(/user denied|ethers-user-denied/i)) {
            const actionMap = {
                eth_sign: "signMessage",
                personal_sign: "signMessage",
                eth_signTypedData_v4: "signTypedData",
                eth_signTransaction: "signTransaction",
                eth_sendTransaction: "sendTransaction",
                eth_requestAccounts: "requestAccess",
                wallet_requestAccounts: "requestAccess"
            };
            return makeError(`user rejected action`, "ACTION_REJECTED", {
                action: actionMap[method] || "unknown",
                reason: "rejected",
                info: {
                    payload: payload,
                    error: error
                }
            });
        }
        if (method === "eth_sendRawTransaction" || method === "eth_sendTransaction") {
            const transaction = payload.params[0];
            if (message.match(/insufficient funds|base fee exceeds gas limit/i)) {
                return makeError("insufficient funds for intrinsic transaction cost", "INSUFFICIENT_FUNDS", {
                    transaction: transaction,
                    info: {
                        error: error
                    }
                });
            }
            if (message.match(/nonce/i) && message.match(/too low/i)) {
                return makeError("nonce has already been used", "NONCE_EXPIRED", {
                    transaction: transaction,
                    info: {
                        error: error
                    }
                });
            }
            if (message.match(/replacement transaction/i) && message.match(/underpriced/i)) {
                return makeError("replacement fee too low", "REPLACEMENT_UNDERPRICED", {
                    transaction: transaction,
                    info: {
                        error: error
                    }
                });
            }
            if (message.match(/only replay-protected/i)) {
                return makeError("legacy pre-eip-155 transactions not supported", "UNSUPPORTED_OPERATION", {
                    operation: method,
                    info: {
                        transaction: transaction,
                        info: {
                            error: error
                        }
                    }
                });
            }
        }
        let unsupported = !!message.match(/the method .* does not exist/i);
        if (!unsupported) {
            if (error && error.details && error.details.startsWith("Unauthorized method:")) {
                unsupported = true;
            }
        }
        if (unsupported) {
            return makeError("unsupported operation", "UNSUPPORTED_OPERATION", {
                operation: payload.method,
                info: {
                    error: error,
                    payload: payload
                }
            });
        }
        return makeError("could not coalesce error", "UNKNOWN_ERROR", {
            error: error,
            payload: payload
        });
    }
    send(method, params) {
        if (this.destroyed) {
            return Promise.reject(makeError("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", {
                operation: method
            }));
        }
        const id = this.#nextId++;
        const promise = new Promise((resolve, reject)=>{
            this.#payloads.push({
                resolve: resolve,
                reject: reject,
                payload: {
                    method: method,
                    params: params,
                    id: id,
                    jsonrpc: "2.0"
                }
            });
        });
        this.#scheduleDrain();
        return promise;
    }
    async getSigner(address) {
        if (address == null) {
            address = 0;
        }
        const accountsPromise = this.send("eth_accounts", []);
        if (typeof address === "number") {
            const accounts = await accountsPromise;
            if (address >= accounts.length) {
                throw new Error("no such account");
            }
            return new JsonRpcSigner(this, accounts[address]);
        }
        const { accounts: accounts1  } = await resolveProperties({
            network: this.getNetwork(),
            accounts: accountsPromise
        });
        address = getAddress(address);
        for (const account of accounts1){
            if (getAddress(account) === address) {
                return new JsonRpcSigner(this, address);
            }
        }
        throw new Error("invalid account");
    }
    async listAccounts() {
        const accounts = await this.send("eth_accounts", []);
        return accounts.map((a)=>new JsonRpcSigner(this, a));
    }
    destroy() {
        if (this.#drainTimer) {
            clearTimeout(this.#drainTimer);
            this.#drainTimer = null;
        }
        for (const { payload , reject  } of this.#payloads){
            reject(makeError("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", {
                operation: payload.method
            }));
        }
        this.#payloads = [];
        super.destroy();
    }
}
class JsonRpcApiPollingProvider extends JsonRpcApiProvider {
    #pollingInterval;
    constructor(network, options){
        super(network, options);
        let pollingInterval = this._getOption("pollingInterval");
        if (pollingInterval == null) {
            pollingInterval = defaultOptions.pollingInterval;
        }
        this.#pollingInterval = pollingInterval;
    }
    _getSubscriber(sub) {
        const subscriber = super._getSubscriber(sub);
        if (isPollable(subscriber)) {
            subscriber.pollingInterval = this.#pollingInterval;
        }
        return subscriber;
    }
    get pollingInterval() {
        return this.#pollingInterval;
    }
    set pollingInterval(value) {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error("invalid interval");
        }
        this.#pollingInterval = value;
        this._forEachSubscriber((sub)=>{
            if (isPollable(sub)) {
                sub.pollingInterval = this.#pollingInterval;
            }
        });
    }
}
class JsonRpcProvider extends JsonRpcApiPollingProvider {
    #connect;
    constructor(url, network, options){
        if (url == null) {
            url = "http://localhost:8545";
        }
        super(network, options);
        if (typeof url === "string") {
            this.#connect = new FetchRequest(url);
        } else {
            this.#connect = url.clone();
        }
    }
    _getConnection() {
        return this.#connect.clone();
    }
    async send(method, params) {
        await this._start();
        return await super.send(method, params);
    }
    async _send(payload) {
        const request = this._getConnection();
        request.body = JSON.stringify(payload);
        request.setHeader("content-type", "application/json");
        const response = await request.send();
        response.assertOk();
        let resp = response.bodyJson;
        if (!Array.isArray(resp)) {
            resp = [
                resp
            ];
        }
        return resp;
    }
}
function spelunkData(value) {
    if (value == null) {
        return null;
    }
    if (typeof value.message === "string" && value.message.match(/revert/i) && isHexString(value.data)) {
        return {
            message: value.message,
            data: value.data
        };
    }
    if (typeof value === "object") {
        for(const key in value){
            const result = spelunkData(value[key]);
            if (result) {
                return result;
            }
        }
        return null;
    }
    if (typeof value === "string") {
        try {
            return spelunkData(JSON.parse(value));
        } catch (error) {}
    }
    return null;
}
function _spelunkMessage(value, result) {
    if (value == null) {
        return;
    }
    if (typeof value.message === "string") {
        result.push(value.message);
    }
    if (typeof value === "object") {
        for(const key in value){
            _spelunkMessage(value[key], result);
        }
    }
    if (typeof value === "string") {
        try {
            return _spelunkMessage(JSON.parse(value), result);
        } catch (error) {}
    }
}
function spelunkMessage(value) {
    const result = [];
    _spelunkMessage(value, result);
    return result;
}
const defaultApiKey$1 = "9f7d929b018cdffb338517efa06f58359e86ff1ffd350bc889738523659e7972";
function getHost$5(name) {
    switch(name){
        case "mainnet":
            return "rpc.ankr.com/eth";
        case "goerli":
            return "rpc.ankr.com/eth_goerli";
        case "sepolia":
            return "rpc.ankr.com/eth_sepolia";
        case "arbitrum":
            return "rpc.ankr.com/arbitrum";
        case "base":
            return "rpc.ankr.com/base";
        case "base-goerli":
            return "rpc.ankr.com/base_goerli";
        case "base-sepolia":
            return "rpc.ankr.com/base_sepolia";
        case "bnb":
            return "rpc.ankr.com/bsc";
        case "bnbt":
            return "rpc.ankr.com/bsc_testnet_chapel";
        case "matic":
            return "rpc.ankr.com/polygon";
        case "matic-mumbai":
            return "rpc.ankr.com/polygon_mumbai";
        case "optimism":
            return "rpc.ankr.com/optimism";
        case "optimism-goerli":
            return "rpc.ankr.com/optimism_testnet";
        case "optimism-sepolia":
            return "rpc.ankr.com/optimism_sepolia";
    }
    assertArgument(false, "unsupported network", "network", name);
}
class AnkrProvider extends JsonRpcProvider {
    apiKey;
    constructor(_network, apiKey){
        if (_network == null) {
            _network = "mainnet";
        }
        const network = Network.from(_network);
        if (apiKey == null) {
            apiKey = defaultApiKey$1;
        }
        const options = {
            polling: true,
            staticNetwork: network
        };
        const request = AnkrProvider.getRequest(network, apiKey);
        super(request, network, options);
        defineProperties(this, {
            apiKey: apiKey
        });
    }
    _getProvider(chainId) {
        try {
            return new AnkrProvider(chainId, this.apiKey);
        } catch (error) {}
        return super._getProvider(chainId);
    }
    static getRequest(network, apiKey) {
        if (apiKey == null) {
            apiKey = defaultApiKey$1;
        }
        const request = new FetchRequest(`https:/\/${getHost$5(network.name)}/${apiKey}`);
        request.allowGzip = true;
        if (apiKey === defaultApiKey$1) {
            request.retryFunc = async (request, response, attempt)=>{
                showThrottleMessage("AnkrProvider");
                return true;
            };
        }
        return request;
    }
    getRpcError(payload, error) {
        if (payload.method === "eth_sendRawTransaction") {
            if (error && error.error && error.error.message === "INTERNAL_ERROR: could not replace existing tx") {
                error.error.message = "replacement transaction underpriced";
            }
        }
        return super.getRpcError(payload, error);
    }
    isCommunityResource() {
        return this.apiKey === defaultApiKey$1;
    }
}
const defaultApiKey = "_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC";
function getHost$4(name) {
    switch(name){
        case "mainnet":
            return "eth-mainnet.alchemyapi.io";
        case "goerli":
            return "eth-goerli.g.alchemy.com";
        case "sepolia":
            return "eth-sepolia.g.alchemy.com";
        case "arbitrum":
            return "arb-mainnet.g.alchemy.com";
        case "arbitrum-goerli":
            return "arb-goerli.g.alchemy.com";
        case "arbitrum-sepolia":
            return "arb-sepolia.g.alchemy.com";
        case "base":
            return "base-mainnet.g.alchemy.com";
        case "base-goerli":
            return "base-goerli.g.alchemy.com";
        case "base-sepolia":
            return "base-sepolia.g.alchemy.com";
        case "matic":
            return "polygon-mainnet.g.alchemy.com";
        case "matic-amoy":
            return "polygon-amoy.g.alchemy.com";
        case "matic-mumbai":
            return "polygon-mumbai.g.alchemy.com";
        case "optimism":
            return "opt-mainnet.g.alchemy.com";
        case "optimism-goerli":
            return "opt-goerli.g.alchemy.com";
        case "optimism-sepolia":
            return "opt-sepolia.g.alchemy.com";
    }
    assertArgument(false, "unsupported network", "network", name);
}
class AlchemyProvider extends JsonRpcProvider {
    apiKey;
    constructor(_network, apiKey){
        if (_network == null) {
            _network = "mainnet";
        }
        const network = Network.from(_network);
        if (apiKey == null) {
            apiKey = defaultApiKey;
        }
        const request = AlchemyProvider.getRequest(network, apiKey);
        super(request, network, {
            staticNetwork: network
        });
        defineProperties(this, {
            apiKey: apiKey
        });
    }
    _getProvider(chainId) {
        try {
            return new AlchemyProvider(chainId, this.apiKey);
        } catch (error) {}
        return super._getProvider(chainId);
    }
    async _perform(req) {
        if (req.method === "getTransactionResult") {
            const { trace , tx  } = await resolveProperties({
                trace: this.send("trace_transaction", [
                    req.hash
                ]),
                tx: this.getTransaction(req.hash)
            });
            if (trace == null || tx == null) {
                return null;
            }
            let data;
            let error = false;
            try {
                data = trace[0].result.output;
                error = trace[0].error === "Reverted";
            } catch (error1) {}
            if (data) {
                assert1(!error, "an error occurred during transaction executions", "CALL_EXCEPTION", {
                    action: "getTransactionResult",
                    data: data,
                    reason: null,
                    transaction: tx,
                    invocation: null,
                    revert: null
                });
                return data;
            }
            assert1(false, "could not parse trace result", "BAD_DATA", {
                value: trace
            });
        }
        return await super._perform(req);
    }
    isCommunityResource() {
        return this.apiKey === defaultApiKey;
    }
    static getRequest(network, apiKey) {
        if (apiKey == null) {
            apiKey = defaultApiKey;
        }
        const request = new FetchRequest(`https:/\/${getHost$4(network.name)}/v2/${apiKey}`);
        request.allowGzip = true;
        if (apiKey === defaultApiKey) {
            request.retryFunc = async (request, response, attempt)=>{
                showThrottleMessage("alchemy");
                return true;
            };
        }
        return request;
    }
}
function getApiKey(name) {
    switch(name){
        case "mainnet":
            return "39f1d67cedf8b7831010a665328c9197";
        case "arbitrum":
            return "0550c209db33c3abf4cc927e1e18cea1";
        case "bnb":
            return "98b5a77e531614387366f6fc5da097f8";
        case "matic":
            return "cd9d4d70377471aa7c142ec4a4205249";
    }
    assertArgument(false, "unsupported network", "network", name);
}
function getHost$3(name) {
    switch(name){
        case "mainnet":
            return "ethereum-mainnet.core.chainstack.com";
        case "arbitrum":
            return "arbitrum-mainnet.core.chainstack.com";
        case "bnb":
            return "bsc-mainnet.core.chainstack.com";
        case "matic":
            return "polygon-mainnet.core.chainstack.com";
    }
    assertArgument(false, "unsupported network", "network", name);
}
class ChainstackProvider extends JsonRpcProvider {
    apiKey;
    constructor(_network, apiKey){
        if (_network == null) {
            _network = "mainnet";
        }
        const network = Network.from(_network);
        if (apiKey == null) {
            apiKey = getApiKey(network.name);
        }
        const request = ChainstackProvider.getRequest(network, apiKey);
        super(request, network, {
            staticNetwork: network
        });
        defineProperties(this, {
            apiKey: apiKey
        });
    }
    _getProvider(chainId) {
        try {
            return new ChainstackProvider(chainId, this.apiKey);
        } catch (error) {}
        return super._getProvider(chainId);
    }
    isCommunityResource() {
        return this.apiKey === getApiKey(this._network.name);
    }
    static getRequest(network, apiKey) {
        if (apiKey == null) {
            apiKey = getApiKey(network.name);
        }
        const request = new FetchRequest(`https:/\/${getHost$3(network.name)}/${apiKey}`);
        request.allowGzip = true;
        if (apiKey === getApiKey(network.name)) {
            request.retryFunc = async (request, response, attempt)=>{
                showThrottleMessage("ChainstackProvider");
                return true;
            };
        }
        return request;
    }
}
class CloudflareProvider extends JsonRpcProvider {
    constructor(_network){
        if (_network == null) {
            _network = "mainnet";
        }
        const network = Network.from(_network);
        assertArgument(network.name === "mainnet", "unsupported network", "network", _network);
        super("https://cloudflare-eth.com/", network, {
            staticNetwork: network
        });
    }
}
const THROTTLE = 2e3;
function isPromise(value) {
    return value && typeof value.then === "function";
}
const EtherscanPluginId = "org.ethers.plugins.provider.Etherscan";
class EtherscanPlugin extends NetworkPlugin {
    baseUrl;
    constructor(baseUrl){
        super(EtherscanPluginId);
        defineProperties(this, {
            baseUrl: baseUrl
        });
    }
    clone() {
        return new EtherscanPlugin(this.baseUrl);
    }
}
const skipKeys = [
    "enableCcipRead"
];
let nextId = 1;
class EtherscanProvider extends AbstractProvider {
    network;
    apiKey;
    #plugin;
    constructor(_network, _apiKey){
        const apiKey = _apiKey != null ? _apiKey : null;
        super();
        const network = Network.from(_network);
        this.#plugin = network.getPlugin(EtherscanPluginId);
        defineProperties(this, {
            apiKey: apiKey,
            network: network
        });
        this.getBaseUrl();
    }
    getBaseUrl() {
        if (this.#plugin) {
            return this.#plugin.baseUrl;
        }
        switch(this.network.name){
            case "mainnet":
                return "https://api.etherscan.io";
            case "goerli":
                return "https://api-goerli.etherscan.io";
            case "sepolia":
                return "https://api-sepolia.etherscan.io";
            case "holesky":
                return "https://api-holesky.etherscan.io";
            case "arbitrum":
                return "https://api.arbiscan.io";
            case "arbitrum-goerli":
                return "https://api-goerli.arbiscan.io";
            case "base":
                return "https://api.basescan.org";
            case "base-sepolia":
                return "https://api-sepolia.basescan.org";
            case "bnb":
                return "https://api.bscscan.com";
            case "bnbt":
                return "https://api-testnet.bscscan.com";
            case "matic":
                return "https://api.polygonscan.com";
            case "matic-amoy":
                return "https://api-amoy.polygonscan.com";
            case "matic-mumbai":
                return "https://api-testnet.polygonscan.com";
            case "optimism":
                return "https://api-optimistic.etherscan.io";
            case "optimism-goerli":
                return "https://api-goerli-optimistic.etherscan.io";
        }
        assertArgument(false, "unsupported network", "network", this.network);
    }
    getUrl(module, params) {
        const query = Object.keys(params).reduce((accum, key)=>{
            const value = params[key];
            if (value != null) {
                accum += `&${key}=${value}`;
            }
            return accum;
        }, "");
        const apiKey = this.apiKey ? `&apikey=${this.apiKey}` : "";
        return `${this.getBaseUrl()}/api?module=${module}${query}${apiKey}`;
    }
    getPostUrl() {
        return `${this.getBaseUrl()}/api`;
    }
    getPostData(module, params) {
        params.module = module;
        params.apikey = this.apiKey;
        return params;
    }
    async detectNetwork() {
        return this.network;
    }
    async fetch(module, params, post) {
        const id = nextId++;
        const url = post ? this.getPostUrl() : this.getUrl(module, params);
        const payload = post ? this.getPostData(module, params) : null;
        this.emit("debug", {
            action: "sendRequest",
            id: id,
            url: url,
            payload: payload
        });
        const request = new FetchRequest(url);
        request.setThrottleParams({
            slotInterval: 1e3
        });
        request.retryFunc = (req, resp, attempt)=>{
            if (this.isCommunityResource()) {
                showThrottleMessage("Etherscan");
            }
            return Promise.resolve(true);
        };
        request.processFunc = async (request, response)=>{
            const result = response.hasBody() ? JSON.parse(toUtf8String(response.body)) : {};
            const throttle = (typeof result.result === "string" ? result.result : "").toLowerCase().indexOf("rate limit") >= 0;
            if (module === "proxy") {
                if (result && result.status == 0 && result.message == "NOTOK" && throttle) {
                    this.emit("debug", {
                        action: "receiveError",
                        id: id,
                        reason: "proxy-NOTOK",
                        error: result
                    });
                    response.throwThrottleError(result.result, THROTTLE);
                }
            } else {
                if (throttle) {
                    this.emit("debug", {
                        action: "receiveError",
                        id: id,
                        reason: "null result",
                        error: result.result
                    });
                    response.throwThrottleError(result.result, THROTTLE);
                }
            }
            return response;
        };
        if (payload) {
            request.setHeader("content-type", "application/x-www-form-urlencoded; charset=UTF-8");
            request.body = Object.keys(payload).map((k)=>`${k}=${payload[k]}`).join("&");
        }
        const response = await request.send();
        try {
            response.assertOk();
        } catch (error) {
            this.emit("debug", {
                action: "receiveError",
                id: id,
                error: error,
                reason: "assertOk"
            });
            assert1(false, "response error", "SERVER_ERROR", {
                request: request,
                response: response
            });
        }
        if (!response.hasBody()) {
            this.emit("debug", {
                action: "receiveError",
                id: id,
                error: "missing body",
                reason: "null body"
            });
            assert1(false, "missing response", "SERVER_ERROR", {
                request: request,
                response: response
            });
        }
        const result = JSON.parse(toUtf8String(response.body));
        if (module === "proxy") {
            if (result.jsonrpc != "2.0") {
                this.emit("debug", {
                    action: "receiveError",
                    id: id,
                    result: result,
                    reason: "invalid JSON-RPC"
                });
                assert1(false, "invalid JSON-RPC response (missing jsonrpc='2.0')", "SERVER_ERROR", {
                    request: request,
                    response: response,
                    info: {
                        result: result
                    }
                });
            }
            if (result.error) {
                this.emit("debug", {
                    action: "receiveError",
                    id: id,
                    result: result,
                    reason: "JSON-RPC error"
                });
                assert1(false, "error response", "SERVER_ERROR", {
                    request: request,
                    response: response,
                    info: {
                        result: result
                    }
                });
            }
            this.emit("debug", {
                action: "receiveRequest",
                id: id,
                result: result
            });
            return result.result;
        } else {
            if (result.status == 0 && (result.message === "No records found" || result.message === "No transactions found")) {
                this.emit("debug", {
                    action: "receiveRequest",
                    id: id,
                    result: result
                });
                return result.result;
            }
            if (result.status != 1 || typeof result.message === "string" && !result.message.match(/^OK/)) {
                this.emit("debug", {
                    action: "receiveError",
                    id: id,
                    result: result
                });
                assert1(false, "error response", "SERVER_ERROR", {
                    request: request,
                    response: response,
                    info: {
                        result: result
                    }
                });
            }
            this.emit("debug", {
                action: "receiveRequest",
                id: id,
                result: result
            });
            return result.result;
        }
    }
    _getTransactionPostData(transaction) {
        const result = {};
        for(let key in transaction){
            if (skipKeys.indexOf(key) >= 0) {
                continue;
            }
            if (transaction[key] == null) {
                continue;
            }
            let value = transaction[key];
            if (key === "type" && value === 0) {
                continue;
            }
            if (key === "blockTag" && value === "latest") {
                continue;
            }
            if (({
                type: true,
                gasLimit: true,
                gasPrice: true,
                maxFeePerGs: true,
                maxPriorityFeePerGas: true,
                nonce: true,
                value: true
            })[key]) {
                value = toQuantity(value);
            } else if (key === "accessList") {
                value = "[" + accessListify(value).map((set)=>{
                    return `{address:"${set.address}",storageKeys:["${set.storageKeys.join('","')}"]}`;
                }).join(",") + "]";
            } else if (key === "blobVersionedHashes") {
                if (value.length === 0) {
                    continue;
                }
                assert1(false, "Etherscan API does not support blobVersionedHashes", "UNSUPPORTED_OPERATION", {
                    operation: "_getTransactionPostData",
                    info: {
                        transaction: transaction
                    }
                });
            } else {
                value = hexlify(value);
            }
            result[key] = value;
        }
        return result;
    }
    _checkError(req, error, transaction) {
        let message = "";
        if (isError(error, "SERVER_ERROR")) {
            try {
                message = error.info.result.error.message;
            } catch (e) {}
            if (!message) {
                try {
                    message = error.info.message;
                } catch (e1) {}
            }
        }
        if (req.method === "estimateGas") {
            if (!message.match(/revert/i) && message.match(/insufficient funds/i)) {
                assert1(false, "insufficient funds", "INSUFFICIENT_FUNDS", {
                    transaction: req.transaction
                });
            }
        }
        if (req.method === "call" || req.method === "estimateGas") {
            if (message.match(/execution reverted/i)) {
                let data = "";
                try {
                    data = error.info.result.error.data;
                } catch (error1) {}
                const e2 = AbiCoder.getBuiltinCallException(req.method, req.transaction, data);
                e2.info = {
                    request: req,
                    error: error
                };
                throw e2;
            }
        }
        if (message) {
            if (req.method === "broadcastTransaction") {
                const transaction1 = Transaction.from(req.signedTransaction);
                if (message.match(/replacement/i) && message.match(/underpriced/i)) {
                    assert1(false, "replacement fee too low", "REPLACEMENT_UNDERPRICED", {
                        transaction: transaction1
                    });
                }
                if (message.match(/insufficient funds/)) {
                    assert1(false, "insufficient funds for intrinsic transaction cost", "INSUFFICIENT_FUNDS", {
                        transaction: transaction1
                    });
                }
                if (message.match(/same hash was already imported|transaction nonce is too low|nonce too low/)) {
                    assert1(false, "nonce has already been used", "NONCE_EXPIRED", {
                        transaction: transaction1
                    });
                }
            }
        }
        throw error;
    }
    async _detectNetwork() {
        return this.network;
    }
    async _perform(req) {
        switch(req.method){
            case "chainId":
                return this.network.chainId;
            case "getBlockNumber":
                return this.fetch("proxy", {
                    action: "eth_blockNumber"
                });
            case "getGasPrice":
                return this.fetch("proxy", {
                    action: "eth_gasPrice"
                });
            case "getPriorityFee":
                if (this.network.name === "mainnet") {
                    return "1000000000";
                } else if (this.network.name === "optimism") {
                    return "1000000";
                } else {
                    throw new Error("fallback onto the AbstractProvider default");
                }
            case "getBalance":
                return this.fetch("account", {
                    action: "balance",
                    address: req.address,
                    tag: req.blockTag
                });
            case "getTransactionCount":
                return this.fetch("proxy", {
                    action: "eth_getTransactionCount",
                    address: req.address,
                    tag: req.blockTag
                });
            case "getCode":
                return this.fetch("proxy", {
                    action: "eth_getCode",
                    address: req.address,
                    tag: req.blockTag
                });
            case "getStorage":
                return this.fetch("proxy", {
                    action: "eth_getStorageAt",
                    address: req.address,
                    position: req.position,
                    tag: req.blockTag
                });
            case "broadcastTransaction":
                return this.fetch("proxy", {
                    action: "eth_sendRawTransaction",
                    hex: req.signedTransaction
                }, true).catch((error)=>{
                    return this._checkError(req, error, req.signedTransaction);
                });
            case "getBlock":
                if ("blockTag" in req) {
                    return this.fetch("proxy", {
                        action: "eth_getBlockByNumber",
                        tag: req.blockTag,
                        boolean: req.includeTransactions ? "true" : "false"
                    });
                }
                assert1(false, "getBlock by blockHash not supported by Etherscan", "UNSUPPORTED_OPERATION", {
                    operation: "getBlock(blockHash)"
                });
            case "getTransaction":
                return this.fetch("proxy", {
                    action: "eth_getTransactionByHash",
                    txhash: req.hash
                });
            case "getTransactionReceipt":
                return this.fetch("proxy", {
                    action: "eth_getTransactionReceipt",
                    txhash: req.hash
                });
            case "call":
                {
                    if (req.blockTag !== "latest") {
                        throw new Error("EtherscanProvider does not support blockTag for call");
                    }
                    const postData = this._getTransactionPostData(req.transaction);
                    postData.module = "proxy";
                    postData.action = "eth_call";
                    try {
                        return await this.fetch("proxy", postData, true);
                    } catch (error) {
                        return this._checkError(req, error, req.transaction);
                    }
                }
            case "estimateGas":
                {
                    const postData1 = this._getTransactionPostData(req.transaction);
                    postData1.module = "proxy";
                    postData1.action = "eth_estimateGas";
                    try {
                        return await this.fetch("proxy", postData1, true);
                    } catch (error1) {
                        return this._checkError(req, error1, req.transaction);
                    }
                }
        }
        return super._perform(req);
    }
    async getNetwork() {
        return this.network;
    }
    async getEtherPrice() {
        if (this.network.name !== "mainnet") {
            return 0;
        }
        return parseFloat((await this.fetch("stats", {
            action: "ethprice"
        })).ethusd);
    }
    async getContract(_address) {
        let address = this._getAddress(_address);
        if (isPromise(address)) {
            address = await address;
        }
        try {
            const resp = await this.fetch("contract", {
                action: "getabi",
                address: address
            });
            const abi = JSON.parse(resp);
            return new Contract(address, abi, this);
        } catch (error) {
            return null;
        }
    }
    isCommunityResource() {
        return this.apiKey == null;
    }
}
function getGlobal() {
    if (typeof self !== "undefined") {
        return self;
    }
    if (typeof window !== "undefined") {
        return window;
    }
    if (typeof global !== "undefined") {
        return global;
    }
    throw new Error("unable to locate global object");
}
const _WebSocket = getGlobal().WebSocket;
class SocketSubscriber {
    #provider;
    #filter;
    get filter() {
        return JSON.parse(this.#filter);
    }
    #filterId;
    #paused;
    #emitPromise;
    constructor(provider, filter){
        this.#provider = provider;
        this.#filter = JSON.stringify(filter);
        this.#filterId = null;
        this.#paused = null;
        this.#emitPromise = null;
    }
    start() {
        this.#filterId = this.#provider.send("eth_subscribe", this.filter).then((filterId)=>{
            this.#provider._register(filterId, this);
            return filterId;
        });
    }
    stop() {
        this.#filterId.then((filterId)=>{
            if (this.#provider.destroyed) {
                return;
            }
            this.#provider.send("eth_unsubscribe", [
                filterId
            ]);
        });
        this.#filterId = null;
    }
    pause(dropWhilePaused) {
        assert1(dropWhilePaused, "preserve logs while paused not supported by SocketSubscriber yet", "UNSUPPORTED_OPERATION", {
            operation: "pause(false)"
        });
        this.#paused = !!dropWhilePaused;
    }
    resume() {
        this.#paused = null;
    }
    _handleMessage(message) {
        if (this.#filterId == null) {
            return;
        }
        if (this.#paused === null) {
            let emitPromise = this.#emitPromise;
            if (emitPromise == null) {
                emitPromise = this._emit(this.#provider, message);
            } else {
                emitPromise = emitPromise.then(async ()=>{
                    await this._emit(this.#provider, message);
                });
            }
            this.#emitPromise = emitPromise.then(()=>{
                if (this.#emitPromise === emitPromise) {
                    this.#emitPromise = null;
                }
            });
        }
    }
    async _emit(provider, message) {
        throw new Error("sub-classes must implemente this; _emit");
    }
}
class SocketBlockSubscriber extends SocketSubscriber {
    constructor(provider){
        super(provider, [
            "newHeads"
        ]);
    }
    async _emit(provider, message) {
        provider.emit("block", parseInt(message.number));
    }
}
class SocketPendingSubscriber extends SocketSubscriber {
    constructor(provider){
        super(provider, [
            "newPendingTransactions"
        ]);
    }
    async _emit(provider, message) {
        provider.emit("pending", message);
    }
}
class SocketEventSubscriber extends SocketSubscriber {
    #logFilter;
    get logFilter() {
        return JSON.parse(this.#logFilter);
    }
    constructor(provider, filter){
        super(provider, [
            "logs",
            filter
        ]);
        this.#logFilter = JSON.stringify(filter);
    }
    async _emit(provider, message) {
        provider.emit(this.logFilter, provider._wrapLog(message, provider._network));
    }
}
class SocketProvider extends JsonRpcApiProvider {
    #callbacks;
    #subs;
    #pending;
    constructor(network, _options){
        const options = Object.assign({}, _options != null ? _options : {});
        assertArgument(options.batchMaxCount == null || options.batchMaxCount === 1, "sockets-based providers do not support batches", "options.batchMaxCount", _options);
        options.batchMaxCount = 1;
        if (options.staticNetwork == null) {
            options.staticNetwork = true;
        }
        super(network, options);
        this.#callbacks = new Map;
        this.#subs = new Map;
        this.#pending = new Map;
    }
    _getSubscriber(sub) {
        switch(sub.type){
            case "close":
                return new UnmanagedSubscriber("close");
            case "block":
                return new SocketBlockSubscriber(this);
            case "pending":
                return new SocketPendingSubscriber(this);
            case "event":
                return new SocketEventSubscriber(this, sub.filter);
            case "orphan":
                if (sub.filter.orphan === "drop-log") {
                    return new UnmanagedSubscriber("drop-log");
                }
        }
        return super._getSubscriber(sub);
    }
    _register(filterId, subscriber) {
        this.#subs.set(filterId, subscriber);
        const pending = this.#pending.get(filterId);
        if (pending) {
            for (const message of pending){
                subscriber._handleMessage(message);
            }
            this.#pending.delete(filterId);
        }
    }
    async _send(payload) {
        assertArgument(!Array.isArray(payload), "WebSocket does not support batch send", "payload", payload);
        const promise = new Promise((resolve, reject)=>{
            this.#callbacks.set(payload.id, {
                payload: payload,
                resolve: resolve,
                reject: reject
            });
        });
        await this._waitUntilReady();
        await this._write(JSON.stringify(payload));
        return [
            await promise
        ];
    }
    async _processMessage(message) {
        const result = JSON.parse(message);
        if (result && typeof result === "object" && "id" in result) {
            const callback = this.#callbacks.get(result.id);
            if (callback == null) {
                this.emit("error", makeError("received result for unknown id", "UNKNOWN_ERROR", {
                    reasonCode: "UNKNOWN_ID",
                    result: result
                }));
                return;
            }
            this.#callbacks.delete(result.id);
            callback.resolve(result);
        } else if (result && result.method === "eth_subscription") {
            const filterId = result.params.subscription;
            const subscriber = this.#subs.get(filterId);
            if (subscriber) {
                subscriber._handleMessage(result.params.result);
            } else {
                let pending = this.#pending.get(filterId);
                if (pending == null) {
                    pending = [];
                    this.#pending.set(filterId, pending);
                }
                pending.push(result.params.result);
            }
        } else {
            this.emit("error", makeError("received unexpected message", "UNKNOWN_ERROR", {
                reasonCode: "UNEXPECTED_MESSAGE",
                result: result
            }));
            return;
        }
    }
    async _write(message) {
        throw new Error("sub-classes must override this");
    }
}
class WebSocketProvider extends SocketProvider {
    #connect;
    #websocket;
    get websocket() {
        if (this.#websocket == null) {
            throw new Error("websocket closed");
        }
        return this.#websocket;
    }
    constructor(url, network, options){
        super(network, options);
        if (typeof url === "string") {
            this.#connect = ()=>{
                return new _WebSocket(url);
            };
            this.#websocket = this.#connect();
        } else if (typeof url === "function") {
            this.#connect = url;
            this.#websocket = url();
        } else {
            this.#connect = null;
            this.#websocket = url;
        }
        this.websocket.onopen = async ()=>{
            try {
                await this._start();
                this.resume();
            } catch (error) {
                console.log("failed to start WebsocketProvider", error);
            }
        };
        this.websocket.onmessage = (message)=>{
            this._processMessage(message.data);
        };
    }
    async _write(message) {
        this.websocket.send(message);
    }
    async destroy() {
        if (this.#websocket != null) {
            this.#websocket.close();
            this.#websocket = null;
        }
        super.destroy();
    }
}
const defaultProjectId = "84842078b09946638c03157f83405213";
function getHost$2(name) {
    switch(name){
        case "mainnet":
            return "mainnet.infura.io";
        case "goerli":
            return "goerli.infura.io";
        case "sepolia":
            return "sepolia.infura.io";
        case "arbitrum":
            return "arbitrum-mainnet.infura.io";
        case "arbitrum-goerli":
            return "arbitrum-goerli.infura.io";
        case "arbitrum-sepolia":
            return "arbitrum-sepolia.infura.io";
        case "base":
            return "base-mainnet.infura.io";
        case "base-goerlia":
            return "base-goerli.infura.io";
        case "base-sepolia":
            return "base-sepolia.infura.io";
        case "bnb":
            return "bnbsmartchain-mainnet.infura.io";
        case "bnbt":
            return "bnbsmartchain-testnet.infura.io";
        case "linea":
            return "linea-mainnet.infura.io";
        case "linea-goerli":
            return "linea-goerli.infura.io";
        case "linea-sepolia":
            return "linea-sepolia.infura.io";
        case "matic":
            return "polygon-mainnet.infura.io";
        case "matic-amoy":
            return "polygon-amoy.infura.io";
        case "matic-mumbai":
            return "polygon-mumbai.infura.io";
        case "optimism":
            return "optimism-mainnet.infura.io";
        case "optimism-goerli":
            return "optimism-goerli.infura.io";
        case "optimism-sepolia":
            return "optimism-sepolia.infura.io";
    }
    assertArgument(false, "unsupported network", "network", name);
}
class InfuraWebSocketProvider extends WebSocketProvider {
    projectId;
    projectSecret;
    constructor(network, projectId){
        const provider = new InfuraProvider(network, projectId);
        const req = provider._getConnection();
        assert1(!req.credentials, "INFURA WebSocket project secrets unsupported", "UNSUPPORTED_OPERATION", {
            operation: "InfuraProvider.getWebSocketProvider()"
        });
        const url = req.url.replace(/^http/i, "ws").replace("/v3/", "/ws/v3/");
        super(url, provider._network);
        defineProperties(this, {
            projectId: provider.projectId,
            projectSecret: provider.projectSecret
        });
    }
    isCommunityResource() {
        return this.projectId === defaultProjectId;
    }
}
class InfuraProvider extends JsonRpcProvider {
    projectId;
    projectSecret;
    constructor(_network, projectId, projectSecret){
        if (_network == null) {
            _network = "mainnet";
        }
        const network = Network.from(_network);
        if (projectId == null) {
            projectId = defaultProjectId;
        }
        if (projectSecret == null) {
            projectSecret = null;
        }
        const request = InfuraProvider.getRequest(network, projectId, projectSecret);
        super(request, network, {
            staticNetwork: network
        });
        defineProperties(this, {
            projectId: projectId,
            projectSecret: projectSecret
        });
    }
    _getProvider(chainId) {
        try {
            return new InfuraProvider(chainId, this.projectId, this.projectSecret);
        } catch (error) {}
        return super._getProvider(chainId);
    }
    isCommunityResource() {
        return this.projectId === defaultProjectId;
    }
    static getWebSocketProvider(network, projectId) {
        return new InfuraWebSocketProvider(network, projectId);
    }
    static getRequest(network, projectId, projectSecret) {
        if (projectId == null) {
            projectId = defaultProjectId;
        }
        if (projectSecret == null) {
            projectSecret = null;
        }
        const request = new FetchRequest(`https:/\/${getHost$2(network.name)}/v3/${projectId}`);
        request.allowGzip = true;
        if (projectSecret) {
            request.setCredentials("", projectSecret);
        }
        if (projectId === defaultProjectId) {
            request.retryFunc = async (request, response, attempt)=>{
                showThrottleMessage("InfuraProvider");
                return true;
            };
        }
        return request;
    }
}
const defaultToken = "919b412a057b5e9c9b6dce193c5a60242d6efadb";
function getHost$1(name) {
    switch(name){
        case "mainnet":
            return "ethers.quiknode.pro";
        case "goerli":
            return "ethers.ethereum-goerli.quiknode.pro";
        case "sepolia":
            return "ethers.ethereum-sepolia.quiknode.pro";
        case "holesky":
            return "ethers.ethereum-holesky.quiknode.pro";
        case "arbitrum":
            return "ethers.arbitrum-mainnet.quiknode.pro";
        case "arbitrum-goerli":
            return "ethers.arbitrum-goerli.quiknode.pro";
        case "arbitrum-sepolia":
            return "ethers.arbitrum-sepolia.quiknode.pro";
        case "base":
            return "ethers.base-mainnet.quiknode.pro";
        case "base-goerli":
            return "ethers.base-goerli.quiknode.pro";
        case "base-spolia":
            return "ethers.base-sepolia.quiknode.pro";
        case "bnb":
            return "ethers.bsc.quiknode.pro";
        case "bnbt":
            return "ethers.bsc-testnet.quiknode.pro";
        case "matic":
            return "ethers.matic.quiknode.pro";
        case "matic-mumbai":
            return "ethers.matic-testnet.quiknode.pro";
        case "optimism":
            return "ethers.optimism.quiknode.pro";
        case "optimism-goerli":
            return "ethers.optimism-goerli.quiknode.pro";
        case "optimism-sepolia":
            return "ethers.optimism-sepolia.quiknode.pro";
        case "xdai":
            return "ethers.xdai.quiknode.pro";
    }
    assertArgument(false, "unsupported network", "network", name);
}
class QuickNodeProvider extends JsonRpcProvider {
    token;
    constructor(_network, token){
        if (_network == null) {
            _network = "mainnet";
        }
        const network = Network.from(_network);
        if (token == null) {
            token = defaultToken;
        }
        const request = QuickNodeProvider.getRequest(network, token);
        super(request, network, {
            staticNetwork: network
        });
        defineProperties(this, {
            token: token
        });
    }
    _getProvider(chainId) {
        try {
            return new QuickNodeProvider(chainId, this.token);
        } catch (error) {}
        return super._getProvider(chainId);
    }
    isCommunityResource() {
        return this.token === defaultToken;
    }
    static getRequest(network, token) {
        if (token == null) {
            token = defaultToken;
        }
        const request = new FetchRequest(`https:/\/${getHost$1(network.name)}/${token}`);
        request.allowGzip = true;
        if (token === defaultToken) {
            request.retryFunc = async (request, response, attempt)=>{
                showThrottleMessage("QuickNodeProvider");
                return true;
            };
        }
        return request;
    }
}
const BN_1 = BigInt("1");
const BN_2 = BigInt("2");
function shuffle(array) {
    for(let i = array.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = array[i];
        array[i] = array[j];
        array[j] = tmp;
    }
}
function stall$2(duration) {
    return new Promise((resolve)=>{
        setTimeout(resolve, duration);
    });
}
function getTime() {
    return (new Date).getTime();
}
function stringify(value) {
    return JSON.stringify(value, (key, value)=>{
        if (typeof value === "bigint") {
            return {
                type: "bigint",
                value: value.toString()
            };
        }
        return value;
    });
}
const defaultConfig = {
    stallTimeout: 400,
    priority: 1,
    weight: 1
};
const defaultState = {
    blockNumber: -2,
    requests: 0,
    lateResponses: 0,
    errorResponses: 0,
    outOfSync: -1,
    unsupportedEvents: 0,
    rollingDuration: 0,
    score: 0,
    _network: null,
    _updateNumber: null,
    _totalTime: 0,
    _lastFatalError: null,
    _lastFatalErrorTimestamp: 0
};
async function waitForSync(config, blockNumber) {
    while(config.blockNumber < 0 || config.blockNumber < blockNumber){
        if (!config._updateNumber) {
            config._updateNumber = (async ()=>{
                try {
                    const blockNumber = await config.provider.getBlockNumber();
                    if (blockNumber > config.blockNumber) {
                        config.blockNumber = blockNumber;
                    }
                } catch (error) {
                    config.blockNumber = -2;
                    config._lastFatalError = error;
                    config._lastFatalErrorTimestamp = getTime();
                }
                config._updateNumber = null;
            })();
        }
        await config._updateNumber;
        config.outOfSync++;
        if (config._lastFatalError) {
            break;
        }
    }
}
function _normalize(value) {
    if (value == null) {
        return "null";
    }
    if (Array.isArray(value)) {
        return "[" + value.map(_normalize).join(",") + "]";
    }
    if (typeof value === "object" && typeof value.toJSON === "function") {
        return _normalize(value.toJSON());
    }
    switch(typeof value){
        case "boolean":
        case "symbol":
            return value.toString();
        case "bigint":
        case "number":
            return BigInt(value).toString();
        case "string":
            return JSON.stringify(value);
        case "object":
            {
                const keys = Object.keys(value);
                keys.sort();
                return "{" + keys.map((k)=>`${JSON.stringify(k)}:${_normalize(value[k])}`).join(",") + "}";
            }
    }
    console.log("Could not serialize", value);
    throw new Error("Hmm...");
}
function normalizeResult(value) {
    if ("error" in value) {
        const error = value.error;
        return {
            tag: _normalize(error),
            value: error
        };
    }
    const result = value.result;
    return {
        tag: _normalize(result),
        value: result
    };
}
function checkQuorum(quorum, results) {
    const tally = new Map;
    for (const { value , tag , weight  } of results){
        const t = tally.get(tag) || {
            value: value,
            weight: 0
        };
        t.weight += weight;
        tally.set(tag, t);
    }
    let best = null;
    for (const r of tally.values()){
        if (r.weight >= quorum && (!best || r.weight > best.weight)) {
            best = r;
        }
    }
    if (best) {
        return best.value;
    }
    return undefined;
}
function getMedian(quorum, results) {
    let resultWeight = 0;
    const errorMap = new Map;
    let bestError = null;
    const values = [];
    for (const { value , tag , weight  } of results){
        if (value instanceof Error) {
            const e = errorMap.get(tag) || {
                value: value,
                weight: 0
            };
            e.weight += weight;
            errorMap.set(tag, e);
            if (bestError == null || e.weight > bestError.weight) {
                bestError = e;
            }
        } else {
            values.push(BigInt(value));
            resultWeight += weight;
        }
    }
    if (resultWeight < quorum) {
        if (bestError && bestError.weight >= quorum) {
            return bestError.value;
        }
        return undefined;
    }
    values.sort((a, b)=>a < b ? -1 : b > a ? 1 : 0);
    const mid = Math.floor(values.length / 2);
    if (values.length % 2) {
        return values[mid];
    }
    return (values[mid - 1] + values[mid] + BN_1) / BN_2;
}
function getAnyResult(quorum, results) {
    const result = checkQuorum(quorum, results);
    if (result !== undefined) {
        return result;
    }
    for (const r of results){
        if (r.value) {
            return r.value;
        }
    }
    return undefined;
}
function getFuzzyMode(quorum, results) {
    if (quorum === 1) {
        return getNumber(getMedian(quorum, results), "%internal");
    }
    const tally = new Map;
    const add = (result, weight)=>{
        const t = tally.get(result) || {
            result: result,
            weight: 0
        };
        t.weight += weight;
        tally.set(result, t);
    };
    for (const { weight , value  } of results){
        const r = getNumber(value);
        add(r - 1, weight);
        add(r, weight);
        add(r + 1, weight);
    }
    let bestWeight = 0;
    let bestResult = undefined;
    for (const { weight: weight1 , result  } of tally.values()){
        if (weight1 >= quorum && (weight1 > bestWeight || bestResult != null && weight1 === bestWeight && result > bestResult)) {
            bestWeight = weight1;
            bestResult = result;
        }
    }
    return bestResult;
}
class FallbackProvider extends AbstractProvider {
    quorum;
    eventQuorum;
    eventWorkers;
    #configs;
    #height;
    #initialSyncPromise;
    constructor(providers, network, options){
        super(network, options);
        this.#configs = providers.map((p)=>{
            if (p instanceof AbstractProvider) {
                return Object.assign({
                    provider: p
                }, defaultConfig, defaultState);
            } else {
                return Object.assign({}, defaultConfig, p, defaultState);
            }
        });
        this.#height = -2;
        this.#initialSyncPromise = null;
        if (options && options.quorum != null) {
            this.quorum = options.quorum;
        } else {
            this.quorum = Math.ceil(this.#configs.reduce((accum, config)=>{
                accum += config.weight;
                return accum;
            }, 0) / 2);
        }
        this.eventQuorum = 1;
        this.eventWorkers = 1;
        assertArgument(this.quorum <= this.#configs.reduce((a, c)=>a + c.weight, 0), "quorum exceed provider weight", "quorum", this.quorum);
    }
    get providerConfigs() {
        return this.#configs.map((c)=>{
            const result = Object.assign({}, c);
            for(const key in result){
                if (key[0] === "_") {
                    delete result[key];
                }
            }
            return result;
        });
    }
    async _detectNetwork() {
        return Network.from(getBigInt(await this._perform({
            method: "chainId"
        })));
    }
    async _translatePerform(provider, req) {
        switch(req.method){
            case "broadcastTransaction":
                return await provider.broadcastTransaction(req.signedTransaction);
            case "call":
                return await provider.call(Object.assign({}, req.transaction, {
                    blockTag: req.blockTag
                }));
            case "chainId":
                return (await provider.getNetwork()).chainId;
            case "estimateGas":
                return await provider.estimateGas(req.transaction);
            case "getBalance":
                return await provider.getBalance(req.address, req.blockTag);
            case "getBlock":
                {
                    const block = "blockHash" in req ? req.blockHash : req.blockTag;
                    return await provider.getBlock(block, req.includeTransactions);
                }
            case "getBlockNumber":
                return await provider.getBlockNumber();
            case "getCode":
                return await provider.getCode(req.address, req.blockTag);
            case "getGasPrice":
                return (await provider.getFeeData()).gasPrice;
            case "getPriorityFee":
                return (await provider.getFeeData()).maxPriorityFeePerGas;
            case "getLogs":
                return await provider.getLogs(req.filter);
            case "getStorage":
                return await provider.getStorage(req.address, req.position, req.blockTag);
            case "getTransaction":
                return await provider.getTransaction(req.hash);
            case "getTransactionCount":
                return await provider.getTransactionCount(req.address, req.blockTag);
            case "getTransactionReceipt":
                return await provider.getTransactionReceipt(req.hash);
            case "getTransactionResult":
                return await provider.getTransactionResult(req.hash);
        }
    }
    #getNextConfig(running) {
        const configs = Array.from(running).map((r)=>r.config);
        const allConfigs = this.#configs.slice();
        shuffle(allConfigs);
        allConfigs.sort((a, b)=>a.priority - b.priority);
        for (const config of allConfigs){
            if (config._lastFatalError) {
                continue;
            }
            if (configs.indexOf(config) === -1) {
                return config;
            }
        }
        return null;
    }
    #addRunner(running1, req2) {
        const config1 = this.#getNextConfig(running1);
        if (config1 == null) {
            return null;
        }
        const runner = {
            config: config1,
            result: null,
            didBump: false,
            perform: null,
            staller: null
        };
        const now = getTime();
        runner.perform = (async ()=>{
            try {
                config1.requests++;
                const result = await this._translatePerform(config1.provider, req2);
                runner.result = {
                    result: result
                };
            } catch (error) {
                config1.errorResponses++;
                runner.result = {
                    error: error
                };
            }
            const dt = getTime() - now;
            config1._totalTime += dt;
            config1.rollingDuration = .95 * config1.rollingDuration + .05 * dt;
            runner.perform = null;
        })();
        runner.staller = (async ()=>{
            await stall$2(config1.stallTimeout);
            runner.staller = null;
        })();
        running1.add(runner);
        return runner;
    }
    async #initialSync() {
        let initialSync = this.#initialSyncPromise;
        if (!initialSync) {
            const promises1 = [];
            this.#configs.forEach((config)=>{
                promises1.push((async ()=>{
                    await waitForSync(config, 0);
                    if (!config._lastFatalError) {
                        config._network = await config.provider.getNetwork();
                    }
                })());
            });
            this.#initialSyncPromise = initialSync = (async ()=>{
                await Promise.all(promises1);
                let chainId = null;
                for (const config of this.#configs){
                    if (config._lastFatalError) {
                        continue;
                    }
                    const network = config._network;
                    if (chainId == null) {
                        chainId = network.chainId;
                    } else if (network.chainId !== chainId) {
                        assert1(false, "cannot mix providers on different networks", "UNSUPPORTED_OPERATION", {
                            operation: "new FallbackProvider"
                        });
                    }
                }
            })();
        }
        await initialSync;
    }
    async #checkQuorum(running2, req3) {
        const results = [];
        for (const runner1 of running2){
            if (runner1.result != null) {
                const { tag: tag2 , value: value2  } = normalizeResult(runner1.result);
                results.push({
                    tag: tag2,
                    value: value2,
                    weight: runner1.config.weight
                });
            }
        }
        if (results.reduce((a, r)=>a + r.weight, 0) < this.quorum) {
            return undefined;
        }
        switch(req3.method){
            case "getBlockNumber":
                {
                    if (this.#height === -2) {
                        this.#height = Math.ceil(getNumber(getMedian(this.quorum, this.#configs.filter((c)=>!c._lastFatalError).map((c)=>({
                                value: c.blockNumber,
                                tag: getNumber(c.blockNumber).toString(),
                                weight: c.weight
                            })))));
                    }
                    const mode = getFuzzyMode(this.quorum, results);
                    if (mode === undefined) {
                        return undefined;
                    }
                    if (mode > this.#height) {
                        this.#height = mode;
                    }
                    return this.#height;
                }
            case "getGasPrice":
            case "getPriorityFee":
            case "estimateGas":
                return getMedian(this.quorum, results);
            case "getBlock":
                if ("blockTag" in req3 && req3.blockTag === "pending") {
                    return getAnyResult(this.quorum, results);
                }
                return checkQuorum(this.quorum, results);
            case "call":
            case "chainId":
            case "getBalance":
            case "getTransactionCount":
            case "getCode":
            case "getStorage":
            case "getTransaction":
            case "getTransactionReceipt":
            case "getLogs":
                return checkQuorum(this.quorum, results);
            case "broadcastTransaction":
                return getAnyResult(this.quorum, results);
        }
        assert1(false, "unsupported method", "UNSUPPORTED_OPERATION", {
            operation: `_perform(${stringify(req3.method)})`
        });
    }
    async #waitForQuorum(running3, req4) {
        if (running3.size === 0) {
            throw new Error("no runners?!");
        }
        const interesting = [];
        let newRunners = 0;
        for (const runner2 of running3){
            if (runner2.perform) {
                interesting.push(runner2.perform);
            }
            if (runner2.staller) {
                interesting.push(runner2.staller);
                continue;
            }
            if (runner2.didBump) {
                continue;
            }
            runner2.didBump = true;
            newRunners++;
        }
        const value3 = await this.#checkQuorum(running3, req4);
        if (value3 !== undefined) {
            if (value3 instanceof Error) {
                throw value3;
            }
            return value3;
        }
        for(let i7 = 0; i7 < newRunners; i7++){
            this.#addRunner(running3, req4);
        }
        assert1(interesting.length > 0, "quorum not met", "SERVER_ERROR", {
            request: "%sub-requests",
            info: {
                request: req4,
                results: Array.from(running3).map((r)=>stringify(r.result))
            }
        });
        await Promise.race(interesting);
        return await this.#waitForQuorum(running3, req4);
    }
    async _perform(req) {
        if (req.method === "broadcastTransaction") {
            const results = this.#configs.map((c)=>null);
            const broadcasts = this.#configs.map(async ({ provider , weight  }, index)=>{
                try {
                    const result = await provider._perform(req);
                    results[index] = Object.assign(normalizeResult({
                        result: result
                    }), {
                        weight: weight
                    });
                } catch (error) {
                    results[index] = Object.assign(normalizeResult({
                        error: error
                    }), {
                        weight: weight
                    });
                }
            });
            while(true){
                const done = results.filter((r)=>r != null);
                for (const { value  } of done){
                    if (!(value instanceof Error)) {
                        return value;
                    }
                }
                const result = checkQuorum(this.quorum, results.filter((r)=>r != null));
                if (isError(result, "INSUFFICIENT_FUNDS")) {
                    throw result;
                }
                const waiting = broadcasts.filter((b, i)=>results[i] == null);
                if (waiting.length === 0) {
                    break;
                }
                await Promise.race(waiting);
            }
            const result1 = getAnyResult(this.quorum, results);
            assert1(result1 !== undefined, "problem multi-broadcasting", "SERVER_ERROR", {
                request: "%sub-requests",
                info: {
                    request: req,
                    results: results.map(stringify)
                }
            });
            if (result1 instanceof Error) {
                throw result1;
            }
            return result1;
        }
        await this.#initialSync();
        const running = new Set;
        let inflightQuorum = 0;
        while(true){
            const runner = this.#addRunner(running, req);
            if (runner == null) {
                break;
            }
            inflightQuorum += runner.config.weight;
            if (inflightQuorum >= this.quorum) {
                break;
            }
        }
        const result2 = await this.#waitForQuorum(running, req);
        for (const runner1 of running){
            if (runner1.perform && runner1.result == null) {
                runner1.config.lateResponses++;
            }
        }
        return result2;
    }
    async destroy() {
        for (const { provider  } of this.#configs){
            provider.destroy();
        }
        super.destroy();
    }
}
function isWebSocketLike(value) {
    return value && typeof value.send === "function" && typeof value.close === "function";
}
const Testnets = "goerli kovan sepolia classicKotti optimism-goerli arbitrum-goerli matic-mumbai bnbt".split(" ");
function getDefaultProvider(network, options) {
    if (options == null) {
        options = {};
    }
    const allowService = (name)=>{
        if (options[name] === "-") {
            return false;
        }
        if (typeof options.exclusive === "string") {
            return name === options.exclusive;
        }
        if (Array.isArray(options.exclusive)) {
            return options.exclusive.indexOf(name) !== -1;
        }
        return true;
    };
    if (typeof network === "string" && network.match(/^https?:/)) {
        return new JsonRpcProvider(network);
    }
    if (typeof network === "string" && network.match(/^wss?:/) || isWebSocketLike(network)) {
        return new WebSocketProvider(network);
    }
    let staticNetwork = null;
    try {
        staticNetwork = Network.from(network);
    } catch (error) {}
    const providers = [];
    if (allowService("publicPolygon") && staticNetwork) {
        if (staticNetwork.name === "matic") {
            providers.push(new JsonRpcProvider("https://polygon-rpc.com/", staticNetwork, {
                staticNetwork: staticNetwork
            }));
        } else if (staticNetwork.name === "matic-amoy") {
            providers.push(new JsonRpcProvider("https://rpc-amoy.polygon.technology/", staticNetwork, {
                staticNetwork: staticNetwork
            }));
        }
    }
    if (allowService("alchemy")) {
        try {
            providers.push(new AlchemyProvider(network, options.alchemy));
        } catch (error1) {}
    }
    if (allowService("ankr") && options.ankr != null) {
        try {
            providers.push(new AnkrProvider(network, options.ankr));
        } catch (error2) {}
    }
    if (allowService("chainstack")) {
        try {
            providers.push(new ChainstackProvider(network, options.chainstack));
        } catch (error3) {}
    }
    if (allowService("cloudflare")) {
        try {
            providers.push(new CloudflareProvider(network));
        } catch (error4) {}
    }
    if (allowService("etherscan")) {
        try {
            providers.push(new EtherscanProvider(network, options.etherscan));
        } catch (error5) {}
    }
    if (allowService("infura")) {
        try {
            let projectId = options.infura;
            let projectSecret = undefined;
            if (typeof projectId === "object") {
                projectSecret = projectId.projectSecret;
                projectId = projectId.projectId;
            }
            providers.push(new InfuraProvider(network, projectId, projectSecret));
        } catch (error6) {}
    }
    if (allowService("quicknode")) {
        try {
            let token = options.quicknode;
            providers.push(new QuickNodeProvider(network, token));
        } catch (error7) {}
    }
    assert1(providers.length, "unsupported default network", "UNSUPPORTED_OPERATION", {
        operation: "getDefaultProvider"
    });
    if (providers.length === 1) {
        return providers[0];
    }
    let quorum = Math.floor(providers.length / 2);
    if (quorum > 2) {
        quorum = 2;
    }
    if (staticNetwork && Testnets.indexOf(staticNetwork.name) !== -1) {
        quorum = 1;
    }
    if (options && options.quorum) {
        quorum = options.quorum;
    }
    return new FallbackProvider(providers, undefined, {
        quorum: quorum
    });
}
class NonceManager extends AbstractSigner {
    signer;
    #noncePromise;
    #delta;
    constructor(signer){
        super(signer.provider);
        defineProperties(this, {
            signer: signer
        });
        this.#noncePromise = null;
        this.#delta = 0;
    }
    async getAddress() {
        return this.signer.getAddress();
    }
    connect(provider) {
        return new NonceManager(this.signer.connect(provider));
    }
    async getNonce(blockTag) {
        if (blockTag === "pending") {
            if (this.#noncePromise == null) {
                this.#noncePromise = super.getNonce("pending");
            }
            const delta = this.#delta;
            return await this.#noncePromise + delta;
        }
        return super.getNonce(blockTag);
    }
    increment() {
        this.#delta++;
    }
    reset() {
        this.#delta = 0;
        this.#noncePromise = null;
    }
    async sendTransaction(tx) {
        const noncePromise = this.getNonce("pending");
        this.increment();
        tx = await this.signer.populateTransaction(tx);
        tx.nonce = await noncePromise;
        return await this.signer.sendTransaction(tx);
    }
    signTransaction(tx) {
        return this.signer.signTransaction(tx);
    }
    signMessage(message) {
        return this.signer.signMessage(message);
    }
    signTypedData(domain, types, value) {
        return this.signer.signTypedData(domain, types, value);
    }
}
class BrowserProvider extends JsonRpcApiPollingProvider {
    #request;
    constructor(ethereum, network, _options){
        const options = Object.assign({}, _options != null ? _options : {}, {
            batchMaxCount: 1
        });
        assertArgument(ethereum && ethereum.request, "invalid EIP-1193 provider", "ethereum", ethereum);
        super(network, options);
        this.#request = async (method, params)=>{
            const payload = {
                method: method,
                params: params
            };
            this.emit("debug", {
                action: "sendEip1193Request",
                payload: payload
            });
            try {
                const result = await ethereum.request(payload);
                this.emit("debug", {
                    action: "receiveEip1193Result",
                    result: result
                });
                return result;
            } catch (e) {
                const error = new Error(e.message);
                error.code = e.code;
                error.data = e.data;
                error.payload = payload;
                this.emit("debug", {
                    action: "receiveEip1193Error",
                    error: error
                });
                throw error;
            }
        };
    }
    async send(method, params) {
        await this._start();
        return await super.send(method, params);
    }
    async _send(payload) {
        assertArgument(!Array.isArray(payload), "EIP-1193 does not support batch request", "payload", payload);
        try {
            const result = await this.#request(payload.method, payload.params || []);
            return [
                {
                    id: payload.id,
                    result: result
                }
            ];
        } catch (e) {
            return [
                {
                    id: payload.id,
                    error: {
                        code: e.code,
                        data: e.data,
                        message: e.message
                    }
                }
            ];
        }
    }
    getRpcError(payload, error) {
        error = JSON.parse(JSON.stringify(error));
        switch(error.error.code || -1){
            case 4001:
                error.error.message = `ethers-user-denied: ${error.error.message}`;
                break;
            case 4200:
                error.error.message = `ethers-unsupported: ${error.error.message}`;
                break;
        }
        return super.getRpcError(payload, error);
    }
    async hasSigner(address) {
        if (address == null) {
            address = 0;
        }
        const accounts = await this.send("eth_accounts", []);
        if (typeof address === "number") {
            return accounts.length > address;
        }
        address = address.toLowerCase();
        return accounts.filter((a)=>a.toLowerCase() === address).length !== 0;
    }
    async getSigner(address) {
        if (address == null) {
            address = 0;
        }
        if (!await this.hasSigner(address)) {
            try {
                await this.#request("eth_requestAccounts", []);
            } catch (error) {
                const payload = error.payload;
                throw this.getRpcError(payload, {
                    id: payload.id,
                    error: error
                });
            }
        }
        return await super.getSigner(address);
    }
}
const defaultApplicationId = "62e1ad51b37b8e00394bda3b";
function getHost(name) {
    switch(name){
        case "mainnet":
            return "eth-mainnet.gateway.pokt.network";
        case "goerli":
            return "eth-goerli.gateway.pokt.network";
        case "matic":
            return "poly-mainnet.gateway.pokt.network";
        case "matic-mumbai":
            return "polygon-mumbai-rpc.gateway.pokt.network";
    }
    assertArgument(false, "unsupported network", "network", name);
}
class PocketProvider extends JsonRpcProvider {
    applicationId;
    applicationSecret;
    constructor(_network, applicationId, applicationSecret){
        if (_network == null) {
            _network = "mainnet";
        }
        const network = Network.from(_network);
        if (applicationId == null) {
            applicationId = defaultApplicationId;
        }
        if (applicationSecret == null) {
            applicationSecret = null;
        }
        const options = {
            staticNetwork: network
        };
        const request = PocketProvider.getRequest(network, applicationId, applicationSecret);
        super(request, network, options);
        defineProperties(this, {
            applicationId: applicationId,
            applicationSecret: applicationSecret
        });
    }
    _getProvider(chainId) {
        try {
            return new PocketProvider(chainId, this.applicationId, this.applicationSecret);
        } catch (error) {}
        return super._getProvider(chainId);
    }
    static getRequest(network, applicationId, applicationSecret) {
        if (applicationId == null) {
            applicationId = defaultApplicationId;
        }
        const request = new FetchRequest(`https:/\/${getHost(network.name)}/v1/lb/${applicationId}`);
        request.allowGzip = true;
        if (applicationSecret) {
            request.setCredentials("", applicationSecret);
        }
        if (applicationId === defaultApplicationId) {
            request.retryFunc = async (request, response, attempt)=>{
                showThrottleMessage("PocketProvider");
                return true;
            };
        }
        return request;
    }
    isCommunityResource() {
        return this.applicationId === defaultApplicationId;
    }
}
const IpcSocketProvider = undefined;
class BaseWallet extends AbstractSigner {
    address;
    #signingKey;
    constructor(privateKey, provider){
        super(provider);
        assertArgument(privateKey && typeof privateKey.sign === "function", "invalid private key", "privateKey", "[ REDACTED ]");
        this.#signingKey = privateKey;
        const address = computeAddress(this.signingKey.publicKey);
        defineProperties(this, {
            address: address
        });
    }
    get signingKey() {
        return this.#signingKey;
    }
    get privateKey() {
        return this.signingKey.privateKey;
    }
    async getAddress() {
        return this.address;
    }
    connect(provider) {
        return new BaseWallet(this.#signingKey, provider);
    }
    async signTransaction(tx) {
        tx = copyRequest(tx);
        const { to , from  } = await resolveProperties({
            to: tx.to ? resolveAddress(tx.to, this.provider) : undefined,
            from: tx.from ? resolveAddress(tx.from, this.provider) : undefined
        });
        if (to != null) {
            tx.to = to;
        }
        if (from != null) {
            tx.from = from;
        }
        if (tx.from != null) {
            assertArgument(getAddress(tx.from) === this.address, "transaction from address mismatch", "tx.from", tx.from);
            delete tx.from;
        }
        const btx = Transaction.from(tx);
        btx.signature = this.signingKey.sign(btx.unsignedHash);
        return btx.serialized;
    }
    async signMessage(message) {
        return this.signMessageSync(message);
    }
    signMessageSync(message) {
        return this.signingKey.sign(hashMessage(message)).serialized;
    }
    async signTypedData(domain, types, value) {
        const populated = await TypedDataEncoder.resolveNames(domain, types, value, async (name)=>{
            assert1(this.provider != null, "cannot resolve ENS names without a provider", "UNSUPPORTED_OPERATION", {
                operation: "resolveName",
                info: {
                    name: name
                }
            });
            const address = await this.provider.resolveName(name);
            assert1(address != null, "unconfigured ENS name", "UNCONFIGURED_NAME", {
                value: name
            });
            return address;
        });
        return this.signingKey.sign(TypedDataEncoder.hash(populated.domain, types, populated.value)).serialized;
    }
}
const subsChrs = " !#$%&'()*+,-./<=>?@[]^_`{|}~";
const Word = /^[a-z]*$/i;
function unfold(words, sep) {
    let initial = 97;
    return words.reduce((accum, word)=>{
        if (word === sep) {
            initial++;
        } else if (word.match(Word)) {
            accum.push(String.fromCharCode(initial) + word);
        } else {
            initial = 97;
            accum.push(word);
        }
        return accum;
    }, []);
}
function decode1(data, subs) {
    for(let i = subsChrs.length - 1; i >= 0; i--){
        data = data.split(subsChrs[i]).join(subs.substring(2 * i, 2 * i + 2));
    }
    const clumps = [];
    const leftover = data.replace(/(:|([0-9])|([A-Z][a-z]*))/g, (all, item, semi, word)=>{
        if (semi) {
            for(let i = parseInt(semi); i >= 0; i--){
                clumps.push(";");
            }
        } else {
            clumps.push(item.toLowerCase());
        }
        return "";
    });
    if (leftover) {
        throw new Error(`leftovers: ${JSON.stringify(leftover)}`);
    }
    return unfold(unfold(clumps, ";"), ":");
}
function decodeOwl(data) {
    assertArgument(data[0] === "0", "unsupported auwl data", "data", data);
    return decode1(data.substring(1 + 2 * subsChrs.length), data.substring(1, 1 + 2 * subsChrs.length));
}
class Wordlist {
    locale;
    constructor(locale){
        defineProperties(this, {
            locale: locale
        });
    }
    split(phrase) {
        return phrase.toLowerCase().split(/\s+/g);
    }
    join(words) {
        return words.join(" ");
    }
}
class WordlistOwl extends Wordlist {
    #data;
    #checksum;
    constructor(locale, data, checksum){
        super(locale);
        this.#data = data;
        this.#checksum = checksum;
        this.#words = null;
    }
    get _data() {
        return this.#data;
    }
    _decodeWords() {
        return decodeOwl(this.#data);
    }
    #words;
    #loadWords() {
        if (this.#words == null) {
            const words = this._decodeWords();
            const checksum = id(words.join("\n") + "\n");
            if (checksum !== this.#checksum) {
                throw new Error(`BIP39 Wordlist for ${this.locale} FAILED`);
            }
            this.#words = words;
        }
        return this.#words;
    }
    getWord(index) {
        const words = this.#loadWords();
        assertArgument(index >= 0 && index < words.length, `invalid word index: ${index}`, "index", index);
        return words[index];
    }
    getWordIndex(word) {
        return this.#loadWords().indexOf(word);
    }
}
const words1 = "0erleonalorenseinceregesticitStanvetearctssi#ch2Athck&tneLl0And#Il.yLeOutO=S|S%b/ra@SurdU'0Ce[Cid|CountCu'Hie=IdOu,-Qui*Ro[TT]T%T*[Tu$0AptDD-tD*[Ju,M.UltV<)Vi)0Rob-0FairF%dRaid0A(EEntRee0Ead0MRRp%tS!_rmBumCoholErtI&LLeyLowMo,O}PhaReadySoT Ways0A>urAz(gOngOuntU'd0Aly,Ch%Ci|G G!GryIm$K!Noun)Nu$O` Sw T&naTiqueXietyY1ArtOlogyPe?P!Pro=Ril1ChCt-EaEnaGueMMedM%MyOundR<+Re,Ri=RowTTefa@Ti,Tw%k0KPe@SaultSetSi,SumeThma0H!>OmTa{T&dT.udeTra@0Ct]D.Gu,NtTh%ToTumn0Era+OcadoOid0AkeA*AyEsomeFulKw?d0Is:ByChel%C#D+GL<)Lc#y~MbooN<aNn RRelyRga(R*lSeS-SketTt!3A^AnAutyCau'ComeEfF%eG(Ha=H(dLie=LowLtN^Nef./TrayTt Twe&Y#d3Cyc!DKeNdOlogyRdR`Tt _{AdeAmeAnketA,EakE[IndOodO[omOu'UeUrUsh_rdAtDyIlMbNeNusOkO,Rd R(gRrowSsTtomUn)XY_{etA(AndA[A=EadEezeI{Id+IefIghtIngIskOccoliOk&OnzeOomO` OwnUsh2Bb!DdyD+tFf$oIldLbLkL!tNd!Nk Rd&Rg R,SS(e[SyTt Y Zz:Bba+B(B!CtusGeKe~LmM aMpNN$N)lNdyNn#NoeNvasNy#Pab!P.$Pta(RRb#RdRgoRpetRryRtSeShS(o/!Su$TT$ogT^Teg%yTt!UghtU'Ut]Ve3Il(gL yM|NsusNturyRe$Rta(_irAlkAmp]An+AosApt Ar+A'AtEapE{Ee'EfErryE,I{&IefIldIm}yOi)Oo'R#-U{!UnkUrn0G?Nnam#Rc!Tiz&TyVil_imApArifyAwAyE<ErkEv I{I|IffImbIn-IpO{OgO'O`OudOwnUbUmpU, Ut^_^A,C#utDeFfeeIlInL!@L%LumnMb(eMeMf%tM-Mm#Mp<yNc tNdu@NfirmNg*[N}@Nsid NtrolNv()OkOlPp PyR$ReRnR*@/Tt#U^UntryUp!Ur'Us(V Yo>_{Ad!AftAmA}AshAt AwlAzyEamEd.EekEwI{etImeIspIt-OpO[Ou^OwdUci$UelUi'Umb!Un^UshYY,$2BeLtu*PPbo?dRiousRr|Rta(R=Sh]/omTe3C!:DMa+MpN)Ng R(gShUght WnY3AlBa>BrisCadeCemb CideCl(eC%a>C*a'ErF&'F(eFyG*eLayLiv M<dMi'Ni$Nti,NyP?tP&dPos.P`PutyRi=ScribeS tSignSkSpair/royTailTe@VelopVi)Vo>3AgramAlAm#dAryCeE'lEtFf G.$Gn.yLemmaNn NosaurRe@RtSag*eScov Sea'ShSmi[S%d Splay/<)V tVideV%)Zzy5Ct%Cum|G~Lph(Ma(Na>NkeyN%OrSeUb!Ve_ftAg#AmaA,-AwEamE[IftIllInkIpI=OpUmY2CkMbNeR(g/T^Ty1Arf1Nam-:G G!RlyRnR`Sily/Sy1HoOlogyOnomy0GeItUca>1F%t0G1GhtTh 2BowD E@r-Eg<tEm|Eph<tEvat%I>Se0B?kBodyBra)Er+Ot]PloyPow Pty0Ab!A@DD![D%'EmyErgyF%)Ga+G(eH<)JoyLi,OughR-hRollSu*T Ti*TryVelope1Isode0U$Uip0AA'OdeOs]R%Upt0CapeSayS&)Ta>0Ern$H-s1Id&)IlOkeOl=1A@Amp!Ce[Ch<+C.eCludeCu'Ecu>Erci'Hau,Hib.I!I,ItOt-P<dPe@Pi*Pla(Po'P*[T&dTra0EEbrow:Br-CeCultyDeIntI`~L'MeMilyMousNNcyNtasyRmSh]TT$Th TigueUltV%.e3Atu*Bru?yD $EEdElMa!N)/iv$T^V W3B Ct]EldGu*LeLmLt N$NdNeNg NishReRmR,Sc$ShTT}[X_gAmeAshAtAv%EeIghtIpOatO{O%Ow UidUshY_mCusGIlLd~owOdOtR)Re,R+tRkRtu}RumRw?dSsil/ UndX_gi!AmeEqu|EshI&dIn+OgOntO,OwnOz&U.2ElNNnyRna)RyTu*:D+tInLaxy~ yMePRa+Rba+Rd&Rl-Rm|SSpTeTh U+Ze3N $NiusN*Nt!Nu(e/u*2O,0AntFtGg!Ng RaffeRlVe_dAn)A*A[IdeImp'ObeOomOryO=OwUe_tDde[LdOdO'RillaSpelSsipV nWn_bA)A(AntApeA[Av.yEatE&IdIefItOc yOupOwUnt_rdE[IdeIltIt?N3M:B.IrLfMm M, NdPpyRb%RdRshR=,TVeWkZ?d3AdAl`ArtAvyD+hogIght~oLmetLpNRo3Dd&Gh~NtPRe/%y5BbyCkeyLdLeLiday~owMeNeyOdPeRnRr%R'Sp.$/TelUrV 5BGeM<Mb!M%Nd*dNgryNtRd!RryRtSb<d3Brid:1EOn0EaEntifyLe2N%e4LLeg$L}[0A+Ita>M&'Mu}Pa@Po'Pro=Pul'0ChCludeComeC*a'DexD-a>Do%Du,ryF<tFl-tF%mHa!H .Iti$Je@JuryMa>N Noc|PutQuiryS<eSe@SideSpi*/$lTa@T e,ToVe,V.eVol=3On0L<dOla>Sue0Em1Ory:CketGu?RZz3AlousAns~yWel9BInKeUr}yY5D+I)MpNg!Ni%Nk/:Ng?oo3EnEpT^upY3CkDD}yNdNgdomSsTT^&TeTt&Wi4EeIfeO{Ow:BBelB%Dd DyKeMpNgua+PtopR+T T(UghUndryVaWWnWsu.Y Zy3Ad AfArnA=Ctu*FtGG$G&dIsu*M#NdNg`NsOp?dSs#Tt Vel3ArB tyBr?yC&'FeFtGhtKeMbM.NkOnQuid/Tt!VeZ?d5AdAnB, C$CkG-NelyNgOpTt yUdUn+VeY$5CkyGga+Mb N?N^Xury3R-s:Ch(eDG-G}tIdIlInJ%KeMm$NNa+Nda>NgoNs]Nu$P!Rb!R^Rg(R(eRketRria+SkSs/ T^T i$ThTrixTt XimumZe3AdowAnAsu*AtCh<-D$DiaLodyLtMb M%yNt]NuRcyR+R.RryShSsa+T$Thod3Dd!DnightLk~]M-NdNimumN%Nu>Rac!Rr%S ySs/akeXXedXtu*5Bi!DelDifyMM|N.%NkeyN, N`OnR$ReRn(gSqu.oTh T]T%Unta(U'VeVie5ChFf(LeLtiplySc!SeumShroomS-/Tu$3Self/ yTh:I=MePk(Rrow/yT]Tu*3ArCkEdGati=G!@I` PhewR=/TTw%kUtr$V WsXt3CeGht5B!I'M(eeOd!Rm$R`SeTab!TeTh(gTi)VelW5C!?Mb R'T:K0EyJe@Li+Scu*S =Ta(Vious0CurE<Tob 0Or1FF Fi)T&2L1Ay0DI=Ymp-0It0CeEI#L(eLy1EnEraIn]Po'T]1An+B.Ch?dD D(?yG<I|Ig($Ph<0Tr-h0H 0Tdo%T TputTside0AlEnEr0NN 0Yg&0/ 0O}:CtDd!GeIrLa)LmNdaNelN-N` P RadeR|RkRrotRtySsT^ThTi|TrolTt nU'VeYm|3A)AnutArAs<tL-<NN$tyNcilOp!Pp Rfe@Rm.Rs#T2O}OtoRa'Ys-$0AnoCn-Ctu*E)GGe#~LotNkO} Pe/olT^Zza_)A}tA,-A>AyEa'Ed+U{UgUn+2EmEtIntL?LeLi)NdNyOlPul?Rt]S.]Ssib!/TatoTt yV tyWd W _@i)Ai'Ed-tEf Epa*Es|EttyEv|I)IdeIm?yIntI%.yIs#Iva>IzeOb!mO)[Odu)Of.OgramOje@Omo>OofOp tyOsp O>@OudOvide2Bl-Dd(g~LpL'Mpk(N^PilPpyR^a'R.yRpo'R'ShTZz!3Ramid:99Al.yAntumArt E,]I{ItIzO>:Bb.Cco#CeCkD?DioIlInI'~yMpN^NdomN+PidReTeTh V&WZ%3AdyAlAs#BelBuildC$lCei=CipeC%dCyc!Du)F!@F%mFu'G]G*tGul?Je@LaxLea'LiefLyMa(Memb M(dMo=Nd NewNtOp&PairPeatPla)P%tQui*ScueSemb!Si,Sour)Sp#'SultTi*T*atTurnUn]Ve$ViewW?d2Y`m0BBb#CeChDeD+F!GhtGidNgOtPp!SkTu$V$V 5AdA,BotBu,CketM<)OfOkieOmSeTa>UghUndU>Y$5Bb DeGLeNNwayR$:DDd!D}[FeIlLadLm#L#LtLu>MeMp!NdTisfyToshiU)Usa+VeY1A!AnA*Att E}HemeHoolI&)I[%sOrp]OutRapRe&RiptRub1AAr^As#AtC#dC*tCt]Cur.yEdEkGm|Le@~M(?Ni%N'Nt&)RiesRvi)Ss]Tt!TupV&_dowAftAllowA*EdEllEriffIeldIftI}IpIv O{OeOotOpOrtOuld O=RimpRugUff!Y0Bl(gCkDeE+GhtGnL|Lk~yLv Mil?Mp!N)NgR&/ Tua>XZe1A>Et^IIllInIrtUll0AbAmEepEnd I)IdeIghtImOg<OtOwUsh0AllArtI!OkeOo`0A{AkeApIffOw0ApCc Ci$CkDaFtL?Ldi LidLut]L=Me#eNgOnRryRtUlUndUpUr)U`0A)A*Ati$AwnEakEci$EedEllEndH eI)Id IkeInIr.L.OilOns%O#OrtOtRayReadR(gY0Ua*UeezeUir*l_b!AdiumAffA+AirsAmpAndArtA>AyEakEelEmEpE*oI{IllIngO{Oma^O}OolOryO=Ra>gyReetRikeR#gRugg!Ud|UffUmb!Y!0Bje@Bm.BwayC)[ChDd&Ff G?G+,ItMm NNnyN'tP PplyP*meReRfa)R+Rpri'RroundR=ySpe@/a(1AllowAmpApArmE?EetIftImIngIt^Ord1MbolMptomRup/em:B!Ck!GIlL|LkNkPeR+tSk/eTtooXi3A^Am~NN<tNnisNtRm/Xt_nkAtEmeEnE%yE*EyIngIsOughtReeRi=RowUmbUnd 0CketDeG LtMb MeNyPRedSsueT!5A,BaccoDayDdl EGe` I!tK&MatoM%rowNeNgueNightOlO`PP-Pp!R^RnadoRtoi'SsT$Uri,W?dW WnY_{AdeAff-Ag-A(Ansf ApAshA=lAyEatEeEndI$IbeI{Igg ImIpOphyOub!U{UeUlyUmpetU,U`Y2BeIt]Mb!NaN}lRkeyRnRt!1El=EntyI)InI,O1PeP-$:5Ly5B*lla0Ab!Awa*C!Cov D DoFairFoldHappyIf%mIqueItIv 'KnownLo{TilUsu$Veil1Da>GradeHoldOnP Set1B<Ge0A+EEdEfulE![U$0Il.y:C<tCuumGueLidL!yL=NNishP%Rious/Ult3H-!L=tNd%Ntu*NueRbRifyRs]RyS'lT <3Ab!Br<tCiousCt%yDeoEw~a+Nta+Ol(Rtu$RusSaS.Su$T$Vid5C$I)IdLc<oLumeTeYa+:GeG#ItLk~LnutNtRfa*RmRri%ShSp/eT VeY3Al`Ap#ArA'lA` BDd(gEk&dIrdLcome/T_!AtEatEelEnE*IpIsp 0DeD`FeLd~NNdowNeNgNkNn Nt ReSdomSeShT}[5LfM<Nd OdOlRdRkRldRryR`_pE{E,!I,I>Ong::Rd3Ar~ow9UUngU`:3BraRo9NeO";
const checksum1 = "0x3c8acc1e7b08d8e76f9fda015ef48dc8c710a73cb7e0f77b2c18a9b5a7adde60";
let wordlist = null;
class LangEn extends WordlistOwl {
    constructor(){
        super("en", words1, checksum1);
    }
    static wordlist() {
        if (wordlist == null) {
            wordlist = new LangEn;
        }
        return wordlist;
    }
}
function getUpperMask(bits) {
    return (1 << bits) - 1 << 8 - bits & 255;
}
function getLowerMask(bits) {
    return (1 << bits) - 1 & 255;
}
function mnemonicToEntropy(mnemonic, wordlist) {
    assertNormalize("NFKD");
    if (wordlist == null) {
        wordlist = LangEn.wordlist();
    }
    const words = wordlist.split(mnemonic);
    assertArgument(words.length % 3 === 0 && words.length >= 12 && words.length <= 24, "invalid mnemonic length", "mnemonic", "[ REDACTED ]");
    const entropy = new Uint8Array(Math.ceil(11 * words.length / 8));
    let offset = 0;
    for(let i = 0; i < words.length; i++){
        let index = wordlist.getWordIndex(words[i].normalize("NFKD"));
        assertArgument(index >= 0, `invalid mnemonic word at index ${i}`, "mnemonic", "[ REDACTED ]");
        for(let bit = 0; bit < 11; bit++){
            if (index & 1 << 10 - bit) {
                entropy[offset >> 3] |= 1 << 7 - offset % 8;
            }
            offset++;
        }
    }
    const entropyBits = 32 * words.length / 3;
    const checksumBits = words.length / 3;
    const checksumMask = getUpperMask(checksumBits);
    const checksum = getBytes(sha256(entropy.slice(0, entropyBits / 8)))[0] & checksumMask;
    assertArgument(checksum === (entropy[entropy.length - 1] & checksumMask), "invalid mnemonic checksum", "mnemonic", "[ REDACTED ]");
    return hexlify(entropy.slice(0, entropyBits / 8));
}
function entropyToMnemonic(entropy, wordlist) {
    assertArgument(entropy.length % 4 === 0 && entropy.length >= 16 && entropy.length <= 32, "invalid entropy size", "entropy", "[ REDACTED ]");
    if (wordlist == null) {
        wordlist = LangEn.wordlist();
    }
    const indices = [
        0
    ];
    let remainingBits = 11;
    for(let i = 0; i < entropy.length; i++){
        if (remainingBits > 8) {
            indices[indices.length - 1] <<= 8;
            indices[indices.length - 1] |= entropy[i];
            remainingBits -= 8;
        } else {
            indices[indices.length - 1] <<= remainingBits;
            indices[indices.length - 1] |= entropy[i] >> 8 - remainingBits;
            indices.push(entropy[i] & getLowerMask(8 - remainingBits));
            remainingBits += 3;
        }
    }
    const checksumBits = entropy.length / 4;
    const checksum = parseInt(sha256(entropy).substring(2, 4), 16) & getUpperMask(checksumBits);
    indices[indices.length - 1] <<= checksumBits;
    indices[indices.length - 1] |= checksum >> 8 - checksumBits;
    return wordlist.join(indices.map((index)=>wordlist.getWord(index)));
}
const _guard$1 = {};
class Mnemonic {
    phrase;
    password;
    wordlist;
    entropy;
    constructor(guard, entropy, phrase, password, wordlist){
        if (password == null) {
            password = "";
        }
        if (wordlist == null) {
            wordlist = LangEn.wordlist();
        }
        assertPrivate(guard, _guard$1, "Mnemonic");
        defineProperties(this, {
            phrase: phrase,
            password: password,
            wordlist: wordlist,
            entropy: entropy
        });
    }
    computeSeed() {
        const salt = toUtf8Bytes("mnemonic" + this.password, "NFKD");
        return pbkdf2(toUtf8Bytes(this.phrase, "NFKD"), salt, 2048, 64, "sha512");
    }
    static fromPhrase(phrase, password, wordlist) {
        const entropy = mnemonicToEntropy(phrase, wordlist);
        phrase = entropyToMnemonic(getBytes(entropy), wordlist);
        return new Mnemonic(_guard$1, entropy, phrase, password, wordlist);
    }
    static fromEntropy(_entropy, password, wordlist) {
        const entropy = getBytes(_entropy, "entropy");
        const phrase = entropyToMnemonic(entropy, wordlist);
        return new Mnemonic(_guard$1, hexlify(entropy), phrase, password, wordlist);
    }
    static entropyToPhrase(_entropy, wordlist) {
        const entropy = getBytes(_entropy, "entropy");
        return entropyToMnemonic(entropy, wordlist);
    }
    static phraseToEntropy(phrase, wordlist) {
        return mnemonicToEntropy(phrase, wordlist);
    }
    static isValidMnemonic(phrase, wordlist) {
        try {
            mnemonicToEntropy(phrase, wordlist);
            return true;
        } catch (error) {}
        return false;
    }
}
var __classPrivateFieldGet$2 = __$G && __$G.__classPrivateFieldGet || function(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet$2 = __$G && __$G.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var _AES_key, _AES_Kd, _AES_Ke;
const numberOfRounds = {
    16: 10,
    24: 12,
    32: 14
};
const rcon = [
    1,
    2,
    4,
    8,
    16,
    32,
    64,
    128,
    27,
    54,
    108,
    216,
    171,
    77,
    154,
    47,
    94,
    188,
    99,
    198,
    151,
    53,
    106,
    212,
    179,
    125,
    250,
    239,
    197,
    145
];
const S = [
    99,
    124,
    119,
    123,
    242,
    107,
    111,
    197,
    48,
    1,
    103,
    43,
    254,
    215,
    171,
    118,
    202,
    130,
    201,
    125,
    250,
    89,
    71,
    240,
    173,
    212,
    162,
    175,
    156,
    164,
    114,
    192,
    183,
    253,
    147,
    38,
    54,
    63,
    247,
    204,
    52,
    165,
    229,
    241,
    113,
    216,
    49,
    21,
    4,
    199,
    35,
    195,
    24,
    150,
    5,
    154,
    7,
    18,
    128,
    226,
    235,
    39,
    178,
    117,
    9,
    131,
    44,
    26,
    27,
    110,
    90,
    160,
    82,
    59,
    214,
    179,
    41,
    227,
    47,
    132,
    83,
    209,
    0,
    237,
    32,
    252,
    177,
    91,
    106,
    203,
    190,
    57,
    74,
    76,
    88,
    207,
    208,
    239,
    170,
    251,
    67,
    77,
    51,
    133,
    69,
    249,
    2,
    127,
    80,
    60,
    159,
    168,
    81,
    163,
    64,
    143,
    146,
    157,
    56,
    245,
    188,
    182,
    218,
    33,
    16,
    255,
    243,
    210,
    205,
    12,
    19,
    236,
    95,
    151,
    68,
    23,
    196,
    167,
    126,
    61,
    100,
    93,
    25,
    115,
    96,
    129,
    79,
    220,
    34,
    42,
    144,
    136,
    70,
    238,
    184,
    20,
    222,
    94,
    11,
    219,
    224,
    50,
    58,
    10,
    73,
    6,
    36,
    92,
    194,
    211,
    172,
    98,
    145,
    149,
    228,
    121,
    231,
    200,
    55,
    109,
    141,
    213,
    78,
    169,
    108,
    86,
    244,
    234,
    101,
    122,
    174,
    8,
    186,
    120,
    37,
    46,
    28,
    166,
    180,
    198,
    232,
    221,
    116,
    31,
    75,
    189,
    139,
    138,
    112,
    62,
    181,
    102,
    72,
    3,
    246,
    14,
    97,
    53,
    87,
    185,
    134,
    193,
    29,
    158,
    225,
    248,
    152,
    17,
    105,
    217,
    142,
    148,
    155,
    30,
    135,
    233,
    206,
    85,
    40,
    223,
    140,
    161,
    137,
    13,
    191,
    230,
    66,
    104,
    65,
    153,
    45,
    15,
    176,
    84,
    187,
    22
];
const Si = [
    82,
    9,
    106,
    213,
    48,
    54,
    165,
    56,
    191,
    64,
    163,
    158,
    129,
    243,
    215,
    251,
    124,
    227,
    57,
    130,
    155,
    47,
    255,
    135,
    52,
    142,
    67,
    68,
    196,
    222,
    233,
    203,
    84,
    123,
    148,
    50,
    166,
    194,
    35,
    61,
    238,
    76,
    149,
    11,
    66,
    250,
    195,
    78,
    8,
    46,
    161,
    102,
    40,
    217,
    36,
    178,
    118,
    91,
    162,
    73,
    109,
    139,
    209,
    37,
    114,
    248,
    246,
    100,
    134,
    104,
    152,
    22,
    212,
    164,
    92,
    204,
    93,
    101,
    182,
    146,
    108,
    112,
    72,
    80,
    253,
    237,
    185,
    218,
    94,
    21,
    70,
    87,
    167,
    141,
    157,
    132,
    144,
    216,
    171,
    0,
    140,
    188,
    211,
    10,
    247,
    228,
    88,
    5,
    184,
    179,
    69,
    6,
    208,
    44,
    30,
    143,
    202,
    63,
    15,
    2,
    193,
    175,
    189,
    3,
    1,
    19,
    138,
    107,
    58,
    145,
    17,
    65,
    79,
    103,
    220,
    234,
    151,
    242,
    207,
    206,
    240,
    180,
    230,
    115,
    150,
    172,
    116,
    34,
    231,
    173,
    53,
    133,
    226,
    249,
    55,
    232,
    28,
    117,
    223,
    110,
    71,
    241,
    26,
    113,
    29,
    41,
    197,
    137,
    111,
    183,
    98,
    14,
    170,
    24,
    190,
    27,
    252,
    86,
    62,
    75,
    198,
    210,
    121,
    32,
    154,
    219,
    192,
    254,
    120,
    205,
    90,
    244,
    31,
    221,
    168,
    51,
    136,
    7,
    199,
    49,
    177,
    18,
    16,
    89,
    39,
    128,
    236,
    95,
    96,
    81,
    127,
    169,
    25,
    181,
    74,
    13,
    45,
    229,
    122,
    159,
    147,
    201,
    156,
    239,
    160,
    224,
    59,
    77,
    174,
    42,
    245,
    176,
    200,
    235,
    187,
    60,
    131,
    83,
    153,
    97,
    23,
    43,
    4,
    126,
    186,
    119,
    214,
    38,
    225,
    105,
    20,
    99,
    85,
    33,
    12,
    125
];
const T1 = [
    3328402341,
    4168907908,
    4000806809,
    4135287693,
    4294111757,
    3597364157,
    3731845041,
    2445657428,
    1613770832,
    33620227,
    3462883241,
    1445669757,
    3892248089,
    3050821474,
    1303096294,
    3967186586,
    2412431941,
    528646813,
    2311702848,
    4202528135,
    4026202645,
    2992200171,
    2387036105,
    4226871307,
    1101901292,
    3017069671,
    1604494077,
    1169141738,
    597466303,
    1403299063,
    3832705686,
    2613100635,
    1974974402,
    3791519004,
    1033081774,
    1277568618,
    1815492186,
    2118074177,
    4126668546,
    2211236943,
    1748251740,
    1369810420,
    3521504564,
    4193382664,
    3799085459,
    2883115123,
    1647391059,
    706024767,
    134480908,
    2512897874,
    1176707941,
    2646852446,
    806885416,
    932615841,
    168101135,
    798661301,
    235341577,
    605164086,
    461406363,
    3756188221,
    3454790438,
    1311188841,
    2142417613,
    3933566367,
    302582043,
    495158174,
    1479289972,
    874125870,
    907746093,
    3698224818,
    3025820398,
    1537253627,
    2756858614,
    1983593293,
    3084310113,
    2108928974,
    1378429307,
    3722699582,
    1580150641,
    327451799,
    2790478837,
    3117535592,
    0,
    3253595436,
    1075847264,
    3825007647,
    2041688520,
    3059440621,
    3563743934,
    2378943302,
    1740553945,
    1916352843,
    2487896798,
    2555137236,
    2958579944,
    2244988746,
    3151024235,
    3320835882,
    1336584933,
    3992714006,
    2252555205,
    2588757463,
    1714631509,
    293963156,
    2319795663,
    3925473552,
    67240454,
    4269768577,
    2689618160,
    2017213508,
    631218106,
    1269344483,
    2723238387,
    1571005438,
    2151694528,
    93294474,
    1066570413,
    563977660,
    1882732616,
    4059428100,
    1673313503,
    2008463041,
    2950355573,
    1109467491,
    537923632,
    3858759450,
    4260623118,
    3218264685,
    2177748300,
    403442708,
    638784309,
    3287084079,
    3193921505,
    899127202,
    2286175436,
    773265209,
    2479146071,
    1437050866,
    4236148354,
    2050833735,
    3362022572,
    3126681063,
    840505643,
    3866325909,
    3227541664,
    427917720,
    2655997905,
    2749160575,
    1143087718,
    1412049534,
    999329963,
    193497219,
    2353415882,
    3354324521,
    1807268051,
    672404540,
    2816401017,
    3160301282,
    369822493,
    2916866934,
    3688947771,
    1681011286,
    1949973070,
    336202270,
    2454276571,
    201721354,
    1210328172,
    3093060836,
    2680341085,
    3184776046,
    1135389935,
    3294782118,
    965841320,
    831886756,
    3554993207,
    4068047243,
    3588745010,
    2345191491,
    1849112409,
    3664604599,
    26054028,
    2983581028,
    2622377682,
    1235855840,
    3630984372,
    2891339514,
    4092916743,
    3488279077,
    3395642799,
    4101667470,
    1202630377,
    268961816,
    1874508501,
    4034427016,
    1243948399,
    1546530418,
    941366308,
    1470539505,
    1941222599,
    2546386513,
    3421038627,
    2715671932,
    3899946140,
    1042226977,
    2521517021,
    1639824860,
    227249030,
    260737669,
    3765465232,
    2084453954,
    1907733956,
    3429263018,
    2420656344,
    100860677,
    4160157185,
    470683154,
    3261161891,
    1781871967,
    2924959737,
    1773779408,
    394692241,
    2579611992,
    974986535,
    664706745,
    3655459128,
    3958962195,
    731420851,
    571543859,
    3530123707,
    2849626480,
    126783113,
    865375399,
    765172662,
    1008606754,
    361203602,
    3387549984,
    2278477385,
    2857719295,
    1344809080,
    2782912378,
    59542671,
    1503764984,
    160008576,
    437062935,
    1707065306,
    3622233649,
    2218934982,
    3496503480,
    2185314755,
    697932208,
    1512910199,
    504303377,
    2075177163,
    2824099068,
    1841019862,
    739644986
];
const T2 = [
    2781242211,
    2230877308,
    2582542199,
    2381740923,
    234877682,
    3184946027,
    2984144751,
    1418839493,
    1348481072,
    50462977,
    2848876391,
    2102799147,
    434634494,
    1656084439,
    3863849899,
    2599188086,
    1167051466,
    2636087938,
    1082771913,
    2281340285,
    368048890,
    3954334041,
    3381544775,
    201060592,
    3963727277,
    1739838676,
    4250903202,
    3930435503,
    3206782108,
    4149453988,
    2531553906,
    1536934080,
    3262494647,
    484572669,
    2923271059,
    1783375398,
    1517041206,
    1098792767,
    49674231,
    1334037708,
    1550332980,
    4098991525,
    886171109,
    150598129,
    2481090929,
    1940642008,
    1398944049,
    1059722517,
    201851908,
    1385547719,
    1699095331,
    1587397571,
    674240536,
    2704774806,
    252314885,
    3039795866,
    151914247,
    908333586,
    2602270848,
    1038082786,
    651029483,
    1766729511,
    3447698098,
    2682942837,
    454166793,
    2652734339,
    1951935532,
    775166490,
    758520603,
    3000790638,
    4004797018,
    4217086112,
    4137964114,
    1299594043,
    1639438038,
    3464344499,
    2068982057,
    1054729187,
    1901997871,
    2534638724,
    4121318227,
    1757008337,
    0,
    750906861,
    1614815264,
    535035132,
    3363418545,
    3988151131,
    3201591914,
    1183697867,
    3647454910,
    1265776953,
    3734260298,
    3566750796,
    3903871064,
    1250283471,
    1807470800,
    717615087,
    3847203498,
    384695291,
    3313910595,
    3617213773,
    1432761139,
    2484176261,
    3481945413,
    283769337,
    100925954,
    2180939647,
    4037038160,
    1148730428,
    3123027871,
    3813386408,
    4087501137,
    4267549603,
    3229630528,
    2315620239,
    2906624658,
    3156319645,
    1215313976,
    82966005,
    3747855548,
    3245848246,
    1974459098,
    1665278241,
    807407632,
    451280895,
    251524083,
    1841287890,
    1283575245,
    337120268,
    891687699,
    801369324,
    3787349855,
    2721421207,
    3431482436,
    959321879,
    1469301956,
    4065699751,
    2197585534,
    1199193405,
    2898814052,
    3887750493,
    724703513,
    2514908019,
    2696962144,
    2551808385,
    3516813135,
    2141445340,
    1715741218,
    2119445034,
    2872807568,
    2198571144,
    3398190662,
    700968686,
    3547052216,
    1009259540,
    2041044702,
    3803995742,
    487983883,
    1991105499,
    1004265696,
    1449407026,
    1316239930,
    504629770,
    3683797321,
    168560134,
    1816667172,
    3837287516,
    1570751170,
    1857934291,
    4014189740,
    2797888098,
    2822345105,
    2754712981,
    936633572,
    2347923833,
    852879335,
    1133234376,
    1500395319,
    3084545389,
    2348912013,
    1689376213,
    3533459022,
    3762923945,
    3034082412,
    4205598294,
    133428468,
    634383082,
    2949277029,
    2398386810,
    3913789102,
    403703816,
    3580869306,
    2297460856,
    1867130149,
    1918643758,
    607656988,
    4049053350,
    3346248884,
    1368901318,
    600565992,
    2090982877,
    2632479860,
    557719327,
    3717614411,
    3697393085,
    2249034635,
    2232388234,
    2430627952,
    1115438654,
    3295786421,
    2865522278,
    3633334344,
    84280067,
    33027830,
    303828494,
    2747425121,
    1600795957,
    4188952407,
    3496589753,
    2434238086,
    1486471617,
    658119965,
    3106381470,
    953803233,
    334231800,
    3005978776,
    857870609,
    3151128937,
    1890179545,
    2298973838,
    2805175444,
    3056442267,
    574365214,
    2450884487,
    550103529,
    1233637070,
    4289353045,
    2018519080,
    2057691103,
    2399374476,
    4166623649,
    2148108681,
    387583245,
    3664101311,
    836232934,
    3330556482,
    3100665960,
    3280093505,
    2955516313,
    2002398509,
    287182607,
    3413881008,
    4238890068,
    3597515707,
    975967766
];
const T3 = [
    1671808611,
    2089089148,
    2006576759,
    2072901243,
    4061003762,
    1807603307,
    1873927791,
    3310653893,
    810573872,
    16974337,
    1739181671,
    729634347,
    4263110654,
    3613570519,
    2883997099,
    1989864566,
    3393556426,
    2191335298,
    3376449993,
    2106063485,
    4195741690,
    1508618841,
    1204391495,
    4027317232,
    2917941677,
    3563566036,
    2734514082,
    2951366063,
    2629772188,
    2767672228,
    1922491506,
    3227229120,
    3082974647,
    4246528509,
    2477669779,
    644500518,
    911895606,
    1061256767,
    4144166391,
    3427763148,
    878471220,
    2784252325,
    3845444069,
    4043897329,
    1905517169,
    3631459288,
    827548209,
    356461077,
    67897348,
    3344078279,
    593839651,
    3277757891,
    405286936,
    2527147926,
    84871685,
    2595565466,
    118033927,
    305538066,
    2157648768,
    3795705826,
    3945188843,
    661212711,
    2999812018,
    1973414517,
    152769033,
    2208177539,
    745822252,
    439235610,
    455947803,
    1857215598,
    1525593178,
    2700827552,
    1391895634,
    994932283,
    3596728278,
    3016654259,
    695947817,
    3812548067,
    795958831,
    2224493444,
    1408607827,
    3513301457,
    0,
    3979133421,
    543178784,
    4229948412,
    2982705585,
    1542305371,
    1790891114,
    3410398667,
    3201918910,
    961245753,
    1256100938,
    1289001036,
    1491644504,
    3477767631,
    3496721360,
    4012557807,
    2867154858,
    4212583931,
    1137018435,
    1305975373,
    861234739,
    2241073541,
    1171229253,
    4178635257,
    33948674,
    2139225727,
    1357946960,
    1011120188,
    2679776671,
    2833468328,
    1374921297,
    2751356323,
    1086357568,
    2408187279,
    2460827538,
    2646352285,
    944271416,
    4110742005,
    3168756668,
    3066132406,
    3665145818,
    560153121,
    271589392,
    4279952895,
    4077846003,
    3530407890,
    3444343245,
    202643468,
    322250259,
    3962553324,
    1608629855,
    2543990167,
    1154254916,
    389623319,
    3294073796,
    2817676711,
    2122513534,
    1028094525,
    1689045092,
    1575467613,
    422261273,
    1939203699,
    1621147744,
    2174228865,
    1339137615,
    3699352540,
    577127458,
    712922154,
    2427141008,
    2290289544,
    1187679302,
    3995715566,
    3100863416,
    339486740,
    3732514782,
    1591917662,
    186455563,
    3681988059,
    3762019296,
    844522546,
    978220090,
    169743370,
    1239126601,
    101321734,
    611076132,
    1558493276,
    3260915650,
    3547250131,
    2901361580,
    1655096418,
    2443721105,
    2510565781,
    3828863972,
    2039214713,
    3878868455,
    3359869896,
    928607799,
    1840765549,
    2374762893,
    3580146133,
    1322425422,
    2850048425,
    1823791212,
    1459268694,
    4094161908,
    3928346602,
    1706019429,
    2056189050,
    2934523822,
    135794696,
    3134549946,
    2022240376,
    628050469,
    779246638,
    472135708,
    2800834470,
    3032970164,
    3327236038,
    3894660072,
    3715932637,
    1956440180,
    522272287,
    1272813131,
    3185336765,
    2340818315,
    2323976074,
    1888542832,
    1044544574,
    3049550261,
    1722469478,
    1222152264,
    50660867,
    4127324150,
    236067854,
    1638122081,
    895445557,
    1475980887,
    3117443513,
    2257655686,
    3243809217,
    489110045,
    2662934430,
    3778599393,
    4162055160,
    2561878936,
    288563729,
    1773916777,
    3648039385,
    2391345038,
    2493985684,
    2612407707,
    505560094,
    2274497927,
    3911240169,
    3460925390,
    1442818645,
    678973480,
    3749357023,
    2358182796,
    2717407649,
    2306869641,
    219617805,
    3218761151,
    3862026214,
    1120306242,
    1756942440,
    1103331905,
    2578459033,
    762796589,
    252780047,
    2966125488,
    1425844308,
    3151392187,
    372911126
];
const T4 = [
    1667474886,
    2088535288,
    2004326894,
    2071694838,
    4075949567,
    1802223062,
    1869591006,
    3318043793,
    808472672,
    16843522,
    1734846926,
    724270422,
    4278065639,
    3621216949,
    2880169549,
    1987484396,
    3402253711,
    2189597983,
    3385409673,
    2105378810,
    4210693615,
    1499065266,
    1195886990,
    4042263547,
    2913856577,
    3570689971,
    2728590687,
    2947541573,
    2627518243,
    2762274643,
    1920112356,
    3233831835,
    3082273397,
    4261223649,
    2475929149,
    640051788,
    909531756,
    1061110142,
    4160160501,
    3435941763,
    875846760,
    2779116625,
    3857003729,
    4059105529,
    1903268834,
    3638064043,
    825316194,
    353713962,
    67374088,
    3351728789,
    589522246,
    3284360861,
    404236336,
    2526454071,
    84217610,
    2593830191,
    117901582,
    303183396,
    2155911963,
    3806477791,
    3958056653,
    656894286,
    2998062463,
    1970642922,
    151591698,
    2206440989,
    741110872,
    437923380,
    454765878,
    1852748508,
    1515908788,
    2694904667,
    1381168804,
    993742198,
    3604373943,
    3014905469,
    690584402,
    3823320797,
    791638366,
    2223281939,
    1398011302,
    3520161977,
    0,
    3991743681,
    538992704,
    4244381667,
    2981218425,
    1532751286,
    1785380564,
    3419096717,
    3200178535,
    960056178,
    1246420628,
    1280103576,
    1482221744,
    3486468741,
    3503319995,
    4025428677,
    2863326543,
    4227536621,
    1128514950,
    1296947098,
    859002214,
    2240123921,
    1162203018,
    4193849577,
    33687044,
    2139062782,
    1347481760,
    1010582648,
    2678045221,
    2829640523,
    1364325282,
    2745433693,
    1077985408,
    2408548869,
    2459086143,
    2644360225,
    943212656,
    4126475505,
    3166494563,
    3065430391,
    3671750063,
    555836226,
    269496352,
    4294908645,
    4092792573,
    3537006015,
    3452783745,
    202118168,
    320025894,
    3974901699,
    1600119230,
    2543297077,
    1145359496,
    387397934,
    3301201811,
    2812801621,
    2122220284,
    1027426170,
    1684319432,
    1566435258,
    421079858,
    1936954854,
    1616945344,
    2172753945,
    1330631070,
    3705438115,
    572679748,
    707427924,
    2425400123,
    2290647819,
    1179044492,
    4008585671,
    3099120491,
    336870440,
    3739122087,
    1583276732,
    185277718,
    3688593069,
    3772791771,
    842159716,
    976899700,
    168435220,
    1229577106,
    101059084,
    606366792,
    1549591736,
    3267517855,
    3553849021,
    2897014595,
    1650632388,
    2442242105,
    2509612081,
    3840161747,
    2038008818,
    3890688725,
    3368567691,
    926374254,
    1835907034,
    2374863873,
    3587531953,
    1313788572,
    2846482505,
    1819063512,
    1448540844,
    4109633523,
    3941213647,
    1701162954,
    2054852340,
    2930698567,
    134748176,
    3132806511,
    2021165296,
    623210314,
    774795868,
    471606328,
    2795958615,
    3031746419,
    3334885783,
    3907527627,
    3722280097,
    1953799400,
    522133822,
    1263263126,
    3183336545,
    2341176845,
    2324333839,
    1886425312,
    1044267644,
    3048588401,
    1718004428,
    1212733584,
    50529542,
    4143317495,
    235803164,
    1633788866,
    892690282,
    1465383342,
    3115962473,
    2256965911,
    3250673817,
    488449850,
    2661202215,
    3789633753,
    4177007595,
    2560144171,
    286339874,
    1768537042,
    3654906025,
    2391705863,
    2492770099,
    2610673197,
    505291324,
    2273808917,
    3924369609,
    3469625735,
    1431699370,
    673740880,
    3755965093,
    2358021891,
    2711746649,
    2307489801,
    218961690,
    3217021541,
    3873845719,
    1111672452,
    1751693520,
    1094828930,
    2576986153,
    757954394,
    252645662,
    2964376443,
    1414855848,
    3149649517,
    370555436
];
const T5 = [
    1374988112,
    2118214995,
    437757123,
    975658646,
    1001089995,
    530400753,
    2902087851,
    1273168787,
    540080725,
    2910219766,
    2295101073,
    4110568485,
    1340463100,
    3307916247,
    641025152,
    3043140495,
    3736164937,
    632953703,
    1172967064,
    1576976609,
    3274667266,
    2169303058,
    2370213795,
    1809054150,
    59727847,
    361929877,
    3211623147,
    2505202138,
    3569255213,
    1484005843,
    1239443753,
    2395588676,
    1975683434,
    4102977912,
    2572697195,
    666464733,
    3202437046,
    4035489047,
    3374361702,
    2110667444,
    1675577880,
    3843699074,
    2538681184,
    1649639237,
    2976151520,
    3144396420,
    4269907996,
    4178062228,
    1883793496,
    2403728665,
    2497604743,
    1383856311,
    2876494627,
    1917518562,
    3810496343,
    1716890410,
    3001755655,
    800440835,
    2261089178,
    3543599269,
    807962610,
    599762354,
    33778362,
    3977675356,
    2328828971,
    2809771154,
    4077384432,
    1315562145,
    1708848333,
    101039829,
    3509871135,
    3299278474,
    875451293,
    2733856160,
    92987698,
    2767645557,
    193195065,
    1080094634,
    1584504582,
    3178106961,
    1042385657,
    2531067453,
    3711829422,
    1306967366,
    2438237621,
    1908694277,
    67556463,
    1615861247,
    429456164,
    3602770327,
    2302690252,
    1742315127,
    2968011453,
    126454664,
    3877198648,
    2043211483,
    2709260871,
    2084704233,
    4169408201,
    0,
    159417987,
    841739592,
    504459436,
    1817866830,
    4245618683,
    260388950,
    1034867998,
    908933415,
    168810852,
    1750902305,
    2606453969,
    607530554,
    202008497,
    2472011535,
    3035535058,
    463180190,
    2160117071,
    1641816226,
    1517767529,
    470948374,
    3801332234,
    3231722213,
    1008918595,
    303765277,
    235474187,
    4069246893,
    766945465,
    337553864,
    1475418501,
    2943682380,
    4003061179,
    2743034109,
    4144047775,
    1551037884,
    1147550661,
    1543208500,
    2336434550,
    3408119516,
    3069049960,
    3102011747,
    3610369226,
    1113818384,
    328671808,
    2227573024,
    2236228733,
    3535486456,
    2935566865,
    3341394285,
    496906059,
    3702665459,
    226906860,
    2009195472,
    733156972,
    2842737049,
    294930682,
    1206477858,
    2835123396,
    2700099354,
    1451044056,
    573804783,
    2269728455,
    3644379585,
    2362090238,
    2564033334,
    2801107407,
    2776292904,
    3669462566,
    1068351396,
    742039012,
    1350078989,
    1784663195,
    1417561698,
    4136440770,
    2430122216,
    775550814,
    2193862645,
    2673705150,
    1775276924,
    1876241833,
    3475313331,
    3366754619,
    270040487,
    3902563182,
    3678124923,
    3441850377,
    1851332852,
    3969562369,
    2203032232,
    3868552805,
    2868897406,
    566021896,
    4011190502,
    3135740889,
    1248802510,
    3936291284,
    699432150,
    832877231,
    708780849,
    3332740144,
    899835584,
    1951317047,
    4236429990,
    3767586992,
    866637845,
    4043610186,
    1106041591,
    2144161806,
    395441711,
    1984812685,
    1139781709,
    3433712980,
    3835036895,
    2664543715,
    1282050075,
    3240894392,
    1181045119,
    2640243204,
    25965917,
    4203181171,
    4211818798,
    3009879386,
    2463879762,
    3910161971,
    1842759443,
    2597806476,
    933301370,
    1509430414,
    3943906441,
    3467192302,
    3076639029,
    3776767469,
    2051518780,
    2631065433,
    1441952575,
    404016761,
    1942435775,
    1408749034,
    1610459739,
    3745345300,
    2017778566,
    3400528769,
    3110650942,
    941896748,
    3265478751,
    371049330,
    3168937228,
    675039627,
    4279080257,
    967311729,
    135050206,
    3635733660,
    1683407248,
    2076935265,
    3576870512,
    1215061108,
    3501741890
];
const T6 = [
    1347548327,
    1400783205,
    3273267108,
    2520393566,
    3409685355,
    4045380933,
    2880240216,
    2471224067,
    1428173050,
    4138563181,
    2441661558,
    636813900,
    4233094615,
    3620022987,
    2149987652,
    2411029155,
    1239331162,
    1730525723,
    2554718734,
    3781033664,
    46346101,
    310463728,
    2743944855,
    3328955385,
    3875770207,
    2501218972,
    3955191162,
    3667219033,
    768917123,
    3545789473,
    692707433,
    1150208456,
    1786102409,
    2029293177,
    1805211710,
    3710368113,
    3065962831,
    401639597,
    1724457132,
    3028143674,
    409198410,
    2196052529,
    1620529459,
    1164071807,
    3769721975,
    2226875310,
    486441376,
    2499348523,
    1483753576,
    428819965,
    2274680428,
    3075636216,
    598438867,
    3799141122,
    1474502543,
    711349675,
    129166120,
    53458370,
    2592523643,
    2782082824,
    4063242375,
    2988687269,
    3120694122,
    1559041666,
    730517276,
    2460449204,
    4042459122,
    2706270690,
    3446004468,
    3573941694,
    533804130,
    2328143614,
    2637442643,
    2695033685,
    839224033,
    1973745387,
    957055980,
    2856345839,
    106852767,
    1371368976,
    4181598602,
    1033297158,
    2933734917,
    1179510461,
    3046200461,
    91341917,
    1862534868,
    4284502037,
    605657339,
    2547432937,
    3431546947,
    2003294622,
    3182487618,
    2282195339,
    954669403,
    3682191598,
    1201765386,
    3917234703,
    3388507166,
    0,
    2198438022,
    1211247597,
    2887651696,
    1315723890,
    4227665663,
    1443857720,
    507358933,
    657861945,
    1678381017,
    560487590,
    3516619604,
    975451694,
    2970356327,
    261314535,
    3535072918,
    2652609425,
    1333838021,
    2724322336,
    1767536459,
    370938394,
    182621114,
    3854606378,
    1128014560,
    487725847,
    185469197,
    2918353863,
    3106780840,
    3356761769,
    2237133081,
    1286567175,
    3152976349,
    4255350624,
    2683765030,
    3160175349,
    3309594171,
    878443390,
    1988838185,
    3704300486,
    1756818940,
    1673061617,
    3403100636,
    272786309,
    1075025698,
    545572369,
    2105887268,
    4174560061,
    296679730,
    1841768865,
    1260232239,
    4091327024,
    3960309330,
    3497509347,
    1814803222,
    2578018489,
    4195456072,
    575138148,
    3299409036,
    446754879,
    3629546796,
    4011996048,
    3347532110,
    3252238545,
    4270639778,
    915985419,
    3483825537,
    681933534,
    651868046,
    2755636671,
    3828103837,
    223377554,
    2607439820,
    1649704518,
    3270937875,
    3901806776,
    1580087799,
    4118987695,
    3198115200,
    2087309459,
    2842678573,
    3016697106,
    1003007129,
    2802849917,
    1860738147,
    2077965243,
    164439672,
    4100872472,
    32283319,
    2827177882,
    1709610350,
    2125135846,
    136428751,
    3874428392,
    3652904859,
    3460984630,
    3572145929,
    3593056380,
    2939266226,
    824852259,
    818324884,
    3224740454,
    930369212,
    2801566410,
    2967507152,
    355706840,
    1257309336,
    4148292826,
    243256656,
    790073846,
    2373340630,
    1296297904,
    1422699085,
    3756299780,
    3818836405,
    457992840,
    3099667487,
    2135319889,
    77422314,
    1560382517,
    1945798516,
    788204353,
    1521706781,
    1385356242,
    870912086,
    325965383,
    2358957921,
    2050466060,
    2388260884,
    2313884476,
    4006521127,
    901210569,
    3990953189,
    1014646705,
    1503449823,
    1062597235,
    2031621326,
    3212035895,
    3931371469,
    1533017514,
    350174575,
    2256028891,
    2177544179,
    1052338372,
    741876788,
    1606591296,
    1914052035,
    213705253,
    2334669897,
    1107234197,
    1899603969,
    3725069491,
    2631447780,
    2422494913,
    1635502980,
    1893020342,
    1950903388,
    1120974935
];
const T7 = [
    2807058932,
    1699970625,
    2764249623,
    1586903591,
    1808481195,
    1173430173,
    1487645946,
    59984867,
    4199882800,
    1844882806,
    1989249228,
    1277555970,
    3623636965,
    3419915562,
    1149249077,
    2744104290,
    1514790577,
    459744698,
    244860394,
    3235995134,
    1963115311,
    4027744588,
    2544078150,
    4190530515,
    1608975247,
    2627016082,
    2062270317,
    1507497298,
    2200818878,
    567498868,
    1764313568,
    3359936201,
    2305455554,
    2037970062,
    1047239e3,
    1910319033,
    1337376481,
    2904027272,
    2892417312,
    984907214,
    1243112415,
    830661914,
    861968209,
    2135253587,
    2011214180,
    2927934315,
    2686254721,
    731183368,
    1750626376,
    4246310725,
    1820824798,
    4172763771,
    3542330227,
    48394827,
    2404901663,
    2871682645,
    671593195,
    3254988725,
    2073724613,
    145085239,
    2280796200,
    2779915199,
    1790575107,
    2187128086,
    472615631,
    3029510009,
    4075877127,
    3802222185,
    4107101658,
    3201631749,
    1646252340,
    4270507174,
    1402811438,
    1436590835,
    3778151818,
    3950355702,
    3963161475,
    4020912224,
    2667994737,
    273792366,
    2331590177,
    104699613,
    95345982,
    3175501286,
    2377486676,
    1560637892,
    3564045318,
    369057872,
    4213447064,
    3919042237,
    1137477952,
    2658625497,
    1119727848,
    2340947849,
    1530455833,
    4007360968,
    172466556,
    266959938,
    516552836,
    0,
    2256734592,
    3980931627,
    1890328081,
    1917742170,
    4294704398,
    945164165,
    3575528878,
    958871085,
    3647212047,
    2787207260,
    1423022939,
    775562294,
    1739656202,
    3876557655,
    2530391278,
    2443058075,
    3310321856,
    547512796,
    1265195639,
    437656594,
    3121275539,
    719700128,
    3762502690,
    387781147,
    218828297,
    3350065803,
    2830708150,
    2848461854,
    428169201,
    122466165,
    3720081049,
    1627235199,
    648017665,
    4122762354,
    1002783846,
    2117360635,
    695634755,
    3336358691,
    4234721005,
    4049844452,
    3704280881,
    2232435299,
    574624663,
    287343814,
    612205898,
    1039717051,
    840019705,
    2708326185,
    793451934,
    821288114,
    1391201670,
    3822090177,
    376187827,
    3113855344,
    1224348052,
    1679968233,
    2361698556,
    1058709744,
    752375421,
    2431590963,
    1321699145,
    3519142200,
    2734591178,
    188127444,
    2177869557,
    3727205754,
    2384911031,
    3215212461,
    2648976442,
    2450346104,
    3432737375,
    1180849278,
    331544205,
    3102249176,
    4150144569,
    2952102595,
    2159976285,
    2474404304,
    766078933,
    313773861,
    2570832044,
    2108100632,
    1668212892,
    3145456443,
    2013908262,
    418672217,
    3070356634,
    2594734927,
    1852171925,
    3867060991,
    3473416636,
    3907448597,
    2614737639,
    919489135,
    164948639,
    2094410160,
    2997825956,
    590424639,
    2486224549,
    1723872674,
    3157750862,
    3399941250,
    3501252752,
    3625268135,
    2555048196,
    3673637356,
    1343127501,
    4130281361,
    3599595085,
    2957853679,
    1297403050,
    81781910,
    3051593425,
    2283490410,
    532201772,
    1367295589,
    3926170974,
    895287692,
    1953757831,
    1093597963,
    492483431,
    3528626907,
    1446242576,
    1192455638,
    1636604631,
    209336225,
    344873464,
    1015671571,
    669961897,
    3375740769,
    3857572124,
    2973530695,
    3747192018,
    1933530610,
    3464042516,
    935293895,
    3454686199,
    2858115069,
    1863638845,
    3683022916,
    4085369519,
    3292445032,
    875313188,
    1080017571,
    3279033885,
    621591778,
    1233856572,
    2504130317,
    24197544,
    3017672716,
    3835484340,
    3247465558,
    2220981195,
    3060847922,
    1551124588,
    1463996600
];
const T8 = [
    4104605777,
    1097159550,
    396673818,
    660510266,
    2875968315,
    2638606623,
    4200115116,
    3808662347,
    821712160,
    1986918061,
    3430322568,
    38544885,
    3856137295,
    718002117,
    893681702,
    1654886325,
    2975484382,
    3122358053,
    3926825029,
    4274053469,
    796197571,
    1290801793,
    1184342925,
    3556361835,
    2405426947,
    2459735317,
    1836772287,
    1381620373,
    3196267988,
    1948373848,
    3764988233,
    3385345166,
    3263785589,
    2390325492,
    1480485785,
    3111247143,
    3780097726,
    2293045232,
    548169417,
    3459953789,
    3746175075,
    439452389,
    1362321559,
    1400849762,
    1685577905,
    1806599355,
    2174754046,
    137073913,
    1214797936,
    1174215055,
    3731654548,
    2079897426,
    1943217067,
    1258480242,
    529487843,
    1437280870,
    3945269170,
    3049390895,
    3313212038,
    923313619,
    679998e3,
    3215307299,
    57326082,
    377642221,
    3474729866,
    2041877159,
    133361907,
    1776460110,
    3673476453,
    96392454,
    878845905,
    2801699524,
    777231668,
    4082475170,
    2330014213,
    4142626212,
    2213296395,
    1626319424,
    1906247262,
    1846563261,
    562755902,
    3708173718,
    1040559837,
    3871163981,
    1418573201,
    3294430577,
    114585348,
    1343618912,
    2566595609,
    3186202582,
    1078185097,
    3651041127,
    3896688048,
    2307622919,
    425408743,
    3371096953,
    2081048481,
    1108339068,
    2216610296,
    0,
    2156299017,
    736970802,
    292596766,
    1517440620,
    251657213,
    2235061775,
    2933202493,
    758720310,
    265905162,
    1554391400,
    1532285339,
    908999204,
    174567692,
    1474760595,
    4002861748,
    2610011675,
    3234156416,
    3693126241,
    2001430874,
    303699484,
    2478443234,
    2687165888,
    585122620,
    454499602,
    151849742,
    2345119218,
    3064510765,
    514443284,
    4044981591,
    1963412655,
    2581445614,
    2137062819,
    19308535,
    1928707164,
    1715193156,
    4219352155,
    1126790795,
    600235211,
    3992742070,
    3841024952,
    836553431,
    1669664834,
    2535604243,
    3323011204,
    1243905413,
    3141400786,
    4180808110,
    698445255,
    2653899549,
    2989552604,
    2253581325,
    3252932727,
    3004591147,
    1891211689,
    2487810577,
    3915653703,
    4237083816,
    4030667424,
    2100090966,
    865136418,
    1229899655,
    953270745,
    3399679628,
    3557504664,
    4118925222,
    2061379749,
    3079546586,
    2915017791,
    983426092,
    2022837584,
    1607244650,
    2118541908,
    2366882550,
    3635996816,
    972512814,
    3283088770,
    1568718495,
    3499326569,
    3576539503,
    621982671,
    2895723464,
    410887952,
    2623762152,
    1002142683,
    645401037,
    1494807662,
    2595684844,
    1335535747,
    2507040230,
    4293295786,
    3167684641,
    367585007,
    3885750714,
    1865862730,
    2668221674,
    2960971305,
    2763173681,
    1059270954,
    2777952454,
    2724642869,
    1320957812,
    2194319100,
    2429595872,
    2815956275,
    77089521,
    3973773121,
    3444575871,
    2448830231,
    1305906550,
    4021308739,
    2857194700,
    2516901860,
    3518358430,
    1787304780,
    740276417,
    1699839814,
    1592394909,
    2352307457,
    2272556026,
    188821243,
    1729977011,
    3687994002,
    274084841,
    3594982253,
    3613494426,
    2701949495,
    4162096729,
    322734571,
    2837966542,
    1640576439,
    484830689,
    1202797690,
    3537852828,
    4067639125,
    349075736,
    3342319475,
    4157467219,
    4255800159,
    1030690015,
    1155237496,
    2951971274,
    1757691577,
    607398968,
    2738905026,
    499347990,
    3794078908,
    1011452712,
    227885567,
    2818666809,
    213114376,
    3034881240,
    1455525988,
    3414450555,
    850817237,
    1817998408,
    3092726480
];
const U1 = [
    0,
    235474187,
    470948374,
    303765277,
    941896748,
    908933415,
    607530554,
    708780849,
    1883793496,
    2118214995,
    1817866830,
    1649639237,
    1215061108,
    1181045119,
    1417561698,
    1517767529,
    3767586992,
    4003061179,
    4236429990,
    4069246893,
    3635733660,
    3602770327,
    3299278474,
    3400528769,
    2430122216,
    2664543715,
    2362090238,
    2193862645,
    2835123396,
    2801107407,
    3035535058,
    3135740889,
    3678124923,
    3576870512,
    3341394285,
    3374361702,
    3810496343,
    3977675356,
    4279080257,
    4043610186,
    2876494627,
    2776292904,
    3076639029,
    3110650942,
    2472011535,
    2640243204,
    2403728665,
    2169303058,
    1001089995,
    899835584,
    666464733,
    699432150,
    59727847,
    226906860,
    530400753,
    294930682,
    1273168787,
    1172967064,
    1475418501,
    1509430414,
    1942435775,
    2110667444,
    1876241833,
    1641816226,
    2910219766,
    2743034109,
    2976151520,
    3211623147,
    2505202138,
    2606453969,
    2302690252,
    2269728455,
    3711829422,
    3543599269,
    3240894392,
    3475313331,
    3843699074,
    3943906441,
    4178062228,
    4144047775,
    1306967366,
    1139781709,
    1374988112,
    1610459739,
    1975683434,
    2076935265,
    1775276924,
    1742315127,
    1034867998,
    866637845,
    566021896,
    800440835,
    92987698,
    193195065,
    429456164,
    395441711,
    1984812685,
    2017778566,
    1784663195,
    1683407248,
    1315562145,
    1080094634,
    1383856311,
    1551037884,
    101039829,
    135050206,
    437757123,
    337553864,
    1042385657,
    807962610,
    573804783,
    742039012,
    2531067453,
    2564033334,
    2328828971,
    2227573024,
    2935566865,
    2700099354,
    3001755655,
    3168937228,
    3868552805,
    3902563182,
    4203181171,
    4102977912,
    3736164937,
    3501741890,
    3265478751,
    3433712980,
    1106041591,
    1340463100,
    1576976609,
    1408749034,
    2043211483,
    2009195472,
    1708848333,
    1809054150,
    832877231,
    1068351396,
    766945465,
    599762354,
    159417987,
    126454664,
    361929877,
    463180190,
    2709260871,
    2943682380,
    3178106961,
    3009879386,
    2572697195,
    2538681184,
    2236228733,
    2336434550,
    3509871135,
    3745345300,
    3441850377,
    3274667266,
    3910161971,
    3877198648,
    4110568485,
    4211818798,
    2597806476,
    2497604743,
    2261089178,
    2295101073,
    2733856160,
    2902087851,
    3202437046,
    2968011453,
    3936291284,
    3835036895,
    4136440770,
    4169408201,
    3535486456,
    3702665459,
    3467192302,
    3231722213,
    2051518780,
    1951317047,
    1716890410,
    1750902305,
    1113818384,
    1282050075,
    1584504582,
    1350078989,
    168810852,
    67556463,
    371049330,
    404016761,
    841739592,
    1008918595,
    775550814,
    540080725,
    3969562369,
    3801332234,
    4035489047,
    4269907996,
    3569255213,
    3669462566,
    3366754619,
    3332740144,
    2631065433,
    2463879762,
    2160117071,
    2395588676,
    2767645557,
    2868897406,
    3102011747,
    3069049960,
    202008497,
    33778362,
    270040487,
    504459436,
    875451293,
    975658646,
    675039627,
    641025152,
    2084704233,
    1917518562,
    1615861247,
    1851332852,
    1147550661,
    1248802510,
    1484005843,
    1451044056,
    933301370,
    967311729,
    733156972,
    632953703,
    260388950,
    25965917,
    328671808,
    496906059,
    1206477858,
    1239443753,
    1543208500,
    1441952575,
    2144161806,
    1908694277,
    1675577880,
    1842759443,
    3610369226,
    3644379585,
    3408119516,
    3307916247,
    4011190502,
    3776767469,
    4077384432,
    4245618683,
    2809771154,
    2842737049,
    3144396420,
    3043140495,
    2673705150,
    2438237621,
    2203032232,
    2370213795
];
const U2 = [
    0,
    185469197,
    370938394,
    487725847,
    741876788,
    657861945,
    975451694,
    824852259,
    1483753576,
    1400783205,
    1315723890,
    1164071807,
    1950903388,
    2135319889,
    1649704518,
    1767536459,
    2967507152,
    3152976349,
    2801566410,
    2918353863,
    2631447780,
    2547432937,
    2328143614,
    2177544179,
    3901806776,
    3818836405,
    4270639778,
    4118987695,
    3299409036,
    3483825537,
    3535072918,
    3652904859,
    2077965243,
    1893020342,
    1841768865,
    1724457132,
    1474502543,
    1559041666,
    1107234197,
    1257309336,
    598438867,
    681933534,
    901210569,
    1052338372,
    261314535,
    77422314,
    428819965,
    310463728,
    3409685355,
    3224740454,
    3710368113,
    3593056380,
    3875770207,
    3960309330,
    4045380933,
    4195456072,
    2471224067,
    2554718734,
    2237133081,
    2388260884,
    3212035895,
    3028143674,
    2842678573,
    2724322336,
    4138563181,
    4255350624,
    3769721975,
    3955191162,
    3667219033,
    3516619604,
    3431546947,
    3347532110,
    2933734917,
    2782082824,
    3099667487,
    3016697106,
    2196052529,
    2313884476,
    2499348523,
    2683765030,
    1179510461,
    1296297904,
    1347548327,
    1533017514,
    1786102409,
    1635502980,
    2087309459,
    2003294622,
    507358933,
    355706840,
    136428751,
    53458370,
    839224033,
    957055980,
    605657339,
    790073846,
    2373340630,
    2256028891,
    2607439820,
    2422494913,
    2706270690,
    2856345839,
    3075636216,
    3160175349,
    3573941694,
    3725069491,
    3273267108,
    3356761769,
    4181598602,
    4063242375,
    4011996048,
    3828103837,
    1033297158,
    915985419,
    730517276,
    545572369,
    296679730,
    446754879,
    129166120,
    213705253,
    1709610350,
    1860738147,
    1945798516,
    2029293177,
    1239331162,
    1120974935,
    1606591296,
    1422699085,
    4148292826,
    4233094615,
    3781033664,
    3931371469,
    3682191598,
    3497509347,
    3446004468,
    3328955385,
    2939266226,
    2755636671,
    3106780840,
    2988687269,
    2198438022,
    2282195339,
    2501218972,
    2652609425,
    1201765386,
    1286567175,
    1371368976,
    1521706781,
    1805211710,
    1620529459,
    2105887268,
    1988838185,
    533804130,
    350174575,
    164439672,
    46346101,
    870912086,
    954669403,
    636813900,
    788204353,
    2358957921,
    2274680428,
    2592523643,
    2441661558,
    2695033685,
    2880240216,
    3065962831,
    3182487618,
    3572145929,
    3756299780,
    3270937875,
    3388507166,
    4174560061,
    4091327024,
    4006521127,
    3854606378,
    1014646705,
    930369212,
    711349675,
    560487590,
    272786309,
    457992840,
    106852767,
    223377554,
    1678381017,
    1862534868,
    1914052035,
    2031621326,
    1211247597,
    1128014560,
    1580087799,
    1428173050,
    32283319,
    182621114,
    401639597,
    486441376,
    768917123,
    651868046,
    1003007129,
    818324884,
    1503449823,
    1385356242,
    1333838021,
    1150208456,
    1973745387,
    2125135846,
    1673061617,
    1756818940,
    2970356327,
    3120694122,
    2802849917,
    2887651696,
    2637442643,
    2520393566,
    2334669897,
    2149987652,
    3917234703,
    3799141122,
    4284502037,
    4100872472,
    3309594171,
    3460984630,
    3545789473,
    3629546796,
    2050466060,
    1899603969,
    1814803222,
    1730525723,
    1443857720,
    1560382517,
    1075025698,
    1260232239,
    575138148,
    692707433,
    878443390,
    1062597235,
    243256656,
    91341917,
    409198410,
    325965383,
    3403100636,
    3252238545,
    3704300486,
    3620022987,
    3874428392,
    3990953189,
    4042459122,
    4227665663,
    2460449204,
    2578018489,
    2226875310,
    2411029155,
    3198115200,
    3046200461,
    2827177882,
    2743944855
];
const U3 = [
    0,
    218828297,
    437656594,
    387781147,
    875313188,
    958871085,
    775562294,
    590424639,
    1750626376,
    1699970625,
    1917742170,
    2135253587,
    1551124588,
    1367295589,
    1180849278,
    1265195639,
    3501252752,
    3720081049,
    3399941250,
    3350065803,
    3835484340,
    3919042237,
    4270507174,
    4085369519,
    3102249176,
    3051593425,
    2734591178,
    2952102595,
    2361698556,
    2177869557,
    2530391278,
    2614737639,
    3145456443,
    3060847922,
    2708326185,
    2892417312,
    2404901663,
    2187128086,
    2504130317,
    2555048196,
    3542330227,
    3727205754,
    3375740769,
    3292445032,
    3876557655,
    3926170974,
    4246310725,
    4027744588,
    1808481195,
    1723872674,
    1910319033,
    2094410160,
    1608975247,
    1391201670,
    1173430173,
    1224348052,
    59984867,
    244860394,
    428169201,
    344873464,
    935293895,
    984907214,
    766078933,
    547512796,
    1844882806,
    1627235199,
    2011214180,
    2062270317,
    1507497298,
    1423022939,
    1137477952,
    1321699145,
    95345982,
    145085239,
    532201772,
    313773861,
    830661914,
    1015671571,
    731183368,
    648017665,
    3175501286,
    2957853679,
    2807058932,
    2858115069,
    2305455554,
    2220981195,
    2474404304,
    2658625497,
    3575528878,
    3625268135,
    3473416636,
    3254988725,
    3778151818,
    3963161475,
    4213447064,
    4130281361,
    3599595085,
    3683022916,
    3432737375,
    3247465558,
    3802222185,
    4020912224,
    4172763771,
    4122762354,
    3201631749,
    3017672716,
    2764249623,
    2848461854,
    2331590177,
    2280796200,
    2431590963,
    2648976442,
    104699613,
    188127444,
    472615631,
    287343814,
    840019705,
    1058709744,
    671593195,
    621591778,
    1852171925,
    1668212892,
    1953757831,
    2037970062,
    1514790577,
    1463996600,
    1080017571,
    1297403050,
    3673637356,
    3623636965,
    3235995134,
    3454686199,
    4007360968,
    3822090177,
    4107101658,
    4190530515,
    2997825956,
    3215212461,
    2830708150,
    2779915199,
    2256734592,
    2340947849,
    2627016082,
    2443058075,
    172466556,
    122466165,
    273792366,
    492483431,
    1047239e3,
    861968209,
    612205898,
    695634755,
    1646252340,
    1863638845,
    2013908262,
    1963115311,
    1446242576,
    1530455833,
    1277555970,
    1093597963,
    1636604631,
    1820824798,
    2073724613,
    1989249228,
    1436590835,
    1487645946,
    1337376481,
    1119727848,
    164948639,
    81781910,
    331544205,
    516552836,
    1039717051,
    821288114,
    669961897,
    719700128,
    2973530695,
    3157750862,
    2871682645,
    2787207260,
    2232435299,
    2283490410,
    2667994737,
    2450346104,
    3647212047,
    3564045318,
    3279033885,
    3464042516,
    3980931627,
    3762502690,
    4150144569,
    4199882800,
    3070356634,
    3121275539,
    2904027272,
    2686254721,
    2200818878,
    2384911031,
    2570832044,
    2486224549,
    3747192018,
    3528626907,
    3310321856,
    3359936201,
    3950355702,
    3867060991,
    4049844452,
    4234721005,
    1739656202,
    1790575107,
    2108100632,
    1890328081,
    1402811438,
    1586903591,
    1233856572,
    1149249077,
    266959938,
    48394827,
    369057872,
    418672217,
    1002783846,
    919489135,
    567498868,
    752375421,
    209336225,
    24197544,
    376187827,
    459744698,
    945164165,
    895287692,
    574624663,
    793451934,
    1679968233,
    1764313568,
    2117360635,
    1933530610,
    1343127501,
    1560637892,
    1243112415,
    1192455638,
    3704280881,
    3519142200,
    3336358691,
    3419915562,
    3907448597,
    3857572124,
    4075877127,
    4294704398,
    3029510009,
    3113855344,
    2927934315,
    2744104290,
    2159976285,
    2377486676,
    2594734927,
    2544078150
];
const U4 = [
    0,
    151849742,
    303699484,
    454499602,
    607398968,
    758720310,
    908999204,
    1059270954,
    1214797936,
    1097159550,
    1517440620,
    1400849762,
    1817998408,
    1699839814,
    2118541908,
    2001430874,
    2429595872,
    2581445614,
    2194319100,
    2345119218,
    3034881240,
    3186202582,
    2801699524,
    2951971274,
    3635996816,
    3518358430,
    3399679628,
    3283088770,
    4237083816,
    4118925222,
    4002861748,
    3885750714,
    1002142683,
    850817237,
    698445255,
    548169417,
    529487843,
    377642221,
    227885567,
    77089521,
    1943217067,
    2061379749,
    1640576439,
    1757691577,
    1474760595,
    1592394909,
    1174215055,
    1290801793,
    2875968315,
    2724642869,
    3111247143,
    2960971305,
    2405426947,
    2253581325,
    2638606623,
    2487810577,
    3808662347,
    3926825029,
    4044981591,
    4162096729,
    3342319475,
    3459953789,
    3576539503,
    3693126241,
    1986918061,
    2137062819,
    1685577905,
    1836772287,
    1381620373,
    1532285339,
    1078185097,
    1229899655,
    1040559837,
    923313619,
    740276417,
    621982671,
    439452389,
    322734571,
    137073913,
    19308535,
    3871163981,
    4021308739,
    4104605777,
    4255800159,
    3263785589,
    3414450555,
    3499326569,
    3651041127,
    2933202493,
    2815956275,
    3167684641,
    3049390895,
    2330014213,
    2213296395,
    2566595609,
    2448830231,
    1305906550,
    1155237496,
    1607244650,
    1455525988,
    1776460110,
    1626319424,
    2079897426,
    1928707164,
    96392454,
    213114376,
    396673818,
    514443284,
    562755902,
    679998e3,
    865136418,
    983426092,
    3708173718,
    3557504664,
    3474729866,
    3323011204,
    4180808110,
    4030667424,
    3945269170,
    3794078908,
    2507040230,
    2623762152,
    2272556026,
    2390325492,
    2975484382,
    3092726480,
    2738905026,
    2857194700,
    3973773121,
    3856137295,
    4274053469,
    4157467219,
    3371096953,
    3252932727,
    3673476453,
    3556361835,
    2763173681,
    2915017791,
    3064510765,
    3215307299,
    2156299017,
    2307622919,
    2459735317,
    2610011675,
    2081048481,
    1963412655,
    1846563261,
    1729977011,
    1480485785,
    1362321559,
    1243905413,
    1126790795,
    878845905,
    1030690015,
    645401037,
    796197571,
    274084841,
    425408743,
    38544885,
    188821243,
    3613494426,
    3731654548,
    3313212038,
    3430322568,
    4082475170,
    4200115116,
    3780097726,
    3896688048,
    2668221674,
    2516901860,
    2366882550,
    2216610296,
    3141400786,
    2989552604,
    2837966542,
    2687165888,
    1202797690,
    1320957812,
    1437280870,
    1554391400,
    1669664834,
    1787304780,
    1906247262,
    2022837584,
    265905162,
    114585348,
    499347990,
    349075736,
    736970802,
    585122620,
    972512814,
    821712160,
    2595684844,
    2478443234,
    2293045232,
    2174754046,
    3196267988,
    3079546586,
    2895723464,
    2777952454,
    3537852828,
    3687994002,
    3234156416,
    3385345166,
    4142626212,
    4293295786,
    3841024952,
    3992742070,
    174567692,
    57326082,
    410887952,
    292596766,
    777231668,
    660510266,
    1011452712,
    893681702,
    1108339068,
    1258480242,
    1343618912,
    1494807662,
    1715193156,
    1865862730,
    1948373848,
    2100090966,
    2701949495,
    2818666809,
    3004591147,
    3122358053,
    2235061775,
    2352307457,
    2535604243,
    2653899549,
    3915653703,
    3764988233,
    4219352155,
    4067639125,
    3444575871,
    3294430577,
    3746175075,
    3594982253,
    836553431,
    953270745,
    600235211,
    718002117,
    367585007,
    484830689,
    133361907,
    251657213,
    2041877159,
    1891211689,
    1806599355,
    1654886325,
    1568718495,
    1418573201,
    1335535747,
    1184342925
];
function convertToInt32(bytes) {
    const result = [];
    for(let i = 0; i < bytes.length; i += 4){
        result.push(bytes[i] << 24 | bytes[i + 1] << 16 | bytes[i + 2] << 8 | bytes[i + 3]);
    }
    return result;
}
class AES {
    get key() {
        return __classPrivateFieldGet$2(this, _AES_key, "f").slice();
    }
    constructor(key){
        _AES_key.set(this, void 0);
        _AES_Kd.set(this, void 0);
        _AES_Ke.set(this, void 0);
        if (!(this instanceof AES)) {
            throw Error("AES must be instanitated with `new`");
        }
        __classPrivateFieldSet$2(this, _AES_key, new Uint8Array(key), "f");
        const rounds = numberOfRounds[this.key.length];
        if (rounds == null) {
            throw new TypeError("invalid key size (must be 16, 24 or 32 bytes)");
        }
        __classPrivateFieldSet$2(this, _AES_Ke, [], "f");
        __classPrivateFieldSet$2(this, _AES_Kd, [], "f");
        for(let i = 0; i <= rounds; i++){
            __classPrivateFieldGet$2(this, _AES_Ke, "f").push([
                0,
                0,
                0,
                0
            ]);
            __classPrivateFieldGet$2(this, _AES_Kd, "f").push([
                0,
                0,
                0,
                0
            ]);
        }
        const roundKeyCount = (rounds + 1) * 4;
        const KC = this.key.length / 4;
        const tk = convertToInt32(this.key);
        let index;
        for(let i1 = 0; i1 < KC; i1++){
            index = i1 >> 2;
            __classPrivateFieldGet$2(this, _AES_Ke, "f")[index][i1 % 4] = tk[i1];
            __classPrivateFieldGet$2(this, _AES_Kd, "f")[rounds - index][i1 % 4] = tk[i1];
        }
        let rconpointer = 0;
        let t = KC, tt;
        while(t < roundKeyCount){
            tt = tk[KC - 1];
            tk[0] ^= S[tt >> 16 & 255] << 24 ^ S[tt >> 8 & 255] << 16 ^ S[tt & 255] << 8 ^ S[tt >> 24 & 255] ^ rcon[rconpointer] << 24;
            rconpointer += 1;
            if (KC != 8) {
                for(let i2 = 1; i2 < KC; i2++){
                    tk[i2] ^= tk[i2 - 1];
                }
            } else {
                for(let i3 = 1; i3 < KC / 2; i3++){
                    tk[i3] ^= tk[i3 - 1];
                }
                tt = tk[KC / 2 - 1];
                tk[KC / 2] ^= S[tt & 255] ^ S[tt >> 8 & 255] << 8 ^ S[tt >> 16 & 255] << 16 ^ S[tt >> 24 & 255] << 24;
                for(let i4 = KC / 2 + 1; i4 < KC; i4++){
                    tk[i4] ^= tk[i4 - 1];
                }
            }
            let i5 = 0, r, c;
            while(i5 < KC && t < roundKeyCount){
                r = t >> 2;
                c = t % 4;
                __classPrivateFieldGet$2(this, _AES_Ke, "f")[r][c] = tk[i5];
                __classPrivateFieldGet$2(this, _AES_Kd, "f")[rounds - r][c] = tk[i5++];
                t++;
            }
        }
        for(let r1 = 1; r1 < rounds; r1++){
            for(let c1 = 0; c1 < 4; c1++){
                tt = __classPrivateFieldGet$2(this, _AES_Kd, "f")[r1][c1];
                __classPrivateFieldGet$2(this, _AES_Kd, "f")[r1][c1] = U1[tt >> 24 & 255] ^ U2[tt >> 16 & 255] ^ U3[tt >> 8 & 255] ^ U4[tt & 255];
            }
        }
    }
    encrypt(plaintext) {
        if (plaintext.length != 16) {
            throw new TypeError("invalid plaintext size (must be 16 bytes)");
        }
        const rounds = __classPrivateFieldGet$2(this, _AES_Ke, "f").length - 1;
        const a = [
            0,
            0,
            0,
            0
        ];
        let t = convertToInt32(plaintext);
        for(let i = 0; i < 4; i++){
            t[i] ^= __classPrivateFieldGet$2(this, _AES_Ke, "f")[0][i];
        }
        for(let r = 1; r < rounds; r++){
            for(let i1 = 0; i1 < 4; i1++){
                a[i1] = T1[t[i1] >> 24 & 255] ^ T2[t[(i1 + 1) % 4] >> 16 & 255] ^ T3[t[(i1 + 2) % 4] >> 8 & 255] ^ T4[t[(i1 + 3) % 4] & 255] ^ __classPrivateFieldGet$2(this, _AES_Ke, "f")[r][i1];
            }
            t = a.slice();
        }
        const result = new Uint8Array(16);
        let tt = 0;
        for(let i2 = 0; i2 < 4; i2++){
            tt = __classPrivateFieldGet$2(this, _AES_Ke, "f")[rounds][i2];
            result[4 * i2] = (S[t[i2] >> 24 & 255] ^ tt >> 24) & 255;
            result[4 * i2 + 1] = (S[t[(i2 + 1) % 4] >> 16 & 255] ^ tt >> 16) & 255;
            result[4 * i2 + 2] = (S[t[(i2 + 2) % 4] >> 8 & 255] ^ tt >> 8) & 255;
            result[4 * i2 + 3] = (S[t[(i2 + 3) % 4] & 255] ^ tt) & 255;
        }
        return result;
    }
    decrypt(ciphertext) {
        if (ciphertext.length != 16) {
            throw new TypeError("invalid ciphertext size (must be 16 bytes)");
        }
        const rounds = __classPrivateFieldGet$2(this, _AES_Kd, "f").length - 1;
        const a = [
            0,
            0,
            0,
            0
        ];
        let t = convertToInt32(ciphertext);
        for(let i = 0; i < 4; i++){
            t[i] ^= __classPrivateFieldGet$2(this, _AES_Kd, "f")[0][i];
        }
        for(let r = 1; r < rounds; r++){
            for(let i1 = 0; i1 < 4; i1++){
                a[i1] = T5[t[i1] >> 24 & 255] ^ T6[t[(i1 + 3) % 4] >> 16 & 255] ^ T7[t[(i1 + 2) % 4] >> 8 & 255] ^ T8[t[(i1 + 1) % 4] & 255] ^ __classPrivateFieldGet$2(this, _AES_Kd, "f")[r][i1];
            }
            t = a.slice();
        }
        const result = new Uint8Array(16);
        let tt = 0;
        for(let i2 = 0; i2 < 4; i2++){
            tt = __classPrivateFieldGet$2(this, _AES_Kd, "f")[rounds][i2];
            result[4 * i2] = (Si[t[i2] >> 24 & 255] ^ tt >> 24) & 255;
            result[4 * i2 + 1] = (Si[t[(i2 + 3) % 4] >> 16 & 255] ^ tt >> 16) & 255;
            result[4 * i2 + 2] = (Si[t[(i2 + 2) % 4] >> 8 & 255] ^ tt >> 8) & 255;
            result[4 * i2 + 3] = (Si[t[(i2 + 1) % 4] & 255] ^ tt) & 255;
        }
        return result;
    }
}
_AES_key = new WeakMap, _AES_Kd = new WeakMap, _AES_Ke = new WeakMap;
class ModeOfOperation {
    constructor(name, key, cls){
        if (cls && !(this instanceof cls)) {
            throw new Error(`${name} must be instantiated with "new"`);
        }
        Object.defineProperties(this, {
            aes: {
                enumerable: true,
                value: new AES(key)
            },
            name: {
                enumerable: true,
                value: name
            }
        });
    }
}
var __classPrivateFieldSet$1 = __$G && __$G.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet$1 = __$G && __$G.__classPrivateFieldGet || function(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CBC_iv, _CBC_lastBlock;
class CBC extends ModeOfOperation {
    constructor(key, iv){
        super("ECC", key, CBC);
        _CBC_iv.set(this, void 0);
        _CBC_lastBlock.set(this, void 0);
        if (iv) {
            if (iv.length % 16) {
                throw new TypeError("invalid iv size (must be 16 bytes)");
            }
            __classPrivateFieldSet$1(this, _CBC_iv, new Uint8Array(iv), "f");
        } else {
            __classPrivateFieldSet$1(this, _CBC_iv, new Uint8Array(16), "f");
        }
        __classPrivateFieldSet$1(this, _CBC_lastBlock, this.iv, "f");
    }
    get iv() {
        return new Uint8Array(__classPrivateFieldGet$1(this, _CBC_iv, "f"));
    }
    encrypt(plaintext) {
        if (plaintext.length % 16) {
            throw new TypeError("invalid plaintext size (must be multiple of 16 bytes)");
        }
        const ciphertext = new Uint8Array(plaintext.length);
        for(let i = 0; i < plaintext.length; i += 16){
            for(let j = 0; j < 16; j++){
                __classPrivateFieldGet$1(this, _CBC_lastBlock, "f")[j] ^= plaintext[i + j];
            }
            __classPrivateFieldSet$1(this, _CBC_lastBlock, this.aes.encrypt(__classPrivateFieldGet$1(this, _CBC_lastBlock, "f")), "f");
            ciphertext.set(__classPrivateFieldGet$1(this, _CBC_lastBlock, "f"), i);
        }
        return ciphertext;
    }
    decrypt(ciphertext) {
        if (ciphertext.length % 16) {
            throw new TypeError("invalid ciphertext size (must be multiple of 16 bytes)");
        }
        const plaintext = new Uint8Array(ciphertext.length);
        for(let i = 0; i < ciphertext.length; i += 16){
            const block = this.aes.decrypt(ciphertext.subarray(i, i + 16));
            for(let j = 0; j < 16; j++){
                plaintext[i + j] = block[j] ^ __classPrivateFieldGet$1(this, _CBC_lastBlock, "f")[j];
                __classPrivateFieldGet$1(this, _CBC_lastBlock, "f")[j] = ciphertext[i + j];
            }
        }
        return plaintext;
    }
}
_CBC_iv = new WeakMap, _CBC_lastBlock = new WeakMap;
var __classPrivateFieldSet = __$G && __$G.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet = __$G && __$G.__classPrivateFieldGet || function(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CTR_remaining, _CTR_remainingIndex, _CTR_counter;
class CTR extends ModeOfOperation {
    constructor(key, initialValue){
        super("CTR", key, CTR);
        _CTR_remaining.set(this, void 0);
        _CTR_remainingIndex.set(this, void 0);
        _CTR_counter.set(this, void 0);
        __classPrivateFieldSet(this, _CTR_counter, new Uint8Array(16), "f");
        __classPrivateFieldGet(this, _CTR_counter, "f").fill(0);
        __classPrivateFieldSet(this, _CTR_remaining, __classPrivateFieldGet(this, _CTR_counter, "f"), "f");
        __classPrivateFieldSet(this, _CTR_remainingIndex, 16, "f");
        if (initialValue == null) {
            initialValue = 1;
        }
        if (typeof initialValue === "number") {
            this.setCounterValue(initialValue);
        } else {
            this.setCounterBytes(initialValue);
        }
    }
    get counter() {
        return new Uint8Array(__classPrivateFieldGet(this, _CTR_counter, "f"));
    }
    setCounterValue(value) {
        if (!Number.isInteger(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
            throw new TypeError("invalid counter initial integer value");
        }
        for(let index = 15; index >= 0; --index){
            __classPrivateFieldGet(this, _CTR_counter, "f")[index] = value % 256;
            value = Math.floor(value / 256);
        }
    }
    setCounterBytes(value) {
        if (value.length !== 16) {
            throw new TypeError("invalid counter initial Uint8Array value length");
        }
        __classPrivateFieldGet(this, _CTR_counter, "f").set(value);
    }
    increment() {
        for(let i = 15; i >= 0; i--){
            if (__classPrivateFieldGet(this, _CTR_counter, "f")[i] === 255) {
                __classPrivateFieldGet(this, _CTR_counter, "f")[i] = 0;
            } else {
                __classPrivateFieldGet(this, _CTR_counter, "f")[i]++;
                break;
            }
        }
    }
    encrypt(plaintext) {
        var _a, _b;
        const crypttext = new Uint8Array(plaintext);
        for(let i = 0; i < crypttext.length; i++){
            if (__classPrivateFieldGet(this, _CTR_remainingIndex, "f") === 16) {
                __classPrivateFieldSet(this, _CTR_remaining, this.aes.encrypt(__classPrivateFieldGet(this, _CTR_counter, "f")), "f");
                __classPrivateFieldSet(this, _CTR_remainingIndex, 0, "f");
                this.increment();
            }
            crypttext[i] ^= __classPrivateFieldGet(this, _CTR_remaining, "f")[__classPrivateFieldSet(this, _CTR_remainingIndex, (_b = __classPrivateFieldGet(this, _CTR_remainingIndex, "f"), _a = _b++, _b), "f"), _a];
        }
        return crypttext;
    }
    decrypt(ciphertext) {
        return this.encrypt(ciphertext);
    }
}
_CTR_remaining = new WeakMap, _CTR_remainingIndex = new WeakMap, _CTR_counter = new WeakMap;
function pkcs7Strip(data) {
    if (data.length < 16) {
        throw new TypeError("PKCS#7 invalid length");
    }
    const padder = data[data.length - 1];
    if (padder > 16) {
        throw new TypeError("PKCS#7 padding byte out of range");
    }
    const length = data.length - padder;
    for(let i = 0; i < padder; i++){
        if (data[length + i] !== padder) {
            throw new TypeError("PKCS#7 invalid padding byte");
        }
    }
    return new Uint8Array(data.subarray(0, length));
}
function looseArrayify(hexString) {
    if (typeof hexString === "string" && !hexString.startsWith("0x")) {
        hexString = "0x" + hexString;
    }
    return getBytesCopy(hexString);
}
function zpad$1(value, length) {
    value = String(value);
    while(value.length < length){
        value = "0" + value;
    }
    return value;
}
function getPassword(password) {
    if (typeof password === "string") {
        return toUtf8Bytes(password, "NFKC");
    }
    return getBytesCopy(password);
}
function spelunk(object, _path) {
    const match = _path.match(/^([a-z0-9$_.-]*)(:([a-z]+))?(!)?$/i);
    assertArgument(match != null, "invalid path", "path", _path);
    const path = match[1];
    const type = match[3];
    const reqd = match[4] === "!";
    let cur = object;
    for (const comp of path.toLowerCase().split(".")){
        if (Array.isArray(cur)) {
            if (!comp.match(/^[0-9]+$/)) {
                break;
            }
            cur = cur[parseInt(comp)];
        } else if (typeof cur === "object") {
            let found = null;
            for(const key in cur){
                if (key.toLowerCase() === comp) {
                    found = cur[key];
                    break;
                }
            }
            cur = found;
        } else {
            cur = null;
        }
        if (cur == null) {
            break;
        }
    }
    assertArgument(!reqd || cur != null, "missing required value", "path", path);
    if (type && cur != null) {
        if (type === "int") {
            if (typeof cur === "string" && cur.match(/^-?[0-9]+$/)) {
                return parseInt(cur);
            } else if (Number.isSafeInteger(cur)) {
                return cur;
            }
        }
        if (type === "number") {
            if (typeof cur === "string" && cur.match(/^-?[0-9.]*$/)) {
                return parseFloat(cur);
            }
        }
        if (type === "data") {
            if (typeof cur === "string") {
                return looseArrayify(cur);
            }
        }
        if (type === "array" && Array.isArray(cur)) {
            return cur;
        }
        if (type === typeof cur) {
            return cur;
        }
        assertArgument(false, `wrong type found for ${type} `, "path", path);
    }
    return cur;
}
const defaultPath$1 = "m/44'/60'/0'/0/0";
function isKeystoreJson(json) {
    try {
        const data = JSON.parse(json);
        const version = data.version != null ? parseInt(data.version) : 0;
        if (version === 3) {
            return true;
        }
    } catch (error) {}
    return false;
}
function decrypt(data, key, ciphertext) {
    const cipher = spelunk(data, "crypto.cipher:string");
    if (cipher === "aes-128-ctr") {
        const iv = spelunk(data, "crypto.cipherparams.iv:data!");
        const aesCtr = new CTR(key, iv);
        return hexlify(aesCtr.decrypt(ciphertext));
    }
    assert1(false, "unsupported cipher", "UNSUPPORTED_OPERATION", {
        operation: "decrypt"
    });
}
function getAccount(data, _key) {
    const key = getBytes(_key);
    const ciphertext = spelunk(data, "crypto.ciphertext:data!");
    const computedMAC = hexlify(keccak256(concat([
        key.slice(16, 32),
        ciphertext
    ]))).substring(2);
    assertArgument(computedMAC === spelunk(data, "crypto.mac:string!").toLowerCase(), "incorrect password", "password", "[ REDACTED ]");
    const privateKey = decrypt(data, key.slice(0, 16), ciphertext);
    const address = computeAddress(privateKey);
    if (data.address) {
        let check = data.address.toLowerCase();
        if (!check.startsWith("0x")) {
            check = "0x" + check;
        }
        assertArgument(getAddress(check) === address, "keystore address/privateKey mismatch", "address", data.address);
    }
    const account = {
        address: address,
        privateKey: privateKey
    };
    const version = spelunk(data, "x-ethers.version:string");
    if (version === "0.1") {
        const mnemonicKey = key.slice(32, 64);
        const mnemonicCiphertext = spelunk(data, "x-ethers.mnemonicCiphertext:data!");
        const mnemonicIv = spelunk(data, "x-ethers.mnemonicCounter:data!");
        const mnemonicAesCtr = new CTR(mnemonicKey, mnemonicIv);
        account.mnemonic = {
            path: spelunk(data, "x-ethers.path:string") || defaultPath$1,
            locale: spelunk(data, "x-ethers.locale:string") || "en",
            entropy: hexlify(getBytes(mnemonicAesCtr.decrypt(mnemonicCiphertext)))
        };
    }
    return account;
}
function getDecryptKdfParams(data) {
    const kdf = spelunk(data, "crypto.kdf:string");
    if (kdf && typeof kdf === "string") {
        if (kdf.toLowerCase() === "scrypt") {
            const salt = spelunk(data, "crypto.kdfparams.salt:data!");
            const N = spelunk(data, "crypto.kdfparams.n:int!");
            const r = spelunk(data, "crypto.kdfparams.r:int!");
            const p = spelunk(data, "crypto.kdfparams.p:int!");
            assertArgument(N > 0 && (N & N - 1) === 0, "invalid kdf.N", "kdf.N", N);
            assertArgument(r > 0 && p > 0, "invalid kdf", "kdf", kdf);
            const dkLen = spelunk(data, "crypto.kdfparams.dklen:int!");
            assertArgument(dkLen === 32, "invalid kdf.dklen", "kdf.dflen", dkLen);
            return {
                name: "scrypt",
                salt: salt,
                N: N,
                r: r,
                p: p,
                dkLen: 64
            };
        } else if (kdf.toLowerCase() === "pbkdf2") {
            const salt1 = spelunk(data, "crypto.kdfparams.salt:data!");
            const prf = spelunk(data, "crypto.kdfparams.prf:string!");
            const algorithm = prf.split("-").pop();
            assertArgument(algorithm === "sha256" || algorithm === "sha512", "invalid kdf.pdf", "kdf.pdf", prf);
            const count = spelunk(data, "crypto.kdfparams.c:int!");
            const dkLen1 = spelunk(data, "crypto.kdfparams.dklen:int!");
            assertArgument(dkLen1 === 32, "invalid kdf.dklen", "kdf.dklen", dkLen1);
            return {
                name: "pbkdf2",
                salt: salt1,
                count: count,
                dkLen: dkLen1,
                algorithm: algorithm
            };
        }
    }
    assertArgument(false, "unsupported key-derivation function", "kdf", kdf);
}
function decryptKeystoreJsonSync(json, _password) {
    const data = JSON.parse(json);
    const password = getPassword(_password);
    const params = getDecryptKdfParams(data);
    if (params.name === "pbkdf2") {
        const { salt , count , dkLen , algorithm  } = params;
        const key = pbkdf2(password, salt, count, dkLen, algorithm);
        return getAccount(data, key);
    }
    assert1(params.name === "scrypt", "cannot be reached", "UNKNOWN_ERROR", {
        params: params
    });
    const { salt: salt1 , N , r , p , dkLen: dkLen1  } = params;
    const key1 = scryptSync(password, salt1, N, r, p, dkLen1);
    return getAccount(data, key1);
}
function stall$1(duration) {
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve();
        }, duration);
    });
}
async function decryptKeystoreJson(json, _password, progress) {
    const data = JSON.parse(json);
    const password = getPassword(_password);
    const params = getDecryptKdfParams(data);
    if (params.name === "pbkdf2") {
        if (progress) {
            progress(0);
            await stall$1(0);
        }
        const { salt , count , dkLen , algorithm  } = params;
        const key = pbkdf2(password, salt, count, dkLen, algorithm);
        if (progress) {
            progress(1);
            await stall$1(0);
        }
        return getAccount(data, key);
    }
    assert1(params.name === "scrypt", "cannot be reached", "UNKNOWN_ERROR", {
        params: params
    });
    const { salt: salt1 , N , r , p , dkLen: dkLen1  } = params;
    const key1 = await scrypt(password, salt1, N, r, p, dkLen1, progress);
    return getAccount(data, key1);
}
function getEncryptKdfParams(options) {
    const salt = options.salt != null ? getBytes(options.salt, "options.salt") : randomBytes(32);
    let N = 1 << 17, r = 8, p = 1;
    if (options.scrypt) {
        if (options.scrypt.N) {
            N = options.scrypt.N;
        }
        if (options.scrypt.r) {
            r = options.scrypt.r;
        }
        if (options.scrypt.p) {
            p = options.scrypt.p;
        }
    }
    assertArgument(typeof N === "number" && N > 0 && Number.isSafeInteger(N) && (BigInt(N) & BigInt(N - 1)) === BigInt(0), "invalid scrypt N parameter", "options.N", N);
    assertArgument(typeof r === "number" && r > 0 && Number.isSafeInteger(r), "invalid scrypt r parameter", "options.r", r);
    assertArgument(typeof p === "number" && p > 0 && Number.isSafeInteger(p), "invalid scrypt p parameter", "options.p", p);
    return {
        name: "scrypt",
        dkLen: 32,
        salt: salt,
        N: N,
        r: r,
        p: p
    };
}
function _encryptKeystore(key, kdf, account, options) {
    const privateKey = getBytes(account.privateKey, "privateKey");
    const iv = options.iv != null ? getBytes(options.iv, "options.iv") : randomBytes(16);
    assertArgument(iv.length === 16, "invalid options.iv length", "options.iv", options.iv);
    const uuidRandom = options.uuid != null ? getBytes(options.uuid, "options.uuid") : randomBytes(16);
    assertArgument(uuidRandom.length === 16, "invalid options.uuid length", "options.uuid", options.iv);
    const derivedKey = key.slice(0, 16);
    const macPrefix = key.slice(16, 32);
    const aesCtr = new CTR(derivedKey, iv);
    const ciphertext = getBytes(aesCtr.encrypt(privateKey));
    const mac = keccak256(concat([
        macPrefix,
        ciphertext
    ]));
    const data = {
        address: account.address.substring(2).toLowerCase(),
        id: uuidV4(uuidRandom),
        version: 3,
        Crypto: {
            cipher: "aes-128-ctr",
            cipherparams: {
                iv: hexlify(iv).substring(2)
            },
            ciphertext: hexlify(ciphertext).substring(2),
            kdf: "scrypt",
            kdfparams: {
                salt: hexlify(kdf.salt).substring(2),
                n: kdf.N,
                dklen: 32,
                p: kdf.p,
                r: kdf.r
            },
            mac: mac.substring(2)
        }
    };
    if (account.mnemonic) {
        const client = options.client != null ? options.client : `ethers/${version}`;
        const path = account.mnemonic.path || defaultPath$1;
        const locale = account.mnemonic.locale || "en";
        const mnemonicKey = key.slice(32, 64);
        const entropy = getBytes(account.mnemonic.entropy, "account.mnemonic.entropy");
        const mnemonicIv = randomBytes(16);
        const mnemonicAesCtr = new CTR(mnemonicKey, mnemonicIv);
        const mnemonicCiphertext = getBytes(mnemonicAesCtr.encrypt(entropy));
        const now = new Date;
        const timestamp = now.getUTCFullYear() + "-" + zpad$1(now.getUTCMonth() + 1, 2) + "-" + zpad$1(now.getUTCDate(), 2) + "T" + zpad$1(now.getUTCHours(), 2) + "-" + zpad$1(now.getUTCMinutes(), 2) + "-" + zpad$1(now.getUTCSeconds(), 2) + ".0Z";
        const gethFilename = "UTC--" + timestamp + "--" + data.address;
        data["x-ethers"] = {
            client: client,
            gethFilename: gethFilename,
            path: path,
            locale: locale,
            mnemonicCounter: hexlify(mnemonicIv).substring(2),
            mnemonicCiphertext: hexlify(mnemonicCiphertext).substring(2),
            version: "0.1"
        };
    }
    return JSON.stringify(data);
}
function encryptKeystoreJsonSync(account, password, options) {
    if (options == null) {
        options = {};
    }
    const passwordBytes = getPassword(password);
    const kdf = getEncryptKdfParams(options);
    const key = scryptSync(passwordBytes, kdf.salt, kdf.N, kdf.r, kdf.p, 64);
    return _encryptKeystore(getBytes(key), kdf, account, options);
}
async function encryptKeystoreJson(account, password, options) {
    if (options == null) {
        options = {};
    }
    const passwordBytes = getPassword(password);
    const kdf = getEncryptKdfParams(options);
    const key = await scrypt(passwordBytes, kdf.salt, kdf.N, kdf.r, kdf.p, 64, options.progressCallback);
    return _encryptKeystore(getBytes(key), kdf, account, options);
}
const defaultPath = "m/44'/60'/0'/0/0";
const MasterSecret = new Uint8Array([
    66,
    105,
    116,
    99,
    111,
    105,
    110,
    32,
    115,
    101,
    101,
    100
]);
const HardenedBit = 2147483648;
const N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
const Nibbles = "0123456789abcdef";
function zpad(value, length) {
    let result = "";
    while(value){
        result = Nibbles[value % 16] + result;
        value = Math.trunc(value / 16);
    }
    while(result.length < length * 2){
        result = "0" + result;
    }
    return "0x" + result;
}
function encodeBase58Check(_value) {
    const value = getBytes(_value);
    const check = dataSlice(sha256(sha256(value)), 0, 4);
    const bytes = concat([
        value,
        check
    ]);
    return encodeBase58(bytes);
}
const _guard = {};
function ser_I(index, chainCode, publicKey, privateKey) {
    const data = new Uint8Array(37);
    if (index & 2147483648) {
        assert1(privateKey != null, "cannot derive child of neutered node", "UNSUPPORTED_OPERATION", {
            operation: "deriveChild"
        });
        data.set(getBytes(privateKey), 1);
    } else {
        data.set(getBytes(publicKey));
    }
    for(let i = 24; i >= 0; i -= 8){
        data[33 + (i >> 3)] = index >> 24 - i & 255;
    }
    const I = getBytes(computeHmac("sha512", chainCode, data));
    return {
        IL: I.slice(0, 32),
        IR: I.slice(32)
    };
}
function derivePath(node, path) {
    const components = path.split("/");
    assertArgument(components.length > 0, "invalid path", "path", path);
    if (components[0] === "m") {
        assertArgument(node.depth === 0, `cannot derive root path (i.e. path starting with "m/") for a node at non-zero depth ${node.depth}`, "path", path);
        components.shift();
    }
    let result = node;
    for(let i = 0; i < components.length; i++){
        const component = components[i];
        if (component.match(/^[0-9]+'$/)) {
            const index = parseInt(component.substring(0, component.length - 1));
            assertArgument(index < 2147483648, "invalid path index", `path[${i}]`, component);
            result = result.deriveChild(HardenedBit + index);
        } else if (component.match(/^[0-9]+$/)) {
            const index1 = parseInt(component);
            assertArgument(index1 < 2147483648, "invalid path index", `path[${i}]`, component);
            result = result.deriveChild(index1);
        } else {
            assertArgument(false, "invalid path component", `path[${i}]`, component);
        }
    }
    return result;
}
class HDNodeWallet extends BaseWallet {
    publicKey;
    fingerprint;
    parentFingerprint;
    mnemonic;
    chainCode;
    path;
    index;
    depth;
    constructor(guard, signingKey, parentFingerprint, chainCode, path, index, depth, mnemonic, provider){
        super(signingKey, provider);
        assertPrivate(guard, _guard, "HDNodeWallet");
        defineProperties(this, {
            publicKey: signingKey.compressedPublicKey
        });
        const fingerprint = dataSlice(ripemd160(sha256(this.publicKey)), 0, 4);
        defineProperties(this, {
            parentFingerprint: parentFingerprint,
            fingerprint: fingerprint,
            chainCode: chainCode,
            path: path,
            index: index,
            depth: depth
        });
        defineProperties(this, {
            mnemonic: mnemonic
        });
    }
    connect(provider) {
        return new HDNodeWallet(_guard, this.signingKey, this.parentFingerprint, this.chainCode, this.path, this.index, this.depth, this.mnemonic, provider);
    }
    #account() {
        const account = {
            address: this.address,
            privateKey: this.privateKey
        };
        const m = this.mnemonic;
        if (this.path && m && m.wordlist.locale === "en" && m.password === "") {
            account.mnemonic = {
                path: this.path,
                locale: "en",
                entropy: m.entropy
            };
        }
        return account;
    }
    async encrypt(password, progressCallback) {
        return await encryptKeystoreJson(this.#account(), password, {
            progressCallback: progressCallback
        });
    }
    encryptSync(password) {
        return encryptKeystoreJsonSync(this.#account(), password);
    }
    get extendedKey() {
        assert1(this.depth < 256, "Depth too deep", "UNSUPPORTED_OPERATION", {
            operation: "extendedKey"
        });
        return encodeBase58Check(concat([
            "0x0488ADE4",
            zpad(this.depth, 1),
            this.parentFingerprint,
            zpad(this.index, 4),
            this.chainCode,
            concat([
                "0x00",
                this.privateKey
            ])
        ]));
    }
    hasPath() {
        return this.path != null;
    }
    neuter() {
        return new HDNodeVoidWallet(_guard, this.address, this.publicKey, this.parentFingerprint, this.chainCode, this.path, this.index, this.depth, this.provider);
    }
    deriveChild(_index) {
        const index = getNumber(_index, "index");
        assertArgument(index <= 4294967295, "invalid index", "index", index);
        let path = this.path;
        if (path) {
            path += "/" + (index & ~HardenedBit);
            if (index & 2147483648) {
                path += "'";
            }
        }
        const { IR , IL  } = ser_I(index, this.chainCode, this.publicKey, this.privateKey);
        const ki = new SigningKey(toBeHex((toBigInt(IL) + BigInt(this.privateKey)) % N, 32));
        return new HDNodeWallet(_guard, ki, this.fingerprint, hexlify(IR), path, index, this.depth + 1, this.mnemonic, this.provider);
    }
    derivePath(path) {
        return derivePath(this, path);
    }
    static #fromSeed(_seed, mnemonic) {
        assertArgument(isBytesLike(_seed), "invalid seed", "seed", "[REDACTED]");
        const seed = getBytes(_seed, "seed");
        assertArgument(seed.length >= 16 && seed.length <= 64, "invalid seed", "seed", "[REDACTED]");
        const I = getBytes(computeHmac("sha512", MasterSecret, seed));
        const signingKey = new SigningKey(hexlify(I.slice(0, 32)));
        return new HDNodeWallet(_guard, signingKey, "0x00000000", hexlify(I.slice(32)), "m", 0, 0, mnemonic, null);
    }
    static fromExtendedKey(extendedKey) {
        const bytes = toBeArray(decodeBase58(extendedKey));
        assertArgument(bytes.length === 82 || encodeBase58Check(bytes.slice(0, 78)) === extendedKey, "invalid extended key", "extendedKey", "[ REDACTED ]");
        const depth = bytes[4];
        const parentFingerprint = hexlify(bytes.slice(5, 9));
        const index = parseInt(hexlify(bytes.slice(9, 13)).substring(2), 16);
        const chainCode = hexlify(bytes.slice(13, 45));
        const key = bytes.slice(45, 78);
        switch(hexlify(bytes.slice(0, 4))){
            case "0x0488b21e":
            case "0x043587cf":
                {
                    const publicKey = hexlify(key);
                    return new HDNodeVoidWallet(_guard, computeAddress(publicKey), publicKey, parentFingerprint, chainCode, null, index, depth, null);
                }
            case "0x0488ade4":
            case "0x04358394 ":
                if (key[0] !== 0) {
                    break;
                }
                return new HDNodeWallet(_guard, new SigningKey(key.slice(1)), parentFingerprint, chainCode, null, index, depth, null, null);
        }
        assertArgument(false, "invalid extended key prefix", "extendedKey", "[ REDACTED ]");
    }
    static createRandom(password, path, wordlist) {
        if (password == null) {
            password = "";
        }
        if (path == null) {
            path = defaultPath;
        }
        if (wordlist == null) {
            wordlist = LangEn.wordlist();
        }
        const mnemonic = Mnemonic.fromEntropy(randomBytes(16), password, wordlist);
        return HDNodeWallet.#fromSeed(mnemonic.computeSeed(), mnemonic).derivePath(path);
    }
    static fromMnemonic(mnemonic, path) {
        if (!path) {
            path = defaultPath;
        }
        return HDNodeWallet.#fromSeed(mnemonic.computeSeed(), mnemonic).derivePath(path);
    }
    static fromPhrase(phrase, password, path, wordlist) {
        if (password == null) {
            password = "";
        }
        if (path == null) {
            path = defaultPath;
        }
        if (wordlist == null) {
            wordlist = LangEn.wordlist();
        }
        const mnemonic = Mnemonic.fromPhrase(phrase, password, wordlist);
        return HDNodeWallet.#fromSeed(mnemonic.computeSeed(), mnemonic).derivePath(path);
    }
    static fromSeed(seed) {
        return HDNodeWallet.#fromSeed(seed, null);
    }
}
class HDNodeVoidWallet extends VoidSigner {
    publicKey;
    fingerprint;
    parentFingerprint;
    chainCode;
    path;
    index;
    depth;
    constructor(guard, address, publicKey, parentFingerprint, chainCode, path, index, depth, provider){
        super(address, provider);
        assertPrivate(guard, _guard, "HDNodeVoidWallet");
        defineProperties(this, {
            publicKey: publicKey
        });
        const fingerprint = dataSlice(ripemd160(sha256(publicKey)), 0, 4);
        defineProperties(this, {
            publicKey: publicKey,
            fingerprint: fingerprint,
            parentFingerprint: parentFingerprint,
            chainCode: chainCode,
            path: path,
            index: index,
            depth: depth
        });
    }
    connect(provider) {
        return new HDNodeVoidWallet(_guard, this.address, this.publicKey, this.parentFingerprint, this.chainCode, this.path, this.index, this.depth, provider);
    }
    get extendedKey() {
        assert1(this.depth < 256, "Depth too deep", "UNSUPPORTED_OPERATION", {
            operation: "extendedKey"
        });
        return encodeBase58Check(concat([
            "0x0488B21E",
            zpad(this.depth, 1),
            this.parentFingerprint,
            zpad(this.index, 4),
            this.chainCode,
            this.publicKey
        ]));
    }
    hasPath() {
        return this.path != null;
    }
    deriveChild(_index) {
        const index = getNumber(_index, "index");
        assertArgument(index <= 4294967295, "invalid index", "index", index);
        let path = this.path;
        if (path) {
            path += "/" + (index & ~HardenedBit);
            if (index & 2147483648) {
                path += "'";
            }
        }
        const { IR , IL  } = ser_I(index, this.chainCode, this.publicKey, null);
        const Ki = SigningKey.addPoints(IL, this.publicKey, true);
        const address = computeAddress(Ki);
        return new HDNodeVoidWallet(_guard, address, Ki, this.fingerprint, hexlify(IR), path, index, this.depth + 1, this.provider);
    }
    derivePath(path) {
        return derivePath(this, path);
    }
}
function getAccountPath(_index) {
    const index = getNumber(_index, "index");
    assertArgument(index >= 0 && index < 2147483648, "invalid account index", "index", index);
    return `m/44'/60'/${index}'/0/0`;
}
function getIndexedAccountPath(_index) {
    const index = getNumber(_index, "index");
    assertArgument(index >= 0 && index < 2147483648, "invalid account index", "index", index);
    return `m/44'/60'/0'/0/${index}`;
}
function isCrowdsaleJson(json) {
    try {
        const data = JSON.parse(json);
        if (data.encseed) {
            return true;
        }
    } catch (error) {}
    return false;
}
function decryptCrowdsaleJson(json, _password) {
    const data = JSON.parse(json);
    const password = getPassword(_password);
    const address = getAddress(spelunk(data, "ethaddr:string!"));
    const encseed = looseArrayify(spelunk(data, "encseed:string!"));
    assertArgument(encseed && encseed.length % 16 === 0, "invalid encseed", "json", json);
    const key = getBytes(pbkdf2(password, password, 2e3, 32, "sha256")).slice(0, 16);
    const iv = encseed.slice(0, 16);
    const encryptedSeed = encseed.slice(16);
    const aesCbc = new CBC(key, iv);
    const seed = pkcs7Strip(getBytes(aesCbc.decrypt(encryptedSeed)));
    let seedHex = "";
    for(let i = 0; i < seed.length; i++){
        seedHex += String.fromCharCode(seed[i]);
    }
    return {
        address: address,
        privateKey: id(seedHex)
    };
}
function stall(duration) {
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve();
        }, duration);
    });
}
class Wallet extends BaseWallet {
    constructor(key, provider){
        if (typeof key === "string" && !key.startsWith("0x")) {
            key = "0x" + key;
        }
        let signingKey = typeof key === "string" ? new SigningKey(key) : key;
        super(signingKey, provider);
    }
    connect(provider) {
        return new Wallet(this.signingKey, provider);
    }
    async encrypt(password, progressCallback) {
        const account = {
            address: this.address,
            privateKey: this.privateKey
        };
        return await encryptKeystoreJson(account, password, {
            progressCallback: progressCallback
        });
    }
    encryptSync(password) {
        const account = {
            address: this.address,
            privateKey: this.privateKey
        };
        return encryptKeystoreJsonSync(account, password);
    }
    static #fromAccount(account1) {
        assertArgument(account1, "invalid JSON wallet", "json", "[ REDACTED ]");
        if ("mnemonic" in account1 && account1.mnemonic && account1.mnemonic.locale === "en") {
            const mnemonic1 = Mnemonic.fromEntropy(account1.mnemonic.entropy);
            const wallet = HDNodeWallet.fromMnemonic(mnemonic1, account1.mnemonic.path);
            if (wallet.address === account1.address && wallet.privateKey === account1.privateKey) {
                return wallet;
            }
            console.log("WARNING: JSON mismatch address/privateKey != mnemonic; fallback onto private key");
        }
        const wallet1 = new Wallet(account1.privateKey);
        assertArgument(wallet1.address === account1.address, "address/privateKey mismatch", "json", "[ REDACTED ]");
        return wallet1;
    }
    static async fromEncryptedJson(json, password, progress) {
        let account = null;
        if (isKeystoreJson(json)) {
            account = await decryptKeystoreJson(json, password, progress);
        } else if (isCrowdsaleJson(json)) {
            if (progress) {
                progress(0);
                await stall(0);
            }
            account = decryptCrowdsaleJson(json, password);
            if (progress) {
                progress(1);
                await stall(0);
            }
        }
        return Wallet.#fromAccount(account);
    }
    static fromEncryptedJsonSync(json, password) {
        let account = null;
        if (isKeystoreJson(json)) {
            account = decryptKeystoreJsonSync(json, password);
        } else if (isCrowdsaleJson(json)) {
            account = decryptCrowdsaleJson(json, password);
        } else {
            assertArgument(false, "invalid JSON wallet", "json", "[ REDACTED ]");
        }
        return Wallet.#fromAccount(account);
    }
    static createRandom(provider) {
        const wallet = HDNodeWallet.createRandom();
        if (provider) {
            return wallet.connect(provider);
        }
        return wallet;
    }
    static fromPhrase(phrase, provider) {
        const wallet = HDNodeWallet.fromPhrase(phrase);
        if (provider) {
            return wallet.connect(provider);
        }
        return wallet;
    }
}
const Base64 = ")!@#$%^&*(ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
function decodeBits(width, data) {
    const maxValue = (1 << width) - 1;
    const result = [];
    let accum = 0, bits = 0, flood = 0;
    for(let i = 0; i < data.length; i++){
        accum = accum << 6 | Base64.indexOf(data[i]);
        bits += 6;
        while(bits >= width){
            const value = accum >> bits - width;
            accum &= (1 << bits - width) - 1;
            bits -= width;
            if (value === 0) {
                flood += maxValue;
            } else {
                result.push(value + flood);
                flood = 0;
            }
        }
    }
    return result;
}
function decodeOwlA(data, accents) {
    let words = decodeOwl(data).join(",");
    accents.split(/,/g).forEach((accent)=>{
        const match = accent.match(/^([a-z]*)([0-9]+)([0-9])(.*)$/);
        assertArgument(match !== null, "internal error parsing accents", "accents", accents);
        let posOffset = 0;
        const positions = decodeBits(parseInt(match[3]), match[4]);
        const charCode = parseInt(match[2]);
        const regex = new RegExp(`([${match[1]}])`, "g");
        words = words.replace(regex, (all, letter)=>{
            const rem = --positions[posOffset];
            if (rem === 0) {
                letter = String.fromCharCode(letter.charCodeAt(0), charCode);
                posOffset++;
            }
            return letter;
        });
    });
    return words.split(",");
}
class WordlistOwlA extends WordlistOwl {
    #accent;
    constructor(locale, data, accent, checksum){
        super(locale, data, checksum);
        this.#accent = accent;
    }
    get _accent() {
        return this.#accent;
    }
    _decodeWords() {
        return decodeOwlA(this._data, this._accent);
    }
}
const wordlists = {
    en: LangEn.wordlist()
};
var ethers = Object.freeze({
    __proto__: null,
    AbiCoder: AbiCoder,
    AbstractProvider: AbstractProvider,
    AbstractSigner: AbstractSigner,
    AlchemyProvider: AlchemyProvider,
    AnkrProvider: AnkrProvider,
    BaseContract: BaseContract,
    BaseWallet: BaseWallet,
    Block: Block,
    BrowserProvider: BrowserProvider,
    ChainstackProvider: ChainstackProvider,
    CloudflareProvider: CloudflareProvider,
    ConstructorFragment: ConstructorFragment,
    Contract: Contract,
    ContractEventPayload: ContractEventPayload,
    ContractFactory: ContractFactory,
    ContractTransactionReceipt: ContractTransactionReceipt,
    ContractTransactionResponse: ContractTransactionResponse,
    ContractUnknownEventPayload: ContractUnknownEventPayload,
    EnsPlugin: EnsPlugin,
    EnsResolver: EnsResolver,
    ErrorDescription: ErrorDescription,
    ErrorFragment: ErrorFragment,
    EtherSymbol: EtherSymbol,
    EtherscanPlugin: EtherscanPlugin,
    EtherscanProvider: EtherscanProvider,
    EventFragment: EventFragment,
    EventLog: EventLog,
    EventPayload: EventPayload,
    FallbackFragment: FallbackFragment,
    FallbackProvider: FallbackProvider,
    FeeData: FeeData,
    FeeDataNetworkPlugin: FeeDataNetworkPlugin,
    FetchCancelSignal: FetchCancelSignal,
    FetchRequest: FetchRequest,
    FetchResponse: FetchResponse,
    FetchUrlFeeDataNetworkPlugin: FetchUrlFeeDataNetworkPlugin,
    FixedNumber: FixedNumber,
    Fragment: Fragment,
    FunctionFragment: FunctionFragment,
    GasCostPlugin: GasCostPlugin,
    HDNodeVoidWallet: HDNodeVoidWallet,
    HDNodeWallet: HDNodeWallet,
    Indexed: Indexed,
    InfuraProvider: InfuraProvider,
    InfuraWebSocketProvider: InfuraWebSocketProvider,
    Interface: Interface,
    IpcSocketProvider: IpcSocketProvider,
    JsonRpcApiProvider: JsonRpcApiProvider,
    JsonRpcProvider: JsonRpcProvider,
    JsonRpcSigner: JsonRpcSigner,
    LangEn: LangEn,
    Log: Log,
    LogDescription: LogDescription,
    MaxInt256: MaxInt256,
    MaxUint256: MaxUint256,
    MessagePrefix: MessagePrefix,
    MinInt256: MinInt256,
    Mnemonic: Mnemonic,
    MulticoinProviderPlugin: MulticoinProviderPlugin,
    N: N$1,
    NamedFragment: NamedFragment,
    Network: Network,
    NetworkPlugin: NetworkPlugin,
    NonceManager: NonceManager,
    ParamType: ParamType,
    PocketProvider: PocketProvider,
    QuickNodeProvider: QuickNodeProvider,
    Result: Result,
    Signature: Signature,
    SigningKey: SigningKey,
    SocketBlockSubscriber: SocketBlockSubscriber,
    SocketEventSubscriber: SocketEventSubscriber,
    SocketPendingSubscriber: SocketPendingSubscriber,
    SocketProvider: SocketProvider,
    SocketSubscriber: SocketSubscriber,
    StructFragment: StructFragment,
    Transaction: Transaction,
    TransactionDescription: TransactionDescription,
    TransactionReceipt: TransactionReceipt,
    TransactionResponse: TransactionResponse,
    Typed: Typed,
    TypedDataEncoder: TypedDataEncoder,
    UndecodedEventLog: UndecodedEventLog,
    UnmanagedSubscriber: UnmanagedSubscriber,
    Utf8ErrorFuncs: Utf8ErrorFuncs,
    VoidSigner: VoidSigner,
    Wallet: Wallet,
    WebSocketProvider: WebSocketProvider,
    WeiPerEther: WeiPerEther,
    Wordlist: Wordlist,
    WordlistOwl: WordlistOwl,
    WordlistOwlA: WordlistOwlA,
    ZeroAddress: ZeroAddress,
    ZeroHash: ZeroHash,
    accessListify: accessListify,
    assert: assert1,
    assertArgument: assertArgument,
    assertArgumentCount: assertArgumentCount,
    assertNormalize: assertNormalize,
    assertPrivate: assertPrivate,
    checkResultErrors: checkResultErrors,
    computeAddress: computeAddress,
    computeHmac: computeHmac,
    concat: concat,
    copyRequest: copyRequest,
    dataLength: dataLength,
    dataSlice: dataSlice,
    decodeBase58: decodeBase58,
    decodeBase64: decodeBase64,
    decodeBytes32String: decodeBytes32String,
    decodeRlp: decodeRlp,
    decryptCrowdsaleJson: decryptCrowdsaleJson,
    decryptKeystoreJson: decryptKeystoreJson,
    decryptKeystoreJsonSync: decryptKeystoreJsonSync,
    defaultPath: defaultPath,
    defineProperties: defineProperties,
    dnsEncode: dnsEncode,
    encodeBase58: encodeBase58,
    encodeBase64: encodeBase64,
    encodeBytes32String: encodeBytes32String,
    encodeRlp: encodeRlp,
    encryptKeystoreJson: encryptKeystoreJson,
    encryptKeystoreJsonSync: encryptKeystoreJsonSync,
    ensNormalize: ensNormalize,
    formatEther: formatEther,
    formatUnits: formatUnits,
    fromTwos: fromTwos,
    getAccountPath: getAccountPath,
    getAddress: getAddress,
    getBigInt: getBigInt,
    getBytes: getBytes,
    getBytesCopy: getBytesCopy,
    getCreate2Address: getCreate2Address,
    getCreateAddress: getCreateAddress,
    getDefaultProvider: getDefaultProvider,
    getIcapAddress: getIcapAddress,
    getIndexedAccountPath: getIndexedAccountPath,
    getNumber: getNumber,
    getUint: getUint,
    hashMessage: hashMessage,
    hexlify: hexlify,
    id: id,
    isAddress: isAddress,
    isAddressable: isAddressable,
    isBytesLike: isBytesLike,
    isCallException: isCallException,
    isCrowdsaleJson: isCrowdsaleJson,
    isError: isError,
    isHexString: isHexString,
    isKeystoreJson: isKeystoreJson,
    isValidName: isValidName,
    keccak256: keccak256,
    lock: lock,
    makeError: makeError,
    mask: mask,
    namehash: namehash,
    parseEther: parseEther,
    parseUnits: parseUnits$1,
    pbkdf2: pbkdf2,
    randomBytes: randomBytes,
    recoverAddress: recoverAddress,
    resolveAddress: resolveAddress,
    resolveProperties: resolveProperties,
    ripemd160: ripemd160,
    scrypt: scrypt,
    scryptSync: scryptSync,
    sha256: sha256,
    sha512: sha512,
    showThrottleMessage: showThrottleMessage,
    solidityPacked: solidityPacked,
    solidityPackedKeccak256: solidityPackedKeccak256,
    solidityPackedSha256: solidityPackedSha256,
    stripZerosLeft: stripZerosLeft,
    toBeArray: toBeArray,
    toBeHex: toBeHex,
    toBigInt: toBigInt,
    toNumber: toNumber,
    toQuantity: toQuantity,
    toTwos: toTwos,
    toUtf8Bytes: toUtf8Bytes,
    toUtf8CodePoints: toUtf8CodePoints,
    toUtf8String: toUtf8String,
    uuidV4: uuidV4,
    verifyMessage: verifyMessage,
    verifyTypedData: verifyTypedData,
    version: version,
    wordlists: wordlists,
    zeroPadBytes: zeroPadBytes,
    zeroPadValue: zeroPadValue
});
var t1 = {};
function e(t, e) {
    "boolean" == typeof e && (e = {
        forever: e
    }), this._originalTimeouts = JSON.parse(JSON.stringify(t)), this._timeouts = t, this._options = e || {}, this._maxRetryTime = e && e.maxRetryTime || 1 / 0, this._fn = null, this._errors = [], this._attempts = 1, this._operationTimeout = null, this._operationTimeoutCb = null, this._timeout = null, this._operationStart = null, this._timer = null, this._options.forever && (this._cachedTimeouts = this._timeouts.slice(0));
}
var i8 = e;
e.prototype.reset = function() {
    this._attempts = 1, this._timeouts = this._originalTimeouts.slice(0);
}, e.prototype.stop = function() {
    this._timeout && clearTimeout(this._timeout), this._timer && clearTimeout(this._timer), this._timeouts = [], this._cachedTimeouts = null;
}, e.prototype.retry = function(t) {
    if (this._timeout && clearTimeout(this._timeout), !t) return !1;
    var e = (new Date).getTime();
    if (t && e - this._operationStart >= this._maxRetryTime) return this._errors.push(t), this._errors.unshift(new Error("RetryOperation timeout occurred")), !1;
    this._errors.push(t);
    var i = this._timeouts.shift();
    if (void 0 === i) {
        if (!this._cachedTimeouts) return !1;
        this._errors.splice(0, this._errors.length - 1), i = this._cachedTimeouts.slice(-1);
    }
    var r = this;
    return this._timer = setTimeout(function() {
        r._attempts++, r._operationTimeoutCb && (r._timeout = setTimeout(function() {
            r._operationTimeoutCb(r._attempts);
        }, r._operationTimeout), r._options.unref && r._timeout.unref()), r._fn(r._attempts);
    }, i), this._options.unref && this._timer.unref(), !0;
}, e.prototype.attempt = function(t, e) {
    this._fn = t, e && (e.timeout && (this._operationTimeout = e.timeout), e.cb && (this._operationTimeoutCb = e.cb));
    var i = this;
    this._operationTimeoutCb && (this._timeout = setTimeout(function() {
        i._operationTimeoutCb();
    }, i._operationTimeout)), this._operationStart = (new Date).getTime(), this._fn(this._attempts);
}, e.prototype.try = function(t) {
    console.log("Using RetryOperation.try() is deprecated"), this.attempt(t);
}, e.prototype.start = function(t) {
    console.log("Using RetryOperation.start() is deprecated"), this.attempt(t);
}, e.prototype.start = e.prototype.try, e.prototype.errors = function() {
    return this._errors;
}, e.prototype.attempts = function() {
    return this._attempts;
}, e.prototype.mainError = function() {
    if (0 === this._errors.length) return null;
    for(var t = {}, e = null, i = 0, r = 0; r < this._errors.length; r++){
        var o = this._errors[r], n = o.message, s = (t[n] || 0) + 1;
        t[n] = s, s >= i && (e = o, i = s);
    }
    return e;
}, function(t) {
    var e = i8;
    t.operation = function(i) {
        var r = t.timeouts(i);
        return new e(r, {
            forever: i && (i.forever || i.retries === 1 / 0),
            unref: i && i.unref,
            maxRetryTime: i && i.maxRetryTime
        });
    }, t.timeouts = function(t) {
        if (t instanceof Array) return [].concat(t);
        var e = {
            retries: 10,
            factor: 2,
            minTimeout: 1e3,
            maxTimeout: 1 / 0,
            randomize: !1
        };
        for(var i in t)e[i] = t[i];
        if (e.minTimeout > e.maxTimeout) throw new Error("minTimeout is greater than maxTimeout");
        for(var r = [], o = 0; o < e.retries; o++)r.push(this.createTimeout(o, e));
        return t && t.forever && !r.length && r.push(this.createTimeout(o, e)), r.sort(function(t, e) {
            return t - e;
        }), r;
    }, t.createTimeout = function(t, e) {
        var i = e.randomize ? Math.random() + 1 : 1, r = Math.round(i * Math.max(e.minTimeout, 1) * Math.pow(e.factor, t));
        return r = Math.min(r, e.maxTimeout);
    }, t.wrap = function(e, i, r) {
        if (i instanceof Array && (r = i, i = null), !r) for(var o in r = [], e)"function" == typeof e[o] && r.push(o);
        for(var n = 0; n < r.length; n++){
            var s = r[n], u = e[s];
            e[s] = (function(r) {
                var o = t.operation(i), n = Array.prototype.slice.call(arguments, 1), s = n.pop();
                n.push(function(t) {
                    o.retry(t) || (t && (arguments[0] = o.mainError()), s.apply(this, arguments));
                }), o.attempt(function() {
                    r.apply(e, n);
                });
            }).bind(e, u), e[s].options = i;
        }
    };
}(t1);
var r = t1, o4 = r.createTimeout, n1 = r.operation, s = r.timeouts, u = r.wrap;
const e1 = Object.prototype.toString, t2 = new Set([
    "network error",
    "Failed to fetch",
    "NetworkError when attempting to fetch resource.",
    "The Internet connection appears to be offline.",
    "Load failed",
    "Network request failed",
    "fetch failed",
    "terminated"
]);
function r1(r) {
    var o;
    return !(!r || (o = r, "[object Error]" !== e1.call(o)) || "TypeError" !== r.name || "string" != typeof r.message) && ("Load failed" === r.message ? void 0 === r.stack : t2.has(r.message));
}
class o5 extends Error {
    constructor(r){
        super(), r instanceof Error ? (this.originalError = r, { message: r  } = r) : (this.originalError = new Error(r), this.originalError.stack = this.stack), this.name = "AbortError", this.message = r;
    }
}
const e2 = (r, t, o)=>{
    const e = o.retries - (t - 1);
    return r.attemptNumber = t, r.retriesLeft = e, r;
};
async function s1(s, n) {
    return new Promise((i, a)=>{
        n = {
            ...n
        }, n.onFailedAttempt ??= ()=>{}, n.shouldRetry ??= ()=>!0, n.retries ??= 10;
        const c = r.operation(n), m = ()=>{
            c.stop(), a(n.signal?.reason);
        };
        n.signal && !n.signal.aborted && n.signal.addEventListener("abort", m, {
            once: !0
        });
        const h = ()=>{
            n.signal?.removeEventListener("abort", m), c.stop();
        };
        c.attempt(async (r)=>{
            try {
                const t1 = await s(r);
                h(), i(t1);
            } catch (s1) {
                try {
                    if (!(s1 instanceof Error)) throw new TypeError(`Non-error was thrown: "${s1}". You should only throw errors.`);
                    if (s1 instanceof o5) throw s1.originalError;
                    if (s1 instanceof TypeError && !r1(s1)) throw s1;
                    if (e2(s1, r, n), await n.shouldRetry(s1) || (c.stop(), a(s1)), await n.onFailedAttempt(s1), !c.retry(s1)) throw c.mainError();
                } catch (t2) {
                    e2(t2, r, n), h(), a(t2);
                }
            }
        });
    });
}
var r2 = "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, e3 = [], n2 = [], o6 = "undefined" != typeof Uint8Array ? Uint8Array : Array, i9 = !1;
function u1() {
    i9 = !0;
    for(var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", r = 0; r < 64; ++r)e3[r] = t[r], n2[t.charCodeAt(r)] = r;
    n2["-".charCodeAt(0)] = 62, n2["_".charCodeAt(0)] = 63;
}
function a(t, r, n) {
    for(var o, i, u = [], a = r; a < n; a += 3)o = (t[a] << 16) + (t[a + 1] << 8) + t[a + 2], u.push(e3[(i = o) >> 18 & 63] + e3[i >> 12 & 63] + e3[i >> 6 & 63] + e3[63 & i]);
    return u.join("");
}
function f1(t) {
    var r;
    i9 || u1();
    for(var n = t.length, o = n % 3, f = "", s = [], c = 16383, h = 0, l = n - o; h < l; h += c)s.push(a(t, h, h + c > l ? l : h + c));
    return 1 === o ? (r = t[n - 1], f += e3[r >> 2], f += e3[r << 4 & 63], f += "==") : 2 === o && (r = (t[n - 2] << 8) + t[n - 1], f += e3[r >> 10], f += e3[r >> 4 & 63], f += e3[r << 2 & 63], f += "="), s.push(f), s.join("");
}
function s2(t, r, e, n, o) {
    var i, u, a = 8 * o - n - 1, f = (1 << a) - 1, s = f >> 1, c = -7, h = e ? o - 1 : 0, l = e ? -1 : 1, p = t[r + h];
    for(h += l, i = p & (1 << -c) - 1, p >>= -c, c += a; c > 0; i = 256 * i + t[r + h], h += l, c -= 8);
    for(u = i & (1 << -c) - 1, i >>= -c, c += n; c > 0; u = 256 * u + t[r + h], h += l, c -= 8);
    if (0 === i) i = 1 - s;
    else {
        if (i === f) return u ? NaN : 1 / 0 * (p ? -1 : 1);
        u += Math.pow(2, n), i -= s;
    }
    return (p ? -1 : 1) * u * Math.pow(2, i - n);
}
function c(t, r, e, n, o, i) {
    var u, a, f, s = 8 * i - o - 1, c = (1 << s) - 1, h = c >> 1, l = 23 === o ? Math.pow(2, -24) - Math.pow(2, -77) : 0, p = n ? 0 : i - 1, g = n ? 1 : -1, y = r < 0 || 0 === r && 1 / r < 0 ? 1 : 0;
    for(r = Math.abs(r), isNaN(r) || r === 1 / 0 ? (a = isNaN(r) ? 1 : 0, u = c) : (u = Math.floor(Math.log(r) / Math.LN2), r * (f = Math.pow(2, -u)) < 1 && (u--, f *= 2), (r += u + h >= 1 ? l / f : l * Math.pow(2, 1 - h)) * f >= 2 && (u++, f /= 2), u + h >= c ? (a = 0, u = c) : u + h >= 1 ? (a = (r * f - 1) * Math.pow(2, o), u += h) : (a = r * Math.pow(2, h - 1) * Math.pow(2, o), u = 0)); o >= 8; t[e + p] = 255 & a, p += g, a /= 256, o -= 8);
    for(u = u << o | a, s += o; s > 0; t[e + p] = 255 & u, p += g, u /= 256, s -= 8);
    t[e + p - g] |= 128 * y;
}
var h = {}.toString, l = Array.isArray || function(t) {
    return "[object Array]" == h.call(t);
};
function p() {
    return y1.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
}
function g(t, r) {
    if (p() < r) throw new RangeError("Invalid typed array length");
    return y1.TYPED_ARRAY_SUPPORT ? (t = new Uint8Array(r)).__proto__ = y1.prototype : (null === t && (t = new y1(r)), t.length = r), t;
}
function y1(t, r, e) {
    if (!(y1.TYPED_ARRAY_SUPPORT || this instanceof y1)) return new y1(t, r, e);
    if ("number" == typeof t) {
        if ("string" == typeof r) throw new Error("If encoding is specified then the first argument must be a string");
        return v(this, t);
    }
    return d(this, t, r, e);
}
function d(t, r, e, n) {
    if ("number" == typeof r) throw new TypeError('"value" argument must not be a number');
    return "undefined" != typeof ArrayBuffer && r instanceof ArrayBuffer ? function(t, r, e, n) {
        if (r.byteLength, e < 0 || r.byteLength < e) throw new RangeError("'offset' is out of bounds");
        if (r.byteLength < e + (n || 0)) throw new RangeError("'length' is out of bounds");
        r = void 0 === e && void 0 === n ? new Uint8Array(r) : void 0 === n ? new Uint8Array(r, e) : new Uint8Array(r, e, n);
        y1.TYPED_ARRAY_SUPPORT ? (t = r).__proto__ = y1.prototype : t = m1(t, r);
        return t;
    }(t, r, e, n) : "string" == typeof r ? function(t, r, e) {
        "string" == typeof e && "" !== e || (e = "utf8");
        if (!y1.isEncoding(e)) throw new TypeError('"encoding" must be a valid string encoding');
        var n = 0 | A(r, e);
        t = g(t, n);
        var o = t.write(r, e);
        o !== n && (t = t.slice(0, o));
        return t;
    }(t, r, e) : function(t, r) {
        if (E(r)) {
            var e = 0 | b2(r.length);
            return 0 === (t = g(t, e)).length || r.copy(t, 0, 0, e), t;
        }
        if (r) {
            if ("undefined" != typeof ArrayBuffer && r.buffer instanceof ArrayBuffer || "length" in r) return "number" != typeof r.length || (n = r.length) != n ? g(t, 0) : m1(t, r);
            if ("Buffer" === r.type && l(r.data)) return m1(t, r.data);
        }
        var n;
        throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
    }(t, r);
}
function w(t) {
    if ("number" != typeof t) throw new TypeError('"size" argument must be a number');
    if (t < 0) throw new RangeError('"size" argument must not be negative');
}
function v(t, r) {
    if (w(r), t = g(t, r < 0 ? 0 : 0 | b2(r)), !y1.TYPED_ARRAY_SUPPORT) for(var e = 0; e < r; ++e)t[e] = 0;
    return t;
}
function m1(t, r) {
    var e = r.length < 0 ? 0 : 0 | b2(r.length);
    t = g(t, e);
    for(var n = 0; n < e; n += 1)t[n] = 255 & r[n];
    return t;
}
function b2(t) {
    if (t >= p()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + p().toString(16) + " bytes");
    return 0 | t;
}
function E(t) {
    return !(null == t || !t._isBuffer);
}
function A(t, r) {
    if (E(t)) return t.length;
    if ("undefined" != typeof ArrayBuffer && "function" == typeof ArrayBuffer.isView && (ArrayBuffer.isView(t) || t instanceof ArrayBuffer)) return t.byteLength;
    "string" != typeof t && (t = "" + t);
    var e = t.length;
    if (0 === e) return 0;
    for(var n = !1;;)switch(r){
        case "ascii":
        case "latin1":
        case "binary":
            return e;
        case "utf8":
        case "utf-8":
        case void 0:
            return Z(t).length;
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
            return 2 * e;
        case "hex":
            return e >>> 1;
        case "base64":
            return K(t).length;
        default:
            if (n) return Z(t).length;
            r = ("" + r).toLowerCase(), n = !0;
    }
}
function R1(t, r, e) {
    var n = !1;
    if ((void 0 === r || r < 0) && (r = 0), r > this.length) return "";
    if ((void 0 === e || e > this.length) && (e = this.length), e <= 0) return "";
    if ((e >>>= 0) <= (r >>>= 0)) return "";
    for(t || (t = "utf8");;)switch(t){
        case "hex":
            return k(this, r, e);
        case "utf8":
        case "utf-8":
            return C(this, r, e);
        case "ascii":
            return j4(this, r, e);
        case "latin1":
        case "binary":
            return M(this, r, e);
        case "base64":
            return D(this, r, e);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
            return L(this, r, e);
        default:
            if (n) throw new TypeError("Unknown encoding: " + t);
            t = (t + "").toLowerCase(), n = !0;
    }
}
function P(t, r, e) {
    var n = t[r];
    t[r] = t[e], t[e] = n;
}
function _(t, r, e, n, o) {
    if (0 === t.length) return -1;
    if ("string" == typeof e ? (n = e, e = 0) : e > 2147483647 ? e = 2147483647 : e < -2147483648 && (e = -2147483648), e = +e, isNaN(e) && (e = o ? 0 : t.length - 1), e < 0 && (e = t.length + e), e >= t.length) {
        if (o) return -1;
        e = t.length - 1;
    } else if (e < 0) {
        if (!o) return -1;
        e = 0;
    }
    if ("string" == typeof r && (r = y1.from(r, n)), E(r)) return 0 === r.length ? -1 : S2(t, r, e, n, o);
    if ("number" == typeof r) return r &= 255, y1.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? o ? Uint8Array.prototype.indexOf.call(t, r, e) : Uint8Array.prototype.lastIndexOf.call(t, r, e) : S2(t, [
        r
    ], e, n, o);
    throw new TypeError("val must be string, number or Buffer");
}
function S2(t, r, e, n, o) {
    var i, u = 1, a = t.length, f = r.length;
    if (void 0 !== n && ("ucs2" === (n = String(n).toLowerCase()) || "ucs-2" === n || "utf16le" === n || "utf-16le" === n)) {
        if (t.length < 2 || r.length < 2) return -1;
        u = 2, a /= 2, f /= 2, e /= 2;
    }
    function s(t, r) {
        return 1 === u ? t[r] : t.readUInt16BE(r * u);
    }
    if (o) {
        var c = -1;
        for(i = e; i < a; i++)if (s(t, i) === s(r, -1 === c ? 0 : i - c)) {
            if (-1 === c && (c = i), i - c + 1 === f) return c * u;
        } else -1 !== c && (i -= i - c), c = -1;
    } else for(e + f > a && (e = a - f), i = e; i >= 0; i--){
        for(var h = !0, l = 0; l < f; l++)if (s(t, i + l) !== s(r, l)) {
            h = !1;
            break;
        }
        if (h) return i;
    }
    return -1;
}
function T(t, r, e, n) {
    e = Number(e) || 0;
    var o = t.length - e;
    n ? (n = Number(n)) > o && (n = o) : n = o;
    var i = r.length;
    if (i % 2 != 0) throw new TypeError("Invalid hex string");
    n > i / 2 && (n = i / 2);
    for(var u = 0; u < n; ++u){
        var a = parseInt(r.substr(2 * u, 2), 16);
        if (isNaN(a)) return u;
        t[e + u] = a;
    }
    return u;
}
function O(t, r, e, n) {
    return Q(Z(r, t.length - e), t, e, n);
}
function I1(t, r, e, n) {
    return Q(function(t) {
        for(var r = [], e = 0; e < t.length; ++e)r.push(255 & t.charCodeAt(e));
        return r;
    }(r), t, e, n);
}
function U(t, r, e, n) {
    return I1(t, r, e, n);
}
function x1(t, r, e, n) {
    return Q(K(r), t, e, n);
}
function B(t, r, e, n) {
    return Q(function(t, r) {
        for(var e, n, o, i = [], u = 0; u < t.length && !((r -= 2) < 0); ++u)n = (e = t.charCodeAt(u)) >> 8, o = e % 256, i.push(o), i.push(n);
        return i;
    }(r, t.length - e), t, e, n);
}
function D(t, r, e) {
    return 0 === r && e === t.length ? f1(t) : f1(t.slice(r, e));
}
function C(t, r, e) {
    e = Math.min(t.length, e);
    for(var n = [], o = r; o < e;){
        var i, u, a, f, s = t[o], c = null, h = s > 239 ? 4 : s > 223 ? 3 : s > 191 ? 2 : 1;
        if (o + h <= e) switch(h){
            case 1:
                s < 128 && (c = s);
                break;
            case 2:
                128 == (192 & (i = t[o + 1])) && (f = (31 & s) << 6 | 63 & i) > 127 && (c = f);
                break;
            case 3:
                i = t[o + 1], u = t[o + 2], 128 == (192 & i) && 128 == (192 & u) && (f = (15 & s) << 12 | (63 & i) << 6 | 63 & u) > 2047 && (f < 55296 || f > 57343) && (c = f);
                break;
            case 4:
                i = t[o + 1], u = t[o + 2], a = t[o + 3], 128 == (192 & i) && 128 == (192 & u) && 128 == (192 & a) && (f = (15 & s) << 18 | (63 & i) << 12 | (63 & u) << 6 | 63 & a) > 65535 && f < 1114112 && (c = f);
        }
        null === c ? (c = 65533, h = 1) : c > 65535 && (c -= 65536, n.push(c >>> 10 & 1023 | 55296), c = 56320 | 1023 & c), n.push(c), o += h;
    }
    return function(t) {
        var r = t.length;
        if (r <= Y) return String.fromCharCode.apply(String, t);
        var e = "", n = 0;
        for(; n < r;)e += String.fromCharCode.apply(String, t.slice(n, n += Y));
        return e;
    }(n);
}
y1.TYPED_ARRAY_SUPPORT = void 0 === r2.TYPED_ARRAY_SUPPORT || r2.TYPED_ARRAY_SUPPORT, p(), y1.poolSize = 8192, y1._augment = function(t) {
    return t.__proto__ = y1.prototype, t;
}, y1.from = function(t, r, e) {
    return d(null, t, r, e);
}, y1.TYPED_ARRAY_SUPPORT && (y1.prototype.__proto__ = Uint8Array.prototype, y1.__proto__ = Uint8Array, "undefined" != typeof Symbol && Symbol.species && y1[Symbol.species]), y1.alloc = function(t, r, e) {
    return function(t, r, e, n) {
        return w(r), r <= 0 ? g(t, r) : void 0 !== e ? "string" == typeof n ? g(t, r).fill(e, n) : g(t, r).fill(e) : g(t, r);
    }(null, t, r, e);
}, y1.allocUnsafe = function(t) {
    return v(null, t);
}, y1.allocUnsafeSlow = function(t) {
    return v(null, t);
}, y1.isBuffer = W, y1.compare = function(t, r) {
    if (!E(t) || !E(r)) throw new TypeError("Arguments must be Buffers");
    if (t === r) return 0;
    for(var e = t.length, n = r.length, o = 0, i = Math.min(e, n); o < i; ++o)if (t[o] !== r[o]) {
        e = t[o], n = r[o];
        break;
    }
    return e < n ? -1 : n < e ? 1 : 0;
}, y1.isEncoding = function(t) {
    switch(String(t).toLowerCase()){
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
            return !0;
        default:
            return !1;
    }
}, y1.concat = function(t, r) {
    if (!l(t)) throw new TypeError('"list" argument must be an Array of Buffers');
    if (0 === t.length) return y1.alloc(0);
    var e;
    if (void 0 === r) for(r = 0, e = 0; e < t.length; ++e)r += t[e].length;
    var n = y1.allocUnsafe(r), o = 0;
    for(e = 0; e < t.length; ++e){
        var i = t[e];
        if (!E(i)) throw new TypeError('"list" argument must be an Array of Buffers');
        i.copy(n, o), o += i.length;
    }
    return n;
}, y1.byteLength = A, y1.prototype._isBuffer = !0, y1.prototype.swap16 = function() {
    var t = this.length;
    if (t % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
    for(var r = 0; r < t; r += 2)P(this, r, r + 1);
    return this;
}, y1.prototype.swap32 = function() {
    var t = this.length;
    if (t % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
    for(var r = 0; r < t; r += 4)P(this, r, r + 3), P(this, r + 1, r + 2);
    return this;
}, y1.prototype.swap64 = function() {
    var t = this.length;
    if (t % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
    for(var r = 0; r < t; r += 8)P(this, r, r + 7), P(this, r + 1, r + 6), P(this, r + 2, r + 5), P(this, r + 3, r + 4);
    return this;
}, y1.prototype.toString = function() {
    var t = 0 | this.length;
    return 0 === t ? "" : 0 === arguments.length ? C(this, 0, t) : R1.apply(this, arguments);
}, y1.prototype.equals = function(t) {
    if (!E(t)) throw new TypeError("Argument must be a Buffer");
    return this === t || 0 === y1.compare(this, t);
}, y1.prototype.inspect = function() {
    var t = "";
    return this.length > 0 && (t = this.toString("hex", 0, 50).match(/.{2}/g).join(" "), this.length > 50 && (t += " ... ")), "<Buffer " + t + ">";
}, y1.prototype.compare = function(t, r, e, n, o) {
    if (!E(t)) throw new TypeError("Argument must be a Buffer");
    if (void 0 === r && (r = 0), void 0 === e && (e = t ? t.length : 0), void 0 === n && (n = 0), void 0 === o && (o = this.length), r < 0 || e > t.length || n < 0 || o > this.length) throw new RangeError("out of range index");
    if (n >= o && r >= e) return 0;
    if (n >= o) return -1;
    if (r >= e) return 1;
    if (this === t) return 0;
    for(var i = (o >>>= 0) - (n >>>= 0), u = (e >>>= 0) - (r >>>= 0), a = Math.min(i, u), f = this.slice(n, o), s = t.slice(r, e), c = 0; c < a; ++c)if (f[c] !== s[c]) {
        i = f[c], u = s[c];
        break;
    }
    return i < u ? -1 : u < i ? 1 : 0;
}, y1.prototype.includes = function(t, r, e) {
    return -1 !== this.indexOf(t, r, e);
}, y1.prototype.indexOf = function(t, r, e) {
    return _(this, t, r, e, !0);
}, y1.prototype.lastIndexOf = function(t, r, e) {
    return _(this, t, r, e, !1);
}, y1.prototype.write = function(t, r, e, n) {
    if (void 0 === r) n = "utf8", e = this.length, r = 0;
    else if (void 0 === e && "string" == typeof r) n = r, e = this.length, r = 0;
    else {
        if (!isFinite(r)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
        r |= 0, isFinite(e) ? (e |= 0, void 0 === n && (n = "utf8")) : (n = e, e = void 0);
    }
    var o = this.length - r;
    if ((void 0 === e || e > o) && (e = o), t.length > 0 && (e < 0 || r < 0) || r > this.length) throw new RangeError("Attempt to write outside buffer bounds");
    n || (n = "utf8");
    for(var i = !1;;)switch(n){
        case "hex":
            return T(this, t, r, e);
        case "utf8":
        case "utf-8":
            return O(this, t, r, e);
        case "ascii":
            return I1(this, t, r, e);
        case "latin1":
        case "binary":
            return U(this, t, r, e);
        case "base64":
            return x1(this, t, r, e);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
            return B(this, t, r, e);
        default:
            if (i) throw new TypeError("Unknown encoding: " + n);
            n = ("" + n).toLowerCase(), i = !0;
    }
}, y1.prototype.toJSON = function() {
    return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0)
    };
};
var Y = 4096;
function j4(t, r, e) {
    var n = "";
    e = Math.min(t.length, e);
    for(var o = r; o < e; ++o)n += String.fromCharCode(127 & t[o]);
    return n;
}
function M(t, r, e) {
    var n = "";
    e = Math.min(t.length, e);
    for(var o = r; o < e; ++o)n += String.fromCharCode(t[o]);
    return n;
}
function k(t, r, e) {
    var n = t.length;
    (!r || r < 0) && (r = 0), (!e || e < 0 || e > n) && (e = n);
    for(var o = "", i = r; i < e; ++i)o += G(t[i]);
    return o;
}
function L(t, r, e) {
    for(var n = t.slice(r, e), o = "", i = 0; i < n.length; i += 2)o += String.fromCharCode(n[i] + 256 * n[i + 1]);
    return o;
}
function z(t, r, e) {
    if (t % 1 != 0 || t < 0) throw new RangeError("offset is not uint");
    if (t + r > e) throw new RangeError("Trying to access beyond buffer length");
}
function N1(t, r, e, n, o, i) {
    if (!E(t)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (r > o || r < i) throw new RangeError('"value" argument is out of bounds');
    if (e + n > t.length) throw new RangeError("Index out of range");
}
function F(t, r, e, n) {
    r < 0 && (r = 65535 + r + 1);
    for(var o = 0, i = Math.min(t.length - e, 2); o < i; ++o)t[e + o] = (r & 255 << 8 * (n ? o : 1 - o)) >>> 8 * (n ? o : 1 - o);
}
function q(t, r, e, n) {
    r < 0 && (r = 4294967295 + r + 1);
    for(var o = 0, i = Math.min(t.length - e, 4); o < i; ++o)t[e + o] = r >>> 8 * (n ? o : 3 - o) & 255;
}
function $(t, r, e, n, o, i) {
    if (e + n > t.length) throw new RangeError("Index out of range");
    if (e < 0) throw new RangeError("Index out of range");
}
function H(t, r, e, n, o) {
    return o || $(t, 0, e, 4), c(t, r, e, n, 23, 4), e + 4;
}
function V(t, r, e, n, o) {
    return o || $(t, 0, e, 8), c(t, r, e, n, 52, 8), e + 8;
}
y1.prototype.slice = function(t, r) {
    var e, n = this.length;
    if ((t = ~~t) < 0 ? (t += n) < 0 && (t = 0) : t > n && (t = n), (r = void 0 === r ? n : ~~r) < 0 ? (r += n) < 0 && (r = 0) : r > n && (r = n), r < t && (r = t), y1.TYPED_ARRAY_SUPPORT) (e = this.subarray(t, r)).__proto__ = y1.prototype;
    else {
        var o = r - t;
        e = new y1(o, void 0);
        for(var i = 0; i < o; ++i)e[i] = this[i + t];
    }
    return e;
}, y1.prototype.readUIntLE = function(t, r, e) {
    t |= 0, r |= 0, e || z(t, r, this.length);
    for(var n = this[t], o = 1, i = 0; ++i < r && (o *= 256);)n += this[t + i] * o;
    return n;
}, y1.prototype.readUIntBE = function(t, r, e) {
    t |= 0, r |= 0, e || z(t, r, this.length);
    for(var n = this[t + --r], o = 1; r > 0 && (o *= 256);)n += this[t + --r] * o;
    return n;
}, y1.prototype.readUInt8 = function(t, r) {
    return r || z(t, 1, this.length), this[t];
}, y1.prototype.readUInt16LE = function(t, r) {
    return r || z(t, 2, this.length), this[t] | this[t + 1] << 8;
}, y1.prototype.readUInt16BE = function(t, r) {
    return r || z(t, 2, this.length), this[t] << 8 | this[t + 1];
}, y1.prototype.readUInt32LE = function(t, r) {
    return r || z(t, 4, this.length), (this[t] | this[t + 1] << 8 | this[t + 2] << 16) + 16777216 * this[t + 3];
}, y1.prototype.readUInt32BE = function(t, r) {
    return r || z(t, 4, this.length), 16777216 * this[t] + (this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3]);
}, y1.prototype.readIntLE = function(t, r, e) {
    t |= 0, r |= 0, e || z(t, r, this.length);
    for(var n = this[t], o = 1, i = 0; ++i < r && (o *= 256);)n += this[t + i] * o;
    return n >= (o *= 128) && (n -= Math.pow(2, 8 * r)), n;
}, y1.prototype.readIntBE = function(t, r, e) {
    t |= 0, r |= 0, e || z(t, r, this.length);
    for(var n = r, o = 1, i = this[t + --n]; n > 0 && (o *= 256);)i += this[t + --n] * o;
    return i >= (o *= 128) && (i -= Math.pow(2, 8 * r)), i;
}, y1.prototype.readInt8 = function(t, r) {
    return r || z(t, 1, this.length), 128 & this[t] ? -1 * (255 - this[t] + 1) : this[t];
}, y1.prototype.readInt16LE = function(t, r) {
    r || z(t, 2, this.length);
    var e = this[t] | this[t + 1] << 8;
    return 32768 & e ? 4294901760 | e : e;
}, y1.prototype.readInt16BE = function(t, r) {
    r || z(t, 2, this.length);
    var e = this[t + 1] | this[t] << 8;
    return 32768 & e ? 4294901760 | e : e;
}, y1.prototype.readInt32LE = function(t, r) {
    return r || z(t, 4, this.length), this[t] | this[t + 1] << 8 | this[t + 2] << 16 | this[t + 3] << 24;
}, y1.prototype.readInt32BE = function(t, r) {
    return r || z(t, 4, this.length), this[t] << 24 | this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3];
}, y1.prototype.readFloatLE = function(t, r) {
    return r || z(t, 4, this.length), s2(this, t, !0, 23, 4);
}, y1.prototype.readFloatBE = function(t, r) {
    return r || z(t, 4, this.length), s2(this, t, !1, 23, 4);
}, y1.prototype.readDoubleLE = function(t, r) {
    return r || z(t, 8, this.length), s2(this, t, !0, 52, 8);
}, y1.prototype.readDoubleBE = function(t, r) {
    return r || z(t, 8, this.length), s2(this, t, !1, 52, 8);
}, y1.prototype.writeUIntLE = function(t, r, e, n) {
    (t = +t, r |= 0, e |= 0, n) || N1(this, t, r, e, Math.pow(2, 8 * e) - 1, 0);
    var o = 1, i = 0;
    for(this[r] = 255 & t; ++i < e && (o *= 256);)this[r + i] = t / o & 255;
    return r + e;
}, y1.prototype.writeUIntBE = function(t, r, e, n) {
    (t = +t, r |= 0, e |= 0, n) || N1(this, t, r, e, Math.pow(2, 8 * e) - 1, 0);
    var o = e - 1, i = 1;
    for(this[r + o] = 255 & t; --o >= 0 && (i *= 256);)this[r + o] = t / i & 255;
    return r + e;
}, y1.prototype.writeUInt8 = function(t, r, e) {
    return t = +t, r |= 0, e || N1(this, t, r, 1, 255, 0), y1.TYPED_ARRAY_SUPPORT || (t = Math.floor(t)), this[r] = 255 & t, r + 1;
}, y1.prototype.writeUInt16LE = function(t, r, e) {
    return t = +t, r |= 0, e || N1(this, t, r, 2, 65535, 0), y1.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t, this[r + 1] = t >>> 8) : F(this, t, r, !0), r + 2;
}, y1.prototype.writeUInt16BE = function(t, r, e) {
    return t = +t, r |= 0, e || N1(this, t, r, 2, 65535, 0), y1.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 8, this[r + 1] = 255 & t) : F(this, t, r, !1), r + 2;
}, y1.prototype.writeUInt32LE = function(t, r, e) {
    return t = +t, r |= 0, e || N1(this, t, r, 4, 4294967295, 0), y1.TYPED_ARRAY_SUPPORT ? (this[r + 3] = t >>> 24, this[r + 2] = t >>> 16, this[r + 1] = t >>> 8, this[r] = 255 & t) : q(this, t, r, !0), r + 4;
}, y1.prototype.writeUInt32BE = function(t, r, e) {
    return t = +t, r |= 0, e || N1(this, t, r, 4, 4294967295, 0), y1.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 24, this[r + 1] = t >>> 16, this[r + 2] = t >>> 8, this[r + 3] = 255 & t) : q(this, t, r, !1), r + 4;
}, y1.prototype.writeIntLE = function(t, r, e, n) {
    if (t = +t, r |= 0, !n) {
        var o = Math.pow(2, 8 * e - 1);
        N1(this, t, r, e, o - 1, -o);
    }
    var i = 0, u = 1, a = 0;
    for(this[r] = 255 & t; ++i < e && (u *= 256);)t < 0 && 0 === a && 0 !== this[r + i - 1] && (a = 1), this[r + i] = (t / u | 0) - a & 255;
    return r + e;
}, y1.prototype.writeIntBE = function(t, r, e, n) {
    if (t = +t, r |= 0, !n) {
        var o = Math.pow(2, 8 * e - 1);
        N1(this, t, r, e, o - 1, -o);
    }
    var i = e - 1, u = 1, a = 0;
    for(this[r + i] = 255 & t; --i >= 0 && (u *= 256);)t < 0 && 0 === a && 0 !== this[r + i + 1] && (a = 1), this[r + i] = (t / u | 0) - a & 255;
    return r + e;
}, y1.prototype.writeInt8 = function(t, r, e) {
    return t = +t, r |= 0, e || N1(this, t, r, 1, 127, -128), y1.TYPED_ARRAY_SUPPORT || (t = Math.floor(t)), t < 0 && (t = 255 + t + 1), this[r] = 255 & t, r + 1;
}, y1.prototype.writeInt16LE = function(t, r, e) {
    return t = +t, r |= 0, e || N1(this, t, r, 2, 32767, -32768), y1.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t, this[r + 1] = t >>> 8) : F(this, t, r, !0), r + 2;
}, y1.prototype.writeInt16BE = function(t, r, e) {
    return t = +t, r |= 0, e || N1(this, t, r, 2, 32767, -32768), y1.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 8, this[r + 1] = 255 & t) : F(this, t, r, !1), r + 2;
}, y1.prototype.writeInt32LE = function(t, r, e) {
    return t = +t, r |= 0, e || N1(this, t, r, 4, 2147483647, -2147483648), y1.TYPED_ARRAY_SUPPORT ? (this[r] = 255 & t, this[r + 1] = t >>> 8, this[r + 2] = t >>> 16, this[r + 3] = t >>> 24) : q(this, t, r, !0), r + 4;
}, y1.prototype.writeInt32BE = function(t, r, e) {
    return t = +t, r |= 0, e || N1(this, t, r, 4, 2147483647, -2147483648), t < 0 && (t = 4294967295 + t + 1), y1.TYPED_ARRAY_SUPPORT ? (this[r] = t >>> 24, this[r + 1] = t >>> 16, this[r + 2] = t >>> 8, this[r + 3] = 255 & t) : q(this, t, r, !1), r + 4;
}, y1.prototype.writeFloatLE = function(t, r, e) {
    return H(this, t, r, !0, e);
}, y1.prototype.writeFloatBE = function(t, r, e) {
    return H(this, t, r, !1, e);
}, y1.prototype.writeDoubleLE = function(t, r, e) {
    return V(this, t, r, !0, e);
}, y1.prototype.writeDoubleBE = function(t, r, e) {
    return V(this, t, r, !1, e);
}, y1.prototype.copy = function(t, r, e, n) {
    if (e || (e = 0), n || 0 === n || (n = this.length), r >= t.length && (r = t.length), r || (r = 0), n > 0 && n < e && (n = e), n === e) return 0;
    if (0 === t.length || 0 === this.length) return 0;
    if (r < 0) throw new RangeError("targetStart out of bounds");
    if (e < 0 || e >= this.length) throw new RangeError("sourceStart out of bounds");
    if (n < 0) throw new RangeError("sourceEnd out of bounds");
    n > this.length && (n = this.length), t.length - r < n - e && (n = t.length - r + e);
    var o, i = n - e;
    if (this === t && e < r && r < n) for(o = i - 1; o >= 0; --o)t[o + r] = this[o + e];
    else if (i < 1e3 || !y1.TYPED_ARRAY_SUPPORT) for(o = 0; o < i; ++o)t[o + r] = this[o + e];
    else Uint8Array.prototype.set.call(t, this.subarray(e, e + i), r);
    return i;
}, y1.prototype.fill = function(t, r, e, n) {
    if ("string" == typeof t) {
        if ("string" == typeof r ? (n = r, r = 0, e = this.length) : "string" == typeof e && (n = e, e = this.length), 1 === t.length) {
            var o = t.charCodeAt(0);
            o < 256 && (t = o);
        }
        if (void 0 !== n && "string" != typeof n) throw new TypeError("encoding must be a string");
        if ("string" == typeof n && !y1.isEncoding(n)) throw new TypeError("Unknown encoding: " + n);
    } else "number" == typeof t && (t &= 255);
    if (r < 0 || this.length < r || this.length < e) throw new RangeError("Out of range index");
    if (e <= r) return this;
    var i;
    if (r >>>= 0, e = void 0 === e ? this.length : e >>> 0, t || (t = 0), "number" == typeof t) for(i = r; i < e; ++i)this[i] = t;
    else {
        var u = E(t) ? t : Z(new y1(t, n).toString()), a = u.length;
        for(i = 0; i < e - r; ++i)this[i + r] = u[i % a];
    }
    return this;
};
var J = /[^+\/0-9A-Za-z-_]/g;
function G(t) {
    return t < 16 ? "0" + t.toString(16) : t.toString(16);
}
function Z(t, r) {
    var e;
    r = r || 1 / 0;
    for(var n = t.length, o = null, i = [], u = 0; u < n; ++u){
        if ((e = t.charCodeAt(u)) > 55295 && e < 57344) {
            if (!o) {
                if (e > 56319) {
                    (r -= 3) > -1 && i.push(239, 191, 189);
                    continue;
                }
                if (u + 1 === n) {
                    (r -= 3) > -1 && i.push(239, 191, 189);
                    continue;
                }
                o = e;
                continue;
            }
            if (e < 56320) {
                (r -= 3) > -1 && i.push(239, 191, 189), o = e;
                continue;
            }
            e = 65536 + (o - 55296 << 10 | e - 56320);
        } else o && (r -= 3) > -1 && i.push(239, 191, 189);
        if (o = null, e < 128) {
            if ((r -= 1) < 0) break;
            i.push(e);
        } else if (e < 2048) {
            if ((r -= 2) < 0) break;
            i.push(e >> 6 | 192, 63 & e | 128);
        } else if (e < 65536) {
            if ((r -= 3) < 0) break;
            i.push(e >> 12 | 224, e >> 6 & 63 | 128, 63 & e | 128);
        } else {
            if (!(e < 1114112)) throw new Error("Invalid code point");
            if ((r -= 4) < 0) break;
            i.push(e >> 18 | 240, e >> 12 & 63 | 128, e >> 6 & 63 | 128, 63 & e | 128);
        }
    }
    return i;
}
function K(t) {
    return function(t) {
        var r, e, a, f, s, c;
        i9 || u1();
        var h = t.length;
        if (h % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
        s = "=" === t[h - 2] ? 2 : "=" === t[h - 1] ? 1 : 0, c = new o6(3 * h / 4 - s), a = s > 0 ? h - 4 : h;
        var l = 0;
        for(r = 0, e = 0; r < a; r += 4, e += 3)f = n2[t.charCodeAt(r)] << 18 | n2[t.charCodeAt(r + 1)] << 12 | n2[t.charCodeAt(r + 2)] << 6 | n2[t.charCodeAt(r + 3)], c[l++] = f >> 16 & 255, c[l++] = f >> 8 & 255, c[l++] = 255 & f;
        return 2 === s ? (f = n2[t.charCodeAt(r)] << 2 | n2[t.charCodeAt(r + 1)] >> 4, c[l++] = 255 & f) : 1 === s && (f = n2[t.charCodeAt(r)] << 10 | n2[t.charCodeAt(r + 1)] << 4 | n2[t.charCodeAt(r + 2)] >> 2, c[l++] = f >> 8 & 255, c[l++] = 255 & f), c;
    }(function(t) {
        if ((t = (function(t) {
            return t.trim ? t.trim() : t.replace(/^\s+|\s+$/g, "");
        })(t).replace(J, "")).length < 2) return "";
        for(; t.length % 4 != 0;)t += "=";
        return t;
    }(t));
}
function Q(t, r, e, n) {
    for(var o = 0; o < n && !(o + e >= r.length || o >= t.length); ++o)r[o + e] = t[o];
    return o;
}
function W(t) {
    return null != t && (!!t._isBuffer || X(t) || function(t) {
        return "function" == typeof t.readFloatLE && "function" == typeof t.slice && X(t.slice(0, 0));
    }(t));
}
function X(t) {
    return !!t.constructor && "function" == typeof t.constructor.isBuffer && t.constructor.isBuffer(t);
}
var tt = "function" == typeof Object.create ? function(t, r) {
    t.super_ = r, t.prototype = Object.create(r.prototype, {
        constructor: {
            value: t,
            enumerable: !1,
            writable: !0,
            configurable: !0
        }
    });
} : function(t, r) {
    t.super_ = r;
    var e = function() {};
    e.prototype = r.prototype, t.prototype = new e, t.prototype.constructor = t;
};
function rt(t, r) {
    var e = {
        seen: [],
        stylize: nt
    };
    return arguments.length >= 3 && (e.depth = arguments[2]), arguments.length >= 4 && (e.colors = arguments[3]), at(r) ? e.showHidden = r : r && function(t, r) {
        if (!r || !lt(r)) return t;
        var e = Object.keys(r), n = e.length;
        for(; n--;)t[e[n]] = r[e[n]];
    }(e, r), ct(e.showHidden) && (e.showHidden = !1), ct(e.depth) && (e.depth = 2), ct(e.colors) && (e.colors = !1), ct(e.customInspect) && (e.customInspect = !0), e.colors && (e.stylize = et), ot(e, t, e.depth);
}
function et(t, r) {
    var e = rt.styles[r];
    return e ? "[" + rt.colors[e][0] + "m" + t + "[" + rt.colors[e][1] + "m" : t;
}
function nt(t, r) {
    return t;
}
function ot(t, r, e) {
    if (t.customInspect && r && yt(r.inspect) && r.inspect !== rt && (!r.constructor || r.constructor.prototype !== r)) {
        var n = r.inspect(e, t);
        return st(n) || (n = ot(t, n, e)), n;
    }
    var o = function(t, r) {
        if (ct(r)) return t.stylize("undefined", "undefined");
        if (st(r)) {
            var e = "'" + JSON.stringify(r).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
            return t.stylize(e, "string");
        }
        if (n = r, "number" == typeof n) return t.stylize("" + r, "number");
        var n;
        if (at(r)) return t.stylize("" + r, "boolean");
        if (ft(r)) return t.stylize("null", "null");
    }(t, r);
    if (o) return o;
    var i = Object.keys(r), u = function(t) {
        var r = {};
        return t.forEach(function(t, e) {
            r[t] = !0;
        }), r;
    }(i);
    if (t.showHidden && (i = Object.getOwnPropertyNames(r)), gt(r) && (i.indexOf("message") >= 0 || i.indexOf("description") >= 0)) return it(r);
    if (0 === i.length) {
        if (yt(r)) {
            var a = r.name ? ": " + r.name : "";
            return t.stylize("[Function" + a + "]", "special");
        }
        if (ht(r)) return t.stylize(RegExp.prototype.toString.call(r), "regexp");
        if (pt(r)) return t.stylize(Date.prototype.toString.call(r), "date");
        if (gt(r)) return it(r);
    }
    var f, s, c = "", h = !1, l = [
        "{",
        "}"
    ];
    (f = r, Array.isArray(f) && (h = !0, l = [
        "[",
        "]"
    ]), yt(r)) && (c = " [Function" + (r.name ? ": " + r.name : "") + "]");
    return ht(r) && (c = " " + RegExp.prototype.toString.call(r)), pt(r) && (c = " " + Date.prototype.toUTCString.call(r)), gt(r) && (c = " " + it(r)), 0 !== i.length || h && 0 != r.length ? e < 0 ? ht(r) ? t.stylize(RegExp.prototype.toString.call(r), "regexp") : t.stylize("[Object]", "special") : (t.seen.push(r), s = h ? function(t, r, e, n, o) {
        for(var i = [], u = 0, a = r.length; u < a; ++u)vt(r, String(u)) ? i.push(ut1(t, r, e, n, String(u), !0)) : i.push("");
        return o.forEach(function(o) {
            o.match(/^\d+$/) || i.push(ut1(t, r, e, n, o, !0));
        }), i;
    }(t, r, e, u, i) : i.map(function(n) {
        return ut1(t, r, e, u, n, h);
    }), t.seen.pop(), function(t, r, e) {
        var n = t.reduce(function(t, r) {
            return r.indexOf("\n"), t + r.replace(/\u001b\[\d\d?m/g, "").length + 1;
        }, 0);
        if (n > 60) return e[0] + ("" === r ? "" : r + "\n ") + " " + t.join(",\n  ") + " " + e[1];
        return e[0] + r + " " + t.join(", ") + " " + e[1];
    }(s, c, l)) : l[0] + c + l[1];
}
function it(t) {
    return "[" + Error.prototype.toString.call(t) + "]";
}
function ut1(t, r, e, n, o, i) {
    var u, a, f;
    if ((f = Object.getOwnPropertyDescriptor(r, o) || {
        value: r[o]
    }).get ? a = f.set ? t.stylize("[Getter/Setter]", "special") : t.stylize("[Getter]", "special") : f.set && (a = t.stylize("[Setter]", "special")), vt(n, o) || (u = "[" + o + "]"), a || (t.seen.indexOf(f.value) < 0 ? (a = ft(e) ? ot(t, f.value, null) : ot(t, f.value, e - 1)).indexOf("\n") > -1 && (a = i ? a.split("\n").map(function(t) {
        return "  " + t;
    }).join("\n").substr(2) : "\n" + a.split("\n").map(function(t) {
        return "   " + t;
    }).join("\n")) : a = t.stylize("[Circular]", "special")), ct(u)) {
        if (i && o.match(/^\d+$/)) return a;
        (u = JSON.stringify("" + o)).match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (u = u.substr(1, u.length - 2), u = t.stylize(u, "name")) : (u = u.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), u = t.stylize(u, "string"));
    }
    return u + ": " + a;
}
function at(t) {
    return "boolean" == typeof t;
}
function ft(t) {
    return null === t;
}
function st(t) {
    return "string" == typeof t;
}
function ct(t) {
    return void 0 === t;
}
function ht(t) {
    return lt(t) && "[object RegExp]" === wt(t);
}
function lt(t) {
    return "object" == typeof t && null !== t;
}
function pt(t) {
    return lt(t) && "[object Date]" === wt(t);
}
function gt(t) {
    return lt(t) && ("[object Error]" === wt(t) || t instanceof Error);
}
function yt(t) {
    return "function" == typeof t;
}
function dt(t) {
    return null === t || "boolean" == typeof t || "number" == typeof t || "string" == typeof t || "symbol" == typeof t || void 0 === t;
}
function wt(t) {
    return Object.prototype.toString.call(t);
}
function vt(t, r) {
    return Object.prototype.hasOwnProperty.call(t, r);
}
function mt(t, r) {
    if (t === r) return 0;
    for(var e = t.length, n = r.length, o = 0, i = Math.min(e, n); o < i; ++o)if (t[o] !== r[o]) {
        e = t[o], n = r[o];
        break;
    }
    return e < n ? -1 : n < e ? 1 : 0;
}
rt.colors = {
    bold: [
        1,
        22
    ],
    italic: [
        3,
        23
    ],
    underline: [
        4,
        24
    ],
    inverse: [
        7,
        27
    ],
    white: [
        37,
        39
    ],
    grey: [
        90,
        39
    ],
    black: [
        30,
        39
    ],
    blue: [
        34,
        39
    ],
    cyan: [
        36,
        39
    ],
    green: [
        32,
        39
    ],
    magenta: [
        35,
        39
    ],
    red: [
        31,
        39
    ],
    yellow: [
        33,
        39
    ]
}, rt.styles = {
    special: "cyan",
    number: "yellow",
    boolean: "yellow",
    undefined: "grey",
    null: "bold",
    string: "green",
    date: "magenta",
    regexp: "red"
};
var bt, Et = Object.prototype.hasOwnProperty, At = Object.keys || function(t) {
    var r = [];
    for(var e in t)Et.call(t, e) && r.push(e);
    return r;
}, Rt = Array.prototype.slice;
function Pt() {
    return void 0 !== bt ? bt : bt = "foo" === (function() {}).name;
}
function _t(t) {
    return Object.prototype.toString.call(t);
}
function St(t) {
    return !W(t) && "function" == typeof r2.ArrayBuffer && ("function" == typeof ArrayBuffer.isView ? ArrayBuffer.isView(t) : !!t && (t instanceof DataView || !!(t.buffer && t.buffer instanceof ArrayBuffer)));
}
function Tt(t, r) {
    t || Dt(t, !0, r, "==", Ct);
}
var Ot = /\s*function\s+([^\(\s]*)\s*/;
function It(t) {
    if (yt(t)) {
        if (Pt()) return t.name;
        var r = t.toString().match(Ot);
        return r && r[1];
    }
}
function Ut(t) {
    this.name = "AssertionError", this.actual = t.actual, this.expected = t.expected, this.operator = t.operator, t.message ? (this.message = t.message, this.generatedMessage = !1) : (this.message = function(t) {
        return xt(Bt(t.actual), 128) + " " + t.operator + " " + xt(Bt(t.expected), 128);
    }(this), this.generatedMessage = !0);
    var r = t.stackStartFunction || Dt;
    if (Error.captureStackTrace) Error.captureStackTrace(this, r);
    else {
        var e = new Error;
        if (e.stack) {
            var n = e.stack, o = It(r), i = n.indexOf("\n" + o);
            if (i >= 0) {
                var u = n.indexOf("\n", i + 1);
                n = n.substring(u + 1);
            }
            this.stack = n;
        }
    }
}
function xt(t, r) {
    return "string" == typeof t ? t.length < r ? t : t.slice(0, r) : t;
}
function Bt(t) {
    if (Pt() || !yt(t)) return rt(t);
    var r = It(t);
    return "[Function" + (r ? ": " + r : "") + "]";
}
function Dt(t, r, e, n, o) {
    throw new Ut({
        message: e,
        actual: t,
        expected: r,
        operator: n,
        stackStartFunction: o
    });
}
function Ct(t, r) {
    t || Dt(t, !0, r, "==", Ct);
}
function Yt(t, r, e, n) {
    if (t === r) return !0;
    if (W(t) && W(r)) return 0 === mt(t, r);
    if (pt(t) && pt(r)) return t.getTime() === r.getTime();
    if (ht(t) && ht(r)) return t.source === r.source && t.global === r.global && t.multiline === r.multiline && t.lastIndex === r.lastIndex && t.ignoreCase === r.ignoreCase;
    if (null !== t && "object" == typeof t || null !== r && "object" == typeof r) {
        if (St(t) && St(r) && _t(t) === _t(r) && !(t instanceof Float32Array || t instanceof Float64Array)) return 0 === mt(new Uint8Array(t.buffer), new Uint8Array(r.buffer));
        if (W(t) !== W(r)) return !1;
        var o = (n = n || {
            actual: [],
            expected: []
        }).actual.indexOf(t);
        return -1 !== o && o === n.expected.indexOf(r) || (n.actual.push(t), n.expected.push(r), function(t, r, e, n) {
            if (null == t || null == r) return !1;
            if (dt(t) || dt(r)) return t === r;
            if (e && Object.getPrototypeOf(t) !== Object.getPrototypeOf(r)) return !1;
            var o = jt(t), i = jt(r);
            if (o && !i || !o && i) return !1;
            if (o) return Yt(t = Rt.call(t), r = Rt.call(r), e);
            var u, a, f = At(t), s = At(r);
            if (f.length !== s.length) return !1;
            for(f.sort(), s.sort(), a = f.length - 1; a >= 0; a--)if (f[a] !== s[a]) return !1;
            for(a = f.length - 1; a >= 0; a--)if (!Yt(t[u = f[a]], r[u], e, n)) return !1;
            return !0;
        }(t, r, e, n));
    }
    return e ? t === r : t == r;
}
function jt(t) {
    return "[object Arguments]" == Object.prototype.toString.call(t);
}
function Mt(t, r) {
    if (!t || !r) return !1;
    if ("[object RegExp]" == Object.prototype.toString.call(r)) return r.test(t);
    try {
        if (t instanceof r) return !0;
    } catch (t1) {}
    return !Error.isPrototypeOf(r) && !0 === r.call({}, t);
}
function kt(t, r, e, n) {
    var o;
    if ("function" != typeof r) throw new TypeError('"block" argument must be a function');
    "string" == typeof e && (n = e, e = null), o = function(t) {
        var r;
        try {
            t();
        } catch (t1) {
            r = t1;
        }
        return r;
    }(r), n = (e && e.name ? " (" + e.name + ")." : ".") + (n ? " " + n : "."), t && !o && Dt(o, e, "Missing expected exception" + n);
    var i = "string" == typeof n, u = !t && o && !e;
    if ((!t && gt(o) && i && Mt(o, e) || u) && Dt(o, e, "Got unwanted exception" + n), t && o && e && !Mt(o, e) || !t && o) throw o;
}
async function Lt(t, r) {
    try {
        const e = Number(t.replace("f0", ""));
        Tt(!isNaN(e), `minerID must be "f0{number}". Actual value: "${t}"`);
        return (await r.getPeerData(e)).peerID;
    } catch (r1) {
        throw Error(`Error fetching peer ID from contract for miner ${t}.`, {
            cause: r1
        });
    }
}
async function zt(r, e, { maxAttempts: n = 5  } = {}) {
    const o = await async function(r, { maxAttempts: e = 5  } = {}) {
        try {
            return (await s1(()=>r("Filecoin.ChainHead", []), {
                retries: e
            })).Cids;
        } catch (t1) {
            throw new Error("Error fetching ChainHead.", {
                cause: t1
            });
        }
    }(e, {
        maxAttempts: n
    });
    try {
        const i = await s1(()=>e("Filecoin.StateMinerInfo", [
                r,
                o
            ]), {
            retries: n
        });
        return Tt.strictEqual(typeof i.PeerId, "string", `PeerId must be a string, is of type "${typeof i.PeerId}"`), i.PeerId;
    } catch (t1) {
        throw new Error(`Error fetching PeerID for miner ${r}.`, {
            cause: t1
        });
    }
}
Tt.AssertionError = Ut, tt(Ut, Error), Tt.fail = Dt, Tt.ok = Ct, Tt.equal = function t(r, e, n) {
    r != e && Dt(r, e, n, "==", t);
}, Tt.notEqual = function t(r, e, n) {
    r == e && Dt(r, e, n, "!=", t);
}, Tt.deepEqual = function t(r, e, n) {
    Yt(r, e, !1) || Dt(r, e, n, "deepEqual", t);
}, Tt.deepStrictEqual = function t(r, e, n) {
    Yt(r, e, !0) || Dt(r, e, n, "deepStrictEqual", t);
}, Tt.notDeepEqual = function t(r, e, n) {
    Yt(r, e, !1) && Dt(r, e, n, "notDeepEqual", t);
}, Tt.notDeepStrictEqual = function t(r, e, n) {
    Yt(r, e, !0) && Dt(r, e, n, "notDeepStrictEqual", t);
}, Tt.strictEqual = function t(r, e, n) {
    r !== e && Dt(r, e, n, "===", t);
}, Tt.notStrictEqual = function t(r, e, n) {
    r === e && Dt(r, e, n, "!==", t);
}, Tt.throws = function(t, r, e) {
    kt(!0, t, r, e);
}, Tt.doesNotThrow = function(t, r, e) {
    kt(!1, t, r, e);
}, Tt.ifError = function(t) {
    if (t) throw t;
};
class Nt extends Error {
    constructor(t, r, e){
        super(r), this.name = t, this.method = e, "captureStackTrace" in Error && Error.captureStackTrace(this, Nt);
    }
}
const Ft = "0x14183aD016Ddc83D638425D6328009aa390339Ce", qt = [
    "function getPeerData(uint64 minerID) view returns (tuple(string peerID, bytes signature))"
];
async function $t(t, r, { maxAttempts: e = 5 , rpcUrl: n , rpcAuth: o , rpcFn: i , signal: u  } = {}) {
    try {
        Tt.ok(!(n && i), "Cannot provide both rpcUrl and rpcFn");
        const [a, f] = await Promise.all([
            Lt(t, r),
            zt(t, i ?? async function(t, r) {
                return await async function(t, r, e, { rpcAuth: n , fetch: o = globalThis.fetch , signal: i  } = {}) {
                    let u = {
                        "content-type": "application/json",
                        accepts: "application/json"
                    };
                    n && (u = {
                        ...u,
                        Authorization: `Bearer ${n}`
                    });
                    const a = new Request(e, {
                        method: "POST",
                        headers: u,
                        body: JSON.stringify({
                            jsonrpc: "2.0",
                            id: 1,
                            method: t,
                            params: r
                        })
                    }), f = await o(a, {
                        signal: i
                    }), s = await f.json();
                    if (!s || "object" != typeof s) throw new Nt("INVALID_RPC_RESPONSE", `Response body is not an object: ${s}`, t);
                    if ("error" in s) throw new Nt("RPC_ERROR", `Error while calling RPC method ${t}: ${JSON.stringify(s.error)}`, t);
                    if (!("result" in s)) throw new Nt("NO_RESULT_IN_RESPONSE", `Response body does not contain result: ${s}`, t);
                    return s.result;
                }(t, r, n ?? "https://api.node.glif.io/", {
                    rpcAuth: o,
                    signal: u
                });
            }, {
                maxAttempts: e
            })
        ]);
        return a ? (console.log("Using PeerID from the smart contract."), {
            peerId: a,
            source: "smartContract"
        }) : {
            peerId: f,
            source: "minerInfo"
        };
    } catch (r1) {
        throw Error(`Error fetching index provider PeerID for miner ${t}.`, {
            cause: r1
        });
    }
}
export { encodeHex as encodeHex };
export { decode as decodeVarint };
export { retry as retry };
export { ethers as ethers };
export { $t as getIndexProviderPeerId, Ft as MINER_TO_PEERID_CONTRACT_ADDRESS, qt as MINER_TO_PEERID_CONTRACT_ABI };
