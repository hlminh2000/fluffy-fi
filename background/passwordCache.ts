import { Storage } from "@plasmohq/storage";
import { DEFAULT_SESSION_TIMEOUT_MINUTES, STORAGE_KEY } from "~common/utils/constants";

export const passwordCache = (() => {
  let _sessionPassword: string | null = null
  let _longTermCache: string | null = null
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const storage = new Storage();

  setInterval(() => {
    console.log("keep alive")
  }, 60000)

  const setPassword = async (password: string | null) => {
    _longTermCache = password;
    _sessionPassword = password;
    if (timeout) clearTimeout(timeout)
    const sessionTimeoutMinutes = Number(
      await storage.get(STORAGE_KEY.sessionTimeoutMinutes)
    ) || DEFAULT_SESSION_TIMEOUT_MINUTES
    timeout = setTimeout(() => {
      setPassword(null)
    }, sessionTimeoutMinutes * 60000)
  }

  return {
    isPasswordSet: () => _sessionPassword !== null,
    setPassword,
    getPassword: () => _sessionPassword,
    getLongTermCache: () => _longTermCache,
  }
})()
