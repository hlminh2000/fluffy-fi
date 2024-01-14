import type { PlasmoMessaging } from "@plasmohq/messaging"
import { openSetupPage } from "~background/utils"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  openSetupPage()
}

export default handler