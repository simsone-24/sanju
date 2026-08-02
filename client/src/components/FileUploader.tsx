import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Box, Button, Chip, FormHelperText, Stack, Typography } from '@mui/material';
import { useRef, useState } from 'react';

interface FileUploaderProps {
  label: string;
  accept: string;
  maxSizeBytes: number;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// Mirrors the type/size restrictions actually enforced server-side by
// server/src/middleware/upload.ts, so the user gets instant feedback instead of waiting on a
// round trip to find out a file is rejected — the server remains the real enforcement point.
export function FileUploader({ label, accept, maxSizeBytes, file, onChange, error }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleFileSelect(selected: File | undefined) {
    if (!selected) return;

    if (selected.size > maxSizeBytes) {
      setLocalError(`File is too large. Maximum size is ${formatBytes(maxSizeBytes)}.`);
      onChange(null);
      return;
    }

    setLocalError(null);
    onChange(selected);
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => inputRef.current?.click()}>
          Choose File
        </Button>
        {file && (
          <Chip
            label={`${file.name} (${formatBytes(file.size)})`}
            onDelete={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            deleteIcon={<CloseIcon />}
          />
        )}
      </Stack>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => handleFileSelect(event.target.files?.[0])}
      />
      {(localError || error) && <FormHelperText error>{localError ?? error}</FormHelperText>}
    </Box>
  );
}
