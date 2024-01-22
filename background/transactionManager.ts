import { STORAGE_KEY } from "~common/utils/constants";
import { passwordCache } from "./passwordCache";
import { storageVault } from "./storageVault";
import type { PlaidConnectionStorage, PlaidItemAccount, PlaidItemStorage, PlaidTransaction, PlaidTransactionSync } from "~common/plaidTypes";
import Queue from 'promise-queue';
import PouchDb from 'pouchdb'
import { balanceDb, cursorDb, transactionDb } from "~common/PouchDbs";


export const transactionManager = (() => {
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

    await Promise.all(plaidItems.map(async item => {
      const syncTransactions = async () => {
        console.log("syncTransactions")
        let has_more = true
        while (has_more) {
          const cursorQuery = (await cursorDb.get(item.access.item_id).catch(err => ({ cursor: null, _rev: undefined })))
          const { cursor } = cursorQuery
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
          const [existingDocs] = await Promise.all([
            Promise.all(
              modified.map(t => transactionDb.get(t.transaction_id))
            ),
            transactionDb.bulkDocs(added.map(t => ({ _id: t.transaction_id, ...t })))
          ])
          await transactionDb.bulkDocs(
            modified.map((t, i) => ({
              _id: t.transaction_id,
              _rev: existingDocs[i]._rev,
              ...t,
            }))
          )
          await Promise.all(removed.map(async t => {
            const doc = await transactionDb.get(t.transaction_id);
            await transactionDb.remove(doc)
          }))
          await cursorDb.put({
            _id: item.access.item_id,
            _rev: cursorQuery._rev,
            cursor: next_cursor,
            itemId: item.access.item_id
          })
          has_more = delta.has_more;
          newTransactionCount += added.length;
          modifiedTransactionCount += modified.length;
          removedTransactionCount += removed.length;
        }
      }
      const syncBalance = async () => {
        console.log("syncBalance")
        const balances = (await fetch("https://sandbox.plaid.com/accounts/balance/get", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: plaidConnection?.baseOptions?.headers?.["PLAID-CLIENT-ID"],
            secret: plaidConnection?.baseOptions?.headers?.["PLAID-SECRET"],
            access_token: item.access.access_token,
          })
        }).then(res => res.json())) as PlaidItemAccount
        await Promise.all(balances.accounts.map(async (account) => {
          const existing = await balanceDb.get(account.account_id).catch(() => ({ _id: account.account_id, _rev: undefined }))
          console.log("existing: ", existing)
          await balanceDb.put({
            _id: existing._id,
            _rev: existing._rev,
            ...account
          })
        }))
      }

      await Promise.all([
        syncTransactions(),
        syncBalance()
      ])
    }))
    return { newTransactionCount, modifiedTransactionCount, removedTransactionCount }
  })

  return {
    sync,
  }
})()