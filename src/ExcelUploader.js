import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import './ExcelUploader.css';

const ExcelUploader = ({ onFileUpload, onClose }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );
    
    if (excelFile) {
      processFile(excelFile);
    } else {
      alert('Please upload a valid Excel file (.xlsx or .xls)');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellStyles: true });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get the range of the worksheet
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        
        // Create a 2D array with proper dimensions
        const jsonData = [];
        for (let row = range.s.r; row <= range.e.r; row++) {
          const rowData = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellAddress];
            rowData.push(cell ? (cell.v !== undefined ? String(cell.v) : '') : '');
          }
          jsonData.push(rowData);
        }
        
        // Get merged cells information
        const mergedCells = worksheet['!merges'] || [];
        console.log('Merged cells from Excel:', mergedCells);
        
        // Convert merged cells to handsontable format
        const mergeCells = mergedCells.map(merge => {
        //   console.log('Processing merge:', merge);
          return {
            row: merge.s.r,
            col: merge.s.c,
            rowspan: merge.e.r - merge.s.r + 1,
            colspan: merge.e.c - merge.s.c + 1
          };
        });
        
        // console.log('Converted merge cells:', mergeCells);
        
        // Ensure we have data
        if (jsonData.length === 0) {
          jsonData.push(['No data found']);
        }
        
        onFileUpload({
          data: jsonData,
          mergeCells: mergeCells,
          fileName: file.name
        });
        
      } catch (error) {
        console.error('Error processing Excel file:', error);
        alert('Error processing Excel file. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`excel-uploader-overlay ${isDragOver ? 'drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="excel-uploader-content">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Processing Excel file...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon" onClick={handleUploadClick}>
              <svg 
                width="80" 
                height="80" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            
            <h2>Upload Excel File</h2>
            <p>
              Drop your Excel file here or{' '}
              <span className="upload-link" onClick={handleUploadClick}>
                browse files
              </span>
            </p>
            <p className="file-types">Supports .xlsx and .xls files</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ExcelUploader; 