import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UiState = {
  proofSent: boolean;
  selectedBank: string | null;
};

const initialState: UiState = {
  proofSent: false,
  selectedBank: null,
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
    clearSelectedBank(state) {
      state.selectedBank = null;
    },
  },
});

export const {
  setProofSent,
  clearProofSent,
  setSelectedBank,
  clearSelectedBank,
} = uiSlice.actions;

export default uiSlice.reducer;
