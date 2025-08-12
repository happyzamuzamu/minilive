export function AdminStandings({
  standings,
}: {
  standings: Array<{
    rank?: number;
    nickname?: string;
    wins?: number;
    losses?: number;
    points?: number;
    omw?: number;
    oow?: number;
    mwp?: number;
  }>;
}) {
  if (!standings || standings.length === 0) {
    return <div>스탠딩이 없습니다.</div>;
  }

  return (
    <table border={1} cellPadding={6} style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>순위</th>
          <th>닉네임</th>
          <th>승</th>
          <th>패</th>
          <th>포인트</th>
          <th>OMW%</th>
          <th>OOW%</th>
          <th>MWP%</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((row, i) => (
          <tr key={i}>
            <td>{row.rank ?? i + 1}</td>
            <td>{row.nickname ?? "-"}</td>
            <td>{row.wins ?? 0}</td>
            <td>{row.losses ?? 0}</td>
            <td>{row.points ?? 0}</td>
            <td>{row.omw != null ? (row.omw * 100).toFixed(1) + "%" : "-"}</td>
            <td>{row.oow != null ? (row.oow * 100).toFixed(1) + "%" : "-"}</td>
            <td>{row.mwp != null ? (row.mwp * 100).toFixed(1) + "%" : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}