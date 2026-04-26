export interface MonthData {
  [day: number]: number;
}

export interface Account {
  id: string;
  name: string;
  target: number;
  color: string;
  months: {
    [monthKey: string]: MonthData;
  };
}

export interface AppState {
  accounts: Account[];
  activeAccountIndex: number;
  viewMonth: {
    y: number;
    m: number;
  };
  currency: string;
  theme: 'light' | 'dark';
}
