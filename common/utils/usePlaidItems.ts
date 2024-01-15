import type { PlaidItemAccessToken, PlaidItemMetadata } from "~common/plaidTypes";
import { STORAGE_KEY } from "./constants";
import { useStorageVault } from "./useStorageVault";
import { usePlaidConnection } from "~common/components/PlaidConnection";

export const usePlaidItems = () => {
  const { plaidConnection } = usePlaidConnection()
  const [plaidItems, setPlaidItems] = useStorageVault<{
    access: PlaidItemAccessToken,
    metadata: PlaidItemMetadata
  }[]>(STORAGE_KEY.plaidItems);

  const plaidItemsFallback = plaidItems || []
  const addPlaidItem = async (publicToken: string, metadata:PlaidItemMetadata) => {
    const accessToken = (await fetch("https://sandbox.plaid.com/item/public_token/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: plaidConnection?.baseOptions?.headers?.["PLAID-CLIENT-ID"],
        secret: plaidConnection?.baseOptions?.headers?.["PLAID-SECRET"],
        public_token: publicToken
      })
    }).then(res => res.json())) as PlaidItemAccessToken
    await setPlaidItems([...plaidItemsFallback, { access: accessToken, metadata }])
  }
  return {
    plaidItems: plaidItemsFallback,
    addPlaidItem,
  }
}
