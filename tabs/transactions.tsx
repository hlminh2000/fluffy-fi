// import "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
import { Avatar, Box, Card, CardContent, CardHeader, Container, Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, Skeleton, useTheme } from "@mui/material"
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
import _ from "lodash";

export default () => {

  const theme = useTheme()

  const [dateRange, setDateRange] = useState({
    startDate: moment().startOf("week"),
    endDate: moment().endOf("day"),
    label: "This Week"
  })
  const DATE_FORMAT = "YYYY-MM-DD"

  const serializedDateRange = {
    startDate: dateRange.startDate.format(DATE_FORMAT),
    endDate: dateRange.endDate.format(DATE_FORMAT)
  }

  const { result, execute, loading } = useAsync(
    async () => {
      const index = await transactionDb.createIndex({
        index: { fields: ["date"] }
      })
      console.log("index: ", index)
      return transactionDb.find({
        selector: {
          $and: [
            { date: { $gte: serializedDateRange.startDate }},
            { date: { $lte: serializedDateRange.endDate }},
          ]
        },
        sort: [ { date: "desc" } ]
      }).then(result => result.docs)
    },
    [serializedDateRange.startDate, serializedDateRange.endDate]
  );
  const [syncing, setSyncing] = useState(false);

  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);

  const onSyncClick = async () => {
    setSyncing(true)
    await sendToBackground({ name: "syncTransactions" })
    await execute();
    setSyncing(false)
  }

  const transactionDates = _(result || [])
    .map((doc) => doc.date)
    .uniq()
    .map((dateString) => moment(dateString))
    .value()

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
              <DateRangePicker {...{ open, toggle, onChange: e => setDateRange({
                startDate: moment(e.startDate),
                endDate: moment(e.endDate),
                label: e.label
              }) }} wrapperClassName="date-picker" />
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
                          ?.filter((doc) => moment(doc.date).format(DATE_FORMAT) === date.format(DATE_FORMAT))
                          .map((doc, i) => (
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
