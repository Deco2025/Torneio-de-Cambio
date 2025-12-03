
import React, { useState, useEffect } from 'react';
import { Trophy, LayoutGrid, Users, GitMerge, Activity, Medal, Settings, Lock } from 'lucide-react';
import StandingsTable from './components/StandingsTable';
import MatchCard from './components/MatchCard';
import BracketView from './components/BracketView';
import AdminPanel from './components/AdminPanel';
import { MOCK_DATA } from './constants';
import { TournamentData, Match, StandingRow, GroupStandings, KnockoutMatch, FinalRanking } from './types';

const INITIAL_EMPTY_DATA: TournamentData = {
  grupos: { "A": [], "B": [], "C": [], "D": [] },
  jogos: [],
  classificacao: { "A": [], "B": [], "C": [], "D": [] },
  mata_mata: { quartas: [], semis: [], final: [], terceiro_lugar: [] },
  ranking_final: { first: "TBD", second: "TBD", third: "TBD", fourth: "TBD" }
};

const App = () => {
  // Main State
  const [data, setData] = useState<TournamentData>(INITIAL_EMPTY_DATA);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'groups' | 'knockout' | 'admin'>('dashboard');
  const [activeGroup, setActiveGroup] = useState<string>('A');

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Load initial data (mock or empty)
  useEffect(() => {
    setData(INITIAL_EMPTY_DATA); // Start empty for user to fill, or swap with MOCK_DATA to test
  }, []);

  // --- AUTH LOGIC ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Deco2026@') {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  // --- LOGIC: Calculate Standings based on Matches ---
  const calculateStandings = (currentMatches: Match[], groups: { [key: string]: string[] }): GroupStandings => {
    const newStandings: GroupStandings = { A: [], B: [], C: [], D: [] };

    Object.keys(groups).forEach(groupKey => {
      const teams = groups[groupKey];
      const groupMatches = currentMatches.filter(m => m.chave === groupKey);
      
      const stats: Record<string, { p: number, j: number, v: number, e: number, d: number, gp: number, gc: number }> = {};

      // Initialize stats
      teams.forEach(team => {
        stats[team] = { p: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 };
      });

      // Process matches
      groupMatches.forEach(match => {
        const p1 = Number(match.placar1);
        const p2 = Number(match.placar2);
        const t1 = match.time1;
        const t2 = match.time2;

        // Only process if both scores are present and not empty string/null
        if (match.placar1 !== '' && match.placar1 !== null && match.placar2 !== '' && match.placar2 !== null && stats[t1] && stats[t2]) {
          stats[t1].j++;
          stats[t2].j++;
          stats[t1].gp += p1;
          stats[t1].gc += p2;
          stats[t2].gp += p2;
          stats[t2].gc += p1;

          if (p1 > p2) {
            stats[t1].v++;
            stats[t1].p += 3;
            stats[t2].d++;
          } else if (p2 > p1) {
            stats[t2].v++;
            stats[t2].p += 3;
            stats[t1].d++;
          } else {
            stats[t1].e++;
            stats[t1].p += 1;
            stats[t2].e++;
            stats[t2].p += 1;
          }
        }
      });

      // Convert to array and sort
      // [Team, Played, Points, Wins, Draws, Losses, GF, GA, GD]
      const rows: StandingRow[] = Object.keys(stats).map(team => {
        const s = stats[team];
        return [team, s.j, s.p, s.v, s.e, s.d, s.gp, s.gc, s.gp - s.gc];
      });

      // Sorting Logic (Same as CODE.GS)
      // Pontos > Vitórias > Empates > Feitos > Sofridos (menor) > Saldo
      rows.sort((a, b) => {
        if (b[2] !== a[2]) return b[2] - a[2]; // Points
        if (b[3] !== a[3]) return b[3] - a[3]; // Wins
        if (b[4] !== a[4]) return b[4] - a[4]; // Draws
        // Index 6 is GF (Goals For / Feitos)
        if (b[6] !== a[6]) return b[6] - a[6]; 
        // Index 7 is GA (Goals Against / Sofridos) - Ascending (less is better)
        if (a[7] !== b[7]) return a[7] - b[7];
        // Index 8 is GD (Goal Difference / Saldo)
        return b[8] - a[8]; 
      });

      newStandings[groupKey] = rows;
    });

    return newStandings;
  };

  // --- HANDLER: Update Data from Admin Panel ---
  const handleDataUpdate = (newData: TournamentData) => {
    // Recalculate standings whenever matches or teams change
    const updatedStandings = calculateStandings(newData.jogos, newData.grupos);
    
    // Check for ranking updates in knockout (Final and 3rd Place)
    let updatedRanking = { ...newData.ranking_final };
    
    // Process Final (1st & 2nd)
    if (newData.mata_mata.final && newData.mata_mata.final.length > 0) {
       const finalMatch = newData.mata_mata.final[0];
       if(finalMatch.placar1 !== '' && finalMatch.placar1 !== null && finalMatch.placar2 !== '' && finalMatch.placar2 !== null) {
          const p1 = Number(finalMatch.placar1);
          const p2 = Number(finalMatch.placar2);
          if (p1 > p2) {
             updatedRanking.first = finalMatch.time1;
             updatedRanking.second = finalMatch.time2;
          } else if (p2 > p1) {
             updatedRanking.first = finalMatch.time2;
             updatedRanking.second = finalMatch.time1;
          }
       }
    }

    // Process 3rd Place (3rd & 4th)
    if (newData.mata_mata.terceiro_lugar && newData.mata_mata.terceiro_lugar.length > 0) {
       const thirdMatch = newData.mata_mata.terceiro_lugar[0];
       if(thirdMatch.placar1 !== '' && thirdMatch.placar1 !== null && thirdMatch.placar2 !== '' && thirdMatch.placar2 !== null) {
          const p1 = Number(thirdMatch.placar1);
          const p2 = Number(thirdMatch.placar2);
          if (p1 > p2) {
             updatedRanking.third = thirdMatch.time1;
             updatedRanking.fourth = thirdMatch.time2;
          } else if (p2 > p1) {
             updatedRanking.third = thirdMatch.time2;
             updatedRanking.fourth = thirdMatch.time1;
          }
       }
    }

    setData({
      ...newData,
      classificacao: updatedStandings,
      ranking_final: updatedRanking as FinalRanking
    });
  };

  // --- Statistics Logic ---
  const allMatches = data.jogos;
  
  // Calculate total points from standings (Index 2 is points)
  const totalPoints = (Object.values(data.classificacao) as StandingRow[][])
    .reduce((acc, groupRows) => {
      return acc + groupRows.reduce((gAcc, row) => gAcc + (row[2] || 0), 0);
    }, 0);

  const matchesPlayed = allMatches.filter(m => m.placar1 !== null && m.placar1 !== '').length;
  const upcomingMatches = allMatches.filter(m => m.placar1 === null || m.placar1 === '').length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* Header - YELLOW THEME */}
      <header className="bg-yellow-400 text-slate-900 shadow-lg sticky top-0 z-50 border-b-4 border-yellow-500">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg shadow-sm">
              <Trophy size={24} className="text-yellow-400" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black leading-none tracking-tight text-slate-900 uppercase">Torneio de Câmbio 2026</h1>
              <p className="text-xs text-slate-800 font-bold mt-1 opacity-80">Desenvolvido: André Castro</p>
            </div>
          </div>
          
          <button 
            onClick={() => setActiveTab('admin')}
            className={`p-2 rounded-full transition-colors font-bold ${activeTab === 'admin' ? 'bg-slate-900 text-yellow-400' : 'bg-yellow-300 text-slate-800 hover:bg-yellow-200'}`}
            title="Área Administrativa"
          >
            {activeTab === 'admin' ? <Settings size={20} /> : <Lock size={20} />}
          </button>
        </div>

        {/* Main Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 mt-2">
          <nav className="flex space-x-1 overflow-x-auto pb-2" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-3 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'dashboard' 
                  ? 'bg-slate-50 text-slate-900 border-t-2 border-yellow-600' 
                  : 'text-slate-800 hover:bg-yellow-300/50 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={16} />
              Resumo
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-3 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'groups' 
                  ? 'bg-slate-50 text-slate-900 border-t-2 border-yellow-600' 
                  : 'text-slate-800 hover:bg-yellow-300/50 hover:text-slate-900'
              }`}
            >
              <Users size={16} />
              Fase de Grupos
            </button>
            <button
              onClick={() => setActiveTab('knockout')}
              className={`px-4 py-3 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'knockout' 
                  ? 'bg-slate-50 text-slate-900 border-t-2 border-yellow-600' 
                  : 'text-slate-800 hover:bg-yellow-300/50 hover:text-slate-900'
              }`}
            >
              <GitMerge size={16} />
              Mata-Mata
            </button>
            {activeTab === 'admin' && (
               <button
               className={`px-4 py-3 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap bg-slate-900 text-yellow-400`}
             >
               <Settings size={16} />
               Administração
             </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* VIEW: ADMIN PANEL (Protected) */}
        {activeTab === 'admin' && (
          !isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full text-center">
                <div className="bg-slate-100 p-4 rounded-full inline-flex items-center justify-center mb-6">
                  <Lock className="text-slate-400" size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">Acesso Restrito</h2>
                <p className="text-slate-500 mb-6 text-sm">Esta área é exclusiva para organizadores.</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <input 
                      type="password" 
                      placeholder="Senha de Acesso"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none font-bold text-center text-slate-900 placeholder:font-normal"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                    />
                    {authError && (
                      <p className="text-red-500 text-xs font-bold mt-2">Senha incorreta. Tente novamente.</p>
                    )}
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-yellow-400 font-bold py-3 rounded-lg transition-all shadow-lg active:scale-95 uppercase tracking-wide"
                  >
                    Entrar
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <AdminPanel currentData={data} onUpdate={handleDataUpdate} />
          )
        )}

        {/* VIEW: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-yellow-400 transition-colors group">
                <p className="text-xs font-bold text-slate-400 uppercase group-hover:text-yellow-600">Pontos Totais</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{totalPoints}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-yellow-400 transition-colors group">
                <p className="text-xs font-bold text-slate-400 uppercase group-hover:text-yellow-600">Jogos Realizados</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{matchesPlayed}</p>
              </div>
               <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-yellow-400 transition-colors group">
                <p className="text-xs font-bold text-slate-400 uppercase group-hover:text-yellow-600">Jogos Restantes</p>
                <p className="text-2xl font-black text-amber-500 mt-1">{upcomingMatches}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-yellow-400 transition-colors group">
                <p className="text-xs font-bold text-slate-400 uppercase group-hover:text-yellow-600">Média de Pontos/Jogo</p>
                <p className="text-2xl font-black text-slate-700 mt-1">
                  {matchesPlayed > 0 ? (totalPoints / matchesPlayed).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>

            {/* Podium Preview if Available */}
            {data.ranking_final && (data.ranking_final.first !== "TBD") && (
              <div className="space-y-4">
                  {/* Champion Card */}
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl p-6 text-slate-900 shadow-xl relative overflow-hidden border-2 border-yellow-400">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                        <h2 className="text-2xl font-black flex items-center gap-2 uppercase italic">
                          <Medal className="text-white" /> Campeão 2026
                        </h2>
                        <p className="text-slate-900 font-bold opacity-80 mt-1">O grande vencedor do torneio</p>
                      </div>
                      <div className="text-4xl font-black tracking-tight text-white drop-shadow-md">
                        {data.ranking_final.first}
                      </div>
                    </div>
                    {/* Decorative Pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  </div>
                  
                  {/* Full Ranking Cards (2nd, 3rd, 4th) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 2nd Place */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center font-black text-slate-400 text-lg">2º</div>
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase">Vice-Campeão</p>
                              <p className="font-black text-slate-800 text-lg">{data.ranking_final.second}</p>
                          </div>
                      </div>
                      {/* 3rd Place */}
                       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center font-black text-orange-600 text-lg">3º</div>
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase">3º Lugar</p>
                              <p className="font-black text-slate-800 text-lg">{data.ranking_final.third}</p>
                          </div>
                      </div>
                      {/* 4th Place */}
                       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center font-black text-slate-300 text-lg">4º</div>
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase">4º Lugar</p>
                              <p className="font-black text-slate-800 text-lg">{data.ranking_final.fourth}</p>
                          </div>
                      </div>
                  </div>
              </div>
            )}

            {/* Latest Results Section */}
            <div>
              <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center uppercase tracking-wide">
                <Activity size={20} className="mr-2 text-yellow-500"/> Últimos Jogos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMatches
                  .filter(m => m.placar1 !== null && m.placar1 !== '')
                  .slice(0, 6) // Last 6 matches
                  .map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                {allMatches.filter(m => m.placar1 !== null && m.placar1 !== '').length === 0 && (
                   <div className="col-span-full p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                      Ainda não há jogos finalizados. Acesse a aba Administrativa para gerar jogos e inserir placares.
                   </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: GROUPS */}
        {activeTab === 'groups' && (
          <div className="animate-fade-in space-y-6">
            
            {/* Group Selector Pills */}
            <div className="flex overflow-x-auto gap-2 pb-2">
              {Object.keys(data.grupos).map((grp) => (
                <button
                  key={grp}
                  onClick={() => setActiveGroup(grp)}
                  className={`px-6 py-2 rounded-full text-sm font-black transition-all whitespace-nowrap shadow-sm border ${
                    activeGroup === grp
                      ? 'bg-yellow-400 text-slate-900 border-yellow-500 transform scale-105'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-yellow-300 hover:text-slate-700'
                  }`}
                >
                  Grupo {grp}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Standings Column */}
              <div className="lg:col-span-2">
                <StandingsTable 
                  data={data.classificacao[activeGroup] || []} 
                  groupName={activeGroup} 
                />
              </div>

              {/* Matches for Specific Group Column */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg px-2 border-l-4 border-yellow-500">Jogos do Grupo {activeGroup}</h3>
                <div className="space-y-3">
                  {allMatches
                    .filter(m => m.chave === activeGroup)
                    .map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  {allMatches.filter(m => m.chave === activeGroup).length === 0 && (
                     <div className="text-slate-400 text-sm italic p-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
                        Nenhum jogo gerado para este grupo.
                     </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: KNOCKOUT */}
        {activeTab === 'knockout' && (
          <div className="animate-fade-in space-y-8">
             
             {/* Final Ranking / Podium Table */}
             {data.ranking_final && data.ranking_final.first !== "TBD" && (
               <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 text-yellow-400 p-4 text-center font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2">
                     <Trophy size={20} /> Ranking Final <Trophy size={20} />
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="flex items-center p-4 bg-yellow-100/50">
                      <div className="w-12 font-black text-yellow-600 text-xl">1º</div>
                      <div className="flex-1 font-bold text-slate-900 text-lg uppercase truncate">{data.ranking_final.first}</div>
                      <Medal className="text-yellow-500" />
                    </div>
                    <div className="flex items-center p-4 bg-slate-50">
                      <div className="w-12 font-black text-slate-400 text-xl">2º</div>
                      <div className="flex-1 font-bold text-slate-700 truncate">{data.ranking_final.second}</div>
                      <Medal className="text-slate-400" />
                    </div>
                    <div className="flex items-center p-4 bg-orange-50">
                      <div className="w-12 font-black text-orange-600 text-xl">3º</div>
                      <div className="flex-1 font-bold text-slate-700 truncate">{data.ranking_final.third}</div>
                      <Medal className="text-orange-500" />
                    </div>
                    <div className="flex items-center p-4 bg-white">
                      <div className="w-12 font-bold text-slate-300 text-xl">4º</div>
                      <div className="flex-1 font-bold text-slate-400 truncate">{data.ranking_final.fourth}</div>
                    </div>
                  </div>
               </div>
             )}

             <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                <div className="p-6 text-center border-b border-slate-200 bg-white">
                  <h2 className="text-xl font-black text-slate-900 uppercase">Fase Final</h2>
                  <p className="text-slate-500 text-sm font-medium">O caminho para o título</p>
                </div>
                <div>
                    {data.mata_mata.final.length === 0 && data.mata_mata.semis.length === 0 && data.mata_mata.quartas.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <GitMerge size={48} className="mx-auto mb-4 opacity-50" />
                            <p>O mata-mata ainda não foi gerado.</p>
                            <p className="text-sm">Vá para a área administrativa para gerar as chaves.</p>
                        </div>
                    ) : (
                        <BracketView data={data.mata_mata} />
                    )}
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Footer / Mobile Padding */}
      <footer className="mt-12 py-8 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        <p className="font-bold text-slate-500">© 2026 Torneio de Câmbio</p>
        <p className="text-xs mt-1">Atualizado em tempo real</p>
      </footer>
    </div>
  );
};

export default App;
