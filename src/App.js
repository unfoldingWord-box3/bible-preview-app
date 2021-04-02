import React, { useState, useEffect } from "react";
import "./styles.css";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import BibleReference, { useBibleReference } from "bible-reference-rcl";
import * as dcs from './utils/dcsApis';

export default function App(props) {
  const [content, setContent] = useState("Waiting...");
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
    const fetchData = async () => {
       setContent( await dcs.fetchBook('Door43-Catalog','en_ult',state.bookId) )
    }
    state.bookId && fetchData();
  }, [state.bookId]);

  return (
    <div>
      <br />
      <br />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <BibleReference status={state} actions={actions} style={style} />
      </div>

      <br />
      <br />

      <Card variant="outlined">
        <CardContent>
          <Typography
            style={{ fontWeight: "bold" }}
            color="textPrimary"
            display="inline"
          >
            {`bible-reference-rcl`}
          </Typography>
          <Typography color="textPrimary" display="inline">
            {`\u00A0component is shown above ^^^`}
          </Typography>
          <br />
          <br />
          <Typography
            style={{ fontWeight: "bold" }}
            color="textPrimary"
            display="inline"
          >
            {`bible-reference-rcl`}
          </Typography>
          <Typography color="textPrimary" gutterBottom display="inline">
            {`\u00A0state examples below (dynamically updated as reference changes):`}
          </Typography>
          <br />
          <br />
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
          <Typography color="textPrimary">
            {`action examples that are using API to change the current reference:`}
          </Typography>

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
            {`${content}`}
          </Typography>
        </CardContent>
      </Card>
    
    </div>
  );
}
