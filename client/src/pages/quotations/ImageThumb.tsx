import DeleteIcon from '@mui/icons-material/Delete';
import { Box, IconButton } from '@mui/material';

interface ImageThumbProps {
  src: string;
  alt: string;
  onRemove: () => void;
}

export function ImageThumb({ src, alt, onRemove }: ImageThumbProps) {
  return (
    <Box sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      <Box component="img" src={src} alt={alt} sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
      <IconButton
        size="small"
        title="Remove image"
        onClick={onRemove}
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          bgcolor: 'rgba(0,0,0,0.55)',
          color: '#fff',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
