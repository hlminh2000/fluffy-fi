import React from "react"
import {
  Alert,
  Box,
  Container,
  GlobalStyles,
  Snackbar,
} from "@mui/material"
import { useSnackbarState } from "~common/components/CopyButton";
import { FluffyThemeProvider } from "~common/utils/theme";
import { FluffyBackground } from "~common/components/FluffyBackground";
import { LoginGate } from "~common/components/LoginGate";
import { ConnectionSettings } from "./components/ConnectionSettings";
import { SecuritySettings } from "./components/SecuritySettings";
import { AppearanceSettings } from "./components/AppearanceSettings";
import { PasswordGate } from "~common/components/PasswordGate";

function IndexPopup() {

  const snackbarState = useSnackbarState();
  const { snackbarMessage, snackbarOpen, messageType } = snackbarState;

  return (
    <FluffyThemeProvider>
      <PasswordGate>
        <FluffyBackground sx={{
          height: "100vh",
          overflowY: "scroll",
        }}>
          <GlobalStyles styles={{ body: { margin: 0 } }} />
          <Snackbar open={snackbarOpen} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
            <Alert severity={messageType} >{snackbarMessage}</Alert>
          </Snackbar>
          <Box sx={{ flexGrow: 1 }} p={0}>
            <Container sx={{ py: 8, minHeight: "100vh" }}>
              <Box mt={2}>
                <ConnectionSettings />
              </Box>
              <Box mt={2}>
                <SecuritySettings />
              </Box>
              <Box mt={2}>
                <AppearanceSettings />
              </Box>
            </Container>
          </Box>
        </FluffyBackground>
      </PasswordGate>
    </FluffyThemeProvider>
  )
}

export default IndexPopup
