# Frontend Layout Design

## Route Root

Authenticated PropertyConnect pages live under:

```text
propertyconnect-frontend/src/app/propertyconnect
```

Current route groups:

```text
login
company-selection
dashboard
customer-management
```

## Layout Components

```text
propertyconnect-frontend/src/components/layout/app-sidebar.tsx
propertyconnect-frontend/src/components/layout/app-top-bar.tsx
propertyconnect-frontend/src/components/layout/navigation.ts
propertyconnect-frontend/src/components/layout/workspace-drawer.tsx
```

## Layout Rules

- Keep sidebar navigation consistent across authenticated pages.
- Keep the top bar visible and compact.
- Use the drawer for create, edit, and workflow actions.
- Keep content areas dense enough for operational use.
- Avoid marketing hero sections in application pages.
- Ensure screens work on desktop and narrower viewports.

## Navigation

Navigation belongs in:

```text
propertyconnect-frontend/src/components/layout/navigation.ts
```

Add new module routes there when a new screen is created.
