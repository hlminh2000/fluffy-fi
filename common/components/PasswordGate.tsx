import { usePasswordHash } from "~common/utils/usePasswordHash";
import React, { useEffect, useState } from "react"
import {
  Box,
  Button,
  Paper,
  TextField,
} from "@mui/material"
import { useLoginSession } from "~common/utils/useLoginSession";
import { SecretInput } from "./SecretInput";
import { FluffyBackground } from "./FluffyBackground";

const PasswordValidator = ({
  onPasswordValidated
}: {
  onPasswordValidated?: () => void
}) => {
  const { login, cachedPassword } = useLoginSession()
  const [passwordInput, setPasswordInput] = useState("");
  const [validationFailed, setValidationFailed] = useState(false);
  const onPasswordInputChange: React.ComponentProps<typeof TextField>["onChange"] = e => {
    setValidationFailed(false)
    setPasswordInput(e.target.value)
  }
  const onLoginClick = async () => {
    setValidationFailed(false)
    if (await login(passwordInput)) onPasswordValidated?.()
    else setValidationFailed(true)
  }
  useEffect(() => {
    if (cachedPassword) {
      onPasswordValidated?.()
    }
  }, [cachedPassword])

  return (
    <FluffyBackground
      minHeight={300}
      height={"100%"}
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Paper>
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="center"
          alignContent="center"
          m={1}
        >
          <SecretInput
            autoFocus
            variant="outlined"
            label={`PIN${validationFailed ? " incorrect" : ""}`}
            size="small"
            value={passwordInput}
            onChange={onPasswordInputChange} required
            error={validationFailed}
          />
          <Button size="small" onClick={onLoginClick} sx={{ ml: 1 }}>Unlock</Button>
        </Box>
      </Paper >
    </FluffyBackground>
  )
}

export const PasswordGate = ({ children, show = true }) => {
  const { cachedPassword } = useLoginSession();
  if (show && !cachedPassword) return <PasswordValidator />
  return children
}
