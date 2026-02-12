import Pagamenti from "@/models/Pagamenti";
import { connectToDB } from "@/utils/database";

export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();
    const { id } = resolvedParams;
    const body = await req.json();

    const pagamento = await Pagamenti.findByIdAndUpdate(id, body, { new: true });
    if (!pagamento) {
      return new Response(JSON.stringify({ error: "Pagamento non trovato" }), { status: 404 });
    }
    return new Response(JSON.stringify(pagamento), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}