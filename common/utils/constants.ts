export enum STORAGE_KEY {
  passwordHash = "passwordHash",
  lastLoginTime = "lastLoginTime",
  lastLogOutTime = "lastLogOutTime",
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
export const DATE_FORMAT = "YYYY-MM-DD"
