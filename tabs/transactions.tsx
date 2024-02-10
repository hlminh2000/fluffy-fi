// import "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
import { AppBar, Autocomplete, Avatar, Box, Button, ButtonBase, Card, CardActions, CardContent, CardHeader, Chip, Container, Divider, Fab, GlobalStyles, Grid, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Modal,  Paper, Skeleton, SwipeableDrawer, Tab, Tabs, TextField, Toolbar, useTheme } from "@mui/material"
import { FluffyThemeProvider } from "~common/utils/theme"
import { sendToBackground } from "@plasmohq/messaging";
import { useAsync } from "react-async-hook";
import { transactionDb, balanceDb } from "~common/PouchDbs";
import React, { useEffect, useMemo, useState } from "react";
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';
import { DateRangePicker } from "mui-daterange-picker";
import moment from "moment";
import _ from 'lodash';
import groupBy from "lodash/groupBy";
import { DATE_FORMAT } from "~common/utils/constants";
import { CumulativeSpendingChart } from "~tabs/components/CumulativeSpendingChart";
import { CashflowChart } from "~tabs/components/CashflowChart";
import { PlaidTransaction } from "~common/plaidTypes";
import { Abc, CalendarMonth, ChevronRight, Shop } from "@mui/icons-material";
import MenuIcon from '@mui/icons-material/Menu';
import { PasswordGate } from "~common/components/PasswordGate";
import { dollarDisplay } from "~common/utils/displays";
import { useTransactionCategoryTree } from "~common/utils/getTransactionCategoryTree";
import { AccountSelector } from "./components/AccountSelector";
import { CategorySunburstCard } from "./components/CategorySunburstCard";


const TransactionModal = (props: { transaction: PlaidTransaction | null, onClose: () => any, onSave: (t: PlaidTransaction) => any }) => {
  const { transaction, onClose } = props;
  const [saveEnabled, setSaveEnabled] = useState(true);
  const [temporaryData, setTemporaryData] = useState(transaction)
  useEffect(() => setTemporaryData(transaction), [transaction])

  const { result: account } = useAsync(async () => balanceDb.get(transaction?.account_id || ""), [transaction])

  const changed = _.isEqual(transaction, temporaryData)

  const onSave = async () => {
    if (temporaryData) {
      setSaveEnabled(false);
      await props.onSave(temporaryData);
      setSaveEnabled(true);
    }
  }

  return (
    <Modal open={!!transaction} onClose={onClose}>
      <Box height="100vh" width="100vw" display="flex" justifyContent="center" alignItems="center" onClick={onClose}>
        <Box onClick={e => e.stopPropagation()}>
          <Card sx={{ minWidth: 500 }}>
            <CardHeader title={dollarDisplay(transaction?.amount || 0)} subheader={account?.name} />
            <Divider />
            <CardContent>
              <List>
                <ListItem secondaryAction={<TextField type="date" size="small" label={"Merchant"} value={temporaryData?.date} />}>
                  <ListItemIcon><CalendarMonth color="primary" /></ListItemIcon>
                  <ListItemText>Date</ListItemText>
                </ListItem>
                <ListItem secondaryAction={<TextField size="small" label={"Name"} value={temporaryData?.name} />}>
                  <ListItemIcon><Abc color="primary" /></ListItemIcon>
                  <ListItemText>Name</ListItemText>
                </ListItem>
                <ListItem secondaryAction={
                  <Autocomplete
                    size="small"
                    value={temporaryData?.merchant_name}
                    renderInput={props => <TextField {...props} label={"Merchant"} />}
                    options={[]}
                  />
                }>
                  <ListItemIcon><Shop color="primary" /></ListItemIcon>
                  <ListItemText>Merchant</ListItemText>
                </ListItem>
              </List>
            </CardContent>
            <Divider />
            <CardActions sx={{ display: "flex", flexDirection: "row-reverse" }}>
              <Button variant="contained" onClick={onSave} disabled={!saveEnabled || !changed}>Save</Button>
            </CardActions>
          </Card>
        </Box>
      </Box>
    </Modal>
  )
}

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
      return result.rows.map(({ doc }) => doc as NonNullable<typeof doc>)
    },
    []
  )
  const accountIndex = useMemo(
    () => accounts?.reduce(
      (acc, a) => ({ ...acc, [a.account_id]: a }),
      {} as { [id: string]: typeof accounts[number] }
    ) || [] as NonNullable<typeof accounts>,
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
    [serializedDateRange.startDate, serializedDateRange.endDate, selectedAccounts, JSON.stringify(categoryFilter)]
  );
  const transactionDates = _(transactions || [])
    .map((doc) => doc.date)
    .uniq()
    .map((dateString) => moment(dateString))
    .value()

  const spendings = (transactions
    ?.filter(t => !["Transfer"].some(category => t.category.includes(category)))?.filter(t => t.amount > 0)
    || [] as NonNullable<typeof transactions>
  )


  const transactionByDates = groupBy(transactions, t => moment(t.date).format(DATE_FORMAT))

  const [selectedTrendTab, setSelectedTrendTab] = useState<0 | 1>(0)

  const [drawerOpen, setDrawerOpen] = useState(false)

  const [editingTransaction, setEditingTransaction] = useState<PlaidTransaction | null>(null)

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
            <AccountSelector accounts={accounts} selectedAccounts={selectedAccounts} setSelectedAccounts={setSelectedAccounts} />
          </Container>
        </Box>
        <Container>
          <Grid container spacing={2} pt={2}>
            <Grid item xs={12} md={4}>
              <CategorySunburstCard categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} spendings={spendings} />
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
                          // @ts-ignore
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
              <TransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} onSave={console.log} />
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
                                  {dollarDisplay(-doc.amount)}
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
                                        <Chip label={c} size="small" component={ButtonBase} onClick={() => {
                                          const categoryFilter = doc.category.slice(0, i + 1)
                                          setCategoryFilter(categoryFilter)
                                        }} />
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
