import { useEffect, useState } from "react";
import { useLoginSession } from "./useLoginSession";
import { sendToBackground } from "@plasmohq/messaging"
import { useStorage } from "@plasmohq/storage/hook";
import { Storage } from "@plasmohq/storage";

export const useStorageVault = <T>(storageKey: string) => {
  const { lastLoginTime, cachedPassword } = useLoginSession();
  const [value, setValue] = useState<T | null>(null)
  const [cipher] = useStorage({
    key: storageKey,
    instance: new Storage()
  })
  const [unlocked, setUnlocked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const sync = async () => {
      setLoading(true)
      const result = await sendToBackground({
        name: "getStorageVaultValue",
        body: { storageKey }
      }) as { unlocked: boolean, success: boolean, value: T }
      setUnlocked(result.unlocked)
      setValue(result.value)
      setLoading(false)
    }
    sync()
  }, [lastLoginTime, cachedPassword, cipher])

  const remove = () => sendToBackground({
    name: "removeStorageVaultValue",
    body: { storageKey }
  })

  const saveValue = async (value: T) => {
    const { success, unlocked } = await sendToBackground({
      name: "setStorageVaultValue",
      body: { storageKey, value }
    }) as { unlocked: boolean, success: boolean, value: T }
    if (success) {
      setValue(value)
    }
    setUnlocked(unlocked)
  }

  const extensions = { remove, unlocked, loading }

  return [value, saveValue, extensions] as [
    typeof value, typeof saveValue, typeof extensions
  ]
}
