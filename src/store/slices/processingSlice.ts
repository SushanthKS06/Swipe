import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ProcessingFile, FileProcessingStatus } from '../../types';

interface ProcessingState {
  files: ProcessingFile[];
}

const initialState: ProcessingState = {
  files: [],
};

const processingSlice = createSlice({
  name: 'processing',
  initialState,
  reducers: {
    addFile(state, action: PayloadAction<{ id: string; name: string; size: number; mimeType: string }>) {
      state.files.push({
        id: action.payload.id,
        name: action.payload.name,
        size: action.payload.size,
        mimeType: action.payload.mimeType,
        status: 'queued',
        progress: 0,
        error: null,
        extractedInvoiceIds: [],
        extractedProductIds: [],
        extractedCustomerIds: [],
      });
    },
    updateFileStatus(
      state,
      action: PayloadAction<{
        id: string;
        status: FileProcessingStatus;
        error?: string | null;
        extractedInvoiceIds?: string[];
        extractedProductIds?: string[];
        extractedCustomerIds?: string[];
      }>
    ) {
      const idx = state.files.findIndex(f => f.id === action.payload.id);
      if (idx !== -1) {
        state.files[idx].status = action.payload.status;
        if (action.payload.error !== undefined) {
          state.files[idx].error = action.payload.error;
        }
        if (action.payload.extractedInvoiceIds) {
          state.files[idx].extractedInvoiceIds = action.payload.extractedInvoiceIds;
        }
        if (action.payload.extractedProductIds) {
          state.files[idx].extractedProductIds = action.payload.extractedProductIds;
        }
        if (action.payload.extractedCustomerIds) {
          state.files[idx].extractedCustomerIds = action.payload.extractedCustomerIds;
        }
        if (action.payload.status === 'complete') {
          state.files[idx].progress = 100;
        }
      }
    },
    updateFileProgress(state, action: PayloadAction<{ id: string; progress: number }>) {
      const idx = state.files.findIndex(f => f.id === action.payload.id);
      if (idx !== -1) {
        state.files[idx].progress = action.payload.progress;
      }
    },
    removeFile(state, action: PayloadAction<string>) {
      state.files = state.files.filter(f => f.id !== action.payload);
    },
    clearAll(state) {
      state.files = [];
    },
  },
});

export const {
  addFile,
  updateFileStatus,
  updateFileProgress,
  removeFile,
  clearAll,
} = processingSlice.actions;

export default processingSlice.reducer;
