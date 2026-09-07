import { createSlice } from "@reduxjs/toolkit";
import type { TemplateRootState } from '@/template/state/store/templateStoreTypes';

type PasswordChangePromptState = {
  isOpen: boolean;
};

const initialState: PasswordChangePromptState = {
  isOpen: false,
};

const passwordChangePromptSlice = createSlice({
  name: "passwordChangePrompt",
  initialState,
  reducers: {
    openInitialPasswordChangeDialog: (state) => {
      state.isOpen = true;
    },
    closeInitialPasswordChangeDialog: (state) => {
      state.isOpen = false;
    },
  },
});

export const {
  openInitialPasswordChangeDialog,
  closeInitialPasswordChangeDialog,
} = passwordChangePromptSlice.actions;

export const selectInitialPasswordChangeDialogOpen = (state: TemplateRootState) =>
  state.passwordChangePrompt.isOpen;

export default passwordChangePromptSlice.reducer;