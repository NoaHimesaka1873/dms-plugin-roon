import QtQuick
import qs.Common
import qs.Services

QtObject {
    function check(done) {
        const dir = PluginService.getPluginPath("roon");
        const bundle = dir + "/dist/roon-bridge.cjs";
        Proc.runCommand("roon.depCheck", ["sh", "-c", "node --version && test -f \"" + bundle + "\""], (stdout, exitCode) => {
            if (exitCode === 0) {
                done(null);
                return;
            }
            done({
                title: "Roon plugin needs Node.js and its bridge bundle",
                details: "The plugin runs a small Node.js sidecar to talk to Roon Server.\n\n" +
                    "1. Install Node.js 20 or newer (`node` must be on PATH).\n" +
                    "2. Make sure " + bundle + " exists. If you cloned the repo without it, run `npm install --allow-git=all && npm run build` inside the plugin's bridge/ directory.\n\n" +
                    "Then re-enable the plugin."
            });
        });
    }
}
