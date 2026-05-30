import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SECRET_PATTERNS = [
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /password\s*=/i,
  /secret\s*=/i,
  /api_key\s*=/i,
  /BEGIN PRIVATE KEY/i,
  /access_token/i,
  /C:\\Users\\/i,
  /\/Users\/[^/\s]+/i,
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceRoot = path.resolve(args.source ?? "");
  const sourceRepo = args.repo;
  const sourceSha = args.sha;

  if (!args.source || !sourceRepo || !sourceSha) {
    fail("Usage: node scripts/import-dev-env.js --source ./source-repo --repo owner/name --sha <commit>");
  }

  const sourceDevEnv = path.join(sourceRoot, "dev_env");
  if (!(await exists(path.join(sourceDevEnv, "index.md")))) {
    fail(`Cannot find dev_env/index.md in source repo: ${sourceRoot}`);
  }

  const targetRoot = path.join("src", "content", "dev_env");
  await fs.rm(targetRoot, { recursive: true, force: true });
  await fs.mkdir(targetRoot, { recursive: true });

  const files = (await listFiles(sourceDevEnv)).filter((file) => /\.md$/i.test(file));
  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    assertNoSecrets(raw, path.relative(sourceRoot, file));

    const relative = path.relative(sourceDevEnv, file);
    const target = path.join(targetRoot, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, raw, "utf8");
  }

  await fs.writeFile(
    path.join(targetRoot, "_source.json"),
    `${JSON.stringify({ source_repo: sourceRepo, source_commit: sourceSha }, null, 2)}\n`,
    "utf8",
  );

  console.log(`Imported ${files.length} dev environment file(s) from ${sourceRepo}.`);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    args[item.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

async function listFiles(root) {
  if (!(await exists(root))) return [];
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(root, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  }));
  return files.flat();
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function assertNoSecrets(text, label) {
  const found = SECRET_PATTERNS.find((pattern) => pattern.test(text));
  if (found) fail(`Publishing blocked: possible secret detected in ${label}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
