import React, { 
  // useContext, 
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

  useEffect(() => {
    const fetchHtml = async () => {
      const html = await renderHTML({ proskomma: pk, 
        language: 'en',
        textDirection: 'ltr',
        books: importedBooks,
      });
      console.log("doRender config is:", html);
      // return to false
      setPrintPreview(false)
    }

    if ( printPreview ) {
      console.log("print preview was clicked");
      fetchHtml();
    }
  }, [printPreview]);

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

