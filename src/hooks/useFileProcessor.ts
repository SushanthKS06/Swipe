import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { addInvoices } from '../store/slices/invoicesSlice';
import { addProducts } from '../store/slices/productsSlice';
import { addCustomers } from '../store/slices/customersSlice';
import {
  addFile,
  updateFileStatus,
  updateFileProgress,
} from '../store/slices/processingSlice';
import { processFile } from '../services/processors';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export function useFileProcessor() {
  const dispatch = useAppDispatch();

  const uploadAndProcessFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // Limit concurrency to maximum of 2 files at any given moment
    const CONCURRENCY_LIMIT = 2;
    const items = [...files];
    const itemQueue = items.map(file => ({
      file,
      id: uuidv4(),
    }));

    // Initialize all files in Redux as queued
    itemQueue.forEach(item => {
      dispatch(
        addFile({
          id: item.id,
          name: item.file.name,
          size: item.file.size,
          mimeType: item.file.type,
        })
      );
    });

    toast.success(`Enqueued ${files.length} file(s) for Invoice AI extraction.`);

    let activeWorkerCount = 0;
    let nextIndex = 0;

    const runWorker = async (): Promise<void> => {
      if (nextIndex >= itemQueue.length) return;

      const currentItem = itemQueue[nextIndex++];
      activeWorkerCount++;

      dispatch(
        updateFileStatus({
          id: currentItem.id,
          status: 'reading',
        })
      );

      try {
        const result = await processFile(currentItem.file, (progress) => {
          let statusText: 'reading' | 'extracting' | 'parsing' = 'reading';
          if (progress >= 30 && progress < 75) statusText = 'extracting';
          if (progress >= 75) statusText = 'parsing';

          dispatch(updateFileProgress({ id: currentItem.id, progress }));
          dispatch(updateFileStatus({ id: currentItem.id, status: statusText }));
        });

        // Push extracted objects into the central tables state
        if (result.invoices.length > 0) dispatch(addInvoices(result.invoices));
        if (result.products.length > 0) dispatch(addProducts(result.products));
        if (result.customers.length > 0) dispatch(addCustomers(result.customers));

        dispatch(
          updateFileStatus({
            id: currentItem.id,
            status: 'complete',
            extractedInvoiceIds: result.invoices.map(i => i.id),
            extractedProductIds: result.products.map(p => p.id),
            extractedCustomerIds: result.customers.map(c => c.id),
          })
        );

        toast.success(
          `Extracted ${result.invoices.length} invoices successfully from "${currentItem.file.name}"`,
          { duration: 4000 }
        );
      } catch (error: any) {
        console.error(`Error processing file ${currentItem.file.name}:`, error);
        const errorMsg = error?.message || 'Gemini extraction failed.';
        
        dispatch(
          updateFileStatus({
            id: currentItem.id,
            status: 'error',
            error: errorMsg,
          })
        );

        toast.error(`"${currentItem.file.name}" failed: ${errorMsg}`, {
          duration: 5000,
        });
      } finally {
        activeWorkerCount--;
        // Start another work item if any remains
        await runWorker();
      }
    };

    // Spin up concurrent workers up to the concurrency limit
    const workerPromises: Promise<void>[] = [];
    for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, itemQueue.length); i++) {
      workerPromises.push(runWorker());
    }

    await Promise.all(workerPromises);
  }, [dispatch]);

  return { uploadAndProcessFiles };
}
