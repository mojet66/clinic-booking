export async function POST(request: Request) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    const body = await request.text();

    const response = await fetch(new URL("/api/bookings", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body,
      cache: "no-store",
    });

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
      headers: {
        ...(response.headers.get("Retry-After")
          ? { "Retry-After": response.headers.get("Retry-After")! }
          : {}),
      },
    });
  } catch (error) {
    console.error("Patient booking proxy error:", error);

    return Response.json(
      { error: "Unable to process booking" },
      { status: 500 },
    );
  }
}
