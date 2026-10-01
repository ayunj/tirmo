import Go from "@/components/Go";

export default function NotFound() {
  return (
    <section className="screen on">
      <div className="scr full nonav login2">
        <div className="lg-box">
          <b style={{ fontSize: 19 }}>찾는 화면이 없어요</b>
          <p>이 여행의 멤버가 아니거나 지워졌을 수 있어요</p>
          <Go className="bigbtn" href="/" style={{ marginTop: 28 }}>
            내 여행으로
          </Go>
        </div>
      </div>
    </section>
  );
}
