import { Wallet } from "lucide-react";

export default function MoneySoon() {
  return (
    <main>
      <header className="hd">
        <h1>경비</h1>
      </header>
      <div className="flex flex-col items-center px-8 pt-24 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF3DA] text-[#B07400]">
          <Wallet size={26} />
        </span>
        <b className="mt-4 text-lg">경비는 다음 단계에서 열려요</b>
        <p className="s13 mt-1">포켓, 공동경비, 나눠 내기, 정산이 들어와요</p>
      </div>
    </main>
  );
}
