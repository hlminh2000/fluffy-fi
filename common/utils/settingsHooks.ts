import { useStorage } from "@plasmohq/storage/hook"
import { COLOR_THEME, STORAGE_KEY } from "./constants"

export const useColorThemeSetting = () => {
  const [colorTheme, setColorTheme] = useStorage<COLOR_THEME>(STORAGE_KEY.colorTheme)
  const colorThemeFallback = colorTheme || COLOR_THEME.system
  return {
    options: COLOR_THEME,
    colorTheme: colorThemeFallback,
    setColorTheme
  }
}
