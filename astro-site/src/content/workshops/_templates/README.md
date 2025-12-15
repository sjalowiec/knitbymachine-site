# Workshop Templates

## How to Create a New Workshop Instance

1. **Duplicate the template**
   - Copy `workshop-instance.template.json`
   - Rename it to match your workshop slug (e.g., `ruth-sweater.json`)

2. **Edit the required fields**
   - `slug`: Unique identifier (e.g., "ruth-sweater")
   - `client.firstName`: Participant's first name
   - `workshop.title`: Workshop display title
   - `workshop.subtitle`: Brief description
   - `hub.welcomeTitle`: Personalized welcome heading
   - `hub.welcomeBody`: Welcome message
   - `hub.todayLabel`: Current day indicator

3. **Configure Hyvor comments**
   - `hyvor.enabled`: Set to `true` to enable comments
   - `hyvor.websiteId`: Your Hyvor Talk website ID (e.g., "14706")
   - `hyvor.pageId`: Unique page ID for this workshop (e.g., "workshop-ruth-sweater-hub")

4. **Customize the outline** (required for release control)
   - Edit `outline.days` array with your workshop plan
   - Set `released: true` for days that should be accessible

5. **Add curriculum content** (optional, but recommended)
   - Add a `curriculum` section with rich content blocks
   - See "Curriculum Schema" below for details

6. **Publish**
   - Save the JSON file
   - The workshop hub will be available at:
     `/guided-workshops/{slug}/hub`
   - Day pages will be at:
     `/guided-workshops/{slug}/day/{day-number}`

## Template Files

- `workshop-instance.template.json` - Complete workshop structure with curriculum example
- `outline.template.json` - Day outline structure for reference

---

## Curriculum Schema

The `curriculum` section enables rich content for each workshop day. It works alongside the `outline` section, which controls release status.

### Structure

```json
{
  "curriculum": {
    "version": 1,
    "days": [
      {
        "day": 1,
        "title": "Day Title",
        "shortDescription": "Brief summary of the day's goal",
        "estimatedTime": "15 min",
        "release": { "mode": "relative", "dayOffset": 0 },
        "blocks": [ ... ]
      }
    ]
  }
}
```

### Day Fields

| Field | Required | Description |
|-------|----------|-------------|
| `day` | Yes | Day number (1-based) |
| `title` | Yes | Display title for the day |
| `shortDescription` | Yes | Brief goal/summary (shown in hub list) |
| `estimatedTime` | No | Time estimate (e.g., "15 min", "1 hour") |
| `release.mode` | Yes | "relative" (offset from start) or "absolute" (specific date) |
| `release.dayOffset` | When relative | Days from workshop start (0 = Day 1) |
| `release.date` | When absolute | ISO date string |
| `blocks` | Yes | Array of content blocks |

### Block Types

#### 1. Rich Text
Markdown content rendered as HTML.

```json
{
  "type": "richText",
  "content": "## Heading\n\nParagraph with **bold** and *italic* text.\n\n- List item 1\n- List item 2"
}
```

#### 2. Image
Display an image with optional caption.

```json
{
  "type": "image",
  "src": "/images/example.jpg",
  "alt": "Description of image",
  "caption": "Optional caption text"
}
```

#### 3. Video
Embedded video from YouTube, Vimeo, Loom, or direct URL.

```json
{
  "type": "video",
  "provider": "youtube",
  "url": "https://www.youtube.com/watch?v=xxxxx",
  "caption": "Optional caption"
}
```

Supported providers: `youtube`, `vimeo`, `loom`, `direct`

#### 4. Download
A download link for files (PDFs, patterns, etc.).

```json
{
  "type": "download",
  "label": "Download the Pattern PDF",
  "url": "/files/pattern.pdf"
}
```

#### 5. Checklist
Interactive checkbox list for tracking tasks.

```json
{
  "type": "checklist",
  "title": "Today's Tasks",
  "items": [
    { "text": "Required task", "isOptional": false },
    { "text": "Optional bonus task", "isOptional": true }
  ]
}
```

#### 6. Callout
Highlighted note, tip, or important notice.

```json
{
  "type": "callout",
  "style": "tip",
  "title": "Pro tip",
  "content": "Helpful advice goes here."
}
```

Styles: `note` (neutral), `tip` (green), `important` (orange)

---

## How Outline and Curriculum Work Together

- **`outline.days`**: Controls which days are released (via `released: true/false`)
- **`curriculum.days`**: Contains the rich content for each day

The day page will:
1. Check `outline.days` to determine if a day is released
2. Render content from `curriculum.days` if available
3. Fall back to simple goal display if no curriculum exists

This allows you to:
- Progressively release days by updating only `outline.days[n].released`
- Add rich content gradually without blocking the workshop
- Maintain backwards compatibility with existing workshops

---

## Per-Day Comments

Each day page automatically gets its own Hyvor comment thread with a unique page ID:
```
workshop-{slug}-day-{dayNumber}
```

This keeps Day 1 discussions separate from Day 2, etc.
