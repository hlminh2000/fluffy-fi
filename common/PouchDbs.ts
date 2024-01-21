import PouchDb from 'pouchdb'
import type { PlaidTransaction } from './plaidTypes'

export const transactionDb = new PouchDb<PlaidTransaction>("plaid_transactions")
export const cursorDb = new PouchDb<{ itemId: string, cursor: string }>("plaid_transactions_sync_cursors")
