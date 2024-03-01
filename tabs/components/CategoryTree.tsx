import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Box, Button, Collapse, Divider, List, ListItem, ListItemButton, ListItemText, TextField } from "@mui/material";
import React, { Fragment, useState } from "react";
import { CategoryTreeNode, useTransactionCategoryTree } from "~common/utils/getTransactionCategoryTree";

export const CategoryTree = (props: { 
  node: ReturnType<typeof useTransactionCategoryTree>["categoryTree"] 
  addSubCategory: (node: CategoryTreeNode, newCategoryName: string) => Promise<any>
}) => {
  const { node } = props;
  const [openChildren, setOpenChildren] = useState<Record<string, boolean>>({});

  const toggleChildOpen = (childName: string) => () => setOpenChildren({
    ...openChildren,
    [childName]: !openChildren[childName]
  })
  const [newCategoryInputValues, setNewCategoryInputValues] = useState<{ [node: CategoryTreeNode['name']]: string | undefined}>({})

  return (
    <List sx={{ width: "100%" }}>
      {node?.children.map(child => (
        <Fragment key={child.name}>
          <ListItemButton
            onClick={toggleChildOpen(child.name)}
          >
            <ListItemText>{child.name}</ListItemText>
            { !openChildren[child.name] ? <ExpandMore /> : <ExpandLess /> }
          </ListItemButton>
          <Divider variant="fullWidth" />
          <Collapse in={!!openChildren[child.name]}>
            <ListItem sx={{ ml: 2, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <Box display={"flex"} flexDirection={"row"} gap={1} component={"form"} onSubmit={async e => {
                e.preventDefault();
                const value = newCategoryInputValues[child.name]
                if (value) await props.addSubCategory(child, value);
                setNewCategoryInputValues({
                  ...newCategoryInputValues,
                  [child.name]: undefined
                })
              }} >
                <TextField
                  label="New Category"
                  variant="outlined"
                  size="small"
                  required
                  value={newCategoryInputValues[child.name]}
                  onChange={e => setNewCategoryInputValues({ 
                    ...newCategoryInputValues, 
                    [child.name]: e.target.value
                  })}
                />
                <Button type="submit" size="small">Add</Button>
              </Box>
              <CategoryTree node={child} addSubCategory={props.addSubCategory} />
            </ListItem>
          </Collapse>
        </Fragment>
      ))}
    </List>
  )
}
