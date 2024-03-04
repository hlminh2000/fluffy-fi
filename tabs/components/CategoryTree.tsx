import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Box, Button, Collapse, Divider, List, ListItem, ListItemButton, ListItemText, TextField } from "@mui/material";
import React, { Fragment, useEffect, useState } from "react";
import { CategoryTreeNode, useTransactionCategoryTree } from "~common/utils/getTransactionCategoryTree";

const AddNodeForm = (props: {
  onSubmit: (value: string) => any
}) => {
  const { onSubmit } = props
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <Box display={"flex"} flexDirection={"row"} gap={1} component={"form"} onSubmit={async e => {
      e.preventDefault();
      setLoading(true);
      await onSubmit(value);
      setValue("");
      setLoading(false);
    }} >
      <TextField
        label="New Category"
        variant="outlined"
        size="small"
        required
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <Button disabled={loading} type="submit" size="small">Add</Button>
    </Box>
  )
}

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

  return (
    <List sx={{ width: "100%" }}>
      {node?.children.map(child => (
        <Fragment key={child.name}>
          <ListItemButton
            onClick={toggleChildOpen(child.name)}
          >
            <ListItemText>{child.name}</ListItemText>
            {!openChildren[child.name] ? <ExpandMore /> : <ExpandLess />}
          </ListItemButton>
          <Divider variant="fullWidth" />
          <Collapse in={!!openChildren[child.name]} >
            <ListItem sx={{ ml: 2, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              {!!openChildren[child.name] && <CategoryTree node={child} addSubCategory={props.addSubCategory} />}
              <AddNodeForm onSubmit={async value => {
                await props.addSubCategory(child, value)
              }} />
            </ListItem>
          </Collapse>
        </Fragment>
      ))}
      {
        !!node && !node?.path.length && (
          <ListItem>
            <AddNodeForm onSubmit={async value => {
              await props.addSubCategory(node, value)
            }} />
          </ListItem>
        )
      }
    </List>
  )
}
