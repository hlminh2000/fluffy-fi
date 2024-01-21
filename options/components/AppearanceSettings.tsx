import React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
} from "@mui/material"
import Brightness4Icon from '@mui/icons-material/Brightness4';
import { COLOR_THEME } from "~common/utils/constants";
import { useColorThemeSetting } from "~common/utils/settingsHooks";

export const AppearanceSettings = () => {
  const { colorTheme, options, setColorTheme } = useColorThemeSetting()
  const onColorThemeChange: React.ComponentProps<typeof Select>['onChange'] =
    (e) => setColorTheme(e.target.value as COLOR_THEME)
  return (
    <Card variant="outlined">
      <CardHeader title="Appearance" />
      <Divider />
      <CardContent>
        <List>
          <ListItem secondaryAction={
            <Select size="small" label="Light or dark mode" value={colorTheme} onChange={onColorThemeChange}>
              <MenuItem value={options.light}>Light</MenuItem>
              <MenuItem value={options.dark}>Dark</MenuItem>
              <MenuItem value={options.system}>Match system settings</MenuItem>
            </Select>
          }>
            <ListItemIcon><Brightness4Icon /></ListItemIcon>
            <ListItemText primary="Theme" secondary="Light or dark mode" />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  )
}