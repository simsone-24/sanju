import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import LinkIcon from '@mui/icons-material/Link';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as auditLogService from '../../services/auditLogService';
import {
  type DeletedItemDetail,
  type DeletedItemType,
  type DetailField,
  type RelatedItem,
  type RelatedRestoreEffect,
} from '../../types/auditLog';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { actionColor, actionLabel, moduleLabel } from './auditLogLabels';
import { useRestoreDeletedItem } from './deletedItemRestore';

const DELETED_LIST_PATH = '/audit-log?tab=deleted';

const KIND_LABEL: Record<DeletedItemType, string> = {
  ENQUIRIES: 'Enquiry',
  QUOTATIONS: 'Quotation',
  ORDERS: 'Order',
  PAYMENTS: 'Payment',
  EXPENSES: 'Expense',
  USERS: 'User',
};

function isDeletedItemType(value: string | undefined): value is DeletedItemType {
  return value !== undefined && value in KIND_LABEL;
}

/** One field's value in the format the server asked for. */
function FieldValue({ field }: { field: DetailField }) {
  if (field.value === null) return <Typography variant="body2" color="text.disabled">—</Typography>;

  switch (field.format) {
    case 'currency':
      return <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(field.value)}</Typography>;
    case 'date':
      return <Typography variant="body2">{formatDate(field.value)}</Typography>;
    case 'datetime':
      return <Typography variant="body2">{formatDateTime(field.value)}</Typography>;
    case 'badge':
      return field.badge ? <StatusBadge type={field.badge} status={field.value} /> : <Typography variant="body2">{field.value}</Typography>;
    default:
      return <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{field.value}</Typography>;
  }
}

/** What restoring the record would do with a related one, in words. */
function EffectChip({ effect }: { effect: RelatedRestoreEffect }) {
  if (effect === 'returns') return <Chip size="small" color="success" variant="outlined" label="Returns on restore" />;
  if (effect === 'stays_deleted') return <Chip size="small" variant="outlined" label="Stays deleted" />;
  return <Typography variant="caption" color="text.secondary">Not deleted</Typography>;
}

function RelatedStatus({ item }: { item: RelatedItem }) {
  if (!item.status) return <>—</>;
  return item.badge ? <StatusBadge type={item.badge} status={item.status} size="sm" /> : <>{item.status}</>;
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '12px', p: { xs: 2, sm: 2.5 }, minWidth: 0 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
}

function PageSkeleton() {
  return (
    <Box>
      <Skeleton variant="rounded" height={120} sx={{ borderRadius: '12px', mb: 2 }} />
      <Skeleton variant="rounded" height={260} sx={{ borderRadius: '12px' }} />
    </Box>
  );
}

/**
 * One deleted record, read-only: everything it held when it was deleted, who deleted it and when, the
 * related records it took with it (and which of them a restore would bring back), and its history.
 */
export default function DeletedItemViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const canView = usePermission('AUDIT_LOG', 'canView');

  const type = isDeletedItemType(params.type) ? params.type : null;
  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-log', 'deleted', 'detail', type, id],
    queryFn: () => auditLogService.getDeletedItem(type as DeletedItemType, id),
    enabled: canView && type !== null && validId,
    retry: false,
  });

  // Once restored it is no longer a deleted record, so there is nothing left to view here.
  const restore = useRestoreDeletedItem(type ?? 'ENQUIRIES', () => navigate(DELETED_LIST_PATH, { replace: true }));

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view the audit log.</Typography>;
  }

  const breadcrumbs = [
    { label: 'Dashboard', to: '/' },
    { label: 'Audit Log', to: DELETED_LIST_PATH },
    { label: data?.reference ?? 'Deleted record' },
  ];
  const backButton = (
    <Button size="small" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(DELETED_LIST_PATH)}>
      Back
    </Button>
  );

  if (type === null || !validId) {
    return (
      <Box>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Breadcrumbs items={breadcrumbs} />
          {backButton}
        </Stack>
        <Alert severity="error">This deleted record could not be found.</Alert>
      </Box>
    );
  }

  if (isLoading) return <PageSkeleton />;

  if (isError || !data) {
    return (
      <Box>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Breadcrumbs items={breadcrumbs} />
          {backButton}
        </Stack>
        <Alert severity="error">
          This record is not deleted (it may already have been restored), or it could not be loaded.
        </Alert>
      </Box>
    );
  }

  return <DeletedItemView detail={data} breadcrumbs={breadcrumbs} backButton={backButton} restore={restore} />;
}

interface DeletedItemViewProps {
  detail: DeletedItemDetail;
  breadcrumbs: { label: string; to?: string }[];
  backButton: React.ReactNode;
  restore: ReturnType<typeof useRestoreDeletedItem>;
}

function DeletedItemView({ detail, breadcrumbs, backButton, restore }: DeletedItemViewProps) {
  const kind = KIND_LABEL[detail.type];
  const returning = detail.related.flatMap((group) => group.items).filter((item) => item.effect === 'returns').length;
  const staying = detail.related.flatMap((group) => group.items).filter((item) => item.effect === 'stays_deleted').length;

  return (
    <Box>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1, mb: 1.5 }}
      >
        <Breadcrumbs items={breadcrumbs} />
        <Stack direction="row" spacing={1}>
          {backButton}
          {restore.canRestore && (
            <Button
              size="small"
              variant="contained"
              startIcon={<RestoreFromTrashIcon />}
              onClick={() =>
                restore.request({ id: detail.id, reference: detail.reference, title: detail.title, amount: detail.amount })
              }
            >
              Restore
            </Button>
          )}
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: '12px', p: { xs: 2, sm: 2.5 }, mb: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {kind}
          </Typography>
          <Chip size="small" color="error" label="Deleted" />
        </Stack>
        <Typography variant="h4" component="h1" sx={{ mt: 0.5, fontWeight: 700, wordBreak: 'break-word' }}>
          {detail.reference}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {detail.title}
          {detail.amount !== null && ` · ${formatCurrency(detail.amount)}`}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          Deleted on <strong>{formatDateTime(detail.deletedAt)}</strong>
          {' by '}
          <strong>{detail.deletedBy?.fullName ?? 'an unrecorded user'}</strong>
          {detail.deletedWith && <> — along with {detail.deletedWith}</>}
        </Typography>
      </Paper>

      <Alert severity="warning" sx={{ mb: 2 }}>
        This {kind.toLowerCase()} is deleted, so it no longer appears in its own module.
        {returning > 0 && ` Restoring it also brings back ${returning} related record${returning === 1 ? '' : 's'}.`}
        {staying > 0 &&
          ` ${staying} related record${staying === 1 ? ' was' : 's were'} deleted separately and would stay deleted.`}
      </Alert>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 2 }}>
        {detail.sections.map((section) => (
          <Card key={section.title} title={section.title}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
              {section.fields.map((field) => (
                <Box key={field.label} sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
                    {field.label}
                  </Typography>
                  <FieldValue field={field} />
                </Box>
              ))}
            </Box>
          </Card>
        ))}
      </Box>

      {detail.related.length > 0 && (
        <Stack spacing={2} sx={{ mb: 2 }}>
          {detail.related.map((group) => (
            <Card key={group.title} title={`${group.title} (${group.items.length})`} icon={<LinkIcon fontSize="small" color="action" />}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Amount
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>On restore</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.items.map((item, index) => (
                      <TableRow key={`${item.reference}-${index}`} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{item.reference}</TableCell>
                        <TableCell>{item.description ?? '—'}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          {item.amount !== null ? formatCurrency(item.amount) : '—'}
                        </TableCell>
                        <TableCell>
                          <RelatedStatus item={item} />
                        </TableCell>
                        <TableCell>
                          <EffectChip effect={item.effect} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          ))}
        </Stack>
      )}

      <Card title={`History (${detail.history.length})`} icon={<HistoryIcon fontSize="small" color="action" />}>
        {detail.history.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nothing was logged against this record.
          </Typography>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>When</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail.history.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(entry.performedAt)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.performedBy?.fullName ?? 'System'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{moduleLabel(entry.module)}</TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" color={actionColor(entry.action)} label={actionLabel(entry.action)} />
                    </TableCell>
                    <TableCell>{entry.description ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {restore.dialog}
    </Box>
  );
}
