import type { PlasmoMessaging } from "@plasmohq/messaging"
import { passwordCache } from "~background"

const handler: PlasmoMessaging.MessageHandler = async (
  req: { body },
  res
) => {
  passwordCache.unset()
  res.send({ password: passwordCache.getPassword() })
}

export default handler