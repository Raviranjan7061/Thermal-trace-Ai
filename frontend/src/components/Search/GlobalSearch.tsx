import React, { useState } from 'react';
import { Search, X, Flame, Factory, AlertOctagon } from 'lucide-react';
import { apiService } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectHotspot: (id: string) => void;
}

export const GlobalSearch: React.FC<Props> = ({ isOpen, onClose, onSelectHotspot }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      const data = await apiService.globalSearch(query);
      setResults(data.results);
    } catch (err) {
      console.error('Global search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[600] flex items-start justify-center pt-20 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="p-4 bg-slate-950 border-b border-slate-800 flex items-center space-x-3">
          <Search className="w-5 h-5 text-amber-500" />
          <input
            type="text"
            autoFocus
            placeholder="Search Event ID, coordinates, industrial facility name, state..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-slate-100 text-sm placeholder-slate-500"
          />
          <button type="button" onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Results Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Searching thermal intelligence database...</div>
          ) : results ? (
            <div className="space-y-4">
              {/* Hotspots Results */}
              {results.hotspots && results.hotspots.length > 0 && (
                <div>
                  <h4 className="font-bold text-amber-400 uppercase text-[11px] mb-2 flex items-center space-x-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Thermal Hotspots ({results.hotspots.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {results.hotspots.map((h: any) => (
                      <div
                        key={h.hotspot_id}
                        onClick={() => {
                          onSelectHotspot(h.hotspot_id);
                          onClose();
                        }}
                        className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 hover:border-amber-500/50 cursor-pointer flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-mono font-semibold text-slate-200">{h.hotspot_id.substring(0, 14)}...</span>
                          <span className="text-slate-400 ml-2">({h.classification})</span>
                        </div>
                        <span className="font-bold text-amber-400">{h.frp ? `${h.frp} MW` : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities Results */}
              {results.facilities && results.facilities.length > 0 && (
                <div>
                  <h4 className="font-bold text-blue-400 uppercase text-[11px] mb-2 flex items-center space-x-1.5">
                    <Factory className="w-3.5 h-3.5" />
                    <span>Industrial Facilities ({results.facilities.length})</span>
                  </h4>
                  <div className="space-y-1">
                    {results.facilities.map((f: any) => (
                      <div
                        key={f.facility_id}
                        className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex justify-between items-center"
                      >
                        <span className="font-semibold text-slate-200">{f.name}</span>
                        <span className="text-slate-400 text-[11px] uppercase">{f.facility_type} ({f.state})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              Type at least 2 characters to search across database entities.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
