import { useState } from "react";
import { useStudents } from "@/hooks/use-fit-track";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Trophy, Zap, AlertTriangle, Clock, Users, Crown } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { StudentAlert } from "@shared/schema";
import { getPlanById } from "@/config/plans";

export default function Students() {
  const { data: students, isLoading } = useStudents();
  const [upgradeTriggered, setUpgradeTriggered] = useState(false);

  const { data: alerts } = useQuery<StudentAlert[]>({
    queryKey: ['/api/trainer/alerts'],
  });

  const { data: studentCount } = useQuery<{ count: number; limit: number; isPremium: boolean; planId: string }>({
    queryKey: ['/api/trainer/students/count'],
  });

  const getStudentAlert = (studentId: string) => {
    return alerts?.find(a => a.studentId === studentId);
  };

  const currentPlanId = studentCount?.planId ?? "free";
  const currentPlan = getPlanById(currentPlanId);
  const totalCurrentStudents = students?.length ?? 0;
  const limit = studentCount?.limit ?? currentPlan.maxStudents;
  const atLimit = totalCurrentStudents >= limit;

  const handleBeforeAddStudent = () => {
    if (atLimit) {
      setUpgradeTriggered(true);
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="neon-gradient-text">Mis Alumnos</span>
          </h1>
          <p className="text-muted-foreground">Gestiona y motiva a tus atletas.</p>
        </div>

        {studentCount && (
          <div
            data-testid="badge-plan-limit"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#39FF14]/20 bg-[#39FF14]/5 cursor-pointer shrink-0"
            onClick={() => atLimit && setUpgradeTriggered(true)}
          >
            <Users className="w-4 h-4 text-[#39FF14]" />
            <span className="text-sm font-bold text-white">
              {totalCurrentStudents}
              <span className="text-muted-foreground font-normal"> / </span>
              {limit === 999 ? "∞" : limit}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">alumnos</span>
            {atLimit && (
              <span className="ml-1 text-xs font-bold text-orange-400 uppercase">Límite</span>
            )}
          </div>
        )}
      </div>

      {atLimit && (
        <Card className="glass-card border-orange-400/30 bg-orange-400/5">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <p className="font-bold text-sm text-white">
                  Has llegado al límite de {limit} alumnos del <span className="text-[#39FF14]">{currentPlan.name}</span>
                </p>
                <p className="text-xs text-muted-foreground">Sube de plan para seguir creciendo sin límites.</p>
              </div>
            </div>
            <Button
              data-testid="button-upgrade-banner"
              size="sm"
              className="shrink-0 bg-[#39FF14] hover:bg-[#32e612] text-black font-extrabold uppercase tracking-wide"
              onClick={() => setUpgradeTriggered(true)}
            >
              Subir plan
            </Button>
          </CardContent>
        </Card>
      )}

      {alerts && alerts.length > 0 && (
        <Card className="glass-card border-destructive/50 alert-critical">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="font-bold text-destructive">Alertas Críticas</h3>
            </div>
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                  <div className="flex items-center gap-3">
                    {alert.alertType === "high_stress" ? (
                      <Zap className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{alert.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.alertType === "high_stress"
                          ? `Estrés nivel ${alert.stressLevel}/5 - ${alert.checkinDate}`
                          : `Sin actividad por más de 72 horas`
                        }
                      </p>
                    </div>
                  </div>
                  <Link href={`/chat?contact=${alert.studentId}`}>
                    <Button size="sm" className="neon-gradient text-black btn-interactive" data-testid={`button-alert-message-${alert.studentId}`}>
                      <MessageCircle className="w-4 h-4 mr-1" /> Motivar
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {students?.map((student) => {
              const alert = getStudentAlert(student.id || '');
              return (
                <Card
                  key={student.id}
                  data-testid={`card-student-${student.id}`}
                  className={`glass-card card-hover-lift overflow-hidden ${alert ? 'border-destructive/30' : ''}`}
                >
                  <div className="h-16 neon-gradient opacity-80" />
                  <CardContent className="-mt-10 pt-0 text-center">
                    <div className="relative inline-block">
                      <Avatar className="w-20 h-20 border-4 border-background mx-auto mb-3">
                        <AvatarImage src={student.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xl bg-muted font-bold neon-gradient-text">
                          {student.firstName?.charAt(0) || student.email?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {alert && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-lg mb-1">
                      {student.firstName || 'Alumno'} {student.lastName || ''}
                    </h3>

                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-primary font-bold animate-streak">-- pts</span>
                    </div>

                    <Link href={`/chat?contact=${student.id}`}>
                      <Button className="w-full neon-gradient text-black font-semibold btn-interactive gap-2" data-testid={`button-message-${student.id}`}>
                        <MessageCircle className="w-4 h-4" /> Enviar Mensaje
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}

            <Card
              data-testid="card-add-student"
              className={`glass-card overflow-hidden border-dashed transition-all cursor-pointer ${atLimit ? 'border-orange-400/30 opacity-60' : 'border-primary/30 hover:border-primary/60 card-hover-lift'}`}
              onClick={handleBeforeAddStudent}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-center p-6">
                {atLimit ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-orange-400/10 border border-orange-400/30 flex items-center justify-center">
                      <Crown className="w-7 h-7 text-orange-400" />
                    </div>
                    <p className="text-sm font-bold text-orange-400 uppercase tracking-wide">Límite alcanzado</p>
                    <p className="text-xs text-muted-foreground">Sube tu plan para agregar más alumnos</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-3xl font-thin text-primary">
                      +
                    </div>
                    <p className="text-sm text-muted-foreground">Agregar alumno</p>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {upgradeTriggered && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] border border-[#39FF14]/30 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(57,255,20,0.1)]">
            <div className="w-16 h-16 bg-[#39FF14]/10 text-[#39FF14] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#39FF14]/20">
              <Crown className="h-8 w-8" />
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-2">
              ¡Tu negocio está creciendo! 🚀
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Has alcanzado el límite máximo de{" "}
              <span className="text-[#39FF14] font-bold">{limit} alumnos</span> de tu{" "}
              <span className="text-white font-semibold">{currentPlan.name}</span>. Para seguir
              agregando atletas sin límites, sube de nivel.
            </p>

            <div className="space-y-3">
              <Link href="/plans">
                <button
                  data-testid="button-upgrade-pro"
                  className="w-full py-3 bg-[#39FF14] text-black font-extrabold uppercase rounded-xl tracking-wider hover:bg-[#32e612] transition-all transform hover:scale-[1.02]"
                  onClick={() => setUpgradeTriggered(false)}
                >
                  Ver planes de suscripción →
                </button>
              </Link>
              <button
                data-testid="button-upgrade-dismiss"
                onClick={() => setUpgradeTriggered(false)}
                className="w-full py-3 bg-transparent text-gray-500 font-bold uppercase text-xs tracking-wider hover:text-white transition-colors"
              >
                Volver al panel anterior
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
