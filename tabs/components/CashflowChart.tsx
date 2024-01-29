import { ResponsiveBar } from "@nivo/bar";
import sumBy from "lodash/sumBy";
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
    const inflow = - sumBy(transactionsOnDate.filter(t => t.amount < 0), "amount")
    const outflow = - sumBy(transactionsOnDate.filter(t => t.amount > 0), "amount")
    return { date: date.format(DATE_FORMAT), inflow, outflow }
  })

  return (
    <ResponsiveBar <typeof data[0]>
      data={data}
      keys={["inflow", "outflow"]}
      indexBy="date"
      margin={{ top: 10, right: 130, bottom: 50, left: 50 }}
      padding={0.3}
      valueScale={{ type: 'linear' }}
      indexScale={{ type: 'band', round: true }}
      colors={{ scheme: 'nivo' }}
      defs={[
        {
          id: 'dots',
          type: 'patternDots',
          background: 'inherit',
          color: '#38bcb2',
          size: 4,
          padding: 1,
          stagger: true
        },
        {
          id: 'lines',
          type: 'patternLines',
          background: 'inherit',
          color: '#eed312',
          rotation: -45,
          lineWidth: 6,
          spacing: 10
        }
      ]}
      fill={[
        {
          match: {
            id: 'fries'
          },
          id: 'dots'
        },
        {
          match: {
            id: 'sandwich'
          },
          id: 'lines'
        }
      ]}
      borderColor={{
        from: 'color',
        modifiers: [
          [
            'darker',
            1.6
          ]
        ]
      }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 40,
        // legend: 'date',
        legendPosition: 'middle',
        legendOffset: 32,
        truncateTickAt: 0
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        // legend: 'food',
        legendPosition: 'middle',
        legendOffset: -40,
        truncateTickAt: 0
      }}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{
        from: 'color',
        modifiers: [
          [
            'darker',
            1.6
          ]
        ]
      }}
      legends={[
        {
          dataFrom: 'keys',
          anchor: 'bottom-right',
          direction: 'column',
          justify: false,
          translateX: 120,
          translateY: 0,
          itemsSpacing: 2,
          itemWidth: 100,
          itemHeight: 20,
          itemDirection: 'left-to-right',
          itemOpacity: 0.85,
          symbolSize: 20,
          effects: [
            {
              on: 'hover',
              style: {
                itemOpacity: 1
              }
            }
          ]
        }
      ]}
      role="application"
      ariaLabel="Nivo bar chart demo"
      barAriaLabel={e => e.id + ": " + e.formattedValue + " on date: " + e.indexValue}
    />
  )
}