export function requireApiKey(request: Request) {
  const apiKey = request.headers.get("X-API-Key");

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
