# Glossary Videos

This directory contains video files for glossary terms.

## File Naming Convention
Use descriptive, lowercase names with hyphens:
- `increase-technique.mp4`
- `decrease-technique.mp4`
- `cast-on-method.mp4`

## Adding Videos to Glossary Entries

Your glossary already supports videos through the `videoUrl` field. Here's how to use it:

### For Self-Hosted Videos (in this folder):

```json
{
  "term": "Increase",
  "videoUrl": "/videos/glossary/increase-technique.mp4",
  "isMemberOnly": false,
  ...
}
```

### For YouTube Videos:

```json
{
  "term": "Increase",
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "isMemberOnly": false,
  ...
}
```

### For Vimeo Videos:

```json
{
  "term": "Increase",
  "videoUrl": "https://vimeo.com/VIDEO_ID",
  "isMemberOnly": false,
  ...
}
```

### Member-Only Videos:
Set `isMemberOnly: true` to restrict video access to members only:

```json
{
  "term": "Increase",
  "videoUrl": "/videos/glossary/increase-technique.mp4",
  "isMemberOnly": true,
  ...
}
```

## Video Path on Website
Videos in this folder will be accessible at:
`/videos/glossary/[filename].mp4`

Example: `/videos/glossary/increase-technique.mp4`

## Video Format Guidelines
- **Format**: MP4 (H.264 codec recommended for web compatibility)
- **Size**: Keep files under 10MB for faster loading
- **Dimensions**: 1920x1080 or smaller (720p is often sufficient)
- **Length**: Keep demonstrations concise (15-30 seconds ideal)

## Current Video Files
- `increase-technique.mp4` - Demonstration of increase technique
