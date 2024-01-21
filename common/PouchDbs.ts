import PouchDb from 'pouchdb'
import PouchDbFind from 'pouchdb-find'
import type { PlaidTransaction } from './plaidTypes'

PouchDb.plugin(PouchDbFind)
export const transactionDb = new PouchDb<PlaidTransaction>("plaid_transactions")
export const cursorDb = new PouchDb<{ itemId: string, cursor: string }>("plaid_transactions_sync_cursors")
