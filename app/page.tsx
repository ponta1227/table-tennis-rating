"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

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

  useEffect(() => {
    fetchPlayers();
    fetchMatches();
  }, []);

  async function fetchPlayers() {
    const { data } = await supabase.from("players").select("*");
    if (data) setPlayers(data);
  }

  async function fetchMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("id", { ascending: true });
    if (data) setMatches(data);
  }

  async function recordMatchResult(winner: string, loser: string, table: number) {
    if (currentMatch) {
      const updatedMatch = { ...currentMatch, winner, loser, table, isCompleted: true };
      setCurrentMatch(updatedMatch);
      await supabase.from("matches").upsert(updatedMatch);
    }
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
            value={currentMatch?.winner || ""}
            onChange={(e) => {
              if (currentMatch) {
                setCurrentMatch({ ...currentMatch, winner: e.target.value });
              }
            }}
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
            value={currentMatch?.loser || ""}
            onChange={(e) => {
              if (currentMatch) {
                setCurrentMatch({ ...currentMatch, loser: e.target.value });
              }
            }}
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
            value={currentMatch?.table || 1}
            onChange={(e) => {
              if (currentMatch) {
                setCurrentMatch({ ...currentMatch, table: Number(e.target.value) });
              }
            }}
            className="border p-2 rounded"
          >
            <option value={1}>卓球台 1</option>
            <option value={2}>卓球台 2</option>
            <option value={3}>卓球台 3</option>
          </select>

          <button
            onClick={() =>
              currentMatch && recordMatchResult(currentMatch.winner!, currentMatch.loser!, currentMatch.table)
            }
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            結果を登録
          </button>
        </div>
      </div>
    </div>
  );
}
