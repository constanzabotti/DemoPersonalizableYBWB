import { useRoutine } from "@/hooks/use-fit-track";
import { useAuth } from "@/hooks/use-auth";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, RotateCcw, Weight, Sparkles, Trophy } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ExerciseCompletion } from "@shared/schema";

function CelebrationOverlay({ show, onComplete }: { show: boolean; onComplete: () => void }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-celebration">
        <div className="w-32 h-32 rounded-full neon-gradient flex items-center justify-center">
          <Sparkles className="w-16 h-16 text-black" />
        </div>
      </div>
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-confetti"
            style={{
              left: `${10 + (i * 7)}%`,
              top: '-20px',
              backgroundColor: i % 2 === 0 ? '#00FF41' : '#00FFFF',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function RoutineDetail() {
  const [, params] = useRoute("/routines/:id");
  const routineId = Number(params?.id);
  const { data: routine, isLoading } = useRoutine(routineId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCelebration, setShowCelebration] = useState(false);
  const [justCompleted, setJustCompleted] = useState<number | null>(null);

  const { data: completions } = useQuery<ExerciseCompletion[]>({
    queryKey: ['/api/exercises/completions', routineId],
    queryFn: async () => {
      const res = await fetch(`/api/exercises/completions/${routineId}`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!routineId,
  });

  const completeMutation = useMutation({
    mutationFn: async (exerciseId: number) => {
      return apiRequest("POST", "/api/exercises/complete", { routineId, exerciseId });
    },
    onSuccess: (_, exerciseId) => {
      setJustCompleted(exerciseId);
      setShowCelebration(true);
      queryClient.invalidateQueries({ queryKey: ['/api/exercises/completions', routineId] });
      toast({
        title: "¡Ejercicio completado!",
        description: "Sigue así, estás destruyéndola.",
      });
    },
  });

  const completeWorkoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/workouts/complete", { routineId });
    },
    onSuccess: () => {
      toast({
        title: "¡Entrenamiento Completado!",
        description: "+25 puntos ganados. You better work, b*tch!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
    },
  });

  const isExerciseCompleted = (exerciseId: number) => {
    return completions?.some(c => c.exerciseId === exerciseId);
  };

  const allExercisesCompleted = routine?.exercises.every(ex => isExerciseCompleted(ex.id));
  const completedCount = completions?.length || 0;
  const totalExercises = routine?.exercises.length || 0;
  const progressPercent = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!routine) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Rutina no encontrada</p>
      </div>
    );
  }

  const groupedExercises = routine.exercises.reduce((acc, ex) => {
    if (!acc[ex.day]) acc[ex.day] = [];
    acc[ex.day].push(ex);
    return acc;
  }, {} as Record<string, typeof routine.exercises>);

  Object.keys(groupedExercises).forEach(day => {
    groupedExercises[day].sort((a, b) => a.order - b.order);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <CelebrationOverlay show={showCelebration} onComplete={() => setShowCelebration(false)} />
      
      <div className="glass-card rounded-3xl p-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <Badge className="mb-2 neon-gradient text-black">Plan Activo</Badge>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">{routine.title}</h1>
            <p className="text-muted-foreground text-lg">{routine.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progreso</p>
            <p className="text-2xl font-bold text-primary">{completedCount}/{totalExercises}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className={`h-3 bg-muted rounded-full overflow-hidden ${progressPercent >= 80 ? 'progress-urgent' : ''}`}>
            <div 
              className="h-full neon-gradient transition-all duration-700 ease-out" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {allExercisesCompleted && (
          <Button 
            className="w-full mt-6 neon-gradient text-black font-bold text-lg py-6 btn-interactive"
            onClick={() => completeWorkoutMutation.mutate()}
            disabled={completeWorkoutMutation.isPending}
            data-testid="button-complete-workout"
          >
            <Trophy className="w-5 h-5 mr-2" />
            {completeWorkoutMutation.isPending ? "Completando..." : "¡COMPLETAR ENTRENAMIENTO! (+25 pts)"}
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(groupedExercises).map(([day, exercises]) => (
          <div key={day} className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-display font-bold mb-4 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
              <span className="neon-gradient-text">{day}</span>
            </h2>
            <div className="grid gap-4">
              {exercises.map((ex) => {
                const completed = isExerciseCompleted(ex.id);
                const wasJustCompleted = justCompleted === ex.id;
                
                return (
                  <Card 
                    key={ex.id} 
                    className={`overflow-hidden transition-all duration-500 ${
                      completed 
                        ? 'border-l-4 border-l-primary bg-primary/5 neon-border' 
                        : 'border-l-4 border-l-muted glass-card card-hover-lift'
                    } ${wasJustCompleted ? 'animate-neon-flash' : ''}`}
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className={`font-bold text-lg ${completed ? 'text-primary' : ''}`}>
                              {ex.exerciseName}
                            </h3>
                            {completed && (
                              <CheckCircle2 className="w-5 h-5 text-primary animate-checkmark" />
                            )}
                          </div>
                          {ex.notes && <p className="text-sm text-muted-foreground italic mt-1">"{ex.notes}"</p>}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 md:gap-4">
                          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                            <RotateCcw className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono font-semibold">{ex.sets}</span>
                            <span className="text-xs text-muted-foreground uppercase">Sets</span>
                          </div>
                          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono font-semibold">{ex.reps}</span>
                            <span className="text-xs text-muted-foreground uppercase">Reps</span>
                          </div>
                          {ex.weight && (
                            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                              <Weight className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono font-semibold">{ex.weight}</span>
                            </div>
                          )}
                          {ex.rest && (
                            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono font-semibold">{ex.rest}</span>
                            </div>
                          )}
                          
                          {!completed && (
                            <Button 
                              size="sm"
                              className="neon-gradient text-black font-semibold btn-interactive"
                              onClick={() => completeMutation.mutate(ex.id)}
                              disabled={completeMutation.isPending}
                              data-testid={`button-complete-exercise-${ex.id}`}
                            >
                              <Sparkles className="w-4 h-4 mr-1" />
                              ¡Listo!
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            <Separator className="my-8" />
          </div>
        ))}
      </div>

      <footer className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30 notranslate" translate="no">
        &copy; you better work b*tch! - ALL RIGHTS RESERVED - Constanza Botti
      </footer>
    </div>
  );
}
