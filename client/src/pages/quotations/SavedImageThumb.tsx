import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import * as quotationService from '../../services/quotationService';
import { useToast } from '../../store/ToastContext';
import type { QuotationImage } from '../../types/quotation';
import { describeApiError } from '../../utils/apiError';
import { getPublicAssetUrl } from '../../utils/format';
import { ImageThumb } from './ImageThumb';

interface SavedImageThumbProps {
  quotationId: number;
  image: QuotationImage;
  onRemove: () => void;
}

/**
 * A sample image already stored on a quotation. Its description is edited in place and saved when the
 * field loses focus, so there is no separate save step for it.
 */
export function SavedImageThumb({ quotationId, image, onRemove }: SavedImageThumbProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [caption, setCaption] = useState(image.caption ?? '');

  // Follows the stored value when the quotation is refetched (another image added, a revision loaded).
  useEffect(() => {
    setCaption(image.caption ?? '');
  }, [image.caption]);

  const saveMutation = useMutation({
    mutationFn: (value: string) => quotationService.updateImageCaption(quotationId, image.id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] }),
    onError: (error) => {
      setCaption(image.caption ?? '');
      showToast(describeApiError(error, 'Unable to save the image description.'), 'error');
    },
  });

  function handleBlur() {
    const next = caption.trim();
    if (next === (image.caption ?? '')) return;
    saveMutation.mutate(next);
  }

  return (
    <ImageThumb
      src={getPublicAssetUrl(image.filePath)}
      alt={image.caption || image.fileName}
      onRemove={onRemove}
      caption={caption}
      onCaptionChange={setCaption}
      onCaptionBlur={handleBlur}
    />
  );
}
