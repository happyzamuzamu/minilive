import Link from "next/link";

export function RecentEvents() {
  return (
    <div style={{padding:"16px", border:"1px solid #e5e7eb", borderRadius:8}}>
      <div style={{fontWeight:700, marginBottom:10}}>최근 이벤트</div>
      <ul style={{margin:0, paddingLeft:18, color:"#6b7280", fontSize:14}}>
        <li>표시할 이벤트가 없습니다.</li>
      </ul>
      <div style={{marginTop:10}}>
        <Link href="/admin">새 이벤트 만들기</Link>
      </div>
    </div>
  );
}