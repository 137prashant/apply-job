export async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);

  if (response.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
}
