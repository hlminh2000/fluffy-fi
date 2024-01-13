import { Box, Button, Checkbox, Collapse, Container, Divider, FormControlLabel, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, TextField, Typography } from "@mui/material"
import { FluffyThemeProvider } from "~common/utils/theme"
import { CheckCircle } from "@mui/icons-material";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { PasswordSetterForm } from "~common/components/PasswordSetter"
import { SetupSteps, useSetupStep } from "~common/utils/useSetupStep"
import { FluffyBackground } from "~common/components/FluffyBackground";


export default () => {

  const { currentStep, setCurrentStep } = useSetupStep()

  return (
    <FluffyThemeProvider>
      <Container sx={{ display: "flex", height: "100vh", flexDirection: "column", justifyContent: "center" }}>
        <Paper sx={{ overflow: "hidden" }}>
          <Grid container minHeight={200}>
            <Grid item xs={12} sm={6}>
              <FluffyBackground
                p={4}
                display="flex"
                alignItems="center"
              >
                <Typography variant="h3">Welcome to FluffyFi</Typography>
              </FluffyBackground>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box p={4}>
                <List>
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Add QiSpace PPK Util to Chrome"></ListItemText>
                    </ListItem>
                  </>
                  <Divider />
                  <>
                    <ListItem>
                      <ListItemIcon>
                        {
                          [SetupSteps.QISPACE_CONNECT, SetupSteps.EXTENSION_PINNING, SetupSteps.COMPLETED].includes(currentStep) 
                            ? <CheckCircle color="success" /> 
                            : <RadioButtonUncheckedIcon />
                        }
                      </ListItemIcon>
                      <ListItemText primary="Set up your PIN"></ListItemText>
                    </ListItem>
                    <Collapse unmountOnExit in={currentStep === SetupSteps.PIN_SETUP}>
                      <Box display="flex" flexDirection="column" p={2} pt={0}>
                        <Typography sx={{ mb: 2 }}>A PIN is required to protect your data. Please enter a PIN of choice below.</Typography>
                        <PasswordSetterForm onComplete={() => setCurrentStep(SetupSteps.QISPACE_CONNECT)}/>
                      </Box>
                    </Collapse>
                  </>
                  <Divider />
                  <>
                    <ListItem>
                      <ListItemIcon>
                        {
                          [SetupSteps.COMPLETED].includes(currentStep)
                            ? <CheckCircle color="success" />
                            : <RadioButtonUncheckedIcon />
                        }
                      </ListItemIcon>
                      <ListItemText primary="Keep QiSpace PPK Util in easy reach"></ListItemText>
                    </ListItem>
                    <Collapse unmountOnExit in={currentStep === SetupSteps.EXTENSION_PINNING}>
                      <Box display="flex" flexDirection="column" p={2} pt={0}>
                        <Typography>To make it easier to access your this extension, the extension can be pinned on your browser's toolbar.</Typography>
                        <Button autoFocus sx={{mt: 1}} size="small" variant="contained" onClick={() => setCurrentStep(SetupSteps.COMPLETED)}>Done</Button>
                      </Box>
                    </Collapse>
                  </>
                  <Collapse unmountOnExit in={currentStep === SetupSteps.COMPLETED}>
                    <Box display="flex" flexDirection="column" mt={5}>
                      <Typography>Your QiSpace PPK Util is ready for use. You may now close this setup.</Typography>
                      <Button autoFocus sx={{ mt: 1 }} size="small" variant="contained" onClick={() => window.close()}>Close setup</Button>
                    </Box>
                  </Collapse>
                </List>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </FluffyThemeProvider>
  )
}