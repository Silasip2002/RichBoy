export interface Asset {
  id: number;
  name: string;
  symbol: string;
  asset_type: string;
  price: number;
  quantity: number;
  account: number;
  cost: number;
  market_price: number;
}

export interface AssetData {
  name: string;
  symbol: string;
  asset_type: string;
  price: string;
  quantity: string;
  account: number;
  cost: string;
}

export interface Account {
  id: number;
  name: string;
  account_type: string;
  balance: string;
  currency: string;
}