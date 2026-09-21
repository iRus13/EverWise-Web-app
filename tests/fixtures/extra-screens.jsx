import React, {useEffect} from "react";
import {createRoot} from "react-dom/client";
import AppShell from "../../src/components/AppShell.jsx";
import Loading from "../../src/screens/Loading.jsx";
import PartnerDashboard from "../../src/screens/PartnerDashboard.jsx";
import "../../src/index.css";
const query=new URLSearchParams(location.search);
const view=query.get("view");
document.documentElement.dataset.textSize=query.get("textSize")||"size-2";
function ExtraScreens() {
  useEffect(()=>{
    const timer=setInterval(()=>{
      if(view==="loading" || document.querySelector(".partner-dashboard h1")) {
        document.body.dataset.extraReady="true";clearInterval(timer);
      }
    },100);
    return ()=>clearInterval(timer);
  },[]);
  return view==="loading" ? <AppShell screen="loading"><Loading/></AppShell> :
    <PartnerDashboard adminToken={view==="partner-invalid"?null:"Q".repeat(43)}/>;
}
createRoot(document.getElementById("root")).render(<ExtraScreens/>);
