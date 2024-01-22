import React, { useState } from "react"
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
} from "@mui/material"
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PasswordIcon from '@mui/icons-material/Password';
import { useSnackbarState } from "~common/components/CopyButton";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useStorage } from "@plasmohq/storage/hook";
import { DEFAULT_SESSION_TIMEOUT_MINUTES, STORAGE_KEY } from "~common/utils/constants";
import { SecretInput } from "~common/components/SecretInput";

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
    </List>
  )
}

export const SecuritySettings = () => {

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
    <Card variant="outlined">
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
