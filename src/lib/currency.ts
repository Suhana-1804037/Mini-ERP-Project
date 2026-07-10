export const formatCurrency = (amount: number | string) => `Tk ${Number(amount || 0).toFixed(2)}`
