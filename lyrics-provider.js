#!/usr/bin/env node
"use strict";

// DMS lyrics provider "Roon" (see the DMS 1.7 plugin docs, Lyrics Providers).
// DMS runs this per lookup with the track as JSON on stdin. The Roon bridge
// writes Roon's lyrics for every zone to .lrc files and keeps state.json next
// to them with what each zone plays and whether Roon has lyrics for it.
//
// Roon only knows lyrics for what it is playing right now, so:
//   - a zone plays this track and has lyrics  -> print them (LRC)
//   - it plays it and Roon has none/unsynced  -> miss (exit 0, DMS caches it)
//   - it plays it but lyrics are still coming -> wait up to WAIT_MS
//   - nothing plays it (after waiting, since the lookup can beat the bridge's
//     news of a track change by a few ms), or the bridge is down
//                                             -> error (exit 1, not cached),
//     so a lookup for another player's track never caches a miss for Roon.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const WAIT_MS = 3000;
const POLL_MS = 150;
const DURATION_TOLERANCE = 3;

const cacheHome = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");
const stateFile = path.join(cacheHome, "DankMaterialShell", "plugins", "roon", "lyrics", "state.json");

const norm = (s) => String(s || "").normalize("NFKC").toLowerCase().trim();
// Roon joins credits with " / ", DMS and MPRIS clients with ", " or "&".
const artists = (s) =>
  String(s || "")
    .split(/\s*(?:\/|,|&|\bfeat\.?|\bft\.?)\s*/i)
    .map(norm)
    .filter(Boolean);

function matches(track, zone) {
  if (norm(zone.title) !== norm(track.title)) return false;
  const want = artists(track.artist);
  const have = artists(zone.artist);
  if (want.length && !want.some((a) => have.includes(a))) return false;
  if (track.duration && zone.length && Math.abs(zone.length - track.duration) > DURATION_TOLERANCE) return false;
  return true;
}

function readState() {
  let state;
  try {
    state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  } catch {
    return null;
  }
  try {
    process.kill(state.pid, 0);
  } catch {
    return null; // stale file from a bridge that isn't running
  }
  return state;
}

function lookup(track) {
  const state = readState();
  if (!state) return { error: "Roon bridge not running" };
  const zone = Object.values(state.zones || {}).find((z) => matches(track, z));
  if (!zone || zone.status === "pending") return null;
  if (zone.status !== "lyrics") return { miss: true };
  try {
    return { lrc: fs.readFileSync(zone.lrcPath, "utf8") };
  } catch {
    return { error: "lyrics file missing" };
  }
}

function main(input) {
  const track = JSON.parse(input);
  const deadline = Date.now() + WAIT_MS;
  const tick = () => {
    const found = lookup(track);
    if (found === null && Date.now() < deadline) return setTimeout(tick, POLL_MS);
    if (!found) {
      process.stderr.write("Roon isn't playing this track\n");
      return process.exit(1);
    }
    if (found.lrc) {
      process.stdout.write(JSON.stringify({ format: "lrc", lyrics: found.lrc }));
      return;
    }
    if (found.miss) return;
    process.stderr.write(found.error + "\n");
    process.exit(1);
  };
  tick();
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => main(input));
