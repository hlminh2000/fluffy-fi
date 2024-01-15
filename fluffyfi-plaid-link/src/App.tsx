import React from 'react';
import { Box, Button } from '@mui/material'
import { usePlaidLink } from 'react-plaid-link';

function App() {
  const searchParam = new URLSearchParams(window.location.search)
  const plaidLinkToken = searchParam.get("plaidLinkToken")
  const buttonTitle = searchParam.get("buttonTitle") || "Connect"

  const { open, ready } = usePlaidLink({
    token: plaidLinkToken,
    onExit: () => {
      window.parent.postMessage({ type: "PLAID_EXIT" }, "*")
    },
    onSuccess: (public_token, metadata) => {
      window.parent.postMessage({ type: "PLAID_CONNECT_SUCCESS", payload: { public_token, metadata } }, "*")
    },
  });

  const onConnectClick = () => {
    window.parent.postMessage({ type: "PLAID_OPEN" }, "*")
    open()
  }

  return (
    <Box display={"flex"} justifyContent={"center"}>
      <Button fullWidth size="small" variant="contained" disabled={!ready} onClick={onConnectClick}>{buttonTitle}</Button>
    </Box>
  );
}

export default App;
