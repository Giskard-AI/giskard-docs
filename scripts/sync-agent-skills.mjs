import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { parseFrontmatter } from "@astrojs/markdown-remark";

const [source, ref, ...flags] = process.argv.slice(2);
if (!source || !ref || flags.some((flag) => flag !== "--check")) {
  console.error(
    "Usage: node scripts/sync-agent-skills.mjs <skills-repo> <published-commit-or-tag> [--check]",
  );
  process.exit(1);
}

const check = flags.includes("--check");
const repository = resolve(source);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "public/.well-known/agent-skills");
const git = (...args) =>
  execFileSync("git", ["-C", repository, ...args], {
    maxBuffer: 32 * 1024 * 1024,
  });
const commit = git(
  "rev-parse",
  "--verify",
  "--end-of-options",
  `${ref}^{commit}`,
)
  .toString()
  .trim();
const paths = git("ls-tree", "-r", "--name-only", "-z", commit)
  .toString()
  .split("\0")
  .filter((path) => path === "SKILL.md" || path.endsWith("/SKILL.md"))
  .sort();
if (!paths.length)
  throw new Error("No committed skills found in the source repository.");

const license = git("show", `${commit}:LICENSE`).toString();
const files = new Map();
const skills = [];
const names = new Set();

for (const path of paths) {
  const directory = posix.dirname(path);
  const { frontmatter } = parseFrontmatter(
    git("show", `${commit}:${path}`).toString(),
  );
  const { name, description } = frontmatter;
  if (
    typeof name !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ||
    name.length > 64 ||
    names.has(name)
  ) {
    throw new Error(`Invalid or duplicate skill name in ${path}`);
  }
  if (
    typeof description !== "string" ||
    !description.trim() ||
    description.length > 1024
  ) {
    throw new Error(`Invalid skill description in ${path}`);
  }
  names.add(name);

  // Archive the committed directory with SKILL.md at the root, including its
  // references, scripts, and license. Fixed timestamps make hashes repeatable.
  const tree = directory === "." ? commit : `${commit}:${directory}`;
  const archive = gzipSync(
    git(
      "archive",
      "--format=tar",
      "--mtime=1970-01-01T00:00:00Z",
      `--add-virtual-file=LICENSE:${license}`,
      tree,
    ),
    { level: 9 },
  );
  const filename = `${name}.tar.gz`;
  files.set(filename, archive);
  skills.push({
    name,
    type: "archive",
    description,
    url: `https://docs.giskard.ai/.well-known/agent-skills/${filename}`,
    digest: `sha256:${createHash("sha256").update(archive).digest("hex")}`,
  });
}

skills.sort((a, b) => a.name.localeCompare(b.name));
files.set(
  "index.json",
  Buffer.from(
    JSON.stringify(
      {
        $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
        skills,
      },
      null,
      2,
    ) + "\n",
  ),
);

if (!check) mkdirSync(output, { recursive: true });
for (const [filename, content] of files) {
  const destination = resolve(output, filename);
  if (check) {
    if (!readFileSync(destination).equals(content)) {
      throw new Error(`${filename} is stale; rerun without --check.`);
    }
  } else {
    writeFileSync(destination, content);
  }
}
console.log(
  `${check ? "Verified" : "Updated"} ${skills.length} skill archives and index from ${commit}.`,
);
