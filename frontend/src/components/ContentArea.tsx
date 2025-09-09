import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface ContentAreaProps {
  selectedMenuItem: string;
}

const ContentArea: React.FC<ContentAreaProps> = ({ selectedMenuItem }) => {
  let content;

  switch (selectedMenuItem) {
    case 'Dashboard':
      content = <Typography paragraph>Welcome to your Dashboard!</Typography>;
      break;
    case 'Profile':
      content = <Typography paragraph>View and edit your profile here.</Typography>;
      break;
    case 'Settings':
      content = <Typography paragraph>Adjust your application settings.</Typography>;
      break;
    case 'Reports':
      content = <Typography paragraph>Access various reports and analytics.</Typography>;
      break;
    default:
      content = <Typography paragraph>Please select an item from the sidebar.</Typography>;
  }

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {selectedMenuItem || 'Welcome'}
      </Typography>
      {content}
    </Box>
  );
};

export default ContentArea;
