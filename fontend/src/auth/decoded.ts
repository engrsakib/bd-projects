import { jwtDecode, JwtPayload } from "jwt-decode";

interface JwtPayloadProps extends JwtPayload {
  role: string;
}

export const getDecodedUser = (accessToken: string) => {
  let user = null;
  if (accessToken) {
    const decodedData: JwtPayloadProps = jwtDecode(accessToken);
    user = decodedData;
  }
  return user;
};