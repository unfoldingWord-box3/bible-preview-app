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
// import { printBooks } from "../utils/printPreview";

export default function Demo(props) {
  // state variables
  const [contentStatus, setContentStatus] = useState("Waiting...");

  // app context
  const {
    state: {
      importedBooks,
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
    }
  } = useContext(AppContext)

  // deconstructed parameters
  const {
    // initialBook,
    initialChapter,
    initialVerse,
    supportedBooks,
    onChange,
    style
  } = props || {};

  const { state, actions } = useBibleReference({
    initialBook: window.location.href.split('/')[6] || "gen",
    initialChapter,
    initialVerse,
    onChange
  });

  useEffect(() => {
    actions.applyBooksFilter(supportedBooks);
  }, [actions, supportedBooks]);

  const handlePrint = () => {
    setPrintPreview(true)
  };

  const clearBooks = () => {
    setImportedBooks([]);
    setPk(new Proskomma());
  }

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
      if (! owner || ! repo || ! branch || ! title || ! textDirection)
        return;
      if ( ! importedBooks.includes(state.bookId) ) {
        console.log("Book needs to be imported:", state.bookId)
        setContentStatus("Loading:"+state.bookId);
        const text = await dcs.fetchBook(owner, repo, branch, state.bookId);
        setContentStatus("Book Retrieved");
        // note! not asynchronous
        try {
          pk.importDocument(
            {lang: language, abbr: resource},
            "usfm",
            text
          );
          setContentStatus("Imported into PK: "+state.bookId);
        } catch (e) {          
        }
        let _importedBooks = importedBooks;
        _importedBooks.push(state.bookId);
        setImportedBooks(_importedBooks);

        const html = await renderHTML({ proskomma: pk, 
          language: language,
          resource: resource,
          title: title,
          textDirection: textDirection,
          books: _importedBooks,
        });
        // console.log("doRender html is:", html); // the object has some interesting stuff in it
        setHtml(html.output);  
      }
    }

    if ( state.bookId ) {
        fetchData();
    }

  }, [pk, owner, repo, branch, title, language, resource, textDirection, state.bookId, state.chapter, state.verse, importedBooks, setImportedBooks, setHtml]);

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
            style={{ marginLeft: "50px" }}
            color="textPrimary"
            gutterBottom
            display="inline"
          >
            {`Book Name:\u00A0`}
          </Typography>
          <Typography
            style={{ fontWeight: "bold" }}
            color="textPrimary"
            gutterBottom
            display="inline"
          >
            {`${state.bookName}`}
          </Typography>
        </CardContent>
        <CardActions>
          <Button variant="outlined" id="prev_b" onClick={actions.goToPrevBook}>
            {"Previous Book"}
          </Button>

          <Button variant="outlined" id="next_b" onClick={actions.goToNextBook}>
            {"Next Book"}
          </Button>

          <Button variant="outlined" id="prev_b" onClick={clearBooks}>
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
            Imported Books are: 
            {importedBooks.join()}
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
