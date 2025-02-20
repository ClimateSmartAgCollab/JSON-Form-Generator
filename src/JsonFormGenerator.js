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


  
  let metaForBundle = item.overlays.meta.filter((m) => m.capture_base === captureBaseId);
  if (metaForBundle.length === 0) {
    metaForBundle = [
      { language: "eng", name: "Default" },
      { language: "fra", name: "Default" }
    ];
  }

  const languages = metaForBundle.map((m) => m.language);
  console.log("Languages:", languages);
  const page_labels = {};
  languages.forEach((lang) => {
    const metaObj = metaForBundle.find((m) => m.language === lang);
    const defaultLabel = metaObj ? `Page 1: ${metaObj.name}` : "Page 1: Default";
    page_labels[lang] = { "page-1": defaultLabel };
  });

  const overlay = {
    d: "###presentationDigest###",
    type: "###presentationType###",
    capture_base: captureBaseId,
    language: languages,
    pages: [],
    page_order: [],
    page_labels: page_labels,
    interaction: [],
  };

  overlay.pages.push({
    named_section: "page-1",
    attribute_order: attributeKeys,
  });
  overlay.page_order.push("page-1");

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
  const mainBundle = metadata.oca_bundle?.bundle ?? metadata.bundle;
  const dependencies = metadata.oca_bundle?.dependencies ?? metadata.dependencies ?? [];
  

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
  const formOverlays = generateFormOverlay(metadata);

  if (metadata.oca_bundle) {
    return {
      ...metadata,
      extensions: {
        ...(metadata.extensions || {}),
        form: formOverlays,
      },
    };
  }

  
  if (metadata.bundle && metadata.dependencies) {
    return {
      oca_bundle: {
        bundle: metadata.bundle,
        dependencies: metadata.dependencies,
      },
      extensions: {
        ...(metadata.extensions || {}),
        form: formOverlays,
      },
    };
  }
  return {
    ...metadata,
    extensions: {
      ...(metadata.extensions || {}),
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
