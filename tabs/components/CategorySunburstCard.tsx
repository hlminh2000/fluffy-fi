import { Box, Button, ButtonBase, Card, CardContent, CardHeader, Chip, Paper, Typography, useTheme } from "@mui/material"
import { ResponsiveSunburst } from "@nivo/sunburst"
import React, { ComponentProps, useEffect } from "react"
import { PlaidTransaction } from "~common/plaidTypes"
import { SunburstNode, computeCategorySunburstData } from "./computeCategorySunburstData"
import { dollarDisplay } from "~common/utils/displays"
import { ChevronRight } from "@mui/icons-material"
import { reverse, uniq } from "lodash"
import { colorHash } from "~common/utils/theme"
// import { useFluffyfiWasm } from "~common/utils/useFluffyfiWasm";

type SunburstNodeWithColor = SunburstNode & { color: string, children: SunburstNodeWithColor []}

const sunburstNodeWithColor = (node: SunburstNode): SunburstNodeWithColor => ({
  ...node,
  color: "black",
  children: node.children.map(sunburstNodeWithColor)
})

const CategorySunburst = (props: { 
  transactions: PlaidTransaction[], 
  onClick?: ComponentProps<typeof ResponsiveSunburst>['onClick'] 
  rootPath?: string[]
}) => {
  const { transactions } = props
  const spendings = transactions?.filter(t => t.amount > 0) || ([] as typeof transactions)

  const categorySunburstData = computeCategorySunburstData(spendings, props.rootPath)
  const sum = spendings.reduce((sum, t) => sum + t.amount, 0)

  const theme = useTheme();

  // const fluffWasm = useFluffyfiWasm();
  // useEffect(() => {
  //   if (transactions && fluffWasm.initialized) {
  //     const now = performance.now();
  //     console.log("wasm get_category_sunburst_data: ", fluffWasm.get_category_sunburst_data(spendings))
  //     console.log("rust: ", performance.now() - now);

  //     const jsNow = performance.now();
  //     console.log("js categorySunburstData: ", computeCategorySunburstData(spendings, props.rootPath))
  //     console.log("js: ", performance.now() - jsNow);
  //   }
  // }, [transactions, fluffWasm.initialized])

  return (
    <Box height="100%" width="100%" position="relative">
      <Box
        position={"absolute"}
        top={0}
        bottom={0}
        left={0}
        right={0}
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        sx={{ pointerEvents: "none" }}>
        <Typography variant="h5" color="primary">{dollarDisplay(sum)}</Typography>
      </Box>
      <ResponsiveSunburst <SunburstNode>
        onClick={props.onClick}
        data={sunburstNodeWithColor(categorySunburstData || {id: "root", value: 0, children: [], fullPath: []})}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        cornerRadius={8}
        borderColor={{ theme: 'background' }}
        colors={(node) => colorHash.hex(node.data.fullPath[0])}
        childColor={{
          from: 'color',
          modifiers: [[theme.palette.mode === "light" ? 'brighter' : "darker", 0.3]]
        }}
        arcLabel={d => `${d.id} (${d.percentage.toFixed(0)}%)`}
        arcLabelsTextColor={theme.palette.mode === "dark" ? "white" : theme.palette.grey[900]}
        enableArcLabels={true}
        arcLabelsSkipAngle={10}
        tooltip={(node) => (
          <Paper sx={{px: 1}}><Typography variant="caption">{`${node.id}: ${dollarDisplay(node.value)}`}</Typography></Paper>
        )}
      />
    </Box>

  )
}

export const CategorySunburstCard = (props: {
  categoryFilter: string[],
  setCategoryFilter: (filter: typeof props.categoryFilter) => any
  spendings: PlaidTransaction[]
}) => {
  const { categoryFilter, setCategoryFilter, spendings } = props
  return (
    <Card variant="outlined" sx={{ width: "100%", minHeight: "100%" }}>
      <CardHeader title="Categories" subheader={
        <Box display={"flex"} flexDirection={"row"} alignItems={"center"} flexWrap={"wrap"} mt={1}>
          {!!categoryFilter.length
            ? (
              <>
                <Button size="small" onClick={() => setCategoryFilter([])} >Clear</Button>
                {
                  categoryFilter.map((c, i) => (
                    <React.Fragment key={`${c}-${i}`}>
                      {i !== 0 && <ChevronRight />}
                      <Chip
                        label={c} size="small"
                        component={ButtonBase}
                        onClick={() => setCategoryFilter(categoryFilter.slice(0, i + 1))}
                      />
                    </React.Fragment>
                  ))
                }
              </>
            )
            : "All"}
        </Box>
      } />
      <CardContent sx={{ height: "400px" }}>
        <CategorySunburst rootPath={categoryFilter} transactions={spendings} onClick={({ path }) => {
          const filters = reverse(path.filter(p => p !== "root") as string[])
          setCategoryFilter(uniq([...categoryFilter, ...filters]))
        }} />
      </CardContent>
    </Card>
  )
}