import {
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import * as permissionService from '../../services/permissionService';
import type { ModuleName, PermissionAction, PermissionGrant } from '../../types/permission';

interface PermissionMatrixEditorProps {
  /** Permissions currently ticked. */
  value: PermissionGrant[];
  onChange: (permissions: PermissionGrant[]) => void;
  /**
   * Permissions the subject already holds from elsewhere — the user's group, when this editor is
   * used for overrides. Shown as ticked and locked: an override can only add (user.md §User
   * Permission Override), so removing an inherited permission is not an option here.
   */
  inherited?: PermissionGrant[];
  inheritedLabel?: string;
  readOnly?: boolean;
}

function grantKey(module: string, action: string): string {
  return `${module}:${action}`;
}

// One card per module with its own action checkboxes, rather than a fixed grid: every module
// exposes a different set of actions (user.md §Action-Level Permissions — "Each module can expose
// additional actions"), so the columns of a matrix would not line up.
export function PermissionMatrixEditor({
  value,
  onChange,
  inherited = [],
  inheritedLabel = 'From group',
  readOnly = false,
}: PermissionMatrixEditorProps) {
  const { data: catalog, isLoading } = useQuery({
    queryKey: ['permission-catalog'],
    queryFn: () => permissionService.getCatalog(),
    // The catalog only changes when the application itself ships new modules.
    staleTime: Infinity,
  });

  const selected = useMemo(
    () => new Set(value.map((grant) => grantKey(grant.module, grant.action))),
    [value],
  );
  const inheritedKeys = useMemo(
    () => new Set(inherited.map((grant) => grantKey(grant.module, grant.action))),
    [inherited],
  );

  function toggle(module: ModuleName, action: PermissionAction, checked: boolean) {
    if (checked) {
      onChange([...value, { module, action }]);
      return;
    }
    onChange(value.filter((grant) => !(grant.module === module && grant.action === action)));
  }

  function toggleModule(module: ModuleName, actions: PermissionAction[], checked: boolean) {
    const withoutModule = value.filter((grant) => grant.module !== module);
    if (!checked) {
      onChange(withoutModule);
      return;
    }
    onChange([
      ...withoutModule,
      // Anything already inherited stays out of the override set — ticking it again would store a
      // duplicate grant that changes nothing.
      ...actions
        .filter((action) => !inheritedKeys.has(grantKey(module, action)))
        .map((action) => ({ module, action })),
    ]);
  }

  if (isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  if (!catalog?.length) {
    return <Typography color="text.secondary">No modules are available to configure.</Typography>;
  }

  return (
    <Stack spacing={1.5}>
      {catalog.map((definition) => {
        const actionKeys = definition.actions.map((action) => action.key);
        const grantedCount = actionKeys.filter(
          (action) =>
            selected.has(grantKey(definition.module, action)) ||
            inheritedKeys.has(grantKey(definition.module, action)),
        ).length;
        const allGranted = grantedCount === actionKeys.length;

        return (
          <Paper key={definition.module} variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap' }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {definition.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {definition.description}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Chip
                  size="small"
                  label={grantedCount === 0 ? 'No access' : `${grantedCount}/${actionKeys.length}`}
                  color={grantedCount === 0 ? 'default' : 'primary'}
                  variant={allGranted ? 'filled' : 'outlined'}
                />
                {!readOnly && (
                  <FormControlLabel
                    label="Select all"
                    slotProps={{ typography: { variant: 'caption' } }}
                    control={
                      <Checkbox
                        size="small"
                        checked={allGranted}
                        indeterminate={grantedCount > 0 && !allGranted}
                        onChange={(event) =>
                          toggleModule(definition.module, actionKeys, event.target.checked)
                        }
                      />
                    }
                  />
                )}
              </Stack>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gap: 0.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              }}
            >
              {definition.actions.map((action) => {
                const isInherited = inheritedKeys.has(grantKey(definition.module, action.key));
                const isChecked = isInherited || selected.has(grantKey(definition.module, action.key));

                const control = (
                  <FormControlLabel
                    label={
                      isInherited ? (
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          <span>{action.label}</span>
                          <Chip size="small" variant="outlined" label={inheritedLabel} />
                        </Stack>
                      ) : (
                        action.label
                      )
                    }
                    slotProps={{ typography: { variant: 'body2' } }}
                    control={
                      <Checkbox
                        size="small"
                        checked={isChecked}
                        // An inherited permission cannot be unticked here: overrides only add.
                        disabled={readOnly || isInherited}
                        onChange={(event) =>
                          toggle(definition.module, action.key, event.target.checked)
                        }
                      />
                    }
                  />
                );

                return isInherited ? (
                  <Tooltip key={action.key} title="Granted by the assigned user group">
                    <Box>{control}</Box>
                  </Tooltip>
                ) : (
                  <Box key={action.key}>{control}</Box>
                );
              })}
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
}
