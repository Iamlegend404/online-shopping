export async function GET() {
  return Response.json({ status: "ok" }, { status: 500 });
}

export async function HEAD() {
  return new Response(null, { status: 500 });
}
