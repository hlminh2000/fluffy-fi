import { sumBy } from "lodash"
import { PlaidTransaction } from "~common/plaidTypes"

type TransactionSubData = Pick<PlaidTransaction, "amount">
  & Pick<PlaidTransaction, "category">

export type SunburstNode = {
  id: string,
  value: number,
  children: SunburstNode[],
  fullPath: string[],
  transactions?: TransactionSubData[]
}

const constructTree = (parent: SunburstNode, categoryChain: string[], transaction: TransactionSubData) => {
  if (!categoryChain.length) {
    parent.transactions?.push(transaction)
    return parent
  }
  const [currentCategory, ...subCategoryChain] = categoryChain
  let currentNode = parent.children.find(node => node.id === currentCategory)
  if (!currentNode) {
    currentNode = { id: currentCategory, value: 0, children: [], transactions: [], fullPath: [...parent.fullPath, currentCategory] }
    parent.children?.push(currentNode)
  }
  constructTree(currentNode, subCategoryChain, transaction)
}

const computeValue = (node: SunburstNode) => {
  node.value = sumBy(node.transactions, "amount")
  node.children.forEach(computeValue)
}

export const computeCategorySunburstData = (
  transactions: (
    Pick<PlaidTransaction, "amount"> 
    & Pick<PlaidTransaction, "category">
  )[],
  rootPath: string[] = [],
): SunburstNode | undefined => {
  const tree: Required<SunburstNode> = {
    id: "root",
    value: 0,
    children: [],
    fullPath: [],
    transactions: []
  }
  transactions.forEach(transaction => {
    constructTree(tree, transaction.category, transaction)
  })
  tree.children.forEach(computeValue)

  const targetNode = rootPath.slice(0, rootPath.length - 1).reduce((node: SunburstNode, edge: string) => node?.children?.find(c => c.id === edge), tree)
  console.log("targetNode: ", targetNode)

  return targetNode
}
