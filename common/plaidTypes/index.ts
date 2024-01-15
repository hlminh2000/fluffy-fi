export type PlaidItemAccessToken = {
  "access_token": string,
  "item_id": string,
  "request_id": string
}
export type PlaidItemMetadata = {
  institution: {
    name: string,
    institution_id: string
  },
  accounts: {
    id: string,
    name: string,
    mask: string,
    type: string,
    subtype: string,
    verification_status?: 'string'
  }[],
  link_session_id: string
}
export type PlaidAccount = {
  "account_id": string,
  "balances": {
    "available": number,
    "current": number,
    "iso_currency_code": string,
    "limit": number | null,
    "unofficial_currency_code": number | null
  },
  "mask": string,
  "name": string,
  "official_name": string,
  "persistent_account_id": string,
  "subtype": string,
  "type": string
}
export type PlaidItem = {
  "available_products": Array<"balance" | "identity" | "payment_initiation" | "transactions">,
  "billed_products": Array<"assets" | "auth">,
  "consent_expiration_time": string | null,
  "error": string | null,
  "institution_id": string,
  "item_id": string,
  "update_type": "background",
  "webhook": string
}
export type PlaidItemAccount = {
  "accounts": PlaidAccount[],
  "item": PlaidItem,
  "request_id": string
}