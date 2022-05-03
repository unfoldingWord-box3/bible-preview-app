import React, { 
  // useContext, 
  useEffect, 
  useState } from 'react';
import PropTypes from 'prop-types';
import {Proskomma} from 'proskomma';

export const AppContext = React.createContext();

export function AppContextProvider({
  children,
}) {


  const [printPreview, setPrintPreview] = useState(false)
  const [importedBooks, setImportedBooks] = useState([]);
  const [pk, /*setPk*/] = useState(new Proskomma());

  useEffect(() => {
    if ( printPreview ) {
      console.log("print preview was clicked");
      // return to false
      setPrintPreview(false)
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

