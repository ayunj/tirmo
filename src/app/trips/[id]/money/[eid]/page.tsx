import { notFound } from "next/navigation";
import { loadMoney } from "@/lib/moneyload";
import { days } from "@/lib/format";
import ExpenseForm from "@/components/ExpenseForm";

export default async function EditExpense({ params }: { params: Promise<{ id: string; eid: string }> }) {
  const { id, eid } = await params;
  const m = await loadMoney(id);
  const e = m.expenses.find((x) => x.id === eid);
  if (!e) notFound();
  return <ExpenseForm trip={m.trip} days={days(m.trip.start_date, m.trip.end_date)} me={m.user.id} members={m.people} pockets={m.pockets} expenses={m.expenses} expense={e} />;
}
