/** 화면을 불러오는 동안 보이는 틀 */
export default function Skeleton({ nav = false }: { nav?: boolean }) {
  return (
    <section className="screen on">
      <div className={`scr${nav ? "" : " nonav"}`}>
        <div className="hd">
          <div className="skel" style={{ height: 26, width: 120, marginTop: 4, borderRadius: 8 }} />
        </div>
        <div className="pad">
          <div className="skel" style={{ height: 150 }} />
          <div className="skel" style={{ height: 72 }} />
          <div className="skel" style={{ height: 72 }} />
          <div className="skel" style={{ height: 72 }} />
        </div>
      </div>
    </section>
  );
}
