export const money = (value: number) => `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
export const newOrderId = () => `ORD-${Date.now()}`;
