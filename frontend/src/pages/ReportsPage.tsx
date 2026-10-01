import React, { useState } from 'react';
import { Upload, FileText, BarChart3, Database } from 'lucide-react';
import { ReportExplorer } from '../components/Reports/ReportExplorer';
import { uploadReport } from '../services/api';

export const ReportsPage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleUpload(files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      await uploadReport(file);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed. Check console for details.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Historical Drilling Memory</h1>
        <p className="text-text-secondary mt-2">Manage and index legacy drilling reports and documentation.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-secondary p-6 rounded-lg border border-border flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-lg text-accent">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <div className="text-text-secondary text-sm">Total Reports</div>
            <div className="text-2xl font-bold text-text-primary">124</div>
          </div>
        </div>
        <div className="bg-secondary p-6 rounded-lg border border-border flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <div className="text-text-secondary text-sm">Indexed Entities</div>
            <div className="text-2xl font-bold text-text-primary">8,432</div>
          </div>
        </div>
        <div className="bg-secondary p-6 rounded-lg border border-border flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <div className="text-text-secondary text-sm">Events Extracted</div>
            <div className="text-2xl font-bold text-text-primary">342</div>
          </div>
        </div>
      </div>

      <div 
        className={`bg-secondary p-12 rounded-lg border-2 border-dashed transition-colors text-center
          ${isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Upload Drilling Reports</h3>
        <p className="text-text-secondary mb-6 text-sm">Drag and drop PDF files here, or click to browse</p>
        
        <input 
          type="file" 
          id="file-upload" 
          className="hidden" 
          accept=".pdf"
          onChange={handleFileInput}
          disabled={uploading}
        />
        <label 
          htmlFor="file-upload"
          className={`px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors inline-block
            ${uploading ? 'bg-tertiary text-text-secondary' : 'bg-accent text-white hover:bg-accent/90'}
          `}
        >
          {uploading ? 'Uploading...' : 'Select File'}
        </label>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-text-primary mb-4">Document Library</h2>
        <ReportExplorer key={refreshKey} />
      </div>
    </div>
  );
};
