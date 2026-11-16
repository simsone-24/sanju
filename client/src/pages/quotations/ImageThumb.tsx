import DeleteIcon from '@mui/icons-material/Delete';
import { Box, IconButton, TextField } from '@mui/material';
import { QUOTATION_IMAGE_CAPTION_MAX } from './quotationImages';

interface ImageThumbProps {
  src: string;
  alt: string;
  onRemove: () => void;
  /**
   * The image's description. Pass `onCaptionChange` to show an editable field under the picture;
   * leave both out and the thumbnail is just the picture.
   */
  caption?: string;
  onCaptionChange?: (caption: string) => void;
  /** Called when the field loses focus — where a saved image persists what was typed. */
  onCaptionBlur?: () => void;
}

export function ImageThumb({ src, alt, onRemove, caption = '', onCaptionChange, onCaptionBlur }: ImageThumbProps) {
  return (
    <Box sx={{ borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ position: 'relative' }}>
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
        />
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
      {onCaptionChange && (
        <TextField
          value={caption}
          onChange={(event) => onCaptionChange(event.target.value)}
          onBlur={onCaptionBlur}
          size="small"
          fullWidth
          label="Image description"
          slotProps={{ htmlInput: { maxLength: QUOTATION_IMAGE_CAPTION_MAX } }}
          sx={{ p: 1, '& .MuiInputBase-input': { fontSize: '0.8125rem' } }}
        />
      )}
    </Box>
  );
}
