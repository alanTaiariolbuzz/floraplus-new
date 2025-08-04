export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Browser should use relative path
    return "";
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Assume localhost
  return `http://localhost:${process.env.PORT || 3000}`;
};

export const getApiUrl = (path: string) => {
  return `${getBaseUrl()}/api${path}`;
};
