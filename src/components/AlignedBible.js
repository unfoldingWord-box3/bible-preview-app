import React, { useState, useEffect, useContext } from "react";
import "../styles.css";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { AppContext } from '../App.context';

import BibleReference, { useBibleReference } from "bible-reference-rcl";
// import * as dcs from '../utils/dcsApis';
import { renderHTML } from '../utils/printPreview';
import { Proskomma } from 'proskomma';
import { clearCaches, getFileCached } from '../utils/zipUtils'
import * as books from '../common/books';

export default function AlignedBible(props) {
  // state variables
  const [contentStatus, setContentStatus] = useState("Waiting...");
  const [booksToImport, setBooksToImport] = useState([])
  const [importedBooks, setImportedBooks] = useState([]);
  const [pk, setPk] = useState(new Proskomma());

  // app context
  const {
    state: {
      html,
    },
    actions: {
      setPrintPreview,
      setHtml,
    }
  } = useContext(AppContext)

  // deconstructed parameters
  const {
    initialBook,
    initialChapter,
    initialVerse,
    owner,
    repo,
    branchOrTag,
    language,
    textDirection,
    isTcRepo,
    resource,
    title,
    supportedBooks,
    commitID,
    refType,
    onChange,
    style
  } = props || {};

  const { state, actions } = useBibleReference({
    initialBook,
    initialChapter,
    initialVerse,
    supportedBooks,
    onChange
  });

  useEffect(() => {
    actions.applyBooksFilter(supportedBooks);
  }, [actions, supportedBooks]);

  const handlePrint = () => {
    setPrintPreview(true)
  };

  const handleLoadAll = () => {
    const books = [];
    console.log(supportedBooks);
    supportedBooks.forEach(bookId => {
      if (!importedBooks.includes(bookId))
        books.push(bookId);
    })
    setBooksToImport(books);
  };

  const handleClearBooks = () => {
    clearCaches();
    setImportedBooks([]);
    setPk(new Proskomma());
  }

  useEffect(() => {
    if (!booksToImport.includes(state.bookId) && !importedBooks.includes(state.bookId)) {
      setBooksToImport([...booksToImport, state.bookId]);
    }
  }, [state.bookId, booksToImport, importedBooks, setBooksToImport]);

  /*
    State of bible reference includes:
    state: {
 *      bookName: string - current book name
 *      bookId: string - current bookId (e.g. 'mrk')
 *      chapter: string - current chapter
 *      verse: string - current verse
 *      bookList: SelectionOption[] - array of current book selection options
 *      chapterList: SelectionOption[] - array of current chapter selection options
 *      verseList: SelectionOption[] - array of current verse selection options
 *    },
  */
  useEffect(() => {
    const fetchData = async () => {
      const bookId = booksToImport[0];
      if (!importedBooks.includes(bookId)) {
        setContentStatus("Loading: " + bookId);
        console.log("Loading: " + bookId);
        let filename;
        if (isTcRepo)
          filename = repo + '.usfm';
        else
          filename = books.usfmNumberName(bookId) + '.usfm';
        const text = await getFileCached({ username: owner, repository: repo, path: filename, branch: commitID }); // dcs.fetchBook(owner, repo, branchOrTag, bookId, isTcRepo)
        setContentStatus("Book Retrieved: " + bookId);
        console.log("Book Retrieved: " + bookId);
        // note! not asynchronous
        try {
          pk.importDocument(
            { lang: (language === "en" ? "eng" : language), abbr: resource },
            "usfm",
            text
          );
          const status = "Imported into PK: " + bookId + (booksToImport.length===1?"; Rendering HTML...":"");
          setContentStatus(status);
          console.log(status);
          setImportedBooks([...importedBooks, bookId]);
        } catch (e) {
          console.log("ERROR pk.importDoument: ", e);
        }
      }

      setBooksToImport(booksToImport.slice(1));
    }

    if (booksToImport.length) {
      fetchData();
    }
  }, [pk, importedBooks, booksToImport, isTcRepo, language, owner, commitID, repo, resource, setImportedBooks, setBooksToImport]);

  useEffect(() => {
    const handleHTML = async () => {
      const html = await renderHTML({
        proskomma: pk,
        language: (language === "en" ? "eng" : language),
        resource: resource,
        title: title,
        textDirection: textDirection,
        books: importedBooks,
      });
      console.log("doRender html is:", html.output); // the object has some interesting stuff in it
      setHtml(html.output);
      setContentStatus("Rendered HTML");
    };

    console.log("HERE IN EFFECT HTML: ", booksToImport, importedBooks);
    if (!booksToImport.length && importedBooks.length) {
      handleHTML();
    }
  }, [booksToImport, importedBooks, pk, resource, title, language, textDirection, setHtml]);

  return (
    <div>
      <br />
      <br />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          // justifyContent: "center"
        }}
      >
        <BibleReference status={state} actions={actions} style={style} />
      </div>

      <br />
      <br />

      <Card variant="outlined">
        <CardContent>
          <Typography
            color="textPrimary"
            gutterBottom
            display="inline"
          >
            <b>{`Owner:`}</b> {owner} <b>{"Repo:"}</b> {repo} <b>{refType + ":"}</b> {branchOrTag}{(refType !== "Commit" ? " (" + commitID + ")" : "")} <a href={`https://git.door43.org/${owner}/${repo}/src/branch/${branchOrTag}`} target={"_blank"} rel={"noopener noreferrer"} style={{ fontSize: "12px" }}>{"See on DCS"}</a>
          </Typography>
        </CardContent>
        <CardActions>
          <Button variant="outlined" id="prev_b" onClick={actions.goToPrevBook}>
            {"Previous Book"}
          </Button>

          <Button variant="outlined" id="next_b" onClick={actions.goToNextBook}>
            {"Next Book"}
          </Button>

          <Button variant="outlined" id="load_all" onClick={handleLoadAll}>
            {"Load All Books"}
          </Button>

          <Button variant="outlined" id="clear_b" onClick={handleClearBooks}>
            {"Clear Books"}
          </Button>

          <Button variant="outlined" id="print_b" onClick={handlePrint}>
            {"Print Preview"}
          </Button>
        </CardActions>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography
            color="textPrimary"
            display="inline"
          >
            {contentStatus}
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography
            color="textPrimary"
            display="inline"
          >
            {(importedBooks.length ? `Imported Books are: ${importedBooks.join(", ")}` : "No books imported yet")}
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography
            color="textPrimary"
            display="inline"
            variant="body1"
          >
            <div dangerouslySetInnerHTML={{ __html: html.replace("columns: 2", "columns:  1") }}></div>
          </Typography>
        </CardContent>
      </Card>

    </div>
  );
}
