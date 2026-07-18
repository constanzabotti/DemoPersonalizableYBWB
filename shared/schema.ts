import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

export * from "./models/auth";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  role: text("role", { enum: ["trainer", "student"] }).default("student").notNull(),
  bio: text("bio"),
  goals: text("goals"),
  stats: jsonb("stats").$type<{
    height?: number; // cm
    weight?: number; // kg
    age?: number;
    activityLevel?: string;
  }>(),
});

export const routines = pgTable("routines", {
  id: serial("id").primaryKey(),
  trainerId: text("trainer_id").notNull(),
  studentId: text("student_id"),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const routineExercises = pgTable("routine_exercises", {
  id: serial("id").primaryKey(),
  routineId: integer("routine_id").notNull().references(() => routines.id, { onDelete: 'cascade' }),
  day: text("day").notNull(),
  exerciseName: text("exercise_name").notNull(),
  sets: text("sets").notNull(),
  reps: text("reps").notNull(),
  weight: text("weight"),
  rest: text("rest"),
  notes: text("notes"),
  order: integer("order").notNull(),
});

export const guides = pgTable("guides", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  trainerId: text("trainer_id").notNull(),
  studentId: text("student_id").notNull(),
  amount: integer("amount").notNull(), // cents
  currency: text("currency").default("usd").notNull(),
  description: text("description").notNull(),
  periodType: text("period_type", { enum: ["class", "week", "month"] }).default("month"),
  status: text("status", { enum: ["pending", "paid", "cancelled"] }).default("pending").notNull(),
  paymentMethod: text("payment_method", { enum: ["card", "venmo", "zelle", "cash"] }),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});

// Trainer Premium Subscription
export const trainerSubscriptions = pgTable("trainer_subscriptions", {
  id: serial("id").primaryKey(),
  trainerId: text("trainer_id").notNull().unique(),
  planId: text("plan_id").default("free").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily Wellness Check-ins
export const wellnessCheckins = pgTable("wellness_checkins", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  sleepHours: integer("sleep_hours").notNull(),
  sleepQuality: integer("sleep_quality").notNull(), // 1-5
  stressLevel: integer("stress_level").notNull(), // 1-5
  energyLevel: integer("energy_level"), // 1-5
  notes: text("notes"),
  recommendedIntensity: text("recommended_intensity", { enum: ["low", "medium", "high"] }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Points & Rewards
export const studentPoints = pgTable("student_points", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  totalPoints: integer("total_points").default(0).notNull(),
  workoutsCompleted: integer("workouts_completed").default(0).notNull(),
  checkinsCompleted: integer("checkins_completed").default(0).notNull(),
  discountCouponsEarned: integer("discount_coupons_earned").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Point Transactions Log
export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  points: integer("points").notNull(),
  type: text("type", { enum: ["workout", "checkin", "bonus", "redeemed"] }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workout Completions
export const workoutCompletions = pgTable("workout_completions", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  routineId: integer("routine_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Exercise Completions (individual exercise tracking for animations)
export const exerciseCompletions = pgTable("exercise_completions", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  routineId: integer("routine_id").notNull(),
  exerciseId: integer("exercise_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Global Exercise Templates (for bulk assignment)
export const exerciseTemplates = pgTable("exercise_templates", {
  id: serial("id").primaryKey(),
  trainerId: text("trainer_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  exercises: jsonb("exercises").$type<{
    exerciseName: string;
    sets: string;
    reps: string;
    weight?: string;
    rest?: string;
    notes?: string;
  }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const routinesRelations = relations(routines, ({ many, one }) => ({
  exercises: many(routineExercises),
  trainer: one(users, {
    fields: [routines.trainerId],
    references: [users.id],
  }),
  student: one(users, {
    fields: [routines.studentId],
    references: [users.id],
  }),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one }) => ({
  routine: one(routines, {
    fields: [routineExercises.routineId],
    references: [routines.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
  }),
}));

// Schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertRoutineSchema = createInsertSchema(routines).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRoutineExerciseSchema = createInsertSchema(routineExercises).omit({ id: true });
export const insertGuideSchema = createInsertSchema(guides).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, paidAt: true });
export const insertWellnessCheckinSchema = createInsertSchema(wellnessCheckins).omit({ id: true, createdAt: true });
export const insertWorkoutCompletionSchema = createInsertSchema(workoutCompletions).omit({ id: true, completedAt: true });
export const insertExerciseCompletionSchema = createInsertSchema(exerciseCompletions).omit({ id: true, completedAt: true });
export const insertExerciseTemplateSchema = createInsertSchema(exerciseTemplates).omit({ id: true, createdAt: true });

// Types
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertGuide = z.infer<typeof insertGuideSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertWellnessCheckin = z.infer<typeof insertWellnessCheckinSchema>;
export type InsertWorkoutCompletion = z.infer<typeof insertWorkoutCompletionSchema>;

export type Profile = typeof profiles.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type RoutineExercise = typeof routineExercises.$inferSelect;
export type Guide = typeof guides.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type TrainerSubscription = typeof trainerSubscriptions.$inferSelect;
export type WellnessCheckin = typeof wellnessCheckins.$inferSelect;
export type StudentPoints = typeof studentPoints.$inferSelect;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type WorkoutCompletion = typeof workoutCompletions.$inferSelect;
export type ExerciseCompletion = typeof exerciseCompletions.$inferSelect;
export type ExerciseTemplate = typeof exerciseTemplates.$inferSelect;
export type InsertExerciseCompletion = z.infer<typeof insertExerciseCompletionSchema>;
export type InsertExerciseTemplate = z.infer<typeof insertExerciseTemplateSchema>;
export type UserRole = "trainer" | "student";

// Trainer Alert Types
export type StudentAlert = {
  studentId: string;
  studentName: string;
  alertType: "high_stress" | "inactive";
  lastActivity?: Date;
  stressLevel?: number;
  checkinDate?: string;
};

// Gamification Constants
export const POINTS = {
  WORKOUT_COMPLETED: 25,
  DAILY_CHECKIN: 10,
} as const;

export const REWARDS = {
  HEALTHY_SNACKS_PDF: { points: 100, name: "Guía PDF de Snacks Saludables", slug: "snacks-pdf" },
  SECRET_AB_ROUTINE: { points: 300, name: "Rutina Secreta de Abdominales", slug: "abs-routine" },
  DISCOUNT_COUPON: { points: 680, name: "Cupón $5 de Descuento", slug: "discount-coupon" },
} as const;

export const TRAINER_PREMIUM = {
  MONTHLY_COST_CENTS: 1000, // $10.00
  FREE_STUDENT_LIMIT: 3,
} as const;

export type CreateRoutineRequest = z.infer<typeof insertRoutineSchema> & {
  exercises: z.infer<typeof insertRoutineExerciseSchema>[];
};
