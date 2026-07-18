import { useAuth } from "@/hooks/use-auth";
import { useProfile, useRoutines } from "@/hooks/use-fit-track";
import { useDemoMode, DEMO_DATA } from "@/hooks/use-demo-mode";
import { APP_NAME } from "@/config/theme";
import { CreateRoutineModal } from "@/components/CreateRoutineModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Users, ArrowRight, BookOpen, Moon, Brain, Zap, Trophy, Gift, TrendingUp, CheckCircle2, Crown, AlertTriangle, Clock, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { StudentAlert } from "@shared/schema";

function ProgressRing({ progress, size = 120, strokeWidth = 8, children }: { progress: number; size?: number; strokeWidth?: number; children?: React.ReactNode }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="progress-ring" width={size} height={size}>
        <circle
          className="stroke-muted"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="stroke-primary"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ filter: 'drop-shadow(0 0 6px rgba(0, 255, 65, 0.5))' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function WellnessIndicator({ label, icon: Icon, value, max = 5 }: { label: string; icon: React.ElementType; value: number; max?: number }) {
  const percentage = (value / max) * 100;
  return (
    <div className="flex flex-col items-center gap-2">
      <ProgressRing progress={percentage} size={60} strokeWidth={4}>
        <Icon className="w-5 h-5 text-primary" />
      </ProgressRing>
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { isDemoMode, demoRole } = useDemoMode();
  const [showFlash, setShowFlash] = useState(false);

  const demoData = isDemoMode ? DEMO_DATA[demoRole] : null;

  const { data: points } = useQuery<{ totalPoints: number; workoutsCompleted: number; checkinsCompleted: number }>({
    queryKey: ['/api/points'],
    enabled: !isDemoMode && !!profile && profile.role === 'student',
  });

  const { data: todayCheckin } = useQuery({
    queryKey: ['/api/wellness/today'],
    enabled: !isDemoMode && !!profile && profile.role === 'student',
  });

  const { data: leaderboard } = useQuery<{ rank: number; points: number; studentId: string }[]>({
    queryKey: ['/api/leaderboard'],
    enabled: !isDemoMode && !!profile && profile.role === 'student',
  });

  const { data: alerts } = useQuery<StudentAlert[]>({
    queryKey: ['/api/trainer/alerts'],
    enabled: !isDemoMode && !!profile && profile.role === 'trainer',
  });

  const { data: routines } = useRoutines({
    role: isDemoMode ? demoRole : (profile?.role || 'student'),
    userId: user?.id || '',
    enabled: !isDemoMode,
  });

  const effectiveProfile = isDemoMode ? demoData?.profile : profile;
  const effectivePoints = isDemoMode && demoRole === "student" ? (demoData as typeof DEMO_DATA.student)?.points : points;
  const effectiveRoutines = isDemoMode ? demoData?.routines : routines;

  const REWARDS = [
    { points: 100, name: "Guía de Snacks", icon: BookOpen },
    { points: 300, name: "Rutina AB Premium", icon: Dumbbell },
    { points: 680, name: "Sesión 1:1 Gratis", icon: Trophy },
  ];

  const nextReward = REWARDS.find(r => (effectivePoints?.totalPoints || 0) < r.points);
  const progressToNextReward = nextReward 
    ? Math.min(100, ((effectivePoints?.totalPoints || 0) / nextReward.points) * 100)
    : 100;

  if (!effectiveProfile && !isDemoMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isTrainer = isDemoMode ? demoRole === "trainer" : profile?.role === "trainer";
  const todaysRoutine = effectiveRoutines?.[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="neon-gradient-text notranslate" translate="no">{APP_NAME}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {isTrainer ? "¿Listo para inspirar a tus alumnos?" : `Hola, ${user?.firstName || 'Atleta'}. A entrenar.`}
          </p>
        </div>
        {isTrainer && <CreateRoutineModal />}
      </div>

      {!isTrainer && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card className={`glass-card overflow-hidden col-span-1 ${showFlash ? 'animate-neon-flash' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Entrenamiento de Hoy</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <ProgressRing progress={todaysRoutine ? 0 : 0} size={140} strokeWidth={10}>
                <Dumbbell className="w-12 h-12 text-primary animate-float" />
              </ProgressRing>
              <p className="mt-4 text-sm text-muted-foreground">
                {todaysRoutine ? todaysRoutine.title : "Sin rutina asignada"}
              </p>
              {todaysRoutine && (
                <Link href={`/routines/${todaysRoutine.id}`}>
                  <Button className="mt-4 neon-gradient text-black font-semibold" data-testid="button-start-workout">
                    COMENZAR
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" /> Gana tu Recompensa
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <Gift className="w-16 h-16 text-primary animate-float" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 65, 0.4))' }} />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Puntos:</span>
                  <span className="font-bold text-primary animate-streak">{effectivePoints?.totalPoints || 0} pts</span>
                </div>
                {nextReward && (
                  <>
                    <div className={`h-2 bg-muted rounded-full overflow-hidden ${(nextReward.points - (effectivePoints?.totalPoints || 0)) <= 50 ? 'progress-urgent' : ''}`}>
                      <div 
                        className="h-full neon-gradient transition-all duration-500" 
                        style={{ width: `${progressToNextReward}%` }}
                      />
                    </div>
                    <p className={`text-xs text-center ${(nextReward.points - (effectivePoints?.totalPoints || 0)) <= 50 ? 'text-primary font-bold animate-neon-pulse' : 'text-muted-foreground'}`}>
                      {(nextReward.points - (effectivePoints?.totalPoints || 0)) <= 50 ? '¡Ya casi!' : ''} {nextReward.points - (effectivePoints?.totalPoints || 0)} pts para {nextReward.name}
                    </p>
                  </>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {REWARDS.map((reward) => {
                  const unlocked = (effectivePoints?.totalPoints || 0) >= reward.points;
                  return (
                    <div key={reward.points} className={`flex items-center gap-2 p-2 rounded-lg ${unlocked ? 'bg-primary/10 neon-border' : 'bg-muted/30'}`}>
                      <reward.icon className={`w-4 h-4 ${unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs flex-1 ${unlocked ? 'text-primary' : 'text-muted-foreground'}`}>{reward.name}</span>
                      <span className="text-xs text-muted-foreground">{reward.points} pts</span>
                      {unlocked && <CheckCircle2 className="w-4 h-4 text-primary animate-checkmark" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <div className="grid grid-cols-3 gap-4">
                <WellnessIndicator 
                  label="Sueño" 
                  icon={Moon} 
                  value={(todayCheckin as any)?.sleepQuality || (isDemoMode ? 4 : 0)} 
                />
                <WellnessIndicator 
                  label="Estrés" 
                  icon={Brain} 
                  value={(todayCheckin as any)?.stressLevel ? 6 - (todayCheckin as any).stressLevel : (isDemoMode ? 4 : 0)} 
                />
                <WellnessIndicator 
                  label="Energía" 
                  icon={Zap} 
                  value={(todayCheckin as any)?.energyLevel || (isDemoMode ? 4 : 0)} 
                />
              </div>
              {!todayCheckin && !isDemoMode && (
                <Link href="/wellness">
                  <Button variant="outline" className="w-full mt-4 neon-border" data-testid="button-checkin">
                    Hacer Check-in Diario
                  </Button>
                </Link>
              )}
              {(todayCheckin || isDemoMode) && (
                <div className="mt-4 p-3 rounded-lg bg-primary/10 neon-border text-center">
                  <p className="text-xs text-muted-foreground">Intensidad Recomendada</p>
                  <p className="text-lg font-bold text-primary uppercase">{(todayCheckin as any)?.recommendedIntensity || "MEDIUM"}</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Racha de Entrenos</span>
                <span className="font-bold text-primary animate-streak">{effectivePoints?.workoutsCompleted || 0} dias</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isTrainer && leaderboard && leaderboard.length > 0 && (
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" /> Tabla de Clasificación
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <div className="space-y-2">
              {leaderboard.map((entry, idx) => {
                const isCurrentUser = entry.studentId === user?.id;
                const rankClass = idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : 'bg-muted';
                return (
                  <div 
                    key={entry.studentId}
                    className={`flex items-center gap-3 p-3 rounded-lg animate-leaderboard ${isCurrentUser ? 'neon-border bg-primary/10' : 'bg-muted/30'}`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black ${rankClass}`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {isCurrentUser ? '¡Tú!' : `Atleta #${entry.rank}`}
                      </p>
                    </div>
                    <div className="text-primary font-bold animate-streak">
                      {entry.points} pts
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Compite con otros atletas y alcanza el top 5
            </p>
          </CardContent>
        </Card>
      )}

      {isTrainer && alerts && alerts.length > 0 && (
        <Card className="bg-neutral-950 border-red-500/30 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.05)]">
          <CardHeader className="pb-3 border-b border-neutral-900 bg-neutral-900/20">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center justify-between text-red-500">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 animate-bounce text-red-500" /> 
                SISTEMA DE ALERTAS CRÍTICAS
              </span>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-black text-white animate-pulse">
                {alerts.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-5 bg-black/40">
            <div className="space-y-3">
              {[...alerts]
                .sort((a, b) => {
                  const severity = (al: StudentAlert) =>
                    al.alertType === "high_stress" ? (al.stressLevel || 0) + 5 : 4;
                  return severity(b) - severity(a);
                })
                .map((alert, idx) => {
                  const isHighStress = alert.alertType === "high_stress";
                  const severityClass = isHighStress && (alert.stressLevel || 0) >= 4
                    ? "border-l-red-500 bg-red-950/20 border-red-900/40"
                    : isHighStress
                    ? "border-l-orange-500 bg-orange-950/20 border-orange-900/40"
                    : "border-l-yellow-500 bg-neutral-900 border-neutral-800";
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-4 rounded-2xl border border-l-4 ${severityClass} animate-in fade-in slide-in-from-left-3 duration-300`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isHighStress ? "bg-orange-500/10" : "bg-yellow-500/10"}`}>
                          {isHighStress ? (
                            <Zap className="w-4 h-4 text-orange-400 stroke-[2.5]" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-400 stroke-[2.5]" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-neutral-100 tracking-tight">{alert.studentName}</p>
                          <p className="text-xs text-neutral-400 font-medium mt-0.5">
                            {isHighStress
                              ? `Riesgo de sobrecarga: Estrés ${alert.stressLevel}/5`
                              : "Inactividad extrema: +72 horas sin entrenar"}
                          </p>
                        </div>
                      </div>
                      <Link href={`/chat?contact=${alert.studentId}`}>
                        <Button
                          size="sm"
                          className="h-10 px-4 rounded-xl neon-gradient text-black font-extrabold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:scale-105 transition-transform"
                          data-testid={`button-dashboard-alert-${alert.studentId}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" /> 
                          {isHighStress ? "AJUSTAR CARGA" : "REVERTIR BAJA"}
                        </Button>
                      </Link>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card overflow-hidden group card-hover-lift">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Dumbbell className="w-5 h-5 text-primary" /> 
              {isTrainer ? "Gestionar Rutinas" : "Mis Rutinas"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {isTrainer 
                ? "Crea y asigna nuevos planes de entrenamiento." 
                : "Revisa tus rutinas asignadas."}
            </p>
            <Link href="/routines">
              <Button className="w-full justify-between neon-gradient text-black font-semibold" data-testid="link-routines">
                Ver Todas <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {isTrainer ? (
          <Card className="glass-card overflow-hidden group card-hover-lift">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Users className="w-5 h-5 text-primary" /> Mis Alumnos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sigue el progreso y gestiona perfiles.
              </p>
              <Link href="/students">
                <Button className="w-full justify-between neon-gradient text-black font-semibold" data-testid="link-students">
                  Ver Roster <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card overflow-hidden group card-hover-lift">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <BookOpen className="w-5 h-5 text-primary" /> Guias Educativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Aprende sobre IMC, nutricion y tecnicas.
              </p>
              <Link href="/guides">
                <Button className="w-full justify-between neon-gradient text-black font-semibold" data-testid="link-guides">
                  Explorar <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card overflow-hidden group card-hover-lift">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Trophy className="w-5 h-5 text-primary" /> {isTrainer ? "Pagos" : "Recompensas"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {isTrainer ? "Gestiona cobros y suscripciones." : "Canjea puntos por premios exclusivos."}
            </p>
            <Link href={isTrainer ? "/payments" : "/rewards"}>
              <Button className="w-full justify-between neon-gradient text-black font-semibold" data-testid="link-rewards">
                {isTrainer ? "Ver Pagos" : "Ver Premios"} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="neon-border rounded-2xl p-6 text-center bg-primary/5">
        <blockquote className="font-display text-xl md:text-2xl font-bold">
          <span className="neon-gradient-text">"YOU BETTER WORK, B*TCH!"</span>
        </blockquote>
        <p className="text-muted-foreground mt-2 text-sm">No te rindas. Cada gota de sudor cuenta.</p>
      </div>

      <footer className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30 notranslate" translate="no">
        &copy; you better work b*tch! - ALL RIGHTS RESERVED - Constanza Botti
      </footer>
    </div>
  );
}
