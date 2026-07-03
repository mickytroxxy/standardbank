import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UiState = {
  proofSent: boolean;
  selectedBank: string | null;
  allowImmediatePayment: boolean;
  allowStandardBankTransfers: boolean;
  isLoading: boolean;
};

const initialState: UiState = {
  proofSent: false,
  selectedBank: null,
  allowImmediatePayment: true,
  allowStandardBankTransfers: true,
  isLoading: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setProofSent(state) {
      state.proofSent = true;
    },
    clearProofSent(state) {
      state.proofSent = false;
    },
    setSelectedBank(state, action: PayloadAction<string>) {
      state.selectedBank = action.payload;
    },
    setAllowImmediatePayment(state, action: PayloadAction<boolean>) {
      state.allowImmediatePayment = action.payload;
    },
    setAllowStandardBankTransfers(state, action: PayloadAction<boolean>) {
      state.allowStandardBankTransfers = action.payload;
    },
    clearSelectedBank(state) {
      state.selectedBank = null;
    },
    showLoader(state) {
      state.isLoading = true;
    },
    hideLoader(state) {
      state.isLoading = false;
    },
  },
});

export const {
  setProofSent,
  clearProofSent,
  setSelectedBank,
  clearSelectedBank,
  setAllowImmediatePayment,
  setAllowStandardBankTransfers,
  showLoader,
  hideLoader,
} = uiSlice.actions;

export default uiSlice.reducer;
