import { AppBar, Box, Card, CardContent, CardHeader, Collapse, Container, Divider, Fab, Grid, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, SwipeableDrawer, TextField, Toolbar, useTheme } from "@mui/material"
import { FluffyThemeProvider } from "~common/utils/theme"
import { sendToBackground } from "@plasmohq/messaging";
import { useAsync } from "react-async-hook";
import { transactionDb, balanceDb } from "~common/PouchDbs";
import React, { Fragment, useEffect, useState } from "react";
import SyncIcon from '@mui/icons-material/Sync';
import moment, { Moment } from "moment";
import _, { groupBy, sumBy } from 'lodash';
import { DATE_FORMAT } from "~common/utils/constants";
import MenuIcon from '@mui/icons-material/Menu';
import { PasswordGate } from "~common/components/PasswordGate";
import { useTransactionCategoryTree } from "~common/utils/getTransactionCategoryTree";
import { AccountSelector } from "./components/AccountSelector";
import { CategorySunburstCard } from "./components/CategorySunburstCard";
import { CumulativeSpendCard } from "./components/CumulativeSpendCard";
import { TransactionsCard } from "./components/TransactionsCard";
import { CashflowCard } from "./components/CashflowCard";
import { ResponsiveCalendar } from '@nivo/calendar'
import { PlaidTransaction } from "~common/plaidTypes";
import { Category, Dashboard, Expand, ExpandLess, ExpandMore } from "@mui/icons-material";
import ColorHash from "color-hash";

type DateRange = {
  startDate: Moment,
  endDate: Moment,
  label: string
}

const CalendarCard = (props: { spendings: PlaidTransaction[], dateRange: DateRange }) => {
  const { dateRange, spendings } = props;
  const theme = useTheme();
  return (
    <Card sx={{ minHeight: "100%" }} variant="outlined">
      <CardHeader title={"Calendar"}></CardHeader>
      <CardContent sx={{ height: "300px" }}>
        <ResponsiveCalendar
          data={
            _(spendings)
              .groupBy("date")
              .entries()
              .map(([day, spendings]) => ({ day, value: sumBy(spendings, "amount") }))
              .value()
          }
          from={dateRange.startDate.format(DATE_FORMAT)}
          to={dateRange.endDate.format(DATE_FORMAT)}
          emptyColor={theme.palette.grey[500]}
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          yearSpacing={40}
          monthBorderColor={theme.palette.grey[500]}
          dayBorderWidth={2}
          // daySpacing={8}
          monthSpacing={8}
          // dayBorderColor="#ffffff"
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'row',
              translateY: 36,
              itemCount: 4,
              itemWidth: 42,
              itemHeight: 36,
              itemsSpacing: 14,
              itemDirection: 'right-to-left'
            }
          ]}
        />
      </CardContent>
    </Card>
  )
}

const CategoryTree = (props: { node: ReturnType<typeof useTransactionCategoryTree>["categoryTree"] }) => {
  const { node } = props;
  const [openChildren, setOpenChildren] = useState<Record<string, boolean>>({});

  const toggleChildOpen = (childName: string) => () => setOpenChildren({
    ...openChildren,
    [childName]: !openChildren[childName]
  })
  

  return (
    <List sx={{ width: "100%" }}>
      {node?.children.map(child => (
        <Fragment key={child.name}>
          <ListItemButton
            onClick={toggleChildOpen(child.name)}
          >
            {/* <ListItemIcon>
              <TextField value={new ColorHash().hex(child.name)} onClick={e => e.stopPropagation()} type="color" size="small" fullWidth sx={{ width: "47px" }} />
            </ListItemIcon> */}
            <ListItemText>{child.name}</ListItemText>
            {
              !!child.children.length && (
                !openChildren[child.name] ? <ExpandMore /> : <ExpandLess />
              )
            }
          </ListItemButton>
          <Divider variant="inset"/>
          {!!child.children.length && (
            <Collapse in={!!openChildren[child.name]}>
              <ListItem sx={{ ml: 2 }}>
                <CategoryTree node={child} />
              </ListItem>
            </Collapse>
          )}
        </Fragment>
      ))}
    </List>
  )
}


export default () => {

  const [dateRange, setDateRange] = useState<DateRange>({
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

  const [currentView, setCurrentView] = useState<"dashboard" | "category">("category")

  const { categoryTree } = useTransactionCategoryTree();

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
                <ListItemButton onClick={() => setCurrentView("dashboard")}>
                  <ListItemIcon><Dashboard /></ListItemIcon>
                  <ListItemText primary={"Dashboard"} />
                </ListItemButton>
                <ListItemButton onClick={() => setCurrentView("category")}>
                  <ListItemIcon><Category /></ListItemIcon>
                  <ListItemText primary={"Transaction Categories"} />
                </ListItemButton>
              </List>
            </Box>
          </SwipeableDrawer>
        </AppBar>
        {
          currentView === "dashboard" && (
            <>
              <Grid container spacing={2} p={2}>
                <Grid item xs={12}>
                  <AccountSelector accounts={accounts} selectedAccounts={selectedAccounts} setSelectedAccounts={setSelectedAccounts} />
                </Grid>
                <Grid item xs={12} md={6} lg={4} >
                  <CategorySunburstCard categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} spendings={spendings} />
                </Grid>
                <Grid item xs={12} md={6} lg={4} >
                  <CumulativeSpendCard dateRange={dateRange} setDateRange={setDateRange} spendings={spendings} />
                </Grid>
                <Grid item xs={12} md={6} lg={4} >
                  <CashflowCard dateRange={dateRange} setDateRange={setDateRange} spendings={spendings} />
                </Grid>
                <Grid item container spacing={2} xs={12} md={6} >
                  <Grid item xs={12}>
                    <CalendarCard dateRange={dateRange} spendings={spendings} />
                  </Grid>
                  <Grid item xs={12}>
                    <CalendarCard dateRange={dateRange} spendings={spendings} />
                  </Grid>
                </Grid>
                <Grid item xs={12} md={12} lg={6} >
                  <TransactionsCard loading={loading} transactions={transactions} setCategoryFilter={setCategoryFilter} />
                </Grid>
              </Grid>
              <Box position={"fixed"} bottom={30} right={30} zIndex={2}>
                <Fab color="primary" onClick={onSyncClick} disabled={syncing}>
                  <SyncIcon />
                </Fab>
              </Box>
            </>
          )
        }
        {
          currentView === "category" && (
            <Container sx={{mt: 4}}>
              <Card variant="outlined">
                <CardHeader title="Transaction Categories"/>
                <Divider/>
                <CardContent>
                  <CategoryTree node={categoryTree} />
                </CardContent>
              </Card>
            </Container>
          )
        }
      </PasswordGate>
    </FluffyThemeProvider>
  )
}
