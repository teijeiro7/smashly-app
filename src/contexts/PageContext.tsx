import React, { createContext, ReactNode, useContext, useState } from "react";

interface PageContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
  getFullTitle: () => string;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

interface PageProviderProps {
  children: ReactNode;
  baseTitle?: string;
  separator?: string;
}

export const PageProvider: React.FC<PageProviderProps> = ({
  children,
  baseTitle = "Smashly App",
  separator = " | ",
}) => {
  const [pageTitle, setPageTitle] = useState<string>("");

  const getFullTitle = () => {
    return pageTitle ? `${baseTitle}${separator}${pageTitle}` : baseTitle;
  };

  // Update document title whenever pageTitle changes
  React.useEffect(() => {
    document.title = getFullTitle();
  }, [pageTitle, baseTitle, separator]);

  const value: PageContextType = {
    pageTitle,
    setPageTitle,
    getFullTitle,
  };

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePage = (): PageContextType => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePage must be used within a PageProvider");
  }
  return context;
};

// Custom hook for setting page title
export const usePageTitle = (title: string) => {
  const { setPageTitle } = usePage();

  React.useEffect(() => {
    setPageTitle(title);

    // Cleanup: reset to base title when component unmounts
    return () => {
      setPageTitle("");
    };
  }, [title, setPageTitle]);
};
