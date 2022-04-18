
import React from "react";
import Vertical from "./layout/Vertical";
export default function LoadingIndicator(){
    return <Vertical style={{top:0,left:0,position:'absolute',backgroundColor:'red',color:'#FFF',zIndex:99,padding:'5px 10px'}}>
        Loading ....
    </Vertical>
}