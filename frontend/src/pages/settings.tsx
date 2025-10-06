import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import { useAuth } from '../contexts/AuthContext';
import { uploadProfilePicture, deleteProfilePicture, getUserProfile } from '../services/api';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

const Settings: React.FC = () => {
  const { user, token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    email: user?.email || 'john.doe@example.com',
    name: user?.username || 'John Doe',
    age: '',
    gender: 'Male',
    currency: 'USD',
    riskPreference: 'low'
  });

  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange = (field: string, value: string | number | boolean) => {
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

  // Profile picture upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileSelect called');
    const file = event.target.files?.[0];
    console.log('Selected file:', file);

    if (file) {
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('Invalid file type:', file.type);
        alert('Please select an image file (JPEG, PNG, etc.)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log('File too large:', file.size);
        alert('File size must be less than 5MB');
        return;
      }

      console.log('File validation passed');
      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('File reader loaded');
        setPreviewUrl(e.target?.result as string);
        setUploadDialogOpen(true);
        console.log('Upload dialog opened');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No file selected');
    }
  };

  const handleUploadPicture = async () => {
    console.log('handleUploadPicture called');
    console.log('selectedFile:', selectedFile);
    console.log('user:', user);
    console.log('token:', token);

    if (!selectedFile) {
      console.log('No file selected');
      alert('No file selected. Please select a file first.');
      return;
    }

    if (!token) {
      console.log('No user token available');
      alert('You must be logged in to upload a profile picture.');
      return;
    }

    setUploading(true);
    try {
      console.log('Starting upload...');
      const response = await uploadProfilePicture(token, selectedFile);
      console.log('Upload response:', response);

      // Update profile picture with the returned URL
      if (response.profile_picture_url) {
        setProfilePicture(response.profile_picture_url);
      }
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      console.log('Profile picture uploaded successfully');
      alert('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!token) return;

    try {
      await deleteProfilePicture(token);
      setProfilePicture(null);
      console.log('Profile picture removed successfully');
    } catch (error) {
      console.error('Failed to remove profile picture:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove profile picture. Please try again.');
    }
  };

  const handleCancelUpload = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    console.log('triggerFileSelect called');
    console.log('fileInputRef.current:', fileInputRef.current);
    fileInputRef.current?.click();
  };

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (token) {
        try {
          const profileData = await getUserProfile(token);
          if (profileData.profile_picture_url) {
            setProfilePicture(profileData.profile_picture_url);
          }
          if (profileData.preferred_currency) {
            setSettings(prev => ({ ...prev, currency: profileData.preferred_currency }));
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [token]);

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
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  sx={{
                    width: 128,
                    height: 128,
                    mb: 2,
                    border: '3px solid rgba(19, 127, 236, 0.3)'
                  }}
                  src={profilePicture || ''}
                  alt={settings.name}
                >
                  {settings.name.charAt(0).toUpperCase()}
                </Avatar>
                {/* Edit button - positioned at bottom right corner */}
                <IconButton
                  onClick={triggerFileSelect}
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 32,
                    height: 32,
                    backgroundColor: '#137fec',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#0f6bb8',
                      transform: 'scale(1.1)'
                    },
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    border: '2px solid white',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
                {/* Delete button - positioned at top right corner, only shows when profile picture exists */}
                {profilePicture && (
                  <IconButton
                    onClick={handleRemovePicture}
                    sx={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 28,
                      height: 28,
                      backgroundColor: '#d32f2f',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#b71c1c',
                        transform: 'scale(1.1)'
                      },
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                      border: '2px solid white',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                {settings.name}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {settings.email}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 200 }}>
                Click the blue edit button to upload a new photo
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

      {/* Upload Confirmation Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleCancelUpload}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {previewUrl && (
              <Avatar
                src={previewUrl}
                alt="Preview"
                sx={{
                  width: 150,
                  height: 150,
                  mx: 'auto',
                  mb: 2,
                  border: '3px solid rgba(19, 127, 236, 0.3)'
                }}
              />
            )}
            <Typography variant="body1" gutterBottom>
              Do you want to set this as your profile picture?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedFile && (
                <>
                  File: {selectedFile.name}<br />
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </>
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCancelUpload}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUploadPicture}
            variant="contained"
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            sx={{
              backgroundColor: '#137fec',
              '&:hover': {
                backgroundColor: '#0f6bb8'
              }
            }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;