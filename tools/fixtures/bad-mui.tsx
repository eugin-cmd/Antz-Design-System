// Fixture: an MUI screen that breaks the rules in sx and style objects. Every line below should be flagged.
import { Box, Button } from '@mui/material';
export function Bad() {
  return (
    <Box sx={{ backgroundColor: '#FF5722', color: 'white', fontSize: 13, fontWeight: 600, fontFamily: 'Roboto', p: 3, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,.2)', transition: 'all 300ms ease' }}>
      <Button style={{ background: '#38BD69', marginTop: 18 }}>Save</Button>
      <span className="priority__opt priority__opt--emergency">Critical</span>
    </Box>
  );
}
