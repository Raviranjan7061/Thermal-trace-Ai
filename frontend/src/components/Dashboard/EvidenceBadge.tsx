import React from 'react';
import { ShieldAlert, Flame, Factory, TreePine, Wheat, AlertCircle, HelpCircle } from 'lucide-react';

interface Props {
  classification: string;
  confidenceLevel?: string;
  confidenceScore?: number;
}

export const EvidenceBadge: React.FC<Props> = ({ classification, confidenceLevel, confidenceScore }) => {
  const getBadgeStyle = (cls: string) => {
    switch (cls) {
      case 'Industrial Fire':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-400',
          icon: ShieldAlert
        };
      case 'Persistent Gas Flare':
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          icon: Factory
        };
      case 'Industrial/Mining Thermal Activity':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: Factory
        };
      case 'Wildfire':
        return {
          bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
          icon: TreePine
        };
      case 'Crop Burning':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
          icon: Wheat
        };
      default:
        return {
          bg: 'bg-slate-700/30 border-slate-600/30 text-slate-300',
          icon: HelpCircle
        };
    }
  };

  const { bg, icon: Icon } = getBadgeStyle(classification);

  return (
    <div className="inline-flex items-center space-x-2">
      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${bg}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{classification}</span>
      </span>
      {confidenceScore !== undefined && (
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {(confidenceScore <= 1.0 && confidenceScore > 0 ? confidenceScore * 100 : confidenceScore).toFixed(0)}% confidence
        </span>
      )}
    </div>
  );
};
