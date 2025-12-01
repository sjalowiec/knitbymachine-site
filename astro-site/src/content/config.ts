import { defineCollection, z } from 'astro:content';

const fieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['select', 'radio', 'text', 'number', 'checkbox']),
  options: z.array(z.object({
    value: z.string(),
    label: z.string()
  })).optional(),
  required: z.boolean().optional(),
  placeholder: z.string().optional()
});

const showWhenSchema = z.object({
  field: z.string(),
  equals: z.string()
});

const helperTextSchema = z.object({
  showWhen: showWhenSchema,
  text: z.string()
});

const actionSchema = z.object({
  type: z.enum(['link', 'button', 'submit']),
  label: z.string(),
  href: z.string().optional(),
  showWhen: showWhenSchema.optional()
});

const stepSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.array(z.string()).optional(),
  checklist: z.array(z.string()).optional(),
  fields: z.array(fieldSchema).optional(),
  helperText: helperTextSchema.optional(),
  actions: z.array(actionSchema).optional(),
  summary: z.array(z.string()).optional(),
  next: z.string().nullable()
});

const aiAgents = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    cardTitle: z.string(),
    category: z.string(),
    status: z.enum(['draft', 'published']),
    
    meta: z.object({
      excerpt: z.string(),
      why_use: z.string(),
      tags: z.array(z.string())
    }),
    
    ui: z.object({
      icon: z.string(),
      ctaLabel: z.string(),
      printTitle: z.string()
    }),
    
    steps: z.array(stepSchema)
  })
});

export const collections = {
  'ai-agents': aiAgents
};
