import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Avatar, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileUploader } from '../../../components/FileUploader';
import { usePermission } from '../../../hooks/usePermission';
import * as companyService from '../../../services/companyService';
import type { ApiErrorResponse } from '../../../types/api';
import { getPublicAssetUrl } from '../../../utils/format';
import { updateCompanySchema, type UpdateCompanyFormValues } from '../../../validation/companySchemas';

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

export default function CompanyInfoTab() {
  const queryClient = useQueryClient();
  const canView = usePermission('SETTINGS', 'canView');
  const canEdit = usePermission('SETTINGS', 'canEdit');

  const [formError, setFormError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyService.getCompany(),
    enabled: canView,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateCompanyFormValues>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      companyName: '',
      contactPerson: '',
      mobile: '',
      email: '',
      address: '',
      gstNumber: '',
      website: '',
      bankName: '',
      bankAccountName: '',
      bankAccountNumber: '',
      bankBranch: '',
      bankIfsc: '',
      bankUpi: '',
      authorizedSignatory: '',
      footerMessage: '',
      termsAndConditions: '',
    },
  });

  useEffect(() => {
    if (company) {
      reset({
        companyName: company.companyName,
        contactPerson: company.contactPerson ?? '',
        mobile: company.mobile ?? '',
        email: company.email ?? '',
        address: company.address ?? '',
        gstNumber: company.gstNumber ?? '',
        website: company.website ?? '',
        bankName: company.bankName ?? '',
        bankAccountName: company.bankAccountName ?? '',
        bankAccountNumber: company.bankAccountNumber ?? '',
        bankBranch: company.bankBranch ?? '',
        bankIfsc: company.bankIfsc ?? '',
        bankUpi: company.bankUpi ?? '',
        authorizedSignatory: company.authorizedSignatory ?? '',
        footerMessage: company.footerMessage ?? '',
        termsAndConditions: company.termsAndConditions ?? '',
      });
    }
  }, [company, reset]);

  const updateMutation = useMutation({
    mutationFn: (values: UpdateCompanyFormValues) =>
      companyService.updateCompany({
        companyName: values.companyName,
        contactPerson: values.contactPerson || undefined,
        mobile: values.mobile || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
        gstNumber: values.gstNumber || undefined,
        website: values.website || undefined,
        bankName: values.bankName || undefined,
        bankAccountName: values.bankAccountName || undefined,
        bankAccountNumber: values.bankAccountNumber || undefined,
        bankBranch: values.bankBranch || undefined,
        bankIfsc: values.bankIfsc || undefined,
        bankUpi: values.bankUpi || undefined,
        authorizedSignatory: values.authorizedSignatory || undefined,
        footerMessage: values.footerMessage || undefined,
        termsAndConditions: values.termsAndConditions || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await updateMutation.mutateAsync(values);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setFormError(error.response.data.message);
      } else {
        setFormError('Unable to update company information. Please try again.');
      }
    }
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => companyService.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      setLogoFile(null);
    },
  });

  async function handleLogoUpload() {
    if (!logoFile) return;
    setLogoError(null);
    try {
      await logoMutation.mutateAsync(logoFile);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setLogoError(error.response.data.message);
      } else {
        setLogoError('Unable to upload logo. Please try again.');
      }
    }
  }

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view company information.</Typography>;
  }

  if (isLoading) return <CircularProgress size={28} />;

  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Company Logo
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Avatar
            src={company?.logo ? getPublicAssetUrl(company.logo) : undefined}
            variant="rounded"
            sx={{ width: 64, height: 64 }}
          >
            {company?.companyName.charAt(0)}
          </Avatar>
          {canEdit && (
            <Box sx={{ flex: 1 }}>
              <FileUploader
                label=""
                accept="image/jpeg,image/png,image/webp"
                maxSizeBytes={MAX_LOGO_SIZE_BYTES}
                file={logoFile}
                onChange={setLogoFile}
              />
            </Box>
          )}
        </Stack>
        {logoError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {logoError}
          </Alert>
        )}
        {canEdit && (
          <Button variant="outlined" disabled={!logoFile || logoMutation.isPending} onClick={handleLogoUpload}>
            {logoMutation.isPending ? 'Uploading…' : 'Upload Logo'}
          </Button>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Company Information
        </Typography>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <TextField
          label="Company Name"
          fullWidth
          margin="normal"
          disabled={!canEdit}
          error={Boolean(errors.companyName)}
          helperText={errors.companyName?.message}
          {...register('companyName')}
        />
        <TextField label="Contact Person" fullWidth margin="normal" disabled={!canEdit} {...register('contactPerson')} />
        <TextField label="Mobile" fullWidth margin="normal" disabled={!canEdit} {...register('mobile')} />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          disabled={!canEdit}
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register('email')}
        />
        <TextField label="Address" fullWidth margin="normal" multiline rows={2} disabled={!canEdit} {...register('address')} />
        <TextField
          label="GST Number"
          fullWidth
          margin="normal"
          disabled={!canEdit}
          error={Boolean(errors.gstNumber)}
          helperText={errors.gstNumber?.message}
          {...register('gstNumber')}
        />
        <TextField
          label="Website"
          fullWidth
          margin="normal"
          disabled={!canEdit}
          error={Boolean(errors.website)}
          helperText={errors.website?.message}
          {...register('website')}
        />

        <Typography variant="h2" sx={{ mt: 3, mb: 1 }}>
          Bank Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Printed on every quotation PDF.
        </Typography>
        <TextField label="Bank Name" fullWidth margin="normal" disabled={!canEdit} {...register('bankName')} />
        <TextField label="Account Name" fullWidth margin="normal" disabled={!canEdit} {...register('bankAccountName')} />
        <TextField label="Account Number" fullWidth margin="normal" disabled={!canEdit} {...register('bankAccountNumber')} />
        <TextField label="Branch" fullWidth margin="normal" disabled={!canEdit} {...register('bankBranch')} />
        <TextField label="IFSC" fullWidth margin="normal" disabled={!canEdit} {...register('bankIfsc')} />
        <TextField label="UPI ID" fullWidth margin="normal" disabled={!canEdit} {...register('bankUpi')} />

        <Typography variant="h2" sx={{ mt: 3, mb: 1 }}>
          Quotation Branding
        </Typography>
        <TextField
          label="Authorized Signatory"
          fullWidth
          margin="normal"
          disabled={!canEdit}
          {...register('authorizedSignatory')}
        />
        <TextField
          label="Footer Message"
          fullWidth
          margin="normal"
          multiline
          rows={2}
          disabled={!canEdit}
          {...register('footerMessage')}
        />
        <TextField
          label="Terms & Conditions"
          fullWidth
          margin="normal"
          multiline
          rows={4}
          disabled={!canEdit}
          helperText="Printed on every quotation — the view page and the PDF. One term per line."
          {...register('termsAndConditions')}
        />
        {canEdit && (
          <Button variant="contained" sx={{ mt: 1 }} disabled={updateMutation.isPending} onClick={onSubmit}>
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        )}
      </Paper>
    </Stack>
  );
}
