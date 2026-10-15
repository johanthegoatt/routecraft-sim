import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const run = (...args) => spawnSync(process.execPath, ["src/cli.js", ...args], { encoding: "utf8" });

test("--network plans on your own map, one-way streets included", () => {
  const out = run("plan", "--network", "examples/one-way-loop.json", "--start", "dock", "--end", "mill", "--intensity", "0");
  assert.equal(out.status, 0, out.stderr);
  const report = JSON.parse(out.stdout);
  assert.deepEqual(report.primary.path, ["dock", "yard", "mill"]);
  assert.equal(report.primary.distance, 14);
});

test("a broken network file is reported plainly", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "routecraft-"));
  const bad = path.join(dir, "bad.json");
  fs.writeFileSync(bad, "{ nodes: ");
  assert.match(run("network", "--network", bad).stderr, /not valid JSON/);
  assert.match(run("network", "--network", path.join(dir, "missing.json")).stderr, /Can't read network file .*ENOENT/);
  fs.writeFileSync(bad, JSON.stringify({ nodes: { a: { x: 0, y: 0 } }, edges: { a: { b: 2 } } }));
  assert.match(run("network", "--network", bad).stderr, /Edge target is missing node: b/);
});
