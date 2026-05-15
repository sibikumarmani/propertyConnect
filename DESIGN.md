# PropertyConnect Design Specification

## Design Intent

PropertyConnect should feel like an ERP-style property management operations console.

The interface must prioritize:

- Fast scanning of records and statuses.
- Predictable navigation.
- Dense but readable operational content.
- Clear company and user context.
- Controlled create, edit, and approval flows.

Avoid marketing-style pages, decorative hero sections, oversized promotional copy, or public website composition. Authenticated screens should feel like workspaces, not landing pages.

## Application Shell

Authenticated pages use the same shell pattern as the reference project:

- Fixed left sidebar.
- Fixed top bar.
- Main content area offset by sidebar width.
- Page header with title and subtitle.
- Large bordered `page-surface` container.
- Optional floating agent shortcut.

Sidebar widths:

- Expanded: `260px`.
- Collapsed: `64px`.

Main content must shift with the sidebar state. The top bar must also start after the sidebar, so it never overlaps navigation.

## Sidebar Navigation

The sidebar must support:

- Expanded and collapsed modes.
- Grouped navigation sections.
- Group icons and item icons.
- Active group highlighting.
- Active page highlighting.
- Auto-expansion of the active group.
- Icon-only navigation in collapsed mode with hover/title labels.

Use Lucide icons consistently for navigation items and controls.

Recommended navigation groups, matching the reference project:

- Insights
- Administration
- Property Setup
- Leasing
- Work Orders
- Procurement

Initial PropertyConnect login work may only expose Dashboard, Company Selection, and authentication screens. As modules are added, route names and grouping should follow the reference navigation model.

## Top Bar

The top bar must match the reference workspace behavior:

- Gradient header surface.
- Application label and application name.
- Theme settings entry.
- User avatar or initials.
- User full name.
- User code.
- Email.
- Active role and active company context.
- Profile edit action.
- Password change action.
- Logout action.

The top bar should always reinforce that the user is inside a secured workspace.

## Page Layout Pattern

Authenticated pages should use this structure:

- Page title.
- Page subtitle.
- Optional company context banner.
- One large page surface.
- Section cards inside the page surface.
- Tables, forms, charts, or workflow panels inside section cards.

Reference styles:

- `page-surface`: gradient surface with strong border.
- `panel`: soft card with border and shadow.
- Section card: rounded `28px`, internal padding, eyebrow label, title, optional action row.

Do not nest decorative cards unnecessarily. Use cards for real content groups, repeated items, drawers, and forms.

## Data Tables

Operational list screens should use reference-style data tables:

- Rounded table container.
- Border around table.
- Uppercase muted column headers.
- Horizontal overflow for smaller screens.
- Row dividers.
- Hover state.
- Compact inline actions.

Tables must include states for:

- Loading.
- Empty data.
- Error.
- Permission denied, where applicable.

Common row actions:

- Add
- Edit
- Delete
- Manage Access
- View
- Refresh
- Approve
- Reject
- Resubmit

## Right-Side Drawers

Create, edit, view, and management flows should open in right-side drawers, matching the reference `SidebarDrawer` pattern.

Drawer structure:

- Full-screen overlay scrim.
- Drawer anchored to the right.
- Page-surface background.
- Header with eyebrow, title, optional description, and close button.
- Scrollable body.
- Form controls grouped clearly.
- Cancel/close and save/submit actions.

Use drawers for:

- Add/edit master data.
- Access management.
- Approval configuration.
- Viewing generated codes or secondary details.

## Forms

Forms should be practical and clear:

- Large readable fields.
- Consistent labels.
- Field-level validation text.
- Primary action buttons for submit.
- Secondary buttons for cancel or supporting actions.
- Error and success messages near the action area.

Use the reference form treatment:

- `field` class style.
- Focus ring using brand color.
- Primary buttons use the brand gradient.
- Secondary buttons use raised surface with border.

## Login Screen

The login screen should match the reference login experience, adjusted for PropertyConnect routes.

Route:

```text
/propertyconnect/login
```

Layout:

- Full-height page.
- Centered dialog-like surface.
- Two-panel layout on desktop.
- Left panel for secure access context.
- Right panel for active login form.

Left panel content:

- Small label: `Secure Access`
- Main title: `Property Admin Login` or `PropertyConnect Login`
- Short operational copy.
- Step buttons for the access flow.

Right panel:

- Sign in form.
- Login ID field.
- Password field.
- Optional remember-me control.
- Primary sign-in button.
- Error message area.

Do not show the authenticated sidebar/top bar on login.

## Company Selection

Company selection follows the reference pattern.

Route:

```text
/propertyconnect/company-selection
```

Layout:

- Centered surface.
- Small label: `Select Company`
- Main title: `Choose your active company`
- Personalized welcome text when available.
- Radio-list company choices.
- Selected company has stronger border and tinted background.
- Cancel and Continue actions.

Do not show the authenticated sidebar/top bar until company selection is complete.

## Dashboard And Workspace Landing

After login and company selection, users should land in the authenticated workspace.

Current PropertyConnect route:

```text
/propertyconnect/dashboard
```

Dashboard should use the same shell and page surface as the reference project. It should show operational widgets only when real data exists. Avoid a marketing landing page.

## Visual Tokens

Follow the reference CSS variable system.

Core light theme tokens:

- `--background: #edf4f7`
- `--foreground: #183247`
- `--foreground-muted: #5c7386`
- `--surface`
- `--surface-strong`
- `--line`
- `--line-strong`
- `--brand: #138a9e`
- `--brand-strong: #183247`
- `--brand-tint: #f3fbfc`
- `--topbar-start: #14324a`
- `--topbar-mid: #1e5168`
- `--topbar-end: #1f8aa0`

Dark theme should mirror the reference project if theme switching is implemented.

Use:

- Manrope for body text.
- Space Grotesk for display headings.
- Lucide icons for actions and navigation.

## Status Styling

Use reference pill/status styles:

- Success: green tone.
- Warning: amber tone.
- Danger: red tone.
- Brand: teal/blue tone.

Statuses should be compact and easy to scan.

Common statuses:

- Active
- Inactive
- Verified
- Pending
- Approved
- Rejected
- Synced
- Failed
- Retry Required

## Access And Protected Navigation

Protected navigation must follow the reference behavior:

- No active session redirects to login.
- Pending company selection redirects to company selection.
- Active session on login redirects to the workspace.
- Active session on company selection redirects to workspace.
- Users without access should not see restricted menu groups.
- Active navigation group expands automatically.

For initial login-only implementation, avoid exposing future modules until backend access and company selection are stable.

## Tone And Copy

Copy should be operational and direct.

Use:

- Sign in
- Select company
- Continue
- Dashboard
- Users
- Roles
- Properties
- Units
- Leases
- Rent & Billing
- Maintenance
- Reports

Avoid playful, sales-oriented, or consumer marketing language.

## Implementation Rule

When adding new PropertyConnect frontend screens, first check the matching reference project component or page pattern:

```text
/Users/sibi/Workspaces/projects/propertymanagementsystem/frontend/src
```

Prefer matching:

- Layout shell.
- Sidebar behavior.
- Top bar behavior.
- Section card pattern.
- Drawer pattern.
- Table pattern.
- Theme tokens.
- Login/company selection behavior.

PropertyConnect should feel like the same product family as the reference project, with route prefixes adjusted for:

```text
/propertyconnect
```
