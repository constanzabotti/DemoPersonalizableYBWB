import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_PLANS, PLAN_FEATURES, type PlanId } from "@/config/plans";
import { Crown, Zap, Star, Check, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const PLAN_ICONS = {
  free: Star,
  pro: Zap,
  elite: Crown,
};

const PLAN_COLORS = {
  free: { border: "border-white/10", badge: "bg-white/10 text-white", glow: "", cta: "bg-white/10 hover:bg-white/20 text-white" },
  pro: { border: "border-[#39FF14]/40", badge: "bg-[#39FF14]/20 text-[#39FF14]", glow: "shadow-[0_0_30px_rgba(57,255,20,0.15)]", cta: "bg-[#39FF14] hover:bg-[#32e612] text-black" },
  elite: { border: "border-cyan-400/40", badge: "bg-cyan-400/20 text-cyan-400", glow: "shadow-[0_0_30px_rgba(34,211,238,0.15)]", cta: "bg-gradient-to-r from-[#39FF14] to-cyan-400 hover:opacity-90 text-black" },
};

export default function Plans() {
  const { toast } = useToast();
  const [confirmPlan, setConfirmPlan] = useState<PlanId | null>(null);

  const { data: studentCount } = useQuery<{ count: number; limit: number; isPremium: boolean; planId: string }>({
    queryKey: ['/api/trainer/students/count'],
  });

  const currentPlanId = (studentCount?.planId ?? "free") as PlanId;

  const setPlanMutation = useMutation({
    mutationFn: (planId: PlanId) => apiRequest("POST", "/api/trainer/plan", { planId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainer/students/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trainer/subscription'] });
      toast({ title: "¡Plan actualizado!", description: "Tu plan ha sido cambiado exitosamente." });
      setConfirmPlan(null);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo cambiar el plan.", variant: "destructive" });
    },
  });

  const handleSelectPlan = (planId: PlanId) => {
    if (planId === currentPlanId) return;
    if (planId === "free") {
      setConfirmPlan(planId);
    } else {
      alert("Simulación de pasarela Stripe / PayPal");
      setPlanMutation.mutate(planId);
    }
  };

  const plans = [
    SUBSCRIPTION_PLANS.FREE_TIER,
    SUBSCRIPTION_PLANS.PRO_TIER,
    SUBSCRIPTION_PLANS.ELITE_TIER,
  ];

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold">
          <span className="neon-gradient-text">Planes y Suscripción</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Elige el plan que mejor se adapte a tu negocio fitness.
        </p>
      </div>

      {studentCount && (
        <div className="glass-card p-4 rounded-xl border border-[#39FF14]/20 flex items-center gap-4">
          <div className="p-2 rounded-xl bg-[#39FF14]/10">
            <Users className="w-5 h-5 text-[#39FF14]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {studentCount.count} / {studentCount.limit === 999 ? "∞" : studentCount.limit} alumnos activos
            </p>
            <p className="text-xs text-muted-foreground">
              Plan actual: <span className="text-[#39FF14] font-bold">{plans.find(p => p.id === currentPlanId)?.name}</span>
            </p>
          </div>
          <div className="ml-auto">
            <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#39FF14] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (studentCount.count / (studentCount.limit === 999 ? Math.max(studentCount.count, 1) : studentCount.limit)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const pid = plan.id as PlanId;
          const colors = PLAN_COLORS[pid];
          const Icon = PLAN_ICONS[pid];
          const isActive = currentPlanId === pid;
          const features = PLAN_FEATURES[pid];

          return (
            <div
              key={plan.id}
              data-testid={`card-plan-${plan.id}`}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-300 ${colors.border} ${colors.glow} ${isActive ? "bg-white/5" : "bg-[#0a0a0a]"}`}
            >
              {pid === "pro" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#39FF14] text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Más popular
                  </span>
                </div>
              )}

              {isActive && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30 text-xs font-bold">
                    Activo
                  </Badge>
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colors.badge}`}>
                <Icon className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">
                {plan.name}
              </h3>

              <div className="mb-4">
                {plan.price === 0 ? (
                  <span className="text-3xl font-black text-white">Gratis</span>
                ) : (
                  <>
                    <span className="text-3xl font-black text-white">${plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                {plan.maxStudents === 999 ? "Alumnos ilimitados" : `Hasta ${plan.maxStudents} alumnos`}
              </p>

              <ul className="space-y-2 flex-1 mb-6">
                {features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-[#39FF14] mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Button
                data-testid={`button-select-plan-${plan.id}`}
                disabled={isActive || setPlanMutation.isPending}
                onClick={() => handleSelectPlan(pid)}
                className={`w-full font-extrabold uppercase tracking-wider transition-all ${isActive ? "opacity-50 cursor-not-allowed bg-white/10 text-white" : colors.cta}`}
              >
                {isActive ? "Plan actual" : plan.price === 0 ? "Cambiar a Starter" : `Activar ${plan.name.split(" ")[1]}`}
              </Button>
            </div>
          );
        })}
      </div>

      {confirmPlan === "free" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
            <h3 className="text-xl font-black text-white uppercase mb-3">¿Cambiar a plan Starter?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Al bajar al plan Starter solo podrás tener <span className="text-white font-bold">3 alumnos activos</span>. Los alumnos actuales no se eliminarán, pero perderás acceso a las funciones premium.
            </p>
            <div className="flex gap-3">
              <Button
                data-testid="button-confirm-downgrade"
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold uppercase"
                onClick={() => setPlanMutation.mutate("free")}
                disabled={setPlanMutation.isPending}
              >
                Confirmar
              </Button>
              <Button
                data-testid="button-cancel-downgrade"
                variant="ghost"
                className="flex-1 text-gray-500 hover:text-white"
                onClick={() => setConfirmPlan(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
