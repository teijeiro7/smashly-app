import { useEffect } from "react";

interface UseDocumentTitleOptions {
  baseTitle?: string;
  separator?: string;
}

export const useDocumentTitle = (
  pageTitle?: string,
  options: UseDocumentTitleOptions = {}
) => {
  const { baseTitle = "Smashly App", separator = " | " } = options;

  useEffect(() => {
    const previousTitle = document.title;

    if (pageTitle) {
      document.title = `${baseTitle}${separator}${pageTitle}`;
    } else {
      document.title = baseTitle;
    }

    // Cleanup function to restore previous title when component unmounts
    return () => {
      document.title = previousTitle;
    };
  }, [pageTitle, baseTitle, separator]);

  // Function to manually set title
  const setTitle = (newPageTitle?: string) => {
    if (newPageTitle) {
      document.title = `${baseTitle}${separator}${newPageTitle}`;
    } else {
      document.title = baseTitle;
    }
  };

  return { setTitle };
};
