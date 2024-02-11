import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Collapse, Divider, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { Fragment, useState } from "react";
import { useTransactionCategoryTree } from "~common/utils/getTransactionCategoryTree";

export const CategoryTree = (props: { node: ReturnType<typeof useTransactionCategoryTree>["categoryTree"] }) => {
  const { node } = props;
  const [openChildren, setOpenChildren] = useState<Record<string, boolean>>({});

  const toggleChildOpen = (childName: string) => () => setOpenChildren({
    ...openChildren,
    [childName]: !openChildren[childName]
  })


  return (
    <List sx={{ width: "100%" }}>
      {node?.children.map(child => (
        <Fragment key={child.name}>
          <ListItemButton
            onClick={toggleChildOpen(child.name)}
          >
            <ListItemText>{child.name}</ListItemText>
            {
              !!child.children.length && (
                !openChildren[child.name] ? <ExpandMore /> : <ExpandLess />
              )
            }
          </ListItemButton>
          <Divider />
          {!!child.children.length && (
            <Collapse in={!!openChildren[child.name]}>
              <ListItem sx={{ ml: 2 }}>
                <CategoryTree node={child} />
              </ListItem>
            </Collapse>
          )}
        </Fragment>
      ))}
    </List>
  )
}
