

export const openSetupPage = () => {
  const setupPage = "/tabs/setup.html";
  chrome.tabs.create({ url: setupPage }, function (tab) {
    console.log("Opened new setup page");
  });
}