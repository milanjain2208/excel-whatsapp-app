// src/App.js
import React, { useState } from "react";
import './App.css';
import Spreadsheet from "./Spreadsheet";
import ExcelUploader from "./ExcelUploader";

function App() {
  const [excelData, setExcelData] = useState(null);
  const [showUploader, setShowUploader] = useState(true);

  const handleFileUpload = (uploadedData) => {
    setExcelData(uploadedData);
    setShowUploader(false);
  };

  const handleUploadNew = () => {
    setShowUploader(true);
  };


  console.log(excelData);

  return (
    <div className="App">
      {showUploader && (
        <ExcelUploader 
          onFileUpload={handleFileUpload}
          onClose={() => setShowUploader(false)}
        />
      )}
      
      <Spreadsheet 
        data={excelData?.data}
        mergeCells={excelData?.mergeCells}
        fileName={excelData?.fileName}
        onUploadNew={handleUploadNew}
      />
    </div>
  );
}

export default App;
