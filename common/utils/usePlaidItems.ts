import { STORAGE_KEY } from "./constants";
import { useStorageVault } from "./useStorageVault";

export type PlaidItem = {
  "access_token": string,
  "item_id": string,
  "request_id": string
}
export const usePlaidItems = () => {
  const [plaidItems, setPlaidItems] = useStorageVault<PlaidItem[]>(STORAGE_KEY.plaidItems);
  const plaidItemsFallback = plaidItems || []
  return {
    plaidItems: plaidItemsFallback,
    addPlaidItem: (item: PlaidItem) => setPlaidItems([...plaidItemsFallback, item]),
  }
}
