import type { PlasmoMessaging } from "@plasmohq/messaging"
import { passwordCache } from "~background/passwordCache"

const handler: PlasmoMessaging.MessageHandler = async (
  req: { body },
  res
) => {  
  res.send({
    password: passwordCache.getPassword(),
    isPasswordSet: passwordCache.getPassword()
  })
}

export default handler