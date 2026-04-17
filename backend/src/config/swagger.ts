import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GymTrack API',
      version: '1.0.0',
      description: 'REST API for GymTrack — workout tracking, nutrition, AI coach',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Local dev' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & user profile' },
      { name: 'Exercises', description: 'Exercise library' },
      { name: 'Plans', description: 'Workout plans & days' },
      { name: 'Workouts', description: 'Workout sessions & sets' },
      { name: 'Schedule', description: 'Scheduled workouts' },
      { name: 'Progress', description: 'Body measurements & personal records' },
      { name: 'Nutrition', description: 'Nutrition plans, food logs & food search' },
      { name: 'Notifications', description: 'Web Push subscriptions' },
      { name: 'AI', description: 'AI coach conversations & insights' },
    ],
    paths: {
      // ── HEALTH ──────────────────────────────────────────────────────────
      '/health': {
        get: {
          tags: ['Auth'],
          summary: 'Health check',
          security: [],
          responses: { '200': { description: 'OK' } },
        },
      },

      // ── AUTH ─────────────────────────────────────────────────────────────
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register new account',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'name'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'User created' },
            '400': { description: 'Validation error' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login (email/password)',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Returns access token + sets refresh cookie' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout (invalidate refresh token)',
          responses: { '200': { description: 'Logged out' } },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Get new access token via refresh cookie',
          security: [],
          responses: {
            '200': { description: 'New access token' },
            '401': { description: 'Refresh token invalid/expired' },
          },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Send password reset email',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string', format: 'email' } },
                },
              },
            },
          },
          responses: { '200': { description: 'Email sent (if account exists)' } },
        },
      },
      '/api/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password with token from email',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'new_password'],
                  properties: {
                    token: { type: 'string' },
                    new_password: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Password updated' } },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user info',
          responses: { '200': { description: 'User object' } },
        },
      },
      '/api/auth/profile': {
        put: {
          tags: ['Auth'],
          summary: 'Update user profile',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    height_cm: { type: 'number' },
                    gender: { type: 'string', enum: ['male', 'female', 'other'] },
                    birthdate: { type: 'string', format: 'date' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Profile updated' } },
        },
      },
      '/api/auth/settings': {
        put: {
          tags: ['Auth'],
          summary: 'Update user settings',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    weight_unit: { type: 'string', enum: ['kg', 'lbs'] },
                    timezone: { type: 'string' },
                    notifications_enabled: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Settings updated' } },
        },
      },
      '/api/auth/google': {
        get: {
          tags: ['Auth'],
          summary: 'Redirect to Google OAuth consent screen',
          security: [],
          responses: { '302': { description: 'Redirect to Google' } },
        },
      },

      // ── EXERCISES ────────────────────────────────────────────────────────
      '/api/exercises': {
        get: {
          tags: ['Exercises'],
          summary: 'List exercises (filter + paginate)',
          parameters: [
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'muscle', schema: { type: 'string' } },
            { in: 'query', name: 'equipment', schema: { type: 'string' } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
            { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } },
          ],
          responses: { '200': { description: 'List of exercises' } },
        },
        post: {
          tags: ['Exercises'],
          summary: 'Create custom exercise',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'primary_muscle', 'equipment'],
                  properties: {
                    name: { type: 'string' },
                    primary_muscle: { type: 'string', enum: ['chest','back','legs','shoulders','arms','core','cardio','full_body'] },
                    equipment: { type: 'string', enum: ['barbell','dumbbell','machine','cable','bodyweight','other'] },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Exercise created' } },
        },
      },
      '/api/exercises/{id}': {
        get: {
          tags: ['Exercises'],
          summary: 'Get exercise details + PR history',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Exercise detail' }, '404': { description: 'Not found' } },
        },
        delete: {
          tags: ['Exercises'],
          summary: 'Delete custom exercise (soft)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } },
        },
      },

      // ── PLANS ────────────────────────────────────────────────────────────
      '/api/plans': {
        get: {
          tags: ['Plans'],
          summary: "List user's workout plans",
          responses: { '200': { description: 'List of plans' } },
        },
        post: {
          tags: ['Plans'],
          summary: 'Create a new workout plan',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'split_type'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    split_type: { type: 'string', enum: ['full_body','upper_lower','ppl','custom'] },
                    duration_weeks: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Plan created' } },
        },
      },
      '/api/plans/{id}': {
        get: {
          tags: ['Plans'],
          summary: 'Plan details + days & exercises',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Plan detail' } },
        },
        put: {
          tags: ['Plans'],
          summary: 'Update plan',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    split_type: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Updated' } },
        },
        delete: {
          tags: ['Plans'],
          summary: 'Delete plan (soft)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } },
        },
      },
      '/api/plans/{id}/activate': {
        post: {
          tags: ['Plans'],
          summary: 'Activate plan',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Activated' } },
        },
      },
      '/api/plans/{id}/duplicate': {
        post: {
          tags: ['Plans'],
          summary: 'Duplicate plan (deep copy)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '201': { description: 'Duplicated' } },
        },
      },
      '/api/plans/{id}/days': {
        post: {
          tags: ['Plans'],
          summary: 'Add a plan day',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['day_of_week'],
                  properties: {
                    day_of_week: { type: 'integer', minimum: 0, maximum: 6 },
                    name: { type: 'string' },
                    order_index: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Day added' } },
        },
      },
      '/api/plans/{id}/days/{dayId}': {
        put: {
          tags: ['Plans'],
          summary: 'Update plan day',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'dayId', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Updated' } },
        },
        delete: {
          tags: ['Plans'],
          summary: 'Delete plan day',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'dayId', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Deleted' } },
        },
      },
      '/api/plans/{id}/days/{dayId}/exercises': {
        post: {
          tags: ['Plans'],
          summary: 'Add exercise to plan day',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'dayId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['exercise_id'],
                  properties: {
                    exercise_id: { type: 'string' },
                    sets: { type: 'integer' },
                    reps_min: { type: 'integer' },
                    reps_max: { type: 'integer' },
                    rest_seconds: { type: 'integer', default: 90 },
                    order_index: { type: 'integer' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Exercise added to day' } },
        },
      },
      '/api/plans/{id}/days/{dayId}/exercises/{exId}': {
        put: {
          tags: ['Plans'],
          summary: 'Update sets/reps/rest for plan exercise',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'dayId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'exId', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Updated' } },
        },
        delete: {
          tags: ['Plans'],
          summary: 'Remove exercise from plan day',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'dayId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'exId', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Removed' } },
        },
      },

      // ── WORKOUT SESSIONS ─────────────────────────────────────────────────
      '/api/workouts/sessions': {
        get: {
          tags: ['Workouts'],
          summary: 'Workout history',
          parameters: [
            { in: 'query', name: 'from', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'to', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
            { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } },
          ],
          responses: { '200': { description: 'Session list' } },
        },
        post: {
          tags: ['Workouts'],
          summary: 'Start a new workout session',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['started_at'],
                  properties: {
                    name: { type: 'string' },
                    plan_day_id: { type: 'string' },
                    scheduled_id: { type: 'string' },
                    started_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Session started' } },
        },
      },
      '/api/workouts/sessions/{id}': {
        get: {
          tags: ['Workouts'],
          summary: 'Session details + all sets',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Session detail' } },
        },
        put: {
          tags: ['Workouts'],
          summary: 'End session / update notes',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ended_at: { type: 'string', format: 'date-time' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Updated' } },
        },
      },
      '/api/workouts/sessions/{id}/sets': {
        post: {
          tags: ['Workouts'],
          summary: 'Log one set',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['exercise_id', 'set_number'],
                  properties: {
                    exercise_id: { type: 'string' },
                    set_number: { type: 'integer' },
                    reps: { type: 'integer' },
                    weight_kg: { type: 'number' },
                    duration_seconds: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Set logged' } },
        },
      },
      '/api/workouts/sessions/{id}/sets/{setId}': {
        put: {
          tags: ['Workouts'],
          summary: 'Edit a logged set',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'setId', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reps: { type: 'integer' },
                    weight_kg: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Set updated' } },
        },
        delete: {
          tags: ['Workouts'],
          summary: 'Delete a logged set',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'setId', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Deleted' } },
        },
      },

      // ── SCHEDULE ─────────────────────────────────────────────────────────
      '/api/schedule': {
        get: {
          tags: ['Schedule'],
          summary: 'Workout schedule by date range',
          parameters: [
            { in: 'query', name: 'from', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'to', schema: { type: 'string', format: 'date' } },
          ],
          responses: { '200': { description: 'Scheduled workouts' } },
        },
        post: {
          tags: ['Schedule'],
          summary: 'Create scheduled workout',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['scheduled_date'],
                  properties: {
                    plan_day_id: { type: 'string' },
                    name: { type: 'string' },
                    scheduled_date: { type: 'string', format: 'date' },
                    scheduled_time: { type: 'string', example: '07:30' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Scheduled' } },
        },
      },
      '/api/schedule/{id}': {
        put: {
          tags: ['Schedule'],
          summary: 'Update scheduled workout',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Updated' } },
        },
        delete: {
          tags: ['Schedule'],
          summary: 'Cancel / delete scheduled workout',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } },
        },
      },

      // ── PROGRESS ─────────────────────────────────────────────────────────
      '/api/progress/measurements': {
        get: {
          tags: ['Progress'],
          summary: 'Body measurement history',
          parameters: [
            { in: 'query', name: 'from', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'to', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
            { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } },
          ],
          responses: { '200': { description: 'Measurements' } },
        },
        post: {
          tags: ['Progress'],
          summary: 'Log new measurements',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['measured_at'],
                  properties: {
                    measured_at: { type: 'string', format: 'date' },
                    weight_kg: { type: 'number' },
                    body_fat_pct: { type: 'number' },
                    chest_cm: { type: 'number' },
                    waist_cm: { type: 'number' },
                    hips_cm: { type: 'number' },
                    left_arm_cm: { type: 'number' },
                    right_arm_cm: { type: 'number' },
                    left_thigh_cm: { type: 'number' },
                    right_thigh_cm: { type: 'number' },
                    photo_url: { type: 'string' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Logged' } },
        },
      },
      '/api/progress/charts': {
        get: {
          tags: ['Progress'],
          summary: 'Chart data',
          parameters: [
            { in: 'query', name: 'type', required: true, schema: { type: 'string', enum: ['weight', 'volume', 'strength'] } },
            { in: 'query', name: 'from', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'to', schema: { type: 'string', format: 'date' } },
          ],
          responses: { '200': { description: 'Chart data points' } },
        },
      },
      '/api/progress/records': {
        get: {
          tags: ['Progress'],
          summary: 'All personal records per exercise',
          responses: { '200': { description: 'Personal records' } },
        },
      },

      // ── NUTRITION ────────────────────────────────────────────────────────
      '/api/nutrition/plan': {
        get: {
          tags: ['Nutrition'],
          summary: 'Get active nutrition plan',
          responses: { '200': { description: 'Nutrition plan' } },
        },
        post: {
          tags: ['Nutrition'],
          summary: 'Create nutrition plan',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    daily_calories: { type: 'integer' },
                    protein_g: { type: 'integer' },
                    carbs_g: { type: 'integer' },
                    fat_g: { type: 'integer' },
                    start_date: { type: 'string', format: 'date' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Plan created' } },
        },
      },
      '/api/nutrition/plan/{id}': {
        put: {
          tags: ['Nutrition'],
          summary: 'Update calorie/macro goals',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Updated' } },
        },
      },
      '/api/nutrition/logs': {
        get: {
          tags: ['Nutrition'],
          summary: 'Food log by date',
          parameters: [
            { in: 'query', name: 'date', schema: { type: 'string', format: 'date', description: 'Defaults to today' } },
          ],
          responses: { '200': { description: 'Food log entries' } },
        },
        post: {
          tags: ['Nutrition'],
          summary: 'Log a new meal',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['food_id', 'logged_at', 'meal_type', 'quantity_g'],
                  properties: {
                    food_id: { type: 'string' },
                    logged_at: { type: 'string', format: 'date' },
                    meal_type: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
                    quantity_g: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Logged' } },
        },
      },
      '/api/nutrition/logs/{id}': {
        delete: {
          tags: ['Nutrition'],
          summary: 'Delete food log entry',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } },
        },
      },
      '/api/nutrition/foods/search': {
        get: {
          tags: ['Nutrition'],
          summary: 'Search foods (Open Food Facts + custom)',
          parameters: [
            { in: 'query', name: 'q', required: true, schema: { type: 'string' } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          ],
          responses: { '200': { description: 'Food results' } },
        },
      },
      '/api/nutrition/foods': {
        post: {
          tags: ['Nutrition'],
          summary: 'Add custom food item',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'calories_per100g'],
                  properties: {
                    name: { type: 'string' },
                    calories_per100g: { type: 'number' },
                    protein_per100g: { type: 'number' },
                    carbs_per100g: { type: 'number' },
                    fat_per100g: { type: 'number' },
                    serving_size_g: { type: 'number' },
                    serving_unit: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Food created' } },
        },
      },

      // ── NOTIFICATIONS ────────────────────────────────────────────────────
      '/api/notifications/subscribe': {
        post: {
          tags: ['Notifications'],
          summary: 'Register Web Push subscription',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['endpoint', 'keys'],
                  properties: {
                    endpoint: { type: 'string' },
                    keys: {
                      type: 'object',
                      properties: {
                        p256dh: { type: 'string' },
                        auth: { type: 'string' },
                      },
                    },
                    user_agent: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Subscribed' } },
        },
        delete: {
          tags: ['Notifications'],
          summary: 'Unsubscribe device from push notifications',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['endpoint'],
                  properties: { endpoint: { type: 'string' } },
                },
              },
            },
          },
          responses: { '200': { description: 'Unsubscribed' } },
        },
      },

      // ── AI COACH ─────────────────────────────────────────────────────────
      '/api/ai/conversations': {
        get: {
          tags: ['AI'],
          summary: 'List conversations',
          responses: { '200': { description: 'Conversations list' } },
        },
        post: {
          tags: ['AI'],
          summary: 'Create new conversation',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    context_type: { type: 'string', enum: ['general', 'workout_analysis', 'nutrition_advice', 'progress_review'] },
                    title: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Conversation created' } },
        },
      },
      '/api/ai/conversations/{id}/messages': {
        get: {
          tags: ['AI'],
          summary: 'Message history of a conversation',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Messages' } },
        },
        post: {
          tags: ['AI'],
          summary: 'Send message, receive AI response',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: { content: { type: 'string' } },
                },
              },
            },
          },
          responses: { '200': { description: 'AI response (streamed)' } },
        },
      },
      '/api/ai/insights': {
        get: {
          tags: ['AI'],
          summary: 'AI-generated insights',
          parameters: [
            { in: 'query', name: 'period', schema: { type: 'string', enum: ['week', 'month'] } },
          ],
          responses: { '200': { description: 'Insights' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
