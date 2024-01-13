import { Button, CircularProgress, Link, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useSetupStep } from "~common/utils/useSetupStep"
import { FluffyBackground } from "./FluffyBackground";
import { sendToBackground } from "@plasmohq/messaging";

export const SetupGate = ({ children }) => {
  const { isComplete } = useSetupStep();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }, [])

  const onCompleteSetupClick = () => {
    sendToBackground({
      name: "openSetup"
    })
  }

  if (loading) return (
    <FluffyBackground
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4}
    >
      <CircularProgress color="inherit" />
    </FluffyBackground>
  )
  if (isComplete) return children
  return (
    <FluffyBackground
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4}
    >
      <Paper sx={{ p: 4, display: "flex", flexDirection: "column" }}>
        <Typography>Your setup has not completed yet.</Typography>
        <Button autoFocus fullWidth variant="contained" sx={{ mt: 2 }} onClick={onCompleteSetupClick}>
          Complete setup
        </Button>
      </Paper>
    </FluffyBackground>
  )
}
