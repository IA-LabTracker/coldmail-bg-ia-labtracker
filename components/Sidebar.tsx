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
  Sun,
  Moon,
  Megaphone,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/search", label: "Search & Trigger", icon: Search },
  { href: "/linkedin-table", label: "LinkedIn", icon: Linkedin },
  { href: "/import", label: "Import Leads", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
          <LayoutDashboard className="h-5 w-5 text-sidebar-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold text-sidebar-foreground">Cold Email Pro</h1>
          <p className="text-xs text-sidebar-foreground/60">by IA LabTracker</p>
        </div>
      </div>

      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
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
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="mb-2 flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

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
