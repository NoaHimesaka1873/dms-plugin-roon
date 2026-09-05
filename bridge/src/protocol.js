"use strict";

const readline = require("node:readline");

// Newline-delimited JSON over stdin/stdout. Every message has a `type`;
// requests carry an `id` and are answered with {type:"reply", id, ok, data|error}.
function createProtocol({ onMessage, onEnd }) {
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
  function reply(id, data) {
    send({ type: "reply", id, ok: true, data: data === undefined ? null : data });
  }
  function fail(id, error, code) {
    send({ type: "reply", id, ok: false, error: error && error.message ? error.message : String(error), code: code || "error" });
  }
  function log(level, message) {
    send({ type: "log", level, message });
  }
  return { send, reply, fail, log };
}

module.exports = { createProtocol };
