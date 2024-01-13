import React, { useState } from "react"
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material"
import { usePasswordHash } from "~common/utils/usePasswordHash";
import { SecretInput } from "./SecretInput";
import { FluffyBackground } from "./FluffyBackground";

export const PasswordSetterForm = ({ onComplete }: { onComplete?: () => void }) => {
  const { hashPassword } = usePasswordHash();
  const [newPasswordInput, setNewPasswordInput] = useState("")
  const [newPasswordInputConfirm, setNewPasswordInputConfirm] = useState("")
  const [newPasswordError, setNewPasswordError] = useState(false);
  const onNewPasswordInputChange: React.ComponentProps<typeof TextField>["onChange"] = e => {
    setNewPasswordError(false)
    setNewPasswordInput(e.target.value)
  }
  const onNewPasswordConfirmInputChange: React.ComponentProps<typeof TextField>["onChange"] = e => {
    setNewPasswordError(false)
    setNewPasswordInputConfirm(e.target.value)
  }
  const onSetPasswordClick = async () => {
    if (newPasswordInput && newPasswordInputConfirm && newPasswordInput === newPasswordInputConfirm) {
      await hashPassword({ password: newPasswordInput })
      onComplete?.()
    } else {
      setNewPasswordError(true)
    }
  }
  return (
    <>
      <SecretInput
        autoFocus
        variant="outlined"
        label={`PIN`}
        size="small"
        value={newPasswordInput}
        onChange={onNewPasswordInputChange}
        required
        error={newPasswordError}
        sx={{ mb: 1 }}
      />
      <SecretInput
        variant="outlined"
        label={`Re-enter PIN`}
        size="small"
        value={newPasswordInputConfirm}
        onChange={onNewPasswordConfirmInputChange}
        required
        error={newPasswordError}
        sx={{ mb: 1 }}
      />
      <Button variant="contained" size="small" onClick={onSetPasswordClick} fullWidth>Set PIN</Button>
    </>
  )
}

export const PassswordSetter = () => {
  return (
    <FluffyBackground
      height={300}
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Paper sx={{ mx: 4 }}>
        <Box
          display="flex"
          flexDirection="column"
          m={1}
        >
          <Box mb={1}>
            <Typography>Create a PIN to protect recently generated keys</Typography>
          </Box>
          <PasswordSetterForm />
        </Box>
      </Paper >
    </FluffyBackground>
  )
}
