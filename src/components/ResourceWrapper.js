import React, { useState, useEffect, useContext } from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import BibleReference from 'bible-reference-rcl';

import "../styles.css";
import { AppContext } from '../App.context';
import Bible from './Bible';

export default function ResourceWrapper(props) {
	const [resourceComponent, setResourceComponent] = useState(null);

  // deconstructed parameters
  const {
    onChange,
    style,
  } = props || {};
  
	// app context
  const {
    state: {
      resourceInfo,
      bibleState,
      bibleActions,
      contentStatus,
      html,
      importedBooks,
    },
    actions: {
      setHtml,
      handleClearBooks,
      handlePrint,
      handleLoadAllBooks,
    }
  } = useContext(AppContext)

	useEffect(() => {
		if (! resourceInfo || ! resourceInfo.subject) {
			return;
		}

    console.log(resourceInfo);
		switch (resourceInfo.subject) {
			case "Aligned Bible":
			case "Bible":
				setResourceComponent(<Bible />);
				break;
			default:
				setHtml(`${resourceInfo.subject} is not yet supported.`);
		}
	}, [resourceInfo, setHtml]);

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
        <BibleReference status={bibleState} actions={bibleActions} style={style} onChange={onChange} />
      </div>

      <br />
      <br />

      <Card variant="outlined">
        <CardActions>
          <Button variant="outlined" id="prev_b" onClick={bibleActions.goToPrevBook}>
            {"Previous Book"}
          </Button>

          <Button variant="outlined" id="next_b" onClick={bibleActions.goToNextBook}>
            {"Next Book"}
          </Button>

          <Button variant="outlined" id="load_all" onClick={handleLoadAllBooks}>
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
            gutterBottom
            display="inline"
          >
            {resourceInfo
              ?
                <><b>{"Owner:"}</b> {resourceInfo.owner} <b>{"Repo:"}</b> {resourceInfo.repo} <b>{resourceInfo.refType + ":"}</b> {resourceInfo.ref}{(resourceInfo.refType !== "Commit" ? " (" + resourceInfo.commitID + ")" : "")} <b>{'Language:'}</b> {resourceInfo.language} <a href={`https://git.door43.org/${resourceInfo.owner}/${resourceInfo.repo}/src/branch/${resourceInfo.ref}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px" }}>{"See on DCS"}</a></>
              :
                "Loading resource..."
              }
          </Typography>
        </CardContent>
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

      {resourceComponent}		

      <Card variant="outlined">
        <CardContent>
          <Typography
            color="textPrimary"
            display="inline"
            variant="body1"
          >
          {html !== ""
            ?
            <div dangerouslySetInnerHTML={{ __html: html.replace("columns: 2", "columns:  1").replace("span.footnote {float: footnote; }", "span.footnote {float: footnote;font-style: italic;font-size: .8em;padding: 5px; } span.footnote:before {content: '[f.n.: '} span.footnote:after {content: ']'}") }}></div>
            :
            <div>Loading...</div>
          }
          </Typography>
        </CardContent>
      </Card>
		</div>
	)
}