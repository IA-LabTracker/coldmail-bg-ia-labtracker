"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Search,
  Linkedin,
  Settings,
  Upload,
  LogOut,
  SunMoon,
  Megaphone,
  CalendarClock,
  Mail,
  CreditCard,
  UserCircle,
  FileText,
  Inbox,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const SIDEBAR_LAST_PAGE_KEY = "coldmail:last-page";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/search", label: "Search & Trigger", icon: Search },
  { href: "/linkedin-table", label: "LinkedIn", icon: Linkedin },
  { href: "/schedules", label: "Schedules", icon: CalendarClock },
  { href: "/sender-emails", label: "Sender Emails", icon: Mail },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/import", label: "Import Leads", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar">
      <div className="flex items-center justify-between px-6 py-6">
        <Logo />
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          title={resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
        >
          <SunMoon className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => localStorage.setItem(SIDEBAR_LAST_PAGE_KEY, item.href)}
              className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/profile"
          onClick={() => localStorage.setItem(SIDEBAR_LAST_PAGE_KEY, "/profile")}
          className={`mb-2 flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === "/profile"
              ? "bg-sidebar-accent text-sidebar-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          }`}
        >
          <UserCircle className="h-5 w-5" />
          My Profile
        </Link>

        <Link
          href="/pricing"
          onClick={() => localStorage.setItem(SIDEBAR_LAST_PAGE_KEY, "/pricing")}
          className={`mb-2 flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === "/pricing"
              ? "bg-sidebar-accent text-sidebar-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          }`}
        >
          <CreditCard className="h-5 w-5" />
          Pricing
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to sign out?</AlertDialogDescription>
            <div className="flex justify-between gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}
