import { CssBaseline, createTheme } from "@mui/material";
import { ThemeProvider } from '@mui/material/styles';
import { useColorThemeSetting } from "./settingsHooks";


export const FluffyThemeProvider = ({ children }) => {
  const lightTheme = createTheme({
    palette: {
      mode: "light",
      primary: {
        dark: "#101743",
        light: "#101743",
        main: "#101743",
      }
    }
  })
  const darkTheme = createTheme({
    palette: {
      mode: "dark",
      primary: {
        dark: "#5267ed",
        light: "#5267ed",
        main: "#5267ed",
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
