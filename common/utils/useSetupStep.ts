import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { STORAGE_KEY } from "~common/utils/constants"

export enum SetupSteps {
  EXTENSION_PINNING = "EXTENSION_PINNING",
  PIN_SETUP = "PIN_SETUP",
  COMPLETED = "COMPLETED",
}

export const useSetupStep = () => {
  const [currentStep, setCurrentStep] = useStorage({
    key: STORAGE_KEY.currentSetupStep,
    instance: new Storage()
  })
  return {
    currentStep: currentStep || SetupSteps.PIN_SETUP,
    setCurrentStep,
    isComplete: currentStep === SetupSteps.COMPLETED
  }
}
