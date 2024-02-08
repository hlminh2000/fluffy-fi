import { PlaidTransaction } from "~common/plaidTypes"

export type SunburstNode = {
  id: string,
  value?: number,
  children?: SunburstNode[]
}
export const computeCategorySunburstData = (
  transactions: (
    Pick<PlaidTransaction, "amount"> 
    & Pick<PlaidTransaction, "category">
  )[],
): SunburstNode => {
  const node: Required<SunburstNode> = {
    id: "root",
    value: 0,
    children: [],
  }
  const process = (parent: Required<SunburstNode>, categoryChain: string[], amount: number) => {
    if (!categoryChain.length) return parent
    const [currentCategory, ...subCategoryChain] = categoryChain
    let currentNode = parent.children.find(node => node.id === currentCategory)
    if (!currentNode) {
      currentNode = { id: currentCategory, value: 0, children: [] }
      parent.children?.push(currentNode)
    }
    const currentNodeAsParent = currentNode as typeof parent
    currentNodeAsParent.value += amount
    process(currentNodeAsParent, subCategoryChain, amount)
  }
  transactions.forEach(transaction => {
    node.value += transaction.amount
    process(node, transaction.category, transaction.amount)
  })
  const cleanup = (node: SunburstNode) => {
    if (node.children?.length) {
      delete node.value
      node.children.forEach(cleanup)
    } else {
      delete node.children
    }
  }
  cleanup(node)
  return node
}
