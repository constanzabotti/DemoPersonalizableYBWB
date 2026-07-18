import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useStudents } from "@/hooks/use-fit-track";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Users, Copy, Dumbbell, CheckCircle2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ExerciseTemplate } from "@shared/schema";

type ExerciseInput = {
  exerciseName: string;
  sets: string;
  reps: string;
  weight?: string;
  rest?: string;
  notes?: string;
};

export default function Templates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ExerciseTemplate | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    exercises: [{ exerciseName: "", sets: "3", reps: "10", weight: "", rest: "60s", notes: "" }] as ExerciseInput[],
  });

  const { data: templates, isLoading } = useQuery<ExerciseTemplate[]>({
    queryKey: ['/api/templates'],
  });

  const { data: students } = useStudents();

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; exercises: ExerciseInput[] }) => {
      return apiRequest("POST", "/api/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsCreateOpen(false);
      setNewTemplate({
        name: "",
        description: "",
        exercises: [{ exerciseName: "", sets: "3", reps: "10", weight: "", rest: "60s", notes: "" }],
      });
      toast({ title: "Plantilla creada", description: "Tu plantilla de ejercicios ha sido guardada." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: "Plantilla eliminada" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ templateId, studentIds }: { templateId: number; studentIds: string[] }) => {
      return apiRequest("POST", `/api/templates/${templateId}/assign`, { studentIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routines'] });
      setIsAssignOpen(false);
      setSelectedStudents([]);
      toast({ 
        title: "¡Rutinas asignadas!", 
        description: `Plantilla asignada a ${selectedStudents.length} alumno(s).`
      });
    },
  });

  const addExercise = () => {
    setNewTemplate(prev => ({
      ...prev,
      exercises: [...prev.exercises, { exerciseName: "", sets: "3", reps: "10", weight: "", rest: "60s", notes: "" }],
    }));
  };

  const removeExercise = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const updateExercise = (index: number, field: keyof ExerciseInput, value: string) => {
    setNewTemplate(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex),
    }));
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssign = (template: ExerciseTemplate) => {
    setSelectedTemplate(template);
    setSelectedStudents([]);
    setIsAssignOpen(true);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="neon-gradient-text">Plantillas Globales</span>
          </h1>
          <p className="text-muted-foreground">Crea bases de ejercicios y asígnalas a múltiples alumnos.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="neon-gradient text-black font-semibold btn-interactive" data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" /> Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-card">
            <DialogHeader>
              <DialogTitle className="font-display neon-gradient-text">Crear Plantilla</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nombre de la Plantilla</label>
                <Input 
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Rutina Full Body Principiante"
                  className="glass-card"
                  data-testid="input-template-name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Descripción</label>
                <Textarea 
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción breve de la rutina..."
                  className="glass-card"
                  data-testid="input-template-description"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Ejercicios</label>
                  <Button size="sm" variant="outline" onClick={addExercise} className="neon-border" data-testid="button-add-exercise">
                    <Plus className="w-4 h-4 mr-1" /> Añadir
                  </Button>
                </div>
                
                {newTemplate.exercises.map((ex, idx) => (
                  <Card key={idx} className="glass-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Input 
                          placeholder="Nombre del ejercicio"
                          value={ex.exerciseName}
                          onChange={(e) => updateExercise(idx, 'exerciseName', e.target.value)}
                          className="col-span-2 md:col-span-3"
                          data-testid={`input-exercise-name-${idx}`}
                        />
                        <Input 
                          placeholder="Sets"
                          value={ex.sets}
                          onChange={(e) => updateExercise(idx, 'sets', e.target.value)}
                          data-testid={`input-exercise-sets-${idx}`}
                        />
                        <Input 
                          placeholder="Reps"
                          value={ex.reps}
                          onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                          data-testid={`input-exercise-reps-${idx}`}
                        />
                        <Input 
                          placeholder="Peso (opcional)"
                          value={ex.weight}
                          onChange={(e) => updateExercise(idx, 'weight', e.target.value)}
                          data-testid={`input-exercise-weight-${idx}`}
                        />
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => removeExercise(idx)}
                        disabled={newTemplate.exercises.length <= 1}
                        data-testid={`button-remove-exercise-${idx}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Button 
                className="w-full neon-gradient text-black font-semibold btn-interactive"
                onClick={() => createMutation.mutate(newTemplate)}
                disabled={createMutation.isPending || !newTemplate.name || newTemplate.exercises.some(e => !e.exerciseName)}
                data-testid="button-save-template"
              >
                {createMutation.isPending ? "Guardando..." : "Guardar Plantilla"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates?.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">Sin Plantillas</h3>
          <p className="text-muted-foreground mb-4">Crea tu primera plantilla para ahorrar tiempo al asignar rutinas.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates?.map((template) => (
            <Card key={template.id} className="glass-card card-hover-lift overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-display text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    )}
                  </div>
                  <Badge className="neon-gradient text-black">
                    {(template.exercises as ExerciseInput[])?.length || 0} ejercicios
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                  {(template.exercises as ExerciseInput[])?.slice(0, 4).map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                      <span className="truncate">{ex.exerciseName}</span>
                      <span className="text-muted-foreground text-xs">{ex.sets}x{ex.reps}</span>
                    </div>
                  ))}
                  {(template.exercises as ExerciseInput[])?.length > 4 && (
                    <p className="text-xs text-muted-foreground">+{(template.exercises as ExerciseInput[]).length - 4} más...</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 neon-gradient text-black font-semibold btn-interactive"
                    onClick={() => handleAssign(template)}
                    data-testid={`button-assign-template-${template.id}`}
                  >
                    <Users className="w-4 h-4 mr-1" /> Asignar
                  </Button>
                  <Button 
                    size="icon"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(template.id)}
                    className="neon-border"
                    data-testid={`button-delete-template-${template.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="font-display">
              Asignar: <span className="neon-gradient-text">{selectedTemplate?.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona los alumnos que recibirán esta rutina:
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {students?.map((student) => (
                <div 
                  key={student.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                    selectedStudents.includes(student.id || '') ? 'neon-border bg-primary/10' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                  onClick={() => toggleStudent(student.id || '')}
                  data-testid={`checkbox-student-${student.id}`}
                >
                  <Checkbox 
                    checked={selectedStudents.includes(student.id || '')}
                    onCheckedChange={() => toggleStudent(student.id || '')}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedStudents.length > 0 && (
              <p className="text-sm text-primary mt-4">
                {selectedStudents.length} alumno(s) seleccionado(s)
              </p>
            )}
            
            <Button 
              className="w-full mt-4 neon-gradient text-black font-semibold btn-interactive"
              onClick={() => selectedTemplate && assignMutation.mutate({ 
                templateId: selectedTemplate.id, 
                studentIds: selectedStudents 
              })}
              disabled={assignMutation.isPending || selectedStudents.length === 0}
              data-testid="button-confirm-assign"
            >
              <Copy className="w-4 h-4 mr-2" />
              {assignMutation.isPending ? "Asignando..." : `Crear ${selectedStudents.length} Rutina(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30 notranslate" translate="no">
        &copy; you better work b*tch! - ALL RIGHTS RESERVED - Constanza Botti
      </footer>
    </div>
  );
}
