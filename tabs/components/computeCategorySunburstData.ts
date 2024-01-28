import { PlaidTransaction } from "~common/plaidTypes"

export type SunburstNode = {
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
    if (!categoryChain.length) return parent
    const [currentCategory, ...subCategoryChain] = categoryChain
    let currentNode = parent.children.find(node => node.id === currentCategory)
    if (!currentNode) {
      currentNode = { id: currentCategory, value: 0, children: [] }
      parent.children.push(currentNode)
    }
    currentNode.value += amount
    process(currentNode, subCategoryChain, amount)
  }
  transactions.forEach(transaction => {
    node.value += transaction.amount
    process(node, transaction.category, transaction.amount)
  })
  const cleanup = (node: SunburstNode) => {
    if (node.children.length) {
      delete node.value
      node.children.forEach(cleanup)
    } else {
      delete node.children
    }
  }
  cleanup(node)
  return node
}
