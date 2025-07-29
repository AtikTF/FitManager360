import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Badge,
  Tooltip,
  Stack,
  Alert,
  CircularProgress,
  InputAdornment,
  Menu,
  MenuItem,
  Fade,
  Slide,
} from '@mui/material';
import {
  Send,
  Add,
  Person,
  Chat as ChatIcon,
  Public,
  Lock,
  Group,
  Search,
  MoreVert,
  EmojiEmotions,
  AttachFile,
  Phone,
  VideoCall,
  Info,
  Close,
  Circle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

const Chat = () => {
  const { user } = useAuth();
  const { 
    socket, 
    connected, 
    onlineUsers, 
    messages, 
    joinRoom, 
    leaveRoom, 
    sendMessage, 
    setMessages 
  } = useSocket();

  const [rooms, setRooms] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreateRoom, setOpenCreateRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    type: 'public'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/chat/rooms');
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Error al cargar las salas de chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/chat/conversations');
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleJoinRoom = async (room) => {
    if (currentRoom) {
      leaveRoom(currentRoom._id);
    }
    
    setCurrentRoom(room);
    joinRoom(room._id);
    
    try {
      const response = await axios.get(`/api/chat/rooms/${room._id}/messages`);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && currentRoom && connected) {
      sendMessage(currentRoom._id, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateRoom = async () => {
    try {
      await axios.post('/api/chat/rooms', newRoomData);
      setOpenCreateRoom(false);
      setNewRoomData({ name: '', description: '', type: 'public' });
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Error al crear la sala');
    }
  };

  const handleStartDirectChat = async (targetUser) => {
    try {
      const response = await axios.post(`/api/chat/users/${targetUser.userId}/chat`);
      const { roomId } = response.data;
      
      const directRoom = {
        _id: roomId,
        name: `Chat con ${targetUser.username}`,
        type: 'direct',
        participants: [
          { userId: user.id, username: user.username },
          { userId: targetUser.userId, username: targetUser.username }
        ]
      };
      
      handleJoinRoom(directRoom);
      fetchConversations();
    } catch (error) {
      console.error('Error starting direct chat:', error);
      setError('Error al iniciar chat directo');
    }
  };

  const filteredOnlineUsers = onlineUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoomIcon = (room) => {
    switch (room.type) {
      case 'public':
        return <Public />;
      case 'private':
        return <Lock />;
      case 'direct':
        return <Person />;
      default:
        return <ChatIcon />;
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3} sx={{ height: 'calc(100vh - 120px)' }}>
          {/* Sidebar - Salas y Usuarios */}
          <Grid item xs={12} md={3}>
            <Paper 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Chat
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setOpenCreateRoom(true)}
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    Nueva Sala
                  </Button>
                </Box>
                
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'rgba(255,255,255,0.7)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&.Mui-focused fieldset': { borderColor: 'white' },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                  }}
                />
              </Box>

              {/* Usuarios en línea */}
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  Usuarios en línea ({filteredOnlineUsers.length})
                </Typography>
                <Box 
                  sx={{ 
                    maxHeight: 200, 
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#c1c1c1',
                      borderRadius: '3px',
                      '&:hover': {
                        background: '#a8a8a8',
                      },
                    },
                  }}
                >
                  {filteredOnlineUsers.length > 0 ? (
                    filteredOnlineUsers.map((onlineUser) => (
                      <Box
                        key={onlineUser.userId}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                        onClick={() => handleStartDirectChat(onlineUser)}
                      >
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            <Circle 
                              sx={{ 
                                fontSize: 12, 
                                color: 'success.main',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                              }} 
                            />
                          }
                        >
                          <Avatar 
                            sx={{ 
                              width: 36, 
                              height: 36, 
                              fontSize: '0.9rem',
                              backgroundColor: 'primary.main'
                            }}
                          >
                            {onlineUser.username.charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>
                        <Box sx={{ ml: 2, flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {onlineUser.username}
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            En línea
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios en línea'}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Salas de chat */}
              <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, pb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Salas de chat
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    px: 2,
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#c1c1c1',
                      borderRadius: '3px',
                      '&:hover': {
                        background: '#a8a8a8',
                      },
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : rooms.length > 0 ? (
                    rooms.map((room) => (
                      <Card
                        key={room._id}
                        sx={{
                          mb: 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: currentRoom?._id === room._id ? 'primary.50' : 'white',
                          border: currentRoom?._id === room._id ? '2px solid' : '1px solid',
                          borderColor: currentRoom?._id === room._id ? 'primary.main' : 'divider',
                          '&:hover': {
                            backgroundColor: currentRoom?._id === room._id ? 'primary.100' : 'action.hover',
                            transform: 'translateY(-1px)',
                          },
                        }}
                        onClick={() => handleJoinRoom(room)}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ mr: 2, color: 'primary.main' }}>
                              {getRoomIcon(room)}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {room.name}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block'
                                }}
                              >
                                {room.description || 'Sin descripción'}
                              </Typography>
                            </Box>
                            <Chip
                              label={room.participants?.length || 0}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                      No hay salas disponibles
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Área de chat principal */}
          <Grid item xs={12} md={9}>
            <Paper 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              {currentRoom ? (
                <>
                  {/* Header del chat */}
                  <Box 
                    sx={{ 
                      p: 2, 
                      backgroundColor: 'primary.main', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 2 }}>
                        {getRoomIcon(currentRoom)}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {currentRoom.name}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {currentRoom.participants?.length || 0} participantes
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        sx={{ color: 'white' }}
                        disabled
                      >
                        <Phone />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        sx={{ color: 'white' }}
                        disabled
                      >
                        <VideoCall />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        sx={{ color: 'white' }}
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Área de mensajes */}
                  <Box 
                    ref={messagesContainerRef}
                    sx={{ 
                      flex: 1, 
                      overflowY: 'auto',
                      p: 2,
                      backgroundColor: '#fafafa',
                      maxHeight: 'calc(100vh - 300px)',
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#c1c1c1',
                        borderRadius: '4px',
                        '&:hover': {
                          background: '#a8a8a8',
                        },
                      },
                    }}
                  >
                    {messages.length > 0 ? (
                      <Stack spacing={2}>
                        {messages.map((message, index) => {
                          const isOwnMessage = message.senderId === user?.id;
                          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                          
                          return (
                            <Fade key={message.id || index} in={true} timeout={300}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                                  alignItems: 'flex-end',
                                  gap: 1,
                                }}
                              >
                                {!isOwnMessage && (
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      fontSize: '0.8rem',
                                      backgroundColor: 'primary.main',
                                      visibility: showAvatar ? 'visible' : 'hidden',
                                    }}
                                  >
                                    {message.senderUsername?.charAt(0).toUpperCase()}
                                  </Avatar>
                                )}
                                
                                <Box
                                  sx={{
                                    maxWidth: '70%',
                                    minWidth: '100px',
                                  }}
                                >
                                  {!isOwnMessage && showAvatar && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'text.secondary',
                                        ml: 1,
                                        display: 'block',
                                        mb: 0.5,
                                      }}
                                    >
                                      {message.senderUsername}
                                    </Typography>
                                  )}
                                  
                                  <Paper
                                    sx={{
                                      p: 1.5,
                                      backgroundColor: isOwnMessage ? 'primary.main' : 'white',
                                      color: isOwnMessage ? 'white' : 'text.primary',
                                      borderRadius: 2,
                                      borderTopLeftRadius: !isOwnMessage && showAvatar ? 1 : 2,
                                      borderTopRightRadius: isOwnMessage && showAvatar ? 1 : 2,
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                                      {message.content}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        opacity: 0.7,
                                        display: 'block',
                                        textAlign: 'right',
                                        mt: 0.5,
                                        fontSize: '0.7rem',
                                      }}
                                    >
                                      {formatTime(message.createdAt)}
                                    </Typography>
                                  </Paper>
                                </Box>
                              </Box>
                            </Fade>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </Stack>
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          color: 'text.secondary',
                        }}
                      >
                        <ChatIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" gutterBottom>
                          No hay mensajes aún
                        </Typography>
                        <Typography variant="body2">
                          Sé el primero en enviar un mensaje en esta sala
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Input de mensaje */}
                  <Box sx={{ p: 2, backgroundColor: 'white', borderTop: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <IconButton size="small" disabled>
                        <AttachFile />
                      </IconButton>
                      <IconButton size="small" disabled>
                        <EmojiEmotions />
                      </IconButton>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Escribe un mensaje..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={!connected}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            backgroundColor: '#f8f9fa',
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || !connected}
                        sx={{
                          minWidth: 48,
                          height: 48,
                          borderRadius: 3,
                          px: 2,
                        }}
                      >
                        <Send />
                      </Button>
                    </Box>
                    
                    {!connected && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        Desconectado del servidor. Reintentando conexión...
                      </Alert>
                    )}
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                    p: 4,
                  }}
                >
                  <ChatIcon sx={{ fontSize: 120, mb: 3, opacity: 0.3 }} />
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 300 }}>
                    Bienvenido al Chat
                  </Typography>
                  <Typography variant="body1" sx={{ textAlign: 'center', maxWidth: 400, mb: 3 }}>
                    Selecciona una sala de chat o inicia una conversación con un usuario en línea para comenzar
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenCreateRoom(true)}
                    size="large"
                  >
                    Crear Nueva Sala
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mt: 2 }} 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {/* Create Room Dialog */}
        <Dialog 
          open={openCreateRoom} 
          onClose={() => setOpenCreateRoom(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Crear Nueva Sala
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Nombre de la sala"
                value={newRoomData.name}
                onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Descripción"
                value={newRoomData.description}
                onChange={(e) => setNewRoomData({ ...newRoomData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenCreateRoom(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateRoom}
              disabled={!newRoomData.name.trim()}
            >
              Crear Sala
            </Button>
          </DialogActions>
        </Dialog>

        {/* Room Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>
            <Info sx={{ mr: 2 }} />
            Información de la sala
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <Group sx={{ mr: 2 }} />
            Ver participantes
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
};

export default Chat;