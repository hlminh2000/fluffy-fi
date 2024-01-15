import React, { useState } from "react"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Container,
  Divider,
  GlobalStyles,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  TextField,
} from "@mui/material"
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PasswordIcon from '@mui/icons-material/Password';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import { useSnackbarState } from "~common/components/CopyButton";
import { FluffyThemeProvider } from "~common/utils/theme";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useStorage } from "@plasmohq/storage/hook";
import { COLOR_THEME, DEFAULT_SESSION_TIMEOUT_MINUTES, STORAGE_KEY } from "~common/utils/constants";
import { useColorThemeSetting } from "~common/utils/settingsHooks";
import { SecretInput } from "~common/components/SecretInput";
import { FluffyBackground } from "~common/components/FluffyBackground";
import { LoginGate } from "~common/components/LoginGate";
import { PlaidConnection } from "~common/components/PlaidConnection";
import HubIcon from '@mui/icons-material/Hub';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { usePlaidItems } from "~common/utils/usePlaidItems";
import { PlaidLink } from "~common/components/PlaidLink";

const ChangePassword = () => {

  const [loading, setLoading] = useState(false);

  const onPasswordChangeClick = () => {
    setLoading(true);
    setLoading(false);
  }
  return (
    <List disablePadding>
      <ListItem sx={{ pl: 10 }}>
        <SecretInput fullWidth size="small" label="Current password" />
      </ListItem>
      <ListItem sx={{ pl: 10 }}>
        <SecretInput fullWidth size="small" label="New password" />
      </ListItem>
      <ListItem sx={{ pl: 10 }}>
        <SecretInput fullWidth size="small" label="Confirm password" />
      </ListItem>
      <ListItem sx={{ pl: 10 }}>
        <Button fullWidth variant="contained" disabled={loading} onClick={onPasswordChangeClick}>Change Password</Button>
      </ListItem>
    </List>)
}

const SecuritySettings = () => {

  const snackbarState = useSnackbarState();
  const { snackbarMessage, snackbarOpen, messageType } = snackbarState;

  const [sessionTimeout, setSessionTimeout] = useStorage<number>(STORAGE_KEY.sessionTimeoutMinutes);
  const [sessionTimeoutInput, setSessionTimeoutInput] = useState(sessionTimeout || DEFAULT_SESSION_TIMEOUT_MINUTES);
  const onSessionTimeoutInputChange: React.ComponentProps<typeof TextField>['onChange'] =
    e => setSessionTimeoutInput(Number(e.target.value))
  const onSessionTimeoutSave: React.ComponentProps<typeof Button>['onClick'] =
    () => setSessionTimeout(sessionTimeoutInput)

  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  return (
    <Card>
      <CardHeader title="Security" />
      <Divider />
      <CardContent>
        <List>

          <ListItem secondaryAction={
            <Box display="flex" flexDirection="row" alignContent="center">
              <TextField label="minutes" size="small" sx={{ pr: 1 }} value={sessionTimeoutInput} onChange={onSessionTimeoutInputChange} type="number" />
              <Button variant="contained" disabled={sessionTimeout === sessionTimeoutInput} onClick={onSessionTimeoutSave}>Save</Button>
            </Box>
          }>
            <ListItemIcon>
              <AccessTimeIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Session timeout" secondary="Lock access and requires PIN after this amount of time" />
          </ListItem>

          <Divider variant="inset" sx={{ my: 2 }} />

          <ListItemButton onClick={() => setChangePasswordOpen(!changePasswordOpen)}>
            <ListItemIcon >
              <PasswordIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Change password" secondary="Password to unlock after session timeout" />
            {changePasswordOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={changePasswordOpen} timeout="auto" unmountOnExit>
            <ChangePassword />
          </Collapse>
        </List>
      </CardContent>
    </Card>
  )
}

const BankConnections = () => {
  const { plaidItems } = usePlaidItems();
  return (
    <Box>
      <Box mt={2}>
        <PlaidLink buttonTitle="New Connection" />
      </Box>
      {plaidItems.map(({ access, metadata: { institution, accounts } }) => (
        <Card key={access.item_id} sx={{mt: 2}}>
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
  )
}

const ConnectionSettings = () => {

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
              <BankConnections />
            </Box>
          </Collapse>

        </List>
      </CardContent>
    </Card>
  )
}


const AppearanceSettings = () => {
  const { colorTheme, options, setColorTheme } = useColorThemeSetting()
  const onColorThemeChange: React.ComponentProps<typeof Select>['onChange'] =
    (e) => setColorTheme(e.target.value as COLOR_THEME)
  return (
    <Card>
      <CardHeader title="Appearance" />
      <Divider />
      <CardContent>
        <List>
          <ListItem secondaryAction={
            <Select size="small" label="Light or dark mode" value={colorTheme} onChange={onColorThemeChange}>
              <MenuItem value={options.light}>Light</MenuItem>
              <MenuItem value={options.dark}>Dark</MenuItem>
              <MenuItem value={options.system}>Match system settings</MenuItem>
            </Select>
          }>
            <ListItemIcon><Brightness4Icon /></ListItemIcon>
            <ListItemText primary="Theme" secondary="Light or dark mode" />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  )
}


function IndexPopup() {

  const snackbarState = useSnackbarState();
  const { snackbarMessage, snackbarOpen, messageType } = snackbarState;

  return (
    <FluffyThemeProvider>
      <LoginGate>
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
      </LoginGate>
    </FluffyThemeProvider>
  )
}

export default IndexPopup
