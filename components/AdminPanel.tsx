
import React, { useState } from 'react';
import { TournamentData, Match, KnockoutMatch } from '../types';
import { Save, RefreshCw, Trophy, Users, AlertTriangle, ArrowRight, Play, FileDown } from 'lucide-react';
import ScoreInput from './ScoreInput';

declare const jspdf: any;

interface AdminPanelProps {
  currentData: TournamentData;
  onUpdate: (data: TournamentData) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentData, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'games' | 'finals'>('config');
  const [selectedGroupConfig, setSelectedGroupConfig] = useState<string>('A');
  const [teamsInput, setTeamsInput] = useState<string>('');
  
  // -- Helper to generate ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // --- PDF GENERATION FOR GAMES ---
  const handleDownloadGamesPDF = (groupKey: string) => {
    if (typeof jspdf === 'undefined') {
        alert('Biblioteca PDF carregando... tente novamente em instantes.');
        return;
    }
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    // Filter games
    const games = currentData.jogos.filter(j => j.chave === groupKey);
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(234, 179, 8);
    doc.text(`Torneio de Câmbio 2026`, 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Lista de Jogos - Grupo ${groupKey}`, 14, 30);
    
    // Body
    const tableColumn = ["Time 1", "Placar", "Time 2", "Status"];
    const tableRows: any[] = [];
    
    games.forEach(g => {
        const score = (g.placar1 !== '' && g.placar2 !== '') ? `${g.placar1} x ${g.placar2}` : ' x ';
        const status = (g.placar1 !== '' && g.placar2 !== '') ? 'Finalizado' : 'Agendado';
        tableRows.push([g.time1, score, g.time2, status]);
    });
    
    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        headStyles: { fillColor: [234, 179, 8], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3, halign: 'center' },
        columnStyles: {
            0: { halign: 'right', fontStyle: 'bold' },
            2: { halign: 'left', fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    
    doc.save(`Jogos_Grupo_${groupKey}.pdf`);
  };

  // --- 1. CONFIGURATION LOGIC ---
  const handleSaveTeams = () => {
    // Split by new line, trim, filter empty, take max 12
    const teams = teamsInput.split('\n').map(t => t.trim()).filter(t => t !== '').slice(0, 12);
    
    const newData = { ...currentData };
    newData.grupos[selectedGroupConfig] = teams;
    
    // Clear existing games for this group to avoid conflicts
    newData.jogos = newData.jogos.filter(j => j.chave !== selectedGroupConfig);
    
    onUpdate(newData);
    alert(`Grupo ${selectedGroupConfig} salvo com ${teams.length} times! Jogos antigos deste grupo foram limpos.`);
  };

  const handleGenerateGroupGames = (groupKey: string) => {
    const teams = currentData.grupos[groupKey];
    if (teams.length < 2) {
      alert("É necessário pelo menos 2 times para gerar jogos.");
      return;
    }

    const newGames: Match[] = [];
    // Round Robin Logic (Todos contra Todos)
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        newGames.push({
          id: generateId(),
          chave: groupKey,
          time1: teams[i],
          placar1: '', // Empty initially
          time2: teams[j],
          placar2: '', // Empty initially
          status: 'scheduled'
        });
      }
    }

    // Replace games for this group
    const otherGames = currentData.jogos.filter(j => j.chave !== groupKey);
    onUpdate({
      ...currentData,
      jogos: [...otherGames, ...newGames]
    });
    alert(`Gerados ${newGames.length} jogos para o Grupo ${groupKey}.`);
  };

  // --- 2. SCORING LOGIC ---
  const handleScoreChange = (matchId: string, team: 1 | 2, value: string) => {
    const newData = { ...currentData };
    
    // Check regular games
    const gameIndex = newData.jogos.findIndex(j => j.id === matchId);
    if (gameIndex >= 0) {
      const match = newData.jogos[gameIndex];
      if (team === 1) match.placar1 = value === '' ? '' : parseInt(value);
      if (team === 2) match.placar2 = value === '' ? '' : parseInt(value);
      match.status = (match.placar1 !== '' && match.placar2 !== '') ? 'played' : 'scheduled';
      onUpdate(newData);
      return;
    }

    // Check knockout games
    ['quartas', 'semis', 'final', 'terceiro_lugar'].forEach(stage => {
       // @ts-ignore
       const stageGames = newData.mata_mata[stage] as KnockoutMatch[];
       const kIndex = stageGames.findIndex(k => k.id === matchId);
       if(kIndex >= 0) {
           const match = stageGames[kIndex];
           if (team === 1) match.placar1 = value === '' ? '' : parseInt(value);
           if (team === 2) match.placar2 = value === '' ? '' : parseInt(value);
           
           // Determine winner immediately for UI feedback, but Logic handles propagation
           if (match.placar1 !== '' && match.placar2 !== '') {
               if(Number(match.placar1) > Number(match.placar2)) match.winner = match.time1;
               else if(Number(match.placar2) > Number(match.placar1)) match.winner = match.time2;
               else match.winner = undefined; 
           } else {
               match.winner = undefined;
           }
           onUpdate(newData);
       }
    });
  };

  // --- 3. INTELLIGENT KNOCKOUT GENERATION LOGIC ---
  
  // Helper to get team name from standings or placeholder
  const getRankedTeam = (standings: any, group: string, rankIndex: number) => {
    const rows = standings[group];
    if (rows && rows.length > rankIndex) {
      return rows[rankIndex][0]; // Return team name
    }
    return `(${rankIndex + 1}º do Grupo ${group})`;
  };

  const handleGenerateMataMataStart = () => {
    const standings = currentData.classificacao;
    
    // Count valid groups (groups with at least 2 teams)
    const validGroups = ['A', 'B', 'C', 'D'].filter(k => 
      currentData.grupos[k] && currentData.grupos[k].length >= 2
    );

    const newData = { ...currentData };
    
    // Reset knockout
    newData.mata_mata = { quartas: [], semis: [], final: [], terceiro_lugar: [] };

    // SCENARIO 1: Only A and B (Direct Semifinals)
    if (validGroups.includes('A') && validGroups.includes('B') && !validGroups.includes('C')) {
       // Logic from script: "SCENARIO 1: Apenas Chaves A e B válidas -> Joga Semifinais diretas"
       // SF1: 1ºA vs 2ºB
       // SF2: 1ºB vs 2ºA
       const sf1 = { 
         id: generateId(), round: 'semis', 
         time1: getRankedTeam(standings, 'A', 0), placar1: '', 
         time2: getRankedTeam(standings, 'B', 1), placar2: '' 
       };
       const sf2 = { 
         id: generateId(), round: 'semis', 
         time1: getRankedTeam(standings, 'B', 0), placar1: '', 
         time2: getRankedTeam(standings, 'A', 1), placar2: '' 
       };

       newData.mata_mata.semis = [sf1, sf2] as any;
       alert("Detectadas apenas Chaves A e B. Semifinais diretas geradas (1ºA x 2ºB, 1ºB x 2ºA)!");
    } 
    // SCENARIO 2: A, B, C, D (Quarterfinals)
    else if (validGroups.length >= 3) {
       // Logic from script: "SCENARIO 2: 3 ou 4 Chaves válidas -> Joga Quartas de Finais"
       // Q1: 1ºA x 2ºD
       // Q2: 1ºD x 2ºA
       // Q3: 1ºB x 2ºC
       // Q4: 1ºC x 2ºB

       const q1 = { id: generateId(), round: 'quartas', time1: getRankedTeam(standings, 'A', 0), placar1: '', time2: getRankedTeam(standings, 'D', 1), placar2: '' };
       const q2 = { id: generateId(), round: 'quartas', time1: getRankedTeam(standings, 'D', 0), placar1: '', time2: getRankedTeam(standings, 'A', 1), placar2: '' };
       const q3 = { id: generateId(), round: 'quartas', time1: getRankedTeam(standings, 'B', 0), placar1: '', time2: getRankedTeam(standings, 'C', 1), placar2: '' };
       const q4 = { id: generateId(), round: 'quartas', time1: getRankedTeam(standings, 'C', 0), placar1: '', time2: getRankedTeam(standings, 'B', 1), placar2: '' };

       newData.mata_mata.quartas = [q1, q2, q3, q4] as any;
       alert("Detectadas 3 ou 4 chaves. Quartas de Final geradas!");
    } else {
       alert("Não há chaves suficientes com times cadastrados para gerar mata-mata.");
       return;
    }

    onUpdate(newData);
  };

  const handleGenerateNextStage = () => {
      const newData = { ...currentData };
      const mm = newData.mata_mata;

      // Helper to determine winner/loser
      const getResult = (match: any) => {
          if (!match || match.placar1 === '' || match.placar2 === '') return { winner: '?', loser: '?' };
          const p1 = Number(match.placar1);
          const p2 = Number(match.placar2);
          if (p1 > p2) return { winner: match.time1, loser: match.time2 };
          if (p2 > p1) return { winner: match.time2, loser: match.time1 };
          return { winner: 'Empate', loser: 'Empate' }; // Should not happen in knockout
      };

      // CASE C: Finals exist -> Finalize Tournament (Ranking 1-4)
      if (mm.final.length > 0 && mm.terceiro_lugar.length > 0) {
        const rFinal = getResult(mm.final[0]);
        const rThird = getResult(mm.terceiro_lugar[0]);

        if (rFinal.winner === '?' || rThird.winner === '?') {
            alert("Preencha os placares da Final e 3º Lugar para finalizar o torneio!");
            return;
        }

        const newRanking = {
            first: rFinal.winner,
            second: rFinal.loser,
            third: rThird.winner,
            fourth: rThird.loser
        };

        newData.ranking_final = newRanking;
        onUpdate(newData);
        alert(`Torneio Finalizado com Sucesso!\n\nCampeão: ${newRanking.first}\n2º Lugar: ${newRanking.second}\n3º Lugar: ${newRanking.third}\n4º Lugar: ${newRanking.fourth}`);
        return;
      }

      // CASE A: Quartas exist -> Generate Semis
      if (mm.quartas.length > 0 && mm.semis.length === 0) {
          // Script logic: SF1 = Vencedor Q1 vs Vencedor Q2
          // Script logic: SF2 = Vencedor Q3 vs Vencedor Q4
          
          const rQ1 = getResult(mm.quartas[0]);
          const rQ2 = getResult(mm.quartas[1]);
          const rQ3 = getResult(mm.quartas[2]);
          const rQ4 = getResult(mm.quartas[3]);

          if ([rQ1, rQ2, rQ3, rQ4].some(r => r.winner === '?')) {
              alert("Preencha todos os placares das Quartas antes de gerar as Semis!");
              return;
          }

          const s1 = { id: generateId(), round: 'semis', time1: rQ1.winner, placar1: '', time2: rQ2.winner, placar2: '' };
          const s2 = { id: generateId(), round: 'semis', time1: rQ3.winner, placar1: '', time2: rQ4.winner, placar2: '' };

          newData.mata_mata.semis = [s1, s2] as any;
          onUpdate(newData);
          alert("Semifinais geradas com base nos vencedores das Quartas!");
          return;
      }

      // CASE B: Semis exist -> Generate Final & 3rd Place
      if (mm.semis.length > 0) {
          const rS1 = getResult(mm.semis[0]);
          const rS2 = getResult(mm.semis[1]);

          if ([rS1, rS2].some(r => r.winner === '?')) {
              alert("Preencha todos os placares das Semifinais antes de gerar as Finais!");
              return;
          }

          // FINAL: Vencedor SF1 vs Vencedor SF2
          const final = { id: generateId(), round: 'final', time1: rS1.winner, placar1: '', time2: rS2.winner, placar2: '' };
          
          // 3rd PLACE: Perdedor SF1 vs Perdedor SF2
          const third = { id: generateId(), round: 'terceiro_lugar', time1: rS1.loser, placar1: '', time2: rS2.loser, placar2: '' };

          newData.mata_mata.final = [final] as any;
          newData.mata_mata.terceiro_lugar = [third] as any;
          onUpdate(newData);
          alert("Grande Final e Disputa de 3º Lugar geradas!");
          return;
      }

      alert("Gere o início do mata-mata primeiro.");
  };


  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-full">
      {/* Header Responsivo */}
      <div className="bg-slate-900 p-4 border-b border-yellow-500 flex flex-col md:flex-row justify-between items-center gap-4">
         <h2 className="text-yellow-400 font-bold text-lg flex items-center gap-2 uppercase tracking-wide text-center md:text-left">
           <Users className="text-yellow-400 flex-shrink-0" /> Painel Administrativo
         </h2>
         <div className="flex w-full md:w-auto gap-2 justify-center overflow-x-auto pb-1">
            <button 
                onClick={() => setActiveTab('config')}
                className={`flex-1 md:flex-none px-3 py-2 rounded text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'config' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                1. Times
            </button>
            <button 
                onClick={() => setActiveTab('games')}
                className={`flex-1 md:flex-none px-3 py-2 rounded text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'games' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                2. Jogos
            </button>
            <button 
                onClick={() => setActiveTab('finals')}
                className={`flex-1 md:flex-none px-3 py-2 rounded text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'finals' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                3. Mata-Mata
            </button>
         </div>
      </div>

      <div className="p-4 md:p-6">
        
        {/* TAB 1: CONFIG TEAMS */}
        {activeTab === 'config' && (
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-bold text-slate-800 mb-4 uppercase text-center md:text-left">Cadastrar Times</h3>
                    <div className="flex gap-2 mb-4 justify-center md:justify-start">
                        {['A', 'B', 'C', 'D'].map(g => (
                            <button 
                                key={g}
                                onClick={() => {
                                    setSelectedGroupConfig(g);
                                    setTeamsInput(currentData.grupos[g].join('\n'));
                                }}
                                className={`w-12 h-12 md:w-10 md:h-10 rounded-full font-black border transition-transform active:scale-95 flex-shrink-0 ${selectedGroupConfig === g ? 'bg-yellow-400 border-yellow-500 text-slate-900 shadow-md transform scale-110' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                    <label className="block text-sm font-medium text-slate-500 mb-2 text-center md:text-left">
                        Times do Grupo {selectedGroupConfig} (Um por linha, máx 12)
                    </label>
                    <textarea 
                        className="w-full h-64 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 font-mono text-sm bg-white text-black placeholder:text-slate-400 shadow-inner"
                        placeholder="Digite o nome dos times..."
                        value={teamsInput}
                        onChange={(e) => setTeamsInput(e.target.value)}
                    />
                    <div className="mt-4 flex gap-4">
                        <button 
                            onClick={handleSaveTeams}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-sm active:scale-95"
                        >
                            <Save size={18} /> Salvar Grupo {selectedGroupConfig}
                        </button>
                    </div>
                </div>
                
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 h-fit text-black">
                    <h3 className="font-bold text-yellow-900 mb-4 flex items-center gap-2 justify-center md:justify-start">
                        <AlertTriangle size={18} className="text-yellow-600" /> Atenção
                    </h3>
                    <p className="text-sm text-slate-700 mb-6 font-medium text-center md:text-left">
                        Ao clicar em "Gerar Cruzamento", o sistema apagará placares existentes deste grupo e criará os jogos "todos contra todos".
                    </p>
                    <button 
                        onClick={() => handleGenerateGroupGames(selectedGroupConfig)}
                        className="w-full flex items-center justify-center gap-2 bg-white border-2 border-yellow-400 hover:bg-yellow-400 text-slate-900 px-4 py-3 rounded-lg font-black transition-colors shadow-sm active:scale-95"
                    >
                        <RefreshCw size={18} /> Gerar Cruzamento Chave {selectedGroupConfig}
                    </button>
                </div>
            </div>
        )}

        {/* TAB 2: GAMES & SCORES */}
        {activeTab === 'games' && (
            <div>
                 <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
                    <div className="flex gap-2 overflow-x-auto pb-2 w-full sm:w-auto">
                        {['A', 'B', 'C', 'D'].map(g => (
                            <button 
                                key={g}
                                onClick={() => setSelectedGroupConfig(g)}
                                className={`flex-shrink-0 px-4 py-2 rounded-lg font-bold border transition-colors ${selectedGroupConfig === g ? 'bg-yellow-400 border-yellow-500 text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                Jogos Grupo {g}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => handleDownloadGamesPDF(selectedGroupConfig)}
                        className="flex w-full sm:w-auto justify-center items-center gap-2 bg-white border-2 border-slate-200 hover:border-yellow-400 text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg font-bold transition-colors shadow-sm whitespace-nowrap"
                    >
                        <FileDown size={18} /> Baixar PDF Jogos
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {currentData.jogos
                        .filter(j => j.chave === selectedGroupConfig)
                        .map((match) => (
                        <div key={match.id} className="bg-white border border-slate-200 p-3 sm:p-4 rounded-lg flex items-center justify-between shadow-sm">
                            <div className="flex-1 text-right pr-2 font-bold text-slate-900 text-xs sm:text-sm truncate min-w-0 bg-white text-black" title={match.time1}>{match.time1}</div>
                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                <ScoreInput value={match.placar1} onChange={(v) => handleScoreChange(match.id, 1, v)} />
                                <span className="text-slate-400 font-bold">x</span>
                                <ScoreInput value={match.placar2} onChange={(v) => handleScoreChange(match.id, 2, v)} />
                            </div>
                            <div className="flex-1 text-left pl-2 font-bold text-slate-900 text-xs sm:text-sm truncate min-w-0 bg-white text-black" title={match.time2}>{match.time2}</div>
                        </div>
                    ))}
                    {currentData.jogos.filter(j => j.chave === selectedGroupConfig).length === 0 && (
                        <div className="col-span-full text-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-lg">
                            Nenhum jogo gerado para o Grupo {selectedGroupConfig}. Vá em "Times" e clique em "Gerar Cruzamento".
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* TAB 3: KNOCKOUT MANAGER */}
        {activeTab === 'finals' && (
            <div>
                <div className="bg-slate-900 p-6 rounded-xl text-center mb-8 shadow-lg border-2 border-slate-800">
                    <h3 className="text-yellow-400 font-bold uppercase tracking-widest text-lg mb-2">Gerenciador de Mata-Mata</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                        Gera fases automaticamente com base nos resultados. O sistema detecta se deve criar Quartas (4 chaves) ou Semifinais (2 chaves).
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <button 
                            onClick={handleGenerateMataMataStart}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-6 py-4 rounded-lg font-black transition-transform active:scale-95 shadow-lg border-b-4 border-yellow-600"
                        >
                            <Play size={20} fill="currentColor" /> Gerar Início (Quartas/Semis)
                        </button>
                        <button 
                            onClick={handleGenerateNextStage}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-4 rounded-lg font-black transition-transform active:scale-95 shadow-lg border-b-4 border-emerald-700"
                        >
                            Avançar Fase <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="space-y-8">
                     {/* QUARTAS */}
                     {currentData.mata_mata.quartas.length > 0 && (
                        <div className="space-y-2">
                             <h4 className="font-bold text-slate-500 uppercase text-xs tracking-widest border-b border-slate-200 pb-1 mb-3">Quartas de Final</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentData.mata_mata.quartas.map(match => (
                                     <div key={match.id} className="bg-white border border-slate-200 p-3 sm:p-4 rounded-lg flex items-center justify-between shadow-sm">
                                        <div className="flex-1 text-right pr-2 font-bold text-slate-900 text-xs sm:text-sm truncate min-w-0 bg-white text-black" title={match.time1}>{match.time1}</div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <ScoreInput value={match.placar1} onChange={(v) => handleScoreChange(match.id, 1, v)} />
                                            <span className="text-slate-300 font-bold text-xs">x</span>
                                            <ScoreInput value={match.placar2} onChange={(v) => handleScoreChange(match.id, 2, v)} />
                                        </div>
                                        <div className="flex-1 text-left pl-2 font-bold text-slate-900 text-xs sm:text-sm truncate min-w-0 bg-white text-black" title={match.time2}>{match.time2}</div>
                                     </div>
                                ))}
                             </div>
                        </div>
                     )}

                     {/* SEMIS */}
                     {currentData.mata_mata.semis.length > 0 && (
                        <div className="space-y-2">
                             <h4 className="font-bold text-slate-500 uppercase text-xs tracking-widest border-b border-slate-200 pb-1 mb-3">Semifinais</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentData.mata_mata.semis.map(match => (
                                     <div key={match.id} className="bg-white border border-slate-200 p-3 sm:p-4 rounded-lg flex items-center justify-between shadow-sm ring-2 ring-yellow-100">
                                        <div className="flex-1 text-right pr-2 font-bold text-slate-900 text-xs sm:text-sm truncate min-w-0 bg-white text-black" title={match.time1}>{match.time1}</div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <ScoreInput value={match.placar1} onChange={(v) => handleScoreChange(match.id, 1, v)} />
                                            <span className="text-slate-300 font-bold text-xs">x</span>
                                            <ScoreInput value={match.placar2} onChange={(v) => handleScoreChange(match.id, 2, v)} />
                                        </div>
                                        <div className="flex-1 text-left pl-2 font-bold text-slate-900 text-xs sm:text-sm truncate min-w-0 bg-white text-black" title={match.time2}>{match.time2}</div>
                                     </div>
                                ))}
                             </div>
                        </div>
                     )}

                     {/* FINAL & 3RD */}
                     {(currentData.mata_mata.final.length > 0 || currentData.mata_mata.terceiro_lugar.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {currentData.mata_mata.final.map(match => (
                                <div key={match.id} className="space-y-2">
                                     <h4 className="font-bold text-amber-500 uppercase text-xs tracking-widest border-b border-amber-200 pb-1 mb-3 text-center">Grande Final</h4>
                                     <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 p-6 rounded-xl flex flex-col items-center gap-4 shadow-md">
                                        <div className="w-full flex items-center justify-between">
                                            <div className="font-black text-slate-900 text-lg truncate flex-1 text-right min-w-0 bg-transparent text-black" title={match.time1}>{match.time1}</div>
                                            <div className="px-4 text-amber-400 font-black shrink-0">VS</div>
                                            <div className="font-black text-slate-900 text-lg truncate flex-1 text-left min-w-0 bg-transparent text-black" title={match.time2}>{match.time2}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <ScoreInput value={match.placar1} onChange={(v) => handleScoreChange(match.id, 1, v)} />
                                            <ScoreInput value={match.placar2} onChange={(v) => handleScoreChange(match.id, 2, v)} />
                                        </div>
                                     </div>
                                </div>
                            ))}

                            {currentData.mata_mata.terceiro_lugar.map(match => (
                                <div key={match.id} className="space-y-2">
                                     <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest border-b border-slate-200 pb-1 mb-3 text-center">Disputa de 3º Lugar</h4>
                                     <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col items-center gap-4 shadow-sm opacity-80">
                                        <div className="w-full flex items-center justify-between">
                                            <div className="font-bold text-slate-600 text-base truncate flex-1 text-right min-w-0 bg-transparent text-black" title={match.time1}>{match.time1}</div>
                                            <div className="px-4 text-slate-300 font-bold shrink-0">VS</div>
                                            <div className="font-bold text-slate-600 text-base truncate flex-1 text-left min-w-0 bg-transparent text-black" title={match.time2}>{match.time2}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <ScoreInput value={match.placar1} onChange={(v) => handleScoreChange(match.id, 1, v)} />
                                            <ScoreInput value={match.placar2} onChange={(v) => handleScoreChange(match.id, 2, v)} />
                                        </div>
                                     </div>
                                </div>
                            ))}
                        </div>
                     )}
                     
                     {currentData.mata_mata.quartas.length === 0 && currentData.mata_mata.semis.length === 0 && currentData.mata_mata.final.length === 0 && (
                        <div className="text-center text-slate-400 py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                            Nenhum jogo de mata-mata gerado ainda. Clique em "Gerar Início".
                        </div>
                     )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;
