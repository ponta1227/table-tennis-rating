"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [players, setPlayers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [winner, setWinner] = useState(""); // 勝者
  const [loser, setLoser] = useState("");   // 敗者

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const { data } = await supabase.from("players").select("*").order("rating", { ascending: false });
    if (data) setPlayers(data);
  }

  async function addPlayer() {
    if (!name) return;
    await supabase.from("players").insert([{ name, rating: 1500 }]);
    setName("");
    fetchPlayers();
  }

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

    const K = 32;
    const expected = (r1: number, r2: number) =>
      1 / (1 + Math.pow(10, (r2 - r1) / 400));

    // Elo 計算
    const Ew = expected(w.rating, l.rating);
    const El = expected(l.rating, w.rating);

    const newRw = w.rating + K * (1 - Ew);
    const newRl = l.rating + K * (0 - El);

    // players 更新
    await supabase.from("players").update({ rating: Math.round(newRw) }).eq("id", w.id);
    await supabase.from("players").update({ rating: Math.round(newRl) }).eq("id", l.id);

    // matches に記録
    await supabase.from("matches").insert([
      { player_a: w.id, player_b: l.id, winner: w.id },
    ]);

    fetchPlayers();
    setWinner("");
    setLoser("");
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">🏓 卓球レーティング管理</h1>

      {/* 選手登録フォーム */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-8">
        <h2 className="text-xl font-semibold mb-4">選手登録</h2>
        <div className="flex flex-col gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="選手名を入力"
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

      {/* 試合結果入力フォーム */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-8">
        <h2 className="text-xl font-semibold mb-4">試合結果入力</h2>
        <div className="flex flex-col gap-4">
          {/* 勝者 */}
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

          {/* 敗者 */}
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
              <tr key={p.id} className="border-b hover:bg-gray-50">
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
