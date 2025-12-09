import Cookies from "js-cookie";

export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";

// todo this will delete later
export const CLIENT_ID = "clientId";

export const setCookie = (key: string, value: string, days = 3) => {
  Cookies.set(key, value, {
    expires: days,
    secure: true,
    sameSite: "None",
    path: "/",
  });
};

export const getCookie = (key: string): string | undefined => {
  return Cookies.get(key);
};

export const removeCookie = (key: string) => {
  Cookies.remove(key, { path: "/" });
};

// === specific functions for tokens ===
export const setAccessToken = (token: string) => {
  removeCookie(ACCESS_TOKEN_KEY); // clear old token
  setCookie(ACCESS_TOKEN_KEY, token);
};
export const getAccessToken = () => getCookie(ACCESS_TOKEN_KEY);
export const removeAccessToken = () => removeCookie(ACCESS_TOKEN_KEY);

export const setRefreshToken = (token: string) =>
  setCookie(REFRESH_TOKEN_KEY, token, 365);
export const getRefreshToken = () => getCookie(REFRESH_TOKEN_KEY);
export const removeRefreshToken = () => removeCookie(REFRESH_TOKEN_KEY);


// todo this will delete later
export const setClientId = (id: string) => {
  setCookie(CLIENT_ID, id);
};
export const getClientId = () => getCookie(CLIENT_ID);
export const removeClientId = () => removeCookie(CLIENT_ID);