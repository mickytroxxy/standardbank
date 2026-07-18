import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UiState = {
  proofSent: boolean;
  selectedBank: string | null;
  allowImmediatePayment: boolean;
  immediatePaymentErrorMessage: string;
  allowStandardBankTransfers: boolean;
  isLoading: boolean;
};

export const DEFAULT_IMMEDIATE_PAYMENT_ERROR = "Immediate payment is currently disabled due to KYC limits. Please visit your nearest branch to verify your account, or proceed with a regular payment.";

const initialState: UiState = {
  proofSent: false,
  selectedBank: null,
  allowImmediatePayment: true,
  immediatePaymentErrorMessage: DEFAULT_IMMEDIATE_PAYMENT_ERROR,
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
    setImmediatePaymentErrorMessage(state, action: PayloadAction<string>) {
      state.immediatePaymentErrorMessage = action.payload;
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
  setImmediatePaymentErrorMessage,
  setAllowStandardBankTransfers,
  showLoader,
  hideLoader,
} = uiSlice.actions;

export default uiSlice.reducer;
