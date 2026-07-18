import { z } from 'zod';
import { insertProfileSchema, insertRoutineSchema, insertRoutineExerciseSchema, insertGuideSchema, insertMessageSchema, insertPaymentSchema, insertWellnessCheckinSchema, profiles, routines, routineExercises, guides, messages, payments, wellnessCheckins, studentPoints, pointTransactions, workoutCompletions, trainerSubscriptions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  profiles: {
    get: {
      method: 'GET' as const,
      path: '/api/profiles/:userId',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'POST' as const, // Upsert
      path: '/api/profiles',
      input: insertProfileSchema,
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  routines: {
    list: {
      method: 'GET' as const,
      path: '/api/routines',
      input: z.object({
        role: z.enum(['trainer', 'student']),
        userId: z.string() // Filter routines for this user
      }),
      responses: {
        200: z.array(z.custom<typeof routines.$inferSelect & { exercises: typeof routineExercises.$inferSelect[] }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/routines/:id',
      responses: {
        200: z.custom<typeof routines.$inferSelect & { exercises: typeof routineExercises.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/routines',
      input: insertRoutineSchema.extend({
        exercises: z.array(insertRoutineExerciseSchema)
      }),
      responses: {
        201: z.custom<typeof routines.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/routines/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  guides: {
    list: {
      method: 'GET' as const,
      path: '/api/guides',
      responses: {
        200: z.array(z.custom<typeof guides.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/guides/:slug',
      responses: {
        200: z.custom<typeof guides.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  users: {
    listStudents: {
        method: 'GET' as const,
        path: '/api/users/students',
        responses: {
            200: z.array(z.object({
                id: z.string(),
                email: z.string().nullable(),
                firstName: z.string().nullable(),
                lastName: z.string().nullable(),
                profileImageUrl: z.string().nullable(),
            })),
        }
    }
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages/:otherUserId',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/messages',
      input: insertMessageSchema,
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  payments: {
    list: {
      method: 'GET' as const,
      path: '/api/payments',
      responses: {
        200: z.array(z.custom<typeof payments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/payments',
      input: insertPaymentSchema,
      responses: {
        201: z.custom<typeof payments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/payments/:id',
      input: z.object({
        status: z.enum(['pending', 'paid', 'cancelled']),
        paymentMethod: z.enum(['card', 'venmo', 'zelle', 'cash']).optional(),
      }),
      responses: {
        200: z.custom<typeof payments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  wellness: {
    list: {
      method: 'GET' as const,
      path: '/api/wellness',
      responses: {
        200: z.array(z.custom<typeof wellnessCheckins.$inferSelect>()),
      },
    },
    today: {
      method: 'GET' as const,
      path: '/api/wellness/today',
      responses: {
        200: z.custom<typeof wellnessCheckins.$inferSelect>().nullable(),
      },
    },
    checkin: {
      method: 'POST' as const,
      path: '/api/wellness/checkin',
      input: insertWellnessCheckinSchema,
      responses: {
        201: z.custom<typeof wellnessCheckins.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  points: {
    get: {
      method: 'GET' as const,
      path: '/api/points',
      responses: {
        200: z.custom<typeof studentPoints.$inferSelect>(),
      },
    },
    transactions: {
      method: 'GET' as const,
      path: '/api/points/transactions',
      responses: {
        200: z.array(z.custom<typeof pointTransactions.$inferSelect>()),
      },
    },
  },
  workouts: {
    complete: {
      method: 'POST' as const,
      path: '/api/workouts/complete',
      input: z.object({
        routineId: z.number(),
      }),
      responses: {
        201: z.custom<typeof workoutCompletions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    completions: {
      method: 'GET' as const,
      path: '/api/workouts/completions',
      responses: {
        200: z.array(z.custom<typeof workoutCompletions.$inferSelect>()),
      },
    },
  },
  trainer: {
    subscription: {
      method: 'GET' as const,
      path: '/api/trainer/subscription',
      responses: {
        200: z.custom<typeof trainerSubscriptions.$inferSelect>().nullable(),
      },
    },
    studentCount: {
      method: 'GET' as const,
      path: '/api/trainer/students/count',
      responses: {
        200: z.object({ count: z.number(), limit: z.number(), isPremium: z.boolean(), planId: z.string() }),
      },
    },
    setPlan: {
      method: 'POST' as const,
      path: '/api/trainer/plan',
      input: z.object({ planId: z.enum(['free', 'pro', 'elite']) }),
      responses: {
        200: z.custom<typeof trainerSubscriptions.$inferSelect>(),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
