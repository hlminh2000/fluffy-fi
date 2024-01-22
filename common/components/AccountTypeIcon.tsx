import CreditCardIcon from '@mui/icons-material/CreditCard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import type { ComponentProps } from 'react';

export const AccountTypeIcon = ({ type, ...rest }: {
  type: "depository" | "credit" | "loan" | "investment" | string
} & ComponentProps<typeof MonetizationOnIcon>) => {
  return {
    depository: <MonetizationOnIcon {...rest} />,
    credit: <CreditCardIcon {...rest} />,
    loan: <CreditCardIcon {...rest} />,
    investment: <TrendingUpIcon {...rest} />
  }[type] || <LocalAtmIcon {...rest} />
}