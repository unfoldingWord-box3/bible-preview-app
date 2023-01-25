import React, { useEffect, useState, useMemo } from 'react';
import { useBibleReference } from 'bible-reference-rcl';
import PropTypes from 'prop-types';
import { BibleBookData } from "./common/books";
import { base_url, apiPath } from './common/constants';
import { fetchRepositoryZipFile, cachedGetManifest, getFileCached } from "./utils/dcsCacheUtils";
import { fetchGitRefs } from "./utils/dcsApis";
import cloneDeep from 'lodash/cloneDeep';
import { RepositoryApi } from "dcs-js";
import { clearCaches } from './utils/dcsCacheUtils'
import { Proskomma } from 'proskomma';
import { usfmNumberName } from './common/books';


export const AppContext = React.createContext();

const PkSelectors = [
  {
      name: "lang",
      type: "string",
      regex: "^[^\\s]+$"
  },
  {
      name: "abbr",
      type: "string",
      regex: "^[A-za-z0-9_-]+$"
  }
];

export function AppContextProvider({
  children,
}) {
  const [dcsRepoClient, setDcsRepoClient] = useState(null);
  const [resourceInfo, setResourceInfo] = useState(null);
  const [pk, setPk] = useState(new Proskomma(PkSelectors));
  const [booksToImport, setBooksToImport] = useState([]);
  const [html, setHtml] = useState("");
  const [htmlByBook, setHtmlByBook] = useState({});
  const [printPreview, setPrintPreview] = useState(false);
  const [printPreviewHtml, setPrintPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [contentStatus, setContentStatus] = useState("");

  const importedBooks = useMemo(() => {
    if (pk.documentList().length) {
      return pk.documentList().map(doc => ('bookCode' in doc.headers ? doc.headers['bookCode'].toLowerCase() : ""));
    } else {
      return [];
    }
  }, [pk]);

  const { state: bibleState, actions: bibleActions } = useBibleReference({
    initialBook: 'gen',
    initialChapter: '1',
    initialVerse: '1',
    supportedBooks: [],
  });

  const resetPk = () => {
    setPk(new Proskomma(PkSelectors));
    clearCaches();
  };

  const handleLoadAllBooks = () => {
    const books = [];
    console.log(resourceInfo.supportedBooks);
    resourceInfo.supportedBooks.forEach(bookID => {
      if (!importedBooks.includes(bookID))
        books.push(bookID);
    })
    setBooksToImport(books);
  };

  const handleClearBooks = () => {
    resetPk();
  }

  const handlePrint = () => {
    setPrintPreview(true);
  }
  
  // create the value for the context provider
  const context = {
    state: {
      resourceInfo,
      pk,
      bibleState,
      bibleActions,
      bookID: bibleState.bookId,
      importedBooks,
      printPreview,
      html,
      htmlByBook,
      printPreviewHtml,
      contentStatus,
    },
    actions: {
      setPrintPreview,
      setHtmlByBook,
      setHtml,
      setPk,
      resetPk,
      handleLoadAllBooks,
      handleClearBooks,
      handlePrint,
      setContentStatus,
    },
  };

  useEffect(() => {
    const info = {
      owner: "unfoldingWord",
      repo: "en_ult",
      ref: "master",
      refType: "branch",
      language: "en",
      textDirection: "ltr",
      supportedBooks: [],
      resource: "",
      subject: "",
      title: "",
      commitID: "",
      bibleReference: {
        book: "tit",
        chapter: "1",
        verse: "1",
      }
    };

    const urlParts = new URL(window.location.href).pathname.split('/').slice(1);
    if (urlParts[0])
      info.owner = urlParts[0] || info.owner;
    if (urlParts[1])
      info.repo = urlParts[1]
    if (urlParts[2])
      info.ref = urlParts[2];
    if (urlParts[3])
      info.bibleReference.book = urlParts[3];
    if (urlParts[4])
      info.bibleReference.chapter = urlParts[4];
    if (urlParts[5])
      info.bibleReference.verse = urlParts[5];
    
    setResourceInfo(info);

    const repoClient = new RepositoryApi({basePath: `${base_url}/${apiPath}`});
    setDcsRepoClient(repoClient);
  }, []);

  useEffect(() => {
    const loadCommitInfo = async () => {
      try {
        const repoRequest = await dcsRepoClient.repoGet({
          owner: resourceInfo.owner,
          repo: resourceInfo.repo,
        });
        console.log(repoRequest);
      } catch(e) {
        console.error(e);
        setHtml(`Repo <b>${resourceInfo.owner}/${resourceInfo.repo}</b> does not exist`);
        return;
      }

      let info = cloneDeep(resourceInfo);
      let commitInfo = await fetchGitRefs(info.owner, info.repo, "refs/heads/" + info.ref);
      console.log("HEADS COMMIT INFO!!!!!: ", commitInfo);
      let commitID = "";
      if (commitInfo) {
        info.refType = "Branch";
        commitID = commitInfo[0].object.sha;
      } else {
        commitInfo = await fetchGitRefs(info.owner, info.repo, "refs/tags/" + info.ref);
        console.log("TAGS COMMIT INFO!!!!!: ", commitInfo);
        if (commitInfo) {
          info.refType = "Tag"
          commitID = commitInfo[0].object.sha;
        } else {
          commitInfo = await fetchGitRefs(info.owner, info.repo, "commits/" + info.ref);
          console.log("COMMITS COMMIT INFO!!!!!: ", commitInfo);
          if (commitInfo) {
            commitID = commitInfo.sha;
            info.refType = "Commit";
          } else {
            setHtml(`Bad reference given: ${info.ref}`)
            return;
          }
        }
      }

      if (commitID)
        info.commitID = commitID.slice(0, 10);

      console.log("SETTING COMMIT ID:", info.commitID);
      console.log("info: ", info);
      setResourceInfo(info);
    };

    if (resourceInfo && ! resourceInfo.commitID && ! resourceInfo.ready && dcsRepoClient) {
      loadCommitInfo().catch(console.error);
    }
  }, [resourceInfo, dcsRepoClient]);

  useEffect(() => {
    const loadManifest = async () => {
      let info = cloneDeep(resourceInfo);
      const zipFetchSucceeded = await fetchRepositoryZipFile({ username: info.owner, repository: info.repo, ref: info.commitID });
      if (zipFetchSucceeded) {
        if (info.repo.endsWith("_book")) {
          info.isTcRepo = true;
          const manifestText = await getFileCached({ username: info.owner, repository: info.repo, path: "manifest.json", ref: info.commitID });
          if (manifestText) {
            const manifest = JSON.parse(manifestText);
            info.title = manifest.resource.id.toUpperCase();
            info.language = manifest.target_language.id;
            info.textDirection = manifest.target_language.direction;
            info.supportedBooks = [manifest.project.id];
            info.resource = manifest.resource.id;
            info.subject = "Bible";
          }
        } else {
          console.log("Fetching RC manifest...");
          const manifest = await cachedGetManifest({ username: info.owner, repository: info.repo, ref: info.commitID });
          if (manifest) {
            info.title = manifest.dublin_core.title;
            info.language = manifest.dublin_core.language.identifier;
            info.textDirection = manifest.dublin_core.language.direction;
            info.supportedBooks = manifest.projects.map(project => project.identifier).filter(id => BibleBookData[id] !== undefined);
            info.resource = manifest.dublin_core.identifier;
            info.subject = manifest.dublin_core.subject;
          } else {
            return;
          }
        }
      }

      if (info) {
        if (!info.bibleReference.book || !info.supportedBooks.includes(info.bibleReference.book)) {
          if (info.supportedBooks.length) {
            info.bibleReference.book = info.supportedBooks[0];
          }
          else {
            info.bibleReference.book = "tit";
          }
        }
        window.history.pushState({ id: "100" }, "Page", `/${info.owner}/${info.repo}/${info.ref}/${info.bibleReference.book}/${info.bibleReference.chapter!=="1"||info.bibleReference.verse!=="1"?`${info.bibleReference.chapter}/${info.bibleReference.verse}/`:""}`);
      }

      setResourceInfo(info);

      bibleActions.applyBooksFilter(info.supportedBooks);
      bibleActions.goToBookChapterVerse(info.bibleReference.book, info.bibleReference.chapter, info.bibleReference.verse);
    };

    if (bibleActions && resourceInfo && resourceInfo.commitID && ! resourceInfo.subject && ! resourceInfo.title) {
      loadManifest().catch(console.error);
    }
  }, [resourceInfo, bibleActions]);

  useEffect(() => {
    if (!booksToImport.includes(bibleState.bookId) && ! importedBooks.includes(bibleState.bookId)) {
      setBooksToImport([...booksToImport, bibleState.bookId]);
    }
  }, [bibleState.bookId, booksToImport, importedBooks, setBooksToImport]);

  useEffect(() => {
    const fetchContent = async () => {
      for(let i = 0; i < booksToImport.length; i++) {
        const bookID = booksToImport[i];
        if (!importedBooks.includes(bookID)) {
          let status = "Loading: " + bookID;
          setContentStatus(status);
          console.log(status);
          let filename;
          if (resourceInfo.isTcRepo)
            filename = resourceInfo.repo + '.usfm';
          else
            filename = usfmNumberName(bookID) + '.usfm';
          const content = await getFileCached({ username: resourceInfo.owner, repository: resourceInfo.repo, path: filename, ref: resourceInfo.commitID });
          status = "Book Retrieved from DCS: " + bookID;
          setContentStatus(status);
          console.log(status);
          try {
            let status = `Importing into Proskomma: ${bookID}...`;
            setContentStatus(status)
            console.log(status);
            const lang = resourceInfo.language;
            pk.importDocument(
              {lang, abbr: resourceInfo.resource},
              "usfm",
              content,
            );
            console.log(pk.documents)
            status = `Imported into Proskomma: ${bookID}${(i === (booksToImport.length-1)?"; Rendering HTML...":"")}`;
            setContentStatus(status);
            console.log(status);
            setPk(pk);
          } catch (e) {
              console.log("ERROR pk.importDouments: ", e);
          }
        }
      }
      setBooksToImport([]);
      setLoading(false);
    }

    if (booksToImport.length && ! loading) {
      setLoading(true);
      fetchContent().catch(console.error);
    }
  }, [pk, resourceInfo, loading, booksToImport, importedBooks]);

  useEffect(() => {
    setPrintPreviewHtml("");
  }, [htmlByBook]);

  useEffect(() => {
    const showPrintPreview = async () => {
      console.log("html data is available");
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
      style.innerHTML = newStyles + printPreviewHtml.replace(/^[\s\S]*<style>/, "").replace(/<\/style>[\s\S]*/, "");
      newPage.document.head.appendChild(style);
      newPage.document.body.innerHTML = printPreviewHtml.replace(/^[\s\S]*<body>/, "").replace(/<\/body>[\s\S]*/, "");
      setPrintPreview(false);
    };

    if (printPreview && printPreviewHtml) {
      showPrintPreview();
    }
  }, [printPreview, printPreviewHtml])

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
