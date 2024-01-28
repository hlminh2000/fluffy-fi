// import "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
import { Avatar, Box, Button, Card, CardContent, CardHeader, Chip, Container, Divider, Fab, FormControl, GlobalStyles, Grid, IconButton, InputLabel, List, ListItem, ListItemIcon, ListItemText, MenuItem, Modal, OutlinedInput, Paper, Select, Skeleton, useTheme } from "@mui/material"
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
import { CumulativeSpendingChart } from "./components/CumulativeSpendingChart";
import { CategorySunburst } from "./components/CategorySunBurst";
import { PlaidAccount } from "~common/plaidTypes";
import { ChevronRight } from "@mui/icons-material";


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

  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const { result: transactions, execute: syncTransactions, loading } = useAsync(
    async () => {
      if (!selectedAccounts) return
      await transactionDb.createIndex({
        index: { fields: ["date", "account_id", "category"] }
      })
      const selector = {
        $and: [
          { date: { $gte: serializedDateRange.startDate } },
          { date: { $lte: serializedDateRange.endDate } },
          { account_id: { $in: selectedAccounts } },
          ...categoryFilter.map(category => ({ category: { $elemMatch: { $eq: category } } }))
        ]
      }
      console.log("selector: ", selector)
      return transactionDb.find({
        selector,
        sort: [{ date: "desc" }]
      }).then(result => result.docs)
    },
    [serializedDateRange.startDate, serializedDateRange.endDate, selectedAccounts, categoryFilter]
  );
  const transactionDates = _(transactions || [])
    .map((doc) => doc.date)
    .uniq()
    .map((dateString) => moment(dateString))
    .value()

  const spendings = (transactions
    ?.filter(t => !["Transfer"].some(category => t.category.includes(category)))
    || [] as typeof transactions
  )

  const accountColor = (account: PlaidAccount) => ({
    depository: "success" as "success",
    credit: "warning" as "warning",
    loan: "warning" as "warning",
    investment: "success" as "success",
  }[account?.type] || "default" as "default")

  const transactionByDates = _.groupBy(transactions, t => moment(t.date).format(DATE_FORMAT))

  return (
    <FluffyThemeProvider>
      <LoginGate>
        <Box pt={4}>
          <Box position={"fixed"} bottom={50} right={50}>
            <Fab color="primary" onClick={onSyncClick} disabled={syncing}>
              <SyncIcon />
            </Fab>
          </Box>
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
                        color={accountColor(accountIndex[accountId])}
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
                        <AccountTypeIcon type={account.type} color={accountColor(account)} />
                      </ListItemIcon>
                      <ListItemText>
                        {account.name}
                      </ListItemText>
                    </ListItem>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2} pt={2}>
              <Grid item xs={12} md={8}>
                <Card variant="outlined" sx={{ width: "100%", minHeight: "100%" }}>
                  <CardHeader title="Cumulative Spend"
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
                  ></CardHeader>
                  <Modal open={open} >
                    <Box height="100vh" width="100vw" display="flex" justifyContent="center" alignItems="center">
                      <Paper sx={{ width: "690px", overflow: "hidden" }}>
                        <GlobalStyles styles={{
                          ".date-picker .MuiPaper-root": { boxShadow: "none" }
                        }} />
                        <DateRangePicker
                          open
                          onChange={e => setDateRange({
                            startDate: moment(e.startDate),
                            endDate: moment(e.endDate),
                            label: e.label
                          })}
                          toggle={toggle}
                          wrapperClassName="date-picker" />
                      </Paper>
                    </Box>
                  </Modal>
                  <CardContent sx={{ height: "400px" }}>
                    <CumulativeSpendingChart transactions={spendings || []} fromDate={dateRange.startDate} toDate={dateRange.endDate} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ width: "100%", minHeight: "100%" }}>
                  <CardHeader title="Categories" subheader={
                    <Box display={"flex"} flexDirection={"row"} alignItems={"center"} flexWrap={"wrap"}>
                      {!!categoryFilter.length && <Button sx={{ mt: 1 }} size="small" onClick={() => setCategoryFilter([])}>Clear</Button>}
                      {!!categoryFilter.length
                        ? categoryFilter.map((c, i) => (
                          <React.Fragment key={`${c}-${i}`}>
                            {i !== 0 && <ChevronRight sx={{mt: 1}} />}
                            <Chip label={c} size="small" sx={{mt: 1}} />
                          </React.Fragment>
                        ))
                        : "All"}
                    </Box>
                  } />
                  <CardContent sx={{ height: "400px" }}>
                    <CategorySunburst transactions={spendings} onClick={({ path }) =>
                      setCategoryFilter(_.reverse(path.filter(p => p !== "root") as string[]))
                    } />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>
        {/* <Divider /> */}
        <Container>
          <Card sx={{ overflow: "hidden", my: 2 }} variant="outlined">
            <CardHeader title="Transactions" />
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
                        (transactionByDates[date.format(DATE_FORMAT)] || [] as typeof transactions)
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
