"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function RankingPage() {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("rating", { ascending: false }); // レート降順で取得

    if (error) {
      console.error("ランキング取得エラー:", error.message);
    } else {
      setPlayers(data || []);
    }
  }

  return (


    <div style={{ padding: 20 }}>
      <h1>🏓 ランキング</h1>
<div className="bg-blue-200 p-4">テスト</div>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>順位</th>
            <th>名前</th>
            <th>レート</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id}>
              <td>{i + 1}</td>
              <td>{p.name}</td>
              <td>{p.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>


  );
}
