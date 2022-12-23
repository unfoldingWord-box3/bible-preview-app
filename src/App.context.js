import React, { 
  useEffect, 
  useState } from 'react';
import PropTypes from 'prop-types';

export const AppContext = React.createContext();

export function AppContextProvider({
  children,
}) {
  const [printPreview, setPrintPreview] = useState(false)
  const [html, setHtml] = useState("");

  useEffect(() => {
    if ( printPreview && html ) {
      console.log("html data is available")
      const newPage = window.open('', '', '_window');
      newPage.document.head.innerHTML = "<title>PDF Preview</title>";
      const script = newPage.document.createElement('script');
      script.src = 'https://unpkg.com/pagedjs/dist/paged.polyfill.js';
      newPage.document.head.appendChild(script);
      const style = newPage.document.createElement('style');
      const newStyles = `
      body {
        margin: 0;
        background: grey;
      }
      .pagedjs_pages {
      }
      .pagedjs_page {
        background: white;
        margin: 1em;
      }
      .pagedjs_right_page {
        float: right;
      }
      .pagedjs_left_page {
        float: left;
      }
      div#page-2 {
        clear: right;
      }
      div.bibleBookBody {
        columns: 2;
        column-gap: 2em;
        widows: 2;
      }
      `;
      style.innerHTML = newStyles + html.replace(/^[\s\S]*<style>/, "").replace(/<\/style>[\s\S]*/, "");
      newPage.document.head.appendChild(style);
      newPage.document.body.innerHTML = html.replace(/^[\s\S]*<body>/, "").replace(/<\/body>[\s\S]*/, "");
      setPrintPreview(false);
    }
  }, [printPreview, html])

  // create the value for the context provider
  const context = {
    state: {
      printPreview,
      html,
    },
    actions: {
      setPrintPreview,
      setHtml,
    },
  };

  return (
    <AppContext.Provider value={context}>
      {children}
    </AppContext.Provider>
  );
};

AppContextProvider.propTypes = {
  /** Children to render inside of Provider */
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};
