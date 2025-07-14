// src/Spreadsheet.js
import React, { useRef } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from 'handsontable/registry';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

registerAllModules();

const Spreadsheet = ({ data, mergeCells, fileName, onUploadNew }) => {
  const hotRef = useRef(null);

  // Use uploaded data if available, otherwise use sample data
  const tableData = data || [
    ["Name", "Age", "Country"],
    ["Milan", 26, "India"],
    ["Aditya", 25, "India"]
  ];

  // Ensure we have enough columns (minimum 26 columns like Excel A-Z)
  const minColumns = 26;
  const processedData = tableData.map(row => {
    const newRow = [...row];
    while (newRow.length < minColumns) {
      newRow.push('');
    }
    return newRow;
  });

  // Ensure we have enough rows (minimum 100 rows)
  const minRows = 100;
  while (processedData.length < minRows) {
    const newRow = new Array(minColumns).fill('');
    processedData.push(newRow);
  }



  // Convert column number to Excel-style letter
  const getColumnLetter = (col) => {
    let result = '';
    let num = col;
    while (num >= 0) {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
    }
    return result;
  };

  // Generate PDF from selected data
  const saveSelectedToPDF = () => {
    const hot = hotRef.current?.hotInstance;
    const selected = hot?.getSelected() || [];
    
    if (selected.length === 0) {
      alert('Please select an area to save as PDF');
      return;
    }

    try {
      let selectedData = [];
      
      if (selected.length === 1) {
        // Single selection
        selectedData = hot?.getData(...selected[0]) || [];
      } else {
        // Multiple selections - combine them
        for (let i = 0; i < selected.length; i += 1) {
          const item = selected[i];
          selectedData.push(...(hot?.getData(...item) || []));
        }
      }

      // Create PDF
      const pdf = new jsPDF();
      
      // Add title
      const [startRow, startCol, endRow, endCol] = selected[0];
      const rangeText = `${getColumnLetter(startCol)}${startRow + 1}:${getColumnLetter(endCol)}${endRow + 1}`;
      const title = fileName ? `${fileName} - Range ${rangeText}` : `Spreadsheet - Range ${rangeText}`;
      
      pdf.setFontSize(16);
      pdf.text(title, 14, 20);
      
      // Add timestamp
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      // Filter out empty rows for cleaner PDF
      const filteredData = selectedData.filter(row => 
        row.some(cell => cell !== null && cell !== undefined && cell !== '')
      );

      if (filteredData.length === 0) {
        pdf.setFontSize(12);
        pdf.text('Selected area contains no data', 14, 50);
      } else {
        // Create table
        pdf.autoTable({
          head: [],
          body: filteredData,
          startY: 40,
          styles: {
            fontSize: 8,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250],
          },
          tableLineColor: [229, 231, 235],
          tableLineWidth: 0.5,
        });
      }

      // Save the PDF
      const saveFileName = fileName 
        ? `${fileName.replace(/\.[^/.]+$/, "")}_${rangeText}.pdf`
        : `spreadsheet_${rangeText}.pdf`;
      
      pdf.save(saveFileName);
      
      // Show success message
      alert(`PDF saved successfully as "${saveFileName}"`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Configure handsontable settings
  const tableSettings = {
    data: processedData,
    rowHeaders: true,
    width: "100%",
    height: "calc(100vh - 120px)", // Allow for header space and enable scrolling
    stretchH: "none", // Don't stretch columns to fit width
    licenseKey: "non-commercial-and-evaluation",
    mergeCells: mergeCells || [],
    // Enable additional features for better Excel compatibility
    allowInsertRow: true,
    allowInsertColumn: true,
    allowRemoveRow: true,
    allowRemoveColumn: true,
    contextMenu: true,
    manualColumnResize: true,
    manualRowResize: true,
    manualColumnMove: true,
    manualRowMove: true,
    // Set column widths - first three columns wider
    colWidths: function(col) {
      if (col < 3) {
        return 150; // First three columns (A, B, C) are wider
      }
      return 100; // Rest of the columns use default width
    },
    // Set default row height
    rowHeights: 23,
    // Enable scrolling
    scrollbarV: true,
    scrollbarH: true,
    // Virtual scrolling for better performance
    virtualScrolling: true,
    // Enable multiple selection for better PDF export
    selectionMode: "multiple",
    outsideClickDeselects: false,
    // Column headers like Excel (A, B, C, etc.)
    colHeaders: function(col) {
      let result = '';
      let num = col;
      while (num >= 0) {
        result = String.fromCharCode(65 + (num % 26)) + result;
        num = Math.floor(num / 26) - 1;
      }
      return result;
    },

    // Ensure proper rendering of merged cells
    afterChange: function (changes, source) {
      if (source === 'loadData') {
        return;
      }
    },
    // Better cell rendering
    cells: function (row, col) {
      const cellProperties = {};
      
      // Find if this cell is part of a merged cell
      if (mergeCells && mergeCells.length > 0) {
        for (let merge of mergeCells) {
          if (row >= merge.row && row < merge.row + merge.rowspan &&
              col >= merge.col && col < merge.col + merge.colspan) {
            // This cell is part of a merged area
            if (row === merge.row && col === merge.col) {
              // This is the master cell of the merge
              cellProperties.className = 'merged-cell-master';
            } else {
              // This is a slave cell of the merge
              cellProperties.className = 'merged-cell-slave';
            }
          }
        }
      }
      
      return cellProperties;
    }
  };

  return (
    <div style={{ 
      width: "100vw", 
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "1rem 2rem",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        flexShrink: 0,
        height: "80px"
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>
            📊 {fileName ? `Excel Spreadsheet: ${fileName}` : 'Basic Spreadsheet'}
          </h2>
          {fileName && (
            <p style={{ color: "#6b7280", margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>
              {mergeCells && mergeCells.length > 0 && `${mergeCells.length} merged cells detected`}
            </p>
          )}
        </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={saveSelectedToPDF}
            style={{
              background: "linear-gradient(135deg, #059669, #047857)",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(5, 150, 105, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(5, 150, 105, 0.3)";
            }}
          >
            💾 Save as PDF
          </button>
          <button
            onClick={onUploadNew}
            style={{
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
            }}
          >
            📤 Upload New File
          </button>
        </div>
      </div>
      
      <div style={{ 
        flex: 1,
        width: "100%",
        overflow: "hidden",
        position: "relative"
      }}>
        <HotTable ref={hotRef} {...tableSettings} />
      </div>
    </div>
  );
};

export default Spreadsheet;
