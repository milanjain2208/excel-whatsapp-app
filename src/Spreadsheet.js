// src/Spreadsheet.js
import React, { useRef, useState, useMemo, useCallback } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from 'handsontable/registry';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import WhatsAppDropdown from './WhatsAppDropdown';

registerAllModules();

// Move outside component scope for stability
const { ipcRenderer } = window.require ? window.require('electron') : {};

const Spreadsheet = ({ data, mergeCells, fileName, onUploadNew, whatsappContacts }) => {
  const hotRef = useRef(null);
  const [dropdownConfig, setDropdownConfig] = useState(null);

  // 🔧 Fix: Memoized processed data
  const processedData = useMemo(() => {
    const rawData = data || [
      ["Name", "Age", "Country"],
      ["Milan", 26, "India"],
      ["Aditya", 25, "India"]
    ];

    const minColumns = 26;
    const minRows = 100;

    const filledRows = rawData.map(row => {
      const newRow = [...row];
      while (newRow.length < minColumns) newRow.push('');
      return newRow;
    });

    while (filledRows.length < minRows) {
      filledRows.push(new Array(minColumns).fill(''));
    }

    return filledRows;
  }, [data]);

  // 📤 Show WhatsApp dropdown at specific position
  const showWhatsAppDropdown = useCallback((row, col, cellElement) => {
    const rect = cellElement.getBoundingClientRect();
    setDropdownConfig({
      contacts: whatsappContacts || [],
      position: { 
        top: rect.bottom + window.scrollY, 
        left: rect.left + window.scrollX 
      },
      onSend: async (selectedContact) => {
        return await sendPDFToContact(selectedContact);
      },
      onClose: () => setDropdownConfig(null),
    });
  }, [whatsappContacts]);

  // 📤 Send PDF to selected contact
  const sendPDFToContact = async (selectedContact) => {
    const hot = hotRef.current?.hotInstance;
    const selected = hot?.getSelected() || [];

    if (selected.length === 0) {
      alert('Please select an area to send as PDF');
      throw new Error('No selection');
    }

    let selectedData = [];
    for (const item of selected) {
      selectedData.push(...(hot.getData(...item) || []));
    }

    const filteredData = selectedData.filter(row =>
      row.some(cell => cell !== null && cell !== undefined && cell !== '')
    );

    const pdf = new jsPDF();
    if (filteredData.length === 0) {
      pdf.text('Selected area contains no data', 14, 20);
    } else {
      const head = filteredData.length > 0 ? [filteredData[0]] : [];
      const body = filteredData.length > 1 ? filteredData.slice(1) : [];
      
      autoTable(pdf, {
        head: head,
        body: body,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        tableLineColor: [229, 231, 235],
        tableLineWidth: 0.5,
      });
    }

    const fileName = `${filteredData?.[0]?.[0] || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`;
    const bufferArray = Array.from(new Uint8Array(pdf.output('arraybuffer')));

    if (ipcRenderer) {
      const result = await ipcRenderer.invoke('send-pdf', {
        contactId: selectedContact.id,
        pdfBuffer: bufferArray,
        fileName
      });

      if (result.success) {
        alert(`PDF sent successfully to ${selectedContact.name}!`);
      } else {
        alert(`Failed to send PDF: ${result.error}`);
        throw new Error(result.error);
      }
    } else {
      alert('WhatsApp is not available in this environment');
      throw new Error('WhatsApp not available');
    }
  };

  // 🔁 Memoize table settings to avoid unnecessary re-renders
  const tableSettings = useMemo(() => ({
    data: processedData,
    rowHeaders: true,
    width: "100%",
    height: "calc(100vh - 120px)",
    stretchH: "none",
    licenseKey: "non-commercial-and-evaluation",
    mergeCells: mergeCells || [],
    allowInsertRow: true,
    allowInsertColumn: true,
    allowRemoveRow: true,
    allowRemoveColumn: true,
    contextMenu: {
      items: {
        send_whatsapp: {
          name: '📱 Send to WhatsApp',
          callback: (key, selection) => {
            const hot = hotRef.current?.hotInstance;
            if (hot && selection && selection.length > 0) {
              const { start } = selection[0];
              const cell = hot.getCell(start.row, start.col);
              if (cell) {
                showWhatsAppDropdown(start.row, start.col, cell);
              }
            }
          },
        },
        // '---------': '---------',
        // 'row_above': { name: 'Insert row above' },
        // 'row_below': { name: 'Insert row below' },
        // 'col_left': { name: 'Insert column left' },
        // 'col_right': { name: 'Insert column right' },
        // '---------2': '---------',
        // 'remove_row': { name: 'Remove row' },
        // 'remove_col': { name: 'Remove column' },
        // '---------3': '---------',
        // 'undo': { name: 'Undo' },
        // 'redo': { name: 'Redo' },
        // '---------4': '---------',
        // 'copy': { name: 'Copy' },
        // 'cut': { name: 'Cut' },
        // 'paste': { name: 'Paste' },
      }
    },
    manualColumnResize: true,
    manualRowResize: true,
    manualColumnMove: true,
    manualRowMove: true,
    colWidths: (col) => col < 3 ? 150 : 100,
    rowHeights: 23,
    scrollbarV: true,
    scrollbarH: true,
    virtualScrolling: true,
    selectionMode: "multiple",
    outsideClickDeselects: false,
    colHeaders: (col) => {
      let result = '';
      let num = col;
      while (num >= 0) {
        result = String.fromCharCode(65 + (num % 26)) + result;
        num = Math.floor(num / 26) - 1;
      }
      return result;
    },
    afterChange: function (changes, source) {
      if (source === 'loadData') return;
    },
    cells: function (row, col) {
      const cellProperties = {};
      if (mergeCells?.length) {
        for (let merge of mergeCells) {
          if (row >= merge.row && row < merge.row + merge.rowspan &&
              col >= merge.col && col < merge.col + merge.colspan) {
            cellProperties.className = (row === merge.row && col === merge.col)
              ? 'merged-cell-master'
              : 'merged-cell-slave';
          }
        }
      }
      return cellProperties;
    }
  }), [processedData, mergeCells, showWhatsAppDropdown]);

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
            📊 {fileName ?? 'Basic Spreadsheet'}
          </h2>
          {/* {fileName && (
            <p style={{ color: "#6b7280", margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>
              {mergeCells && mergeCells.length > 0 && `${mergeCells.length} merged cells detected`}
            </p>
          )} */}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* <div style={{ 
            fontSize: "0.9rem", 
            color: "#6b7280",
            fontStyle: "italic"
          }}>
            💡 Right-click on selected cells to send to WhatsApp
          </div> */}
          
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

      {/* WhatsApp Dropdown Portal */}
      {dropdownConfig && (
        <WhatsAppDropdown
          contacts={dropdownConfig.contacts}
          position={dropdownConfig.position}
          onSend={dropdownConfig.onSend}
          onClose={dropdownConfig.onClose}
        />
      )}
    </div>
  );
};

export default Spreadsheet;
