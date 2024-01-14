// import "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
import { Box, Button, Collapse, Container, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Typography } from "@mui/material"
import { FluffyThemeProvider } from "~common/utils/theme"
import { CheckCircle } from "@mui/icons-material";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { PasswordSetterForm } from "~common/components/PasswordSetter"
import { SetupSteps, useSetupStep } from "~common/utils/useSetupStep"
import { PlaidConnection, usePlaidConnection } from "~common/components/PlaidConnection";
import { useAsync } from 'react-async-hook';
import {  useEffect,  useState } from "react";
import { useStorageVault } from "~common/utils/useStorageVault";

type PlaidItem = {
  "access_token": string,
  "item_id": string,
  "request_id": string
}
const usePlaidItems = () => {
  const [plaidItems, setPlaidItems] = useStorageVault<PlaidItem[]>("plaidItems");
  const plaidItemsFallback = plaidItems || []
  return {
    plaidItems: plaidItemsFallback,
    addPlaidItem: (item: PlaidItem) => setPlaidItems([...plaidItemsFallback, item]),
  }
}

const PlaidLink = ({onComplete}: {onComplete: () => any}) => {

  const { plaidConnection } = usePlaidConnection()
  const [iframeExpanded, setIframeExpanded] = useState(false);
  const { addPlaidItem } = usePlaidItems();

  const { result } = useAsync(async () => (await fetch("https://sandbox.plaid.com/link/token/create", {
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
  
  type IframeMessage = { type: "PLAID_OPEN" } | { type: "PLAID_EXIT" } | { type: "PLAID_CONNECT_SUCCESS", payload: {public_token: string, metadata: {}} }
  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement>(null)
  useEffect(() => {
    const messageHandler = async (e: MessageEvent<IframeMessage>) => {
      if (e.data.type === "PLAID_OPEN") return setIframeExpanded(true)
      if (e.data.type === "PLAID_EXIT") return setIframeExpanded(false)
      if (e.data.type === "PLAID_CONNECT_SUCCESS") {
        const { payload } = e.data
        const plaidItem = (await fetch("https://sandbox.plaid.com/item/public_token/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: plaidConnection?.baseOptions?.headers?.["PLAID-CLIENT-ID"],
            secret: plaidConnection?.baseOptions?.headers?.["PLAID-SECRET"],
            public_token: payload.public_token
          })
        }).then(res => res.json())) as PlaidItem
        await addPlaidItem(plaidItem)
        onComplete()
      }
    }
    window.addEventListener("message", messageHandler)
    return () => {
      window.removeEventListener("message", messageHandler)
    }
  }, [])

  return (
    <Box>
      <Typography>FluffyFi connects to your financial institutions to gather your financial data.</Typography>
      {result?.link_token && (
        <Box mt={2}>
          <iframe
            ref={setIframeRef}
            src={`http://localhost:3001?plaidLinkToken=${result.link_token}`}
            style={{ width: "100%", border: "none", height: !iframeExpanded ? 32 : 660 }}
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
                      <PlaidLink onComplete={() => setCurrentStep(SetupSteps.COMPLETED)}/>
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
