export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  exercises: {
    all: (params?: object) => ['exercises', params] as const,
    detail: (id: string) => ['exercises', id] as const,
  },
  workouts: {
    sessions: (params?: object) => ['workouts', 'sessions', params] as const,
    session: (id: string) => ['workouts', 'sessions', id] as const,
  },
  plans: {
    all: () => ['plans'] as const,
    detail: (id: string) => ['plans', id] as const,
  },
  schedule: (params?: object) => ['schedule', params] as const,
  progress: {
    measurements: () => ['progress', 'measurements'] as const,
    charts: () => ['progress', 'charts'] as const,
    records: () => ['progress', 'records'] as const,
  },
  nutrition: {
    plan: () => ['nutrition', 'plan'] as const,
    logs: (date?: string) => ['nutrition', 'logs', date] as const,
    foods: (search?: string) => ['nutrition', 'foods', search] as const,
  },
  ai: {
    conversations: () => ['ai', 'conversations'] as const,
    messages: (conversationId: string) => ['ai', 'conversations', conversationId, 'messages'] as const,
    insights: () => ['ai', 'insights'] as const,
  },
};
