// import "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
import { AppBar, Avatar, Box, Button, Card, CardContent, CardHeader, Chip, Container, Divider, Fab, FormControl, GlobalStyles, Grid, IconButton, Input, InputLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuItem, Modal, OutlinedInput, Paper, Select, Skeleton, SwipeableDrawer, Tab, Tabs, TextField, Toolbar, Typography, useTheme } from "@mui/material"
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
import _ from 'lodash';
import groupBy from "lodash/groupBy";
import reverse from "lodash/reverse";
import { AccountTypeIcon } from "~common/components/AccountTypeIcon";
import { DATE_FORMAT } from "~common/utils/constants";
import { CumulativeSpendingChart } from "~tabs/components/CumulativeSpendingChart";
import { CategorySunburst } from "~tabs/components/CategorySunBurst";
import { CashflowChart } from "~tabs/components/CashflowChart";
import { PlaidAccount } from "~common/plaidTypes";
import { Cancel, ChevronRight } from "@mui/icons-material";
import MenuIcon from '@mui/icons-material/Menu';
import { PasswordGate } from "~common/components/PasswordGate";

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
      return transactionDb.find({
        selector: {
          $and: [
            { date: { $gte: serializedDateRange.startDate } },
            { date: { $lte: serializedDateRange.endDate } },
            { account_id: { $in: selectedAccounts } },
            ...categoryFilter.map(category => ({ category: { $elemMatch: { $eq: category } } }))
          ]
        },
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

  const transactionByDates = groupBy(transactions, t => moment(t.date).format(DATE_FORMAT))

  const [selectedTrendTab, setSelectedTrendTab] = useState<0 | 1>(0)

  const [drawerOpen, setDrawerOpen] = useState(false)

  const [editingTransaction, setEditingTransaction] = useState<typeof transactions[number]>(null)

  return (
    <FluffyThemeProvider>
      <PasswordGate>
        <AppBar position="sticky">
          <Toolbar variant="dense">
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
          <SwipeableDrawer
            anchor={"left"}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onOpen={() => setDrawerOpen(true)}
          >
            <Box
              width="250"
              role="presentation"
              onClick={() => setDrawerOpen(false)}
              onKeyDown={() => setDrawerOpen(false)}
            >
              <List>
                <ListItemButton>
                  <ListItemText primary={"Hello"} />
                </ListItemButton>
                <ListItemButton>
                  <ListItemText primary={"World"} />
                </ListItemButton>
              </List>
            </Box>
          </SwipeableDrawer>
        </AppBar>

        <Box pt={4}>
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
          </Container>
        </Box>
        <Container>
          <Grid container spacing={2} pt={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ width: "100%", minHeight: "100%" }}>
                <CardHeader title="Categories" subheader={
                  <Box display={"flex"} flexDirection={"row"} alignItems={"center"} flexWrap={"wrap"}>
                    {!!categoryFilter.length
                      ? categoryFilter.map((c, i) => (
                        <React.Fragment key={`${c}-${i}`}>
                          {i !== 0 && <ChevronRight sx={{ mt: 1 }} />}
                          <Chip label={c} size="small" sx={{ mt: 1 }} deleteIcon={<Cancel />} onDelete={() => setCategoryFilter(categoryFilter.slice(0, i))} />
                        </React.Fragment>
                      ))
                      : "All"}
                  </Box>
                } />
                <CardContent sx={{ height: "400px" }}>
                  <CategorySunburst transactions={spendings} onClick={({ path }) =>
                    setCategoryFilter(reverse(path.filter(p => p !== "root") as string[]))
                  } />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card variant="outlined" sx={{ width: "100%", minHeight: "100%" }}>
                <CardHeader title="Trends"
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
                />
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
                  <Box height={"330px"}>
                    {selectedTrendTab === 0 && <CumulativeSpendingChart transactions={spendings || []} fromDate={dateRange.startDate} toDate={dateRange.endDate} />}
                    {selectedTrendTab === 1 && <CashflowChart transactions={spendings || []} fromDate={dateRange.startDate} toDate={dateRange.endDate} />}
                  </Box>
                  <Tabs value={selectedTrendTab} onChange={(e, newValue) => setSelectedTrendTab(newValue)} variant="fullWidth">
                    <Tab label={"Cumulative Spend"} />
                    <Tab label={"Cashflow"} />
                  </Tabs>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
        <Container>
          <Card sx={{ overflow: "hidden", my: 2 }} variant="outlined">
            <CardHeader title="Transactions" />
            <CardContent>
              <Modal open={!!editingTransaction} onClose={() => setEditingTransaction(null)}>
                <Box height="100vh" width="100vw" display="flex" justifyContent="center" alignItems="center" onClick={() => setEditingTransaction(null)}>
                  <Box onClick={e => e.stopPropagation()}>
                    <Card >
                      <CardHeader title={editingTransaction?.name} />
                      <Divider />
                      <CardContent>
                        <pre style={{ height: 500, overflowY: "scroll" }}>{JSON.stringify(editingTransaction, null, 2)}</pre>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </Modal>
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
                                  <IconButton size="small" onClick={() => setEditingTransaction(doc)}><EditIcon /></IconButton>
                                </ListItemText>
                              }>
                                <ListItemIcon>
                                  <Avatar src={doc.logo_url}>{doc.name[0]}</Avatar>
                                </ListItemIcon>
                                <ListItemText primary={doc.name} secondary={
                                  <Box display="flex" alignItems="center" flexDirection="row">
                                    {doc.category.map((c, i) => (
                                      <>
                                        {i > 0 && <ChevronRight />}
                                        <Chip label={c} size="small" />
                                      </>
                                    ))}
                                  </Box>
                                } />
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
        <Box position={"fixed"} bottom={30} right={30}>
          <Fab color="primary" onClick={onSyncClick} disabled={syncing}>
            <SyncIcon />
          </Fab>
        </Box>
      </PasswordGate>
    </FluffyThemeProvider>
  )
}
