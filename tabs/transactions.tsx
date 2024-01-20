// import "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
import { Box, Button, Collapse, Container, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Typography } from "@mui/material"
import { FluffyThemeProvider } from "~common/utils/theme"
import { CheckCircle } from "@mui/icons-material";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { PasswordSetterForm } from "~common/components/PasswordSetter"
import { SetupSteps, useSetupStep } from "~common/utils/useSetupStep"
import { PlaidConnection } from "~common/components/PlaidConnection";
import { PlaidLink } from "~common/components/PlaidLink";
import { sendToBackground } from "@plasmohq/messaging";

export default () => {

  const onSyncClick = async () => {
    console.log(await sendToBackground({ name: "syncTransactions" }))
  }

  return (
    <FluffyThemeProvider>
      <Container sx={{ display: "flex", height: "100vh", flexDirection: "column", justifyContent: "center" }}>
        <Paper sx={{ overflow: "hidden" }}>
          <Button onClick={onSyncClick}>Sync</Button>
        </Paper>
      </Container>
    </FluffyThemeProvider>
  )
}
