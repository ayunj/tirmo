import Link from "next/link";

export default function NotFound() {
  return (
    <main className="px-8 pt-32 text-center">
      <b className="text-lg">찾는 화면이 없어요</b>
      <p className="s13 mt-1">이 여행의 멤버가 아니거나 지워졌을 수 있어요</p>
      <Link href="/" className="btn mt-8">
        내 여행으로
      </Link>
    </main>
  );
}
