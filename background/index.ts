import { Storage } from "@plasmohq/storage"
import { DEFAULT_SESSION_TIMEOUT_MINUTES, STORAGE_KEY } from "~common/utils/constants";

chrome.runtime.onInstalled.addListener(function (object) {
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    openSetupPage()
  }
});

export const openSetupPage = () => {
  const setupPage = "/tabs/setup.html";
  chrome.tabs.create({ url: setupPage }, function (tab) {
    console.log("Opened new setup page");
  });
}

export const passwordCache = (() => {
  let _password: string | null = null
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const storage = new Storage();

  setInterval(() => {
    console.log("keep alive")
  }, 60000)

  const setPassword = async (password: string | null) => {
    _password = password;
    if (timeout) clearTimeout(timeout)
    console.log("password: ", password)
    const sessionTimeoutMinutes = Number(
      await storage.get(STORAGE_KEY.sessionTimeoutMinutes)
    ) || DEFAULT_SESSION_TIMEOUT_MINUTES
    timeout = setTimeout(() => {
      setPassword(null)
    }, sessionTimeoutMinutes * 60000)
  }

  return {
    isPasswordSet: () => _password !== null,
    setPassword,
    getPassword: () => _password
  }
})()
