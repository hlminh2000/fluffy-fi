import { STORAGE_KEY } from "~common/utils/constants";
import { passwordCache } from "./passwordCache";
import { storageVault } from "./storageVault";
import { Storage } from "@plasmohq/storage";
import type { PlaidConnectionStorage, PlaidItemStorage, PlaidTransaction, PlaidTransactionSync } from "~common/plaidTypes";
import Queue from 'promise-queue';

type TransactionStorage = {
  [itemId: string]: PlaidTransaction[]
}

export const transactionManager = (() => {
  const storage = new Storage();
  const syncQueue = new Queue(1);
  const sync = () => syncQueue.add(async () => {
    if (!passwordCache.getLongTermCache()) {
      alert("FluffyFi would like to sync your transactions, please authorize with your PIN");
    }
    const password = passwordCache.getLongTermCache();
    const [plaidItems, plaidConnection] = await Promise.all([
      storageVault.get<PlaidItemStorage>(STORAGE_KEY.plaidItems, password),
      storageVault.get<PlaidConnectionStorage>(STORAGE_KEY.plaidConnection, password)
    ]);
    const currentTransactions = await storage.get<TransactionStorage>(STORAGE_KEY.transactions) || {}
    for (const item of plaidItems) {
      let has_more = true
      while (has_more) {
        const delta = (await fetch("https://sandbox.plaid.com/transactions/sync", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: plaidConnection?.baseOptions?.headers?.["PLAID-CLIENT-ID"],
            secret: plaidConnection?.baseOptions?.headers?.["PLAID-SECRET"],
            access_token: item.access.access_token,
            cursor: undefined
          })
        }).then(res => res.json())) as PlaidTransactionSync
        const { added, modified, next_cursor, removed } = delta;
        has_more = delta.has_more;
        added.forEach(transaction => {
          if (!currentTransactions[item.access.item_id]) currentTransactions[item.access.item_id] = [];
          currentTransactions[item.access.item_id].push(transaction);
        })
      }
      await storage.set(STORAGE_KEY.transactions, currentTransactions)
    }
  })

  return { sync }
})()
