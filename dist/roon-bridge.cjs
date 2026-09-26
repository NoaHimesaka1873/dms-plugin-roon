#!/usr/bin/env node
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// src/protocol.js
var require_protocol = __commonJS({
  "src/protocol.js"(exports2, module2) {
    "use strict";
    var readline = require("node:readline");
    function createProtocol2({ onMessage, onEnd }) {
      const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
      rl.on("line", (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        let msg;
        try {
          msg = JSON.parse(trimmed);
        } catch (e) {
          send({ type: "error", code: "bad_json", message: e.message });
          return;
        }
        if (!msg || typeof msg.type !== "string") {
          send({ type: "error", code: "bad_message", message: "message has no string `type`" });
          return;
        }
        onMessage(msg);
      });
      rl.on("close", () => onEnd && onEnd());
      process.stdout.on("error", (err) => {
        if (err && err.code === "EPIPE") process.exit(0);
      });
      function send(obj) {
        process.stdout.write(JSON.stringify(obj) + "\n");
      }
      __name(send, "send");
      function reply(id, data) {
        send({ type: "reply", id, ok: true, data: data === void 0 ? null : data });
      }
      __name(reply, "reply");
      function fail(id, error, code) {
        send({ type: "reply", id, ok: false, error: error && error.message ? error.message : String(error), code: code || "error" });
      }
      __name(fail, "fail");
      function log(level, message) {
        send({ type: "log", level, message });
      }
      __name(log, "log");
      return { send, reply, fail, log };
    }
    __name(createProtocol2, "createProtocol");
    module2.exports = { createProtocol: createProtocol2 };
  }
});

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module2.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: /* @__PURE__ */ __name(() => {
      }, "NOOP")
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    __name(concat, "concat");
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    __name(_mask, "_mask");
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    __name(_unmask, "_unmask");
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    __name(toArrayBuffer, "toArrayBuffer");
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    __name(toBuffer, "toBuffer");
    module2.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = require("bufferutil");
        module2.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module2.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      static {
        __name(this, "Limiter");
      }
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      static {
        __name(this, "PerMessageDeflate");
      }
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    __name(deflateOnData, "deflateOnData");
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    __name(inflateOnData, "inflateOnData");
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
    __name(inflateOnError, "inflateOnError");
  }
});

// node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    var { isUtf8 } = require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    __name(isValidStatusCode, "isValidStatusCode");
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    __name(_isValidUTF8, "_isValidUTF8");
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    __name(isBlob, "isBlob");
    module2.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module2.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = require("utf-8-validate");
        module2.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver = class extends Writable {
      static {
        __name(this, "Receiver");
      }
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module2.exports = Receiver;
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    var { randomFillSync } = require("crypto");
    var {
      types: { isUint8Array }
    } = require("util");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender = class _Sender {
      static {
        __name(this, "Sender");
      }
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    __name(callCallbacks, "callCallbacks");
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
    __name(onError, "onError");
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      static {
        __name(this, "Event");
      }
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      static {
        __name(this, "CloseEvent");
      }
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      static {
        __name(this, "ErrorEvent");
      }
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      static {
        __name(this, "MessageEvent");
      }
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = /* @__PURE__ */ __name(function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          }, "onMessage");
        } else if (type === "close") {
          wrapper = /* @__PURE__ */ __name(function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          }, "onClose");
        } else if (type === "error") {
          wrapper = /* @__PURE__ */ __name(function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          }, "onError");
        } else if (type === "open") {
          wrapper = /* @__PURE__ */ __name(function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          }, "onOpen");
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module2.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
    __name(callListener, "callListener");
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    __name(push, "push");
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    __name(parse, "parse");
    function format(extensions) {
      return Object.keys(extensions).map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    __name(format, "format");
    module2.exports = { format, parse };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var https = require("https");
    var http = require("http");
    var net = require("net");
    var tls = require("tls");
    var { randomBytes, createHash } = require("crypto");
    var { Duplex, Readable } = require("stream");
    var { URL } = require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver = require_receiver();
    var Sender = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      static {
        __name(this, "WebSocket");
      }
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    __name(initAsClient, "initAsClient");
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    __name(emitErrorAndClose, "emitErrorAndClose");
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    __name(netConnect, "netConnect");
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    __name(tlsConnect, "tlsConnect");
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    __name(abortHandshake, "abortHandshake");
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    __name(sendAfterClose, "sendAfterClose");
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    __name(receiverOnConclude, "receiverOnConclude");
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    __name(receiverOnDrain, "receiverOnDrain");
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    __name(receiverOnError, "receiverOnError");
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    __name(receiverOnFinish, "receiverOnFinish");
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    __name(receiverOnMessage, "receiverOnMessage");
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    __name(receiverOnPing, "receiverOnPing");
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    __name(receiverOnPong, "receiverOnPong");
    function resume(stream) {
      stream.resume();
    }
    __name(resume, "resume");
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    __name(senderOnError, "senderOnError");
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    __name(setCloseTimer, "setCloseTimer");
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    __name(socketOnClose, "socketOnClose");
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    __name(socketOnData, "socketOnData");
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    __name(socketOnEnd, "socketOnEnd");
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
    __name(socketOnError, "socketOnError");
  }
});

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    __name(emitClose, "emitClose");
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    __name(duplexOnEnd, "duplexOnEnd");
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    __name(duplexOnError, "duplexOnError");
    function createWebSocketStream(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", /* @__PURE__ */ __name(function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      }, "message"));
      ws.once("error", /* @__PURE__ */ __name(function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      }, "error"));
      ws.once("close", /* @__PURE__ */ __name(function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      }, "close"));
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", /* @__PURE__ */ __name(function error(err2) {
          called = true;
          callback(err2);
        }, "error"));
        ws.once("close", /* @__PURE__ */ __name(function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        }, "close"));
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", /* @__PURE__ */ __name(function open() {
            duplex._final(callback);
          }, "open"));
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", /* @__PURE__ */ __name(function finish() {
            callback();
          }, "finish"));
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", /* @__PURE__ */ __name(function open() {
            duplex._write(chunk, encoding, callback);
          }, "open"));
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    __name(createWebSocketStream, "createWebSocketStream");
    module2.exports = createWebSocketStream;
  }
});

// node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/ws/lib/subprotocol.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    __name(parse, "parse");
    module2.exports = { parse };
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var http = require("http");
    var { Duplex } = require("stream");
    var { createHash } = require("crypto");
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var subprotocol = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer = class extends EventEmitter {
      static {
        __name(this, "WebSocketServer");
      }
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: /* @__PURE__ */ __name((req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }, "upgrade")
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = extension.format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return /* @__PURE__ */ __name(function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      }, "removeListeners");
    }
    __name(addListeners, "addListeners");
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    __name(emitClose, "emitClose");
    function socketOnError() {
      this.destroy();
    }
    __name(socketOnError, "socketOnError");
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    __name(abortHandshake, "abortHandshake");
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
    __name(abortHandshakeOrEmitwsClientError, "abortHandshakeOrEmitwsClientError");
  }
});

// node_modules/ws/index.js
var require_ws = __commonJS({
  "node_modules/ws/index.js"(exports2, module2) {
    "use strict";
    var createWebSocketStream = require_stream();
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver = require_receiver();
    var Sender = require_sender();
    var subprotocol = require_subprotocol();
    var WebSocket2 = require_websocket();
    var WebSocketServer = require_websocket_server();
    WebSocket2.createWebSocketStream = createWebSocketStream;
    WebSocket2.extension = extension;
    WebSocket2.PerMessageDeflate = PerMessageDeflate;
    WebSocket2.Receiver = Receiver;
    WebSocket2.Sender = Sender;
    WebSocket2.Server = WebSocketServer;
    WebSocket2.subprotocol = subprotocol;
    WebSocket2.WebSocket = WebSocket2;
    WebSocket2.WebSocketServer = WebSocketServer;
    module2.exports = WebSocket2;
  }
});

// node_modules/node-roon-api/transport-websocket.js
var require_transport_websocket = __commonJS({
  "node_modules/node-roon-api/transport-websocket.js"(exports2, module2) {
    "use strict";
    if (typeof window == "undefined" || typeof WebSocket == "undefined") global.WebSocket = require_ws();
    function Transport(ip, port, logger) {
      this.host = ip;
      this.port = port;
      this.interval = null;
      this.is_alive = null;
      this.ws = new WebSocket("ws://" + ip + ":" + port + "/api");
      if (typeof window != "undefined") this.ws.binaryType = "arraybuffer";
      this.logger = logger;
      this.ws.on("pong", () => this.is_alive = true);
      this.ws.onopen = () => {
        this.is_alive = true;
        this.interval = setInterval(() => {
          if (!this.ws) {
            this.close();
            return;
          }
          if (this.is_alive === false) {
            logger.log(`Roon API Connection to ${this.host}:${this.port} closed due to missed heartbeat`);
            return this.ws.terminate();
          }
          this.is_alive = false;
          this.ws.ping();
        }, 1e4);
        this._isonopencalled = true;
        this.onopen();
      };
      this.ws.onclose = () => {
        this.is_alive = false;
        clearInterval(this.interval);
        this.interval = null;
        this.close();
      };
      this.ws.onerror = (err) => {
        this.onerror();
      };
      this.ws.onmessage = (event) => {
        if (!this.moo) {
          return;
        }
        const msg = this.moo.parse(event.data);
        if (!msg) {
          this.close();
          return;
        }
        this.onmessage(msg);
      };
    }
    __name(Transport, "Transport");
    Transport.prototype.send = function(buf) {
      if (!this.ws) {
        this.close();
        return;
      }
      this.ws.send(buf, { binary: true, mask: true });
    };
    Transport.prototype.close = function() {
      if (this.ws) {
        clearInterval(this.interval);
        this.ws.close();
        this.ws = void 0;
      }
      if (!this._onclosecalled && this._isonopencalled) {
        this._onclosecalled = true;
        this.onclose();
      }
      if (this.moo) {
        this.moo.clean_up();
        this.moo = void 0;
      }
    };
    Transport.prototype.onopen = function() {
    };
    Transport.prototype.onclose = function() {
    };
    Transport.prototype.onerror = function() {
    };
    Transport.prototype.onmessage = function() {
    };
    exports2 = module2.exports = Transport;
  }
});

// node_modules/node-roon-api/moo.js
var require_moo = __commonJS({
  "node_modules/node-roon-api/moo.js"(exports2, module2) {
    "use strict";
    function Moo(transport) {
      this.transport = transport;
      this.transport.moo = this;
      this.reqid = 0;
      this.subkey = 0;
      this.requests = {};
      this.mooid = Moo._counter++;
      this.logger = transport.logger;
    }
    __name(Moo, "Moo");
    Moo._counter = 0;
    Moo.prototype._subscribe_helper = function(svcname, reqname, cb) {
      var subscription_args = {};
      if (arguments.length == 4) {
        cb = arguments[3];
        subscription_args = arguments[2];
      }
      var self = this;
      var subkey = self.subkey++;
      subscription_args.subscription_key = subkey;
      self.send_request(
        svcname + "/subscribe_" + reqname,
        subscription_args,
        function(msg, body) {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError", body);
        }
      );
      return {
        unsubscribe: /* @__PURE__ */ __name(function(ucb) {
          self.send_request(
            svcname + "/unsubscribe_" + reqname,
            { subscription_key: subkey },
            ucb
          );
        }, "unsubscribe")
      };
    };
    Moo.prototype.send_request = function() {
      var name;
      var body;
      var content_type;
      var cb;
      var i = 0;
      name = arguments[i++];
      if (typeof arguments[i] != "function") {
        body = arguments[i++];
      }
      if (typeof arguments[i] != "function") {
        content_type = arguments[i++];
      }
      cb = arguments[i++];
      var origbody = body;
      if (typeof body == "undefined") {
      } else if (!Buffer.isBuffer(body)) {
        body = Buffer.from(JSON.stringify(body), "utf8");
        content_type = content_type || "application/json";
      } else {
        throw new Error("missing content_type");
      }
      let header = "MOO/1 REQUEST " + name + "\nRequest-Id: " + this.reqid + "\n";
      if (body) {
        header += "Content-Length: " + body.length + "\nContent-Type: " + content_type + "\n";
      }
      this.logger.log("-> REQUEST", this.reqid, name, origbody ? JSON.stringify(origbody) : "");
      const m = Buffer.from(header + "\n");
      if (body)
        this.transport.send(Buffer.concat([m, body], m.length + body.length));
      else
        this.transport.send(m);
      this.requests[this.reqid] = { cb };
      this.reqid++;
    };
    Moo.prototype.parse = function(buf) {
      var e = 0;
      var s = 0;
      var msg = {
        headers: {}
      };
      if (typeof ArrayBuffer != "undefined" && buf instanceof ArrayBuffer) {
        var view = new Uint8Array(buf);
        var buf = new Buffer(buf.byteLength);
        for (var i = 0; i < buf.length; ++i) buf[i] = view[i];
      }
      if (buf.length == 0) {
        this.logger.log("MOO: empty message received");
        return void 0;
      }
      var state;
      while (e < buf.length) {
        if (buf[e] == 10) {
          if (state == "header") {
            if (s == e) {
              if (msg.request_id === void 0) {
                this.logger.log("MOO: missing Request-Id header: ", msg);
                return void 0;
              }
              if (msg.content_length === void 0) {
                if (msg.content_type) {
                  this.logger.log("MOO: bad message; has Content-Type but not Content-Length: ", msg);
                  return void 0;
                }
                if (e != buf.length - 1) {
                  this.logger.log("MOO: bad message; has no Content-Length, but data after headers: ", msg);
                  return void 0;
                }
              } else {
                if (msg.content_length > 0) {
                  if (!msg.content_type) {
                    this.logger.log("MOO: bad message; has Content-Length but not Content-Type: ", msg);
                    return void 0;
                  } else if (msg.content_type == "application/json") {
                    var json = buf.toString("utf8", e + 1, e + 1 + msg.content_length);
                    try {
                      msg.body = JSON.parse(json);
                    } catch (e2) {
                      this.logger.log("MOO: bad json body: ", json, msg);
                      return void 0;
                    }
                  } else {
                    msg.body = buf.slice(e + 1, e + 1 + msg.content_length);
                  }
                }
              }
              return msg;
            } else {
              var line = buf.toString("utf8", s, e);
              var matches = line.match(/([^:]+): *(.*)/);
              if (matches) {
                if (matches[1] == "Content-Type")
                  msg.content_type = matches[2];
                else if (matches[1] == "Content-Length")
                  msg.content_length = parseInt(matches[2]);
                else if (matches[1] == "Request-Id")
                  msg.request_id = matches[2];
                else
                  msg.headers[matches[1]] = matches[2];
              } else {
                this.logger.log("MOO: bad header line: ", line, msg);
                return void 0;
              }
            }
          } else {
            var line = buf.toString("utf8", s, e);
            var matches = line.match(/^MOO\/([0-9]+) ([A-Z]+) (.*)/);
            if (matches) {
              msg.verb = matches[2];
              if (msg.verb == "REQUEST") {
                matches = matches[3].match(/([^\/]+)\/(.*)/);
                if (matches) {
                  msg.service = matches[1];
                  msg.name = matches[2];
                } else {
                  this.logger.log("MOO: bad first line: ", line, msg);
                  return void 0;
                }
              } else {
                msg.name = matches[3];
              }
              state = "header";
            } else {
              this.logger.log("MOO: bad first line: ", line, msg);
              return void 0;
            }
          }
          s = e + 1;
        }
        e++;
      }
      this.logger.log("MOO: message lacks newline in header");
      return void 0;
    };
    Moo.prototype.handle_response = function(msg, body) {
      let req = this.requests[msg.request_id];
      if (!req) {
        this.logger.log("MOO: can not handle RESPONSE due to unknown Request-Id: ", msg);
        return false;
      }
      if (req.cb) req.cb(msg, body);
      if (msg.verb == "COMPLETE") delete this.requests[msg.request_id];
      return true;
    };
    Moo.prototype.clean_up = function() {
      Object.keys(this.requests).forEach((e) => {
        let cb = this.requests[e].cb;
        if (cb) cb();
      });
      this.requests = {};
    };
    exports2 = module2.exports = Moo;
  }
});

// node_modules/node-roon-api/moomsg.js
var require_moomsg = __commonJS({
  "node_modules/node-roon-api/moomsg.js"(exports2, module2) {
    "use strict";
    function MooMessage(moo, msg, body) {
      this.moo = moo;
      this.msg = msg;
      this.body = body;
    }
    __name(MooMessage, "MooMessage");
    MooMessage.prototype.send_continue = function() {
      var name;
      var body;
      var content_type;
      if (arguments.length == 1) {
        name = arguments[0];
      } else if (arguments.length == 2) {
        name = arguments[0];
        body = arguments[1];
      } else if (arguments.length >= 3) {
        name = arguments[0];
        body = arguments[1];
        content_type = arguments[2];
      }
      var origbody = body;
      if (typeof body == "undefined") {
      } else if (!Buffer.isBuffer(body)) {
        body = Buffer.from(JSON.stringify(body), "utf8");
        content_type = content_type || "application/json";
      } else {
        throw new Error("missing content_type");
      }
      let header = "MOO/1 CONTINUE " + name + "\nRequest-Id: " + this.msg.request_id + "\n";
      if (body) {
        header += "Content-Length: " + body.length + "\nContent-Type: " + content_type + "\n";
      }
      if (this.msg.log) this.moo.logger.log("-> CONTINUE", this.msg.request_id, name, origbody ? JSON.stringify(origbody) : "");
      const m = Buffer.from(header + "\n");
      if (body)
        this.moo.transport.send(Buffer.concat([m, body], m.length + body.length));
      else
        this.moo.transport.send(m);
    };
    MooMessage.prototype.send_complete = function() {
      var name;
      var body;
      var content_type;
      if (arguments.length == 1) {
        name = arguments[0];
      } else if (arguments.length == 2) {
        name = arguments[0];
        body = arguments[1];
      } else if (arguments.length >= 3) {
        name = arguments[0];
        body = arguments[1];
        content_type = arguments[2];
      }
      var origbody = body;
      if (typeof body == "undefined") {
      } else if (!Buffer.isBuffer(body)) {
        body = Buffer.from(JSON.stringify(body), "utf8");
        content_type = content_type || "application/json";
      } else {
        throw new Error("missing content_type");
      }
      let header = "MOO/1 COMPLETE " + name + "\nRequest-Id: " + this.msg.request_id + "\n";
      if (body) {
        header += "Content-Length: " + body.length + "\nContent-Type: " + content_type + "\n";
      }
      if (this.msg.log) this.moo.logger.log("-> COMPLETE", this.msg.request_id, name, origbody ? JSON.stringify(origbody) : "");
      const m = Buffer.from(header + "\n");
      if (body)
        this.moo.transport.send(Buffer.concat([m, body], m.length + body.length));
      else
        this.moo.transport.send(m);
    };
    exports2 = module2.exports = MooMessage;
  }
});

// node_modules/node-roon-api/core.js
var require_core = __commonJS({
  "node_modules/node-roon-api/core.js"(exports2, module2) {
    "use strict";
    function Core(moo, roon, registration) {
      this.moo = moo;
      this.core_id = registration.core_id;
      this.display_name = registration.display_name;
      this.display_version = registration.display_version;
      this.registration = registration;
      this.services = {};
      var svcs = {};
      roon.services_opts.required_services.forEach((svcobj) => svcobj.services.forEach((svc) => svcs[svc.name] = svcobj));
      roon.services_opts.optional_services.forEach((svcobj) => svcobj.services.forEach((svc) => svcs[svc.name] = svcobj));
      registration.provided_services.forEach((e) => {
        this.services[svcs[e].name] = new svcs[e](this);
      });
    }
    __name(Core, "Core");
    exports2 = module2.exports = Core;
  }
});

// node_modules/node-uuid/uuid.js
var require_uuid = __commonJS({
  "node_modules/node-uuid/uuid.js"(exports2, module2) {
    (function(_window) {
      "use strict";
      var _rng, _mathRNG, _nodeRNG, _whatwgRNG, _previousRoot;
      function setupBrowser() {
        var _crypto = _window.crypto || _window.msCrypto;
        if (!_rng && _crypto && _crypto.getRandomValues) {
          try {
            var _rnds8 = new Uint8Array(16);
            _whatwgRNG = _rng = /* @__PURE__ */ __name(function whatwgRNG() {
              _crypto.getRandomValues(_rnds8);
              return _rnds8;
            }, "whatwgRNG");
            _rng();
          } catch (e) {
          }
        }
        if (!_rng) {
          var _rnds = new Array(16);
          _mathRNG = _rng = /* @__PURE__ */ __name(function() {
            for (var i2 = 0, r; i2 < 16; i2++) {
              if ((i2 & 3) === 0) {
                r = Math.random() * 4294967296;
              }
              _rnds[i2] = r >>> ((i2 & 3) << 3) & 255;
            }
            return _rnds;
          }, "_rng");
          if ("undefined" !== typeof console && console.warn) {
            console.warn("[SECURITY] node-uuid: crypto not usable, falling back to insecure Math.random()");
          }
        }
      }
      __name(setupBrowser, "setupBrowser");
      function setupNode() {
        if ("function" === typeof require) {
          try {
            var _rb = require("crypto").randomBytes;
            _nodeRNG = _rng = _rb && function() {
              return _rb(16);
            };
            _rng();
          } catch (e) {
          }
        }
      }
      __name(setupNode, "setupNode");
      if (_window) {
        setupBrowser();
      } else {
        setupNode();
      }
      var BufferClass = "function" === typeof Buffer ? Buffer : Array;
      var _byteToHex = [];
      var _hexToByte = {};
      for (var i = 0; i < 256; i++) {
        _byteToHex[i] = (i + 256).toString(16).substr(1);
        _hexToByte[_byteToHex[i]] = i;
      }
      function parse(s, buf, offset) {
        var i2 = buf && offset || 0, ii = 0;
        buf = buf || [];
        s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
          if (ii < 16) {
            buf[i2 + ii++] = _hexToByte[oct];
          }
        });
        while (ii < 16) {
          buf[i2 + ii++] = 0;
        }
        return buf;
      }
      __name(parse, "parse");
      function unparse(buf, offset) {
        var i2 = offset || 0, bth = _byteToHex;
        return bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]] + "-" + bth[buf[i2++]] + bth[buf[i2++]] + "-" + bth[buf[i2++]] + bth[buf[i2++]] + "-" + bth[buf[i2++]] + bth[buf[i2++]] + "-" + bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]] + bth[buf[i2++]];
      }
      __name(unparse, "unparse");
      var _seedBytes = _rng();
      var _nodeId = [
        _seedBytes[0] | 1,
        _seedBytes[1],
        _seedBytes[2],
        _seedBytes[3],
        _seedBytes[4],
        _seedBytes[5]
      ];
      var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 16383;
      var _lastMSecs = 0, _lastNSecs = 0;
      function v1(options, buf, offset) {
        var i2 = buf && offset || 0;
        var b = buf || [];
        options = options || {};
        var clockseq = options.clockseq != null ? options.clockseq : _clockseq;
        var msecs = options.msecs != null ? options.msecs : (/* @__PURE__ */ new Date()).getTime();
        var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;
        var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
        if (dt < 0 && options.clockseq == null) {
          clockseq = clockseq + 1 & 16383;
        }
        if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
          nsecs = 0;
        }
        if (nsecs >= 1e4) {
          throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
        }
        _lastMSecs = msecs;
        _lastNSecs = nsecs;
        _clockseq = clockseq;
        msecs += 122192928e5;
        var tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
        b[i2++] = tl >>> 24 & 255;
        b[i2++] = tl >>> 16 & 255;
        b[i2++] = tl >>> 8 & 255;
        b[i2++] = tl & 255;
        var tmh = msecs / 4294967296 * 1e4 & 268435455;
        b[i2++] = tmh >>> 8 & 255;
        b[i2++] = tmh & 255;
        b[i2++] = tmh >>> 24 & 15 | 16;
        b[i2++] = tmh >>> 16 & 255;
        b[i2++] = clockseq >>> 8 | 128;
        b[i2++] = clockseq & 255;
        var node = options.node || _nodeId;
        for (var n = 0; n < 6; n++) {
          b[i2 + n] = node[n];
        }
        return buf ? buf : unparse(b);
      }
      __name(v1, "v1");
      function v4(options, buf, offset) {
        var i2 = buf && offset || 0;
        if (typeof options === "string") {
          buf = options === "binary" ? new BufferClass(16) : null;
          options = null;
        }
        options = options || {};
        var rnds = options.random || (options.rng || _rng)();
        rnds[6] = rnds[6] & 15 | 64;
        rnds[8] = rnds[8] & 63 | 128;
        if (buf) {
          for (var ii = 0; ii < 16; ii++) {
            buf[i2 + ii] = rnds[ii];
          }
        }
        return buf || unparse(rnds);
      }
      __name(v4, "v4");
      var uuid = v4;
      uuid.v1 = v1;
      uuid.v4 = v4;
      uuid.parse = parse;
      uuid.unparse = unparse;
      uuid.BufferClass = BufferClass;
      uuid._rng = _rng;
      uuid._mathRNG = _mathRNG;
      uuid._nodeRNG = _nodeRNG;
      uuid._whatwgRNG = _whatwgRNG;
      if ("undefined" !== typeof module2 && module2.exports) {
        module2.exports = uuid;
      } else if (typeof define === "function" && define.amd) {
        define(function() {
          return uuid;
        });
      } else {
        _previousRoot = _window.uuid;
        uuid.noConflict = function() {
          _window.uuid = _previousRoot;
          return uuid;
        };
        _window.uuid = uuid;
      }
    })("undefined" !== typeof window ? window : null);
  }
});

// node_modules/node-roon-api/sood.js
var require_sood = __commonJS({
  "node_modules/node-roon-api/sood.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var events = require("events");
    var dgram = require("dgram");
    var uuid = require_uuid();
    var os2 = require("os");
    function getBroadcastAddress(ip, netmask) {
      const ipParts = ip.split(".").map(Number);
      const maskParts = netmask.split(".").map(Number);
      return ipParts.map((octet, i) => octet | ~maskParts[i] & 255).join(".");
    }
    __name(getBroadcastAddress, "getBroadcastAddress");
    var SOOD_PORT = 9003;
    var SOOD_MULTICAST_IP = "239.255.90.90";
    function Sood(logger) {
      this._multicast = {};
      this._unicast = {};
      this._iface_seq = 0;
      this.logger = logger;
      this.interface_timer = 0;
    }
    __name(Sood, "Sood");
    util.inherits(Sood, events.EventEmitter);
    function _parse(buf, minfo) {
      var msg = {
        from: {
          ip: minfo.address,
          port: minfo.port
        },
        type: null,
        props: {}
      };
      try {
        if (buf.toString("utf8", 0, 4) != "SOOD") return null;
        if (buf[4] != 2) return null;
        msg.type = buf.toString("utf8", 5, 6);
        let pos = 6;
        while (pos < buf.length) {
          let len = buf[pos++];
          if (len == 0) return null;
          if (pos + len > buf.length) return null;
          let name = buf.toString("utf8", pos, pos + len);
          pos += len;
          len = buf[pos++] << 8;
          len |= buf[pos++];
          let val;
          if (len == 65535)
            val = null;
          else if (len == 0)
            val = "";
          else {
            if (pos + len > buf.length) return null;
            val = buf.toString("utf8", pos, pos + len);
            pos += len;
          }
          msg.props[name] = val;
        }
        if (msg.props["_replyaddr"]) {
          msg.from.ip = msg.props["_replyaddr"];
          delete msg.props["_replyaddr"];
        }
        if (msg.props["_replyport"]) {
          msg.from.port = msg.props["_replyport"];
          delete msg.props["_replyport"];
        }
        return msg;
      } catch (e) {
        return null;
      }
    }
    __name(_parse, "_parse");
    Sood.prototype.query = function(msg) {
      if (!msg["_tid"]) {
        msg["_tid"] = uuid.v4();
      }
      var buf = new Buffer(65535);
      buf.write("SOOD");
      buf[4] = 2;
      buf.write("Q", 5);
      let pos = 6;
      for (var n in msg) {
        let namelen = buf.write(n, pos + 1);
        buf[pos++] = namelen;
        pos += namelen;
        if (msg === void 0 || msg === null) {
          buf[pos++] = 255;
          buf[pos++] = 255;
        } else {
          namelen = buf.write(msg[n], pos + 2);
          buf[pos++] = namelen >> 8;
          buf[pos++] = namelen & 255;
          pos += namelen;
        }
      }
      for (var ip in this._multicast) {
        if (this._multicast[ip].send_sock) {
          this._multicast[ip].send_sock.send(buf, 0, pos, SOOD_PORT, SOOD_MULTICAST_IP);
          this._multicast[ip].send_sock.send(buf, 0, pos, SOOD_PORT, this._multicast[ip].broadcast);
        }
      }
      if (this._unicast.send_sock) {
        this._unicast.send_sock.send(buf, 0, pos, SOOD_PORT, SOOD_MULTICAST_IP);
      }
    };
    Sood.prototype.initsocket = function(cb) {
      this._iface_seq += 1;
      let list = os2.networkInterfaces();
      var iface_change = false;
      for (var iface in list) {
        list[iface].forEach((e) => {
          if (e.family == "IPv4")
            iface_change = this._listen_iface(e.address, e.netmask, iface) || iface_change;
        });
      }
      for (var ip in this._multicast) {
        if (this._multicast[ip].seq != this._iface_seq) {
          delete this._multicast[ip];
          iface_change = true;
        }
      }
      let unicast = this._unicast;
      if (!unicast.send_sock) {
        unicast.send_sock = dgram.createSocket({ type: "udp4" });
        unicast.send_sock.on("error", (err) => {
          unicast.send_sock.close();
        });
        unicast.send_sock.on("close", () => {
          delete unicast.send_sock;
        });
        unicast.send_sock.on("message", (msg, rinfo) => {
          msg = _parse(msg, rinfo);
          if (msg) this.emit("message", msg);
        });
        unicast.send_sock.bind({ port: 0 }, () => {
          unicast.send_sock.setBroadcast(true);
          unicast.send_sock.setMulticastTTL(1);
        });
      }
      if (cb) setTimeout(cb, 200);
      if (iface_change) this.emit("network");
    };
    Sood.prototype.start = function(cb) {
      if (!this.interface_timer) this.interface_timer = setInterval(() => this.initsocket(), 5e3);
      this.initsocket(cb);
    };
    Sood.prototype.stop = function() {
      if (this.interface_timer) clearInterval(this.interface_timer);
      for (const ip in this._multicast) {
        try {
          this._multicast[ip].recv_sock.close();
        } catch (e) {
        }
        try {
          this._multicast[ip].send_sock.close();
        } catch (e) {
        }
      }
      try {
        this._unicast.send_sock.close();
      } catch (e) {
      }
    };
    Sood.prototype._listen_iface = function(ip, netmask, ifacename) {
      if (!ip) return false;
      let iface = this._multicast[ip] = this._multicast[ip] || {};
      iface.seq = this._iface_seq;
      let new_iface = false;
      if (!iface.recv_sock) {
        new_iface = true;
        iface.recv_sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
        iface.recv_sock.on("error", (err) => {
          iface.recv_sock.close();
        });
        iface.recv_sock.on("close", () => {
          delete iface.recv_sock;
        });
        iface.recv_sock.on("message", (msg, rinfo) => {
          msg = _parse(msg, rinfo);
          if (msg) this.emit("message", msg);
        });
        iface.recv_sock.bind({ port: SOOD_PORT }, () => {
          iface.recv_sock.addMembership(SOOD_MULTICAST_IP, ip);
        });
      }
      if (!iface.send_sock) {
        new_iface = true;
        iface.send_sock = dgram.createSocket({ type: "udp4" });
        iface.broadcast = getBroadcastAddress(ip, netmask);
        iface.send_sock.on("error", (err) => {
          iface.send_sock.close();
        });
        iface.send_sock.on("close", () => {
          delete iface.send_sock;
        });
        iface.send_sock.on("message", (msg, rinfo) => {
          msg = _parse(msg, rinfo);
          if (msg) this.emit("message", msg);
        });
        iface.send_sock.bind({ port: 0, address: ip }, () => {
          iface.send_sock.setBroadcast(true);
          iface.send_sock.setMulticastTTL(1);
        });
      }
      return new_iface;
    };
    exports2 = module2.exports = function(logger) {
      return new Sood(logger);
    };
  }
});

// node_modules/node-roon-api/lib.js
var require_lib = __commonJS({
  "node_modules/node-roon-api/lib.js"(exports2, module2) {
    "use strict";
    var WSTransport = require_transport_websocket();
    var Moo = require_moo();
    var MooMessage = require_moomsg();
    var Core = require_core();
    var os2 = require("os");
    function Logger(roonapi) {
      this.roonapi = roonapi;
    }
    __name(Logger, "Logger");
    Logger.prototype.log = function() {
      if (this.roonapi.log_level != "none") {
        console.log.apply(null, arguments);
      }
    };
    function RoonApi(o) {
      this._service_request_handlers = {};
      if (typeof o.extension_id != "string") throw new Error("Roon Extension options is missing the required 'extension_id' property.");
      if (typeof o.display_name != "string") throw new Error("Roon Extension options is missing the required 'display_name' property.");
      if (typeof o.display_version != "string") throw new Error("Roon Extension options is missing the required 'display_version' property.");
      if (typeof o.publisher != "string") throw new Error("Roon Extension options is missing the required 'publisher' property.");
      if (typeof o.email != "string") throw new Error("Roon Extension options is missing the required 'email' property.");
      if (typeof o.set_persisted_state == "undefined")
        this.set_persisted_state = (state) => {
          this.save_config("roonstate", state);
        };
      else
        this.set_persisted_state = o.set_persisted_state;
      if (typeof o.get_persisted_state == "undefined")
        this.get_persisted_state = () => {
          return this.load_config("roonstate") || {};
        };
      else
        this.get_persisted_state = o.get_persisted_state;
      if (o.core_found && !o.core_lost) throw new Error("Roon Extension options .core_lost is required if you implement .core_found.");
      if (!o.core_found && o.core_lost) throw new Error("Roon Extension options .core_found is required if you implement .core_lost.");
      if (o.core_paired && !o.core_unpaired) throw new Error("Roon Extension options .core_unpaired is required if you implement .core_paired.");
      if (!o.core_paired && o.core_unpaired) throw new Error("Roon Extension options .core_paired is required if you implement .core_unpaired.");
      if (o.core_paired && o.core_found) throw new Error("Roon Extension options can not specify both .core_paired and .core_found.");
      if (o.core_found && typeof o.core_found != "function") throw new Error("Roon Extensions options has a .core_found which is not a function");
      if (o.core_lost && typeof o.core_lost != "function") throw new Error("Roon Extensions options has a .core_lost which is not a function");
      if (o.core_paired && typeof o.core_paired != "function") throw new Error("Roon Extensions options has a .core_paired which is not a function");
      if (o.core_unpaired && typeof o.core_unpaired != "function") throw new Error("Roon Extensions options has a .core_unpaired which is not a function");
      if (o.moo_onerror && typeof o.moo_onerror != "function") throw new Error("Roon Extensions options has a .moo_onerror which is not a function");
      this.extension_reginfo = {
        extension_id: o.extension_id,
        display_name: o.display_name,
        display_version: o.display_version,
        publisher: o.publisher,
        email: o.email,
        required_services: [],
        optional_services: [],
        provided_services: []
      };
      if (o.website) this.extension_reginfo.website = o.website;
      this.logger = new Logger(this);
      this.log_level = o.log_level;
      this.extension_opts = o;
      this.is_paired = false;
      this.scan_count = -1;
      this.scanIntervalId = 0;
      if (o.force_server || typeof window == "undefined" || typeof nw !== "undefined") {
        RoonApi.prototype.start_discovery = function() {
          if (this._sood) {
            if (this.scanIntervalId) {
              return;
            }
          } else {
            this.logger.log("Setting up sood");
            this._sood = require_sood()(this.logger);
            this._sood_conns = {};
            this._sood.on("message", (msg) => {
              if (msg.props.service_id === "00720724-5143-4a9b-abac-0e50cba674bb" && msg.props.unique_id) {
                if (this._sood_conns[msg.props.unique_id]) {
                  return;
                }
                let ip = msg.from.ip;
                let ni = os2.networkInterfaces();
                for (let prot in ni) {
                  for (let addr of ni[prot]) {
                    if (ip === addr.address) {
                      ip = "127.0.0.1";
                      break;
                    }
                  }
                }
                this._sood_conns[msg.props.unique_id] = this.ws_connect({
                  host: ip,
                  port: msg.props.http_port,
                  onclose: /* @__PURE__ */ __name(() => {
                    delete this._sood_conns[msg.props.unique_id];
                  }, "onclose"),
                  onerror: /* @__PURE__ */ __name((moo) => {
                    if (this.extension_opts.moo_onerror) this.extension_opts.moo_onerror(moo);
                  }, "onerror")
                });
              }
            });
            this._sood.on("network", () => {
              this._sood.query({ query_service_id: "00720724-5143-4a9b-abac-0e50cba674bb" });
            });
          }
          this.logger.log("Starting sood");
          this._sood.start(() => {
            this._sood.query({ query_service_id: "00720724-5143-4a9b-abac-0e50cba674bb" });
            this.scanIntervalId = setInterval(() => this.periodic_scan(), 10 * 1e3);
            this.scan_count = -1;
          });
        };
        RoonApi.prototype.stop_discovery = function() {
          if (this.scanIntervalId) {
            clearInterval(this.scanIntervalId);
            this.scanIntervalId = 0;
          }
          if (this._sood) {
            this._sood.stop();
          }
        };
        RoonApi.prototype.disconnect_all = function() {
          if (this._sood_conns) {
            Object.entries(this._sood_conns).forEach(([id, conn]) => {
              this.logger.log("Closing Roon connection: %s", id);
              conn.transport.close();
            });
          }
        };
        RoonApi.prototype.periodic_scan = function() {
          this.scan_count += 1;
          if (this.is_paired) return;
          if (this.scan_count < 6 || this.scan_count % 6 == 0) {
            this._sood.query({ query_service_id: "00720724-5143-4a9b-abac-0e50cba674bb" });
          }
        };
        var fs2 = typeof _fs === "undefined" ? require("fs") : _fs;
        RoonApi.prototype.save_config = function(k, v) {
          try {
            let config;
            try {
              let content = fs2.readFileSync("config.json", { encoding: "utf8" });
              config = JSON.parse(content) || {};
            } catch (e) {
              config = {};
            }
            if (v === void 0 || v === null)
              delete config[k];
            else
              config[k] = v;
            fs2.writeFileSync("config.json", JSON.stringify(config, null, "    "));
          } catch (e) {
          }
        };
        RoonApi.prototype.load_config = function(k) {
          try {
            let content = fs2.readFileSync("config.json", { encoding: "utf8" });
            return JSON.parse(content)[k];
          } catch (e) {
            return void 0;
          }
        };
      } else {
        RoonApi.prototype.save_config = function(k, v) {
          if (v === void 0 || v === null)
            localStorage.removeItem(k);
          else
            localStorage.setItem(k, JSON.stringify(v));
        };
        RoonApi.prototype.load_config = function(k) {
          try {
            let r = localStorage.getItem(k);
            return r ? JSON.parse(r) : void 0;
          } catch (e) {
            return void 0;
          }
        };
      }
    }
    __name(RoonApi, "RoonApi");
    RoonApi.prototype.init_services = function(o) {
      if (!(o.required_services instanceof Array)) o.required_services = [];
      if (!(o.optional_services instanceof Array)) o.optional_services = [];
      if (!(o.provided_services instanceof Array)) o.provided_services = [];
      if (o.required_services.length || o.optional_services.length) {
        if (!this.extension_opts.core_paired && !this.extension_opts.core_found) throw new Error("Roon Extensions options has required or optional services, but has neither .core_paired nor .core_found.");
      }
      if (this.extension_opts.core_paired) {
        let svc = this.register_service("com.roonlabs.pairing:1", {
          subscriptions: [
            {
              subscribe_name: "subscribe_pairing",
              unsubscribe_name: "unsubscribe_pairing",
              start: /* @__PURE__ */ __name((req) => {
                req.send_continue("Subscribed", { paired_core_id: this.paired_core_id });
              }, "start")
            }
          ],
          methods: {
            get_pairing: /* @__PURE__ */ __name((req) => {
              req.send_complete("Success", { paired_core_id: this.paired_core_id });
            }, "get_pairing"),
            pair: /* @__PURE__ */ __name((req) => {
              if (this.paired_core_id != req.moo.core.core_id) {
                if (this.paired_core) {
                  this.pairing_service_1.lost_core(this.paired_core);
                  delete this.paired_core_id;
                  delete this.paired_core;
                }
                this.pairing_service_1.found_core(req.moo.core);
              }
            }, "pair")
          }
        });
        this.pairing_service_1 = {
          services: [svc],
          found_core: /* @__PURE__ */ __name((core) => {
            if (!this.paired_core_id) {
              let settings = this.get_persisted_state();
              settings.paired_core_id = core.core_id;
              this.set_persisted_state(settings);
              this.paired_core_id = core.core_id;
              this.paired_core = core;
              this.is_paired = true;
              svc.send_continue_all("subscribe_pairing", "Changed", { paired_core_id: this.paired_core_id });
            }
            if (core.core_id == this.paired_core_id) {
              if (this.extension_opts.core_paired) this.extension_opts.core_paired(core);
            }
          }, "found_core"),
          lost_core: /* @__PURE__ */ __name((core) => {
            if (core.core_id == this.paired_core_id)
              this.is_paired = false;
            if (this.extension_opts.core_unpaired) this.extension_opts.core_unpaired(core);
          }, "lost_core")
        };
        o.provided_services.push(this.pairing_service_1);
      }
      o.provided_services.push({ services: [this.register_service("com.roonlabs.ping:1", {
        methods: {
          ping: /* @__PURE__ */ __name(function(req) {
            req.send_complete("Success");
          }, "ping")
        }
      })] });
      o.required_services.forEach((svcobj) => {
        svcobj.services.forEach((svc) => {
          this.extension_reginfo.required_services.push(svc.name);
        });
      });
      o.optional_services.forEach((svcobj) => {
        svcobj.services.forEach((svc) => {
          this.extension_reginfo.optional_services.push(svc.name);
        });
      });
      o.provided_services.forEach((svcobj) => {
        svcobj.services.forEach((svc) => {
          this.extension_reginfo.provided_services.push(svc.name);
        });
      });
      this.services_opts = o;
    };
    RoonApi.prototype.register_service = function(svcname, spec) {
      let ret = {
        _subtypes: {}
      };
      if (spec.subscriptions) {
        for (let x in spec.subscriptions) {
          let s = spec.subscriptions[x];
          let subname = s.subscribe_name;
          ret._subtypes[subname] = {};
          spec.methods[subname] = (req) => {
            req.orig_send_complete = req.send_complete;
            req.send_complete = function() {
              this.orig_send_complete.apply(this, arguments);
              delete ret._subtypes[subname][req.moo.mooid][this.body.subscription_key];
            };
            s.start(req);
            if (!ret._subtypes[subname].hasOwnProperty(req.moo.mooid)) {
              ret._subtypes[subname][req.moo.mooid] = {};
            }
            ret._subtypes[subname][req.moo.mooid][req.body.subscription_key] = req;
          };
          spec.methods[s.unsubscribe_name] = (req) => {
            delete ret._subtypes[subname][req.moo.mooid][req.body.subscription_key];
            if (s.end) s.end(req);
            req.send_complete("Unsubscribed");
          };
        }
      }
      this._service_request_handlers[svcname] = (req, mooid) => {
        if (req) {
          let method = spec.methods[req.msg.name];
          if (method) {
            method(req);
          } else {
            req.send_complete("InvalidRequest", { error: "unknown request name (" + svcname + ") : " + req.msg.name });
          }
        } else {
          if (spec.subscriptions) {
            for (let x in spec.subscriptions) {
              let s = spec.subscriptions[x];
              let subname = s.subscribe_name;
              delete ret._subtypes[subname][mooid];
              if (s.end) s.end(req);
            }
          }
        }
      };
      ret.name = svcname;
      ret.send_continue_all = (subtype, name, props) => {
        for (let id in ret._subtypes[subtype]) {
          for (let x in ret._subtypes[subtype][id]) ret._subtypes[subtype][id][x].send_continue(name, props);
        }
      };
      ret.send_complete_all = (subtype, name, props) => {
        for (let id in ret._subtypes[subtype]) {
          for (let x in ret._subtypes[subtype][id]) ret._subtypes[subtype][id][x].send_complete(name, props);
        }
      };
      return ret;
    };
    RoonApi.prototype.ws_connect = function({ host, port, onclose, onerror }) {
      let moo = new Moo(new WSTransport(host, port, this.logger));
      moo.transport.onopen = () => {
        moo.send_request(
          "com.roonlabs.registry:1/info",
          (msg, body) => {
            if (!msg) return;
            let s = this.get_persisted_state();
            if (s.tokens && s.tokens[body.core_id]) this.extension_reginfo.token = s.tokens[body.core_id];
            moo.send_request(
              "com.roonlabs.registry:1/register",
              this.extension_reginfo,
              (msg2, body2) => {
                ev_registered.call(this, moo, msg2, body2);
              }
            );
          }
        );
      };
      moo.transport.onclose = () => {
        Object.keys(this._service_request_handlers).forEach((e) => this._service_request_handlers[e] && this._service_request_handlers[e](null, moo.mooid));
        moo.clean_up();
        onclose && onclose();
        onclose = void 0;
      };
      moo.transport.onerror = (err) => {
        this.logger.log("ERROR", err);
        onerror && onerror(moo);
      };
      moo.transport.onmessage = (msg) => {
        var body = msg.body;
        delete msg.body;
        var logging = msg && msg.headers && msg.headers["Logging"];
        msg.log = this.log_level == "all" || logging != "quiet";
        if (msg.verb == "REQUEST") {
          if (msg.log) this.logger.log("<-", msg.verb, msg.request_id, msg.service + "/" + msg.name, body ? JSON.stringify(body) : "");
          var req = new MooMessage(moo, msg, body, this.logger);
          var handler = this._service_request_handlers[msg.service];
          if (handler)
            handler(req, req.moo.mooid);
          else
            req.send_complete("InvalidRequest", { error: "unknown service: " + msg.service });
        } else {
          if (msg.log) this.logger.log("<-", msg.verb, msg.request_id, msg.name, body ? JSON.stringify(body) : "");
          if (!moo.handle_response(msg, body)) {
            moo.transport.close();
          }
        }
      };
      return moo;
    };
    RoonApi.prototype.ws_connect_with_token = function({ host, port, token, onclose }) {
      var moo = this.ws_connect({ host, port, onclose });
      moo.transport.onopen = () => {
        let args = Object.assign({}, this.extension_reginfo);
        args.token = token;
        moo.send_request(
          "com.roonlabs.registry:1/register_one_time_token",
          args,
          (msg, body) => {
            ev_registered.call(this, moo, msg, body);
          }
        );
      };
      return moo;
    };
    function ev_registered(moo, msg, body) {
      if (!msg) {
        if (moo.core) {
          if (this.pairing_service_1) this.pairing_service_1.lost_core(moo.core);
          if (this.extension_opts.core_lost) this.extension_opts.core_lost(moo.core);
          moo.core = void 0;
        }
      } else if (msg.name == "Registered") {
        moo.core = new Core(moo, this, body, this.logger);
        let settings = this.get_persisted_state();
        if (!settings.tokens) settings.tokens = {};
        settings.tokens[body.core_id] = body.token;
        this.set_persisted_state(settings);
        if (this.pairing_service_1) this.pairing_service_1.found_core(moo.core);
        if (this.extension_opts.core_found) this.extension_opts.core_found(moo.core);
      }
    }
    __name(ev_registered, "ev_registered");
    exports2 = module2.exports = RoonApi;
  }
});

// node_modules/node-roon-api-transport/lib.js
var require_lib2 = __commonJS({
  "node_modules/node-roon-api-transport/lib.js"(exports2, module2) {
    "use strict";
    var SVCNAME = "com.roonlabs.transport:2";
    function oid(o) {
      if (typeof o == "string") return o;
      return o.output_id;
    }
    __name(oid, "oid");
    function zoid(zo) {
      if (typeof zo == "string") return zo;
      if (zo.output_id) return zo.output_id;
      return zo.zone_id;
    }
    __name(zoid, "zoid");
    function RoonApiTransport(core) {
      this.core = core;
      this._queues = {};
    }
    __name(RoonApiTransport, "RoonApiTransport");
    RoonApiTransport.services = [{ name: SVCNAME }];
    RoonApiTransport.prototype.mute_all = function(how, cb) {
      this.core.moo.send_request(
        SVCNAME + "/mute_all",
        {
          how
        },
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.pause_all = function(cb) {
      this.core.moo.send_request(
        SVCNAME + "/pause_all",
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.standby = function(o, opts, cb) {
      if (!o) {
        if (cb) cb(false);
        return;
      }
      opts = Object.assign({ output_id: oid(o) }, opts);
      this.core.moo.send_request(
        SVCNAME + "/standby",
        opts,
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.toggle_standby = function(o, opts, cb) {
      if (!o) {
        if (cb) cb(false);
        return;
      }
      opts = Object.assign({ output_id: oid(o) }, opts);
      this.core.moo.send_request(
        SVCNAME + "/toggle_standby",
        opts,
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.convenience_switch = function(o, opts, cb) {
      if (!o) {
        if (cb) cb(false);
        return;
      }
      opts = Object.assign({ output_id: oid(o) }, opts);
      this.core.moo.send_request(
        SVCNAME + "/convenience_switch",
        opts,
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.mute = function(output, how, cb) {
      if (!output) {
        if (cb) cb(false);
        return;
      }
      this.core.moo.send_request(
        SVCNAME + "/mute",
        {
          output_id: oid(output),
          how
        },
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.change_volume = function(output, how, value, cb) {
      if (!output) {
        if (cb) cb(false);
        return;
      }
      this.core.moo.send_request(
        SVCNAME + "/change_volume",
        {
          output_id: oid(output),
          how,
          value
        },
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.seek = function(z, how, seconds, cb) {
      if (!z) {
        if (cb) cb(false);
        return;
      }
      this.core.moo.send_request(
        SVCNAME + "/seek",
        {
          zone_or_output_id: zoid(z),
          how,
          seconds
        },
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.control = function(z, control, cb) {
      if (!z) {
        if (cb) cb(false);
        return;
      }
      this.core.moo.send_request(
        SVCNAME + "/control",
        {
          zone_or_output_id: zoid(z),
          control
        },
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.transfer_zone = function(fromz, toz, cb) {
      if (!fromz || !toz) {
        if (cb) cb(false);
        return;
      }
      this.core.moo.send_request(
        SVCNAME + "/transfer_zone",
        {
          from_zone_or_output_id: zoid(fromz),
          to_zone_or_output_id: zoid(toz)
        },
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.group_outputs = function(outputs, cb) {
      if (!outputs) {
        if (cb) cb(false);
        return;
      }
      this.core.moo.send_request(
        SVCNAME + "/group_outputs",
        {
          output_ids: outputs.reduce((p, e) => p.push(oid(e)) && p, [])
        },
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.ungroup_outputs = function(outputs, cb) {
      if (!outputs) {
        if (cb) cb(false);
        return;
      }
      this.core.moo.send_request(
        SVCNAME + "/ungroup_outputs",
        {
          output_ids: outputs.reduce((p, e) => p.push(oid(e)) && p, [])
        },
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.change_settings = function(z, settings, cb) {
      if (!z) {
        if (cb) cb(false);
        return;
      }
      settings = Object.assign({ zone_or_output_id: zoid(z) }, settings);
      this.core.moo.send_request(
        SVCNAME + "/change_settings",
        settings,
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError");
        }
      );
    };
    RoonApiTransport.prototype.get_zones = function(cb) {
      this.core.moo.send_request(
        SVCNAME + "/get_zones",
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError", body);
        }
      );
    };
    RoonApiTransport.prototype.get_outputs = function(cb) {
      this.core.moo.send_request(
        SVCNAME + "/get_outputs",
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError", body);
        }
      );
    };
    RoonApiTransport.prototype.subscribe_outputs = function(cb) {
      this.core.moo._subscribe_helper(SVCNAME, "outputs", cb);
    };
    RoonApiTransport.prototype.subscribe_zones = function(cb) {
      this.core.moo._subscribe_helper(
        SVCNAME,
        "zones",
        (response, msg) => {
          if (response == "Subscribed") {
            this._zones = msg.zones.reduce((p, e) => (p[e.zone_id] = e) && p, {});
          } else if (response == "Changed") {
            if (msg.zones_removed) msg.zones_removed.forEach((zone_id) => delete this._zones[zone_id]);
            if (msg.zones_added) msg.zones_added.forEach((e) => this._zones[e.zone_id] = e);
            if (msg.zones_changed) msg.zones_changed.forEach((e) => this._zones[e.zone_id] = e);
            if (msg.zones_seek_changed) msg.zones_seek_changed.forEach((e) => {
              let zone = this._zones[e.zone_id];
              if (zone == void 0) return;
              if (zone.now_playing != void 0) zone.now_playing.seek_position = e.seek_position;
              zone.queue_time_remaining = e.queue_time_remaining;
            });
          } else if (response == "Unsubscribed") {
            delete this._zones;
          }
          cb(response, msg);
        }
      );
    };
    RoonApiTransport.prototype.subscribe_queue = function(zone_or_output, max_item_count, cb) {
      var zone_or_output_id = zoid(zone_or_output);
      return this.core.moo._subscribe_helper(
        SVCNAME,
        "queue",
        {
          zone_or_output_id,
          max_item_count
        },
        (response, msg) => {
          cb(response, msg);
        }
      );
    };
    RoonApiTransport.prototype.play_from_here = function(zone_or_output, queue_item_id, cb) {
      var zone_or_output_id = zoid(zone_or_output);
      var req_args = {
        zone_or_output_id,
        queue_item_id
      };
      this.core.moo.send_request(
        SVCNAME + "/play_from_here",
        req_args,
        (msg, body) => {
          if (cb)
            cb(msg, body);
        }
      );
    };
    RoonApiTransport.prototype.zone_by_zone_id = function(zone_id) {
      if (!this._zones) return null;
      for (var x in this._zones) if (x == zone_id) return this._zones[x];
      return null;
    };
    RoonApiTransport.prototype.zone_by_output_id = function(output_id) {
      if (!this._zones) return null;
      for (var x in this._zones) for (var y in this._zones[x].outputs) if (this._zones[x].outputs[y].output_id == output_id) return this._zones[x];
      return null;
    };
    RoonApiTransport.prototype.zone_by_object = function(zone_or_output) {
      if (zone_or_output.zone_id) return this.zone_by_zone_id(zone_or_output.zone_id);
      if (zone_or_output.output_id) return this.zone_by_output_id(zone_or_output.output_id);
      return null;
    };
    exports2 = module2.exports = RoonApiTransport;
  }
});

// node_modules/node-roon-api-browse/lib.js
var require_lib3 = __commonJS({
  "node_modules/node-roon-api-browse/lib.js"(exports2, module2) {
    "use strict";
    var SVCNAME = "com.roonlabs.browse:1";
    function RoonApiBrowse(core) {
      this.core = core;
    }
    __name(RoonApiBrowse, "RoonApiBrowse");
    RoonApiBrowse.services = [{ name: SVCNAME }];
    RoonApiBrowse.prototype.browse = function(opts, cb) {
      this.core.moo.send_request(
        SVCNAME + "/browse",
        opts,
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError", body);
        }
      );
    };
    RoonApiBrowse.prototype.load = function(opts, cb) {
      this.core.moo.send_request(
        SVCNAME + "/load",
        opts,
        (msg, body) => {
          if (cb)
            cb(msg && msg.name == "Success" ? false : msg ? msg.name : "NetworkError", body);
        }
      );
    };
    exports2 = module2.exports = RoonApiBrowse;
  }
});

// node_modules/node-roon-api-image/lib.js
var require_lib4 = __commonJS({
  "node_modules/node-roon-api-image/lib.js"(exports2, module2) {
    "use strict";
    var SVCNAME = "com.roonlabs.image:1";
    function RoonApiImage(core) {
      this.core = core;
    }
    __name(RoonApiImage, "RoonApiImage");
    RoonApiImage.services = [{ name: SVCNAME }];
    RoonApiImage.prototype.get_image = function() {
      var i = 0;
      let image_key = arguments[i++];
      let opts = {};
      if (typeof arguments[i] != "function") opts = arguments[i++];
      let cb = arguments[i++];
      opts = Object.assign({ image_key }, opts);
      this.core.moo.send_request(
        SVCNAME + "/get_image",
        opts,
        (msg, body) => {
          if (msg && msg.name == "Success") cb(false, msg.content_type, body);
          else cb(msg ? msg.name : "NetworkError");
        }
      );
    };
    exports2 = module2.exports = RoonApiImage;
  }
});

// node_modules/node-roon-api-status/lib.js
var require_lib5 = __commonJS({
  "node_modules/node-roon-api-status/lib.js"(exports2, module2) {
    "use strict";
    function RoonApiStatus(roon, opts) {
      this._svc = roon.register_service("com.roonlabs.status:1", {
        subscriptions: [
          {
            subscribe_name: "subscribe_status",
            unsubscribe_name: "unsubscribe_status",
            start: /* @__PURE__ */ __name((req) => {
              req.send_continue("Subscribed", { message: this._message, is_error: this._is_error });
            }, "start")
          }
        ],
        methods: {
          get_status: /* @__PURE__ */ __name((req) => {
            req.send_complete("Success", { message: this._message, is_error: this._is_error });
          }, "get_status")
        }
      });
      this.services = [this._svc];
      this._message = null;
      this._is_error = null;
    }
    __name(RoonApiStatus, "RoonApiStatus");
    RoonApiStatus.prototype.set_status = function(message, is_error) {
      this._message = message;
      this._is_error = is_error;
      this._svc.send_continue_all("subscribe_status", "Changed", { message: this._message, is_error: this._is_error });
    };
    exports2 = module2.exports = RoonApiStatus;
  }
});

// src/roon.js
var require_roon = __commonJS({
  "src/roon.js"(exports2, module2) {
    "use strict";
    var fs2 = require("node:fs");
    var path2 = require("node:path");
    var EventEmitter = require("node:events");
    var RoonApi = require_lib();
    var RoonApiTransport = require_lib2();
    var RoonApiBrowse = require_lib3();
    var RoonApiImage = require_lib4();
    var RoonApiStatus = require_lib5();
    var SOOD_SERVICE_ID = "00720724-5143-4a9b-abac-0e50cba674bb";
    var UNAUTHORIZED_AFTER_MS = 5e3;
    var OTHER_ZONE_SEEK_THROTTLE_MS = 5e3;
    var RoonBridge2 = class extends EventEmitter {
      static {
        __name(this, "RoonBridge");
      }
      constructor(opts) {
        super();
        this.opts = opts;
        this.stateFile = path2.join(opts.stateDir, "roon-state.json");
        this.roon = null;
        this.core = null;
        this.transport = null;
        this.browseSvc = null;
        this.zones = /* @__PURE__ */ new Map();
        this.status = { state: "starting", coreName: "", coreId: "", host: "", httpPort: 0, message: "" };
        this.selectedZoneId = null;
        this.queueSub = null;
        this.queueZoneId = null;
        this.queueItems = [];
        this._seekLast = /* @__PURE__ */ new Map();
        this._coreSeenTimer = null;
        this._manualMoo = null;
        this._manualRetry = 0;
        this._manualTimer = null;
        this._stopped = false;
      }
      log(level, message) {
        if (this.opts.log) this.opts.log(level, message);
      }
      // --- persisted state (pairing token) -------------------------------------
      loadState() {
        try {
          return JSON.parse(fs2.readFileSync(this.stateFile, "utf8")) || {};
        } catch {
          return {};
        }
      }
      saveState(state) {
        fs2.mkdirSync(this.opts.stateDir, { recursive: true });
        const tmp = this.stateFile + ".tmp";
        fs2.writeFileSync(tmp, JSON.stringify(state, null, 2));
        fs2.renameSync(tmp, this.stateFile);
      }
      // --- lifecycle -------------------------------------------------------------
      start() {
        const o = this.opts;
        this.roon = new RoonApi({
          extension_id: o.extensionId,
          display_name: o.displayName,
          display_version: o.displayVersion,
          publisher: o.publisher,
          email: o.email,
          website: o.website,
          log_level: "none",
          get_persisted_state: /* @__PURE__ */ __name(() => this.loadState(), "get_persisted_state"),
          set_persisted_state: /* @__PURE__ */ __name((s) => this.saveState(s), "set_persisted_state"),
          core_paired: /* @__PURE__ */ __name((core) => this._onPaired(core), "core_paired"),
          core_unpaired: /* @__PURE__ */ __name((core) => this._onUnpaired(core), "core_unpaired")
        });
        this.svcStatus = new RoonApiStatus(this.roon);
        this.roon.init_services({
          required_services: [RoonApiTransport, RoonApiBrowse, RoonApiImage],
          provided_services: [this.svcStatus]
        });
        this.svcStatus.set_status("Waiting for DankMaterialShell", false);
        this._connect();
      }
      stop() {
        this._stopped = true;
        if (this._coreSeenTimer) clearTimeout(this._coreSeenTimer);
        if (this._manualTimer) clearTimeout(this._manualTimer);
        this._coreSeenTimer = null;
        this._manualTimer = null;
        this.stopQueue();
        try {
          if (this.roon && this.roon.stop_discovery) this.roon.stop_discovery();
          if (this.roon && this.roon.disconnect_all) this.roon.disconnect_all();
          if (this._manualMoo) this._manualMoo.transport.close();
        } catch (e) {
          this.log("warn", "stop: " + e.message);
        }
      }
      // Switch connection mode at runtime (settings change). Restarts the connection.
      setConnection({ mode, host, port }) {
        const changed = mode !== this.opts.mode || host !== this.opts.host || Number(port) !== Number(this.opts.port);
        this.opts.mode = mode || "discovery";
        this.opts.host = host || "";
        this.opts.port = Number(port) || 9330;
        if (!changed) return false;
        this._reconnect();
        return true;
      }
      forgetCore() {
        const state = this.loadState();
        delete state.tokens;
        delete state.paired_core_id;
        this.saveState(state);
        if (this.roon) {
          this.roon.paired_core_id = void 0;
          this.roon.paired_core = void 0;
          this.roon.is_paired = false;
        }
        this._reconnect();
      }
      _reconnect() {
        try {
          if (this.roon.stop_discovery) this.roon.stop_discovery();
          if (this.roon.disconnect_all) this.roon.disconnect_all();
          if (this._manualMoo) {
            const moo = this._manualMoo;
            this._manualMoo = null;
            moo.transport.close();
          }
        } catch (e) {
          this.log("warn", "reconnect: " + e.message);
        }
        if (this._manualTimer) clearTimeout(this._manualTimer);
        this._manualTimer = null;
        this._manualRetry = 0;
        setTimeout(() => this._connect(), 250);
      }
      _connect() {
        if (this._stopped) return;
        if (this.opts.mode === "manual" && this.opts.host) {
          this._setStatus({ state: "discovering", message: `Connecting to ${this.opts.host}:${this.opts.port}` });
          this._manualConnect();
        } else {
          this._setStatus({ state: "discovering", message: "Looking for Roon Server" });
          this.roon.start_discovery();
          this._hookSood();
        }
      }
      _hookSood() {
        const sood = this.roon._sood;
        if (!sood || sood.__dmsHooked) return;
        sood.__dmsHooked = true;
        sood.on("message", (msg) => {
          if (!msg || !msg.props || msg.props.service_id !== SOOD_SERVICE_ID) return;
          this._coreSeen(msg.from && msg.from.ip, msg.props);
        });
      }
      // A core answered but has not paired us yet: after a grace period report
      // "unauthorized" so the UI can tell the user to press Enable in Roon.
      _coreSeen(ip, props) {
        if (this.status.state === "paired") return;
        this.lastSeenCore = { ip, props };
        if (this._coreSeenTimer) return;
        if (this.status.state === "unauthorized" && this.status.host === (ip || "")) return;
        this._coreSeenTimer = setTimeout(() => {
          this._coreSeenTimer = null;
          if (this.status.state === "paired" || this._stopped) return;
          this._setStatus({
            state: "unauthorized",
            host: ip || "",
            httpPort: Number(props.http_port) || 0,
            coreName: props.display_name || props.name || "",
            message: 'Enable "DMS Roon" in Roon \u2192 Settings \u2192 Extensions'
          });
        }, UNAUTHORIZED_AFTER_MS);
      }
      _manualConnect() {
        if (this._stopped || this._manualMoo) return;
        const host = this.opts.host;
        const port = Number(this.opts.port) || 9330;
        this._manualMoo = this.roon.ws_connect({
          host,
          port,
          onclose: /* @__PURE__ */ __name(() => {
            this._manualMoo = null;
            if (this.status.state === "paired") this._onUnpaired(this.core);
            this._scheduleManualRetry();
          }, "onclose"),
          onerror: /* @__PURE__ */ __name(() => {
          }, "onerror")
        });
        this._coreSeen(host, { http_port: port });
      }
      _scheduleManualRetry() {
        if (this._stopped || this.opts.mode !== "manual") return;
        const delay = Math.min(3e4, 1e3 * 2 ** Math.min(this._manualRetry++, 5));
        this._manualTimer = setTimeout(() => {
          this._manualTimer = null;
          this._manualConnect();
        }, delay);
      }
      _onPaired(core) {
        this.core = core;
        this._manualRetry = 0;
        if (this._coreSeenTimer) {
          clearTimeout(this._coreSeenTimer);
          this._coreSeenTimer = null;
        }
        this.transport = core.services.RoonApiTransport;
        this.browseSvc = core.services.RoonApiBrowse;
        const t = core.moo.transport;
        this._setStatus({
          state: "paired",
          coreName: core.display_name || "",
          coreId: core.core_id || "",
          host: t.host || "",
          httpPort: Number(t.port) || 0,
          message: ""
        });
        this.svcStatus.set_status("Connected to DankMaterialShell", false);
        this.transport.subscribe_zones((resp, body) => this._onZones(resp, body));
        this.emit("paired", core);
      }
      _onUnpaired(core) {
        if (this.core && core && core.core_id && this.core.core_id !== core.core_id) return;
        this.core = null;
        this.transport = null;
        this.browseSvc = null;
        this.zones.clear();
        this.stopQueue();
        this._setStatus({ state: "disconnected", message: "Roon Server connection lost" });
        this.emit("zones", []);
        this.emit("unpaired");
      }
      _setStatus(patch) {
        Object.assign(this.status, patch);
        this.emit("status", { ...this.status });
      }
      // --- zones -----------------------------------------------------------------
      artUrl(imageKey, size) {
        if (!imageKey || !this.status.host || !this.status.httpPort) return "";
        const s = Number(size) || 256;
        return `http://${this.status.host}:${this.status.httpPort}/api/image/${encodeURIComponent(imageKey)}?scale=fit&width=${s}&height=${s}&format=image/jpeg`;
      }
      normalizeZone(z) {
        const np = z.now_playing || null;
        const three = np && np.three_line || {};
        const two = np && np.two_line || {};
        const one = np && np.one_line || {};
        return {
          zoneId: z.zone_id,
          name: z.display_name || "",
          state: z.state || "stopped",
          isPlayAllowed: !!z.is_play_allowed,
          isPauseAllowed: !!z.is_pause_allowed,
          isNextAllowed: !!z.is_next_allowed,
          isPreviousAllowed: !!z.is_previous_allowed,
          isSeekAllowed: !!z.is_seek_allowed,
          queueItemsRemaining: z.queue_items_remaining || 0,
          queueTimeRemaining: z.queue_time_remaining || 0,
          settings: {
            loop: z.settings && z.settings.loop || "disabled",
            shuffle: !!(z.settings && z.settings.shuffle),
            autoRadio: !!(z.settings && z.settings.auto_radio)
          },
          outputs: (z.outputs || []).map((o) => ({
            outputId: o.output_id,
            zoneId: o.zone_id,
            name: o.display_name || "",
            state: o.state || "",
            volume: o.volume ? {
              type: o.volume.type || "number",
              min: o.volume.min,
              max: o.volume.max,
              value: o.volume.value,
              step: o.volume.step,
              isMuted: !!o.volume.is_muted
            } : null
          })),
          nowPlaying: np ? {
            title: three.line1 || one.line1 || "",
            artist: three.line2 || "",
            album: three.line3 || "",
            line1: three.line1 || one.line1 || "",
            line2: three.line2 || "",
            line3: three.line3 || "",
            oneLine: one.line1 || "",
            twoLine1: two.line1 || "",
            twoLine2: two.line2 || "",
            imageKey: np.image_key || "",
            artUrl: this.artUrl(np.image_key, 512),
            length: np.length || 0,
            position: np.seek_position != null ? np.seek_position : z.seek_position || 0
          } : null
        };
      }
      normalizedZones() {
        return Array.from(this.zones.values()).map((z) => this.normalizeZone(z));
      }
      _emitZones() {
        this.emit("zones", this.normalizedZones());
      }
      _onZones(resp, body) {
        if (resp === "Subscribed") {
          this.zones.clear();
          (body.zones || []).forEach((z) => this.zones.set(z.zone_id, z));
          this._emitZones();
          return;
        }
        if (resp !== "Changed" || !body) return;
        let structural = false;
        (body.zones_removed || []).forEach((id) => {
          this.zones.delete(id);
          structural = true;
        });
        (body.zones_added || []).forEach((z) => {
          this.zones.set(z.zone_id, z);
          structural = true;
        });
        (body.zones_changed || []).forEach((z) => {
          this.zones.set(z.zone_id, z);
          if (!structural) this.emit("zone_changed", this.normalizeZone(z));
        });
        if (structural) this._emitZones();
        (body.zones_seek_changed || []).forEach((s) => {
          const z = this.zones.get(s.zone_id);
          if (!z) return;
          if (z.now_playing) z.now_playing.seek_position = s.seek_position;
          z.seek_position = s.seek_position;
          z.queue_time_remaining = s.queue_time_remaining;
          const now = Date.now();
          const last = this._seekLast.get(s.zone_id) || 0;
          const selected = s.zone_id === this.selectedZoneId;
          if (selected || now - last >= OTHER_ZONE_SEEK_THROTTLE_MS) {
            this._seekLast.set(s.zone_id, now);
            this.emit("seek", { zoneId: s.zone_id, position: s.seek_position, queueTimeRemaining: s.queue_time_remaining });
          }
        });
      }
      findOutput(outputId) {
        for (const z of this.zones.values()) {
          for (const o of z.outputs || []) if (o.output_id === outputId) return o;
        }
        return null;
      }
      selectZone(zoneId) {
        this.selectedZoneId = zoneId || null;
        if (this.queueSub && this.queueZoneId !== this.selectedZoneId) {
          const max = this.queueMax;
          this.stopQueue();
          if (this.selectedZoneId) this.subscribeQueue(this.selectedZoneId, max);
        }
        this.emit("selected", this.selectedZoneId);
      }
      // --- transport commands (promises) ----------------------------------------
      _call(fn) {
        return new Promise((resolve, reject) => {
          if (!this.transport) return reject(new Error("not paired"));
          try {
            fn((err, body) => err ? reject(new Error(String(err))) : resolve(body));
          } catch (e) {
            reject(e);
          }
        });
      }
      control(zoneId, action) {
        if (!zoneId) return Promise.reject(new Error("zoneId required"));
        return this._call((cb) => this.transport.control(zoneId, action, cb));
      }
      seek(zoneId, how, seconds) {
        return this._call((cb) => this.transport.seek(zoneId, how || "absolute", Number(seconds) || 0, cb));
      }
      volume(outputId, how, value) {
        return this._call((cb) => this.transport.change_volume(outputId, how || "absolute", Number(value) || 0, cb));
      }
      mute(outputId, how) {
        if (how === "toggle") {
          const o = this.findOutput(outputId);
          how = o && o.volume && o.volume.is_muted ? "unmute" : "mute";
        }
        return this._call((cb) => this.transport.mute(outputId, how, cb));
      }
      settings(zoneId, s) {
        const patch = {};
        if (s.shuffle !== void 0) patch.shuffle = !!s.shuffle;
        if (s.loop !== void 0) patch.loop = s.loop;
        if (s.autoRadio !== void 0) patch.auto_radio = !!s.autoRadio;
        return this._call((cb) => this.transport.change_settings(zoneId, patch, cb));
      }
      transfer(fromZoneId, toZoneId) {
        return this._call((cb) => this.transport.transfer_zone(fromZoneId, toZoneId, cb));
      }
      group(outputIds) {
        return this._call((cb) => this.transport.group_outputs(outputIds || [], cb));
      }
      ungroup(outputIds) {
        return this._call((cb) => this.transport.ungroup_outputs(outputIds || [], cb));
      }
      playFromHere(zoneId, queueItemId) {
        return new Promise((resolve, reject) => {
          if (!this.transport) return reject(new Error("not paired"));
          this.transport.play_from_here(zoneId, queueItemId, (msg, body) => {
            if (msg && msg.name === "Success") resolve(body);
            else reject(new Error(msg ? msg.name : "NetworkError"));
          });
        });
      }
      // --- queue -----------------------------------------------------------------
      normalizeQueueItem(i) {
        const three = i.three_line || {};
        const one = i.one_line || {};
        return {
          queueItemId: i.queue_item_id,
          title: three.line1 || one.line1 || "",
          subtitle: three.line2 || "",
          album: three.line3 || "",
          imageKey: i.image_key || "",
          artUrl: this.artUrl(i.image_key, 128),
          length: i.length || 0
        };
      }
      subscribeQueue(zoneId, max) {
        this.stopQueue();
        if (!this.transport || !zoneId) return;
        this.queueZoneId = zoneId;
        this.queueMax = Number(max) || 50;
        this.queueItems = [];
        this.queueSub = this.transport.subscribe_queue(zoneId, this.queueMax, (resp, body) => {
          if (resp === "Subscribed") {
            this.queueItems = body && body.items || [];
          } else if (resp === "Changed") {
            for (const ch of body && body.changes || []) {
              if (ch.operation === "remove") this.queueItems.splice(ch.index, ch.count);
              else if (ch.operation === "insert") this.queueItems.splice(ch.index, 0, ...ch.items || []);
            }
          } else {
            return;
          }
          this.emit("queue", { zoneId, items: this.queueItems.map((i) => this.normalizeQueueItem(i)) });
        });
      }
      stopQueue() {
        if (this.queueSub) {
          try {
            this.queueSub.unsubscribe(() => {
            });
          } catch {
          }
        }
        this.queueSub = null;
        this.queueZoneId = null;
        this.queueItems = [];
      }
    };
    module2.exports = { RoonBridge: RoonBridge2 };
  }
});

// src/browse.js
var require_browse = __commonJS({
  "src/browse.js"(exports2, module2) {
    "use strict";
    var CATEGORY_MATCHERS = {
      albums: /album/i,
      artists: /artist/i,
      tracks: /track/i,
      playlists: /playlist/i,
      radio: /radio/i,
      composers: /composer/i,
      genres: /genre/i,
      tags: /tag/i
    };
    var MODE_TITLES = {
      play_now: /^play now$/i,
      queue: /^queue$/i,
      add_next: /^add next$/i,
      start_radio: /^start radio$/i,
      play_from_here: /^play from here$/i,
      shuffle: /^shuffle$/i,
      play: /^play/i
    };
    var BrowseSessions2 = class _BrowseSessions {
      static {
        __name(this, "BrowseSessions");
      }
      constructor(bridge) {
        this.bridge = bridge;
        this.sessions = /* @__PURE__ */ new Map();
        this.searchRefs = /* @__PURE__ */ new Map();
        this.refSeq = 0;
        this.lastSearch = null;
      }
      _svc() {
        const svc = this.bridge.browseSvc;
        if (!svc) throw new Error("not paired");
        return svc;
      }
      _browse(opts) {
        return new Promise((resolve, reject) => {
          this._svc().browse(opts, (err, body) => err ? reject(new Error(String(err))) : resolve(body || {}));
        });
      }
      _load(opts) {
        return new Promise((resolve, reject) => {
          this._svc().load(opts, (err, body) => err ? reject(new Error(String(err))) : resolve(body || {}));
        });
      }
      session(key) {
        let s = this.sessions.get(key);
        if (!s) {
          s = { key, hierarchy: "browse", crumbs: [], list: null };
          this.sessions.set(key, s);
        }
        return s;
      }
      reset(key) {
        this.sessions.delete(key);
      }
      normItem(i) {
        return {
          title: i.title || "",
          subtitle: i.subtitle || "",
          imageKey: i.image_key || "",
          artUrl: this.bridge.artUrl(i.image_key, 128),
          itemKey: i.item_key || "",
          hint: i.hint || null,
          inputPrompt: i.input_prompt || null
        };
      }
      normList(l) {
        return {
          title: l.title || "",
          subtitle: l.subtitle || "",
          count: l.count || 0,
          level: l.level || 0,
          hint: l.hint || null,
          imageKey: l.image_key || "",
          artUrl: this.bridge.artUrl(l.image_key, 256)
        };
      }
      _crumb(s, list) {
        const lvl = list.level || 0;
        s.crumbs = s.crumbs.slice(0, lvl);
        s.crumbs[lvl] = list.title || "";
      }
      // Perform a browse step and (when it yields a list) load its first page.
      async browse(key, { hierarchy, itemKey, input, popAll, popLevels, refresh, zoneId, count = 100, load = true } = {}) {
        const s = this.session(key);
        if (hierarchy) s.hierarchy = hierarchy;
        const opts = { hierarchy: s.hierarchy, multi_session_key: key };
        if (itemKey) opts.item_key = itemKey;
        if (input !== void 0 && input !== null) opts.input = String(input);
        if (popAll) opts.pop_all = true;
        if (popLevels) opts.pop_levels = Number(popLevels);
        if (refresh) opts.refresh_list = true;
        const zid = zoneId || this.bridge.selectedZoneId;
        if (zid) opts.zone_or_output_id = zid;
        const res = await this._browse(opts);
        const out = {
          action: res.action || "none",
          message: res.message || "",
          isError: !!res.is_error,
          item: res.item ? this.normItem(res.item) : null,
          list: null,
          items: [],
          offset: 0,
          breadcrumbs: s.crumbs.slice(),
          hierarchy: s.hierarchy
        };
        if (res.action === "list" && res.list) {
          s.list = res.list;
          this._crumb(s, res.list);
          out.list = this.normList(res.list);
          out.breadcrumbs = s.crumbs.slice();
          if (load && count > 0) {
            const page = await this._load({ hierarchy: s.hierarchy, multi_session_key: key, offset: 0, count });
            out.items = (page.items || []).map((i) => this.normItem(i));
            out.offset = page.offset || 0;
            if (page.list) out.list = this.normList(page.list);
          }
        }
        return out;
      }
      async load(key, { offset = 0, count = 100, level } = {}) {
        const s = this.session(key);
        const opts = { hierarchy: s.hierarchy, multi_session_key: key, offset: Number(offset) || 0, count: Number(count) || 100 };
        if (level !== void 0 && level !== null) opts.level = Number(level);
        const page = await this._load(opts);
        return {
          items: (page.items || []).map((i) => this.normItem(i)),
          offset: page.offset || 0,
          list: page.list ? this.normList(page.list) : s.list ? this.normList(s.list) : null,
          breadcrumbs: s.crumbs.slice()
        };
      }
      static categoryMatches(title, category) {
        if (!category) return true;
        const re = CATEGORY_MATCHERS[category];
        if (re) return re.test(title);
        return title.toLowerCase().includes(category.toLowerCase());
      }
      // Search the library. Roon's "search" hierarchy returns one list item per
      // category (Albums, Artists, Tracks, ...); we drill into each and take the
      // first `limit` results, then pop back so the session stays at the category
      // level for later replays.
      async search(query, { category = "", limit = 10, zoneId, key = "launcher" } = {}) {
        const root = await this.browse(key, { hierarchy: "search", input: query, popAll: true, zoneId, count: 50 });
        const groups = [];
        this.searchRefs.clear();
        this.lastSearch = { query, zoneId, key };
        if (root.action !== "list") {
          return { query, groups, message: root.message || "", isError: root.isError };
        }
        const direct = [];
        for (const cat of root.items) {
          if (cat.hint !== "list") {
            if (!category) direct.push(this._ref(cat, { query, category: "", categoryKey: "", direct: true }));
            continue;
          }
          if (!_BrowseSessions.categoryMatches(cat.title, category)) continue;
          const level = await this.browse(key, { itemKey: cat.itemKey, zoneId, count: limit });
          const items = level.items.slice(0, limit).map(
            (it, idx) => this._ref(it, { query, category: cat.title, categoryKey: cat.itemKey, index: idx })
          );
          if (items.length) groups.push({ category: cat.title, items });
          await this.browse(key, { popLevels: 1, zoneId, load: false });
        }
        if (direct.length) groups.unshift({ category: "Top", items: direct });
        return { query, groups };
      }
      _ref(item, meta) {
        const ref = String(++this.refSeq);
        this.searchRefs.set(ref, { ...meta, title: item.title, subtitle: item.subtitle, itemKey: item.itemKey, hint: item.hint });
        return { ref, ...item };
      }
      // Play a search result. Try the stored item_key first (valid while the
      // session still sits at the level it came from), otherwise replay the search
      // path by title.
      async playRef(ref, mode, zoneId) {
        const meta = this.searchRefs.get(String(ref));
        if (!meta) throw new Error("unknown search result (search again)");
        const key = meta.key || "launcher";
        try {
          return await this.playItem(key, meta.itemKey, mode, zoneId);
        } catch (e) {
          this.bridge.log("info", `playRef: direct key failed (${e.message}), replaying search`);
        }
        const root = await this.browse(key, { hierarchy: "search", input: meta.query, popAll: true, zoneId, count: 50 });
        let target = null;
        if (meta.direct) {
          target = root.items.find((i) => i.title === meta.title && i.subtitle === meta.subtitle);
        } else {
          const cat = root.items.find((i) => i.hint === "list" && i.title === meta.category);
          if (!cat) throw new Error("search category vanished");
          const level = await this.browse(key, { itemKey: cat.itemKey, zoneId, count: Math.max(50, meta.index + 5) });
          target = level.items.find((i) => i.title === meta.title && i.subtitle === meta.subtitle) || level.items[meta.index];
        }
        if (!target) throw new Error("search result vanished");
        return this.playItem(key, target.itemKey, mode, zoneId);
      }
      // Replay a search result's path inside another session (the popout's
      // browser) and drill into the item so its contents can be shown.
      async openRef(ref, { zoneId, key = "popout" } = {}) {
        const meta = this.searchRefs.get(String(ref));
        if (!meta) throw new Error("unknown search result (search again)");
        this.reset(key);
        const root = await this.browse(key, { hierarchy: "search", input: meta.query, popAll: true, zoneId, count: 50 });
        if (meta.direct) {
          const item2 = root.items.find((i) => i.title === meta.title && i.subtitle === meta.subtitle);
          if (!item2) throw new Error("search result vanished");
          return this.browse(key, { itemKey: item2.itemKey, zoneId });
        }
        const cat = root.items.find((i) => i.hint === "list" && i.title === meta.category);
        if (!cat) throw new Error("search category vanished");
        const level = await this.browse(key, { itemKey: cat.itemKey, zoneId, count: Math.max(50, meta.index + 5) });
        const item = level.items.find((i) => i.title === meta.title && i.subtitle === meta.subtitle) || level.items[meta.index];
        if (!item) throw new Error("search result vanished");
        return this.browse(key, { itemKey: item.itemKey, zoneId });
      }
      // Drill into an item until an action list appears, then run the action
      // matching `mode` (Play Now, Queue, Add Next, Start Radio...).
      async playItem(key, itemKey, mode, zoneId) {
        if (!itemKey) throw new Error("itemKey required");
        const res = await this.browse(key, { itemKey, zoneId, count: 50 });
        if (res.action === "message") return { ok: !res.isError, message: res.message };
        if (res.action !== "list") return { ok: true, message: "", action: res.action };
        let actions = res.items.filter((i) => i.hint === "action");
        if (!actions.length) {
          const al = res.items.find((i) => i.hint === "action_list");
          if (!al) return { ok: false, message: "Nothing playable here" };
          const sub = await this.browse(key, { itemKey: al.itemKey, zoneId, count: 50 });
          if (sub.action === "message") return { ok: !sub.isError, message: sub.message };
          actions = sub.items.filter((i) => i.hint === "action");
        }
        return this._runAction(key, actions, mode, zoneId);
      }
      async _runAction(key, actions, mode, zoneId) {
        if (!actions.length) return { ok: false, message: "No actions available" };
        const want = MODE_TITLES[mode || "play_now"];
        let chosen = want ? actions.find((a) => want.test(a.title)) : null;
        if (!chosen && mode === "play_now") chosen = actions.find((a) => MODE_TITLES.play.test(a.title));
        if (!chosen) chosen = actions[0];
        const r = await this.browse(key, { itemKey: chosen.itemKey, zoneId, load: false });
        const ok = r.action !== "message" || !r.isError;
        return { ok, message: r.message || chosen.title, action: chosen.title, result: r.action };
      }
    };
    module2.exports = { BrowseSessions: BrowseSessions2 };
  }
});

// node_modules/source-map/lib/base64.js
var require_base64 = __commonJS({
  "node_modules/source-map/lib/base64.js"(exports2) {
    var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    exports2.encode = function(number) {
      if (0 <= number && number < intToCharMap.length) {
        return intToCharMap[number];
      }
      throw new TypeError("Must be between 0 and 63: " + number);
    };
    exports2.decode = function(charCode) {
      var bigA = 65;
      var bigZ = 90;
      var littleA = 97;
      var littleZ = 122;
      var zero = 48;
      var nine = 57;
      var plus = 43;
      var slash = 47;
      var littleOffset = 26;
      var numberOffset = 52;
      if (bigA <= charCode && charCode <= bigZ) {
        return charCode - bigA;
      }
      if (littleA <= charCode && charCode <= littleZ) {
        return charCode - littleA + littleOffset;
      }
      if (zero <= charCode && charCode <= nine) {
        return charCode - zero + numberOffset;
      }
      if (charCode == plus) {
        return 62;
      }
      if (charCode == slash) {
        return 63;
      }
      return -1;
    };
  }
});

// node_modules/source-map/lib/base64-vlq.js
var require_base64_vlq = __commonJS({
  "node_modules/source-map/lib/base64-vlq.js"(exports2) {
    var base64 = require_base64();
    var VLQ_BASE_SHIFT = 5;
    var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
    var VLQ_BASE_MASK = VLQ_BASE - 1;
    var VLQ_CONTINUATION_BIT = VLQ_BASE;
    function toVLQSigned(aValue) {
      return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
    }
    __name(toVLQSigned, "toVLQSigned");
    function fromVLQSigned(aValue) {
      var isNegative = (aValue & 1) === 1;
      var shifted = aValue >> 1;
      return isNegative ? -shifted : shifted;
    }
    __name(fromVLQSigned, "fromVLQSigned");
    exports2.encode = /* @__PURE__ */ __name(function base64VLQ_encode(aValue) {
      var encoded = "";
      var digit;
      var vlq = toVLQSigned(aValue);
      do {
        digit = vlq & VLQ_BASE_MASK;
        vlq >>>= VLQ_BASE_SHIFT;
        if (vlq > 0) {
          digit |= VLQ_CONTINUATION_BIT;
        }
        encoded += base64.encode(digit);
      } while (vlq > 0);
      return encoded;
    }, "base64VLQ_encode");
    exports2.decode = /* @__PURE__ */ __name(function base64VLQ_decode(aStr, aIndex, aOutParam) {
      var strLen = aStr.length;
      var result = 0;
      var shift = 0;
      var continuation, digit;
      do {
        if (aIndex >= strLen) {
          throw new Error("Expected more digits in base 64 VLQ value.");
        }
        digit = base64.decode(aStr.charCodeAt(aIndex++));
        if (digit === -1) {
          throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
        }
        continuation = !!(digit & VLQ_CONTINUATION_BIT);
        digit &= VLQ_BASE_MASK;
        result = result + (digit << shift);
        shift += VLQ_BASE_SHIFT;
      } while (continuation);
      aOutParam.value = fromVLQSigned(result);
      aOutParam.rest = aIndex;
    }, "base64VLQ_decode");
  }
});

// node_modules/source-map/lib/util.js
var require_util = __commonJS({
  "node_modules/source-map/lib/util.js"(exports2) {
    function getArg(aArgs, aName, aDefaultValue) {
      if (aName in aArgs) {
        return aArgs[aName];
      } else if (arguments.length === 3) {
        return aDefaultValue;
      } else {
        throw new Error('"' + aName + '" is a required argument.');
      }
    }
    __name(getArg, "getArg");
    exports2.getArg = getArg;
    var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
    var dataUrlRegexp = /^data:.+\,.+$/;
    function urlParse(aUrl) {
      var match = aUrl.match(urlRegexp);
      if (!match) {
        return null;
      }
      return {
        scheme: match[1],
        auth: match[2],
        host: match[3],
        port: match[4],
        path: match[5]
      };
    }
    __name(urlParse, "urlParse");
    exports2.urlParse = urlParse;
    function urlGenerate(aParsedUrl) {
      var url = "";
      if (aParsedUrl.scheme) {
        url += aParsedUrl.scheme + ":";
      }
      url += "//";
      if (aParsedUrl.auth) {
        url += aParsedUrl.auth + "@";
      }
      if (aParsedUrl.host) {
        url += aParsedUrl.host;
      }
      if (aParsedUrl.port) {
        url += ":" + aParsedUrl.port;
      }
      if (aParsedUrl.path) {
        url += aParsedUrl.path;
      }
      return url;
    }
    __name(urlGenerate, "urlGenerate");
    exports2.urlGenerate = urlGenerate;
    function normalize(aPath) {
      var path2 = aPath;
      var url = urlParse(aPath);
      if (url) {
        if (!url.path) {
          return aPath;
        }
        path2 = url.path;
      }
      var isAbsolute = exports2.isAbsolute(path2);
      var parts = path2.split(/\/+/);
      for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
        part = parts[i];
        if (part === ".") {
          parts.splice(i, 1);
        } else if (part === "..") {
          up++;
        } else if (up > 0) {
          if (part === "") {
            parts.splice(i + 1, up);
            up = 0;
          } else {
            parts.splice(i, 2);
            up--;
          }
        }
      }
      path2 = parts.join("/");
      if (path2 === "") {
        path2 = isAbsolute ? "/" : ".";
      }
      if (url) {
        url.path = path2;
        return urlGenerate(url);
      }
      return path2;
    }
    __name(normalize, "normalize");
    exports2.normalize = normalize;
    function join(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      if (aPath === "") {
        aPath = ".";
      }
      var aPathUrl = urlParse(aPath);
      var aRootUrl = urlParse(aRoot);
      if (aRootUrl) {
        aRoot = aRootUrl.path || "/";
      }
      if (aPathUrl && !aPathUrl.scheme) {
        if (aRootUrl) {
          aPathUrl.scheme = aRootUrl.scheme;
        }
        return urlGenerate(aPathUrl);
      }
      if (aPathUrl || aPath.match(dataUrlRegexp)) {
        return aPath;
      }
      if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
        aRootUrl.host = aPath;
        return urlGenerate(aRootUrl);
      }
      var joined = aPath.charAt(0) === "/" ? aPath : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);
      if (aRootUrl) {
        aRootUrl.path = joined;
        return urlGenerate(aRootUrl);
      }
      return joined;
    }
    __name(join, "join");
    exports2.join = join;
    exports2.isAbsolute = function(aPath) {
      return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
    };
    function relative(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      aRoot = aRoot.replace(/\/$/, "");
      var level = 0;
      while (aPath.indexOf(aRoot + "/") !== 0) {
        var index = aRoot.lastIndexOf("/");
        if (index < 0) {
          return aPath;
        }
        aRoot = aRoot.slice(0, index);
        if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
          return aPath;
        }
        ++level;
      }
      return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
    }
    __name(relative, "relative");
    exports2.relative = relative;
    var supportsNullProto = (function() {
      var obj = /* @__PURE__ */ Object.create(null);
      return !("__proto__" in obj);
    })();
    function identity(s) {
      return s;
    }
    __name(identity, "identity");
    function toSetString(aStr) {
      if (isProtoString(aStr)) {
        return "$" + aStr;
      }
      return aStr;
    }
    __name(toSetString, "toSetString");
    exports2.toSetString = supportsNullProto ? identity : toSetString;
    function fromSetString(aStr) {
      if (isProtoString(aStr)) {
        return aStr.slice(1);
      }
      return aStr;
    }
    __name(fromSetString, "fromSetString");
    exports2.fromSetString = supportsNullProto ? identity : fromSetString;
    function isProtoString(s) {
      if (!s) {
        return false;
      }
      var length = s.length;
      if (length < 9) {
        return false;
      }
      if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) {
        return false;
      }
      for (var i = length - 10; i >= 0; i--) {
        if (s.charCodeAt(i) !== 36) {
          return false;
        }
      }
      return true;
    }
    __name(isProtoString, "isProtoString");
    function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
      var cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    __name(compareByOriginalPositions, "compareByOriginalPositions");
    exports2.compareByOriginalPositions = compareByOriginalPositions;
    function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    __name(compareByGeneratedPositionsDeflated, "compareByGeneratedPositionsDeflated");
    exports2.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
    function strcmp(aStr1, aStr2) {
      if (aStr1 === aStr2) {
        return 0;
      }
      if (aStr1 === null) {
        return 1;
      }
      if (aStr2 === null) {
        return -1;
      }
      if (aStr1 > aStr2) {
        return 1;
      }
      return -1;
    }
    __name(strcmp, "strcmp");
    function compareByGeneratedPositionsInflated(mappingA, mappingB) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    __name(compareByGeneratedPositionsInflated, "compareByGeneratedPositionsInflated");
    exports2.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
    function parseSourceMapInput(str) {
      return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
    }
    __name(parseSourceMapInput, "parseSourceMapInput");
    exports2.parseSourceMapInput = parseSourceMapInput;
    function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
      sourceURL = sourceURL || "";
      if (sourceRoot) {
        if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") {
          sourceRoot += "/";
        }
        sourceURL = sourceRoot + sourceURL;
      }
      if (sourceMapURL) {
        var parsed = urlParse(sourceMapURL);
        if (!parsed) {
          throw new Error("sourceMapURL could not be parsed");
        }
        if (parsed.path) {
          var index = parsed.path.lastIndexOf("/");
          if (index >= 0) {
            parsed.path = parsed.path.substring(0, index + 1);
          }
        }
        sourceURL = join(urlGenerate(parsed), sourceURL);
      }
      return normalize(sourceURL);
    }
    __name(computeSourceURL, "computeSourceURL");
    exports2.computeSourceURL = computeSourceURL;
  }
});

// node_modules/source-map/lib/array-set.js
var require_array_set = __commonJS({
  "node_modules/source-map/lib/array-set.js"(exports2) {
    var util = require_util();
    var has = Object.prototype.hasOwnProperty;
    var hasNativeMap = typeof Map !== "undefined";
    function ArraySet() {
      this._array = [];
      this._set = hasNativeMap ? /* @__PURE__ */ new Map() : /* @__PURE__ */ Object.create(null);
    }
    __name(ArraySet, "ArraySet");
    ArraySet.fromArray = /* @__PURE__ */ __name(function ArraySet_fromArray(aArray, aAllowDuplicates) {
      var set = new ArraySet();
      for (var i = 0, len = aArray.length; i < len; i++) {
        set.add(aArray[i], aAllowDuplicates);
      }
      return set;
    }, "ArraySet_fromArray");
    ArraySet.prototype.size = /* @__PURE__ */ __name(function ArraySet_size() {
      return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
    }, "ArraySet_size");
    ArraySet.prototype.add = /* @__PURE__ */ __name(function ArraySet_add(aStr, aAllowDuplicates) {
      var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
      var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
      var idx = this._array.length;
      if (!isDuplicate || aAllowDuplicates) {
        this._array.push(aStr);
      }
      if (!isDuplicate) {
        if (hasNativeMap) {
          this._set.set(aStr, idx);
        } else {
          this._set[sStr] = idx;
        }
      }
    }, "ArraySet_add");
    ArraySet.prototype.has = /* @__PURE__ */ __name(function ArraySet_has(aStr) {
      if (hasNativeMap) {
        return this._set.has(aStr);
      } else {
        var sStr = util.toSetString(aStr);
        return has.call(this._set, sStr);
      }
    }, "ArraySet_has");
    ArraySet.prototype.indexOf = /* @__PURE__ */ __name(function ArraySet_indexOf(aStr) {
      if (hasNativeMap) {
        var idx = this._set.get(aStr);
        if (idx >= 0) {
          return idx;
        }
      } else {
        var sStr = util.toSetString(aStr);
        if (has.call(this._set, sStr)) {
          return this._set[sStr];
        }
      }
      throw new Error('"' + aStr + '" is not in the set.');
    }, "ArraySet_indexOf");
    ArraySet.prototype.at = /* @__PURE__ */ __name(function ArraySet_at(aIdx) {
      if (aIdx >= 0 && aIdx < this._array.length) {
        return this._array[aIdx];
      }
      throw new Error("No element indexed by " + aIdx);
    }, "ArraySet_at");
    ArraySet.prototype.toArray = /* @__PURE__ */ __name(function ArraySet_toArray() {
      return this._array.slice();
    }, "ArraySet_toArray");
    exports2.ArraySet = ArraySet;
  }
});

// node_modules/source-map/lib/mapping-list.js
var require_mapping_list = __commonJS({
  "node_modules/source-map/lib/mapping-list.js"(exports2) {
    var util = require_util();
    function generatedPositionAfter(mappingA, mappingB) {
      var lineA = mappingA.generatedLine;
      var lineB = mappingB.generatedLine;
      var columnA = mappingA.generatedColumn;
      var columnB = mappingB.generatedColumn;
      return lineB > lineA || lineB == lineA && columnB >= columnA || util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
    }
    __name(generatedPositionAfter, "generatedPositionAfter");
    function MappingList() {
      this._array = [];
      this._sorted = true;
      this._last = { generatedLine: -1, generatedColumn: 0 };
    }
    __name(MappingList, "MappingList");
    MappingList.prototype.unsortedForEach = /* @__PURE__ */ __name(function MappingList_forEach(aCallback, aThisArg) {
      this._array.forEach(aCallback, aThisArg);
    }, "MappingList_forEach");
    MappingList.prototype.add = /* @__PURE__ */ __name(function MappingList_add(aMapping) {
      if (generatedPositionAfter(this._last, aMapping)) {
        this._last = aMapping;
        this._array.push(aMapping);
      } else {
        this._sorted = false;
        this._array.push(aMapping);
      }
    }, "MappingList_add");
    MappingList.prototype.toArray = /* @__PURE__ */ __name(function MappingList_toArray() {
      if (!this._sorted) {
        this._array.sort(util.compareByGeneratedPositionsInflated);
        this._sorted = true;
      }
      return this._array;
    }, "MappingList_toArray");
    exports2.MappingList = MappingList;
  }
});

// node_modules/source-map/lib/source-map-generator.js
var require_source_map_generator = __commonJS({
  "node_modules/source-map/lib/source-map-generator.js"(exports2) {
    var base64VLQ = require_base64_vlq();
    var util = require_util();
    var ArraySet = require_array_set().ArraySet;
    var MappingList = require_mapping_list().MappingList;
    function SourceMapGenerator(aArgs) {
      if (!aArgs) {
        aArgs = {};
      }
      this._file = util.getArg(aArgs, "file", null);
      this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
      this._skipValidation = util.getArg(aArgs, "skipValidation", false);
      this._sources = new ArraySet();
      this._names = new ArraySet();
      this._mappings = new MappingList();
      this._sourcesContents = null;
    }
    __name(SourceMapGenerator, "SourceMapGenerator");
    SourceMapGenerator.prototype._version = 3;
    SourceMapGenerator.fromSourceMap = /* @__PURE__ */ __name(function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator({
        file: aSourceMapConsumer.file,
        sourceRoot
      });
      aSourceMapConsumer.eachMapping(function(mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };
        if (mapping.source != null) {
          newMapping.source = mapping.source;
          if (sourceRoot != null) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }
          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };
          if (mapping.name != null) {
            newMapping.name = mapping.name;
          }
        }
        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var sourceRelative = sourceFile;
        if (sourceRoot !== null) {
          sourceRelative = util.relative(sourceRoot, sourceFile);
        }
        if (!generator._sources.has(sourceRelative)) {
          generator._sources.add(sourceRelative);
        }
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    }, "SourceMapGenerator_fromSourceMap");
    SourceMapGenerator.prototype.addMapping = /* @__PURE__ */ __name(function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, "generated");
      var original = util.getArg(aArgs, "original", null);
      var source = util.getArg(aArgs, "source", null);
      var name = util.getArg(aArgs, "name", null);
      if (!this._skipValidation) {
        this._validateMapping(generated, original, source, name);
      }
      if (source != null) {
        source = String(source);
        if (!this._sources.has(source)) {
          this._sources.add(source);
        }
      }
      if (name != null) {
        name = String(name);
        if (!this._names.has(name)) {
          this._names.add(name);
        }
      }
      this._mappings.add({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source,
        name
      });
    }, "SourceMapGenerator_addMapping");
    SourceMapGenerator.prototype.setSourceContent = /* @__PURE__ */ __name(function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot != null) {
        source = util.relative(this._sourceRoot, source);
      }
      if (aSourceContent != null) {
        if (!this._sourcesContents) {
          this._sourcesContents = /* @__PURE__ */ Object.create(null);
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else if (this._sourcesContents) {
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    }, "SourceMapGenerator_setSourceContent");
    SourceMapGenerator.prototype.applySourceMap = /* @__PURE__ */ __name(function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
      var sourceFile = aSourceFile;
      if (aSourceFile == null) {
        if (aSourceMapConsumer.file == null) {
          throw new Error(
            `SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`
          );
        }
        sourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      if (sourceRoot != null) {
        sourceFile = util.relative(sourceRoot, sourceFile);
      }
      var newSources = new ArraySet();
      var newNames = new ArraySet();
      this._mappings.unsortedForEach(function(mapping) {
        if (mapping.source === sourceFile && mapping.originalLine != null) {
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source != null) {
            mapping.source = original.source;
            if (aSourceMapPath != null) {
              mapping.source = util.join(aSourceMapPath, mapping.source);
            }
            if (sourceRoot != null) {
              mapping.source = util.relative(sourceRoot, mapping.source);
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name != null) {
              mapping.name = original.name;
            }
          }
        }
        var source = mapping.source;
        if (source != null && !newSources.has(source)) {
          newSources.add(source);
        }
        var name = mapping.name;
        if (name != null && !newNames.has(name)) {
          newNames.add(name);
        }
      }, this);
      this._sources = newSources;
      this._names = newNames;
      aSourceMapConsumer.sources.forEach(function(sourceFile2) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile2);
        if (content != null) {
          if (aSourceMapPath != null) {
            sourceFile2 = util.join(aSourceMapPath, sourceFile2);
          }
          if (sourceRoot != null) {
            sourceFile2 = util.relative(sourceRoot, sourceFile2);
          }
          this.setSourceContent(sourceFile2, content);
        }
      }, this);
    }, "SourceMapGenerator_applySourceMap");
    SourceMapGenerator.prototype._validateMapping = /* @__PURE__ */ __name(function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
      if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
        throw new Error(
          "original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values."
        );
      }
      if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
        return;
      } else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
        return;
      } else {
        throw new Error("Invalid mapping: " + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        }));
      }
    }, "SourceMapGenerator_validateMapping");
    SourceMapGenerator.prototype._serializeMappings = /* @__PURE__ */ __name(function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = "";
      var next;
      var mapping;
      var nameIdx;
      var sourceIdx;
      var mappings = this._mappings.toArray();
      for (var i = 0, len = mappings.length; i < len; i++) {
        mapping = mappings[i];
        next = "";
        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          while (mapping.generatedLine !== previousGeneratedLine) {
            next += ";";
            previousGeneratedLine++;
          }
        } else {
          if (i > 0) {
            if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
              continue;
            }
            next += ",";
          }
        }
        next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;
        if (mapping.source != null) {
          sourceIdx = this._sources.indexOf(mapping.source);
          next += base64VLQ.encode(sourceIdx - previousSource);
          previousSource = sourceIdx;
          next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;
          next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;
          if (mapping.name != null) {
            nameIdx = this._names.indexOf(mapping.name);
            next += base64VLQ.encode(nameIdx - previousName);
            previousName = nameIdx;
          }
        }
        result += next;
      }
      return result;
    }, "SourceMapGenerator_serializeMappings");
    SourceMapGenerator.prototype._generateSourcesContent = /* @__PURE__ */ __name(function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function(source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot != null) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
      }, this);
    }, "SourceMapGenerator_generateSourcesContent");
    SourceMapGenerator.prototype.toJSON = /* @__PURE__ */ __name(function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._file != null) {
        map.file = this._file;
      }
      if (this._sourceRoot != null) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }
      return map;
    }, "SourceMapGenerator_toJSON");
    SourceMapGenerator.prototype.toString = /* @__PURE__ */ __name(function SourceMapGenerator_toString() {
      return JSON.stringify(this.toJSON());
    }, "SourceMapGenerator_toString");
    exports2.SourceMapGenerator = SourceMapGenerator;
  }
});

// node_modules/source-map/lib/binary-search.js
var require_binary_search = __commonJS({
  "node_modules/source-map/lib/binary-search.js"(exports2) {
    exports2.GREATEST_LOWER_BOUND = 1;
    exports2.LEAST_UPPER_BOUND = 2;
    function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
      var mid = Math.floor((aHigh - aLow) / 2) + aLow;
      var cmp = aCompare(aNeedle, aHaystack[mid], true);
      if (cmp === 0) {
        return mid;
      } else if (cmp > 0) {
        if (aHigh - mid > 1) {
          return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
        }
        if (aBias == exports2.LEAST_UPPER_BOUND) {
          return aHigh < aHaystack.length ? aHigh : -1;
        } else {
          return mid;
        }
      } else {
        if (mid - aLow > 1) {
          return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
        }
        if (aBias == exports2.LEAST_UPPER_BOUND) {
          return mid;
        } else {
          return aLow < 0 ? -1 : aLow;
        }
      }
    }
    __name(recursiveSearch, "recursiveSearch");
    exports2.search = /* @__PURE__ */ __name(function search(aNeedle, aHaystack, aCompare, aBias) {
      if (aHaystack.length === 0) {
        return -1;
      }
      var index = recursiveSearch(
        -1,
        aHaystack.length,
        aNeedle,
        aHaystack,
        aCompare,
        aBias || exports2.GREATEST_LOWER_BOUND
      );
      if (index < 0) {
        return -1;
      }
      while (index - 1 >= 0) {
        if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
          break;
        }
        --index;
      }
      return index;
    }, "search");
  }
});

// node_modules/source-map/lib/quick-sort.js
var require_quick_sort = __commonJS({
  "node_modules/source-map/lib/quick-sort.js"(exports2) {
    function swap(ary, x, y) {
      var temp = ary[x];
      ary[x] = ary[y];
      ary[y] = temp;
    }
    __name(swap, "swap");
    function randomIntInRange(low, high) {
      return Math.round(low + Math.random() * (high - low));
    }
    __name(randomIntInRange, "randomIntInRange");
    function doQuickSort(ary, comparator, p, r) {
      if (p < r) {
        var pivotIndex = randomIntInRange(p, r);
        var i = p - 1;
        swap(ary, pivotIndex, r);
        var pivot = ary[r];
        for (var j = p; j < r; j++) {
          if (comparator(ary[j], pivot) <= 0) {
            i += 1;
            swap(ary, i, j);
          }
        }
        swap(ary, i + 1, j);
        var q = i + 1;
        doQuickSort(ary, comparator, p, q - 1);
        doQuickSort(ary, comparator, q + 1, r);
      }
    }
    __name(doQuickSort, "doQuickSort");
    exports2.quickSort = function(ary, comparator) {
      doQuickSort(ary, comparator, 0, ary.length - 1);
    };
  }
});

// node_modules/source-map/lib/source-map-consumer.js
var require_source_map_consumer = __commonJS({
  "node_modules/source-map/lib/source-map-consumer.js"(exports2) {
    var util = require_util();
    var binarySearch = require_binary_search();
    var ArraySet = require_array_set().ArraySet;
    var base64VLQ = require_base64_vlq();
    var quickSort = require_quick_sort().quickSort;
    function SourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      return sourceMap.sections != null ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL) : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
    }
    __name(SourceMapConsumer, "SourceMapConsumer");
    SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
      return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
    };
    SourceMapConsumer.prototype._version = 3;
    SourceMapConsumer.prototype.__generatedMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, "_generatedMappings", {
      configurable: true,
      enumerable: true,
      get: /* @__PURE__ */ __name(function() {
        if (!this.__generatedMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__generatedMappings;
      }, "get")
    });
    SourceMapConsumer.prototype.__originalMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, "_originalMappings", {
      configurable: true,
      enumerable: true,
      get: /* @__PURE__ */ __name(function() {
        if (!this.__originalMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__originalMappings;
      }, "get")
    });
    SourceMapConsumer.prototype._charIsMappingSeparator = /* @__PURE__ */ __name(function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
      var c = aStr.charAt(index);
      return c === ";" || c === ",";
    }, "SourceMapConsumer_charIsMappingSeparator");
    SourceMapConsumer.prototype._parseMappings = /* @__PURE__ */ __name(function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      throw new Error("Subclasses must implement _parseMappings");
    }, "SourceMapConsumer_parseMappings");
    SourceMapConsumer.GENERATED_ORDER = 1;
    SourceMapConsumer.ORIGINAL_ORDER = 2;
    SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
    SourceMapConsumer.LEAST_UPPER_BOUND = 2;
    SourceMapConsumer.prototype.eachMapping = /* @__PURE__ */ __name(function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
      var mappings;
      switch (order) {
        case SourceMapConsumer.GENERATED_ORDER:
          mappings = this._generatedMappings;
          break;
        case SourceMapConsumer.ORIGINAL_ORDER:
          mappings = this._originalMappings;
          break;
        default:
          throw new Error("Unknown order of iteration.");
      }
      var sourceRoot = this.sourceRoot;
      mappings.map(function(mapping) {
        var source = mapping.source === null ? null : this._sources.at(mapping.source);
        source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL);
        return {
          source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name === null ? null : this._names.at(mapping.name)
        };
      }, this).forEach(aCallback, context);
    }, "SourceMapConsumer_eachMapping");
    SourceMapConsumer.prototype.allGeneratedPositionsFor = /* @__PURE__ */ __name(function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
      var line = util.getArg(aArgs, "line");
      var needle = {
        source: util.getArg(aArgs, "source"),
        originalLine: line,
        originalColumn: util.getArg(aArgs, "column", 0)
      };
      needle.source = this._findSourceIndex(needle.source);
      if (needle.source < 0) {
        return [];
      }
      var mappings = [];
      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util.compareByOriginalPositions,
        binarySearch.LEAST_UPPER_BOUND
      );
      if (index >= 0) {
        var mapping = this._originalMappings[index];
        if (aArgs.column === void 0) {
          var originalLine = mapping.originalLine;
          while (mapping && mapping.originalLine === originalLine) {
            mappings.push({
              line: util.getArg(mapping, "generatedLine", null),
              column: util.getArg(mapping, "generatedColumn", null),
              lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
            });
            mapping = this._originalMappings[++index];
          }
        } else {
          var originalColumn = mapping.originalColumn;
          while (mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn) {
            mappings.push({
              line: util.getArg(mapping, "generatedLine", null),
              column: util.getArg(mapping, "generatedColumn", null),
              lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
            });
            mapping = this._originalMappings[++index];
          }
        }
      }
      return mappings;
    }, "SourceMapConsumer_allGeneratedPositionsFor");
    exports2.SourceMapConsumer = SourceMapConsumer;
    function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      var version = util.getArg(sourceMap, "version");
      var sources = util.getArg(sourceMap, "sources");
      var names = util.getArg(sourceMap, "names", []);
      var sourceRoot = util.getArg(sourceMap, "sourceRoot", null);
      var sourcesContent = util.getArg(sourceMap, "sourcesContent", null);
      var mappings = util.getArg(sourceMap, "mappings");
      var file = util.getArg(sourceMap, "file", null);
      if (version != this._version) {
        throw new Error("Unsupported version: " + version);
      }
      if (sourceRoot) {
        sourceRoot = util.normalize(sourceRoot);
      }
      sources = sources.map(String).map(util.normalize).map(function(source) {
        return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source) ? util.relative(sourceRoot, source) : source;
      });
      this._names = ArraySet.fromArray(names.map(String), true);
      this._sources = ArraySet.fromArray(sources, true);
      this._absoluteSources = this._sources.toArray().map(function(s) {
        return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
      });
      this.sourceRoot = sourceRoot;
      this.sourcesContent = sourcesContent;
      this._mappings = mappings;
      this._sourceMapURL = aSourceMapURL;
      this.file = file;
    }
    __name(BasicSourceMapConsumer, "BasicSourceMapConsumer");
    BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;
    BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
      var relativeSource = aSource;
      if (this.sourceRoot != null) {
        relativeSource = util.relative(this.sourceRoot, relativeSource);
      }
      if (this._sources.has(relativeSource)) {
        return this._sources.indexOf(relativeSource);
      }
      var i;
      for (i = 0; i < this._absoluteSources.length; ++i) {
        if (this._absoluteSources[i] == aSource) {
          return i;
        }
      }
      return -1;
    };
    BasicSourceMapConsumer.fromSourceMap = /* @__PURE__ */ __name(function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
      var smc = Object.create(BasicSourceMapConsumer.prototype);
      var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
      var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(
        smc._sources.toArray(),
        smc.sourceRoot
      );
      smc.file = aSourceMap._file;
      smc._sourceMapURL = aSourceMapURL;
      smc._absoluteSources = smc._sources.toArray().map(function(s) {
        return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
      });
      var generatedMappings = aSourceMap._mappings.toArray().slice();
      var destGeneratedMappings = smc.__generatedMappings = [];
      var destOriginalMappings = smc.__originalMappings = [];
      for (var i = 0, length = generatedMappings.length; i < length; i++) {
        var srcMapping = generatedMappings[i];
        var destMapping = new Mapping();
        destMapping.generatedLine = srcMapping.generatedLine;
        destMapping.generatedColumn = srcMapping.generatedColumn;
        if (srcMapping.source) {
          destMapping.source = sources.indexOf(srcMapping.source);
          destMapping.originalLine = srcMapping.originalLine;
          destMapping.originalColumn = srcMapping.originalColumn;
          if (srcMapping.name) {
            destMapping.name = names.indexOf(srcMapping.name);
          }
          destOriginalMappings.push(destMapping);
        }
        destGeneratedMappings.push(destMapping);
      }
      quickSort(smc.__originalMappings, util.compareByOriginalPositions);
      return smc;
    }, "SourceMapConsumer_fromSourceMap");
    BasicSourceMapConsumer.prototype._version = 3;
    Object.defineProperty(BasicSourceMapConsumer.prototype, "sources", {
      get: /* @__PURE__ */ __name(function() {
        return this._absoluteSources.slice();
      }, "get")
    });
    function Mapping() {
      this.generatedLine = 0;
      this.generatedColumn = 0;
      this.source = null;
      this.originalLine = null;
      this.originalColumn = null;
      this.name = null;
    }
    __name(Mapping, "Mapping");
    BasicSourceMapConsumer.prototype._parseMappings = /* @__PURE__ */ __name(function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var length = aStr.length;
      var index = 0;
      var cachedSegments = {};
      var temp = {};
      var originalMappings = [];
      var generatedMappings = [];
      var mapping, str, segment, end, value;
      while (index < length) {
        if (aStr.charAt(index) === ";") {
          generatedLine++;
          index++;
          previousGeneratedColumn = 0;
        } else if (aStr.charAt(index) === ",") {
          index++;
        } else {
          mapping = new Mapping();
          mapping.generatedLine = generatedLine;
          for (end = index; end < length; end++) {
            if (this._charIsMappingSeparator(aStr, end)) {
              break;
            }
          }
          str = aStr.slice(index, end);
          segment = cachedSegments[str];
          if (segment) {
            index += str.length;
          } else {
            segment = [];
            while (index < end) {
              base64VLQ.decode(aStr, index, temp);
              value = temp.value;
              index = temp.rest;
              segment.push(value);
            }
            if (segment.length === 2) {
              throw new Error("Found a source, but no line and column");
            }
            if (segment.length === 3) {
              throw new Error("Found a source and line, but no column");
            }
            cachedSegments[str] = segment;
          }
          mapping.generatedColumn = previousGeneratedColumn + segment[0];
          previousGeneratedColumn = mapping.generatedColumn;
          if (segment.length > 1) {
            mapping.source = previousSource + segment[1];
            previousSource += segment[1];
            mapping.originalLine = previousOriginalLine + segment[2];
            previousOriginalLine = mapping.originalLine;
            mapping.originalLine += 1;
            mapping.originalColumn = previousOriginalColumn + segment[3];
            previousOriginalColumn = mapping.originalColumn;
            if (segment.length > 4) {
              mapping.name = previousName + segment[4];
              previousName += segment[4];
            }
          }
          generatedMappings.push(mapping);
          if (typeof mapping.originalLine === "number") {
            originalMappings.push(mapping);
          }
        }
      }
      quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
      this.__generatedMappings = generatedMappings;
      quickSort(originalMappings, util.compareByOriginalPositions);
      this.__originalMappings = originalMappings;
    }, "SourceMapConsumer_parseMappings");
    BasicSourceMapConsumer.prototype._findMapping = /* @__PURE__ */ __name(function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator, aBias) {
      if (aNeedle[aLineName] <= 0) {
        throw new TypeError("Line must be greater than or equal to 1, got " + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError("Column must be greater than or equal to 0, got " + aNeedle[aColumnName]);
      }
      return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
    }, "SourceMapConsumer_findMapping");
    BasicSourceMapConsumer.prototype.computeColumnSpans = /* @__PURE__ */ __name(function SourceMapConsumer_computeColumnSpans() {
      for (var index = 0; index < this._generatedMappings.length; ++index) {
        var mapping = this._generatedMappings[index];
        if (index + 1 < this._generatedMappings.length) {
          var nextMapping = this._generatedMappings[index + 1];
          if (mapping.generatedLine === nextMapping.generatedLine) {
            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
            continue;
          }
        }
        mapping.lastGeneratedColumn = Infinity;
      }
    }, "SourceMapConsumer_computeColumnSpans");
    BasicSourceMapConsumer.prototype.originalPositionFor = /* @__PURE__ */ __name(function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, "line"),
        generatedColumn: util.getArg(aArgs, "column")
      };
      var index = this._findMapping(
        needle,
        this._generatedMappings,
        "generatedLine",
        "generatedColumn",
        util.compareByGeneratedPositionsDeflated,
        util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
      );
      if (index >= 0) {
        var mapping = this._generatedMappings[index];
        if (mapping.generatedLine === needle.generatedLine) {
          var source = util.getArg(mapping, "source", null);
          if (source !== null) {
            source = this._sources.at(source);
            source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
          }
          var name = util.getArg(mapping, "name", null);
          if (name !== null) {
            name = this._names.at(name);
          }
          return {
            source,
            line: util.getArg(mapping, "originalLine", null),
            column: util.getArg(mapping, "originalColumn", null),
            name
          };
        }
      }
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }, "SourceMapConsumer_originalPositionFor");
    BasicSourceMapConsumer.prototype.hasContentsOfAllSources = /* @__PURE__ */ __name(function BasicSourceMapConsumer_hasContentsOfAllSources() {
      if (!this.sourcesContent) {
        return false;
      }
      return this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(sc) {
        return sc == null;
      });
    }, "BasicSourceMapConsumer_hasContentsOfAllSources");
    BasicSourceMapConsumer.prototype.sourceContentFor = /* @__PURE__ */ __name(function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      if (!this.sourcesContent) {
        return null;
      }
      var index = this._findSourceIndex(aSource);
      if (index >= 0) {
        return this.sourcesContent[index];
      }
      var relativeSource = aSource;
      if (this.sourceRoot != null) {
        relativeSource = util.relative(this.sourceRoot, relativeSource);
      }
      var url;
      if (this.sourceRoot != null && (url = util.urlParse(this.sourceRoot))) {
        var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
        if (url.scheme == "file" && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
        }
        if ((!url.path || url.path == "/") && this._sources.has("/" + relativeSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
        }
      }
      if (nullOnMissing) {
        return null;
      } else {
        throw new Error('"' + relativeSource + '" is not in the SourceMap.');
      }
    }, "SourceMapConsumer_sourceContentFor");
    BasicSourceMapConsumer.prototype.generatedPositionFor = /* @__PURE__ */ __name(function SourceMapConsumer_generatedPositionFor(aArgs) {
      var source = util.getArg(aArgs, "source");
      source = this._findSourceIndex(source);
      if (source < 0) {
        return {
          line: null,
          column: null,
          lastColumn: null
        };
      }
      var needle = {
        source,
        originalLine: util.getArg(aArgs, "line"),
        originalColumn: util.getArg(aArgs, "column")
      };
      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util.compareByOriginalPositions,
        util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
      );
      if (index >= 0) {
        var mapping = this._originalMappings[index];
        if (mapping.source === needle.source) {
          return {
            line: util.getArg(mapping, "generatedLine", null),
            column: util.getArg(mapping, "generatedColumn", null),
            lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
          };
        }
      }
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }, "SourceMapConsumer_generatedPositionFor");
    exports2.BasicSourceMapConsumer = BasicSourceMapConsumer;
    function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      var version = util.getArg(sourceMap, "version");
      var sections = util.getArg(sourceMap, "sections");
      if (version != this._version) {
        throw new Error("Unsupported version: " + version);
      }
      this._sources = new ArraySet();
      this._names = new ArraySet();
      var lastOffset = {
        line: -1,
        column: 0
      };
      this._sections = sections.map(function(s) {
        if (s.url) {
          throw new Error("Support for url field in sections not implemented.");
        }
        var offset = util.getArg(s, "offset");
        var offsetLine = util.getArg(offset, "line");
        var offsetColumn = util.getArg(offset, "column");
        if (offsetLine < lastOffset.line || offsetLine === lastOffset.line && offsetColumn < lastOffset.column) {
          throw new Error("Section offsets must be ordered and non-overlapping.");
        }
        lastOffset = offset;
        return {
          generatedOffset: {
            // The offset fields are 0-based, but we use 1-based indices when
            // encoding/decoding from VLQ.
            generatedLine: offsetLine + 1,
            generatedColumn: offsetColumn + 1
          },
          consumer: new SourceMapConsumer(util.getArg(s, "map"), aSourceMapURL)
        };
      });
    }
    __name(IndexedSourceMapConsumer, "IndexedSourceMapConsumer");
    IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;
    IndexedSourceMapConsumer.prototype._version = 3;
    Object.defineProperty(IndexedSourceMapConsumer.prototype, "sources", {
      get: /* @__PURE__ */ __name(function() {
        var sources = [];
        for (var i = 0; i < this._sections.length; i++) {
          for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
            sources.push(this._sections[i].consumer.sources[j]);
          }
        }
        return sources;
      }, "get")
    });
    IndexedSourceMapConsumer.prototype.originalPositionFor = /* @__PURE__ */ __name(function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, "line"),
        generatedColumn: util.getArg(aArgs, "column")
      };
      var sectionIndex = binarySearch.search(
        needle,
        this._sections,
        function(needle2, section2) {
          var cmp = needle2.generatedLine - section2.generatedOffset.generatedLine;
          if (cmp) {
            return cmp;
          }
          return needle2.generatedColumn - section2.generatedOffset.generatedColumn;
        }
      );
      var section = this._sections[sectionIndex];
      if (!section) {
        return {
          source: null,
          line: null,
          column: null,
          name: null
        };
      }
      return section.consumer.originalPositionFor({
        line: needle.generatedLine - (section.generatedOffset.generatedLine - 1),
        column: needle.generatedColumn - (section.generatedOffset.generatedLine === needle.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
        bias: aArgs.bias
      });
    }, "IndexedSourceMapConsumer_originalPositionFor");
    IndexedSourceMapConsumer.prototype.hasContentsOfAllSources = /* @__PURE__ */ __name(function IndexedSourceMapConsumer_hasContentsOfAllSources() {
      return this._sections.every(function(s) {
        return s.consumer.hasContentsOfAllSources();
      });
    }, "IndexedSourceMapConsumer_hasContentsOfAllSources");
    IndexedSourceMapConsumer.prototype.sourceContentFor = /* @__PURE__ */ __name(function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        var content = section.consumer.sourceContentFor(aSource, true);
        if (content) {
          return content;
        }
      }
      if (nullOnMissing) {
        return null;
      } else {
        throw new Error('"' + aSource + '" is not in the SourceMap.');
      }
    }, "IndexedSourceMapConsumer_sourceContentFor");
    IndexedSourceMapConsumer.prototype.generatedPositionFor = /* @__PURE__ */ __name(function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        if (section.consumer._findSourceIndex(util.getArg(aArgs, "source")) === -1) {
          continue;
        }
        var generatedPosition = section.consumer.generatedPositionFor(aArgs);
        if (generatedPosition) {
          var ret = {
            line: generatedPosition.line + (section.generatedOffset.generatedLine - 1),
            column: generatedPosition.column + (section.generatedOffset.generatedLine === generatedPosition.line ? section.generatedOffset.generatedColumn - 1 : 0)
          };
          return ret;
        }
      }
      return {
        line: null,
        column: null
      };
    }, "IndexedSourceMapConsumer_generatedPositionFor");
    IndexedSourceMapConsumer.prototype._parseMappings = /* @__PURE__ */ __name(function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      this.__generatedMappings = [];
      this.__originalMappings = [];
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        var sectionMappings = section.consumer._generatedMappings;
        for (var j = 0; j < sectionMappings.length; j++) {
          var mapping = sectionMappings[j];
          var source = section.consumer._sources.at(mapping.source);
          source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
          this._sources.add(source);
          source = this._sources.indexOf(source);
          var name = null;
          if (mapping.name) {
            name = section.consumer._names.at(mapping.name);
            this._names.add(name);
            name = this._names.indexOf(name);
          }
          var adjustedMapping = {
            source,
            generatedLine: mapping.generatedLine + (section.generatedOffset.generatedLine - 1),
            generatedColumn: mapping.generatedColumn + (section.generatedOffset.generatedLine === mapping.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
            originalLine: mapping.originalLine,
            originalColumn: mapping.originalColumn,
            name
          };
          this.__generatedMappings.push(adjustedMapping);
          if (typeof adjustedMapping.originalLine === "number") {
            this.__originalMappings.push(adjustedMapping);
          }
        }
      }
      quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
      quickSort(this.__originalMappings, util.compareByOriginalPositions);
    }, "IndexedSourceMapConsumer_parseMappings");
    exports2.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
  }
});

// node_modules/source-map/lib/source-node.js
var require_source_node = __commonJS({
  "node_modules/source-map/lib/source-node.js"(exports2) {
    var SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
    var util = require_util();
    var REGEX_NEWLINE = /(\r?\n)/;
    var NEWLINE_CODE = 10;
    var isSourceNode = "$$$isSourceNode$$$";
    function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
      this.children = [];
      this.sourceContents = {};
      this.line = aLine == null ? null : aLine;
      this.column = aColumn == null ? null : aColumn;
      this.source = aSource == null ? null : aSource;
      this.name = aName == null ? null : aName;
      this[isSourceNode] = true;
      if (aChunks != null) this.add(aChunks);
    }
    __name(SourceNode, "SourceNode");
    SourceNode.fromStringWithSourceMap = /* @__PURE__ */ __name(function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
      var node = new SourceNode();
      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
      var remainingLinesIndex = 0;
      var shiftNextLine = /* @__PURE__ */ __name(function() {
        var lineContents = getNextLine();
        var newLine = getNextLine() || "";
        return lineContents + newLine;
        function getNextLine() {
          return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : void 0;
        }
        __name(getNextLine, "getNextLine");
      }, "shiftNextLine");
      var lastGeneratedLine = 1, lastGeneratedColumn = 0;
      var lastMapping = null;
      aSourceMapConsumer.eachMapping(function(mapping) {
        if (lastMapping !== null) {
          if (lastGeneratedLine < mapping.generatedLine) {
            addMappingWithCode(lastMapping, shiftNextLine());
            lastGeneratedLine++;
            lastGeneratedColumn = 0;
          } else {
            var nextLine = remainingLines[remainingLinesIndex] || "";
            var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
            remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
            addMappingWithCode(lastMapping, code);
            lastMapping = mapping;
            return;
          }
        }
        while (lastGeneratedLine < mapping.generatedLine) {
          node.add(shiftNextLine());
          lastGeneratedLine++;
        }
        if (lastGeneratedColumn < mapping.generatedColumn) {
          var nextLine = remainingLines[remainingLinesIndex] || "";
          node.add(nextLine.substr(0, mapping.generatedColumn));
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
        }
        lastMapping = mapping;
      }, this);
      if (remainingLinesIndex < remainingLines.length) {
        if (lastMapping) {
          addMappingWithCode(lastMapping, shiftNextLine());
        }
        node.add(remainingLines.splice(remainingLinesIndex).join(""));
      }
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aRelativePath != null) {
            sourceFile = util.join(aRelativePath, sourceFile);
          }
          node.setSourceContent(sourceFile, content);
        }
      });
      return node;
      function addMappingWithCode(mapping, code) {
        if (mapping === null || mapping.source === void 0) {
          node.add(code);
        } else {
          var source = aRelativePath ? util.join(aRelativePath, mapping.source) : mapping.source;
          node.add(new SourceNode(
            mapping.originalLine,
            mapping.originalColumn,
            source,
            code,
            mapping.name
          ));
        }
      }
      __name(addMappingWithCode, "addMappingWithCode");
    }, "SourceNode_fromStringWithSourceMap");
    SourceNode.prototype.add = /* @__PURE__ */ __name(function SourceNode_add(aChunk) {
      if (Array.isArray(aChunk)) {
        aChunk.forEach(function(chunk) {
          this.add(chunk);
        }, this);
      } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        if (aChunk) {
          this.children.push(aChunk);
        }
      } else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    }, "SourceNode_add");
    SourceNode.prototype.prepend = /* @__PURE__ */ __name(function SourceNode_prepend(aChunk) {
      if (Array.isArray(aChunk)) {
        for (var i = aChunk.length - 1; i >= 0; i--) {
          this.prepend(aChunk[i]);
        }
      } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        this.children.unshift(aChunk);
      } else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    }, "SourceNode_prepend");
    SourceNode.prototype.walk = /* @__PURE__ */ __name(function SourceNode_walk(aFn) {
      var chunk;
      for (var i = 0, len = this.children.length; i < len; i++) {
        chunk = this.children[i];
        if (chunk[isSourceNode]) {
          chunk.walk(aFn);
        } else {
          if (chunk !== "") {
            aFn(chunk, {
              source: this.source,
              line: this.line,
              column: this.column,
              name: this.name
            });
          }
        }
      }
    }, "SourceNode_walk");
    SourceNode.prototype.join = /* @__PURE__ */ __name(function SourceNode_join(aSep) {
      var newChildren;
      var i;
      var len = this.children.length;
      if (len > 0) {
        newChildren = [];
        for (i = 0; i < len - 1; i++) {
          newChildren.push(this.children[i]);
          newChildren.push(aSep);
        }
        newChildren.push(this.children[i]);
        this.children = newChildren;
      }
      return this;
    }, "SourceNode_join");
    SourceNode.prototype.replaceRight = /* @__PURE__ */ __name(function SourceNode_replaceRight(aPattern, aReplacement) {
      var lastChild = this.children[this.children.length - 1];
      if (lastChild[isSourceNode]) {
        lastChild.replaceRight(aPattern, aReplacement);
      } else if (typeof lastChild === "string") {
        this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
      } else {
        this.children.push("".replace(aPattern, aReplacement));
      }
      return this;
    }, "SourceNode_replaceRight");
    SourceNode.prototype.setSourceContent = /* @__PURE__ */ __name(function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
    }, "SourceNode_setSourceContent");
    SourceNode.prototype.walkSourceContents = /* @__PURE__ */ __name(function SourceNode_walkSourceContents(aFn) {
      for (var i = 0, len = this.children.length; i < len; i++) {
        if (this.children[i][isSourceNode]) {
          this.children[i].walkSourceContents(aFn);
        }
      }
      var sources = Object.keys(this.sourceContents);
      for (var i = 0, len = sources.length; i < len; i++) {
        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
      }
    }, "SourceNode_walkSourceContents");
    SourceNode.prototype.toString = /* @__PURE__ */ __name(function SourceNode_toString() {
      var str = "";
      this.walk(function(chunk) {
        str += chunk;
      });
      return str;
    }, "SourceNode_toString");
    SourceNode.prototype.toStringWithSourceMap = /* @__PURE__ */ __name(function SourceNode_toStringWithSourceMap(aArgs) {
      var generated = {
        code: "",
        line: 1,
        column: 0
      };
      var map = new SourceMapGenerator(aArgs);
      var sourceMappingActive = false;
      var lastOriginalSource = null;
      var lastOriginalLine = null;
      var lastOriginalColumn = null;
      var lastOriginalName = null;
      this.walk(function(chunk, original) {
        generated.code += chunk;
        if (original.source !== null && original.line !== null && original.column !== null) {
          if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
          lastOriginalSource = original.source;
          lastOriginalLine = original.line;
          lastOriginalColumn = original.column;
          lastOriginalName = original.name;
          sourceMappingActive = true;
        } else if (sourceMappingActive) {
          map.addMapping({
            generated: {
              line: generated.line,
              column: generated.column
            }
          });
          lastOriginalSource = null;
          sourceMappingActive = false;
        }
        for (var idx = 0, length = chunk.length; idx < length; idx++) {
          if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
            generated.line++;
            generated.column = 0;
            if (idx + 1 === length) {
              lastOriginalSource = null;
              sourceMappingActive = false;
            } else if (sourceMappingActive) {
              map.addMapping({
                source: original.source,
                original: {
                  line: original.line,
                  column: original.column
                },
                generated: {
                  line: generated.line,
                  column: generated.column
                },
                name: original.name
              });
            }
          } else {
            generated.column++;
          }
        }
      });
      this.walkSourceContents(function(sourceFile, sourceContent) {
        map.setSourceContent(sourceFile, sourceContent);
      });
      return { code: generated.code, map };
    }, "SourceNode_toStringWithSourceMap");
    exports2.SourceNode = SourceNode;
  }
});

// node_modules/source-map/source-map.js
var require_source_map = __commonJS({
  "node_modules/source-map/source-map.js"(exports2) {
    exports2.SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
    exports2.SourceMapConsumer = require_source_map_consumer().SourceMapConsumer;
    exports2.SourceNode = require_source_node().SourceNode;
  }
});

// node_modules/buffer-from/index.js
var require_buffer_from = __commonJS({
  "node_modules/buffer-from/index.js"(exports2, module2) {
    var toString = Object.prototype.toString;
    var isModern = typeof Buffer !== "undefined" && typeof Buffer.alloc === "function" && typeof Buffer.allocUnsafe === "function" && typeof Buffer.from === "function";
    function isArrayBuffer(input) {
      return toString.call(input).slice(8, -1) === "ArrayBuffer";
    }
    __name(isArrayBuffer, "isArrayBuffer");
    function fromArrayBuffer(obj, byteOffset, length) {
      byteOffset >>>= 0;
      var maxLength = obj.byteLength - byteOffset;
      if (maxLength < 0) {
        throw new RangeError("'offset' is out of bounds");
      }
      if (length === void 0) {
        length = maxLength;
      } else {
        length >>>= 0;
        if (length > maxLength) {
          throw new RangeError("'length' is out of bounds");
        }
      }
      return isModern ? Buffer.from(obj.slice(byteOffset, byteOffset + length)) : new Buffer(new Uint8Array(obj.slice(byteOffset, byteOffset + length)));
    }
    __name(fromArrayBuffer, "fromArrayBuffer");
    function fromString(string, encoding) {
      if (typeof encoding !== "string" || encoding === "") {
        encoding = "utf8";
      }
      if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('"encoding" must be a valid string encoding');
      }
      return isModern ? Buffer.from(string, encoding) : new Buffer(string, encoding);
    }
    __name(fromString, "fromString");
    function bufferFrom(value, encodingOrOffset, length) {
      if (typeof value === "number") {
        throw new TypeError('"value" argument must not be a number');
      }
      if (isArrayBuffer(value)) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof value === "string") {
        return fromString(value, encodingOrOffset);
      }
      return isModern ? Buffer.from(value) : new Buffer(value);
    }
    __name(bufferFrom, "bufferFrom");
    module2.exports = bufferFrom;
  }
});

// node_modules/source-map-support/source-map-support.js
var require_source_map_support = __commonJS({
  "node_modules/source-map-support/source-map-support.js"(exports2, module2) {
    var SourceMapConsumer = require_source_map().SourceMapConsumer;
    var path2 = require("path");
    var fs2;
    try {
      fs2 = require("fs");
      if (!fs2.existsSync || !fs2.readFileSync) {
        fs2 = null;
      }
    } catch (err) {
    }
    var bufferFrom = require_buffer_from();
    function dynamicRequire(mod, request) {
      return mod.require(request);
    }
    __name(dynamicRequire, "dynamicRequire");
    var errorFormatterInstalled = false;
    var uncaughtShimInstalled = false;
    var emptyCacheBetweenOperations = false;
    var environment = "auto";
    var fileContentsCache = {};
    var sourceMapCache = {};
    var reSourceMap = /^data:application\/json[^,]+base64,/;
    var retrieveFileHandlers = [];
    var retrieveMapHandlers = [];
    function isInBrowser() {
      if (environment === "browser")
        return true;
      if (environment === "node")
        return false;
      return typeof window !== "undefined" && typeof XMLHttpRequest === "function" && !(window.require && window.module && window.process && window.process.type === "renderer");
    }
    __name(isInBrowser, "isInBrowser");
    function hasGlobalProcessEventEmitter() {
      return typeof process === "object" && process !== null && typeof process.on === "function";
    }
    __name(hasGlobalProcessEventEmitter, "hasGlobalProcessEventEmitter");
    function globalProcessVersion() {
      if (typeof process === "object" && process !== null) {
        return process.version;
      } else {
        return "";
      }
    }
    __name(globalProcessVersion, "globalProcessVersion");
    function globalProcessStderr() {
      if (typeof process === "object" && process !== null) {
        return process.stderr;
      }
    }
    __name(globalProcessStderr, "globalProcessStderr");
    function globalProcessExit(code) {
      if (typeof process === "object" && process !== null && typeof process.exit === "function") {
        return process.exit(code);
      }
    }
    __name(globalProcessExit, "globalProcessExit");
    function handlerExec(list) {
      return function(arg) {
        for (var i = 0; i < list.length; i++) {
          var ret = list[i](arg);
          if (ret) {
            return ret;
          }
        }
        return null;
      };
    }
    __name(handlerExec, "handlerExec");
    var retrieveFile = handlerExec(retrieveFileHandlers);
    retrieveFileHandlers.push(function(path3) {
      path3 = path3.trim();
      if (/^file:/.test(path3)) {
        path3 = path3.replace(/file:\/\/\/(\w:)?/, function(protocol, drive) {
          return drive ? "" : (
            // file:///C:/dir/file -> C:/dir/file
            "/"
          );
        });
      }
      if (path3 in fileContentsCache) {
        return fileContentsCache[path3];
      }
      var contents = "";
      try {
        if (!fs2) {
          var xhr = new XMLHttpRequest();
          xhr.open(
            "GET",
            path3,
            /** async */
            false
          );
          xhr.send(null);
          if (xhr.readyState === 4 && xhr.status === 200) {
            contents = xhr.responseText;
          }
        } else if (fs2.existsSync(path3)) {
          contents = fs2.readFileSync(path3, "utf8");
        }
      } catch (er) {
      }
      return fileContentsCache[path3] = contents;
    });
    function supportRelativeURL(file, url) {
      if (!file) return url;
      var dir = path2.dirname(file);
      var match = /^\w+:\/\/[^\/]*/.exec(dir);
      var protocol = match ? match[0] : "";
      var startPath = dir.slice(protocol.length);
      if (protocol && /^\/\w\:/.test(startPath)) {
        protocol += "/";
        return protocol + path2.resolve(dir.slice(protocol.length), url).replace(/\\/g, "/");
      }
      return protocol + path2.resolve(dir.slice(protocol.length), url);
    }
    __name(supportRelativeURL, "supportRelativeURL");
    function retrieveSourceMapURL(source) {
      var fileData;
      if (isInBrowser()) {
        try {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", source, false);
          xhr.send(null);
          fileData = xhr.readyState === 4 ? xhr.responseText : null;
          var sourceMapHeader = xhr.getResponseHeader("SourceMap") || xhr.getResponseHeader("X-SourceMap");
          if (sourceMapHeader) {
            return sourceMapHeader;
          }
        } catch (e) {
        }
      }
      fileData = retrieveFile(source);
      var re = /(?:\/\/[@#][\s]*sourceMappingURL=([^\s'"]+)[\s]*$)|(?:\/\*[@#][\s]*sourceMappingURL=([^\s*'"]+)[\s]*(?:\*\/)[\s]*$)/mg;
      var lastMatch, match;
      while (match = re.exec(fileData)) lastMatch = match;
      if (!lastMatch) return null;
      return lastMatch[1];
    }
    __name(retrieveSourceMapURL, "retrieveSourceMapURL");
    var retrieveSourceMap = handlerExec(retrieveMapHandlers);
    retrieveMapHandlers.push(function(source) {
      var sourceMappingURL = retrieveSourceMapURL(source);
      if (!sourceMappingURL) return null;
      var sourceMapData;
      if (reSourceMap.test(sourceMappingURL)) {
        var rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(",") + 1);
        sourceMapData = bufferFrom(rawData, "base64").toString();
        sourceMappingURL = source;
      } else {
        sourceMappingURL = supportRelativeURL(source, sourceMappingURL);
        sourceMapData = retrieveFile(sourceMappingURL);
      }
      if (!sourceMapData) {
        return null;
      }
      return {
        url: sourceMappingURL,
        map: sourceMapData
      };
    });
    function mapSourcePosition(position) {
      var sourceMap = sourceMapCache[position.source];
      if (!sourceMap) {
        var urlAndMap = retrieveSourceMap(position.source);
        if (urlAndMap) {
          sourceMap = sourceMapCache[position.source] = {
            url: urlAndMap.url,
            map: new SourceMapConsumer(urlAndMap.map)
          };
          if (sourceMap.map.sourcesContent) {
            sourceMap.map.sources.forEach(function(source, i) {
              var contents = sourceMap.map.sourcesContent[i];
              if (contents) {
                var url = supportRelativeURL(sourceMap.url, source);
                fileContentsCache[url] = contents;
              }
            });
          }
        } else {
          sourceMap = sourceMapCache[position.source] = {
            url: null,
            map: null
          };
        }
      }
      if (sourceMap && sourceMap.map && typeof sourceMap.map.originalPositionFor === "function") {
        var originalPosition = sourceMap.map.originalPositionFor(position);
        if (originalPosition.source !== null) {
          originalPosition.source = supportRelativeURL(
            sourceMap.url,
            originalPosition.source
          );
          return originalPosition;
        }
      }
      return position;
    }
    __name(mapSourcePosition, "mapSourcePosition");
    function mapEvalOrigin(origin) {
      var match = /^eval at ([^(]+) \((.+):(\d+):(\d+)\)$/.exec(origin);
      if (match) {
        var position = mapSourcePosition({
          source: match[2],
          line: +match[3],
          column: match[4] - 1
        });
        return "eval at " + match[1] + " (" + position.source + ":" + position.line + ":" + (position.column + 1) + ")";
      }
      match = /^eval at ([^(]+) \((.+)\)$/.exec(origin);
      if (match) {
        return "eval at " + match[1] + " (" + mapEvalOrigin(match[2]) + ")";
      }
      return origin;
    }
    __name(mapEvalOrigin, "mapEvalOrigin");
    function CallSiteToString() {
      var fileName;
      var fileLocation = "";
      if (this.isNative()) {
        fileLocation = "native";
      } else {
        fileName = this.getScriptNameOrSourceURL();
        if (!fileName && this.isEval()) {
          fileLocation = this.getEvalOrigin();
          fileLocation += ", ";
        }
        if (fileName) {
          fileLocation += fileName;
        } else {
          fileLocation += "<anonymous>";
        }
        var lineNumber = this.getLineNumber();
        if (lineNumber != null) {
          fileLocation += ":" + lineNumber;
          var columnNumber = this.getColumnNumber();
          if (columnNumber) {
            fileLocation += ":" + columnNumber;
          }
        }
      }
      var line = "";
      var functionName = this.getFunctionName();
      var addSuffix = true;
      var isConstructor = this.isConstructor();
      var isMethodCall = !(this.isToplevel() || isConstructor);
      if (isMethodCall) {
        var typeName = this.getTypeName();
        if (typeName === "[object Object]") {
          typeName = "null";
        }
        var methodName = this.getMethodName();
        if (functionName) {
          if (typeName && functionName.indexOf(typeName) != 0) {
            line += typeName + ".";
          }
          line += functionName;
          if (methodName && functionName.indexOf("." + methodName) != functionName.length - methodName.length - 1) {
            line += " [as " + methodName + "]";
          }
        } else {
          line += typeName + "." + (methodName || "<anonymous>");
        }
      } else if (isConstructor) {
        line += "new " + (functionName || "<anonymous>");
      } else if (functionName) {
        line += functionName;
      } else {
        line += fileLocation;
        addSuffix = false;
      }
      if (addSuffix) {
        line += " (" + fileLocation + ")";
      }
      return line;
    }
    __name(CallSiteToString, "CallSiteToString");
    function cloneCallSite(frame) {
      var object = {};
      Object.getOwnPropertyNames(Object.getPrototypeOf(frame)).forEach(function(name) {
        object[name] = /^(?:is|get)/.test(name) ? function() {
          return frame[name].call(frame);
        } : frame[name];
      });
      object.toString = CallSiteToString;
      return object;
    }
    __name(cloneCallSite, "cloneCallSite");
    function wrapCallSite(frame, state) {
      if (state === void 0) {
        state = { nextPosition: null, curPosition: null };
      }
      if (frame.isNative()) {
        state.curPosition = null;
        return frame;
      }
      var source = frame.getFileName() || frame.getScriptNameOrSourceURL();
      if (source) {
        var line = frame.getLineNumber();
        var column = frame.getColumnNumber() - 1;
        var noHeader = /^v(10\.1[6-9]|10\.[2-9][0-9]|10\.[0-9]{3,}|1[2-9]\d*|[2-9]\d|\d{3,}|11\.11)/;
        var headerLength = noHeader.test(globalProcessVersion()) ? 0 : 62;
        if (line === 1 && column > headerLength && !isInBrowser() && !frame.isEval()) {
          column -= headerLength;
        }
        var position = mapSourcePosition({
          source,
          line,
          column
        });
        state.curPosition = position;
        frame = cloneCallSite(frame);
        var originalFunctionName = frame.getFunctionName;
        frame.getFunctionName = function() {
          if (state.nextPosition == null) {
            return originalFunctionName();
          }
          return state.nextPosition.name || originalFunctionName();
        };
        frame.getFileName = function() {
          return position.source;
        };
        frame.getLineNumber = function() {
          return position.line;
        };
        frame.getColumnNumber = function() {
          return position.column + 1;
        };
        frame.getScriptNameOrSourceURL = function() {
          return position.source;
        };
        return frame;
      }
      var origin = frame.isEval() && frame.getEvalOrigin();
      if (origin) {
        origin = mapEvalOrigin(origin);
        frame = cloneCallSite(frame);
        frame.getEvalOrigin = function() {
          return origin;
        };
        return frame;
      }
      return frame;
    }
    __name(wrapCallSite, "wrapCallSite");
    function prepareStackTrace(error, stack) {
      if (emptyCacheBetweenOperations) {
        fileContentsCache = {};
        sourceMapCache = {};
      }
      var name = error.name || "Error";
      var message = error.message || "";
      var errorString = name + ": " + message;
      var state = { nextPosition: null, curPosition: null };
      var processedStack = [];
      for (var i = stack.length - 1; i >= 0; i--) {
        processedStack.push("\n    at " + wrapCallSite(stack[i], state));
        state.nextPosition = state.curPosition;
      }
      state.curPosition = state.nextPosition = null;
      return errorString + processedStack.reverse().join("");
    }
    __name(prepareStackTrace, "prepareStackTrace");
    function getErrorSource(error) {
      var match = /\n    at [^(]+ \((.*):(\d+):(\d+)\)/.exec(error.stack);
      if (match) {
        var source = match[1];
        var line = +match[2];
        var column = +match[3];
        var contents = fileContentsCache[source];
        if (!contents && fs2 && fs2.existsSync(source)) {
          try {
            contents = fs2.readFileSync(source, "utf8");
          } catch (er) {
            contents = "";
          }
        }
        if (contents) {
          var code = contents.split(/(?:\r\n|\r|\n)/)[line - 1];
          if (code) {
            return source + ":" + line + "\n" + code + "\n" + new Array(column).join(" ") + "^";
          }
        }
      }
      return null;
    }
    __name(getErrorSource, "getErrorSource");
    function printErrorAndExit(error) {
      var source = getErrorSource(error);
      var stderr = globalProcessStderr();
      if (stderr && stderr._handle && stderr._handle.setBlocking) {
        stderr._handle.setBlocking(true);
      }
      if (source) {
        console.error();
        console.error(source);
      }
      console.error(error.stack);
      globalProcessExit(1);
    }
    __name(printErrorAndExit, "printErrorAndExit");
    function shimEmitUncaughtException() {
      var origEmit = process.emit;
      process.emit = function(type) {
        if (type === "uncaughtException") {
          var hasStack = arguments[1] && arguments[1].stack;
          var hasListeners = this.listeners(type).length > 0;
          if (hasStack && !hasListeners) {
            return printErrorAndExit(arguments[1]);
          }
        }
        return origEmit.apply(this, arguments);
      };
    }
    __name(shimEmitUncaughtException, "shimEmitUncaughtException");
    var originalRetrieveFileHandlers = retrieveFileHandlers.slice(0);
    var originalRetrieveMapHandlers = retrieveMapHandlers.slice(0);
    exports2.wrapCallSite = wrapCallSite;
    exports2.getErrorSource = getErrorSource;
    exports2.mapSourcePosition = mapSourcePosition;
    exports2.retrieveSourceMap = retrieveSourceMap;
    exports2.install = function(options) {
      options = options || {};
      if (options.environment) {
        environment = options.environment;
        if (["node", "browser", "auto"].indexOf(environment) === -1) {
          throw new Error("environment " + environment + " was unknown. Available options are {auto, browser, node}");
        }
      }
      if (options.retrieveFile) {
        if (options.overrideRetrieveFile) {
          retrieveFileHandlers.length = 0;
        }
        retrieveFileHandlers.unshift(options.retrieveFile);
      }
      if (options.retrieveSourceMap) {
        if (options.overrideRetrieveSourceMap) {
          retrieveMapHandlers.length = 0;
        }
        retrieveMapHandlers.unshift(options.retrieveSourceMap);
      }
      if (options.hookRequire && !isInBrowser()) {
        var Module = dynamicRequire(module2, "module");
        var $compile = Module.prototype._compile;
        if (!$compile.__sourceMapSupport) {
          Module.prototype._compile = function(content, filename) {
            fileContentsCache[filename] = content;
            sourceMapCache[filename] = void 0;
            return $compile.call(this, content, filename);
          };
          Module.prototype._compile.__sourceMapSupport = true;
        }
      }
      if (!emptyCacheBetweenOperations) {
        emptyCacheBetweenOperations = "emptyCacheBetweenOperations" in options ? options.emptyCacheBetweenOperations : false;
      }
      if (!errorFormatterInstalled) {
        errorFormatterInstalled = true;
        Error.prepareStackTrace = prepareStackTrace;
      }
      if (!uncaughtShimInstalled) {
        var installHandler = "handleUncaughtExceptions" in options ? options.handleUncaughtExceptions : true;
        try {
          var worker_threads = dynamicRequire(module2, "worker_threads");
          if (worker_threads.isMainThread === false) {
            installHandler = false;
          }
        } catch (e) {
        }
        if (installHandler && hasGlobalProcessEventEmitter()) {
          uncaughtShimInstalled = true;
          shimEmitUncaughtException();
        }
      }
    };
    exports2.resetRetrieveHandlers = function() {
      retrieveFileHandlers.length = 0;
      retrieveMapHandlers.length = 0;
      retrieveFileHandlers = originalRetrieveFileHandlers.slice(0);
      retrieveMapHandlers = originalRetrieveMapHandlers.slice(0);
      retrieveSourceMap = handlerExec(retrieveMapHandlers);
      retrieveFile = handlerExec(retrieveFileHandlers);
    };
  }
});

// node_modules/jsbi/dist/jsbi-cjs.js
var require_jsbi_cjs = __commonJS({
  "node_modules/jsbi/dist/jsbi-cjs.js"(exports2, module2) {
    "use strict";
    var JSBI = class _JSBI extends Array {
      static {
        __name(this, "JSBI");
      }
      constructor(a, b) {
        if (a > _JSBI.__kMaxLength) throw new RangeError("Maximum BigInt size exceeded");
        super(a), this.sign = b;
      }
      static BigInt(a) {
        var b = Math.floor, c = Number.isFinite;
        if ("number" == typeof a) {
          if (0 === a) return _JSBI.__zero();
          if ((0 | a) === a) return 0 > a ? _JSBI.__oneDigit(-a, true) : _JSBI.__oneDigit(a, false);
          if (!c(a) || b(a) !== a) throw new RangeError("The number " + a + " cannot be converted to BigInt because it is not an integer");
          return _JSBI.__fromDouble(a);
        }
        if ("string" == typeof a) {
          const b2 = _JSBI.__fromString(a);
          if (null === b2) throw new SyntaxError("Cannot convert " + a + " to a BigInt");
          return b2;
        }
        if ("boolean" == typeof a) return true === a ? _JSBI.__oneDigit(1, false) : _JSBI.__zero();
        if ("object" == typeof a) {
          if (a.constructor === _JSBI) return a;
          const b2 = _JSBI.__toPrimitive(a);
          return _JSBI.BigInt(b2);
        }
        throw new TypeError("Cannot convert " + a + " to a BigInt");
      }
      toDebugString() {
        const a = ["BigInt["];
        for (const b of this) a.push((b ? (b >>> 0).toString(16) : b) + ", ");
        return a.push("]"), a.join("");
      }
      toString(a = 10) {
        if (2 > a || 36 < a) throw new RangeError("toString() radix argument must be between 2 and 36");
        return 0 === this.length ? "0" : 0 == (a & a - 1) ? _JSBI.__toStringBasePowerOfTwo(this, a) : _JSBI.__toStringGeneric(this, a, false);
      }
      static toNumber(a) {
        var b = Math.clz32;
        const c = a.length;
        if (0 === c) return 0;
        if (1 === c) {
          const b2 = a.__unsignedDigit(0);
          return a.sign ? -b2 : b2;
        }
        const d = a.__digit(c - 1), e = b(d), f = 32 * c - e;
        if (1024 < f) return a.sign ? -Infinity : 1 / 0;
        let g = f - 1, h = d, i = c - 1;
        const j = e + 1;
        let k = 32 === j ? 0 : h << j;
        k >>>= 12;
        const l = j - 12;
        let m = 12 <= j ? 0 : h << 20 + j, n = 20 + j;
        0 < l && 0 < i && (i--, h = a.__digit(i), k |= h >>> 32 - l, m = h << l, n = l), 0 < n && 0 < i && (i--, h = a.__digit(i), m |= h >>> 32 - n, n -= 32);
        const o = _JSBI.__decideRounding(a, n, i, h);
        if ((1 === o || 0 === o && 1 == (1 & m)) && (m = m + 1 >>> 0, 0 == m && (k++, 0 != k >>> 20 && (k = 0, g++, 1023 < g)))) return a.sign ? -Infinity : 1 / 0;
        const p = a.sign ? -2147483648 : 0;
        return g = g + 1023 << 20, _JSBI.__kBitConversionInts[1] = p | g | k, _JSBI.__kBitConversionInts[0] = m, _JSBI.__kBitConversionDouble[0];
      }
      static unaryMinus(a) {
        if (0 === a.length) return a;
        const b = a.__copy();
        return b.sign = !a.sign, b;
      }
      static bitwiseNot(a) {
        return a.sign ? _JSBI.__absoluteSubOne(a).__trim() : _JSBI.__absoluteAddOne(a, true);
      }
      static exponentiate(a, b) {
        if (b.sign) throw new RangeError("Exponent must be positive");
        if (0 === b.length) return _JSBI.__oneDigit(1, false);
        if (0 === a.length) return a;
        if (1 === a.length && 1 === a.__digit(0)) return a.sign && 0 == (1 & b.__digit(0)) ? _JSBI.unaryMinus(a) : a;
        if (1 < b.length) throw new RangeError("BigInt too big");
        let c = b.__unsignedDigit(0);
        if (1 === c) return a;
        if (c >= _JSBI.__kMaxLengthBits) throw new RangeError("BigInt too big");
        if (1 === a.length && 2 === a.__digit(0)) {
          const b2 = 1 + (c >>> 5), d2 = a.sign && 0 != (1 & c), e2 = new _JSBI(b2, d2);
          e2.__initializeDigits();
          const f = 1 << (31 & c);
          return e2.__setDigit(b2 - 1, f), e2;
        }
        let d = null, e = a;
        for (0 != (1 & c) && (d = a), c >>= 1; 0 !== c; c >>= 1) e = _JSBI.multiply(e, e), 0 != (1 & c) && (null === d ? d = e : d = _JSBI.multiply(d, e));
        return d;
      }
      static multiply(a, b) {
        if (0 === a.length) return a;
        if (0 === b.length) return b;
        let c = a.length + b.length;
        32 <= a.__clzmsd() + b.__clzmsd() && c--;
        const d = new _JSBI(c, a.sign !== b.sign);
        d.__initializeDigits();
        for (let c2 = 0; c2 < a.length; c2++) _JSBI.__multiplyAccumulate(b, a.__digit(c2), d, c2);
        return d.__trim();
      }
      static divide(a, b) {
        if (0 === b.length) throw new RangeError("Division by zero");
        if (0 > _JSBI.__absoluteCompare(a, b)) return _JSBI.__zero();
        const c = a.sign !== b.sign, d = b.__unsignedDigit(0);
        let e;
        if (1 === b.length && 65535 >= d) {
          if (1 === d) return c === a.sign ? a : _JSBI.unaryMinus(a);
          e = _JSBI.__absoluteDivSmall(a, d, null);
        } else e = _JSBI.__absoluteDivLarge(a, b, true, false);
        return e.sign = c, e.__trim();
      }
      static remainder(a, b) {
        if (0 === b.length) throw new RangeError("Division by zero");
        if (0 > _JSBI.__absoluteCompare(a, b)) return a;
        const c = b.__unsignedDigit(0);
        if (1 === b.length && 65535 >= c) {
          if (1 === c) return _JSBI.__zero();
          const b2 = _JSBI.__absoluteModSmall(a, c);
          return 0 === b2 ? _JSBI.__zero() : _JSBI.__oneDigit(b2, a.sign);
        }
        const d = _JSBI.__absoluteDivLarge(a, b, false, true);
        return d.sign = a.sign, d.__trim();
      }
      static add(a, b) {
        const c = a.sign;
        return c === b.sign ? _JSBI.__absoluteAdd(a, b, c) : 0 <= _JSBI.__absoluteCompare(a, b) ? _JSBI.__absoluteSub(a, b, c) : _JSBI.__absoluteSub(b, a, !c);
      }
      static subtract(a, b) {
        const c = a.sign;
        return c === b.sign ? 0 <= _JSBI.__absoluteCompare(a, b) ? _JSBI.__absoluteSub(a, b, c) : _JSBI.__absoluteSub(b, a, !c) : _JSBI.__absoluteAdd(a, b, c);
      }
      static leftShift(a, b) {
        return 0 === b.length || 0 === a.length ? a : b.sign ? _JSBI.__rightShiftByAbsolute(a, b) : _JSBI.__leftShiftByAbsolute(a, b);
      }
      static signedRightShift(a, b) {
        return 0 === b.length || 0 === a.length ? a : b.sign ? _JSBI.__leftShiftByAbsolute(a, b) : _JSBI.__rightShiftByAbsolute(a, b);
      }
      static unsignedRightShift() {
        throw new TypeError("BigInts have no unsigned right shift; use >> instead");
      }
      static lessThan(a, b) {
        return 0 > _JSBI.__compareToBigInt(a, b);
      }
      static lessThanOrEqual(a, b) {
        return 0 >= _JSBI.__compareToBigInt(a, b);
      }
      static greaterThan(a, b) {
        return 0 < _JSBI.__compareToBigInt(a, b);
      }
      static greaterThanOrEqual(a, b) {
        return 0 <= _JSBI.__compareToBigInt(a, b);
      }
      static equal(a, b) {
        if (a.sign !== b.sign) return false;
        if (a.length !== b.length) return false;
        for (let c = 0; c < a.length; c++) if (a.__digit(c) !== b.__digit(c)) return false;
        return true;
      }
      static bitwiseAnd(a, b) {
        var c = Math.max;
        if (!a.sign && !b.sign) return _JSBI.__absoluteAnd(a, b).__trim();
        if (a.sign && b.sign) {
          const d = c(a.length, b.length) + 1;
          let e = _JSBI.__absoluteSubOne(a, d);
          const f = _JSBI.__absoluteSubOne(b);
          return e = _JSBI.__absoluteOr(e, f, e), _JSBI.__absoluteAddOne(e, true, e).__trim();
        }
        return a.sign && ([a, b] = [b, a]), _JSBI.__absoluteAndNot(a, _JSBI.__absoluteSubOne(b)).__trim();
      }
      static bitwiseXor(a, b) {
        var c = Math.max;
        if (!a.sign && !b.sign) return _JSBI.__absoluteXor(a, b).__trim();
        if (a.sign && b.sign) {
          const d2 = c(a.length, b.length), e2 = _JSBI.__absoluteSubOne(a, d2), f = _JSBI.__absoluteSubOne(b);
          return _JSBI.__absoluteXor(e2, f, e2).__trim();
        }
        const d = c(a.length, b.length) + 1;
        a.sign && ([a, b] = [b, a]);
        let e = _JSBI.__absoluteSubOne(b, d);
        return e = _JSBI.__absoluteXor(e, a, e), _JSBI.__absoluteAddOne(e, true, e).__trim();
      }
      static bitwiseOr(a, b) {
        var c = Math.max;
        const d = c(a.length, b.length);
        if (!a.sign && !b.sign) return _JSBI.__absoluteOr(a, b).__trim();
        if (a.sign && b.sign) {
          let c2 = _JSBI.__absoluteSubOne(a, d);
          const e2 = _JSBI.__absoluteSubOne(b);
          return c2 = _JSBI.__absoluteAnd(c2, e2, c2), _JSBI.__absoluteAddOne(c2, true, c2).__trim();
        }
        a.sign && ([a, b] = [b, a]);
        let e = _JSBI.__absoluteSubOne(b, d);
        return e = _JSBI.__absoluteAndNot(e, a, e), _JSBI.__absoluteAddOne(e, true, e).__trim();
      }
      static ADD(a, b) {
        if (a = _JSBI.__toPrimitive(a), b = _JSBI.__toPrimitive(b), "string" == typeof a) return "string" != typeof b && (b = b.toString()), a + b;
        if ("string" == typeof b) return a.toString() + b;
        if (a = _JSBI.__toNumeric(a), b = _JSBI.__toNumeric(b), _JSBI.__isBigInt(a) && _JSBI.__isBigInt(b)) return _JSBI.add(a, b);
        if ("number" == typeof a && "number" == typeof b) return a + b;
        throw new TypeError("Cannot mix BigInt and other types, use explicit conversions");
      }
      static LT(a, b) {
        return _JSBI.__compare(a, b, 0);
      }
      static LE(a, b) {
        return _JSBI.__compare(a, b, 1);
      }
      static GT(a, b) {
        return _JSBI.__compare(a, b, 2);
      }
      static GE(a, b) {
        return _JSBI.__compare(a, b, 3);
      }
      static EQ(a, b) {
        for (; ; ) {
          if (_JSBI.__isBigInt(a)) return _JSBI.__isBigInt(b) ? _JSBI.equal(a, b) : _JSBI.EQ(b, a);
          if ("number" == typeof a) {
            if (_JSBI.__isBigInt(b)) return _JSBI.__equalToNumber(b, a);
            if ("object" != typeof b) return a == b;
            b = _JSBI.__toPrimitive(b);
          } else if ("string" == typeof a) {
            if (_JSBI.__isBigInt(b)) return a = _JSBI.__fromString(a), null !== a && _JSBI.equal(a, b);
            if ("object" != typeof b) return a == b;
            b = _JSBI.__toPrimitive(b);
          } else if ("boolean" == typeof a) {
            if (_JSBI.__isBigInt(b)) return _JSBI.__equalToNumber(b, +a);
            if ("object" != typeof b) return a == b;
            b = _JSBI.__toPrimitive(b);
          } else if ("symbol" == typeof a) {
            if (_JSBI.__isBigInt(b)) return false;
            if ("object" != typeof b) return a == b;
            b = _JSBI.__toPrimitive(b);
          } else if ("object" == typeof a) {
            if ("object" == typeof b && b.constructor !== _JSBI) return a == b;
            a = _JSBI.__toPrimitive(a);
          } else return a == b;
        }
      }
      static __zero() {
        return new _JSBI(0, false);
      }
      static __oneDigit(a, b) {
        const c = new _JSBI(1, b);
        return c.__setDigit(0, a), c;
      }
      __copy() {
        const a = new _JSBI(this.length, this.sign);
        for (let b = 0; b < this.length; b++) a[b] = this[b];
        return a;
      }
      __trim() {
        let a = this.length, b = this[a - 1];
        for (; 0 === b; ) a--, b = this[a - 1], this.pop();
        return 0 === a && (this.sign = false), this;
      }
      __initializeDigits() {
        for (let a = 0; a < this.length; a++) this[a] = 0;
      }
      static __decideRounding(a, b, c, d) {
        if (0 < b) return -1;
        let e;
        if (0 > b) e = -b - 1;
        else {
          if (0 === c) return -1;
          c--, d = a.__digit(c), e = 31;
        }
        let f = 1 << e;
        if (0 == (d & f)) return -1;
        if (f -= 1, 0 != (d & f)) return 1;
        for (; 0 < c; ) if (c--, 0 !== a.__digit(c)) return 1;
        return 0;
      }
      static __fromDouble(a) {
        _JSBI.__kBitConversionDouble[0] = a;
        const b = 2047 & _JSBI.__kBitConversionInts[1] >>> 20, c = b - 1023, d = (c >>> 5) + 1, e = new _JSBI(d, 0 > a);
        let f = 1048575 & _JSBI.__kBitConversionInts[1] | 1048576, g = _JSBI.__kBitConversionInts[0];
        const h = 20, i = 31 & c;
        let j, k = 0;
        if (i < 20) {
          const a2 = h - i;
          k = a2 + 32, j = f >>> a2, f = f << 32 - a2 | g >>> a2, g <<= 32 - a2;
        } else if (i === 20) k = 32, j = f, f = g;
        else {
          const a2 = i - h;
          k = 32 - a2, j = f << a2 | g >>> 32 - a2, f = g << a2;
        }
        e.__setDigit(d - 1, j);
        for (let b2 = d - 2; 0 <= b2; b2--) 0 < k ? (k -= 32, j = f, f = g) : j = 0, e.__setDigit(b2, j);
        return e.__trim();
      }
      static __isWhitespace(a) {
        return !!(13 >= a && 9 <= a) || (159 >= a ? 32 == a : 131071 >= a ? 160 == a || 5760 == a : 196607 >= a ? (a &= 131071, 10 >= a || 40 == a || 41 == a || 47 == a || 95 == a || 4096 == a) : 65279 == a);
      }
      static __fromString(a, b = 0) {
        let c = 0;
        const e = a.length;
        let f = 0;
        if (f === e) return _JSBI.__zero();
        let g = a.charCodeAt(f);
        for (; _JSBI.__isWhitespace(g); ) {
          if (++f === e) return _JSBI.__zero();
          g = a.charCodeAt(f);
        }
        if (43 === g) {
          if (++f === e) return null;
          g = a.charCodeAt(f), c = 1;
        } else if (45 === g) {
          if (++f === e) return null;
          g = a.charCodeAt(f), c = -1;
        }
        if (0 === b) {
          if (b = 10, 48 === g) {
            if (++f === e) return _JSBI.__zero();
            if (g = a.charCodeAt(f), 88 === g || 120 === g) {
              if (b = 16, ++f === e) return null;
              g = a.charCodeAt(f);
            } else if (79 === g || 111 === g) {
              if (b = 8, ++f === e) return null;
              g = a.charCodeAt(f);
            } else if (66 === g || 98 === g) {
              if (b = 2, ++f === e) return null;
              g = a.charCodeAt(f);
            }
          }
        } else if (16 === b && 48 === g) {
          if (++f === e) return _JSBI.__zero();
          if (g = a.charCodeAt(f), 88 === g || 120 === g) {
            if (++f === e) return null;
            g = a.charCodeAt(f);
          }
        }
        for (; 48 === g; ) {
          if (++f === e) return _JSBI.__zero();
          g = a.charCodeAt(f);
        }
        const h = e - f;
        let i = _JSBI.__kMaxBitsPerChar[b], j = _JSBI.__kBitsPerCharTableMultiplier - 1;
        if (h > 1073741824 / i) return null;
        const k = i * h + j >>> _JSBI.__kBitsPerCharTableShift, l = new _JSBI(k + 31 >>> 5, false), n = 10 > b ? b : 10, o = 10 < b ? b - 10 : 0;
        if (0 == (b & b - 1)) {
          i >>= _JSBI.__kBitsPerCharTableShift;
          const b2 = [], c2 = [];
          let d = false;
          do {
            let h2 = 0, j2 = 0;
            for (; ; ) {
              let b3;
              if (g - 48 >>> 0 < n) b3 = g - 48;
              else if ((32 | g) - 97 >>> 0 < o) b3 = (32 | g) - 87;
              else {
                d = true;
                break;
              }
              if (j2 += i, h2 = h2 << i | b3, ++f === e) {
                d = true;
                break;
              }
              if (g = a.charCodeAt(f), 32 < j2 + i) break;
            }
            b2.push(h2), c2.push(j2);
          } while (!d);
          _JSBI.__fillFromParts(l, b2, c2);
        } else {
          l.__initializeDigits();
          let c2 = false, h2 = 0;
          do {
            let k2 = 0, p = 1;
            for (; ; ) {
              let i2;
              if (g - 48 >>> 0 < n) i2 = g - 48;
              else if ((32 | g) - 97 >>> 0 < o) i2 = (32 | g) - 87;
              else {
                c2 = true;
                break;
              }
              const d = p * b;
              if (4294967295 < d) break;
              if (p = d, k2 = k2 * b + i2, h2++, ++f === e) {
                c2 = true;
                break;
              }
              g = a.charCodeAt(f);
            }
            j = 32 * _JSBI.__kBitsPerCharTableMultiplier - 1;
            const q = i * h2 + j >>> _JSBI.__kBitsPerCharTableShift + 5;
            l.__inplaceMultiplyAdd(p, k2, q);
          } while (!c2);
        }
        for (; f !== e; ) {
          if (!_JSBI.__isWhitespace(g)) return null;
          g = a.charCodeAt(f++);
        }
        return 0 != c && 10 !== b ? null : (l.sign = -1 == c, l.__trim());
      }
      static __fillFromParts(a, b, c) {
        let d = 0, e = 0, f = 0;
        for (let g = b.length - 1; 0 <= g; g--) {
          const h = b[g], i = c[g];
          e |= h << f, f += i, 32 === f ? (a.__setDigit(d++, e), f = 0, e = 0) : 32 < f && (a.__setDigit(d++, e), f -= 32, e = h >>> i - f);
        }
        if (0 !== e) {
          if (d >= a.length) throw new Error("implementation bug");
          a.__setDigit(d++, e);
        }
        for (; d < a.length; d++) a.__setDigit(d, 0);
      }
      static __toStringBasePowerOfTwo(a, b) {
        var c = Math.clz32;
        const d = a.length;
        let e = b - 1;
        e = (85 & e >>> 1) + (85 & e), e = (51 & e >>> 2) + (51 & e), e = (15 & e >>> 4) + (15 & e);
        const f = e, g = b - 1, h = a.__digit(d - 1), i = c(h);
        let j = 0 | (32 * d - i + f - 1) / f;
        if (a.sign && j++, 268435456 < j) throw new Error("string too long");
        const k = Array(j);
        let l = j - 1, m = 0, n = 0;
        for (let c2 = 0; c2 < d - 1; c2++) {
          const b2 = a.__digit(c2), d2 = (m | b2 << n) & g;
          k[l--] = _JSBI.__kConversionChars[d2];
          const e2 = f - n;
          for (m = b2 >>> e2, n = 32 - e2; n >= f; ) k[l--] = _JSBI.__kConversionChars[m & g], m >>>= f, n -= f;
        }
        const o = (m | h << n) & g;
        for (k[l--] = _JSBI.__kConversionChars[o], m = h >>> f - n; 0 !== m; ) k[l--] = _JSBI.__kConversionChars[m & g], m >>>= f;
        if (a.sign && (k[l--] = "-"), -1 != l) throw new Error("implementation bug");
        return k.join("");
      }
      static __toStringGeneric(a, b, c) {
        var d = Math.clz32;
        const e = a.length;
        if (0 === e) return "";
        if (1 === e) {
          let d2 = a.__unsignedDigit(0).toString(b);
          return false === c && a.sign && (d2 = "-" + d2), d2;
        }
        const f = 32 * e - d(a.__digit(e - 1)), g = _JSBI.__kMaxBitsPerChar[b], h = g - 1;
        let i = f * _JSBI.__kBitsPerCharTableMultiplier;
        i += h - 1, i = 0 | i / h;
        const j = i + 1 >> 1, k = _JSBI.exponentiate(_JSBI.__oneDigit(b, false), _JSBI.__oneDigit(j, false));
        let l, m;
        const n = k.__unsignedDigit(0);
        if (1 === k.length && 65535 >= n) {
          l = new _JSBI(a.length, false), l.__initializeDigits();
          let c2 = 0;
          for (let b2 = 2 * a.length - 1; 0 <= b2; b2--) {
            const d2 = c2 << 16 | a.__halfDigit(b2);
            l.__setHalfDigit(b2, 0 | d2 / n), c2 = 0 | d2 % n;
          }
          m = c2.toString(b);
        } else {
          const c2 = _JSBI.__absoluteDivLarge(a, k, true, true);
          l = c2.quotient;
          const d2 = c2.remainder.__trim();
          m = _JSBI.__toStringGeneric(d2, b, true);
        }
        l.__trim();
        let o = _JSBI.__toStringGeneric(l, b, true);
        for (; m.length < j; ) m = "0" + m;
        return false === c && a.sign && (o = "-" + o), o + m;
      }
      static __unequalSign(a) {
        return a ? -1 : 1;
      }
      static __absoluteGreater(a) {
        return a ? -1 : 1;
      }
      static __absoluteLess(a) {
        return a ? 1 : -1;
      }
      static __compareToBigInt(a, b) {
        const c = a.sign;
        if (c !== b.sign) return _JSBI.__unequalSign(c);
        const d = _JSBI.__absoluteCompare(a, b);
        return 0 < d ? _JSBI.__absoluteGreater(c) : 0 > d ? _JSBI.__absoluteLess(c) : 0;
      }
      static __compareToNumber(a, b) {
        if (b | true) {
          const c = a.sign, d = 0 > b;
          if (c !== d) return _JSBI.__unequalSign(c);
          if (0 === a.length) {
            if (d) throw new Error("implementation bug");
            return 0 === b ? 0 : -1;
          }
          if (1 < a.length) return _JSBI.__absoluteGreater(c);
          const e = Math.abs(b), f = a.__unsignedDigit(0);
          return f > e ? _JSBI.__absoluteGreater(c) : f < e ? _JSBI.__absoluteLess(c) : 0;
        }
        return _JSBI.__compareToDouble(a, b);
      }
      static __compareToDouble(a, b) {
        var c = Math.clz32;
        if (b !== b) return b;
        if (b === 1 / 0) return -1;
        if (b === -Infinity) return 1;
        const d = a.sign;
        if (d !== 0 > b) return _JSBI.__unequalSign(d);
        if (0 === b) throw new Error("implementation bug: should be handled elsewhere");
        if (0 === a.length) return -1;
        _JSBI.__kBitConversionDouble[0] = b;
        const e = 2047 & _JSBI.__kBitConversionInts[1] >>> 20;
        if (2047 == e) throw new Error("implementation bug: handled elsewhere");
        const f = e - 1023;
        if (0 > f) return _JSBI.__absoluteGreater(d);
        const g = a.length;
        let h = a.__digit(g - 1);
        const i = c(h), j = 32 * g - i, k = f + 1;
        if (j < k) return _JSBI.__absoluteLess(d);
        if (j > k) return _JSBI.__absoluteGreater(d);
        let l = 1048576 | 1048575 & _JSBI.__kBitConversionInts[1], m = _JSBI.__kBitConversionInts[0];
        const n = 20, o = 31 - i;
        if (o !== (j - 1) % 31) throw new Error("implementation bug");
        let p, q = 0;
        if (20 > o) {
          const a2 = n - o;
          q = a2 + 32, p = l >>> a2, l = l << 32 - a2 | m >>> a2, m <<= 32 - a2;
        } else if (20 === o) q = 32, p = l, l = m;
        else {
          const a2 = o - n;
          q = 32 - a2, p = l << a2 | m >>> 32 - a2, l = m << a2;
        }
        if (h >>>= 0, p >>>= 0, h > p) return _JSBI.__absoluteGreater(d);
        if (h < p) return _JSBI.__absoluteLess(d);
        for (let c2 = g - 2; 0 <= c2; c2--) {
          0 < q ? (q -= 32, p = l >>> 0, l = m, m = 0) : p = 0;
          const b2 = a.__unsignedDigit(c2);
          if (b2 > p) return _JSBI.__absoluteGreater(d);
          if (b2 < p) return _JSBI.__absoluteLess(d);
        }
        if (0 !== l || 0 !== m) {
          if (0 === q) throw new Error("implementation bug");
          return _JSBI.__absoluteLess(d);
        }
        return 0;
      }
      static __equalToNumber(a, b) {
        var c = Math.abs;
        return b | 0 === b ? 0 === b ? 0 === a.length : 1 === a.length && a.sign === 0 > b && a.__unsignedDigit(0) === c(b) : 0 === _JSBI.__compareToDouble(a, b);
      }
      static __comparisonResultToBool(a, b) {
        switch (b) {
          case 0:
            return 0 > a;
          case 1:
            return 0 >= a;
          case 2:
            return 0 < a;
          case 3:
            return 0 <= a;
        }
        throw new Error("unreachable");
      }
      static __compare(a, b, c) {
        if (a = _JSBI.__toPrimitive(a), b = _JSBI.__toPrimitive(b), "string" == typeof a && "string" == typeof b) switch (c) {
          case 0:
            return a < b;
          case 1:
            return a <= b;
          case 2:
            return a > b;
          case 3:
            return a >= b;
        }
        if (_JSBI.__isBigInt(a) && "string" == typeof b) return b = _JSBI.__fromString(b), null !== b && _JSBI.__comparisonResultToBool(_JSBI.__compareToBigInt(a, b), c);
        if ("string" == typeof a && _JSBI.__isBigInt(b)) return a = _JSBI.__fromString(a), null !== a && _JSBI.__comparisonResultToBool(_JSBI.__compareToBigInt(a, b), c);
        if (a = _JSBI.__toNumeric(a), b = _JSBI.__toNumeric(b), _JSBI.__isBigInt(a)) {
          if (_JSBI.__isBigInt(b)) return _JSBI.__comparisonResultToBool(_JSBI.__compareToBigInt(a, b), c);
          if ("number" != typeof b) throw new Error("implementation bug");
          return _JSBI.__comparisonResultToBool(_JSBI.__compareToNumber(a, b), c);
        }
        if ("number" != typeof a) throw new Error("implementation bug");
        if (_JSBI.__isBigInt(b)) return _JSBI.__comparisonResultToBool(_JSBI.__compareToNumber(b, a), 2 ^ c);
        if ("number" != typeof b) throw new Error("implementation bug");
        return 0 === c ? a < b : 1 === c ? a <= b : 2 === c ? a > b : 3 === c ? a >= b : void 0;
      }
      __clzmsd() {
        return Math.clz32(this[this.length - 1]);
      }
      static __absoluteAdd(a, b, c) {
        if (a.length < b.length) return _JSBI.__absoluteAdd(b, a, c);
        if (0 === a.length) return a;
        if (0 === b.length) return a.sign === c ? a : _JSBI.unaryMinus(a);
        let d = a.length;
        (0 === a.__clzmsd() || b.length === a.length && 0 === b.__clzmsd()) && d++;
        const e = new _JSBI(d, c);
        let f = 0, g = 0;
        for (; g < b.length; g++) {
          const c2 = b.__digit(g), d2 = a.__digit(g), h = (65535 & d2) + (65535 & c2) + f, i = (d2 >>> 16) + (c2 >>> 16) + (h >>> 16);
          f = i >>> 16, e.__setDigit(g, 65535 & h | i << 16);
        }
        for (; g < a.length; g++) {
          const b2 = a.__digit(g), c2 = (65535 & b2) + f, d2 = (b2 >>> 16) + (c2 >>> 16);
          f = d2 >>> 16, e.__setDigit(g, 65535 & c2 | d2 << 16);
        }
        return g < e.length && e.__setDigit(g, f), e.__trim();
      }
      static __absoluteSub(a, b, c) {
        if (0 === a.length) return a;
        if (0 === b.length) return a.sign === c ? a : _JSBI.unaryMinus(a);
        const d = new _JSBI(a.length, c);
        let e = 0, f = 0;
        for (; f < b.length; f++) {
          const c2 = a.__digit(f), g = b.__digit(f), h = (65535 & c2) - (65535 & g) - e;
          e = 1 & h >>> 16;
          const i = (c2 >>> 16) - (g >>> 16) - e;
          e = 1 & i >>> 16, d.__setDigit(f, 65535 & h | i << 16);
        }
        for (; f < a.length; f++) {
          const b2 = a.__digit(f), c2 = (65535 & b2) - e;
          e = 1 & c2 >>> 16;
          const g = (b2 >>> 16) - e;
          e = 1 & g >>> 16, d.__setDigit(f, 65535 & c2 | g << 16);
        }
        return d.__trim();
      }
      static __absoluteAddOne(a, b, c = null) {
        const d = a.length;
        null === c ? c = new _JSBI(d, b) : c.sign = b;
        let e = true;
        for (let f, g = 0; g < d; g++) {
          f = a.__digit(g);
          const b2 = -1 === f;
          e && (f = 0 | f + 1), e = b2, c.__setDigit(g, f);
        }
        return e && c.__setDigitGrow(d, 1), c;
      }
      static __absoluteSubOne(a, b) {
        const c = a.length;
        b = b || c;
        const d = new _JSBI(b, false);
        let e = true;
        for (let f, g = 0; g < c; g++) {
          f = a.__digit(g);
          const b2 = 0 === f;
          e && (f = 0 | f - 1), e = b2, d.__setDigit(g, f);
        }
        for (let e2 = c; e2 < b; e2++) d.__setDigit(e2, 0);
        return d;
      }
      static __absoluteAnd(a, b, c = null) {
        let d = a.length, e = b.length, f = e;
        if (d < e) {
          f = d;
          const c2 = a, g2 = d;
          a = b, d = e, b = c2, e = g2;
        }
        let g = f;
        null === c ? c = new _JSBI(g, false) : g = c.length;
        let h = 0;
        for (; h < f; h++) c.__setDigit(h, a.__digit(h) & b.__digit(h));
        for (; h < g; h++) c.__setDigit(h, 0);
        return c;
      }
      static __absoluteAndNot(a, b, c = null) {
        const d = a.length, e = b.length;
        let f = e;
        d < e && (f = d);
        let g = d;
        null === c ? c = new _JSBI(g, false) : g = c.length;
        let h = 0;
        for (; h < f; h++) c.__setDigit(h, a.__digit(h) & ~b.__digit(h));
        for (; h < d; h++) c.__setDigit(h, a.__digit(h));
        for (; h < g; h++) c.__setDigit(h, 0);
        return c;
      }
      static __absoluteOr(a, b, c = null) {
        let d = a.length, e = b.length, f = e;
        if (d < e) {
          f = d;
          const c2 = a, g2 = d;
          a = b, d = e, b = c2, e = g2;
        }
        let g = d;
        null === c ? c = new _JSBI(g, false) : g = c.length;
        let h = 0;
        for (; h < f; h++) c.__setDigit(h, a.__digit(h) | b.__digit(h));
        for (; h < d; h++) c.__setDigit(h, a.__digit(h));
        for (; h < g; h++) c.__setDigit(h, 0);
        return c;
      }
      static __absoluteXor(a, b, c = null) {
        let d = a.length, e = b.length, f = e;
        if (d < e) {
          f = d;
          const c2 = a, g2 = d;
          a = b, d = e, b = c2, e = g2;
        }
        let g = d;
        null === c ? c = new _JSBI(g, false) : g = c.length;
        let h = 0;
        for (; h < f; h++) c.__setDigit(h, a.__digit(h) ^ b.__digit(h));
        for (; h < d; h++) c.__setDigit(h, a.__digit(h));
        for (; h < g; h++) c.__setDigit(h, 0);
        return c;
      }
      static __absoluteCompare(a, b) {
        const c = a.length - b.length;
        if (0 != c) return c;
        let d = a.length - 1;
        for (; 0 <= d && a.__digit(d) === b.__digit(d); ) d--;
        return 0 > d ? 0 : a.__unsignedDigit(d) > b.__unsignedDigit(d) ? 1 : -1;
      }
      static __multiplyAccumulate(a, b, c, d) {
        var e = Math.imul;
        if (0 === b) return;
        const f = 65535 & b, g = b >>> 16;
        let h = 0, j = 0, k = 0;
        for (let l = 0; l < a.length; l++, d++) {
          let b2 = c.__digit(d), i = 65535 & b2, m = b2 >>> 16;
          const n = a.__digit(l), o = 65535 & n, p = n >>> 16, q = e(o, f), r = e(o, g), s = e(p, f), t = e(p, g);
          i += j + (65535 & q), m += k + h + (i >>> 16) + (q >>> 16) + (65535 & r) + (65535 & s), h = m >>> 16, j = (r >>> 16) + (s >>> 16) + (65535 & t) + h, h = j >>> 16, j &= 65535, k = t >>> 16, b2 = 65535 & i | m << 16, c.__setDigit(d, b2);
        }
        for (; 0 != h || 0 !== j || 0 !== k; d++) {
          let a2 = c.__digit(d);
          const b2 = (65535 & a2) + j, e2 = (a2 >>> 16) + (b2 >>> 16) + k + h;
          j = 0, k = 0, h = e2 >>> 16, a2 = 65535 & b2 | e2 << 16, c.__setDigit(d, a2);
        }
      }
      static __internalMultiplyAdd(a, b, c, d, e) {
        var f = Math.imul;
        let g = c, h = 0;
        for (let j = 0; j < d; j++) {
          const c2 = a.__digit(j), d2 = f(65535 & c2, b), i = (65535 & d2) + h + g;
          g = i >>> 16;
          const k = f(c2 >>> 16, b), l = (65535 & k) + (d2 >>> 16) + g;
          g = l >>> 16, h = k >>> 16, e.__setDigit(j, l << 16 | 65535 & i);
        }
        if (e.length > d) for (e.__setDigit(d++, g + h); d < e.length; ) e.__setDigit(d++, 0);
        else if (0 !== g + h) throw new Error("implementation bug");
      }
      __inplaceMultiplyAdd(a, b, c) {
        var e = Math.imul;
        c > this.length && (c = this.length);
        const f = 65535 & a, g = a >>> 16;
        let h = 0, j = 65535 & b, k = b >>> 16;
        for (let l = 0; l < c; l++) {
          const a2 = this.__digit(l), b2 = 65535 & a2, c2 = a2 >>> 16, d = e(b2, f), i = e(b2, g), m = e(c2, f), n = e(c2, g), o = j + (65535 & d), p = k + h + (o >>> 16) + (d >>> 16) + (65535 & i) + (65535 & m);
          j = (i >>> 16) + (m >>> 16) + (65535 & n) + (p >>> 16), h = j >>> 16, j &= 65535, k = n >>> 16;
          this.__setDigit(l, 65535 & o | p << 16);
        }
        if (0 != h || 0 !== j || 0 !== k) throw new Error("implementation bug");
      }
      static __absoluteDivSmall(a, b, c) {
        null === c && (c = new _JSBI(a.length, false));
        let d = 0;
        for (let e, f = 2 * a.length - 1; 0 <= f; f -= 2) {
          e = (d << 16 | a.__halfDigit(f)) >>> 0;
          const g = 0 | e / b;
          d = 0 | e % b, e = (d << 16 | a.__halfDigit(f - 1)) >>> 0;
          const h = 0 | e / b;
          d = 0 | e % b, c.__setDigit(f >>> 1, g << 16 | h);
        }
        return c;
      }
      static __absoluteModSmall(a, b) {
        let c = 0;
        for (let d = 2 * a.length - 1; 0 <= d; d--) {
          const e = (c << 16 | a.__halfDigit(d)) >>> 0;
          c = 0 | e % b;
        }
        return c;
      }
      static __absoluteDivLarge(a, b, d, e) {
        var f = Math.imul;
        const g = b.__halfDigitLength(), h = b.length, c = a.__halfDigitLength() - g;
        let i = null;
        d && (i = new _JSBI(c + 2 >>> 1, false), i.__initializeDigits());
        const k = new _JSBI(g + 2 >>> 1, false);
        k.__initializeDigits();
        const l = _JSBI.__clz16(b.__halfDigit(g - 1));
        0 < l && (b = _JSBI.__specialLeftShift(b, l, 0));
        const m = _JSBI.__specialLeftShift(a, l, 1), n = b.__halfDigit(g - 1);
        let o = 0;
        for (let l2, p = c; 0 <= p; p--) {
          l2 = 65535;
          const a2 = m.__halfDigit(p + g);
          if (a2 !== n) {
            const c2 = (a2 << 16 | m.__halfDigit(p + g - 1)) >>> 0;
            l2 = 0 | c2 / n;
            let d2 = 0 | c2 % n;
            const e3 = b.__halfDigit(g - 2), h2 = m.__halfDigit(p + g - 2);
            for (; f(l2, e3) >>> 0 > (d2 << 16 | h2) >>> 0 && (l2--, d2 += n, !(65535 < d2)); ) ;
          }
          _JSBI.__internalMultiplyAdd(b, l2, 0, h, k);
          let e2 = m.__inplaceSub(k, p, g + 1);
          0 !== e2 && (e2 = m.__inplaceAdd(b, p, g), m.__setHalfDigit(p + g, m.__halfDigit(p + g) + e2), l2--), d && (1 & p ? o = l2 << 16 : i.__setDigit(p >>> 1, o | l2));
        }
        return e ? (m.__inplaceRightShift(l), d ? { quotient: i, remainder: m } : m) : d ? i : void 0;
      }
      static __clz16(a) {
        return Math.clz32(a) - 16;
      }
      __inplaceAdd(a, b, c) {
        let d = 0;
        for (let e = 0; e < c; e++) {
          const c2 = this.__halfDigit(b + e) + a.__halfDigit(e) + d;
          d = c2 >>> 16, this.__setHalfDigit(b + e, c2);
        }
        return d;
      }
      __inplaceSub(a, b, c) {
        let d = 0;
        if (1 & b) {
          b >>= 1;
          let e = this.__digit(b), f = 65535 & e, g = 0;
          for (; g < c - 1 >>> 1; g++) {
            const c2 = a.__digit(g), h2 = (e >>> 16) - (65535 & c2) - d;
            d = 1 & h2 >>> 16, this.__setDigit(b + g, h2 << 16 | 65535 & f), e = this.__digit(b + g + 1), f = (65535 & e) - (c2 >>> 16) - d, d = 1 & f >>> 16;
          }
          const h = a.__digit(g), i = (e >>> 16) - (65535 & h) - d;
          d = 1 & i >>> 16, this.__setDigit(b + g, i << 16 | 65535 & f);
          if (b + g + 1 >= this.length) throw new RangeError("out of bounds");
          0 == (1 & c) && (e = this.__digit(b + g + 1), f = (65535 & e) - (h >>> 16) - d, d = 1 & f >>> 16, this.__setDigit(b + a.length, 4294901760 & e | 65535 & f));
        } else {
          b >>= 1;
          let e = 0;
          for (; e < a.length - 1; e++) {
            const c2 = this.__digit(b + e), f2 = a.__digit(e), g2 = (65535 & c2) - (65535 & f2) - d;
            d = 1 & g2 >>> 16;
            const h2 = (c2 >>> 16) - (f2 >>> 16) - d;
            d = 1 & h2 >>> 16, this.__setDigit(b + e, h2 << 16 | 65535 & g2);
          }
          const f = this.__digit(b + e), g = a.__digit(e), h = (65535 & f) - (65535 & g) - d;
          d = 1 & h >>> 16;
          let i = 0;
          0 == (1 & c) && (i = (f >>> 16) - (g >>> 16) - d, d = 1 & i >>> 16), this.__setDigit(b + e, i << 16 | 65535 & h);
        }
        return d;
      }
      __inplaceRightShift(a) {
        if (0 === a) return;
        let b = this.__digit(0) >>> a;
        const c = this.length - 1;
        for (let e = 0; e < c; e++) {
          const c2 = this.__digit(e + 1);
          this.__setDigit(e, c2 << 32 - a | b), b = c2 >>> a;
        }
        this.__setDigit(c, b);
      }
      static __specialLeftShift(a, b, c) {
        const d = a.length, e = new _JSBI(d + c, false);
        if (0 === b) {
          for (let b2 = 0; b2 < d; b2++) e.__setDigit(b2, a.__digit(b2));
          return 0 < c && e.__setDigit(d, 0), e;
        }
        let f = 0;
        for (let g = 0; g < d; g++) {
          const c2 = a.__digit(g);
          e.__setDigit(g, c2 << b | f), f = c2 >>> 32 - b;
        }
        return 0 < c && e.__setDigit(d, f), e;
      }
      static __leftShiftByAbsolute(a, b) {
        const c = _JSBI.__toShiftAmount(b);
        if (0 > c) throw new RangeError("BigInt too big");
        const e = c >>> 5, f = 31 & c, g = a.length, h = 0 !== f && 0 != a.__digit(g - 1) >>> 32 - f, j = g + e + (h ? 1 : 0), k = new _JSBI(j, a.sign);
        if (0 === f) {
          let b2 = 0;
          for (; b2 < e; b2++) k.__setDigit(b2, 0);
          for (; b2 < j; b2++) k.__setDigit(b2, a.__digit(b2 - e));
        } else {
          let b2 = 0;
          for (let a2 = 0; a2 < e; a2++) k.__setDigit(a2, 0);
          for (let c2 = 0; c2 < g; c2++) {
            const g2 = a.__digit(c2);
            k.__setDigit(c2 + e, g2 << f | b2), b2 = g2 >>> 32 - f;
          }
          if (h) k.__setDigit(g + e, b2);
          else if (0 != b2) throw new Error("implementation bug");
        }
        return k.__trim();
      }
      static __rightShiftByAbsolute(a, b) {
        const c = a.length, d = a.sign, e = _JSBI.__toShiftAmount(b);
        if (0 > e) return _JSBI.__rightShiftByMaximum(d);
        const f = e >>> 5, g = 31 & e;
        let h = c - f;
        if (0 >= h) return _JSBI.__rightShiftByMaximum(d);
        let i = false;
        if (d) {
          if (0 != (a.__digit(f) & (1 << g) - 1)) i = true;
          else for (let b2 = 0; b2 < f; b2++) if (0 !== a.__digit(b2)) {
            i = true;
            break;
          }
        }
        if (i && 0 === g) {
          const b2 = a.__digit(c - 1);
          0 == ~b2 && h++;
        }
        let j = new _JSBI(h, d);
        if (0 === g) for (let b2 = f; b2 < c; b2++) j.__setDigit(b2 - f, a.__digit(b2));
        else {
          let b2 = a.__digit(f) >>> g;
          const d2 = c - f - 1;
          for (let c2 = 0; c2 < d2; c2++) {
            const e2 = a.__digit(c2 + f + 1);
            j.__setDigit(c2, e2 << 32 - g | b2), b2 = e2 >>> g;
          }
          j.__setDigit(d2, b2);
        }
        return i && (j = _JSBI.__absoluteAddOne(j, true, j)), j.__trim();
      }
      static __rightShiftByMaximum(a) {
        return a ? _JSBI.__oneDigit(1, true) : _JSBI.__zero();
      }
      static __toShiftAmount(a) {
        if (1 < a.length) return -1;
        const b = a.__unsignedDigit(0);
        return b > _JSBI.__kMaxLengthBits ? -1 : b;
      }
      static __toPrimitive(a, b = "default") {
        if ("object" != typeof a) return a;
        if (a.constructor === _JSBI) return a;
        const c = a[Symbol.toPrimitive];
        if (c) {
          const a2 = c(b);
          if ("object" != typeof a2) return a2;
          throw new TypeError("Cannot convert object to primitive value");
        }
        const d = a.valueOf;
        if (d) {
          const b2 = d.call(a);
          if ("object" != typeof b2) return b2;
        }
        const e = a.toString;
        if (e) {
          const b2 = e.call(a);
          if ("object" != typeof b2) return b2;
        }
        throw new TypeError("Cannot convert object to primitive value");
      }
      static __toNumeric(a) {
        return _JSBI.__isBigInt(a) ? a : +a;
      }
      static __isBigInt(a) {
        return "object" == typeof a && a.constructor === _JSBI;
      }
      __digit(a) {
        return this[a];
      }
      __unsignedDigit(a) {
        return this[a] >>> 0;
      }
      __setDigit(a, b) {
        this[a] = 0 | b;
      }
      __setDigitGrow(a, b) {
        this[a] = 0 | b;
      }
      __halfDigitLength() {
        const a = this.length;
        return 65535 >= this.__unsignedDigit(a - 1) ? 2 * a - 1 : 2 * a;
      }
      __halfDigit(a) {
        return 65535 & this[a >>> 1] >>> ((1 & a) << 4);
      }
      __setHalfDigit(a, b) {
        const c = a >>> 1, d = this.__digit(c), e = 1 & a ? 65535 & d | b << 16 : 4294901760 & d | 65535 & b;
        this.__setDigit(c, e);
      }
      static __digitPow(a, b) {
        let c = 1;
        for (; 0 < b; ) 1 & b && (c *= a), b >>>= 1, a *= a;
        return c;
      }
    };
    JSBI.__kMaxLength = 33554432, JSBI.__kMaxLengthBits = JSBI.__kMaxLength << 5, JSBI.__kMaxBitsPerChar = [0, 0, 32, 51, 64, 75, 83, 90, 96, 102, 107, 111, 115, 119, 122, 126, 128, 131, 134, 136, 139, 141, 143, 145, 147, 149, 151, 153, 154, 156, 158, 159, 160, 162, 163, 165, 166], JSBI.__kBitsPerCharTableShift = 5, JSBI.__kBitsPerCharTableMultiplier = 1 << JSBI.__kBitsPerCharTableShift, JSBI.__kConversionChars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"], JSBI.__kBitConversionBuffer = new ArrayBuffer(8), JSBI.__kBitConversionDouble = new Float64Array(JSBI.__kBitConversionBuffer), JSBI.__kBitConversionInts = new Int32Array(JSBI.__kBitConversionBuffer), module2.exports = JSBI;
  }
});

// node_modules/dbus-next/lib/constants.js
var require_constants2 = __commonJS({
  "node_modules/dbus-next/lib/constants.js"(exports2, module2) {
    var NameFlag = class {
      static {
        __name(this, "NameFlag");
      }
    };
    NameFlag.ALLOW_REPLACEMENT = 1;
    NameFlag.REPLACE_EXISTING = 2;
    NameFlag.DO_NOT_QUEUE = 4;
    var RequestNameReply = class {
      static {
        __name(this, "RequestNameReply");
      }
    };
    RequestNameReply.PRIMARY_OWNER = 1;
    RequestNameReply.IN_QUEUE = 2;
    RequestNameReply.EXISTS = 3;
    RequestNameReply.ALREADY_OWNER = 4;
    var ReleaseNameReply = class {
      static {
        __name(this, "ReleaseNameReply");
      }
    };
    ReleaseNameReply.RELEASED = 1;
    ReleaseNameReply.NON_EXISTENT = 2;
    ReleaseNameReply.NOT_OWNER = 3;
    var MessageType = class {
      static {
        __name(this, "MessageType");
      }
    };
    MessageType.METHOD_CALL = 1;
    MessageType.METHOD_RETURN = 2;
    MessageType.ERROR = 3;
    MessageType.SIGNAL = 4;
    var MessageFlag = class {
      static {
        __name(this, "MessageFlag");
      }
    };
    MessageFlag.NO_REPLY_EXPECTED = 1;
    MessageFlag.NO_AUTO_START = 2;
    var MAX_INT64_STR = "9223372036854775807";
    var MIN_INT64_STR = "-9223372036854775807";
    var MAX_UINT64_STR = "18446744073709551615";
    var MIN_UINT64_STR = "0";
    var _JSBIConstants = {};
    function _getJSBIConstants() {
      if (Object.keys(_JSBIConstants).length !== 0) {
        return _JSBIConstants;
      }
      const JSBI = require_jsbi_cjs();
      _JSBIConstants.MAX_INT64 = JSBI.BigInt(MAX_INT64_STR);
      _JSBIConstants.MIN_INT64 = JSBI.BigInt(MIN_INT64_STR);
      _JSBIConstants.MAX_UINT64 = JSBI.BigInt(MAX_UINT64_STR);
      _JSBIConstants.MIN_UINT64 = JSBI.BigInt(MIN_UINT64_STR);
      return _JSBIConstants;
    }
    __name(_getJSBIConstants, "_getJSBIConstants");
    var _BigIntConstants = {};
    function _getBigIntConstants() {
      if (Object.keys(_BigIntConstants).length !== 0) {
        return _BigIntConstants;
      }
      _BigIntConstants.MAX_INT64 = BigInt(MAX_INT64_STR);
      _BigIntConstants.MIN_INT64 = BigInt(MIN_INT64_STR);
      _BigIntConstants.MAX_UINT64 = BigInt(MAX_UINT64_STR);
      _BigIntConstants.MIN_UINT64 = BigInt(MIN_UINT64_STR);
      return _BigIntConstants;
    }
    __name(_getBigIntConstants, "_getBigIntConstants");
    module2.exports = {
      MAX_INT64_STR,
      MIN_INT64_STR,
      MAX_UINT64_STR,
      MIN_UINT64_STR,
      NameFlag,
      RequestNameReply,
      ReleaseNameReply,
      MessageType,
      MessageFlag,
      headerTypeName: [
        null,
        "path",
        "interface",
        "member",
        "errorName",
        "replySerial",
        "destination",
        "sender",
        "signature"
      ],
      // TODO: merge to single hash? e.g path -> [1, 'o']
      fieldSignature: {
        path: "o",
        interface: "s",
        member: "s",
        errorName: "s",
        replySerial: "u",
        destination: "s",
        sender: "s",
        signature: "g"
      },
      headerTypeId: {
        path: 1,
        interface: 2,
        member: 3,
        errorName: 4,
        replySerial: 5,
        destination: 6,
        sender: 7,
        signature: 8
      },
      protocolVersion: 1,
      endianness: {
        le: 108,
        be: 66
      },
      messageSignature: "yyyyuua(yv)",
      defaultAuthMethods: ["EXTERNAL", "DBUS_COOKIE_SHA1", "ANONYMOUS"],
      _getJSBIConstants,
      _getBigIntConstants
    };
  }
});

// node_modules/dbus-next/lib/variant.js
var require_variant = __commonJS({
  "node_modules/dbus-next/lib/variant.js"(exports2, module2) {
    var Variant = class {
      static {
        __name(this, "Variant");
      }
      /**
      * Construct a new `Variant` with the given signature and value.
      * @param {string} signature - a DBus type signature for the `Variant`.
      * @param {any} value - the value of the `Variant` with type specified by the type signature.
      */
      constructor(signature, value) {
        this.signature = signature;
        this.value = value;
      }
    };
    module2.exports = {
      Variant
    };
  }
});

// node_modules/dbus-next/lib/validators.js
var require_validators = __commonJS({
  "node_modules/dbus-next/lib/validators.js"(exports2, module2) {
    var busNameRe = /^[A-Za-z_-][A-Za-z0-9_-]*$/;
    function isBusNameValid(name) {
      if (typeof name !== "string") {
        return false;
      }
      if (name.startsWith(":")) {
        return true;
      }
      return !!(name.length > 0 && name.length <= 255 && name[0] !== "." && name.indexOf(".") !== -1 && name.split(".").every((n) => n && busNameRe.test(n)));
    }
    __name(isBusNameValid, "isBusNameValid");
    function assertBusNameValid(name) {
      if (!isBusNameValid(name)) {
        throw new Error(`Invalid bus name: ${name}`);
      }
    }
    __name(assertBusNameValid, "assertBusNameValid");
    var pathRe = /^[A-Za-z0-9_]+$/;
    function isObjectPathValid(path2) {
      return !!(typeof path2 === "string" && path2 && path2[0] === "/" && (path2.length === 1 || path2[path2.length - 1] !== "/" && path2.split("/").slice(1).every((p) => p && pathRe.test(p))));
    }
    __name(isObjectPathValid, "isObjectPathValid");
    function assertObjectPathValid(path2) {
      if (!isObjectPathValid(path2)) {
        throw new Error(`Invalid object path: ${path2}`);
      }
    }
    __name(assertObjectPathValid, "assertObjectPathValid");
    var elementRe = /^[A-Za-z_][A-Za-z0-9_]*$/;
    function isInterfaceNameValid(name) {
      return !!(typeof name === "string" && name && name.length > 0 && name.length <= 255 && name[0] !== "." && name.indexOf(".") !== -1 && name.split(".").every((n) => n && elementRe.test(n)));
    }
    __name(isInterfaceNameValid, "isInterfaceNameValid");
    function assertInterfaceNameValid(name) {
      if (!isInterfaceNameValid(name)) {
        throw new Error(`Invalid interface name: ${name}`);
      }
    }
    __name(assertInterfaceNameValid, "assertInterfaceNameValid");
    function isMemberNameValid(name) {
      return !!(typeof name === "string" && name && name.length > 0 && name.length <= 255 && elementRe.test(name));
    }
    __name(isMemberNameValid, "isMemberNameValid");
    function assertMemberNameValid(name) {
      if (!assertMemberNameValid) {
        throw new Error(`Invalid member name: ${name}`);
      }
    }
    __name(assertMemberNameValid, "assertMemberNameValid");
    module2.exports = {
      isBusNameValid,
      assertBusNameValid,
      isObjectPathValid,
      assertObjectPathValid,
      isInterfaceNameValid,
      assertInterfaceNameValid,
      isMemberNameValid,
      assertMemberNameValid
    };
  }
});

// node_modules/dbus-next/lib/message-type.js
var require_message_type = __commonJS({
  "node_modules/dbus-next/lib/message-type.js"(exports2, module2) {
    var {
      assertBusNameValid,
      assertInterfaceNameValid,
      assertObjectPathValid,
      assertMemberNameValid
    } = require_validators();
    var {
      METHOD_CALL,
      METHOD_RETURN,
      ERROR,
      SIGNAL
    } = require_constants2().MessageType;
    var Message = class _Message {
      static {
        __name(this, "Message");
      }
      /**
       * Construct a new `Message` to send on the bus.
       */
      constructor(msg) {
        this.type = msg.type ? msg.type : METHOD_CALL;
        this._sent = false;
        this._serial = isNaN(msg.serial) ? null : msg.serial;
        this.path = msg.path;
        this.interface = msg.interface;
        this.member = msg.member;
        this.errorName = msg.errorName;
        this.replySerial = msg.replySerial;
        this.destination = msg.destination;
        this.sender = msg.sender;
        this.signature = msg.signature || "";
        this.body = msg.body || [];
        this.flags = msg.flags || 0;
        if (this.destination) {
          assertBusNameValid(this.destination);
        }
        if (this.interface) {
          assertInterfaceNameValid(this.interface);
        }
        if (this.path) {
          assertObjectPathValid(this.path);
        }
        if (this.member) {
          assertMemberNameValid(this.member);
        }
        if (this.errorName) {
          assertInterfaceNameValid(this.errorName);
        }
        const requireFields = /* @__PURE__ */ __name((...fields) => {
          for (const field of fields) {
            if (this[field] === void 0) {
              throw new Error(`Message is missing a required field: ${field}`);
            }
          }
        }, "requireFields");
        switch (this.type) {
          case METHOD_CALL:
            requireFields("path", "member");
            break;
          case SIGNAL:
            requireFields("path", "member", "interface");
            break;
          case ERROR:
            requireFields("errorName", "replySerial");
            break;
          case METHOD_RETURN:
            requireFields("replySerial");
            break;
          default:
            throw new Error(`Got unknown message type: ${this.type}`);
        }
      }
      /**
        * @member {int} - The serial of the message to track through the bus.  You
        * must use {@link MessageBus#newSerial} to get this serial. If not set, it
        * will be set automatically when the message is sent.
        */
      get serial() {
        return this._serial;
      }
      set serial(value) {
        this._sent = false;
        this._serial = value;
      }
      /**
       * Construct a new `Message` of type `ERROR` in reply to the given `Message`.
       *
       * @param {Message} msg - The `Message` this error is in reply to.
       * @param {string} errorName - The name of the error. Must be a valid
       * interface name.
       * @param {string} [errorText='An error occurred.'] - An error message for
       * the error.
       */
      static newError(msg, errorName, errorText = "An error occurred.") {
        assertInterfaceNameValid(errorName);
        return new _Message({
          type: ERROR,
          replySerial: msg.serial,
          destination: msg.sender,
          errorName,
          signature: "s",
          body: [errorText]
        });
      }
      /**
       * Construct a new `Message` of type `METHOD_RETURN` in reply to the given
       * message.
       *
       * @param {Message} msg - The `Message` this `Message` is in reply to.
       * @param {string} signature - The signature for the message body.
       * @param {Array} body - The body of the message as an array of arguments.
       * Must match the signature.
       */
      static newMethodReturn(msg, signature = "", body = []) {
        return new _Message({
          type: METHOD_RETURN,
          replySerial: msg.serial,
          destination: msg.sender,
          signature,
          body
        });
      }
      /**
       * Construct a new `Message` of type `SIGNAL` to broadcast on the bus.
       *
       * @param {string} path - The object path of this signal.
       * @param {string} iface - The interface of this signal.
       * @param {string} signature - The signature of the message body.
       * @param {Array] body - The body of the message as an array of arguments.
       * Must match the signature.
       */
      static newSignal(path2, iface, name, signature = "", body = []) {
        return new _Message({
          type: SIGNAL,
          interface: iface,
          path: path2,
          member: name,
          signature,
          body
        });
      }
    };
    module2.exports = {
      Message
    };
  }
});

// node_modules/dbus-next/lib/signature.js
var require_signature = __commonJS({
  "node_modules/dbus-next/lib/signature.js"(exports2, module2) {
    var match = {
      "{": "}",
      "(": ")"
    };
    var knownTypes = {};
    "(){}ybnqiuxtdsogarvehm*?@&^".split("").forEach(function(c) {
      knownTypes[c] = true;
    });
    function parseSignature(signature) {
      let index = 0;
      function next() {
        if (index < signature.length) {
          const c2 = signature[index];
          ++index;
          return c2;
        }
        return null;
      }
      __name(next, "next");
      function parseOne(c2) {
        function checkNotEnd(c3) {
          if (!c3) {
            throw new Error("Bad signature: unexpected end");
          }
          return c3;
        }
        __name(checkNotEnd, "checkNotEnd");
        if (!knownTypes[c2]) {
          throw new Error(`Unknown type: "${c2}" in signature "${signature}"`);
        }
        let ele;
        const res = { type: c2, child: [] };
        switch (c2) {
          case "a":
            ele = next();
            checkNotEnd(ele);
            res.child.push(parseOne(ele));
            return res;
          case "{":
          // dict entry
          case "(":
            while ((ele = next()) !== null && ele !== match[c2]) {
              res.child.push(parseOne(ele));
            }
            checkNotEnd(ele);
            return res;
        }
        return res;
      }
      __name(parseOne, "parseOne");
      const ret = [];
      let c;
      while ((c = next()) !== null) {
        ret.push(parseOne(c));
      }
      return ret;
    }
    __name(parseSignature, "parseSignature");
    function collapseSignature(value) {
      if (value.child.length === 0) {
        return value.type;
      }
      let type = value.type;
      for (let i = 0; i < value.child.length; ++i) {
        type += collapseSignature(value.child[i]);
      }
      if (type[0] === "{") {
        type += "}";
      } else if (type[0] === "(") {
        type += ")";
      }
      return type;
    }
    __name(collapseSignature, "collapseSignature");
    module2.exports = {
      parseSignature,
      collapseSignature
    };
  }
});

// node_modules/dbus-next/lib/service/interface.js
var require_interface = __commonJS({
  "node_modules/dbus-next/lib/service/interface.js"(exports2, module2) {
    var { parseSignature, collapseSignature } = require_signature();
    var variant = require_variant();
    var Variant = variant.Variant;
    var ACCESS_READ = "read";
    var ACCESS_WRITE = "write";
    var ACCESS_READWRITE = "readwrite";
    var EventEmitter = require("events");
    var {
      assertInterfaceNameValid,
      assertMemberNameValid
    } = require_validators();
    function property(options) {
      options.access = options.access || ACCESS_READWRITE;
      if (!options.signature) {
        throw new Error("missing signature for property");
      }
      options.signatureTree = parseSignature(options.signature);
      return function(descriptor) {
        options.name = options.name || descriptor.key;
        assertMemberNameValid(options.name);
        descriptor.finisher = function(klass) {
          klass.prototype.$properties = klass.prototype.$properties || [];
          klass.prototype.$properties[descriptor.key] = options;
        };
        return descriptor;
      };
    }
    __name(property, "property");
    function method(options) {
      options.disabled = !!options.disabled;
      options.inSignature = options.inSignature || "";
      options.outSignature = options.outSignature || "";
      options.inSignatureTree = parseSignature(options.inSignature);
      options.outSignatureTree = parseSignature(options.outSignature);
      return function(descriptor) {
        options.name = options.name || descriptor.key;
        assertMemberNameValid(options.name);
        options.fn = descriptor.descriptor.value;
        descriptor.finisher = function(klass) {
          klass.prototype.$methods = klass.prototype.$methods || [];
          klass.prototype.$methods[descriptor.key] = options;
        };
        return descriptor;
      };
    }
    __name(method, "method");
    function signal(options) {
      options.signature = options.signature || "";
      options.signatureTree = parseSignature(options.signature);
      return function(descriptor) {
        options.name = options.name || descriptor.key;
        assertMemberNameValid(options.name);
        options.fn = descriptor.descriptor.value;
        descriptor.descriptor.value = function() {
          if (options.disabled) {
            throw new Error("tried to call a disabled signal");
          }
          const result = options.fn.apply(this, arguments);
          this.$emitter.emit("signal", options, result);
        };
        descriptor.finisher = function(klass) {
          klass.prototype.$signals = klass.prototype.$signals || [];
          klass.prototype.$signals[descriptor.key] = options;
        };
        return descriptor;
      };
    }
    __name(signal, "signal");
    var Interface = class {
      static {
        __name(this, "Interface");
      }
      /**
       * Create an interface. This should be called with the name of the interface
       * in the class that extends it.
       */
      constructor(name) {
        assertInterfaceNameValid(name);
        this.$name = name;
        this.$emitter = new EventEmitter();
      }
      /**
       * An alternative to the decorator functions to configure
       * [`Interface`]{@link module:interface~Interface} DBus members when
       * decorators cannot be supported.
       *
       * *Calling this method twice on the same `Interface` or mixing this method
       * with the decorator interface will result in undefined behavior that may be
       * specified at a future time.*
       *
       * @static
       * @example
       * ConfiguredInterface.configureMembers({
       *   properties: {
       *     SomeProperty: {
       *       signature: 's'
       *     }
       *   },
       *   methods: {
       *     Echo: {
       *       inSignature: 'v',
       *       outSignature: 'v'
       *     }
       *   },
       *   signals: {
       *     HelloWorld: {
       *       signature: 'ss'
       *     }
       *   }
       * });
       *
       * @param members {Object} - Member configuration object.
       * @param members.properties {Object} - The class methods to define as
       * properties. The key should be a method defined on the class and the value
       * should be the options for a [property]{@link module:interface.property}
       * decorator.
       * @param members.methods {Object} - The class methods to define as DBus
       * methods. The key should be a method defined on the class and the value
       * should be the options for a [method]{@link module:interface.method}
       * decorator.
       * @param members.signals {Object} - The class methods to define as signals.
       * The key should be a method defined on the class and hte value should be
       * options for a [signal]{@link module:interface.signal} decorator.
       */
      static configureMembers(members) {
        const properties = members.properties || {};
        const methods = members.methods || {};
        const signals = members.signals || {};
        this.prototype.$properties = {};
        this.prototype.$methods = {};
        this.prototype.$signals = {};
        for (const k of Object.keys(properties)) {
          const options = properties[k];
          options.name = options.name || k;
          options.access = options.access || ACCESS_READWRITE;
          if (!options.signature) {
            throw new Error("missing signature for property");
          }
          options.signatureTree = parseSignature(options.signature);
          assertMemberNameValid(options.name);
          this.prototype.$properties[options.name] = options;
        }
        for (const k of Object.keys(methods)) {
          const options = methods[k];
          options.name = options.name || k;
          assertMemberNameValid(options.name);
          options.disabled = !!options.disabled;
          options.inSignature = options.inSignature || "";
          options.outSignature = options.outSignature || "";
          options.inSignatureTree = parseSignature(options.inSignature);
          options.outSignatureTree = parseSignature(options.outSignature);
          options.fn = this.prototype[k];
          this.prototype.$methods[options.name] = options;
        }
        for (const k of Object.keys(signals)) {
          const options = signals[k];
          options.name = options.name || k;
          assertMemberNameValid(options.name);
          options.fn = this.prototype[k];
          options.signature = options.signature || "";
          options.signatureTree = parseSignature(options.signature);
          this.prototype[k] = function() {
            if (options.disabled) {
              throw new Error("tried to call a disabled signal");
            }
            const result = options.fn.apply(this, arguments);
            this.$emitter.emit("signal", options, result);
          };
          this.prototype.$signals[options.name] = options;
        }
      }
      /**
       * Emit the `PropertiesChanged` signal on an [`Interface`s]{@link
       * module:interface~Interface} associated standard
       * `org.freedesktop.DBus.Properties` interface with a map of new values and
       * invalidated properties. Pass the properties as JavaScript values.
       *
       * @static
       * @example
       * Interface.emitPropertiesChanged({ SomeProperty: 'bar' }, ['InvalidedProperty']);
       *
       * @param {module:interface~Interface} - the `Interface` to emit the `PropertiesChanged` signal on
       * @param {Object} - A map of property names and new property values that are changed.
       * @param {string[]} - A list of invalidated properties.
       */
      static emitPropertiesChanged(iface, changedProperties, invalidatedProperties = []) {
        if (!Array.isArray(invalidatedProperties) || !invalidatedProperties.every((p) => typeof p === "string")) {
          throw new Error("invalidated properties must be an array of strings");
        }
        const properties = iface.$properties || {};
        const changedPropertiesVariants = {};
        for (const p of Object.keys(changedProperties)) {
          if (properties[p] === void 0) {
            throw new Error(`got properties changed with unknown property: ${p}`);
          }
          changedPropertiesVariants[p] = new Variant(properties[p].signature, changedProperties[p]);
        }
        iface.$emitter.emit("properties-changed", changedPropertiesVariants, invalidatedProperties);
      }
      $introspect() {
        const xml = {
          $: {
            name: this.$name
          }
        };
        const properties = this.$properties || {};
        for (const p of Object.keys(properties) || []) {
          const property2 = properties[p];
          if (property2.disabled) {
            continue;
          }
          xml.property = xml.property || [];
          xml.property.push({
            $: {
              name: property2.name,
              type: property2.signature,
              access: property2.access
            }
          });
        }
        const methods = this.$methods || {};
        for (const m of Object.keys(methods) || []) {
          const method2 = methods[m];
          if (method2.disabled) {
            continue;
          }
          xml.method = xml.method || [];
          const methodXml = {
            $: {
              name: method2.name
            },
            arg: [],
            annotation: []
          };
          for (const signature of method2.inSignatureTree) {
            methodXml.arg.push({
              $: {
                direction: "in",
                type: collapseSignature(signature)
              }
            });
          }
          for (const signature of method2.outSignatureTree) {
            methodXml.arg.push({
              $: {
                direction: "out",
                type: collapseSignature(signature)
              }
            });
          }
          if (method2.noReply) {
            methodXml.annotation.push({
              $: {
                name: "org.freedesktop.DBus.Method.NoReply",
                value: "true"
              }
            });
          }
          xml.method.push(methodXml);
        }
        const signals = this.$signals || {};
        for (const s of Object.keys(signals) || []) {
          const signal2 = signals[s];
          if (signal2.disabled) {
            continue;
          }
          xml.signal = xml.signal || [];
          const signalXml = {
            $: {
              name: signal2.name
            },
            arg: []
          };
          for (const signature of signal2.signatureTree) {
            signalXml.arg.push({
              $: {
                type: collapseSignature(signature)
              }
            });
          }
          xml.signal.push(signalXml);
        }
        return xml;
      }
    };
    module2.exports = {
      ACCESS_READ,
      ACCESS_WRITE,
      ACCESS_READWRITE,
      property,
      method,
      signal,
      Interface
    };
  }
});

// node_modules/dbus-next/lib/errors.js
var require_errors = __commonJS({
  "node_modules/dbus-next/lib/errors.js"(exports2, module2) {
    var { assertInterfaceNameValid } = require_validators();
    var DBusError = class extends Error {
      static {
        __name(this, "DBusError");
      }
      /**
       * Construct a new `DBusError` with the given type and text.
       */
      constructor(type, text, reply = null) {
        assertInterfaceNameValid(type);
        text = text || "";
        super(text);
        this.name = "DBusError";
        this.type = type;
        this.text = text;
        this.reply = reply;
      }
    };
    module2.exports = {
      DBusError
    };
  }
});

// node_modules/dbus-next/lib/service/handlers.js
var require_handlers = __commonJS({
  "node_modules/dbus-next/lib/service/handlers.js"(exports2, module2) {
    var fs2 = require("fs");
    var variant = require_variant();
    var Variant = variant.Variant;
    var { Message } = require_message_type();
    var {
      isObjectPathValid,
      isInterfaceNameValid,
      isMemberNameValid
    } = require_validators();
    var {
      ACCESS_READ,
      ACCESS_WRITE,
      ACCESS_READWRITE
    } = require_interface();
    var constants = require_constants2();
    var {
      METHOD_RETURN
    } = constants.MessageType;
    var { DBusError } = require_errors();
    var INVALID_ARGS = "org.freedesktop.DBus.Error.InvalidArgs";
    function sendServiceError(bus, msg, errorMessage) {
      bus.send(Message.newError(msg, "com.github.dbus_next.ServiceError", `Service error: ${errorMessage}`));
      return true;
    }
    __name(sendServiceError, "sendServiceError");
    function handleIntrospect(bus, msg, path2) {
      bus.send(Message.newMethodReturn(msg, "s", [bus._introspect(path2)]));
    }
    __name(handleIntrospect, "handleIntrospect");
    function handleGetProperty(bus, msg, path2) {
      const [ifaceName, prop] = msg.body;
      if (!bus._serviceObjects[path2]) {
        bus.send(Message.newError(msg, INVALID_ARGS, `Path not exported on bus: '${path2}'`));
        return;
      }
      const obj = bus._getServiceObject(path2);
      const iface = obj.interfaces[ifaceName];
      if (!iface) {
        bus.send(Message.newError(msg, INVALID_ARGS, `No such interface: '${ifaceName}'`));
        return;
      }
      const properties = iface.$properties || {};
      let options = null;
      let propertyKey = null;
      for (const k of Object.keys(properties)) {
        if (properties[k].name === prop && !properties[k].disabled) {
          options = properties[k];
          propertyKey = k;
          break;
        }
      }
      if (options === null) {
        bus.send(Message.newError(msg, INVALID_ARGS, `No such property: '${prop}'`));
        return;
      }
      let propertyValue = null;
      try {
        propertyValue = iface[propertyKey];
      } catch (e) {
        if (e.name === "DBusError") {
          bus.send(Message.newError(msg, e.type, e.text));
        } else {
          sendServiceError(bus, msg, `The service threw an error.
${e.stack}`);
        }
        return true;
      }
      if (propertyValue instanceof DBusError) {
        bus.send(Message.newError(msg, propertyValue.type, propertyValue.text));
        return true;
      } else if (propertyValue === void 0) {
        return sendServiceError(bus, msg, "tried to get a property that is not set: " + prop);
      }
      if (!(options.access === ACCESS_READWRITE || options.access === ACCESS_READ)) {
        bus.send(Message.newError(msg, INVALID_ARGS, `Property does not have read access: '${prop}'`));
      }
      const body = new Variant(options.signature, propertyValue);
      bus.send(Message.newMethodReturn(msg, "v", [body]));
    }
    __name(handleGetProperty, "handleGetProperty");
    function handleGetAllProperties(bus, msg, path2) {
      const ifaceName = msg.body[0];
      if (!bus._serviceObjects[path2]) {
        bus.send(Message.newError(msg, INVALID_ARGS, `Path not exported on bus: '${path2}'`));
        return;
      }
      const obj = bus._getServiceObject(path2);
      const iface = obj.interfaces[ifaceName];
      const result = {};
      if (iface) {
        const properties = iface.$properties || {};
        for (const k of Object.keys(properties)) {
          const p = properties[k];
          if (!(p.access === ACCESS_READ || p.access === ACCESS_READWRITE) || p.disabled) {
            continue;
          }
          let value;
          try {
            value = iface[k];
          } catch (e) {
            if (e.name === "DBusError") {
              bus.send(Message.newError(msg, e.type, e.text));
            } else {
              sendServiceError(bus, msg, `The service threw an error.
${e.stack}`);
            }
            return true;
          }
          if (value instanceof DBusError) {
            bus.send(Message.newError(msg, value.type, value.text));
            return true;
          } else if (value === void 0) {
            return sendServiceError(bus, msg, "tried to get a property that is not set: " + p);
          }
          result[p.name] = new Variant(p.signature, value);
        }
      }
      bus.send(Message.newMethodReturn(msg, "a{sv}", [result]));
    }
    __name(handleGetAllProperties, "handleGetAllProperties");
    function handleSetProperty(bus, msg, path2) {
      const [ifaceName, prop, value] = msg.body;
      if (!bus._serviceObjects[path2]) {
        bus.send(Message.newError(msg, INVALID_ARGS, `Path not exported on bus: '${path2}'`));
        return;
      }
      const obj = bus._getServiceObject(path2);
      const iface = obj.interfaces[ifaceName];
      if (!iface) {
        bus.send(Message.newError(msg, INVALID_ARGS, `Interface not found: '${ifaceName}'`));
        return;
      }
      const properties = iface.$properties || {};
      let options = null;
      let propertyKey = null;
      for (const k of Object.keys(properties)) {
        if (properties[k].name === prop && !properties[k].disabled) {
          options = properties[k];
          propertyKey = k;
          break;
        }
      }
      if (options === null) {
        bus.send(Message.newError(msg, INVALID_ARGS, `No such property: '${prop}'`));
        return;
      }
      if (!(options.access === ACCESS_WRITE || options.access === ACCESS_READWRITE)) {
        bus.send(Message.newError(msg, INVALID_ARGS, `Property does not have write access: '${prop}'`));
      }
      if (value.signature !== options.signature) {
        bus.send(Message.newError(msg, INVALID_ARGS, `Cannot set property '${prop}' with signature '${value.signature}' (expected '${options.signature}')`));
        return;
      }
      try {
        iface[propertyKey] = value.value;
      } catch (e) {
        if (e.name === "DBusError") {
          bus.send(Message.newError(msg, e.type, e.text));
        } else {
          sendServiceError(bus, msg, `The service threw an error.
${e.stack}`);
        }
        return true;
      }
      bus.send(Message.newMethodReturn(msg, "", []));
    }
    __name(handleSetProperty, "handleSetProperty");
    function handleStdIfaces(bus, msg) {
      const {
        member,
        path: path2,
        signature
      } = msg;
      const ifaceName = msg.interface;
      if (!isInterfaceNameValid(ifaceName)) {
        bus.send(Message.newError(msg, INVALID_ARGS, `Invalid interface name: '${ifaceName}'`));
        return true;
      }
      if (!isMemberNameValid(member)) {
        bus.send(Message.newError(msg, INVALID_ARGS, `Invalid member name: '${member}'`));
        return true;
      }
      if (!isObjectPathValid(path2)) {
        bus.send(Message.newError(msg, INVALID_ARGS, `Invalid path name: '${path2}'`));
        return true;
      }
      if (ifaceName === "org.freedesktop.DBus.Introspectable" && member === "Introspect" && !signature) {
        handleIntrospect(bus, msg, path2);
        return true;
      } else if (ifaceName === "org.freedesktop.DBus.Properties") {
        if (member === "Get" && signature === "ss") {
          handleGetProperty(bus, msg, path2);
          return true;
        } else if (member === "Set" && signature === "ssv") {
          handleSetProperty(bus, msg, path2);
          return true;
        } else if (member === "GetAll") {
          handleGetAllProperties(bus, msg, path2);
          return true;
        }
      } else if (ifaceName === "org.freedesktop.DBus.Peer") {
        if (member === "Ping" && !signature) {
          bus._connection.message({
            type: METHOD_RETURN,
            serial: bus._serial++,
            replySerial: msg.serial,
            destination: msg.sender
          });
          return true;
        } else if (member === "GetMachineId" && !signature) {
          const machineId = fs2.readFileSync("/var/lib/dbus/machine-id").toString().trim();
          bus._connection.message({
            type: METHOD_RETURN,
            serial: bus._serial++,
            replySerial: msg.serial,
            destination: msg.sender,
            signature: "s",
            body: [machineId]
          });
          return true;
        }
      }
      return false;
    }
    __name(handleStdIfaces, "handleStdIfaces");
    function handleMessage(msg, bus) {
      let {
        path: path2,
        member,
        signature
      } = msg;
      const ifaceName = msg.interface;
      signature = signature || "";
      if (handleStdIfaces(bus, msg)) {
        return true;
      }
      if (!bus._serviceObjects[path2]) {
        return false;
      }
      const obj = bus._getServiceObject(path2);
      const iface = obj.interfaces[ifaceName];
      if (!iface) {
        return false;
      }
      const methods = iface.$methods || {};
      for (const m of Object.keys(methods)) {
        const method = methods[m];
        let result = null;
        const handleError = /* @__PURE__ */ __name((e) => {
          if (e.name === "DBusError") {
            bus.send(Message.newError(msg, e.type, e.text));
          } else {
            sendServiceError(bus, msg, `The service threw an error.
${e.stack}`);
          }
        }, "handleError");
        if (method.name === member && method.inSignature === signature) {
          try {
            result = method.fn.apply(iface, msg.body);
          } catch (e) {
            handleError(e);
            return true;
          }
          const sendReply = /* @__PURE__ */ __name((body) => {
            if (method.noReply) return;
            if (body === void 0) {
              body = [];
            } else if (method.outSignatureTree.length === 1) {
              body = [body];
            } else if (method.outSignatureTree.length === 0) {
              return sendServiceError(bus, msg, `method ${iface.$name}.${method.name} was not expected to return a body.`);
            } else if (!Array.isArray(body)) {
              return sendServiceError(bus, msg, `method ${iface.$name}.${method.name} expected to return multiple arguments in an array (signature: '${method.outSignature}')`);
            }
            if (method.outSignatureTree.length !== body.length) {
              return sendServiceError(bus, msg, `method ${iface.$name}.${m} returned the wrong number of arguments (got ${body.length} expected ${method.outSignatureTree.length}) for signature '${method.outSignature}'`);
            }
            bus.send(Message.newMethodReturn(msg, method.outSignature, body));
          }, "sendReply");
          if (result && result.constructor === Promise) {
            result.then(sendReply).catch(handleError);
          } else {
            sendReply(result);
          }
          return true;
        }
      }
      return false;
    }
    __name(handleMessage, "handleMessage");
    module2.exports = handleMessage;
  }
});

// node_modules/dbus-next/lib/service/object.js
var require_object = __commonJS({
  "node_modules/dbus-next/lib/service/object.js"(exports2, module2) {
    var { Message } = require_message_type();
    var Interface = require_interface().Interface;
    var assertObjectPathValid = require_validators().assertObjectPathValid;
    var ServiceObject = class _ServiceObject {
      static {
        __name(this, "ServiceObject");
      }
      constructor(path2, bus) {
        assertObjectPathValid(path2);
        this.path = path2;
        this.bus = bus;
        this.interfaces = {};
        this._handlers = {};
      }
      addInterface(iface) {
        if (!(iface instanceof Interface)) {
          throw new Error(`object.addInterface takes an Interface as the first argument (got ${iface})`);
        }
        if (this.interfaces[iface.$name]) {
          throw new Error(`an interface with name '${iface.$name}' is already exported on this object`);
        }
        this.interfaces[iface.$name] = iface;
        const that2 = this;
        const propertiesChangedHandler = /* @__PURE__ */ __name(function(changedProperties, invalidatedProperties) {
          const body = [
            iface.$name,
            changedProperties,
            invalidatedProperties
          ];
          that2.bus.send(Message.newSignal(that2.path, "org.freedesktop.DBus.Properties", "PropertiesChanged", "sa{sv}as", body));
        }, "propertiesChangedHandler");
        const signalHandler = /* @__PURE__ */ __name(function(options, result) {
          const {
            signature,
            signatureTree,
            name
          } = options;
          if (result === void 0) {
            result = [];
          } else if (signatureTree.length === 1) {
            result = [result];
          } else if (!Array.isArray(result)) {
            throw new Error(`signal ${iface.$name}.${name} expected to return multiple arguments in an array (signature: '${signature}')`);
          }
          if (signatureTree.length !== result.length) {
            throw new Error(`signal ${iface.$name}.${name} returned the wrong number of arguments (got ${result.length} expected ${signatureTree.length}) for signature '${signature}'`);
          }
          that2.bus.send(Message.newSignal(that2.path, iface.$name, name, signature, result));
        }, "signalHandler");
        this._handlers[iface.$name] = {
          propertiesChanged: propertiesChangedHandler,
          signal: signalHandler
        };
        iface.$emitter.on("signal", signalHandler);
        iface.$emitter.on("properties-changed", propertiesChangedHandler);
      }
      removeInterface(iface) {
        if (!(iface instanceof Interface)) {
          throw new Error(`object.removeInterface takes an Interface as the first argument (got ${iface})`);
        }
        if (!this.interfaces[iface.$name]) {
          throw new Error(`Interface ${iface.$name} not exported on this object`);
        }
        const handlers = this._handlers[iface.$name];
        iface.$emitter.removeListener("signal", handlers.signal);
        iface.$emitter.removeListener("properties-changed", handlers.propertiesChanged);
        delete this._handlers[iface.$name];
        delete this.interfaces[iface.$name];
      }
      introspect() {
        const interfaces = _ServiceObject.defaultInterfaces();
        for (const i of Object.keys(this.interfaces)) {
          const iface = this.interfaces[i];
          interfaces.push(iface.$introspect());
        }
        return interfaces;
      }
      static defaultInterfaces() {
        return [
          {
            $: { name: "org.freedesktop.DBus.Introspectable" },
            method: [
              {
                $: { name: "Introspect" },
                arg: [
                  {
                    $: { name: "data", direction: "out", type: "s" }
                  }
                ]
              }
            ]
          },
          {
            $: { name: "org.freedesktop.DBus.Peer" },
            method: [
              {
                $: { name: "GetMachineId" },
                arg: [
                  { $: { direction: "out", name: "machine_uuid", type: "s" } }
                ]
              },
              {
                $: { name: "Ping" }
              }
            ]
          },
          {
            $: { name: "org.freedesktop.DBus.Properties" },
            method: [
              {
                $: { name: "Get" },
                arg: [
                  { $: { direction: "in", type: "s" } },
                  { $: { direction: "in", type: "s" } },
                  { $: { direction: "out", type: "v" } }
                ]
              },
              {
                $: { name: "Set" },
                arg: [
                  { $: { direction: "in", type: "s" } },
                  { $: { direction: "in", type: "s" } },
                  { $: { direction: "in", type: "v" } }
                ]
              },
              {
                $: { name: "GetAll" },
                arg: [
                  { $: { direction: "in", type: "s" } },
                  { $: { direction: "out", type: "a{sv}" } }
                ]
              }
            ],
            signal: [
              {
                $: { name: "PropertiesChanged" },
                arg: [
                  { $: { type: "s" } },
                  { $: { type: "a{sv}" } },
                  { $: { type: "as" } }
                ]
              }
            ]
          }
        ];
      }
    };
    module2.exports = ServiceObject;
  }
});

// node_modules/xml2js/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/xml2js/lib/defaults.js"(exports2) {
    (function() {
      exports2.defaults = {
        "0.1": {
          explicitCharkey: false,
          trim: true,
          normalize: true,
          normalizeTags: false,
          attrkey: "@",
          charkey: "#",
          explicitArray: false,
          ignoreAttrs: false,
          mergeAttrs: false,
          explicitRoot: false,
          validator: null,
          xmlns: false,
          explicitChildren: false,
          childkey: "@@",
          charsAsChildren: false,
          includeWhiteChars: false,
          async: false,
          strict: true,
          attrNameProcessors: null,
          attrValueProcessors: null,
          tagNameProcessors: null,
          valueProcessors: null,
          emptyTag: ""
        },
        "0.2": {
          explicitCharkey: false,
          trim: false,
          normalize: false,
          normalizeTags: false,
          attrkey: "$",
          charkey: "_",
          explicitArray: true,
          ignoreAttrs: false,
          mergeAttrs: false,
          explicitRoot: true,
          validator: null,
          xmlns: false,
          explicitChildren: false,
          preserveChildrenOrder: false,
          childkey: "$$",
          charsAsChildren: false,
          includeWhiteChars: false,
          async: false,
          strict: true,
          attrNameProcessors: null,
          attrValueProcessors: null,
          tagNameProcessors: null,
          valueProcessors: null,
          rootName: "root",
          xmldec: {
            "version": "1.0",
            "encoding": "UTF-8",
            "standalone": true
          },
          doctype: null,
          renderOpts: {
            "pretty": true,
            "indent": "  ",
            "newline": "\n"
          },
          headless: false,
          chunkSize: 1e4,
          emptyTag: "",
          cdata: false
        }
      };
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/Utility.js
var require_Utility = __commonJS({
  "node_modules/xmlbuilder/lib/Utility.js"(exports2, module2) {
    (function() {
      var assign, getValue, isArray, isEmpty, isFunction, isObject, isPlainObject, slice = [].slice, hasProp = {}.hasOwnProperty;
      assign = /* @__PURE__ */ __name(function() {
        var i, key, len, source, sources, target;
        target = arguments[0], sources = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        if (isFunction(Object.assign)) {
          Object.assign.apply(null, arguments);
        } else {
          for (i = 0, len = sources.length; i < len; i++) {
            source = sources[i];
            if (source != null) {
              for (key in source) {
                if (!hasProp.call(source, key)) continue;
                target[key] = source[key];
              }
            }
          }
        }
        return target;
      }, "assign");
      isFunction = /* @__PURE__ */ __name(function(val) {
        return !!val && Object.prototype.toString.call(val) === "[object Function]";
      }, "isFunction");
      isObject = /* @__PURE__ */ __name(function(val) {
        var ref;
        return !!val && ((ref = typeof val) === "function" || ref === "object");
      }, "isObject");
      isArray = /* @__PURE__ */ __name(function(val) {
        if (isFunction(Array.isArray)) {
          return Array.isArray(val);
        } else {
          return Object.prototype.toString.call(val) === "[object Array]";
        }
      }, "isArray");
      isEmpty = /* @__PURE__ */ __name(function(val) {
        var key;
        if (isArray(val)) {
          return !val.length;
        } else {
          for (key in val) {
            if (!hasProp.call(val, key)) continue;
            return false;
          }
          return true;
        }
      }, "isEmpty");
      isPlainObject = /* @__PURE__ */ __name(function(val) {
        var ctor, proto;
        return isObject(val) && (proto = Object.getPrototypeOf(val)) && (ctor = proto.constructor) && typeof ctor === "function" && ctor instanceof ctor && Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object);
      }, "isPlainObject");
      getValue = /* @__PURE__ */ __name(function(obj) {
        if (isFunction(obj.valueOf)) {
          return obj.valueOf();
        } else {
          return obj;
        }
      }, "getValue");
      module2.exports.assign = assign;
      module2.exports.isFunction = isFunction;
      module2.exports.isObject = isObject;
      module2.exports.isArray = isArray;
      module2.exports.isEmpty = isEmpty;
      module2.exports.isPlainObject = isPlainObject;
      module2.exports.getValue = getValue;
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDOMImplementation.js
var require_XMLDOMImplementation = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDOMImplementation.js"(exports2, module2) {
    (function() {
      var XMLDOMImplementation;
      module2.exports = XMLDOMImplementation = (function() {
        function XMLDOMImplementation2() {
        }
        __name(XMLDOMImplementation2, "XMLDOMImplementation");
        XMLDOMImplementation2.prototype.hasFeature = function(feature, version) {
          return true;
        };
        XMLDOMImplementation2.prototype.createDocumentType = function(qualifiedName, publicId, systemId) {
          throw new Error("This DOM method is not implemented.");
        };
        XMLDOMImplementation2.prototype.createDocument = function(namespaceURI, qualifiedName, doctype) {
          throw new Error("This DOM method is not implemented.");
        };
        XMLDOMImplementation2.prototype.createHTMLDocument = function(title) {
          throw new Error("This DOM method is not implemented.");
        };
        XMLDOMImplementation2.prototype.getFeature = function(feature, version) {
          throw new Error("This DOM method is not implemented.");
        };
        return XMLDOMImplementation2;
      })();
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDOMErrorHandler.js
var require_XMLDOMErrorHandler = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDOMErrorHandler.js"(exports2, module2) {
    (function() {
      var XMLDOMErrorHandler;
      module2.exports = XMLDOMErrorHandler = (function() {
        function XMLDOMErrorHandler2() {
        }
        __name(XMLDOMErrorHandler2, "XMLDOMErrorHandler");
        XMLDOMErrorHandler2.prototype.handleError = function(error) {
          throw new Error(error);
        };
        return XMLDOMErrorHandler2;
      })();
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDOMStringList.js
var require_XMLDOMStringList = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDOMStringList.js"(exports2, module2) {
    (function() {
      var XMLDOMStringList;
      module2.exports = XMLDOMStringList = (function() {
        function XMLDOMStringList2(arr) {
          this.arr = arr || [];
        }
        __name(XMLDOMStringList2, "XMLDOMStringList");
        Object.defineProperty(XMLDOMStringList2.prototype, "length", {
          get: /* @__PURE__ */ __name(function() {
            return this.arr.length;
          }, "get")
        });
        XMLDOMStringList2.prototype.item = function(index) {
          return this.arr[index] || null;
        };
        XMLDOMStringList2.prototype.contains = function(str) {
          return this.arr.indexOf(str) !== -1;
        };
        return XMLDOMStringList2;
      })();
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDOMConfiguration.js
var require_XMLDOMConfiguration = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDOMConfiguration.js"(exports2, module2) {
    (function() {
      var XMLDOMConfiguration, XMLDOMErrorHandler, XMLDOMStringList;
      XMLDOMErrorHandler = require_XMLDOMErrorHandler();
      XMLDOMStringList = require_XMLDOMStringList();
      module2.exports = XMLDOMConfiguration = (function() {
        function XMLDOMConfiguration2() {
          var clonedSelf;
          this.defaultParams = {
            "canonical-form": false,
            "cdata-sections": false,
            "comments": false,
            "datatype-normalization": false,
            "element-content-whitespace": true,
            "entities": true,
            "error-handler": new XMLDOMErrorHandler(),
            "infoset": true,
            "validate-if-schema": false,
            "namespaces": true,
            "namespace-declarations": true,
            "normalize-characters": false,
            "schema-location": "",
            "schema-type": "",
            "split-cdata-sections": true,
            "validate": false,
            "well-formed": true
          };
          this.params = clonedSelf = Object.create(this.defaultParams);
        }
        __name(XMLDOMConfiguration2, "XMLDOMConfiguration");
        Object.defineProperty(XMLDOMConfiguration2.prototype, "parameterNames", {
          get: /* @__PURE__ */ __name(function() {
            return new XMLDOMStringList(Object.keys(this.defaultParams));
          }, "get")
        });
        XMLDOMConfiguration2.prototype.getParameter = function(name) {
          if (this.params.hasOwnProperty(name)) {
            return this.params[name];
          } else {
            return null;
          }
        };
        XMLDOMConfiguration2.prototype.canSetParameter = function(name, value) {
          return true;
        };
        XMLDOMConfiguration2.prototype.setParameter = function(name, value) {
          if (value != null) {
            return this.params[name] = value;
          } else {
            return delete this.params[name];
          }
        };
        return XMLDOMConfiguration2;
      })();
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/NodeType.js
var require_NodeType = __commonJS({
  "node_modules/xmlbuilder/lib/NodeType.js"(exports2, module2) {
    (function() {
      module2.exports = {
        Element: 1,
        Attribute: 2,
        Text: 3,
        CData: 4,
        EntityReference: 5,
        EntityDeclaration: 6,
        ProcessingInstruction: 7,
        Comment: 8,
        Document: 9,
        DocType: 10,
        DocumentFragment: 11,
        NotationDeclaration: 12,
        Declaration: 201,
        Raw: 202,
        AttributeDeclaration: 203,
        ElementDeclaration: 204,
        Dummy: 205
      };
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLAttribute.js
var require_XMLAttribute = __commonJS({
  "node_modules/xmlbuilder/lib/XMLAttribute.js"(exports2, module2) {
    (function() {
      var NodeType, XMLAttribute, XMLNode;
      NodeType = require_NodeType();
      XMLNode = require_XMLNode();
      module2.exports = XMLAttribute = (function() {
        function XMLAttribute2(parent, name, value) {
          this.parent = parent;
          if (this.parent) {
            this.options = this.parent.options;
            this.stringify = this.parent.stringify;
          }
          if (name == null) {
            throw new Error("Missing attribute name. " + this.debugInfo(name));
          }
          this.name = this.stringify.name(name);
          this.value = this.stringify.attValue(value);
          this.type = NodeType.Attribute;
          this.isId = false;
          this.schemaTypeInfo = null;
        }
        __name(XMLAttribute2, "XMLAttribute");
        Object.defineProperty(XMLAttribute2.prototype, "nodeType", {
          get: /* @__PURE__ */ __name(function() {
            return this.type;
          }, "get")
        });
        Object.defineProperty(XMLAttribute2.prototype, "ownerElement", {
          get: /* @__PURE__ */ __name(function() {
            return this.parent;
          }, "get")
        });
        Object.defineProperty(XMLAttribute2.prototype, "textContent", {
          get: /* @__PURE__ */ __name(function() {
            return this.value;
          }, "get"),
          set: /* @__PURE__ */ __name(function(value) {
            return this.value = value || "";
          }, "set")
        });
        Object.defineProperty(XMLAttribute2.prototype, "namespaceURI", {
          get: /* @__PURE__ */ __name(function() {
            return "";
          }, "get")
        });
        Object.defineProperty(XMLAttribute2.prototype, "prefix", {
          get: /* @__PURE__ */ __name(function() {
            return "";
          }, "get")
        });
        Object.defineProperty(XMLAttribute2.prototype, "localName", {
          get: /* @__PURE__ */ __name(function() {
            return this.name;
          }, "get")
        });
        Object.defineProperty(XMLAttribute2.prototype, "specified", {
          get: /* @__PURE__ */ __name(function() {
            return true;
          }, "get")
        });
        XMLAttribute2.prototype.clone = function() {
          return Object.create(this);
        };
        XMLAttribute2.prototype.toString = function(options) {
          return this.options.writer.attribute(this, this.options.writer.filterOptions(options));
        };
        XMLAttribute2.prototype.debugInfo = function(name) {
          name = name || this.name;
          if (name == null) {
            return "parent: <" + this.parent.name + ">";
          } else {
            return "attribute: {" + name + "}, parent: <" + this.parent.name + ">";
          }
        };
        XMLAttribute2.prototype.isEqualNode = function(node) {
          if (node.namespaceURI !== this.namespaceURI) {
            return false;
          }
          if (node.prefix !== this.prefix) {
            return false;
          }
          if (node.localName !== this.localName) {
            return false;
          }
          if (node.value !== this.value) {
            return false;
          }
          return true;
        };
        return XMLAttribute2;
      })();
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLNamedNodeMap.js
var require_XMLNamedNodeMap = __commonJS({
  "node_modules/xmlbuilder/lib/XMLNamedNodeMap.js"(exports2, module2) {
    (function() {
      var XMLNamedNodeMap;
      module2.exports = XMLNamedNodeMap = (function() {
        function XMLNamedNodeMap2(nodes) {
          this.nodes = nodes;
        }
        __name(XMLNamedNodeMap2, "XMLNamedNodeMap");
        Object.defineProperty(XMLNamedNodeMap2.prototype, "length", {
          get: /* @__PURE__ */ __name(function() {
            return Object.keys(this.nodes).length || 0;
          }, "get")
        });
        XMLNamedNodeMap2.prototype.clone = function() {
          return this.nodes = null;
        };
        XMLNamedNodeMap2.prototype.getNamedItem = function(name) {
          return this.nodes[name];
        };
        XMLNamedNodeMap2.prototype.setNamedItem = function(node) {
          var oldNode;
          oldNode = this.nodes[node.nodeName];
          this.nodes[node.nodeName] = node;
          return oldNode || null;
        };
        XMLNamedNodeMap2.prototype.removeNamedItem = function(name) {
          var oldNode;
          oldNode = this.nodes[name];
          delete this.nodes[name];
          return oldNode || null;
        };
        XMLNamedNodeMap2.prototype.item = function(index) {
          return this.nodes[Object.keys(this.nodes)[index]] || null;
        };
        XMLNamedNodeMap2.prototype.getNamedItemNS = function(namespaceURI, localName) {
          throw new Error("This DOM method is not implemented.");
        };
        XMLNamedNodeMap2.prototype.setNamedItemNS = function(node) {
          throw new Error("This DOM method is not implemented.");
        };
        XMLNamedNodeMap2.prototype.removeNamedItemNS = function(namespaceURI, localName) {
          throw new Error("This DOM method is not implemented.");
        };
        return XMLNamedNodeMap2;
      })();
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLElement.js
var require_XMLElement = __commonJS({
  "node_modules/xmlbuilder/lib/XMLElement.js"(exports2, module2) {
    (function() {
      var NodeType, XMLAttribute, XMLElement, XMLNamedNodeMap, XMLNode, getValue, isFunction, isObject, ref, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      ref = require_Utility(), isObject = ref.isObject, isFunction = ref.isFunction, getValue = ref.getValue;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      XMLAttribute = require_XMLAttribute();
      XMLNamedNodeMap = require_XMLNamedNodeMap();
      module2.exports = XMLElement = (function(superClass) {
        extend(XMLElement2, superClass);
        function XMLElement2(parent, name, attributes) {
          var child, j, len, ref1;
          XMLElement2.__super__.constructor.call(this, parent);
          if (name == null) {
            throw new Error("Missing element name. " + this.debugInfo());
          }
          this.name = this.stringify.name(name);
          this.type = NodeType.Element;
          this.attribs = {};
          this.schemaTypeInfo = null;
          if (attributes != null) {
            this.attribute(attributes);
          }
          if (parent.type === NodeType.Document) {
            this.isRoot = true;
            this.documentObject = parent;
            parent.rootObject = this;
            if (parent.children) {
              ref1 = parent.children;
              for (j = 0, len = ref1.length; j < len; j++) {
                child = ref1[j];
                if (child.type === NodeType.DocType) {
                  child.name = this.name;
                  break;
                }
              }
            }
          }
        }
        __name(XMLElement2, "XMLElement");
        Object.defineProperty(XMLElement2.prototype, "tagName", {
          get: /* @__PURE__ */ __name(function() {
            return this.name;
          }, "get")
        });
        Object.defineProperty(XMLElement2.prototype, "namespaceURI", {
          get: /* @__PURE__ */ __name(function() {
            return "";
          }, "get")
        });
        Object.defineProperty(XMLElement2.prototype, "prefix", {
          get: /* @__PURE__ */ __name(function() {
            return "";
          }, "get")
        });
        Object.defineProperty(XMLElement2.prototype, "localName", {
          get: /* @__PURE__ */ __name(function() {
            return this.name;
          }, "get")
        });
        Object.defineProperty(XMLElement2.prototype, "id", {
          get: /* @__PURE__ */ __name(function() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }, "get")
        });
        Object.defineProperty(XMLElement2.prototype, "className", {
          get: /* @__PURE__ */ __name(function() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }, "get")
        });
        Object.defineProperty(XMLElement2.prototype, "classList", {
          get: /* @__PURE__ */ __name(function() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }, "get")
        });
        Object.defineProperty(XMLElement2.prototype, "attributes", {
          get: /* @__PURE__ */ __name(function() {
            if (!this.attributeMap || !this.attributeMap.nodes) {
              this.attributeMap = new XMLNamedNodeMap(this.attribs);
            }
            return this.attributeMap;
          }, "get")
        });
        XMLElement2.prototype.clone = function() {
          var att, attName, clonedSelf, ref1;
          clonedSelf = Object.create(this);
          if (clonedSelf.isRoot) {
            clonedSelf.documentObject = null;
          }
          clonedSelf.attribs = {};
          ref1 = this.attribs;
          for (attName in ref1) {
            if (!hasProp.call(ref1, attName)) continue;
            att = ref1[attName];
            clonedSelf.attribs[attName] = att.clone();
          }
          clonedSelf.children = [];
          this.children.forEach(function(child) {
            var clonedChild;
            clonedChild = child.clone();
            clonedChild.parent = clonedSelf;
            return clonedSelf.children.push(clonedChild);
          });
          return clonedSelf;
        };
        XMLElement2.prototype.attribute = function(name, value) {
          var attName, attValue;
          if (name != null) {
            name = getValue(name);
          }
          if (isObject(name)) {
            for (attName in name) {
              if (!hasProp.call(name, attName)) continue;
              attValue = name[attName];
              this.attribute(attName, attValue);
            }
          } else {
            if (isFunction(value)) {
              value = value.apply();
            }
            if (this.options.keepNullAttributes && value == null) {
              this.attribs[name] = new XMLAttribute(this, name, "");
            } else if (value != null) {
              this.attribs[name] = new XMLAttribute(this, name, value);
            }
          }
          return this;
        };
        XMLElement2.prototype.removeAttribute = function(name) {
          var attName, j, len;
          if (name == null) {
            throw new Error("Missing attribute name. " + this.debugInfo());
          }
          name = getValue(name);
          if (Array.isArray(name)) {
            for (j = 0, len = name.length; j < len; j++) {
              attName = name[j];
              delete this.attribs[attName];
            }
          } else {
            delete this.attribs[name];
          }
          return this;
        };
        XMLElement2.prototype.toString = function(options) {
          return this.options.writer.element(this, this.options.writer.filterOptions(options));
        };
        XMLElement2.prototype.att = function(name, value) {
          return this.attribute(name, value);
        };
        XMLElement2.prototype.a = function(name, value) {
          return this.attribute(name, value);
        };
        XMLElement2.prototype.getAttribute = function(name) {
          if (this.attribs.hasOwnProperty(name)) {
            return this.attribs[name].value;
          } else {
            return null;
          }
        };
        XMLElement2.prototype.setAttribute = function(name, value) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.getAttributeNode = function(name) {
          if (this.attribs.hasOwnProperty(name)) {
            return this.attribs[name];
          } else {
            return null;
          }
        };
        XMLElement2.prototype.setAttributeNode = function(newAttr) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.removeAttributeNode = function(oldAttr) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.getElementsByTagName = function(name) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.getAttributeNS = function(namespaceURI, localName) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.setAttributeNS = function(namespaceURI, qualifiedName, value) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.removeAttributeNS = function(namespaceURI, localName) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.getAttributeNodeNS = function(namespaceURI, localName) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.setAttributeNodeNS = function(newAttr) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.getElementsByTagNameNS = function(namespaceURI, localName) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.hasAttribute = function(name) {
          return this.attribs.hasOwnProperty(name);
        };
        XMLElement2.prototype.hasAttributeNS = function(namespaceURI, localName) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.setIdAttribute = function(name, isId) {
          if (this.attribs.hasOwnProperty(name)) {
            return this.attribs[name].isId;
          } else {
            return isId;
          }
        };
        XMLElement2.prototype.setIdAttributeNS = function(namespaceURI, localName, isId) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.setIdAttributeNode = function(idAttr, isId) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.getElementsByTagName = function(tagname) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.getElementsByTagNameNS = function(namespaceURI, localName) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.getElementsByClassName = function(classNames) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLElement2.prototype.isEqualNode = function(node) {
          var i, j, ref1;
          if (!XMLElement2.__super__.isEqualNode.apply(this, arguments).isEqualNode(node)) {
            return false;
          }
          if (node.namespaceURI !== this.namespaceURI) {
            return false;
          }
          if (node.prefix !== this.prefix) {
            return false;
          }
          if (node.localName !== this.localName) {
            return false;
          }
          if (node.attribs.length !== this.attribs.length) {
            return false;
          }
          for (i = j = 0, ref1 = this.attribs.length - 1; 0 <= ref1 ? j <= ref1 : j >= ref1; i = 0 <= ref1 ? ++j : --j) {
            if (!this.attribs[i].isEqualNode(node.attribs[i])) {
              return false;
            }
          }
          return true;
        };
        return XMLElement2;
      })(XMLNode);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLCharacterData.js
var require_XMLCharacterData = __commonJS({
  "node_modules/xmlbuilder/lib/XMLCharacterData.js"(exports2, module2) {
    (function() {
      var XMLCharacterData, XMLNode, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      XMLNode = require_XMLNode();
      module2.exports = XMLCharacterData = (function(superClass) {
        extend(XMLCharacterData2, superClass);
        function XMLCharacterData2(parent) {
          XMLCharacterData2.__super__.constructor.call(this, parent);
          this.value = "";
        }
        __name(XMLCharacterData2, "XMLCharacterData");
        Object.defineProperty(XMLCharacterData2.prototype, "data", {
          get: /* @__PURE__ */ __name(function() {
            return this.value;
          }, "get"),
          set: /* @__PURE__ */ __name(function(value) {
            return this.value = value || "";
          }, "set")
        });
        Object.defineProperty(XMLCharacterData2.prototype, "length", {
          get: /* @__PURE__ */ __name(function() {
            return this.value.length;
          }, "get")
        });
        Object.defineProperty(XMLCharacterData2.prototype, "textContent", {
          get: /* @__PURE__ */ __name(function() {
            return this.value;
          }, "get"),
          set: /* @__PURE__ */ __name(function(value) {
            return this.value = value || "";
          }, "set")
        });
        XMLCharacterData2.prototype.clone = function() {
          return Object.create(this);
        };
        XMLCharacterData2.prototype.substringData = function(offset, count) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLCharacterData2.prototype.appendData = function(arg) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLCharacterData2.prototype.insertData = function(offset, arg) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLCharacterData2.prototype.deleteData = function(offset, count) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLCharacterData2.prototype.replaceData = function(offset, count, arg) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLCharacterData2.prototype.isEqualNode = function(node) {
          if (!XMLCharacterData2.__super__.isEqualNode.apply(this, arguments).isEqualNode(node)) {
            return false;
          }
          if (node.data !== this.data) {
            return false;
          }
          return true;
        };
        return XMLCharacterData2;
      })(XMLNode);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLCData.js
var require_XMLCData = __commonJS({
  "node_modules/xmlbuilder/lib/XMLCData.js"(exports2, module2) {
    (function() {
      var NodeType, XMLCData, XMLCharacterData, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      NodeType = require_NodeType();
      XMLCharacterData = require_XMLCharacterData();
      module2.exports = XMLCData = (function(superClass) {
        extend(XMLCData2, superClass);
        function XMLCData2(parent, text) {
          XMLCData2.__super__.constructor.call(this, parent);
          if (text == null) {
            throw new Error("Missing CDATA text. " + this.debugInfo());
          }
          this.name = "#cdata-section";
          this.type = NodeType.CData;
          this.value = this.stringify.cdata(text);
        }
        __name(XMLCData2, "XMLCData");
        XMLCData2.prototype.clone = function() {
          return Object.create(this);
        };
        XMLCData2.prototype.toString = function(options) {
          return this.options.writer.cdata(this, this.options.writer.filterOptions(options));
        };
        return XMLCData2;
      })(XMLCharacterData);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLComment.js
var require_XMLComment = __commonJS({
  "node_modules/xmlbuilder/lib/XMLComment.js"(exports2, module2) {
    (function() {
      var NodeType, XMLCharacterData, XMLComment, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      NodeType = require_NodeType();
      XMLCharacterData = require_XMLCharacterData();
      module2.exports = XMLComment = (function(superClass) {
        extend(XMLComment2, superClass);
        function XMLComment2(parent, text) {
          XMLComment2.__super__.constructor.call(this, parent);
          if (text == null) {
            throw new Error("Missing comment text. " + this.debugInfo());
          }
          this.name = "#comment";
          this.type = NodeType.Comment;
          this.value = this.stringify.comment(text);
        }
        __name(XMLComment2, "XMLComment");
        XMLComment2.prototype.clone = function() {
          return Object.create(this);
        };
        XMLComment2.prototype.toString = function(options) {
          return this.options.writer.comment(this, this.options.writer.filterOptions(options));
        };
        return XMLComment2;
      })(XMLCharacterData);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDeclaration.js
var require_XMLDeclaration = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDeclaration.js"(exports2, module2) {
    (function() {
      var NodeType, XMLDeclaration, XMLNode, isObject, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      isObject = require_Utility().isObject;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module2.exports = XMLDeclaration = (function(superClass) {
        extend(XMLDeclaration2, superClass);
        function XMLDeclaration2(parent, version, encoding, standalone) {
          var ref;
          XMLDeclaration2.__super__.constructor.call(this, parent);
          if (isObject(version)) {
            ref = version, version = ref.version, encoding = ref.encoding, standalone = ref.standalone;
          }
          if (!version) {
            version = "1.0";
          }
          this.type = NodeType.Declaration;
          this.version = this.stringify.xmlVersion(version);
          if (encoding != null) {
            this.encoding = this.stringify.xmlEncoding(encoding);
          }
          if (standalone != null) {
            this.standalone = this.stringify.xmlStandalone(standalone);
          }
        }
        __name(XMLDeclaration2, "XMLDeclaration");
        XMLDeclaration2.prototype.toString = function(options) {
          return this.options.writer.declaration(this, this.options.writer.filterOptions(options));
        };
        return XMLDeclaration2;
      })(XMLNode);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDTDAttList.js
var require_XMLDTDAttList = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDTDAttList.js"(exports2, module2) {
    (function() {
      var NodeType, XMLDTDAttList, XMLNode, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module2.exports = XMLDTDAttList = (function(superClass) {
        extend(XMLDTDAttList2, superClass);
        function XMLDTDAttList2(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue) {
          XMLDTDAttList2.__super__.constructor.call(this, parent);
          if (elementName == null) {
            throw new Error("Missing DTD element name. " + this.debugInfo());
          }
          if (attributeName == null) {
            throw new Error("Missing DTD attribute name. " + this.debugInfo(elementName));
          }
          if (!attributeType) {
            throw new Error("Missing DTD attribute type. " + this.debugInfo(elementName));
          }
          if (!defaultValueType) {
            throw new Error("Missing DTD attribute default. " + this.debugInfo(elementName));
          }
          if (defaultValueType.indexOf("#") !== 0) {
            defaultValueType = "#" + defaultValueType;
          }
          if (!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) {
            throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT. " + this.debugInfo(elementName));
          }
          if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) {
            throw new Error("Default value only applies to #FIXED or #DEFAULT. " + this.debugInfo(elementName));
          }
          this.elementName = this.stringify.name(elementName);
          this.type = NodeType.AttributeDeclaration;
          this.attributeName = this.stringify.name(attributeName);
          this.attributeType = this.stringify.dtdAttType(attributeType);
          if (defaultValue) {
            this.defaultValue = this.stringify.dtdAttDefault(defaultValue);
          }
          this.defaultValueType = defaultValueType;
        }
        __name(XMLDTDAttList2, "XMLDTDAttList");
        XMLDTDAttList2.prototype.toString = function(options) {
          return this.options.writer.dtdAttList(this, this.options.writer.filterOptions(options));
        };
        return XMLDTDAttList2;
      })(XMLNode);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDTDEntity.js
var require_XMLDTDEntity = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDTDEntity.js"(exports2, module2) {
    (function() {
      var NodeType, XMLDTDEntity, XMLNode, isObject, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      isObject = require_Utility().isObject;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module2.exports = XMLDTDEntity = (function(superClass) {
        extend(XMLDTDEntity2, superClass);
        function XMLDTDEntity2(parent, pe, name, value) {
          XMLDTDEntity2.__super__.constructor.call(this, parent);
          if (name == null) {
            throw new Error("Missing DTD entity name. " + this.debugInfo(name));
          }
          if (value == null) {
            throw new Error("Missing DTD entity value. " + this.debugInfo(name));
          }
          this.pe = !!pe;
          this.name = this.stringify.name(name);
          this.type = NodeType.EntityDeclaration;
          if (!isObject(value)) {
            this.value = this.stringify.dtdEntityValue(value);
            this.internal = true;
          } else {
            if (!value.pubID && !value.sysID) {
              throw new Error("Public and/or system identifiers are required for an external entity. " + this.debugInfo(name));
            }
            if (value.pubID && !value.sysID) {
              throw new Error("System identifier is required for a public external entity. " + this.debugInfo(name));
            }
            this.internal = false;
            if (value.pubID != null) {
              this.pubID = this.stringify.dtdPubID(value.pubID);
            }
            if (value.sysID != null) {
              this.sysID = this.stringify.dtdSysID(value.sysID);
            }
            if (value.nData != null) {
              this.nData = this.stringify.dtdNData(value.nData);
            }
            if (this.pe && this.nData) {
              throw new Error("Notation declaration is not allowed in a parameter entity. " + this.debugInfo(name));
            }
          }
        }
        __name(XMLDTDEntity2, "XMLDTDEntity");
        Object.defineProperty(XMLDTDEntity2.prototype, "publicId", {
          get: /* @__PURE__ */ __name(function() {
            return this.pubID;
          }, "get")
        });
        Object.defineProperty(XMLDTDEntity2.prototype, "systemId", {
          get: /* @__PURE__ */ __name(function() {
            return this.sysID;
          }, "get")
        });
        Object.defineProperty(XMLDTDEntity2.prototype, "notationName", {
          get: /* @__PURE__ */ __name(function() {
            return this.nData || null;
          }, "get")
        });
        Object.defineProperty(XMLDTDEntity2.prototype, "inputEncoding", {
          get: /* @__PURE__ */ __name(function() {
            return null;
          }, "get")
        });
        Object.defineProperty(XMLDTDEntity2.prototype, "xmlEncoding", {
          get: /* @__PURE__ */ __name(function() {
            return null;
          }, "get")
        });
        Object.defineProperty(XMLDTDEntity2.prototype, "xmlVersion", {
          get: /* @__PURE__ */ __name(function() {
            return null;
          }, "get")
        });
        XMLDTDEntity2.prototype.toString = function(options) {
          return this.options.writer.dtdEntity(this, this.options.writer.filterOptions(options));
        };
        return XMLDTDEntity2;
      })(XMLNode);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDTDElement.js
var require_XMLDTDElement = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDTDElement.js"(exports2, module2) {
    (function() {
      var NodeType, XMLDTDElement, XMLNode, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module2.exports = XMLDTDElement = (function(superClass) {
        extend(XMLDTDElement2, superClass);
        function XMLDTDElement2(parent, name, value) {
          XMLDTDElement2.__super__.constructor.call(this, parent);
          if (name == null) {
            throw new Error("Missing DTD element name. " + this.debugInfo());
          }
          if (!value) {
            value = "(#PCDATA)";
          }
          if (Array.isArray(value)) {
            value = "(" + value.join(",") + ")";
          }
          this.name = this.stringify.name(name);
          this.type = NodeType.ElementDeclaration;
          this.value = this.stringify.dtdElementValue(value);
        }
        __name(XMLDTDElement2, "XMLDTDElement");
        XMLDTDElement2.prototype.toString = function(options) {
          return this.options.writer.dtdElement(this, this.options.writer.filterOptions(options));
        };
        return XMLDTDElement2;
      })(XMLNode);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDTDNotation.js
var require_XMLDTDNotation = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDTDNotation.js"(exports2, module2) {
    (function() {
      var NodeType, XMLDTDNotation, XMLNode, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module2.exports = XMLDTDNotation = (function(superClass) {
        extend(XMLDTDNotation2, superClass);
        function XMLDTDNotation2(parent, name, value) {
          XMLDTDNotation2.__super__.constructor.call(this, parent);
          if (name == null) {
            throw new Error("Missing DTD notation name. " + this.debugInfo(name));
          }
          if (!value.pubID && !value.sysID) {
            throw new Error("Public or system identifiers are required for an external entity. " + this.debugInfo(name));
          }
          this.name = this.stringify.name(name);
          this.type = NodeType.NotationDeclaration;
          if (value.pubID != null) {
            this.pubID = this.stringify.dtdPubID(value.pubID);
          }
          if (value.sysID != null) {
            this.sysID = this.stringify.dtdSysID(value.sysID);
          }
        }
        __name(XMLDTDNotation2, "XMLDTDNotation");
        Object.defineProperty(XMLDTDNotation2.prototype, "publicId", {
          get: /* @__PURE__ */ __name(function() {
            return this.pubID;
          }, "get")
        });
        Object.defineProperty(XMLDTDNotation2.prototype, "systemId", {
          get: /* @__PURE__ */ __name(function() {
            return this.sysID;
          }, "get")
        });
        XMLDTDNotation2.prototype.toString = function(options) {
          return this.options.writer.dtdNotation(this, this.options.writer.filterOptions(options));
        };
        return XMLDTDNotation2;
      })(XMLNode);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDocType.js
var require_XMLDocType = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDocType.js"(exports2, module2) {
    (function() {
      var NodeType, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDocType, XMLNamedNodeMap, XMLNode, isObject, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      isObject = require_Utility().isObject;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      XMLDTDAttList = require_XMLDTDAttList();
      XMLDTDEntity = require_XMLDTDEntity();
      XMLDTDElement = require_XMLDTDElement();
      XMLDTDNotation = require_XMLDTDNotation();
      XMLNamedNodeMap = require_XMLNamedNodeMap();
      module2.exports = XMLDocType = (function(superClass) {
        extend(XMLDocType2, superClass);
        function XMLDocType2(parent, pubID, sysID) {
          var child, i, len, ref, ref1, ref2;
          XMLDocType2.__super__.constructor.call(this, parent);
          this.type = NodeType.DocType;
          if (parent.children) {
            ref = parent.children;
            for (i = 0, len = ref.length; i < len; i++) {
              child = ref[i];
              if (child.type === NodeType.Element) {
                this.name = child.name;
                break;
              }
            }
          }
          this.documentObject = parent;
          if (isObject(pubID)) {
            ref1 = pubID, pubID = ref1.pubID, sysID = ref1.sysID;
          }
          if (sysID == null) {
            ref2 = [pubID, sysID], sysID = ref2[0], pubID = ref2[1];
          }
          if (pubID != null) {
            this.pubID = this.stringify.dtdPubID(pubID);
          }
          if (sysID != null) {
            this.sysID = this.stringify.dtdSysID(sysID);
          }
        }
        __name(XMLDocType2, "XMLDocType");
        Object.defineProperty(XMLDocType2.prototype, "entities", {
          get: /* @__PURE__ */ __name(function() {
            var child, i, len, nodes, ref;
            nodes = {};
            ref = this.children;
            for (i = 0, len = ref.length; i < len; i++) {
              child = ref[i];
              if (child.type === NodeType.EntityDeclaration && !child.pe) {
                nodes[child.name] = child;
              }
            }
            return new XMLNamedNodeMap(nodes);
          }, "get")
        });
        Object.defineProperty(XMLDocType2.prototype, "notations", {
          get: /* @__PURE__ */ __name(function() {
            var child, i, len, nodes, ref;
            nodes = {};
            ref = this.children;
            for (i = 0, len = ref.length; i < len; i++) {
              child = ref[i];
              if (child.type === NodeType.NotationDeclaration) {
                nodes[child.name] = child;
              }
            }
            return new XMLNamedNodeMap(nodes);
          }, "get")
        });
        Object.defineProperty(XMLDocType2.prototype, "publicId", {
          get: /* @__PURE__ */ __name(function() {
            return this.pubID;
          }, "get")
        });
        Object.defineProperty(XMLDocType2.prototype, "systemId", {
          get: /* @__PURE__ */ __name(function() {
            return this.sysID;
          }, "get")
        });
        Object.defineProperty(XMLDocType2.prototype, "internalSubset", {
          get: /* @__PURE__ */ __name(function() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }, "get")
        });
        XMLDocType2.prototype.element = function(name, value) {
          var child;
          child = new XMLDTDElement(this, name, value);
          this.children.push(child);
          return this;
        };
        XMLDocType2.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
          var child;
          child = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
          this.children.push(child);
          return this;
        };
        XMLDocType2.prototype.entity = function(name, value) {
          var child;
          child = new XMLDTDEntity(this, false, name, value);
          this.children.push(child);
          return this;
        };
        XMLDocType2.prototype.pEntity = function(name, value) {
          var child;
          child = new XMLDTDEntity(this, true, name, value);
          this.children.push(child);
          return this;
        };
        XMLDocType2.prototype.notation = function(name, value) {
          var child;
          child = new XMLDTDNotation(this, name, value);
          this.children.push(child);
          return this;
        };
        XMLDocType2.prototype.toString = function(options) {
          return this.options.writer.docType(this, this.options.writer.filterOptions(options));
        };
        XMLDocType2.prototype.ele = function(name, value) {
          return this.element(name, value);
        };
        XMLDocType2.prototype.att = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
          return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue);
        };
        XMLDocType2.prototype.ent = function(name, value) {
          return this.entity(name, value);
        };
        XMLDocType2.prototype.pent = function(name, value) {
          return this.pEntity(name, value);
        };
        XMLDocType2.prototype.not = function(name, value) {
          return this.notation(name, value);
        };
        XMLDocType2.prototype.up = function() {
          return this.root() || this.documentObject;
        };
        XMLDocType2.prototype.isEqualNode = function(node) {
          if (!XMLDocType2.__super__.isEqualNode.apply(this, arguments).isEqualNode(node)) {
            return false;
          }
          if (node.name !== this.name) {
            return false;
          }
          if (node.publicId !== this.publicId) {
            return false;
          }
          if (node.systemId !== this.systemId) {
            return false;
          }
          return true;
        };
        return XMLDocType2;
      })(XMLNode);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLRaw.js
var require_XMLRaw = __commonJS({
  "node_modules/xmlbuilder/lib/XMLRaw.js"(exports2, module2) {
    (function() {
      var NodeType, XMLNode, XMLRaw, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      NodeType = require_NodeType();
      XMLNode = require_XMLNode();
      module2.exports = XMLRaw = (function(superClass) {
        extend(XMLRaw2, superClass);
        function XMLRaw2(parent, text) {
          XMLRaw2.__super__.constructor.call(this, parent);
          if (text == null) {
            throw new Error("Missing raw text. " + this.debugInfo());
          }
          this.type = NodeType.Raw;
          this.value = this.stringify.raw(text);
        }
        __name(XMLRaw2, "XMLRaw");
        XMLRaw2.prototype.clone = function() {
          return Object.create(this);
        };
        XMLRaw2.prototype.toString = function(options) {
          return this.options.writer.raw(this, this.options.writer.filterOptions(options));
        };
        return XMLRaw2;
      })(XMLNode);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLText.js
var require_XMLText = __commonJS({
  "node_modules/xmlbuilder/lib/XMLText.js"(exports2, module2) {
    (function() {
      var NodeType, XMLCharacterData, XMLText, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      NodeType = require_NodeType();
      XMLCharacterData = require_XMLCharacterData();
      module2.exports = XMLText = (function(superClass) {
        extend(XMLText2, superClass);
        function XMLText2(parent, text) {
          XMLText2.__super__.constructor.call(this, parent);
          if (text == null) {
            throw new Error("Missing element text. " + this.debugInfo());
          }
          this.name = "#text";
          this.type = NodeType.Text;
          this.value = this.stringify.text(text);
        }
        __name(XMLText2, "XMLText");
        Object.defineProperty(XMLText2.prototype, "isElementContentWhitespace", {
          get: /* @__PURE__ */ __name(function() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }, "get")
        });
        Object.defineProperty(XMLText2.prototype, "wholeText", {
          get: /* @__PURE__ */ __name(function() {
            var next, prev, str;
            str = "";
            prev = this.previousSibling;
            while (prev) {
              str = prev.data + str;
              prev = prev.previousSibling;
            }
            str += this.data;
            next = this.nextSibling;
            while (next) {
              str = str + next.data;
              next = next.nextSibling;
            }
            return str;
          }, "get")
        });
        XMLText2.prototype.clone = function() {
          return Object.create(this);
        };
        XMLText2.prototype.toString = function(options) {
          return this.options.writer.text(this, this.options.writer.filterOptions(options));
        };
        XMLText2.prototype.splitText = function(offset) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLText2.prototype.replaceWholeText = function(content) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        return XMLText2;
      })(XMLCharacterData);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLProcessingInstruction.js
var require_XMLProcessingInstruction = __commonJS({
  "node_modules/xmlbuilder/lib/XMLProcessingInstruction.js"(exports2, module2) {
    (function() {
      var NodeType, XMLCharacterData, XMLProcessingInstruction, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      NodeType = require_NodeType();
      XMLCharacterData = require_XMLCharacterData();
      module2.exports = XMLProcessingInstruction = (function(superClass) {
        extend(XMLProcessingInstruction2, superClass);
        function XMLProcessingInstruction2(parent, target, value) {
          XMLProcessingInstruction2.__super__.constructor.call(this, parent);
          if (target == null) {
            throw new Error("Missing instruction target. " + this.debugInfo());
          }
          this.type = NodeType.ProcessingInstruction;
          this.target = this.stringify.insTarget(target);
          this.name = this.target;
          if (value) {
            this.value = this.stringify.insValue(value);
          }
        }
        __name(XMLProcessingInstruction2, "XMLProcessingInstruction");
        XMLProcessingInstruction2.prototype.clone = function() {
          return Object.create(this);
        };
        XMLProcessingInstruction2.prototype.toString = function(options) {
          return this.options.writer.processingInstruction(this, this.options.writer.filterOptions(options));
        };
        XMLProcessingInstruction2.prototype.isEqualNode = function(node) {
          if (!XMLProcessingInstruction2.__super__.isEqualNode.apply(this, arguments).isEqualNode(node)) {
            return false;
          }
          if (node.target !== this.target) {
            return false;
          }
          return true;
        };
        return XMLProcessingInstruction2;
      })(XMLCharacterData);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDummy.js
var require_XMLDummy = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDummy.js"(exports2, module2) {
    (function() {
      var NodeType, XMLDummy, XMLNode, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module2.exports = XMLDummy = (function(superClass) {
        extend(XMLDummy2, superClass);
        function XMLDummy2(parent) {
          XMLDummy2.__super__.constructor.call(this, parent);
          this.type = NodeType.Dummy;
        }
        __name(XMLDummy2, "XMLDummy");
        XMLDummy2.prototype.clone = function() {
          return Object.create(this);
        };
        XMLDummy2.prototype.toString = function(options) {
          return "";
        };
        return XMLDummy2;
      })(XMLNode);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLNodeList.js
var require_XMLNodeList = __commonJS({
  "node_modules/xmlbuilder/lib/XMLNodeList.js"(exports2, module2) {
    (function() {
      var XMLNodeList;
      module2.exports = XMLNodeList = (function() {
        function XMLNodeList2(nodes) {
          this.nodes = nodes;
        }
        __name(XMLNodeList2, "XMLNodeList");
        Object.defineProperty(XMLNodeList2.prototype, "length", {
          get: /* @__PURE__ */ __name(function() {
            return this.nodes.length || 0;
          }, "get")
        });
        XMLNodeList2.prototype.clone = function() {
          return this.nodes = null;
        };
        XMLNodeList2.prototype.item = function(index) {
          return this.nodes[index] || null;
        };
        return XMLNodeList2;
      })();
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/DocumentPosition.js
var require_DocumentPosition = __commonJS({
  "node_modules/xmlbuilder/lib/DocumentPosition.js"(exports2, module2) {
    (function() {
      module2.exports = {
        Disconnected: 1,
        Preceding: 2,
        Following: 4,
        Contains: 8,
        ContainedBy: 16,
        ImplementationSpecific: 32
      };
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLNode.js
var require_XMLNode = __commonJS({
  "node_modules/xmlbuilder/lib/XMLNode.js"(exports2, module2) {
    (function() {
      var DocumentPosition, NodeType, XMLCData, XMLComment, XMLDeclaration, XMLDocType, XMLDummy, XMLElement, XMLNamedNodeMap, XMLNode, XMLNodeList, XMLProcessingInstruction, XMLRaw, XMLText, getValue, isEmpty, isFunction, isObject, ref1, hasProp = {}.hasOwnProperty;
      ref1 = require_Utility(), isObject = ref1.isObject, isFunction = ref1.isFunction, isEmpty = ref1.isEmpty, getValue = ref1.getValue;
      XMLElement = null;
      XMLCData = null;
      XMLComment = null;
      XMLDeclaration = null;
      XMLDocType = null;
      XMLRaw = null;
      XMLText = null;
      XMLProcessingInstruction = null;
      XMLDummy = null;
      NodeType = null;
      XMLNodeList = null;
      XMLNamedNodeMap = null;
      DocumentPosition = null;
      module2.exports = XMLNode = (function() {
        function XMLNode2(parent1) {
          this.parent = parent1;
          if (this.parent) {
            this.options = this.parent.options;
            this.stringify = this.parent.stringify;
          }
          this.value = null;
          this.children = [];
          this.baseURI = null;
          if (!XMLElement) {
            XMLElement = require_XMLElement();
            XMLCData = require_XMLCData();
            XMLComment = require_XMLComment();
            XMLDeclaration = require_XMLDeclaration();
            XMLDocType = require_XMLDocType();
            XMLRaw = require_XMLRaw();
            XMLText = require_XMLText();
            XMLProcessingInstruction = require_XMLProcessingInstruction();
            XMLDummy = require_XMLDummy();
            NodeType = require_NodeType();
            XMLNodeList = require_XMLNodeList();
            XMLNamedNodeMap = require_XMLNamedNodeMap();
            DocumentPosition = require_DocumentPosition();
          }
        }
        __name(XMLNode2, "XMLNode");
        Object.defineProperty(XMLNode2.prototype, "nodeName", {
          get: /* @__PURE__ */ __name(function() {
            return this.name;
          }, "get")
        });
        Object.defineProperty(XMLNode2.prototype, "nodeType", {
          get: /* @__PURE__ */ __name(function() {
            return this.type;
          }, "get")
        });
        Object.defineProperty(XMLNode2.prototype, "nodeValue", {
          get: /* @__PURE__ */ __name(function() {
            return this.value;
          }, "get")
        });
        Object.defineProperty(XMLNode2.prototype, "parentNode", {
          get: /* @__PURE__ */ __name(function() {
            return this.parent;
          }, "get")
        });
        Object.defineProperty(XMLNode2.prototype, "childNodes", {
          get: /* @__PURE__ */ __name(function() {
            if (!this.childNodeList || !this.childNodeList.nodes) {
              this.childNodeList = new XMLNodeList(this.children);
            }
            return this.childNodeList;
          }, "get")
        });
        Object.defineProperty(XMLNode2.prototype, "firstChild", {
          get: /* @__PURE__ */ __name(function() {
            return this.children[0] || null;
          }, "get")
        });
        Object.defineProperty(XMLNode2.prototype, "lastChild", {
          get: /* @__PURE__ */ __name(function() {
            return this.children[this.children.length - 1] || null;
          }, "get")
        });
        Object.defineProperty(XMLNode2.prototype, "previousSibling", {
          get: /* @__PURE__ */ __name(function() {
            var i;
            i = this.parent.children.indexOf(this);
            return this.parent.children[i - 1] || null;
          }, "get")
        });
        Object.defineProperty(XMLNode2.prototype, "nextSibling", {
          get: /* @__PURE__ */ __name(function() {
            var i;
            i = this.parent.children.indexOf(this);
            return this.parent.children[i + 1] || null;
          }, "get")
        });
        Object.defineProperty(XMLNode2.prototype, "ownerDocument", {
          get: /* @__PURE__ */ __name(function() {
            return this.document() || null;
          }, "get")
        });
        Object.defineProperty(XMLNode2.prototype, "textContent", {
          get: /* @__PURE__ */ __name(function() {
            var child, j, len, ref2, str;
            if (this.nodeType === NodeType.Element || this.nodeType === NodeType.DocumentFragment) {
              str = "";
              ref2 = this.children;
              for (j = 0, len = ref2.length; j < len; j++) {
                child = ref2[j];
                if (child.textContent) {
                  str += child.textContent;
                }
              }
              return str;
            } else {
              return null;
            }
          }, "get"),
          set: /* @__PURE__ */ __name(function(value) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }, "set")
        });
        XMLNode2.prototype.setParent = function(parent) {
          var child, j, len, ref2, results;
          this.parent = parent;
          if (parent) {
            this.options = parent.options;
            this.stringify = parent.stringify;
          }
          ref2 = this.children;
          results = [];
          for (j = 0, len = ref2.length; j < len; j++) {
            child = ref2[j];
            results.push(child.setParent(this));
          }
          return results;
        };
        XMLNode2.prototype.element = function(name, attributes, text) {
          var childNode, item, j, k, key, lastChild, len, len1, ref2, ref3, val;
          lastChild = null;
          if (attributes === null && text == null) {
            ref2 = [{}, null], attributes = ref2[0], text = ref2[1];
          }
          if (attributes == null) {
            attributes = {};
          }
          attributes = getValue(attributes);
          if (!isObject(attributes)) {
            ref3 = [attributes, text], text = ref3[0], attributes = ref3[1];
          }
          if (name != null) {
            name = getValue(name);
          }
          if (Array.isArray(name)) {
            for (j = 0, len = name.length; j < len; j++) {
              item = name[j];
              lastChild = this.element(item);
            }
          } else if (isFunction(name)) {
            lastChild = this.element(name.apply());
          } else if (isObject(name)) {
            for (key in name) {
              if (!hasProp.call(name, key)) continue;
              val = name[key];
              if (isFunction(val)) {
                val = val.apply();
              }
              if (!this.options.ignoreDecorators && this.stringify.convertAttKey && key.indexOf(this.stringify.convertAttKey) === 0) {
                lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
              } else if (!this.options.separateArrayItems && Array.isArray(val) && isEmpty(val)) {
                lastChild = this.dummy();
              } else if (isObject(val) && isEmpty(val)) {
                lastChild = this.element(key);
              } else if (!this.options.keepNullNodes && val == null) {
                lastChild = this.dummy();
              } else if (!this.options.separateArrayItems && Array.isArray(val)) {
                for (k = 0, len1 = val.length; k < len1; k++) {
                  item = val[k];
                  childNode = {};
                  childNode[key] = item;
                  lastChild = this.element(childNode);
                }
              } else if (isObject(val)) {
                if (!this.options.ignoreDecorators && this.stringify.convertTextKey && key.indexOf(this.stringify.convertTextKey) === 0) {
                  lastChild = this.element(val);
                } else {
                  lastChild = this.element(key);
                  lastChild.element(val);
                }
              } else {
                lastChild = this.element(key, val);
              }
            }
          } else if (!this.options.keepNullNodes && text === null) {
            lastChild = this.dummy();
          } else {
            if (!this.options.ignoreDecorators && this.stringify.convertTextKey && name.indexOf(this.stringify.convertTextKey) === 0) {
              lastChild = this.text(text);
            } else if (!this.options.ignoreDecorators && this.stringify.convertCDataKey && name.indexOf(this.stringify.convertCDataKey) === 0) {
              lastChild = this.cdata(text);
            } else if (!this.options.ignoreDecorators && this.stringify.convertCommentKey && name.indexOf(this.stringify.convertCommentKey) === 0) {
              lastChild = this.comment(text);
            } else if (!this.options.ignoreDecorators && this.stringify.convertRawKey && name.indexOf(this.stringify.convertRawKey) === 0) {
              lastChild = this.raw(text);
            } else if (!this.options.ignoreDecorators && this.stringify.convertPIKey && name.indexOf(this.stringify.convertPIKey) === 0) {
              lastChild = this.instruction(name.substr(this.stringify.convertPIKey.length), text);
            } else {
              lastChild = this.node(name, attributes, text);
            }
          }
          if (lastChild == null) {
            throw new Error("Could not create any elements with: " + name + ". " + this.debugInfo());
          }
          return lastChild;
        };
        XMLNode2.prototype.insertBefore = function(name, attributes, text) {
          var child, i, newChild, refChild, removed;
          if (name != null ? name.type : void 0) {
            newChild = name;
            refChild = attributes;
            newChild.setParent(this);
            if (refChild) {
              i = children.indexOf(refChild);
              removed = children.splice(i);
              children.push(newChild);
              Array.prototype.push.apply(children, removed);
            } else {
              children.push(newChild);
            }
            return newChild;
          } else {
            if (this.isRoot) {
              throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
            }
            i = this.parent.children.indexOf(this);
            removed = this.parent.children.splice(i);
            child = this.parent.element(name, attributes, text);
            Array.prototype.push.apply(this.parent.children, removed);
            return child;
          }
        };
        XMLNode2.prototype.insertAfter = function(name, attributes, text) {
          var child, i, removed;
          if (this.isRoot) {
            throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
          }
          i = this.parent.children.indexOf(this);
          removed = this.parent.children.splice(i + 1);
          child = this.parent.element(name, attributes, text);
          Array.prototype.push.apply(this.parent.children, removed);
          return child;
        };
        XMLNode2.prototype.remove = function() {
          var i, ref2;
          if (this.isRoot) {
            throw new Error("Cannot remove the root element. " + this.debugInfo());
          }
          i = this.parent.children.indexOf(this);
          [].splice.apply(this.parent.children, [i, i - i + 1].concat(ref2 = [])), ref2;
          return this.parent;
        };
        XMLNode2.prototype.node = function(name, attributes, text) {
          var child, ref2;
          if (name != null) {
            name = getValue(name);
          }
          attributes || (attributes = {});
          attributes = getValue(attributes);
          if (!isObject(attributes)) {
            ref2 = [attributes, text], text = ref2[0], attributes = ref2[1];
          }
          child = new XMLElement(this, name, attributes);
          if (text != null) {
            child.text(text);
          }
          this.children.push(child);
          return child;
        };
        XMLNode2.prototype.text = function(value) {
          var child;
          if (isObject(value)) {
            this.element(value);
          }
          child = new XMLText(this, value);
          this.children.push(child);
          return this;
        };
        XMLNode2.prototype.cdata = function(value) {
          var child;
          child = new XMLCData(this, value);
          this.children.push(child);
          return this;
        };
        XMLNode2.prototype.comment = function(value) {
          var child;
          child = new XMLComment(this, value);
          this.children.push(child);
          return this;
        };
        XMLNode2.prototype.commentBefore = function(value) {
          var child, i, removed;
          i = this.parent.children.indexOf(this);
          removed = this.parent.children.splice(i);
          child = this.parent.comment(value);
          Array.prototype.push.apply(this.parent.children, removed);
          return this;
        };
        XMLNode2.prototype.commentAfter = function(value) {
          var child, i, removed;
          i = this.parent.children.indexOf(this);
          removed = this.parent.children.splice(i + 1);
          child = this.parent.comment(value);
          Array.prototype.push.apply(this.parent.children, removed);
          return this;
        };
        XMLNode2.prototype.raw = function(value) {
          var child;
          child = new XMLRaw(this, value);
          this.children.push(child);
          return this;
        };
        XMLNode2.prototype.dummy = function() {
          var child;
          child = new XMLDummy(this);
          return child;
        };
        XMLNode2.prototype.instruction = function(target, value) {
          var insTarget, insValue, instruction, j, len;
          if (target != null) {
            target = getValue(target);
          }
          if (value != null) {
            value = getValue(value);
          }
          if (Array.isArray(target)) {
            for (j = 0, len = target.length; j < len; j++) {
              insTarget = target[j];
              this.instruction(insTarget);
            }
          } else if (isObject(target)) {
            for (insTarget in target) {
              if (!hasProp.call(target, insTarget)) continue;
              insValue = target[insTarget];
              this.instruction(insTarget, insValue);
            }
          } else {
            if (isFunction(value)) {
              value = value.apply();
            }
            instruction = new XMLProcessingInstruction(this, target, value);
            this.children.push(instruction);
          }
          return this;
        };
        XMLNode2.prototype.instructionBefore = function(target, value) {
          var child, i, removed;
          i = this.parent.children.indexOf(this);
          removed = this.parent.children.splice(i);
          child = this.parent.instruction(target, value);
          Array.prototype.push.apply(this.parent.children, removed);
          return this;
        };
        XMLNode2.prototype.instructionAfter = function(target, value) {
          var child, i, removed;
          i = this.parent.children.indexOf(this);
          removed = this.parent.children.splice(i + 1);
          child = this.parent.instruction(target, value);
          Array.prototype.push.apply(this.parent.children, removed);
          return this;
        };
        XMLNode2.prototype.declaration = function(version, encoding, standalone) {
          var doc, xmldec;
          doc = this.document();
          xmldec = new XMLDeclaration(doc, version, encoding, standalone);
          if (doc.children.length === 0) {
            doc.children.unshift(xmldec);
          } else if (doc.children[0].type === NodeType.Declaration) {
            doc.children[0] = xmldec;
          } else {
            doc.children.unshift(xmldec);
          }
          return doc.root() || doc;
        };
        XMLNode2.prototype.dtd = function(pubID, sysID) {
          var child, doc, doctype, i, j, k, len, len1, ref2, ref3;
          doc = this.document();
          doctype = new XMLDocType(doc, pubID, sysID);
          ref2 = doc.children;
          for (i = j = 0, len = ref2.length; j < len; i = ++j) {
            child = ref2[i];
            if (child.type === NodeType.DocType) {
              doc.children[i] = doctype;
              return doctype;
            }
          }
          ref3 = doc.children;
          for (i = k = 0, len1 = ref3.length; k < len1; i = ++k) {
            child = ref3[i];
            if (child.isRoot) {
              doc.children.splice(i, 0, doctype);
              return doctype;
            }
          }
          doc.children.push(doctype);
          return doctype;
        };
        XMLNode2.prototype.up = function() {
          if (this.isRoot) {
            throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
          }
          return this.parent;
        };
        XMLNode2.prototype.root = function() {
          var node;
          node = this;
          while (node) {
            if (node.type === NodeType.Document) {
              return node.rootObject;
            } else if (node.isRoot) {
              return node;
            } else {
              node = node.parent;
            }
          }
        };
        XMLNode2.prototype.document = function() {
          var node;
          node = this;
          while (node) {
            if (node.type === NodeType.Document) {
              return node;
            } else {
              node = node.parent;
            }
          }
        };
        XMLNode2.prototype.end = function(options) {
          return this.document().end(options);
        };
        XMLNode2.prototype.prev = function() {
          var i;
          i = this.parent.children.indexOf(this);
          if (i < 1) {
            throw new Error("Already at the first node. " + this.debugInfo());
          }
          return this.parent.children[i - 1];
        };
        XMLNode2.prototype.next = function() {
          var i;
          i = this.parent.children.indexOf(this);
          if (i === -1 || i === this.parent.children.length - 1) {
            throw new Error("Already at the last node. " + this.debugInfo());
          }
          return this.parent.children[i + 1];
        };
        XMLNode2.prototype.importDocument = function(doc) {
          var clonedRoot;
          clonedRoot = doc.root().clone();
          clonedRoot.parent = this;
          clonedRoot.isRoot = false;
          this.children.push(clonedRoot);
          return this;
        };
        XMLNode2.prototype.debugInfo = function(name) {
          var ref2, ref3;
          name = name || this.name;
          if (name == null && !((ref2 = this.parent) != null ? ref2.name : void 0)) {
            return "";
          } else if (name == null) {
            return "parent: <" + this.parent.name + ">";
          } else if (!((ref3 = this.parent) != null ? ref3.name : void 0)) {
            return "node: <" + name + ">";
          } else {
            return "node: <" + name + ">, parent: <" + this.parent.name + ">";
          }
        };
        XMLNode2.prototype.ele = function(name, attributes, text) {
          return this.element(name, attributes, text);
        };
        XMLNode2.prototype.nod = function(name, attributes, text) {
          return this.node(name, attributes, text);
        };
        XMLNode2.prototype.txt = function(value) {
          return this.text(value);
        };
        XMLNode2.prototype.dat = function(value) {
          return this.cdata(value);
        };
        XMLNode2.prototype.com = function(value) {
          return this.comment(value);
        };
        XMLNode2.prototype.ins = function(target, value) {
          return this.instruction(target, value);
        };
        XMLNode2.prototype.doc = function() {
          return this.document();
        };
        XMLNode2.prototype.dec = function(version, encoding, standalone) {
          return this.declaration(version, encoding, standalone);
        };
        XMLNode2.prototype.e = function(name, attributes, text) {
          return this.element(name, attributes, text);
        };
        XMLNode2.prototype.n = function(name, attributes, text) {
          return this.node(name, attributes, text);
        };
        XMLNode2.prototype.t = function(value) {
          return this.text(value);
        };
        XMLNode2.prototype.d = function(value) {
          return this.cdata(value);
        };
        XMLNode2.prototype.c = function(value) {
          return this.comment(value);
        };
        XMLNode2.prototype.r = function(value) {
          return this.raw(value);
        };
        XMLNode2.prototype.i = function(target, value) {
          return this.instruction(target, value);
        };
        XMLNode2.prototype.u = function() {
          return this.up();
        };
        XMLNode2.prototype.importXMLBuilder = function(doc) {
          return this.importDocument(doc);
        };
        XMLNode2.prototype.replaceChild = function(newChild, oldChild) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.removeChild = function(oldChild) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.appendChild = function(newChild) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.hasChildNodes = function() {
          return this.children.length !== 0;
        };
        XMLNode2.prototype.cloneNode = function(deep) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.normalize = function() {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.isSupported = function(feature, version) {
          return true;
        };
        XMLNode2.prototype.hasAttributes = function() {
          return this.attribs.length !== 0;
        };
        XMLNode2.prototype.compareDocumentPosition = function(other) {
          var ref, res;
          ref = this;
          if (ref === other) {
            return 0;
          } else if (this.document() !== other.document()) {
            res = DocumentPosition.Disconnected | DocumentPosition.ImplementationSpecific;
            if (Math.random() < 0.5) {
              res |= DocumentPosition.Preceding;
            } else {
              res |= DocumentPosition.Following;
            }
            return res;
          } else if (ref.isAncestor(other)) {
            return DocumentPosition.Contains | DocumentPosition.Preceding;
          } else if (ref.isDescendant(other)) {
            return DocumentPosition.Contains | DocumentPosition.Following;
          } else if (ref.isPreceding(other)) {
            return DocumentPosition.Preceding;
          } else {
            return DocumentPosition.Following;
          }
        };
        XMLNode2.prototype.isSameNode = function(other) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.lookupPrefix = function(namespaceURI) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.isDefaultNamespace = function(namespaceURI) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.lookupNamespaceURI = function(prefix) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.isEqualNode = function(node) {
          var i, j, ref2;
          if (node.nodeType !== this.nodeType) {
            return false;
          }
          if (node.children.length !== this.children.length) {
            return false;
          }
          for (i = j = 0, ref2 = this.children.length - 1; 0 <= ref2 ? j <= ref2 : j >= ref2; i = 0 <= ref2 ? ++j : --j) {
            if (!this.children[i].isEqualNode(node.children[i])) {
              return false;
            }
          }
          return true;
        };
        XMLNode2.prototype.getFeature = function(feature, version) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.setUserData = function(key, data, handler) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.getUserData = function(key) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLNode2.prototype.contains = function(other) {
          if (!other) {
            return false;
          }
          return other === this || this.isDescendant(other);
        };
        XMLNode2.prototype.isDescendant = function(node) {
          var child, isDescendantChild, j, len, ref2;
          ref2 = this.children;
          for (j = 0, len = ref2.length; j < len; j++) {
            child = ref2[j];
            if (node === child) {
              return true;
            }
            isDescendantChild = child.isDescendant(node);
            if (isDescendantChild) {
              return true;
            }
          }
          return false;
        };
        XMLNode2.prototype.isAncestor = function(node) {
          return node.isDescendant(this);
        };
        XMLNode2.prototype.isPreceding = function(node) {
          var nodePos, thisPos;
          nodePos = this.treePosition(node);
          thisPos = this.treePosition(this);
          if (nodePos === -1 || thisPos === -1) {
            return false;
          } else {
            return nodePos < thisPos;
          }
        };
        XMLNode2.prototype.isFollowing = function(node) {
          var nodePos, thisPos;
          nodePos = this.treePosition(node);
          thisPos = this.treePosition(this);
          if (nodePos === -1 || thisPos === -1) {
            return false;
          } else {
            return nodePos > thisPos;
          }
        };
        XMLNode2.prototype.treePosition = function(node) {
          var found, pos;
          pos = 0;
          found = false;
          this.foreachTreeNode(this.document(), function(childNode) {
            pos++;
            if (!found && childNode === node) {
              return found = true;
            }
          });
          if (found) {
            return pos;
          } else {
            return -1;
          }
        };
        XMLNode2.prototype.foreachTreeNode = function(node, func) {
          var child, j, len, ref2, res;
          node || (node = this.document());
          ref2 = node.children;
          for (j = 0, len = ref2.length; j < len; j++) {
            child = ref2[j];
            if (res = func(child)) {
              return res;
            } else {
              res = this.foreachTreeNode(child, func);
              if (res) {
                return res;
              }
            }
          }
        };
        return XMLNode2;
      })();
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLStringifier.js
var require_XMLStringifier = __commonJS({
  "node_modules/xmlbuilder/lib/XMLStringifier.js"(exports2, module2) {
    (function() {
      var XMLStringifier, bind = /* @__PURE__ */ __name(function(fn, me) {
        return function() {
          return fn.apply(me, arguments);
        };
      }, "bind"), hasProp = {}.hasOwnProperty;
      module2.exports = XMLStringifier = (function() {
        function XMLStringifier2(options) {
          this.assertLegalName = bind(this.assertLegalName, this);
          this.assertLegalChar = bind(this.assertLegalChar, this);
          var key, ref, value;
          options || (options = {});
          this.options = options;
          if (!this.options.version) {
            this.options.version = "1.0";
          }
          ref = options.stringify || {};
          for (key in ref) {
            if (!hasProp.call(ref, key)) continue;
            value = ref[key];
            this[key] = value;
          }
        }
        __name(XMLStringifier2, "XMLStringifier");
        XMLStringifier2.prototype.name = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return this.assertLegalName("" + val || "");
        };
        XMLStringifier2.prototype.text = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return this.assertLegalChar(this.textEscape("" + val || ""));
        };
        XMLStringifier2.prototype.cdata = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          val = "" + val || "";
          val = val.replace("]]>", "]]]]><![CDATA[>");
          return this.assertLegalChar(val);
        };
        XMLStringifier2.prototype.comment = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          val = "" + val || "";
          if (val.match(/--/)) {
            throw new Error("Comment text cannot contain double-hypen: " + val);
          }
          return this.assertLegalChar(val);
        };
        XMLStringifier2.prototype.raw = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return "" + val || "";
        };
        XMLStringifier2.prototype.attValue = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return this.assertLegalChar(this.attEscape(val = "" + val || ""));
        };
        XMLStringifier2.prototype.insTarget = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return this.assertLegalChar("" + val || "");
        };
        XMLStringifier2.prototype.insValue = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          val = "" + val || "";
          if (val.match(/\?>/)) {
            throw new Error("Invalid processing instruction value: " + val);
          }
          return this.assertLegalChar(val);
        };
        XMLStringifier2.prototype.xmlVersion = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          val = "" + val || "";
          if (!val.match(/1\.[0-9]+/)) {
            throw new Error("Invalid version number: " + val);
          }
          return val;
        };
        XMLStringifier2.prototype.xmlEncoding = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          val = "" + val || "";
          if (!val.match(/^[A-Za-z](?:[A-Za-z0-9._-])*$/)) {
            throw new Error("Invalid encoding: " + val);
          }
          return this.assertLegalChar(val);
        };
        XMLStringifier2.prototype.xmlStandalone = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          if (val) {
            return "yes";
          } else {
            return "no";
          }
        };
        XMLStringifier2.prototype.dtdPubID = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return this.assertLegalChar("" + val || "");
        };
        XMLStringifier2.prototype.dtdSysID = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return this.assertLegalChar("" + val || "");
        };
        XMLStringifier2.prototype.dtdElementValue = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return this.assertLegalChar("" + val || "");
        };
        XMLStringifier2.prototype.dtdAttType = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return this.assertLegalChar("" + val || "");
        };
        XMLStringifier2.prototype.dtdAttDefault = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return this.assertLegalChar("" + val || "");
        };
        XMLStringifier2.prototype.dtdEntityValue = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return this.assertLegalChar("" + val || "");
        };
        XMLStringifier2.prototype.dtdNData = function(val) {
          if (this.options.noValidation) {
            return val;
          }
          return this.assertLegalChar("" + val || "");
        };
        XMLStringifier2.prototype.convertAttKey = "@";
        XMLStringifier2.prototype.convertPIKey = "?";
        XMLStringifier2.prototype.convertTextKey = "#text";
        XMLStringifier2.prototype.convertCDataKey = "#cdata";
        XMLStringifier2.prototype.convertCommentKey = "#comment";
        XMLStringifier2.prototype.convertRawKey = "#raw";
        XMLStringifier2.prototype.assertLegalChar = function(str) {
          var regex, res;
          if (this.options.noValidation) {
            return str;
          }
          regex = "";
          if (this.options.version === "1.0") {
            regex = /[\0-\x08\x0B\f\x0E-\x1F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
            if (res = str.match(regex)) {
              throw new Error("Invalid character in string: " + str + " at index " + res.index);
            }
          } else if (this.options.version === "1.1") {
            regex = /[\0\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
            if (res = str.match(regex)) {
              throw new Error("Invalid character in string: " + str + " at index " + res.index);
            }
          }
          return str;
        };
        XMLStringifier2.prototype.assertLegalName = function(str) {
          var regex;
          if (this.options.noValidation) {
            return str;
          }
          this.assertLegalChar(str);
          regex = /^([:A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])([\x2D\.0-:A-Z_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;
          if (!str.match(regex)) {
            throw new Error("Invalid character in name");
          }
          return str;
        };
        XMLStringifier2.prototype.textEscape = function(str) {
          var ampregex;
          if (this.options.noValidation) {
            return str;
          }
          ampregex = this.options.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
          return str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#xD;");
        };
        XMLStringifier2.prototype.attEscape = function(str) {
          var ampregex;
          if (this.options.noValidation) {
            return str;
          }
          ampregex = this.options.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
          return str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/\t/g, "&#x9;").replace(/\n/g, "&#xA;").replace(/\r/g, "&#xD;");
        };
        return XMLStringifier2;
      })();
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/WriterState.js
var require_WriterState = __commonJS({
  "node_modules/xmlbuilder/lib/WriterState.js"(exports2, module2) {
    (function() {
      module2.exports = {
        None: 0,
        OpenTag: 1,
        InsideTag: 2,
        CloseTag: 3
      };
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLWriterBase.js
var require_XMLWriterBase = __commonJS({
  "node_modules/xmlbuilder/lib/XMLWriterBase.js"(exports2, module2) {
    (function() {
      var NodeType, WriterState, XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDummy, XMLElement, XMLProcessingInstruction, XMLRaw, XMLText, XMLWriterBase, assign, hasProp = {}.hasOwnProperty;
      assign = require_Utility().assign;
      NodeType = require_NodeType();
      XMLDeclaration = require_XMLDeclaration();
      XMLDocType = require_XMLDocType();
      XMLCData = require_XMLCData();
      XMLComment = require_XMLComment();
      XMLElement = require_XMLElement();
      XMLRaw = require_XMLRaw();
      XMLText = require_XMLText();
      XMLProcessingInstruction = require_XMLProcessingInstruction();
      XMLDummy = require_XMLDummy();
      XMLDTDAttList = require_XMLDTDAttList();
      XMLDTDElement = require_XMLDTDElement();
      XMLDTDEntity = require_XMLDTDEntity();
      XMLDTDNotation = require_XMLDTDNotation();
      WriterState = require_WriterState();
      module2.exports = XMLWriterBase = (function() {
        function XMLWriterBase2(options) {
          var key, ref, value;
          options || (options = {});
          this.options = options;
          ref = options.writer || {};
          for (key in ref) {
            if (!hasProp.call(ref, key)) continue;
            value = ref[key];
            this["_" + key] = this[key];
            this[key] = value;
          }
        }
        __name(XMLWriterBase2, "XMLWriterBase");
        XMLWriterBase2.prototype.filterOptions = function(options) {
          var filteredOptions, ref, ref1, ref2, ref3, ref4, ref5, ref6;
          options || (options = {});
          options = assign({}, this.options, options);
          filteredOptions = {
            writer: this
          };
          filteredOptions.pretty = options.pretty || false;
          filteredOptions.allowEmpty = options.allowEmpty || false;
          filteredOptions.indent = (ref = options.indent) != null ? ref : "  ";
          filteredOptions.newline = (ref1 = options.newline) != null ? ref1 : "\n";
          filteredOptions.offset = (ref2 = options.offset) != null ? ref2 : 0;
          filteredOptions.dontPrettyTextNodes = (ref3 = (ref4 = options.dontPrettyTextNodes) != null ? ref4 : options.dontprettytextnodes) != null ? ref3 : 0;
          filteredOptions.spaceBeforeSlash = (ref5 = (ref6 = options.spaceBeforeSlash) != null ? ref6 : options.spacebeforeslash) != null ? ref5 : "";
          if (filteredOptions.spaceBeforeSlash === true) {
            filteredOptions.spaceBeforeSlash = " ";
          }
          filteredOptions.suppressPrettyCount = 0;
          filteredOptions.user = {};
          filteredOptions.state = WriterState.None;
          return filteredOptions;
        };
        XMLWriterBase2.prototype.indent = function(node, options, level) {
          var indentLevel;
          if (!options.pretty || options.suppressPrettyCount) {
            return "";
          } else if (options.pretty) {
            indentLevel = (level || 0) + options.offset + 1;
            if (indentLevel > 0) {
              return new Array(indentLevel).join(options.indent);
            }
          }
          return "";
        };
        XMLWriterBase2.prototype.endline = function(node, options, level) {
          if (!options.pretty || options.suppressPrettyCount) {
            return "";
          } else {
            return options.newline;
          }
        };
        XMLWriterBase2.prototype.attribute = function(att, options, level) {
          var r;
          this.openAttribute(att, options, level);
          r = " " + att.name + '="' + att.value + '"';
          this.closeAttribute(att, options, level);
          return r;
        };
        XMLWriterBase2.prototype.cdata = function(node, options, level) {
          var r;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r = this.indent(node, options, level) + "<![CDATA[";
          options.state = WriterState.InsideTag;
          r += node.value;
          options.state = WriterState.CloseTag;
          r += "]]>" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.comment = function(node, options, level) {
          var r;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r = this.indent(node, options, level) + "<!-- ";
          options.state = WriterState.InsideTag;
          r += node.value;
          options.state = WriterState.CloseTag;
          r += " -->" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.declaration = function(node, options, level) {
          var r;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r = this.indent(node, options, level) + "<?xml";
          options.state = WriterState.InsideTag;
          r += ' version="' + node.version + '"';
          if (node.encoding != null) {
            r += ' encoding="' + node.encoding + '"';
          }
          if (node.standalone != null) {
            r += ' standalone="' + node.standalone + '"';
          }
          options.state = WriterState.CloseTag;
          r += options.spaceBeforeSlash + "?>";
          r += this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.docType = function(node, options, level) {
          var child, i, len, r, ref;
          level || (level = 0);
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r = this.indent(node, options, level);
          r += "<!DOCTYPE " + node.root().name;
          if (node.pubID && node.sysID) {
            r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
          } else if (node.sysID) {
            r += ' SYSTEM "' + node.sysID + '"';
          }
          if (node.children.length > 0) {
            r += " [";
            r += this.endline(node, options, level);
            options.state = WriterState.InsideTag;
            ref = node.children;
            for (i = 0, len = ref.length; i < len; i++) {
              child = ref[i];
              r += this.writeChildNode(child, options, level + 1);
            }
            options.state = WriterState.CloseTag;
            r += "]";
          }
          options.state = WriterState.CloseTag;
          r += options.spaceBeforeSlash + ">";
          r += this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.element = function(node, options, level) {
          var att, child, childNodeCount, firstChildNode, i, j, len, len1, name, prettySuppressed, r, ref, ref1, ref2;
          level || (level = 0);
          prettySuppressed = false;
          r = "";
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r += this.indent(node, options, level) + "<" + node.name;
          ref = node.attribs;
          for (name in ref) {
            if (!hasProp.call(ref, name)) continue;
            att = ref[name];
            r += this.attribute(att, options, level);
          }
          childNodeCount = node.children.length;
          firstChildNode = childNodeCount === 0 ? null : node.children[0];
          if (childNodeCount === 0 || node.children.every(function(e) {
            return (e.type === NodeType.Text || e.type === NodeType.Raw) && e.value === "";
          })) {
            if (options.allowEmpty) {
              r += ">";
              options.state = WriterState.CloseTag;
              r += "</" + node.name + ">" + this.endline(node, options, level);
            } else {
              options.state = WriterState.CloseTag;
              r += options.spaceBeforeSlash + "/>" + this.endline(node, options, level);
            }
          } else if (options.pretty && childNodeCount === 1 && (firstChildNode.type === NodeType.Text || firstChildNode.type === NodeType.Raw) && firstChildNode.value != null) {
            r += ">";
            options.state = WriterState.InsideTag;
            options.suppressPrettyCount++;
            prettySuppressed = true;
            r += this.writeChildNode(firstChildNode, options, level + 1);
            options.suppressPrettyCount--;
            prettySuppressed = false;
            options.state = WriterState.CloseTag;
            r += "</" + node.name + ">" + this.endline(node, options, level);
          } else {
            if (options.dontPrettyTextNodes) {
              ref1 = node.children;
              for (i = 0, len = ref1.length; i < len; i++) {
                child = ref1[i];
                if ((child.type === NodeType.Text || child.type === NodeType.Raw) && child.value != null) {
                  options.suppressPrettyCount++;
                  prettySuppressed = true;
                  break;
                }
              }
            }
            r += ">" + this.endline(node, options, level);
            options.state = WriterState.InsideTag;
            ref2 = node.children;
            for (j = 0, len1 = ref2.length; j < len1; j++) {
              child = ref2[j];
              r += this.writeChildNode(child, options, level + 1);
            }
            options.state = WriterState.CloseTag;
            r += this.indent(node, options, level) + "</" + node.name + ">";
            if (prettySuppressed) {
              options.suppressPrettyCount--;
            }
            r += this.endline(node, options, level);
            options.state = WriterState.None;
          }
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.writeChildNode = function(node, options, level) {
          switch (node.type) {
            case NodeType.CData:
              return this.cdata(node, options, level);
            case NodeType.Comment:
              return this.comment(node, options, level);
            case NodeType.Element:
              return this.element(node, options, level);
            case NodeType.Raw:
              return this.raw(node, options, level);
            case NodeType.Text:
              return this.text(node, options, level);
            case NodeType.ProcessingInstruction:
              return this.processingInstruction(node, options, level);
            case NodeType.Dummy:
              return "";
            case NodeType.Declaration:
              return this.declaration(node, options, level);
            case NodeType.DocType:
              return this.docType(node, options, level);
            case NodeType.AttributeDeclaration:
              return this.dtdAttList(node, options, level);
            case NodeType.ElementDeclaration:
              return this.dtdElement(node, options, level);
            case NodeType.EntityDeclaration:
              return this.dtdEntity(node, options, level);
            case NodeType.NotationDeclaration:
              return this.dtdNotation(node, options, level);
            default:
              throw new Error("Unknown XML node type: " + node.constructor.name);
          }
        };
        XMLWriterBase2.prototype.processingInstruction = function(node, options, level) {
          var r;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r = this.indent(node, options, level) + "<?";
          options.state = WriterState.InsideTag;
          r += node.target;
          if (node.value) {
            r += " " + node.value;
          }
          options.state = WriterState.CloseTag;
          r += options.spaceBeforeSlash + "?>";
          r += this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.raw = function(node, options, level) {
          var r;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r = this.indent(node, options, level);
          options.state = WriterState.InsideTag;
          r += node.value;
          options.state = WriterState.CloseTag;
          r += this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.text = function(node, options, level) {
          var r;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r = this.indent(node, options, level);
          options.state = WriterState.InsideTag;
          r += node.value;
          options.state = WriterState.CloseTag;
          r += this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.dtdAttList = function(node, options, level) {
          var r;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r = this.indent(node, options, level) + "<!ATTLIST";
          options.state = WriterState.InsideTag;
          r += " " + node.elementName + " " + node.attributeName + " " + node.attributeType;
          if (node.defaultValueType !== "#DEFAULT") {
            r += " " + node.defaultValueType;
          }
          if (node.defaultValue) {
            r += ' "' + node.defaultValue + '"';
          }
          options.state = WriterState.CloseTag;
          r += options.spaceBeforeSlash + ">" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.dtdElement = function(node, options, level) {
          var r;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r = this.indent(node, options, level) + "<!ELEMENT";
          options.state = WriterState.InsideTag;
          r += " " + node.name + " " + node.value;
          options.state = WriterState.CloseTag;
          r += options.spaceBeforeSlash + ">" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.dtdEntity = function(node, options, level) {
          var r;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r = this.indent(node, options, level) + "<!ENTITY";
          options.state = WriterState.InsideTag;
          if (node.pe) {
            r += " %";
          }
          r += " " + node.name;
          if (node.value) {
            r += ' "' + node.value + '"';
          } else {
            if (node.pubID && node.sysID) {
              r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
            } else if (node.sysID) {
              r += ' SYSTEM "' + node.sysID + '"';
            }
            if (node.nData) {
              r += " NDATA " + node.nData;
            }
          }
          options.state = WriterState.CloseTag;
          r += options.spaceBeforeSlash + ">" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.dtdNotation = function(node, options, level) {
          var r;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r = this.indent(node, options, level) + "<!NOTATION";
          options.state = WriterState.InsideTag;
          r += " " + node.name;
          if (node.pubID && node.sysID) {
            r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
          } else if (node.pubID) {
            r += ' PUBLIC "' + node.pubID + '"';
          } else if (node.sysID) {
            r += ' SYSTEM "' + node.sysID + '"';
          }
          options.state = WriterState.CloseTag;
          r += options.spaceBeforeSlash + ">" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r;
        };
        XMLWriterBase2.prototype.openNode = function(node, options, level) {
        };
        XMLWriterBase2.prototype.closeNode = function(node, options, level) {
        };
        XMLWriterBase2.prototype.openAttribute = function(att, options, level) {
        };
        XMLWriterBase2.prototype.closeAttribute = function(att, options, level) {
        };
        return XMLWriterBase2;
      })();
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLStringWriter.js
var require_XMLStringWriter = __commonJS({
  "node_modules/xmlbuilder/lib/XMLStringWriter.js"(exports2, module2) {
    (function() {
      var XMLStringWriter, XMLWriterBase, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      XMLWriterBase = require_XMLWriterBase();
      module2.exports = XMLStringWriter = (function(superClass) {
        extend(XMLStringWriter2, superClass);
        function XMLStringWriter2(options) {
          XMLStringWriter2.__super__.constructor.call(this, options);
        }
        __name(XMLStringWriter2, "XMLStringWriter");
        XMLStringWriter2.prototype.document = function(doc, options) {
          var child, i, len, r, ref;
          options = this.filterOptions(options);
          r = "";
          ref = doc.children;
          for (i = 0, len = ref.length; i < len; i++) {
            child = ref[i];
            r += this.writeChildNode(child, options, 0);
          }
          if (options.pretty && r.slice(-options.newline.length) === options.newline) {
            r = r.slice(0, -options.newline.length);
          }
          return r;
        };
        return XMLStringWriter2;
      })(XMLWriterBase);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDocument.js
var require_XMLDocument = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDocument.js"(exports2, module2) {
    (function() {
      var NodeType, XMLDOMConfiguration, XMLDOMImplementation, XMLDocument, XMLNode, XMLStringWriter, XMLStringifier, isPlainObject, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      isPlainObject = require_Utility().isPlainObject;
      XMLDOMImplementation = require_XMLDOMImplementation();
      XMLDOMConfiguration = require_XMLDOMConfiguration();
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      XMLStringifier = require_XMLStringifier();
      XMLStringWriter = require_XMLStringWriter();
      module2.exports = XMLDocument = (function(superClass) {
        extend(XMLDocument2, superClass);
        function XMLDocument2(options) {
          XMLDocument2.__super__.constructor.call(this, null);
          this.name = "#document";
          this.type = NodeType.Document;
          this.documentURI = null;
          this.domConfig = new XMLDOMConfiguration();
          options || (options = {});
          if (!options.writer) {
            options.writer = new XMLStringWriter();
          }
          this.options = options;
          this.stringify = new XMLStringifier(options);
        }
        __name(XMLDocument2, "XMLDocument");
        Object.defineProperty(XMLDocument2.prototype, "implementation", {
          value: new XMLDOMImplementation()
        });
        Object.defineProperty(XMLDocument2.prototype, "doctype", {
          get: /* @__PURE__ */ __name(function() {
            var child, i, len, ref;
            ref = this.children;
            for (i = 0, len = ref.length; i < len; i++) {
              child = ref[i];
              if (child.type === NodeType.DocType) {
                return child;
              }
            }
            return null;
          }, "get")
        });
        Object.defineProperty(XMLDocument2.prototype, "documentElement", {
          get: /* @__PURE__ */ __name(function() {
            return this.rootObject || null;
          }, "get")
        });
        Object.defineProperty(XMLDocument2.prototype, "inputEncoding", {
          get: /* @__PURE__ */ __name(function() {
            return null;
          }, "get")
        });
        Object.defineProperty(XMLDocument2.prototype, "strictErrorChecking", {
          get: /* @__PURE__ */ __name(function() {
            return false;
          }, "get")
        });
        Object.defineProperty(XMLDocument2.prototype, "xmlEncoding", {
          get: /* @__PURE__ */ __name(function() {
            if (this.children.length !== 0 && this.children[0].type === NodeType.Declaration) {
              return this.children[0].encoding;
            } else {
              return null;
            }
          }, "get")
        });
        Object.defineProperty(XMLDocument2.prototype, "xmlStandalone", {
          get: /* @__PURE__ */ __name(function() {
            if (this.children.length !== 0 && this.children[0].type === NodeType.Declaration) {
              return this.children[0].standalone === "yes";
            } else {
              return false;
            }
          }, "get")
        });
        Object.defineProperty(XMLDocument2.prototype, "xmlVersion", {
          get: /* @__PURE__ */ __name(function() {
            if (this.children.length !== 0 && this.children[0].type === NodeType.Declaration) {
              return this.children[0].version;
            } else {
              return "1.0";
            }
          }, "get")
        });
        Object.defineProperty(XMLDocument2.prototype, "URL", {
          get: /* @__PURE__ */ __name(function() {
            return this.documentURI;
          }, "get")
        });
        Object.defineProperty(XMLDocument2.prototype, "origin", {
          get: /* @__PURE__ */ __name(function() {
            return null;
          }, "get")
        });
        Object.defineProperty(XMLDocument2.prototype, "compatMode", {
          get: /* @__PURE__ */ __name(function() {
            return null;
          }, "get")
        });
        Object.defineProperty(XMLDocument2.prototype, "characterSet", {
          get: /* @__PURE__ */ __name(function() {
            return null;
          }, "get")
        });
        Object.defineProperty(XMLDocument2.prototype, "contentType", {
          get: /* @__PURE__ */ __name(function() {
            return null;
          }, "get")
        });
        XMLDocument2.prototype.end = function(writer) {
          var writerOptions;
          writerOptions = {};
          if (!writer) {
            writer = this.options.writer;
          } else if (isPlainObject(writer)) {
            writerOptions = writer;
            writer = this.options.writer;
          }
          return writer.document(this, writer.filterOptions(writerOptions));
        };
        XMLDocument2.prototype.toString = function(options) {
          return this.options.writer.document(this, this.options.writer.filterOptions(options));
        };
        XMLDocument2.prototype.createElement = function(tagName) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createDocumentFragment = function() {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createTextNode = function(data) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createComment = function(data) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createCDATASection = function(data) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createProcessingInstruction = function(target, data) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createAttribute = function(name) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createEntityReference = function(name) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.getElementsByTagName = function(tagname) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.importNode = function(importedNode, deep) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createElementNS = function(namespaceURI, qualifiedName) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createAttributeNS = function(namespaceURI, qualifiedName) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.getElementsByTagNameNS = function(namespaceURI, localName) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.getElementById = function(elementId) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.adoptNode = function(source) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.normalizeDocument = function() {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.renameNode = function(node, namespaceURI, qualifiedName) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.getElementsByClassName = function(classNames) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createEvent = function(eventInterface) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createRange = function() {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createNodeIterator = function(root, whatToShow, filter) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        XMLDocument2.prototype.createTreeWalker = function(root, whatToShow, filter) {
          throw new Error("This DOM method is not implemented." + this.debugInfo());
        };
        return XMLDocument2;
      })(XMLNode);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLDocumentCB.js
var require_XMLDocumentCB = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDocumentCB.js"(exports2, module2) {
    (function() {
      var NodeType, WriterState, XMLAttribute, XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDocument, XMLDocumentCB, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStringWriter, XMLStringifier, XMLText, getValue, isFunction, isObject, isPlainObject, ref, hasProp = {}.hasOwnProperty;
      ref = require_Utility(), isObject = ref.isObject, isFunction = ref.isFunction, isPlainObject = ref.isPlainObject, getValue = ref.getValue;
      NodeType = require_NodeType();
      XMLDocument = require_XMLDocument();
      XMLElement = require_XMLElement();
      XMLCData = require_XMLCData();
      XMLComment = require_XMLComment();
      XMLRaw = require_XMLRaw();
      XMLText = require_XMLText();
      XMLProcessingInstruction = require_XMLProcessingInstruction();
      XMLDeclaration = require_XMLDeclaration();
      XMLDocType = require_XMLDocType();
      XMLDTDAttList = require_XMLDTDAttList();
      XMLDTDEntity = require_XMLDTDEntity();
      XMLDTDElement = require_XMLDTDElement();
      XMLDTDNotation = require_XMLDTDNotation();
      XMLAttribute = require_XMLAttribute();
      XMLStringifier = require_XMLStringifier();
      XMLStringWriter = require_XMLStringWriter();
      WriterState = require_WriterState();
      module2.exports = XMLDocumentCB = (function() {
        function XMLDocumentCB2(options, onData, onEnd) {
          var writerOptions;
          this.name = "?xml";
          this.type = NodeType.Document;
          options || (options = {});
          writerOptions = {};
          if (!options.writer) {
            options.writer = new XMLStringWriter();
          } else if (isPlainObject(options.writer)) {
            writerOptions = options.writer;
            options.writer = new XMLStringWriter();
          }
          this.options = options;
          this.writer = options.writer;
          this.writerOptions = this.writer.filterOptions(writerOptions);
          this.stringify = new XMLStringifier(options);
          this.onDataCallback = onData || function() {
          };
          this.onEndCallback = onEnd || function() {
          };
          this.currentNode = null;
          this.currentLevel = -1;
          this.openTags = {};
          this.documentStarted = false;
          this.documentCompleted = false;
          this.root = null;
        }
        __name(XMLDocumentCB2, "XMLDocumentCB");
        XMLDocumentCB2.prototype.createChildNode = function(node) {
          var att, attName, attributes, child, i, len, ref1, ref2;
          switch (node.type) {
            case NodeType.CData:
              this.cdata(node.value);
              break;
            case NodeType.Comment:
              this.comment(node.value);
              break;
            case NodeType.Element:
              attributes = {};
              ref1 = node.attribs;
              for (attName in ref1) {
                if (!hasProp.call(ref1, attName)) continue;
                att = ref1[attName];
                attributes[attName] = att.value;
              }
              this.node(node.name, attributes);
              break;
            case NodeType.Dummy:
              this.dummy();
              break;
            case NodeType.Raw:
              this.raw(node.value);
              break;
            case NodeType.Text:
              this.text(node.value);
              break;
            case NodeType.ProcessingInstruction:
              this.instruction(node.target, node.value);
              break;
            default:
              throw new Error("This XML node type is not supported in a JS object: " + node.constructor.name);
          }
          ref2 = node.children;
          for (i = 0, len = ref2.length; i < len; i++) {
            child = ref2[i];
            this.createChildNode(child);
            if (child.type === NodeType.Element) {
              this.up();
            }
          }
          return this;
        };
        XMLDocumentCB2.prototype.dummy = function() {
          return this;
        };
        XMLDocumentCB2.prototype.node = function(name, attributes, text) {
          var ref1;
          if (name == null) {
            throw new Error("Missing node name.");
          }
          if (this.root && this.currentLevel === -1) {
            throw new Error("Document can only have one root node. " + this.debugInfo(name));
          }
          this.openCurrent();
          name = getValue(name);
          if (attributes == null) {
            attributes = {};
          }
          attributes = getValue(attributes);
          if (!isObject(attributes)) {
            ref1 = [attributes, text], text = ref1[0], attributes = ref1[1];
          }
          this.currentNode = new XMLElement(this, name, attributes);
          this.currentNode.children = false;
          this.currentLevel++;
          this.openTags[this.currentLevel] = this.currentNode;
          if (text != null) {
            this.text(text);
          }
          return this;
        };
        XMLDocumentCB2.prototype.element = function(name, attributes, text) {
          var child, i, len, oldValidationFlag, ref1, root;
          if (this.currentNode && this.currentNode.type === NodeType.DocType) {
            this.dtdElement.apply(this, arguments);
          } else {
            if (Array.isArray(name) || isObject(name) || isFunction(name)) {
              oldValidationFlag = this.options.noValidation;
              this.options.noValidation = true;
              root = new XMLDocument(this.options).element("TEMP_ROOT");
              root.element(name);
              this.options.noValidation = oldValidationFlag;
              ref1 = root.children;
              for (i = 0, len = ref1.length; i < len; i++) {
                child = ref1[i];
                this.createChildNode(child);
                if (child.type === NodeType.Element) {
                  this.up();
                }
              }
            } else {
              this.node(name, attributes, text);
            }
          }
          return this;
        };
        XMLDocumentCB2.prototype.attribute = function(name, value) {
          var attName, attValue;
          if (!this.currentNode || this.currentNode.children) {
            throw new Error("att() can only be used immediately after an ele() call in callback mode. " + this.debugInfo(name));
          }
          if (name != null) {
            name = getValue(name);
          }
          if (isObject(name)) {
            for (attName in name) {
              if (!hasProp.call(name, attName)) continue;
              attValue = name[attName];
              this.attribute(attName, attValue);
            }
          } else {
            if (isFunction(value)) {
              value = value.apply();
            }
            if (this.options.keepNullAttributes && value == null) {
              this.currentNode.attribs[name] = new XMLAttribute(this, name, "");
            } else if (value != null) {
              this.currentNode.attribs[name] = new XMLAttribute(this, name, value);
            }
          }
          return this;
        };
        XMLDocumentCB2.prototype.text = function(value) {
          var node;
          this.openCurrent();
          node = new XMLText(this, value);
          this.onData(this.writer.text(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        };
        XMLDocumentCB2.prototype.cdata = function(value) {
          var node;
          this.openCurrent();
          node = new XMLCData(this, value);
          this.onData(this.writer.cdata(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        };
        XMLDocumentCB2.prototype.comment = function(value) {
          var node;
          this.openCurrent();
          node = new XMLComment(this, value);
          this.onData(this.writer.comment(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        };
        XMLDocumentCB2.prototype.raw = function(value) {
          var node;
          this.openCurrent();
          node = new XMLRaw(this, value);
          this.onData(this.writer.raw(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        };
        XMLDocumentCB2.prototype.instruction = function(target, value) {
          var i, insTarget, insValue, len, node;
          this.openCurrent();
          if (target != null) {
            target = getValue(target);
          }
          if (value != null) {
            value = getValue(value);
          }
          if (Array.isArray(target)) {
            for (i = 0, len = target.length; i < len; i++) {
              insTarget = target[i];
              this.instruction(insTarget);
            }
          } else if (isObject(target)) {
            for (insTarget in target) {
              if (!hasProp.call(target, insTarget)) continue;
              insValue = target[insTarget];
              this.instruction(insTarget, insValue);
            }
          } else {
            if (isFunction(value)) {
              value = value.apply();
            }
            node = new XMLProcessingInstruction(this, target, value);
            this.onData(this.writer.processingInstruction(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          }
          return this;
        };
        XMLDocumentCB2.prototype.declaration = function(version, encoding, standalone) {
          var node;
          this.openCurrent();
          if (this.documentStarted) {
            throw new Error("declaration() must be the first node.");
          }
          node = new XMLDeclaration(this, version, encoding, standalone);
          this.onData(this.writer.declaration(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        };
        XMLDocumentCB2.prototype.doctype = function(root, pubID, sysID) {
          this.openCurrent();
          if (root == null) {
            throw new Error("Missing root node name.");
          }
          if (this.root) {
            throw new Error("dtd() must come before the root node.");
          }
          this.currentNode = new XMLDocType(this, pubID, sysID);
          this.currentNode.rootNodeName = root;
          this.currentNode.children = false;
          this.currentLevel++;
          this.openTags[this.currentLevel] = this.currentNode;
          return this;
        };
        XMLDocumentCB2.prototype.dtdElement = function(name, value) {
          var node;
          this.openCurrent();
          node = new XMLDTDElement(this, name, value);
          this.onData(this.writer.dtdElement(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        };
        XMLDocumentCB2.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
          var node;
          this.openCurrent();
          node = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
          this.onData(this.writer.dtdAttList(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        };
        XMLDocumentCB2.prototype.entity = function(name, value) {
          var node;
          this.openCurrent();
          node = new XMLDTDEntity(this, false, name, value);
          this.onData(this.writer.dtdEntity(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        };
        XMLDocumentCB2.prototype.pEntity = function(name, value) {
          var node;
          this.openCurrent();
          node = new XMLDTDEntity(this, true, name, value);
          this.onData(this.writer.dtdEntity(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        };
        XMLDocumentCB2.prototype.notation = function(name, value) {
          var node;
          this.openCurrent();
          node = new XMLDTDNotation(this, name, value);
          this.onData(this.writer.dtdNotation(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        };
        XMLDocumentCB2.prototype.up = function() {
          if (this.currentLevel < 0) {
            throw new Error("The document node has no parent.");
          }
          if (this.currentNode) {
            if (this.currentNode.children) {
              this.closeNode(this.currentNode);
            } else {
              this.openNode(this.currentNode);
            }
            this.currentNode = null;
          } else {
            this.closeNode(this.openTags[this.currentLevel]);
          }
          delete this.openTags[this.currentLevel];
          this.currentLevel--;
          return this;
        };
        XMLDocumentCB2.prototype.end = function() {
          while (this.currentLevel >= 0) {
            this.up();
          }
          return this.onEnd();
        };
        XMLDocumentCB2.prototype.openCurrent = function() {
          if (this.currentNode) {
            this.currentNode.children = true;
            return this.openNode(this.currentNode);
          }
        };
        XMLDocumentCB2.prototype.openNode = function(node) {
          var att, chunk, name, ref1;
          if (!node.isOpen) {
            if (!this.root && this.currentLevel === 0 && node.type === NodeType.Element) {
              this.root = node;
            }
            chunk = "";
            if (node.type === NodeType.Element) {
              this.writerOptions.state = WriterState.OpenTag;
              chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + "<" + node.name;
              ref1 = node.attribs;
              for (name in ref1) {
                if (!hasProp.call(ref1, name)) continue;
                att = ref1[name];
                chunk += this.writer.attribute(att, this.writerOptions, this.currentLevel);
              }
              chunk += (node.children ? ">" : "/>") + this.writer.endline(node, this.writerOptions, this.currentLevel);
              this.writerOptions.state = WriterState.InsideTag;
            } else {
              this.writerOptions.state = WriterState.OpenTag;
              chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + "<!DOCTYPE " + node.rootNodeName;
              if (node.pubID && node.sysID) {
                chunk += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
              } else if (node.sysID) {
                chunk += ' SYSTEM "' + node.sysID + '"';
              }
              if (node.children) {
                chunk += " [";
                this.writerOptions.state = WriterState.InsideTag;
              } else {
                this.writerOptions.state = WriterState.CloseTag;
                chunk += ">";
              }
              chunk += this.writer.endline(node, this.writerOptions, this.currentLevel);
            }
            this.onData(chunk, this.currentLevel);
            return node.isOpen = true;
          }
        };
        XMLDocumentCB2.prototype.closeNode = function(node) {
          var chunk;
          if (!node.isClosed) {
            chunk = "";
            this.writerOptions.state = WriterState.CloseTag;
            if (node.type === NodeType.Element) {
              chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + "</" + node.name + ">" + this.writer.endline(node, this.writerOptions, this.currentLevel);
            } else {
              chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + "]>" + this.writer.endline(node, this.writerOptions, this.currentLevel);
            }
            this.writerOptions.state = WriterState.None;
            this.onData(chunk, this.currentLevel);
            return node.isClosed = true;
          }
        };
        XMLDocumentCB2.prototype.onData = function(chunk, level) {
          this.documentStarted = true;
          return this.onDataCallback(chunk, level + 1);
        };
        XMLDocumentCB2.prototype.onEnd = function() {
          this.documentCompleted = true;
          return this.onEndCallback();
        };
        XMLDocumentCB2.prototype.debugInfo = function(name) {
          if (name == null) {
            return "";
          } else {
            return "node: <" + name + ">";
          }
        };
        XMLDocumentCB2.prototype.ele = function() {
          return this.element.apply(this, arguments);
        };
        XMLDocumentCB2.prototype.nod = function(name, attributes, text) {
          return this.node(name, attributes, text);
        };
        XMLDocumentCB2.prototype.txt = function(value) {
          return this.text(value);
        };
        XMLDocumentCB2.prototype.dat = function(value) {
          return this.cdata(value);
        };
        XMLDocumentCB2.prototype.com = function(value) {
          return this.comment(value);
        };
        XMLDocumentCB2.prototype.ins = function(target, value) {
          return this.instruction(target, value);
        };
        XMLDocumentCB2.prototype.dec = function(version, encoding, standalone) {
          return this.declaration(version, encoding, standalone);
        };
        XMLDocumentCB2.prototype.dtd = function(root, pubID, sysID) {
          return this.doctype(root, pubID, sysID);
        };
        XMLDocumentCB2.prototype.e = function(name, attributes, text) {
          return this.element(name, attributes, text);
        };
        XMLDocumentCB2.prototype.n = function(name, attributes, text) {
          return this.node(name, attributes, text);
        };
        XMLDocumentCB2.prototype.t = function(value) {
          return this.text(value);
        };
        XMLDocumentCB2.prototype.d = function(value) {
          return this.cdata(value);
        };
        XMLDocumentCB2.prototype.c = function(value) {
          return this.comment(value);
        };
        XMLDocumentCB2.prototype.r = function(value) {
          return this.raw(value);
        };
        XMLDocumentCB2.prototype.i = function(target, value) {
          return this.instruction(target, value);
        };
        XMLDocumentCB2.prototype.att = function() {
          if (this.currentNode && this.currentNode.type === NodeType.DocType) {
            return this.attList.apply(this, arguments);
          } else {
            return this.attribute.apply(this, arguments);
          }
        };
        XMLDocumentCB2.prototype.a = function() {
          if (this.currentNode && this.currentNode.type === NodeType.DocType) {
            return this.attList.apply(this, arguments);
          } else {
            return this.attribute.apply(this, arguments);
          }
        };
        XMLDocumentCB2.prototype.ent = function(name, value) {
          return this.entity(name, value);
        };
        XMLDocumentCB2.prototype.pent = function(name, value) {
          return this.pEntity(name, value);
        };
        XMLDocumentCB2.prototype.not = function(name, value) {
          return this.notation(name, value);
        };
        return XMLDocumentCB2;
      })();
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/XMLStreamWriter.js
var require_XMLStreamWriter = __commonJS({
  "node_modules/xmlbuilder/lib/XMLStreamWriter.js"(exports2, module2) {
    (function() {
      var NodeType, WriterState, XMLStreamWriter, XMLWriterBase, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      NodeType = require_NodeType();
      XMLWriterBase = require_XMLWriterBase();
      WriterState = require_WriterState();
      module2.exports = XMLStreamWriter = (function(superClass) {
        extend(XMLStreamWriter2, superClass);
        function XMLStreamWriter2(stream, options) {
          this.stream = stream;
          XMLStreamWriter2.__super__.constructor.call(this, options);
        }
        __name(XMLStreamWriter2, "XMLStreamWriter");
        XMLStreamWriter2.prototype.endline = function(node, options, level) {
          if (node.isLastRootNode && options.state === WriterState.CloseTag) {
            return "";
          } else {
            return XMLStreamWriter2.__super__.endline.call(this, node, options, level);
          }
        };
        XMLStreamWriter2.prototype.document = function(doc, options) {
          var child, i, j, k, len, len1, ref, ref1, results;
          ref = doc.children;
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            child = ref[i];
            child.isLastRootNode = i === doc.children.length - 1;
          }
          options = this.filterOptions(options);
          ref1 = doc.children;
          results = [];
          for (k = 0, len1 = ref1.length; k < len1; k++) {
            child = ref1[k];
            results.push(this.writeChildNode(child, options, 0));
          }
          return results;
        };
        XMLStreamWriter2.prototype.attribute = function(att, options, level) {
          return this.stream.write(XMLStreamWriter2.__super__.attribute.call(this, att, options, level));
        };
        XMLStreamWriter2.prototype.cdata = function(node, options, level) {
          return this.stream.write(XMLStreamWriter2.__super__.cdata.call(this, node, options, level));
        };
        XMLStreamWriter2.prototype.comment = function(node, options, level) {
          return this.stream.write(XMLStreamWriter2.__super__.comment.call(this, node, options, level));
        };
        XMLStreamWriter2.prototype.declaration = function(node, options, level) {
          return this.stream.write(XMLStreamWriter2.__super__.declaration.call(this, node, options, level));
        };
        XMLStreamWriter2.prototype.docType = function(node, options, level) {
          var child, j, len, ref;
          level || (level = 0);
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          this.stream.write(this.indent(node, options, level));
          this.stream.write("<!DOCTYPE " + node.root().name);
          if (node.pubID && node.sysID) {
            this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"');
          } else if (node.sysID) {
            this.stream.write(' SYSTEM "' + node.sysID + '"');
          }
          if (node.children.length > 0) {
            this.stream.write(" [");
            this.stream.write(this.endline(node, options, level));
            options.state = WriterState.InsideTag;
            ref = node.children;
            for (j = 0, len = ref.length; j < len; j++) {
              child = ref[j];
              this.writeChildNode(child, options, level + 1);
            }
            options.state = WriterState.CloseTag;
            this.stream.write("]");
          }
          options.state = WriterState.CloseTag;
          this.stream.write(options.spaceBeforeSlash + ">");
          this.stream.write(this.endline(node, options, level));
          options.state = WriterState.None;
          return this.closeNode(node, options, level);
        };
        XMLStreamWriter2.prototype.element = function(node, options, level) {
          var att, child, childNodeCount, firstChildNode, j, len, name, prettySuppressed, ref, ref1;
          level || (level = 0);
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          this.stream.write(this.indent(node, options, level) + "<" + node.name);
          ref = node.attribs;
          for (name in ref) {
            if (!hasProp.call(ref, name)) continue;
            att = ref[name];
            this.attribute(att, options, level);
          }
          childNodeCount = node.children.length;
          firstChildNode = childNodeCount === 0 ? null : node.children[0];
          if (childNodeCount === 0 || node.children.every(function(e) {
            return (e.type === NodeType.Text || e.type === NodeType.Raw) && e.value === "";
          })) {
            if (options.allowEmpty) {
              this.stream.write(">");
              options.state = WriterState.CloseTag;
              this.stream.write("</" + node.name + ">");
            } else {
              options.state = WriterState.CloseTag;
              this.stream.write(options.spaceBeforeSlash + "/>");
            }
          } else if (options.pretty && childNodeCount === 1 && (firstChildNode.type === NodeType.Text || firstChildNode.type === NodeType.Raw) && firstChildNode.value != null) {
            this.stream.write(">");
            options.state = WriterState.InsideTag;
            options.suppressPrettyCount++;
            prettySuppressed = true;
            this.writeChildNode(firstChildNode, options, level + 1);
            options.suppressPrettyCount--;
            prettySuppressed = false;
            options.state = WriterState.CloseTag;
            this.stream.write("</" + node.name + ">");
          } else {
            this.stream.write(">" + this.endline(node, options, level));
            options.state = WriterState.InsideTag;
            ref1 = node.children;
            for (j = 0, len = ref1.length; j < len; j++) {
              child = ref1[j];
              this.writeChildNode(child, options, level + 1);
            }
            options.state = WriterState.CloseTag;
            this.stream.write(this.indent(node, options, level) + "</" + node.name + ">");
          }
          this.stream.write(this.endline(node, options, level));
          options.state = WriterState.None;
          return this.closeNode(node, options, level);
        };
        XMLStreamWriter2.prototype.processingInstruction = function(node, options, level) {
          return this.stream.write(XMLStreamWriter2.__super__.processingInstruction.call(this, node, options, level));
        };
        XMLStreamWriter2.prototype.raw = function(node, options, level) {
          return this.stream.write(XMLStreamWriter2.__super__.raw.call(this, node, options, level));
        };
        XMLStreamWriter2.prototype.text = function(node, options, level) {
          return this.stream.write(XMLStreamWriter2.__super__.text.call(this, node, options, level));
        };
        XMLStreamWriter2.prototype.dtdAttList = function(node, options, level) {
          return this.stream.write(XMLStreamWriter2.__super__.dtdAttList.call(this, node, options, level));
        };
        XMLStreamWriter2.prototype.dtdElement = function(node, options, level) {
          return this.stream.write(XMLStreamWriter2.__super__.dtdElement.call(this, node, options, level));
        };
        XMLStreamWriter2.prototype.dtdEntity = function(node, options, level) {
          return this.stream.write(XMLStreamWriter2.__super__.dtdEntity.call(this, node, options, level));
        };
        XMLStreamWriter2.prototype.dtdNotation = function(node, options, level) {
          return this.stream.write(XMLStreamWriter2.__super__.dtdNotation.call(this, node, options, level));
        };
        return XMLStreamWriter2;
      })(XMLWriterBase);
    }).call(exports2);
  }
});

// node_modules/xmlbuilder/lib/index.js
var require_lib6 = __commonJS({
  "node_modules/xmlbuilder/lib/index.js"(exports2, module2) {
    (function() {
      var NodeType, WriterState, XMLDOMImplementation, XMLDocument, XMLDocumentCB, XMLStreamWriter, XMLStringWriter, assign, isFunction, ref;
      ref = require_Utility(), assign = ref.assign, isFunction = ref.isFunction;
      XMLDOMImplementation = require_XMLDOMImplementation();
      XMLDocument = require_XMLDocument();
      XMLDocumentCB = require_XMLDocumentCB();
      XMLStringWriter = require_XMLStringWriter();
      XMLStreamWriter = require_XMLStreamWriter();
      NodeType = require_NodeType();
      WriterState = require_WriterState();
      module2.exports.create = function(name, xmldec, doctype, options) {
        var doc, root;
        if (name == null) {
          throw new Error("Root element needs a name.");
        }
        options = assign({}, xmldec, doctype, options);
        doc = new XMLDocument(options);
        root = doc.element(name);
        if (!options.headless) {
          doc.declaration(options);
          if (options.pubID != null || options.sysID != null) {
            doc.dtd(options);
          }
        }
        return root;
      };
      module2.exports.begin = function(options, onData, onEnd) {
        var ref1;
        if (isFunction(options)) {
          ref1 = [options, onData], onData = ref1[0], onEnd = ref1[1];
          options = {};
        }
        if (onData) {
          return new XMLDocumentCB(options, onData, onEnd);
        } else {
          return new XMLDocument(options);
        }
      };
      module2.exports.stringWriter = function(options) {
        return new XMLStringWriter(options);
      };
      module2.exports.streamWriter = function(stream, options) {
        return new XMLStreamWriter(stream, options);
      };
      module2.exports.implementation = new XMLDOMImplementation();
      module2.exports.nodeType = NodeType;
      module2.exports.writerState = WriterState;
    }).call(exports2);
  }
});

// node_modules/xml2js/lib/builder.js
var require_builder = __commonJS({
  "node_modules/xml2js/lib/builder.js"(exports2) {
    (function() {
      "use strict";
      var builder, defaults, escapeCDATA, requiresCDATA, wrapCDATA, hasProp = {}.hasOwnProperty;
      builder = require_lib6();
      defaults = require_defaults().defaults;
      requiresCDATA = /* @__PURE__ */ __name(function(entry) {
        return typeof entry === "string" && (entry.indexOf("&") >= 0 || entry.indexOf(">") >= 0 || entry.indexOf("<") >= 0);
      }, "requiresCDATA");
      wrapCDATA = /* @__PURE__ */ __name(function(entry) {
        return "<![CDATA[" + escapeCDATA(entry) + "]]>";
      }, "wrapCDATA");
      escapeCDATA = /* @__PURE__ */ __name(function(entry) {
        return entry.replace("]]>", "]]]]><![CDATA[>");
      }, "escapeCDATA");
      exports2.Builder = (function() {
        function Builder(opts) {
          var key, ref, value;
          this.options = {};
          ref = defaults["0.2"];
          for (key in ref) {
            if (!hasProp.call(ref, key)) continue;
            value = ref[key];
            this.options[key] = value;
          }
          for (key in opts) {
            if (!hasProp.call(opts, key)) continue;
            value = opts[key];
            this.options[key] = value;
          }
        }
        __name(Builder, "Builder");
        Builder.prototype.buildObject = function(rootObj) {
          var attrkey, charkey, render, rootElement, rootName;
          attrkey = this.options.attrkey;
          charkey = this.options.charkey;
          if (Object.keys(rootObj).length === 1 && this.options.rootName === defaults["0.2"].rootName) {
            rootName = Object.keys(rootObj)[0];
            rootObj = rootObj[rootName];
          } else {
            rootName = this.options.rootName;
          }
          render = /* @__PURE__ */ (function(_this) {
            return function(element, obj) {
              var attr, child, entry, index, key, value;
              if (typeof obj !== "object") {
                if (_this.options.cdata && requiresCDATA(obj)) {
                  element.raw(wrapCDATA(obj));
                } else {
                  element.txt(obj);
                }
              } else if (Array.isArray(obj)) {
                for (index in obj) {
                  if (!hasProp.call(obj, index)) continue;
                  child = obj[index];
                  for (key in child) {
                    entry = child[key];
                    element = render(element.ele(key), entry).up();
                  }
                }
              } else {
                for (key in obj) {
                  if (!hasProp.call(obj, key)) continue;
                  child = obj[key];
                  if (key === attrkey) {
                    if (typeof child === "object") {
                      for (attr in child) {
                        value = child[attr];
                        element = element.att(attr, value);
                      }
                    }
                  } else if (key === charkey) {
                    if (_this.options.cdata && requiresCDATA(child)) {
                      element = element.raw(wrapCDATA(child));
                    } else {
                      element = element.txt(child);
                    }
                  } else if (Array.isArray(child)) {
                    for (index in child) {
                      if (!hasProp.call(child, index)) continue;
                      entry = child[index];
                      if (typeof entry === "string") {
                        if (_this.options.cdata && requiresCDATA(entry)) {
                          element = element.ele(key).raw(wrapCDATA(entry)).up();
                        } else {
                          element = element.ele(key, entry).up();
                        }
                      } else {
                        element = render(element.ele(key), entry).up();
                      }
                    }
                  } else if (typeof child === "object") {
                    element = render(element.ele(key), child).up();
                  } else {
                    if (typeof child === "string" && _this.options.cdata && requiresCDATA(child)) {
                      element = element.ele(key).raw(wrapCDATA(child)).up();
                    } else {
                      if (child == null) {
                        child = "";
                      }
                      element = element.ele(key, child.toString()).up();
                    }
                  }
                }
              }
              return element;
            };
          })(this);
          rootElement = builder.create(rootName, this.options.xmldec, this.options.doctype, {
            headless: this.options.headless,
            allowSurrogateChars: this.options.allowSurrogateChars
          });
          return render(rootElement, rootObj).end(this.options.renderOpts);
        };
        return Builder;
      })();
    }).call(exports2);
  }
});

// node_modules/sax/lib/sax.js
var require_sax = __commonJS({
  "node_modules/sax/lib/sax.js"(exports2) {
    (function(sax) {
      sax.parser = function(strict, opt) {
        return new SAXParser(strict, opt);
      };
      sax.SAXParser = SAXParser;
      sax.SAXStream = SAXStream;
      sax.createStream = createStream;
      sax.MAX_BUFFER_LENGTH = 64 * 1024;
      var buffers = [
        "comment",
        "sgmlDecl",
        "textNode",
        "tagName",
        "doctype",
        "procInstName",
        "procInstBody",
        "entity",
        "attribName",
        "attribValue",
        "cdata",
        "script"
      ];
      sax.EVENTS = [
        "text",
        "processinginstruction",
        "sgmldeclaration",
        "doctype",
        "comment",
        "opentagstart",
        "attribute",
        "opentag",
        "closetag",
        "opencdata",
        "cdata",
        "closecdata",
        "error",
        "end",
        "ready",
        "script",
        "opennamespace",
        "closenamespace"
      ];
      function SAXParser(strict, opt) {
        if (!(this instanceof SAXParser)) {
          return new SAXParser(strict, opt);
        }
        var parser = this;
        clearBuffers(parser);
        parser.q = parser.c = "";
        parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH;
        parser.encoding = null;
        parser.opt = opt || {};
        parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
        parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase";
        parser.opt.maxEntityCount = parser.opt.maxEntityCount || 512;
        parser.opt.maxEntityDepth = parser.opt.maxEntityDepth || 4;
        parser.entityCount = parser.entityDepth = 0;
        parser.tags = [];
        parser.closed = parser.closedRoot = parser.sawRoot = false;
        parser.tag = parser.error = null;
        parser.strict = !!strict;
        parser.noscript = !!(strict || parser.opt.noscript);
        parser.state = S.BEGIN;
        parser.strictEntities = parser.opt.strictEntities;
        parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES);
        parser.attribList = [];
        if (parser.opt.xmlns) {
          parser.ns = Object.create(rootNS);
        }
        if (parser.opt.unquotedAttributeValues === void 0) {
          parser.opt.unquotedAttributeValues = !strict;
        }
        parser.trackPosition = parser.opt.position !== false;
        if (parser.trackPosition) {
          parser.position = parser.line = parser.column = 0;
        }
        emit(parser, "onready");
      }
      __name(SAXParser, "SAXParser");
      if (!Object.create) {
        Object.create = function(o) {
          function F() {
          }
          __name(F, "F");
          F.prototype = o;
          var newf = new F();
          return newf;
        };
      }
      if (!Object.keys) {
        Object.keys = function(o) {
          var a = [];
          for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
          return a;
        };
      }
      function checkBufferLength(parser) {
        var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10);
        var maxActual = 0;
        for (var i = 0, l = buffers.length; i < l; i++) {
          var len = parser[buffers[i]].length;
          if (len > maxAllowed) {
            switch (buffers[i]) {
              case "textNode":
                closeText(parser);
                break;
              case "cdata":
                emitNode(parser, "oncdata", parser.cdata);
                parser.cdata = "";
                break;
              case "script":
                emitNode(parser, "onscript", parser.script);
                parser.script = "";
                break;
              default:
                error(parser, "Max buffer length exceeded: " + buffers[i]);
            }
          }
          maxActual = Math.max(maxActual, len);
        }
        var m = sax.MAX_BUFFER_LENGTH - maxActual;
        parser.bufferCheckPosition = m + parser.position;
      }
      __name(checkBufferLength, "checkBufferLength");
      function clearBuffers(parser) {
        for (var i = 0, l = buffers.length; i < l; i++) {
          parser[buffers[i]] = "";
        }
      }
      __name(clearBuffers, "clearBuffers");
      function flushBuffers(parser) {
        closeText(parser);
        if (parser.cdata !== "") {
          emitNode(parser, "oncdata", parser.cdata);
          parser.cdata = "";
        }
        if (parser.script !== "") {
          emitNode(parser, "onscript", parser.script);
          parser.script = "";
        }
      }
      __name(flushBuffers, "flushBuffers");
      SAXParser.prototype = {
        end: /* @__PURE__ */ __name(function() {
          end(this);
        }, "end"),
        write,
        resume: /* @__PURE__ */ __name(function() {
          this.error = null;
          return this;
        }, "resume"),
        close: /* @__PURE__ */ __name(function() {
          return this.write(null);
        }, "close"),
        flush: /* @__PURE__ */ __name(function() {
          flushBuffers(this);
        }, "flush")
      };
      var Stream;
      try {
        Stream = require("stream").Stream;
      } catch (ex) {
        Stream = /* @__PURE__ */ __name(function() {
        }, "Stream");
      }
      if (!Stream) Stream = /* @__PURE__ */ __name(function() {
      }, "Stream");
      var streamWraps = sax.EVENTS.filter(function(ev) {
        return ev !== "error" && ev !== "end";
      });
      function createStream(strict, opt) {
        return new SAXStream(strict, opt);
      }
      __name(createStream, "createStream");
      function determineBufferEncoding(data, isEnd) {
        if (data.length >= 2) {
          if (data[0] === 255 && data[1] === 254) {
            return "utf-16le";
          }
          if (data[0] === 254 && data[1] === 255) {
            return "utf-16be";
          }
        }
        if (data.length >= 3 && data[0] === 239 && data[1] === 187 && data[2] === 191) {
          return "utf8";
        }
        if (data.length >= 4) {
          if (data[0] === 60 && data[1] === 0 && data[2] === 63 && data[3] === 0) {
            return "utf-16le";
          }
          if (data[0] === 0 && data[1] === 60 && data[2] === 0 && data[3] === 63) {
            return "utf-16be";
          }
          return "utf8";
        }
        return isEnd ? "utf8" : null;
      }
      __name(determineBufferEncoding, "determineBufferEncoding");
      function SAXStream(strict, opt) {
        if (!(this instanceof SAXStream)) {
          return new SAXStream(strict, opt);
        }
        Stream.apply(this);
        this._parser = new SAXParser(strict, opt);
        this.writable = true;
        this.readable = true;
        var me = this;
        this._parser.onend = function() {
          me.emit("end");
        };
        this._parser.onerror = function(er) {
          me.emit("error", er);
          me._parser.error = null;
        };
        this._decoder = null;
        this._decoderBuffer = null;
        streamWraps.forEach(function(ev) {
          Object.defineProperty(me, "on" + ev, {
            get: /* @__PURE__ */ __name(function() {
              return me._parser["on" + ev];
            }, "get"),
            set: /* @__PURE__ */ __name(function(h) {
              if (!h) {
                me.removeAllListeners(ev);
                me._parser["on" + ev] = h;
                return h;
              }
              me.on(ev, h);
            }, "set"),
            enumerable: true,
            configurable: false
          });
        });
      }
      __name(SAXStream, "SAXStream");
      SAXStream.prototype = Object.create(Stream.prototype, {
        constructor: {
          value: SAXStream
        }
      });
      SAXStream.prototype._decodeBuffer = function(data, isEnd) {
        if (this._decoderBuffer) {
          data = Buffer.concat([this._decoderBuffer, data]);
          this._decoderBuffer = null;
        }
        if (!this._decoder) {
          var encoding = determineBufferEncoding(data, isEnd);
          if (!encoding) {
            this._decoderBuffer = data;
            return "";
          }
          this._parser.encoding = encoding;
          this._decoder = new TextDecoder(encoding);
        }
        return this._decoder.decode(data, { stream: !isEnd });
      };
      SAXStream.prototype.write = function(data) {
        if (typeof Buffer === "function" && typeof Buffer.isBuffer === "function" && Buffer.isBuffer(data)) {
          data = this._decodeBuffer(data, false);
        } else if (this._decoderBuffer) {
          var remaining = this._decodeBuffer(Buffer.alloc(0), true);
          if (remaining) {
            this._parser.write(remaining);
            this.emit("data", remaining);
          }
        }
        this._parser.write(data.toString());
        this.emit("data", data);
        return true;
      };
      SAXStream.prototype.end = function(chunk) {
        if (chunk && chunk.length) {
          this.write(chunk);
        }
        if (this._decoderBuffer) {
          var finalChunk = this._decodeBuffer(Buffer.alloc(0), true);
          if (finalChunk) {
            this._parser.write(finalChunk);
            this.emit("data", finalChunk);
          }
        } else if (this._decoder) {
          var remaining = this._decoder.decode();
          if (remaining) {
            this._parser.write(remaining);
            this.emit("data", remaining);
          }
        }
        this._parser.end();
        return true;
      };
      SAXStream.prototype.on = function(ev, handler) {
        var me = this;
        if (!me._parser["on" + ev] && streamWraps.indexOf(ev) !== -1) {
          me._parser["on" + ev] = function() {
            var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
            args.splice(0, 0, ev);
            me.emit.apply(me, args);
          };
        }
        return Stream.prototype.on.call(me, ev, handler);
      };
      var CDATAre = /^\[CDATA\[$/i;
      var DOCTYPEre = /^DOCTYPE$/i;
      var XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
      var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
      var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE };
      var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
      var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
      var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      function isWhitespace(c) {
        return c === " " || c === "\n" || c === "\r" || c === "	";
      }
      __name(isWhitespace, "isWhitespace");
      function isQuote(c) {
        return c === '"' || c === "'";
      }
      __name(isQuote, "isQuote");
      function isAttribEnd(c) {
        return c === ">" || isWhitespace(c);
      }
      __name(isAttribEnd, "isAttribEnd");
      function isMatch(regex, c) {
        return regex.test(c);
      }
      __name(isMatch, "isMatch");
      function notMatch(regex, c) {
        return !isMatch(regex, c);
      }
      __name(notMatch, "notMatch");
      var S = 0;
      sax.STATE = {
        BEGIN: S++,
        // leading byte order mark or whitespace
        BEGIN_WHITESPACE: S++,
        // leading whitespace
        TEXT: S++,
        // general stuff
        TEXT_ENTITY: S++,
        // &amp and such.
        OPEN_WAKA: S++,
        // <
        SGML_DECL: S++,
        // <!BLARG
        SGML_DECL_QUOTED: S++,
        // <!BLARG foo "bar
        DOCTYPE: S++,
        // <!DOCTYPE
        DOCTYPE_QUOTED: S++,
        // <!DOCTYPE "//blah
        DOCTYPE_DTD: S++,
        // <!DOCTYPE "//blah" [ ...
        DOCTYPE_DTD_QUOTED: S++,
        // <!DOCTYPE "//blah" [ "foo
        COMMENT_STARTING: S++,
        // <!-
        COMMENT: S++,
        // <!--
        COMMENT_ENDING: S++,
        // <!-- blah -
        COMMENT_ENDED: S++,
        // <!-- blah --
        CDATA: S++,
        // <![CDATA[ something
        CDATA_ENDING: S++,
        // ]
        CDATA_ENDING_2: S++,
        // ]]
        PROC_INST: S++,
        // <?hi
        PROC_INST_BODY: S++,
        // <?hi there
        PROC_INST_ENDING: S++,
        // <?hi "there" ?
        OPEN_TAG: S++,
        // <strong
        OPEN_TAG_SLASH: S++,
        // <strong /
        ATTRIB: S++,
        // <a
        ATTRIB_NAME: S++,
        // <a foo
        ATTRIB_NAME_SAW_WHITE: S++,
        // <a foo _
        ATTRIB_VALUE: S++,
        // <a foo=
        ATTRIB_VALUE_QUOTED: S++,
        // <a foo="bar
        ATTRIB_VALUE_CLOSED: S++,
        // <a foo="bar"
        ATTRIB_VALUE_UNQUOTED: S++,
        // <a foo=bar
        ATTRIB_VALUE_ENTITY_Q: S++,
        // <foo bar="&quot;"
        ATTRIB_VALUE_ENTITY_U: S++,
        // <foo bar=&quot
        CLOSE_TAG: S++,
        // </a
        CLOSE_TAG_SAW_WHITE: S++,
        // </a   >
        SCRIPT: S++,
        // <script> ...
        SCRIPT_ENDING: S++
        // <script> ... <
      };
      sax.XML_ENTITIES = Object.assign(/* @__PURE__ */ Object.create(null), {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'"
      });
      sax.ENTITIES = Object.assign(/* @__PURE__ */ Object.create(null), {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'",
        AElig: 198,
        Aacute: 193,
        Acirc: 194,
        Agrave: 192,
        Aring: 197,
        Atilde: 195,
        Auml: 196,
        Ccedil: 199,
        ETH: 208,
        Eacute: 201,
        Ecirc: 202,
        Egrave: 200,
        Euml: 203,
        Iacute: 205,
        Icirc: 206,
        Igrave: 204,
        Iuml: 207,
        Ntilde: 209,
        Oacute: 211,
        Ocirc: 212,
        Ograve: 210,
        Oslash: 216,
        Otilde: 213,
        Ouml: 214,
        THORN: 222,
        Uacute: 218,
        Ucirc: 219,
        Ugrave: 217,
        Uuml: 220,
        Yacute: 221,
        aacute: 225,
        acirc: 226,
        aelig: 230,
        agrave: 224,
        aring: 229,
        atilde: 227,
        auml: 228,
        ccedil: 231,
        eacute: 233,
        ecirc: 234,
        egrave: 232,
        eth: 240,
        euml: 235,
        iacute: 237,
        icirc: 238,
        igrave: 236,
        iuml: 239,
        ntilde: 241,
        oacute: 243,
        ocirc: 244,
        ograve: 242,
        oslash: 248,
        otilde: 245,
        ouml: 246,
        szlig: 223,
        thorn: 254,
        uacute: 250,
        ucirc: 251,
        ugrave: 249,
        uuml: 252,
        yacute: 253,
        yuml: 255,
        copy: 169,
        reg: 174,
        nbsp: 160,
        iexcl: 161,
        cent: 162,
        pound: 163,
        curren: 164,
        yen: 165,
        brvbar: 166,
        sect: 167,
        uml: 168,
        ordf: 170,
        laquo: 171,
        not: 172,
        shy: 173,
        macr: 175,
        deg: 176,
        plusmn: 177,
        sup1: 185,
        sup2: 178,
        sup3: 179,
        acute: 180,
        micro: 181,
        para: 182,
        middot: 183,
        cedil: 184,
        ordm: 186,
        raquo: 187,
        frac14: 188,
        frac12: 189,
        frac34: 190,
        iquest: 191,
        times: 215,
        divide: 247,
        OElig: 338,
        oelig: 339,
        Scaron: 352,
        scaron: 353,
        Yuml: 376,
        fnof: 402,
        circ: 710,
        tilde: 732,
        Alpha: 913,
        Beta: 914,
        Gamma: 915,
        Delta: 916,
        Epsilon: 917,
        Zeta: 918,
        Eta: 919,
        Theta: 920,
        Iota: 921,
        Kappa: 922,
        Lambda: 923,
        Mu: 924,
        Nu: 925,
        Xi: 926,
        Omicron: 927,
        Pi: 928,
        Rho: 929,
        Sigma: 931,
        Tau: 932,
        Upsilon: 933,
        Phi: 934,
        Chi: 935,
        Psi: 936,
        Omega: 937,
        alpha: 945,
        beta: 946,
        gamma: 947,
        delta: 948,
        epsilon: 949,
        zeta: 950,
        eta: 951,
        theta: 952,
        iota: 953,
        kappa: 954,
        lambda: 955,
        mu: 956,
        nu: 957,
        xi: 958,
        omicron: 959,
        pi: 960,
        rho: 961,
        sigmaf: 962,
        sigma: 963,
        tau: 964,
        upsilon: 965,
        phi: 966,
        chi: 967,
        psi: 968,
        omega: 969,
        thetasym: 977,
        upsih: 978,
        piv: 982,
        ensp: 8194,
        emsp: 8195,
        thinsp: 8201,
        zwnj: 8204,
        zwj: 8205,
        lrm: 8206,
        rlm: 8207,
        ndash: 8211,
        mdash: 8212,
        lsquo: 8216,
        rsquo: 8217,
        sbquo: 8218,
        ldquo: 8220,
        rdquo: 8221,
        bdquo: 8222,
        dagger: 8224,
        Dagger: 8225,
        bull: 8226,
        hellip: 8230,
        permil: 8240,
        prime: 8242,
        Prime: 8243,
        lsaquo: 8249,
        rsaquo: 8250,
        oline: 8254,
        frasl: 8260,
        euro: 8364,
        image: 8465,
        weierp: 8472,
        real: 8476,
        trade: 8482,
        alefsym: 8501,
        larr: 8592,
        uarr: 8593,
        rarr: 8594,
        darr: 8595,
        harr: 8596,
        crarr: 8629,
        lArr: 8656,
        uArr: 8657,
        rArr: 8658,
        dArr: 8659,
        hArr: 8660,
        forall: 8704,
        part: 8706,
        exist: 8707,
        empty: 8709,
        nabla: 8711,
        isin: 8712,
        notin: 8713,
        ni: 8715,
        prod: 8719,
        sum: 8721,
        minus: 8722,
        lowast: 8727,
        radic: 8730,
        prop: 8733,
        infin: 8734,
        ang: 8736,
        and: 8743,
        or: 8744,
        cap: 8745,
        cup: 8746,
        int: 8747,
        there4: 8756,
        sim: 8764,
        cong: 8773,
        asymp: 8776,
        ne: 8800,
        equiv: 8801,
        le: 8804,
        ge: 8805,
        sub: 8834,
        sup: 8835,
        nsub: 8836,
        sube: 8838,
        supe: 8839,
        oplus: 8853,
        otimes: 8855,
        perp: 8869,
        sdot: 8901,
        lceil: 8968,
        rceil: 8969,
        lfloor: 8970,
        rfloor: 8971,
        lang: 9001,
        rang: 9002,
        loz: 9674,
        spades: 9824,
        clubs: 9827,
        hearts: 9829,
        diams: 9830
      });
      Object.keys(sax.ENTITIES).forEach(function(key) {
        var e = sax.ENTITIES[key];
        var s2 = typeof e === "number" ? String.fromCharCode(e) : e;
        sax.ENTITIES[key] = s2;
      });
      for (var s in sax.STATE) {
        sax.STATE[sax.STATE[s]] = s;
      }
      S = sax.STATE;
      function emit(parser, event, data) {
        parser[event] && parser[event](data);
      }
      __name(emit, "emit");
      function getDeclaredEncoding(body) {
        var match = body && body.match(/(?:^|\s)encoding\s*=\s*(['"])([^'"]+)\1/i);
        return match ? match[2] : null;
      }
      __name(getDeclaredEncoding, "getDeclaredEncoding");
      function normalizeEncodingName(encoding) {
        if (!encoding) {
          return null;
        }
        return encoding.toLowerCase().replace(/[^a-z0-9]/g, "");
      }
      __name(normalizeEncodingName, "normalizeEncodingName");
      function encodingsMatch(detectedEncoding, declaredEncoding) {
        const detected = normalizeEncodingName(detectedEncoding);
        const declared = normalizeEncodingName(declaredEncoding);
        if (!detected || !declared) {
          return true;
        }
        if (declared === "utf16") {
          return detected === "utf16le" || detected === "utf16be";
        }
        return detected === declared;
      }
      __name(encodingsMatch, "encodingsMatch");
      function validateXmlDeclarationEncoding(parser, data) {
        if (!parser.strict || !parser.encoding || !data || data.name !== "xml") {
          return;
        }
        var declaredEncoding = getDeclaredEncoding(data.body);
        if (declaredEncoding && !encodingsMatch(parser.encoding, declaredEncoding)) {
          strictFail(
            parser,
            "XML declaration encoding " + declaredEncoding + " does not match detected stream encoding " + parser.encoding.toUpperCase()
          );
        }
      }
      __name(validateXmlDeclarationEncoding, "validateXmlDeclarationEncoding");
      function emitNode(parser, nodeType, data) {
        if (parser.textNode) closeText(parser);
        emit(parser, nodeType, data);
      }
      __name(emitNode, "emitNode");
      function closeText(parser) {
        parser.textNode = textopts(parser.opt, parser.textNode);
        if (parser.textNode) emit(parser, "ontext", parser.textNode);
        parser.textNode = "";
      }
      __name(closeText, "closeText");
      function textopts(opt, text) {
        if (opt.trim) text = text.trim();
        if (opt.normalize) text = text.replace(/\s+/g, " ");
        return text;
      }
      __name(textopts, "textopts");
      function error(parser, er) {
        closeText(parser);
        if (parser.trackPosition) {
          er += "\nLine: " + parser.line + "\nColumn: " + parser.column + "\nChar: " + parser.c;
        }
        er = new Error(er);
        parser.error = er;
        emit(parser, "onerror", er);
        return parser;
      }
      __name(error, "error");
      function end(parser) {
        if (parser.sawRoot && !parser.closedRoot)
          strictFail(parser, "Unclosed root tag");
        if (parser.state !== S.BEGIN && parser.state !== S.BEGIN_WHITESPACE && parser.state !== S.TEXT) {
          error(parser, "Unexpected end");
        }
        closeText(parser);
        parser.c = "";
        parser.closed = true;
        emit(parser, "onend");
        SAXParser.call(parser, parser.strict, parser.opt);
        return parser;
      }
      __name(end, "end");
      function strictFail(parser, message) {
        if (typeof parser !== "object" || !(parser instanceof SAXParser)) {
          throw new Error("bad call to strictFail");
        }
        if (parser.strict) {
          error(parser, message);
        }
      }
      __name(strictFail, "strictFail");
      function newTag(parser) {
        if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
        var parent = parser.tags[parser.tags.length - 1] || parser;
        var tag = parser.tag = { name: parser.tagName, attributes: {} };
        if (parser.opt.xmlns) {
          tag.ns = parent.ns;
        }
        parser.attribList.length = 0;
        emitNode(parser, "onopentagstart", tag);
      }
      __name(newTag, "newTag");
      function qname(name, attribute) {
        var i = name.indexOf(":");
        var qualName = i < 0 ? ["", name] : name.split(":");
        var prefix = qualName[0];
        var local = qualName[1];
        if (attribute && name === "xmlns") {
          prefix = "xmlns";
          local = "";
        }
        return { prefix, local };
      }
      __name(qname, "qname");
      function attrib(parser) {
        if (!parser.strict) {
          parser.attribName = parser.attribName[parser.looseCase]();
        }
        if (parser.attribList.indexOf(parser.attribName) !== -1 || parser.tag.attributes.hasOwnProperty(parser.attribName)) {
          parser.attribName = parser.attribValue = "";
          return;
        }
        if (parser.opt.xmlns) {
          var qn = qname(parser.attribName, true);
          var prefix = qn.prefix;
          var local = qn.local;
          if (prefix === "xmlns") {
            if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
              strictFail(
                parser,
                "xml: prefix must be bound to " + XML_NAMESPACE + "\nActual: " + parser.attribValue
              );
            } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
              strictFail(
                parser,
                "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\nActual: " + parser.attribValue
              );
            } else {
              var tag = parser.tag;
              var parent = parser.tags[parser.tags.length - 1] || parser;
              if (tag.ns === parent.ns) {
                tag.ns = Object.create(parent.ns);
              }
              tag.ns[local] = parser.attribValue;
            }
          }
          parser.attribList.push([parser.attribName, parser.attribValue]);
        } else {
          parser.tag.attributes[parser.attribName] = parser.attribValue;
          emitNode(parser, "onattribute", {
            name: parser.attribName,
            value: parser.attribValue
          });
        }
        parser.attribName = parser.attribValue = "";
      }
      __name(attrib, "attrib");
      function openTag(parser, selfClosing) {
        if (parser.opt.xmlns) {
          var tag = parser.tag;
          var qn = qname(parser.tagName);
          tag.prefix = qn.prefix;
          tag.local = qn.local;
          tag.uri = tag.ns[qn.prefix] || "";
          if (tag.prefix && !tag.uri) {
            strictFail(
              parser,
              "Unbound namespace prefix: " + JSON.stringify(parser.tagName)
            );
            tag.uri = qn.prefix;
          }
          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (tag.ns && parent.ns !== tag.ns) {
            Object.keys(tag.ns).forEach(function(p) {
              emitNode(parser, "onopennamespace", {
                prefix: p,
                uri: tag.ns[p]
              });
            });
          }
          for (var i = 0, l = parser.attribList.length; i < l; i++) {
            var nv = parser.attribList[i];
            var name = nv[0];
            var value = nv[1];
            var qualName = qname(name, true);
            var prefix = qualName.prefix;
            var local = qualName.local;
            var uri = prefix === "" ? "" : tag.ns[prefix] || "";
            var a = {
              name,
              value,
              prefix,
              local,
              uri
            };
            if (prefix && prefix !== "xmlns" && !uri) {
              strictFail(
                parser,
                "Unbound namespace prefix: " + JSON.stringify(prefix)
              );
              a.uri = prefix;
            }
            parser.tag.attributes[name] = a;
            emitNode(parser, "onattribute", a);
          }
          parser.attribList.length = 0;
        }
        parser.tag.isSelfClosing = !!selfClosing;
        parser.sawRoot = true;
        parser.tags.push(parser.tag);
        emitNode(parser, "onopentag", parser.tag);
        if (!selfClosing) {
          if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
            parser.state = S.SCRIPT;
          } else {
            parser.state = S.TEXT;
          }
          parser.tag = null;
          parser.tagName = "";
        }
        parser.attribName = parser.attribValue = "";
        parser.attribList.length = 0;
      }
      __name(openTag, "openTag");
      function closeTag(parser) {
        if (!parser.tagName) {
          strictFail(parser, "Weird empty close tag.");
          parser.textNode += "</>";
          parser.state = S.TEXT;
          return;
        }
        if (parser.script) {
          if (parser.tagName !== "script") {
            parser.script += "</" + parser.tagName + ">";
            parser.tagName = "";
            parser.state = S.SCRIPT;
            return;
          }
          emitNode(parser, "onscript", parser.script);
          parser.script = "";
        }
        var t = parser.tags.length;
        var tagName = parser.tagName;
        if (!parser.strict) {
          tagName = tagName[parser.looseCase]();
        }
        var closeTo = tagName;
        while (t--) {
          var close = parser.tags[t];
          if (close.name !== closeTo) {
            strictFail(parser, "Unexpected close tag");
          } else {
            break;
          }
        }
        if (t < 0) {
          strictFail(parser, "Unmatched closing tag: " + parser.tagName);
          parser.textNode += "</" + parser.tagName + ">";
          parser.state = S.TEXT;
          return;
        }
        parser.tagName = tagName;
        var s2 = parser.tags.length;
        while (s2-- > t) {
          var tag = parser.tag = parser.tags.pop();
          parser.tagName = parser.tag.name;
          emitNode(parser, "onclosetag", parser.tagName);
          var x = {};
          for (var i in tag.ns) {
            x[i] = tag.ns[i];
          }
          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (parser.opt.xmlns && tag.ns !== parent.ns) {
            Object.keys(tag.ns).forEach(function(p) {
              var n = tag.ns[p];
              emitNode(parser, "onclosenamespace", { prefix: p, uri: n });
            });
          }
        }
        if (t === 0) parser.closedRoot = true;
        parser.tagName = parser.attribValue = parser.attribName = "";
        parser.attribList.length = 0;
        parser.state = S.TEXT;
      }
      __name(closeTag, "closeTag");
      function parseEntity(parser) {
        var entity = parser.entity;
        var entityLC = entity.toLowerCase();
        var num;
        var numStr = "";
        if (parser.ENTITIES[entity]) {
          return parser.ENTITIES[entity];
        }
        if (parser.ENTITIES[entityLC]) {
          return parser.ENTITIES[entityLC];
        }
        entity = entityLC;
        if (entity.charAt(0) === "#") {
          if (entity.charAt(1) === "x") {
            entity = entity.slice(2);
            num = parseInt(entity, 16);
            numStr = num.toString(16);
          } else {
            entity = entity.slice(1);
            num = parseInt(entity, 10);
            numStr = num.toString(10);
          }
        }
        entity = entity.replace(/^0+/, "");
        if (isNaN(num) || numStr.toLowerCase() !== entity || num < 0 || num > 1114111 || !isXmlChar(num)) {
          strictFail(parser, "Invalid character entity");
          return "&" + parser.entity + ";";
        }
        return String.fromCodePoint(num);
      }
      __name(parseEntity, "parseEntity");
      function isXmlChar(num) {
        return num === 9 || num === 10 || num === 13 || num >= 32 && num <= 55295 || num >= 57344 && num <= 65533 || num >= 65536 && num <= 1114111;
      }
      __name(isXmlChar, "isXmlChar");
      function beginWhiteSpace(parser, c) {
        if (c === "<") {
          parser.state = S.OPEN_WAKA;
          parser.startTagPosition = parser.position;
        } else if (!isWhitespace(c)) {
          strictFail(parser, "Non-whitespace before first tag.");
          parser.textNode = c;
          parser.state = S.TEXT;
        }
      }
      __name(beginWhiteSpace, "beginWhiteSpace");
      function charAt(chunk, i) {
        var result = "";
        if (i < chunk.length) {
          result = chunk.charAt(i);
        }
        return result;
      }
      __name(charAt, "charAt");
      function write(chunk) {
        var parser = this;
        if (this.error) {
          throw this.error;
        }
        if (parser.closed) {
          return error(
            parser,
            "Cannot write after close. Assign an onready handler."
          );
        }
        if (chunk === null) {
          return end(parser);
        }
        if (typeof chunk === "object") {
          chunk = chunk.toString();
        }
        var i = 0;
        var c = "";
        while (true) {
          c = charAt(chunk, i++);
          parser.c = c;
          if (!c) {
            break;
          }
          if (parser.trackPosition) {
            parser.position++;
            if (c === "\n") {
              parser.line++;
              parser.column = 0;
            } else {
              parser.column++;
            }
          }
          switch (parser.state) {
            case S.BEGIN:
              parser.state = S.BEGIN_WHITESPACE;
              if (c === "\uFEFF") {
                continue;
              }
              beginWhiteSpace(parser, c);
              continue;
            case S.BEGIN_WHITESPACE:
              beginWhiteSpace(parser, c);
              continue;
            case S.TEXT:
              if (parser.sawRoot && !parser.closedRoot) {
                var starti = i - 1;
                while (c && c !== "<" && c !== "&") {
                  c = charAt(chunk, i++);
                  if (c && parser.trackPosition) {
                    parser.position++;
                    if (c === "\n") {
                      parser.line++;
                      parser.column = 0;
                    } else {
                      parser.column++;
                    }
                  }
                }
                parser.textNode += chunk.substring(starti, i - 1);
              }
              if (c === "<" && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
                parser.state = S.OPEN_WAKA;
                parser.startTagPosition = parser.position;
              } else {
                if (!isWhitespace(c) && (!parser.sawRoot || parser.closedRoot)) {
                  strictFail(parser, "Text data outside of root node.");
                }
                if (c === "&") {
                  parser.state = S.TEXT_ENTITY;
                } else {
                  parser.textNode += c;
                }
              }
              continue;
            case S.SCRIPT:
              if (c === "<") {
                parser.state = S.SCRIPT_ENDING;
              } else {
                parser.script += c;
              }
              continue;
            case S.SCRIPT_ENDING:
              if (c === "/") {
                parser.state = S.CLOSE_TAG;
              } else {
                parser.script += "<" + c;
                parser.state = S.SCRIPT;
              }
              continue;
            case S.OPEN_WAKA:
              if (c === "!") {
                parser.state = S.SGML_DECL;
                parser.sgmlDecl = "";
              } else if (isWhitespace(c)) {
              } else if (isMatch(nameStart, c)) {
                parser.state = S.OPEN_TAG;
                parser.tagName = c;
              } else if (c === "/") {
                parser.state = S.CLOSE_TAG;
                parser.tagName = "";
              } else if (c === "?") {
                parser.state = S.PROC_INST;
                parser.procInstName = parser.procInstBody = "";
              } else {
                strictFail(parser, "Unencoded <");
                if (parser.startTagPosition + 1 < parser.position) {
                  var pad = parser.position - parser.startTagPosition;
                  c = new Array(pad).join(" ") + c;
                }
                parser.textNode += "<" + c;
                parser.state = S.TEXT;
              }
              continue;
            case S.SGML_DECL:
              if (parser.sgmlDecl + c === "--") {
                parser.state = S.COMMENT;
                parser.comment = "";
                parser.sgmlDecl = "";
                continue;
              }
              if (parser.doctype && parser.doctype !== true && parser.sgmlDecl) {
                parser.state = S.DOCTYPE_DTD;
                parser.doctype += "<!" + parser.sgmlDecl + c;
                parser.sgmlDecl = "";
              } else if (CDATAre.test(parser.sgmlDecl + c)) {
                emitNode(parser, "onopencdata");
                parser.state = S.CDATA;
                parser.sgmlDecl = "";
                parser.cdata = "";
              } else if (DOCTYPEre.test(parser.sgmlDecl + c)) {
                parser.state = S.DOCTYPE;
                if (parser.doctype || parser.sawRoot) {
                  strictFail(
                    parser,
                    "Inappropriately located doctype declaration"
                  );
                }
                parser.doctype = "";
                parser.sgmlDecl = "";
              } else if (c === ">") {
                emitNode(parser, "onsgmldeclaration", parser.sgmlDecl);
                parser.sgmlDecl = "";
                parser.state = S.TEXT;
              } else if (isQuote(c)) {
                parser.state = S.SGML_DECL_QUOTED;
                parser.sgmlDecl += c;
              } else {
                parser.sgmlDecl += c;
              }
              continue;
            case S.SGML_DECL_QUOTED:
              if (c === parser.q) {
                parser.state = S.SGML_DECL;
                parser.q = "";
              }
              parser.sgmlDecl += c;
              continue;
            case S.DOCTYPE:
              if (c === ">") {
                parser.state = S.TEXT;
                emitNode(parser, "ondoctype", parser.doctype);
                parser.doctype = true;
              } else {
                parser.doctype += c;
                if (c === "[") {
                  parser.state = S.DOCTYPE_DTD;
                } else if (isQuote(c)) {
                  parser.state = S.DOCTYPE_QUOTED;
                  parser.q = c;
                }
              }
              continue;
            case S.DOCTYPE_QUOTED:
              parser.doctype += c;
              if (c === parser.q) {
                parser.q = "";
                parser.state = S.DOCTYPE;
              }
              continue;
            case S.DOCTYPE_DTD:
              if (c === "]") {
                parser.doctype += c;
                parser.state = S.DOCTYPE;
              } else if (c === "<") {
                parser.state = S.OPEN_WAKA;
                parser.startTagPosition = parser.position;
              } else if (isQuote(c)) {
                parser.doctype += c;
                parser.state = S.DOCTYPE_DTD_QUOTED;
                parser.q = c;
              } else {
                parser.doctype += c;
              }
              continue;
            case S.DOCTYPE_DTD_QUOTED:
              parser.doctype += c;
              if (c === parser.q) {
                parser.state = S.DOCTYPE_DTD;
                parser.q = "";
              }
              continue;
            case S.COMMENT:
              if (c === "-") {
                parser.state = S.COMMENT_ENDING;
              } else {
                parser.comment += c;
              }
              continue;
            case S.COMMENT_ENDING:
              if (c === "-") {
                parser.state = S.COMMENT_ENDED;
                parser.comment = textopts(parser.opt, parser.comment);
                if (parser.comment) {
                  emitNode(parser, "oncomment", parser.comment);
                }
                parser.comment = "";
              } else {
                parser.comment += "-" + c;
                parser.state = S.COMMENT;
              }
              continue;
            case S.COMMENT_ENDED:
              if (c !== ">") {
                strictFail(parser, "Malformed comment");
                parser.comment += "--" + c;
                parser.state = S.COMMENT;
              } else if (parser.doctype && parser.doctype !== true) {
                parser.state = S.DOCTYPE_DTD;
              } else {
                parser.state = S.TEXT;
              }
              continue;
            case S.CDATA:
              var starti = i - 1;
              while (c && c !== "]") {
                c = charAt(chunk, i++);
                if (c && parser.trackPosition) {
                  parser.position++;
                  if (c === "\n") {
                    parser.line++;
                    parser.column = 0;
                  } else {
                    parser.column++;
                  }
                }
              }
              parser.cdata += chunk.substring(starti, i - 1);
              if (c === "]") {
                parser.state = S.CDATA_ENDING;
              }
              continue;
            case S.CDATA_ENDING:
              if (c === "]") {
                parser.state = S.CDATA_ENDING_2;
              } else {
                parser.cdata += "]" + c;
                parser.state = S.CDATA;
              }
              continue;
            case S.CDATA_ENDING_2:
              if (c === ">") {
                if (parser.cdata) {
                  emitNode(parser, "oncdata", parser.cdata);
                }
                emitNode(parser, "onclosecdata");
                parser.cdata = "";
                parser.state = S.TEXT;
              } else if (c === "]") {
                parser.cdata += "]";
              } else {
                parser.cdata += "]]" + c;
                parser.state = S.CDATA;
              }
              continue;
            case S.PROC_INST:
              if (c === "?") {
                parser.state = S.PROC_INST_ENDING;
              } else if (isWhitespace(c)) {
                parser.state = S.PROC_INST_BODY;
              } else {
                parser.procInstName += c;
              }
              continue;
            case S.PROC_INST_BODY:
              if (!parser.procInstBody && isWhitespace(c)) {
                continue;
              } else if (c === "?") {
                parser.state = S.PROC_INST_ENDING;
              } else {
                parser.procInstBody += c;
              }
              continue;
            case S.PROC_INST_ENDING:
              if (c === ">") {
                const procInstEndData = {
                  name: parser.procInstName,
                  body: parser.procInstBody
                };
                validateXmlDeclarationEncoding(parser, procInstEndData);
                emitNode(parser, "onprocessinginstruction", procInstEndData);
                parser.procInstName = parser.procInstBody = "";
                parser.state = S.TEXT;
              } else {
                parser.procInstBody += "?" + c;
                parser.state = S.PROC_INST_BODY;
              }
              continue;
            case S.OPEN_TAG:
              if (isMatch(nameBody, c)) {
                parser.tagName += c;
              } else {
                newTag(parser);
                if (c === ">") {
                  openTag(parser);
                } else if (c === "/") {
                  parser.state = S.OPEN_TAG_SLASH;
                } else {
                  if (!isWhitespace(c)) {
                    strictFail(parser, "Invalid character in tag name");
                  }
                  parser.state = S.ATTRIB;
                }
              }
              continue;
            case S.OPEN_TAG_SLASH:
              if (c === ">") {
                openTag(parser, true);
                closeTag(parser);
              } else {
                strictFail(
                  parser,
                  "Forward-slash in opening tag not followed by >"
                );
                parser.state = S.ATTRIB;
              }
              continue;
            case S.ATTRIB:
              if (isWhitespace(c)) {
                continue;
              } else if (c === ">") {
                openTag(parser);
              } else if (c === "/") {
                parser.state = S.OPEN_TAG_SLASH;
              } else if (isMatch(nameStart, c)) {
                parser.attribName = c;
                parser.attribValue = "";
                parser.state = S.ATTRIB_NAME;
              } else {
                strictFail(parser, "Invalid attribute name");
              }
              continue;
            case S.ATTRIB_NAME:
              if (c === "=") {
                parser.state = S.ATTRIB_VALUE;
              } else if (c === ">") {
                strictFail(parser, "Attribute without value");
                parser.attribValue = parser.attribName;
                attrib(parser);
                openTag(parser);
              } else if (isWhitespace(c)) {
                parser.state = S.ATTRIB_NAME_SAW_WHITE;
              } else if (isMatch(nameBody, c)) {
                parser.attribName += c;
              } else {
                strictFail(parser, "Invalid attribute name");
              }
              continue;
            case S.ATTRIB_NAME_SAW_WHITE:
              if (c === "=") {
                parser.state = S.ATTRIB_VALUE;
              } else if (isWhitespace(c)) {
                continue;
              } else {
                strictFail(parser, "Attribute without value");
                parser.tag.attributes[parser.attribName] = "";
                parser.attribValue = "";
                emitNode(parser, "onattribute", {
                  name: parser.attribName,
                  value: ""
                });
                parser.attribName = "";
                if (c === ">") {
                  openTag(parser);
                } else if (isMatch(nameStart, c)) {
                  parser.attribName = c;
                  parser.state = S.ATTRIB_NAME;
                } else {
                  strictFail(parser, "Invalid attribute name");
                  parser.state = S.ATTRIB;
                }
              }
              continue;
            case S.ATTRIB_VALUE:
              if (isWhitespace(c)) {
                continue;
              } else if (isQuote(c)) {
                parser.q = c;
                parser.state = S.ATTRIB_VALUE_QUOTED;
              } else {
                if (!parser.opt.unquotedAttributeValues) {
                  error(parser, "Unquoted attribute value");
                }
                parser.state = S.ATTRIB_VALUE_UNQUOTED;
                parser.attribValue = c;
              }
              continue;
            case S.ATTRIB_VALUE_QUOTED:
              if (c !== parser.q) {
                if (c === "&") {
                  parser.state = S.ATTRIB_VALUE_ENTITY_Q;
                } else {
                  parser.attribValue += c;
                }
                continue;
              }
              attrib(parser);
              parser.q = "";
              parser.state = S.ATTRIB_VALUE_CLOSED;
              continue;
            case S.ATTRIB_VALUE_CLOSED:
              if (isWhitespace(c)) {
                parser.state = S.ATTRIB;
              } else if (c === ">") {
                openTag(parser);
              } else if (c === "/") {
                parser.state = S.OPEN_TAG_SLASH;
              } else if (isMatch(nameStart, c)) {
                strictFail(parser, "No whitespace between attributes");
                parser.attribName = c;
                parser.attribValue = "";
                parser.state = S.ATTRIB_NAME;
              } else {
                strictFail(parser, "Invalid attribute name");
              }
              continue;
            case S.ATTRIB_VALUE_UNQUOTED:
              if (!isAttribEnd(c)) {
                if (c === "&") {
                  parser.state = S.ATTRIB_VALUE_ENTITY_U;
                } else {
                  parser.attribValue += c;
                }
                continue;
              }
              attrib(parser);
              if (c === ">") {
                openTag(parser);
              } else {
                parser.state = S.ATTRIB;
              }
              continue;
            case S.CLOSE_TAG:
              if (!parser.tagName) {
                if (isWhitespace(c)) {
                  continue;
                } else if (notMatch(nameStart, c)) {
                  if (parser.script) {
                    parser.script += "</" + c;
                    parser.state = S.SCRIPT;
                  } else {
                    strictFail(parser, "Invalid tagname in closing tag.");
                  }
                } else {
                  parser.tagName = c;
                }
              } else if (c === ">") {
                closeTag(parser);
              } else if (isMatch(nameBody, c)) {
                parser.tagName += c;
              } else if (parser.script) {
                parser.script += "</" + parser.tagName + c;
                parser.tagName = "";
                parser.state = S.SCRIPT;
              } else {
                if (!isWhitespace(c)) {
                  strictFail(parser, "Invalid tagname in closing tag");
                }
                parser.state = S.CLOSE_TAG_SAW_WHITE;
              }
              continue;
            case S.CLOSE_TAG_SAW_WHITE:
              if (isWhitespace(c)) {
                continue;
              }
              if (c === ">") {
                closeTag(parser);
              } else {
                strictFail(parser, "Invalid characters in closing tag");
              }
              continue;
            case S.TEXT_ENTITY:
            case S.ATTRIB_VALUE_ENTITY_Q:
            case S.ATTRIB_VALUE_ENTITY_U:
              var returnState;
              var buffer;
              switch (parser.state) {
                case S.TEXT_ENTITY:
                  returnState = S.TEXT;
                  buffer = "textNode";
                  break;
                case S.ATTRIB_VALUE_ENTITY_Q:
                  returnState = S.ATTRIB_VALUE_QUOTED;
                  buffer = "attribValue";
                  break;
                case S.ATTRIB_VALUE_ENTITY_U:
                  returnState = S.ATTRIB_VALUE_UNQUOTED;
                  buffer = "attribValue";
                  break;
              }
              if (c === ";") {
                var parsedEntity = parseEntity(parser);
                if (parser.opt.unparsedEntities && !Object.values(sax.XML_ENTITIES).includes(parsedEntity)) {
                  if ((parser.entityCount += 1) > parser.opt.maxEntityCount) {
                    error(
                      parser,
                      "Parsed entity count exceeds max entity count"
                    );
                  }
                  if ((parser.entityDepth += 1) > parser.opt.maxEntityDepth) {
                    error(
                      parser,
                      "Parsed entity depth exceeds max entity depth"
                    );
                  }
                  parser.entity = "";
                  parser.state = returnState;
                  parser.write(parsedEntity);
                  parser.entityDepth -= 1;
                } else {
                  parser[buffer] += parsedEntity;
                  parser.entity = "";
                  parser.state = returnState;
                }
              } else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
                parser.entity += c;
              } else {
                strictFail(parser, "Invalid character in entity name");
                parser[buffer] += "&" + parser.entity + c;
                parser.entity = "";
                parser.state = returnState;
              }
              continue;
            default: {
              throw new Error(parser, "Unknown state: " + parser.state);
            }
          }
        }
        if (parser.position >= parser.bufferCheckPosition) {
          checkBufferLength(parser);
        }
        return parser;
      }
      __name(write, "write");
      if (!String.fromCodePoint) {
        ;
        (function() {
          var stringFromCharCode = String.fromCharCode;
          var floor = Math.floor;
          var fromCodePoint = /* @__PURE__ */ __name(function() {
            var MAX_SIZE = 16384;
            var codeUnits = [];
            var highSurrogate;
            var lowSurrogate;
            var index = -1;
            var length = arguments.length;
            if (!length) {
              return "";
            }
            var result = "";
            while (++index < length) {
              var codePoint = Number(arguments[index]);
              if (!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
              codePoint < 0 || // not a valid Unicode code point
              codePoint > 1114111 || // not a valid Unicode code point
              floor(codePoint) !== codePoint) {
                throw RangeError("Invalid code point: " + codePoint);
              }
              if (codePoint <= 65535) {
                codeUnits.push(codePoint);
              } else {
                codePoint -= 65536;
                highSurrogate = (codePoint >> 10) + 55296;
                lowSurrogate = codePoint % 1024 + 56320;
                codeUnits.push(highSurrogate, lowSurrogate);
              }
              if (index + 1 === length || codeUnits.length > MAX_SIZE) {
                result += stringFromCharCode.apply(null, codeUnits);
                codeUnits.length = 0;
              }
            }
            return result;
          }, "fromCodePoint");
          if (Object.defineProperty) {
            Object.defineProperty(String, "fromCodePoint", {
              value: fromCodePoint,
              configurable: true,
              writable: true
            });
          } else {
            String.fromCodePoint = fromCodePoint;
          }
        })();
      }
    })(typeof exports2 === "undefined" ? exports2.sax = {} : exports2);
  }
});

// node_modules/xml2js/lib/bom.js
var require_bom = __commonJS({
  "node_modules/xml2js/lib/bom.js"(exports2) {
    (function() {
      "use strict";
      exports2.stripBOM = function(str) {
        if (str[0] === "\uFEFF") {
          return str.substring(1);
        } else {
          return str;
        }
      };
    }).call(exports2);
  }
});

// node_modules/xml2js/lib/processors.js
var require_processors = __commonJS({
  "node_modules/xml2js/lib/processors.js"(exports2) {
    (function() {
      "use strict";
      var prefixMatch;
      prefixMatch = new RegExp(/(?!xmlns)^.*:/);
      exports2.normalize = function(str) {
        return str.toLowerCase();
      };
      exports2.firstCharLowerCase = function(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
      };
      exports2.stripPrefix = function(str) {
        return str.replace(prefixMatch, "");
      };
      exports2.parseNumbers = function(str) {
        if (!isNaN(str)) {
          str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
        }
        return str;
      };
      exports2.parseBooleans = function(str) {
        if (/^(?:true|false)$/i.test(str)) {
          str = str.toLowerCase() === "true";
        }
        return str;
      };
    }).call(exports2);
  }
});

// node_modules/xml2js/lib/parser.js
var require_parser = __commonJS({
  "node_modules/xml2js/lib/parser.js"(exports2) {
    (function() {
      "use strict";
      var bom, defaults, events, isEmpty, processItem, processors, sax, setImmediate2, bind = /* @__PURE__ */ __name(function(fn, me) {
        return function() {
          return fn.apply(me, arguments);
        };
      }, "bind"), extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      sax = require_sax();
      events = require("events");
      bom = require_bom();
      processors = require_processors();
      setImmediate2 = require("timers").setImmediate;
      defaults = require_defaults().defaults;
      isEmpty = /* @__PURE__ */ __name(function(thing) {
        return typeof thing === "object" && thing != null && Object.keys(thing).length === 0;
      }, "isEmpty");
      processItem = /* @__PURE__ */ __name(function(processors2, item, key) {
        var i, len, process2;
        for (i = 0, len = processors2.length; i < len; i++) {
          process2 = processors2[i];
          item = process2(item, key);
        }
        return item;
      }, "processItem");
      exports2.Parser = (function(superClass) {
        extend(Parser, superClass);
        function Parser(opts) {
          this.parseStringPromise = bind(this.parseStringPromise, this);
          this.parseString = bind(this.parseString, this);
          this.reset = bind(this.reset, this);
          this.assignOrPush = bind(this.assignOrPush, this);
          this.processAsync = bind(this.processAsync, this);
          var key, ref, value;
          if (!(this instanceof exports2.Parser)) {
            return new exports2.Parser(opts);
          }
          this.options = {};
          ref = defaults["0.2"];
          for (key in ref) {
            if (!hasProp.call(ref, key)) continue;
            value = ref[key];
            this.options[key] = value;
          }
          for (key in opts) {
            if (!hasProp.call(opts, key)) continue;
            value = opts[key];
            this.options[key] = value;
          }
          if (this.options.xmlns) {
            this.options.xmlnskey = this.options.attrkey + "ns";
          }
          if (this.options.normalizeTags) {
            if (!this.options.tagNameProcessors) {
              this.options.tagNameProcessors = [];
            }
            this.options.tagNameProcessors.unshift(processors.normalize);
          }
          this.reset();
        }
        __name(Parser, "Parser");
        Parser.prototype.processAsync = function() {
          var chunk, err;
          try {
            if (this.remaining.length <= this.options.chunkSize) {
              chunk = this.remaining;
              this.remaining = "";
              this.saxParser = this.saxParser.write(chunk);
              return this.saxParser.close();
            } else {
              chunk = this.remaining.substr(0, this.options.chunkSize);
              this.remaining = this.remaining.substr(this.options.chunkSize, this.remaining.length);
              this.saxParser = this.saxParser.write(chunk);
              return setImmediate2(this.processAsync);
            }
          } catch (error1) {
            err = error1;
            if (!this.saxParser.errThrown) {
              this.saxParser.errThrown = true;
              return this.emit(err);
            }
          }
        };
        Parser.prototype.assignOrPush = function(obj, key, newValue) {
          if (!(key in obj)) {
            if (!this.options.explicitArray) {
              return obj[key] = newValue;
            } else {
              return obj[key] = [newValue];
            }
          } else {
            if (!(obj[key] instanceof Array)) {
              obj[key] = [obj[key]];
            }
            return obj[key].push(newValue);
          }
        };
        Parser.prototype.reset = function() {
          var attrkey, charkey, ontext, stack;
          this.removeAllListeners();
          this.saxParser = sax.parser(this.options.strict, {
            trim: false,
            normalize: false,
            xmlns: this.options.xmlns
          });
          this.saxParser.errThrown = false;
          this.saxParser.onerror = /* @__PURE__ */ (function(_this) {
            return function(error) {
              _this.saxParser.resume();
              if (!_this.saxParser.errThrown) {
                _this.saxParser.errThrown = true;
                return _this.emit("error", error);
              }
            };
          })(this);
          this.saxParser.onend = /* @__PURE__ */ (function(_this) {
            return function() {
              if (!_this.saxParser.ended) {
                _this.saxParser.ended = true;
                return _this.emit("end", _this.resultObject);
              }
            };
          })(this);
          this.saxParser.ended = false;
          this.EXPLICIT_CHARKEY = this.options.explicitCharkey;
          this.resultObject = null;
          stack = [];
          attrkey = this.options.attrkey;
          charkey = this.options.charkey;
          this.saxParser.onopentag = /* @__PURE__ */ (function(_this) {
            return function(node) {
              var key, newValue, obj, processedKey, ref;
              obj = {};
              obj[charkey] = "";
              if (!_this.options.ignoreAttrs) {
                ref = node.attributes;
                for (key in ref) {
                  if (!hasProp.call(ref, key)) continue;
                  if (!(attrkey in obj) && !_this.options.mergeAttrs) {
                    obj[attrkey] = {};
                  }
                  newValue = _this.options.attrValueProcessors ? processItem(_this.options.attrValueProcessors, node.attributes[key], key) : node.attributes[key];
                  processedKey = _this.options.attrNameProcessors ? processItem(_this.options.attrNameProcessors, key) : key;
                  if (_this.options.mergeAttrs) {
                    _this.assignOrPush(obj, processedKey, newValue);
                  } else {
                    obj[attrkey][processedKey] = newValue;
                  }
                }
              }
              obj["#name"] = _this.options.tagNameProcessors ? processItem(_this.options.tagNameProcessors, node.name) : node.name;
              if (_this.options.xmlns) {
                obj[_this.options.xmlnskey] = {
                  uri: node.uri,
                  local: node.local
                };
              }
              return stack.push(obj);
            };
          })(this);
          this.saxParser.onclosetag = /* @__PURE__ */ (function(_this) {
            return function() {
              var cdata, emptyStr, key, node, nodeName, obj, objClone, old, s, xpath;
              obj = stack.pop();
              nodeName = obj["#name"];
              if (!_this.options.explicitChildren || !_this.options.preserveChildrenOrder) {
                delete obj["#name"];
              }
              if (obj.cdata === true) {
                cdata = obj.cdata;
                delete obj.cdata;
              }
              s = stack[stack.length - 1];
              if (obj[charkey].match(/^\s*$/) && !cdata) {
                emptyStr = obj[charkey];
                delete obj[charkey];
              } else {
                if (_this.options.trim) {
                  obj[charkey] = obj[charkey].trim();
                }
                if (_this.options.normalize) {
                  obj[charkey] = obj[charkey].replace(/\s{2,}/g, " ").trim();
                }
                obj[charkey] = _this.options.valueProcessors ? processItem(_this.options.valueProcessors, obj[charkey], nodeName) : obj[charkey];
                if (Object.keys(obj).length === 1 && charkey in obj && !_this.EXPLICIT_CHARKEY) {
                  obj = obj[charkey];
                }
              }
              if (isEmpty(obj)) {
                obj = _this.options.emptyTag !== "" ? _this.options.emptyTag : emptyStr;
              }
              if (_this.options.validator != null) {
                xpath = "/" + (function() {
                  var i, len, results;
                  results = [];
                  for (i = 0, len = stack.length; i < len; i++) {
                    node = stack[i];
                    results.push(node["#name"]);
                  }
                  return results;
                })().concat(nodeName).join("/");
                (function() {
                  var err;
                  try {
                    return obj = _this.options.validator(xpath, s && s[nodeName], obj);
                  } catch (error1) {
                    err = error1;
                    return _this.emit("error", err);
                  }
                })();
              }
              if (_this.options.explicitChildren && !_this.options.mergeAttrs && typeof obj === "object") {
                if (!_this.options.preserveChildrenOrder) {
                  node = {};
                  if (_this.options.attrkey in obj) {
                    node[_this.options.attrkey] = obj[_this.options.attrkey];
                    delete obj[_this.options.attrkey];
                  }
                  if (!_this.options.charsAsChildren && _this.options.charkey in obj) {
                    node[_this.options.charkey] = obj[_this.options.charkey];
                    delete obj[_this.options.charkey];
                  }
                  if (Object.getOwnPropertyNames(obj).length > 0) {
                    node[_this.options.childkey] = obj;
                  }
                  obj = node;
                } else if (s) {
                  s[_this.options.childkey] = s[_this.options.childkey] || [];
                  objClone = {};
                  for (key in obj) {
                    if (!hasProp.call(obj, key)) continue;
                    objClone[key] = obj[key];
                  }
                  s[_this.options.childkey].push(objClone);
                  delete obj["#name"];
                  if (Object.keys(obj).length === 1 && charkey in obj && !_this.EXPLICIT_CHARKEY) {
                    obj = obj[charkey];
                  }
                }
              }
              if (stack.length > 0) {
                return _this.assignOrPush(s, nodeName, obj);
              } else {
                if (_this.options.explicitRoot) {
                  old = obj;
                  obj = {};
                  obj[nodeName] = old;
                }
                _this.resultObject = obj;
                _this.saxParser.ended = true;
                return _this.emit("end", _this.resultObject);
              }
            };
          })(this);
          ontext = /* @__PURE__ */ (function(_this) {
            return function(text) {
              var charChild, s;
              s = stack[stack.length - 1];
              if (s) {
                s[charkey] += text;
                if (_this.options.explicitChildren && _this.options.preserveChildrenOrder && _this.options.charsAsChildren && (_this.options.includeWhiteChars || text.replace(/\\n/g, "").trim() !== "")) {
                  s[_this.options.childkey] = s[_this.options.childkey] || [];
                  charChild = {
                    "#name": "__text__"
                  };
                  charChild[charkey] = text;
                  if (_this.options.normalize) {
                    charChild[charkey] = charChild[charkey].replace(/\s{2,}/g, " ").trim();
                  }
                  s[_this.options.childkey].push(charChild);
                }
                return s;
              }
            };
          })(this);
          this.saxParser.ontext = ontext;
          return this.saxParser.oncdata = /* @__PURE__ */ (function(_this) {
            return function(text) {
              var s;
              s = ontext(text);
              if (s) {
                return s.cdata = true;
              }
            };
          })(this);
        };
        Parser.prototype.parseString = function(str, cb) {
          var err;
          if (cb != null && typeof cb === "function") {
            this.on("end", function(result) {
              this.reset();
              return cb(null, result);
            });
            this.on("error", function(err2) {
              this.reset();
              return cb(err2);
            });
          }
          try {
            str = str.toString();
            if (str.trim() === "") {
              this.emit("end", null);
              return true;
            }
            str = bom.stripBOM(str);
            if (this.options.async) {
              this.remaining = str;
              setImmediate2(this.processAsync);
              return this.saxParser;
            }
            return this.saxParser.write(str).close();
          } catch (error1) {
            err = error1;
            if (!(this.saxParser.errThrown || this.saxParser.ended)) {
              this.emit("error", err);
              return this.saxParser.errThrown = true;
            } else if (this.saxParser.ended) {
              throw err;
            }
          }
        };
        Parser.prototype.parseStringPromise = function(str) {
          return new Promise(/* @__PURE__ */ (function(_this) {
            return function(resolve, reject) {
              return _this.parseString(str, function(err, value) {
                if (err) {
                  return reject(err);
                } else {
                  return resolve(value);
                }
              });
            };
          })(this));
        };
        return Parser;
      })(events);
      exports2.parseString = function(str, a, b) {
        var cb, options, parser;
        if (b != null) {
          if (typeof b === "function") {
            cb = b;
          }
          if (typeof a === "object") {
            options = a;
          }
        } else {
          if (typeof a === "function") {
            cb = a;
          }
          options = {};
        }
        parser = new exports2.Parser(options);
        return parser.parseString(str, cb);
      };
      exports2.parseStringPromise = function(str, a) {
        var options, parser;
        if (typeof a === "object") {
          options = a;
        }
        parser = new exports2.Parser(options);
        return parser.parseStringPromise(str);
      };
    }).call(exports2);
  }
});

// node_modules/xml2js/lib/xml2js.js
var require_xml2js = __commonJS({
  "node_modules/xml2js/lib/xml2js.js"(exports2) {
    (function() {
      "use strict";
      var builder, defaults, parser, processors, extend = /* @__PURE__ */ __name(function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        __name(ctor, "ctor");
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, "extend"), hasProp = {}.hasOwnProperty;
      defaults = require_defaults();
      builder = require_builder();
      parser = require_parser();
      processors = require_processors();
      exports2.defaults = defaults.defaults;
      exports2.processors = processors;
      exports2.ValidationError = (function(superClass) {
        extend(ValidationError, superClass);
        function ValidationError(message) {
          this.message = message;
        }
        __name(ValidationError, "ValidationError");
        return ValidationError;
      })(Error);
      exports2.Builder = builder.Builder;
      exports2.Parser = parser.Parser;
      exports2.parseString = parser.parseString;
      exports2.parseStringPromise = parser.parseStringPromise;
    }).call(exports2);
  }
});

// node_modules/dbus-next/lib/client/proxy-interface.js
var require_proxy_interface = __commonJS({
  "node_modules/dbus-next/lib/client/proxy-interface.js"(exports2, module2) {
    var EventEmitter = require("events");
    var {
      isInterfaceNameValid,
      isMemberNameValid
    } = require_validators();
    var ProxyListener = class {
      static {
        __name(this, "ProxyListener");
      }
      constructor(signal, iface) {
        this.refcount = 0;
        this.fn = (msg) => {
          const { body, signature, sender } = msg;
          if (iface.$object.bus._nameOwners[iface.$object.name] !== sender) {
            return;
          }
          if (signature !== signal.signature) {
            console.error(`warning: got signature ${signature} for signal ${msg.interface}.${signal.name} (expected ${signal.signature})`);
            return;
          }
          iface.emit.apply(iface, [signal.name].concat(body));
        };
      }
    };
    var ProxyInterface = class _ProxyInterface extends EventEmitter {
      static {
        __name(this, "ProxyInterface");
      }
      /**
       * Create a new `ProxyInterface`. This constructor should not be called
       * directly. Use {@link ProxyObject#getInterface} to get a proxy interface.
       */
      constructor(name, object) {
        super();
        this.$name = name;
        this.$object = object;
        this.$properties = [];
        this.$methods = [];
        this.$signals = [];
        this.$listeners = {};
        const getEventDetails = /* @__PURE__ */ __name((eventName) => {
          const signal = this.$signals.find((s) => s.name === eventName);
          if (!signal) {
            return [null, null];
          }
          const detailedEvent = JSON.stringify({
            path: this.$object.path,
            interface: this.$name,
            member: eventName
          });
          return [signal, detailedEvent];
        }, "getEventDetails");
        this.on("removeListener", (eventName, listener) => {
          const [signal, detailedEvent] = getEventDetails(eventName);
          if (!signal) {
            return;
          }
          const proxyListener = this._getEventListener(signal);
          if (proxyListener.refcount <= 0) {
            return;
          }
          proxyListener.refcount -= 1;
          if (proxyListener.refcount > 0) {
            return;
          }
          this.$object.bus._removeMatch(this._signalMatchRuleString(eventName)).catch((error) => {
            this.$object.bus.emit("error", error);
          });
          this.$object.bus._signals.removeListener(detailedEvent, proxyListener.fn);
        });
        this.on("newListener", (eventName, listener) => {
          const [signal, detailedEvent] = getEventDetails(eventName);
          if (!signal) {
            return;
          }
          const proxyListener = this._getEventListener(signal);
          if (proxyListener.refcount > 0) {
            proxyListener.refcount += 1;
            return;
          }
          proxyListener.refcount = 1;
          this.$object.bus._addMatch(this._signalMatchRuleString(eventName)).catch((error) => {
            this.$object.bus.emit("error", error);
          });
          this.$object.bus._signals.on(detailedEvent, proxyListener.fn);
        });
      }
      _signalMatchRuleString(eventName) {
        return `type='signal',sender=${this.$object.name},interface='${this.$name}',path='${this.$object.path}',member='${eventName}'`;
      }
      _getEventListener(signal) {
        if (this.$listeners[signal.name]) {
          return this.$listeners[signal.name];
        }
        this.$listeners[signal.name] = new ProxyListener(signal, this);
        return this.$listeners[signal.name];
      }
      static _fromXml(object, xml) {
        if (!("$" in xml) || !isInterfaceNameValid(xml.$.name)) {
          return null;
        }
        const name = xml.$.name;
        const iface = new _ProxyInterface(name, object);
        if (Array.isArray(xml.property)) {
          for (const p of xml.property) {
            if ("$" in p) {
              iface.$properties.push(p.$);
            }
          }
        }
        if (Array.isArray(xml.signal)) {
          for (const s of xml.signal) {
            if (!("$" in s) || !isMemberNameValid(s.$.name)) {
              continue;
            }
            const signal = {
              name: s.$.name,
              signature: ""
            };
            if (Array.isArray(s.arg)) {
              for (const a of s.arg) {
                if ("$" in a && "type" in a.$) {
                  signal.signature += a.$.type;
                }
              }
            }
            iface.$signals.push(signal);
          }
        }
        if (Array.isArray(xml.method)) {
          for (const m of xml.method) {
            if (!("$" in m) || !isMemberNameValid(m.$.name)) {
              continue;
            }
            const method = {
              name: m.$.name,
              inSignature: "",
              outSignature: ""
            };
            if (Array.isArray(m.arg)) {
              for (const a of m.arg) {
                if (!("$" in a) || typeof a.$.type !== "string") {
                  continue;
                }
                const arg = a.$;
                if (arg.direction === "in") {
                  method.inSignature += arg.type;
                } else if (arg.direction === "out") {
                  method.outSignature += arg.type;
                }
              }
            }
            iface.$methods.push(method);
            iface[method.name] = function(...args) {
              const objArgs = [
                name,
                method.name,
                method.inSignature,
                method.outSignature
              ].concat(args);
              return object._callMethod.apply(object, objArgs);
            };
          }
        }
        return iface;
      }
    };
    module2.exports = ProxyInterface;
  }
});

// node_modules/dbus-next/lib/client/proxy-object.js
var require_proxy_object = __commonJS({
  "node_modules/dbus-next/lib/client/proxy-object.js"(exports2, module2) {
    var xml2js = require_xml2js();
    var { parseSignature } = require_signature();
    var ProxyInterface = require_proxy_interface();
    var { Message } = require_message_type();
    var {
      assertBusNameValid,
      assertObjectPathValid,
      isObjectPathValid
    } = require_validators();
    var ProxyObject = class {
      static {
        __name(this, "ProxyObject");
      }
      /**
       * Create a new `ProxyObject`. This constructor should not be called
       * directly. Use {@link MessageBus#getProxyObject} to get a proxy object.
       */
      constructor(bus, name, path2) {
        assertBusNameValid(name);
        assertObjectPathValid(path2);
        this.bus = bus;
        this.name = name;
        this.path = path2;
        this.nodes = [];
        this.interfaces = {};
        this._parser = new xml2js.Parser();
      }
      /**
       * Get a {@link ProxyInterface} for the given interface name.
       *
       * @param name {string} - the interface name to get.
       * @returns {ProxyInterface} - the proxy interface with this name exported by
       * the object or `undefined` if the object does not export an interface with
       * that name.
       * @throws {Error} Throws an error if the interface is not found on this object.
       */
      getInterface(name) {
        if (!Object.keys(this.interfaces).includes(name)) {
          throw new Error(`interface not found in proxy object: ${name}`);
        }
        return this.interfaces[name];
      }
      _initXml(xml) {
        const root = xml.node;
        if (Array.isArray(root.node)) {
          for (const n of root.node) {
            if (!("$" in n)) {
              continue;
            }
            const name = n.$.name;
            const path2 = `${this.path}/${name}`;
            if (isObjectPathValid(path2)) {
              this.nodes.push(path2);
            }
          }
        }
        if (Array.isArray(root.interface)) {
          for (const i of root.interface) {
            const iface = ProxyInterface._fromXml(this, i);
            if (iface !== null) {
              this.interfaces[iface.$name] = iface;
            }
          }
        }
      }
      _init(xml) {
        return new Promise((resolve, reject) => {
          if (xml) {
            this._parser.parseString(xml, (err, data) => {
              if (err) {
                return reject(err);
              }
              this._initXml(data);
              resolve(this);
            });
          } else {
            const introspectMessage = new Message({
              destination: this.name,
              path: this.path,
              interface: "org.freedesktop.DBus.Introspectable",
              member: "Introspect",
              signature: "",
              body: []
            });
            this.bus.call(introspectMessage).then((msg) => {
              const xml2 = msg.body[0];
              this._parser.parseString(xml2, (err, data) => {
                if (err) {
                  return reject(err);
                }
                this._initXml(data);
                resolve(this);
              });
            }).catch((err) => {
              return reject(err);
            });
          }
        });
      }
      _callMethod(iface, member, inSignature, outSignature, ...args) {
        return new Promise((resolve, reject) => {
          args = args || [];
          const methodCallMessage = new Message({
            destination: this.name,
            interface: iface,
            path: this.path,
            member,
            signature: inSignature,
            body: args
          });
          this.bus.call(methodCallMessage).then((msg) => {
            const outSignatureTree = parseSignature(outSignature);
            if (outSignatureTree.length === 0) {
              resolve(null);
              return;
            }
            if (outSignatureTree.length === 1) {
              resolve(msg.body[0]);
            } else {
              resolve(msg.body);
            }
          }).catch((err) => {
            return reject(err);
          });
        });
      }
    };
    module2.exports = ProxyObject;
  }
});

// node_modules/dbus-next/lib/bus.js
var require_bus = __commonJS({
  "node_modules/dbus-next/lib/bus.js"(exports2, module2) {
    var EventEmitter = require("events").EventEmitter;
    var constants = require_constants2();
    var handleMethod = require_handlers();
    var { DBusError } = require_errors();
    var { Message } = require_message_type();
    var ServiceObject = require_object();
    var xml2js = require_xml2js();
    var {
      METHOD_CALL,
      METHOD_RETURN,
      ERROR,
      SIGNAL
    } = constants.MessageType;
    var {
      NO_REPLY_EXPECTED
    } = constants.MessageFlag;
    var {
      assertBusNameValid,
      assertObjectPathValid
    } = require_validators();
    var ProxyObject = require_proxy_object();
    var xmlHeader = '<!DOCTYPE node PUBLIC "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN" "http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd">\n';
    var MessageBus = class extends EventEmitter {
      static {
        __name(this, "MessageBus");
      }
      /**
       * Create a new `MessageBus`. This constructor is not to be called directly.
       * Use `dbus.sessionBus()` or `dbus.systemBus()` to set up the connection to
        * the bus.
       */
      constructor(conn) {
        super();
        this._builder = new xml2js.Builder({ headless: true });
        this._connection = conn;
        this._serial = 1;
        this._methodReturnHandlers = {};
        this._signals = new EventEmitter();
        this._nameOwners = {};
        this._methodHandlers = [];
        this._serviceObjects = {};
        this._matchRules = {};
        this.name = null;
        const handleMessage = /* @__PURE__ */ __name((msg) => {
          if (this.name && msg.destination) {
            if (msg.destination[0] === ":" && msg.destination !== this.name) {
              return;
            }
            if (this._nameOwners[msg.destination] && this._nameOwners[msg.destination] !== this.name) {
              return;
            }
          }
          if (msg.type === METHOD_RETURN || msg.type === ERROR) {
            const handler = this._methodReturnHandlers[msg.replySerial];
            if (handler) {
              delete this._methodReturnHandlers[msg.replySerial];
              handler(msg);
            }
          } else if (msg.type === SIGNAL) {
            const { sender, path: path2, iface, member } = msg;
            if (sender === "org.freedesktop.DBus" && path2 === "/org/freedesktop/DBus" && iface === "org.freedesktop.DBus" && member === "NameOwnerChanged") {
              const name = msg.body[0];
              const newOwner = msg.body[2];
              if (!name.startsWith(":")) {
                this._nameOwners[name] = newOwner;
              }
            }
            const mangled = JSON.stringify({
              path: msg.path,
              interface: msg.interface,
              member: msg.member
            });
            this._signals.emit(mangled, msg);
          } else {
            let handled = false;
            for (const handler of this._methodHandlers) {
              handled = handler(msg);
              if (handled) {
                break;
              }
            }
            if (!handled) {
              handled = handleMethod(msg, this);
            }
            if (!handled) {
              this.send(Message.newError(
                msg,
                "org.freedesktop.DBus.Error.UnknownMethod",
                `Method '${msg.member}' on interface '${msg.interface || "(none)"}' does not exist`
              ));
            }
          }
        }, "handleMessage");
        conn.on("message", (msg) => {
          try {
            this.emit("message", msg);
            handleMessage(msg);
          } catch (e) {
            this.send(Message.newError(msg, "com.github.dbus_next.Error", `The DBus library encountered an error.
${e.stack}`));
          }
        });
        conn.on("error", (err) => {
          this.emit("error", err);
        });
        const helloMessage = new Message({
          path: "/org/freedesktop/DBus",
          destination: "org.freedesktop.DBus",
          interface: "org.freedesktop.DBus",
          member: "Hello"
        });
        this.call(helloMessage).then((msg) => {
          this.name = msg.body[0];
          this.emit("connect");
        }).catch((err) => {
          this.emit("error", err);
          throw new Error(err);
        });
      }
      /**
       * Get a {@link ProxyObject} on the bus for the given name and path for interacting
       * with a service as a client. The proxy object contains a list of the
       * [`ProxyInterface`s]{@link ProxyInterface} exported at the name and object path as well as a list
       * of `node`s.
       *
       * @param name {string} - the well-known name on the bus.
       * @param path {string} - the object path exported on the name.
       * @param [xml] {string} - xml introspection data.
       * @returns {Promise} - a Promise that resolves with the `ProxyObject`.
       */
      getProxyObject(name, path2, xml) {
        const obj = new ProxyObject(this, name, path2);
        return obj._init(xml);
      }
      /**
       * Request a well-known name on the bus.
       *
       * @see {@link https://dbus.freedesktop.org/doc/dbus-specification.html#bus-messages-request-name}
       *
       * @param name {string} - the well-known name on the bus to request.
       * @param flags {NameFlag} - DBus name flags which affect the behavior of taking the name.
       * @returns {Promise} - a Promise that resolves with the {@link RequestNameReply}.
       */
      requestName(name, flags) {
        flags = flags || 0;
        return new Promise((resolve, reject) => {
          assertBusNameValid(name);
          const requestNameMessage = new Message({
            path: "/org/freedesktop/DBus",
            destination: "org.freedesktop.DBus",
            interface: "org.freedesktop.DBus",
            member: "RequestName",
            signature: "su",
            body: [name, flags]
          });
          this.call(requestNameMessage).then((msg) => {
            return resolve(msg.body[0]);
          }).catch((err) => {
            return reject(err);
          });
        });
      }
      /**
       * Release this name. Requests that the name should no longer be owned by the
       * {@link MessageBus}.
       *
       * @returns {Promise} A Promise that will resolve with the {@link ReleaseNameReply}.
       */
      releaseName(name) {
        return new Promise((resolve, reject) => {
          const msg = new Message({
            path: "/org/freedesktop/DBus",
            destination: "org.freedesktop.DBus",
            interface: "org.freedesktop.DBus",
            member: "ReleaseName",
            signature: "s",
            body: [name]
          });
          this.call(msg).then((reply) => {
            return resolve(reply.body[0]);
          }).catch((err) => {
            return reject(err);
          });
        });
      }
      /**
       * Disconnect this `MessageBus` from the bus.
       */
      disconnect() {
        this._connection.stream.end();
        this._signals.removeAllListeners();
      }
      /**
       * Get a new serial for this bus. These can be used to set the {@link
       * Message#serial} member to send the message on this bus.
       *
       * @returns {int} - A new serial for this bus.
       */
      newSerial() {
        return this._serial++;
      }
      /**
       * A function to call when a message of type {@link MessageType.METHOD_RETURN} is received. User handlers are run before
       * default handlers.
       *
       * @callback methodHandler
       * @param {Message} msg - The message to handle.
       * @returns {boolean} Return `true` if the message is handled and no further
       * handlers will run.
       */
      /**
       * Add a user method return handler. Remove the handler with {@link
       * MessageBus#removeMethodHandler}
       *
       * @param {methodHandler} - A function to handle a {@link Message} of type
       * {@link MessageType.METHOD_RETURN}. Takes the `Message` as the first
        * argument. Return `true` if the method is handled and no further handlers
        * will run.
       */
      addMethodHandler(fn) {
        this._methodHandlers.push(fn);
      }
      /**
       * Remove a user method return handler that was previously added with {@link
       * MessageBus#addMethodHandler}.
       *
       * @param {methodHandler} - A function that was previously added as a method handler.
       */
      removeMethodHandler(fn) {
        for (let i = 0; i < this._methodHandlers.length; ++i) {
          if (this._methodHandlers[i] === fn) {
            this._methodHandlers.splice(i, 1);
          }
        }
      }
      /**
       * Send a {@link Message} of type {@link MessageType.METHOD_CALL} to the bus
       * and wait for the reply.
       *
       * @example
       * let message = new Message({
       *   destination: 'org.freedesktop.DBus',
       *   path: '/org/freedesktop/DBus',
       *   interface: 'org.freedesktop.DBus',
       *   member: 'ListNames'
       * });
       * let reply = await bus.call(message);
       *
       * @param {Message} msg - The message to send.
       * @returns {Promise} reply - A `Promise` that resolves to the {@link
       * Message} which is a reply to the call.
       */
      call(msg) {
        return new Promise((resolve, reject) => {
          if (!(msg instanceof Message)) {
            throw new Error("The call() method takes a Message class as the first argument.");
          }
          if (msg.type !== METHOD_CALL) {
            throw new Error("Only messages of type METHOD_CALL can expect a call reply.");
          }
          if (msg.serial === null || msg._sent) {
            msg.serial = this.newSerial();
          }
          msg._sent = true;
          if (msg.flags & NO_REPLY_EXPECTED) {
            resolve(null);
          } else {
            this._methodReturnHandlers[msg.serial] = (reply) => {
              this._nameOwners[msg.destination] = reply.sender;
              if (reply.type === ERROR) {
                return reject(new DBusError(reply.errorName, reply.body[0], reply));
              } else {
                return resolve(reply);
              }
            };
          }
          this._connection.message(msg);
        });
      }
      /**
       * Send a {@link Message} on the bus that does not expect a reply.
       *
       * @example
       * let message = Message.newSignal('/org/test/path/,
       *                                 'org.test.interface',
       *                                 'SomeSignal');
       * bus.send(message);
       *
       * @param {Message} msg - The message to send.
       */
      send(msg) {
        if (!(msg instanceof Message)) {
          throw new Error("The send() method takes a Message class as the first argument.");
        }
        if (msg.serial === null || msg._sent) {
          msg.serial = this.newSerial();
        }
        this._connection.message(msg);
      }
      /**
       * Export an [`Interface`]{@link module:interface~Interface} on the bus. See
       * the documentation for that class for how to define service interfaces.
       *
       * @param path {string} - The object path to export this `Interface` on.
       * @param iface {module:interface~Interface} - The service interface to export.
       */
      export(path2, iface) {
        const obj = this._getServiceObject(path2);
        obj.addInterface(iface);
      }
      /**
       * Unexport an `Interface` on the bus. The interface will no longer be
       * advertised to clients.
       *
       * @param {string} path - The object path on which to unexport.
       * @param {module:interface~Interface} [iface] - The `Interface` to unexport.
       * If not given, this will remove all interfaces on the path.
       */
      unexport(path2, iface) {
        iface = iface || null;
        if (iface === null) {
          this._removeServiceObject(path2);
        } else {
          const obj = this._getServiceObject(path2);
          obj.removeInterface(iface);
          if (!obj.interfaces.length) {
            this._removeServiceObject(path2);
          }
        }
      }
      _introspect(path2) {
        assertObjectPathValid(path2);
        const xml = {
          node: {
            node: []
          }
        };
        if (this._serviceObjects[path2]) {
          xml.node.interface = this._serviceObjects[path2].introspect();
        }
        const pathSplit = path2.split("/").filter((n) => n);
        const children2 = /* @__PURE__ */ new Set();
        for (const key of Object.keys(this._serviceObjects)) {
          const keySplit = key.split("/").filter((n) => n);
          if (keySplit.length <= pathSplit.length) {
            continue;
          }
          if (pathSplit.every((v, i) => v === keySplit[i])) {
            children2.add(keySplit[pathSplit.length]);
          }
        }
        for (const child of children2) {
          xml.node.node.push({
            $: {
              name: child
            }
          });
        }
        return xmlHeader + this._builder.buildObject(xml);
      }
      _getServiceObject(path2) {
        assertObjectPathValid(path2);
        if (!this._serviceObjects[path2]) {
          this._serviceObjects[path2] = new ServiceObject(path2, this);
        }
        return this._serviceObjects[path2];
      }
      _removeServiceObject(path2) {
        assertObjectPathValid(path2);
        if (this._serviceObjects[path2]) {
          const obj = this._serviceObjects[path2];
          for (const i of Object.keys(obj.interfaces)) {
            obj.removeInterface(obj.interfaces[i]);
          }
          delete this._serviceObjects[path2];
        }
      }
      _addMatch(match) {
        if (Object.prototype.hasOwnProperty.call(match, this._matchRules)) {
          this._matchRules[match] += 1;
          return Promise.resolve();
        }
        this._matchRules[match] = 1;
        const msg = new Message({
          path: "/org/freedesktop/DBus",
          destination: "org.freedesktop.DBus",
          interface: "org.freedesktop.DBus",
          member: "AddMatch",
          signature: "s",
          body: [match]
        });
        return this.call(msg);
      }
      _removeMatch(match) {
        if (!this._connection.stream.writable) {
          return Promise.resolve();
        }
        if (Object.prototype.hasOwnProperty.call(match, this._matchRules)) {
          this._matchRules[match] -= 1;
          if (this._matchRules[match] > 0) {
            return Promise.resolve();
          }
        } else {
          return Promise.resolve();
        }
        delete this._matchRules[match];
        const msg = new Message({
          path: "/org/freedesktop/DBus",
          destination: "org.freedesktop.DBus",
          interface: "org.freedesktop.DBus",
          member: "RemoveMatch",
          signature: "s",
          body: [match]
        });
        return this.call(msg);
      }
    };
    module2.exports = MessageBus;
  }
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports2, module2) {
    var buffer = require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    __name(copyProps, "copyProps");
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module2.exports = buffer;
    } else {
      copyProps(buffer, exports2);
      exports2.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    __name(SafeBuffer, "SafeBuffer");
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/@nornagon/put/index.js
var require_put = __commonJS({
  "node_modules/@nornagon/put/index.js"(exports2, module2) {
    module2.exports = Put;
    function Put() {
      if (!(this instanceof Put)) return new Put();
      var words = [];
      var len = 0;
      this.put = function(buf) {
        words.push({ buffer: buf });
        len += buf.length;
        return this;
      };
      this.word8 = function(x) {
        words.push({ bytes: 1, value: x });
        len += 1;
        return this;
      };
      this.floatle = function(x) {
        words.push({ bytes: "float", endian: "little", value: x });
        len += 4;
        return this;
      };
      [8, 16, 24, 32, 64].forEach((function(bits) {
        this["word" + bits + "be"] = function(x) {
          words.push({ endian: "big", bytes: bits / 8, value: x });
          len += bits / 8;
          return this;
        };
        this["word" + bits + "le"] = function(x) {
          words.push({ endian: "little", bytes: bits / 8, value: x });
          len += bits / 8;
          return this;
        };
      }).bind(this));
      this.pad = function(bytes) {
        words.push({ endian: "big", bytes, value: 0 });
        len += bytes;
        return this;
      };
      this.length = function() {
        return len;
      };
      this.buffer = function() {
        var buf = Buffer.alloc(len);
        var offset = 0;
        words.forEach(function(word) {
          if (word.buffer) {
            word.buffer.copy(buf, offset, 0);
            offset += word.buffer.length;
          } else if (word.bytes == "float") {
            var v = Math.abs(word.value);
            var s = (word.value >= 0) * 1;
            var e = Math.ceil(Math.log(v) / Math.LN2);
            var f = v / (1 << e);
            console.dir([s, e, f]);
            console.log(word.value);
            buf[offset++] = s << 7 & ~~(e / 2);
            buf[offset++] = (e & 1) << 7 & ~~(f / (1 << 16));
            buf[offset++] = 0;
            buf[offset++] = 0;
            offset += 4;
          } else {
            var big = word.endian === "big";
            var ix = big ? [(word.bytes - 1) * 8, -8] : [0, 8];
            for (var i = ix[0]; big ? i >= 0 : i < word.bytes * 8; i += ix[1]) {
              if (i >= 32) {
                buf[offset++] = Math.floor(word.value / Math.pow(2, i)) & 255;
              } else {
                buf[offset++] = word.value >> i & 255;
              }
            }
          }
        });
        return buf;
      };
      this.write = function(stream) {
        stream.write(this.buffer());
      };
    }
    __name(Put, "Put");
  }
});

// node_modules/dbus-next/lib/align.js
var require_align = __commonJS({
  "node_modules/dbus-next/lib/align.js"(exports2) {
    var Buffer2 = require_safe_buffer().Buffer;
    function align(ps, n) {
      const pad = n - ps._offset % n;
      if (pad === 0 || pad === n) return;
      const padBuff = Buffer2.alloc(pad);
      ps.put(Buffer2.from(padBuff));
      ps._offset += pad;
    }
    __name(align, "align");
    exports2.align = align;
  }
});

// node_modules/long/src/long.js
var require_long = __commonJS({
  "node_modules/long/src/long.js"(exports2, module2) {
    module2.exports = Long;
    var wasm = null;
    try {
      wasm = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
        0,
        97,
        115,
        109,
        1,
        0,
        0,
        0,
        1,
        13,
        2,
        96,
        0,
        1,
        127,
        96,
        4,
        127,
        127,
        127,
        127,
        1,
        127,
        3,
        7,
        6,
        0,
        1,
        1,
        1,
        1,
        1,
        6,
        6,
        1,
        127,
        1,
        65,
        0,
        11,
        7,
        50,
        6,
        3,
        109,
        117,
        108,
        0,
        1,
        5,
        100,
        105,
        118,
        95,
        115,
        0,
        2,
        5,
        100,
        105,
        118,
        95,
        117,
        0,
        3,
        5,
        114,
        101,
        109,
        95,
        115,
        0,
        4,
        5,
        114,
        101,
        109,
        95,
        117,
        0,
        5,
        8,
        103,
        101,
        116,
        95,
        104,
        105,
        103,
        104,
        0,
        0,
        10,
        191,
        1,
        6,
        4,
        0,
        35,
        0,
        11,
        36,
        1,
        1,
        126,
        32,
        0,
        173,
        32,
        1,
        173,
        66,
        32,
        134,
        132,
        32,
        2,
        173,
        32,
        3,
        173,
        66,
        32,
        134,
        132,
        126,
        34,
        4,
        66,
        32,
        135,
        167,
        36,
        0,
        32,
        4,
        167,
        11,
        36,
        1,
        1,
        126,
        32,
        0,
        173,
        32,
        1,
        173,
        66,
        32,
        134,
        132,
        32,
        2,
        173,
        32,
        3,
        173,
        66,
        32,
        134,
        132,
        127,
        34,
        4,
        66,
        32,
        135,
        167,
        36,
        0,
        32,
        4,
        167,
        11,
        36,
        1,
        1,
        126,
        32,
        0,
        173,
        32,
        1,
        173,
        66,
        32,
        134,
        132,
        32,
        2,
        173,
        32,
        3,
        173,
        66,
        32,
        134,
        132,
        128,
        34,
        4,
        66,
        32,
        135,
        167,
        36,
        0,
        32,
        4,
        167,
        11,
        36,
        1,
        1,
        126,
        32,
        0,
        173,
        32,
        1,
        173,
        66,
        32,
        134,
        132,
        32,
        2,
        173,
        32,
        3,
        173,
        66,
        32,
        134,
        132,
        129,
        34,
        4,
        66,
        32,
        135,
        167,
        36,
        0,
        32,
        4,
        167,
        11,
        36,
        1,
        1,
        126,
        32,
        0,
        173,
        32,
        1,
        173,
        66,
        32,
        134,
        132,
        32,
        2,
        173,
        32,
        3,
        173,
        66,
        32,
        134,
        132,
        130,
        34,
        4,
        66,
        32,
        135,
        167,
        36,
        0,
        32,
        4,
        167,
        11
      ])), {}).exports;
    } catch (e) {
    }
    function Long(low, high, unsigned) {
      this.low = low | 0;
      this.high = high | 0;
      this.unsigned = !!unsigned;
    }
    __name(Long, "Long");
    Long.prototype.__isLong__;
    Object.defineProperty(Long.prototype, "__isLong__", { value: true });
    function isLong(obj) {
      return (obj && obj["__isLong__"]) === true;
    }
    __name(isLong, "isLong");
    Long.isLong = isLong;
    var INT_CACHE = {};
    var UINT_CACHE = {};
    function fromInt(value, unsigned) {
      var obj, cachedObj, cache;
      if (unsigned) {
        value >>>= 0;
        if (cache = 0 <= value && value < 256) {
          cachedObj = UINT_CACHE[value];
          if (cachedObj)
            return cachedObj;
        }
        obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
        if (cache)
          UINT_CACHE[value] = obj;
        return obj;
      } else {
        value |= 0;
        if (cache = -128 <= value && value < 128) {
          cachedObj = INT_CACHE[value];
          if (cachedObj)
            return cachedObj;
        }
        obj = fromBits(value, value < 0 ? -1 : 0, false);
        if (cache)
          INT_CACHE[value] = obj;
        return obj;
      }
    }
    __name(fromInt, "fromInt");
    Long.fromInt = fromInt;
    function fromNumber(value, unsigned) {
      if (isNaN(value))
        return unsigned ? UZERO : ZERO;
      if (unsigned) {
        if (value < 0)
          return UZERO;
        if (value >= TWO_PWR_64_DBL)
          return MAX_UNSIGNED_VALUE;
      } else {
        if (value <= -TWO_PWR_63_DBL)
          return MIN_VALUE;
        if (value + 1 >= TWO_PWR_63_DBL)
          return MAX_VALUE;
      }
      if (value < 0)
        return fromNumber(-value, unsigned).neg();
      return fromBits(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0, unsigned);
    }
    __name(fromNumber, "fromNumber");
    Long.fromNumber = fromNumber;
    function fromBits(lowBits, highBits, unsigned) {
      return new Long(lowBits, highBits, unsigned);
    }
    __name(fromBits, "fromBits");
    Long.fromBits = fromBits;
    var pow_dbl = Math.pow;
    function fromString(str, unsigned, radix) {
      if (str.length === 0)
        throw Error("empty string");
      if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
        return ZERO;
      if (typeof unsigned === "number") {
        radix = unsigned, unsigned = false;
      } else {
        unsigned = !!unsigned;
      }
      radix = radix || 10;
      if (radix < 2 || 36 < radix)
        throw RangeError("radix");
      var p;
      if ((p = str.indexOf("-")) > 0)
        throw Error("interior hyphen");
      else if (p === 0) {
        return fromString(str.substring(1), unsigned, radix).neg();
      }
      var radixToPower = fromNumber(pow_dbl(radix, 8));
      var result = ZERO;
      for (var i = 0; i < str.length; i += 8) {
        var size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
        if (size < 8) {
          var power = fromNumber(pow_dbl(radix, size));
          result = result.mul(power).add(fromNumber(value));
        } else {
          result = result.mul(radixToPower);
          result = result.add(fromNumber(value));
        }
      }
      result.unsigned = unsigned;
      return result;
    }
    __name(fromString, "fromString");
    Long.fromString = fromString;
    function fromValue(val, unsigned) {
      if (typeof val === "number")
        return fromNumber(val, unsigned);
      if (typeof val === "string")
        return fromString(val, unsigned);
      return fromBits(val.low, val.high, typeof unsigned === "boolean" ? unsigned : val.unsigned);
    }
    __name(fromValue, "fromValue");
    Long.fromValue = fromValue;
    var TWO_PWR_16_DBL = 1 << 16;
    var TWO_PWR_24_DBL = 1 << 24;
    var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
    var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
    var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
    var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
    var ZERO = fromInt(0);
    Long.ZERO = ZERO;
    var UZERO = fromInt(0, true);
    Long.UZERO = UZERO;
    var ONE = fromInt(1);
    Long.ONE = ONE;
    var UONE = fromInt(1, true);
    Long.UONE = UONE;
    var NEG_ONE = fromInt(-1);
    Long.NEG_ONE = NEG_ONE;
    var MAX_VALUE = fromBits(4294967295 | 0, 2147483647 | 0, false);
    Long.MAX_VALUE = MAX_VALUE;
    var MAX_UNSIGNED_VALUE = fromBits(4294967295 | 0, 4294967295 | 0, true);
    Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
    var MIN_VALUE = fromBits(0, 2147483648 | 0, false);
    Long.MIN_VALUE = MIN_VALUE;
    var LongPrototype = Long.prototype;
    LongPrototype.toInt = /* @__PURE__ */ __name(function toInt() {
      return this.unsigned ? this.low >>> 0 : this.low;
    }, "toInt");
    LongPrototype.toNumber = /* @__PURE__ */ __name(function toNumber() {
      if (this.unsigned)
        return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
      return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
    }, "toNumber");
    LongPrototype.toString = /* @__PURE__ */ __name(function toString(radix) {
      radix = radix || 10;
      if (radix < 2 || 36 < radix)
        throw RangeError("radix");
      if (this.isZero())
        return "0";
      if (this.isNegative()) {
        if (this.eq(MIN_VALUE)) {
          var radixLong = fromNumber(radix), div = this.div(radixLong), rem1 = div.mul(radixLong).sub(this);
          return div.toString(radix) + rem1.toInt().toString(radix);
        } else
          return "-" + this.neg().toString(radix);
      }
      var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned), rem = this;
      var result = "";
      while (true) {
        var remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0, digits = intval.toString(radix);
        rem = remDiv;
        if (rem.isZero())
          return digits + result;
        else {
          while (digits.length < 6)
            digits = "0" + digits;
          result = "" + digits + result;
        }
      }
    }, "toString");
    LongPrototype.getHighBits = /* @__PURE__ */ __name(function getHighBits() {
      return this.high;
    }, "getHighBits");
    LongPrototype.getHighBitsUnsigned = /* @__PURE__ */ __name(function getHighBitsUnsigned() {
      return this.high >>> 0;
    }, "getHighBitsUnsigned");
    LongPrototype.getLowBits = /* @__PURE__ */ __name(function getLowBits() {
      return this.low;
    }, "getLowBits");
    LongPrototype.getLowBitsUnsigned = /* @__PURE__ */ __name(function getLowBitsUnsigned() {
      return this.low >>> 0;
    }, "getLowBitsUnsigned");
    LongPrototype.getNumBitsAbs = /* @__PURE__ */ __name(function getNumBitsAbs() {
      if (this.isNegative())
        return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
      var val = this.high != 0 ? this.high : this.low;
      for (var bit = 31; bit > 0; bit--)
        if ((val & 1 << bit) != 0)
          break;
      return this.high != 0 ? bit + 33 : bit + 1;
    }, "getNumBitsAbs");
    LongPrototype.isZero = /* @__PURE__ */ __name(function isZero() {
      return this.high === 0 && this.low === 0;
    }, "isZero");
    LongPrototype.eqz = LongPrototype.isZero;
    LongPrototype.isNegative = /* @__PURE__ */ __name(function isNegative() {
      return !this.unsigned && this.high < 0;
    }, "isNegative");
    LongPrototype.isPositive = /* @__PURE__ */ __name(function isPositive() {
      return this.unsigned || this.high >= 0;
    }, "isPositive");
    LongPrototype.isOdd = /* @__PURE__ */ __name(function isOdd() {
      return (this.low & 1) === 1;
    }, "isOdd");
    LongPrototype.isEven = /* @__PURE__ */ __name(function isEven() {
      return (this.low & 1) === 0;
    }, "isEven");
    LongPrototype.equals = /* @__PURE__ */ __name(function equals(other) {
      if (!isLong(other))
        other = fromValue(other);
      if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1)
        return false;
      return this.high === other.high && this.low === other.low;
    }, "equals");
    LongPrototype.eq = LongPrototype.equals;
    LongPrototype.notEquals = /* @__PURE__ */ __name(function notEquals(other) {
      return !this.eq(
        /* validates */
        other
      );
    }, "notEquals");
    LongPrototype.neq = LongPrototype.notEquals;
    LongPrototype.ne = LongPrototype.notEquals;
    LongPrototype.lessThan = /* @__PURE__ */ __name(function lessThan(other) {
      return this.comp(
        /* validates */
        other
      ) < 0;
    }, "lessThan");
    LongPrototype.lt = LongPrototype.lessThan;
    LongPrototype.lessThanOrEqual = /* @__PURE__ */ __name(function lessThanOrEqual(other) {
      return this.comp(
        /* validates */
        other
      ) <= 0;
    }, "lessThanOrEqual");
    LongPrototype.lte = LongPrototype.lessThanOrEqual;
    LongPrototype.le = LongPrototype.lessThanOrEqual;
    LongPrototype.greaterThan = /* @__PURE__ */ __name(function greaterThan(other) {
      return this.comp(
        /* validates */
        other
      ) > 0;
    }, "greaterThan");
    LongPrototype.gt = LongPrototype.greaterThan;
    LongPrototype.greaterThanOrEqual = /* @__PURE__ */ __name(function greaterThanOrEqual(other) {
      return this.comp(
        /* validates */
        other
      ) >= 0;
    }, "greaterThanOrEqual");
    LongPrototype.gte = LongPrototype.greaterThanOrEqual;
    LongPrototype.ge = LongPrototype.greaterThanOrEqual;
    LongPrototype.compare = /* @__PURE__ */ __name(function compare(other) {
      if (!isLong(other))
        other = fromValue(other);
      if (this.eq(other))
        return 0;
      var thisNeg = this.isNegative(), otherNeg = other.isNegative();
      if (thisNeg && !otherNeg)
        return -1;
      if (!thisNeg && otherNeg)
        return 1;
      if (!this.unsigned)
        return this.sub(other).isNegative() ? -1 : 1;
      return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
    }, "compare");
    LongPrototype.comp = LongPrototype.compare;
    LongPrototype.negate = /* @__PURE__ */ __name(function negate() {
      if (!this.unsigned && this.eq(MIN_VALUE))
        return MIN_VALUE;
      return this.not().add(ONE);
    }, "negate");
    LongPrototype.neg = LongPrototype.negate;
    LongPrototype.add = /* @__PURE__ */ __name(function add(addend) {
      if (!isLong(addend))
        addend = fromValue(addend);
      var a48 = this.high >>> 16;
      var a32 = this.high & 65535;
      var a16 = this.low >>> 16;
      var a00 = this.low & 65535;
      var b48 = addend.high >>> 16;
      var b32 = addend.high & 65535;
      var b16 = addend.low >>> 16;
      var b00 = addend.low & 65535;
      var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
      c00 += a00 + b00;
      c16 += c00 >>> 16;
      c00 &= 65535;
      c16 += a16 + b16;
      c32 += c16 >>> 16;
      c16 &= 65535;
      c32 += a32 + b32;
      c48 += c32 >>> 16;
      c32 &= 65535;
      c48 += a48 + b48;
      c48 &= 65535;
      return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
    }, "add");
    LongPrototype.subtract = /* @__PURE__ */ __name(function subtract(subtrahend) {
      if (!isLong(subtrahend))
        subtrahend = fromValue(subtrahend);
      return this.add(subtrahend.neg());
    }, "subtract");
    LongPrototype.sub = LongPrototype.subtract;
    LongPrototype.multiply = /* @__PURE__ */ __name(function multiply(multiplier) {
      if (this.isZero())
        return ZERO;
      if (!isLong(multiplier))
        multiplier = fromValue(multiplier);
      if (wasm) {
        var low = wasm.mul(
          this.low,
          this.high,
          multiplier.low,
          multiplier.high
        );
        return fromBits(low, wasm.get_high(), this.unsigned);
      }
      if (multiplier.isZero())
        return ZERO;
      if (this.eq(MIN_VALUE))
        return multiplier.isOdd() ? MIN_VALUE : ZERO;
      if (multiplier.eq(MIN_VALUE))
        return this.isOdd() ? MIN_VALUE : ZERO;
      if (this.isNegative()) {
        if (multiplier.isNegative())
          return this.neg().mul(multiplier.neg());
        else
          return this.neg().mul(multiplier).neg();
      } else if (multiplier.isNegative())
        return this.mul(multiplier.neg()).neg();
      if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
        return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);
      var a48 = this.high >>> 16;
      var a32 = this.high & 65535;
      var a16 = this.low >>> 16;
      var a00 = this.low & 65535;
      var b48 = multiplier.high >>> 16;
      var b32 = multiplier.high & 65535;
      var b16 = multiplier.low >>> 16;
      var b00 = multiplier.low & 65535;
      var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
      c00 += a00 * b00;
      c16 += c00 >>> 16;
      c00 &= 65535;
      c16 += a16 * b00;
      c32 += c16 >>> 16;
      c16 &= 65535;
      c16 += a00 * b16;
      c32 += c16 >>> 16;
      c16 &= 65535;
      c32 += a32 * b00;
      c48 += c32 >>> 16;
      c32 &= 65535;
      c32 += a16 * b16;
      c48 += c32 >>> 16;
      c32 &= 65535;
      c32 += a00 * b32;
      c48 += c32 >>> 16;
      c32 &= 65535;
      c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
      c48 &= 65535;
      return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
    }, "multiply");
    LongPrototype.mul = LongPrototype.multiply;
    LongPrototype.divide = /* @__PURE__ */ __name(function divide(divisor) {
      if (!isLong(divisor))
        divisor = fromValue(divisor);
      if (divisor.isZero())
        throw Error("division by zero");
      if (wasm) {
        if (!this.unsigned && this.high === -2147483648 && divisor.low === -1 && divisor.high === -1) {
          return this;
        }
        var low = (this.unsigned ? wasm.div_u : wasm.div_s)(
          this.low,
          this.high,
          divisor.low,
          divisor.high
        );
        return fromBits(low, wasm.get_high(), this.unsigned);
      }
      if (this.isZero())
        return this.unsigned ? UZERO : ZERO;
      var approx, rem, res;
      if (!this.unsigned) {
        if (this.eq(MIN_VALUE)) {
          if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
            return MIN_VALUE;
          else if (divisor.eq(MIN_VALUE))
            return ONE;
          else {
            var halfThis = this.shr(1);
            approx = halfThis.div(divisor).shl(1);
            if (approx.eq(ZERO)) {
              return divisor.isNegative() ? ONE : NEG_ONE;
            } else {
              rem = this.sub(divisor.mul(approx));
              res = approx.add(rem.div(divisor));
              return res;
            }
          }
        } else if (divisor.eq(MIN_VALUE))
          return this.unsigned ? UZERO : ZERO;
        if (this.isNegative()) {
          if (divisor.isNegative())
            return this.neg().div(divisor.neg());
          return this.neg().div(divisor).neg();
        } else if (divisor.isNegative())
          return this.div(divisor.neg()).neg();
        res = ZERO;
      } else {
        if (!divisor.unsigned)
          divisor = divisor.toUnsigned();
        if (divisor.gt(this))
          return UZERO;
        if (divisor.gt(this.shru(1)))
          return UONE;
        res = UZERO;
      }
      rem = this;
      while (rem.gte(divisor)) {
        approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
        var log2 = Math.ceil(Math.log(approx) / Math.LN2), delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48), approxRes = fromNumber(approx), approxRem = approxRes.mul(divisor);
        while (approxRem.isNegative() || approxRem.gt(rem)) {
          approx -= delta;
          approxRes = fromNumber(approx, this.unsigned);
          approxRem = approxRes.mul(divisor);
        }
        if (approxRes.isZero())
          approxRes = ONE;
        res = res.add(approxRes);
        rem = rem.sub(approxRem);
      }
      return res;
    }, "divide");
    LongPrototype.div = LongPrototype.divide;
    LongPrototype.modulo = /* @__PURE__ */ __name(function modulo(divisor) {
      if (!isLong(divisor))
        divisor = fromValue(divisor);
      if (wasm) {
        var low = (this.unsigned ? wasm.rem_u : wasm.rem_s)(
          this.low,
          this.high,
          divisor.low,
          divisor.high
        );
        return fromBits(low, wasm.get_high(), this.unsigned);
      }
      return this.sub(this.div(divisor).mul(divisor));
    }, "modulo");
    LongPrototype.mod = LongPrototype.modulo;
    LongPrototype.rem = LongPrototype.modulo;
    LongPrototype.not = /* @__PURE__ */ __name(function not() {
      return fromBits(~this.low, ~this.high, this.unsigned);
    }, "not");
    LongPrototype.and = /* @__PURE__ */ __name(function and(other) {
      if (!isLong(other))
        other = fromValue(other);
      return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
    }, "and");
    LongPrototype.or = /* @__PURE__ */ __name(function or(other) {
      if (!isLong(other))
        other = fromValue(other);
      return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
    }, "or");
    LongPrototype.xor = /* @__PURE__ */ __name(function xor(other) {
      if (!isLong(other))
        other = fromValue(other);
      return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
    }, "xor");
    LongPrototype.shiftLeft = /* @__PURE__ */ __name(function shiftLeft(numBits) {
      if (isLong(numBits))
        numBits = numBits.toInt();
      if ((numBits &= 63) === 0)
        return this;
      else if (numBits < 32)
        return fromBits(this.low << numBits, this.high << numBits | this.low >>> 32 - numBits, this.unsigned);
      else
        return fromBits(0, this.low << numBits - 32, this.unsigned);
    }, "shiftLeft");
    LongPrototype.shl = LongPrototype.shiftLeft;
    LongPrototype.shiftRight = /* @__PURE__ */ __name(function shiftRight(numBits) {
      if (isLong(numBits))
        numBits = numBits.toInt();
      if ((numBits &= 63) === 0)
        return this;
      else if (numBits < 32)
        return fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits, this.unsigned);
      else
        return fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1, this.unsigned);
    }, "shiftRight");
    LongPrototype.shr = LongPrototype.shiftRight;
    LongPrototype.shiftRightUnsigned = /* @__PURE__ */ __name(function shiftRightUnsigned(numBits) {
      if (isLong(numBits))
        numBits = numBits.toInt();
      numBits &= 63;
      if (numBits === 0)
        return this;
      else {
        var high = this.high;
        if (numBits < 32) {
          var low = this.low;
          return fromBits(low >>> numBits | high << 32 - numBits, high >>> numBits, this.unsigned);
        } else if (numBits === 32)
          return fromBits(high, 0, this.unsigned);
        else
          return fromBits(high >>> numBits - 32, 0, this.unsigned);
      }
    }, "shiftRightUnsigned");
    LongPrototype.shru = LongPrototype.shiftRightUnsigned;
    LongPrototype.shr_u = LongPrototype.shiftRightUnsigned;
    LongPrototype.toSigned = /* @__PURE__ */ __name(function toSigned() {
      if (!this.unsigned)
        return this;
      return fromBits(this.low, this.high, false);
    }, "toSigned");
    LongPrototype.toUnsigned = /* @__PURE__ */ __name(function toUnsigned() {
      if (this.unsigned)
        return this;
      return fromBits(this.low, this.high, true);
    }, "toUnsigned");
    LongPrototype.toBytes = /* @__PURE__ */ __name(function toBytes(le) {
      return le ? this.toBytesLE() : this.toBytesBE();
    }, "toBytes");
    LongPrototype.toBytesLE = /* @__PURE__ */ __name(function toBytesLE() {
      var hi = this.high, lo = this.low;
      return [
        lo & 255,
        lo >>> 8 & 255,
        lo >>> 16 & 255,
        lo >>> 24,
        hi & 255,
        hi >>> 8 & 255,
        hi >>> 16 & 255,
        hi >>> 24
      ];
    }, "toBytesLE");
    LongPrototype.toBytesBE = /* @__PURE__ */ __name(function toBytesBE() {
      var hi = this.high, lo = this.low;
      return [
        hi >>> 24,
        hi >>> 16 & 255,
        hi >>> 8 & 255,
        hi & 255,
        lo >>> 24,
        lo >>> 16 & 255,
        lo >>> 8 & 255,
        lo & 255
      ];
    }, "toBytesBE");
    Long.fromBytes = /* @__PURE__ */ __name(function fromBytes(bytes, unsigned, le) {
      return le ? Long.fromBytesLE(bytes, unsigned) : Long.fromBytesBE(bytes, unsigned);
    }, "fromBytes");
    Long.fromBytesLE = /* @__PURE__ */ __name(function fromBytesLE(bytes, unsigned) {
      return new Long(
        bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24,
        bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24,
        unsigned
      );
    }, "fromBytesLE");
    Long.fromBytesBE = /* @__PURE__ */ __name(function fromBytesBE(bytes, unsigned) {
      return new Long(
        bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7],
        bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3],
        unsigned
      );
    }, "fromBytesBE");
  }
});

// node_modules/dbus-next/lib/library-options.js
var require_library_options = __commonJS({
  "node_modules/dbus-next/lib/library-options.js"(exports2, module2) {
    var libraryOptions = {
      bigIntCompat: false
    };
    module2.exports.getBigIntCompat = function() {
      return libraryOptions.bigIntCompat;
    };
    module2.exports.setBigIntCompat = function(val) {
      if (typeof val !== "boolean") {
        throw new Error("dbus.setBigIntCompat() must be called with a boolean parameter");
      }
      libraryOptions.bigIntCompat = val;
    };
  }
});

// node_modules/dbus-next/lib/marshallers.js
var require_marshallers = __commonJS({
  "node_modules/dbus-next/lib/marshallers.js"(exports2) {
    var Buffer2 = require_safe_buffer().Buffer;
    var align = require_align().align;
    var { parseSignature } = require_signature();
    var Long = require_long();
    var { getBigIntCompat } = require_library_options();
    var JSBI = require_jsbi_cjs();
    var {
      _getJSBIConstants,
      _getBigIntConstants
    } = require_constants2();
    var MakeSimpleMarshaller = /* @__PURE__ */ __name(function(signature) {
      const marshaller = {};
      function checkValidString(data) {
        if (typeof data !== "string") {
          throw new Error(`Data: ${data} was not of type string`);
        } else if (data.indexOf("\0") !== -1) {
          throw new Error("String contains null byte");
        }
      }
      __name(checkValidString, "checkValidString");
      function checkValidSignature(data) {
        if (data.length > 255) {
          throw new Error(
            `Data: ${data} is too long for signature type (${data.length} > 255)`
          );
        }
        let parenCount = 0;
        for (let ii = 0; ii < data.length; ++ii) {
          if (parenCount > 32) {
            throw new Error(
              `Maximum container type nesting exceeded in signature type:${data}`
            );
          }
          switch (data[ii]) {
            case "(":
              ++parenCount;
              break;
            case ")":
              --parenCount;
              break;
            default:
              break;
          }
        }
        parseSignature(data);
      }
      __name(checkValidSignature, "checkValidSignature");
      switch (signature) {
        case "o":
        // object path
        // TODO: verify object path here?
        case "s":
          marshaller.check = function(data) {
            checkValidString(data);
          };
          marshaller.marshall = function(ps, data) {
            this.check(data);
            align(ps, 4);
            const buff = Buffer2.from(data, "utf8");
            ps.word32le(buff.length).put(buff).word8(0);
            ps._offset += 5 + buff.length;
          };
          break;
        case "g":
          marshaller.check = function(data) {
            checkValidString(data);
            checkValidSignature(data);
          };
          marshaller.marshall = function(ps, data) {
            this.check(data);
            const buff = Buffer2.from(data, "ascii");
            ps.word8(data.length).put(buff).word8(0);
            ps._offset += 2 + buff.length;
          };
          break;
        case "y":
          marshaller.check = function(data) {
            checkInteger(data);
            checkRange(0, 255, data);
          };
          marshaller.marshall = function(ps, data) {
            this.check(data);
            ps.word8(data);
            ps._offset++;
          };
          break;
        case "b":
          marshaller.check = function(data) {
            checkBoolean(data);
          };
          marshaller.marshall = function(ps, data) {
            this.check(data);
            data = data ? 1 : 0;
            align(ps, 4);
            ps.word32le(data);
            ps._offset += 4;
          };
          break;
        case "n":
          marshaller.check = function(data) {
            checkInteger(data);
            checkRange(-32767 - 1, 32767, data);
          };
          marshaller.marshall = function(ps, data) {
            this.check(data);
            align(ps, 2);
            const buff = Buffer2.alloc(2);
            buff.writeInt16LE(parseInt(data), 0);
            ps.put(buff);
            ps._offset += 2;
          };
          break;
        case "q":
          marshaller.check = function(data) {
            checkInteger(data);
            checkRange(0, 65535, data);
          };
          marshaller.marshall = function(ps, data) {
            this.check(data);
            align(ps, 2);
            ps.word16le(data);
            ps._offset += 2;
          };
          break;
        case "i":
          marshaller.check = function(data) {
            checkInteger(data);
            checkRange(-2147483647 - 1, 2147483647, data);
          };
          marshaller.marshall = function(ps, data) {
            this.check(data);
            align(ps, 4);
            const buff = Buffer2.alloc(4);
            buff.writeInt32LE(parseInt(data), 0);
            ps.put(buff);
            ps._offset += 4;
          };
          break;
        case "u":
          marshaller.check = function(data) {
            checkInteger(data);
            checkRange(0, 4294967295, data);
          };
          marshaller.marshall = function(ps, data) {
            this.check(data);
            align(ps, 4);
            ps.word32le(data);
            ps._offset += 4;
          };
          break;
        case "t":
          marshaller.check = function(data) {
            return checkLong(data, false);
          };
          marshaller.marshall = function(ps, data) {
            data = this.check(data);
            align(ps, 8);
            ps.word32le(data.low);
            ps.word32le(data.high);
            ps._offset += 8;
          };
          break;
        case "x":
          marshaller.check = function(data) {
            return checkLong(data, true);
          };
          marshaller.marshall = function(ps, data) {
            data = this.check(data);
            align(ps, 8);
            ps.word32le(data.low);
            ps.word32le(data.high);
            ps._offset += 8;
          };
          break;
        case "d":
          marshaller.check = function(data) {
            if (typeof data !== "number") {
              throw new Error(`Data: ${data} was not of type number`);
            } else if (Number.isNaN(data)) {
              throw new Error(`Data: ${data} was not a number`);
            } else if (!Number.isFinite(data)) {
              throw new Error("Number outside range");
            }
          };
          marshaller.marshall = function(ps, data) {
            this.check(data);
            align(ps, 8);
            const buff = Buffer2.alloc(8);
            buff.writeDoubleLE(parseFloat(data), 0);
            ps.put(buff);
            ps._offset += 8;
          };
          break;
        default:
          throw new Error(`Unknown data type format: ${signature}`);
      }
      return marshaller;
    }, "MakeSimpleMarshaller");
    exports2.MakeSimpleMarshaller = MakeSimpleMarshaller;
    var checkRange = /* @__PURE__ */ __name(function(minValue, maxValue, data) {
      if (data > maxValue || data < minValue) {
        throw new Error("Number outside range");
      }
    }, "checkRange");
    var checkInteger = /* @__PURE__ */ __name(function(data) {
      if (typeof data !== "number") {
        throw new Error(`Data: ${data} was not of type number`);
      }
      if (Math.floor(data) !== data) {
        throw new Error(`Data: ${data} was not an integer`);
      }
    }, "checkInteger");
    var checkBoolean = /* @__PURE__ */ __name(function(data) {
      if (!(typeof data === "boolean" || data === 0 || data === 1)) {
        throw new Error(`Data: ${data} was not of type boolean`);
      }
    }, "checkBoolean");
    var checkJSBILong = /* @__PURE__ */ __name(function(data, signed) {
      const { MAX_INT64, MIN_INT64, MAX_UINT64, MIN_UINT64 } = _getJSBIConstants();
      data = JSBI.BigInt(data.toString());
      if (signed) {
        if (JSBI.greaterThan(data, MAX_INT64)) {
          throw new Error("data was out of range (greater than max int64)");
        } else if (JSBI.lessThan(data, MIN_INT64)) {
          throw new Error("data was out of range (less than min int64)");
        }
      } else {
        if (JSBI.greaterThan(data, MAX_UINT64)) {
          throw new Error("data was out of range (greater than max uint64)");
        } else if (JSBI.lessThan(data, MIN_UINT64)) {
          throw new Error("data was out of range (less than min uint64)");
        }
      }
      return Long.fromString(data.toString(), true);
    }, "checkJSBILong");
    var checkBigIntLong = /* @__PURE__ */ __name(function(data, signed) {
      const { MAX_INT64, MIN_INT64, MAX_UINT64, MIN_UINT64 } = _getBigIntConstants();
      if (typeof data !== "bigint") {
        data = BigInt(data.toString());
      }
      if (signed) {
        if (data > MAX_INT64) {
          throw new Error("data was out of range (greater than max int64)");
        } else if (data < MIN_INT64) {
          throw new Error("data was out of range (less than min int64)");
        }
      } else {
        if (data > MAX_UINT64) {
          throw new Error("data was out of range (greater than max uint64)");
        } else if (data < MIN_UINT64) {
          throw new Error("data was out of range (less than min uint64)");
        }
      }
      return Long.fromString(data.toString(), true);
    }, "checkBigIntLong");
    var checkLong = /* @__PURE__ */ __name(function(data, signed) {
      const compat = getBigIntCompat();
      if (compat) {
        return checkJSBILong(data, signed);
      } else {
        return checkBigIntLong(data, signed);
      }
    }, "checkLong");
  }
});

// node_modules/dbus-next/lib/marshall.js
var require_marshall = __commonJS({
  "node_modules/dbus-next/lib/marshall.js"(exports2, module2) {
    var assert = require("assert");
    var { parseSignature } = require_signature();
    var put = require_put();
    var Marshallers = require_marshallers();
    var align = require_align().align;
    module2.exports = /* @__PURE__ */ __name(function marshall(signature, data, offset) {
      if (typeof offset === "undefined") offset = 0;
      const tree = parseSignature(signature);
      if (!Array.isArray(data) || data.length !== tree.length) {
        throw new Error(
          `message body does not match message signature. Body:${JSON.stringify(
            data
          )}, signature:${signature}`
        );
      }
      const putstream = put();
      putstream._offset = offset;
      const buf = writeStruct(putstream, tree, data).buffer();
      return buf;
    }, "marshall");
    function writeStruct(ps, tree, data) {
      if (tree.length !== data.length) {
        throw new Error("Invalid struct data");
      }
      for (let i = 0; i < tree.length; ++i) {
        write(ps, tree[i], data[i]);
      }
      return ps;
    }
    __name(writeStruct, "writeStruct");
    function write(ps, ele, data) {
      switch (ele.type) {
        case "(":
        case "{":
          align(ps, 8);
          writeStruct(ps, ele.child, data);
          break;
        case "a": {
          const arrPut = put();
          arrPut._offset = ps._offset;
          const _offset = arrPut._offset;
          writeSimple(arrPut, "u", 0);
          const lengthOffset = arrPut._offset - 4 - _offset;
          if (["x", "t", "d", "{", "("].indexOf(ele.child[0].type) !== -1) {
            align(arrPut, 8);
          }
          const startOffset = arrPut._offset;
          for (let i = 0; i < data.length; ++i) {
            write(arrPut, ele.child[0], data[i]);
          }
          const arrBuff = arrPut.buffer();
          const length = arrPut._offset - startOffset;
          arrBuff.writeUInt32LE(length, lengthOffset);
          ps.put(arrBuff);
          ps._offset += arrBuff.length;
          break;
        }
        case "v": {
          assert.strictEqual(data.length, 2, "variant data should be [signature, data]");
          const signatureEle = {
            type: "g",
            child: []
          };
          write(ps, signatureEle, data[0]);
          const tree = parseSignature(data[0]);
          assert(tree.length === 1);
          write(ps, tree[0], data[1]);
          break;
        }
        default:
          return writeSimple(ps, ele.type, data);
      }
    }
    __name(write, "write");
    var stringTypes = ["g", "o", "s"];
    function writeSimple(ps, type, data) {
      if (typeof data === "undefined") {
        throw new Error(
          "Serialisation of JS 'undefined' type is not supported by d-bus"
        );
      }
      if (data === null) {
        throw new Error("Serialisation of null value is not supported by d-bus");
      }
      if (Buffer.isBuffer(data)) data = data.toString();
      if (stringTypes.indexOf(type) !== -1 && typeof data !== "string") {
        throw new Error(
          `Expected string or buffer argument, got ${JSON.stringify(
            data
          )} of type '${type}'`
        );
      }
      const simpleMarshaller = Marshallers.MakeSimpleMarshaller(type);
      simpleMarshaller.marshall(ps, data);
      return ps;
    }
    __name(writeSimple, "writeSimple");
  }
});

// node_modules/dbus-next/lib/dbus-buffer.js
var require_dbus_buffer = __commonJS({
  "node_modules/dbus-next/lib/dbus-buffer.js"(exports2, module2) {
    var { parseSignature } = require_signature();
    var { getBigIntCompat } = require_library_options();
    var JSBI = require_jsbi_cjs();
    var Long = require_long();
    var LE = require_constants2().endianness.le;
    function DBusBuffer(buffer, startPos, endian, options) {
      if (typeof options !== "object") {
        options = { ayBuffer: true };
      } else if (options.ayBuffer === void 0) {
        options.ayBuffer = true;
      }
      this.options = options;
      this.buffer = buffer;
      this.endian = endian;
      this.startPos = startPos || 0;
      this.pos = 0;
    }
    __name(DBusBuffer, "DBusBuffer");
    DBusBuffer.prototype.align = function(power) {
      const allbits = (1 << power) - 1;
      const paddedOffset = this.pos + this.startPos + allbits >> power << power;
      this.pos = paddedOffset - this.startPos;
    };
    DBusBuffer.prototype.readInt8 = function() {
      this.pos++;
      return this.buffer[this.pos - 1];
    };
    DBusBuffer.prototype.readSInt16 = function() {
      this.align(1);
      const res = this.endian === LE ? this.buffer.readInt16LE(this.pos) : this.buffer.readInt16BE(this.pos);
      this.pos += 2;
      return res;
    };
    DBusBuffer.prototype.readInt16 = function() {
      this.align(1);
      const res = this.endian === LE ? this.buffer.readUInt16LE(this.pos) : this.buffer.readUInt16BE(this.pos);
      this.pos += 2;
      return res;
    };
    DBusBuffer.prototype.readSInt32 = function() {
      this.align(2);
      const res = this.endian === LE ? this.buffer.readInt32LE(this.pos) : this.buffer.readInt32BE(this.pos);
      this.pos += 4;
      return res;
    };
    DBusBuffer.prototype.readInt32 = function() {
      this.align(2);
      const res = this.endian === LE ? this.buffer.readUInt32LE(this.pos) : this.buffer.readUInt32BE(this.pos);
      this.pos += 4;
      return res;
    };
    DBusBuffer.prototype.readDouble = function() {
      this.align(3);
      const res = this.endian === LE ? this.buffer.readDoubleLE(this.pos) : this.buffer.readDoubleBE(this.pos);
      this.pos += 8;
      return res;
    };
    DBusBuffer.prototype.readString = function(len) {
      if (len === 0) {
        this.pos++;
        return "";
      }
      const res = this.buffer.toString("utf8", this.pos, this.pos + len);
      this.pos += len + 1;
      return res;
    };
    DBusBuffer.prototype.readTree = /* @__PURE__ */ __name(function readTree(tree) {
      switch (tree.type) {
        case "(":
        case "{":
        case "r":
          this.align(3);
          return this.readStruct(tree.child);
        case "a":
          if (!tree.child || tree.child.length !== 1) {
            throw new Error("Incorrect array element signature");
          }
          return this.readArray(tree.child[0], this.readInt32());
        case "v":
          return this.readVariant();
        default:
          return this.readSimpleType(tree.type);
      }
    }, "readTree");
    DBusBuffer.prototype.read = /* @__PURE__ */ __name(function read(signature) {
      const tree = parseSignature(signature);
      return this.readStruct(tree);
    }, "read");
    DBusBuffer.prototype.readVariant = /* @__PURE__ */ __name(function readVariant() {
      const signature = this.readSimpleType("g");
      const tree = parseSignature(signature);
      return [tree, this.readStruct(tree)];
    }, "readVariant");
    DBusBuffer.prototype.readStruct = /* @__PURE__ */ __name(function readStruct(struct) {
      const result = [];
      for (let i = 0; i < struct.length; ++i) {
        result.push(this.readTree(struct[i]));
      }
      return result;
    }, "readStruct");
    DBusBuffer.prototype.readArray = /* @__PURE__ */ __name(function readArray(eleType, arrayBlobSize) {
      const result = [];
      const start = this.pos;
      if (eleType.type === "y" && this.options.ayBuffer) {
        this.pos += arrayBlobSize;
        return this.buffer.slice(start, this.pos);
      }
      if (["x", "t", "d", "{", "(", "r"].indexOf(eleType.type) !== -1) {
        this.align(3);
      }
      const end = this.pos + arrayBlobSize;
      while (this.pos < end) {
        result.push(this.readTree(eleType));
      }
      return result;
    }, "readArray");
    DBusBuffer.prototype.readSimpleType = /* @__PURE__ */ __name(function readSimpleType(t) {
      let len, word0, word1;
      switch (t) {
        case "y":
          return this.readInt8();
        case "b":
          return !!this.readInt32();
        case "n":
          return this.readSInt16();
        case "q":
          return this.readInt16();
        case "h":
        // unix socket is just a number
        case "u":
          return this.readInt32();
        case "i":
          return this.readSInt32();
        case "g":
          len = this.readInt8();
          return this.readString(len);
        case "s":
        case "o":
          len = this.readInt32();
          return this.readString(len);
        // TODO: validate object path here
        // if (t === 'o' && !isValidObjectPath(str))
        //  throw new Error('string is not a valid object path'));
        case "x": {
          this.align(3);
          word0 = this.readInt32();
          word1 = this.readInt32();
          const signedLong = new Long(word0, word1, false);
          if (getBigIntCompat()) {
            return JSBI.BigInt(signedLong.toString());
          } else if (typeof BigInt !== "function") {
            throw new Error("BigInt is not supported in this Node version. Use dbus.setBigIntCompat(true) to use a polyfill");
          } else {
            return BigInt(signedLong.toString());
          }
        }
        case "t": {
          this.align(3);
          word0 = this.readInt32();
          word1 = this.readInt32();
          const unsignedLong = new Long(word0, word1, true);
          if (getBigIntCompat()) {
            return JSBI.BigInt(unsignedLong.toString());
          } else if (typeof BigInt !== "function") {
            throw new Error("BigInt is not supported in this Node version. Use dbus.setBigIntCompat(true) to use a polyfill");
          } else {
            return BigInt(unsignedLong.toString());
          }
        }
        case "d":
          return this.readDouble();
        default:
          throw new Error(`Unsupported type: ${t}`);
      }
    }, "readSimpleType");
    module2.exports = DBusBuffer;
  }
});

// node_modules/dbus-next/lib/header-signature.json
var require_header_signature = __commonJS({
  "node_modules/dbus-next/lib/header-signature.json"(exports2, module2) {
    module2.exports = [
      {
        type: "a",
        child: [
          {
            type: "(",
            child: [
              {
                type: "y",
                child: []
              },
              {
                type: "v",
                child: []
              }
            ]
          }
        ]
      }
    ];
  }
});

// node_modules/dbus-next/lib/message.js
var require_message = __commonJS({
  "node_modules/dbus-next/lib/message.js"(exports2, module2) {
    var Buffer2 = require_safe_buffer().Buffer;
    var marshall = require_marshall();
    var constants = require_constants2();
    var DBusBuffer = require_dbus_buffer();
    var headerSignature = require_header_signature();
    module2.exports.unmarshalMessages = /* @__PURE__ */ __name(function messageParser(stream, onMessage, opts) {
      let state = 0;
      let header, fieldsAndBody;
      let fieldsLength, fieldsLengthPadded;
      let fieldsAndBodyLength = 0;
      let bodyLength = 0;
      let endian = 0;
      const LE = constants.endianness.le;
      stream.on("readable", function() {
        while (1) {
          if (state === 0) {
            header = stream.read(16);
            if (!header) {
              break;
            }
            state = 1;
            endian = header.readUInt8();
            fieldsLength = endian === LE ? header.readUInt32LE(12) : header.readUInt32BE(12);
            fieldsLengthPadded = fieldsLength + 7 >> 3 << 3;
            bodyLength = endian === LE ? header.readUInt32LE(4) : header.readUInt32BE(4);
            fieldsAndBodyLength = fieldsLengthPadded + bodyLength;
          } else {
            fieldsAndBody = stream.read(fieldsAndBodyLength);
            if (!fieldsAndBody) {
              break;
            }
            state = 0;
            const messageBuffer = new DBusBuffer(fieldsAndBody, 0, endian, opts);
            const unmarshalledHeader = messageBuffer.readArray(
              headerSignature[0].child[0],
              fieldsLength
            );
            messageBuffer.align(3);
            let headerName;
            const message = {};
            message.serial = endian === LE ? header.readUInt32LE(8) : header.readUInt32BE(8);
            for (let i = 0; i < unmarshalledHeader.length; ++i) {
              headerName = constants.headerTypeName[unmarshalledHeader[i][0]];
              message[headerName] = unmarshalledHeader[i][1][1][0];
            }
            message.type = header[1];
            message.flags = header[2];
            if (bodyLength > 0 && message.signature) {
              message.body = messageBuffer.read(message.signature);
            }
            onMessage(message);
          }
        }
      });
    }, "messageParser");
    module2.exports.unmarshall = /* @__PURE__ */ __name(function unmarshall(buff, opts) {
      const endian = buff.readUInt8();
      const msgBuf = new DBusBuffer(buff, 0, endian, opts);
      const headers = msgBuf.read("yyyyuua(yv)");
      const message = {};
      for (let i = 0; i < headers[6].length; ++i) {
        const headerName = constants.headerTypeName[headers[6][i][0]];
        message[headerName] = headers[6][i][1][1][0];
      }
      message.type = headers[1];
      message.flags = headers[2];
      message.serial = headers[5];
      msgBuf.align(3);
      message.body = msgBuf.read(message.signature);
      return message;
    }, "unmarshall");
    module2.exports.marshall = /* @__PURE__ */ __name(function marshallMessage(message) {
      if (!message.serial) throw new Error("Missing or invalid serial");
      const flags = message.flags || 0;
      const type = message.type || constants.messageType.METHOD_CALL;
      let bodyLength = 0;
      let bodyBuff;
      if (message.signature && message.body) {
        bodyBuff = marshall(message.signature, message.body);
        bodyLength = bodyBuff.length;
      }
      const header = [
        constants.endianness.le,
        type,
        flags,
        constants.protocolVersion,
        bodyLength,
        message.serial
      ];
      const headerBuff = marshall("yyyyuu", header);
      const fields = [];
      constants.headerTypeName.forEach(function(fieldName) {
        const fieldVal = message[fieldName];
        if (fieldVal) {
          fields.push([
            constants.headerTypeId[fieldName],
            [constants.fieldSignature[fieldName], fieldVal]
          ]);
        }
      });
      const fieldsBuff = marshall("a(yv)", [fields], 12);
      const headerLenAligned = headerBuff.length + fieldsBuff.length + 7 >> 3 << 3;
      const messageLen = headerLenAligned + bodyLength;
      const messageBuff = Buffer2.alloc(messageLen);
      headerBuff.copy(messageBuff);
      fieldsBuff.copy(messageBuff, headerBuff.length);
      if (bodyLength > 0) bodyBuff.copy(messageBuff, headerLenAligned);
      return messageBuff;
    }, "marshallMessage");
  }
});

// node_modules/dbus-next/lib/readline.js
var require_readline = __commonJS({
  "node_modules/dbus-next/lib/readline.js"(exports2, module2) {
    var Buffer2 = require_safe_buffer().Buffer;
    module2.exports = /* @__PURE__ */ __name(function readOneLine(stream, cb) {
      const bytes = [];
      function readable() {
        while (1) {
          const buf = stream.read(1);
          if (!buf) return;
          const b = buf[0];
          if (b === 10) {
            try {
              cb(Buffer2.from(bytes));
            } catch (error) {
              stream.emit("error", error);
            }
            stream.removeListener("readable", readable);
            return;
          }
          bytes.push(b);
        }
      }
      __name(readable, "readable");
      stream.on("readable", readable);
    }, "readOneLine");
  }
});

// node_modules/dbus-next/lib/handshake.js
var require_handshake = __commonJS({
  "node_modules/dbus-next/lib/handshake.js"(exports2, module2) {
    var Buffer2 = require_safe_buffer().Buffer;
    var crypto = require("crypto");
    var fs2 = require("fs");
    var path2 = require("path");
    var constants = require_constants2();
    var readLine = require_readline();
    function sha1(input) {
      const shasum = crypto.createHash("sha1");
      shasum.update(input);
      return shasum.digest("hex");
    }
    __name(sha1, "sha1");
    function getUserHome() {
      return process.env[process.platform.match(/$win/) ? "USERPROFILE" : "HOME"];
    }
    __name(getUserHome, "getUserHome");
    function getCookie(context, id, cb) {
      const dirname = path2.join(getUserHome(), ".dbus-keyrings");
      if (context.length === 0) context = "org_freedesktop_general";
      const filename = path2.join(dirname, context);
      fs2.stat(dirname, function(err, stat) {
        if (err) return cb(err);
        if (stat.mode & 18) {
          return cb(
            new Error(
              "User keyrings directory is writeable by other users. Aborting authentication"
            )
          );
        }
        if ("getuid" in process && stat.uid !== process.getuid()) {
          return cb(
            new Error(
              "Keyrings directory is not owned by the current user. Aborting authentication!"
            )
          );
        }
        fs2.readFile(filename, "ascii", function(err2, keyrings) {
          if (err2) return cb(err2);
          const lines = keyrings.split("\n");
          for (let l = 0; l < lines.length; ++l) {
            const data = lines[l].split(" ");
            if (id === data[0]) return cb(null, data[2]);
          }
          return cb(new Error("cookie not found"));
        });
      });
    }
    __name(getCookie, "getCookie");
    function hexlify(input) {
      return Buffer2.from(input.toString(), "ascii").toString("hex");
    }
    __name(hexlify, "hexlify");
    module2.exports = /* @__PURE__ */ __name(function auth(stream, opts, cb) {
      let authMethods;
      if (opts.authMethods) {
        authMethods = opts.authMethods;
      } else {
        authMethods = constants.defaultAuthMethods;
      }
      stream.write("\0");
      tryAuth(stream, authMethods.slice(), cb);
    }, "auth");
    function tryAuth(stream, methods, cb) {
      if (methods.length === 0) {
        return cb(new Error("No authentication methods left to try"));
      }
      const authMethod = methods.shift();
      const uid = "getuid" in process ? process.getuid() : 0;
      const id = hexlify(uid);
      function beginOrNextAuth() {
        readLine(stream, function(line) {
          const ok = line.toString("ascii").match(/^([A-Za-z]+) (.*)/);
          if (ok && ok[1] === "OK") {
            stream.write("BEGIN\r\n");
            return cb(null, ok[2]);
          } else {
            if (!methods.empty) {
              tryAuth(stream, methods, cb);
            } else {
              return cb(line);
            }
          }
        });
      }
      __name(beginOrNextAuth, "beginOrNextAuth");
      switch (authMethod) {
        case "EXTERNAL":
          stream.write(`AUTH ${authMethod} ${id}\r
`);
          beginOrNextAuth();
          break;
        case "DBUS_COOKIE_SHA1":
          stream.write(`AUTH ${authMethod} ${id}\r
`);
          readLine(stream, function(line) {
            const data = Buffer2.from(
              line.toString().split(" ")[1].trim(),
              "hex"
            ).toString().split(" ");
            const cookieContext = data[0];
            const cookieId = data[1];
            const serverChallenge = data[2];
            const clientChallenge = crypto.randomBytes(16).toString("hex");
            getCookie(cookieContext, cookieId, function(err, cookie) {
              if (err) return cb(err);
              const response = sha1(
                [serverChallenge, clientChallenge, cookie].join(":")
              );
              const reply = hexlify(clientChallenge + response);
              stream.write(`DATA ${reply}\r
`);
              beginOrNextAuth();
            });
          });
          break;
        case "ANONYMOUS":
          stream.write("AUTH ANONYMOUS \r\n");
          beginOrNextAuth();
          break;
        default:
          console.error(`Unsupported auth method: ${authMethod}`);
          beginOrNextAuth();
          break;
      }
    }
    __name(tryAuth, "tryAuth");
  }
});

// node_modules/dbus-next/lib/address-x11.js
var require_address_x11 = __commonJS({
  "node_modules/dbus-next/lib/address-x11.js"(exports2, module2) {
    var fs2 = require("fs");
    var os2 = require("os");
    function getDbusAddressFromWindowSelection(callback) {
      const x11 = require("x11");
      if (x11 === null) {
        throw new Error("cannot get session bus address from window selection: dbus-next was installed without x11 support");
      }
      fs2.readFile("/var/lib/dbus/machine-id", "ascii", function(err, uuid) {
        if (err) return callback(err);
        const hostname = os2.hostname().split("-")[0];
        x11.createClient(function(err2, display) {
          if (err2) return callback(err2);
          const X = display.client;
          const selectionName = `_DBUS_SESSION_BUS_SELECTION_${hostname}_${uuid.trim()}`;
          X.InternAtom(false, selectionName, function(err3, id) {
            if (err3) return callback(err3);
            X.GetSelectionOwner(id, function(err4, win) {
              if (err4) return callback(err4);
              X.InternAtom(false, "_DBUS_SESSION_BUS_ADDRESS", function(err5, propId) {
                if (err5) return callback(err5);
                win = display.screen[0].root;
                X.GetProperty(0, win, propId, 0, 0, 1e7, function(err6, val) {
                  if (err6) return callback(err6);
                  callback(null, val.data.toString());
                });
              });
            });
          });
        });
      });
    }
    __name(getDbusAddressFromWindowSelection, "getDbusAddressFromWindowSelection");
    function getDbusAddressFromFs() {
      const home = process.env.HOME;
      const display = process.env.DISPLAY;
      if (!display) {
        throw new Error("could not get DISPLAY environment variable to get dbus address");
      }
      const reg = /.*:([0-9]+)\.?.*/;
      const match = display.match(reg);
      if (!match || !match[1]) {
        throw new Error("could not parse DISPLAY environment variable to get dbus address");
      }
      const displayNum = match[1];
      const machineId = fs2.readFileSync("/var/lib/dbus/machine-id").toString().trim();
      const dbusInfo = fs2.readFileSync(`${home}/.dbus/session-bus/${machineId}-${displayNum}`).toString().trim();
      for (let line of dbusInfo.split("\n")) {
        line = line.trim();
        if (line.startsWith("DBUS_SESSION_BUS_ADDRESS=")) {
          let address = line.split("DBUS_SESSION_BUS_ADDRESS=")[1];
          if (!address) {
            throw new Error("DBUS_SESSION_BUS_ADDRESS variable is set incorrectly in dbus info file");
          }
          const removeQuotes = /^['"]?(.*?)['"]?$/;
          address = address.match(removeQuotes)[1];
          return address;
        }
      }
      throw new Error("DBUS_SESSION_BUS_ADDRESS was not set in dbus info file");
    }
    __name(getDbusAddressFromFs, "getDbusAddressFromFs");
    module2.exports = {
      getDbusAddressFromFs,
      getDbusAddressFromWindowSelection
    };
  }
});

// node_modules/dbus-next/lib/marshall-compat.js
var require_marshall_compat = __commonJS({
  "node_modules/dbus-next/lib/marshall-compat.js"(exports2, module2) {
    var { parseSignature, collapseSignature } = require_signature();
    var { Variant } = require_variant();
    var message = require_message();
    function valueIsMarshallVariant(value) {
      return Array.isArray(value) && value.length === 2 && Array.isArray(value[0]) && value[0].length > 0 && value[0][0].type;
    }
    __name(valueIsMarshallVariant, "valueIsMarshallVariant");
    function marshallVariantToJs(variant) {
      const type = variant[0][0];
      const value = variant[1][0];
      if (!type.child.length) {
        if (valueIsMarshallVariant(value)) {
          return new Variant(collapseSignature(value[0][0]), marshallVariantToJs(value));
        } else {
          return value;
        }
      }
      if (type.type === "a") {
        if (type.child[0].type === "y") {
          return value;
        } else if (type.child[0].type === "{") {
          const result = {};
          for (let i = 0; i < value.length; ++i) {
            result[value[i][0]] = marshallVariantToJs([[type.child[0].child[1]], [value[i][1]]]);
          }
          return result;
        } else {
          const result = [];
          for (let i = 0; i < value.length; ++i) {
            result[i] = marshallVariantToJs([[type.child[0]], [value[i]]]);
          }
          return result;
        }
      } else if (type.type === "(") {
        const result = [];
        for (let i = 0; i < value.length; ++i) {
          result[i] = marshallVariantToJs([[type.child[i]], [value[i]]]);
        }
        return result;
      }
    }
    __name(marshallVariantToJs, "marshallVariantToJs");
    function messageToJsFmt(message2) {
      const { signature = "", body = [] } = message2;
      const bodyJs = [];
      const signatureTree = parseSignature(signature);
      for (let i = 0; i < signatureTree.length; ++i) {
        const tree = signatureTree[i];
        bodyJs.push(marshallVariantToJs([[tree], [body[i]]]));
      }
      message2.body = bodyJs;
      message2.signature = signature;
      return message2;
    }
    __name(messageToJsFmt, "messageToJsFmt");
    function jsToMarshalFmt(signature, value) {
      if (value === void 0) {
        throw new Error(`expected value for signature: ${signature}`);
      }
      if (signature === void 0) {
        throw new Error(`expected signature for value: ${value}`);
      }
      let signatureStr = null;
      if (typeof signature === "string") {
        signatureStr = signature;
        signature = parseSignature(signature)[0];
      } else {
        signatureStr = collapseSignature(signature);
      }
      if (signature.child.length === 0) {
        if (signature.type === "v") {
          if (value.constructor !== Variant) {
            throw new Error(`expected a Variant for value (got ${typeof value})`);
          }
          return [signature.type, jsToMarshalFmt(value.signature, value.value)];
        } else {
          return [signature.type, value];
        }
      }
      if (signature.type === "a" && signature.child[0].type === "y" && value.constructor === Buffer) {
        return [signatureStr, value];
      } else if (signature.type === "a") {
        let result = [];
        if (signature.child[0].type === "y") {
          result = value;
        } else if (signature.child[0].type === "{") {
          if (value.constructor !== Object) {
            throw new Error(`expecting an object for signature '${signatureStr}' (got ${typeof value})`);
          }
          for (const k of Object.keys(value)) {
            const v = value[k];
            if (v.constructor === Variant) {
              result.push([k, jsToMarshalFmt(v.signature, v.value)]);
            } else {
              result.push([k, jsToMarshalFmt(signature.child[0].child[1], v)[1]]);
            }
          }
        } else {
          if (!Array.isArray(value)) {
            throw new Error(`expecting an array for signature '${signatureStr}' (got ${typeof value})`);
          }
          for (const v of value) {
            if (v.constructor === Variant) {
              result.push(jsToMarshalFmt(v.signature, v.value));
            } else {
              result.push(jsToMarshalFmt(signature.child[0], v)[1]);
            }
          }
        }
        return [signatureStr, result];
      } else if (signature.type === "(") {
        if (!Array.isArray(value)) {
          throw new Error(`expecting an array for signature '${signatureStr}' (got ${typeof value})`);
        }
        if (value.length !== signature.child.length) {
          throw new Error(`expecting struct to have ${signature.child.length} members (got ${value.length} members)`);
        }
        const result = [];
        for (let i = 0; i < value.length; ++i) {
          const v = value[i];
          if (signature.child[i] === "v") {
            if (v.constructor !== Variant) {
              throw new Error(`expected a Variant for struct member ${i + 1} (got ${v})`);
            }
            result.push(jsToMarshalFmt(v.signature, v.value));
          } else {
            result.push(jsToMarshalFmt(signature.child[i], v)[1]);
          }
        }
        return [signatureStr, result];
      } else {
        throw new Error(`got unknown complex type: ${signature.type}`);
      }
    }
    __name(jsToMarshalFmt, "jsToMarshalFmt");
    function marshallMessage(msg) {
      const { signature = "", body = [] } = msg;
      const signatureTree = parseSignature(signature);
      if (signatureTree.length !== body.length) {
        throw new Error(`Expected ${signatureTree.length} body elements for signature '${signature}' (got ${body.length})`);
      }
      const marshallerBody = [];
      for (let i = 0; i < body.length; ++i) {
        if (signatureTree[i].type === "v") {
          if (body[i].constructor !== Variant) {
            throw new Error(`Expected a Variant() argument for position ${i + 1} (value='${body[i]}')`);
          }
          marshallerBody.push(jsToMarshalFmt(body[i].signature, body[i].value));
        } else {
          marshallerBody.push(jsToMarshalFmt(signatureTree[i], body[i])[1]);
        }
      }
      msg.signature = signature;
      msg.body = marshallerBody;
      return message.marshall(msg);
    }
    __name(marshallMessage, "marshallMessage");
    module2.exports = {
      messageToJsFmt,
      marshallMessage
    };
  }
});

// node_modules/through/index.js
var require_through = __commonJS({
  "node_modules/through/index.js"(exports2, module2) {
    var Stream = require("stream");
    exports2 = module2.exports = through;
    through.through = through;
    function through(write, end, opts) {
      write = write || function(data) {
        this.queue(data);
      };
      end = end || function() {
        this.queue(null);
      };
      var ended = false, destroyed = false, buffer = [], _ended = false;
      var stream = new Stream();
      stream.readable = stream.writable = true;
      stream.paused = false;
      stream.autoDestroy = !(opts && opts.autoDestroy === false);
      stream.write = function(data) {
        write.call(this, data);
        return !stream.paused;
      };
      function drain() {
        while (buffer.length && !stream.paused) {
          var data = buffer.shift();
          if (null === data)
            return stream.emit("end");
          else
            stream.emit("data", data);
        }
      }
      __name(drain, "drain");
      stream.queue = stream.push = function(data) {
        if (_ended) return stream;
        if (data === null) _ended = true;
        buffer.push(data);
        drain();
        return stream;
      };
      stream.on("end", function() {
        stream.readable = false;
        if (!stream.writable && stream.autoDestroy)
          process.nextTick(function() {
            stream.destroy();
          });
      });
      function _end() {
        stream.writable = false;
        end.call(stream);
        if (!stream.readable && stream.autoDestroy)
          stream.destroy();
      }
      __name(_end, "_end");
      stream.end = function(data) {
        if (ended) return;
        ended = true;
        if (arguments.length) stream.write(data);
        _end();
        return stream;
      };
      stream.destroy = function() {
        if (destroyed) return;
        destroyed = true;
        ended = true;
        buffer.length = 0;
        stream.writable = stream.readable = false;
        stream.emit("close");
        return stream;
      };
      stream.pause = function() {
        if (stream.paused) return;
        stream.paused = true;
        return stream;
      };
      stream.resume = function() {
        if (stream.paused) {
          stream.paused = false;
          stream.emit("resume");
        }
        drain();
        if (!stream.paused)
          stream.emit("drain");
        return stream;
      };
      return stream;
    }
    __name(through, "through");
  }
});

// node_modules/from/index.js
var require_from = __commonJS({
  "node_modules/from/index.js"(exports2, module2) {
    "use strict";
    var Stream = require("stream");
    module2.exports = /* @__PURE__ */ __name(function from(source) {
      if (Array.isArray(source)) {
        var source_index = 0, source_len = source.length;
        return from(function(i2) {
          if (source_index < source_len)
            this.emit("data", source[source_index++]);
          else
            this.emit("end");
          return true;
        });
      }
      var s = new Stream(), i = 0;
      s.ended = false;
      s.started = false;
      s.readable = true;
      s.writable = false;
      s.paused = false;
      s.ended = false;
      s.pause = function() {
        s.started = true;
        s.paused = true;
      };
      function next() {
        s.started = true;
        if (s.ended) return;
        while (!s.ended && !s.paused && source.call(s, i++, function() {
          if (!s.ended && !s.paused)
            process.nextTick(next);
        }))
          ;
      }
      __name(next, "next");
      s.resume = function() {
        s.started = true;
        s.paused = false;
        next();
      };
      s.on("end", function() {
        s.ended = true;
        s.readable = false;
        process.nextTick(s.destroy);
      });
      s.destroy = function() {
        s.ended = true;
        s.emit("close");
      };
      process.nextTick(function() {
        if (!s.started) s.resume();
      });
      return s;
    }, "from");
  }
});

// node_modules/duplexer/index.js
var require_duplexer = __commonJS({
  "node_modules/duplexer/index.js"(exports2, module2) {
    var Stream = require("stream");
    var writeMethods = ["write", "end", "destroy"];
    var readMethods = ["resume", "pause"];
    var readEvents = ["data", "close"];
    var slice = Array.prototype.slice;
    module2.exports = duplex;
    function forEach(arr, fn) {
      if (arr.forEach) {
        return arr.forEach(fn);
      }
      for (var i = 0; i < arr.length; i++) {
        fn(arr[i], i);
      }
    }
    __name(forEach, "forEach");
    function duplex(writer, reader) {
      var stream = new Stream();
      var ended = false;
      forEach(writeMethods, proxyWriter);
      forEach(readMethods, proxyReader);
      forEach(readEvents, proxyStream);
      reader.on("end", handleEnd);
      writer.on("drain", function() {
        stream.emit("drain");
      });
      writer.on("error", reemit);
      reader.on("error", reemit);
      stream.writable = writer.writable;
      stream.readable = reader.readable;
      return stream;
      function proxyWriter(methodName) {
        stream[methodName] = method;
        function method() {
          return writer[methodName].apply(writer, arguments);
        }
        __name(method, "method");
      }
      __name(proxyWriter, "proxyWriter");
      function proxyReader(methodName) {
        stream[methodName] = method;
        function method() {
          stream.emit(methodName);
          var func = reader[methodName];
          if (func) {
            return func.apply(reader, arguments);
          }
          reader.emit(methodName);
        }
        __name(method, "method");
      }
      __name(proxyReader, "proxyReader");
      function proxyStream(methodName) {
        reader.on(methodName, reemit2);
        function reemit2() {
          var args = slice.call(arguments);
          args.unshift(methodName);
          stream.emit.apply(stream, args);
        }
        __name(reemit2, "reemit");
      }
      __name(proxyStream, "proxyStream");
      function handleEnd() {
        if (ended) {
          return;
        }
        ended = true;
        var args = slice.call(arguments);
        args.unshift("end");
        stream.emit.apply(stream, args);
      }
      __name(handleEnd, "handleEnd");
      function reemit(err) {
        stream.emit("error", err);
      }
      __name(reemit, "reemit");
    }
    __name(duplex, "duplex");
  }
});

// node_modules/map-stream/index.js
var require_map_stream = __commonJS({
  "node_modules/map-stream/index.js"(exports2, module2) {
    var Stream = require("stream").Stream;
    module2.exports = function(mapper, opts) {
      var stream = new Stream(), self = this, inputs = 0, outputs = 0, ended = false, paused = false, destroyed = false, lastWritten = 0, inNext = false;
      this.opts = opts || {};
      var errorEventName = this.opts.failures ? "failure" : "error";
      var writeQueue = {};
      stream.writable = true;
      stream.readable = true;
      function queueData(data, number) {
        var nextToWrite = lastWritten + 1;
        if (number === nextToWrite) {
          if (data !== void 0) {
            stream.emit.apply(stream, ["data", data]);
          }
          lastWritten++;
          nextToWrite++;
        } else {
          writeQueue[number] = data;
        }
        if (writeQueue.hasOwnProperty(nextToWrite)) {
          var dataToWrite = writeQueue[nextToWrite];
          delete writeQueue[nextToWrite];
          return queueData(dataToWrite, nextToWrite);
        }
        outputs++;
        if (inputs === outputs) {
          if (paused) paused = false, stream.emit("drain");
          if (ended) end();
        }
      }
      __name(queueData, "queueData");
      function next(err, data, number) {
        if (destroyed) return;
        inNext = true;
        if (!err || self.opts.failures) {
          queueData(data, number);
        }
        if (err) {
          stream.emit.apply(stream, [errorEventName, err]);
        }
        inNext = false;
      }
      __name(next, "next");
      function wrappedMapper(input, number, callback) {
        return mapper.call(null, input, function(err, data) {
          callback(err, data, number);
        });
      }
      __name(wrappedMapper, "wrappedMapper");
      stream.write = function(data) {
        if (ended) throw new Error("map stream is not writable");
        inNext = false;
        inputs++;
        try {
          var written = wrappedMapper(data, inputs, next);
          paused = written === false;
          return !paused;
        } catch (err) {
          if (inNext)
            throw err;
          next(err);
          return !paused;
        }
      };
      function end(data) {
        ended = true;
        stream.writable = false;
        if (data !== void 0) {
          return queueData(data, inputs);
        } else if (inputs == outputs) {
          stream.readable = false, stream.emit("end"), stream.destroy();
        }
      }
      __name(end, "end");
      stream.end = function(data) {
        if (ended) return;
        end();
      };
      stream.destroy = function() {
        ended = destroyed = true;
        stream.writable = stream.readable = paused = false;
        process.nextTick(function() {
          stream.emit("close");
        });
      };
      stream.pause = function() {
        paused = true;
      };
      stream.resume = function() {
        paused = false;
      };
      return stream;
    };
  }
});

// node_modules/pause-stream/index.js
var require_pause_stream = __commonJS({
  "node_modules/pause-stream/index.js"(exports2, module2) {
    module2.exports = require_through();
  }
});

// node_modules/split/index.js
var require_split = __commonJS({
  "node_modules/split/index.js"(exports2, module2) {
    var through = require_through();
    var Decoder = require("string_decoder").StringDecoder;
    module2.exports = split;
    function split(matcher, mapper, options) {
      var decoder = new Decoder();
      var soFar = "";
      var maxLength = options && options.maxLength;
      if ("function" === typeof matcher)
        mapper = matcher, matcher = null;
      if (!matcher)
        matcher = /\r?\n/;
      function emit(stream, piece) {
        if (mapper) {
          try {
            piece = mapper(piece);
          } catch (err) {
            return stream.emit("error", err);
          }
          if ("undefined" !== typeof piece)
            stream.queue(piece);
        } else
          stream.queue(piece);
      }
      __name(emit, "emit");
      function next(stream, buffer) {
        var pieces = ((soFar != null ? soFar : "") + buffer).split(matcher);
        soFar = pieces.pop();
        if (maxLength && soFar.length > maxLength)
          stream.emit("error", new Error("maximum buffer reached"));
        for (var i = 0; i < pieces.length; i++) {
          var piece = pieces[i];
          emit(stream, piece);
        }
      }
      __name(next, "next");
      return through(
        function(b) {
          next(this, decoder.write(b));
        },
        function() {
          if (decoder.end)
            next(this, decoder.end());
          if (soFar != null)
            emit(this, soFar);
          this.queue(null);
        }
      );
    }
    __name(split, "split");
  }
});

// node_modules/stream-combiner/index.js
var require_stream_combiner = __commonJS({
  "node_modules/stream-combiner/index.js"(exports2, module2) {
    var duplexer = require_duplexer();
    module2.exports = function() {
      var streams = [].slice.call(arguments), first = streams[0], last = streams[streams.length - 1], thepipe = duplexer(first, last);
      if (streams.length == 1)
        return streams[0];
      else if (!streams.length)
        throw new Error("connect called with empty args");
      function recurse(streams2) {
        if (streams2.length < 2)
          return;
        streams2[0].pipe(streams2[1]);
        recurse(streams2.slice(1));
      }
      __name(recurse, "recurse");
      recurse(streams);
      function onerror() {
        var args = [].slice.call(arguments);
        args.unshift("error");
        thepipe.emit.apply(thepipe, args);
      }
      __name(onerror, "onerror");
      for (var i = 1; i < streams.length - 1; i++)
        streams[i].on("error", onerror);
      return thepipe;
    };
  }
});

// node_modules/event-stream/index.js
var require_event_stream = __commonJS({
  "node_modules/event-stream/index.js"(exports2) {
    var Stream = require("stream").Stream;
    var es = exports2;
    var through = require_through();
    var from = require_from();
    var duplex = require_duplexer();
    var map = require_map_stream();
    var pause = require_pause_stream();
    var split = require_split();
    var pipeline = require_stream_combiner();
    var immediately = global.setImmediate || process.nextTick;
    es.Stream = Stream;
    es.through = through;
    es.from = from;
    es.duplex = duplex;
    es.map = map;
    es.pause = pause;
    es.split = split;
    es.pipeline = es.connect = es.pipe = pipeline;
    es.concat = //actually this should be called concat
    es.merge = function() {
      var toMerge = [].slice.call(arguments);
      if (toMerge.length === 1 && toMerge[0] instanceof Array) {
        toMerge = toMerge[0];
      }
      var stream = new Stream();
      stream.setMaxListeners(0);
      var endCount = 0;
      stream.writable = stream.readable = true;
      if (toMerge.length) {
        toMerge.forEach(function(e) {
          e.pipe(stream, { end: false });
          var ended = false;
          e.on("end", function() {
            if (ended) return;
            ended = true;
            endCount++;
            if (endCount == toMerge.length)
              stream.emit("end");
          });
        });
      } else {
        process.nextTick(function() {
          stream.emit("end");
        });
      }
      stream.write = function(data) {
        this.emit("data", data);
      };
      stream.destroy = function() {
        toMerge.forEach(function(e) {
          if (e.destroy) e.destroy();
        });
      };
      return stream;
    };
    es.writeArray = function(done) {
      if ("function" !== typeof done)
        throw new Error("function writeArray (done): done must be function");
      var a = new Stream(), array = [], isDone = false;
      a.write = function(l) {
        array.push(l);
      };
      a.end = function() {
        isDone = true;
        done(null, array);
      };
      a.writable = true;
      a.readable = false;
      a.destroy = function() {
        a.writable = a.readable = false;
        if (isDone) return;
        done(new Error("destroyed before end"), array);
      };
      return a;
    };
    es.readArray = function(array) {
      var stream = new Stream(), i = 0, paused = false, ended = false;
      stream.readable = true;
      stream.writable = false;
      if (!Array.isArray(array))
        throw new Error("event-stream.read expects an array");
      stream.resume = function() {
        if (ended) return;
        paused = false;
        var l = array.length;
        while (i < l && !paused && !ended) {
          stream.emit("data", array[i++]);
        }
        if (i == l && !ended)
          ended = true, stream.readable = false, stream.emit("end");
      };
      process.nextTick(stream.resume);
      stream.pause = function() {
        paused = true;
      };
      stream.destroy = function() {
        ended = true;
        stream.emit("close");
      };
      return stream;
    };
    es.readable = function(func, continueOnError) {
      var stream = new Stream(), i = 0, paused = false, ended = false, reading = false;
      stream.readable = true;
      stream.writable = false;
      if ("function" !== typeof func)
        throw new Error("event-stream.readable expects async function");
      stream.on("end", function() {
        ended = true;
      });
      function get(err, data) {
        if (err) {
          stream.emit("error", err);
          if (!continueOnError) stream.emit("end");
        } else if (arguments.length > 1)
          stream.emit("data", data);
        immediately(function() {
          if (ended || paused || reading) return;
          try {
            reading = true;
            func.call(stream, i++, function() {
              reading = false;
              get.apply(null, arguments);
            });
          } catch (err2) {
            stream.emit("error", err2);
          }
        });
      }
      __name(get, "get");
      stream.resume = function() {
        paused = false;
        get();
      };
      process.nextTick(get);
      stream.pause = function() {
        paused = true;
      };
      stream.destroy = function() {
        stream.emit("end");
        stream.emit("close");
        ended = true;
      };
      return stream;
    };
    es.mapSync = function(sync) {
      return es.through(/* @__PURE__ */ __name(function write(data) {
        var mappedData;
        try {
          mappedData = sync(data);
        } catch (err) {
          return this.emit("error", err);
        }
        if (mappedData !== void 0)
          this.emit("data", mappedData);
      }, "write"));
    };
    es.log = function(name) {
      return es.through(function(data) {
        var args = [].slice.call(arguments);
        if (name) console.error(name, data);
        else console.error(data);
        this.emit("data", data);
      });
    };
    es.child = function(child) {
      return es.duplex(child.stdin, child.stdout);
    };
    es.parse = function(options) {
      var emitError = !!(options ? options.error : false);
      return es.through(function(data) {
        var obj;
        try {
          if (data)
            obj = JSON.parse(data.toString());
        } catch (err) {
          if (emitError)
            return this.emit("error", err);
          return console.error(err, "attempting to parse:", data);
        }
        if (obj !== void 0)
          this.emit("data", obj);
      });
    };
    es.stringify = function() {
      var Buffer2 = require("buffer").Buffer;
      return es.mapSync(function(e) {
        return JSON.stringify(Buffer2.isBuffer(e) ? e.toString() : e) + "\n";
      });
    };
    es.replace = function(from2, to) {
      return es.pipeline(es.split(from2), es.join(to));
    };
    es.join = function(str) {
      if ("function" === typeof str)
        return es.wait(str);
      var first = true;
      return es.through(function(data) {
        if (!first)
          this.emit("data", str);
        first = false;
        this.emit("data", data);
        return true;
      });
    };
    es.wait = function(callback) {
      var arr = [];
      return es.through(
        function(data) {
          arr.push(data);
        },
        function() {
          var body = Buffer.isBuffer(arr[0]) ? Buffer.concat(arr) : arr.join("");
          this.emit("data", body);
          this.emit("end");
          if (callback) callback(null, body);
        }
      );
    };
    es.pipeable = function() {
      throw new Error("[EVENT-STREAM] es.pipeable is deprecated");
    };
  }
});

// node_modules/dbus-next/lib/connection.js
var require_connection = __commonJS({
  "node_modules/dbus-next/lib/connection.js"(exports2, module2) {
    var EventEmitter = require("events").EventEmitter;
    var net = require("net");
    var message = require_message();
    var clientHandshake = require_handshake();
    var { getDbusAddressFromFs } = require_address_x11();
    var { Message } = require_message_type();
    var { messageToJsFmt, marshallMessage } = require_marshall_compat();
    function createStream(opts) {
      let { busAddress } = opts;
      if (!busAddress) {
        busAddress = process.env.DBUS_SESSION_BUS_ADDRESS;
      }
      if (!busAddress) {
        busAddress = getDbusAddressFromFs();
      }
      const addresses = busAddress.split(";");
      for (let i = 0; i < addresses.length; ++i) {
        const address = addresses[i];
        const familyParams = address.split(":");
        const family = familyParams[0];
        const params = {};
        familyParams[1].split(",").forEach(function(p) {
          const keyVal = p.split("=");
          params[keyVal[0]] = keyVal[1];
        });
        try {
          switch (family.toLowerCase()) {
            case "tcp": {
              const host = params.host || "localhost";
              const port = params.port;
              return net.createConnection(port, host);
            }
            case "unix": {
              if (params.socket) {
                return net.createConnection(params.socket);
              }
              if (params.abstract) {
                const abs = require("abstract-socket");
                return abs.connect("\0" + params.abstract);
              }
              if (params.path) {
                return net.createConnection(params.path);
              }
              throw new Error(
                "not enough parameters for 'unix' connection - you need to specify 'socket' or 'abstract' or 'path' parameter"
              );
            }
            case "unixexec": {
              const eventStream = require_event_stream();
              const spawn = require("child_process").spawn;
              const args = [];
              for (let n = 1; params["arg" + n]; n++) args.push(params["arg" + n]);
              const child = spawn(params.path, args);
              return eventStream.duplex(child.stdin, child.stdout);
            }
            default: {
              throw new Error("unknown address type:" + family);
            }
          }
        } catch (e) {
          if (i < addresses.length - 1) {
            console.warn(e.message);
            continue;
          } else {
            throw e;
          }
        }
      }
    }
    __name(createStream, "createStream");
    function createConnection(opts) {
      const self = new EventEmitter();
      opts = opts || {};
      const stream = self.stream = createStream(opts);
      stream.setNoDelay();
      stream.on("error", function(err) {
        self.emit("error", err);
      });
      stream.on("end", function() {
        self.emit("end");
        self.message = function() {
          self.emit("error", new Error("Tried to write a message to a closed stream"));
        };
      });
      self.end = function() {
        stream.end();
        return self;
      };
      clientHandshake(stream, opts, function(error, guid) {
        if (error) {
          return self.emit("error", error);
        }
        self.guid = guid;
        self.emit("connect");
        message.unmarshalMessages(
          stream,
          function(message2) {
            try {
              message2 = new Message(messageToJsFmt(message2));
            } catch (err) {
              self.emit("error", err, `There was an error receiving a message (this is probably a bug in dbus-next): ${message2}`);
              return;
            }
            self.emit("message", message2);
          },
          opts
        );
      });
      self._messages = [];
      self.message = function(msg) {
        self._messages.push(msg);
      };
      self.once("connect", function() {
        self.state = "connected";
        for (let i = 0; i < self._messages.length; ++i) {
          stream.write(marshallMessage(self._messages[i]));
        }
        self._messages.length = 0;
        self.message = function(msg) {
          if (!stream.writable) {
            throw new Error("Cannot send message, stream is closed");
          }
          stream.write(marshallMessage(msg));
        };
      });
      return self;
    }
    __name(createConnection, "createConnection");
    module2.exports = createConnection;
  }
});

// node_modules/dbus-next/index.js
var require_dbus_next = __commonJS({
  "node_modules/dbus-next/index.js"(exports2, module2) {
    var constants = require_constants2();
    var MessageBus = require_bus();
    var errors = require_errors();
    var { Variant } = require_variant();
    var { Message } = require_message_type();
    var iface = require_interface();
    var createConnection = require_connection();
    var createClient = /* @__PURE__ */ __name(function(params) {
      let connection = createConnection(params || {});
      return new MessageBus(connection);
    }, "createClient");
    module2.exports.systemBus = function() {
      return createClient({
        busAddress: process.env.DBUS_SYSTEM_BUS_ADDRESS || "unix:path=/var/run/dbus/system_bus_socket"
      });
    };
    module2.exports.sessionBus = function(opts) {
      return createClient(opts);
    };
    module2.exports.setBigIntCompat = require_library_options().setBigIntCompat;
    module2.exports.NameFlag = constants.NameFlag;
    module2.exports.RequestNameReply = constants.RequestNameReply;
    module2.exports.ReleaseNameReply = constants.ReleaseNameReply;
    module2.exports.MessageType = constants.MessageType;
    module2.exports.MessageFlag = constants.MessageFlag;
    module2.exports.interface = iface;
    module2.exports.Variant = Variant;
    module2.exports.Message = Message;
    module2.exports.validators = require_validators();
    module2.exports.DBusError = errors.DBusError;
  }
});

// node_modules/mpris-service/dist/logging.js
var require_logging = __commonJS({
  "node_modules/mpris-service/dist/logging.js"(exports2, module2) {
    var loggingEnabled = process.env.MPRIS_SERVICE_DEBUG !== void 0 && process.env.MPRIS_SERVICE_DEBUG !== "0";
    module2.exports.debug = function(message) {
      if (loggingEnabled) {
        console.log(message);
      }
    };
    module2.exports.warn = function(message) {
      if (loggingEnabled) {
        console.warn(message);
      }
    };
  }
});

// node_modules/mpris-service/dist/interfaces/types.js
var require_types = __commonJS({
  "node_modules/mpris-service/dist/interfaces/types.js"(exports2, module2) {
    var Variant = require_dbus_next().Variant;
    var logging = require_logging();
    function guessMetadataSignature(key, value) {
      if (key === "mpris:trackid") {
        return "o";
      } else if (key === "mpris:length") {
        return "x";
      } else if (typeof value === "string") {
        return "s";
      } else if (typeof value === "boolean") {
        return "b";
      } else if (typeof value === "number") {
        return "d";
      } else if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
        return "as";
      } else {
        logging.warn(`could not determine metadata type for ${key}: ${value}`);
        return null;
      }
    }
    __name(guessMetadataSignature, "guessMetadataSignature");
    function metadataToPlain(metadataVariant) {
      let metadataPlain = {};
      for (let k of Object.keys(metadataVariant)) {
        let value = metadataVariant[k];
        if (value === void 0 || value === null) {
          logging.warn(`ignoring a null metadata value for key ${k}`);
          continue;
        }
        if (value.constructor === Variant) {
          metadataPlain[k] = value.value;
        } else {
          metadataPlain[k] = value;
        }
      }
      return metadataPlain;
    }
    __name(metadataToPlain, "metadataToPlain");
    function metadataToDbus(metadataPlain) {
      let metadataVariant = {};
      for (let k of Object.keys(metadataPlain)) {
        let value = metadataPlain[k];
        let signature = guessMetadataSignature(k, value);
        if (signature) {
          metadataVariant[k] = new Variant(signature, value);
        }
      }
      return metadataVariant;
    }
    __name(metadataToDbus, "metadataToDbus");
    var emptyPlaylist = ["/", "", ""];
    function playlistToDbus(playlist) {
      if (!playlist) {
        return emptyPlaylist;
      }
      let {
        Id,
        Name,
        Icon
      } = playlist;
      return [Id, Name, Icon];
    }
    __name(playlistToDbus, "playlistToDbus");
    function playlistToPlain(wire) {
      let [Id, Name, Icon] = wire;
      return {
        Id,
        Name,
        Icon
      };
    }
    __name(playlistToPlain, "playlistToPlain");
    module2.exports = {
      metadataToPlain,
      metadataToDbus,
      playlistToPlain,
      playlistToDbus,
      emptyPlaylist
    };
  }
});

// node_modules/object-keys/isArguments.js
var require_isArguments = __commonJS({
  "node_modules/object-keys/isArguments.js"(exports2, module2) {
    "use strict";
    var toStr = Object.prototype.toString;
    module2.exports = /* @__PURE__ */ __name(function isArguments(value) {
      var str = toStr.call(value);
      var isArgs = str === "[object Arguments]";
      if (!isArgs) {
        isArgs = str !== "[object Array]" && value !== null && typeof value === "object" && typeof value.length === "number" && value.length >= 0 && toStr.call(value.callee) === "[object Function]";
      }
      return isArgs;
    }, "isArguments");
  }
});

// node_modules/object-keys/implementation.js
var require_implementation = __commonJS({
  "node_modules/object-keys/implementation.js"(exports2, module2) {
    "use strict";
    var keysShim;
    if (!Object.keys) {
      has = Object.prototype.hasOwnProperty;
      toStr = Object.prototype.toString;
      isArgs = require_isArguments();
      isEnumerable = Object.prototype.propertyIsEnumerable;
      hasDontEnumBug = !isEnumerable.call({ toString: null }, "toString");
      hasProtoEnumBug = isEnumerable.call(function() {
      }, "prototype");
      dontEnums = [
        "toString",
        "toLocaleString",
        "valueOf",
        "hasOwnProperty",
        "isPrototypeOf",
        "propertyIsEnumerable",
        "constructor"
      ];
      equalsConstructorPrototype = /* @__PURE__ */ __name(function(o) {
        var ctor = o.constructor;
        return ctor && ctor.prototype === o;
      }, "equalsConstructorPrototype");
      excludedKeys = {
        $applicationCache: true,
        $console: true,
        $external: true,
        $frame: true,
        $frameElement: true,
        $frames: true,
        $innerHeight: true,
        $innerWidth: true,
        $onmozfullscreenchange: true,
        $onmozfullscreenerror: true,
        $outerHeight: true,
        $outerWidth: true,
        $pageXOffset: true,
        $pageYOffset: true,
        $parent: true,
        $scrollLeft: true,
        $scrollTop: true,
        $scrollX: true,
        $scrollY: true,
        $self: true,
        $webkitIndexedDB: true,
        $webkitStorageInfo: true,
        $window: true
      };
      hasAutomationEqualityBug = (function() {
        if (typeof window === "undefined") {
          return false;
        }
        for (var k in window) {
          try {
            if (!excludedKeys["$" + k] && has.call(window, k) && window[k] !== null && typeof window[k] === "object") {
              try {
                equalsConstructorPrototype(window[k]);
              } catch (e) {
                return true;
              }
            }
          } catch (e) {
            return true;
          }
        }
        return false;
      })();
      equalsConstructorPrototypeIfNotBuggy = /* @__PURE__ */ __name(function(o) {
        if (typeof window === "undefined" || !hasAutomationEqualityBug) {
          return equalsConstructorPrototype(o);
        }
        try {
          return equalsConstructorPrototype(o);
        } catch (e) {
          return false;
        }
      }, "equalsConstructorPrototypeIfNotBuggy");
      keysShim = /* @__PURE__ */ __name(function keys(object) {
        var isObject = object !== null && typeof object === "object";
        var isFunction = toStr.call(object) === "[object Function]";
        var isArguments = isArgs(object);
        var isString = isObject && toStr.call(object) === "[object String]";
        var theKeys = [];
        if (!isObject && !isFunction && !isArguments) {
          throw new TypeError("Object.keys called on a non-object");
        }
        var skipProto = hasProtoEnumBug && isFunction;
        if (isString && object.length > 0 && !has.call(object, 0)) {
          for (var i = 0; i < object.length; ++i) {
            theKeys.push(String(i));
          }
        }
        if (isArguments && object.length > 0) {
          for (var j = 0; j < object.length; ++j) {
            theKeys.push(String(j));
          }
        } else {
          for (var name in object) {
            if (!(skipProto && name === "prototype") && has.call(object, name)) {
              theKeys.push(String(name));
            }
          }
        }
        if (hasDontEnumBug) {
          var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);
          for (var k = 0; k < dontEnums.length; ++k) {
            if (!(skipConstructor && dontEnums[k] === "constructor") && has.call(object, dontEnums[k])) {
              theKeys.push(dontEnums[k]);
            }
          }
        }
        return theKeys;
      }, "keys");
    }
    var has;
    var toStr;
    var isArgs;
    var isEnumerable;
    var hasDontEnumBug;
    var hasProtoEnumBug;
    var dontEnums;
    var equalsConstructorPrototype;
    var excludedKeys;
    var hasAutomationEqualityBug;
    var equalsConstructorPrototypeIfNotBuggy;
    module2.exports = keysShim;
  }
});

// node_modules/object-keys/index.js
var require_object_keys = __commonJS({
  "node_modules/object-keys/index.js"(exports2, module2) {
    "use strict";
    var slice = Array.prototype.slice;
    var isArgs = require_isArguments();
    var origKeys = Object.keys;
    var keysShim = origKeys ? /* @__PURE__ */ __name(function keys(o) {
      return origKeys(o);
    }, "keys") : require_implementation();
    var originalKeys = Object.keys;
    keysShim.shim = /* @__PURE__ */ __name(function shimObjectKeys() {
      if (Object.keys) {
        var keysWorksWithArguments = (function() {
          var args = Object.keys(arguments);
          return args && args.length === arguments.length;
        })(1, 2);
        if (!keysWorksWithArguments) {
          Object.keys = /* @__PURE__ */ __name(function keys(object) {
            if (isArgs(object)) {
              return originalKeys(slice.call(object));
            }
            return originalKeys(object);
          }, "keys");
        }
      } else {
        Object.keys = keysShim;
      }
      return Object.keys || keysShim;
    }, "shimObjectKeys");
    module2.exports = keysShim;
  }
});

// node_modules/has-symbols/shams.js
var require_shams = __commonJS({
  "node_modules/has-symbols/shams.js"(exports2, module2) {
    "use strict";
    module2.exports = /* @__PURE__ */ __name(function hasSymbols() {
      if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function") {
        return false;
      }
      if (typeof Symbol.iterator === "symbol") {
        return true;
      }
      var obj = {};
      var sym = /* @__PURE__ */ Symbol("test");
      var symObj = Object(sym);
      if (typeof sym === "string") {
        return false;
      }
      if (Object.prototype.toString.call(sym) !== "[object Symbol]") {
        return false;
      }
      if (Object.prototype.toString.call(symObj) !== "[object Symbol]") {
        return false;
      }
      var symVal = 42;
      obj[sym] = symVal;
      for (var _ in obj) {
        return false;
      }
      if (typeof Object.keys === "function" && Object.keys(obj).length !== 0) {
        return false;
      }
      if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(obj).length !== 0) {
        return false;
      }
      var syms = Object.getOwnPropertySymbols(obj);
      if (syms.length !== 1 || syms[0] !== sym) {
        return false;
      }
      if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
        return false;
      }
      if (typeof Object.getOwnPropertyDescriptor === "function") {
        var descriptor = (
          /** @type {PropertyDescriptor} */
          Object.getOwnPropertyDescriptor(obj, sym)
        );
        if (descriptor.value !== symVal || descriptor.enumerable !== true) {
          return false;
        }
      }
      return true;
    }, "hasSymbols");
  }
});

// node_modules/has-tostringtag/shams.js
var require_shams2 = __commonJS({
  "node_modules/has-tostringtag/shams.js"(exports2, module2) {
    "use strict";
    var hasSymbols = require_shams();
    module2.exports = /* @__PURE__ */ __name(function hasToStringTagShams() {
      return hasSymbols() && !!Symbol.toStringTag;
    }, "hasToStringTagShams");
  }
});

// node_modules/es-object-atoms/index.js
var require_es_object_atoms = __commonJS({
  "node_modules/es-object-atoms/index.js"(exports2, module2) {
    "use strict";
    module2.exports = Object;
  }
});

// node_modules/es-errors/index.js
var require_es_errors = __commonJS({
  "node_modules/es-errors/index.js"(exports2, module2) {
    "use strict";
    module2.exports = Error;
  }
});

// node_modules/es-errors/eval.js
var require_eval = __commonJS({
  "node_modules/es-errors/eval.js"(exports2, module2) {
    "use strict";
    module2.exports = EvalError;
  }
});

// node_modules/es-errors/range.js
var require_range = __commonJS({
  "node_modules/es-errors/range.js"(exports2, module2) {
    "use strict";
    module2.exports = RangeError;
  }
});

// node_modules/es-errors/ref.js
var require_ref = __commonJS({
  "node_modules/es-errors/ref.js"(exports2, module2) {
    "use strict";
    module2.exports = ReferenceError;
  }
});

// node_modules/es-errors/syntax.js
var require_syntax = __commonJS({
  "node_modules/es-errors/syntax.js"(exports2, module2) {
    "use strict";
    module2.exports = SyntaxError;
  }
});

// node_modules/es-errors/type.js
var require_type = __commonJS({
  "node_modules/es-errors/type.js"(exports2, module2) {
    "use strict";
    module2.exports = TypeError;
  }
});

// node_modules/es-errors/uri.js
var require_uri = __commonJS({
  "node_modules/es-errors/uri.js"(exports2, module2) {
    "use strict";
    module2.exports = URIError;
  }
});

// node_modules/math-intrinsics/abs.js
var require_abs = __commonJS({
  "node_modules/math-intrinsics/abs.js"(exports2, module2) {
    "use strict";
    module2.exports = Math.abs;
  }
});

// node_modules/math-intrinsics/floor.js
var require_floor = __commonJS({
  "node_modules/math-intrinsics/floor.js"(exports2, module2) {
    "use strict";
    module2.exports = Math.floor;
  }
});

// node_modules/math-intrinsics/max.js
var require_max = __commonJS({
  "node_modules/math-intrinsics/max.js"(exports2, module2) {
    "use strict";
    module2.exports = Math.max;
  }
});

// node_modules/math-intrinsics/min.js
var require_min = __commonJS({
  "node_modules/math-intrinsics/min.js"(exports2, module2) {
    "use strict";
    module2.exports = Math.min;
  }
});

// node_modules/math-intrinsics/pow.js
var require_pow = __commonJS({
  "node_modules/math-intrinsics/pow.js"(exports2, module2) {
    "use strict";
    module2.exports = Math.pow;
  }
});

// node_modules/math-intrinsics/round.js
var require_round = __commonJS({
  "node_modules/math-intrinsics/round.js"(exports2, module2) {
    "use strict";
    module2.exports = Math.round;
  }
});

// node_modules/math-intrinsics/isNaN.js
var require_isNaN = __commonJS({
  "node_modules/math-intrinsics/isNaN.js"(exports2, module2) {
    "use strict";
    module2.exports = Number.isNaN || /* @__PURE__ */ __name(function isNaN2(a) {
      return a !== a;
    }, "isNaN");
  }
});

// node_modules/math-intrinsics/sign.js
var require_sign = __commonJS({
  "node_modules/math-intrinsics/sign.js"(exports2, module2) {
    "use strict";
    var $isNaN = require_isNaN();
    module2.exports = /* @__PURE__ */ __name(function sign(number) {
      if ($isNaN(number) || number === 0) {
        return number;
      }
      return number < 0 ? -1 : 1;
    }, "sign");
  }
});

// node_modules/gopd/gOPD.js
var require_gOPD = __commonJS({
  "node_modules/gopd/gOPD.js"(exports2, module2) {
    "use strict";
    module2.exports = Object.getOwnPropertyDescriptor;
  }
});

// node_modules/gopd/index.js
var require_gopd = __commonJS({
  "node_modules/gopd/index.js"(exports2, module2) {
    "use strict";
    var $gOPD = require_gOPD();
    if ($gOPD) {
      try {
        $gOPD([], "length");
      } catch (e) {
        $gOPD = null;
      }
    }
    module2.exports = $gOPD;
  }
});

// node_modules/es-define-property/index.js
var require_es_define_property = __commonJS({
  "node_modules/es-define-property/index.js"(exports2, module2) {
    "use strict";
    var $defineProperty = Object.defineProperty || false;
    if ($defineProperty) {
      try {
        $defineProperty({}, "a", { value: 1 });
      } catch (e) {
        $defineProperty = false;
      }
    }
    module2.exports = $defineProperty;
  }
});

// node_modules/has-symbols/index.js
var require_has_symbols = __commonJS({
  "node_modules/has-symbols/index.js"(exports2, module2) {
    "use strict";
    var origSymbol = typeof Symbol !== "undefined" && Symbol;
    var hasSymbolSham = require_shams();
    module2.exports = /* @__PURE__ */ __name(function hasNativeSymbols() {
      if (typeof origSymbol !== "function") {
        return false;
      }
      if (typeof Symbol !== "function") {
        return false;
      }
      if (typeof origSymbol("foo") !== "symbol") {
        return false;
      }
      if (typeof /* @__PURE__ */ Symbol("bar") !== "symbol") {
        return false;
      }
      return hasSymbolSham();
    }, "hasNativeSymbols");
  }
});

// node_modules/get-proto/Reflect.getPrototypeOf.js
var require_Reflect_getPrototypeOf = __commonJS({
  "node_modules/get-proto/Reflect.getPrototypeOf.js"(exports2, module2) {
    "use strict";
    module2.exports = typeof Reflect !== "undefined" && Reflect.getPrototypeOf || null;
  }
});

// node_modules/get-proto/Object.getPrototypeOf.js
var require_Object_getPrototypeOf = __commonJS({
  "node_modules/get-proto/Object.getPrototypeOf.js"(exports2, module2) {
    "use strict";
    var $Object = require_es_object_atoms();
    module2.exports = $Object.getPrototypeOf || null;
  }
});

// node_modules/function-bind/implementation.js
var require_implementation2 = __commonJS({
  "node_modules/function-bind/implementation.js"(exports2, module2) {
    "use strict";
    var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
    var toStr = Object.prototype.toString;
    var max = Math.max;
    var funcType = "[object Function]";
    var concatty = /* @__PURE__ */ __name(function concatty2(a, b) {
      var arr = [];
      for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
      }
      for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
      }
      return arr;
    }, "concatty");
    var slicy = /* @__PURE__ */ __name(function slicy2(arrLike, offset) {
      var arr = [];
      for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
      }
      return arr;
    }, "slicy");
    var joiny = /* @__PURE__ */ __name(function(arr, joiner) {
      var str = "";
      for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
          str += joiner;
        }
      }
      return str;
    }, "joiny");
    module2.exports = /* @__PURE__ */ __name(function bind(that2) {
      var target = this;
      if (typeof target !== "function" || toStr.apply(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
      }
      var args = slicy(arguments, 1);
      var bound;
      var binder = /* @__PURE__ */ __name(function() {
        if (this instanceof bound) {
          var result = target.apply(
            this,
            concatty(args, arguments)
          );
          if (Object(result) === result) {
            return result;
          }
          return this;
        }
        return target.apply(
          that2,
          concatty(args, arguments)
        );
      }, "binder");
      var boundLength = max(0, target.length - args.length);
      var boundArgs = [];
      for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = "$" + i;
      }
      bound = Function("binder", "return function (" + joiny(boundArgs, ",") + "){ return binder.apply(this,arguments); }")(binder);
      if (target.prototype) {
        var Empty = /* @__PURE__ */ __name(function Empty2() {
        }, "Empty");
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
      }
      return bound;
    }, "bind");
  }
});

// node_modules/function-bind/index.js
var require_function_bind = __commonJS({
  "node_modules/function-bind/index.js"(exports2, module2) {
    "use strict";
    var implementation = require_implementation2();
    module2.exports = Function.prototype.bind || implementation;
  }
});

// node_modules/call-bind-apply-helpers/functionCall.js
var require_functionCall = __commonJS({
  "node_modules/call-bind-apply-helpers/functionCall.js"(exports2, module2) {
    "use strict";
    module2.exports = Function.prototype.call;
  }
});

// node_modules/call-bind-apply-helpers/functionApply.js
var require_functionApply = __commonJS({
  "node_modules/call-bind-apply-helpers/functionApply.js"(exports2, module2) {
    "use strict";
    module2.exports = Function.prototype.apply;
  }
});

// node_modules/call-bind-apply-helpers/reflectApply.js
var require_reflectApply = __commonJS({
  "node_modules/call-bind-apply-helpers/reflectApply.js"(exports2, module2) {
    "use strict";
    module2.exports = typeof Reflect !== "undefined" && Reflect && Reflect.apply;
  }
});

// node_modules/call-bind-apply-helpers/actualApply.js
var require_actualApply = __commonJS({
  "node_modules/call-bind-apply-helpers/actualApply.js"(exports2, module2) {
    "use strict";
    var bind = require_function_bind();
    var $apply = require_functionApply();
    var $call = require_functionCall();
    var $reflectApply = require_reflectApply();
    module2.exports = $reflectApply || bind.call($call, $apply);
  }
});

// node_modules/call-bind-apply-helpers/index.js
var require_call_bind_apply_helpers = __commonJS({
  "node_modules/call-bind-apply-helpers/index.js"(exports2, module2) {
    "use strict";
    var bind = require_function_bind();
    var $TypeError = require_type();
    var $call = require_functionCall();
    var $actualApply = require_actualApply();
    module2.exports = /* @__PURE__ */ __name(function callBindBasic(args) {
      if (args.length < 1 || typeof args[0] !== "function") {
        throw new $TypeError("a function is required");
      }
      return $actualApply(bind, $call, args);
    }, "callBindBasic");
  }
});

// node_modules/dunder-proto/get.js
var require_get = __commonJS({
  "node_modules/dunder-proto/get.js"(exports2, module2) {
    "use strict";
    var callBind = require_call_bind_apply_helpers();
    var gOPD = require_gopd();
    var hasProtoAccessor;
    try {
      hasProtoAccessor = /** @type {{ __proto__?: typeof Array.prototype }} */
      [].__proto__ === Array.prototype;
    } catch (e) {
      if (!e || typeof e !== "object" || !("code" in e) || e.code !== "ERR_PROTO_ACCESS") {
        throw e;
      }
    }
    var desc = !!hasProtoAccessor && gOPD && gOPD(
      Object.prototype,
      /** @type {keyof typeof Object.prototype} */
      "__proto__"
    );
    var $Object = Object;
    var $getPrototypeOf = $Object.getPrototypeOf;
    module2.exports = desc && typeof desc.get === "function" ? callBind([desc.get]) : typeof $getPrototypeOf === "function" ? (
      /** @type {import('./get')} */
      /* @__PURE__ */ __name(function getDunder(value) {
        return $getPrototypeOf(value == null ? value : $Object(value));
      }, "getDunder")
    ) : false;
  }
});

// node_modules/get-proto/index.js
var require_get_proto = __commonJS({
  "node_modules/get-proto/index.js"(exports2, module2) {
    "use strict";
    var reflectGetProto = require_Reflect_getPrototypeOf();
    var originalGetProto = require_Object_getPrototypeOf();
    var getDunderProto = require_get();
    module2.exports = reflectGetProto ? /* @__PURE__ */ __name(function getProto(O) {
      return reflectGetProto(O);
    }, "getProto") : originalGetProto ? /* @__PURE__ */ __name(function getProto(O) {
      if (!O || typeof O !== "object" && typeof O !== "function") {
        throw new TypeError("getProto: not an object");
      }
      return originalGetProto(O);
    }, "getProto") : getDunderProto ? /* @__PURE__ */ __name(function getProto(O) {
      return getDunderProto(O);
    }, "getProto") : null;
  }
});

// node_modules/hasown/index.js
var require_hasown = __commonJS({
  "node_modules/hasown/index.js"(exports2, module2) {
    "use strict";
    var call = Function.prototype.call;
    var $hasOwn = Object.prototype.hasOwnProperty;
    var bind = require_function_bind();
    module2.exports = bind.call(call, $hasOwn);
  }
});

// node_modules/get-intrinsic/index.js
var require_get_intrinsic = __commonJS({
  "node_modules/get-intrinsic/index.js"(exports2, module2) {
    "use strict";
    var undefined2;
    var $Object = require_es_object_atoms();
    var $Error = require_es_errors();
    var $EvalError = require_eval();
    var $RangeError = require_range();
    var $ReferenceError = require_ref();
    var $SyntaxError = require_syntax();
    var $TypeError = require_type();
    var $URIError = require_uri();
    var abs = require_abs();
    var floor = require_floor();
    var max = require_max();
    var min = require_min();
    var pow = require_pow();
    var round = require_round();
    var sign = require_sign();
    var $Function = Function;
    var getEvalledConstructor = /* @__PURE__ */ __name(function(expressionSyntax) {
      try {
        return $Function('"use strict"; return (' + expressionSyntax + ").constructor;")();
      } catch (e) {
      }
    }, "getEvalledConstructor");
    var $gOPD = require_gopd();
    var $defineProperty = require_es_define_property();
    var throwTypeError = /* @__PURE__ */ __name(function() {
      throw new $TypeError();
    }, "throwTypeError");
    var ThrowTypeError = $gOPD ? (function() {
      try {
        arguments.callee;
        return throwTypeError;
      } catch (calleeThrows) {
        try {
          return $gOPD(arguments, "callee").get;
        } catch (gOPDthrows) {
          return throwTypeError;
        }
      }
    })() : throwTypeError;
    var hasSymbols = require_has_symbols()();
    var getProto = require_get_proto();
    var $ObjectGPO = require_Object_getPrototypeOf();
    var $ReflectGPO = require_Reflect_getPrototypeOf();
    var $apply = require_functionApply();
    var $call = require_functionCall();
    var needsEval = {};
    var TypedArray = typeof Uint8Array === "undefined" || !getProto ? undefined2 : getProto(Uint8Array);
    var INTRINSICS = {
      __proto__: null,
      "%AggregateError%": typeof AggregateError === "undefined" ? undefined2 : AggregateError,
      "%Array%": Array,
      "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? undefined2 : ArrayBuffer,
      "%ArrayIteratorPrototype%": hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined2,
      "%AsyncFromSyncIteratorPrototype%": undefined2,
      "%AsyncFunction%": needsEval,
      "%AsyncGenerator%": needsEval,
      "%AsyncGeneratorFunction%": needsEval,
      "%AsyncIteratorPrototype%": needsEval,
      "%Atomics%": typeof Atomics === "undefined" ? undefined2 : Atomics,
      "%BigInt%": typeof BigInt === "undefined" ? undefined2 : BigInt,
      "%BigInt64Array%": typeof BigInt64Array === "undefined" ? undefined2 : BigInt64Array,
      "%BigUint64Array%": typeof BigUint64Array === "undefined" ? undefined2 : BigUint64Array,
      "%Boolean%": Boolean,
      "%DataView%": typeof DataView === "undefined" ? undefined2 : DataView,
      "%Date%": Date,
      "%decodeURI%": decodeURI,
      "%decodeURIComponent%": decodeURIComponent,
      "%encodeURI%": encodeURI,
      "%encodeURIComponent%": encodeURIComponent,
      "%Error%": $Error,
      "%eval%": eval,
      // eslint-disable-line no-eval
      "%EvalError%": $EvalError,
      "%Float16Array%": typeof Float16Array === "undefined" ? undefined2 : Float16Array,
      "%Float32Array%": typeof Float32Array === "undefined" ? undefined2 : Float32Array,
      "%Float64Array%": typeof Float64Array === "undefined" ? undefined2 : Float64Array,
      "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? undefined2 : FinalizationRegistry,
      "%Function%": $Function,
      "%GeneratorFunction%": needsEval,
      "%Int8Array%": typeof Int8Array === "undefined" ? undefined2 : Int8Array,
      "%Int16Array%": typeof Int16Array === "undefined" ? undefined2 : Int16Array,
      "%Int32Array%": typeof Int32Array === "undefined" ? undefined2 : Int32Array,
      "%isFinite%": isFinite,
      "%isNaN%": isNaN,
      "%IteratorPrototype%": hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined2,
      "%JSON%": typeof JSON === "object" ? JSON : undefined2,
      "%Map%": typeof Map === "undefined" ? undefined2 : Map,
      "%MapIteratorPrototype%": typeof Map === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Map())[Symbol.iterator]()),
      "%Math%": Math,
      "%Number%": Number,
      "%Object%": $Object,
      "%Object.getOwnPropertyDescriptor%": $gOPD,
      "%parseFloat%": parseFloat,
      "%parseInt%": parseInt,
      "%Promise%": typeof Promise === "undefined" ? undefined2 : Promise,
      "%Proxy%": typeof Proxy === "undefined" ? undefined2 : Proxy,
      "%RangeError%": $RangeError,
      "%ReferenceError%": $ReferenceError,
      "%Reflect%": typeof Reflect === "undefined" ? undefined2 : Reflect,
      "%RegExp%": RegExp,
      "%Set%": typeof Set === "undefined" ? undefined2 : Set,
      "%SetIteratorPrototype%": typeof Set === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Set())[Symbol.iterator]()),
      "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? undefined2 : SharedArrayBuffer,
      "%String%": String,
      "%StringIteratorPrototype%": hasSymbols && getProto ? getProto(""[Symbol.iterator]()) : undefined2,
      "%Symbol%": hasSymbols ? Symbol : undefined2,
      "%SyntaxError%": $SyntaxError,
      "%ThrowTypeError%": ThrowTypeError,
      "%TypedArray%": TypedArray,
      "%TypeError%": $TypeError,
      "%Uint8Array%": typeof Uint8Array === "undefined" ? undefined2 : Uint8Array,
      "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? undefined2 : Uint8ClampedArray,
      "%Uint16Array%": typeof Uint16Array === "undefined" ? undefined2 : Uint16Array,
      "%Uint32Array%": typeof Uint32Array === "undefined" ? undefined2 : Uint32Array,
      "%URIError%": $URIError,
      "%WeakMap%": typeof WeakMap === "undefined" ? undefined2 : WeakMap,
      "%WeakRef%": typeof WeakRef === "undefined" ? undefined2 : WeakRef,
      "%WeakSet%": typeof WeakSet === "undefined" ? undefined2 : WeakSet,
      "%Function.prototype.call%": $call,
      "%Function.prototype.apply%": $apply,
      "%Object.defineProperty%": $defineProperty,
      "%Object.getPrototypeOf%": $ObjectGPO,
      "%Math.abs%": abs,
      "%Math.floor%": floor,
      "%Math.max%": max,
      "%Math.min%": min,
      "%Math.pow%": pow,
      "%Math.round%": round,
      "%Math.sign%": sign,
      "%Reflect.getPrototypeOf%": $ReflectGPO
    };
    if (getProto) {
      try {
        null.error;
      } catch (e) {
        errorProto = getProto(getProto(e));
        INTRINSICS["%Error.prototype%"] = errorProto;
      }
    }
    var errorProto;
    var doEval = /* @__PURE__ */ __name(function doEval2(name) {
      var value;
      if (name === "%AsyncFunction%") {
        value = getEvalledConstructor("async function () {}");
      } else if (name === "%GeneratorFunction%") {
        value = getEvalledConstructor("function* () {}");
      } else if (name === "%AsyncGeneratorFunction%") {
        value = getEvalledConstructor("async function* () {}");
      } else if (name === "%AsyncGenerator%") {
        var fn = doEval2("%AsyncGeneratorFunction%");
        if (fn) {
          value = fn.prototype;
        }
      } else if (name === "%AsyncIteratorPrototype%") {
        var gen = doEval2("%AsyncGenerator%");
        if (gen && getProto) {
          value = getProto(gen.prototype);
        }
      }
      INTRINSICS[name] = value;
      return value;
    }, "doEval");
    var LEGACY_ALIASES = {
      __proto__: null,
      "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
      "%ArrayPrototype%": ["Array", "prototype"],
      "%ArrayProto_entries%": ["Array", "prototype", "entries"],
      "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
      "%ArrayProto_keys%": ["Array", "prototype", "keys"],
      "%ArrayProto_values%": ["Array", "prototype", "values"],
      "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
      "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
      "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
      "%BooleanPrototype%": ["Boolean", "prototype"],
      "%DataViewPrototype%": ["DataView", "prototype"],
      "%DatePrototype%": ["Date", "prototype"],
      "%ErrorPrototype%": ["Error", "prototype"],
      "%EvalErrorPrototype%": ["EvalError", "prototype"],
      "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
      "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
      "%FunctionPrototype%": ["Function", "prototype"],
      "%Generator%": ["GeneratorFunction", "prototype"],
      "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
      "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
      "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
      "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
      "%JSONParse%": ["JSON", "parse"],
      "%JSONStringify%": ["JSON", "stringify"],
      "%MapPrototype%": ["Map", "prototype"],
      "%NumberPrototype%": ["Number", "prototype"],
      "%ObjectPrototype%": ["Object", "prototype"],
      "%ObjProto_toString%": ["Object", "prototype", "toString"],
      "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
      "%PromisePrototype%": ["Promise", "prototype"],
      "%PromiseProto_then%": ["Promise", "prototype", "then"],
      "%Promise_all%": ["Promise", "all"],
      "%Promise_reject%": ["Promise", "reject"],
      "%Promise_resolve%": ["Promise", "resolve"],
      "%RangeErrorPrototype%": ["RangeError", "prototype"],
      "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
      "%RegExpPrototype%": ["RegExp", "prototype"],
      "%SetPrototype%": ["Set", "prototype"],
      "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
      "%StringPrototype%": ["String", "prototype"],
      "%SymbolPrototype%": ["Symbol", "prototype"],
      "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
      "%TypedArrayPrototype%": ["TypedArray", "prototype"],
      "%TypeErrorPrototype%": ["TypeError", "prototype"],
      "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
      "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
      "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
      "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
      "%URIErrorPrototype%": ["URIError", "prototype"],
      "%WeakMapPrototype%": ["WeakMap", "prototype"],
      "%WeakSetPrototype%": ["WeakSet", "prototype"]
    };
    var bind = require_function_bind();
    var hasOwn = require_hasown();
    var $concat = bind.call($call, Array.prototype.concat);
    var $spliceApply = bind.call($apply, Array.prototype.splice);
    var $replace = bind.call($call, String.prototype.replace);
    var $strSlice = bind.call($call, String.prototype.slice);
    var $exec = bind.call($call, RegExp.prototype.exec);
    var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
    var reEscapeChar = /\\(\\)?/g;
    var stringToPath = /* @__PURE__ */ __name(function stringToPath2(string) {
      var first = $strSlice(string, 0, 1);
      var last = $strSlice(string, -1);
      if (first === "%" && last !== "%") {
        throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");
      } else if (last === "%" && first !== "%") {
        throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");
      }
      var result = [];
      $replace(string, rePropName, function(match, number, quote, subString) {
        result[result.length] = quote ? $replace(subString, reEscapeChar, "$1") : number || match;
      });
      return result;
    }, "stringToPath");
    var getBaseIntrinsic = /* @__PURE__ */ __name(function getBaseIntrinsic2(name, allowMissing) {
      var intrinsicName = name;
      var alias;
      if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
        alias = LEGACY_ALIASES[intrinsicName];
        intrinsicName = "%" + alias[0] + "%";
      }
      if (hasOwn(INTRINSICS, intrinsicName)) {
        var value = INTRINSICS[intrinsicName];
        if (value === needsEval) {
          value = doEval(intrinsicName);
        }
        if (typeof value === "undefined" && !allowMissing) {
          throw new $TypeError("intrinsic " + name + " exists, but is not available. Please file an issue!");
        }
        return {
          alias,
          name: intrinsicName,
          value
        };
      }
      throw new $SyntaxError("intrinsic " + name + " does not exist!");
    }, "getBaseIntrinsic");
    module2.exports = /* @__PURE__ */ __name(function GetIntrinsic(name, allowMissing) {
      if (typeof name !== "string" || name.length === 0) {
        throw new $TypeError("intrinsic name must be a non-empty string");
      }
      if (arguments.length > 1 && typeof allowMissing !== "boolean") {
        throw new $TypeError('"allowMissing" argument must be a boolean');
      }
      if ($exec(/^%?[^%]*%?$/, name) === null) {
        throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
      }
      var parts = stringToPath(name);
      var intrinsicBaseName = parts.length > 0 ? parts[0] : "";
      var intrinsic = getBaseIntrinsic("%" + intrinsicBaseName + "%", allowMissing);
      var intrinsicRealName = intrinsic.name;
      var value = intrinsic.value;
      var skipFurtherCaching = false;
      var alias = intrinsic.alias;
      if (alias) {
        intrinsicBaseName = alias[0];
        $spliceApply(parts, $concat([0, 1], alias));
      }
      for (var i = 1, isOwn = true; i < parts.length; i += 1) {
        var part = parts[i];
        var first = $strSlice(part, 0, 1);
        var last = $strSlice(part, -1);
        if ((first === '"' || first === "'" || first === "`" || (last === '"' || last === "'" || last === "`")) && first !== last) {
          throw new $SyntaxError("property names with quotes must have matching quotes");
        }
        if (part === "constructor" || !isOwn) {
          skipFurtherCaching = true;
        }
        intrinsicBaseName += "." + part;
        intrinsicRealName = "%" + intrinsicBaseName + "%";
        if (hasOwn(INTRINSICS, intrinsicRealName)) {
          value = INTRINSICS[intrinsicRealName];
        } else if (value != null) {
          if (!(part in value)) {
            if (!allowMissing) {
              throw new $TypeError("base intrinsic for " + name + " exists, but the property is not available.");
            }
            return void undefined2;
          }
          if ($gOPD && i + 1 >= parts.length) {
            var desc = $gOPD(value, part);
            isOwn = !!desc;
            if (isOwn && "get" in desc && !("originalValue" in desc.get)) {
              value = desc.get;
            } else {
              value = value[part];
            }
          } else {
            isOwn = hasOwn(value, part);
            value = value[part];
          }
          if (isOwn && !skipFurtherCaching) {
            INTRINSICS[intrinsicRealName] = value;
          }
        }
      }
      return value;
    }, "GetIntrinsic");
  }
});

// node_modules/call-bound/index.js
var require_call_bound = __commonJS({
  "node_modules/call-bound/index.js"(exports2, module2) {
    "use strict";
    var GetIntrinsic = require_get_intrinsic();
    var callBindBasic = require_call_bind_apply_helpers();
    var $indexOf = callBindBasic([GetIntrinsic("%String.prototype.indexOf%")]);
    module2.exports = /* @__PURE__ */ __name(function callBoundIntrinsic(name, allowMissing) {
      var intrinsic = (
        /** @type {(this: unknown, ...args: unknown[]) => unknown} */
        GetIntrinsic(name, !!allowMissing)
      );
      if (typeof intrinsic === "function" && $indexOf(name, ".prototype.") > -1) {
        return callBindBasic(
          /** @type {const} */
          [intrinsic]
        );
      }
      return intrinsic;
    }, "callBoundIntrinsic");
  }
});

// node_modules/is-arguments/index.js
var require_is_arguments = __commonJS({
  "node_modules/is-arguments/index.js"(exports2, module2) {
    "use strict";
    var hasToStringTag = require_shams2()();
    var callBound = require_call_bound();
    var $toString = callBound("Object.prototype.toString");
    var isStandardArguments = /* @__PURE__ */ __name(function isArguments(value) {
      if (hasToStringTag && value && typeof value === "object" && Symbol.toStringTag in value) {
        return false;
      }
      return $toString(value) === "[object Arguments]";
    }, "isArguments");
    var isLegacyArguments = /* @__PURE__ */ __name(function isArguments(value) {
      if (isStandardArguments(value)) {
        return true;
      }
      return value !== null && typeof value === "object" && "length" in value && typeof value.length === "number" && value.length >= 0 && $toString(value) !== "[object Array]" && "callee" in value && $toString(value.callee) === "[object Function]";
    }, "isArguments");
    var supportsStandardArguments = (function() {
      return isStandardArguments(arguments);
    })();
    isStandardArguments.isLegacyArguments = isLegacyArguments;
    module2.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;
  }
});

// node_modules/define-data-property/index.js
var require_define_data_property = __commonJS({
  "node_modules/define-data-property/index.js"(exports2, module2) {
    "use strict";
    var $defineProperty = require_es_define_property();
    var $SyntaxError = require_syntax();
    var $TypeError = require_type();
    var gopd = require_gopd();
    module2.exports = /* @__PURE__ */ __name(function defineDataProperty(obj, property, value) {
      if (!obj || typeof obj !== "object" && typeof obj !== "function") {
        throw new $TypeError("`obj` must be an object or a function`");
      }
      if (typeof property !== "string" && typeof property !== "symbol") {
        throw new $TypeError("`property` must be a string or a symbol`");
      }
      if (arguments.length > 3 && typeof arguments[3] !== "boolean" && arguments[3] !== null) {
        throw new $TypeError("`nonEnumerable`, if provided, must be a boolean or null");
      }
      if (arguments.length > 4 && typeof arguments[4] !== "boolean" && arguments[4] !== null) {
        throw new $TypeError("`nonWritable`, if provided, must be a boolean or null");
      }
      if (arguments.length > 5 && typeof arguments[5] !== "boolean" && arguments[5] !== null) {
        throw new $TypeError("`nonConfigurable`, if provided, must be a boolean or null");
      }
      if (arguments.length > 6 && typeof arguments[6] !== "boolean") {
        throw new $TypeError("`loose`, if provided, must be a boolean");
      }
      var nonEnumerable = arguments.length > 3 ? arguments[3] : null;
      var nonWritable = arguments.length > 4 ? arguments[4] : null;
      var nonConfigurable = arguments.length > 5 ? arguments[5] : null;
      var loose = arguments.length > 6 ? arguments[6] : false;
      var desc = !!gopd && gopd(obj, property);
      if ($defineProperty) {
        $defineProperty(obj, property, {
          configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable,
          enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable,
          value,
          writable: nonWritable === null && desc ? desc.writable : !nonWritable
        });
      } else if (loose || !nonEnumerable && !nonWritable && !nonConfigurable) {
        obj[property] = value;
      } else {
        throw new $SyntaxError("This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.");
      }
    }, "defineDataProperty");
  }
});

// node_modules/has-property-descriptors/index.js
var require_has_property_descriptors = __commonJS({
  "node_modules/has-property-descriptors/index.js"(exports2, module2) {
    "use strict";
    var $defineProperty = require_es_define_property();
    var hasPropertyDescriptors = /* @__PURE__ */ __name(function hasPropertyDescriptors2() {
      return !!$defineProperty;
    }, "hasPropertyDescriptors");
    hasPropertyDescriptors.hasArrayLengthDefineBug = /* @__PURE__ */ __name(function hasArrayLengthDefineBug() {
      if (!$defineProperty) {
        return null;
      }
      try {
        return $defineProperty([], "length", { value: 1 }).length !== 1;
      } catch (e) {
        return true;
      }
    }, "hasArrayLengthDefineBug");
    module2.exports = hasPropertyDescriptors;
  }
});

// node_modules/define-properties/index.js
var require_define_properties = __commonJS({
  "node_modules/define-properties/index.js"(exports2, module2) {
    "use strict";
    var keys = require_object_keys();
    var hasSymbols = typeof Symbol === "function" && typeof /* @__PURE__ */ Symbol("foo") === "symbol";
    var toStr = Object.prototype.toString;
    var concat = Array.prototype.concat;
    var defineDataProperty = require_define_data_property();
    var isFunction = /* @__PURE__ */ __name(function(fn) {
      return typeof fn === "function" && toStr.call(fn) === "[object Function]";
    }, "isFunction");
    var supportsDescriptors = require_has_property_descriptors()();
    var defineProperty = /* @__PURE__ */ __name(function(object, name, value, predicate) {
      if (name in object) {
        if (predicate === true) {
          if (object[name] === value) {
            return;
          }
        } else if (!isFunction(predicate) || !predicate()) {
          return;
        }
      }
      if (supportsDescriptors) {
        defineDataProperty(object, name, value, true);
      } else {
        defineDataProperty(object, name, value);
      }
    }, "defineProperty");
    var defineProperties = /* @__PURE__ */ __name(function(object, map) {
      var predicates = arguments.length > 2 ? arguments[2] : {};
      var props = keys(map);
      if (hasSymbols) {
        props = concat.call(props, Object.getOwnPropertySymbols(map));
      }
      for (var i = 0; i < props.length; i += 1) {
        defineProperty(object, props[i], map[props[i]], predicates[props[i]]);
      }
    }, "defineProperties");
    defineProperties.supportsDescriptors = !!supportsDescriptors;
    module2.exports = defineProperties;
  }
});

// node_modules/set-function-length/index.js
var require_set_function_length = __commonJS({
  "node_modules/set-function-length/index.js"(exports2, module2) {
    "use strict";
    var GetIntrinsic = require_get_intrinsic();
    var define2 = require_define_data_property();
    var hasDescriptors = require_has_property_descriptors()();
    var gOPD = require_gopd();
    var $TypeError = require_type();
    var $floor = GetIntrinsic("%Math.floor%");
    module2.exports = /* @__PURE__ */ __name(function setFunctionLength(fn, length) {
      if (typeof fn !== "function") {
        throw new $TypeError("`fn` is not a function");
      }
      if (typeof length !== "number" || length < 0 || length > 4294967295 || $floor(length) !== length) {
        throw new $TypeError("`length` must be a positive 32-bit integer");
      }
      var loose = arguments.length > 2 && !!arguments[2];
      var functionLengthIsConfigurable = true;
      var functionLengthIsWritable = true;
      if ("length" in fn && gOPD) {
        var desc = gOPD(fn, "length");
        if (desc && !desc.configurable) {
          functionLengthIsConfigurable = false;
        }
        if (desc && !desc.writable) {
          functionLengthIsWritable = false;
        }
      }
      if (functionLengthIsConfigurable || functionLengthIsWritable || !loose) {
        if (hasDescriptors) {
          define2(
            /** @type {Parameters<define>[0]} */
            fn,
            "length",
            length,
            true,
            true
          );
        } else {
          define2(
            /** @type {Parameters<define>[0]} */
            fn,
            "length",
            length
          );
        }
      }
      return fn;
    }, "setFunctionLength");
  }
});

// node_modules/call-bind-apply-helpers/applyBind.js
var require_applyBind = __commonJS({
  "node_modules/call-bind-apply-helpers/applyBind.js"(exports2, module2) {
    "use strict";
    var bind = require_function_bind();
    var $apply = require_functionApply();
    var actualApply = require_actualApply();
    module2.exports = /* @__PURE__ */ __name(function applyBind() {
      return actualApply(bind, $apply, arguments);
    }, "applyBind");
  }
});

// node_modules/call-bind/index.js
var require_call_bind = __commonJS({
  "node_modules/call-bind/index.js"(exports2, module2) {
    "use strict";
    var setFunctionLength = require_set_function_length();
    var $defineProperty = require_es_define_property();
    var callBindBasic = require_call_bind_apply_helpers();
    var applyBind = require_applyBind();
    module2.exports = /* @__PURE__ */ __name(function callBind(originalFunction) {
      var func = callBindBasic(arguments);
      var adjustedLength = 1 + originalFunction.length - (arguments.length - 1);
      return setFunctionLength(
        func,
        adjustedLength > 0 ? adjustedLength : 0,
        true
      );
    }, "callBind");
    if ($defineProperty) {
      $defineProperty(module2.exports, "apply", { value: applyBind });
    } else {
      module2.exports.apply = applyBind;
    }
  }
});

// node_modules/object-is/implementation.js
var require_implementation3 = __commonJS({
  "node_modules/object-is/implementation.js"(exports2, module2) {
    "use strict";
    var numberIsNaN = /* @__PURE__ */ __name(function(value) {
      return value !== value;
    }, "numberIsNaN");
    module2.exports = /* @__PURE__ */ __name(function is(a, b) {
      if (a === 0 && b === 0) {
        return 1 / a === 1 / b;
      }
      if (a === b) {
        return true;
      }
      if (numberIsNaN(a) && numberIsNaN(b)) {
        return true;
      }
      return false;
    }, "is");
  }
});

// node_modules/object-is/polyfill.js
var require_polyfill = __commonJS({
  "node_modules/object-is/polyfill.js"(exports2, module2) {
    "use strict";
    var implementation = require_implementation3();
    module2.exports = /* @__PURE__ */ __name(function getPolyfill() {
      return typeof Object.is === "function" ? Object.is : implementation;
    }, "getPolyfill");
  }
});

// node_modules/object-is/shim.js
var require_shim = __commonJS({
  "node_modules/object-is/shim.js"(exports2, module2) {
    "use strict";
    var getPolyfill = require_polyfill();
    var define2 = require_define_properties();
    module2.exports = /* @__PURE__ */ __name(function shimObjectIs() {
      var polyfill = getPolyfill();
      define2(Object, { is: polyfill }, {
        is: /* @__PURE__ */ __name(function testObjectIs() {
          return Object.is !== polyfill;
        }, "testObjectIs")
      });
      return polyfill;
    }, "shimObjectIs");
  }
});

// node_modules/object-is/index.js
var require_object_is = __commonJS({
  "node_modules/object-is/index.js"(exports2, module2) {
    "use strict";
    var define2 = require_define_properties();
    var callBind = require_call_bind();
    var implementation = require_implementation3();
    var getPolyfill = require_polyfill();
    var shim = require_shim();
    var polyfill = callBind(getPolyfill(), Object);
    define2(polyfill, {
      getPolyfill,
      implementation,
      shim
    });
    module2.exports = polyfill;
  }
});

// node_modules/is-regex/index.js
var require_is_regex = __commonJS({
  "node_modules/is-regex/index.js"(exports2, module2) {
    "use strict";
    var callBound = require_call_bound();
    var hasToStringTag = require_shams2()();
    var hasOwn = require_hasown();
    var gOPD = require_gopd();
    var fn;
    if (hasToStringTag) {
      $exec = callBound("RegExp.prototype.exec");
      isRegexMarker = {};
      throwRegexMarker = /* @__PURE__ */ __name(function() {
        throw isRegexMarker;
      }, "throwRegexMarker");
      badStringifier = {
        toString: throwRegexMarker,
        valueOf: throwRegexMarker
      };
      if (typeof Symbol.toPrimitive === "symbol") {
        badStringifier[Symbol.toPrimitive] = throwRegexMarker;
      }
      fn = /* @__PURE__ */ __name(function isRegex(value) {
        if (!value || typeof value !== "object") {
          return false;
        }
        var descriptor = (
          /** @type {NonNullable<typeof gOPD>} */
          gOPD(
            /** @type {{ lastIndex?: unknown }} */
            value,
            "lastIndex"
          )
        );
        var hasLastIndexDataProperty = descriptor && hasOwn(descriptor, "value");
        if (!hasLastIndexDataProperty) {
          return false;
        }
        try {
          $exec(
            value,
            /** @type {string} */
            /** @type {unknown} */
            badStringifier
          );
        } catch (e) {
          return e === isRegexMarker;
        }
      }, "isRegex");
    } else {
      $toString = callBound("Object.prototype.toString");
      regexClass = "[object RegExp]";
      fn = /* @__PURE__ */ __name(function isRegex(value) {
        if (!value || typeof value !== "object" && typeof value !== "function") {
          return false;
        }
        return $toString(value) === regexClass;
      }, "isRegex");
    }
    var $exec;
    var isRegexMarker;
    var throwRegexMarker;
    var badStringifier;
    var $toString;
    var regexClass;
    module2.exports = fn;
  }
});

// node_modules/functions-have-names/index.js
var require_functions_have_names = __commonJS({
  "node_modules/functions-have-names/index.js"(exports2, module2) {
    "use strict";
    var functionsHaveNames = /* @__PURE__ */ __name(function functionsHaveNames2() {
      return typeof (/* @__PURE__ */ __name(function f() {
      }, "f")).name === "string";
    }, "functionsHaveNames");
    var gOPD = Object.getOwnPropertyDescriptor;
    if (gOPD) {
      try {
        gOPD([], "length");
      } catch (e) {
        gOPD = null;
      }
    }
    functionsHaveNames.functionsHaveConfigurableNames = /* @__PURE__ */ __name(function functionsHaveConfigurableNames() {
      if (!functionsHaveNames() || !gOPD) {
        return false;
      }
      var desc = gOPD(function() {
      }, "name");
      return !!desc && !!desc.configurable;
    }, "functionsHaveConfigurableNames");
    var $bind = Function.prototype.bind;
    functionsHaveNames.boundFunctionsHaveNames = /* @__PURE__ */ __name(function boundFunctionsHaveNames() {
      return functionsHaveNames() && typeof $bind === "function" && (/* @__PURE__ */ __name(function f() {
      }, "f")).bind().name !== "";
    }, "boundFunctionsHaveNames");
    module2.exports = functionsHaveNames;
  }
});

// node_modules/set-function-name/index.js
var require_set_function_name = __commonJS({
  "node_modules/set-function-name/index.js"(exports2, module2) {
    "use strict";
    var define2 = require_define_data_property();
    var hasDescriptors = require_has_property_descriptors()();
    var functionsHaveConfigurableNames = require_functions_have_names().functionsHaveConfigurableNames();
    var $TypeError = require_type();
    module2.exports = /* @__PURE__ */ __name(function setFunctionName(fn, name) {
      if (typeof fn !== "function") {
        throw new $TypeError("`fn` is not a function");
      }
      var loose = arguments.length > 2 && !!arguments[2];
      if (!loose || functionsHaveConfigurableNames) {
        if (hasDescriptors) {
          define2(
            /** @type {Parameters<define>[0]} */
            fn,
            "name",
            name,
            true,
            true
          );
        } else {
          define2(
            /** @type {Parameters<define>[0]} */
            fn,
            "name",
            name
          );
        }
      }
      return fn;
    }, "setFunctionName");
  }
});

// node_modules/regexp.prototype.flags/implementation.js
var require_implementation4 = __commonJS({
  "node_modules/regexp.prototype.flags/implementation.js"(exports2, module2) {
    "use strict";
    var setFunctionName = require_set_function_name();
    var $TypeError = require_type();
    var $Object = Object;
    module2.exports = setFunctionName(/* @__PURE__ */ __name(function flags() {
      if (this == null || this !== $Object(this)) {
        throw new $TypeError("RegExp.prototype.flags getter called on non-object");
      }
      var result = "";
      if (this.hasIndices) {
        result += "d";
      }
      if (this.global) {
        result += "g";
      }
      if (this.ignoreCase) {
        result += "i";
      }
      if (this.multiline) {
        result += "m";
      }
      if (this.dotAll) {
        result += "s";
      }
      if (this.unicode) {
        result += "u";
      }
      if (this.unicodeSets) {
        result += "v";
      }
      if (this.sticky) {
        result += "y";
      }
      return result;
    }, "flags"), "get flags", true);
  }
});

// node_modules/regexp.prototype.flags/polyfill.js
var require_polyfill2 = __commonJS({
  "node_modules/regexp.prototype.flags/polyfill.js"(exports2, module2) {
    "use strict";
    var implementation = require_implementation4();
    var supportsDescriptors = require_define_properties().supportsDescriptors;
    var $gOPD = Object.getOwnPropertyDescriptor;
    module2.exports = /* @__PURE__ */ __name(function getPolyfill() {
      if (supportsDescriptors && /a/mig.flags === "gim") {
        var descriptor = $gOPD(RegExp.prototype, "flags");
        if (descriptor && typeof descriptor.get === "function" && "dotAll" in RegExp.prototype && "hasIndices" in RegExp.prototype) {
          var calls = "";
          var o = {};
          Object.defineProperty(o, "hasIndices", {
            get: /* @__PURE__ */ __name(function() {
              calls += "d";
            }, "get")
          });
          Object.defineProperty(o, "sticky", {
            get: /* @__PURE__ */ __name(function() {
              calls += "y";
            }, "get")
          });
          descriptor.get.call(o);
          if (calls === "dy") {
            return descriptor.get;
          }
        }
      }
      return implementation;
    }, "getPolyfill");
  }
});

// node_modules/regexp.prototype.flags/shim.js
var require_shim2 = __commonJS({
  "node_modules/regexp.prototype.flags/shim.js"(exports2, module2) {
    "use strict";
    var supportsDescriptors = require_define_properties().supportsDescriptors;
    var getPolyfill = require_polyfill2();
    var gOPD = require_gopd();
    var defineProperty = Object.defineProperty;
    var $TypeError = require_es_errors();
    var getProto = require_get_proto();
    var regex = /a/;
    module2.exports = /* @__PURE__ */ __name(function shimFlags() {
      if (!supportsDescriptors || !getProto) {
        throw new $TypeError("RegExp.prototype.flags requires a true ES5 environment that supports property descriptors");
      }
      var polyfill = getPolyfill();
      var proto = getProto(regex);
      var descriptor = gOPD(proto, "flags");
      if (!descriptor || descriptor.get !== polyfill) {
        defineProperty(proto, "flags", {
          configurable: true,
          enumerable: false,
          get: polyfill
        });
      }
      return polyfill;
    }, "shimFlags");
  }
});

// node_modules/regexp.prototype.flags/index.js
var require_regexp_prototype = __commonJS({
  "node_modules/regexp.prototype.flags/index.js"(exports2, module2) {
    "use strict";
    var define2 = require_define_properties();
    var callBind = require_call_bind();
    var implementation = require_implementation4();
    var getPolyfill = require_polyfill2();
    var shim = require_shim2();
    var flagsBound = callBind(getPolyfill());
    define2(flagsBound, {
      getPolyfill,
      implementation,
      shim
    });
    module2.exports = flagsBound;
  }
});

// node_modules/is-date-object/index.js
var require_is_date_object = __commonJS({
  "node_modules/is-date-object/index.js"(exports2, module2) {
    "use strict";
    var callBound = require_call_bound();
    var getDay = callBound("Date.prototype.getDay");
    var tryDateObject = /* @__PURE__ */ __name(function tryDateGetDayCall(value) {
      try {
        getDay(value);
        return true;
      } catch (e) {
        return false;
      }
    }, "tryDateGetDayCall");
    var toStr = callBound("Object.prototype.toString");
    var dateClass = "[object Date]";
    var hasToStringTag = require_shams2()();
    module2.exports = /* @__PURE__ */ __name(function isDateObject(value) {
      if (typeof value !== "object" || value === null) {
        return false;
      }
      return hasToStringTag ? tryDateObject(value) : toStr(value) === dateClass;
    }, "isDateObject");
  }
});

// node_modules/deep-equal/index.js
var require_deep_equal = __commonJS({
  "node_modules/deep-equal/index.js"(exports2, module2) {
    var objectKeys = require_object_keys();
    var isArguments = require_is_arguments();
    var is = require_object_is();
    var isRegex = require_is_regex();
    var flags = require_regexp_prototype();
    var isDate = require_is_date_object();
    var getTime = Date.prototype.getTime;
    function deepEqual(actual, expected, options) {
      var opts = options || {};
      if (opts.strict ? is(actual, expected) : actual === expected) {
        return true;
      }
      if (!actual || !expected || typeof actual !== "object" && typeof expected !== "object") {
        return opts.strict ? is(actual, expected) : actual == expected;
      }
      return objEquiv(actual, expected, opts);
    }
    __name(deepEqual, "deepEqual");
    function isUndefinedOrNull(value) {
      return value === null || value === void 0;
    }
    __name(isUndefinedOrNull, "isUndefinedOrNull");
    function isBuffer(x) {
      if (!x || typeof x !== "object" || typeof x.length !== "number") {
        return false;
      }
      if (typeof x.copy !== "function" || typeof x.slice !== "function") {
        return false;
      }
      if (x.length > 0 && typeof x[0] !== "number") {
        return false;
      }
      return true;
    }
    __name(isBuffer, "isBuffer");
    function objEquiv(a, b, opts) {
      var i, key;
      if (typeof a !== typeof b) {
        return false;
      }
      if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) {
        return false;
      }
      if (a.prototype !== b.prototype) {
        return false;
      }
      if (isArguments(a) !== isArguments(b)) {
        return false;
      }
      var aIsRegex = isRegex(a);
      var bIsRegex = isRegex(b);
      if (aIsRegex !== bIsRegex) {
        return false;
      }
      if (aIsRegex || bIsRegex) {
        return a.source === b.source && flags(a) === flags(b);
      }
      if (isDate(a) && isDate(b)) {
        return getTime.call(a) === getTime.call(b);
      }
      var aIsBuffer = isBuffer(a);
      var bIsBuffer = isBuffer(b);
      if (aIsBuffer !== bIsBuffer) {
        return false;
      }
      if (aIsBuffer || bIsBuffer) {
        if (a.length !== b.length) {
          return false;
        }
        for (i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) {
            return false;
          }
        }
        return true;
      }
      if (typeof a !== typeof b) {
        return false;
      }
      try {
        var ka = objectKeys(a);
        var kb = objectKeys(b);
      } catch (e) {
        return false;
      }
      if (ka.length !== kb.length) {
        return false;
      }
      ka.sort();
      kb.sort();
      for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] != kb[i]) {
          return false;
        }
      }
      for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!deepEqual(a[key], b[key], opts)) {
          return false;
        }
      }
      return true;
    }
    __name(objEquiv, "objEquiv");
    module2.exports = deepEqual;
  }
});

// node_modules/mpris-service/dist/constants.js
var require_constants3 = __commonJS({
  "node_modules/mpris-service/dist/constants.js"(exports2, module2) {
    var constants = {
      PLAYBACK_STATUS_PLAYING: "Playing",
      PLAYBACK_STATUS_PAUSED: "Paused",
      PLAYBACK_STATUS_STOPPED: "Stopped",
      LOOP_STATUS_NONE: "None",
      LOOP_STATUS_TRACK: "Track",
      LOOP_STATUS_PLAYLIST: "Playlist"
    };
    var playbackStatuses = [constants.PLAYBACK_STATUS_PLAYING, constants.PLAYBACK_STATUS_PAUSED, constants.PLAYBACK_STATUS_STOPPED];
    var loopStatuses = [constants.LOOP_STATUS_NONE, constants.LOOP_STATUS_PLAYLIST, constants.LOOP_STATUS_TRACK];
    constants.isLoopStatusValid = function(value) {
      return loopStatuses.includes(value);
    };
    constants.isPlaybackStatusValid = function(value) {
      return playbackStatuses.includes(value);
    };
    module2.exports = constants;
  }
});

// node_modules/mpris-service/dist/interfaces/mpris-interface.js
var require_mpris_interface = __commonJS({
  "node_modules/mpris-service/dist/interfaces/mpris-interface.js"(exports2, module2) {
    var dbus = require_dbus_next();
    var Variant = dbus.Variant;
    var types = require_types();
    var deepEqual = require_deep_equal();
    var constants = require_constants3();
    var logging = require_logging();
    var {
      Interface,
      property,
      method,
      signal,
      DBusError,
      ACCESS_READ,
      ACCESS_WRITE,
      ACCESS_READWRITE
    } = dbus.interface;
    var MprisInterface = class extends Interface {
      static {
        __name(this, "MprisInterface");
      }
      constructor(name, player) {
        super(name);
        this.player = player;
      }
      _setPropertyInternal(property2, valueDbus) {
        this.player.emit(property2[0].toLowerCase() + property2.substr(1), valueDbus);
      }
      setProperty(property2, valuePlain) {
        let valueDbus = valuePlain;
        if (property2 === "Metadata") {
          valueDbus = types.metadataToDbus(valuePlain);
        } else if (property2 === "ActivePlaylist") {
          if (valuePlain) {
            valueDbus = [true, types.playlistToDbus(valuePlain)];
          } else {
            valueDbus = [false, types.emptyPlaylist];
          }
        } else if (property2 === "Tracks") {
          valueDbus = valuePlain.filter((t) => t["mpris:trackid"]).map((t) => t["mpris:trackid"]);
        }
        if (!deepEqual(this[`_${property2}`], valueDbus)) {
          this[`_${property2}`] = valueDbus;
          if (property2 == "LoopStatus" && !constants.isLoopStatusValid(valuePlain)) {
            logging.warn(`setting player loop status to an invalid value: ${valuePlain}`);
          } else if (property2 == "PlaybackStatus" && !constants.isPlaybackStatusValid(valuePlain)) {
            logging.warn(`setting player playback status to an invalid value: ${valuePlain}`);
          } else {
            let changedProperties = {};
            changedProperties[property2] = valueDbus;
            Interface.emitPropertiesChanged(this, changedProperties);
          }
        }
      }
    };
    module2.exports = MprisInterface;
  }
});

// node_modules/mpris-service/dist/interfaces/player.js
var require_player = __commonJS({
  "node_modules/mpris-service/dist/interfaces/player.js"(exports2, module2) {
    function _decorate(decorators, factory, superClass, mixins) {
      var api = _getDecoratorsApi();
      if (mixins) {
        for (var i = 0; i < mixins.length; i++) {
          api = mixins[i](api);
        }
      }
      var r = factory(/* @__PURE__ */ __name(function initialize(O) {
        api.initializeInstanceElements(O, decorated.elements);
      }, "initialize"), superClass);
      var decorated = api.decorateClass(_coalesceClassElements(r.d.map(_createElementDescriptor)), decorators);
      api.initializeClassElements(r.F, decorated.elements);
      return api.runClassFinishers(r.F, decorated.finishers);
    }
    __name(_decorate, "_decorate");
    function _getDecoratorsApi() {
      _getDecoratorsApi = /* @__PURE__ */ __name(function() {
        return api;
      }, "_getDecoratorsApi");
      var api = { elementsDefinitionOrder: [["method"], ["field"]], initializeInstanceElements: /* @__PURE__ */ __name(function(O, elements) {
        ["method", "field"].forEach(function(kind) {
          elements.forEach(function(element) {
            if (element.kind === kind && element.placement === "own") {
              this.defineClassElement(O, element);
            }
          }, this);
        }, this);
      }, "initializeInstanceElements"), initializeClassElements: /* @__PURE__ */ __name(function(F, elements) {
        var proto = F.prototype;
        ["method", "field"].forEach(function(kind) {
          elements.forEach(function(element) {
            var placement = element.placement;
            if (element.kind === kind && (placement === "static" || placement === "prototype")) {
              var receiver = placement === "static" ? F : proto;
              this.defineClassElement(receiver, element);
            }
          }, this);
        }, this);
      }, "initializeClassElements"), defineClassElement: /* @__PURE__ */ __name(function(receiver, element) {
        var descriptor = element.descriptor;
        if (element.kind === "field") {
          var initializer = element.initializer;
          descriptor = { enumerable: descriptor.enumerable, writable: descriptor.writable, configurable: descriptor.configurable, value: initializer === void 0 ? void 0 : initializer.call(receiver) };
        }
        Object.defineProperty(receiver, element.key, descriptor);
      }, "defineClassElement"), decorateClass: /* @__PURE__ */ __name(function(elements, decorators) {
        var newElements = [];
        var finishers = [];
        var placements = { static: [], prototype: [], own: [] };
        elements.forEach(function(element) {
          this.addElementPlacement(element, placements);
        }, this);
        elements.forEach(function(element) {
          if (!_hasDecorators(element)) return newElements.push(element);
          var elementFinishersExtras = this.decorateElement(element, placements);
          newElements.push(elementFinishersExtras.element);
          newElements.push.apply(newElements, elementFinishersExtras.extras);
          finishers.push.apply(finishers, elementFinishersExtras.finishers);
        }, this);
        if (!decorators) {
          return { elements: newElements, finishers };
        }
        var result = this.decorateConstructor(newElements, decorators);
        finishers.push.apply(finishers, result.finishers);
        result.finishers = finishers;
        return result;
      }, "decorateClass"), addElementPlacement: /* @__PURE__ */ __name(function(element, placements, silent) {
        var keys = placements[element.placement];
        if (!silent && keys.indexOf(element.key) !== -1) {
          throw new TypeError("Duplicated element (" + element.key + ")");
        }
        keys.push(element.key);
      }, "addElementPlacement"), decorateElement: /* @__PURE__ */ __name(function(element, placements) {
        var extras = [];
        var finishers = [];
        for (var decorators = element.decorators, i = decorators.length - 1; i >= 0; i--) {
          var keys = placements[element.placement];
          keys.splice(keys.indexOf(element.key), 1);
          var elementObject = this.fromElementDescriptor(element);
          var elementFinisherExtras = this.toElementFinisherExtras((0, decorators[i])(elementObject) || elementObject);
          element = elementFinisherExtras.element;
          this.addElementPlacement(element, placements);
          if (elementFinisherExtras.finisher) {
            finishers.push(elementFinisherExtras.finisher);
          }
          var newExtras = elementFinisherExtras.extras;
          if (newExtras) {
            for (var j = 0; j < newExtras.length; j++) {
              this.addElementPlacement(newExtras[j], placements);
            }
            extras.push.apply(extras, newExtras);
          }
        }
        return { element, finishers, extras };
      }, "decorateElement"), decorateConstructor: /* @__PURE__ */ __name(function(elements, decorators) {
        var finishers = [];
        for (var i = decorators.length - 1; i >= 0; i--) {
          var obj = this.fromClassDescriptor(elements);
          var elementsAndFinisher = this.toClassDescriptor((0, decorators[i])(obj) || obj);
          if (elementsAndFinisher.finisher !== void 0) {
            finishers.push(elementsAndFinisher.finisher);
          }
          if (elementsAndFinisher.elements !== void 0) {
            elements = elementsAndFinisher.elements;
            for (var j = 0; j < elements.length - 1; j++) {
              for (var k = j + 1; k < elements.length; k++) {
                if (elements[j].key === elements[k].key && elements[j].placement === elements[k].placement) {
                  throw new TypeError("Duplicated element (" + elements[j].key + ")");
                }
              }
            }
          }
        }
        return { elements, finishers };
      }, "decorateConstructor"), fromElementDescriptor: /* @__PURE__ */ __name(function(element) {
        var obj = { kind: element.kind, key: element.key, placement: element.placement, descriptor: element.descriptor };
        var desc = { value: "Descriptor", configurable: true };
        Object.defineProperty(obj, Symbol.toStringTag, desc);
        if (element.kind === "field") obj.initializer = element.initializer;
        return obj;
      }, "fromElementDescriptor"), toElementDescriptors: /* @__PURE__ */ __name(function(elementObjects) {
        if (elementObjects === void 0) return;
        return _toArray(elementObjects).map(function(elementObject) {
          var element = this.toElementDescriptor(elementObject);
          this.disallowProperty(elementObject, "finisher", "An element descriptor");
          this.disallowProperty(elementObject, "extras", "An element descriptor");
          return element;
        }, this);
      }, "toElementDescriptors"), toElementDescriptor: /* @__PURE__ */ __name(function(elementObject) {
        var kind = String(elementObject.kind);
        if (kind !== "method" && kind !== "field") {
          throw new TypeError(`An element descriptor's .kind property must be either "method" or "field", but a decorator created an element descriptor with .kind "` + kind + '"');
        }
        var key = _toPropertyKey(elementObject.key);
        var placement = String(elementObject.placement);
        if (placement !== "static" && placement !== "prototype" && placement !== "own") {
          throw new TypeError(`An element descriptor's .placement property must be one of "static", "prototype" or "own", but a decorator created an element descriptor with .placement "` + placement + '"');
        }
        var descriptor = elementObject.descriptor;
        this.disallowProperty(elementObject, "elements", "An element descriptor");
        var element = { kind, key, placement, descriptor: Object.assign({}, descriptor) };
        if (kind !== "field") {
          this.disallowProperty(elementObject, "initializer", "A method descriptor");
        } else {
          this.disallowProperty(descriptor, "get", "The property descriptor of a field descriptor");
          this.disallowProperty(descriptor, "set", "The property descriptor of a field descriptor");
          this.disallowProperty(descriptor, "value", "The property descriptor of a field descriptor");
          element.initializer = elementObject.initializer;
        }
        return element;
      }, "toElementDescriptor"), toElementFinisherExtras: /* @__PURE__ */ __name(function(elementObject) {
        var element = this.toElementDescriptor(elementObject);
        var finisher = _optionalCallableProperty(elementObject, "finisher");
        var extras = this.toElementDescriptors(elementObject.extras);
        return { element, finisher, extras };
      }, "toElementFinisherExtras"), fromClassDescriptor: /* @__PURE__ */ __name(function(elements) {
        var obj = { kind: "class", elements: elements.map(this.fromElementDescriptor, this) };
        var desc = { value: "Descriptor", configurable: true };
        Object.defineProperty(obj, Symbol.toStringTag, desc);
        return obj;
      }, "fromClassDescriptor"), toClassDescriptor: /* @__PURE__ */ __name(function(obj) {
        var kind = String(obj.kind);
        if (kind !== "class") {
          throw new TypeError(`A class descriptor's .kind property must be "class", but a decorator created a class descriptor with .kind "` + kind + '"');
        }
        this.disallowProperty(obj, "key", "A class descriptor");
        this.disallowProperty(obj, "placement", "A class descriptor");
        this.disallowProperty(obj, "descriptor", "A class descriptor");
        this.disallowProperty(obj, "initializer", "A class descriptor");
        this.disallowProperty(obj, "extras", "A class descriptor");
        var finisher = _optionalCallableProperty(obj, "finisher");
        var elements = this.toElementDescriptors(obj.elements);
        return { elements, finisher };
      }, "toClassDescriptor"), runClassFinishers: /* @__PURE__ */ __name(function(constructor, finishers) {
        for (var i = 0; i < finishers.length; i++) {
          var newConstructor = (0, finishers[i])(constructor);
          if (newConstructor !== void 0) {
            if (typeof newConstructor !== "function") {
              throw new TypeError("Finishers must return a constructor.");
            }
            constructor = newConstructor;
          }
        }
        return constructor;
      }, "runClassFinishers"), disallowProperty: /* @__PURE__ */ __name(function(obj, name, objectType) {
        if (obj[name] !== void 0) {
          throw new TypeError(objectType + " can't have a ." + name + " property.");
        }
      }, "disallowProperty") };
      return api;
    }
    __name(_getDecoratorsApi, "_getDecoratorsApi");
    function _createElementDescriptor(def) {
      var key = _toPropertyKey(def.key);
      var descriptor;
      if (def.kind === "method") {
        descriptor = { value: def.value, writable: true, configurable: true, enumerable: false };
      } else if (def.kind === "get") {
        descriptor = { get: def.value, configurable: true, enumerable: false };
      } else if (def.kind === "set") {
        descriptor = { set: def.value, configurable: true, enumerable: false };
      } else if (def.kind === "field") {
        descriptor = { configurable: true, writable: true, enumerable: true };
      }
      var element = { kind: def.kind === "field" ? "field" : "method", key, placement: def.static ? "static" : def.kind === "field" ? "own" : "prototype", descriptor };
      if (def.decorators) element.decorators = def.decorators;
      if (def.kind === "field") element.initializer = def.value;
      return element;
    }
    __name(_createElementDescriptor, "_createElementDescriptor");
    function _coalesceGetterSetter(element, other) {
      if (element.descriptor.get !== void 0) {
        other.descriptor.get = element.descriptor.get;
      } else {
        other.descriptor.set = element.descriptor.set;
      }
    }
    __name(_coalesceGetterSetter, "_coalesceGetterSetter");
    function _coalesceClassElements(elements) {
      var newElements = [];
      var isSameElement = /* @__PURE__ */ __name(function(other2) {
        return other2.kind === "method" && other2.key === element.key && other2.placement === element.placement;
      }, "isSameElement");
      for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var other;
        if (element.kind === "method" && (other = newElements.find(isSameElement))) {
          if (_isDataDescriptor(element.descriptor) || _isDataDescriptor(other.descriptor)) {
            if (_hasDecorators(element) || _hasDecorators(other)) {
              throw new ReferenceError("Duplicated methods (" + element.key + ") can't be decorated.");
            }
            other.descriptor = element.descriptor;
          } else {
            if (_hasDecorators(element)) {
              if (_hasDecorators(other)) {
                throw new ReferenceError("Decorators can't be placed on different accessors with for the same property (" + element.key + ").");
              }
              other.decorators = element.decorators;
            }
            _coalesceGetterSetter(element, other);
          }
        } else {
          newElements.push(element);
        }
      }
      return newElements;
    }
    __name(_coalesceClassElements, "_coalesceClassElements");
    function _hasDecorators(element) {
      return element.decorators && element.decorators.length;
    }
    __name(_hasDecorators, "_hasDecorators");
    function _isDataDescriptor(desc) {
      return desc !== void 0 && !(desc.value === void 0 && desc.writable === void 0);
    }
    __name(_isDataDescriptor, "_isDataDescriptor");
    function _optionalCallableProperty(obj, name) {
      var value = obj[name];
      if (value !== void 0 && typeof value !== "function") {
        throw new TypeError("Expected '" + name + "' to be a function");
      }
      return value;
    }
    __name(_optionalCallableProperty, "_optionalCallableProperty");
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    __name(_toPropertyKey, "_toPropertyKey");
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    __name(_toPrimitive, "_toPrimitive");
    function _toArray(arr) {
      return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest();
    }
    __name(_toArray, "_toArray");
    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    __name(_nonIterableRest, "_nonIterableRest");
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }
    __name(_unsupportedIterableToArray, "_unsupportedIterableToArray");
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
      return arr2;
    }
    __name(_arrayLikeToArray, "_arrayLikeToArray");
    function _iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
    }
    __name(_iterableToArray, "_iterableToArray");
    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }
    __name(_arrayWithHoles, "_arrayWithHoles");
    var dbus = require_dbus_next();
    var MprisInterface = require_mpris_interface();
    var Variant = dbus.Variant;
    var JSBI = require_jsbi_cjs();
    var constants = require_constants3();
    var {
      property,
      method,
      signal,
      DBusError,
      ACCESS_READ,
      ACCESS_WRITE,
      ACCESS_READWRITE
    } = dbus.interface;
    var PlayerInterface = _decorate(null, function(_initialize, _MprisInterface) {
      class PlayerInterface2 extends _MprisInterface {
        static {
          __name(this, "PlayerInterface");
        }
        constructor(player) {
          super("org.mpris.MediaPlayer2.Player", player);
          _initialize(this);
        }
      }
      return {
        F: PlayerInterface2,
        d: [{
          kind: "field",
          key: "_CanControl",
          value() {
            return true;
          }
        }, {
          kind: "field",
          key: "_CanPause",
          value() {
            return true;
          }
        }, {
          kind: "field",
          key: "_CanPlay",
          value() {
            return true;
          }
        }, {
          kind: "field",
          key: "_CanSeek",
          value() {
            return true;
          }
        }, {
          kind: "field",
          key: "_CanGoNext",
          value() {
            return true;
          }
        }, {
          kind: "field",
          key: "_CanGoPrevious",
          value() {
            return true;
          }
        }, {
          kind: "field",
          key: "_Metadata",
          value() {
            return {};
          }
        }, {
          kind: "field",
          key: "_MaximumRate",
          value() {
            return 1;
          }
        }, {
          kind: "field",
          key: "_MinimumRate",
          value() {
            return 1;
          }
        }, {
          kind: "field",
          key: "_Rate",
          value() {
            return 1;
          }
        }, {
          kind: "field",
          key: "_Shuffle",
          value() {
            return false;
          }
        }, {
          kind: "field",
          key: "_Volume",
          value() {
            return 0;
          }
        }, {
          kind: "field",
          key: "_LoopStatus",
          value() {
            return constants.LOOP_STATUS_NONE;
          }
        }, {
          kind: "field",
          key: "_PlaybackStatus",
          value() {
            return constants.PLAYBACK_STATUS_STOPPED;
          }
        }, {
          kind: "get",
          decorators: [property({
            signature: "b",
            access: ACCESS_READ
          })],
          key: "CanControl",
          value: /* @__PURE__ */ __name(function CanControl() {
            return this._CanControl;
          }, "CanControl")
        }, {
          kind: "get",
          decorators: [property({
            signature: "b",
            access: ACCESS_READ
          })],
          key: "CanPause",
          value: /* @__PURE__ */ __name(function CanPause() {
            return this._CanPause;
          }, "CanPause")
        }, {
          kind: "get",
          decorators: [property({
            signature: "b",
            access: ACCESS_READ
          })],
          key: "CanPlay",
          value: /* @__PURE__ */ __name(function CanPlay() {
            return this._CanPlay;
          }, "CanPlay")
        }, {
          kind: "get",
          decorators: [property({
            signature: "b",
            access: ACCESS_READ
          })],
          key: "CanSeek",
          value: /* @__PURE__ */ __name(function CanSeek() {
            return this._CanSeek;
          }, "CanSeek")
        }, {
          kind: "get",
          decorators: [property({
            signature: "b",
            access: ACCESS_READ
          })],
          key: "CanGoNext",
          value: /* @__PURE__ */ __name(function CanGoNext() {
            return this._CanGoNext;
          }, "CanGoNext")
        }, {
          kind: "get",
          decorators: [property({
            signature: "b",
            access: ACCESS_READ
          })],
          key: "CanGoPrevious",
          value: /* @__PURE__ */ __name(function CanGoPrevious() {
            return this._CanGoPrevious;
          }, "CanGoPrevious")
        }, {
          kind: "get",
          decorators: [property({
            signature: "a{sv}",
            access: ACCESS_READ
          })],
          key: "Metadata",
          value: /* @__PURE__ */ __name(function Metadata() {
            return this._Metadata;
          }, "Metadata")
        }, {
          kind: "get",
          decorators: [property({
            signature: "d",
            access: ACCESS_READ
          })],
          key: "MaximumRate",
          value: /* @__PURE__ */ __name(function MaximumRate() {
            return this._MaximumRate;
          }, "MaximumRate")
        }, {
          kind: "get",
          decorators: [property({
            signature: "d",
            access: ACCESS_READ
          })],
          key: "MinimumRate",
          value: /* @__PURE__ */ __name(function MinimumRate() {
            return this._MinimumRate;
          }, "MinimumRate")
        }, {
          kind: "get",
          decorators: [property({
            signature: "d"
          })],
          key: "Rate",
          value: /* @__PURE__ */ __name(function Rate() {
            return this._Rate;
          }, "Rate")
        }, {
          kind: "set",
          key: "Rate",
          value: /* @__PURE__ */ __name(function Rate(value) {
            this._setPropertyInternal("Rate", value);
          }, "Rate")
        }, {
          kind: "get",
          decorators: [property({
            signature: "b"
          })],
          key: "Shuffle",
          value: /* @__PURE__ */ __name(function Shuffle() {
            return this._Shuffle;
          }, "Shuffle")
        }, {
          kind: "set",
          key: "Shuffle",
          value: /* @__PURE__ */ __name(function Shuffle(value) {
            this._setPropertyInternal("Shuffle", value);
          }, "Shuffle")
        }, {
          kind: "get",
          decorators: [property({
            signature: "d"
          })],
          key: "Volume",
          value: /* @__PURE__ */ __name(function Volume() {
            return this._Volume;
          }, "Volume")
        }, {
          kind: "set",
          key: "Volume",
          value: /* @__PURE__ */ __name(function Volume(value) {
            this._setPropertyInternal("Volume", value);
          }, "Volume")
        }, {
          kind: "get",
          decorators: [property({
            signature: "x",
            access: ACCESS_READ
          })],
          key: "Position",
          value: /* @__PURE__ */ __name(function Position() {
            let playerPosition = this.player.getPosition();
            let position = Math.floor(playerPosition || 0);
            if (isNaN(position)) {
              const err = "github.mpris_service.InvalidPositionError";
              const message = `The player has set an invalid position: ${playerPosition}`;
              throw new DBusError(err, message);
            }
            return position;
          }, "Position")
        }, {
          kind: "get",
          decorators: [property({
            signature: "s"
          })],
          key: "LoopStatus",
          value: /* @__PURE__ */ __name(function LoopStatus() {
            if (!constants.isLoopStatusValid(this._LoopStatus)) {
              const err = "github.mpris_service.InvalidLoopStatusError";
              const message = `The player has set an invalid loop status: ${this._LoopStatus}`;
              throw new DBusError(err, message);
            }
            return this._LoopStatus;
          }, "LoopStatus")
        }, {
          kind: "set",
          key: "LoopStatus",
          value: /* @__PURE__ */ __name(function LoopStatus(value) {
            if (!constants.isLoopStatusValid(value)) {
              const err = "github.mpris_service.InvalidLoopStatusError";
              const message = `Tried to set loop status to an invalid value: ${value}`;
              throw new DBusError(err, message);
            }
            this._setPropertyInternal("LoopStatus", value);
          }, "LoopStatus")
        }, {
          kind: "get",
          decorators: [property({
            signature: "s",
            access: ACCESS_READ
          })],
          key: "PlaybackStatus",
          value: /* @__PURE__ */ __name(function PlaybackStatus() {
            if (!constants.isPlaybackStatusValid(this._PlaybackStatus)) {
              const err = "github.mpris_service.InvalidPlaybackStatusError";
              const message = `The player has set an invalid playback status: ${this._PlaybackStatus}`;
              throw new DBusError(err, message);
            }
            return this._PlaybackStatus;
          }, "PlaybackStatus")
        }, {
          kind: "method",
          decorators: [method({})],
          key: "Next",
          value: /* @__PURE__ */ __name(function Next() {
            this.player.emit("next");
          }, "Next")
        }, {
          kind: "method",
          decorators: [method({})],
          key: "Previous",
          value: /* @__PURE__ */ __name(function Previous() {
            this.player.emit("previous");
          }, "Previous")
        }, {
          kind: "method",
          decorators: [method({})],
          key: "Pause",
          value: /* @__PURE__ */ __name(function Pause() {
            this.player.emit("pause");
          }, "Pause")
        }, {
          kind: "method",
          decorators: [method({})],
          key: "PlayPause",
          value: /* @__PURE__ */ __name(function PlayPause() {
            this.player.emit("playpause");
          }, "PlayPause")
        }, {
          kind: "method",
          decorators: [method({})],
          key: "Stop",
          value: /* @__PURE__ */ __name(function Stop() {
            this.player.emit("stop");
          }, "Stop")
        }, {
          kind: "method",
          decorators: [method({})],
          key: "Play",
          value: /* @__PURE__ */ __name(function Play() {
            this.player.emit("play");
          }, "Play")
        }, {
          kind: "method",
          decorators: [method({
            inSignature: "x"
          })],
          key: "Seek",
          value: /* @__PURE__ */ __name(function Seek(offset) {
            offset = JSBI.toNumber(offset);
            this.player.emit("seek", offset);
          }, "Seek")
        }, {
          kind: "method",
          decorators: [method({
            inSignature: "ox"
          })],
          key: "SetPosition",
          value: /* @__PURE__ */ __name(function SetPosition(trackId, position) {
            let e = {
              trackId,
              // XXX overflow
              position: JSBI.toNumber(position)
            };
            this.player.emit("position", e);
          }, "SetPosition")
        }, {
          kind: "method",
          decorators: [method({
            inSignature: "s"
          })],
          key: "OpenUri",
          value: /* @__PURE__ */ __name(function OpenUri(uri) {
            let e = {
              uri
            };
            this.player.emit("open", e);
          }, "OpenUri")
        }, {
          kind: "method",
          decorators: [signal({
            signature: "x"
          })],
          key: "Seeked",
          value: /* @__PURE__ */ __name(function Seeked(position) {
            return position;
          }, "Seeked")
        }]
      };
    }, MprisInterface);
    module2.exports = PlayerInterface;
  }
});

// node_modules/mpris-service/dist/interfaces/root.js
var require_root = __commonJS({
  "node_modules/mpris-service/dist/interfaces/root.js"(exports2, module2) {
    function _decorate(decorators, factory, superClass, mixins) {
      var api = _getDecoratorsApi();
      if (mixins) {
        for (var i = 0; i < mixins.length; i++) {
          api = mixins[i](api);
        }
      }
      var r = factory(/* @__PURE__ */ __name(function initialize(O) {
        api.initializeInstanceElements(O, decorated.elements);
      }, "initialize"), superClass);
      var decorated = api.decorateClass(_coalesceClassElements(r.d.map(_createElementDescriptor)), decorators);
      api.initializeClassElements(r.F, decorated.elements);
      return api.runClassFinishers(r.F, decorated.finishers);
    }
    __name(_decorate, "_decorate");
    function _getDecoratorsApi() {
      _getDecoratorsApi = /* @__PURE__ */ __name(function() {
        return api;
      }, "_getDecoratorsApi");
      var api = { elementsDefinitionOrder: [["method"], ["field"]], initializeInstanceElements: /* @__PURE__ */ __name(function(O, elements) {
        ["method", "field"].forEach(function(kind) {
          elements.forEach(function(element) {
            if (element.kind === kind && element.placement === "own") {
              this.defineClassElement(O, element);
            }
          }, this);
        }, this);
      }, "initializeInstanceElements"), initializeClassElements: /* @__PURE__ */ __name(function(F, elements) {
        var proto = F.prototype;
        ["method", "field"].forEach(function(kind) {
          elements.forEach(function(element) {
            var placement = element.placement;
            if (element.kind === kind && (placement === "static" || placement === "prototype")) {
              var receiver = placement === "static" ? F : proto;
              this.defineClassElement(receiver, element);
            }
          }, this);
        }, this);
      }, "initializeClassElements"), defineClassElement: /* @__PURE__ */ __name(function(receiver, element) {
        var descriptor = element.descriptor;
        if (element.kind === "field") {
          var initializer = element.initializer;
          descriptor = { enumerable: descriptor.enumerable, writable: descriptor.writable, configurable: descriptor.configurable, value: initializer === void 0 ? void 0 : initializer.call(receiver) };
        }
        Object.defineProperty(receiver, element.key, descriptor);
      }, "defineClassElement"), decorateClass: /* @__PURE__ */ __name(function(elements, decorators) {
        var newElements = [];
        var finishers = [];
        var placements = { static: [], prototype: [], own: [] };
        elements.forEach(function(element) {
          this.addElementPlacement(element, placements);
        }, this);
        elements.forEach(function(element) {
          if (!_hasDecorators(element)) return newElements.push(element);
          var elementFinishersExtras = this.decorateElement(element, placements);
          newElements.push(elementFinishersExtras.element);
          newElements.push.apply(newElements, elementFinishersExtras.extras);
          finishers.push.apply(finishers, elementFinishersExtras.finishers);
        }, this);
        if (!decorators) {
          return { elements: newElements, finishers };
        }
        var result = this.decorateConstructor(newElements, decorators);
        finishers.push.apply(finishers, result.finishers);
        result.finishers = finishers;
        return result;
      }, "decorateClass"), addElementPlacement: /* @__PURE__ */ __name(function(element, placements, silent) {
        var keys = placements[element.placement];
        if (!silent && keys.indexOf(element.key) !== -1) {
          throw new TypeError("Duplicated element (" + element.key + ")");
        }
        keys.push(element.key);
      }, "addElementPlacement"), decorateElement: /* @__PURE__ */ __name(function(element, placements) {
        var extras = [];
        var finishers = [];
        for (var decorators = element.decorators, i = decorators.length - 1; i >= 0; i--) {
          var keys = placements[element.placement];
          keys.splice(keys.indexOf(element.key), 1);
          var elementObject = this.fromElementDescriptor(element);
          var elementFinisherExtras = this.toElementFinisherExtras((0, decorators[i])(elementObject) || elementObject);
          element = elementFinisherExtras.element;
          this.addElementPlacement(element, placements);
          if (elementFinisherExtras.finisher) {
            finishers.push(elementFinisherExtras.finisher);
          }
          var newExtras = elementFinisherExtras.extras;
          if (newExtras) {
            for (var j = 0; j < newExtras.length; j++) {
              this.addElementPlacement(newExtras[j], placements);
            }
            extras.push.apply(extras, newExtras);
          }
        }
        return { element, finishers, extras };
      }, "decorateElement"), decorateConstructor: /* @__PURE__ */ __name(function(elements, decorators) {
        var finishers = [];
        for (var i = decorators.length - 1; i >= 0; i--) {
          var obj = this.fromClassDescriptor(elements);
          var elementsAndFinisher = this.toClassDescriptor((0, decorators[i])(obj) || obj);
          if (elementsAndFinisher.finisher !== void 0) {
            finishers.push(elementsAndFinisher.finisher);
          }
          if (elementsAndFinisher.elements !== void 0) {
            elements = elementsAndFinisher.elements;
            for (var j = 0; j < elements.length - 1; j++) {
              for (var k = j + 1; k < elements.length; k++) {
                if (elements[j].key === elements[k].key && elements[j].placement === elements[k].placement) {
                  throw new TypeError("Duplicated element (" + elements[j].key + ")");
                }
              }
            }
          }
        }
        return { elements, finishers };
      }, "decorateConstructor"), fromElementDescriptor: /* @__PURE__ */ __name(function(element) {
        var obj = { kind: element.kind, key: element.key, placement: element.placement, descriptor: element.descriptor };
        var desc = { value: "Descriptor", configurable: true };
        Object.defineProperty(obj, Symbol.toStringTag, desc);
        if (element.kind === "field") obj.initializer = element.initializer;
        return obj;
      }, "fromElementDescriptor"), toElementDescriptors: /* @__PURE__ */ __name(function(elementObjects) {
        if (elementObjects === void 0) return;
        return _toArray(elementObjects).map(function(elementObject) {
          var element = this.toElementDescriptor(elementObject);
          this.disallowProperty(elementObject, "finisher", "An element descriptor");
          this.disallowProperty(elementObject, "extras", "An element descriptor");
          return element;
        }, this);
      }, "toElementDescriptors"), toElementDescriptor: /* @__PURE__ */ __name(function(elementObject) {
        var kind = String(elementObject.kind);
        if (kind !== "method" && kind !== "field") {
          throw new TypeError(`An element descriptor's .kind property must be either "method" or "field", but a decorator created an element descriptor with .kind "` + kind + '"');
        }
        var key = _toPropertyKey(elementObject.key);
        var placement = String(elementObject.placement);
        if (placement !== "static" && placement !== "prototype" && placement !== "own") {
          throw new TypeError(`An element descriptor's .placement property must be one of "static", "prototype" or "own", but a decorator created an element descriptor with .placement "` + placement + '"');
        }
        var descriptor = elementObject.descriptor;
        this.disallowProperty(elementObject, "elements", "An element descriptor");
        var element = { kind, key, placement, descriptor: Object.assign({}, descriptor) };
        if (kind !== "field") {
          this.disallowProperty(elementObject, "initializer", "A method descriptor");
        } else {
          this.disallowProperty(descriptor, "get", "The property descriptor of a field descriptor");
          this.disallowProperty(descriptor, "set", "The property descriptor of a field descriptor");
          this.disallowProperty(descriptor, "value", "The property descriptor of a field descriptor");
          element.initializer = elementObject.initializer;
        }
        return element;
      }, "toElementDescriptor"), toElementFinisherExtras: /* @__PURE__ */ __name(function(elementObject) {
        var element = this.toElementDescriptor(elementObject);
        var finisher = _optionalCallableProperty(elementObject, "finisher");
        var extras = this.toElementDescriptors(elementObject.extras);
        return { element, finisher, extras };
      }, "toElementFinisherExtras"), fromClassDescriptor: /* @__PURE__ */ __name(function(elements) {
        var obj = { kind: "class", elements: elements.map(this.fromElementDescriptor, this) };
        var desc = { value: "Descriptor", configurable: true };
        Object.defineProperty(obj, Symbol.toStringTag, desc);
        return obj;
      }, "fromClassDescriptor"), toClassDescriptor: /* @__PURE__ */ __name(function(obj) {
        var kind = String(obj.kind);
        if (kind !== "class") {
          throw new TypeError(`A class descriptor's .kind property must be "class", but a decorator created a class descriptor with .kind "` + kind + '"');
        }
        this.disallowProperty(obj, "key", "A class descriptor");
        this.disallowProperty(obj, "placement", "A class descriptor");
        this.disallowProperty(obj, "descriptor", "A class descriptor");
        this.disallowProperty(obj, "initializer", "A class descriptor");
        this.disallowProperty(obj, "extras", "A class descriptor");
        var finisher = _optionalCallableProperty(obj, "finisher");
        var elements = this.toElementDescriptors(obj.elements);
        return { elements, finisher };
      }, "toClassDescriptor"), runClassFinishers: /* @__PURE__ */ __name(function(constructor, finishers) {
        for (var i = 0; i < finishers.length; i++) {
          var newConstructor = (0, finishers[i])(constructor);
          if (newConstructor !== void 0) {
            if (typeof newConstructor !== "function") {
              throw new TypeError("Finishers must return a constructor.");
            }
            constructor = newConstructor;
          }
        }
        return constructor;
      }, "runClassFinishers"), disallowProperty: /* @__PURE__ */ __name(function(obj, name, objectType) {
        if (obj[name] !== void 0) {
          throw new TypeError(objectType + " can't have a ." + name + " property.");
        }
      }, "disallowProperty") };
      return api;
    }
    __name(_getDecoratorsApi, "_getDecoratorsApi");
    function _createElementDescriptor(def) {
      var key = _toPropertyKey(def.key);
      var descriptor;
      if (def.kind === "method") {
        descriptor = { value: def.value, writable: true, configurable: true, enumerable: false };
      } else if (def.kind === "get") {
        descriptor = { get: def.value, configurable: true, enumerable: false };
      } else if (def.kind === "set") {
        descriptor = { set: def.value, configurable: true, enumerable: false };
      } else if (def.kind === "field") {
        descriptor = { configurable: true, writable: true, enumerable: true };
      }
      var element = { kind: def.kind === "field" ? "field" : "method", key, placement: def.static ? "static" : def.kind === "field" ? "own" : "prototype", descriptor };
      if (def.decorators) element.decorators = def.decorators;
      if (def.kind === "field") element.initializer = def.value;
      return element;
    }
    __name(_createElementDescriptor, "_createElementDescriptor");
    function _coalesceGetterSetter(element, other) {
      if (element.descriptor.get !== void 0) {
        other.descriptor.get = element.descriptor.get;
      } else {
        other.descriptor.set = element.descriptor.set;
      }
    }
    __name(_coalesceGetterSetter, "_coalesceGetterSetter");
    function _coalesceClassElements(elements) {
      var newElements = [];
      var isSameElement = /* @__PURE__ */ __name(function(other2) {
        return other2.kind === "method" && other2.key === element.key && other2.placement === element.placement;
      }, "isSameElement");
      for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var other;
        if (element.kind === "method" && (other = newElements.find(isSameElement))) {
          if (_isDataDescriptor(element.descriptor) || _isDataDescriptor(other.descriptor)) {
            if (_hasDecorators(element) || _hasDecorators(other)) {
              throw new ReferenceError("Duplicated methods (" + element.key + ") can't be decorated.");
            }
            other.descriptor = element.descriptor;
          } else {
            if (_hasDecorators(element)) {
              if (_hasDecorators(other)) {
                throw new ReferenceError("Decorators can't be placed on different accessors with for the same property (" + element.key + ").");
              }
              other.decorators = element.decorators;
            }
            _coalesceGetterSetter(element, other);
          }
        } else {
          newElements.push(element);
        }
      }
      return newElements;
    }
    __name(_coalesceClassElements, "_coalesceClassElements");
    function _hasDecorators(element) {
      return element.decorators && element.decorators.length;
    }
    __name(_hasDecorators, "_hasDecorators");
    function _isDataDescriptor(desc) {
      return desc !== void 0 && !(desc.value === void 0 && desc.writable === void 0);
    }
    __name(_isDataDescriptor, "_isDataDescriptor");
    function _optionalCallableProperty(obj, name) {
      var value = obj[name];
      if (value !== void 0 && typeof value !== "function") {
        throw new TypeError("Expected '" + name + "' to be a function");
      }
      return value;
    }
    __name(_optionalCallableProperty, "_optionalCallableProperty");
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    __name(_toPropertyKey, "_toPropertyKey");
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    __name(_toPrimitive, "_toPrimitive");
    function _toArray(arr) {
      return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest();
    }
    __name(_toArray, "_toArray");
    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    __name(_nonIterableRest, "_nonIterableRest");
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }
    __name(_unsupportedIterableToArray, "_unsupportedIterableToArray");
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
      return arr2;
    }
    __name(_arrayLikeToArray, "_arrayLikeToArray");
    function _iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
    }
    __name(_iterableToArray, "_iterableToArray");
    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }
    __name(_arrayWithHoles, "_arrayWithHoles");
    var MprisInterface = require_mpris_interface();
    var dbus = require_dbus_next();
    var Variant = dbus.Variant;
    var {
      property,
      method,
      signal,
      DBusError,
      ACCESS_READ,
      ACCESS_WRITE,
      ACCESS_READWRITE
    } = dbus.interface;
    var RootInterface = _decorate(null, function(_initialize, _MprisInterface) {
      class RootInterface2 extends _MprisInterface {
        static {
          __name(this, "RootInterface");
        }
        constructor(player, opts = {}) {
          super("org.mpris.MediaPlayer2", player);
          _initialize(this);
          if (opts.hasOwnProperty("identity")) {
            this._Identity = opts.identity;
          }
          if (opts.hasOwnProperty("supportedUriSchemes")) {
            this._SupportedUriSchemes = opts.supportedUriSchemes;
          }
          if (opts.hasOwnProperty("supportedMimeTypes")) {
            this._SupportedMimeTypes = opts.supportedMimeTypes;
          }
          if (opts.hasOwnProperty("desktopEntry")) {
            this._DesktopEntry = opts.desktopEntry;
          }
        }
      }
      return {
        F: RootInterface2,
        d: [{
          kind: "field",
          key: "_CanQuit",
          value() {
            return true;
          }
        }, {
          kind: "field",
          key: "_Fullscreen",
          value() {
            return false;
          }
        }, {
          kind: "field",
          key: "_CanSetFullscreen",
          value() {
            return false;
          }
        }, {
          kind: "field",
          key: "_CanRaise",
          value() {
            return true;
          }
        }, {
          kind: "field",
          key: "_HasTrackList",
          value() {
            return false;
          }
        }, {
          kind: "field",
          key: "_Identity",
          value() {
            return "";
          }
        }, {
          kind: "field",
          key: "_DesktopEntry",
          value() {
            return "";
          }
        }, {
          kind: "field",
          key: "_SupportedUriSchemes",
          value() {
            return [];
          }
        }, {
          kind: "field",
          key: "_SupportedMimeTypes",
          value() {
            return [];
          }
        }, {
          kind: "get",
          decorators: [property({
            signature: "b",
            access: ACCESS_READ
          })],
          key: "CanQuit",
          value: /* @__PURE__ */ __name(function CanQuit() {
            return this._CanQuit;
          }, "CanQuit")
        }, {
          kind: "get",
          decorators: [property({
            signature: "b"
          })],
          key: "Fullscreen",
          value: /* @__PURE__ */ __name(function Fullscreen() {
            return this._Fullscreen;
          }, "Fullscreen")
        }, {
          kind: "set",
          key: "Fullscreen",
          value: /* @__PURE__ */ __name(function Fullscreen(value) {
            this._setPropertyInternal("Fullscreen", value);
          }, "Fullscreen")
        }, {
          kind: "get",
          decorators: [property({
            signature: "b",
            access: ACCESS_READ
          })],
          key: "CanSetFullscreen",
          value: /* @__PURE__ */ __name(function CanSetFullscreen() {
            return this._CanSetFullscreen;
          }, "CanSetFullscreen")
        }, {
          kind: "get",
          decorators: [property({
            signature: "b",
            access: ACCESS_READ
          })],
          key: "CanRaise",
          value: /* @__PURE__ */ __name(function CanRaise() {
            return this._CanRaise;
          }, "CanRaise")
        }, {
          kind: "get",
          decorators: [property({
            signature: "b",
            access: ACCESS_READ
          })],
          key: "HasTrackList",
          value: /* @__PURE__ */ __name(function HasTrackList() {
            return this._HasTrackList;
          }, "HasTrackList")
        }, {
          kind: "get",
          decorators: [property({
            signature: "s",
            access: ACCESS_READ
          })],
          key: "Identity",
          value: /* @__PURE__ */ __name(function Identity() {
            return this._Identity;
          }, "Identity")
        }, {
          kind: "get",
          decorators: [property({
            signature: "s",
            access: ACCESS_READ
          })],
          key: "DesktopEntry",
          value: /* @__PURE__ */ __name(function DesktopEntry() {
            return this._DesktopEntry;
          }, "DesktopEntry")
        }, {
          kind: "get",
          decorators: [property({
            signature: "as",
            access: ACCESS_READ
          })],
          key: "SupportedUriSchemes",
          value: /* @__PURE__ */ __name(function SupportedUriSchemes() {
            return this._SupportedUriSchemes;
          }, "SupportedUriSchemes")
        }, {
          kind: "get",
          decorators: [property({
            signature: "as",
            access: ACCESS_READ
          })],
          key: "SupportedMimeTypes",
          value: /* @__PURE__ */ __name(function SupportedMimeTypes() {
            return this._SupportedMimeTypes;
          }, "SupportedMimeTypes")
        }, {
          kind: "method",
          decorators: [method({})],
          key: "Raise",
          value: /* @__PURE__ */ __name(function Raise() {
            this.player.emit("raise");
          }, "Raise")
        }, {
          kind: "method",
          decorators: [method({})],
          key: "Quit",
          value: /* @__PURE__ */ __name(function Quit() {
            this.player.emit("quit");
          }, "Quit")
        }]
      };
    }, MprisInterface);
    module2.exports = RootInterface;
  }
});

// node_modules/mpris-service/dist/interfaces/playlists.js
var require_playlists = __commonJS({
  "node_modules/mpris-service/dist/interfaces/playlists.js"(exports2, module2) {
    function _decorate(decorators, factory, superClass, mixins) {
      var api = _getDecoratorsApi();
      if (mixins) {
        for (var i = 0; i < mixins.length; i++) {
          api = mixins[i](api);
        }
      }
      var r = factory(/* @__PURE__ */ __name(function initialize(O) {
        api.initializeInstanceElements(O, decorated.elements);
      }, "initialize"), superClass);
      var decorated = api.decorateClass(_coalesceClassElements(r.d.map(_createElementDescriptor)), decorators);
      api.initializeClassElements(r.F, decorated.elements);
      return api.runClassFinishers(r.F, decorated.finishers);
    }
    __name(_decorate, "_decorate");
    function _getDecoratorsApi() {
      _getDecoratorsApi = /* @__PURE__ */ __name(function() {
        return api;
      }, "_getDecoratorsApi");
      var api = { elementsDefinitionOrder: [["method"], ["field"]], initializeInstanceElements: /* @__PURE__ */ __name(function(O, elements) {
        ["method", "field"].forEach(function(kind) {
          elements.forEach(function(element) {
            if (element.kind === kind && element.placement === "own") {
              this.defineClassElement(O, element);
            }
          }, this);
        }, this);
      }, "initializeInstanceElements"), initializeClassElements: /* @__PURE__ */ __name(function(F, elements) {
        var proto = F.prototype;
        ["method", "field"].forEach(function(kind) {
          elements.forEach(function(element) {
            var placement = element.placement;
            if (element.kind === kind && (placement === "static" || placement === "prototype")) {
              var receiver = placement === "static" ? F : proto;
              this.defineClassElement(receiver, element);
            }
          }, this);
        }, this);
      }, "initializeClassElements"), defineClassElement: /* @__PURE__ */ __name(function(receiver, element) {
        var descriptor = element.descriptor;
        if (element.kind === "field") {
          var initializer = element.initializer;
          descriptor = { enumerable: descriptor.enumerable, writable: descriptor.writable, configurable: descriptor.configurable, value: initializer === void 0 ? void 0 : initializer.call(receiver) };
        }
        Object.defineProperty(receiver, element.key, descriptor);
      }, "defineClassElement"), decorateClass: /* @__PURE__ */ __name(function(elements, decorators) {
        var newElements = [];
        var finishers = [];
        var placements = { static: [], prototype: [], own: [] };
        elements.forEach(function(element) {
          this.addElementPlacement(element, placements);
        }, this);
        elements.forEach(function(element) {
          if (!_hasDecorators(element)) return newElements.push(element);
          var elementFinishersExtras = this.decorateElement(element, placements);
          newElements.push(elementFinishersExtras.element);
          newElements.push.apply(newElements, elementFinishersExtras.extras);
          finishers.push.apply(finishers, elementFinishersExtras.finishers);
        }, this);
        if (!decorators) {
          return { elements: newElements, finishers };
        }
        var result = this.decorateConstructor(newElements, decorators);
        finishers.push.apply(finishers, result.finishers);
        result.finishers = finishers;
        return result;
      }, "decorateClass"), addElementPlacement: /* @__PURE__ */ __name(function(element, placements, silent) {
        var keys = placements[element.placement];
        if (!silent && keys.indexOf(element.key) !== -1) {
          throw new TypeError("Duplicated element (" + element.key + ")");
        }
        keys.push(element.key);
      }, "addElementPlacement"), decorateElement: /* @__PURE__ */ __name(function(element, placements) {
        var extras = [];
        var finishers = [];
        for (var decorators = element.decorators, i = decorators.length - 1; i >= 0; i--) {
          var keys = placements[element.placement];
          keys.splice(keys.indexOf(element.key), 1);
          var elementObject = this.fromElementDescriptor(element);
          var elementFinisherExtras = this.toElementFinisherExtras((0, decorators[i])(elementObject) || elementObject);
          element = elementFinisherExtras.element;
          this.addElementPlacement(element, placements);
          if (elementFinisherExtras.finisher) {
            finishers.push(elementFinisherExtras.finisher);
          }
          var newExtras = elementFinisherExtras.extras;
          if (newExtras) {
            for (var j = 0; j < newExtras.length; j++) {
              this.addElementPlacement(newExtras[j], placements);
            }
            extras.push.apply(extras, newExtras);
          }
        }
        return { element, finishers, extras };
      }, "decorateElement"), decorateConstructor: /* @__PURE__ */ __name(function(elements, decorators) {
        var finishers = [];
        for (var i = decorators.length - 1; i >= 0; i--) {
          var obj = this.fromClassDescriptor(elements);
          var elementsAndFinisher = this.toClassDescriptor((0, decorators[i])(obj) || obj);
          if (elementsAndFinisher.finisher !== void 0) {
            finishers.push(elementsAndFinisher.finisher);
          }
          if (elementsAndFinisher.elements !== void 0) {
            elements = elementsAndFinisher.elements;
            for (var j = 0; j < elements.length - 1; j++) {
              for (var k = j + 1; k < elements.length; k++) {
                if (elements[j].key === elements[k].key && elements[j].placement === elements[k].placement) {
                  throw new TypeError("Duplicated element (" + elements[j].key + ")");
                }
              }
            }
          }
        }
        return { elements, finishers };
      }, "decorateConstructor"), fromElementDescriptor: /* @__PURE__ */ __name(function(element) {
        var obj = { kind: element.kind, key: element.key, placement: element.placement, descriptor: element.descriptor };
        var desc = { value: "Descriptor", configurable: true };
        Object.defineProperty(obj, Symbol.toStringTag, desc);
        if (element.kind === "field") obj.initializer = element.initializer;
        return obj;
      }, "fromElementDescriptor"), toElementDescriptors: /* @__PURE__ */ __name(function(elementObjects) {
        if (elementObjects === void 0) return;
        return _toArray(elementObjects).map(function(elementObject) {
          var element = this.toElementDescriptor(elementObject);
          this.disallowProperty(elementObject, "finisher", "An element descriptor");
          this.disallowProperty(elementObject, "extras", "An element descriptor");
          return element;
        }, this);
      }, "toElementDescriptors"), toElementDescriptor: /* @__PURE__ */ __name(function(elementObject) {
        var kind = String(elementObject.kind);
        if (kind !== "method" && kind !== "field") {
          throw new TypeError(`An element descriptor's .kind property must be either "method" or "field", but a decorator created an element descriptor with .kind "` + kind + '"');
        }
        var key = _toPropertyKey(elementObject.key);
        var placement = String(elementObject.placement);
        if (placement !== "static" && placement !== "prototype" && placement !== "own") {
          throw new TypeError(`An element descriptor's .placement property must be one of "static", "prototype" or "own", but a decorator created an element descriptor with .placement "` + placement + '"');
        }
        var descriptor = elementObject.descriptor;
        this.disallowProperty(elementObject, "elements", "An element descriptor");
        var element = { kind, key, placement, descriptor: Object.assign({}, descriptor) };
        if (kind !== "field") {
          this.disallowProperty(elementObject, "initializer", "A method descriptor");
        } else {
          this.disallowProperty(descriptor, "get", "The property descriptor of a field descriptor");
          this.disallowProperty(descriptor, "set", "The property descriptor of a field descriptor");
          this.disallowProperty(descriptor, "value", "The property descriptor of a field descriptor");
          element.initializer = elementObject.initializer;
        }
        return element;
      }, "toElementDescriptor"), toElementFinisherExtras: /* @__PURE__ */ __name(function(elementObject) {
        var element = this.toElementDescriptor(elementObject);
        var finisher = _optionalCallableProperty(elementObject, "finisher");
        var extras = this.toElementDescriptors(elementObject.extras);
        return { element, finisher, extras };
      }, "toElementFinisherExtras"), fromClassDescriptor: /* @__PURE__ */ __name(function(elements) {
        var obj = { kind: "class", elements: elements.map(this.fromElementDescriptor, this) };
        var desc = { value: "Descriptor", configurable: true };
        Object.defineProperty(obj, Symbol.toStringTag, desc);
        return obj;
      }, "fromClassDescriptor"), toClassDescriptor: /* @__PURE__ */ __name(function(obj) {
        var kind = String(obj.kind);
        if (kind !== "class") {
          throw new TypeError(`A class descriptor's .kind property must be "class", but a decorator created a class descriptor with .kind "` + kind + '"');
        }
        this.disallowProperty(obj, "key", "A class descriptor");
        this.disallowProperty(obj, "placement", "A class descriptor");
        this.disallowProperty(obj, "descriptor", "A class descriptor");
        this.disallowProperty(obj, "initializer", "A class descriptor");
        this.disallowProperty(obj, "extras", "A class descriptor");
        var finisher = _optionalCallableProperty(obj, "finisher");
        var elements = this.toElementDescriptors(obj.elements);
        return { elements, finisher };
      }, "toClassDescriptor"), runClassFinishers: /* @__PURE__ */ __name(function(constructor, finishers) {
        for (var i = 0; i < finishers.length; i++) {
          var newConstructor = (0, finishers[i])(constructor);
          if (newConstructor !== void 0) {
            if (typeof newConstructor !== "function") {
              throw new TypeError("Finishers must return a constructor.");
            }
            constructor = newConstructor;
          }
        }
        return constructor;
      }, "runClassFinishers"), disallowProperty: /* @__PURE__ */ __name(function(obj, name, objectType) {
        if (obj[name] !== void 0) {
          throw new TypeError(objectType + " can't have a ." + name + " property.");
        }
      }, "disallowProperty") };
      return api;
    }
    __name(_getDecoratorsApi, "_getDecoratorsApi");
    function _createElementDescriptor(def) {
      var key = _toPropertyKey(def.key);
      var descriptor;
      if (def.kind === "method") {
        descriptor = { value: def.value, writable: true, configurable: true, enumerable: false };
      } else if (def.kind === "get") {
        descriptor = { get: def.value, configurable: true, enumerable: false };
      } else if (def.kind === "set") {
        descriptor = { set: def.value, configurable: true, enumerable: false };
      } else if (def.kind === "field") {
        descriptor = { configurable: true, writable: true, enumerable: true };
      }
      var element = { kind: def.kind === "field" ? "field" : "method", key, placement: def.static ? "static" : def.kind === "field" ? "own" : "prototype", descriptor };
      if (def.decorators) element.decorators = def.decorators;
      if (def.kind === "field") element.initializer = def.value;
      return element;
    }
    __name(_createElementDescriptor, "_createElementDescriptor");
    function _coalesceGetterSetter(element, other) {
      if (element.descriptor.get !== void 0) {
        other.descriptor.get = element.descriptor.get;
      } else {
        other.descriptor.set = element.descriptor.set;
      }
    }
    __name(_coalesceGetterSetter, "_coalesceGetterSetter");
    function _coalesceClassElements(elements) {
      var newElements = [];
      var isSameElement = /* @__PURE__ */ __name(function(other2) {
        return other2.kind === "method" && other2.key === element.key && other2.placement === element.placement;
      }, "isSameElement");
      for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var other;
        if (element.kind === "method" && (other = newElements.find(isSameElement))) {
          if (_isDataDescriptor(element.descriptor) || _isDataDescriptor(other.descriptor)) {
            if (_hasDecorators(element) || _hasDecorators(other)) {
              throw new ReferenceError("Duplicated methods (" + element.key + ") can't be decorated.");
            }
            other.descriptor = element.descriptor;
          } else {
            if (_hasDecorators(element)) {
              if (_hasDecorators(other)) {
                throw new ReferenceError("Decorators can't be placed on different accessors with for the same property (" + element.key + ").");
              }
              other.decorators = element.decorators;
            }
            _coalesceGetterSetter(element, other);
          }
        } else {
          newElements.push(element);
        }
      }
      return newElements;
    }
    __name(_coalesceClassElements, "_coalesceClassElements");
    function _hasDecorators(element) {
      return element.decorators && element.decorators.length;
    }
    __name(_hasDecorators, "_hasDecorators");
    function _isDataDescriptor(desc) {
      return desc !== void 0 && !(desc.value === void 0 && desc.writable === void 0);
    }
    __name(_isDataDescriptor, "_isDataDescriptor");
    function _optionalCallableProperty(obj, name) {
      var value = obj[name];
      if (value !== void 0 && typeof value !== "function") {
        throw new TypeError("Expected '" + name + "' to be a function");
      }
      return value;
    }
    __name(_optionalCallableProperty, "_optionalCallableProperty");
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    __name(_toPropertyKey, "_toPropertyKey");
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    __name(_toPrimitive, "_toPrimitive");
    function _toArray(arr) {
      return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest();
    }
    __name(_toArray, "_toArray");
    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    __name(_nonIterableRest, "_nonIterableRest");
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }
    __name(_unsupportedIterableToArray, "_unsupportedIterableToArray");
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
      return arr2;
    }
    __name(_arrayLikeToArray, "_arrayLikeToArray");
    function _iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
    }
    __name(_iterableToArray, "_iterableToArray");
    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }
    __name(_arrayWithHoles, "_arrayWithHoles");
    var MprisInterface = require_mpris_interface();
    var dbus = require_dbus_next();
    var Variant = dbus.Variant;
    var types = require_types();
    var {
      property,
      method,
      signal,
      DBusError,
      ACCESS_READ,
      ACCESS_WRITE,
      ACCESS_READWRITE
    } = dbus.interface;
    var PlaylistsInterface = _decorate(null, function(_initialize, _MprisInterface) {
      class PlaylistsInterface2 extends _MprisInterface {
        static {
          __name(this, "PlaylistsInterface");
        }
        constructor(player) {
          super("org.mpris.MediaPlayer2.Playlists", player);
          _initialize(this);
        }
      }
      return {
        F: PlaylistsInterface2,
        d: [{
          kind: "field",
          key: "_ActivePlaylist",
          value() {
            return [false, types.emptyPlaylist];
          }
        }, {
          kind: "field",
          key: "_PlaylistCount",
          value() {
            return 0;
          }
        }, {
          kind: "get",
          decorators: [property({
            signature: "u",
            access: ACCESS_READ
          })],
          key: "PlaylistCount",
          value: /* @__PURE__ */ __name(function PlaylistCount() {
            return this._PlaylistCount;
          }, "PlaylistCount")
        }, {
          kind: "get",
          decorators: [property({
            signature: "as",
            access: ACCESS_READ
          })],
          key: "Orderings",
          value: /* @__PURE__ */ __name(function Orderings() {
            return ["Alphabetical", "UserDefined"];
          }, "Orderings")
        }, {
          kind: "get",
          decorators: [property({
            signature: "(b(oss))",
            access: ACCESS_READ
          })],
          key: "ActivePlaylist",
          value: /* @__PURE__ */ __name(function ActivePlaylist() {
            return this._ActivePlaylist;
          }, "ActivePlaylist")
        }, {
          kind: "method",
          key: "setActivePlaylistId",
          value: /* @__PURE__ */ __name(function setActivePlaylistId(playlistId) {
            let i = this.player.getPlaylistIndex(playlistId);
            this.setProperty("ActivePlaylist", this.player.playlists[i] || null);
          }, "setActivePlaylistId")
        }, {
          kind: "method",
          decorators: [method({
            inSignature: "o"
          })],
          key: "ActivatePlaylist",
          value: /* @__PURE__ */ __name(function ActivatePlaylist(playlistId) {
            this.player.emit("activatePlaylist", playlistId);
          }, "ActivatePlaylist")
        }, {
          kind: "method",
          decorators: [method({
            inSignature: "uusb",
            outSignature: "a(oss)"
          })],
          key: "GetPlaylists",
          value: /* @__PURE__ */ __name(function GetPlaylists(index, maxCount, order, reverseOrder) {
            if (!this.player.playlists) {
              return [];
            }
            let result = this.player.playlists.sort(function(a, b) {
              let ret = 1;
              switch (order) {
                case "Alphabetical":
                  ret = a.Name > b.Name ? 1 : -1;
                  break;
                //case 'CreationDate':
                //case 'ModifiedDate':
                //case 'LastPlayDate':
                case "UserDefined":
                  break;
              }
              return ret;
            }).slice(index, maxCount + index).map(types.playlistToDbus);
            if (reverseOrder) {
              result.reverse();
            }
            return result;
          }, "GetPlaylists")
        }, {
          kind: "method",
          decorators: [signal({
            signature: "(oss)"
          })],
          key: "PlaylistChanged",
          value: /* @__PURE__ */ __name(function PlaylistChanged(playlist) {
            return types.playlistToDbus(playlist);
          }, "PlaylistChanged")
        }]
      };
    }, MprisInterface);
    module2.exports = PlaylistsInterface;
  }
});

// node_modules/mpris-service/dist/interfaces/tracklist.js
var require_tracklist = __commonJS({
  "node_modules/mpris-service/dist/interfaces/tracklist.js"(exports2, module2) {
    function _decorate(decorators, factory, superClass, mixins) {
      var api = _getDecoratorsApi();
      if (mixins) {
        for (var i = 0; i < mixins.length; i++) {
          api = mixins[i](api);
        }
      }
      var r = factory(/* @__PURE__ */ __name(function initialize(O) {
        api.initializeInstanceElements(O, decorated.elements);
      }, "initialize"), superClass);
      var decorated = api.decorateClass(_coalesceClassElements(r.d.map(_createElementDescriptor)), decorators);
      api.initializeClassElements(r.F, decorated.elements);
      return api.runClassFinishers(r.F, decorated.finishers);
    }
    __name(_decorate, "_decorate");
    function _getDecoratorsApi() {
      _getDecoratorsApi = /* @__PURE__ */ __name(function() {
        return api;
      }, "_getDecoratorsApi");
      var api = { elementsDefinitionOrder: [["method"], ["field"]], initializeInstanceElements: /* @__PURE__ */ __name(function(O, elements) {
        ["method", "field"].forEach(function(kind) {
          elements.forEach(function(element) {
            if (element.kind === kind && element.placement === "own") {
              this.defineClassElement(O, element);
            }
          }, this);
        }, this);
      }, "initializeInstanceElements"), initializeClassElements: /* @__PURE__ */ __name(function(F, elements) {
        var proto = F.prototype;
        ["method", "field"].forEach(function(kind) {
          elements.forEach(function(element) {
            var placement = element.placement;
            if (element.kind === kind && (placement === "static" || placement === "prototype")) {
              var receiver = placement === "static" ? F : proto;
              this.defineClassElement(receiver, element);
            }
          }, this);
        }, this);
      }, "initializeClassElements"), defineClassElement: /* @__PURE__ */ __name(function(receiver, element) {
        var descriptor = element.descriptor;
        if (element.kind === "field") {
          var initializer = element.initializer;
          descriptor = { enumerable: descriptor.enumerable, writable: descriptor.writable, configurable: descriptor.configurable, value: initializer === void 0 ? void 0 : initializer.call(receiver) };
        }
        Object.defineProperty(receiver, element.key, descriptor);
      }, "defineClassElement"), decorateClass: /* @__PURE__ */ __name(function(elements, decorators) {
        var newElements = [];
        var finishers = [];
        var placements = { static: [], prototype: [], own: [] };
        elements.forEach(function(element) {
          this.addElementPlacement(element, placements);
        }, this);
        elements.forEach(function(element) {
          if (!_hasDecorators(element)) return newElements.push(element);
          var elementFinishersExtras = this.decorateElement(element, placements);
          newElements.push(elementFinishersExtras.element);
          newElements.push.apply(newElements, elementFinishersExtras.extras);
          finishers.push.apply(finishers, elementFinishersExtras.finishers);
        }, this);
        if (!decorators) {
          return { elements: newElements, finishers };
        }
        var result = this.decorateConstructor(newElements, decorators);
        finishers.push.apply(finishers, result.finishers);
        result.finishers = finishers;
        return result;
      }, "decorateClass"), addElementPlacement: /* @__PURE__ */ __name(function(element, placements, silent) {
        var keys = placements[element.placement];
        if (!silent && keys.indexOf(element.key) !== -1) {
          throw new TypeError("Duplicated element (" + element.key + ")");
        }
        keys.push(element.key);
      }, "addElementPlacement"), decorateElement: /* @__PURE__ */ __name(function(element, placements) {
        var extras = [];
        var finishers = [];
        for (var decorators = element.decorators, i = decorators.length - 1; i >= 0; i--) {
          var keys = placements[element.placement];
          keys.splice(keys.indexOf(element.key), 1);
          var elementObject = this.fromElementDescriptor(element);
          var elementFinisherExtras = this.toElementFinisherExtras((0, decorators[i])(elementObject) || elementObject);
          element = elementFinisherExtras.element;
          this.addElementPlacement(element, placements);
          if (elementFinisherExtras.finisher) {
            finishers.push(elementFinisherExtras.finisher);
          }
          var newExtras = elementFinisherExtras.extras;
          if (newExtras) {
            for (var j = 0; j < newExtras.length; j++) {
              this.addElementPlacement(newExtras[j], placements);
            }
            extras.push.apply(extras, newExtras);
          }
        }
        return { element, finishers, extras };
      }, "decorateElement"), decorateConstructor: /* @__PURE__ */ __name(function(elements, decorators) {
        var finishers = [];
        for (var i = decorators.length - 1; i >= 0; i--) {
          var obj = this.fromClassDescriptor(elements);
          var elementsAndFinisher = this.toClassDescriptor((0, decorators[i])(obj) || obj);
          if (elementsAndFinisher.finisher !== void 0) {
            finishers.push(elementsAndFinisher.finisher);
          }
          if (elementsAndFinisher.elements !== void 0) {
            elements = elementsAndFinisher.elements;
            for (var j = 0; j < elements.length - 1; j++) {
              for (var k = j + 1; k < elements.length; k++) {
                if (elements[j].key === elements[k].key && elements[j].placement === elements[k].placement) {
                  throw new TypeError("Duplicated element (" + elements[j].key + ")");
                }
              }
            }
          }
        }
        return { elements, finishers };
      }, "decorateConstructor"), fromElementDescriptor: /* @__PURE__ */ __name(function(element) {
        var obj = { kind: element.kind, key: element.key, placement: element.placement, descriptor: element.descriptor };
        var desc = { value: "Descriptor", configurable: true };
        Object.defineProperty(obj, Symbol.toStringTag, desc);
        if (element.kind === "field") obj.initializer = element.initializer;
        return obj;
      }, "fromElementDescriptor"), toElementDescriptors: /* @__PURE__ */ __name(function(elementObjects) {
        if (elementObjects === void 0) return;
        return _toArray(elementObjects).map(function(elementObject) {
          var element = this.toElementDescriptor(elementObject);
          this.disallowProperty(elementObject, "finisher", "An element descriptor");
          this.disallowProperty(elementObject, "extras", "An element descriptor");
          return element;
        }, this);
      }, "toElementDescriptors"), toElementDescriptor: /* @__PURE__ */ __name(function(elementObject) {
        var kind = String(elementObject.kind);
        if (kind !== "method" && kind !== "field") {
          throw new TypeError(`An element descriptor's .kind property must be either "method" or "field", but a decorator created an element descriptor with .kind "` + kind + '"');
        }
        var key = _toPropertyKey(elementObject.key);
        var placement = String(elementObject.placement);
        if (placement !== "static" && placement !== "prototype" && placement !== "own") {
          throw new TypeError(`An element descriptor's .placement property must be one of "static", "prototype" or "own", but a decorator created an element descriptor with .placement "` + placement + '"');
        }
        var descriptor = elementObject.descriptor;
        this.disallowProperty(elementObject, "elements", "An element descriptor");
        var element = { kind, key, placement, descriptor: Object.assign({}, descriptor) };
        if (kind !== "field") {
          this.disallowProperty(elementObject, "initializer", "A method descriptor");
        } else {
          this.disallowProperty(descriptor, "get", "The property descriptor of a field descriptor");
          this.disallowProperty(descriptor, "set", "The property descriptor of a field descriptor");
          this.disallowProperty(descriptor, "value", "The property descriptor of a field descriptor");
          element.initializer = elementObject.initializer;
        }
        return element;
      }, "toElementDescriptor"), toElementFinisherExtras: /* @__PURE__ */ __name(function(elementObject) {
        var element = this.toElementDescriptor(elementObject);
        var finisher = _optionalCallableProperty(elementObject, "finisher");
        var extras = this.toElementDescriptors(elementObject.extras);
        return { element, finisher, extras };
      }, "toElementFinisherExtras"), fromClassDescriptor: /* @__PURE__ */ __name(function(elements) {
        var obj = { kind: "class", elements: elements.map(this.fromElementDescriptor, this) };
        var desc = { value: "Descriptor", configurable: true };
        Object.defineProperty(obj, Symbol.toStringTag, desc);
        return obj;
      }, "fromClassDescriptor"), toClassDescriptor: /* @__PURE__ */ __name(function(obj) {
        var kind = String(obj.kind);
        if (kind !== "class") {
          throw new TypeError(`A class descriptor's .kind property must be "class", but a decorator created a class descriptor with .kind "` + kind + '"');
        }
        this.disallowProperty(obj, "key", "A class descriptor");
        this.disallowProperty(obj, "placement", "A class descriptor");
        this.disallowProperty(obj, "descriptor", "A class descriptor");
        this.disallowProperty(obj, "initializer", "A class descriptor");
        this.disallowProperty(obj, "extras", "A class descriptor");
        var finisher = _optionalCallableProperty(obj, "finisher");
        var elements = this.toElementDescriptors(obj.elements);
        return { elements, finisher };
      }, "toClassDescriptor"), runClassFinishers: /* @__PURE__ */ __name(function(constructor, finishers) {
        for (var i = 0; i < finishers.length; i++) {
          var newConstructor = (0, finishers[i])(constructor);
          if (newConstructor !== void 0) {
            if (typeof newConstructor !== "function") {
              throw new TypeError("Finishers must return a constructor.");
            }
            constructor = newConstructor;
          }
        }
        return constructor;
      }, "runClassFinishers"), disallowProperty: /* @__PURE__ */ __name(function(obj, name, objectType) {
        if (obj[name] !== void 0) {
          throw new TypeError(objectType + " can't have a ." + name + " property.");
        }
      }, "disallowProperty") };
      return api;
    }
    __name(_getDecoratorsApi, "_getDecoratorsApi");
    function _createElementDescriptor(def) {
      var key = _toPropertyKey(def.key);
      var descriptor;
      if (def.kind === "method") {
        descriptor = { value: def.value, writable: true, configurable: true, enumerable: false };
      } else if (def.kind === "get") {
        descriptor = { get: def.value, configurable: true, enumerable: false };
      } else if (def.kind === "set") {
        descriptor = { set: def.value, configurable: true, enumerable: false };
      } else if (def.kind === "field") {
        descriptor = { configurable: true, writable: true, enumerable: true };
      }
      var element = { kind: def.kind === "field" ? "field" : "method", key, placement: def.static ? "static" : def.kind === "field" ? "own" : "prototype", descriptor };
      if (def.decorators) element.decorators = def.decorators;
      if (def.kind === "field") element.initializer = def.value;
      return element;
    }
    __name(_createElementDescriptor, "_createElementDescriptor");
    function _coalesceGetterSetter(element, other) {
      if (element.descriptor.get !== void 0) {
        other.descriptor.get = element.descriptor.get;
      } else {
        other.descriptor.set = element.descriptor.set;
      }
    }
    __name(_coalesceGetterSetter, "_coalesceGetterSetter");
    function _coalesceClassElements(elements) {
      var newElements = [];
      var isSameElement = /* @__PURE__ */ __name(function(other2) {
        return other2.kind === "method" && other2.key === element.key && other2.placement === element.placement;
      }, "isSameElement");
      for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var other;
        if (element.kind === "method" && (other = newElements.find(isSameElement))) {
          if (_isDataDescriptor(element.descriptor) || _isDataDescriptor(other.descriptor)) {
            if (_hasDecorators(element) || _hasDecorators(other)) {
              throw new ReferenceError("Duplicated methods (" + element.key + ") can't be decorated.");
            }
            other.descriptor = element.descriptor;
          } else {
            if (_hasDecorators(element)) {
              if (_hasDecorators(other)) {
                throw new ReferenceError("Decorators can't be placed on different accessors with for the same property (" + element.key + ").");
              }
              other.decorators = element.decorators;
            }
            _coalesceGetterSetter(element, other);
          }
        } else {
          newElements.push(element);
        }
      }
      return newElements;
    }
    __name(_coalesceClassElements, "_coalesceClassElements");
    function _hasDecorators(element) {
      return element.decorators && element.decorators.length;
    }
    __name(_hasDecorators, "_hasDecorators");
    function _isDataDescriptor(desc) {
      return desc !== void 0 && !(desc.value === void 0 && desc.writable === void 0);
    }
    __name(_isDataDescriptor, "_isDataDescriptor");
    function _optionalCallableProperty(obj, name) {
      var value = obj[name];
      if (value !== void 0 && typeof value !== "function") {
        throw new TypeError("Expected '" + name + "' to be a function");
      }
      return value;
    }
    __name(_optionalCallableProperty, "_optionalCallableProperty");
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    __name(_toPropertyKey, "_toPropertyKey");
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    __name(_toPrimitive, "_toPrimitive");
    function _toArray(arr) {
      return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest();
    }
    __name(_toArray, "_toArray");
    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    __name(_nonIterableRest, "_nonIterableRest");
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }
    __name(_unsupportedIterableToArray, "_unsupportedIterableToArray");
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
      return arr2;
    }
    __name(_arrayLikeToArray, "_arrayLikeToArray");
    function _iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
    }
    __name(_iterableToArray, "_iterableToArray");
    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }
    __name(_arrayWithHoles, "_arrayWithHoles");
    var MprisInterface = require_mpris_interface();
    var dbus = require_dbus_next();
    var Variant = dbus.Variant;
    var types = require_types();
    var {
      property,
      method,
      signal,
      DBusError,
      ACCESS_READ,
      ACCESS_WRITE,
      ACCESS_READWRITE
    } = dbus.interface;
    var TracklistInterface = _decorate(null, function(_initialize, _MprisInterface) {
      class TracklistInterface2 extends _MprisInterface {
        static {
          __name(this, "TracklistInterface");
        }
        constructor(player) {
          super("org.mpris.MediaPlayer2.TrackList", player);
          _initialize(this);
        }
      }
      return {
        F: TracklistInterface2,
        d: [{
          kind: "field",
          key: "_Tracks",
          value() {
            return [];
          }
        }, {
          kind: "field",
          key: "_CanEditTracks",
          value() {
            return false;
          }
        }, {
          kind: "method",
          key: "setTracks",
          value: /* @__PURE__ */ __name(function setTracks(tracksPlain) {
            this.setProperty("Tracks", tracksPlain);
          }, "setTracks")
        }, {
          kind: "get",
          decorators: [property({
            signature: "ao",
            access: ACCESS_READ
          })],
          key: "Tracks",
          value: /* @__PURE__ */ __name(function Tracks() {
            return this._Tracks;
          }, "Tracks")
        }, {
          kind: "get",
          decorators: [property({
            signature: "b",
            access: ACCESS_READ
          })],
          key: "CanEditTracks",
          value: /* @__PURE__ */ __name(function CanEditTracks() {
            return this._CanEditTracks;
          }, "CanEditTracks")
        }, {
          kind: "method",
          decorators: [method({
            inSignature: "ao",
            outSignature: "aa{sv}"
          })],
          key: "GetTracksMetadata",
          value: /* @__PURE__ */ __name(function GetTracksMetadata(trackIds) {
            return this.player.tracks.filter((t) => {
              return trackIds.some((id) => id === t["mpris:trackid"]);
            }).map(types.metadataToDbus);
          }, "GetTracksMetadata")
        }, {
          kind: "method",
          decorators: [method({
            inSignature: "sob"
          })],
          key: "AddTrack",
          value: /* @__PURE__ */ __name(function AddTrack(uri, afterTrack, setAsCurrent) {
            this.player.emit("addTrack", {
              uri,
              afterTrack,
              setAsCurrent
            });
          }, "AddTrack")
        }, {
          kind: "method",
          decorators: [method({
            inSignature: "o"
          })],
          key: "RemoveTrack",
          value: /* @__PURE__ */ __name(function RemoveTrack(trackId) {
            this.player.emit("removeTrack", trackId);
          }, "RemoveTrack")
        }, {
          kind: "method",
          decorators: [method({
            inSignature: "o"
          })],
          key: "GoTo",
          value: /* @__PURE__ */ __name(function GoTo(trackId) {
            this.player.emit("goTo", trackId);
          }, "GoTo")
        }, {
          kind: "method",
          decorators: [signal({
            signature: "aoo"
          })],
          key: "TrackListReplaced",
          value: /* @__PURE__ */ __name(function TrackListReplaced(replacedPlain) {
            this.setTracks(replacedPlain);
            return [this._Tracks, "/org/mpris/MediaPlayer2/TrackList/NoTrack"];
          }, "TrackListReplaced")
        }, {
          kind: "method",
          decorators: [signal({
            signature: "a{sv}"
          })],
          key: "TrackAdded",
          value: /* @__PURE__ */ __name(function TrackAdded(metadata) {
            return types.metadataToDbus(metadata);
          }, "TrackAdded")
        }, {
          kind: "method",
          decorators: [signal({
            signature: "o"
          })],
          key: "TrackRemoved",
          value: /* @__PURE__ */ __name(function TrackRemoved(path2) {
            return path2;
          }, "TrackRemoved")
        }, {
          kind: "method",
          decorators: [signal({
            signature: "oa{sv}"
          })],
          key: "TrackMetadataChanged",
          value: /* @__PURE__ */ __name(function TrackMetadataChanged(path2, metadata) {
            return [path2, types.metadataToDbus(metadata)];
          }, "TrackMetadataChanged")
        }]
      };
    }, MprisInterface);
    module2.exports = TracklistInterface;
  }
});

// node_modules/mpris-service/dist/index.js
var require_dist = __commonJS({
  "node_modules/mpris-service/dist/index.js"(exports2, module2) {
    require_source_map_support().install();
    var events = require("events");
    var util = require("util");
    var dbus = require_dbus_next();
    dbus.setBigIntCompat(true);
    var PlayerInterface = require_player();
    var RootInterface = require_root();
    var PlaylistsInterface = require_playlists();
    var TracklistInterface = require_tracklist();
    var types = require_types();
    var constants = require_constants3();
    var MPRIS_PATH = "/org/mpris/MediaPlayer2";
    function lcfirst(str) {
      return str[0].toLowerCase() + str.substr(1);
    }
    __name(lcfirst, "lcfirst");
    function Player(opts) {
      if (!(this instanceof Player)) {
        return new Player(opts);
      }
      events.EventEmitter.call(this);
      this.name = opts.name;
      this.supportedInterfaces = opts.supportedInterfaces || ["player"];
      this._tracks = [];
      this.init(opts);
    }
    __name(Player, "Player");
    util.inherits(Player, events.EventEmitter);
    Player.prototype.init = function(opts) {
      this.serviceName = `org.mpris.MediaPlayer2.${this.name}`;
      dbus.validators.assertBusNameValid(this.serviceName);
      this._bus = dbus.sessionBus();
      this._bus.on("error", (err) => {
        this.emit("error", err);
      });
      this.interfaces = {};
      this._addRootInterface(this._bus, opts);
      if (this.supportedInterfaces.indexOf("player") >= 0) {
        this._addPlayerInterface(this._bus);
      }
      if (this.supportedInterfaces.indexOf("trackList") >= 0) {
        this._addTracklistInterface(this._bus);
      }
      if (this.supportedInterfaces.indexOf("playlists") >= 0) {
        this._addPlaylistsInterface(this._bus);
      }
      for (let k of Object.keys(this.interfaces)) {
        let iface = this.interfaces[k];
        this._bus.export(MPRIS_PATH, iface);
      }
      this._bus.requestName(this.serviceName, dbus.NameFlag.DO_NOT_QUEUE).then((reply) => {
        if (reply === dbus.RequestNameReply.EXISTS) {
          this.serviceName = `${this.serviceName}.instance${process.pid}`;
          return this._bus.requestName(this.serviceName);
        }
      }).catch((err) => {
        this.emit("error", err);
      });
    };
    Player.prototype._addRootInterface = function(bus, opts) {
      this.interfaces.root = new RootInterface(this, opts);
      this._addEventedPropertiesList(this.interfaces.root, ["Identity", "Fullscreen", "SupportedUriSchemes", "SupportedMimeTypes", "CanQuit", "CanRaise", "CanSetFullscreen", "HasTrackList", "DesktopEntry"]);
    };
    Player.prototype._addPlayerInterface = function(bus) {
      this.interfaces.player = new PlayerInterface(this);
      let eventedProps = ["PlaybackStatus", "LoopStatus", "Rate", "Shuffle", "Metadata", "Volume", "CanControl", "CanPause", "CanPlay", "CanSeek", "CanGoNext", "CanGoPrevious", "MinimumRate", "MaximumRate"];
      this._addEventedPropertiesList(this.interfaces.player, eventedProps);
    };
    Player.prototype._addTracklistInterface = function(bus) {
      this.interfaces.tracklist = new TracklistInterface(this);
      this._addEventedPropertiesList(this.interfaces.tracklist, ["CanEditTracks"]);
      Object.defineProperty(this, "tracks", {
        get: /* @__PURE__ */ __name(function() {
          return this._tracks;
        }, "get"),
        set: /* @__PURE__ */ __name(function(value) {
          this._tracks = value;
          this.interfaces.tracklist.TrackListReplaced(value);
        }, "set"),
        enumerable: true,
        configurable: true
      });
    };
    Player.prototype._addPlaylistsInterface = function(bus) {
      this.interfaces.playlists = new PlaylistsInterface(this);
      this._addEventedPropertiesList(this.interfaces.playlists, ["PlaylistCount", "ActivePlaylist"]);
    };
    Player.prototype.objectPath = function(subpath) {
      let path2 = `/org/node/mediaplayer/${this.name}`;
      if (subpath) {
        path2 += `/${subpath}`;
      }
      return path2;
    };
    Player.prototype._addEventedProperty = function(iface, name) {
      let that2 = this;
      let localName = lcfirst(name);
      Object.defineProperty(this, localName, {
        get: /* @__PURE__ */ __name(function() {
          let value = iface[name];
          if (name === "ActivePlaylist") {
            return types.playlistToPlain(value);
          } else if (name === "Metadata") {
            return types.metadataToPlain(value);
          }
          return value;
        }, "get"),
        set: /* @__PURE__ */ __name(function(value) {
          iface.setProperty(name, value);
        }, "set"),
        enumerable: true,
        configurable: true
      });
    };
    Player.prototype._addEventedPropertiesList = function(iface, props) {
      for (let i = 0; i < props.length; i++) {
        this._addEventedProperty(iface, props[i]);
      }
    };
    Player.prototype.getPosition = function() {
      return 0;
    };
    Player.prototype.seeked = function(position) {
      let seekTo = Math.floor(position || 0);
      if (isNaN(seekTo)) {
        throw new Error(`seeked expected a number (got ${position})`);
      }
      this.interfaces.player.Seeked(seekTo);
    };
    Player.prototype.getTrackIndex = function(trackId) {
      for (let i = 0; i < this.tracks.length; i++) {
        let track = this.tracks[i];
        if (track["mpris:trackid"] === trackId) {
          return i;
        }
      }
      return -1;
    };
    Player.prototype.getTrack = function(trackId) {
      return this.tracks[this.getTrackIndex(trackId)];
    };
    Player.prototype.addTrack = function(track) {
      this.tracks.push(track);
      this.interfaces.tracklist.setTracks(this.tracks);
      let afterTrack = "/org/mpris/MediaPlayer2/TrackList/NoTrack";
      if (this.tracks.length > 2) {
        afterTrack = this.tracks[this.tracks.length - 2]["mpris:trackid"];
      }
      that.interfaces.tracklist.TrackAdded(afterTrack);
    };
    Player.prototype.removeTrack = function(trackId) {
      let i = this.getTrackIndex(trackId);
      this.tracks.splice(i, 1);
      this.interfaces.tracklist.setTracks(this.tracks);
      that.interfaces.tracklist.TrackRemoved(trackId);
    };
    Player.prototype.getPlaylistIndex = function(playlistId) {
      for (let i = 0; i < this.playlists.length; i++) {
        let playlist = this.playlists[i];
        if (playlist.Id === playlistId) {
          return i;
        }
      }
      return -1;
    };
    Player.prototype.setPlaylists = function(playlists) {
      this.playlists = playlists;
      this.playlistCount = playlists.length;
      let that2 = this;
      this.playlists.forEach(function(playlist) {
        that2.interfaces.playlists.PlaylistChanged(playlist);
      });
    };
    Player.prototype.setActivePlaylist = function(playlistId) {
      this.interfaces.playlists.setActivePlaylistId(playlistId);
    };
    Player.PLAYBACK_STATUS_PLAYING = constants.PLAYBACK_STATUS_PLAYING;
    Player.PLAYBACK_STATUS_PAUSED = constants.PLAYBACK_STATUS_PAUSED;
    Player.PLAYBACK_STATUS_STOPPED = constants.PLAYBACK_STATUS_STOPPED;
    Player.LOOP_STATUS_NONE = constants.LOOP_STATUS_NONE;
    Player.LOOP_STATUS_TRACK = constants.LOOP_STATUS_TRACK;
    Player.LOOP_STATUS_PLAYLIST = constants.LOOP_STATUS_PLAYLIST;
    module2.exports = Player;
  }
});

// src/mpris.js
var require_mpris = __commonJS({
  "src/mpris.js"(exports2, module2) {
    "use strict";
    var crypto = require("node:crypto");
    var Player = null;
    try {
      Player = require_dist();
    } catch {
      Player = null;
    }
    var MprisBridge2 = class {
      static {
        __name(this, "MprisBridge");
      }
      constructor(bridge, log, lyrics) {
        this.bridge = bridge;
        this.lyrics = lyrics || null;
        this.log = log || (() => {
        });
        this.player = null;
        this.zoneId = null;
        this.available = !!Player;
        this._seekBase = 0;
        this._seekAt = 0;
        this._playing = false;
        this._lastTrackId = "";
        this._resyncSeeks = 0;
      }
      get active() {
        return !!this.player;
      }
      enable() {
        if (!this.available) return false;
        if (this.player) return true;
        let p;
        try {
          p = Player({
            name: "roon",
            identity: "Roon",
            supportedUriSchemes: [],
            supportedMimeTypes: [],
            supportedInterfaces: ["player"]
          });
        } catch (e) {
          this.log("error", "mpris: " + e.message);
          return false;
        }
        this.player = p;
        p.getPosition = () => Math.round(this.position() * 1e6);
        p.canQuit = false;
        p.canRaise = false;
        p.canControl = true;
        for (const ev of ["play", "pause", "playpause", "stop", "next", "previous"]) {
          p.on(ev, () => this._control(ev));
        }
        p.on("seek", (offset) => this._seek("relative", Number(offset) / 1e6));
        p.on("position", (e) => this._seek("absolute", Number(e && e.position) / 1e6));
        p.on("volume", (v) => this._setVolume(Number(v)));
        p.on("shuffle", (b) => this._settings({ shuffle: !!b }));
        p.on("loopStatus", (s) => this._settings({ loop: s === "Track" ? "loop_one" : s === "Playlist" ? "loop" : "disabled" }));
        p.on("quit", () => {
        });
        p.on("raise", () => {
        });
        if (p._bus && typeof p._bus.on === "function") {
          p._bus.on("error", (e) => this.log("warn", "mpris bus: " + (e && e.message)));
        }
        this.update();
        return true;
      }
      disable() {
        if (!this.player) return;
        const p = this.player;
        this.player = null;
        try {
          if (p._bus && typeof p._bus.disconnect === "function") p._bus.disconnect();
        } catch (e) {
          this.log("warn", "mpris disable: " + e.message);
        }
      }
      setZone(zoneId) {
        this.zoneId = zoneId || null;
        this._lastTrackId = "";
        this._resyncSeeks = 3;
        this.update();
      }
      position() {
        if (!this._seekAt) return this._seekBase;
        const extra = this._playing ? (Date.now() - this._seekAt) / 1e3 : 0;
        return this._seekBase + extra;
      }
      // Clients like Quickshell only re-read Position on track/status changes and
      // Seeked, then extrapolate. Right after a track change Roon's zone still
      // carries the old track's seek position, so a client can anchor on that and
      // run past the end of the new track. Send Seeked on the first reports after
      // every track change so they re-anchor on the real position.
      onSeek(zoneId, position) {
        if (zoneId !== this.zoneId) return;
        const drift = Math.abs(this.position() - position);
        this._seekBase = Number(position) || 0;
        this._seekAt = Date.now();
        if (!this.player) return;
        if (drift > 2 || this._resyncSeeks > 0) {
          if (this._resyncSeeks > 0) this._resyncSeeks--;
          this.player.seeked(Math.round(this._seekBase * 1e6));
        }
      }
      update() {
        const p = this.player;
        if (!p) return;
        const raw = this.zoneId ? this.bridge.zones.get(this.zoneId) : null;
        if (!raw) {
          this._playing = false;
          p.playbackStatus = "Stopped";
          p.metadata = {};
          p.canGoNext = false;
          p.canGoPrevious = false;
          p.canPlay = false;
          p.canPause = false;
          p.canSeek = false;
          return;
        }
        const z = this.bridge.normalizeZone(raw);
        const np = z.nowPlaying;
        const playing = z.state === "playing" || z.state === "loading";
        if (playing !== this._playing) {
          this._seekBase = this.position();
          this._seekAt = Date.now();
          this._playing = playing;
        }
        let jumped = false;
        if (np && np.position != null) {
          const next = np.length > 0 && np.position > np.length ? 0 : np.position;
          jumped = this._seekAt > 0 && Math.abs(this.position() - next) > 2;
          this._seekBase = next;
          this._seekAt = Date.now();
        }
        p.playbackStatus = z.state === "playing" || z.state === "loading" ? "Playing" : z.state === "paused" ? "Paused" : "Stopped";
        p.canGoNext = z.isNextAllowed;
        p.canGoPrevious = z.isPreviousAllowed;
        p.canPlay = z.isPlayAllowed;
        p.canPause = z.isPauseAllowed;
        p.canSeek = z.isSeekAllowed;
        p.shuffle = z.settings.shuffle;
        p.loopStatus = z.settings.loop === "loop_one" ? "Track" : z.settings.loop === "loop" ? "Playlist" : "None";
        const out = z.outputs.find((o) => o.volume && o.volume.type !== "incremental");
        if (out) {
          const v = out.volume;
          const range = v.max - v.min || 1;
          p.volume = v.isMuted ? 0 : Math.max(0, Math.min(1, (v.value - v.min) / range));
        }
        if (np) {
          const trackId = crypto.createHash("sha1").update(`${z.zoneId}|${np.imageKey}|${np.title}|${np.artist}`).digest("hex").slice(0, 16);
          const meta = {
            "mpris:trackid": p.objectPath("track/" + trackId),
            "mpris:length": Math.round((np.length || 0) * 1e6),
            "xesam:title": np.title,
            "xesam:album": np.album,
            "xesam:artist": np.artist ? np.artist.split(" / ") : []
          };
          const art = this.bridge.artUrl(np.imageKey, 600);
          if (art) meta["mpris:artUrl"] = art;
          const lyrics = this.lyrics ? this.lyrics.current(z.zoneId, raw) : null;
          const url = lyrics ? this.lyrics.trackUrl(lyrics, np) : "";
          if (url) {
            meta["xesam:url"] = url;
            meta["xesam:asText"] = this.lyrics.plainText(lyrics);
          }
          if (trackId !== this._lastTrackId) {
            this._lastTrackId = trackId;
            this._resyncSeeks = 3;
          }
          p.metadata = meta;
          if (jumped) p.seeked(Math.round(this._seekBase * 1e6));
        } else {
          p.metadata = {};
        }
      }
      _control(ev) {
        if (!this.zoneId) return;
        const map = { play: "play", pause: "pause", playpause: "playpause", stop: "stop", next: "next", previous: "previous" };
        this.bridge.control(this.zoneId, map[ev]).catch((e) => this.log("warn", "mpris control: " + e.message));
      }
      _seek(how, seconds) {
        if (!this.zoneId || !Number.isFinite(seconds)) return;
        this.bridge.seek(this.zoneId, how, seconds).catch((e) => this.log("warn", "mpris seek: " + e.message));
      }
      _settings(patch) {
        if (!this.zoneId) return;
        this.bridge.settings(this.zoneId, patch).catch((e) => this.log("warn", "mpris settings: " + e.message));
      }
      _setVolume(v) {
        if (!this.zoneId || !Number.isFinite(v)) return;
        const raw = this.bridge.zones.get(this.zoneId);
        if (!raw) return;
        const out = (raw.outputs || []).find((o) => o.volume && o.volume.type !== "incremental");
        if (!out) return;
        const vol = out.volume;
        const value = vol.min + Math.max(0, Math.min(1, v)) * (vol.max - vol.min);
        const rounded = vol.step ? Math.round(value / vol.step) * vol.step : Math.round(value);
        this.bridge.volume(out.output_id, "absolute", rounded).catch((e) => this.log("warn", "mpris volume: " + e.message));
      }
    };
    module2.exports = { MprisBridge: MprisBridge2 };
  }
});

// src/lyrics.js
var require_lyrics = __commonJS({
  "src/lyrics.js"(exports2, module2) {
    "use strict";
    var fs2 = require("node:fs");
    var os2 = require("node:os");
    var path2 = require("node:path");
    var crypto = require("node:crypto");
    var EventEmitter = require("node:events");
    var RoonApi = require_lib();
    var RoonApiTransport = require_lib2();
    var RoonApiImage = require_lib4();
    var DISPLAY_EXTENSION_ID = "com.roonlabs.display_zone";
    var DISPLAY_SERVICE = "com.roonlabs.zonedisplay:1";
    var RECONNECT_MS = 5e3;
    var SIDECAR_KEEP = 200;
    function trackSignature(rawZone) {
      const np = rawZone && rawZone.now_playing;
      if (!np) return "";
      const three = np.three_line || {};
      const one = np.one_line || {};
      return [np.image_key || "", three.line1 || one.line1 || "", three.line2 || ""].join("|");
    }
    __name(trackSignature, "trackSignature");
    var RoonDisplay2 = class extends EventEmitter {
      static {
        __name(this, "RoonDisplay");
      }
      constructor({ stateDir, log }) {
        super();
        this.log = log || (() => {
        });
        this.stateFile = path2.join(stateDir, "display-state.json");
        this.display = {
          display_key: loadDisplayKey(stateDir),
          auto_name: "DankMaterialShell on " + os2.hostname(),
          active_zone_id: null
        };
        this.host = "";
        this.port = 0;
        this.moo = null;
        this.tracks = /* @__PURE__ */ new Map();
        this._timer = null;
        this._stopped = true;
        this.roon = new RoonApi({
          extension_id: DISPLAY_EXTENSION_ID,
          display_name: "Roon API Display Zone",
          display_version: "1.0.0",
          publisher: "Roon Labs, LLC",
          email: "contact@roonlabs.com",
          log_level: "none",
          get_persisted_state: /* @__PURE__ */ __name(() => this._loadState(), "get_persisted_state"),
          set_persisted_state: /* @__PURE__ */ __name((st) => this._saveState(st), "set_persisted_state"),
          core_paired: /* @__PURE__ */ __name((core) => this._onPaired(core), "core_paired"),
          core_unpaired: /* @__PURE__ */ __name(() => this.emit("cleared"), "core_unpaired")
        });
        const matches = /* @__PURE__ */ __name((req) => req.body && req.body.display_key === this.display.display_key, "matches");
        this.svc = this.roon.register_service(DISPLAY_SERVICE, {
          subscriptions: [
            {
              subscribe_name: "subscribe_displays",
              unsubscribe_name: "unsubscribe_displays",
              start: /* @__PURE__ */ __name((req) => req.send_continue("Subscribed", { displays: [this.display] }), "start")
            }
          ],
          methods: {
            get_displays: /* @__PURE__ */ __name((req) => req.send_complete("Success", { displays: [this.display] }), "get_displays"),
            activate: /* @__PURE__ */ __name((req) => {
              if (!matches(req)) return req.send_complete("InvalidKey");
              this._setActive(req.body.zone_id || null);
              req.send_complete("Success");
            }, "activate"),
            deactivate: /* @__PURE__ */ __name((req) => {
              if (!matches(req)) return req.send_complete("InvalidKey");
              this._setActive(null);
              req.send_complete("Success");
            }, "deactivate"),
            update_settings: /* @__PURE__ */ __name((req) => req.send_complete(matches(req) ? "Success" : "InvalidKey"), "update_settings")
          }
        });
        this.roon.init_services({
          required_services: [RoonApiTransport, RoonApiImage],
          provided_services: [{ services: [this.svc] }]
        });
      }
      // Connect to the core the main connection is paired with.
      start(host, port) {
        if (!host || !port) return;
        if (!this._stopped && host === this.host && Number(port) === this.port) return;
        this.stop();
        this._stopped = false;
        this.host = host;
        this.port = Number(port);
        this._connect();
      }
      stop() {
        this._stopped = true;
        if (this._timer) clearTimeout(this._timer);
        this._timer = null;
        if (this.moo) {
          const moo = this.moo;
          this.moo = null;
          try {
            moo.transport.close();
          } catch {
          }
        }
      }
      // Show the zone selected in DMS, so the display in Roon's list matches the bar.
      follow(zoneId) {
        if ((zoneId || null) === this.display.active_zone_id) return;
        this.display.active_zone_id = zoneId || null;
        this._announce();
      }
      _connect() {
        if (this._stopped || this.moo) return;
        this.moo = this.roon.ws_connect({
          host: this.host,
          port: this.port,
          onclose: /* @__PURE__ */ __name(() => {
            this.moo = null;
            this.emit("cleared");
            if (this._stopped) return;
            this._timer = setTimeout(() => {
              this._timer = null;
              this._connect();
            }, RECONNECT_MS);
          }, "onclose"),
          onerror: /* @__PURE__ */ __name(() => {
          }, "onerror")
        });
      }
      _onPaired(core) {
        this.tracks.clear();
        core.services.RoonApiTransport.subscribe_zones((resp, body) => {
          if (!body) return;
          if (resp === "Subscribed" || resp === "Changed") {
            for (const z of [...body.zones || [], ...body.zones_added || [], ...body.zones_changed || []]) {
              const track = trackSignature(z);
              if (this.tracks.get(z.zone_id) === track) continue;
              this.tracks.set(z.zone_id, track);
              if (resp === "Changed") {
                this.emit("lyrics", { zoneId: z.zone_id, key: null, lrc: "", track });
                this.emit("waveform", { zoneId: z.zone_id, waveform: null });
              }
            }
            for (const id of body.zones_removed || []) {
              this.tracks.delete(id);
              this.emit("lyrics", { zoneId: id, key: null, lrc: "", track: "" });
              this.emit("waveform", { zoneId: id, waveform: null });
            }
            return;
          }
          if (resp === "WaveformChanged") {
            const wf = Array.isArray(body.waveform) && body.waveform.some((v) => v > 0) ? body.waveform.map((v) => Math.round(Number(v) * 1e3) / 1e3) : null;
            this.emit("waveform", { zoneId: body.zone_id, waveform: wf });
            return;
          }
          if (resp !== "LyricsChanged") return;
          this.emit("lyrics", {
            zoneId: body.zone_id,
            key: body.key == null ? null : String(body.key),
            lrc: body.lrc || "",
            track: this.tracks.get(body.zone_id) || ""
          });
        });
      }
      _setActive(zoneId) {
        this.display.active_zone_id = zoneId;
        this._announce();
      }
      _announce() {
        try {
          this.svc.send_continue_all("subscribe_displays", "Changed", { displays_changed: [this.display] });
        } catch (e) {
          this.log("warn", "display: " + e.message);
        }
      }
      _loadState() {
        try {
          return JSON.parse(fs2.readFileSync(this.stateFile, "utf8")) || {};
        } catch {
          return {};
        }
      }
      _saveState(st) {
        try {
          fs2.writeFileSync(this.stateFile + ".tmp", JSON.stringify(st, null, 2));
          fs2.renameSync(this.stateFile + ".tmp", this.stateFile);
        } catch (e) {
          this.log("warn", "display state: " + e.message);
        }
      }
    };
    function loadDisplayKey(stateDir) {
      const file = path2.join(stateDir, "display-key");
      try {
        const key2 = fs2.readFileSync(file, "utf8").trim();
        if (key2) return key2;
      } catch {
      }
      const key = crypto.randomUUID();
      try {
        fs2.writeFileSync(file, key);
      } catch {
      }
      return key;
    }
    __name(loadDisplayKey, "loadDisplayKey");
    function segment(text, fallback) {
      let s = String(text || "").replace(/[\/\0]/g, "\u2215").replace(/[\r\n\t]+/g, " ").trim().replace(/^\.+/, "");
      if (!s) s = fallback;
      while (Buffer.byteLength(s) > 180) s = s.slice(0, -1);
      return s;
    }
    __name(segment, "segment");
    var LyricsStore2 = class {
      static {
        __name(this, "LyricsStore");
      }
      constructor(cacheDir, log) {
        this.dir = path2.join(cacheDir, "lyrics");
        this.log = log || (() => {
        });
        this.byZone = /* @__PURE__ */ new Map();
      }
      // Returns true when the zone's lyrics actually changed.
      set(zoneId, key, lrc, track) {
        const text = typeof lrc === "string" && lrc.trim() ? lrc : "";
        const prev = this.byZone.get(zoneId);
        if (prev && prev.key === (key || null) && prev.lrc === text && prev.track === (track || "")) return false;
        if (!prev && !text) return false;
        if (text) this.byZone.set(zoneId, { key: key || null, lrc: text, track: track || "" });
        else this.byZone.delete(zoneId);
        return true;
      }
      get(zoneId) {
        return this.byZone.get(zoneId) || null;
      }
      zones() {
        return Array.from(this.byZone.keys());
      }
      // Lyrics for the zone, but only while it still plays the track they came with.
      current(zoneId, rawZone) {
        const entry = this.byZone.get(zoneId);
        if (!entry || entry.track !== trackSignature(rawZone)) return null;
        return entry;
      }
      // file:// URL whose .lrc sibling holds these lyrics, or "" if writing failed.
      trackUrl(entry, np) {
        if (!entry || !np) return "";
        const artist = String(np.artist || "").split(" / ").join(", ");
        const name = segment(artist ? `${artist} - ${np.title}` : np.title, "Unknown Track");
        const base = path2.join(this.dir, segment(np.album, "Unknown Album"), name);
        const lrcPath = base + ".lrc";
        try {
          let existing = null;
          try {
            existing = fs2.readFileSync(lrcPath, "utf8");
          } catch {
          }
          if (existing !== entry.lrc) {
            fs2.mkdirSync(path2.dirname(lrcPath), { recursive: true });
            fs2.writeFileSync(lrcPath + ".tmp", entry.lrc);
            fs2.renameSync(lrcPath + ".tmp", lrcPath);
            this._prune();
          }
        } catch (e) {
          this.log("warn", "lyrics: " + e.message);
          return "";
        }
        return "file://" + base.split(path2.sep).map(encodeURIComponent).join("/") + ".roon";
      }
      // Plain text for xesam:asText, timestamps stripped.
      plainText(entry) {
        if (!entry) return "";
        return entry.lrc.split("\n").filter((l) => !/^\[[a-z]+:.*\]\s*$/i.test(l.trim())).map((l) => l.replace(/\[\d+:\d+(?:[.:]\d+)?\]/g, "").replace(/<\d+:\d+(?:[.:]\d+)?>/g, "").trim()).join("\n").trim();
      }
      // Keep the newest sidecars; lyrics are cheap to get again from Roon.
      _prune() {
        try {
          const files = [];
          for (const album of fs2.readdirSync(this.dir)) {
            const albumDir = path2.join(this.dir, album);
            if (!fs2.statSync(albumDir).isDirectory()) continue;
            for (const f of fs2.readdirSync(albumDir)) {
              if (!f.endsWith(".lrc")) continue;
              const p = path2.join(albumDir, f);
              files.push({ p, t: fs2.statSync(p).mtimeMs });
            }
          }
          files.sort((a, b) => b.t - a.t);
          for (const { p } of files.slice(SIDECAR_KEEP)) {
            fs2.unlinkSync(p);
            const albumDir = path2.dirname(p);
            if (fs2.readdirSync(albumDir).length === 0) fs2.rmdirSync(albumDir);
          }
        } catch {
        }
      }
    };
    module2.exports = { RoonDisplay: RoonDisplay2, LyricsStore: LyricsStore2, trackSignature };
  }
});

// src/index.js
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var { createProtocol } = require_protocol();
var { RoonBridge } = require_roon();
var { BrowseSessions } = require_browse();
var { MprisBridge } = require_mpris();
var { RoonDisplay, LyricsStore } = require_lyrics();
var VERSION = "0.2.0";
function usage() {
  return [
    "roon-bridge: Roon sidecar for the DankMaterialShell Roon plugin",
    "",
    "  --state-dir <dir>      where roon-state.json (pairing token) and bridge.pid live",
    "  --cache-dir <dir>      where lyric sidecars go (default $XDG_CACHE_HOME/DankMaterialShell/plugins/roon)",
    "  --display-zone         host a Roon display so the core sends lyrics",
    "  --extension-id <id>    Roon extension id (default codes.noa.dms-roon)",
    "  --host <host>          connect directly instead of SOOD discovery",
    "  --port <port>          websocket port for --host (default 9330)",
    "  --linger <seconds>     keep running this long after stdin closes (dev)",
    "  --version | --help",
    "",
    "Speaks newline-delimited JSON on stdin/stdout."
  ].join("\n");
}
__name(usage, "usage");
function parseArgs(argv) {
  const out = {
    stateDir: "",
    cacheDir: "",
    displayZone: false,
    extensionId: "codes.noa.dms-roon",
    displayName: "DMS Roon",
    displayVersion: VERSION,
    publisher: "Noa Himesaka",
    email: "himesaka@noa.codes",
    website: "https://github.com/NoaHimesaka1873/dms-plugin-roon",
    mode: "discovery",
    host: "",
    port: 9330,
    linger: 0
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = /* @__PURE__ */ __name(() => argv[++i], "next");
    switch (a) {
      case "--state-dir":
        out.stateDir = next();
        break;
      case "--cache-dir":
        out.cacheDir = next();
        break;
      case "--display-zone":
        out.displayZone = true;
        break;
      case "--extension-id":
        out.extensionId = next();
        break;
      case "--host":
        out.host = next();
        out.mode = "manual";
        break;
      case "--port":
        out.port = Number(next()) || 9330;
        break;
      case "--mode":
        out.mode = next();
        break;
      case "--linger":
        out.linger = Number(next()) || 0;
        break;
      case "--version":
        console.log(VERSION);
        process.exit(0);
        break;
      case "--help":
      case "-h":
        console.log(usage());
        process.exit(0);
        break;
      default:
        console.error("unknown argument: " + a);
        console.error(usage());
        process.exit(2);
    }
  }
  if (!out.stateDir) {
    const base = process.env.XDG_STATE_HOME || path.join(os.homedir(), ".local", "state");
    out.stateDir = path.join(base, "DankMaterialShell", "plugins", "roon");
  }
  if (!out.cacheDir) {
    const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");
    out.cacheDir = path.join(base, "DankMaterialShell", "plugins", "roon");
  }
  return out;
}
__name(parseArgs, "parseArgs");
function otherBridgeRunning(pidFile) {
  let pid;
  try {
    pid = Number(fs.readFileSync(pidFile, "utf8").trim());
  } catch {
    return 0;
  }
  if (!pid || pid === process.pid) return 0;
  try {
    process.kill(pid, 0);
  } catch {
    return 0;
  }
  try {
    const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8");
    if (!cmd.includes("roon-bridge") && !cmd.includes("bridge/src/index.js")) return 0;
  } catch {
  }
  return pid;
}
__name(otherBridgeRunning, "otherBridgeRunning");
function main() {
  const opts = parseArgs(process.argv.slice(2));
  fs.mkdirSync(opts.stateDir, { recursive: true });
  const pidFile = path.join(opts.stateDir, "bridge.pid");
  let shuttingDown = false;
  const proto = createProtocol({ onMessage: handle, onEnd: onStdinEnd });
  const log = /* @__PURE__ */ __name((level, message) => proto.log(level, message), "log");
  const other = otherBridgeRunning(pidFile);
  if (other) {
    proto.send({ type: "hello", version: VERSION, pid: process.pid, mprisAvailable: false });
    proto.send({ type: "status", state: "disconnected", coreName: "", coreId: "", host: "", httpPort: 0, message: `another bridge is running (pid ${other})` });
    process.exit(3);
  }
  fs.writeFileSync(pidFile, String(process.pid));
  const bridge = new RoonBridge({ ...opts, log });
  const browse = new BrowseSessions(bridge);
  const lyrics = new LyricsStore(opts.cacheDir, log);
  const mpris = new MprisBridge(bridge, log, lyrics);
  const display = opts.displayZone ? new RoonDisplay({ stateDir: opts.stateDir, log }) : null;
  let mprisWanted = false;
  let queueWanted = false;
  let queueMax = 50;
  proto.send({ type: "hello", version: VERSION, pid: process.pid, mprisAvailable: mpris.available });
  bridge.on("status", (s) => proto.send({ type: "status", ...s }));
  bridge.on("zones", (zones) => {
    proto.send({ type: "zones", zones });
    mpris.update();
  });
  bridge.on("zone_changed", (zone) => {
    proto.send({ type: "zone_changed", zone });
    if (zone.zoneId === bridge.selectedZoneId) mpris.update();
  });
  bridge.on("seek", (s) => {
    proto.send({ type: "seek", ...s });
    mpris.onSeek(s.zoneId, s.position);
  });
  bridge.on("queue", (q) => proto.send({ type: "queue", ...q }));
  const onLyrics = /* @__PURE__ */ __name((l) => {
    if (!lyrics.set(l.zoneId, l.key, l.lrc, l.track)) return;
    const entry = lyrics.get(l.zoneId);
    proto.send({ type: "lyrics", zoneId: l.zoneId, lrc: entry ? entry.lrc : "" });
    if (l.zoneId === bridge.selectedZoneId) mpris.update();
  }, "onLyrics");
  const waveforms = /* @__PURE__ */ new Map();
  const unsynced = /* @__PURE__ */ new Set();
  const onUnsynced = /* @__PURE__ */ __name((l) => {
    const has = !!l.key && !(l.lrc && l.lrc.trim());
    if (has === unsynced.has(l.zoneId)) return;
    if (has) unsynced.add(l.zoneId);
    else unsynced.delete(l.zoneId);
    proto.send({ type: "lyrics_unsynced", zoneId: l.zoneId, value: has });
  }, "onUnsynced");
  const clearLyrics = /* @__PURE__ */ __name(() => {
    for (const zoneId of lyrics.zones()) onLyrics({ zoneId, key: null, lrc: "", track: "" });
    for (const zoneId of waveforms.keys()) proto.send({ type: "waveform", zoneId, waveform: [] });
    waveforms.clear();
    for (const zoneId of unsynced) proto.send({ type: "lyrics_unsynced", zoneId, value: false });
    unsynced.clear();
  }, "clearLyrics");
  if (display) {
    display.on("waveform", (w) => {
      const key = w.waveform ? w.waveform.join(",") : "";
      if ((waveforms.get(w.zoneId) || "") === key) return;
      if (key) waveforms.set(w.zoneId, key);
      else waveforms.delete(w.zoneId);
      proto.send({ type: "waveform", zoneId: w.zoneId, waveform: w.waveform || [] });
    });
    display.on("lyrics", (l) => {
      onLyrics(l);
      onUnsynced(l);
    });
    display.on("cleared", clearLyrics);
    bridge.on("selected", (zoneId) => display.follow(zoneId));
  }
  bridge.on("paired", () => {
    if (display) {
      display.follow(bridge.selectedZoneId);
      display.start(bridge.status.host, bridge.status.httpPort);
    }
    if (mprisWanted && bridge.selectedZoneId) {
      mpris.enable();
      proto.send({ type: "mpris", active: mpris.active, busName: "org.mpris.MediaPlayer2.roon" });
    }
    if (queueWanted && bridge.selectedZoneId) bridge.subscribeQueue(bridge.selectedZoneId, queueMax);
  });
  bridge.on("unpaired", () => {
    browse.sessions.clear();
    if (display) display.stop();
    clearLyrics();
    if (mpris.active) {
      mpris.disable();
      proto.send({ type: "mpris", active: false, busName: "org.mpris.MediaPlayer2.roon" });
    }
  });
  const handlers = {
    ping: /* @__PURE__ */ __name(() => ({ pong: Date.now() }), "ping"),
    select_zone: /* @__PURE__ */ __name((m) => {
      bridge.selectZone(m.zoneId || null);
      mpris.setZone(bridge.selectedZoneId);
      if (mprisWanted && bridge.selectedZoneId && bridge.transport && !mpris.active) {
        mpris.enable();
        proto.send({ type: "mpris", active: mpris.active, busName: "org.mpris.MediaPlayer2.roon" });
      }
      if (queueWanted && bridge.selectedZoneId && bridge.transport && bridge.queueZoneId !== bridge.selectedZoneId) {
        bridge.subscribeQueue(bridge.selectedZoneId, queueMax);
      }
      return { selectedZoneId: bridge.selectedZoneId };
    }, "select_zone"),
    control: /* @__PURE__ */ __name((m) => bridge.control(m.zoneId || bridge.selectedZoneId, m.action), "control"),
    seek: /* @__PURE__ */ __name((m) => bridge.seek(m.zoneId || bridge.selectedZoneId, m.how, m.seconds), "seek"),
    volume: /* @__PURE__ */ __name((m) => bridge.volume(m.outputId, m.how, m.value), "volume"),
    mute: /* @__PURE__ */ __name((m) => bridge.mute(m.outputId, m.how || "toggle"), "mute"),
    settings: /* @__PURE__ */ __name((m) => bridge.settings(m.zoneId || bridge.selectedZoneId, m), "settings"),
    transfer: /* @__PURE__ */ __name((m) => bridge.transfer(m.fromZoneId || bridge.selectedZoneId, m.toZoneId), "transfer"),
    group: /* @__PURE__ */ __name((m) => bridge.group(m.outputIds), "group"),
    ungroup: /* @__PURE__ */ __name((m) => bridge.ungroup(m.outputIds), "ungroup"),
    queue_subscribe: /* @__PURE__ */ __name((m) => {
      queueWanted = true;
      queueMax = Number(m.max) || 50;
      bridge.subscribeQueue(m.zoneId || bridge.selectedZoneId, queueMax);
      return { zoneId: bridge.queueZoneId };
    }, "queue_subscribe"),
    queue_unsubscribe: /* @__PURE__ */ __name(() => {
      queueWanted = false;
      bridge.stopQueue();
    }, "queue_unsubscribe"),
    play_from_here: /* @__PURE__ */ __name((m) => bridge.playFromHere(m.zoneId || bridge.selectedZoneId, m.queueItemId), "play_from_here"),
    browse: /* @__PURE__ */ __name((m) => browse.browse(m.session || "popout", m), "browse"),
    load: /* @__PURE__ */ __name((m) => browse.load(m.session || "popout", m), "load"),
    reset_session: /* @__PURE__ */ __name((m) => browse.reset(m.session || "popout"), "reset_session"),
    search: /* @__PURE__ */ __name((m) => browse.search(String(m.query || ""), { category: m.category || "", limit: Number(m.limit) || 10, zoneId: m.zoneId, key: m.session || "launcher" }), "search"),
    play_item: /* @__PURE__ */ __name((m) => {
      const zoneId = m.zoneId || bridge.selectedZoneId;
      if (m.ref) return browse.playRef(m.ref, m.mode || "play_now", zoneId);
      return browse.playItem(m.session || "popout", m.itemKey, m.mode || "play_now", zoneId);
    }, "play_item"),
    open_item: /* @__PURE__ */ __name((m) => browse.openRef(m.ref, { zoneId: m.zoneId || bridge.selectedZoneId, key: m.session || "popout" }), "open_item"),
    mpris: /* @__PURE__ */ __name((m) => {
      mprisWanted = !!m.enabled;
      if (mprisWanted && bridge.selectedZoneId && bridge.transport) mpris.enable();
      else if (!mprisWanted) mpris.disable();
      proto.send({ type: "mpris", active: mpris.active, busName: "org.mpris.MediaPlayer2.roon" });
      return { active: mpris.active, available: mpris.available };
    }, "mpris"),
    set_connection: /* @__PURE__ */ __name((m) => ({ restarted: bridge.setConnection({ mode: m.mode, host: m.host, port: m.port }) }), "set_connection"),
    forget_core: /* @__PURE__ */ __name(() => {
      bridge.forgetCore();
    }, "forget_core"),
    status: /* @__PURE__ */ __name(() => ({ ...bridge.status, selectedZoneId: bridge.selectedZoneId, mpris: mpris.active }), "status"),
    zones: /* @__PURE__ */ __name(() => ({ zones: bridge.normalizedZones() }), "zones"),
    lyrics: /* @__PURE__ */ __name((m) => {
      const zoneId = m.zoneId || bridge.selectedZoneId;
      const entry = lyrics.current(zoneId, bridge.zones.get(zoneId));
      return { lrc: entry ? entry.lrc : "", displayZone: opts.displayZone };
    }, "lyrics"),
    shutdown: /* @__PURE__ */ __name(() => {
      shutdown(0);
    }, "shutdown")
  };
  function handle(msg) {
    const fn = handlers[msg.type];
    if (!fn) {
      if (msg.id != null) proto.fail(msg.id, `unknown message type: ${msg.type}`, "unknown_type");
      else proto.send({ type: "error", code: "unknown_type", message: `unknown message type: ${msg.type}` });
      return;
    }
    let result;
    try {
      result = fn(msg);
    } catch (e) {
      if (msg.id != null) proto.fail(msg.id, e);
      else proto.send({ type: "error", code: "handler", message: e.message, request: msg.type });
      return;
    }
    Promise.resolve(result).then(
      (data) => {
        if (msg.id != null) proto.reply(msg.id, data);
      },
      (e) => {
        if (msg.id != null) proto.fail(msg.id, e);
        else proto.send({ type: "error", code: "handler", message: e && e.message ? e.message : String(e), request: msg.type });
      }
    );
  }
  __name(handle, "handle");
  function onStdinEnd() {
    if (opts.linger > 0) setTimeout(() => shutdown(0), opts.linger * 1e3);
    else shutdown(0);
  }
  __name(onStdinEnd, "onStdinEnd");
  function shutdown(code) {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      mpris.disable();
      if (display) display.stop();
      bridge.stop();
    } catch {
    }
    try {
      if (fs.readFileSync(pidFile, "utf8").trim() === String(process.pid)) fs.unlinkSync(pidFile);
    } catch {
    }
    setTimeout(() => process.exit(code), 150).unref();
  }
  __name(shutdown, "shutdown");
  process.on("SIGTERM", () => shutdown(0));
  process.on("SIGINT", () => shutdown(0));
  process.on("SIGHUP", () => shutdown(0));
  process.on("uncaughtException", (e) => {
    proto.send({ type: "error", code: "uncaught", message: e && e.stack ? e.stack : String(e) });
  });
  process.on("unhandledRejection", (e) => {
    proto.send({ type: "error", code: "unhandled", message: e && e.stack ? e.stack : String(e) });
  });
  bridge.start();
}
__name(main, "main");
main();
/*! Bundled license information:

sax/lib/sax.js:
  (*! http://mths.be/fromcodepoint v0.1.0 by @mathias *)

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
