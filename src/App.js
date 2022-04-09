import React, { useState, useEffect } from "react";
import "./styles.css";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
// import ReactJson from 'react-json-view'; 
import BibleReference, { useBibleReference } from "bible-reference-rcl";
import * as dcs from './utils/dcsApis';

import {Proskomma} from 'proskomma';

const pk = new Proskomma();


export default function App(props) {
  // state variables
  const [contentStatus, setContentStatus] = useState("Waiting...");
  const [importedBooks, setImportedBooks] = useState([]);
  const [queryResults, setQueryResults]   = useState({})

  // deconstructed parameters
  const {
    initialBook,
    initialChapter,
    initialVerse,
    supportedBooks,
    onChange,
    style
  } = props || {};

  const { state, actions } = useBibleReference({
    initialBook,
    initialChapter,
    initialVerse,
    onChange
  });

  useEffect(() => {
    actions.applyBooksFilter(supportedBooks);
  }, [actions, supportedBooks]);

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
    const bookParameter    = `${state.bookId}`.toUpperCase()
    const chapterParameter = `${state.chapter}`
    const verseParameter   = `${state.verse}`
    const gql = `{
      processor
      packageVersion
      documents(withBook: "${bookParameter}") {
        cv (chapter:"${chapterParameter}" verses:["${verseParameter}"]) 
          { text }
      }
    }`

    const fetchData = async () => {
      if ( ! importedBooks.includes(state.bookId) ) {
        setContentStatus("Loading:"+state.bookId);
        const text = await dcs.fetchBook('Door43-Catalog','en_ult',state.bookId);
        setContentStatus("Book Retrieved");
        pk.importDocument(
          {lang: "eng", abbr: state.bookId},
          "usfm",
          text
        );
        setContentStatus("Imported into PK:"+state.bookId);
        let _importedBooks = importedBooks;
        _importedBooks.push(state.bookId);
        setImportedBooks(_importedBooks);
      }
      try {
        let qresults = await pk.gqlQuery(gql);
        console.log("query:", gql)
        console.log("query results:", qresults);
        const data =JSON.parse(JSON.stringify(qresults));
        setQueryResults(data);
      } catch (err) {
        console.log("pk.gqlQuery() Error:", err);
        setQueryResults(err)
      }
    }


    if ( state.bookId ) {
        fetchData();
    }

  }, [state.bookId, state.chapter, state.verse, importedBooks]);

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
          <br />
          <Typography
            style={{ marginLeft: "50px" }}
            color="textPrimary"
            gutterBottom
            display="inline"
          >
            {`Current Location:\u00A0`}
          </Typography>
          <Typography
            style={{ fontWeight: "bold" }}
            color="textPrimary"
            gutterBottom
            display="inline"
          >
            {`${state.bookId} ${state.chapter}:${state.verse}`}
          </Typography>
        </CardContent>
        <CardActions>

          <Button
            variant="outlined"
            id="prev_v"
            onClick={actions.goToPrevVerse}
          >
            {"Previous Verse"}
          </Button>

          <Button
            variant="outlined"
            id="next_v"
            onClick={actions.goToNextVerse}
          >
            {"Next Verse"}
          </Button>

          <Button variant="outlined" id="prev_b" onClick={actions.goToPrevBook}>
            {"Previous Book"}
          </Button>

          <Button variant="outlined" id="next_b" onClick={actions.goToNextBook}>
            {"Next Book"}
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
          {/* <ReactJson src={queryResults} /> */}
          <Typography
            color="textPrimary"
            display="inline"
            variant="body1"
          >
            {/* {queryResults.data.documents[0].cv[0].text} */}
            { queryResults && queryResults.data 
              && JSON.stringify(queryResults.data.documents[0].cv[0].text
                  .replaceAll('\n',' ')
                  , 4).replace(/(^"|"$)/g, '')
            }
          </Typography>
        </CardContent>
      </Card>
    
    </div>
  );
}


/* example query
cv (chapter:"3" verses:["6"]) { scopeLabels, items { type subType payload } tokens { subType payload } text }
<ReactJson src={my_json_object} />
{
    processor
    packageVersion
    documents {
        mainSequence {
            blocks(withScopes:["chapter/1", "verse/1"]) {
              text(normalizeSpace: true)
            }
        }
    }
}

    const bookParameter    = `${state.bookId}`.toUpperCase()
    const chapterParameter = `chapter/${state.chapter}`
    const verseParameter   = `verse/${state.verse}`

    const gql = `{
      processor
      packageVersion
      documents(withBook: "${bookParameter}") {
          mainSequence {
              blocks(withScopes:["${chapterParameter}", "${verseParameter}"]) {
                text(normalizeSpace: true)
              }
          }
      }
    }`

*/