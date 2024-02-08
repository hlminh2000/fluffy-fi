import type { PlasmoMessaging } from "@plasmohq/messaging"
import { storageVault } from "~background/storageVault"

const handler: PlasmoMessaging.MessageHandler<{ storageKey: string, value: any }> = async ( req, res ) => {
  if (!storageVault.isUnlocked()) return res.send({ unlocked: false, success: false })
  if (!req.body) return res.send({ unlocked: false, success: false })
  
  const { storageKey, value } = req.body
  try {
    await storageVault.set(storageKey, value)
    return res.send({ unlocked: true, success: true })
  } catch(err) {
    console.error(err)
    return res.send({ unlocked: true, success: false })
  }
}

export default handler