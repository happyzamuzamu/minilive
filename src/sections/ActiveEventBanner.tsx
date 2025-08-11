import Link from "next/link";

export function ActiveEventBanner() {
  return (
    <div style={{padding:"12px 16px", border:"1px solid #e5e7eb", borderRadius:8, background:"#f9fafb"}}>
      <div style={{fontWeight:700, marginBottom:6}}>활성 이벤트</div>
      <div style={{fontSize:14, color:"#6b7280"}}>현재 진행 중인 이벤트가 없습니다.</div>
      <div style={{marginTop:8}}>
        <Link href="/admin">이벤트 만들기</Link>
      </div>
    </div>
  );
}