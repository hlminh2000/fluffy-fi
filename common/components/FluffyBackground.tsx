import { Box } from "@mui/material"
import { ComponentProps } from "react";
import background from '~assets/fluffy_background.jpg';

export const FluffyBackground = ({ children, ...rest }: ComponentProps<typeof Box>) => (
  <Box
    sx={{ background: `url(${background}) 0% 0% / cover`, color: "white" }}
    height={"100%"}
    width={"100%"}
    {...rest}
  >
    {children}
  </Box>
)
