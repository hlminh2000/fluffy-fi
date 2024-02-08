import React, { type ComponentProps } from "react"
import {
  IconButton,
} from "@mui/material"
import CopyIcon from '@mui/icons-material/ContentCopy';

export const useSnackbarState = (timeout = 2000) => {

  const [snackbarMessage, setSnackbarMessage] = React.useState<string | null>(null)
  const [messageType, setSnackbarMessageType] = React.useState<"info" | "success" | "error" | "warning">("info")
  const [timeoutId, setTimeoutId] = React.useState<ReturnType<typeof setTimeout> | null >(null);

  const openSnackbar = (message: string, type: typeof messageType = "info") => {
    if (timeoutId) clearTimeout(timeoutId);
    setSnackbarMessage(message)
    setSnackbarMessageType(type)
    const newTimeoutId = setTimeout(() => {
      setSnackbarMessage(null)
      setSnackbarMessageType("info")
    }, timeout)
    setTimeoutId(newTimeoutId);
  }

  return {
    snackbarOpen: !!snackbarMessage,
    openSnackbar,
    snackbarMessage,
    messageType,
  }
}

export const CopyButton = ({
  value,
  snackbarState,
  ...rest
}: {
  value: string,
  snackbarState: ReturnType<typeof useSnackbarState>
} & ComponentProps<typeof IconButton>) => (
  <IconButton
    size="small"
    onClick={async () => {
      await navigator.clipboard.writeText(value)
      const displaySize = 5;
      const valueBeginning = value.slice(0, displaySize)
      const valueEnding = value.slice(value.length - displaySize - 1, value.length - 1)
      snackbarState.openSnackbar(
        `copied value: ${valueBeginning}...${valueEnding}`
      )
    }}
    {...rest}
  >
    <CopyIcon />
  </IconButton>
)
