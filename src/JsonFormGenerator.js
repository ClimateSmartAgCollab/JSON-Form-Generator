import React, { useState } from "react";
import { Button, Typography, Paper, Box, Snackbar, Alert } from "@mui/material";

const normalizeEntryCodes = (dependencies) => {
  if (!dependencies) return;
  dependencies.forEach((dependency) => {
    if (dependency?.overlays?.entry_code?.attribute_entry_codes) {
      dependency.overlays.entry_code.attribute_entry_codes = Object.fromEntries(
        Object.entries(
          dependency.overlays.entry_code.attribute_entry_codes
        ).map(([key, value]) => [key, value || []])
      );
    }
  });
};

const findBundleByCaptureBase = (captureBase, bundle, dependencies) => {
  if (bundle.capture_base.d === captureBase) {
    return bundle;
  }
  let dependency = dependencies.find(
    (dep) => dep.capture_base.d === captureBase
  );
  if (dependency) return dependency;
  let referenceDependency = dependencies.find((dep) => dep.d === captureBase);
  if (referenceDependency) return referenceDependency;
  // Recursive search if needed:
  for (let dep of dependencies) {
    if (dep.dependencies) {
      let found = findBundleByCaptureBase(captureBase, dep, dep.dependencies);
      if (found) return found;
    }
  }
  return null;
};

const generateOverlayForItem = (item) => {
  const captureBaseId = item.capture_base?.d;
  const attributes = item.capture_base?.attributes || {};
  const attributeKeys = Object.keys(attributes);

  const overlay = {
    d: `${captureBaseId}`,
    type: "community/adc/presentation/v1.0",
    capture_base: captureBaseId,
    language: ["eng", "fra"],
    pages: [],
    page_order: [],
    page_labels: { eng: {}, fra: {} },
    interaction: [],
  };

  overlay.pages.push({
    named_section: "page-1",
    attribute_order: attributeKeys,
  });
  overlay.page_order.push("page-1");

  // Set default page labels.
  overlay.page_labels.eng["page-1"] = "Page 1: Default";
  overlay.page_labels.fra["page-1"] = "Page 1: Default";

  const interactionArguments = {};
  attributeKeys.forEach((key) => {
    const attrType = attributes[key];
    let inputType = "textarea"; // default input type

    if (attrType === "DateTime") {
      inputType = "DateTime";
    } else if (attrType === "Numeric") {
      inputType = "number";
    } else if (attrType === "Boolean") {
      inputType = "radio";
    } else if (typeof attrType === "string" && attrType.startsWith("refs:")) {
      inputType = "reference";
    } else if (Array.isArray(attrType)) {
      inputType = "select";
    }

    interactionArguments[key] = { type: inputType };
  });
  overlay.interaction.push({ arguments: interactionArguments });

  return overlay;
};

const generateFormOverlays = (metadata) => {
  const overlays = [];
  const mainBundle = metadata.oca_bundle.bundle;
  const dependencies = metadata.oca_bundle.dependencies || [];

  normalizeEntryCodes(dependencies);

  overlays.push(generateOverlayForItem(mainBundle));

  // Recursively process dependencies.
  const processDependencies = (deps) => {
    if (!deps) return;
    deps.forEach((dep) => {
      overlays.push(generateOverlayForItem(dep));
      if (dep.dependencies) {
        processDependencies(dep.dependencies);
      }
    });
  };

  processDependencies(dependencies);
  return overlays;
};

const getUpdatedMetadataWithFormOverlay = (metadata) => {
  const formOverlays = generateFormOverlays(metadata);
  return {
    ...metadata,
    extensions: {
      ...metadata.extensions,
      form: formOverlays,
    },
  };
};

const generateFormOverlay = (metadata) => {
  if (
    metadata.extensions &&
    metadata.extensions.form &&
    metadata.extensions.form.length > 0
  ) {
    return metadata.extensions.form;
  }
  return generateFormOverlays(metadata);
};

function JsonFormGenerator({ jsonData, onFileLoaded }) {
  const [copySuccess, setCopySuccess] = useState("");

  if (!jsonData) return <Typography>No JSON data provided.</Typography>;

  const updatedMetadata = getUpdatedMetadataWithFormOverlay(jsonData);
  const outputText = JSON.stringify(updatedMetadata, null, 2);

  if (onFileLoaded) {
    onFileLoaded(updatedMetadata);
  }

  const handleCopy = () => {
    navigator.clipboard
      .writeText(outputText)
      .then(() => {
        setCopySuccess("Copied!");
        setTimeout(() => setCopySuccess(""), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        setCopySuccess("Failed to copy!");
      });
  };

  console.log("Updated Metadata with Form Overlay:", updatedMetadata);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        JSON Form Generator
      </Typography>
      <Button variant="contained" onClick={handleCopy} sx={{ mb: 2 }}>
        Copy Output
      </Button>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          bgcolor: "#f5f5f5",
          borderRadius: 1,
          overflow: "auto",
          maxHeight: 300,
        }}
      >
        <pre>{outputText}</pre>
      </Paper>
      <Snackbar open={copySuccess} autoHideDuration={2000}>
        <Alert severity="success" sx={{ width: "100%" }}>
          Copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default JsonFormGenerator;
