# Frontend Component Patterns

## Customer Management Screens

Customer management screens are split by process:

```text
propertyconnect-frontend/src/components/lead/lead.tsx
propertyconnect-frontend/src/components/prospect/prospect.tsx
propertyconnect-frontend/src/components/reports/customer-management-reports.tsx
```

Use it for:

- focused lead capture and conversion
- prospect activity, offer, negotiation, and reservation workflows
- customer management reports
- shared drawer-based create/edit actions

## API Helpers

Customer management API calls belong in:

```text
propertyconnect-frontend/src/lib/lead.ts
propertyconnect-frontend/src/lib/prospect.ts
propertyconnect-frontend/src/lib/reports.ts
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
- offers
- negotiations
- reservations
- payment receipts
- reports

Rules:

- Use stable row keys.
- Keep headings short.
- Format money, dates, and statuses.
- Keep row actions compact.
- Provide empty states.
