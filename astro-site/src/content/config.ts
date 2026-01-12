import { defineCollection, z } from 'astro:content';

const aiAgents = defineCollection({
  type: 'data',
  schema: z.object({
    // Core identity
    title: z.string(),
    slug: z.string(),

    // Existing content fields from my JSON files
    description: z.string().optional(),
    excerpt: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    iframeUrl: z.string().optional(),
    iframeHeight: z.string().optional(),
    provider: z.string().optional(),
    accessLevel: z.string().optional(),
    iconUrl: z.string().optional(),
    htmlContent: z.string().optional(),
    imageUrl: z.string().optional(),
    imageAlt: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    schemaMarkup: z.any().nullable().optional(),
    relatedAnas: z.array(z.string()).default([]),
    relatedWorkshops: z.array(z.string()).default([]),
    isDraft: z.boolean().optional(),
    publishedDate: z.string().optional(),
    pendingPublish: z.boolean().optional(),

    // New fields for the global landing page
    onboardingMode: z.boolean().optional(),
    whoThisIsFor: z.array(z.string()).optional(),
    whyItMatters: z.string().optional(),
    benefits: z.array(z.string()).optional(),
    onboardingIntroTitle: z.string().optional(),
    onboardingIntroBody: z.string().optional(),
    toolSubheading: z.string().optional(),
    videoUrl: z.string().optional(),
    relatedGuides: z.array(z.string()).optional(),
    showSecondaryCta: z.boolean().optional()
  })
});

const wizards = defineCollection({
  type: 'data',
  schema: z.object({
    // Core identity
    title: z.string(),
    slug: z.string(),

    // Existing wizard fields (from JSON files)
    hero: z.string().optional(),
    description: z.string().optional(),
    excerpt: z.string().optional(),
    whyUseThisTool: z.string().optional(),
    category: z.string().optional(),
    categoryId: z.string().optional(),
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    aliases: z.array(z.string()).default([]),
    videoUrl: z.string().optional(),
    accessLevel: z.string().optional(),
    price: z.string().optional(),
    relatedAnas: z.array(z.string()).default([]),
    relatedWorkshops: z.array(z.string()).default([]),
    imageUrl: z.string().optional(),
    imageAlt: z.string().optional(),
    iconUrl: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    schemaMarkup: z.any().nullable().optional(),
    isDraft: z.boolean().optional(),
    pendingPublish: z.boolean().optional(),
    publishedDate: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),

    // Landing page fields (shared with ai-agents)
    onboardingMode: z.boolean().optional(),
    whoThisIsFor: z.array(z.string()).optional(),
    whyItMatters: z.string().optional(),
    benefits: z.array(z.string()).optional(),
    onboardingIntroTitle: z.string().optional(),
    onboardingIntroBody: z.string().optional(),
    toolSubheading: z.string().optional(),
    relatedGuides: z.array(z.string()).optional(),
    showSecondaryCta: z.boolean().optional(),
    
    // Interactive wizard flow (for troubleshooters)
    wizardFlow: z.object({
      version: z.number(),
      questionTitle: z.string().optional(),
      questionSubtitle: z.string().optional(),
      options: z.array(z.object({
        id: z.string(),
        label: z.string(),
        resultId: z.string()
      })).default([]),
      results: z.array(z.object({
        id: z.string(),
        causeTitle: z.string(),
        explanation: z.string(),
        tryThisItems: z.array(z.string()).default([]),
        encouragement: z.string().default("")
      })).default([])
    }).nullable().optional()
  })
});

const videos = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    vimeoId: z.string(),
    durationSeconds: z.number().optional(),
    keywords: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    skillLevel: z.string().optional().nullable(),
    searchRole: z.string().optional(),
    usedIn: z.array(z.object({
      type: z.string(),
      id: z.string(),
      label: z.string(),
      url: z.string()
    })).optional(),
  })
});

export const collections = {
  'ai-agents': aiAgents,
  'wizards': wizards,
  'videos': videos
};
