import { useAuth } from "@/hooks/use-auth";
import { useProfile, useRoutines, useDeleteRoutine } from "@/hooks/use-fit-track";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Calendar, Trash2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { CreateRoutineModal } from "@/components/CreateRoutineModal";

export default function Routines() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: routines, isLoading } = useRoutines({ 
    role: profile?.role || 'student', 
    userId: user?.id || '' 
  });
  const deleteRoutine = useDeleteRoutine();

  if (isLoading || !profile) return <div className="p-8 text-center">Loading routines...</div>;

  const isTrainer = profile.role === "trainer";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Workouts</h1>
          <p className="text-muted-foreground">Your assigned training plans</p>
        </div>
        {isTrainer && <CreateRoutineModal />}
      </div>

      {routines?.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-muted">
          <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-bold">No routines found</h3>
          <p className="text-muted-foreground mb-4">
            {isTrainer ? "Create your first routine to get started." : "Ask your trainer to assign you a routine."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines?.map((routine) => (
            <Card key={routine.id} className="group hover:shadow-xl transition-all duration-300 border-border/50 bg-card">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {routine.exercises.length} Exercises
                  </Badge>
                  {isTrainer && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteRoutine.mutate(routine.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="font-display text-xl">{routine.title}</CardTitle>
                <CardDescription className="line-clamp-2">{routine.description || "No description provided."}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Calendar className="w-3 h-3" />
                  Created {format(new Date(routine.createdAt || new Date()), 'MMM d, yyyy')}
                </div>
                
                <Link href={`/routines/${routine.id}`}>
                  <Button className="w-full group-hover:bg-primary/90">
                    View Plan <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
