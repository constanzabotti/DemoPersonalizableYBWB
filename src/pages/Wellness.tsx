import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Brain, Zap, CheckCircle2, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function RatingSelector({ value, onChange, icon: Icon, label, color = "primary" }: { 
  value: number; 
  onChange: (v: number) => void; 
  icon: React.ElementType;
  label: string;
  color?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`w-12 h-12 rounded-lg font-bold transition-all ${
              value === rating 
                ? 'neon-gradient text-black neon-glow-strong' 
                : 'bg-muted hover:bg-muted/80'
            }`}
            data-testid={`rating-${label.toLowerCase()}-${rating}`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Wellness() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sleepQuality, setSleepQuality] = useState(3);
  const [stressLevel, setStressLevel] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: todayCheckin, isLoading } = useQuery({
    queryKey: ['/api/wellness/today'],
  });

  const { data: history } = useQuery({
    queryKey: ['/api/wellness'],
  });

  const checkinMutation = useMutation({
    mutationFn: async (data: { sleepQuality: number; stressLevel: number; energyLevel: number; notes?: string }) => {
      const res = await apiRequest('POST', '/api/wellness/checkin', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/wellness'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wellness/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
      setSubmitted(true);
      toast({
        title: "+10 Puntos!",
        description: `Check-in completado. Intensidad recomendada: ${data.recommendedIntensity.toUpperCase()}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el check-in",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    checkinMutation.mutate({
      sleepQuality,
      stressLevel,
      energyLevel,
      notes: notes || undefined,
    });
  };

  const alreadyCheckedIn = !!todayCheckin || submitted;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold neon-gradient-text">Check-in de Bienestar</h1>
          <p className="text-muted-foreground text-sm">Ajustamos tu rutina según cómo te sientas hoy</p>
        </div>
      </div>

      {alreadyCheckedIn ? (
        <Card className="glass-card overflow-hidden">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full neon-gradient flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-black animate-checkmark" />
            </div>
            <h2 className="text-xl font-bold mb-2">Check-in Completado!</h2>
            <p className="text-muted-foreground mb-4">+10 puntos ganados</p>
            
            {(todayCheckin || checkinMutation.data) && (
              <div className="mt-6 p-4 rounded-xl bg-primary/10 neon-border inline-block">
                <p className="text-sm text-muted-foreground mb-1">Intensidad Recomendada para Hoy</p>
                <p className="text-2xl font-bold text-primary uppercase">
                  {(todayCheckin?.recommendedIntensity || checkinMutation.data?.recommendedIntensity)}
                </p>
              </div>
            )}

            <Link href="/dashboard">
              <Button className="mt-6 neon-gradient text-black font-semibold" data-testid="button-go-dashboard">
                Volver al Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              ¿Cómo te sientes hoy?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <RatingSelector 
              value={sleepQuality} 
              onChange={setSleepQuality} 
              icon={Moon} 
              label="Calidad de Sueño" 
            />
            <div className="text-xs text-muted-foreground -mt-4">1 = Muy mal, 5 = Excelente</div>

            <RatingSelector 
              value={stressLevel} 
              onChange={setStressLevel} 
              icon={Brain} 
              label="Nivel de Estrés" 
            />
            <div className="text-xs text-muted-foreground -mt-4">1 = Muy relajado, 5 = Muy estresado</div>

            <RatingSelector 
              value={energyLevel} 
              onChange={setEnergyLevel} 
              icon={Zap} 
              label="Nivel de Energía" 
            />
            <div className="text-xs text-muted-foreground -mt-4">1 = Sin energía, 5 = Lleno de energía</div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas adicionales (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="¿Cómo dormiste? ¿Alguna molestia?"
                className="w-full h-20 px-3 py-2 rounded-lg bg-input border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-notes"
              />
            </div>

            <Button 
              className="w-full neon-gradient text-black font-bold text-lg py-6"
              onClick={handleSubmit}
              disabled={checkinMutation.isPending}
              data-testid="button-submit-checkin"
            >
              {checkinMutation.isPending ? "Guardando..." : "Completar Check-in (+10 pts)"}
            </Button>
          </CardContent>
        </Card>
      )}

      {history && history.length > 0 && (
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Historial Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.slice(0, 7).map((checkin: any) => (
                <div key={checkin.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">{new Date(checkin.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1"><Moon className="w-3 h-3" /> {checkin.sleepQuality}</span>
                    <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> {checkin.stressLevel}</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {checkin.energyLevel}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded uppercase font-medium ${
                    checkin.recommendedIntensity === 'high' ? 'bg-primary/20 text-primary' :
                    checkin.recommendedIntensity === 'low' ? 'bg-destructive/20 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {checkin.recommendedIntensity}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
