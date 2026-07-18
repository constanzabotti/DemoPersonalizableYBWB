import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/hooks/use-fit-track";
import { Dumbbell, GraduationCap, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function OnboardingModal() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const [selectedRole, setSelectedRole] = useState<"trainer" | "student" | null>(null);

  // Don't show if loading or if profile already exists
  if (isLoading || profile) return null;

  const handleConfirm = () => {
    if (!user || !selectedRole) return;
    updateProfile.mutate({
      userId: user.id,
      role: selectedRole,
      bio: "I'm new here!",
      goals: "To get fit"
    });
  };

  return (
    <Dialog open={!profile && !!user}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-center">Bienvenido a You better work b*tch</DialogTitle>
          <DialogDescription className="text-center">
            ¿Cómo usarás la plataforma? Esto nos ayuda a personalizar tu experiencia.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div 
            onClick={() => setSelectedRole("student")}
            className={cn(
              "cursor-pointer rounded-2xl border-2 p-4 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 relative",
              selectedRole === "student" ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "border-border"
            )}
          >
            {selectedRole === "student" && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-4 h-4" /></div>}
            <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-1">Alumno</h3>
            <p className="text-xs text-muted-foreground">Quiero ver mis rutinas y seguir mi progreso.</p>
          </div>

          <div 
            onClick={() => setSelectedRole("trainer")}
            className={cn(
              "cursor-pointer rounded-2xl border-2 p-4 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 relative",
              selectedRole === "trainer" ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "border-border"
            )}
          >
            {selectedRole === "trainer" && <div className="absolute top-2 right-2 text-primary"><CheckCircle2 className="w-4 h-4" /></div>}
            <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-1">Entrenador</h3>
            <p className="text-xs text-muted-foreground">Quiero crear rutinas y gestionar alumnos.</p>
          </div>
        </div>

        <Button 
          className="w-full py-6 text-lg font-bold" 
          size="lg"
          disabled={!selectedRole || updateProfile.isPending}
          onClick={handleConfirm}
        >
          {updateProfile.isPending ? "Configurando..." : "Comenzar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
