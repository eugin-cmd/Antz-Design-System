// Fixture: an MUI screen that follows the rules: theme values and tokens only.
import { Box, Button } from '@mui/material';
export function Good({ theme }) {
  return (
    <Box sx={{ backgroundColor: theme.palette.background.paper, color: 'var(--color-text)', fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', p: 'var(--space-4)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', transition: 'background var(--duration-fast) var(--ease-standard)', border: 0, opacity: 0.9 }}>
      <Button variant="contained" sx={{ mt: 0 }}>Save</Button>
      <span className="priority__opt priority__opt--critical">Critical</span>
    </Box>
  );
}
