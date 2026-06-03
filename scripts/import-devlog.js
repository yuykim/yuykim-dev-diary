import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import matter from "gray-matter";
import YAML from "yaml";

const DEFAULT_BASE_PATH = "/yuykim-dev-diary";
const BLOG_BASE_PATH = normalizeBasePath(process.env.DEVLOG_BASE_PATH ?? DEFAULT_BASE_PATH);

const SECRET_PATTERNS = [
  /\b(?:OPENAI_API_KEY|GITHUB_TOKEN)\b\s*[:=]\s*\S+/i,
  /\b(?:password|secret|api_key|access_token)\b\s*[:=]\s*\S+/i,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/i,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /BEGIN PRIVATE KEY/i,
];

const BLOCKED_ASSET_PATTERNS = [
  /^\.env$/i,
  /\.key$/i,
  /\.pem$/i,
  /\.sqlite$/i,
  /\.db$/i,
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceRoot = path.resolve(args.source ?? "");
  const sourceRepo = args.repo;
  const sourceSha = args.sha;

  if (!args.source || !sourceRepo || !sourceSha) {
    fail("Usage: node scripts/import-devlog.js --source ./source-repo --repo owner/name --sha <commit>");
  }

  const configPath = path.join(sourceRoot, ".devlog.yml");
  if (!(await exists(configPath))) {
    fail(`Cannot find .devlog.yml in source repo: ${sourceRoot}`);
  }

  const config = YAML.parse(await fs.readFile(configPath, "utf8"));

  if (config.enabled !== true) {
    console.log(`Devlog import skipped: ${sourceRepo} is not enabled.`);
    return;
  }

  const project = config.project ?? {};
  const projectSlug = project.slug;
  if (!project.name || !projectSlug) {
    fail(".devlog.yml must define project.name and project.slug");
  }

  const diaryPath = config.diary?.path ?? "dev_diary";
  const assetsPath = config.diary?.assets_path ?? path.join(diaryPath, "assets");
  const diaryRoot = path.join(sourceRoot, diaryPath);
  const assetsRoot = path.join(sourceRoot, assetsPath);

  await upsertProject(project);
  await createProjectIntro({ project, sourceRepo, sourceSha });

  const markdownFiles = (await listFiles(diaryRoot))
    .filter((file) => /\.(md|mdx)$/i.test(file))
    .filter((file) => !isWithin(file, assetsRoot));

  let importedCount = 0;
  let skippedCount = 0;

  for (const file of markdownFiles) {
    const raw = await fs.readFile(file, "utf8");
    assertNoSecrets(raw, path.relative(sourceRoot, file));

    const parsed = matter(raw);
    const visibility = parsed.data.visibility ?? config.privacy?.default_visibility ?? "public";

    if (visibility === "private") {
      skippedCount += 1;
      continue;
    }

    const date = getDiaryDate(parsed.data.date, file);
    const targetDir = path.join("src", "content", "devlog", projectSlug);
    const targetFile = path.join(targetDir, path.basename(file));
    const assetTargetDir = path.join("public", "images", "devlog", projectSlug, date);
    const referencedAssets = collectReferencedAssets(parsed.content, parsed.data.thumbnail, file, diaryRoot, assetsRoot);
    const dateAssets = await collectDateAssets(assetsRoot, date);
    const assetsToCopy = uniquePaths([...referencedAssets, ...dateAssets]);

    await fs.mkdir(targetDir, { recursive: true });
    await fs.mkdir(assetTargetDir, { recursive: true });

    for (const asset of assetsToCopy) {
      if (isBlockedAsset(asset)) continue;
      await fs.copyFile(asset, path.join(assetTargetDir, path.basename(asset)));
    }

    const content = rewriteMarkdownAssetPaths(parsed.content, projectSlug, date);
    const data = {
      ...parsed.data,
      title: parsed.data.title ?? titleFromFilename(file),
      date,
      type: parsed.data.type ?? "diary",
      project: parsed.data.project ?? project.name,
      project_slug: projectSlug,
      tags: normalizeTags(parsed.data.tags, project.tags),
      visibility,
      source_repo: sourceRepo,
      source_commit: sourceSha,
    };

    if (data.thumbnail) {
      data.thumbnail = rewriteAssetPath(data.thumbnail, projectSlug, date);
    }

    const output = matter.stringify(content.trimStart(), data);
    assertNoSecrets(output, path.relative(process.cwd(), targetFile));
    await fs.writeFile(targetFile, output, "utf8");
    importedCount += 1;
  }

  console.log(`Imported ${importedCount} dev diary file(s) from ${sourceRepo}.`);
  if (skippedCount > 0) console.log(`Skipped ${skippedCount} private dev diary file(s).`);
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

async function upsertProject(project) {
  const outputDir = path.join("src", "content", "projects");
  const outputFile = path.join(outputDir, `${project.slug}.json`);
  await fs.mkdir(outputDir, { recursive: true });

  const data = {
    name: project.name,
    slug: project.slug,
    description: project.description,
    category: project.category,
    tags: Array.isArray(project.tags) ? project.tags : [],
    repo_url: project.repo_url,
    thumbnail: project.thumbnail,
  };

  await fs.writeFile(outputFile, `${JSON.stringify(removeUndefined(data), null, 2)}\n`, "utf8");
}

async function createProjectIntro({ project, sourceRepo, sourceSha }) {
  const intro = project.intro ?? {};
  if (intro.publish_on_first_import === false) return;

  const outputDir = path.join("src", "content", "devlog", project.slug);
  const outputFile = path.join(outputDir, "_intro.md");
  if (await exists(outputFile)) return;

  await fs.mkdir(outputDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const data = {
    title: intro.title ?? `${project.name} 프로젝트 소개`,
    date: today,
    type: "project_intro",
    project: project.name,
    project_slug: project.slug,
    mood: "첫 연결",
    tags: Array.isArray(project.tags) ? project.tags : [],
    visibility: "public",
    source_repo: sourceRepo,
    source_commit: sourceSha,
  };

  const body = [
    "# 프로젝트 소개",
    "",
    "이 글은 기존 개발 repo를 yuykim14 Dev Diary에 처음 연결하면서 생성한 프로젝트 소개 글이다.",
    "",
    intro.summary ?? project.description ?? `${project.name} 프로젝트를 Dev Diary에 연결했다.`,
    "",
    "# 원본 저장소",
    "",
    `- https://github.com/${sourceRepo}`,
  ].join("\n");

  await fs.writeFile(outputFile, matter.stringify(body, data), "utf8");
}

async function collectDateAssets(assetsRoot, date) {
  if (!(await exists(assetsRoot))) return [];
  const files = await listFiles(assetsRoot);
  return files.filter((file) => path.basename(file).startsWith(date));
}

function collectReferencedAssets(content, thumbnail, markdownFile, diaryRoot, assetsRoot) {
  const refs = [];
  const markdownDir = path.dirname(markdownFile);
  const imageMatches = content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g);

  for (const match of imageMatches) {
    refs.push(match[1]);
  }

  if (thumbnail) refs.push(thumbnail);

  return refs
    .filter((ref) => isRelativeAssetPath(ref))
    .map((ref) => resolveAssetReference(ref, markdownDir, diaryRoot, assetsRoot))
    .filter(Boolean);
}

function rewriteMarkdownAssetPaths(content, projectSlug, date) {
  return content.replace(/(!\[[^\]]*\]\()([^)]+)(\))/g, (match, prefix, src, suffix) => {
    if (!isRelativeAssetPath(src)) return match;
    return `${prefix}${rewriteAssetPath(src, projectSlug, date)}${suffix}`;
  });
}

function rewriteAssetPath(src, projectSlug, date) {
  if (!isRelativeAssetPath(src)) return src;
  const filename = path.posix.basename(src.replaceAll("\\", "/"));
  return `${BLOG_BASE_PATH}/images/devlog/${projectSlug}/${date}/${filename}`;
}

function resolveAssetReference(ref, markdownDir, diaryRoot, assetsRoot) {
  const cleanRef = ref.split("#")[0].split("?")[0].replaceAll("\\", "/");

  if (cleanRef.startsWith("./assets/") || cleanRef.startsWith("assets/")) {
    return path.join(diaryRoot, cleanRef.replace(/^\.\//, ""));
  }

  if (cleanRef.startsWith("dev_diary/assets/")) {
    return path.join(path.dirname(diaryRoot), cleanRef);
  }

  const basename = path.basename(cleanRef);
  if (cleanRef.includes("/assets/")) {
    return path.join(assetsRoot, basename);
  }

  return path.resolve(markdownDir, cleanRef);
}

function isRelativeAssetPath(src) {
  if (!src || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) return false;
  return /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(src.split("?")[0].split("#")[0]);
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

function getDiaryDate(frontmatterDate, file) {
  if (frontmatterDate) {
    const date = new Date(frontmatterDate);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }

  const match = path.basename(file).match(/\d{4}-\d{2}-\d{2}/);
  if (!match) fail(`Cannot infer diary date from ${file}`);
  return match[0];
}

function titleFromFilename(file) {
  return path.basename(file, path.extname(file)).replace(/^\d{4}-\d{2}-\d{2}-?/, "").replaceAll("-", " ") || "Untitled log";
}

function normalizeTags(tags, projectTags) {
  const normalized = Array.isArray(tags) ? tags : [];
  const defaults = Array.isArray(projectTags) ? projectTags : [];
  return [...new Set([...normalized, ...defaults])];
}

function assertNoSecrets(text, label) {
  const found = SECRET_PATTERNS.find((pattern) => pattern.test(text));
  if (found) fail(`Publishing blocked: possible secret detected in ${label}`);
}

function isBlockedAsset(file) {
  const name = path.basename(file);
  return BLOCKED_ASSET_PATTERNS.some((pattern) => pattern.test(name));
}

function isWithin(file, maybeParent) {
  const relative = path.relative(path.resolve(maybeParent), path.resolve(file));
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function normalizeBasePath(basePath) {
  const normalized = `/${basePath.replace(/^\/+|\/+$/g, "")}`;
  return normalized === "/" ? "" : normalized;
}

function uniquePaths(paths) {
  return [...new Set(paths.map((item) => path.resolve(item)))];
}

function removeUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
