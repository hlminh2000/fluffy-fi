import { Box } from "@mui/material"
import background from '~assets/fluffy_background.jpg';

export const FluffyBackground: typeof Box = ({ children = null, ...rest }) => (
  <Box
    sx={{ background: `url(${background}) 0% 0% / cover`, color: "white" }}
    height={"100%"}
    width={"100%"}
    {...rest}
  >
    {children}
  </Box>
)
