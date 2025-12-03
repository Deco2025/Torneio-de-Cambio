
import React from 'react';
import { KnockoutStage } from '../types';
import MatchCard from './MatchCard';

interface BracketViewProps {
  data: KnockoutStage;
}

const BracketView: React.FC<BracketViewProps> = ({ data }) => {
  return (
    <div className="p-4 overflow-x-auto pb-4">
      <div className="min-w-[900px] flex justify-between gap-8">
        
        {/* Quartas */}
        <div className="flex-1 flex flex-col justify-around gap-8">
          <h3 className="text-center font-bold text-slate-500 uppercase tracking-widest text-sm mb-4">Quartas de Final</h3>
          {data.quartas.map((match) => (
             <div key={match.id} className="relative">
                <MatchCard match={match} type="knockout" />
                {/* Connector Line to Right */}
                <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-slate-300 hidden md:block"></div>
             </div>
          ))}
        </div>

        {/* Semis */}
        <div className="flex-1 flex flex-col justify-around gap-16 py-12">
          <h3 className="text-center font-bold text-slate-500 uppercase tracking-widest text-sm mb-4">Semifinal</h3>
           {data.semis.map((match) => (
             <div key={match.id} className="relative">
                 {/* Connector Line from Left */}
                <div className="absolute top-1/2 -left-8 w-8 h-0.5 bg-slate-300 hidden md:block"></div>
                <MatchCard match={match} type="knockout" />
                 {/* Connector Line to Right */}
                <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-slate-300 hidden md:block"></div>
             </div>
          ))}
        </div>

        {/* Final & 3rd Place */}
        <div className="flex-1 flex flex-col justify-center gap-12 py-12">
          
          {/* Final */}
          <div>
            <h3 className="text-center font-bold text-amber-500 uppercase tracking-widest text-sm mb-4">Grande Final</h3>
            {data.final.map((match) => (
               <div key={match.id} className="relative transform scale-105">
                   {/* Connector Line from Left */}
                  <div className="absolute top-1/2 -left-8 w-8 h-0.5 bg-slate-300 hidden md:block"></div>
                  <div className="ring-4 ring-amber-100 rounded-xl shadow-lg">
                    <MatchCard match={match} type="knockout" />
                  </div>
               </div>
            ))}
          </div>

          {/* 3rd Place */}
          {data.terceiro_lugar && data.terceiro_lugar.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-200 border-dashed">
              <h3 className="text-center font-bold text-slate-400 uppercase tracking-widest text-xs mb-4">Disputa de 3º Lugar</h3>
              {data.terceiro_lugar.map((match) => (
                 <div key={match.id} className="relative opacity-90">
                    <MatchCard match={match} type="knockout" />
                 </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default BracketView;
