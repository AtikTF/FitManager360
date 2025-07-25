const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console(),
  ],
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:8081',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', apiLimiter);

// MongoDB connection
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/fitmanager_routines',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.connection.on('connected', () => {
  logger.info('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

// Exercise Schema
const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    muscleGroups: [
      {
        type: String,
        enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio'],
      },
    ],
    equipment: [
      {
        type: String,
        enum: [
          'bodyweight',
          'dumbbells',
          'barbell',
          'machine',
          'cable',
          'resistance_band',
          'kettlebell',
        ],
      },
    ],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    instructions: [String],
    tips: [String],
    imageUrl: String,
    videoUrl: String,
  },
  {
    timestamps: true,
  }
);

// Workout Exercise Schema (for routine exercises with sets/reps)
const workoutExerciseSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true,
  },
  sets: [
    {
      reps: Number,
      weight: Number,
      duration: Number, // in seconds
      rest: Number, // rest time in seconds
      completed: {
        type: Boolean,
        default: false,
      },
    },
  ],
  notes: String,
  order: {
    type: Number,
    default: 0,
  },
});

// Routine Schema
const routineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    exercises: [workoutExerciseSchema],
    tags: [String],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    estimatedDuration: {
      type: Number, // in minutes
      default: 30,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: [
        'strength',
        'cardio',
        'flexibility',
        'sports',
        'rehabilitation',
        'weight_loss',
        'muscle_gain',
      ],
      default: 'strength',
    },
    equipment: [
      {
        type: String,
        enum: [
          'bodyweight',
          'dumbbells',
          'barbell',
          'machine',
          'cable',
          'resistance_band',
          'kettlebell',
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Workout Log Schema
const workoutLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    routine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Routine',
      required: true,
    },
    exercises: [
      {
        exercise: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Exercise',
          required: true,
        },
        sets: [
          {
            reps: Number,
            weight: Number,
            duration: Number,
            rest: Number,
            completed: Boolean,
          },
        ],
        notes: String,
      },
    ],
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: Date,
    duration: Number, // in minutes
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

const Exercise = mongoose.model('Exercise', exerciseSchema);
const Routine = mongoose.model('Routine', routineSchema);
const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'your-secret-key',
    (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    }
  );
};

// Validation schemas
const routineSchema_validation = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500),
  exercises: Joi.array().items(
    Joi.object({
      exercise: Joi.string().required(),
      sets: Joi.array().items(
        Joi.object({
          reps: Joi.number().min(1).max(1000),
          weight: Joi.number().min(0).max(1000),
          duration: Joi.number().min(1).max(3600),
          rest: Joi.number().min(0).max(600),
        })
      ),
      notes: Joi.string().max(500),
      order: Joi.number().min(0),
    })
  ),
  tags: Joi.array().items(Joi.string()),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
  estimatedDuration: Joi.number().min(1).max(480),
  isPublic: Joi.boolean(),
  category: Joi.string().valid(
    'strength',
    'cardio',
    'flexibility',
    'sports',
    'rehabilitation',
    'weight_loss',
    'muscle_gain'
  ),
  equipment: Joi.array().items(
    Joi.string().valid(
      'bodyweight',
      'dumbbells',
      'barbell',
      'machine',
      'cable',
      'resistance_band',
      'kettlebell'
    )
  ),
});

const exerciseSchema_validation = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500),
  muscleGroups: Joi.array().items(
    Joi.string().valid(
      'chest',
      'back',
      'shoulders',
      'arms',
      'legs',
      'core',
      'cardio'
    )
  ),
  equipment: Joi.array().items(
    Joi.string().valid(
      'bodyweight',
      'dumbbells',
      'barbell',
      'machine',
      'cable',
      'resistance_band',
      'kettlebell'
    )
  ),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
  instructions: Joi.array().items(Joi.string()),
  tips: Joi.array().items(Joi.string()),
  imageUrl: Joi.string().uri(),
  videoUrl: Joi.string().uri(),
});

const workoutLogSchema_validation = Joi.object({
  routine: Joi.string().required(),
  exercises: Joi.array().items(
    Joi.object({
      exercise: Joi.string().required(),
      sets: Joi.array().items(
        Joi.object({
          reps: Joi.number().min(1).max(1000),
          weight: Joi.number().min(0).max(1000),
          duration: Joi.number().min(1).max(3600),
          rest: Joi.number().min(0).max(600),
          completed: Joi.boolean(),
        })
      ),
      notes: Joi.string().max(500),
    })
  ),
  endTime: Joi.date(),
  duration: Joi.number().min(1).max(480),
  notes: Joi.string().max(500),
  rating: Joi.number().min(1).max(5),
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'routine-service' });
});

// Exercise routes
// Estadísticas de ejercicios (debe ir antes que /exercises/:id)
app.get('/exercises/stats', authenticateToken, async (req, res) => {
  try {
    // Estadísticas generales
    const totalExercises = await Exercise.countDocuments();

    // Ejercicios por grupo muscular (ignorar vacíos/nulos)
    const muscleGroupStats = await Exercise.aggregate([
      { $match: { muscleGroups: { $exists: true, $ne: [] } } },
      { $unwind: '$muscleGroups' },
      { $match: { muscleGroups: { $ne: null, $ne: '' } } },
      { $group: { _id: '$muscleGroups', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Ejercicios por dificultad (ignorar vacíos/nulos)
    const difficultyStats = await Exercise.aggregate([
      { $match: { difficulty: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Ejercicios por equipo (ignorar vacíos/nulos)
    const equipmentStats = await Exercise.aggregate([
      { $match: { equipment: { $exists: true, $ne: [] } } },
      { $unwind: '$equipment' },
      { $match: { equipment: { $ne: null, $ne: '' } } },
      { $group: { _id: '$equipment', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Ejercicios más recientes (ignorar los que no tengan nombre)
    const recentExercises = await Exercise.find({
      name: { $exists: true, $ne: null, $ne: '' },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name difficulty muscleGroups createdAt');

    res.json({
      totalExercises,
      stats: {
        byMuscleGroup: muscleGroupStats,
        byDifficulty: difficultyStats,
        byEquipment: equipmentStats,
      },
      recentExercises,
    });
  } catch (error) {
    logger.error('Admin exercise stats error:', error);
    // Log detallado para depuración
    if (error && error.stack) {
      console.error('STACK TRACE:', error.stack);
    }
    if (error && error.message) {
      console.error('ERROR MESSAGE:', error.message);
    }
    res
      .status(500)
      .json({ error: 'Internal server error', details: error.message });
  }
});
// ...existing code...
app.get('/exercises', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      muscleGroup,
      equipment,
      difficulty,
      search,
    } = req.query;
    const filter = {};

    if (muscleGroup) filter.muscleGroups = muscleGroup;
    if (equipment) filter.equipment = equipment;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const exercises = await Exercise.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Exercise.countDocuments(filter);

    res.json({
      exercises,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    logger.error('Get exercises error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/exercises/:id', authenticateToken, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    res.json(exercise);
  } catch (error) {
    logger.error('Get exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/exercises', authenticateToken, async (req, res) => {
  try {
    const { error } = exerciseSchema_validation.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const exercise = new Exercise(req.body);
    await exercise.save();

    logger.info(`Exercise created: ${exercise.name} by user ${req.user.id}`);
    res.status(201).json(exercise);
  } catch (error) {
    logger.error('Create exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Routine routes
app.get('/routines', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, difficulty, isPublic } = req.query;
    const filter = { 
      userId: req.user.id,
      isActive: true 
    };

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';

    logger.info(`Fetching routines for user: ${req.user.id}, filter:`, filter);

    const routines = await Routine.find(filter)
      .populate('exercises.exercise')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Routine.countDocuments(filter);

    logger.info(`Found ${routines.length} routines for user ${req.user.id}`);

    res.json({
      routines,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    logger.error('Get routines error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/routines/:id', authenticateToken, async (req, res) => {
  try {
    const routine = await Routine.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user.id }, { isPublic: true }],
    }).populate('exercises.exercise');

    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    res.json(routine);
  } catch (error) {
    logger.error('Get routine error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/routines', authenticateToken, async (req, res) => {
  try {
    const { error } = routineSchema_validation.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const routine = new Routine({
      ...req.body,
      userId: req.user.id,
    });

    await routine.save();
    await routine.populate('exercises.exercise');

    logger.info(`Routine created: ${routine.name} by user ${req.user.id}`);
    res.status(201).json(routine);
  } catch (error) {
    logger.error('Create routine error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/routines/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = routineSchema_validation.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const routine = await Routine.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    ).populate('exercises.exercise');

    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    logger.info(`Routine updated: ${routine.name} by user ${req.user.id}`);
    res.json(routine);
  } catch (error) {
    logger.error('Update routine error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/routines/:id', authenticateToken, async (req, res) => {
  try {
    logger.info(
      `Intentando eliminar rutina. userId: ${
        req.user && req.user.id
      }, routineId: ${req.params.id}`
    );
    const routine = await Routine.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!routine) {
      logger.warn(
        `No se encontró rutina para eliminar. userId: ${
          req.user && req.user.id
        }, routineId: ${req.params.id}`
      );
      return res.status(404).json({ error: 'Routine not found' });
    }

    logger.info(`Routine deleted: ${routine.name} by user ${req.user.id}`);
    res.json({ message: 'Routine deleted successfully' });
  } catch (error) {
    logger.error('Delete routine error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Workout log routes
app.get('/workout-logs', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const filter = { userId: req.user.id };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await WorkoutLog.find(filter)
      .populate('routine')
      .populate('exercises.exercise')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await WorkoutLog.countDocuments(filter);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    logger.error('Get workout logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/workout-logs', authenticateToken, async (req, res) => {
  try {
    const { error } = workoutLogSchema_validation.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const log = new WorkoutLog({
      ...req.body,
      userId: req.user.id,
    });

    await log.save();
    await log.populate('routine');
    await log.populate('exercises.exercise');

    logger.info(`Workout log created by user ${req.user.id}`);
    res.status(201).json(log);
  } catch (error) {
    logger.error('Create workout log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get popular routines
app.get('/routines/popular', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const routines = await Routine.find({ isPublic: true })
      .populate('exercises.exercise')
      .limit(limit * 1)
      .sort({ createdAt: -1 });

    res.json({ routines });
  } catch (error) {
    logger.error('Get popular routines error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  logger.info(`Routine Service running on port ${PORT}`);
});

module.exports = app;
