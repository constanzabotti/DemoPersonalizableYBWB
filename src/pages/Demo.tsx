import { useEffect } from "react";
import { useLocation } from "wouter";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { APP_NAME } from "@/config/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Users, 
  GraduationCap, 
  Dumbbell,
  Heart,
  Gift,
  CreditCard,
  MessageSquare,
  BookOpen,
  LayoutDashboard,
  User,
  ArrowRight,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { Link } from "wouter";

const DEMO_PAGES = {
  student: [
    { path: "/dashboard", name: "Panel Principal", icon: LayoutDashboard, description: "Vista del estudiante con rutinas asignadas" },
    { path: "/routines", name: "Mis Rutinas", icon: Dumbbell, description: "Rutinas de entrenamiento personalizadas" },
    { path: "/wellness", name: "Bienestar", icon: Heart, description: "Check-in diario de sueño, estrés y energía" },
    { path: "/rewards", name: "Recompensas", icon: Gift, description: "Sistema de puntos y premios" },
    { path: "/guides", name: "Educación", icon: BookOpen, description: "Guías de nutrición y fitness" },
    { path: "/chat", name: "Chat", icon: MessageSquare, description: "Mensajería con tu entrenador" },
    { path: "/payments", name: "Pagos", icon: CreditCard, description: "Historial y métodos de pago" },
    { path: "/profile", name: "Perfil", icon: User, description: "Información personal y puntos" },
  ],
  trainer: [
    { path: "/dashboard", name: "Panel Principal", icon: LayoutDashboard, description: "Vista del entrenador con estadísticas" },
    { path: "/routines", name: "Rutinas", icon: Dumbbell, description: "Crear y gestionar rutinas" },
    { path: "/students", name: "Alumnos", icon: Users, description: "Lista de estudiantes activos" },
    { path: "/guides", name: "Educación", icon: BookOpen, description: "Guías para compartir" },
    { path: "/chat", name: "Chat", icon: MessageSquare, description: "Mensajería con alumnos" },
    { path: "/payments", name: "Pagos", icon: CreditCard, description: "Gestión de cobros" },
    { path: "/profile", name: "Perfil", icon: User, description: "Información del entrenador" },
  ],
};

export default function Demo() {
  const { isDemoMode, demoRole, setDemoRole, enterDemoMode, exitDemoMode, isDemoEnabled } = useDemoMode();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isDemoEnabled) {
      setLocation("/");
      return;
    }
    if (!isDemoMode) {
      enterDemoMode();
    }
  }, [isDemoMode, isDemoEnabled, enterDemoMode, setLocation]);

  if (!isDemoEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="glass-card max-w-md">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-xl font-bold mb-2">Modo Demo No Disponible</h1>
            <p className="text-muted-foreground mb-4">
              El modo demo solo está disponible en el entorno de desarrollo.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pages = DEMO_PAGES[demoRole];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 neon-border">
            <Play className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">MODO DEMO ACTIVO</span>
          </div>
          
          <h1 className="text-4xl font-display font-black">
            <span className="neon-gradient-text notranslate" translate="no">{APP_NAME}</span>
          </h1>
          
          <p className="text-muted-foreground max-w-md mx-auto">
            Navega por todas las pantallas de la aplicación sin necesidad de iniciar sesión
          </p>
        </div>

        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-center">Selecciona el Tipo de Vista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={demoRole === "student" ? "default" : "outline"}
                className={`h-24 flex-col gap-2 ${demoRole === "student" ? "neon-gradient text-black" : ""}`}
                onClick={() => setDemoRole("student")}
                data-testid="button-demo-student"
              >
                <GraduationCap className="w-8 h-8" />
                <span className="font-bold">Vista Alumno</span>
              </Button>
              
              <Button
                variant={demoRole === "trainer" ? "default" : "outline"}
                className={`h-24 flex-col gap-2 ${demoRole === "trainer" ? "neon-gradient text-black" : ""}`}
                onClick={() => setDemoRole("trainer")}
                data-testid="button-demo-trainer"
              >
                <Users className="w-8 h-8" />
                <span className="font-bold">Vista Entrenador</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Pantallas Disponibles
              <Badge variant="outline" className="ml-auto">
                {demoRole === "student" ? "Alumno" : "Entrenador"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {pages.map((page) => {
                const Icon = page.icon;
                return (
                  <Link key={page.path} href={page.path}>
                    <div 
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover-elevate cursor-pointer transition-all group"
                      data-testid={`demo-link-${page.path.replace("/", "")}`}
                    >
                      <div className="w-12 h-12 rounded-lg neon-gradient flex items-center justify-center">
                        <Icon className="w-6 h-6 text-black" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{page.name}</p>
                        <p className="text-sm text-muted-foreground">{page.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              exitDemoMode();
              setLocation("/");
            }}
            data-testid="button-exit-demo"
          >
            Salir del Modo Demo
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © 2026 Constanza Botti. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
