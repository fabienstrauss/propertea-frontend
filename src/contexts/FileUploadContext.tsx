import { createContext, useContext, ReactNode } from 'react';
import { useFileUpload, UploadedFile } from '@/hooks/useFileUpload';

interface FileUploadContextType {
  uploadedFiles: UploadedFile[];
  isUploading: boolean;
  isLoading: boolean;
  uploadFiles: (files: FileList | File[]) => Promise<void>;
  deleteFile: (fileId: string, storagePath: string) => Promise<void>;
  clearFiles: () => void;
}

const FileUploadContext = createContext<FileUploadContextType | null>(null);

export const FileUploadProvider = ({ children }: { children: ReactNode }) => {
  const fileUpload = useFileUpload();
  
  return (
    <FileUploadContext.Provider value={fileUpload}>
      {children}
    </FileUploadContext.Provider>
  );
};

export const useFileUploadContext = () => {
  const context = useContext(FileUploadContext);
  if (!context) {
    throw new Error('useFileUploadContext must be used within a FileUploadProvider');
  }
  return context;
};
