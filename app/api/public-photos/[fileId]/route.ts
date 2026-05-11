const DRIVE_IMAGE_URL_BUILDERS = [
  (fileId: string) => `https://drive.google.com/uc?export=view&id=${fileId}`,
  (fileId: string) => `https://drive.google.com/uc?export=download&id=${fileId}`,
  (fileId: string) => `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`
];

function buildProxyHeaders(contentType: string, contentLength: string | null) {
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }
  return headers;
}

async function fetchDriveImage(fileId: string) {
  for (const buildUrl of DRIVE_IMAGE_URL_BUILDERS) {
    const response = await fetch(buildUrl(fileId), {
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      },
      cache: "no-store"
    });

    const contentType = response.headers.get("content-type") || "";
    if (response.ok && contentType.startsWith("image/")) {
      return response;
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await context.params;
  if (!fileId) {
    return new Response("fileId wajib diisi.", { status: 400 });
  }

  const response = await fetchDriveImage(fileId);
  if (!response || !response.body) {
    return new Response("Foto tidak dapat dibuka tanpa autentikasi Google.", { status: 404 });
  }

  return new Response(response.body, {
    status: 200,
    headers: buildProxyHeaders(
      response.headers.get("content-type") || "image/jpeg",
      response.headers.get("content-length")
    )
  });
}
