
import type { PlasmoMessaging } from "@plasmohq/messaging"
import { transactionManager } from "~background/transactionManager"

const handler: PlasmoMessaging.MessageHandler = async ( req, res ) => {
  res.send(await transactionManager.sync())
}

export default handler