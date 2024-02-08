import type { PlasmoMessaging } from "@plasmohq/messaging"
import { passwordCache } from "~background/passwordCache"


const handler: PlasmoMessaging.MessageHandler<{ password: string }, {message: string}> = async (
  req, 
  res
) => {
  if (!req.body) return res.send({ message: "no body provided" })
  await passwordCache.setPassword(req.body.password)
  return res.send({ message: "success" })
}

export default handler