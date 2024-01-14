import type { PlasmoMessaging } from "@plasmohq/messaging"
import { passwordCache } from "~background/passwordCache"


const handler: PlasmoMessaging.MessageHandler = async (
  req: { body: { password: string } }, 
  res
) => {
  passwordCache.setPassword(req.body.password)
  res.send({ message: "success" })
}

export default handler