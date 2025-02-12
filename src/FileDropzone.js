import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, Typography, Box, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

function FileDropzone({ onFileLoaded }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result.trim();
          if (!text) {
            console.error("Uploaded file is empty");
            return;
          }
          console.log("Raw File Content:", text);
          try {
            const json = JSON.parse(text);
            console.log("Parsed JSON:", json);
            onFileLoaded(json);
          } catch (err) {
            console.error("Error parsing JSON:", err);
          }
        };
        reader.readAsText(file);
      }
    },
    [onFileLoaded]
  );

  const { getRootProps, getInputProps, acceptedFiles, isDragActive } = useDropzone({
    onDrop,
    accept: "application/json",
  });

  const files = acceptedFiles.map((file) => (
    <Typography key={file.path} variant="body2" sx={{ p: 1, borderBottom: "1px solid #ddd" }}>
      {file.path} - {file.size} bytes
    </Typography>
  ));

  return (
    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Paper
          {...getRootProps()}
          sx={{
            border: "2px dashed #aaa",
            p: 3,
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.3s",
            bgcolor: isDragActive ? "#e3f2fd" : "#f5f5f5",
            '&:hover': { bgcolor: "#eeeeee" },
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 48, color: "#757575" }} />
          <Typography variant="h6" color="textSecondary">
            Drag & drop a JSON file here, or click to select one
          </Typography>
        </Paper>
        {files.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              Uploaded Files
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>{files}</Paper>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default FileDropzone;
