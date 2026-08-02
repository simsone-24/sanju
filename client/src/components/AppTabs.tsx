import { Box, Tab, Tabs } from '@mui/material';
import { useState, type ReactNode } from 'react';

export interface AppTabItem {
  label: string;
  content: ReactNode;
}

interface AppTabsProps {
  tabs: AppTabItem[];
  idPrefix: string;
  initialIndex?: number;
  /**
   * Optional controlled mode. Supply both to let the parent drive the active tab — needed when an
   * action outside the tab strip has to bring a specific tab forward (e.g. Order Details' header
   * "Edit Order" button, whose drawer lives inside the Event Information tab and is therefore
   * unmounted while another tab is showing). Omit both for the usual self-managed behaviour.
   */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

// Matches the Order Details 7-tab pattern (docs/06_UI_UX_GUIDELINES.md §13) and Customer
// Profile's 5-tab pattern (§18) — both are just different tab sets on this same component.
export function AppTabs({
  tabs,
  idPrefix,
  initialIndex = 0,
  activeIndex: controlledIndex,
  onActiveIndexChange,
}: AppTabsProps) {
  const [uncontrolledIndex, setUncontrolledIndex] = useState(initialIndex);
  const isControlled = controlledIndex !== undefined;
  const activeIndex = isControlled ? controlledIndex : uncontrolledIndex;

  function handleChange(index: number) {
    if (!isControlled) setUncontrolledIndex(index);
    onActiveIndexChange?.(index);
  }

  return (
    <Box>
      <Tabs
        value={activeIndex}
        onChange={(_event, value: number) => handleChange(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {tabs.map((tab, index) => (
          <Tab
            key={tab.label}
            label={tab.label}
            id={`${idPrefix}-tab-${index}`}
            aria-controls={`${idPrefix}-tabpanel-${index}`}
          />
        ))}
      </Tabs>
      {tabs.map((tab, index) => (
        <Box
          key={tab.label}
          role="tabpanel"
          hidden={activeIndex !== index}
          id={`${idPrefix}-tabpanel-${index}`}
          aria-labelledby={`${idPrefix}-tab-${index}`}
          sx={{ pt: 2 }}
        >
          {activeIndex === index && tab.content}
        </Box>
      ))}
    </Box>
  );
}
