"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, KeyRound, LogOut, MoonStar, Palette, SunMedium, UserCircle2, UserRound } from "lucide-react";

import { WorkspaceDrawer } from "@/components/layout/workspace-drawer";
import {
  applyThemeSettings,
  defaultAccentColor,
  getStoredAccentColor,
  getStoredThemeMode,
  type ThemeMode,
} from "@/lib/theme";

const colorPalettes = [
  { name: "Teal", color: defaultAccentColor },
  { name: "Ocean", color: "#1e6f9f" },
  { name: "Emerald", color: "#2b8a63" },
  { name: "Olive", color: "#7c6a33" },
  { name: "Indigo", color: "#4f46e5" },
  { name: "Violet", color: "#7c3aed" },
  { name: "Rose", color: "#be3b62" },
  { name: "Copper", color: "#b45309" },
];

export type WorkspaceCompany = {
  code?: string;
  name?: string;
};

export type WorkspaceUser = {
  id?: string;
  name?: string;
  email?: string;
};

type AppTopBarProps = {
  company: WorkspaceCompany | null;
  user: WorkspaceUser | null;
  avatarImage?: string;
  userCode: string;
  userInitials: string;
  userRole: string;
  onLogout: () => void;
  onSwitchCompany: () => void;
};

export function AppTopBar({
  company,
  user,
  avatarImage,
  userCode,
  userInitials,
  userRole,
  onLogout,
  onSwitchCompany,
}: AppTopBarProps) {
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<"profile" | "password" | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode());
  const [accentColor, setAccentColor] = useState(() => getStoredAccentColor());
  const themePanelRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    applyThemeSettings(themeMode, accentColor, false);
  }, [accentColor, themeMode]);

  useEffect(() => {
    function closePanels(event: MouseEvent) {
      if (!themePanelRef.current?.contains(event.target as Node)) {
        setIsThemePanelOpen(false);
      }

      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsThemePanelOpen(false);
        setIsUserMenuOpen(false);
        setActiveDrawer(null);
      }
    }

    document.addEventListener("mousedown", closePanels);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closePanels);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function updateTheme(nextThemeMode: ThemeMode, nextAccentColor = accentColor) {
    setThemeMode(nextThemeMode);
    setAccentColor(nextAccentColor);
    applyThemeSettings(nextThemeMode, nextAccentColor);
  }

  return (
    <>
      <header className="topbar-shade relative z-40 border-b text-white backdrop-blur-xl" style={{ borderColor: "var(--topbar-border)" }}>
        <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">Application</p>
            <h2 className="display-font truncate text-2xl font-semibold text-white">Property Management Administration</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative z-50" ref={themePanelRef}>
              <button
                aria-label="Open theme settings"
                className="topbar-button inline-flex h-12 items-center gap-2 rounded-2xl px-3 text-sm font-semibold backdrop-blur transition hover:brightness-110"
                onClick={() => setIsThemePanelOpen((value) => !value)}
                type="button"
              >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Theme</span>
              </button>

              <div
                className={`topbar-panel absolute right-0 top-[calc(100%+0.35rem)] w-[22rem] rounded-[24px] p-4 backdrop-blur transition ${
                  isThemePanelOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Appearance</p>
                <h3 className="display-font mt-2 text-lg font-semibold text-[color:var(--brand-strong)]">Theme settings</h3>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    className={`${themeMode === "light" ? "btn-primary" : "btn-secondary"} rounded-2xl px-3 py-3 text-sm font-semibold transition`}
                    onClick={() => updateTheme("light")}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <SunMedium className="h-4 w-4" />
                      Light
                    </span>
                  </button>
                  <button
                    className={`${themeMode === "dark" ? "btn-primary" : "btn-secondary"} rounded-2xl px-3 py-3 text-sm font-semibold transition`}
                    onClick={() => updateTheme("dark")}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <MoonStar className="h-4 w-4" />
                      Dark
                    </span>
                  </button>
                </div>
                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[color:var(--brand-strong)]">Color palette</p>
                    <span className="rounded-full bg-[color:var(--brand-tint)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-strong)]">
                      {selectedPaletteName(accentColor)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {colorPalettes.map((palette) => (
                      <button
                        aria-label={`Use ${palette.name} palette`}
                        className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition ${
                          accentColor.toLowerCase() === palette.color.toLowerCase()
                            ? "border-[color:var(--brand-strong)] ring-2 ring-[color:var(--brand-border)]"
                            : "border-[color:var(--line)] hover:border-[color:var(--line-strong)]"
                        }`}
                        key={palette.name}
                        onClick={() => updateTheme(themeMode, palette.color)}
                        type="button"
                      >
                        <span className="h-7 w-7 shrink-0 rounded-xl border border-white/30" style={{ background: palette.color }} />
                        <span className="min-w-0 flex-1 truncate text-[color:var(--foreground)]">{palette.name}</span>
                      </button>
                    ))}
                  </div>
                  <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-3 py-2">
                    <span className="text-sm font-semibold text-[color:var(--brand-strong)]">Custom color</span>
                    <input
                      aria-label="Choose custom accent color"
                      className="h-9 w-12 cursor-pointer rounded-xl border border-[color:var(--line-strong)] bg-transparent"
                      onChange={(event) => updateTheme(themeMode, event.target.value)}
                      type="color"
                      value={accentColor}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="hidden min-w-0 text-right lg:block">
              <p className="truncate text-sm font-semibold text-white">{user?.name || "User"}</p>
              <p className="truncate text-xs text-white/70">{[userCode, user?.email].filter(Boolean).join(" • ") || "Member"}</p>
              <p className="truncate text-xs text-white/70">{userRole}</p>
            </div>

            <div className="relative z-50" ref={userMenuRef}>
              <button
                aria-label="Open user menu"
                className="topbar-button flex h-12 items-center gap-2 rounded-2xl px-2 transition hover:brightness-110"
                onClick={() => setIsUserMenuOpen((value) => !value)}
                type="button"
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl text-sm font-bold">
                  <AvatarImage avatarImage={avatarImage} fallback={userInitials || <UserCircle2 className="h-5 w-5" />} />
                </span>
                <ChevronDown className="hidden h-4 w-4 sm:block" />
              </button>

              <div
                className={`topbar-panel absolute right-0 top-[calc(100%+0.35rem)] w-[19rem] rounded-[24px] p-3 backdrop-blur transition ${
                  isUserMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
                }`}
              >
                <div className="flex items-center gap-3 border-b border-[color:var(--line)] px-3 pb-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[color:var(--brand-tint)] text-sm font-bold text-[color:var(--brand-strong)]">
                    <AvatarImage avatarImage={avatarImage} fallback={userInitials || <UserCircle2 className="h-5 w-5" />} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[color:var(--brand-strong)]">{user?.name || "User"}</p>
                    <p className="mt-1 truncate text-sm text-[color:var(--foreground-muted)]">{user?.email || "No email available"}</p>
                    <p className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)]">
                      {company?.name || "No company selected"}
                    </p>
                  </div>
                </div>
                <button className="topbar-panel-item mt-2" onClick={() => setActiveDrawer("profile")} type="button">
                  <UserRound className="h-4 w-4" />
                  View profile
                </button>
                <button className="topbar-panel-item" onClick={onSwitchCompany} type="button">
                  <Building2 className="h-4 w-4" />
                  Switch company
                </button>
                <button className="topbar-panel-item" onClick={() => setActiveDrawer("password")} type="button">
                  <KeyRound className="h-4 w-4" />
                  Change password
                </button>
                <button className="topbar-panel-item topbar-panel-item-brand" onClick={onLogout} type="button">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <WorkspaceDrawer
        eyebrow={activeDrawer === "profile" ? "Profile" : "Security"}
        open={activeDrawer !== null}
        title={activeDrawer === "profile" ? "View profile" : "Change password"}
        onClose={() => setActiveDrawer(null)}
      >
        {activeDrawer === "profile" ? (
          <ProfileDetails
            avatarImage={avatarImage}
            company={company}
            user={user}
            userCode={userCode}
            userInitials={userInitials}
            userRole={userRole}
            onClose={() => setActiveDrawer(null)}
          />
        ) : (
          <PasswordForm onClose={() => setActiveDrawer(null)} />
        )}
      </WorkspaceDrawer>
    </>
  );
}

function selectedPaletteName(accentColor: string) {
  return colorPalettes.find((palette) => palette.color.toLowerCase() === accentColor.toLowerCase())?.name ?? "Custom";
}

function ProfileDetails({
  avatarImage,
  company,
  user,
  userCode,
  userInitials,
  userRole,
  onClose,
}: {
  avatarImage?: string;
  company: WorkspaceCompany | null;
  user: WorkspaceUser | null;
  userCode: string;
  userInitials: string;
  userRole: string;
  onClose: () => void;
}) {
  const rows = [
    ["Full name", user?.name || "User"],
    ["Email", user?.email || "No email available"],
    ["User code", userCode || "Not available"],
    ["Role", userRole || "Secured workspace"],
    ["Company", company?.name || "No company selected"],
    ["Company code", company?.code || "Not available"],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-[24px] border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[color:var(--brand-tint)] text-lg font-bold text-[color:var(--brand-strong)]">
          <AvatarImage avatarImage={avatarImage} fallback={userInitials || <UserCircle2 className="h-6 w-6" />} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-[color:var(--brand-strong)]">{user?.name || "User"}</p>
          <p className="truncate text-sm text-[color:var(--foreground-muted)]">{user?.email || "No email available"}</p>
        </div>
      </div>

      <dl className="space-y-3">
        {rows.map(([label, value]) => (
          <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3" key={label}>
            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)]">{label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-[color:var(--brand-strong)]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex justify-end gap-3">
        <button className="btn-secondary rounded-2xl px-5 py-3 text-sm font-semibold" onClick={onClose} type="button">
          Close
        </button>
      </div>
    </div>
  );
}

function AvatarImage({ avatarImage, fallback }: { avatarImage?: string; fallback: React.ReactNode }) {
  if (!avatarImage) {
    return fallback;
  }

  return (
    <span
      aria-hidden="true"
      className="block h-full w-full bg-cover bg-center"
      style={{ backgroundImage: `url("${avatarImage.replaceAll('"', "%22")}")` }}
    />
  );
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      {["Current password", "New password", "Confirm password"].map((label) => (
        <label className="block" key={label}>
          <span className="mb-2 block text-sm font-semibold text-[color:var(--brand-strong)]">{label}</span>
          <input className="field w-full rounded-2xl px-4 py-3" type="password" />
        </label>
      ))}
      <div className="flex justify-end gap-3">
        <button className="btn-secondary rounded-2xl px-5 py-3 text-sm font-semibold" onClick={onClose} type="button">
          Close
        </button>
        <button className="btn-primary rounded-2xl px-5 py-3 text-sm font-semibold" type="button">
          Update password
        </button>
      </div>
    </div>
  );
}
