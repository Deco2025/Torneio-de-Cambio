
import React from 'react';
import { StandingRow } from '../types';
import { Download } from 'lucide-react';

declare const jspdf: any;

interface StandingsTableProps {
  data: StandingRow[];
  groupName: string;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ data, groupName }) => {
  /**
   * Indices:
   * 0: Name, 1: Played, 2: Points, 3: Wins, 4: Draws, 5: Losses, 6: GF, 7: GA, 8: GD
   */
  const sortedData = [...data].sort((a, b) => {
    if (b[2] !== a[2]) return b[2] - a[2]; // Points
    if (b[3] !== a[3]) return b[3] - a[3]; // Wins
    if (b[4] !== a[4]) return b[4] - a[4]; // Draws
    if (b[6] !== a[6]) return b[6] - a[6]; // GF (Index 6)
    if (a[7] !== b[7]) return a[7] - b[7]; // GA (Index 7) - Ascending
    return b[8] - a[8]; // GD (Index 8)
  });

  const handleDownloadPDF = () => {
    if (typeof jspdf === 'undefined') {
      alert('Biblioteca PDF carregando... tente novamente em instantes.');
      return;
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(234, 179, 8); // Yellow color roughly
    doc.text(`Torneio de Câmbio 2026`, 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Classificação - Grupo ${groupName}`, 14, 30);

    // Table
    const tableColumn = ["#", "Time", "PTS", "J", "V", "E", "D", "GP", "GC", "SG"];
    const tableRows: any[] = [];

    sortedData.forEach((row, index) => {
      const [name, played, points, wins, draws, losses, gf, ga, gd] = row;
      const rank = index + 1;
      tableRows.push([rank, name, points, played, wins, draws, losses, gf, ga, gd]);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      headStyles: { fillColor: [234, 179, 8], textColor: [0, 0, 0], fontStyle: 'bold' }, // Yellow header
      styles: { fontSize: 10, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`Classificacao_Grupo_${groupName}.pdf`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-full">
      <div className="px-4 py-4 border-b border-yellow-400 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="font-black text-slate-800 text-lg uppercase">Grupo {groupName}</h3>
        <button 
          onClick={handleDownloadPDF}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
          title="Baixar Tabela em PDF"
        >
          <Download size={14} /> Baixar Tabela
        </button>
      </div>
      
      {/* Container de Rolagem Horizontal */}
      <div className="overflow-x-auto w-full pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        <table className="w-full text-sm text-left whitespace-nowrap min-w-[600px]">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold text-slate-400 w-10">#</th>
              <th scope="col" className="px-4 py-3 font-bold text-slate-400 min-w-[150px]">Time</th>
              <th scope="col" className="px-4 py-3 font-bold text-center text-slate-800 bg-yellow-50" title="Pontos">PTS</th>
              <th scope="col" className="px-4 py-3 font-bold text-center text-slate-400" title="Jogos">J</th>
              <th scope="col" className="px-4 py-3 font-bold text-center text-slate-400" title="Vitórias">V</th>
              <th scope="col" className="px-4 py-3 font-bold text-center text-slate-400" title="Empates">E</th>
              <th scope="col" className="px-4 py-3 font-bold text-center text-slate-400" title="Derrotas">D</th>
              <th scope="col" className="px-4 py-3 font-bold text-center text-slate-400" title="Gols Pró">GP</th>
              <th scope="col" className="px-4 py-3 font-bold text-center text-slate-400" title="Gols Contra">GC</th>
              <th scope="col" className="px-4 py-3 font-bold text-center text-slate-400" title="Saldo de Gols">SG</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => {
              const [name, played, points, wins, draws, losses, gf, ga, gd] = row;
              return (
                <tr key={name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-b-0">
                  <td className={`px-4 py-3 font-bold ${index < 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                    {index + 1}
                    {index < 2 && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-yellow-500"></span>}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 truncate max-w-[180px]" title={name}>{name}</td>
                  <td className="px-4 py-3 text-center font-black text-slate-900 bg-yellow-50">{points}</td>
                  <td className="px-4 py-3 text-center text-slate-600 font-medium">{played}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{wins}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{draws}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{losses}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{gf}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{ga}</td>
                  <td className={`px-4 py-3 text-center font-bold ${gd > 0 ? 'text-emerald-600' : gd < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                    {gd > 0 ? `+${gd}` : gd}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsTable;
