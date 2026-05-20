"use client";

type WorkspaceDrawerProps = {
  children: React.ReactNode;
  eyebrow: string;
  open: boolean;
  title: string;
  onClose: () => void;
};

export function WorkspaceDrawer({ children, eyebrow, open, title, onClose }: WorkspaceDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close drawer" className="overlay-scrim absolute inset-0 h-full w-full" onClick={onClose} type="button" />
      <aside className="page-surface absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col border-l border-[color:var(--line-strong)] shadow-[-24px_0_80px_rgba(15,23,42,0.18)]">
        <div className="border-b border-[color:var(--line)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">{eyebrow}</p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <h2 className="display-font text-2xl font-semibold text-[color:var(--brand-strong)]">{title}</h2>
            <button className="btn-secondary rounded-2xl px-4 py-2 text-sm font-semibold" onClick={onClose} type="button">
              Close
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      </aside>
    </div>
  );
}
