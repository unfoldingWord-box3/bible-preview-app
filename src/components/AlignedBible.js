import React, { useState, useEffect, useContext } from "react";
import "../styles.css";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { AppContext } from '../App.context';

import BibleReference, { useBibleReference } from "bible-reference-rcl";
import * as dcs from '../utils/dcsApis';
import { renderHTML } from '../utils/printPreview';
import {Proskomma} from 'proskomma';
import {clearCaches, getFileCached} from '../utils/zipUtils'
import * as books from '../common/books';

export default function AlignedBible(props) {
  // state variables
  const [contentStatus, setContentStatus] = useState("Waiting...");
  const [booksToImport, setBooksToImport] = useState([])
  const [importedBooks, setImportedBooks] = useState([]);
  const [pk, setPk] = useState(new Proskomma());
  const [loadingBooks, setLoadingBooks] = useState(false);

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
      if (! importedBooks.includes(bookId))
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
    if (! booksToImport.includes(state.bookId) && ! importedBooks.includes(state.bookId)) {
      setBooksToImport([...booksToImport, ...[state.bookId]]);
      console.log("NOW BOOKS TO IMPORT: ", [booksToImport, ...[state.bookId]]);
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
    console.log("Start of effect to fetchData:", booksToImport, loadingBooks);
    if (! booksToImport.length || loadingBooks)
      return false;

    setLoadingBooks(true);
    console.log("FIRST IMPORTED BOOKS:", importedBooks);
    console.log("BOOKS:", booksToImport)

    const fetchData = async () => {
      let dirty = false;
      console.log("fetchData importedBooks:", importedBooks);
      console.log("fetchData books:", booksToImport);
      for(let i = 0; i < booksToImport.length; i++) {
        const bookId = booksToImport[i];
        console.log(bookId);
        if ( ! importedBooks.includes(bookId) ) {
          console.log("Book needs to be imported:", bookId);
          setContentStatus("Loading: "+bookId);
          let filename;
          if (isTcRepo)
            filename = repo+'.usfm';            
          else
            filename = books.usfmNumberName(bookId)+'.usfm';
          const text = await getFileCached({username: owner, repository: repo, path: filename, branch: branchOrTag}); // dcs.fetchBook(owner, repo, branchOrTag, bookId, isTcRepo)
          setContentStatus("Book Retrieved");
          // note! not asynchronous
          try {
            pk.importDocument(
              {lang: (language === "en" ? "eng" : language), abbr: resource},
              "usfm",
              text
            );
            setContentStatus("Imported into PK: " + bookId);
            console.log("Imported into PK: " + bookId);
            importedBooks.push(bookId);
            setImportedBooks(importedBooks);
            dirty = true;
          } catch (e) {  
            console.log("ERROR pk.importDoument: ", e);
          }
        }
      }

      if (dirty) {
        console.log("RENDERING HTML NOW!!!");
        const html = await renderHTML({ proskomma: pk, 
          language: (language === "en" ? "eng" : language),
          resource: resource,
          title: title,
          textDirection: textDirection,
          books: importedBooks,
        });
        // console.log("doRender html is:", html); // the object has some interesting stuff in it
        setHtml(html.output);
      }
      setBooksToImport([]);
      setLoadingBooks(false);
    }

    fetchData();
  }, [pk, importedBooks, booksToImport, isTcRepo, language, owner, branchOrTag, repo, resource, textDirection, title, loadingBooks, setLoadingBooks, setImportedBooks, setBooksToImport, setHtml]);

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
            {`Owner:\u00A0`}{owner}{", Repo:\u00A0"}{repo}{", Branch/Tag:\u00A0"}{branchOrTag}
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
            {`${contentStatus}`}
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
          {/* <ReactJson src={html} /> */}
          <Typography
            color="textPrimary"
            display="inline"
            variant="body1"
          >
            <div dangerouslySetInnerHTML={{ __html: html }}></div>
          </Typography>
        </CardContent>
      </Card>
    
    </div>
  );
}
