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

4. **Customize the outline**
   - Edit `outline.days` array with your workshop plan
   - Set `released: true` for days that should be accessible

5. **Publish**
   - Save the JSON file
   - The workshop hub will be available at:
     `/guided-workshops/{slug}/hub`
   - Day pages will be at:
     `/guided-workshops/{slug}/day/{day-number}`

## Template Files

- `workshop-instance.template.json` - Complete workshop structure
- `outline.template.json` - Day outline structure for reference
