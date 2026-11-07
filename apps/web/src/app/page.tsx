import { redirect } from 'next/navigation';

/** The marketing site comes later; for now the root sends people into the app. */
export default function Root() {
  redirect('/app');
}
