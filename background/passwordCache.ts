import { Storage } from "@plasmohq/storage";
import { DEFAULT_SESSION_TIMEOUT_MINUTES, STORAGE_KEY } from "~common/utils/constants";
import { createHeartbeat } from "./heartBeat";

export const passwordCache = (() => {
  let _password: string | null = null
  let _longTermCache: string | null = null
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const storage = new Storage();
  const heartBeat = createHeartbeat("screenlock");

  const setPassword = async (password: string | null) => {
    _password = password;
    _longTermCache = password
    if (timeout) clearTimeout(timeout)
    await heartBeat.startHeartbeat()
    const sessionTimeoutMinutes = Number(
      await storage.get(STORAGE_KEY.sessionTimeoutMinutes)
    ) || DEFAULT_SESSION_TIMEOUT_MINUTES
    const timeoutMiliseconds = sessionTimeoutMinutes * 60000
    timeout = setTimeout(async () => {
      await storage.set(STORAGE_KEY.lastLogOutTime, Date.now())
      await heartBeat.stopHeartbeat()
      setPassword(null)
    }, timeoutMiliseconds)
  }

  return {
    isPasswordSet: () => _password !== null,
    setPassword,
    getPassword: () => _password,
    getLongTermCache: () => _longTermCache,
  }
})()