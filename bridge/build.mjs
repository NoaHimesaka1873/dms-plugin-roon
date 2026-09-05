import { build } from "esbuild";

await build({
  entryPoints: ["src/index.js"],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: "../dist/roon-bridge.cjs",
  // ws (bufferutil, utf-8-validate) and dbus-next (x11, abstract-socket) require these
  // optional native/desktop addons inside try/catch; keep them external.
  external: ["bufferutil", "utf-8-validate", "x11", "abstract-socket"],
  // node-roon-api keys core.services by constructor .name (RoonApiTransport etc.).
  keepNames: true,
  logLevel: "info",
});
