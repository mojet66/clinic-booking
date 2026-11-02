export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return Response.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const response = await fetch(new URL(`/api/bookings/${id}`, request.url), {
      method: "DELETE",
      headers: {
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Patient cancellation error:", error);

    return Response.json(
      { error: "Unable to cancel booking" },
      { status: 500 },
    );
  }
}
