import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { AuthoritySummary, Hotspot, IndustrialFacility } from '../types';

interface GenerateReportOptions {
  summary: AuthoritySummary | null;
  hotspots: Hotspot[];
  industrialSites: IndustrialFacility[];
}

// Safely format dates without crashing on invalid or missing timestamps
const formatDateSafe = (val: any, fallback = 'Unavailable'): string => {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fallback;
  }
};

// Safely format finite numeric values
const formatNumSafe = (val: any, decimals = 1, fallback = 'N/A'): string => {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num.toFixed(decimals) : fallback;
};

// Ensure text is safe for jsPDF standard Helvetica font (strips unsupported non-ASCII chars)
const sanitizePdfText = (val: any, fallback = 'Unavailable'): string => {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  if (!str) return fallback;
  const cleaned = str.replace(/[^\x00-\x7F]/g, '').trim();
  return cleaned || fallback;
};

export const generateAuthorityPdfReport = async ({
  summary,
  hotspots,
  industrialSites,
}: GenerateReportOptions): Promise<void> => {
  const jsPDFConstructor =
    typeof jsPDF === 'function'
      ? jsPDF
      : (jsPDF as any)?.jsPDF || (jsPDF as any)?.default;

  const autoTableFn =
    typeof autoTable === 'function'
      ? autoTable
      : (autoTable as any)?.default || (autoTable as any)?.autoTable;

  const doc = new jsPDFConstructor({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal?.pageSize?.getWidth ? doc.internal.pageSize.getWidth() : doc.internal.pageSize.width || 210;
  const pageHeight = doc.internal?.pageSize?.getHeight ? doc.internal.pageSize.getHeight() : doc.internal.pageSize.height || 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // 1. ACCENT TOP BANNER
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(217, 119, 6); // amber-600 accent bar
  doc.rect(0, 5, pageWidth / 2, 1.5, 'F');
  doc.setFillColor(8, 145, 178); // cyan-600 accent bar
  doc.rect(pageWidth / 2, 5, pageWidth / 2, 1.5, 'F');

  currentY = 16;

  // 2. DOCUMENT HEADER & BRANDING BLOCK
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('ThermalTrace AI', margin, currentY);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text('REGULATORY AUTHORITY MONITORING REPORT', margin, currentY + 6);

  // Top Right Metadata Box
  const genTimestamp = formatDateSafe(new Date());

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const metaLines = [
    `Project Identifier: SIH26162`,
    `Report Generated: ${genTimestamp}`,
    `Data Sources: NASA FIRMS VIIRS (NOAA-20 / NOAA-21)`,
  ];
  let metaY = currentY;
  metaLines.forEach((line) => {
    doc.text(line, pageWidth - margin, metaY, { align: 'right' });
    metaY += 4.5;
  });

  currentY += 14;

  // Horizontal divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 3. EXECUTIVE OVERVIEW KPI SUMMARY CARDS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTIVE SUMMARY & TELEMETRY OVERVIEW', margin, currentY);
  currentY += 5;

  // Compute metrics strictly from real data with null safety
  const totalAlerts = typeof summary?.total_alerts === 'number' ? summary.total_alerts : 0;
  const criticalCount = typeof summary?.critical_priority === 'number' ? summary.critical_priority : 0;
  const highCount = typeof summary?.high_priority === 'number' ? summary.high_priority : 0;
  const highCriticalTotal = criticalCount + highCount;
  const investigatingCount = typeof summary?.investigating_cases === 'number' ? summary.investigating_cases : 0;
  const resolvedCount = typeof summary?.resolved_cases === 'number' ? summary.resolved_cases : 0;

  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cardHeight = 18;

  const kpis = [
    { label: 'TOTAL THERMAL ALERTS', value: totalAlerts.toString(), color: [15, 23, 42] },
    { label: 'HIGH / CRITICAL PRIORITY', value: highCriticalTotal.toString(), color: [220, 38, 38] },
    { label: 'ACTIVE INVESTIGATIONS', value: investigatingCount.toString(), color: [217, 119, 6] },
    { label: 'RESOLVED & VERIFIED', value: resolvedCount.toString(), color: [16, 185, 129] },
  ];

  kpis.forEach((kpi, index) => {
    const x = margin + index * (cardWidth + cardGap);
    // Background fill
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, currentY + 7);

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.label, x + 3, currentY + 13);
  });

  currentY += cardHeight + 8;

  // 4. THERMAL INTELLIGENCE SUMMARY BLOCK
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. THERMAL INTELLIGENCE & INFRASTRUCTURE SUMMARY', margin, currentY);
  currentY += 5;

  const safeSites = Array.isArray(industrialSites) ? industrialSites : [];
  const safeHotspots = Array.isArray(hotspots) ? hotspots : [];

  const monitoredFacilityCount = safeSites.length;
  const totalHotspotsCount = safeHotspots.length;

  let avgFrpDisplay = 'N/A';
  if (safeHotspots.length > 0) {
    const validFrps = safeHotspots.filter((h) => typeof h?.frp === 'number' && Number.isFinite(h.frp) && h.frp > 0);
    if (validFrps.length > 0) {
      const avg = validFrps.reduce((acc, h) => acc + (h.frp || 0), 0) / validFrps.length;
      avgFrpDisplay = `${formatNumSafe(avg, 1)} MW`;
    }
  }

  const pipelineStatus = summary?.last_update ? 'LIVE TELEMETRY ACTIVE' : 'OPERATIONAL';

  const summaryItems = [
    ['Monitored Industrial Facilities:', `${monitoredFacilityCount} Verified Sites`],
    ['Active Satellite Hotspots (24h Window):', `${totalHotspotsCount} Observations`],
    ['Mean Radiative Power (Average FRP):', avgFrpDisplay],
    ['Data Pipeline Telemetry Status:', pipelineStatus],
  ];

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  const summaryBlockHeight = 22;
  doc.roundedRect(margin, currentY, contentWidth, summaryBlockHeight, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  let itemY = currentY + 5;
  summaryItems.forEach(([label, val], idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const xLabel = margin + 4 + col * (contentWidth / 2);
    const yPos = itemY + row * 8;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label, xLabel, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val, xLabel + 55, yPos);
  });

  currentY += summaryBlockHeight + 8;

  // 5. RECENT THERMAL INCIDENTS & OBSERVATIONS TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. PRIORITY THERMAL INCIDENTS & OBSERVATIONS', margin, currentY);
  currentY += 4;

  let tableData: string[][] = [];
  const priorityIncidents = Array.isArray(summary?.priority_incidents) ? summary!.priority_incidents : [];

  if (priorityIncidents.length > 0) {
    tableData = priorityIncidents.map((item) => {
      const id = sanitizePdfText(item.event_id || item.alert_id || item.hotspot_id, 'N/A');
      const loc = sanitizePdfText(item.location, 'Industrial Area');
      const frpStr = item.frp ? (String(item.frp).includes('MW') ? String(item.frp) : `${item.frp} MW`) : 'N/A';
      const cls = sanitizePdfText(item.classification, 'Thermal Activity');
      const priority = sanitizePdfText(item.priority, 'MEDIUM').toUpperCase();
      const acqTime = formatDateSafe(item.created_at);
      return [id, loc, frpStr, cls, priority, acqTime];
    });
  } else if (safeHotspots.length > 0) {
    tableData = safeHotspots.slice(0, 15).map((h) => {
      const rawId = h.hotspot_id ? `HS-${String(h.hotspot_id).substring(0, 8).toUpperCase()}` : 'HS-OBSERVATION';
      const id = sanitizePdfText(rawId, 'HS-OBSERVATION');

      let rawLoc = 'Industrial Area';
      if (h.classification?.nearest_facility_name) {
        rawLoc = h.classification.nearest_facility_name;
      } else if (typeof h.latitude === 'number' && typeof h.longitude === 'number') {
        rawLoc = `${formatNumSafe(h.latitude, 2)}° N, ${formatNumSafe(h.longitude, 2)}° E`;
      }
      const loc = sanitizePdfText(rawLoc, 'Industrial Area');

      const frpStr = typeof h.frp === 'number' ? `${formatNumSafe(h.frp, 1)} MW` : 'N/A';
      const cls = sanitizePdfText(h.classification?.probable_classification, 'Thermal Hotspot');
      const priority = typeof h.frp === 'number' && h.frp > 45 ? 'HIGH' : typeof h.frp === 'number' && h.frp > 15 ? 'MEDIUM' : 'LOW';
      const acqTime = formatDateSafe(h.acquisition_datetime);
      return [id, loc, frpStr, cls, priority, acqTime];
    });
  }

  let table1FinalY: number | undefined = undefined;

  if (tableData.length === 0) {
    autoTableFn(doc, {
      startY: currentY,
      head: [['Incident / Observation ID', 'Location / Facility', 'FRP (MW)', 'Classification', 'Priority', 'Acquisition Time']],
      body: [['No matching thermal activity records are currently available.', '', '', '', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [71, 85, 105] },
      margin: { left: margin, right: margin },
      didDrawPage: (data: any) => {
        if (typeof data.cursor?.y === 'number') {
          table1FinalY = data.cursor.y;
        } else if (typeof data.table?.finalY === 'number') {
          table1FinalY = data.table.finalY;
        }
      },
    });
  } else {
    autoTableFn(doc, {
      startY: currentY,
      head: [['Incident / Observation ID', 'Location / Facility', 'FRP (MW)', 'Classification', 'Priority', 'Acquisition Time']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold' },
        1: { cellWidth: 46 },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 32 },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 28 },
      },
      margin: { left: margin, right: margin, bottom: 20 },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = String(data.cell.raw || '').toUpperCase();
          if (val === 'CRITICAL' || val === 'HIGH') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'MEDIUM') {
            data.cell.styles.textColor = [217, 119, 6];
          }
        }
      },
      didDrawPage: (data: any) => {
        if (typeof data.cursor?.y === 'number') {
          table1FinalY = data.cursor.y;
        } else if (typeof data.table?.finalY === 'number') {
          table1FinalY = data.table.finalY;
        }
      },
    });
  }

  const derivedTable1Y = typeof table1FinalY === 'number' && Number.isFinite(table1FinalY) ? table1FinalY : currentY + 35;
  currentY = derivedTable1Y + 8;

  // 6. REGULATORY AUDIT TRAIL SECTION
  const auditLogs = Array.isArray(summary?.audit_trail) ? summary!.audit_trail : [];
  if (currentY + 35 > pageHeight - 20) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('4. REGULATORY AUDIT TRAIL & SYSTEM LOGS', margin, currentY);
  currentY += 4;

  let table2FinalY: number | undefined = undefined;

  if (auditLogs.length === 0) {
    autoTableFn(doc, {
      startY: currentY,
      head: [['Timestamp', 'Action / Event', 'Actor / User', 'Entity Ref']],
      body: [['No regulatory audit trail entries recorded.', '', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [71, 85, 105] },
      margin: { left: margin, right: margin },
      didDrawPage: (data: any) => {
        if (typeof data.cursor?.y === 'number') {
          table2FinalY = data.cursor.y;
        } else if (typeof data.table?.finalY === 'number') {
          table2FinalY = data.table.finalY;
        }
      },
    });
  } else {
    const auditTableData = auditLogs.slice(0, 10).map((log) => [
      formatDateSafe(log.timestamp),
      sanitizePdfText(log.action, 'Audit Record'),
      sanitizePdfText(log.actor_email, 'System Authority'),
      log.entity_id ? `#${sanitizePdfText(String(log.entity_id).substring(0, 8), 'REF')}` : 'N/A',
    ]);

    autoTableFn(doc, {
      startY: currentY,
      head: [['Timestamp', 'Action / Event', 'Actor / User', 'Entity Ref']],
      body: auditTableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 65 },
        2: { cellWidth: 50 },
        3: { cellWidth: 32 },
      },
      margin: { left: margin, right: margin, bottom: 20 },
      didDrawPage: (data: any) => {
        if (typeof data.cursor?.y === 'number') {
          table2FinalY = data.cursor.y;
        } else if (typeof data.table?.finalY === 'number') {
          table2FinalY = data.table.finalY;
        }
      },
    });
  }

  const derivedTable2Y = typeof table2FinalY === 'number' && Number.isFinite(table2FinalY) ? table2FinalY : currentY + 30;
  currentY = derivedTable2Y + 8;

  // 7. REGIONAL INFRASTRUCTURE & GEOGRAPHIC COVERAGE SECTION (Textual Overview)
  if (currentY + 25 > pageHeight - 20) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('5. REGIONAL INFRASTRUCTURE & GEOGRAPHIC COVERAGE', margin, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const geoText = `ThermalTrace AI monitors ${safeSites.length} registered industrial facilities across Indian regulatory zones. Real-time satellite swaths from VIIRS (NOAA-20 / NOAA-21) provide thermal anomaly surveillance across national administrative boundaries. Note: Map canvas rendering is omitted from static PDF exports in compliance with secure tile streaming protocols.`;
  const splitGeoText = doc.splitTextToSize(geoText, contentWidth);
  doc.text(splitGeoText, margin, currentY);
  currentY += splitGeoText.length * 4.5 + 6;

  // 8. MULTI-PAGE FOOTER & RUNNING HEADER
  const getPageCount = (): number => {
    if (typeof (doc.internal as any)?.getNumberOfPages === 'function') {
      return (doc.internal as any).getNumberOfPages();
    }
    if (typeof (doc as any).getNumberOfPages === 'function') {
      return (doc as any).getNumberOfPages();
    }
    return 1;
  };

  const totalPages = getPageCount();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header for pages > 1
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('ThermalTrace AI • Regulatory Authority Monitoring Report (SIH26162)', margin, 10);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);
    }

    // Running Footer for all pages
    const footerY = pageHeight - 10;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('ThermalTrace AI • Satellite-Based Industrial Thermal Anomaly Intelligence Platform • SIH26162', margin, footerY);

    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin, footerY, { align: 'right' });
  }

  // 9. FILE NAME GENERATION & DOWNLOAD TRIGGER
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const fileName = `ThermalTrace_Authority_Report_${year}-${month}-${day}_${hours}-${minutes}.pdf`;
  doc.save(fileName);
};
