// import "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
import { Box, Button, Collapse, Container, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Typography } from "@mui/material"
import { FluffyThemeProvider } from "~common/utils/theme"
import { CheckCircle } from "@mui/icons-material";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { PasswordSetterForm } from "~common/components/PasswordSetter"
import { SetupSteps, useSetupStep } from "~common/utils/useSetupStep"
import { PlaidConnection, usePlaidConnection } from "~common/components/PlaidConnection";
// import { usePlaidLink } from 'react-plaid-link';
import { useAsync } from 'react-async-hook';
import { useEffect } from "react";

const PlaidLink = () => {

  const { plaidConnection } = usePlaidConnection()

  console.log("plaidConnection: ", plaidConnection)

  const { result } = useAsync(async () => (await fetch("https://development.plaid.com/link/token/create", {
    method: "POST",
    headers: {
      ...(plaidConnection?.baseOptions?.headers || {}),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      clientId: plaidConnection?.baseOptions?.headers?.["PLAID-CLIENT-ID"],
      secret: plaidConnection?.baseOptions?.headers?.["PLAID-SECRET"],
      name: "PluffyFi",
      "user": {
        "client_user_id": crypto.randomUUID(),
        "phone_number": "+1 415 5550123"
      },
      "client_name": "Personal Finance App",
      "products": ["transactions"],
      "country_codes": ["US"],
      "language": "en",
      "redirect_uri": "https://local.fluffyfi/"
    })
  })).json(), [plaidConnection?.baseOptions?.headers?.["PLAID-CLIENT-ID"]])

  // const { open, ready } = usePlaidLink({
  //   token: result?.link_token,
  //   onSuccess: (public_token, metadata) => {
  //     // send public_token to server
  //   },
  // });

  return (
    <Box>
      <Typography>FluffyFi connects to your financial institutions to gather your financial data.</Typography>
      {result?.link_token && (
        <Box mt={2}>
          <iframe
            src={`http://localhost:3001?plaidLinkToken=${result.link_token}`}
            style={{ width: "100%", border: "none", height: 32 }}
          />
        </Box>
      )}
    </Box>
  )
}

export default () => {

  const { currentStep, setCurrentStep } = useSetupStep()

  return (
    <FluffyThemeProvider>
      <Container sx={{ display: "flex", height: "100vh", flexDirection: "column", justifyContent: "center" }}>
        <Paper sx={{ overflow: "hidden" }}>
          <Grid container minHeight={200}>
            <Grid item xs={12}>
              <Box p={4}>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      {
                        [SetupSteps.INSTITUTION_CONNECTION, SetupSteps.PLAID_CONNECTION, SetupSteps.COMPLETED].includes(currentStep)
                          ? <CheckCircle color="success" />
                          : <RadioButtonUncheckedIcon />
                      }
                    </ListItemIcon>
                    <ListItemText primary="Set up your PIN"></ListItemText>
                  </ListItem>
                  <Collapse unmountOnExit in={currentStep === SetupSteps.PIN_SETUP}>
                    <Box display="flex" flexDirection="column" p={2} pt={0}>
                      <Typography sx={{ mb: 2 }}>A PIN is required to protect your data. Please enter a PIN of choice below.</Typography>
                      <PasswordSetterForm onComplete={() => setCurrentStep(SetupSteps.PLAID_CONNECTION)} />
                    </Box>
                  </Collapse>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      {
                        [SetupSteps.INSTITUTION_CONNECTION, SetupSteps.COMPLETED].includes(currentStep)
                          ? <CheckCircle color="success" />
                          : <RadioButtonUncheckedIcon />
                      }
                    </ListItemIcon>
                    <ListItemText primary="Connect to Plaid API"></ListItemText>
                  </ListItem>
                  <Collapse unmountOnExit in={currentStep === SetupSteps.PLAID_CONNECTION}>
                    <Box display="flex" flexDirection="column" p={2} pt={0}>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        Plaid provides FluffyFi with your financial data. By using your own Plaid account, you are in full control of your own data.
                      </Typography>
                      <PlaidConnection onComplete={() => setCurrentStep(SetupSteps.INSTITUTION_CONNECTION)} />
                    </Box>
                  </Collapse>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      {
                        [SetupSteps.COMPLETED].includes(currentStep)
                          ? <CheckCircle color="success" />
                          : <RadioButtonUncheckedIcon />
                      }
                    </ListItemIcon>
                    <ListItemText primary="Connect your first financial institution"></ListItemText>
                  </ListItem>
                  <Collapse unmountOnExit in={currentStep === SetupSteps.INSTITUTION_CONNECTION}>
                    <Box display="flex" flexDirection="column" p={2} pt={0}>
                      <PlaidLink />
                    </Box>
                  </Collapse>
                  <Collapse unmountOnExit in={currentStep === SetupSteps.COMPLETED}>
                    <Box display="flex" flexDirection="column" mt={5} >
                      <Typography >FluffyFi is ready for use. You may now close this setup.</Typography>
                      <Button autoFocus sx={{ mt: 1 }} size="small" variant="contained" onClick={() => window.close()}>Close setup</Button>
                    </Box>
                  </Collapse>
                </List>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </FluffyThemeProvider>
  )
}
