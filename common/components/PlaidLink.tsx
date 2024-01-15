import { usePlaidConnection } from "~common/components/PlaidConnection";
import { useAsync } from 'react-async-hook';
import { useEffect, useState } from "react";
import { usePlaidItems, } from "~common/utils/usePlaidItems";
import type { PlaidItemMetadata } from "~common/plaidTypes";

export const PlaidLink = ({ onComplete, buttonTitle="Connect" }: { onComplete?: () => any, buttonTitle?: string }) => {
  const { addPlaidItem } = usePlaidItems();
  const [iframeExpanded, setIframeExpanded] = useState(false);
  const { plaidConnection } = usePlaidConnection()
  const { result } = useAsync(async () => (await fetch("https://sandbox.plaid.com/link/token/create", {
    method: "POST",
    headers: {
      ...(plaidConnection?.baseOptions?.headers || {}),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      clientId: plaidConnection?.baseOptions?.headers?.["PLAID-CLIENT-ID"],
      secret: plaidConnection?.baseOptions?.headers?.["PLAID-SECRET"],
      name: "PluffyFi",
      "user": {
        "client_user_id": crypto.randomUUID(),
        "phone_number": "+1 415 5550123"
      },
      "client_name": "Personal Finance App",
      "products": ["transactions"],
      "country_codes": ["US"],
      "language": "en",
      "redirect_uri": "https://local.fluffyfi/"
    })
  })).json(), [plaidConnection?.baseOptions?.headers?.["PLAID-CLIENT-ID"]])

  type IframeMessage = { type: "PLAID_OPEN" }
    | { type: "PLAID_EXIT" }
    | { type: "PLAID_CONNECT_SUCCESS", payload: { public_token: string, metadata: PlaidItemMetadata } }
  useEffect(() => {
    const messageHandler = async (e: MessageEvent<IframeMessage>) => {
      if (e.data.type === "PLAID_OPEN") return setIframeExpanded(true)
      if (e.data.type === "PLAID_EXIT") return setIframeExpanded(false)
      if (e.data.type === "PLAID_CONNECT_SUCCESS") {
        const { payload } = e.data
        await addPlaidItem(payload.public_token, payload.metadata)
        setIframeExpanded(false)
        onComplete?.()
      }
    }
    window.addEventListener("message", messageHandler)
    return () => {
      window.removeEventListener("message", messageHandler)
    }
  }, [plaidConnection?.baseOptions?.headers?.["PLAID-CLIENT-ID"], plaidConnection?.baseOptions?.headers?.["PLAID-SECRET"]])

  if (!result?.link_token) return null
  return (
    <iframe
      src={`http://localhost:3001?plaidLinkToken=${result.link_token}&buttonTitle=${buttonTitle}`}
      style={{ width: "100%", border: "none", height: !iframeExpanded ? 32 : 660, transition: "all 0.5s" }}
    />
  )
}