import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  InputBase,
  Checkbox,
  CircularProgress,
  Skeleton,
  Alert,
  Fade,
  Chip,
} from '@mui/material';
import {
  Send,
  Savings,
  CreditCard,
  TrendingUp,
  CheckCircle,
  HelpOutline,
  Chat,
  AutoAwesome,
  Delete,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sendAIGoalChatMessage, createAIGoal, getGoals, toggleMilestone, deleteGoal, ChatMessage, Goal } from '../services/api';

interface AIMessage {
  id: string;
  sender: 'ai' | 'user';
  message: string;
  timestamp: string;
}

const Goals: React.FC = () => {
  const { token } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'savings' | 'debt_repayment' | 'investment'>('savings');
  const [aiMessage, setAiMessage] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [showAISuccess, setShowAISuccess] = useState(false);
  const [aiGoalMessage, setAiGoalMessage] = useState('');
  const [showCreateGoalSuggestion, setShowCreateGoalSuggestion] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: '1',
      sender: 'ai',
      message: "Hi! I'm here to help you set and achieve your financial goals. What are you saving for?",
      timestamp: new Date().toISOString()
    }
  ]);

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

      // Check if AI is suggesting to create a goal
      if (response.response.includes("enough information to create a goal") ||
          response.response.includes("Create Goal from Conversation")) {
        setShowCreateGoalSuggestion(true);
        // Automatically create the goal after a short delay
        setTimeout(() => {
          if (!isCreatingGoal) {
            handleCreateAIGoal();
          }
        }, 1500);
      }

      // Auto-suggest and create goal after 6 messages (3 exchanges)
      const totalMessages = [...aiMessages, aiResponse];
      if (totalMessages.length >= 6 && !showCreateGoalSuggestion) {
        setShowCreateGoalSuggestion(true);
        // Automatically create the goal after a short delay
        setTimeout(() => {
          if (!isCreatingGoal) {
            handleCreateAIGoal();
          }
        }, 1500);
      }
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

        // Invalidate goals query to refetch from database
        queryClient.invalidateQueries({ queryKey: ['goals'] });

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

        // Hide success message after 5 seconds and suggestion
        setTimeout(() => {
          setShowAISuccess(false);
          setShowCreateGoalSuggestion(false);
        }, 5000);
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

  // Fetch real goals from database
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => getGoals(token!),
    enabled: !!token,
  });

  
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

  // Milestone toggle mutation
  const milestoneToggleMutation = useMutation({
    mutationFn: (data: { goalId: string; milestoneId: string }) =>
      toggleMilestone(token!, data.goalId, data.milestoneId),
    onSuccess: (response, variables) => {
      // Update the goal in the cache
      queryClient.setQueryData(['goals'], (old: Goal[] = []) => {
        return old.map(goal => {
          if (goal.id === variables.goalId) {
            return {
              ...goal,
              milestones: goal.milestones.map(milestone => {
                if (milestone.id === variables.milestoneId) {
                  return response;
                }
                return milestone;
              })
            };
          }
          return goal;
        });
      });
    },
    onError: (error) => {
      console.error('Milestone toggle error:', error);
    }
  });

  // Goal deletion mutation
  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => deleteGoal(token!, goalId),
    onSuccess: (_, goalId) => {
      // Remove the goal from the cache
      queryClient.setQueryData(['goals'], (old: Goal[] = []) => {
        return old.filter(goal => goal.id !== goalId);
      });
    },
    onError: (error) => {
      console.error('Goal deletion error:', error);
    }
  });

  const handleMilestoneToggle = (goalId: string, milestoneId: string) => {
    if (token) {
      milestoneToggleMutation.mutate({ goalId, milestoneId });
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    if (token && window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      deleteGoalMutation.mutate(goalId);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
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
            AI RichBoy Assistant
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

          {/* AI Goal Creation Suggestion */}
          <Fade in={showCreateGoalSuggestion}>
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              icon={<AutoAwesome />}
            >
              I'm creating a goal for you based on our conversation...
            </Alert>
          </Fade>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InputBase
              fullWidth
              placeholder="Type your message..."
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoadingAI && handleSendMessage()}
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
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Chat with the AI assistant on the left to create your first {selectedCategory.replace('_', ' ')} goal!
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Chat sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
            </Box>
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
                    Target: ${goal.target_amount?.toLocaleString() || '0'} by {goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'No deadline set'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {getProgressPercentage(goal.current_amount || 0, goal.target_amount || 1).toFixed(0)}% Complete
                  </Typography>
                  <IconButton size="small">
                    <HelpOutline fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteGoal(goal.id)}
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: 'error.light',
                        color: 'white'
                      }
                    }}
                  >
                    <Delete fontSize="small" />
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
                      width: `${getProgressPercentage(goal.current_amount || 0, goal.target_amount || 1)}%`,
                      height: '100%',
                      bgcolor: '#FFC107',
                      borderRadius: 4,
                      transition: 'width 0.3s ease-in-out'
                    }}
                  />
                </Box>
              </Box>

              {/* Enhanced Milestones with Accordion Details */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {goal.milestones.map((milestone) => {
                  // Check if milestone has enhanced details
                  const hasAccordionDetails = milestone.calculation || milestone.accordion_details || milestone.description;

                  return (
                    <Box key={milestone.id}>
                      {/* Main Milestone Item */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 3,
                          borderRadius: 2,
                          border: 1,
                          borderColor: milestone.status === 'completed' ? 'success.main' : 'divider',
                          bgcolor: getMilestoneBgColor(milestone.status),
                          cursor: hasAccordionDetails ? 'pointer' : 'default'
                        }}
                        onClick={() => {
                          if (hasAccordionDetails) {
                            // Toggle accordion expansion logic here
                            const accordionId = `accordion-${milestone.id}`;
                            const accordion = document.getElementById(accordionId);
                            if (accordion) {
                              accordion.classList.toggle('expanded');
                            }
                          }
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
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}

                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              textDecoration: milestone.status === 'completed' ? 'line-through' : 'none',
                              color: milestone.status === 'completed' ? 'text.secondary' : 'text.primary',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            {milestone.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Target Date: {milestone.target_date ? new Date(milestone.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'No date set'}
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

                      {/* Simple AI Conversation Breakdown */}
                      {hasAccordionDetails && (
                        <Box
                          sx={{
                            mt: 1,
                            p: 3,
                            bgcolor: 'primary.50',
                            borderRadius: 2,
                            border: 1,
                            borderColor: 'primary.light'
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                            💬 AI Conversation Breakdown
                          </Typography>

                          {/* Show description directly */}
                          {milestone.description && (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {milestone.description}
                              </Typography>
                            </Box>
                          )}

                          {/* Show implementation details directly */}
                          {milestone.accordion_details && (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                📋 Action Steps from AI Chat:
                              </Typography>
                              <Box sx={{ pl: 2 }}>
                                <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                  {milestone.accordion_details}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Show calculation details directly */}
                          {milestone.calculation && (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                🧮 Financial Calculations:
                              </Typography>
                              <Box sx={{ pl: 2, bgcolor: 'white', p: 2, borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                  {milestone.calculation}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Show timeline directly */}
                          {milestone.timeline && (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                📅 Timeline from AI Chat:
                              </Typography>
                              <Box sx={{ pl: 2 }}>
                                <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                  {milestone.timeline}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Show recommended products directly */}
                          {milestone.products && milestone.products.length > 0 && (
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                💰 Products Recommended by AI:
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {milestone.products.map((product, index: number) => (
                                  <Box key={index} sx={{
                                    p: 2,
                                    bgcolor: 'white',
                                    borderRadius: 1,
                                    border: 1,
                                    borderColor: 'grey.200'
                                  }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                                      {product.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {product.type} • {product.amount ? `$${product.amount.toLocaleString()}` : 'Amount N/A'}
                                      {product.percentage && ` • ${product.percentage}% allocation`}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          ))
        )}
      </Box>
    </Box>
  );
};

export default Goals;