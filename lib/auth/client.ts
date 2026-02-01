'use client';

// Client-side auth utilities
export async function getCurrentUserClient(): Promise<{ id: string; email: string; full_name?: string } | null> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function signOutClient() {
  try {
    await fetch('/api/auth/signout', {
      method: 'POST',
      credentials: 'include',
    });
    // Redirect will be handled by the page
    window.location.href = '/sign-in';
  } catch (error) {
    console.error('Error signing out:', error);
    window.location.href = '/sign-in';
  }
}
