// import "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
import { Avatar, Box, Button, Card, CardContent, CardHeader, Collapse, Container, Divider, Grid, IconButton, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Paper, Skeleton, TextField, Typography, useTheme } from "@mui/material"
import { FluffyThemeProvider } from "~common/utils/theme"
import { sendToBackground } from "@plasmohq/messaging";
import { LoginGate } from "~common/components/LoginGate";
import { useAsync } from "react-async-hook";
import { transactionDb } from "~common/PouchDbs";
import React, { useState } from "react";
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';

import { DateRangePicker } from "mui-daterange-picker";
import moment from "moment";
import { uniq } from "lodash";

export default () => {

  const theme = useTheme()

  const [dateRange, setDateRange] = useState({
    startDate: moment().startOf("week"),
    endDate: moment().endOf("day"),
    label: "This Week"
  })

  const { result, execute, loading } = useAsync(() => transactionDb.allDocs({ include_docs: true }).then(result => result.rows), []);
  const [syncing, setSyncing] = useState(false);

  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);

  const onSyncClick = async () => {
    setSyncing(true)
    await sendToBackground({ name: "syncTransactions" })
    await execute();
    setSyncing(false)
  }

  const transactionDates = uniq((result || []).map(({ doc }) => doc.date)).map((dateString) => moment(dateString));

  const DATE_FORMAT = "MM/DD/YYYY"

  return (
    <FluffyThemeProvider>
      <LoginGate>
        <Container>
          <Card sx={{ overflow: "hidden", my: 2 }} variant="outlined">
            <CardHeader
              title="Transactions"
              subheader={
                <Box>
                  <Box display={"flex"} alignItems={"center"}>
                    {dateRange.label || `${dateRange.startDate.format(DATE_FORMAT)} ~ ${dateRange.endDate.format(DATE_FORMAT)}`}
                    <IconButton onClick={toggle} size="small">
                      <EditIcon />
                    </IconButton>
                  </Box>
                </Box>
              }
              action={
                <IconButton onClick={onSyncClick} disabled={syncing}><SyncIcon /></IconButton>
              }
            />
            <Divider />
            <Box>
              <DateRangePicker {...{ open, toggle, onChange: console.log }} wrapperClassName="date-picker" />
            </Box>
            <CardContent>
              <List>
                {loading
                  ? <Skeleton variant="rectangular" width={"100%"} height={300} />
                  : transactionDates?.map((date, i) => (
                    <React.Fragment key={i}>
                      <Divider />
                      <ListItem>
                        <ListItemText>
                          {date.format(DATE_FORMAT)}
                        </ListItemText>
                      </ListItem>
                      <Divider />
                      {
                        result
                          ?.filter(({ doc }) => moment(doc.date).format(DATE_FORMAT) === date.format(DATE_FORMAT))
                          .map(({ doc }, i) => (
                            <React.Fragment key={doc._id}>
                              {i !== 0 && <Divider variant="inset" />}
                              <ListItem secondaryAction={
                                <ListItemText sx={{ color: doc.amount < 0 ? theme.palette.success.main : "inherit" }}>
                                  ${(- doc.amount).toFixed(2)}
                                </ListItemText>
                              }>
                                <ListItemIcon>
                                  <Avatar src={doc.logo_url}>{doc.name[0]}</Avatar>
                                </ListItemIcon>
                                <ListItemText primary={doc.name} secondary={doc.category.join(" > ")} />
                              </ListItem>
                            </React.Fragment>
                          ))
                      }
                    </React.Fragment>
                  ))
                }
              </List>
            </CardContent>
          </Card>
        </Container>
      </LoginGate>
    </FluffyThemeProvider>
  )
}
