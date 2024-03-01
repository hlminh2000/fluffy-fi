import { useEffect, useState } from "react";
import { categoryDb } from "~common/PouchDbs";
import { PlaidTransactionCategory } from "~common/plaidTypes";

export type CategoryTreeNode = {
  name: string,
  path: string[],
  children: CategoryTreeNode[],
}
export const getTransactionCategoryTree = async (): Promise<CategoryTreeNode> => {
  const { rows } = await categoryDb.allDocs({ include_docs: true });
  const categories = rows.map(row => row.doc as PlaidTransactionCategory);

  const categoryTree: CategoryTreeNode = {
    name: "root",
    path: [],
    children: []
  };
  const addToCategoryTree = (parent: CategoryTreeNode, categoryChain: string[], category: PlaidTransactionCategory) => {
    if (!categoryChain.length) {
      return parent
    }
    const [currentCategory, ...subCategoryChain] = categoryChain
    let currentNode = parent.children.find(node => node.name === currentCategory);
    if (!currentNode) {
      currentNode = { name: currentCategory, children: [], path: [...parent.path, currentCategory] }
      parent.children.push(currentNode)
    }
    addToCategoryTree(currentNode, subCategoryChain, category)
  };
  categories.forEach(category => addToCategoryTree(categoryTree, category.hierarchy, category));
  return categoryTree;
}

export const useTransactionCategoryTree = () => {
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode>()
  const [loading, setLoading] = useState(true)

  const sync = async () => {
    setLoading(true)
    setCategoryTree(await getTransactionCategoryTree())
    setLoading(false)
  }

  useEffect(() => {
    sync()
  }, [])

  return {
    categoryTree,
    loading,
    sync
  }
}
