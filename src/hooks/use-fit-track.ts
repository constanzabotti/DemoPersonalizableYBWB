import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { 
  Profile, 
  Routine, 
  RoutineExercise, 
  Guide, 
  CreateRoutineRequest 
} from "@shared/schema";

// --- Profiles ---

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: [api.profiles.get.path, userId],
    queryFn: async () => {
      if (!userId) return null;
      const url = buildUrl(api.profiles.get.path, { userId });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.profiles.get.responses[200].parse(await res.json());
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { userId: string; role: "trainer" | "student"; bio?: string; goals?: string }) => {
      const res = await fetch(api.profiles.update.path, {
        method: api.profiles.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return api.profiles.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.get.path, data.userId] });
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// --- Routines ---

export function useRoutines(filters: { role: "trainer" | "student"; userId: string; enabled?: boolean }) {
  const isEnabled = filters.enabled !== false && !!filters.userId;
  return useQuery({
    queryKey: [api.routines.list.path, filters],
    queryFn: async () => {
      const url = `${api.routines.list.path}?role=${filters.role}&userId=${filters.userId}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch routines");
      return api.routines.list.responses[200].parse(await res.json());
    },
    enabled: isEnabled,
  });
}

export function useRoutine(id: number) {
  return useQuery({
    queryKey: [api.routines.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.routines.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch routine");
      return api.routines.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateRoutineRequest) => {
      const res = await fetch(api.routines.create.path, {
        method: api.routines.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create routine");
      }
      return api.routines.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.routines.list.path] });
      toast({ title: "Routine Created", description: "Your new routine has been assigned." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.routines.delete.path, { id });
      const res = await fetch(url, { 
        method: api.routines.delete.method, 
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete routine");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.routines.list.path] });
      toast({ title: "Routine Deleted", description: "The routine has been removed." });
    },
  });
}

// --- Guides ---

export function useGuides() {
  return useQuery({
    queryKey: [api.guides.list.path],
    queryFn: async () => {
      const res = await fetch(api.guides.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch guides");
      return api.guides.list.responses[200].parse(await res.json());
    },
  });
}

export function useGuide(slug: string) {
  return useQuery({
    queryKey: [api.guides.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.guides.get.path, { slug });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch guide");
      return api.guides.get.responses[200].parse(await res.json());
    },
  });
}

// --- Users (Students) ---

export function useStudents() {
  return useQuery({
    queryKey: [api.users.listStudents.path],
    queryFn: async () => {
      const res = await fetch(api.users.listStudents.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch students");
      return api.users.listStudents.responses[200].parse(await res.json());
    },
  });
}
