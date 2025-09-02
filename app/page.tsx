"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

type Player = {
  id: string;
  name: string;
  rating: number;
};

type Match = {
  id: string;
  winner_id: string;
  loser_id: string;
  created_at: string;
};

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [name, setName] = useState("");
  const [initialRating, setInitialRating] = useState(1500);
  const [winner, setWinner] = useState("");
  const [loser, setLoser] = useState("");

  useEffect(() => {
    fetchPlayers();
    fetchMatches();
  }, []);

  async function fetchPlayers() {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("rating", { ascending: false });
    if (data) setPlayers(data);
  }

  async function fetchMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3); // 直近3試合
    if (data) setMatches(data);
  }

  async function addPlayer() {
    if (!name) return;
    await supabase.from("players").insert([{ name, rating: initialRating }]);
    setName("");
    setInitialRating(1500);
    fetchPlayers();
  }

  // 試合登録
  async function recordMatch() {
    if (!winner || !loser) {
      alert("勝者と敗者を選んでください");
      return;
    }
    if (winner === loser) {
      alert("同じ選手を勝者と敗者に指定できません");
      return;
    }

    const w = players.find((p) => p.id === winner);
    const l = players.find((p) => p.id === loser);
    if (!w || !l) return;

    // Elo レート計算
    const k = 32;
    const expectedW = 1 / (1 + Math.pow(10, (l.rating - w.rating) / 400));
    const expectedL = 1 / (1 + Math.pow(10, (w.rating - l.rating) / 400));

    const newWRating = w.rating + k * (1 - expectedW);
    const newLRating = l.rating + k * (0 - expectedL);

    await supabase.from("players").update({ rating: Math.round(newWRating) }).eq("id", w.id);
    await supabase.from("players").update({ rating: Math.round(newLRating) }).eq("id", l.id);

    const { data } = await supabase
      .from("matches")
      .insert([{ winner_id: w.id, loser_id: l.id }])
      .select();

    if (data) {
      setMatches([data[0], ...matches].slice(0, 3)); // state に即反映
    }

    fetchPlayers();
  }

  // 試合取り消し（Eloも戻す）
  async function deleteMatch(matchId: string) {
    // 直近3試合から対象を探す
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const w = players.find((p) => p.id === match.winner_id);
    const l = players.find((p) => p.id === match.loser_id);
    if (!w || !l) return;

    // Elo を「元に戻す」
    const k = 32;
    const expectedW = 1 / (1 + Math.pow(10, (l.rating - w.rating) / 400));
    const expectedL = 1 / (1 + Math.pow(10, (w.rating - l.rating) / 400));

    const oldWRating = w.rating - k * (1 - expectedW);
    const oldLRating = l.rating - k * (0 - expectedL);

    await supabase.from("players").update({ rating: Math.round(oldWRating) }).eq("id", w.id);
    await supabase.from("players").update({ rating: Math.round(oldLRating) }).eq("id", l.id);

    // 試合削除
    await supabase.from("matches").delete().eq("id", matchId);

    fetchPlayers();
    fetchMatches();
  }

  function getPlayerName(id: string) {
    return players.find((p) => p.id === id)?.name || "不明";
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 text-gray-900">
      <h1 className="text-3xl font-bold mb-8">🏓 卓球レーティング管理</h1>

      {/* 選手登録 */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-8">
        <h2 className="text-xl font-semibold mb-4">選手登録</h2>
        <div className="flex flex-col gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="選手名を入力"
            className="border p-2 rounded w-full"
          />
          <input
            type="number"
            value={initialRating}
            onChange={(e) => setInitialRating(Number(e.target.value))}
            placeholder="初期レーティング (例: 1500)"
            className="border p-2 rounded w-full"
          />
          <button
            onClick={addPlayer}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            登録
          </button>
        </div>
      </div>

      {/* 試合結果入力 */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-8">
        <h2 className="text-xl font-semibold mb-4">試合結果入力</h2>
        <div className="flex flex-col gap-4">
          <select
            value={winner}
            onChange={(e) => setWinner(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">勝者を選択</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={loser}
            onChange={(e) => setLoser(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">敗者を選択</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={recordMatch}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            結果を登録
          </button>
        </div>
      </div>

      {/* 直近の試合結果 */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl mb-8">
        <h2 className="text-xl font-semibold mb-4">直近の試合結果</h2>
        {matches.length === 0 ? (
          <p className="text-gray-500">まだ試合が登録されていません</p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => (
              <li key={m.id} className="flex justify-between items-center border-b pb-2">
                <span>
                  🏆 {getPlayerName(m.winner_id)} vs {getPlayerName(m.loser_id)}
                </span>
                <button
                  onClick={() => deleteMatch(m.id)}
                  className="text-red-500 hover:underline"
                >
                  取り消し
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 選手一覧 */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">選手一覧</h2>
        <table className="w-full border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">名前</th>
              <th className="p-2">レート</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50 text-gray-900">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
