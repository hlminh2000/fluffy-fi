export const dollarDisplay = (num: number) => isNaN(num) ? "" : `$${num.toLocaleString("US", { minimumFractionDigits: 2 })}`
