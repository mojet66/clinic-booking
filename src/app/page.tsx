"use client";

import { useEffect, useState } from "react";

type Slot = {
  id: number;
  provider: string;
  start: string;
  end: string;
  available: boolean;
};

type Booking = {
  id: number;
  slot_id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
};

export default function Home() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadSlots() {
    try {
      const response = await fetch("/api/slots");
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Unable to load appointment slots");
      }

      setSlots(data.slots);
    } catch {
      setError("Could not load appointments. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSlots();
  }, []);

  async function handleBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSlot) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/patient-bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slot_id: selectedSlot.id,
          name,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Booking failed");
      }

      setBooking(data);
      setSelectedSlot(null);
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Clinic Appointment System
          </p>
          <h1 className="text-4xl font-bold text-slate-900">
            Book an Appointment
          </h1>
          <p className="mt-3 text-slate-600">
            Choose an available doctor and appointment time.
          </p>
        </header>

        {booking && (
          <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-5">
            <h2 className="text-lg font-bold text-green-800">
              Booking confirmed!
            </h2>
            <p className="mt-2 text-sm text-green-800">
              Thank you, {booking.name}. Your booking reference is #{booking.id}
              .
            </p>
            <p className="mt-1 text-sm text-green-800">
              Booking recorded for {booking.email}.
            </p>
            <button
              onClick={() => setBooking(null)}
              className="mt-4 text-sm font-semibold text-green-800 underline"
            >
              Book another appointment
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {selectedSlot ? (
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <button
              onClick={() => setSelectedSlot(null)}
              className="mb-6 text-sm text-blue-600 hover:underline"
            >
              ← Back to appointments
            </button>

            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              Complete your booking
            </h2>

            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <p className="font-semibold text-slate-900">
                {selectedSlot.provider}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatDate(selectedSlot.start)}
              </p>
            </div>

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Full name
                </label>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email address
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Booking..." : "Confirm Appointment"}
              </button>
            </form>
          </section>
        ) : (
          <section>
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              Available appointments
            </h2>

            {loading ? (
              <p className="text-slate-600">Loading appointments...</p>
            ) : slots.filter((slot) => slot.available).length === 0 ? (
              <p className="rounded-xl bg-white p-6 text-slate-600">
                No appointments are currently available.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {slots
                  .filter((slot) => slot.available)
                  .map((slot) => (
                    <article
                      key={slot.id}
                      className="rounded-xl border bg-white p-5 shadow-sm"
                    >
                      <h3 className="text-lg font-bold text-slate-900">
                        {slot.provider}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {formatDate(slot.start)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Ends: {formatDate(slot.end)}
                      </p>
                      <button
                        onClick={() => setSelectedSlot(slot)}
                        className="mt-5 w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700"
                      >
                        Book this slot
                      </button>
                    </article>
                  ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
