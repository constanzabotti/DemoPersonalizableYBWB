import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { insertProfileSchema, insertRoutineSchema, insertRoutineExerciseSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Profiles
  app.get(api.profiles.get.path, async (req, res) => {
    const userId = req.params.userId;
    const profile = await storage.getProfile(userId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  });

  app.post(api.profiles.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.profiles.update.input.parse(req.body);
      // Ensure user can only update their own profile or strict check
      if (input.userId !== (req.user as any).claims.sub) {
        return res.status(403).json({ message: "Cannot update another user's profile" });
      }
      const profile = await storage.upsertProfile(input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Routines
  app.get(api.routines.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
        // Parse query params if needed, but for now we trust the server logic
        // We could validate query params with z.object if passed
        const userId = (req.user as any).claims.sub;
        
        // Determine role from profile
        const profile = await storage.getProfile(userId);
        const role = profile?.role || "student"; // Default to student view if no profile? Or fail?

        const routines = await storage.getRoutines(role as "trainer" | "student", userId);
        res.json(routines);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.routines.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const routine = await storage.getRoutine(id);
    if (!routine) return res.status(404).json({ message: 'Routine not found' });
    
    // Authorization check: User must be the trainer OR the assigned student
    const userId = (req.user as any).claims.sub;
    if (routine.trainerId !== userId && routine.studentId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to this routine" });
    }

    res.json(routine);
  });

  app.post(api.routines.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.routines.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      
      // Verify user is a trainer
      const profile = await storage.getProfile(userId);
      if (profile?.role !== "trainer") {
        return res.status(403).json({ message: "Only trainers can create routines" });
      }

      // Enforce trainerId
      if (input.trainerId !== userId) {
         return res.status(400).json({ message: "Invalid trainer ID" });
      }

      const routine = await storage.createRoutine(input);
      res.status(201).json(routine);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.routines.delete.path, async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const id = parseInt(req.params.id);
      const routine = await storage.getRoutine(id);
      if (!routine) return res.status(404).json({ message: 'Routine not found' });

      const userId = (req.user as any).claims.sub;
      if (routine.trainerId !== userId) {
          return res.status(403).json({ message: "Only the creator can delete this routine" });
      }

      await storage.deleteRoutine(id);
      res.sendStatus(204);
  });

  // Guides
  app.get(api.guides.list.path, async (req, res) => {
    const guides = await storage.getGuides();
    res.json(guides);
  });

  app.get(api.guides.get.path, async (req, res) => {
    const guide = await storage.getGuideBySlug(req.params.slug);
    if (!guide) return res.status(404).json({ message: 'Guide not found' });
    res.json(guide);
  });

  // Users (Students list for trainers)
  app.get(api.users.listStudents.path, async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const userId = (req.user as any).claims.sub;
      const profile = await storage.getProfile(userId);
      
      // If student, list trainers (all users with trainer role)
      if (profile?.role === "student") {
        const trainers = await storage.getTrainers();
        return res.json(trainers);
      }

      if (profile?.role !== "trainer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const students = await storage.getStudents();
      res.json(students);
  });

  app.get("/api/users/trainers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const trainers = await storage.getTrainers();
    res.json(trainers);
  });

  // Messages
  app.get(api.messages.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const otherUserId = req.params.otherUserId;
    const msgs = await storage.getMessages(userId, otherUserId);
    res.json(msgs);
  });

  app.post(api.messages.send.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.messages.send.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      if (input.senderId !== userId) {
        return res.status(403).json({ message: "Cannot send message as another user" });
      }
      const msg = await storage.createMessage(input);
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Payments
  app.get(api.payments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const profile = await storage.getProfile(userId);
    const role = profile?.role || "student";
    const paymentsList = await storage.getPayments(userId, role as "trainer" | "student");
    res.json(paymentsList);
  });

  app.post(api.payments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.payments.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      
      // Verify user is a trainer
      const profile = await storage.getProfile(userId);
      if (profile?.role !== "trainer") {
        return res.status(403).json({ message: "Solo los entrenadores pueden crear cobros" });
      }
      
      if (input.trainerId !== userId) {
        return res.status(400).json({ message: "ID de entrenador inválido" });
      }

      const payment = await storage.createPayment(input);
      res.status(201).json(payment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.payments.updateStatus.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const input = api.payments.updateStatus.input.parse(req.body);
      
      const updated = await storage.updatePaymentStatus(id, input.status, input.paymentMethod);
      if (!updated) {
        return res.status(404).json({ message: "Pago no encontrado" });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Wellness Check-ins
  app.get(api.wellness.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const checkins = await storage.getWellnessCheckins(userId);
    res.json(checkins);
  });

  app.get(api.wellness.today.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const checkin = await storage.getTodayCheckin(userId);
    res.json(checkin || null);
  });

  app.post(api.wellness.checkin.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.wellness.checkin.input.parse(req.body);
      
      // Check if already checked in today
      const existing = await storage.getTodayCheckin(userId);
      if (existing) {
        return res.status(400).json({ message: "Ya realizaste tu check-in de hoy" });
      }
      
      const checkin = await storage.createWellnessCheckin({
        ...input,
        studentId: userId,
        date: new Date().toISOString().split('T')[0],
      });
      res.status(201).json(checkin);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Points & Rewards
  app.get(api.points.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const points = await storage.getOrCreateStudentPoints(userId);
    res.json(points);
  });

  app.get(api.points.transactions.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const transactions = await storage.getPointTransactions(userId);
    res.json(transactions);
  });

  // Workout Completions
  app.post(api.workouts.complete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = (req.user as any).claims.sub;
      const { routineId } = req.body;
      const completion = await storage.completeWorkout(userId, routineId);
      res.status(201).json(completion);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.workouts.completions.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const completions = await storage.getWorkoutCompletions(userId);
    res.json(completions);
  });

  // Trainer Subscription
  app.get(api.trainer.subscription.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const subscription = await storage.getTrainerSubscription(userId);
    res.json(subscription || null);
  });

  app.get(api.trainer.studentCount.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const count = await storage.getTrainerStudentCount(userId);
    const subscription = await storage.getTrainerSubscription(userId);
    const planId = subscription?.planId || "free";
    const isPremium = subscription?.isPremium || false;
    const PLAN_LIMITS: Record<string, number> = { free: 3, pro: 15, elite: 999 };
    const limit = PLAN_LIMITS[planId] ?? 3;
    res.json({ count, limit, isPremium, planId });
  });

  app.post(api.trainer.setPlan.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = (req.user as any).claims.sub;
      const profile = await storage.getProfile(userId);
      if (profile?.role !== "trainer") {
        return res.status(403).json({ message: "Solo entrenadores pueden cambiar el plan" });
      }
      const input = api.trainer.setPlan.input.parse(req.body);
      const sub = await storage.setTrainerPlan(userId, input.planId);
      res.json(sub);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Trainer Alerts
  app.get("/api/trainer/alerts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const profile = await storage.getProfile(userId);
    if (profile?.role !== "trainer") {
      return res.status(403).json({ message: "Solo entrenadores pueden ver alertas" });
    }
    const alerts = await storage.getTrainerAlerts(userId);
    res.json(alerts);
  });

  // Exercise Completions
  app.post("/api/exercises/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = (req.user as any).claims.sub;
      const { routineId, exerciseId } = req.body;
      const completion = await storage.completeExercise(userId, routineId, exerciseId);
      res.status(201).json(completion);
    } catch (err) {
      res.status(500).json({ message: "Error al completar ejercicio" });
    }
  });

  app.get("/api/exercises/completions/:routineId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const routineId = parseInt(req.params.routineId);
    const completions = await storage.getExerciseCompletions(userId, routineId);
    res.json(completions);
  });

  // Exercise Templates
  app.get("/api/templates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).claims.sub;
    const profile = await storage.getProfile(userId);
    if (profile?.role !== "trainer") {
      return res.status(403).json({ message: "Solo entrenadores pueden ver plantillas" });
    }
    const templates = await storage.getExerciseTemplates(userId);
    res.json(templates);
  });

  app.post("/api/templates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = (req.user as any).claims.sub;
      const profile = await storage.getProfile(userId);
      if (profile?.role !== "trainer") {
        return res.status(403).json({ message: "Solo entrenadores pueden crear plantillas" });
      }
      const { name, description, exercises } = req.body;
      const template = await storage.createExerciseTemplate({
        trainerId: userId,
        name,
        description,
        exercises,
      });
      res.status(201).json(template);
    } catch (err) {
      res.status(500).json({ message: "Error al crear plantilla" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    await storage.deleteExerciseTemplate(id);
    res.sendStatus(204);
  });

  app.post("/api/templates/:id/assign", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = (req.user as any).claims.sub;
      const profile = await storage.getProfile(userId);
      if (profile?.role !== "trainer") {
        return res.status(403).json({ message: "Solo entrenadores pueden asignar plantillas" });
      }
      const templateId = parseInt(req.params.id);
      const { studentIds } = req.body;
      const routines = await storage.createRoutinesFromTemplate(templateId, studentIds);
      res.status(201).json(routines);
    } catch (err) {
      res.status(500).json({ message: "Error al asignar plantilla" });
    }
  });

  // Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const limit = parseInt(req.query.limit as string) || 5;
    const leaderboard = await storage.getLeaderboard(limit);
    res.json(leaderboard);
  });

  // Seed Data
  await seedGuides();

  return httpServer;
}

async function seedGuides() {
  const existing = await storage.getGuides();
  if (existing.length > 0) return; // Already seeded

  const guidesData = [
    {
      title: "Índice de Masa Corporal (IMC)",
      slug: "imc-bmi",
      category: "Concepts",
      content: `
# Índice de Masa Corporal (IMC)

El **Índice de Masa Corporal (IMC)** es una medida utilizada para determinar si una persona tiene un peso saludable para su estatura.

### ¿Cómo se calcula?
La fórmula es:
$$ IMC = Peso (kg) / Altura (m)^2 $$

### Interpretación:
- **Bajo peso**: < 18.5
- **Peso normal**: 18.5 - 24.9
- **Sobrepeso**: 25 - 29.9
- **Obesidad**: > 30

Recuerda que el IMC es solo una referencia y no distingue entre masa muscular y grasa.
      `
    },
    {
      title: "Importancia del Calentamiento",
      slug: "calentamiento",
      category: "Training",
      content: `
# La Importancia del Calentamiento Muscular

Calentar antes de entrenar es fundamental para preparar el cuerpo y prevenir lesiones.

### Beneficios:
1. **Aumento de la temperatura corporal**: Mejora la elasticidad muscular.
2. **Lubricación articular**: Prepara las articulaciones para la carga.
3. **Activación del sistema nervioso**: Mejora la conexión mente-músculo.

### Rutina Base de Calentamiento (5-10 min):
- 5 min de cardio ligero (caminar rápido o elíptica).
- Movilidad articular: Circunducción de cuello, hombros, cadera y tobillos.
- Series de aproximación: Realiza el primer ejercicio de tu rutina con muy poco peso para mecanizar el movimiento.
      `
    },
    {
      title: "Estiramientos y Flexibilidad",
      slug: "estiramientos",
      category: "Training",
      content: `
# Estiramientos: ¿Cuándo y Cómo?

Existen dos tipos principales de estiramientos que debes conocer:

1. **Estiramiento Dinámico (Pre-Entreno)**: Movimientos controlados que preparan al músculo. *Ejemplo: balanceos de pierna.*
2. **Estiramiento Estático (Post-Entreno)**: Mantener una posición por 20-30 segundos. Ayuda a relajar el músculo.

### Rutina Base de Estiramiento Post-Entreno:
- **Tren Superior**: Estiramiento de pectorales contra pared, tríceps tras nuca.
- **Tren Inferior**: Isquiosurales (tocar puntas), Cuádriceps (talón al glúteo), Glúteo (pierna cruzada).
      `
    },
    {
      title: "Nutrición y Hábitos Saludables",
      slug: "alimentacion-habitos",
      category: "Nutrition",
      content: `
# Guía de Alimentación Saludable y Hábitos

La nutrición es el 70% de tus resultados. No es dieta, es un estilo de vida.

### Pilares de una buena alimentación:
- **Proteína en cada comida**: Crucial para el músculo.
- **Fibra y Vegetales**: Para saciedad y salud intestinal.
- **Hidratación**: Bebe al menos 2-3 litros de agua al día.

### Hábitos para el Éxito:
- **Sueño (7-9h)**: El músculo crece mientras duermes, no mientras entrenas.
- **Consistencia**: Mejor 3 días a la semana siempre, que 5 días una semana y 0 la siguiente.
- **Descanso Muscular**: Deja al menos 48h antes de entrenar el mismo grupo muscular intensamente.
      `
    },
    {
      title: "Rutina de Enfriamiento",
      slug: "enfriamiento",
      category: "Training",
      content: `
# Rutina de Enfriamiento (Vuelta a la Calma)

No cortes el entreno de golpe. El enfriamiento ayuda a normalizar el pulso y reducir la rigidez.

### Pasos Sugeridos:
1. **Bajar intensidad**: 2-3 min de caminata lenta.
2. **Respiración profunda**: Inhala por la nariz 4 segundos, exhala por la boca 6 segundos.
3. **Estiramiento suave**: Enfócate en los músculos que más trabajaste hoy.
      `
    }
  ];

  for (const guide of guidesData) {
    await storage.createGuide(guide);
  }
}
