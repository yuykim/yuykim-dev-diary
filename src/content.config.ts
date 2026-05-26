import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const devlog = defineCollection({
  loader: glob({ base: "./src/content/devlog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    type: z.enum(["diary", "project_intro"]).default("diary"),
    project: z.string(),
    project_slug: z.string(),
    mood: z.string().optional(),
    tags: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
    visibility: z.enum(["public", "private"]).default("public"),
    source_repo: z.string().optional(),
    source_commit: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.json" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    repo_url: z.string().optional(),
    thumbnail: z.string().optional(),
  }),
});

export const collections = {
  devlog,
  projects,
};
