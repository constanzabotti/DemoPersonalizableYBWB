import { memo } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoModeProvider } from "@/hooks/use-demo-mode";
import { Navigation } from "@/components/Navigation";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/Landing";
import Demo from "@/pages/Demo";
import Dashboard from "@/pages/Dashboard";
import Routines from "@/pages/Routines";
import RoutineDetail from "@/pages/RoutineDetail";
import Wellness from "@/pages/Wellness";
import Rewards from "@/pages/Rewards";
import Guides from "@/pages/Guides";
import GuideDetail from "@/pages/GuideDetail";
import Chat from "@/pages/Chat";
import Payments from "@/pages/Payments";
import Profile from "@/pages/Profile";
import Students from "@/pages/Students";

const LoadingScreen = memo(function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-black animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full border-4 border-t-emerald-400 border-r-transparent border-b-emerald-400 border-l-transparent animate-spin"></div>
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Loading System...</span>
      </div>
    </div>
  );
});

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="lg:pl-[280px] pt-16 lg:pt-0">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/demo" component={Demo} />
      <Route path="/dashboard">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      <Route path="/routines/:id">
        {(params) => <AppLayout><RoutineDetail /></AppLayout>}
      </Route>
      <Route path="/routines">
        <AppLayout><Routines /></AppLayout>
      </Route>
      <Route path="/wellness">
        <AppLayout><Wellness /></AppLayout>
      </Route>
      <Route path="/rewards">
        <AppLayout><Rewards /></AppLayout>
      </Route>
      <Route path="/guides/:id">
        {(params) => <AppLayout><GuideDetail /></AppLayout>}
      </Route>
      <Route path="/guides">
        <AppLayout><Guides /></AppLayout>
      </Route>
      <Route path="/chat">
        <AppLayout><Chat /></AppLayout>
      </Route>
      <Route path="/payments">
        <AppLayout><Payments /></AppLayout>
      </Route>
      <Route path="/profile">
        <AppLayout><Profile /></AppLayout>
      </Route>
      <Route path="/students">
        <AppLayout><Students /></AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoModeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </DemoModeProvider>
    </QueryClientProvider>
  );
}

export default App;
