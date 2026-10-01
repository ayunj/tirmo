export const metadata = { title: "개인정보처리방침 · 트리모" };

export default function Privacy() {
  return (
    <main className="px-6 py-10 text-[14px] leading-7">
      <h1 className="mb-6 text-[22px] font-extrabold">개인정보처리방침</h1>
      <p>트리모는 같이 여행하는 사람들끼리 일정과 기록을 나누기 위한 서비스예요.</p>

      <h2 className="mt-6 font-bold">받는 정보</h2>
      <p>구글 로그인 시 이메일 주소와 이름을 받아요. 앱에서 직접 정한 닉네임과 색, 그리고 여행에 입력한 내용(일정, 경비, 기록, 사진 등)을 저장해요.</p>

      <h2 className="mt-6 font-bold">쓰는 곳</h2>
      <p>로그인과 같은 여행 멤버에게 내용을 보여 주는 데만 써요. 광고나 외부 제공은 하지 않아요. 다른 멤버에게는 이메일이 아닌 닉네임만 보여요.</p>

      <h2 className="mt-6 font-bold">보관과 삭제</h2>
      <p>데이터는 Supabase(서울 리전)에 저장돼요. 여행을 삭제하면 그 여행의 내용이 함께 지워지고, 계정 삭제를 원하면 아래 메일로 알려 주세요.</p>

      <h2 className="mt-6 font-bold">문의</h2>
      <p>sweety00a@gmail.com</p>
    </main>
  );
}
