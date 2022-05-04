import React, { 
  useEffect, 
  useState } from 'react';
import PropTypes from 'prop-types';
import {Proskomma} from 'proskomma';
import { renderHTML } from './utils/printPreview';

export const AppContext = React.createContext();

export function AppContextProvider({
  children,
}) {


  const [printPreview, setPrintPreview] = useState(false)
  const [importedBooks, setImportedBooks] = useState([]);
  const [pk, /*setPk*/] = useState(new Proskomma());
  const [html, setHtml] = useState(null);

  useEffect(() => {
    const fetchHtml = async () => {
      const html = await renderHTML({ proskomma: pk, 
        language: 'eng',
        textDirection: 'ltr',
        books: importedBooks,
      });
      // console.log("doRender html is:", html); // the object has some interesting stuff in it
      setHtml(html.output);
      // return to false
      setPrintPreview(false)
    }

    if ( printPreview ) {
      console.log("print preview was clicked");
      fetchHtml();
    }
  }, [printPreview]);

  useEffect(() => {
    if ( html ) {
      console.log("html data is available")
      const newPage = window.open('','','_window');
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
      `;
      style.innerHTML = newStyles + html.replace(/^[\s\S]*<style>/, "").replace(/<\/style>[\s\S]*/, "");
      newPage.document.head.appendChild(style);
      newPage.document.body.innerHTML = html.replace(/^[\s\S]*<body>/, "").replace(/<\/body>[\s\S]*/, "");      
      setHtml(null);
    }
  }, [html])



  // create the value for the context provider
  const context = {
    state: {
      importedBooks,
      printPreview,
      pk,
    },
    actions: {
      setImportedBooks,
      setPrintPreview,
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

