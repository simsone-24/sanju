import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Box, Button, Chip, FormHelperText, Stack, Typography } from '@mui/material';
import { useRef, useState } from 'react';

interface MultiFileUploaderProps {
  label: string;
  accept: string;
  maxSizeBytes: number;
  /** How many more files may still be added — callers subtract anything already attached elsewhere. */
  maxFiles: number;
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// Multi-file counterpart of FileUploader. Type/size/count limits mirror what the server enforces
// (server/src/middleware/upload.ts and the module's own cap) so the user is told at once; the
// server stays the real enforcement point.
export function MultiFileUploader({ label, accept, maxSizeBytes, maxFiles, files, onChange, error }: MultiFileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const acceptedTypes = accept.split(',');

  function handleSelect(selected: FileList | null) {
    if (!selected || selected.length === 0) return;

    const incoming = Array.from(selected);
    const problems: string[] = [];
    const accepted: File[] = [];

    for (const file of incoming) {
      if (!acceptedTypes.includes(file.type)) {
        problems.push(`"${file.name}" is not an allowed file type.`);
      } else if (file.size > maxSizeBytes) {
        problems.push(`"${file.name}" is larger than ${formatBytes(maxSizeBytes)}.`);
      } else {
        accepted.push(file);
      }
    }

    const room = maxFiles - files.length;
    if (accepted.length > room) {
      problems.push(`You can attach at most ${maxFiles} file(s); extra files were skipped.`);
    }

    setLocalError(problems.length ? problems.join(' ') : null);
    onChange([...files, ...accepted.slice(0, Math.max(room, 0))]);
    if (inputRef.current) inputRef.current.value = '';
  }

  const canAdd = files.length < maxFiles;

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Button variant="outlined" startIcon={<UploadFileIcon />} disabled={!canAdd} onClick={() => inputRef.current?.click()}>
        Choose Files
      </Button>
      {files.length > 0 && (
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {files.map((file, index) => (
            <Chip
              key={`${file.name}-${index}`}
              label={`${file.name} (${formatBytes(file.size)})`}
              onDelete={() => onChange(files.filter((_, position) => position !== index))}
              deleteIcon={<CloseIcon />}
            />
          ))}
        </Stack>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(event) => handleSelect(event.target.files)}
      />
      {(localError || error) && <FormHelperText error>{localError ?? error}</FormHelperText>}
    </Box>
  );
}
