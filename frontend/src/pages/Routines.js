import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Fab,
  Divider,
  Stack,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Skeleton,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  FitnessCenter,
  AccessTime,
  TrendingUp,
  Visibility,
  Search,
  FilterList,
  PlayArrow,
  Pause,
  ExpandMore,
  ExpandLess,
  Star,
  StarBorder,
  Share,
  ContentCopy,
  RemoveCircle,
  AddCircle,
  DragIndicator,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Routines = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState([]);
  const [publicRoutines, setPublicRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'strength',
    difficulty: 'beginner',
    estimatedDuration: 30,
    isPublic: false,
    exercises: [],
  });
  const [openExercisesDialog, setOpenExercisesDialog] = useState(false);
  const [exercisesToShow, setExercisesToShow] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    if (user) {
      fetchRoutines();
      fetchPublicRoutines();
      fetchExercises();
    }
  }, [user]);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/routines');
      setRoutines(response.data.routines || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
      setError('Error al cargar las rutinas');
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicRoutines = async () => {
    try {
      const response = await axios.get('/api/routines/popular');
      setPublicRoutines(response.data.routines || []);
    } catch (error) {
      console.error('Error fetching public routines:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      setLoadingExercises(true);
      const res = await axios.get('/api/exercises');
      setAvailableExercises(res.data.exercises || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleOpenDialog = (routine = null) => {
    if (routine) {
      setSelectedRoutine(routine);
      setFormData({
        name: routine.name,
        description: routine.description || '',
        category: routine.category,
        difficulty: routine.difficulty,
        estimatedDuration: routine.estimatedDuration,
        isPublic: routine.isPublic,
        exercises: (routine.exercises || []).map((ex, idx) => ({
          exercise: typeof ex.exercise === 'object' ? ex.exercise._id : ex.exercise,
          exerciseName: typeof ex.exercise === 'object' ? ex.exercise.name : 'Ejercicio',
          sets: (ex.sets || []).map((set) => ({
            reps: set.reps ?? '',
            weight: set.weight ?? '',
            duration: set.duration ?? '',
            rest: set.rest ?? '',
          })),
          order: ex.order !== undefined ? ex.order : idx,
        })),
      });
    } else {
      setSelectedRoutine(null);
      setFormData({
        name: '',
        description: '',
        category: 'strength',
        difficulty: 'beginner',
        estimatedDuration: 30,
        isPublic: false,
        exercises: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRoutine(null);
  };

  const handleAddExercise = () => {
    const newExercise = {
      exercise: '',
      exerciseName: '',
      sets: [{ reps: '', weight: '', duration: '', rest: '' }],
      order: formData.exercises.length,
    };
    setFormData({
      ...formData,
      exercises: [...formData.exercises, newExercise],
    });
  };

  const handleRemoveExercise = (index) => {
    const updatedExercises = formData.exercises.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      exercises: updatedExercises,
    });
  };

  const handleExerciseChange = (exerciseIndex, field, value) => {
    const updatedExercises = [...formData.exercises];
    if (field === 'exercise') {
      const selectedExercise = availableExercises.find(ex => ex._id === value);
      updatedExercises[exerciseIndex].exercise = value;
      updatedExercises[exerciseIndex].exerciseName = selectedExercise ? selectedExercise.name : '';
    } else {
      updatedExercises[exerciseIndex][field] = value;
    }
    setFormData({
      ...formData,
      exercises: updatedExercises,
    });
  };

  const handleAddSet = (exerciseIndex) => {
    const updatedExercises = [...formData.exercises];
    updatedExercises[exerciseIndex].sets.push({
      reps: '',
      weight: '',
      duration: '',
      rest: '',
    });
    setFormData({
      ...formData,
      exercises: updatedExercises,
    });
  };

  const handleRemoveSet = (exerciseIndex, setIndex) => {
    const updatedExercises = [...formData.exercises];
    updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.filter(
      (_, i) => i !== setIndex
    );
    setFormData({
      ...formData,
      exercises: updatedExercises,
    });
  };

  const handleSetChange = (exerciseIndex, setIndex, field, value) => {
    const updatedExercises = [...formData.exercises];
    updatedExercises[exerciseIndex].sets[setIndex][field] = value;
    setFormData({
      ...formData,
      exercises: updatedExercises,
    });
  };

  const handleSubmit = async () => {
    const normalizedExercises = formData.exercises
      .filter(ex => ex.exercise) // Solo ejercicios con ejercicio seleccionado
      .map((ex, idx) => {
        const sets = (ex.sets || [])
          .map((set) => ({
            reps: set.reps !== '' && set.reps !== undefined ? Number(set.reps) : undefined,
            weight: set.weight !== '' && set.weight !== undefined ? Number(set.weight) : undefined,
            duration: set.duration !== '' && set.duration !== undefined ? Number(set.duration) : undefined,
            rest: set.rest !== '' && set.rest !== undefined ? Number(set.rest) : undefined,
          }))
          .filter((set) =>
            set.reps !== undefined ||
            set.weight !== undefined ||
            set.duration !== undefined ||
            set.rest !== undefined
          );
        
        return {
          exercise: ex.exercise,
          sets,
          order: ex.order !== undefined ? ex.order : idx,
        };
      });

    const dataToSend = { ...formData, exercises: normalizedExercises };

    try {
      if (selectedRoutine) {
        await axios.put(`/api/routines/${selectedRoutine._id}`, dataToSend);
      } else {
        await axios.post('/api/routines', dataToSend);
      }
      fetchRoutines();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving routine:', error);
      setError('Error al guardar la rutina');
    }
  };

  const handleDelete = async (routineId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta rutina?')) {
      try {
        await axios.delete(`/api/routines/${routineId}`);
        fetchRoutines();
      } catch (error) {
        console.error('Error deleting routine:', error);
        setError('Error al eliminar la rutina');
      }
    }
  };

  const handleCopyRoutine = async (routine) => {
    const copiedRoutine = {
      ...routine,
      name: `${routine.name} (Copia)`,
      isPublic: false,
    };
    delete copiedRoutine._id;
    delete copiedRoutine.userId;
    delete copiedRoutine.createdAt;
    delete copiedRoutine.updatedAt;

    try {
      await axios.post('/api/routines', copiedRoutine);
      fetchRoutines();
    } catch (error) {
      console.error('Error copying routine:', error);
      setError('Error al copiar la rutina');
    }
  };

  const toggleCardExpansion = (routineId) => {
    setExpandedCards(prev => ({
      ...prev,
      [routineId]: !prev[routineId]
    }));
  };

  const getCategoryColor = (category) => {
    const colors = {
      strength: 'primary',
      cardio: 'secondary',
      flexibility: 'success',
      sports: 'warning',
      rehabilitation: 'info',
      weight_loss: 'error',
      muscle_gain: 'primary',
    };
    return colors[category] || 'default';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'error',
    };
    return colors[difficulty] || 'default';
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
    };
    return labels[category] || category;
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
    };
    return labels[difficulty] || difficulty;
  };

  const filteredRoutines = routines.filter(routine => {
    const matchesSearch = routine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || routine.category === filterCategory;
    const matchesDifficulty = !filterDifficulty || routine.difficulty === filterDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const filteredPublicRoutines = publicRoutines.filter(routine => {
    const matchesSearch = routine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || routine.category === filterCategory;
    const matchesDifficulty = !filterDifficulty || routine.difficulty === filterDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const RoutineCard = ({ routine, isPublic = false }) => {
    const isExpanded = expandedCards[routine._id];

    return (
      <Card
        sx={{
          height: 'fit-content',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
          }
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography
              variant='h6'
              component='div'
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                flex: 1,
                mr: 2,
              }}
            >
              {routine.name}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Chip
                label={getCategoryLabel(routine.category)}
                color={getCategoryColor(routine.category)}
                size='small'
                sx={{ fontSize: '0.75rem' }}
              />
              <Chip
                label={getDifficultyLabel(routine.difficulty)}
                color={getDifficultyColor(routine.difficulty)}
                size='small'
                sx={{ fontSize: '0.75rem' }}
              />
            </Stack>
          </Box>

          {/* Description */}
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{
              mb: 2,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: isExpanded ? 'none' : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {routine.description || 'Sin descripción disponible'}
          </Typography>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTime sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
              <Typography variant='caption' color='text.secondary'>
                {routine.estimatedDuration} min
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FitnessCenter sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
              <Typography variant='caption' color='text.secondary'>
                {routine.exercises?.length || 0} ejercicios
              </Typography>
            </Box>
            {isPublic && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Star sx={{ mr: 0.5, fontSize: 16, color: 'warning.main' }} />
                <Typography variant='caption' color='text.secondary'>
                  Público
                </Typography>
              </Box>
            )}
          </Box>

          {/* Badges */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {routine.isPublic && !isPublic && (
              <Chip
                label='Público'
                color='info'
                size='small'
                variant='outlined'
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {isPublic && (
              <Chip
                label='Rutina Popular'
                color='warning'
                size='small'
                variant='outlined'
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Stack>

          {/* Exercises Preview */}
          <Collapse in={isExpanded}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>
              Ejercicios ({routine.exercises?.length || 0})
            </Typography>
            <List dense sx={{ py: 0 }}>
              {(routine.exercises || []).slice(0, 5).map((ex, idx) => {
                const exObj = ex.exercise && typeof ex.exercise === 'object'
                  ? ex.exercise
                  : availableExercises.find(e => e._id === (ex.exercise?._id || ex.exercise));

                return (
                  <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <FitnessCenter sx={{ fontSize: 16, color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={exObj ? exObj.name : `Ejercicio ${idx + 1}`}
                      secondary={`${ex.sets?.length || 0} sets`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                );
              })}
              {(routine.exercises?.length || 0) > 5 && (
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText
                    primary={`... y ${(routine.exercises?.length || 0) - 5} ejercicios más`}
                    primaryTypographyProps={{
                      variant: 'caption',
                      color: 'text.secondary',
                      fontStyle: 'italic'
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Collapse>
        </CardContent>

        <Divider />

        <CardActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size='small'
              startIcon={<Visibility />}
              variant='outlined'
              onClick={() => {
                setExercisesToShow(routine.exercises || []);
                setOpenExercisesDialog(true);
              }}
              sx={{ fontSize: '0.75rem' }}
            >
              Ver Detalles
            </Button>

            <Button
              size='small'
              startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
              variant='text'
              onClick={() => toggleCardExpansion(routine._id)}
              sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
            >
              {isExpanded ? 'Menos' : 'Más'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {isPublic ? (
              <IconButton
                size='small'
                onClick={() => handleCopyRoutine(routine)}
                color='primary'
                title="Copiar rutina"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            ) : (
              <>
                <IconButton
                  size='small'
                  onClick={() => handleOpenDialog(routine)}
                  color='primary'
                  title="Editar rutina"
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size='small'
                  onClick={() => handleDelete(routine._id)}
                  color='error'
                  title="Eliminar rutina"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        </CardActions>
      </Card>
    );
  };

  const SkeletonCard = () => (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="80%" height={32} />
        <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
        <Skeleton variant="text" width="60%" height={20} />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} />
        </Box>
      </CardContent>
      <CardActions>
        <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1, ml: 'auto' }} />
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ backgroundColor: 'white', minHeight: '100vh' }}>
      <Container maxWidth='lg' sx={{ py: 4 }}>
        {/* Header Section */}
        <Paper sx={{ p: 4, mb: 4, backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography
                variant='h3'
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 1,
                }}
              >
                Rutinas de Entrenamiento
              </Typography>
              <Typography variant='h6' color='text.secondary'>
                Gestiona y descubre rutinas personalizadas
              </Typography>
            </Box>
            <Button
              variant='contained'
              size='large'
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ px: 4, py: 1.5 }}
            >
              Nueva Rutina
            </Button>
          </Box>

          {/* Search and Filters */}
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar rutinas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  displayEmpty
                  renderValue={
                    filterCategory !== "" ? undefined : () => "               "
                  }
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="strength">Fuerza</MenuItem>
                  <MenuItem value="cardio">Cardio</MenuItem>
                  <MenuItem value="flexibility">Flexibilidad</MenuItem>
                  <MenuItem value="sports">Deportes</MenuItem>
                  <MenuItem value="rehabilitation">Rehabilitación</MenuItem>
                  <MenuItem value="weight_loss">Pérdida de peso</MenuItem>
                  <MenuItem value="muscle_gain">Ganancia muscular</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Dificultad</InputLabel>
                <Select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  displayEmpty
                  renderValue={
                    filterDifficulty !== "" ? undefined : () => "               "
                  }
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="beginner">Principiante</MenuItem>
                  <MenuItem value="intermediate">Intermedio</MenuItem>
                  <MenuItem value="advanced">Avanzado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterDifficulty('');
                }}
                sx={{ py: 1.5 }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              px: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
              },
            }}
          >
            <Tab
              label={`Mis Rutinas (${filteredRoutines.length})`}
            />
          </Tabs>

          <Divider />

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {/* My Routines Tab */}
            {tabValue === 0 && (
              <>
                {loading ? (
                  <Grid container spacing={3}>
                    {[...Array(6)].map((_, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <SkeletonCard />
                      </Grid>
                    ))}
                  </Grid>
                ) : filteredRoutines.length > 0 ? (
                  <Grid container spacing={3}>
                    {filteredRoutines.map((routine) => (
                      <Grid item xs={12} sm={6} md={4} key={routine._id}>
                        <RoutineCard routine={routine} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <FitnessCenter
                      sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }}
                    />
                    <Typography variant='h5' gutterBottom sx={{ fontWeight: 600 }}>
                      {searchTerm || filterCategory || filterDifficulty
                        ? 'No se encontraron rutinas'
                        : 'No tienes rutinas creadas'
                      }
                    </Typography>
                    <Typography
                      variant='body1'
                      color='text.secondary'
                      sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}
                    >
                      {searchTerm || filterCategory || filterDifficulty
                        ? 'Intenta ajustar los filtros de búsqueda'
                        : 'Crea tu primera rutina personalizada para comenzar tu entrenamiento'
                      }
                    </Typography>
                    {!searchTerm && !filterCategory && !filterDifficulty && (
                      <Button
                        variant='contained'
                        size='large'
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{ px: 4, py: 1.5 }}
                      >
                        Crear Primera Rutina
                      </Button>
                    )}
                  </Box>
                )}
              </>
            )}

          </Box>
        </Paper>

        {/* Floating Action Button */}
        <Fab
          color='primary'
          aria-label='add'
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => handleOpenDialog()}
        >
          <Add />
        </Fab>

        {/* Create/Edit Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth='lg'
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2, maxHeight: '90vh' }
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {selectedRoutine ? 'Editar Rutina' : 'Nueva Rutina'}
            </Typography>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={4}>
              {/* Información Básica */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                  Información Básica
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label='Nombre de la rutina'
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label='Descripción'
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Categoría</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value='strength'>Fuerza</MenuItem>
                        <MenuItem value='cardio'>Cardio</MenuItem>
                        <MenuItem value='flexibility'>Flexibilidad</MenuItem>
                        <MenuItem value='sports'>Deportes</MenuItem>
                        <MenuItem value='rehabilitation'>Rehabilitación</MenuItem>
                        <MenuItem value='weight_loss'>Pérdida de peso</MenuItem>
                        <MenuItem value='muscle_gain'>Ganancia muscular</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Dificultad</InputLabel>
                      <Select
                        value={formData.difficulty}
                        onChange={(e) =>
                          setFormData({ ...formData, difficulty: e.target.value })
                        }
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value='beginner'>Principiante</MenuItem>
                        <MenuItem value='intermediate'>Intermedio</MenuItem>
                        <MenuItem value='advanced'>Avanzado</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label='Duración estimada (min)'
                      type='number'
                      value={formData.estimatedDuration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedDuration: parseInt(e.target.value),
                        })
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isPublic}
                          onChange={(e) =>
                            setFormData({ ...formData, isPublic: e.target.checked })
                          }
                        />
                      }
                      label="Hacer rutina pública"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Ejercicios */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Ejercicios ({formData.exercises.length})
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddExercise}
                    sx={{ borderRadius: 2 }}
                  >
                    Agregar Ejercicio
                  </Button>
                </Box>

                {formData.exercises.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'grey.50' }}>
                    <FitnessCenter sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No hay ejercicios agregados
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Agrega ejercicios para completar tu rutina
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddExercise}
                    >
                      Agregar Primer Ejercicio
                    </Button>
                  </Paper>
                ) : (
                  <Stack spacing={3}>
                    {formData.exercises.map((exercise, exerciseIndex) => (
                      <Accordion key={exerciseIndex} defaultExpanded>
                        <AccordionSummary
                          expandIcon={<ExpandMore />}
                          sx={{
                            backgroundColor: 'primary.50',
                            '&:hover': { backgroundColor: 'primary.100' },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <DragIndicator sx={{ mr: 2, color: 'text.secondary' }} />
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                              {exercise.exerciseName || `Ejercicio ${exerciseIndex + 1}`}
                            </Typography>
                            <Chip
                              label={`${exercise.sets.length} sets`}
                              size="small"
                              color="primary"
                              sx={{ mr: 2 }}
                            />
                            <Tooltip title="Eliminar ejercicio">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveExercise(exerciseIndex);
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 3 }}>
                          <Grid container spacing={3}>
                            {/* Selección de ejercicio */}
                            <Grid item xs={12}>
                              <FormControl fullWidth>
                                <InputLabel>Seleccionar Ejercicio</InputLabel>
                                <Select
                                  value={exercise.exercise}
                                  onChange={(e) =>
                                    handleExerciseChange(exerciseIndex, 'exercise', e.target.value)
                                  }
                                  sx={{ borderRadius: 2 }}
                                >
                                  {availableExercises.map((ex) => (
                                    <MenuItem key={ex._id} value={ex._id}>
                                      {ex.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>

                            {/* Sets */}
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  Sets ({exercise.sets.length})
                                </Typography>
                                <Button
                                  size="small"
                                  startIcon={<AddCircle />}
                                  onClick={() => handleAddSet(exerciseIndex)}
                                  variant="outlined"
                                >
                                  Agregar Set
                                </Button>
                              </Box>

                              {exercise.sets.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'grey.50' }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    No hay sets configurados
                                  </Typography>
                                  <Button
                                    size="small"
                                    startIcon={<AddCircle />}
                                    onClick={() => handleAddSet(exerciseIndex)}
                                    variant="contained"
                                  >
                                    Agregar Primer Set
                                  </Button>
                                </Paper>
                              ) : (
                                <TableContainer component={Paper} variant="outlined">
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Set</TableCell>
                                        <TableCell>Repeticiones</TableCell>
                                        <TableCell>Peso (kg)</TableCell>
                                        <TableCell>Duración (seg)</TableCell>
                                        <TableCell>Descanso (seg)</TableCell>
                                        <TableCell width={50}>Acción</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {exercise.sets.map((set, setIndex) => (
                                        <TableRow key={setIndex}>
                                          <TableCell>
                                            <Chip label={setIndex + 1} size="small" color="primary" />
                                          </TableCell>
                                          <TableCell>
                                            <TextField
                                              size="small"
                                              type="number"
                                              value={set.reps}
                                              onChange={(e) =>
                                                handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value)
                                              }
                                              sx={{ width: 80 }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <TextField
                                              size="small"
                                              type="number"
                                              value={set.weight}
                                              onChange={(e) =>
                                                handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value)
                                              }
                                              sx={{ width: 80 }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <TextField
                                              size="small"
                                              type="number"
                                              value={set.duration}
                                              onChange={(e) =>
                                                handleSetChange(exerciseIndex, setIndex, 'duration', e.target.value)
                                              }
                                              sx={{ width: 80 }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <TextField
                                              size="small"
                                              type="number"
                                              value={set.rest}
                                              onChange={(e) =>
                                                handleSetChange(exerciseIndex, setIndex, 'rest', e.target.value)
                                              }
                                              sx={{ width: 80 }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Tooltip title="Eliminar set">
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                                              >
                                                <RemoveCircle />
                                              </IconButton>
                                            </Tooltip>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              )}
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Stack>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button onClick={handleCloseDialog} size="large" variant="outlined">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              variant='contained'
              size="large"
              sx={{ px: 4 }}
              disabled={!formData.name.trim()}
            >
              {selectedRoutine ? 'Actualizar Rutina' : 'Crear Rutina'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Exercises Detail Dialog */}
        <Dialog
          open={openExercisesDialog}
          onClose={() => setOpenExercisesDialog(false)}
          maxWidth='md'
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Detalles de Ejercicios
            </Typography>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            {exercisesToShow && exercisesToShow.length > 0 ? (
              <Stack spacing={3}>
                {exercisesToShow.map((ex, idx) => {
                  const exObj = ex.exercise && typeof ex.exercise === 'object'
                    ? ex.exercise
                    : availableExercises.find(e => e._id === (ex.exercise?._id || ex.exercise));

                  return (
                    <Paper
                      key={idx}
                      sx={{
                        p: 3,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FitnessCenter sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant='h6' sx={{ fontWeight: 600 }}>
                          {exObj ? exObj.name : `Ejercicio ${idx + 1}`}
                        </Typography>
                      </Box>

                      {exObj && exObj.description && (
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ mb: 2 }}
                        >
                          {exObj.description}
                        </Typography>
                      )}

                      {ex.sets && ex.sets.length > 0 && (
                        <>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>
                            Sets ({ex.sets.length})
                          </Typography>
                          <Grid container spacing={1}>
                            {ex.sets.map((set, sidx) => (
                              <Grid item xs={12} sm={6} md={4} key={sidx}>
                                <Paper
                                  sx={{
                                    p: 2,
                                    backgroundColor: 'grey.50',
                                    border: '1px solid #f0f0f0',
                                  }}
                                >
                                  <Typography variant='caption' color='primary.main' sx={{ fontWeight: 600 }}>
                                    Set {sidx + 1}
                                  </Typography>
                                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                                    <Typography variant='body2'>
                                      <strong>Reps:</strong> {set.reps || 0}
                                    </Typography>
                                    <Typography variant='body2'>
                                      <strong>Peso:</strong> {set.weight || 0} kg
                                    </Typography>
                                    <Typography variant='body2'>
                                      <strong>Duración:</strong> {set.duration || 0} seg
                                    </Typography>
                                    <Typography variant='body2'>
                                      <strong>Descanso:</strong> {set.rest || 0} seg
                                    </Typography>
                                  </Stack>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <FitnessCenter sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant='h6' color='text.secondary'>
                  No hay ejercicios en esta rutina
                </Typography>
              </Box>
            )}
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setOpenExercisesDialog(false)}
              variant="contained"
              size="large"
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Routines;