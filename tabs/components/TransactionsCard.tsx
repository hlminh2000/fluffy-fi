import { Autocomplete, Avatar, Box, Button, ButtonBase, Card, CardActions, CardContent, CardHeader, Chip, Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, Modal, Skeleton, TextField, useTheme, } from "@mui/material"
import CategoryIcon from '@mui/icons-material/Category'; 
import { useAsync } from "react-async-hook";
import { balanceDb } from "~common/PouchDbs";
import React, { Fragment, useEffect, useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import _, { groupBy } from 'lodash';
import { DATE_FORMAT } from "~common/utils/constants";
import { PlaidTransaction } from "~common/plaidTypes";
import { Abc, CalendarMonth, ChevronRight, Shop } from "@mui/icons-material";
import { dollarDisplay } from "~common/utils/displays";
import moment from "moment";


const TransactionModal = (props: { transaction: PlaidTransaction | null, onClose: () => any, onSave: (t: PlaidTransaction) => any }) => {
  const { transaction, onClose } = props;
  const [saveEnabled, setSaveEnabled] = useState(true);
  const [temporaryData, setTemporaryData] = useState(transaction)
  useEffect(() => setTemporaryData(transaction), [transaction])

  const { result: account } = useAsync(async () => balanceDb.get(transaction?.account_id || ""), [transaction])

  const changed = !_.isEqual(transaction, temporaryData)

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
                <ListItem secondaryAction={
                  <TextField
                    type="date"
                    size="small"
                    label={"Merchant"}
                    value={temporaryData?.date}
                    onChange={e => temporaryData && setTemporaryData({ ...temporaryData, date: e.target.value })}
                  />
                }>
                  <ListItemIcon><CalendarMonth color="primary" /></ListItemIcon>
                  <ListItemText>Date</ListItemText>
                </ListItem>
                <ListItem secondaryAction={
                  <TextField
                    size="small"
                    label={"Name"}
                    value={temporaryData?.name}
                    onChange={e => temporaryData && setTemporaryData({ ...temporaryData, name: e.target.value })}
                  />
                }>
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
                <ListItem>
                  <ListItemIcon><CategoryIcon color="primary" /></ListItemIcon>
                  <ListItemText>Category</ListItemText>
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

export const TransactionsCard = (props: {
  loading: boolean,
  transactions?: PlaidTransaction[],
  setCategoryFilter: (filter: string[]) => any
}) => {
  const { loading, transactions = [], setCategoryFilter } = props
  const [editingTransaction, setEditingTransaction] = useState<PlaidTransaction | null>(null)

  const transactionDates = _(transactions || [])
    .map((doc) => doc.date)
    .uniq()
    .map((dateString) => moment(dateString))
    .value()
  const transactionByDates = groupBy(transactions, t => moment(t.date).format(DATE_FORMAT))
  const theme = useTheme()

  return (
    <Card variant="outlined" sx={{height: "100%", display: "flex", flexDirection: "column"}}>
      <CardHeader title="Transactions" />
      <TransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} onSave={console.log} />
      <Divider />
      <CardContent sx={{flex: 1}}>
        <List sx={{ minHeight: 400, maxHeight: 700, overflowY: "scroll", position: "relative", py: 0 }}>
          {loading
            ? <Skeleton variant="rectangular" width={"100%"} height={300} />
            : transactionDates?.map((date, i) => (
              <React.Fragment key={i}>
                <Divider />
                <ListItem sx={{ position: "sticky", top: 0, bgcolor: theme.palette.background.paper, zIndex: 1 }}>
                  <ListItemText>
                    {date.format(DATE_FORMAT)}
                  </ListItemText>
                </ListItem>
                <Divider />
                {
                  (transactionByDates[date.format(DATE_FORMAT)] || [] as typeof transactions)
                    .map((doc, i) => (
                      <React.Fragment key={doc.transaction_id}>
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
                                <Fragment key={c}>
                                  {i > 0 && <ChevronRight />}
                                  <Chip label={c} size="small" component={ButtonBase} onClick={() => {
                                    const categoryFilter = doc.category.slice(0, i + 1)
                                    setCategoryFilter(categoryFilter)
                                  }} />
                                </Fragment>
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
  )
}