export const SUBSCRIPTION_PLANS = {
  FREE_TIER: { 
    id: "free",
    name: "Plan Starter / Academia", 
    maxStudents: 3, 
    price: 0 
  },
  PRO_TIER: { 
    id: "pro",
    name: "Plan Pro Coach", 
    maxStudents: 15, 
    price: 19 
  },
  ELITE_TIER: { 
    id: "elite",
    name: "Plan Elite Studio", 
    maxStudents: 999, 
    price: 49 
  }
} as const;

export type PlanId = "free" | "pro" | "elite";

export function getPlanByStudentCount(count: number) {
  if (count <= SUBSCRIPTION_PLANS.FREE_TIER.maxStudents) return SUBSCRIPTION_PLANS.FREE_TIER;
  if (count <= SUBSCRIPTION_PLANS.PRO_TIER.maxStudents) return SUBSCRIPTION_PLANS.PRO_TIER;
  return SUBSCRIPTION_PLANS.ELITE_TIER;
}

export function getPlanById(id: string) {
  return Object.values(SUBSCRIPTION_PLANS).find(p => p.id === id) ?? SUBSCRIPTION_PLANS.FREE_TIER;
}

export const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 15,
  elite: 999,
};

export const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "Hasta 3 alumnos activos",
    "Rutinas personalizadas",
    "Mensajería directa",
    "Pagos y seguimiento",
  ],
  pro: [
    "Hasta 15 alumnos activos",
    "Todo lo del plan Starter",
    "Alertas de bienestar",
    "Plantillas de rutinas",
    "Análisis de progreso",
  ],
  elite: [
    "Alumnos ilimitados",
    "Todo lo del plan Pro",
    "Acceso prioritario a nuevas funciones",
    "Soporte dedicado",
    "Marca personalizada (próximamente)",
  ],
};
