import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from '../contexts/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [settings, setSettings] = useState({
    email: user?.email || 'john.doe@example.com',
    name: user?.username || 'John Doe',
    age: '',
    gender: 'Male',
    currency: 'EUR',
    riskPreference: 'low'
  });

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving settings:', settings);
  };

  const handleCancel = () => {
    // TODO: Implement cancel functionality
    console.log('Cancelled settings changes');
  };

  return (
    <Box sx={{
      px: { xs: 2, sm: 3, lg: 4 },
      py: 3,
      maxWidth: '1200px',
      mx: 'auto'
    }}>
      <Grid container spacing={3}>
        {/* Left Column: Profile */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  sx={{
                    width: 128,
                    height: 128,
                    mb: 2
                  }}
                  src={user?.avatar || ''}
                  alt={settings.name}
                >
                  {settings.name.charAt(0).toUpperCase()}
                </Avatar>
                <Button
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 0,
                    minWidth: 40,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#137fec',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#0f6bb8'
                    },
                    p: 0
                  }}
                >
                  <EditIcon fontSize="small" />
                </Button>
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                {settings.name}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {settings.email}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Right Column: Settings */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Security Section */}
            <Card sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Security
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { sm: 'center' },
                  justifyContent: 'space-between',
                  gap: { xs: 1, sm: 2 }
                }}>
                  <Typography variant="body2" fontWeight="medium" sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
                    Email Address
                  </Typography>
                  <Box sx={{
                    position: 'relative',
                    width: { xs: '100%', sm: '2/3' },
                    flex: { sm: 1 }
                  }}>
                    <TextField
                      fullWidth
                      value={settings.email}
                      disabled
                      size="small"
                      sx={{
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: 'text.primary',
                          opacity: 0.7
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <Button
                            size="small"
                            sx={{
                              position: 'absolute',
                              right: 4,
                              color: '#137fec',
                              fontWeight: 'bold',
                              fontSize: '0.875rem',
                              '&:hover': {
                                backgroundColor: 'transparent'
                              }
                            }}
                          >
                            Change
                          </Button>
                        )
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { sm: 'center' },
                  justifyContent: 'space-between',
                  gap: { xs: 1, sm: 2 }
                }}>
                  <Typography variant="body2" fontWeight="medium" sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
                    Password
                  </Typography>
                  <Box sx={{ width: { xs: '100%', sm: '2/3' }, flex: { sm: 1 } }}>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'text.primary',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        '&:hover': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)'
                        }
                      }}
                    >
                      Reset Password
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* Preferences Section */}
            <Card sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Preferences
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { sm: 'center' },
                  justifyContent: 'space-between',
                  gap: { xs: 1, sm: 2 }
                }}>
                  <Typography variant="body2" fontWeight="medium" sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
                    Preferred Currency
                  </Typography>
                  <TextField
                    select
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    size="small"
                    sx={{ width: { xs: '100%', sm: '2/3' }, flex: { sm: 1 } }}
                    SelectProps={{ native: true }}
                  >
                    <option value="USD">USD - United States Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </TextField>
                </Box>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { sm: 'flex-start' },
                  justifyContent: 'space-between',
                  gap: { xs: 1, sm: 2 }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: { xs: '100%', sm: 'auto' } }}>
                    <Typography variant="body2" fontWeight="medium">
                      Risk Preference
                    </Typography>
                    <InfoIcon
                      sx={{
                        ml: 1,
                        fontSize: '1rem',
                        color: 'text.secondary',
                        cursor: 'help'
                      }}
                      titleAccess="This helps us tailor investment suggestions."
                    />
                  </Box>
                  <FormControl sx={{ width: { xs: '100%', sm: '2/3' }, flex: { sm: 1 } }}>
                    <RadioGroup
                      row
                      value={settings.riskPreference}
                      onChange={(e) => handleChange('riskPreference', e.target.value)}
                      sx={{ gap: 2 }}
                    >
                      <FormControlLabel value="low" control={<Radio size="small" />} label="Low" />
                      <FormControlLabel value="medium" control={<Radio size="small" />} label="Medium" />
                      <FormControlLabel value="high" control={<Radio size="small" />} label="High" />
                    </RadioGroup>
                  </FormControl>
                </Box>
              </Box>
            </Card>

            {/* Personal Information Section */}
            <Card sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Personal Information
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Age"
                    type="number"
                    value={settings.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    placeholder="e.g., 30"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    value={settings.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </TextField>
                </Grid>
              </Grid>
            </Card>

            {/* Action Buttons */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              mt: 2
            }}>
              <Button
                variant="text"
                onClick={handleCancel}
                sx={{
                  color: 'text.primary',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                  backgroundColor: '#137fec',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  '&:hover': {
                    backgroundColor: '#0f6bb8'
                  }
                }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;