import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputBase,
  Checkbox,
  CircularProgress,
  Skeleton,
  Alert,
  Fade,
} from '@mui/material';
import {
  Send,
  Add,
  Edit,
  Delete,
  Flag,
  Savings,
  CreditCard,
  TrendingUp,
  CheckCircle,
  HelpOutline,
  Chat,
  AutoAwesome,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sendAIGoalChatMessage, createAIGoal, ChatMessage, Goal, Milestone } from '../services/api';

interface AIMessage {
  id: string;
  sender: 'ai' | 'user';
  message: string;
  timestamp: string;
}

const Goals: React.FC = () => {
  const { token } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'savings' | 'debt_repayment' | 'investment'>('savings');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [showAISuccess, setShowAISuccess] = useState(false);
  const [aiGoalMessage, setAiGoalMessage] = useState('');
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: '1',
      sender: 'ai',
      message: "Hi! I'm here to help you set and achieve your financial goals. What are you saving for?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
    category: 'savings' as 'savings' | 'debt_repayment' | 'investment'
  });

  const queryClient = useQueryClient();

  // AI Chat mutation
  const aiChatMutation = useMutation({
    mutationFn: (data: { message: string; conversationHistory: ChatMessage[] }) =>
      sendAIGoalChatMessage(token!, data.message, data.conversationHistory),
    onSuccess: (response) => {
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: response.response,
        timestamp: response.timestamp
      };
      setAiMessages(prev => [...prev, aiResponse]);
    },
    onError: (error) => {
      console.error('AI Chat error:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: "I'm having trouble responding right now. Please try again later.",
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, errorMessage]);
    },
    onSettled: () => {
      setIsLoadingAI(false);
    }
  });

  // AI Goal Creation mutation
  const aiGoalCreationMutation = useMutation({
    mutationFn: (conversationHistory: ChatMessage[]) =>
      createAIGoal(token!, conversationHistory),
    onSuccess: (response) => {
      console.log('AI Goal Creation success response:', response);

      if (response.success && response.goal) {
        console.log('AI goal created successfully:', response.goal);

        // Add the AI-created goal to the goals list
        queryClient.setQueryData(['goals'], (old: Goal[] = []) => {
          console.log('Adding new goal to existing goals:', old);
          return [...old, response.goal!];
        });

        // Show success message
        setAiGoalMessage(response.message || 'Goal created successfully!');
        setShowAISuccess(true);

        // Switch to the category of the created goal
        setSelectedCategory(response.goal.category);

        // Add AI message about the created goal
        const aiResponse: AIMessage = {
          id: (Date.now() + 2).toString(),
          sender: 'ai',
          message: response.message || `Great! I've created the goal "${response.goal!.title}" for you. You can see it on the right side!`,
          timestamp: new Date().toISOString()
        };
        setAiMessages(prev => [...prev, aiResponse]);

        // Hide success message after 5 seconds
        setTimeout(() => setShowAISuccess(false), 5000);
      } else {
        console.log('AI goal creation failed:', response);
        // Add AI message about why goal couldn't be created
        const aiResponse: AIMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          message: response.message || "I couldn't create a goal from our conversation yet. Could you provide more details about what you'd like to achieve?",
          timestamp: new Date().toISOString()
        };
        setAiMessages(prev => [...prev, aiResponse]);
      }
    },
    onError: (error) => {
      console.error('AI Goal Creation error:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: "I had trouble creating a goal from our conversation. Let's continue discussing your financial objectives.",
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, errorMessage]);
    },
    onSettled: () => {
      console.log('AI Goal Creation mutation settled');
      setIsCreatingGoal(false);
    }
  });

  // Mock data for now - replace with actual API calls
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => Promise.resolve([
      {
        id: '1',
        title: 'Save for a Down Payment',
        description: 'Build savings for house down payment',
        target_amount: 50000,
        current_amount: 10000,
        deadline: '2025-12-31',
        category: 'savings' as const,
        status: 'active' as const,
        milestones: [
          {
            id: '1',
            title: 'Save your first $1,000',
            description: 'Emergency starter fund',
            target_date: '2024-03-31',
            completed: true,
            status: 'completed' as const
          },
          {
            id: '2',
            title: 'Set up automatic monthly transfers',
            description: 'Automate savings contributions',
            target_date: '2024-04-30',
            completed: false,
            status: 'in_progress' as const
          },
          {
            id: '3',
            title: 'Reach $10,000 savings',
            description: 'First major milestone',
            target_date: '2024-12-31',
            completed: false,
            status: 'upcoming' as const
          },
          {
            id: '4',
            title: 'Research mortgage options',
            description: 'Understand loan requirements',
            target_date: '2025-06-30',
            completed: false,
            status: 'upcoming' as const
          }
        ],
        created_at: '2024-01-01',
        updated_at: '2024-01-15'
      },
      {
        id: '2',
        title: 'Pay Off Credit Card Debt',
        description: 'Eliminate high-interest credit card balances',
        target_amount: 8000,
        current_amount: 3000,
        deadline: '2024-12-31',
        category: 'debt_repayment' as const,
        status: 'active' as const,
        milestones: [
          {
            id: '5',
            title: 'Stop using credit cards',
            description: 'Switch to cash/debit only',
            target_date: '2024-02-28',
            completed: true,
            status: 'completed' as const
          },
          {
            id: '6',
            title: 'Pay off highest interest card',
            description: 'Focus on 24% APR card first',
            target_date: '2024-06-30',
            completed: false,
            status: 'in_progress' as const
          }
        ],
        created_at: '2024-01-05',
        updated_at: '2024-01-20'
      }
    ]),
    enabled: !!token,
  });

  const handleOpenDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title,
        description: goal.description,
        target_amount: goal.target_amount.toString(),
        current_amount: goal.current_amount.toString(),
        deadline: goal.deadline,
        category: goal.category
      });
    } else {
      setEditingGoal(null);
      setFormData({
        title: '',
        description: '',
        target_amount: '',
        current_amount: '',
        deadline: '',
        category: 'savings'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGoal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission - replace with actual API call
    console.log('Submitting goal:', formData);
    handleCloseDialog();
    // Invalidate query to refetch goals
    queryClient.invalidateQueries({ queryKey: ['goals'] });
  };

  const handleSendMessage = () => {
    if (aiMessage.trim() && token) {
      const newMessage: AIMessage = {
        id: Date.now().toString(),
        sender: 'user',
        message: aiMessage,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, newMessage]);
      setIsLoadingAI(true);

      // Call AI API
      aiChatMutation.mutate({
        message: aiMessage,
        conversationHistory: [...aiMessages, newMessage]
      });

      setAiMessage('');
    }
  };

  const handleCreateAIGoal = () => {
    if (aiMessages.length > 1 && token) { // Need at least one user message
      console.log('Creating AI goal with messages:', aiMessages);
      setIsCreatingGoal(true);

      // Call AI goal creation API
      aiGoalCreationMutation.mutate(aiMessages);
    } else {
      console.log('Cannot create goal: insufficient messages or no token');
    }
  };

  const handleMilestoneToggle = (goalId: string, milestoneId: string) => {
    // Mock milestone toggle - replace with actual API call
    console.log('Toggling milestone:', milestoneId, 'for goal:', goalId);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'savings': return <Savings />;
      case 'debt_repayment': return <CreditCard />;
      case 'investment': return <TrendingUp />;
      default: return <Flag />;
    }
  };

  const getMilestoneColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#2196F3';
      case 'upcoming': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getMilestoneBgColor = (status: string) => {
    switch (status) {
      case 'completed': return '#E8F5E8';
      case 'in_progress': return '#E3F2FD';
      case 'upcoming': return '#FAFAFA';
      default: return '#FAFAFA';
    }
  };

  const filteredGoals = goals.filter((goal: Goal) => goal.category === selectedCategory);

  if (isLoading) {
    return <Box sx={{ p: 3 }}>Loading goals...</Box>;
  }

  return (
    <Box sx={{ display: 'flex', gap: 3, height: '100%' }}>
      {/* AI Conversation Box */}
      <Paper sx={{ width: '33%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 1 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <Chat sx={{ mr: 2, color: 'primary.main' }} />
            FinanceAI Assistant
          </Typography>
        </Box>

        <Box sx={{
          flex: 1,
          p: 3,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          maxHeight: 'calc(100vh - 280px)', // Prevent from getting too tall
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: '#a8a8a8',
            },
          }
        }}>
          {aiMessages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {msg.sender === 'ai' && (
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Chat sx={{ color: 'white', fontSize: 18 }} />
                </Box>
              )}

              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                maxWidth: '70%',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <Typography variant="caption" color="text.secondary">
                  {msg.sender === 'ai' ? 'FinanceAI' : 'You'}
                </Typography>
                <Paper
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: msg.sender === 'ai' ? 'grey.100' : 'primary.main',
                    color: msg.sender === 'ai' ? 'text.primary' : 'white',
                    borderRadius: 2,
                    wordBreak: 'break-word'
                  }}
                >
                  <Typography variant="body2">
                    {msg.message}
                  </Typography>
                </Paper>
              </Box>

              {msg.sender === 'user' && (
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'grey.400',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" sx={{ color: 'white' }}>U</Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          {/* AI Success Message */}
          <Fade in={showAISuccess}>
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              onClose={() => setShowAISuccess(false)}
            >
              {aiGoalMessage}
            </Alert>
          </Fade>

          {/* AI Goal Creation Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCreateAIGoal}
              disabled={isCreatingGoal || aiMessages.length <= 1}
              startIcon={isCreatingGoal ? <CircularProgress size={16} /> : <AutoAwesome />}
              sx={{
                borderColor: 'success.main',
                color: 'success.main',
                '&:hover': {
                  borderColor: 'success.dark',
                  bgcolor: 'success.50',
                },
                '&:disabled': {
                  borderColor: 'grey.300',
                  color: 'grey.500',
                }
              }}
            >
              {isCreatingGoal ? 'Creating Goal...' : 'Create Goal from Conversation'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InputBase
              fullWidth
              placeholder="Type your message..."
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoadingAI && handleSendMessage()}
              disabled={isLoadingAI}
              sx={{
                px: 2,
                py: 1,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                '&:focus-within': {
                  borderColor: 'primary.main'
                },
                '&.Mui-disabled': {
                  bgcolor: 'grey.100'
                }
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={isLoadingAI || !aiMessage.trim()}
              sx={{
                bgcolor: isLoadingAI ? 'grey.400' : 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: isLoadingAI ? 'grey.400' : 'primary.dark'
                }
              }}
            >
              {isLoadingAI ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Send />}
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Goal Roadmap */}
      <Box sx={{ width: '67%', display: 'flex', flexDirection: 'column' }}>
        {/* Category Tabs */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {[
              { key: 'savings', label: 'Savings', icon: <Savings /> },
              { key: 'debt_repayment', label: 'Debt Repayment', icon: <CreditCard /> },
              { key: 'investment', label: 'Investment', icon: <TrendingUp /> }
            ].map((category) => (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? 'contained' : 'outlined'}
                onClick={() => setSelectedCategory(category.key as any)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 3,
                  py: 1,
                  bgcolor: selectedCategory === category.key ? 'success.main' : 'white',
                  color: selectedCategory === category.key ? 'white' : 'text.primary',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: selectedCategory === category.key ? 'success.dark' : 'grey.50'
                  }
                }}
              >
                {category.icon}
                <Typography variant="body2" fontWeight={500}>
                  {category.label}
                </Typography>
              </Button>
            ))}
          </Box>

          <Button
            variant="contained"
            onClick={() => handleOpenDialog()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'warning.main',
              '&:hover': {
                bgcolor: 'warning.dark'
              }
            }}
          >
            <Add />
            Add a Goal
          </Button>
        </Box>

        {/* AI Goal Creation Skeleton */}
        {isCreatingGoal && (
          <Fade in={isCreatingGoal}>
            <Paper sx={{ p: 4, mb: 3, borderRadius: 2, boxShadow: 1, border: 2, borderColor: 'success.main', borderStyle: 'dashed' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AutoAwesome sx={{ color: 'success.main', mr: 2 }} />
                <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600 }}>
                  AI is creating your goal...
                </Typography>
              </Box>

              {/* Skeleton Loading */}
              <Box>
                <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="80%" height={24} sx={{ mb: 3 }} />

                <Skeleton variant="rectangular" width="100%" height={8} sx={{ mb: 1, borderRadius: 1 }} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[1, 2, 3].map((item) => (
                    <Box key={item} sx={{ display: 'flex', alignItems: 'center', p: 2, border: 1, borderColor: 'grey.200', borderRadius: 2 }}>
                      <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="70%" height={20} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="50%" height={16} />
                      </Box>
                      <Skeleton variant="text" width={80} height={20} />
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Fade>
        )}

        {/* Goal Cards */}
        {filteredGoals.length === 0 && !isCreatingGoal ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No {selectedCategory.replace('_', ' ')} goals yet
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleOpenDialog()}
              startIcon={<Add />}
            >
              Create Your First {selectedCategory === 'savings' ? 'Savings' : selectedCategory === 'debt_repayment' ? 'Debt Repayment' : 'Investment'} Goal
            </Button>
          </Paper>
        ) : (
          filteredGoals.map((goal: Goal) => (
            <Paper key={goal.id} sx={{ p: 4, mb: 3, borderRadius: 2, boxShadow: 1, ...(goal.ai_generated && { border: 2, borderColor: 'success.light', borderStyle: 'solid' }) }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {goal.title}
                    </Typography>
                    {goal.ai_generated && (
                      <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'success.50', px: 1, py: 0.5, borderRadius: 1 }}>
                        <AutoAwesome sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                          AI Generated
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    Target: ${goal.target_amount.toLocaleString()} by {goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'No deadline set'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {getProgressPercentage(goal.current_amount, goal.target_amount).toFixed(0)}% Complete
                  </Typography>
                  <IconButton size="small">
                    <HelpOutline fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Progress Bar */}
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: '#E0E0E0',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      width: `${getProgressPercentage(goal.current_amount, goal.target_amount)}%`,
                      height: '100%',
                      bgcolor: '#FFC107',
                      borderRadius: 4,
                      transition: 'width 0.3s ease-in-out'
                    }}
                  />
                </Box>
              </Box>

              {/* Milestones */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {goal.milestones.map((milestone) => (
                  <Box
                    key={milestone.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 3,
                      borderRadius: 2,
                      border: 1,
                      borderColor: milestone.status === 'completed' ? 'success.main' : 'divider',
                      bgcolor: getMilestoneBgColor(milestone.status)
                    }}
                  >
                    {milestone.status === 'completed' ? (
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        mr: 3
                      }}>
                        <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                    ) : (
                      <Checkbox
                        checked={milestone.completed}
                        onChange={() => handleMilestoneToggle(goal.id, milestone.id)}
                        sx={{ mr: 3 }}
                      />
                    )}

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          textDecoration: milestone.status === 'completed' ? 'line-through' : 'none',
                          color: milestone.status === 'completed' ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {milestone.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Target Date: {new Date(milestone.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: getMilestoneColor(milestone.status),
                        textTransform: 'capitalize'
                      }}
                    >
                      {milestone.status === 'completed' ? 'Completed!' : milestone.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          ))
        )}
      </Box>

      {/* Add/Edit Goal Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGoal ? 'Edit Goal' : 'Add New Goal'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Goal Title"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Target Amount ($)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Current Amount ($)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Deadline"
                  type="date"
                  fullWidth
                  variant="outlined"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    <MenuItem value="savings">Savings</MenuItem>
                    <MenuItem value="debt_repayment">Debt Repayment</MenuItem>
                    <MenuItem value="investment">Investment</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingGoal ? 'Update Goal' : 'Add Goal'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Goals;