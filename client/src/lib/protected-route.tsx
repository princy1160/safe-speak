import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading, needsProfileSetup, needsIntro } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Redirect to profile setup if needed
  if (needsProfileSetup && path !== "/profile-setup") {
    return (
      <Route path={path}>
        <Redirect to="/profile-setup" />
      </Route>
    );
  }

  // Redirect to platform intro if needed
  if (needsIntro && !needsProfileSetup && path !== "/platform-intro") {
    return (
      <Route path={path}>
        <Redirect to="/platform-intro" />
      </Route>
    );
  }

  // If on profile-setup page but profile already complete, redirect to home
  if (path === "/profile-setup" && !needsProfileSetup) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // If on platform-intro page but intro already viewed, redirect to home
  if (path === "/platform-intro" && !needsIntro) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
