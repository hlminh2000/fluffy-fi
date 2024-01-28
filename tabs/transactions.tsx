// import "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
import { Avatar, Box, Card, CardContent, CardHeader, Chip, Container, Divider, FormControl, GlobalStyles, Grid, IconButton, InputLabel, List, ListItem, ListItemIcon, ListItemText, MenuItem, OutlinedInput, Select, Skeleton, useTheme } from "@mui/material"
import { FluffyThemeProvider } from "~common/utils/theme"
import { sendToBackground } from "@plasmohq/messaging";
import { LoginGate } from "~common/components/LoginGate";
import { useAsync } from "react-async-hook";
import { transactionDb, balanceDb } from "~common/PouchDbs";
import React, { useEffect, useMemo, useState } from "react";
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';
import { DateRangePicker } from "mui-daterange-picker";
import moment from "moment";
import _ from "lodash";
import { AccountTypeIcon } from "~common/components/AccountTypeIcon";
import { DATE_FORMAT } from "~common/utils/constants";
import { CumulativeSpendingChart } from "./components/cumulativeSpendingChart";
import { CategorySunburst } from "./components/CategorySunBurst";


export default () => {

  const theme = useTheme()

  const [dateRange, setDateRange] = useState({
    startDate: moment().startOf("week"),
    endDate: moment().endOf("day"),
    label: "This Week"
  })

  const serializedDateRange = {
    startDate: dateRange.startDate.format(DATE_FORMAT),
    endDate: dateRange.endDate.format(DATE_FORMAT)
  }
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);

  const onSyncClick = async () => {
    setSyncing(true)
    await sendToBackground({ name: "syncTransactions" })
    await syncTransactions();
    await syncBalances();
    setSyncing(false)
  }

  const { result: accounts, execute: syncBalances } = useAsync(
    async () => {
      const result = await balanceDb.allDocs({ include_docs: true });
      return result.rows.map(({ doc }) => doc)
    },
    []
  )
  const accountIndex = useMemo(
    () => accounts?.reduce((acc, a) => ({ ...acc, [a.account_id]: a }), {} as { [id: string]: typeof accounts[0] }) || [] as typeof accounts,
    [accounts]
  )

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>()
  useEffect(() => {
    if (!selectedAccounts && accounts) setSelectedAccounts(accounts.map(a => a.account_id))
  }, [accounts])

  const { result: transactions, execute: syncTransactions, loading } = useAsync(
    async () => {
      if (!selectedAccounts) return
      await transactionDb.createIndex({
        index: { fields: ["date", "account_id"] }
      })
      return transactionDb.find({
        selector: {
          $and: [
            { date: { $gte: serializedDateRange.startDate } },
            { date: { $lte: serializedDateRange.endDate } },
            { account_id: { $in: selectedAccounts } }
          ]
        },
        sort: [{ date: "desc" }]
      }).then(result => result.docs)
    },
    [serializedDateRange.startDate, serializedDateRange.endDate, selectedAccounts]
  );
  const transactionDates = _(transactions || [])
    .map((doc) => doc.date)
    .uniq()
    .map((dateString) => moment(dateString))
    .value()

  const spendings = transactions?.filter(t => !["Transfer"].some(category => t.category.includes(category))) || [] as typeof transactions

  return (
    <FluffyThemeProvider>
      <LoginGate>
        <Box py={2}>
          <Container>
            <FormControl fullWidth>
              <InputLabel id="accounts">Accounts</InputLabel>
              <Select <string[]>
                fullWidth
                labelId="accounts"
                multiple
                value={selectedAccounts || []}
                onChange={e => setSelectedAccounts(e.target.value as string[])}
                input={<OutlinedInput label="Accounts" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selected.map((accountId) => (
                      <Chip
                        icon={<AccountTypeIcon type={accountIndex[accountId]?.type} />}
                        key={accountId}
                        label={accountIndex[accountId]?.name}
                      />
                    ))}
                  </Box>
                )}
              >
                {accounts?.map((account) => (
                  <MenuItem
                    key={account.account_id}
                    value={account.account_id}
                  >
                    <ListItem secondaryAction={
                      <ListItemText>
                        ${(account.balances.current).toFixed(2)}
                      </ListItemText>
                    }>
                      <ListItemIcon>
                        <AccountTypeIcon type={account.type} />
                      </ListItemIcon>
                      <ListItemText>
                        {account.name}
                      </ListItemText>
                    </ListItem>
                    <Divider />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Container>
          <Grid container>
            <Grid item xs={12} md={8}>
              <Box height={"500px"}>
                <CumulativeSpendingChart transactions={spendings || []} fromDate={dateRange.startDate} toDate={dateRange.endDate} />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box height={"500px"}>
                <CategorySunburst transactions={spendings} />
              </Box>
            </Grid>
          </Grid>
        </Box>
        <Divider />
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
              <GlobalStyles styles={{
                ".date-picker .MuiPaper-root": { boxShadow: "none" }
              }} />
              <DateRangePicker {...{
                open, toggle, onChange: e => setDateRange({
                  startDate: moment(e.startDate),
                  endDate: moment(e.endDate),
                  label: e.label
                })
              }} wrapperClassName="date-picker" />
              {open && <Divider />}
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
                        transactions
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
