import { AppBar, Box, Container, Fab, Grid, IconButton, List, ListItemButton, ListItemText, SwipeableDrawer, Toolbar } from "@mui/material"
import { FluffyThemeProvider } from "~common/utils/theme"
import { sendToBackground } from "@plasmohq/messaging";
import { useAsync } from "react-async-hook";
import { transactionDb, balanceDb } from "~common/PouchDbs";
import React, { useEffect, useState } from "react";
import SyncIcon from '@mui/icons-material/Sync';
import moment from "moment";
import _ from 'lodash';
import { DATE_FORMAT } from "~common/utils/constants";
import MenuIcon from '@mui/icons-material/Menu';
import { PasswordGate } from "~common/components/PasswordGate";
import { useTransactionCategoryTree } from "~common/utils/getTransactionCategoryTree";
import { AccountSelector } from "./components/AccountSelector";
import { CategorySunburstCard } from "./components/CategorySunburstCard";
import { TrendCard } from "./components/TrendCard";
import { TransactionsCard } from "./components/TransactionsCard";

export default () => {

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
      return result.rows.map(({ doc }) => doc as NonNullable<typeof doc>)
    },
    []
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
    [serializedDateRange.startDate, serializedDateRange.endDate, selectedAccounts, JSON.stringify(categoryFilter)]
  );
  

  const spendings = (transactions
    ?.filter(t => !["Transfer"].some(category => t.category.includes(category)))?.filter(t => t.amount > 0)
    || [] as NonNullable<typeof transactions>
  )

  const [drawerOpen, setDrawerOpen] = useState(false)

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
        <Grid container spacing={2} p={2}>
          <Grid item xs={12}>
            <AccountSelector accounts={accounts} selectedAccounts={selectedAccounts} setSelectedAccounts={setSelectedAccounts} />
          </Grid>
          <Grid item xs={12} md={6} lg={4} >
            <CategorySunburstCard categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} spendings={spendings} />
          </Grid>
          <Grid item xs={12} md={6} lg={4} >
            <TrendCard dateRange={dateRange} setDateRange={setDateRange} spendings={spendings} />
          </Grid>
          <Grid item xs={12} md={6} lg={4} >
            <TrendCard dateRange={dateRange} setDateRange={setDateRange} spendings={spendings} />
          </Grid>
          <Grid item xs={12} md={12} lg={6} >
            <TransactionsCard loading={loading} transactions={transactions} setCategoryFilter={setCategoryFilter} />
          </Grid>
        </Grid>
        <Box position={"fixed"} bottom={30} right={30}>
          <Fab color="primary" onClick={onSyncClick} disabled={syncing}>
            <SyncIcon />
          </Fab>
        </Box>
      </PasswordGate>
    </FluffyThemeProvider>
  )
}
