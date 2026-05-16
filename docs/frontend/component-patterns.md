# Frontend Component Patterns

## CRM Leasing Workspace

CRM leasing screens should use:

```text
propertyconnect-frontend/src/components/crm-leasing/leasing-workspace.tsx
```

Use it for:

- workflow navigation
- common leasing page structure
- summary panels
- shared loading/error handling
- consistent status presentation

## API Helpers

CRM leasing API calls belong in:

```text
propertyconnect-frontend/src/lib/crm-leasing.ts
```

Rules:

- Keep endpoint paths centralized.
- Return typed data.
- Keep payloads aligned with backend POJOs.
- Keep page components focused on UI and workflow.

## Forms

Rules:

- Label every input.
- Use selects for controlled values.
- Use date/time controls for dates.
- Use textareas for notes and comments.
- Validate required fields before save where practical.
- Disable save buttons while requests are running.
- Show errors near the affected form.

## Tables

Use tables for:

- lead lists
- prospects
- unit search results
- offers
- negotiations
- reservation queues
- payment receipts
- reports

Rules:

- Use stable row keys.
- Keep headings short.
- Format money, dates, and statuses.
- Keep row actions compact.
- Provide empty states.
