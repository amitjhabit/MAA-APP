// app/events/page.js — redirects to / (Events is now the landing page)
import { redirect } from 'next/navigation';
export default function EventsRedirect() {
  redirect('/');
}
