import { API_BASE_URL } from "@/config";
import { cookies } from "next/headers";

const validateToken = async () => {
  // In Next.js 15, this is async
  const cookieStore = await cookies();

  // Convert cookies to proper "name=value; name2=value2"
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const response = await fetch(`${API_BASE_URL}/user/auth`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
        "cache-control": "no-cache",
      },
      cache: "no-store", // prevent Next caching
    });

    // console.log(response.status, "status validate res");
    return response;
  } catch (error) {
    console.error("validateToken error:", error);
    throw error;
  }
};

export default validateToken;
