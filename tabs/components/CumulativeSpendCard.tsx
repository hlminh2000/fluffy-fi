import { Box, Card, CardContent, CardHeader, GlobalStyles, IconButton, Modal, Paper, Tab, Tabs } from "@mui/material"
import React, { useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import { DateRangePicker } from "mui-daterange-picker";
import moment, { Moment } from "moment";
import _ from 'lodash';
import { DATE_FORMAT } from "~common/utils/constants";
import { CashflowChart } from "~tabs/components/CashflowChart";
import { PlaidTransaction } from "~common/plaidTypes";
import { ResponsiveLine } from "@nivo/line";
import { groupBy, uniq } from "lodash";

const datesInRange = (fromDate: Moment, toDate: Moment) => {
  let output = [] as Moment[];
  let currentDate = moment(fromDate);
  while (currentDate.isBefore(toDate)) {
    output.push(currentDate);
    currentDate = moment(currentDate.add(1, "day"));
  }
  return output
}

export const CumulativeSpendingChart = ({
  transactions, fromDate, toDate
}: { transactions: PlaidTransaction[], fromDate: Moment, toDate: Moment }) => {
  const dates = datesInRange(fromDate, toDate);
  const spendings = transactions.filter(t => t.amount > 0)
  const spendingByCategory = groupBy(spendings, transaction => transaction.category[0] || "Other")
  const series = Object.entries(spendingByCategory).map(([category, spendings]) => {
    const data = dates.reduce((acc, date, i) => {
      const transactionsOnDate = spendings.filter(t => moment(t.date).isSame(date, "day"))
      const lastSum = acc[i - 1]?.sum || 0
      const sumOfDay = transactionsOnDate.reduce((sum, t) => sum + t.amount, 0);
      return [
        ...acc,
        { id: date.format(DATE_FORMAT), date, sum: lastSum + sumOfDay }
      ]
    }, [] as { date: Moment, sum: number }[])
    return {
      id: category,
      data: data.map(({ date, sum }) => ({ x: date.format(DATE_FORMAT), y: sum }))
    }
  })
  return (
    <ResponsiveLine
      data={series}
      margin={{ top: 5, right: 130, bottom: 50, left: 50 }}
      xScale={{ type: 'point' }}
      yScale={{
        type: 'linear',
        min: 'auto',
        max: 'auto',
        stacked: true,
        reverse: false
      }}
      yFormat=" >-.2f"
      curve="monotoneX"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 40,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        // legend: 'Dollars spent',
        legendOffset: -40,
        legendPosition: 'middle',
      }}
      pointSize={5}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      pointLabelYOffset={-12}
      enableArea={true}
      areaBaselineValue={0}
      areaOpacity={0.8}
      useMesh={true}
      legends={[
        {
          anchor: 'bottom-right',
          direction: 'column',
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: 'left-to-right',
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: 'circle',
          symbolBorderColor: 'rgba(0, 0, 0, .5)',
          effects: [
            {
              on: 'hover',
              style: {
                itemBackground: 'rgba(0, 0, 0, .03)',
                itemOpacity: 1
              }
            }
          ]
        }
      ]}
    />
  )
}

type DateRange = {
  startDate: Moment,
  endDate: Moment,
  label: string
}

export const CumulativeSpendCard = (props: {
  dateRange: DateRange,
  setDateRange: (range: typeof props.dateRange) => any
  spendings: PlaidTransaction[]
}) => {
  const { dateRange, setDateRange, spendings } = props;
  const [selectedTrendTab, setSelectedTrendTab] = useState<0 | 1>(0)

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
        <CumulativeSpendingChart transactions={spendings || []} fromDate={dateRange.startDate} toDate={dateRange.endDate} />
      </CardContent>
    </Card>
  )
}