import PouchDb from 'pouchdb'
import PouchDbFind from 'pouchdb-find'
import type { PlaidAccount, PlaidTransaction, PlaidTransactionCategory } from './plaidTypes'

PouchDb.plugin(PouchDbFind)
export const transactionDb = new PouchDb<PlaidTransaction>("plaid_transactions")
export const balanceDb = new PouchDb<PlaidAccount>("plaid_accounts")
export const cursorDb = new PouchDb<{ itemId: string, cursor: string }>("plaid_transactions_sync_cursors")
export const categoryDb = new PouchDb<PlaidTransactionCategory>("plaid_transaction_categories")
