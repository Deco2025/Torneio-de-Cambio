
import React from 'react';
import { Match, KnockoutMatch } from '../types';
import { Calendar } from 'lucide-react';

interface MatchCardProps {
  match: Match | KnockoutMatch;
  type?: 'group' | 'knockout';
}

const MatchCard: React.FC<MatchCardProps> = ({ match, type = 'group' }) => {
  const isPlayed = match.placar1 !== null && match.placar1 !== '' && match.placar2 !== null && match.placar2 !== '';
  
  // Type guard to check if it's a regular group match to access date/location
  const isGroupMatch = (m: Match | KnockoutMatch): m is Match => {
    return (m as Match).chave !== undefined;
  };

  // Helper to safely get winner from either Match or KnockoutMatch
  const getWinner = () => {
    // If it's a KnockoutMatch, it might have a winner property
    if ('winner' in match && match.winner) {
      return match.winner;
    }
    
    // For Match (group) or if winner not set, calculate from scores if played
    if (isPlayed) {
      const p1 = Number(match.placar1);
      const p2 = Number(match.placar2);
      if (p1 > p2) return match.time1;
      if (p2 > p1) return match.time2;
    }
    
    return undefined;
  };

  const winner = getWinner();

  const statusColor = isPlayed 
    ? "bg-slate-100 text-slate-600" 
    : "bg-yellow-100 text-yellow-800";
    
  const statusText = isPlayed ? "Finalizado" : "Agendado";

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${winner ? 'border-yellow-400' : 'border-slate-200'}`}>
      {/* Decorative accent line */}
      <div className={`absolute top-0 left-0 w-1 h-full ${isPlayed ? (winner ? 'bg-yellow-500' : 'bg-slate-300') : 'bg-yellow-400'}`}></div>

      <div className="flex justify-between items-start mb-4 pl-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider truncate">
            {type === 'group' && isGroupMatch(match) ? `Grupo ${match.chave}` : (match as KnockoutMatch).round}
          </span>
          {isGroupMatch(match) && match.date && (
            <div className="flex items-center text-xs text-slate-500 font-medium">
              <Calendar size={12} className="mr-1" />
              {match.date}
            </div>
          )}
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2 ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <div className="flex items-center justify-between pl-3">
        {/* Team 1 */}
        <div className={`flex flex-col items-center flex-1 transition-opacity min-w-0 ${winner === match.time1 ? 'opacity-100 scale-105' : (isPlayed && winner) ? 'opacity-50 grayscale' : 'opacity-100'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 text-lg font-bold border-2 shrink-0 ${winner === match.time1 ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-slate-100 border-slate-100 text-slate-500'}`}>
             {/* Placeholder Avatar logic */}
             {match.time1.charAt(0)}
          </div>
          <span className={`text-sm text-center font-bold leading-tight w-full truncate px-1 ${winner === match.time1 ? 'text-black' : 'text-black'}`} title={match.time1}>
            {match.time1}
          </span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center mx-2 sm:mx-4 min-w-[50px] sm:min-w-[60px]">
          {isPlayed ? (
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1 sm:gap-2 whitespace-nowrap">
              <span>{match.placar1}</span>
              <span className="text-slate-300 text-lg">-</span>
              <span>{match.placar2}</span>
            </div>
          ) : (
            <span className="text-xs font-black text-slate-300 bg-slate-50 px-2 py-1 rounded">VS</span>
          )}
        </div>

        {/* Team 2 */}
        <div className={`flex flex-col items-center flex-1 transition-opacity min-w-0 ${winner === match.time2 ? 'opacity-100 scale-105' : (isPlayed && winner) ? 'opacity-50 grayscale' : 'opacity-100'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 text-lg font-bold border-2 shrink-0 ${winner === match.time2 ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-slate-100 border-slate-100 text-slate-500'}`}>
             {match.time2.charAt(0)}
          </div>
          <span className={`text-sm text-center font-bold leading-tight w-full truncate px-1 ${winner === match.time2 ? 'text-black' : 'text-black'}`} title={match.time2}>
            {match.time2}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
