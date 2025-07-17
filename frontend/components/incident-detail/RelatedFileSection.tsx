import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Image, Download, Trash2, Upload, Paperclip, X } from "lucide-react";

// Define a RelatedFile type for use in props
interface RelatedFile {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  uploader?: {
    id: string;
    name?: string | null;
    email?: string;
  };
}

interface RelatedFileSectionProps {
  relatedFiles: RelatedFile[];
  apiBaseUrl: string;
  incident: Record<string, unknown> | null;
  isResponderOrAbove: boolean;
  deletingRelatedFileId: string | null;
  setDeletingRelatedFileId: (id: string | null) => void;
  onRelatedFileDelete?: (file: RelatedFile) => void;
  onRelatedFileUpload?: (files: File[]) => void;
  relatedFileUploadMsg?: string;
  newRelatedFiles: File[];
  setNewRelatedFiles: (files: File[]) => void;
  eventSlug?: string;
  incidentId?: string;
}

export function RelatedFileSection({
  relatedFiles,
  apiBaseUrl,
  isResponderOrAbove,
  deletingRelatedFileId,
  setDeletingRelatedFileId,
  onRelatedFileDelete,
  onRelatedFileUpload,
  relatedFileUploadMsg,
  newRelatedFiles = [],
  setNewRelatedFiles = () => {},
  eventSlug,
  incidentId,
}: RelatedFileSectionProps) {
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('gallery');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setNewRelatedFiles([...newRelatedFiles, ...files]);
    }
    // Reset file input to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveNewFile = (index: number) => {
    const updatedFiles = [...newRelatedFiles];
    updatedFiles.splice(index, 1);
    setNewRelatedFiles(updatedFiles);
  };

  const handleUploadClick = () => {
    if (newRelatedFiles.length > 0 && onRelatedFileUpload) {
      onRelatedFileUpload(newRelatedFiles);
    }
  };
  
  const getFileIcon = (mimetype?: string) => {
    if (mimetype && mimetype.startsWith('image/')) {
      return Image;
    }
    return FileText;
  };

  const getFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (file: RelatedFile) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/events/${eventSlug}/incidents/${incidentId}/related-files/${file.id}/download`,
        {
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      // You could add a toast notification here
    }
  };

  const RelatedFileCard = ({ file }: { file: RelatedFile }) => {
    const FileIcon = getFileIcon(file.mimetype);
    
    return (
      <div className="border border-border rounded-lg p-3 space-y-3 bg-background">
        <div className="flex items-center justify-center h-20 bg-muted rounded-lg">
          <FileIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-1">
          <div className="text-sm font-medium truncate" title={file.filename}>
            {file.filename}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>{getFileSize(file.size)}</div>
            {file.uploader && (
              <div className="truncate">
                By: {file.uploader.name || file.uploader.email || 'Unknown'}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9"
            onClick={() => handleDownload(file)}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          
          {isResponderOrAbove && (
            deletingRelatedFileId === file.id ? (
              <div className="flex gap-1">
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => onRelatedFileDelete && onRelatedFileDelete(file)}
                >
                  Confirm
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => setDeletingRelatedFileId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3"
                onClick={() => setDeletingRelatedFileId(file.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )
          )}
        </div>
      </div>
    );
  };

  const RelatedFileListItem = ({ file }: { file: RelatedFile }) => {
    const FileIcon = getFileIcon(file.mimetype);
    
    return (
      <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background">
        <div className="flex-shrink-0">
          <FileIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-sm font-medium truncate">
            {file.filename}
          </div>
          <div className="text-xs text-muted-foreground">
            {getFileSize(file.size)}
            {file.uploader && (
              <span className="ml-2">
                by {file.uploader.name || file.uploader.email || 'Unknown'}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(file)}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          {isResponderOrAbove && (
            deletingRelatedFileId === file.id ? (
              <div className="flex gap-1">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => onRelatedFileDelete && onRelatedFileDelete(file)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDeletingRelatedFileId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingRelatedFileId(file.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold m-0">Related Files</h3>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto"
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Add Files
          </Button>
        </div>
        
        {newRelatedFiles.length > 0 && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <h4 className="text-sm font-medium">New files to upload:</h4>
            <ul className="space-y-2">
              {newRelatedFiles.map((file, index) => (
                <li key={index} className="flex items-center justify-between text-sm p-2 bg-background rounded-md border">
                  <span>{file.name} ({getFileSize(file.size)})</span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveNewFile(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
              <p className="text-sm text-destructive text-center sm:text-left">{relatedFileUploadMsg}</p>
              <Button onClick={handleUploadClick} className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                Upload {newRelatedFiles.length} file{newRelatedFiles.length > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </div>

      {relatedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-muted-foreground">
              {relatedFiles.length} file{relatedFiles.length !== 1 ? 's' : ''} uploaded
            </h4>
            <div className="hidden sm:flex rounded-md border">
              <button
                onClick={() => setViewMode('gallery')}
                className={`px-3 py-1 text-sm rounded-l-md ${
                  viewMode === 'gallery' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background hover:bg-muted'
                }`}
              >
                Gallery
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-r-md ${
                  viewMode === 'list' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background hover:bg-muted'
                }`}
              >
                List
              </button>
            </div>
          </div>

          <div className="sm:hidden flex rounded-md border w-full">
            <button
              onClick={() => setViewMode('gallery')}
              className={`flex-1 px-3 py-2 text-sm rounded-l-md ${
                viewMode === 'gallery' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-muted'
              }`}
            >
              Gallery
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 px-3 py-2 text-sm rounded-r-md ${
                viewMode === 'list' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-muted'
              }`}
            >
              List
            </button>
          </div>
          
          {viewMode === 'gallery' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedFiles.map(file => <RelatedFileCard key={file.id} file={file} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {relatedFiles.map(file => <RelatedFileListItem key={file.id} file={file} />)}
            </div>
          )}
        </div>
      )}

      {relatedFiles.length === 0 && newRelatedFiles.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No related files have been uploaded for this incident.</p>
        </div>
      )}
    </div>
  );
}