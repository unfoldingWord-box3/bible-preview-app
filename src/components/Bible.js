import React, { useState, useEffect, useContext } from "react";
import "../styles.css";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import { AppContext } from '../App.context';

import { renderHTML } from '../utils/printPreview';
import { getFileCached } from '../utils/dcsCacheUtils'
import * as books from '../common/books';


export default function Bible(props) {
  // app context
  const {
    state: {
      resourceInfo,
      pk,
      bookID,
      importedBooks,
      htmlByBook,
      printPreview,
      printPreviewHtml,
    },
    actions: {
      setPk,
      setHtmlByBook,
      setPrintPreviewHtml,
    }
  } = useContext(AppContext)

  useEffect(() => {
    const handleBookHtmlRendering = async () => {
      console.log("IMPORTED BOOKS: ", importedBooks);
      console.log("BOOK ID:", bookID);
      const bookHtml = await renderHTML({
        proskomma: pk,
        language: resourceInfo.language,
        resource: resourceInfo.resource,
        title: resourceInfo.title,
        textDirection: resourceInfo.textDirection,
        books: [bookID],
      });
      console.log("doRender html for "+bookID+" is:", bookHtml.output); // the object has some interesting stuff in it
      htmlByBook[bookID] = bookHtml.output;
      setHtmlByBook(bookHtml.output);
      let status = "Rendered HTML for "+bookID;
      setContentStatus(status);
      console.log(status);
    };

    console.log("PROKSOMMA doc length", pk.documentList().length)
    if (! loading && importedBooks.includes(bookID) && ! htmlByBook[bookID]) {
      handleBookHtmlRendering().catch(console.error);
    }
  }, [pk, loading, resourceInfo, bookID, importedBooks, htmlByBook, setHtmlByBook]);

  useEffect(() => {
    const handlePrintPreviewHtmlRendering = async () => {
      console.log("IMPORTED BOOKS: ", importedBooks);
      console.log("BOOK ID:", bookID);
      const html = await renderHTML({
        proskomma: pk,
        language: resourceInfo.language,
        resource: resourceInfo.resource,
        title: resourceInfo.title,
        textDirection: resourceInfo.textDirection,
        books: importedBooks,
      });
      console.log("doRender html is:", html.output); // the object has some interesting stuff in it
      setPrintPreviewHtml(html.output);
      setContentStatus("Rendered Print Preview HTML");
      console.log("Rendered Print Preview HTML");
    };

    if (printPreview && ! printPreviewHtml && importedBooks.length) {
      handlePrintPreviewHtmlRendering().catch(console.error);
    }
  }, [pk, resourceInfo, bookID, htmlByBook, printPreview, importedBooks, printPreviewHtml, setPrintPreviewHtml]);
}
