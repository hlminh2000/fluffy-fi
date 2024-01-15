import React, { useState } from "react"
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from "@mui/material"
import { useSnackbarState } from "~common/components/CopyButton";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { PlaidConnection } from "~common/components/PlaidConnection";
import HubIcon from '@mui/icons-material/Hub';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { usePlaidItems } from "~common/utils/usePlaidItems";
import { PlaidLink } from "~common/components/PlaidLink";



export const ConnectionSettings = () => {
  const { plaidItems } = usePlaidItems();

  const snackbarState = useSnackbarState();
  const { snackbarMessage, snackbarOpen, messageType } = snackbarState;

  const [plaidConnectionOpen, setPlaidConnectionOpen] = useState(false)
  const [bankConnectionsOpen, setBankConnectionsOpen] = useState(false)
  return (
    <Card>
      <CardHeader title="Connections" />
      <Divider />
      <CardContent>
        <List>
          <ListItemButton onClick={() => setPlaidConnectionOpen(!plaidConnectionOpen)}>
            <ListItemIcon >
              <HubIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Plaid connection" secondary="Plaid provides FluffyFi with connections to your financial institutions" />
            {plaidConnectionOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={plaidConnectionOpen} timeout="auto" unmountOnExit>
            <Box display="flex" flexDirection="column" pl={10} pr={2}>
              <PlaidConnection onComplete={console.log} />
            </Box>
          </Collapse>

          <Divider variant="inset" sx={{ my: 2 }} />

          <ListItemButton onClick={() => setBankConnectionsOpen(!bankConnectionsOpen)}>
            <ListItemIcon >
              <AccountBalanceIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Institution connections" secondary="Your connected bank accounts" />
            {bankConnectionsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={bankConnectionsOpen} timeout="auto" unmountOnExit>
            <Box display="flex" flexDirection="column" pl={10} pr={2}>
              <Box>
                <Box mt={2}>
                  <PlaidLink buttonTitle="New Connection" />
                </Box>
                {plaidItems.map(({ access, metadata: { institution, accounts } }) => (
                  <Card key={access.item_id} sx={{ mt: 2 }}>
                    <CardHeader title={institution.name} />
                    <Divider />
                    <CardContent>
                      <List>
                        {
                          accounts.map(a => (
                            <ListItem>
                              <ListItemText>{a.name}</ListItemText>
                            </ListItem>
                          ))
                        }
                      </List>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          </Collapse>

        </List>
      </CardContent>
    </Card>
  )
}
