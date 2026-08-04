import { redirect } from 'next/navigation';

const LegacyInterviewPage = async ({ params }) => {
  const { id } = await params;
  redirect(`/Lista_clienti_webdesigner/${id}/interview`);
};

export default LegacyInterviewPage;
