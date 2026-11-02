# Clinic Appointment Booking API

A full-stack clinic appointment booking application built with Next.js, React, TypeScript, PostgreSQL/Neon, and Vercel. The application provides a patient-facing booking interface together with API endpoints for managing appointment slots and bookings.

## Project Overview

The application was built to support a clinic appointment workflow in which:

1. Available appointment slots are displayed to patients.
2. A patient selects an available slot.
3. The patient provides their full name and email address.
4. The booking is submitted through the application API.
5. A booking confirmation and booking reference are returned.
6. Booked slots stop appearing as available.
7. Patients can look up their own bookings using the email address used during booking.
8. Patients can cancel a confirmed booking.
9. Cancelling a booking makes the associated appointment slot available again.
10. Protected API endpoints can be tested using an API key.
11. The application is deployed to Vercel.

Web/API base URL

https://clinic-booking-tau-two.vercel.app

Because the Next.js application serves both the web page and API routes from the same deployment, the assessment's Web Page URL and API Base URL can be the same root URL.

## Technology Stack

The project uses the following technologies and services based on the development work:

- Next.js 16.4.3
- React 19.3.0
- React DOM 19.3.0
- TypeScript
- PostgreSQL / Neon
- Prisma
- Vercel
- npm
- Git / GitHub
- Postman for API testing
- PowerShell on Windows for local development

## Booking Flow

The patient-facing booking flow works as follows.

### Step 1: Load appointments

When the page loads, the frontend requests:
GET /api/slots
The returned slots are stored in React state.

### Step 2: Show available appointments

Only available slots are displayed. Each appointment card displays information such as:

- Provider/doctor
- Start time
- End time
- Book button

### Step 3: Select an appointment

The patient clicks: "Book this slot". The selected slot is stored in state.

### Step 4: Enter patient information

The booking form collects:

- Full name
- Email address

### Step 5: Submit the booking

The frontend sends a request to:
POST /api/patient-bookings
with a JSON body similar to:
{
"slot_id": 3,
"name": "John Doe",
"email": "john@example.com"
}

### Step 6: Server-side proxy

The patient-facing route forwards the request to the protected booking API. The secret API key stays on the server.

### Step 7: Confirmation

After a successful booking, the frontend displays a confirmation containing the booking reference.

For example:
Booking confirmed!

Thank you, John Doe.
Your booking reference is #12.

## Final Project State

Patient –→ Views available appointment –→ Selects appointment –→ Enters name + email –→ Books appointment –→ Receives booking reference –→ Views My Appointment –→ Can cancel appointment –→ Booking becomes cancelled –→ Appointment slot becomes available again

## Final Architecture

The Current archetecture can be represented as:

                         ┌─────────────────────┐
                         │      Patient        │
                         │      Browser        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Next.js App      │
                         │     page.tsx        │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼──────────────────┐
                  │                 │                  │
                  ▼                 ▼                  ▼
             /api/slots      /api/patient-       Other API
                              bookings             routes
                                  │
                                  │ server-side
                                  │ API key
                                  ▼
                         ┌─────────────────────┐
                         │   /api/bookings     │
                         │   Protected API     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ PostgreSQL / Neon   │
                         │      Database       │
                         └─────────────────────┘
