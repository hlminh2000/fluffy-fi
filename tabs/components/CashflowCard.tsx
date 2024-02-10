import { Box, Card, CardContent, CardHeader, GlobalStyles, IconButton, Modal, Paper } from "@mui/material"
import React, { useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import { DateRangePicker } from "mui-daterange-picker";
import moment, { Moment } from "moment";
import _ from 'lodash';
import { DATE_FORMAT } from "~common/utils/constants";
import { CashflowChart } from "~tabs/components/CashflowChart";
import { PlaidTransaction } from "~common/plaidTypes";

type DateRange = {
  startDate: Moment,
  endDate: Moment,
  label: string
}

export const CashflowCard = (props: {
  dateRange: DateRange,
  setDateRange: (range: typeof props.dateRange) => any
  spendings: PlaidTransaction[]
}) => {
  const { dateRange, setDateRange, spendings } = props;

  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);

  return (
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
        <CashflowChart transactions={spendings || []} fromDate={dateRange.startDate} toDate={dateRange.endDate} />
      </CardContent>
    </Card>
  )
}