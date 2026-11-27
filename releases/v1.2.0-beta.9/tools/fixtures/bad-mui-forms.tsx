// Fixture: style forms developers write every day. Every colour and number below must be flagged.
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
const Panel = styled(Box)(({ theme }) => ({ padding: 13, color: '#FF0000' }));
const Strip = styled(Box)`color: #BB0000;`;
export function Forms({ active, list }) {
  return (
    <Box sx={[{ p: 0 }, active && { color: '#AA0000' }]}>
      <Box style={[{ flex: 1 }, { backgroundColor: '#0000FF' }]} />
      <Box style={[list[0], { marginTop: 7 }]} />
      <Box sx={{ gap: 3.5, borderRadius: 2 }} />
    </Box>
  );
}
