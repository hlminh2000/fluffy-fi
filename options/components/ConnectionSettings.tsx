import React, { useState } from "react"
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography
} from "@mui/material"
import { useSnackbarState } from "~common/components/CopyButton";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { PlaidConnection, usePlaidConnection } from "~common/components/PlaidConnection";
import HubIcon from '@mui/icons-material/Hub';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { usePlaidItems } from "~common/utils/usePlaidItems";
import { PlaidLink } from "~common/components/PlaidLink";
import EditIcon from '@mui/icons-material/Edit';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { useAsync } from "react-async-hook";
import orderBy from 'lodash/orderBy'
import type { PlaidItemAccount } from "~common/plaidTypes";
import { AccountTypeIcon } from "~common/components/AccountTypeIcon";

const useAccounts = (accessToken: string) => {
  const { plaidConnection } = usePlaidConnection();
  const { result, loading, error } = useAsync<PlaidItemAccount>(async () => 
    !plaidConnection?.baseOptions?.headers?.['PLAID-CLIENT-ID'] 
    ? [] 
    : fetch("https://sandbox.plaid.com/accounts/get", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "client_id": plaidConnection?.baseOptions?.headers?.['PLAID-CLIENT-ID'],
          "secret": plaidConnection?.baseOptions?.headers?.["PLAID-SECRET"],
          "access_token": accessToken
        })
      }).then(res => res.json()),
    [ plaidConnection?.baseOptions?.headers?.['PLAID-CLIENT-ID'], plaidConnection?.baseOptions?.headers?.["PLAID-SECRET"] ]
  )
  return { result, loading, error }
}

const PlaidItem = ({ plaidItem }: { plaidItem: ReturnType<typeof usePlaidItems>['plaidItems'][0]}) => {
  const { access, metadata: { institution } } = plaidItem;
  const { result, loading } = useAccounts(access.access_token)
  const accounts = orderBy(result?.accounts || [] as PlaidItemAccount['accounts'], a => ["depository","investment","credit","loan"].indexOf(a.type) || Infinity)
  return (
    <Card key={access.item_id} sx={{ mt: 2 }}>
      <CardHeader title={institution.name} />
      <Divider />
      <CardContent>
        <List>
          {
            accounts.map(a => (
              <React.Fragment key={a.account_id}>
                <ListItem secondaryAction={
                  <Box display={"flex"} flexDirection={"row"} alignItems={"center"}>
                    <Typography>${a.balances.current.toFixed(2)}</Typography>
                    <IconButton size="small" sx={{ml: 1}}>
                      <EditIcon />
                    </IconButton>
                  </Box>
                }>
                  <ListItemIcon>
                    <AccountTypeIcon type={a.type} />
                  </ListItemIcon>
                  <ListItemText>{a.name}</ListItemText>
                </ListItem>
                <Divider variant="inset" />
              </React.Fragment>
            ))
          }
        </List>
      </CardContent>
    </Card>
  )
}

export const ConnectionSettings = () => {
  const { plaidItems } = usePlaidItems();

  const snackbarState = useSnackbarState();
  const { snackbarMessage, snackbarOpen, messageType } = snackbarState;

  const [plaidConnectionOpen, setPlaidConnectionOpen] = useState(false)
  const [bankConnectionsOpen, setBankConnectionsOpen] = useState(false)
  return (
    <Card variant="outlined">
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
                {plaidItems.map((item) => <PlaidItem plaidItem={item} key={item.access.item_id} />)}
              </Box>
            </Box>
          </Collapse>

        </List>
      </CardContent>
    </Card>
  )
}
