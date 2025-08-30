"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

// 選手と試合の型を定義
type Player = {
  id: string;
  name: string;
  rating: number;
};

type Match = {
  id: string;
  playerA: string;
  playerB: string;
  winner?: string;
  loser?: string;
  table: number;
  isCompleted: boolean;
};

export default function TournamentPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [tableCount, setTableCount] = useState<number>(1); // 卓球台の数
  const [playerCount, setPlayerCount] = useState<number>(2); // 参加選手数

  useEffect(() => {
    fetchPlayers();
    fetchMatches();
  }, []);

  // 選手の取得
  async function fetchPlayers() {
    const { data } = await supabase.from("players").select("*");
    if (data) setPlayers(data);
  }

  // 試合の取得
  async function fetchMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("id", { ascending: true });
    if (data) setMatches(data);
  }

  // 試合結果を記録
  async function recordMatchResult(winner: string, loser: string, table: number) {
    const updatedMatches = matches.map((match) =>
      match.playerA === winner && match.playerB === loser
        ? { ...match, winner, loser, isCompleted: true, table }
        : match
    );
    setMatches(updatedMatches);

    // 試合結果を Supabase に保存
    await supabase.from("matches").upsert(updatedMatches);
  }

  // 審判の割り当て
  function assignReferee() {
    const nonPlayingPlayers = players.filter(
      (player) =>
        !matches.some(
          (match) => (match.playerA === player.id || match.playerB === player.id) && !match.isCompleted
        )
    );
    return nonPlayingPlayers.length ? nonPlayingPlayers[0].name : "なし";
  }

  // リーグ戦を自動生成（試合の組み合わせ）
  function generateLeagueMatches() {
    const matches: Match[] = [];
    for (let i = 0; i < playerCount; i++) {
      for (let j = i + 1; j < playerCount; j++) {
        matches.push({
          id: `${i}-${j}`,
          playerA: players[i].id,
          playerB: players[j].id,
          table: 1, // 初期は全て1台目に設定
          isCompleted: false,
        });
      }
    }
    setMatches(matches);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">🏓 リーグ戦</h1>

      {/* 試合結果入力フォーム */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-8">
        <h2 className="text-xl font-semibold mb-4">試合結果入力</h2>
        <div className="flex flex-col gap-4">
          {/* 勝者 */}
          <select
            value={currentMatch?.winner}
            onChange={(e) => setCurrentMatch({ ...currentMatch, winner: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">勝者を選択</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* 敗者 */}
          <select
            value={currentMatch?.loser}
            onChange={(e) => setCurrentMatch({ ...currentMatch, loser: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">敗者を選択</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* 卓球台の選択 */}
          <select
            value={currentMatch?.table}
            onChange={(e) => setCurrentMatch({ ...currentMatch, table: Number(e.target.value) })}
            className="border p-2 rounded"
          >
            <option value={1}>卓球台 1</option>
            <option value={2}>卓球台 2</option>
            <option value={3}>卓球台 3</option>
          </select>

          <button
            onClick={() => recordMatchResult(currentMatch?.winner!, currentMatch?.loser!, currentMatch?.table!)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            結果を登録
          </button>
        </div>
      </div>

      {/* 進行中の試合 */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl mb-8">
        <h2 className="text-xl font-semibold mb-4">進行中の試合</h2>
        <div>{assignReferee()}が審判として次の試合を担当します</div>
        <table className="w-full border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">試合</th>
              <th className="p-2">台</th>
              <th className="p-2">状態</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{match.playerA} vs {match.playerB}</td>
                <td className="p-2">{match.table}</td>
                <td className="p-2">{match.isCompleted ? "完了" : "進行中"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 順位が表示される場所 */}
      {matches.every((match) => match.isCompleted) && (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl mb-8">
          <h2 className="text-xl font-semibold mb-4">リーグ戦結果</h2>
          <table className="w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">順位</th>
                <th className="p-2">名前</th>
                <th className="p-2">レート</th>
              </tr>
            </thead>
            <tbody>
              {players
                .sort((a, b) => b.rating - a.rating) // レート順に並べ替え
                .map((player, index) => (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{player.name}</td>
                    <td className="p-2">{player.rating}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
