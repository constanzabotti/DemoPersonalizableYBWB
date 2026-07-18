import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDemoMode, DEMO_DATA } from "@/hooks/use-demo-mode";
import { 
  User, 
  Mail, 
  Target, 
  Award, 
  Trophy, 
  Star,
  Gift,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import type { Profile, StudentPoints, PointTransaction } from "@shared/schema";
import { REWARDS } from "@shared/schema";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isDemoMode, demoRole } = useDemoMode();
  
  const effectiveUserId = user?.id || (isDemoMode ? "demo-user" : "");
  
  const demoData = isDemoMode ? DEMO_DATA[demoRole] : null;
  
  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profiles", effectiveUserId],
    enabled: !!effectiveUserId && !isDemoMode,
  });

  const { data: pointsData } = useQuery<StudentPoints>({
    queryKey: ["/api/points", effectiveUserId],
    enabled: !!effectiveUserId && !isDemoMode && (profile?.role === "student"),
  });

  const { data: transactions } = useQuery<PointTransaction[]>({
    queryKey: ["/api/points/transactions", effectiveUserId],
    enabled: !!effectiveUserId && !isDemoMode && (profile?.role === "student"),
  });

  const effectiveProfile = isDemoMode ? demoData?.profile : profile;
  const effectivePoints = isDemoMode && demoRole === "student" ? (demoData as typeof DEMO_DATA.student)?.points : pointsData;
  const effectiveRole = isDemoMode ? demoRole : profile?.role;
  const isStudent = effectiveRole === "student";

  const [bio, setBio] = useState("");
  const [goals, setGoals] = useState("");

  useEffect(() => {
    if (effectiveProfile) {
      setBio(effectiveProfile.bio || "");
      setGoals(effectiveProfile.goals || "");
    }
  }, [effectiveProfile]);

  const updateMutation = useMutation({
    mutationFn: async (data: { bio: string; goals: string }) => {
      if (!profile?.role) {
        throw new Error("Profile role not available");
      }
      return apiRequest("POST", "/api/profiles", {
        userId: effectiveUserId,
        role: profile.role,
        bio: data.bio,
        goals: data.goals,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles", effectiveUserId] });
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados",
      });
    },
  });

  const totalPoints = effectivePoints?.totalPoints || 0;
  const MAX_POINTS = 680;
  const progressPercent = Math.min((totalPoints / MAX_POINTS) * 100, 100);

  const rewards = [
    { ...REWARDS.HEALTHY_SNACKS_PDF, icon: Gift, unlocked: totalPoints >= 100 },
    { ...REWARDS.SECRET_AB_ROUTINE, icon: Star, unlocked: totalPoints >= 300 },
    { ...REWARDS.DISCOUNT_COUPON, icon: Trophy, unlocked: totalPoints >= 680 },
  ];

  if (profileLoading && !isDemoMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!effectiveProfile && !isDemoMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold neon-gradient-text">Mi Perfil</h1>
          <p className="text-muted-foreground text-sm">Gestiona tu información personal</p>
        </div>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full neon-gradient flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split("@")[0] || "Usuario Demo"}
              </h2>
              <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {user?.email || "demo@example.com"}
              </p>
              <Badge variant="outline" className="mt-2 neon-border">
                {effectiveRole === "trainer" ? "Entrenador" : "Alumno"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {isStudent && (
        <>
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Sistema de Puntos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted/30"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercent * 3.52} 352`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00FF41" />
                        <stop offset="100%" stopColor="#00D4FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold neon-gradient-text">{totalPoints}</span>
                    <span className="text-xs text-muted-foreground">/ {MAX_POINTS} pts</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {MAX_POINTS - totalPoints > 0 
                    ? `Te faltan ${MAX_POINTS - totalPoints} puntos para el premio máximo`
                    : "¡Has alcanzado el nivel máximo!"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-primary">{effectivePoints?.workoutsCompleted || 0}</p>
                  <p className="text-xs text-muted-foreground">Entrenamientos</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-primary">{effectivePoints?.checkinsCompleted || 0}</p>
                  <p className="text-xs text-muted-foreground">Check-ins</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-primary">{effectivePoints?.discountCouponsEarned || 0}</p>
                  <p className="text-xs text-muted-foreground">Cupones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Premios Desbloqueados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rewards.map((reward, index) => {
                  const Icon = reward.icon;
                  return (
                    <div 
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        reward.unlocked 
                          ? "bg-primary/10 neon-border" 
                          : "bg-muted/20 opacity-60"
                      }`}
                      data-testid={`reward-item-${index}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        reward.unlocked ? "neon-gradient" : "bg-muted"
                      }`}>
                        {reward.unlocked ? (
                          <Icon className="w-6 h-6 text-black" />
                        ) : (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{reward.name}</p>
                        <p className="text-sm text-muted-foreground">{reward.points} puntos</p>
                      </div>
                      {reward.unlocked && (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntanos sobre ti..."
              className="resize-none"
              data-testid="input-bio"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="goals" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Objetivos
            </Label>
            <Textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder={isStudent ? "¿Cuáles son tus metas de fitness?" : "¿Cuál es tu enfoque como entrenador?"}
              className="resize-none"
              data-testid="input-goals"
            />
          </div>

          <Button 
            className="w-full neon-gradient text-black font-bold"
            onClick={() => updateMutation.mutate({ bio, goals })}
            disabled={updateMutation.isPending || isDemoMode}
            data-testid="button-save-profile"
          >
            {isDemoMode ? "Modo Demo - No se guardan cambios" : (updateMutation.isPending ? "Guardando..." : "Guardar Cambios")}
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        © 2026 Constanza Botti. Todos los derechos reservados.
      </p>
    </div>
  );
}
