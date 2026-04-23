"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Settings, Search, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface PageErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  variant?:
    | "default"
    | "dashboard"
    | "auth"
    | "linkedin"
    | "search"
    | "settings"
    | "login"
    | "signup";
  showNavbar?: boolean;
}

export function PageError({
  error,
  reset,
  variant = "default",
  showNavbar = true,
}: PageErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const getErrorContent = () => {
    switch (variant) {
      case "dashboard":
        return {
          title: "Dashboard Error",
          description:
            "Failed to load your data. Check your connection and try again.",
          primaryAction: { label: "Reload Dashboard", icon: RefreshCw },
          secondaryAction: { label: "Back to Home", icon: Home, href: "/" },
        };

      case "linkedin":
        return {
          title: "LinkedIn Automation Error",
          description:
            "Failed to load the LinkedIn automation tool. Please try again.",
          primaryAction: { label: "Try Again", icon: RefreshCw },
          secondaryAction: { label: "Back to Dashboard", icon: ArrowLeft, href: "/dashboard" },
        };

      case "search":
        return {
          title: "Search Error",
          description: "Failed to load the search tool. Please try again.",
          primaryAction: { label: "Try Again", icon: RefreshCw },
          secondaryAction: { label: "Go to Dashboard", icon: Search, href: "/dashboard" },
        };

      case "settings":
        return {
          title: "Settings Error",
          description: "Failed to load your settings. Please try again.",
          primaryAction: { label: "Reload Settings", icon: RefreshCw },
          secondaryAction: { label: "Back to Dashboard", icon: Settings, href: "/dashboard" },
        };

      case "login":
        return {
          title: "Login Error",
          description: "Failed to load the login page. Check your connection.",
          primaryAction: { label: "Try Again", icon: RefreshCw },
          secondaryAction: { label: "Back to Home", icon: Home, href: "/" },
        };

      case "signup":
        return {
          title: "Signup Error",
          description: "Failed to load the signup page. Check your connection.",
          primaryAction: { label: "Try Again", icon: RefreshCw },
          secondaryAction: { label: "Go to Login", icon: LogIn, href: "/login" },
        };

      default:
        return {
          title: "Something went wrong!",
          description: "An unexpected error occurred. Please try again.",
          primaryAction: { label: "Try again", icon: RefreshCw },
          secondaryAction: { label: "Back to Home", icon: Home, href: "/" },
        };
    }
  };

  const renderNavbar = () => (
    <div className="bg-card border-b border-border shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Cold Email Pro
          </Link>
        </div>
      </div>
    </div>
  );

  const content = getErrorContent();
  const isAuthPage = variant === "login" || variant === "signup" || variant === "auth";
  const containerClass = isAuthPage
    ? "min-h-screen bg-background flex items-center justify-center px-4"
    : "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8";

  const cardClass = isAuthPage ? "w-full max-w-md" : "mx-auto max-w-md";

  return (
    <div className={isAuthPage ? "" : "min-h-screen bg-background"}>
      {showNavbar && !isAuthPage && renderNavbar()}

      <div className={containerClass}>
        <Card className={cardClass}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">{content.title}</CardTitle>
            <CardDescription className="text-gray-600">{content.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={reset} className="w-full" variant="default">
              <content.primaryAction.icon className="mr-2 h-4 w-4" />
              {content.primaryAction.label}
            </Button>

            {content.secondaryAction && (
              <Button asChild className="w-full" variant="outline">
                <Link href={content.secondaryAction.href || "/"}>
                  <content.secondaryAction.icon className="mr-2 h-4 w-4" />
                  {content.secondaryAction.label}
                </Link>
              </Button>
            )}

            {process.env.NODE_ENV === "development" && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto text-gray-700">
                  {error.message}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
