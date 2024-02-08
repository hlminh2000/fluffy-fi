import type { PlasmoMessaging } from "@plasmohq/messaging"
import { storageVault } from "~background/storageVault"

const handler: PlasmoMessaging.MessageHandler<{ storageKey: string }> = async (
  req,
  res
) => {
  if (!storageVault.isUnlocked()) return res.send({ unlocked: false, success: false })
  if (!req.body) return res.send({ unlocked: false, success: false })
 
  console.log("removeStorageVaultValue")
  const { storageKey } = req.body
  try {
    await storageVault.remove(storageKey)
    return res.send({ unlocked: true, success: true })
  } catch(err) {
    console.error(err)
    return res.send({ unlocked: true, success: false })
  }
}

export default handler