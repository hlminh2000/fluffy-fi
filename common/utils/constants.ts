export enum STORAGE_KEY {
  passwordHash = "passwordHash",
  lastLoginTime = "lastLoginTime",
  sessionTimeoutMinutes = 'sessionTimeoutMinutes',
  colorTheme = "colorTheme",
  currentSetupStep = "currentSetupStep",
  plaidConnection = "plaidConnection",
  plaidItems = "plaidItems",
  transactionNextSyncCursor = "transactionNextSyncCursor",
}

export enum COLOR_THEME {
  light = "light",
  dark = "dark",
  system = "system",
}
export const DEFAULT_SESSION_TIMEOUT_MINUTES = 5
