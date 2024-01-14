import { useState } from "react";
import { useStorageVault } from "~common/utils/useStorageVault";
import * as yup from 'yup'
import { SecretInput } from "./SecretInput";
import { Box, Button, Link } from "@mui/material";
import { STORAGE_KEY } from "~common/utils/constants";

export const usePlaidConnection = () => {
  const [plaidConnection, setPlaidConnection] = useStorageVault<{
    basePath: "sandbox" | "development" | "production",
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': string,
        'PLAID-SECRET': string,
        'Plaid-Version': '2020-09-14',
        "Content-Type": "application/json"
      },
    },
  }>(STORAGE_KEY.plaidConnection);
  return {
    plaidConnection,
    setPlaidConnection
  }
}

export const PlaidConnection = ({ onComplete }: { onComplete: () => any }) => {
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientSecretInput, setClientSecretInput] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setPlaidConnection } = usePlaidConnection();

  const onConnectClick = async () => {
    setIsLoading(true)
    try {
      const { clientId = "", clientSecret = "" } = await yup.object({
        clientId: yup.string().required().min(5),
        clientSecret: yup.string().required().min(5),
      }).required().validate({
        clientId: clientIdInput,
        clientSecret: clientSecretInput
      })
      await (fetch("https://sandbox.plaid.com/categories/get", {
        method: "POST",
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': clientSecret,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      })).then(res => res.json())
      await setPlaidConnection({
        basePath: "sandbox",
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": clientId,
            "PLAID-SECRET": clientSecret,
            "Plaid-Version": "2020-09-14",
            "Content-Type": "application/json"
          }
        }
      })
      onComplete()
    } catch (err) {
      console.error("err: ", err)
      setIsError(true)
    }
    setIsLoading(false)
  }
  return (
    <>
      <SecretInput
        autoFocus
        size="small"
        label="Client ID"
        value={clientIdInput}
        onChange={e => {
          setIsError(false)
          setClientIdInput(e.target.value)
        }}
        error={isError}
      />
      <SecretInput
        size="small"
        label="Client Secret"
        value={clientSecretInput}
        onChange={e => {
          setIsError(false)
          setClientSecretInput(e.target.value)
        }}
        error={isError}
        sx={{ mt: 1 }}
      />
      <Box mt={1} display={"flex"} justifyContent={"space-between"} flexDirection={"row-reverse"}>
        <Button
          variant="contained"
          onClick={onConnectClick}
          disabled={isLoading || isError || !clientIdInput || !clientSecretInput}
        >
          Connect
        </Button>
        <Link href="https://dashboard.plaid.com/signin/" target="_blank">
          <Button>
            I don't have a Plaid account
          </Button>
        </Link>
      </Box>
    </>
  )
}