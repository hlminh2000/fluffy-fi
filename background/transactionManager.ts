import { STORAGE_KEY } from "~common/utils/constants";
import { passwordCache } from "./passwordCache";
import { storageVault } from "./storageVault";
import { Storage } from "@plasmohq/storage";
import type { PlaidConnectionStorage, PlaidItemStorage, PlaidTransaction, PlaidTransactionSync } from "~common/plaidTypes";
import Queue from 'promise-queue';
import PouchDb from 'pouchdb'


export const transactionManager = (() => {

  const transactionDb = new PouchDb<PlaidTransaction>("plaid_transactions")
  const cursorDb = new PouchDb<{itemId: string, cursor: string}>("plaid_transactions_sync_cursors")

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
    let newTransactionCount = 0;
    let modifiedTransactionCount = 0;
    let removedTransactionCount = 0;
    for (const item of plaidItems) {
      console.log("item: ", item)
      let has_more = true
      while (has_more) {
        const cursor = (await cursorDb.get(item.access.item_id).catch(err => ({ cursor: null }))).cursor
        const delta = (await fetch("https://sandbox.plaid.com/transactions/sync", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: plaidConnection?.baseOptions?.headers?.["PLAID-CLIENT-ID"],
            secret: plaidConnection?.baseOptions?.headers?.["PLAID-SECRET"],
            access_token: item.access.access_token,
            cursor
          })
        }).then(res => res.json())) as PlaidTransactionSync
        console.log("delta: ", delta)

        const { added, modified, next_cursor, removed } = delta;

        newTransactionCount += added.length;
        modifiedTransactionCount += modified.length;
        removedTransactionCount += removed.length;

        await transactionDb.bulkDocs(added.map(t => ({ _id: t.transaction_id,  ...t })));
        for (const t of added) {
          try {
            await transactionDb.put({ _id: t.transaction_id, ...t })
          } catch (err) {
            console.log("failed for ", t, err)
          }
        }

        await Promise.all(removed.map(async t => {
          const doc = await transactionDb.get(t.transaction_id);
          await transactionDb.remove(doc)
        }))

        await cursorDb.put({ _id: item.access.item_id, cursor: next_cursor, itemId: item.access.item_id })
        has_more = delta.has_more;
      }

    }
    return { newTransactionCount, modifiedTransactionCount, removedTransactionCount }
  })



  return { sync }
})()
