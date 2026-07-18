import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-fit-track";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { WHITE_LABEL_CONFIG } from "@/config/theme";
import { 
  Dumbbell, 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  LogOut, 
  Menu,
  X,
  MessageSquare,
  CreditCard,
  Heart,
  Gift,
  User,
  ArrowLeftRight,
  Play,
  Copy,
  Crown
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/LanguageSelector";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { isDemoMode, demoRole, setDemoRole, exitDemoMode } = useDemoMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocationNav] = useLocation();
  const { t } = useTranslation();

  if (!user && !isDemoMode) return null;

  const effectiveRole = isDemoMode ? demoRole : profile?.role;
  const isTrainer = effectiveRole === "trainer";

  const links = [
    { href: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: "/routines", label: t('nav.routines'), icon: Dumbbell },
    ...(!isTrainer ? [
      { href: "/wellness", label: t('nav.wellness'), icon: Heart },
      { href: "/rewards", label: t('nav.rewards'), icon: Gift },
    ] : []),
    { href: "/guides", label: t('nav.guides'), icon: BookOpen },
    { href: "/chat", label: t('nav.chat'), icon: MessageSquare },
    { href: "/payments", label: t('nav.payments'), icon: CreditCard },
    ...(isTrainer ? [
      { href: "/students", label: t('nav.students'), icon: Users },
      { href: "/templates", label: t('nav.templates'), icon: Copy },
      { href: "/plans", label: "Planes", icon: Crown },
    ] : []),
    { href: "/profile", label: t('nav.profile'), icon: User },
  ];

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-2 py-4 mb-4">
        {WHITE_LABEL_CONFIG.isWhiteLabelActive ? (
          <img src={WHITE_LABEL_CONFIG.logoUrl} alt={WHITE_LABEL_CONFIG.brandName} className="w-10 h-10 rounded-xl object-contain" />
        ) : (
          <div className="neon-gradient p-2 rounded-xl neon-glow">
            <Dumbbell className="w-6 h-6 text-black" />
          </div>
        )}
        <div>
          <h1 className="font-display font-bold text-lg tracking-tight">
            <span className="neon-gradient-text notranslate" translate="no">{WHITE_LABEL_CONFIG.brandName}</span>
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{effectiveRole === 'trainer' ? t('roles.trainer') : t('roles.student')}</p>
        </div>
      </div>

      {isDemoMode && (
        <div className="mb-6 p-3 rounded-xl bg-primary/10 neon-border space-y-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase">{t('demo.mode')}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center gap-2"
            onClick={() => setDemoRole(demoRole === "student" ? "trainer" : "student")}
            data-testid="button-switch-role"
          >
            <ArrowLeftRight className="w-4 h-4" />
            {t('demo.switchTo')} {demoRole === "student" ? t('demo.trainer') : t('demo.student')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => {
              exitDemoMode();
              setLocationNav("/");
            }}
            data-testid="button-exit-demo-nav"
          >
            {t('demo.exit')}
          </Button>
        </div>
      )}

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "group-hover:text-primary transition-colors")} />
                {link.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 border-t border-border/50">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border">
            {profile?.user?.profileImageUrl ? (
              <img src={profile.user.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                {isDemoMode ? (demoRole === "trainer" ? "E" : "A") : user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">
              {isDemoMode ? (demoRole === "trainer" ? `${t('demo.trainer')} Demo` : `${t('demo.student')} Demo`) : (user?.firstName || 'User')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isDemoMode ? "demo@example.com" : user?.email}
            </p>
          </div>
        </div>
        {!isDemoMode && (
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </Button>
        )}
        <p className="mt-4 text-[10px] text-center text-muted-foreground/50 italic">
          {t('app.copyright')}
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-b border-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {WHITE_LABEL_CONFIG.isWhiteLabelActive ? (
            <img src={WHITE_LABEL_CONFIG.logoUrl} alt={WHITE_LABEL_CONFIG.brandName} className="w-6 h-6 rounded object-contain" />
          ) : (
            <Dumbbell className="w-6 h-6 text-primary" />
          )}
          <span className="font-display font-bold text-lg neon-gradient-text notranslate" translate="no">{WHITE_LABEL_CONFIG.brandName}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 bottom-0 left-0 w-[280px] bg-background border-r border-border p-4 flex flex-col animate-in slide-in-from-left duration-300">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[280px] bg-black border-r border-border/50 flex-col p-6 z-30">
        <NavContent />
      </aside>
    </>
  );
}
