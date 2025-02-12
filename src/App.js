import React, { useState } from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import FileDropzone from './FileDropzone';
import JsonFormGenerator from './JsonFormGenerator';

function App() {
  const [jsonData, setJsonData] = useState(null);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        JSON File Drop & Form Auto-Generator
      </Typography>
      <FileDropzone onFileLoaded={setJsonData} />
      {jsonData ? (
        <Paper elevation={3} sx={{ p: 3, mt: 3, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" gutterBottom>Loaded JSON</Typography>
          <Box 
            component="pre" 
            sx={{ 
              maxHeight: 200, 
              overflow: 'auto', 
              bgcolor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1,
              fontSize: '0.875rem'
            }}
          >
            {JSON.stringify(jsonData, null, 2)}
          </Box>
          <JsonFormGenerator jsonData={jsonData} />
        </Paper>
      ) : (
        <Typography variant="body1" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
          Please drop a JSON file to begin.
        </Typography>
      )}
    </Container>
  );
}

export default App;
