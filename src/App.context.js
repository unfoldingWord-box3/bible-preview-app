import React, { 
  useEffect, 
  useState } from 'react';
import PropTypes from 'prop-types';
import {Proskomma} from 'proskomma';
import { getManifest } from './utils/dcsApis';
import { setDriver } from 'localforage';

export const AppContext = React.createContext();

export function AppContextProvider({
  children,
}) {


  const [printPreview, setPrintPreview] = useState(false)
  const [importedBooks, setImportedBooks] = useState([]);
  const [pk, setPk] = useState(new Proskomma());
  const [html, setHtml] = useState(null);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");
  const [language, setLanguage] = useState("");
  const [textDirection, setTextDirection] = useState("ltr");
  const [resource, setResource] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const urlParts = window.location.href.split('/');
    
    if (urlParts[3])
      setOwner(urlParts[3]);
    else
      setOwner("unfoldingWord");
    
    if (urlParts[4]) {
      setRepo(urlParts[4]);
      const [my_lang, my_resource] = urlParts[4].split('_');
      if (my_lang) {
        if (my_lang == "en") {
          setLanguage("eng");
        }
        else {
          setLanguage(my_lang);
        }
      } else {
        setLanguage("eng");
      }
      if (my_resource)
        setResource(my_resource);
      else
        setResource(urlParts[4]);
    }
    else {
      setRepo("en_ult");
      setLanguage("eng");
      setResource("ult");
    }
    
    if (urlParts[5])
      setBranch(urlParts[5]);
    else
      setBranch("master");
  }, window.location.href);

  useEffect(() => {
    const fetchManifest = async () => {
      const manifest = await getManifest(owner, repo, branch);
      if (manifest) {
        setTitle(manifest.dublin_core.title);
        setTextDirection(manifest.dublin_core.language.direction)
      }
    };
    if (owner && repo && branch) {
      fetchManifest()
    }
  }, [owner, repo, branch]);

  useEffect(() => {
    if ( printPreview && html ) {
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
      setPrintPreview(false);
    }
  }, [printPreview, html])

  // create the value for the context provider
  const context = {
    state: {
      importedBooks,
      printPreview,
      pk,
      owner,
      repo,
      branch,
      language,
      resource,
      title,
      textDirection,
      html,
    },
    actions: {
      setImportedBooks,
      setPrintPreview,
      setPk,
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
