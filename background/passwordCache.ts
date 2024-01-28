import { Storage } from "@plasmohq/storage";
import { DEFAULT_SESSION_TIMEOUT_MINUTES, STORAGE_KEY } from "~common/utils/constants";
import { createHeartbeat } from "./heartBeat";

export const passwordCache = (() => {
  let _sessionPassword: string | null = null
  let _longTermCache: string | null = null
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const storage = new Storage();
  const heartbeat = createHeartbeat("sessionCache");

  const setPassword = async (password: string | null) => {
    _longTermCache = password;
    _sessionPassword = password;
    if (timeout) clearTimeout(timeout)
    await heartbeat.startHeartbeat()
    const sessionTimeoutMinutes = Number(
      await storage.get(STORAGE_KEY.sessionTimeoutMinutes)
    ) || DEFAULT_SESSION_TIMEOUT_MINUTES
    timeout = setTimeout(async () => {
      setPassword(null)
      await heartbeat.stopHeartbeat()
    }, sessionTimeoutMinutes * 60000)
  }

  return {
    isPasswordSet: () => _sessionPassword !== null,
    setPassword,
    getPassword: () => _sessionPassword,
    getLongTermCache: () => _longTermCache,
  }
})()
