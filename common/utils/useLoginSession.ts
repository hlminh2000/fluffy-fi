import { useEffect, useState } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { usePasswordHash } from "./usePasswordHash"
import { useStorage } from "@plasmohq/storage/hook"
import { STORAGE_KEY } from "./constants"
import { Storage } from "@plasmohq/storage"

const useLastLoginTime = () => {
  const [lastLoginTime, setLastLoginTime] = useStorage<number>({
    key: STORAGE_KEY.lastLoginTime,
    instance: new Storage()
  })
  const recordLogin = () => setLastLoginTime(Date.now())
  return {
    lastLoginTime,
    recordLogin,
  }
}

export const useLoginSession = () => {
  const { lastLoginTime, recordLogin } = useLastLoginTime()
  const [ cachedPassword, setCachedPassword ] = useState<string>(null)
  const { isPasswordValid, isPasswordSet } = usePasswordHash();
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const getCachedPassword = async () => {
      setLoading(true)
      const { password } = await sendToBackground({ name: "getCachedPassword" })
      setCachedPassword(password)
      setLoading(false)
    }
    getCachedPassword()
  }, [lastLoginTime])

  const login = async (password: string) => {
    if (await isPasswordValid(password)) {
      await sendToBackground({
        name: "cachePassword",
        body: { password }
      })
      recordLogin()
      return true
    }
    return false
  }

  return {
    cachedPassword,
    loading,
    lastLoginTime,
    isPasswordSet,
    login
  }
}
