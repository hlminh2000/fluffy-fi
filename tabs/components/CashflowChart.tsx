import { ResponsiveBar } from "@nivo/bar";
import _ from "lodash";
import moment, { Moment } from "moment";
import { PlaidTransaction } from "~common/plaidTypes";
import { DATE_FORMAT } from "~common/utils/constants";

const datesInRange = (fromDate: Moment, toDate: Moment) => {
  let output = [] as Moment[];
  let currentDate = moment(fromDate);
  while (currentDate.isBefore(toDate)) {
    output.push(currentDate);
    currentDate = moment(currentDate.add(1, "day"));
  }
  return output
}

export const CashflowChart = ({
  transactions, fromDate, toDate
}: { transactions: PlaidTransaction[], fromDate: Moment, toDate: Moment }) => {
  const dates = datesInRange(fromDate, toDate);
  const data = dates.map(date => {
    const transactionsOnDate = transactions.filter(t => moment(t.date).isSame(date, "day"))
    const inflow = -_.sumBy(transactionsOnDate.filter(t => t.amount < 0), "amount")
    const outflow = -_.sumBy(transactionsOnDate.filter(t => t.amount > 0), "amount")
    return { id: date.format(DATE_FORMAT), inflow, outflow }
  })

  return (
    <ResponsiveBar <typeof data[0]> 
      data={data}
      keys={["inflow", "outflow"]}
      colors={{ scheme: 'nivo' }}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 30,
      }}
    />
  )
}