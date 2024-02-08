import type { PlasmoMessaging } from "@plasmohq/messaging"
import { storageVault } from "~background/storageVault"

const handler: PlasmoMessaging.MessageHandler<{ storageKey: string }> = async ( req, res ) => {
  if (!req.body) return res.send({ unlocked: false, success: false })
  if (!storageVault.isUnlocked()) return res.send({ unlocked: false, success: false })
  
  const { storageKey } = req.body

  try {
    const value = await storageVault.get(storageKey)
    return res.send({ unlocked: true, success: true, value: value })
  } catch(err) {
    console.error(err)
    return res.send({ unlocked: true, success: false })
  }
}

export default handler