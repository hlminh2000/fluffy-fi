import { CssBaseline, createTheme } from "@mui/material";
import { ThemeProvider } from '@mui/material/styles';
import { useColorThemeSetting } from "./settingsHooks";


export const FluffyThemeProvider = ({ children }) => {
  const lightTheme = createTheme({
    palette: {
      mode: "light",
      primary: {
        main: "#44D1A7",
        contrastText: "#FFFFFF"
      }
    }
  })
  const darkTheme = createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: "#44D1A7",
        contrastText: "#FFFFFF"
      }
    }
  })
  const { colorTheme, options } = useColorThemeSetting()

  const isSystemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  

  return (
    <ThemeProvider theme={
      colorTheme === options.light ? lightTheme 
      : colorTheme === options.dark ? darkTheme 
      : isSystemDarkMode ? darkTheme
      : lightTheme
    }>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
