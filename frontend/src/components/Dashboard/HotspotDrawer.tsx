import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Flame,
  Factory,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
  TrendingUp,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  FileText,
  History,
  Shield,
  Download,
  Satellite,
  GitCompare,
  AlertTriangle,
  Info,
  HelpCircle
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Hotspot, TimelineEvent, MultiSatelliteCorrelation, SimilarEvent } from '../../types';
import { apiService } from '../../services/api';
import { EvidenceBadge } from './EvidenceBadge';

interface Props {
  hotspot: Hotspot | null;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

export const HotspotDrawer: React.FC<Props> = ({ hotspot, onClose, onReviewSubmitted }) => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const userRole = (role || '').toLowerCase();
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'correlation' | 'similar' | 'timeline' | 'provenance' | 'report' | 'review'>('overview');
  const [historyData, setHistoryData] = useState<any>(null);
  const [imageryData, setImageryData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [multiSatData, setMultiSatData] = useState<MultiSatelliteCorrelation | null>(null);
  const [similarEvents, setSimilarEvents] = useState<SimilarEvent[]>([]);
  const [whyNoAlert, setWhyNoAlert] = useState<any>(null);

  const [reviewStatus, setReviewStatus] = useState('Confirmed');
  const [reviewClass, setReviewClass] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (hotspot) {
      setReviewClass(hotspot.classification?.probable_classification || 'Industrial Fire');
      setReviewSuccess(null);
      setReviewError(null);
      apiService.getHotspotHistory(hotspot.hotspot_id).then(setHistoryData).catch(console.error);
      apiService.getHotspotImagery(hotspot.hotspot_id).then(setImageryData).catch(console.error);
      apiService.getHotspotTimeline(hotspot.hotspot_id).then(setTimelineData).catch(console.error);
      apiService.getHotspotReport(hotspot.hotspot_id).then(setReportData).catch(console.error);
      apiService.getMultiSatelliteCorrelation(hotspot.hotspot_id).then(setMultiSatData).catch(console.error);
      apiService.getSimilarEvents(hotspot.hotspot_id).then(setSimilarEvents).catch(console.error);
      apiService.getWhyNoAlert(hotspot.hotspot_id).then(setWhyNoAlert).catch(console.error);
    }
  }, [hotspot]);

  if (!hotspot) return null;

  const cls = hotspot.classification;
  const ev = cls?.evidence;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewSuccess(null);
    setReviewError(null);
    try {
      await apiService.submitReview({
        hotspot_id: hotspot.hotspot_id,
        analyst_classification: reviewClass || 'Industrial Fire',
        analyst_notes: reviewNotes,
        analyst_status: reviewStatus
      });
      setReviewSuccess('Analyst review decision recorded successfully.');
      setReviewNotes('');
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Failed to submit review.';
      setReviewError(errMsg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[580px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl z-[500] flex flex-col overflow-hidden transition-colors duration-200">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
        <div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
            Consolidated Incident Intelligence Workspace
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Event ID: {hotspot.hotspot_id.substring(0, 16)}...</span>
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Classification Header Card */}
      <div className="p-4 bg-slate-50/50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <EvidenceBadge
            classification={cls?.probable_classification || 'Unknown'}
            confidenceLevel={cls?.confidence_level}
            confidenceScore={cls?.confidence_score}
          />
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
            Mode: {cls?.classification_mode || 'Evidence-based'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Nearest Infrastructure</span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {cls?.nearest_facility_name || 'Exact industrial facility not identified'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Distance</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {cls?.distance_to_nearest_facility_km !== undefined && cls?.distance_to_nearest_facility_km !== null
                ? `${cls.distance_to_nearest_facility_km.toFixed(2)} km`
                : 'Unavailable'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => {
              if (hotspot && hotspot.latitude && hotspot.longitude) {
                onClose();
                const ev = new CustomEvent('locate_hotspot', { detail: hotspot });
                window.dispatchEvent(ev);
                navigate('/map', {
                  state: {
                    selectedHotspot: hotspot,
                    locateAnomaly: true,
                    timestamp: Date.now()
                  }
                });
              }
            }}
            className="flex items-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Locate Anomaly on Map</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-2 text-xs font-semibold text-slate-600 dark:text-slate-400 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition ${
            activeTab === 'overview' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition ${
            activeTab === 'evidence' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Evidence
        </button>
        <button
          onClick={() => setActiveTab('correlation')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition ${
            activeTab === 'correlation' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Multi-Satellite
        </button>
        <button
          onClick={() => setActiveTab('similar')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition ${
            activeTab === 'similar' ? 'border-amber-500 text-amber-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Similar Events
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition ${
            activeTab === 'timeline' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab('provenance')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition ${
            activeTab === 'provenance' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Provenance
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition ${
            activeTab === 'report' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Report
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition ${
            activeTab === 'review' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Review
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 space-y-6 flex-1 min-h-0 custom-scrollbar overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Why Flagged / Why No Alert Callout */}
            {whyNoAlert && (
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                whyNoAlert.alert_status === 'ACTIVE_ALERT'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px]">
                  {whyNoAlert.alert_status === 'ACTIVE_ALERT' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                      <span className="text-amber-600 dark:text-amber-400">Why Flagged for Investigation?</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                      <span className="text-blue-600 dark:text-blue-400">Why No Alert Flagged?</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">{whyNoAlert.summary_explanation}</p>
                {whyNoAlert.contributing_factors && whyNoAlert.contributing_factors.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                    {whyNoAlert.contributing_factors.map((factor: string, i: number) => (
                      <li key={i}>{factor}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Raw Satellite Measurements */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Raw Satellite Measurement (NASA FIRMS)</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Source Dataset</span>
                  <p className="font-mono font-medium text-slate-900 dark:text-slate-200">
                    {hotspot.source_dataset || 'NASA FIRMS'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Latitude / Longitude</span>
                  <p className="font-mono font-medium text-slate-900 dark:text-slate-200">
                    {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Acquisition Date / Time</span>
                  <p className="font-mono font-medium text-slate-900 dark:text-slate-200">
                    {new Date(hotspot.acquisition_datetime).toUTCString()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Fire Radiative Power (FRP)</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400">{hotspot.frp ? `${hotspot.frp} MW` : 'Unavailable'}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Brightness Ti4 / Ti5</span>
                  <p className="font-mono font-medium text-slate-900 dark:text-slate-200">
                    {hotspot.brightness_ti4 ? `${hotspot.brightness_ti4} K` : 'Unavailable'} / {hotspot.brightness_ti5 ? `${hotspot.brightness_ti5} K` : 'Unavailable'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Satellite / Instrument</span>
                  <p className="font-medium text-slate-900 dark:text-slate-200">
                    {hotspot.satellite || 'Unavailable'} ({hotspot.instrument || 'VIIRS'})
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">NASA Source Detection Confidence</span>
                  <p className="font-medium text-slate-900 dark:text-slate-200">{hotspot.confidence || 'Unavailable'}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Day / Night Indicator</span>
                  <p className="font-medium text-slate-900 dark:text-slate-200">{hotspot.daynight === 'N' ? 'Night (N)' : hotspot.daynight === 'D' ? 'Day (D)' : 'Unavailable'}</p>
                </div>
              </div>
            </div>

            {/* Geospatial Context */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Factory className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span>Derived Industrial & Land Context</span>
              </h3>
              <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
                  <span className="text-slate-600 dark:text-slate-400">Land Cover Class</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200 uppercase">
                    {hotspot.land_context?.land_cover_class || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
                  <span className="text-slate-600 dark:text-slate-400">Facilities Within 1 km / 5 km / 10 km</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200">
                    {cls?.facilities_within_1km || 0} / {cls?.facilities_within_5km || 0} / {cls?.facilities_within_10km || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Land Cover Provenance</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {hotspot.land_context?.source || 'Copernicus & OSM Registry'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Supporting Classification Evidence</span>
              </h4>
              <ul className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {ev?.supporting_evidence && ev.supporting_evidence.length > 0 ? (
                  ev.supporting_evidence.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-slate-800 dark:text-slate-300">
                      <span className="text-emerald-600 dark:text-emerald-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 dark:text-slate-400">No supporting evidence recorded.</li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <XCircle className="w-4 h-4" />
                <span>Contradictory / Uncertainty Factors</span>
              </h4>
              <ul className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {ev?.contradictory_evidence && ev.contradictory_evidence.length > 0 ? (
                  ev.contradictory_evidence.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-slate-800 dark:text-slate-300">
                      <span className="text-amber-600 dark:text-amber-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 dark:text-slate-400">No contradictory factors detected.</li>
                )}
              </ul>
            </div>

            {historyData?.history && historyData.history.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span>Cluster FRP Timeline & Baseline</span>
                </h4>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData.history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-slate-800" />
                      <XAxis dataKey="acquisition_datetime" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} label={{ value: 'FRP (MW)', angle: -90, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', color: '#f8fafc' }} />
                      <Line type="monotone" dataKey="frp" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Multi-Satellite Correlation Tab */}
        {activeTab === 'correlation' && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Satellite className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Multi-Satellite Correlation Evidence</span>
            </h4>

            {multiSatData ? (
              <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Correlation Strength</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      multiSatData.correlation_strength === 'Strong'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                        : multiSatData.correlation_strength === 'Moderate'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                    }`}>
                      {multiSatData.correlation_strength} Correlation
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-800 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800/80 pt-2">
                    {multiSatData.summary_wording}
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-semibold text-slate-700 dark:text-slate-400 text-[11px] uppercase">
                    Correlated Satellite Observations ({multiSatData.supporting_observations})
                  </h5>
                  {multiSatData.correlated_observations.length > 0 ? (
                    multiSatData.correlated_observations.map((c) => (
                      <div key={c.hotspot_id} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{c.satellite} ({c.instrument})</span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {new Date(c.acquisition_datetime).toUTCString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-amber-600 dark:text-amber-400">{c.frp ? `${c.frp} MW` : 'N/A'}</span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400">{c.distance_km} km away</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-500 dark:text-slate-400 text-xs">
                      No matching multi-satellite cross-track observations in 12h window
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">Loading satellite correlation...</div>
            )}
          </div>
        )}

        {/* Similar Historical Events Tab */}
        {activeTab === 'similar' && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <GitCompare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Similar Historical Anomaly Events</span>
            </h4>

            {similarEvents.length > 0 ? (
              <div className="space-y-2.5">
                {similarEvents.map((sim) => (
                  <div key={sim.hotspot_id} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-slate-200">{sim.classification}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{sim.frp.toFixed(1)} MW</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>Dist: {sim.distance_km} km</span>
                      <span>Priority: {sim.priority}</span>
                      <span>Status: {sim.final_status}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 italic pt-1 border-t border-slate-200 dark:border-slate-800/60">
                      "{sim.similarity_explanation}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-center">
                No similar historical observations found in the dataset.
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <History className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Event Audit & Chronological Timeline</span>
            </h4>
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 pl-6">
              {timelineData.map((t, idx) => (
                <div key={idx} className="relative bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="absolute -left-6 top-3.5 w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 border border-white dark:border-slate-900" />
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px]">
                    <span className="font-mono">{new Date(t.timestamp).toLocaleString()}</span>
                    <span className="uppercase font-semibold text-cyan-600 dark:text-cyan-400">{t.event_type}</span>
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">{t.title}</h5>
                  <p className="text-slate-700 dark:text-slate-300 text-xs">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'provenance' && (
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Data Provenance & Traceability Matrix</span>
            </h4>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Satellite Acquisition Time:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{new Date(hotspot.acquisition_datetime).toUTCString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">System Ingestion Time:</span>
                <span className="font-mono text-slate-900 dark:text-slate-200">{new Date(hotspot.created_at).toUTCString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Thermal Data Source:</span>
                <span className="font-mono text-slate-900 dark:text-slate-200">NASA FIRMS API ({hotspot.source_dataset})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Raw SHA-256 Record Hash:</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">{hotspot.deduplication_hash.substring(0, 20)}...</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Industrial Facility Source:</span>
                <span className="text-slate-900 dark:text-slate-200">OpenStreetMap & Global Energy Infrastructure Registry</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Land Cover Context Source:</span>
                <span className="text-slate-900 dark:text-slate-200">{hotspot.land_context?.source || 'Copernicus Land Registry'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Classification Model Mode:</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{cls?.classification_mode || 'Evidence Engine v1.0'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Investigation Briefing Report</span>
              </h4>
              <button
                onClick={handlePrintReport}
                className="flex items-center space-x-1 bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1 rounded text-xs transition font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print PDF Brief</span>
              </button>
            </div>

            {reportData ? (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-[11px] text-slate-800 dark:text-slate-300">
                <div className="text-center font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-200 dark:border-slate-800 pb-2">
                  {reportData.report_title}
                </div>
                <div className="space-y-1">
                  <p><span className="text-slate-500 dark:text-slate-500">Event ID:</span> {reportData.event_summary.hotspot_id}</p>
                  <p><span className="text-slate-500 dark:text-slate-500">Coordinates:</span> {reportData.event_summary.coordinates}</p>
                  <p><span className="text-slate-500 dark:text-slate-500">Radiative Power:</span> {reportData.event_summary.frp}</p>
                  <p><span className="text-slate-500 dark:text-slate-500">Priority:</span> {reportData.investigation_priority.priority_level}</p>
                  <p><span className="text-slate-500 dark:text-slate-500">Classification:</span> {reportData.classification.probable_classification}</p>
                  <p><span className="text-slate-500 dark:text-slate-500">Nearest Facility:</span> {reportData.industrial_context.nearest_facility_name} ({reportData.industrial_context.distance_km})</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">Loading report briefing...</div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          (userRole === 'user' || userRole === 'authority') ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Read-Only Oversight & Compliance Mode</span>
              </div>
              <p>
                Analyst review submission is restricted to operational Analyst and Admin accounts. Authority and public users can explore evidence, multi-satellite correlation, and system-generated intelligence.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Human-in-the-Loop Analyst Review</span>
              </h4>

              {reviewSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  {reviewSuccess}
                </div>
              )}

              {reviewError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                  {reviewError}
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1">Original Model Prediction</label>
                <input
                  type="text"
                  disabled
                  value={cls?.probable_classification || 'Unknown'}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-700 dark:text-slate-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1">Analyst Verified Classification</label>
                <select
                  value={reviewClass}
                  onChange={(e) => setReviewClass(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                >
                  {reviewClass && !['Industrial Fire', 'Persistent Gas Flare', 'Industrial/Mining Thermal Activity', 'Wildfire', 'Crop Burning', 'Other Thermal Source', 'Unknown / Needs Analyst Review'].includes(reviewClass) && (
                    <option value={reviewClass}>{reviewClass}</option>
                  )}
                  <option value="Industrial Fire">Industrial Fire Candidate</option>
                  <option value="Persistent Gas Flare">Persistent Gas Flare</option>
                  <option value="Industrial/Mining Thermal Activity">Industrial/Mining Thermal Activity</option>
                  <option value="Wildfire">Wildfire</option>
                  <option value="Crop Burning">Crop Burning</option>
                  <option value="Other Thermal Source">Other Thermal Source</option>
                  <option value="Unknown / Needs Analyst Review">Unknown / Needs Analyst Review</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1">Review Outcome Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Confirmed">Confirmed Model Output</option>
                  <option value="Changed">Overridden / Changed Classification</option>
                  <option value="Marked Uncertain">Marked Uncertain / Low Evidence</option>
                  <option value="Field Verification Requested">Field Verification Requested</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 mb-1">Analyst Notes & Audit Context</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter justification, satellite imagery observations, or field report notes..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submittingReview ? 'Submitting Review...' : 'Submit Analyst Decision'}</span>
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
};
