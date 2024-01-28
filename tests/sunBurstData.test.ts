import type { PlaidTransaction } from "~common/plaidTypes";
import { computeCategorySunburstData } from "../tabs/components/computeCategorySunburstData";

const transactions: Partial<PlaidTransaction>[] = [
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
  children: [
    {
      id: "Travel",
      children: [
        {
          id: "Taxi",
          value: 1,
        }
      ]
    },
    {
      id: "Food and Drink",
      children: [
        {
          id: "Restaurant",
          children: [
            {
              id: "Fast Food",
              value: 1,
            },
            {
              id: "Coffee Shops",
              value: 1,
            },
          ]
        }
      ]
    },
  ]
}


describe("transform", () => {
  it("works", () => {
    const output = computeCategorySunburstData(transactions)
    expect(output).toEqual(expectedSunburstData)
  })
})
