import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField } from "@mui/material"
import { useState } from "react"

export const SecretInput: typeof TextField = (props) => {
  const [valueVisible, setValueVisible] = useState(false);
  return (
    <TextField
      type={valueVisible ? "text" : "password"}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => setValueVisible(!valueVisible)}>
              {!valueVisible && <Visibility />}
              {valueVisible && <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        )
      }}
      {...props}
    />
  )
}
