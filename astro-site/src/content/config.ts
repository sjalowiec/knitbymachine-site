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

export const collections = {
  'ai-agents': aiAgents
};
