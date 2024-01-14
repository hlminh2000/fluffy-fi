import React from "react"
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography
} from "@mui/material"
import SettingsIcon from '@mui/icons-material/Settings';
import { FluffyThemeProvider } from "~common/utils/theme";
import { SetupGate } from "~common/components/SetupGate";
import { LoginGate } from "~common/components/LoginGate";

function IndexPopup() {

  const onSettingsClick = () => {
    chrome.tabs.create({ url: "options.html" })
  }

  return (
    <FluffyThemeProvider>
      <Box width={390} sx={{ flexGrow: 1, bgcolor: "background" }}>
        <SetupGate>
          <LoginGate>
            <AppBar position="static">
              <Toolbar variant="dense">
                <Typography sx={{ flexGrow: 1 }}> </Typography>
                <IconButton color="inherit" onClick={onSettingsClick}>
                  <SettingsIcon />
                </IconButton>
              </Toolbar>
            </AppBar>
            <Box>
            </Box>
          </LoginGate>
        </SetupGate>
      </Box>
    </FluffyThemeProvider >
  )
}

export default IndexPopup
