import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Trophy, BookOpen, Dumbbell, Star, Lock, CheckCircle2, ArrowLeft, Sparkles, Flame } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

const REWARDS = [
  { 
    id: 1, 
    points: 100, 
    name: "Guía de Snacks Saludables", 
    description: "Recetas fáciles y nutritivas para antes y después del entreno",
    icon: BookOpen 
  },
  { 
    id: 2, 
    points: 300, 
    name: "Rutina AB Premium", 
    description: "Plan de entrenamiento avanzado de 4 semanas para abdomen",
    icon: Dumbbell 
  },
  { 
    id: 3, 
    points: 680, 
    name: "Sesión 1:1 con tu Trainer", 
    description: "30 minutos de coaching personalizado gratis",
    icon: Trophy 
  },
];

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

export default function Rewards() {
  const { data: points, isLoading } = useQuery({
    queryKey: ['/api/points'],
  });

  const { data: transactions } = useQuery({
    queryKey: ['/api/points/transactions'],
  });

  const totalPoints = points?.totalPoints || 0;
  const nextReward = REWARDS.find(r => totalPoints < r.points);
  const progressToNext = nextReward ? (totalPoints / nextReward.points) * 100 : 100;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold neon-gradient-text">Tus Recompensas</h1>
          <p className="text-muted-foreground text-sm">Gana puntos, desbloquea premios exclusivos</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card overflow-hidden">
          <CardContent className="py-8 flex flex-col items-center">
            <ProgressRing progress={Math.min(progressToNext, 100)} size={180} strokeWidth={12}>
              <div className="text-center">
                <p className="text-4xl font-bold neon-gradient-text animate-streak">{totalPoints}</p>
                <p className="text-xs text-muted-foreground uppercase">Puntos</p>
              </div>
            </ProgressRing>
            
            {nextReward && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">Próximo premio en</p>
                <p className="text-xl font-bold text-primary">{nextReward.points - totalPoints} pts</p>
                <p className="text-sm text-muted-foreground">{nextReward.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
              <Flame className="w-4 h-4 text-primary" /> Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-primary" />
                <span className="text-sm">Entrenamientos Completados</span>
              </div>
              <span className="font-bold text-primary">{points?.workoutsCompleted || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-sm">Check-ins de Bienestar</span>
              </div>
              <span className="font-bold text-primary">{points?.checkinsCompleted || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm">Recompensas Desbloqueadas</span>
              </div>
              <span className="font-bold text-primary">
                {REWARDS.filter(r => totalPoints >= r.points).length} / {REWARDS.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary animate-float" />
            Catalogo de Premios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {REWARDS.map((reward) => {
              const unlocked = totalPoints >= reward.points;
              const Icon = reward.icon;
              return (
                <div 
                  key={reward.id}
                  className={`relative p-6 rounded-xl transition-all ${
                    unlocked 
                      ? 'bg-primary/10 neon-border' 
                      : 'bg-muted/30 border border-border/50'
                  }`}
                >
                  {unlocked && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-6 h-6 text-primary animate-checkmark" />
                    </div>
                  )}
                  {!unlocked && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                    unlocked ? 'neon-gradient' : 'bg-muted'
                  }`}>
                    <Icon className={`w-7 h-7 ${unlocked ? 'text-black' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className={`font-bold mb-1 ${unlocked ? 'text-primary' : 'text-foreground'}`}>
                    {reward.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">{reward.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${unlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                      {reward.points} pts
                    </span>
                    {unlocked && (
                      <Button size="sm" className="neon-gradient text-black font-semibold" data-testid={`button-claim-${reward.id}`}>
                        Reclamar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" /> Como Ganar Puntos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <div className="w-10 h-10 rounded-lg neon-gradient flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="font-medium">Completar Entrenamiento</p>
                <p className="text-sm text-primary font-bold">+25 puntos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
              <div className="w-10 h-10 rounded-lg neon-gradient flex items-center justify-center">
                <Star className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="font-medium">Check-in Diario de Bienestar</p>
                <p className="text-sm text-primary font-bold">+10 puntos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {transactions && transactions.length > 0 && (
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Historial de Puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transactions.slice(0, 20).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div>
                    <p className="text-sm">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`font-bold ${tx.points > 0 ? 'text-primary' : 'text-destructive'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <footer className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30 notranslate" translate="no">
        &copy; you better work b*tch! - ALL RIGHTS RESERVED - Constanza Botti
      </footer>
    </div>
  );
}
