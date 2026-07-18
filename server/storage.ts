import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import {
  profiles, routines, routineExercises, guides, users, messages, payments,
  wellnessCheckins, studentPoints, pointTransactions, workoutCompletions, trainerSubscriptions,
  exerciseCompletions, exerciseTemplates,
  type Profile, type Routine, type RoutineExercise, type Guide,
  type CreateRoutineRequest, type InsertProfile, type User,
  type Message, type InsertMessage, type InsertGuide,
  type Payment, type InsertPayment,
  type WellnessCheckin, type InsertWellnessCheckin,
  type StudentPoints, type PointTransaction, type WorkoutCompletion, type TrainerSubscription,
  type ExerciseCompletion, type InsertExerciseCompletion, type ExerciseTemplate, type InsertExerciseTemplate,
  type StudentAlert,
  POINTS
} from "@shared/schema";

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  upsertProfile(profile: InsertProfile): Promise<Profile>;
  
  // Routines
  getRoutines(role: "trainer" | "student", userId: string): Promise<(Routine & { exercises: RoutineExercise[] })[]>;
  getRoutine(id: number): Promise<(Routine & { exercises: RoutineExercise[] }) | undefined>;
  createRoutine(routine: CreateRoutineRequest): Promise<Routine>;
  deleteRoutine(id: number): Promise<void>;

  // Guides
  getGuides(): Promise<Guide[]>;
  getGuideBySlug(slug: string): Promise<Guide | undefined>;
  createGuide(guide: InsertGuide): Promise<Guide>; // For seeding

  // Users (Helpers)
  getStudents(): Promise<Partial<User>[]>;
  getTrainers(): Promise<Partial<User>[]>;

  // Messages
  getMessages(userId1: string, userId2: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Payments
  getPayments(userId: string, role: "trainer" | "student"): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: string, paymentMethod?: string): Promise<Payment | undefined>;

  // Wellness Check-ins
  getWellnessCheckins(studentId: string, limit?: number): Promise<WellnessCheckin[]>;
  getTodayCheckin(studentId: string): Promise<WellnessCheckin | undefined>;
  createWellnessCheckin(checkin: InsertWellnessCheckin): Promise<WellnessCheckin>;

  // Points & Rewards
  getStudentPoints(studentId: string): Promise<StudentPoints | undefined>;
  getOrCreateStudentPoints(studentId: string): Promise<StudentPoints>;
  addPoints(studentId: string, points: number, type: string, description: string): Promise<StudentPoints>;
  getPointTransactions(studentId: string, limit?: number): Promise<PointTransaction[]>;

  // Workout Completions
  completeWorkout(studentId: string, routineId: number): Promise<WorkoutCompletion>;
  getWorkoutCompletions(studentId: string): Promise<WorkoutCompletion[]>;

  // Trainer Subscriptions
  getTrainerSubscription(trainerId: string): Promise<TrainerSubscription | undefined>;
  getTrainerStudentCount(trainerId: string): Promise<number>;
  setTrainerPremium(trainerId: string, isPremium: boolean, expiresAt?: Date): Promise<TrainerSubscription>;
  setTrainerPlan(trainerId: string, planId: string): Promise<TrainerSubscription>;

  // Trainer Alerts
  getTrainerAlerts(trainerId: string): Promise<StudentAlert[]>;

  // Exercise Completions
  completeExercise(studentId: string, routineId: number, exerciseId: number): Promise<ExerciseCompletion>;
  getExerciseCompletions(studentId: string, routineId: number): Promise<ExerciseCompletion[]>;

  // Exercise Templates
  getExerciseTemplates(trainerId: string): Promise<ExerciseTemplate[]>;
  createExerciseTemplate(template: InsertExerciseTemplate): Promise<ExerciseTemplate>;
  deleteExerciseTemplate(id: number): Promise<void>;
  createRoutinesFromTemplate(templateId: number, studentIds: string[]): Promise<Routine[]>;

  // Leaderboard
  getLeaderboard(limit?: number): Promise<{ rank: number; points: number; studentId: string }[]>;
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertProfile(profileData: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values(profileData)
      .onConflictDoUpdate({
        target: profiles.userId,
        set: profileData,
      })
      .returning();
    return profile;
  }

  // Routines
  async getRoutines(role: "trainer" | "student", userId: string): Promise<(Routine & { exercises: RoutineExercise[] })[]> {
    let query = db.select().from(routines);
    
    if (role === "trainer") {
      // Trainers see routines they created
      query = query.where(eq(routines.trainerId, userId));
    } else {
      // Students see routines assigned to them
      query = query.where(eq(routines.studentId, userId));
    }

    const routinesList = await query.orderBy(desc(routines.createdAt));
    
    // Fetch exercises for each routine (could be optimized with relations query)
    const result = await Promise.all(routinesList.map(async (routine) => {
      const exercises = await db.select().from(routineExercises)
        .where(eq(routineExercises.routineId, routine.id))
        .orderBy(routineExercises.order);
      return { ...routine, exercises };
    }));

    return result;
  }

  async getRoutine(id: number): Promise<(Routine & { exercises: RoutineExercise[] }) | undefined> {
    const [routine] = await db.select().from(routines).where(eq(routines.id, id));
    if (!routine) return undefined;

    const exercises = await db.select().from(routineExercises)
      .where(eq(routineExercises.routineId, id))
      .orderBy(routineExercises.order);
    
    return { ...routine, exercises };
  }

  async createRoutine(data: CreateRoutineRequest): Promise<Routine> {
    // Transaction to ensure routine and exercises are created together
    return await db.transaction(async (tx) => {
      const [routine] = await tx.insert(routines).values({
        trainerId: data.trainerId,
        studentId: data.studentId,
        title: data.title,
        description: data.description,
      }).returning();

      if (data.exercises.length > 0) {
        await tx.insert(routineExercises).values(
          data.exercises.map((ex, index) => ({
            ...ex,
            routineId: routine.id,
            order: index,
          }))
        );
      }
      return routine;
    });
  }

  async deleteRoutine(id: number): Promise<void> {
    await db.delete(routines).where(eq(routines.id, id));
  }

  // Guides
  async getGuides(): Promise<Guide[]> {
    return await db.select().from(guides).orderBy(guides.title);
  }

  async getGuideBySlug(slug: string): Promise<Guide | undefined> {
    const [guide] = await db.select().from(guides).where(eq(guides.slug, slug));
    return guide;
  }

  async createGuide(guide: InsertGuide): Promise<Guide> {
    const [newGuide] = await db.insert(guides).values(guide).returning();
    return newGuide;
  }

  // Users
  async getStudents(): Promise<Partial<User>[]> {
    const result = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    })
    .from(users)
    .innerJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(profiles.role, "student"));

    return result;
  }

  async getTrainers(): Promise<Partial<User>[]> {
    const result = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    })
    .from(users)
    .innerJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(profiles.role, "trainer"));

    return result;
  }

  // Messages
  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // Payments
  async getPayments(userId: string, role: "trainer" | "student"): Promise<Payment[]> {
    if (role === "trainer") {
      return await db.select().from(payments).where(eq(payments.trainerId, userId)).orderBy(desc(payments.createdAt));
    } else {
      return await db.select().from(payments).where(eq(payments.studentId, userId)).orderBy(desc(payments.createdAt));
    }
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(id: number, status: string, paymentMethod?: string): Promise<Payment | undefined> {
    const updateData: any = { status };
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (status === "paid") updateData.paidAt = new Date();
    
    const [updated] = await db.update(payments).set(updateData).where(eq(payments.id, id)).returning();
    return updated;
  }

  // Wellness Check-ins
  async getWellnessCheckins(studentId: string, limit = 30): Promise<WellnessCheckin[]> {
    return await db.select().from(wellnessCheckins)
      .where(eq(wellnessCheckins.studentId, studentId))
      .orderBy(desc(wellnessCheckins.createdAt))
      .limit(limit);
  }

  async getTodayCheckin(studentId: string): Promise<WellnessCheckin | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [checkin] = await db.select().from(wellnessCheckins)
      .where(and(eq(wellnessCheckins.studentId, studentId), eq(wellnessCheckins.date, today)));
    return checkin;
  }

  async createWellnessCheckin(checkin: InsertWellnessCheckin): Promise<WellnessCheckin> {
    // Calculate recommended intensity based on sleep and stress
    let recommendedIntensity: "low" | "medium" | "high" = "medium";
    const avgWellness = (checkin.sleepQuality + (6 - checkin.stressLevel)) / 2;
    if (avgWellness < 2.5) recommendedIntensity = "low";
    else if (avgWellness > 3.5) recommendedIntensity = "high";

    const [newCheckin] = await db.insert(wellnessCheckins)
      .values({ ...checkin, recommendedIntensity })
      .returning();
    
    // Award points for check-in
    await this.addPoints(checkin.studentId, POINTS.DAILY_CHECKIN, "checkin", "Check-in de bienestar diario");
    
    return newCheckin;
  }

  // Points & Rewards
  async getStudentPoints(studentId: string): Promise<StudentPoints | undefined> {
    const [points] = await db.select().from(studentPoints).where(eq(studentPoints.studentId, studentId));
    return points;
  }

  async getOrCreateStudentPoints(studentId: string): Promise<StudentPoints> {
    let points = await this.getStudentPoints(studentId);
    if (!points) {
      [points] = await db.insert(studentPoints).values({ studentId }).returning();
    }
    return points;
  }

  async addPoints(studentId: string, points: number, type: string, description: string): Promise<StudentPoints> {
    const current = await this.getOrCreateStudentPoints(studentId);
    
    // Log the transaction
    await db.insert(pointTransactions).values({
      studentId,
      points,
      type: type as "workout" | "checkin" | "bonus" | "redeemed",
      description,
    });

    // Update totals
    const updateData: any = {
      totalPoints: current.totalPoints + points,
      updatedAt: new Date(),
    };
    if (type === "workout") updateData.workoutsCompleted = current.workoutsCompleted + 1;
    if (type === "checkin") updateData.checkinsCompleted = current.checkinsCompleted + 1;

    const [updated] = await db.update(studentPoints)
      .set(updateData)
      .where(eq(studentPoints.studentId, studentId))
      .returning();
    return updated;
  }

  async getPointTransactions(studentId: string, limit = 50): Promise<PointTransaction[]> {
    return await db.select().from(pointTransactions)
      .where(eq(pointTransactions.studentId, studentId))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(limit);
  }

  // Workout Completions
  async completeWorkout(studentId: string, routineId: number): Promise<WorkoutCompletion> {
    const [completion] = await db.insert(workoutCompletions)
      .values({ studentId, routineId })
      .returning();
    
    // Award points
    await this.addPoints(studentId, POINTS.WORKOUT_COMPLETED, "workout", "Entrenamiento completado");
    
    return completion;
  }

  async getWorkoutCompletions(studentId: string): Promise<WorkoutCompletion[]> {
    return await db.select().from(workoutCompletions)
      .where(eq(workoutCompletions.studentId, studentId))
      .orderBy(desc(workoutCompletions.completedAt));
  }

  // Trainer Subscriptions
  async getTrainerSubscription(trainerId: string): Promise<TrainerSubscription | undefined> {
    const [sub] = await db.select().from(trainerSubscriptions).where(eq(trainerSubscriptions.trainerId, trainerId));
    return sub;
  }

  async getTrainerStudentCount(trainerId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(routines)
      .where(and(eq(routines.trainerId, trainerId), sql`${routines.studentId} IS NOT NULL`));
    return Number(result[0]?.count || 0);
  }

  async setTrainerPremium(trainerId: string, isPremium: boolean, expiresAt?: Date): Promise<TrainerSubscription> {
    const existing = await this.getTrainerSubscription(trainerId);
    if (existing) {
      const [updated] = await db.update(trainerSubscriptions)
        .set({ isPremium, expiresAt })
        .where(eq(trainerSubscriptions.trainerId, trainerId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(trainerSubscriptions)
      .values({ trainerId, isPremium, expiresAt })
      .returning();
    return created;
  }

  async setTrainerPlan(trainerId: string, planId: string): Promise<TrainerSubscription> {
    const isPremium = planId === "pro" || planId === "elite";
    const existing = await this.getTrainerSubscription(trainerId);
    if (existing) {
      const [updated] = await db.update(trainerSubscriptions)
        .set({ planId, isPremium })
        .where(eq(trainerSubscriptions.trainerId, trainerId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(trainerSubscriptions)
      .values({ trainerId, planId, isPremium })
      .returning();
    return created;
  }

  // Trainer Alerts - get students with high stress or inactive 72+ hours
  async getTrainerAlerts(trainerId: string): Promise<StudentAlert[]> {
    const alerts: StudentAlert[] = [];
    
    // Get trainer's students (students with routines assigned by this trainer)
    const trainerRoutines = await db.select().from(routines)
      .where(and(eq(routines.trainerId, trainerId), sql`${routines.studentId} IS NOT NULL`));
    
    const studentIds = [...new Set(trainerRoutines.map(r => r.studentId).filter(Boolean))] as string[];
    
    for (const studentId of studentIds) {
      // Get student info
      const [student] = await db.select().from(users).where(eq(users.id, studentId));
      const studentName = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Alumno' : 'Alumno';
      
      // Check for high stress (4-5 in last check-in)
      const [latestCheckin] = await db.select().from(wellnessCheckins)
        .where(eq(wellnessCheckins.studentId, studentId))
        .orderBy(desc(wellnessCheckins.createdAt))
        .limit(1);
      
      if (latestCheckin && latestCheckin.stressLevel >= 4) {
        alerts.push({
          studentId,
          studentName,
          alertType: "high_stress",
          stressLevel: latestCheckin.stressLevel,
          checkinDate: latestCheckin.date,
        });
      }
      
      // Check for inactivity (72+ hours since last workout or check-in)
      const [lastWorkout] = await db.select().from(workoutCompletions)
        .where(eq(workoutCompletions.studentId, studentId))
        .orderBy(desc(workoutCompletions.completedAt))
        .limit(1);
      
      const lastActivityDate = lastWorkout?.completedAt || latestCheckin?.createdAt;
      if (lastActivityDate) {
        const hoursSinceActivity = (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60);
        if (hoursSinceActivity >= 72) {
          // Don't add duplicate if already flagged for stress
          if (!alerts.find(a => a.studentId === studentId)) {
            alerts.push({
              studentId,
              studentName,
              alertType: "inactive",
              lastActivity: new Date(lastActivityDate),
            });
          }
        }
      } else {
        // No activity at all
        if (!alerts.find(a => a.studentId === studentId)) {
          alerts.push({
            studentId,
            studentName,
            alertType: "inactive",
          });
        }
      }
    }
    
    return alerts;
  }

  // Exercise Completions
  async completeExercise(studentId: string, routineId: number, exerciseId: number): Promise<ExerciseCompletion> {
    const [completion] = await db.insert(exerciseCompletions)
      .values({ studentId, routineId, exerciseId })
      .returning();
    return completion;
  }

  async getExerciseCompletions(studentId: string, routineId: number): Promise<ExerciseCompletion[]> {
    return await db.select().from(exerciseCompletions)
      .where(and(
        eq(exerciseCompletions.studentId, studentId),
        eq(exerciseCompletions.routineId, routineId)
      ));
  }

  // Exercise Templates
  async getExerciseTemplates(trainerId: string): Promise<ExerciseTemplate[]> {
    return await db.select().from(exerciseTemplates)
      .where(eq(exerciseTemplates.trainerId, trainerId))
      .orderBy(desc(exerciseTemplates.createdAt));
  }

  async createExerciseTemplate(template: InsertExerciseTemplate): Promise<ExerciseTemplate> {
    const [created] = await db.insert(exerciseTemplates).values(template).returning();
    return created;
  }

  async deleteExerciseTemplate(id: number): Promise<void> {
    await db.delete(exerciseTemplates).where(eq(exerciseTemplates.id, id));
  }

  async createRoutinesFromTemplate(templateId: number, studentIds: string[]): Promise<Routine[]> {
    const [template] = await db.select().from(exerciseTemplates).where(eq(exerciseTemplates.id, templateId));
    if (!template) throw new Error("Template not found");
    
    const createdRoutines: Routine[] = [];
    for (const studentId of studentIds) {
      const routine = await this.createRoutine({
        trainerId: template.trainerId,
        studentId,
        title: template.name,
        description: template.description || undefined,
        exercises: (template.exercises || []).map((ex, idx) => ({
          day: "Lunes", // Default day
          exerciseName: ex.exerciseName,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight || undefined,
          rest: ex.rest || undefined,
          notes: ex.notes || undefined,
          order: idx + 1,
        })),
      });
      createdRoutines.push(routine);
    }
    return createdRoutines;
  }

  // Leaderboard - anonymous ranking
  async getLeaderboard(limit = 5): Promise<{ rank: number; points: number; studentId: string }[]> {
    const results = await db.select({
      studentId: studentPoints.studentId,
      points: studentPoints.totalPoints,
    })
      .from(studentPoints)
      .orderBy(desc(studentPoints.totalPoints))
      .limit(limit);
    
    return results.map((r, idx) => ({
      rank: idx + 1,
      points: r.points,
      studentId: r.studentId,
    }));
  }
}

export const storage = new DatabaseStorage();
