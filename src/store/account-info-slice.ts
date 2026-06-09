import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AccountInfo, Title } from "@/api";

export type AccountInfoState = {
  phoneNumber: string | null;
  pin: string | null;
  title: Title | null;
  firstName: string | null;
  lastName: string | null;
  accountNumber: string | null;
  availableBalance: number | null;
  latestBalance: number | null;
};

const initialState: AccountInfoState = {
  phoneNumber: null,
  pin: null,
  title: null,
  firstName: null,
  lastName: null,
  accountNumber: null,
  availableBalance: null,
  latestBalance: null,
};

const accountInfoSlice = createSlice({
  name: "accountInfo",
  initialState,
  reducers: {
    setAccountInfo(state, action: PayloadAction<AccountInfo>) {
      state.phoneNumber = action.payload.phoneNumber;
      state.pin = action.payload.pin;
      state.title = action.payload.title;
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.accountNumber = action.payload.accountNumber;
      state.availableBalance = action.payload.availableBalance;
      state.latestBalance = action.payload.latestBalance;
    },
    updateAccountInfo(state, action: PayloadAction<Partial<AccountInfoState>>) {
      Object.assign(state, action.payload);
    },
    setBalances(
      state,
      action: PayloadAction<{
        availableBalance: number;
        latestBalance: number;
      }>,
    ) {
      state.availableBalance = action.payload.availableBalance;
      state.latestBalance = action.payload.latestBalance;
    },
    clearAccountInfo() {
      return initialState;
    },
  },
});

export const {
  setAccountInfo,
  updateAccountInfo,
  setBalances,
  clearAccountInfo,
} = accountInfoSlice.actions;

export default accountInfoSlice.reducer;
