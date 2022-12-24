import React, { useEffect, useContext } from "react";
import "../styles.css";
import { AppContext } from '../App.context';


export default function NotImplemented(props) {
  // app context
  const {
    state: {
      resourceInfo,
    },
    actions: {
      setHtml,
    }
  } = useContext(AppContext)
  
  useEffect(() => {
    setHtml(`${resourceInfo.subject} is not yet impplemented`);
  }, [resourceInfo.subject, setHtml])

  return (
    <></>
  );
}
