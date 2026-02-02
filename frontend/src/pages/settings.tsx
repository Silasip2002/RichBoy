import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import { useAuth } from '../contexts/AuthContext';
import { uploadProfilePicture, deleteProfilePicture, getUserProfile, changePassword, updateUserProfile } from '../services/api';
import constants from '../data/constants.json';
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
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

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

  // Store original values for change detection
  const [originalSettings, setOriginalSettings] = useState({
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

  // Password reset state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [resettingPassword, setResettingPassword] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Profile save state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{
    name?: string;
    email?: string;
    age?: string;
    general?: string;
  }>({});

  const handleChange = (field: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));

    // Clear field-specific errors when user starts typing
    if (profileErrors[field as keyof typeof profileErrors]) {
      setProfileErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validation functions
  const validateProfileData = (data: typeof settings): { isValid: boolean; errors: typeof profileErrors } => {
    const errors: typeof profileErrors = {};

    // Name validation
    if (!data.name || data.name.trim().length === 0) {
      errors.name = 'Name is required';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else if (data.name.trim().length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }

    // Email validation
    if (!data.email || data.email.trim().length === 0) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Age validation (optional field)
    if (data.age && data.age !== '') {
      const ageNum = parseInt(String(data.age));
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        errors.age = 'Please enter a valid age between 13 and 120';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Change detection function
  const hasChanges = (): boolean => {
    return (
      settings.name !== originalSettings.name ||
      settings.email !== originalSettings.email ||
      settings.age !== originalSettings.age ||
      settings.gender !== originalSettings.gender ||
      settings.currency !== originalSettings.currency ||
      settings.riskPreference !== originalSettings.riskPreference
    );
  };

  // Get changed data only
  const getChangedData = (): Partial<typeof settings> => {
    const changed: Partial<typeof settings> = {};

    if (settings.name !== originalSettings.name) changed.name = settings.name;
    if (settings.email !== originalSettings.email) changed.email = settings.email;
    if (settings.age !== originalSettings.age) changed.age = settings.age;
    if (settings.gender !== originalSettings.gender) changed.gender = settings.gender;
    if (settings.currency !== originalSettings.currency) changed.currency = settings.currency;
    if (settings.riskPreference !== originalSettings.riskPreference) changed.riskPreference = settings.riskPreference;

    return changed;
  };

  const handleSave = async () => {
    if (!token) {
      setProfileErrors({ general: 'You must be logged in to save settings.' });
      return;
    }

    // Check if there are any changes
    if (!hasChanges()) {
      alert('No changes to save.');
      return;
    }

    // Validate the data
    const validation = validateProfileData(settings);
    if (!validation.isValid) {
      setProfileErrors(validation.errors);
      return;
    }

    setSavingProfile(true);
    try {
      const changedData = getChangedData();

      // Prepare data for API call
      const profileData: {
        preferred_currency?: string;
        display_name?: string;
        age?: number;
        gender?: string;
        risk_preference?: string;
      } = {};

      // Add preferred currency if changed
      if (changedData.currency) {
        profileData.preferred_currency = changedData.currency;
      }

      // Add display name if changed
      if (changedData.name) {
        profileData.display_name = changedData.name;
      }

      // Add age if changed
      if (changedData.age) {
        profileData.age = parseInt(changedData.age);
      }

      // Add gender if changed
      if (changedData.gender) {
        profileData.gender = changedData.gender;
      }

      // Add risk preference if changed
      if (changedData.riskPreference) {
        profileData.risk_preference = changedData.riskPreference;
      }

      console.log('Saving profile changes:', profileData);
      console.log('Changed fields:', Object.keys(changedData));

      // Only make API call if there's data to save
      if (Object.keys(profileData).length > 0) {
        await updateUserProfile(token, profileData);
      }

      // Update original settings to reflect saved state
      setOriginalSettings({ ...settings });

      // Clear any existing errors
      setProfileErrors({});

      console.log('Settings saved successfully');
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings. Please try again.';

      // Handle specific error messages
      if (errorMessage.includes('email')) {
        setProfileErrors({ email: errorMessage });
      } else if (errorMessage.includes('name')) {
        setProfileErrors({ name: errorMessage });
      } else {
        setProfileErrors({ general: errorMessage });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancel = () => {
    // Restore original values
    setSettings({ ...originalSettings });
    setProfileErrors({});
    console.log('Settings changes cancelled');
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

  // Password validation functions
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validatePasswordData = (data: typeof passwordData): { isValid: boolean; errors: typeof passwordErrors } => {
    const errors: typeof passwordErrors = {};

    // Validate current password
    if (!data.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    // Validate new password
    if (!data.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const passwordValidation = validatePassword(data.newPassword);
      if (!passwordValidation.isValid) {
        errors.newPassword = passwordValidation.errors.join(', ');
      }
    }

    // Validate confirm password
    if (!data.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is same as current password
    if (data.currentPassword === data.newPassword && data.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePasswordSubmit = () => {
    const validation = validatePasswordData(passwordData);
    setPasswordErrors(validation.errors);

    if (validation.isValid) {
      setConfirmResetOpen(true);
    }
  };

  const handleResetPassword = async () => {
    if (!token) return;

    setResettingPassword(true);
    try {
      console.log('Starting password reset process');
      const response = await changePassword(
        token,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      console.log('Password reset successfully:', response);
      alert('Password changed successfully! Please use your new password for future logins.');

      // Reset form and close dialogs
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
      setPasswordDialogOpen(false);
      setConfirmResetOpen(false);
    } catch (error) {
      console.error('Failed to reset password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';

      // Handle specific error messages
      if (errorMessage.includes('Current password is incorrect')) {
        setPasswordErrors({
          currentPassword: 'Current password is incorrect'
        });
      } else if (errorMessage.includes('New password must be different')) {
        setPasswordErrors({
          newPassword: 'New password must be different from current password'
        });
      } else {
        setPasswordErrors({
          general: errorMessage
        });
      }
    } finally {
      setResettingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const openPasswordDialog = () => {
    setPasswordDialogOpen(true);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
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

          // Update both settings and original settings with fetched data
          const updatedSettings = {
            email: user?.email || 'john.doe@example.com',
            name: profileData.display_name || user?.username || 'John Doe',
            age: profileData.age || '',
            gender: profileData.gender || 'Male',
            currency: profileData.preferred_currency || 'USD',
            riskPreference: profileData.risk_preference || 'low'
          };

          setSettings(updatedSettings);
          setOriginalSettings(updatedSettings);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [token, user?.email, user?.username]);

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
                      onClick={openPasswordDialog}
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
                      Change Password
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
                    {constants.currencies.map((currency) => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
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

              {/* General Error Message */}
              {profileErrors.general && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {profileErrors.general}
                </Typography>
              )}

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={settings.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    error={!!profileErrors.name}
                    helperText={profileErrors.name || "Username changes require account verification"}
                    size="small"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    error={!!profileErrors.email}
                    helperText={profileErrors.email}
                    size="small"
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Age"
                    type="number"
                    value={settings.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    placeholder="e.g., 30"
                    error={!!profileErrors.age}
                    helperText={profileErrors.age || 'Optional: Enter your age (13-120)'}
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
                disabled={savingProfile}
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
                disabled={savingProfile || !hasChanges()}
                startIcon={savingProfile ? <CircularProgress size={20} /> : null}
                sx={{
                  backgroundColor: '#137fec',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  '&:hover': {
                    backgroundColor: '#0f6bb8'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(19, 127, 236, 0.3)',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                {savingProfile ? 'Saving...' : hasChanges() ? 'Save Changes' : 'No Changes'}
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

      {/* Password Reset Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {passwordErrors.general && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                {passwordErrors.general}
              </Typography>
            )}

            {/* Current Password */}
            <TextField
              fullWidth
              margin="dense"
              label="Current Password"
              type={showPasswords.currentPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              error={!!passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword}
              disabled={resettingPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('currentPassword')}
                      edge="end"
                      disabled={resettingPassword}
                    >
                      {showPasswords.currentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* New Password */}
            <TextField
              fullWidth
              margin="dense"
              label="New Password"
              type={showPasswords.newPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword || 'Must be 8+ characters with uppercase, lowercase, numbers, and special characters'}
              disabled={resettingPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('newPassword')}
                      edge="end"
                      disabled={resettingPassword}
                    >
                      {showPasswords.newPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Confirm Password */}
            <TextField
              fullWidth
              margin="dense"
              label="Confirm New Password"
              type={showPasswords.confirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              error={!!passwordErrors.confirmPassword}
              helperText={passwordErrors.confirmPassword}
              disabled={resettingPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      edge="end"
                      disabled={resettingPassword}
                    >
                      {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Password Requirements */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                Password Requirements:
              </Typography>
              <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
                • At least 8 characters long<br/>
                • Contains uppercase letter (A-Z)<br/>
                • Contains lowercase letter (a-z)<br/>
                • Contains number (0-9)<br/>
                • Contains special character (!@#$%^&* etc.)
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setPasswordDialogOpen(false)}
            disabled={resettingPassword}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            disabled={resettingPassword}
            sx={{
              backgroundColor: '#137fec',
              '&:hover': {
                backgroundColor: '#0f6bb8'
              }
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Password Change</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ py: 1 }}>
            Are you sure you want to change your password? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You will need to use your new password for future logins.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setConfirmResetOpen(false)}
            disabled={resettingPassword}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            color="warning"
            disabled={resettingPassword}
            startIcon={resettingPassword ? <CircularProgress size={20} /> : null}
            sx={{
              backgroundColor: '#ff9800',
              '&:hover': {
                backgroundColor: '#f57c00'
              }
            }}
          >
            {resettingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;