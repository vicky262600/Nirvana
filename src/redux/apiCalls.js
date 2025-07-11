import { loginStart, loginSuccess, loginFailure } from './userSlice';

export const loginUser = async (userCredentials, dispatch) => {
  dispatch(loginStart());
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userCredentials),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    dispatch(loginSuccess(data.user)); // assume API returns { user: {...} }
  } catch (err) {
    dispatch(loginFailure(err.message));
  }
};
