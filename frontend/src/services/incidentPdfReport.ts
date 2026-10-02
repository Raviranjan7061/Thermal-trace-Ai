import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { Hotspot, TimelineEvent, MultiSatelliteCorrelation, SimilarEvent } from '../types';

interface GenerateIncidentPdfReportOptions {
  hotspot: Hotspot;
  reportData?: any;
  multiSatData?: MultiSatelliteCorrelation | null;
  historyData?: any;
  timelineData?: TimelineEvent[];
  similarEvents?: SimilarEvent[];
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

// Safely format any JavaScript value to a clean string, avoiding [object Object], undefined, null, or NaN
const safeStringify = (val: any, fallback = 'Unavailable'): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '[object Object]') return fallback;
    return trimmed;
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : fallback;
  }
  if (typeof val === 'boolean') {
    return val ? 'Yes' : 'No';
  }
  if (typeof val === 'object') {
    if (typeof val.label === 'string' && val.label.trim()) return val.label.trim();
    if (typeof val.quality === 'string' && val.quality.trim()) return val.quality.trim();
    if (typeof val.level === 'string' && val.level.trim()) return val.level.trim();
    if (typeof val.score === 'number' && Number.isFinite(val.score)) return `Score: ${val.score}`;
    if (typeof val.assessment === 'string' && val.assessment.trim()) return val.assessment.trim();
    if (Array.isArray(val)) {
      const items = val.map(v => safeStringify(v, '')).filter(b => b && b !== 'Unavailable' && b !== '[object Object]');
      return items.length > 0 ? items.join(', ') : fallback;
    }
  }
  return fallback;
};

// Ensure text is safe for jsPDF standard Helvetica font (strips unsupported non-ASCII chars)
const sanitizePdfText = (val: any, fallback = 'Unavailable'): string => {
  const str = safeStringify(val, fallback);
  if (str === fallback) return fallback;
  const cleaned = str.replace(/[^\x00-\x7F]/g, '').trim();
  return cleaned || fallback;
};

export const generateIncidentPdfReport = async ({
  hotspot,
  reportData,
  multiSatData,
  historyData,
  timelineData,
  similarEvents,
}: GenerateIncidentPdfReportOptions): Promise<void> => {
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
  doc.text('EVENT INVESTIGATION BRIEFING REPORT', margin, currentY + 6);

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

  // 3. EVENT SUMMARY & TELEMETRY CARDS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EVENT SUMMARY & TELEMETRY OVERVIEW', margin, currentY);
  currentY += 5;

  const eventIdDisplay = sanitizePdfText(hotspot.hotspot_id, 'N/A');
  const latStr = formatNumSafe(hotspot.latitude, 4);
  const lonStr = formatNumSafe(hotspot.longitude, 4);
  const coordsDisplay = `${latStr}° N, ${lonStr}° E`;
  const obsTimeDisplay = formatDateSafe(hotspot.acquisition_datetime);
  const satDisplay = sanitizePdfText(`${hotspot.satellite || 'VIIRS'} (${hotspot.instrument || 'NOAA-20/21'})`, 'VIIRS');
  const frpVal = typeof hotspot.frp === 'number' ? `${formatNumSafe(hotspot.frp, 1)} MW` : 'N/A';
  
  const cls = hotspot.classification;
  const classificationDisplay = sanitizePdfText(cls?.probable_classification || 'Thermal Activity', 'Thermal Activity');
  
  const rawPriority = reportData?.investigation_priority?.priority_level || (hotspot.frp && hotspot.frp > 45 ? 'HIGH' : hotspot.frp && hotspot.frp > 15 ? 'MEDIUM' : 'LOW');
  const priorityDisplay = sanitizePdfText(rawPriority, 'LOW').toUpperCase();

  // Strip redundant "CONFIDENCE" string if present so KPI value is clean (e.g., "MODERATE")
  const rawConfidence = sanitizePdfText(cls?.confidence_level || hotspot.confidence || 'Moderate', 'Moderate');
  const confidenceValueOnly = rawConfidence.replace(/confidence/gi, '').trim().toUpperCase() || 'MODERATE';

  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cardHeight = 18;

  const kpis = [
    { label: 'RADIATIVE POWER (FRP)', value: frpVal, color: [217, 119, 6] },
    { label: 'INVESTIGATION PRIORITY', value: priorityDisplay, color: priorityDisplay === 'HIGH' || priorityDisplay === 'CRITICAL' ? [220, 38, 38] : [15, 23, 42] },
    { label: 'CONFIDENCE LEVEL', value: confidenceValueOnly, color: [8, 145, 178] },
    { label: 'OBSERVATION SENSOR', value: satDisplay, color: [71, 85, 105] },
  ];

  kpis.forEach((kpi, index) => {
    const x = margin + index * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Dynamic font sizing based on length to prevent text clipping
    const valStr = kpi.value;
    const fontSize = valStr.length > 12 ? 8 : valStr.length > 8 ? 9.5 : 11;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSize);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(valStr, x + 3, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.label, x + 3, currentY + 13);
  });

  currentY += cardHeight + 8;

  // 4. DETAILED EVENT TELEMETRY TABLE (Uses autoTable to prevent long Event ID text overlap)
  let telemetryTableFinalY: number | undefined = undefined;

  const telemetryRows = [
    ['Event Identifier:', eventIdDisplay],
    ['Acquisition Datetime:', obsTimeDisplay],
    ['Coordinates (Lat/Lon):', coordsDisplay],
    ['Probable Classification:', classificationDisplay],
  ];

  autoTableFn(doc, {
    startY: currentY,
    head: [['Telemetry Parameter', 'Observed Telemetry']],
    body: telemetryRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 134 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data: any) => {
      if (typeof data.cursor?.y === 'number') {
        telemetryTableFinalY = data.cursor.y;
      } else if (typeof data.table?.finalY === 'number') {
        telemetryTableFinalY = data.table.finalY;
      }
    },
  });

  const derivedTelemetryY = typeof telemetryTableFinalY === 'number' && Number.isFinite(telemetryTableFinalY) ? telemetryTableFinalY : currentY + 30;
  currentY = derivedTelemetryY + 8;

  // 5. INFRASTRUCTURE & GEOGRAPHIC CONTEXT
  if (currentY + 35 > pageHeight - 20) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. INFRASTRUCTURE & GEOGRAPHIC CONTEXT', margin, currentY);
  currentY += 4;

  const nearestFacility = sanitizePdfText(cls?.nearest_facility_name || 'Exact facility not identified', 'Exact facility not identified');
  const distanceStr = cls?.distance_to_nearest_facility_km !== undefined && cls?.distance_to_nearest_facility_km !== null
    ? `${formatNumSafe(cls.distance_to_nearest_facility_km, 2)} km`
    : 'N/A';
  const facilityType = sanitizePdfText(cls?.nearest_facility_type || 'Industrial / Energy Zone', 'Industrial / Energy Zone');
  const landCover = sanitizePdfText((hotspot.land_context as any)?.land_cover_description || hotspot.land_context?.land_cover_class || 'Industrial Area / Monitored Zone', 'Industrial Area');

  const infraRows = [
    ['Nearest Facility Name:', nearestFacility],
    ['Proximity Distance:', distanceStr],
    ['Facility Type:', facilityType],
    ['Land Context:', landCover],
  ];

  let infraTableFinalY: number | undefined = undefined;

  autoTableFn(doc, {
    startY: currentY,
    head: [['Context Parameter', 'Infrastructure Telemetry']],
    body: infraRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 134 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data: any) => {
      if (typeof data.cursor?.y === 'number') {
        infraTableFinalY = data.cursor.y;
      } else if (typeof data.table?.finalY === 'number') {
        infraTableFinalY = data.table.finalY;
      }
    },
  });

  const derivedInfraY = typeof infraTableFinalY === 'number' && Number.isFinite(infraTableFinalY) ? infraTableFinalY : currentY + 30;
  currentY = derivedInfraY + 8;

  // 6. THERMAL EVIDENCE & CLASSIFICATION RATIONALE
  if (currentY + 35 > pageHeight - 20) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. THERMAL EVIDENCE & INTELLIGENCE RATIONALE', margin, currentY);
  currentY += 4;

  const evQualityRaw = (cls?.evidence as any)?.evidence_quality || reportData?.evidence_quality || 'MODERATE';
  const evQuality = sanitizePdfText(safeStringify(evQualityRaw, 'MODERATE'), 'MODERATE').toUpperCase();

  const tempPersistenceRaw = (cls?.evidence as any)?.temporal_persistence || historyData?.persistence || 'Single satellite swath observation';
  const tempPersistence = sanitizePdfText(safeStringify(tempPersistenceRaw, 'Single satellite swath observation'), 'Single satellite swath observation');

  const spatialDistRaw = (cls?.evidence as any)?.spatial_clustering || 'Localized thermal anomaly';
  const spatialDist = sanitizePdfText(safeStringify(spatialDistRaw, 'Localized thermal anomaly'), 'Localized thermal anomaly');

  const evidenceRows: string[][] = [
    ['Evidence Quality Score:', evQuality],
    ['Temporal Persistence:', tempPersistence],
    ['Spatial Clustering Rationale:', spatialDist],
  ];

  if (cls?.evidence?.supporting_evidence && Array.isArray(cls.evidence.supporting_evidence) && cls.evidence.supporting_evidence.length > 0) {
    const supportingText = cls.evidence.supporting_evidence.map(s => safeStringify(s, '')).filter(Boolean).join('; ');
    if (supportingText) {
      evidenceRows.push(['Supporting Telemetry Rationale:', sanitizePdfText(supportingText)]);
    }
  }

  let evidenceTableFinalY: number | undefined = undefined;

  autoTableFn(doc, {
    startY: currentY,
    head: [['Evidence Criteria', 'Observed Assessment']],
    body: evidenceRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 134 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data: any) => {
      if (typeof data.cursor?.y === 'number') {
        evidenceTableFinalY = data.cursor.y;
      } else if (typeof data.table?.finalY === 'number') {
        evidenceTableFinalY = data.table.finalY;
      }
    },
  });

  const derivedEvidenceY = typeof evidenceTableFinalY === 'number' && Number.isFinite(evidenceTableFinalY) ? evidenceTableFinalY : currentY + 30;
  currentY = derivedEvidenceY + 8;

  // 7. SYSTEM CLASSIFICATION DISCLAIMER BOX
  if (currentY + 25 > pageHeight - 20) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 20, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('SYSTEM CLASSIFICATION NOTICE', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  const noticeText = 'Classification is an evidence-based preliminary evaluation generated by the ThermalTrace AI rule-based intelligence engine. It represents operational oversight context and requires mandatory human analyst verification prior to regulatory enforcement action.';
  const splitNotice = doc.splitTextToSize(noticeText, contentWidth - 8);
  doc.text(splitNotice, margin + 4, currentY + 10);

  currentY += 26;

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
      doc.text(`ThermalTrace AI • Event Briefing ${eventIdDisplay} (SIH26162)`, margin, 10);
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
    doc.text('ThermalTrace AI • Satellite Thermal Intelligence Investigation Briefing • SIH26162', margin, footerY);

    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin, footerY, { align: 'right' });
  }

  // 9. FILE NAME GENERATION & DOWNLOAD TRIGGER
  const sanitizedId = eventIdDisplay.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `ThermalTrace_Incident_Brief_${sanitizedId}.pdf`;
  doc.save(fileName);
};
