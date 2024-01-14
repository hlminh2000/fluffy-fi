import { Storage } from "@plasmohq/storage"
import { DEFAULT_SESSION_TIMEOUT_MINUTES, STORAGE_KEY } from "~common/utils/constants";
import { openSetupPage } from "./utils";

chrome.webRequest.onBeforeRequest.addListener(
  (async (requestDetails) => {
    console.log(requestDetails);
    const { url } = requestDetails
    const [, ...queryStrings] = url.split("?")
    const queryString = queryStrings.join("")
    await chrome.tabs.update(requestDetails.tabId, {
      url: `chrome-extension://fibhjajeacjjncgjfnnobnofkfdllhkh/tabs/setup.html?${queryString}`
    })
  }) as any,
  {
    urls: ["https://local.fluffyfi/*"],
  }
);

chrome.runtime.onInstalled.addListener(function (object) {
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    openSetupPage()
  }
});
