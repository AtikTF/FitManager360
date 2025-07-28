import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  FitnessCenter,
  Timeline,
  TrendingUp,
  EmojiEvents,
  CalendarToday,
  Timer,
  LocalFireDepartment,
  MonitorWeight,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalRoutines: 0,
    stats: {
      byCategory: [],
      byDifficulty: [],
      byDuration: [],
    },
    recentRoutines: [],
  });
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchProgressData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Obtener rutinas del usuario
      const routinesResponse = await axios.get('/api/routines');
      const routines = routinesResponse.data.routines || [];
      
      // Procesar estadísticas de rutinas
      const processedData = processRoutineStats(routines);
      setDashboardData(processedData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({
        totalRoutines: 0,
        stats: {
          byCategory: [],
          byDifficulty: [],
          byDuration: [],
        },
        recentRoutines: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const processRoutineStats = (routines) => {
    // Estadísticas por categoría
    const categoryStats = {};
    routines.forEach(routine => {
      const category = routine.category || 'sin_categoria';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    const byCategoryArray = Object.entries(categoryStats).map(([key, value]) => ({
      _id: key,
      count: value
    }));

    // Estadísticas por dificultad
    const difficultyStats = {};
    routines.forEach(routine => {
      const difficulty = routine.difficulty || 'sin_dificultad';
      difficultyStats[difficulty] = (difficultyStats[difficulty] || 0) + 1;
    });
    const byDifficultyArray = Object.entries(difficultyStats).map(([key, value]) => ({
      _id: key,
      count: value
    }));

    // Estadísticas por duración (rangos)
    const durationStats = {
      'corta': 0,    // 0-30 min
      'media': 0,    // 31-60 min
      'larga': 0,    // 61+ min
    };
    routines.forEach(routine => {
      const duration = routine.estimatedDuration || 0;
      if (duration <= 30) {
        durationStats['corta']++;
      } else if (duration <= 60) {
        durationStats['media']++;
      } else {
        durationStats['larga']++;
      }
    });
    const byDurationArray = Object.entries(durationStats).map(([key, value]) => ({
      _id: key,
      count: value
    }));

    // Rutinas recientes (últimas 5)
    const recentRoutines = routines
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(routine => ({
        id: routine._id,
        name: routine.name,
        category: routine.category,
        difficulty: routine.difficulty,
        estimatedDuration: routine.estimatedDuration,
        exerciseCount: routine.exercises?.length || 0,
        createdAt: routine.createdAt
      }));

    return {
      totalRoutines: routines.length,
      stats: {
        byCategory: byCategoryArray,
        byDifficulty: byDifficultyArray,
        byDuration: byDurationArray,
      },
      recentRoutines,
    };
  };
  const fetchProgressData = async () => {
    try {
      const response = await axios.get(
        '/api/stats/progress/weight?period=weekly&limit=12'
      );
      // Formatear los datos para el gráfico
      const formattedData =
        response.data.data?.map((item) => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric',
          }),
        })) || [];
      setProgressData(formattedData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      setProgressData([]);
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      strength: 'Fuerza',
      cardio: 'Cardio',
      flexibility: 'Flexibilidad',
      sports: 'Deportes',
      rehabilitation: 'Rehabilitación',
      weight_loss: 'Pérdida de peso',
      muscle_gain: 'Ganancia muscular',
      sin_categoria: 'Sin categoría',
    };
    return labels[category] || category;
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      sin_dificultad: 'Sin dificultad',
    };
    return labels[difficulty] || difficulty;
  };

  const getDurationLabel = (duration) => {
    const labels = {
      corta: 'Corta (≤30 min)',
      media: 'Media (31-60 min)',
      larga: 'Larga (>60 min)',
    };
    return labels[duration] || duration;
  };
  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card
      elevation={2}
      sx={{ height: '100%' }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton sx={{ color: color, mr: 2 }}>{icon}</IconButton>
          <Typography
            variant='h6'
            component='div'
          >
            {title}
          </Typography>
        </Box>
        <Typography
          variant='h4'
          component='div'
          sx={{ mb: 1 }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography
            variant='body2'
            color='text.secondary'
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const GoalCard = ({ goal }) => (
    <Card
      elevation={1}
      sx={{ mb: 2 }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography variant='h6'>{goal.title}</Typography>
          <Chip
            label={goal.type}
            color='primary'
            size='small'
          />
        </Box>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ mb: 2 }}
        >
          {goal.description}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
          color='primary'
        >
          <Typography variant='body2'>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
          >
            {goal.progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant='determinate'
          value={goal.progress}
          sx={{ mb: 1 }}
        />
        <Typography
          variant='body2'
          color='text.secondary'
        >
          Fecha límite: {new Date(goal.targetDate).toLocaleDateString('es-ES')}
        </Typography>
      </CardContent>
    </Card>
  );

  const AchievementCard = ({ achievement }) => (
    <Card
      elevation={1}
      sx={{ mb: 2 }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EmojiEvents sx={{ color: 'gold', mr: 2 }} />
          <Typography variant='h6'>{achievement.title}</Typography>
        </Box>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ mb: 1 }}
        >
          {achievement.description}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Chip
            label={`${achievement.points} pts`}
            color='secondary'
            size='small'
          />
          <Typography
            variant='body2'
            color='text.secondary'
          >
            {new Date(achievement.unlockedAt).toLocaleDateString('es-ES')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container
        maxWidth='lg'
        sx={{ mt: 4, mb: 4 }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <Typography>Cargando dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container
      maxWidth='lg'
      sx={{ mt: 4, mb: 4 }}
    >
      <Grid
        container
        spacing={3}
      >
        {/* Header */}
        <Grid
          item
          xs={12}
        >
          <Typography
            variant='h4'
            gutterBottom
          >
            ¡Bienvenido, {user?.profile?.firstName || user?.username}!
          </Typography>
          <Typography
            variant='subtitle1'
            color='text.secondary'
          >
            Email: {user?.email}
          </Typography>
        </Grid>

        {/* Estadísticas principales */}
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <StatCard
            title='Total de Rutinas'
            value={dashboardData.totalRoutines}
            icon={<FitnessCenter />}
            color='primary.main'
            subtitle='Rutinas creadas'
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <StatCard
            title='Categorías'
            value={dashboardData.stats.byCategory.length}
            icon={<Timeline />}
            color='green'
            subtitle='Tipos de categoría'
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <StatCard
            title='Dificultades'
            value={dashboardData.stats.byDifficulty.length}
            icon={<TrendingUp />}
            color='orange'
            subtitle='Niveles de dificultad'
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <StatCard
            title='Duraciones'
            value={dashboardData.stats.byDuration.length}
            icon={<Timer />}
            color='blue'
            subtitle='Rangos de duración'
          />
        </Grid>

        {/* Gráficos de distribución */}
        <Grid
          item
          xs={12}
          md={6}
        >
          <Paper sx={{ p: 2 }}>
            <Typography
              variant='h6'
              gutterBottom
            >
              Rutinas por Categoría
            </Typography>
            <ResponsiveContainer
              width='100%'
              height={250}
            >
              <BarChart data={dashboardData.stats.byCategory.map(item => ({
                ...item,
                _id: getCategoryLabel(item._id)
              }))}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='_id' />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey='count'
                  fill='#8884d8'
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid
          item
          xs={12}
          md={6}
        >
          <Paper sx={{ p: 2 }}>
            <Typography
              variant='h6'
              gutterBottom
            >
              Rutinas por Dificultad
            </Typography>
            <ResponsiveContainer
              width='100%'
              height={250}
            >
              <BarChart data={dashboardData.stats.byDifficulty.map(item => ({
                ...item,
                _id: getDifficultyLabel(item._id)
              }))}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='_id' />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey='count'
                  fill='#82ca9d'
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid
          item
          xs={12}
          md={6}
        >
          <Paper sx={{ p: 2 }}>
            <Typography
              variant='h6'
              gutterBottom
            >
              Rutinas por Duración
            </Typography>
            <ResponsiveContainer
              width='100%'
              height={250}
            >
              <BarChart data={dashboardData.stats.byDuration.map(item => ({
                ...item,
                _id: getDurationLabel(item._id)
              }))}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='_id' />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey='count'
                  fill='#ffc658'
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Rutinas recientes */}
        <Grid
          item
          xs={12}
          md={6}
        >
          <Paper sx={{ p: 2 }}>
            <Typography
              variant='h6'
              gutterBottom
            >
              Rutinas Recientes
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {dashboardData.recentRoutines.length > 0 ? (
                dashboardData.recentRoutines.map((routine) => (
                  <Card
                    key={routine.id}
                    elevation={1}
                    sx={{ mb: 2 }}
                  >
                    <CardContent>
                      <Typography variant='h6'>{routine.name}</Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                      >
                        Categoría: {getCategoryLabel(routine.category)}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                      >
                        Dificultad: {getDifficultyLabel(routine.difficulty)}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                      >
                        Duración: {routine.estimatedDuration} min | Ejercicios: {routine.exerciseCount}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                      >
                        Creada: {new Date(routine.createdAt).toLocaleDateString('es-ES')}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Typography
                  variant='body2'
                  color='text.secondary'
                >
                  No hay rutinas recientes.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
