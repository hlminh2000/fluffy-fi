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


export type PlaidTransaction = {
  "account_id": string,
  "account_owner": null,
  "amount": number,
  "iso_currency_code": string,
  "unofficial_currency_code": null,
  "category": string[],
  "category_id": string,
  "check_number": null,
  "counterparties": {
    "name": string,
    "type": string,
    "logo_url": string,
    "website": string,
    "entity_id": string,
    "confidence_level": string,
  },
  "date": string,
  "datetime": string,
  "authorized_date": string,
  "authorized_datetime": string,
  "location": {
    "address": string,
    "city": string,
    "region": string,
    "postal_code": string,
    "country": string,
    "lat": 32.959068,
    "lon": -117.037666,
    "store_number": string,
  },
  "name": string,
  "merchant_name": string,
  "merchant_entity_id": string,
  "logo_url": string,
  "website": string,
  "payment_meta": {
    "by_order_of": null,
    "payee": null,
    "payer": null,
    "payment_method": null,
    "payment_processor": null,
    "ppd_id": null,
    "reason": null,
    "reference_number": null
  },
  "payment_channel": string,
  "pending": false,
  "pending_transaction_id": string,
  "personal_finance_category": {
    "primary": string,
    "detailed": string,
    "confidence_level": string,
  },
  "personal_finance_category_icon_url": string,
  "transaction_id": string,
  "transaction_code": null,
  "transaction_type": string,
}

export type PlaidTransactionSync = {
  added: PlaidTransaction[],
  modified: PlaidTransaction[],
  removed: { transaction_id: string }[],
  next_cursor: string,
  has_more: boolean,
  request_id: string
}

export type PlaidItemStorage = {
  access: PlaidItemAccessToken,
  metadata: PlaidItemMetadata
}[]

export type PlaidConnectionStorage = {
  basePath: "sandbox" | "development" | "production",
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': string,
      'PLAID-SECRET': string,
      'Plaid-Version': '2020-09-14',
      "Content-Type": "application/json"
    },
  },
}

export type PlaidTransactionCategory = { category_id: string, hierarchy: string[] }