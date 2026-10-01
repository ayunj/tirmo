import { loadMoney } from "@/lib/moneyload";
import { days } from "@/lib/format";
import ExpenseForm from "@/components/ExpenseForm";

export default async function NewExpense({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await loadMoney(id);
  return <ExpenseForm trip={m.trip} days={days(m.trip.start_date, m.trip.end_date)} me={m.user.id} members={m.people} pockets={m.pockets} expenses={m.expenses} />;
}
