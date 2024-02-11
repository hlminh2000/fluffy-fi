import type { PlaidTransaction } from "~common/plaidTypes";
import { computeCategorySunburstData } from "../tabs/components/computeCategorySunburstData";
import { sumBy } from "lodash";

const transactions: Parameters<typeof computeCategorySunburstData>[0] = [
  {
    amount: 1,
    category: ["Travel", "Taxi"]
  },
  {
    amount: 1,
    category: ["Food and Drink", "Restaurant", "Fast Food"]
  },
  {
    amount: 1,
    category: ["Food and Drink", "Restaurant", "Coffee Shops"]
  },
  {
    amount: 1,
    category: ["Food and Drink", "Restaurant"]
  },
]
const expectedSunburstData: ReturnType<typeof computeCategorySunburstData> = {
  id: "root",
  value: 0,
  fullPath: [],
  children: [
    {
      id: "Travel",
      value: 1,
      fullPath: ["Travel"],
      children: [
        {
          id: "Taxi",
          value: 1,
          fullPath: ["Travel", "Taxi"],
          children: []
        }
      ]
    },
    {
      id: "Food and Drink",
      value: 3,
      fullPath: ["Food and Drink"],
      children: [
        {
          id: "Restaurant",
          value: 3,
          fullPath: ["Food and Drink", "Restaurant"],
          children: [
            {
              id: "Fast Food",
              value: 1,
              children: [],
              fullPath: ["Food and Drink", "Restaurant", "Fast Food"],
            },
            {
              id: "Coffee Shops",
              value: 1,
              children: [],            
              fullPath: ["Food and Drink", "Restaurant", "Coffee Shops"],
            },
          ]
        }
      ]
    },
  ]
}


describe.skip("transform", () => {
  it("works without rootPath", () => {
    const output = computeCategorySunburstData(transactions)
    expect(output).toEqual(expectedSunburstData)
    expect(sumBy(output?.children, "value")).toEqual(sumBy(transactions, "amount"))
  })
  it("handles rootPath", () => {
    const output = computeCategorySunburstData(transactions, ["Food and Drink", "Restaurant"])
    const expectedOutput = { ...expectedSunburstData.children[1].children[0], value: 0 }
    expect(output).toEqual(expectedOutput)
  })
})
