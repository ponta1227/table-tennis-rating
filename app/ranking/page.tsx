"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Player = {
  id: string;
  name: string;
  rating: number;
};

export default function RankingPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("rating", { ascending: false });
    if (data) setPlayers(data);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 text-gray-900 text-lg sm:text-xl">
      <h1 className="text-4xl font-bold mb-8">🏓 ランキング</h1>

      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <table className="w-full border-collapse">
          <thead className="bg-gray-200 text-gray-900">
            <tr>
              <th className="p-3 text-left">順位</th>
              <th className="p-3 text-left">名前</th>
              <th className="p-3 text-left">レート</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
