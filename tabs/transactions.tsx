// import "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
import { Avatar, Box, ButtonBase, Card, CardContent, CardHeader, Container, Divider, GlobalStyles, Grid, IconButton, List, ListItem, ListItemIcon, ListItemText, Skeleton, Tab, Tabs, useTheme } from "@mui/material"
import { FluffyThemeProvider } from "~common/utils/theme"
import { sendToBackground } from "@plasmohq/messaging";
import { LoginGate } from "~common/components/LoginGate";
import { useAsync } from "react-async-hook";
import { transactionDb, balanceDb } from "~common/PouchDbs";
import React, { useEffect, useState } from "react";
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';
import { DateRangePicker } from "mui-daterange-picker";
import moment from "moment";
import _ from "lodash";
import { CheckCircle, CircleOutlined } from "@mui/icons-material";
import { AccountTypeIcon } from "~common/components/AccountTypeIcon";
import type { PlaidAccount, PlaidTransaction } from "~common/plaidTypes";
import { ResponsiveSunburst } from '@nivo/sunburst'

type SunburstNode = {
  id: string,
  value?: number,
  children?: SunburstNode[]
}
export const computeCategorySunburstData = (
  transactions: Partial<PlaidTransaction>[],
): SunburstNode => {
  const node: SunburstNode = {
    id: "root",
    value: 0,
    children: [],
  }
  const process = (parent: SunburstNode, categoryChain: string[], amount: number) => {
    const currentCategory = categoryChain[0]
    if (!currentCategory) return parent
    let currentNode = parent.children.find(node => node.id === currentCategory)
    if (!currentNode) {
      currentNode = { id: currentCategory, value: 0, children: [] }
      parent.children.push(currentNode)
    }
    currentNode.value += amount
    const subCategoryChain = categoryChain.slice(1, categoryChain.length)
    process(currentNode, subCategoryChain, amount)
  }
  transactions.forEach(transaction => {
    node.value += transaction.amount
    process(node, transaction.category, transaction.amount)
  })
  const cleanup = (node: SunburstNode) => {
    if(node.children.length) {
      delete node.value
      node.children.forEach(cleanup)
    } else {
      delete node.children
    }
  }
  cleanup(node)
  return node
}

const AccountsList = ({ accounts, selectedAccounts, onAccountClicked }: {
  accounts: PlaidAccount[],
  selectedAccounts: { [accountId: string]: boolean },
  onAccountClicked: (account: typeof accounts[0]) => any
}) => {
  return (
    <Grid container spacing={2}>
      {accounts?.map(account => (
        <Grid item xs={6} md={2} key={account.account_id}>
          <ButtonBase sx={{ width: "100%", height: "100%" }} onClick={() => onAccountClicked(account)}>
            <Card sx={{ width: "100%", height: "100%" }} variant="outlined">
              <CardHeader
                title={`$${account.balances.current.toFixed(2)}`}
                subheader={
                  <Box display="flex" alignItems="center" justifyContent="center">
                    <AccountTypeIcon type={account.type} />{' '}{account.name}
                  </Box>
                }
                action={
                  selectedAccounts?.[account.account_id] ? <CheckCircle color={"success"} /> : <CircleOutlined color="disabled" />
                }
              />
            </Card>
          </ButtonBase>
        </Grid>
      ))}
    </Grid>
  )
}

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
  const [selectedAccounts, setSelectedAccounts] = useState<{ [accountId: string]: boolean }>()
  useEffect(() => {
    if (!selectedAccounts && accounts) setSelectedAccounts(accounts.reduce((acc, a) => ({ ...acc, [a._id]: true }), {}))
  }, [accounts])

  const { result: transactions, execute: syncTransactions, loading } = useAsync(
    async () => {
      if (!selectedAccounts) return
      await transactionDb.createIndex({
        index: { fields: ["date", "account_id"] }
      })
      const accountIdsToFilter = Object.keys(selectedAccounts).filter(accountId => selectedAccounts[accountId])
      return transactionDb.find({
        selector: {
          $and: [
            { date: { $gte: serializedDateRange.startDate } },
            { date: { $lte: serializedDateRange.endDate } },
            { account_id: { $in: accountIdsToFilter } }
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

  const [selectedTab, setSelectedTab] = useState<0 | 1>(0)
 
  const categorySunburstData = computeCategorySunburstData(transactions?.filter(t => t.amount > 0) || [])

  return (
    <FluffyThemeProvider>
      <LoginGate>
        <Box py={2}>
          <Container>
            {selectedTab === 0 && (
              <AccountsList accounts={accounts} selectedAccounts={selectedAccounts} onAccountClicked={account => setSelectedAccounts({
                ...(selectedAccounts || {}),
                [account.account_id]: !(selectedAccounts?.[account.account_id])
              })} />
            )}
            {selectedTab === 1 && (
              <Box height={500}>
                <ResponsiveSunburst
                  data={categorySunburstData}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  cornerRadius={6}
                  borderColor={{ theme: 'background' }}
                  colors={{ scheme: 'nivo' }}
                  childColor={{
                    from: 'color',
                    modifiers: [ ['brighter', 0.2] ]
                  }}
                  arcLabel={d => `${d.id} ($${d.value.toLocaleString()})`}
                  enableArcLabels={true}
                  arcLabelsSkipAngle={10}
                  // arcLabelsTextColor={{
                  //   from: 'color',
                  //   modifiers: [
                  //     [
                  //       'darker',
                  //       1.4
                  //     ]
                  //   ]
                  // }}
                />
              </Box>
            )}
          </Container>
        </Box>
        <Tabs value={selectedTab} onChange={(e, tabIndex) => setSelectedTab(tabIndex)} centered>
          <Tab label="Accounts" />
          <Tab label="Spend Categories" />
        </Tabs>
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
