import { Box, Chip, FormControl, InputLabel, ListItem, ListItemIcon, ListItemText, MenuItem, OutlinedInput, Select } from "@mui/material"
import React, { useMemo } from "react";
import _ from 'lodash';
import { AccountTypeIcon } from "~common/components/AccountTypeIcon";
import { PlaidAccount } from "~common/plaidTypes";

const accountColor = (account: PlaidAccount) => ({
  depository: "success" as "success",
  credit: "warning" as "warning",
  loan: "warning" as "warning",
  investment: "success" as "success",
}[account?.type] || "info" as "info")

export const AccountSelector = (props: {
  selectedAccounts?: string[],
  accounts?: PlaidAccount[],
  setSelectedAccounts: (accounts: typeof props.selectedAccounts) => any
}) => {
  const {
    selectedAccounts = [],
    accounts = [],
    setSelectedAccounts,
  } = props


  const accountIndex = useMemo(
    () => accounts?.reduce(
      (acc, a) => ({ ...acc, [a.account_id]: a }),
      {} as { [id: string]: typeof accounts[number] }
    ) || [] as NonNullable<typeof accounts>,
    [accounts]
  )

  return (
    <FormControl fullWidth>
      <InputLabel id="accounts">Accounts</InputLabel>
      <Select <string[]>
        fullWidth
        labelId="accounts"
        multiple
        value={selectedAccounts || []}
        onChange={e => setSelectedAccounts(e.target.value as string[])}
        input={<OutlinedInput label="Accounts" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selected.map((accountId) => (
              <Chip
                icon={<AccountTypeIcon type={accountIndex[accountId]?.type} />}
                color={accountColor(accountIndex[accountId])}
                key={accountId}
                label={accountIndex[accountId]?.name}
              />
            ))}
          </Box>
        )}
      >
        {accounts?.map((account) => (
          <MenuItem
            key={account.account_id}
            value={account.account_id}
          >
            <ListItem secondaryAction={
              <ListItemText>
                ${(account.balances.current).toFixed(2)}
              </ListItemText>
            }>
              <ListItemIcon>
                <AccountTypeIcon type={account.type} color={accountColor(account)} />
              </ListItemIcon>
              <ListItemText>
                {account.name}
              </ListItemText>
            </ListItem>
          </MenuItem>
        ))}
      </Select>
    </FormControl>

  )
}