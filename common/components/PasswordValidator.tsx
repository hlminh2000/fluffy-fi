import React, { useEffect, useState } from "react"
import {
  Box,
  Button,
  Paper,
  TextField,
} from "@mui/material"
import { PassswordSetter } from "./PasswordSetter";
import { useLoginSession } from "~common/utils/useLoginSession";
import { SecretInput } from "./SecretInput";
import { FluffyBackground } from "./FluffyBackground";


export const PasswordValidator = ({
  onPasswordValidated
}: {
  onPasswordValidated?: () => void
}) => {

  const { login, isPasswordSet, cachedPassword } = useLoginSession()
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
      height={300}
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Paper>
        {isPasswordSet ? (
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
            <Button size="small" onClick={onLoginClick} sx={{ml: 1}}>Unlock</Button>
          </Box>
        ) : (
          <PassswordSetter />
        )}
      </Paper >
    </FluffyBackground>
  )
}
