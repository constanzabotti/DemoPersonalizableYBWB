import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Dumbbell } from "lucide-react";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRoutineSchema, insertRoutineExerciseSchema } from "@shared/schema";
import { useCreateRoutine, useStudents } from "@/hooks/use-fit-track";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

const formSchema = insertRoutineSchema.extend({
  exercises: z.array(insertRoutineExerciseSchema)
});

type FormValues = z.infer<typeof formSchema>;

export function CreateRoutineModal() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const createRoutine = useCreateRoutine();
  const { data: students } = useStudents();
  
  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      trainerId: user?.id || "",
      exercises: [{ day: "Monday", exerciseName: "", sets: "3", reps: "10", weight: "", rest: "60s", order: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "exercises"
  });

  const onSubmit = (data: FormValues) => {
    createRoutine.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        reset();
      }
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          <Plus className="w-4 h-4" /> Create Routine
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create New Routine</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Routine Title</Label>
              <Input placeholder="e.g. Summer Shred Phase 1" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Assign to Student</Label>
              <Select onValueChange={(val) => setValue("studentId", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName ? `${s.firstName} ${s.lastName || ''}` : s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Instructions, goals, or notes..." {...register("description")} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" /> Exercises
              </h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ 
                  day: "Monday", 
                  exerciseName: "", 
                  sets: "3", 
                  reps: "10", 
                  weight: "", 
                  rest: "60s", 
                  order: fields.length + 1 
                })}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Exercise
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 bg-muted/50 rounded-xl border border-border relative group animate-in slide-in-from-bottom-2 duration-300">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 pr-8">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Day</Label>
                      <Input className="h-9" placeholder="Day" {...register(`exercises.${index}.day`)} />
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-3">
                      <Label className="text-xs text-muted-foreground">Exercise Name</Label>
                      <Input className="h-9" placeholder="e.g. Bench Press" {...register(`exercises.${index}.exerciseName`)} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Sets</Label>
                      <Input className="h-9" {...register(`exercises.${index}.sets`)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Reps</Label>
                      <Input className="h-9" {...register(`exercises.${index}.reps`)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Weight</Label>
                      <Input className="h-9" placeholder="kg/lbs" {...register(`exercises.${index}.weight`)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Rest</Label>
                      <Input className="h-9" placeholder="sec" {...register(`exercises.${index}.rest`)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full py-6 font-bold text-lg" disabled={createRoutine.isPending}>
            {createRoutine.isPending ? "Creating Routine..." : "Save Routine"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
