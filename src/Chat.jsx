import { React, useState, useEffect, useRef } from "react";
import "./App.css";
import {useDispatch, useSelector} from 'react-redux'
import {IoCameraOutline} from 'react-icons/io5'
import timer from './helper/Timer'
import axios from "axios";
import 'react-toastify/dist/ReactToastify.css'
import {FiSend} from 'react-icons/fi'
import {BsSendSlashFill} from 'react-icons/bs'
import { getAllConversation, textMessage } from "./reducers/conversationReducer";
import {IoMdArrowRoundBack} from 'react-icons/io'
import MediaComponent from "./components/MediaComponent";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "./socket";
export default function Chat() {  
  const user=useSelector((state)=>{return state.auth.user})
  const navigate=useNavigate()
  const {state}=useLocation()
  const currentUser=state  
  let Ref = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [list, setMessageList] = useState([]);
  const [message, setMessage] = useState("");
  const [file,setFile]=useState()
  const[online,setOnline]=useState(false)
  const [imageUrl,setImageUrl]=useState()
  const[uploading,setUploading]=useState(false)
  const dispatch=useDispatch() 
  window.addEventListener("online",setOnline(true))
  async function sendChat(event) {
    event.preventDefault();
    try{
    const time=timer()
    if(file){
      const formData=new FormData()
      formData.append("file",file)
      formData.append('time',time)
     setUploading(true)  
      setMessageList((list) => [...list, {
        reciever_id:currentUser?currentUser.UserName:socket.id,
        sender_id:user.UserName,
        msg_type:"file",
        time,
        url_type:(file.type==="image/jpeg" || file.type==="image/png" || file.type==="image/jpg")?"jpg":"mp4",
        secure_url:imageUrl,
        type:"outgoing",
}]);
inputResetHandler()
setFile("")
setImageUrl("")
      axios.post(`http://localhost:5002/api/conversation/chat/socialCom/${currentUser.UserName}/${user.UserName}`,formData)
     .then((response)=>{
      console.log(response);
            
      const data = {
               reciever_id:currentUser?currentUser.UserName:socket.id,
               sender_id:user.UserName,
               msg_type:"file",
               time,
               url_type:response.data.message.format,
               secure_url:response.data.message.secure_url,
               type:"outgoing",
      }
       socket.emit("private_msg",data);
     setUploading(false)
     })
     .catch(err=>{
        if(err.response.data.success===false){
          localStorage.setItem("reSendingFile",file)
        }
     })
    }else{
    const data = {
      message: message,
      time,
       msg_type:"text",
      type:"outgoing",
      sender_id:user.UserName,
      reciever_id: currentUser?currentUser.UserName:socket.id
    };
    await socket.emit("private_msg",data); 
    setMessageList((list) => [...list, {
      message: message,
      msg_type:"text",
      type:"outgoing",
      time,
      sender_id:user.UserName,
      reciever_id:currentUser?currentUser.UserName:socket.id
    }]);
    setMessage("");
    await dispatch(textMessage(data))
  }
}catch(err){
  return "message not sent"
}

  }  
  const inputReset=useRef(null)
function changeHandler(event){
event.preventDefault()
setMessage(event.target.value)
}
function fileChangeHandler(event){
   event.preventDefault()
   setFile(event.target.files[0])    
   setImageUrl(URL.createObjectURL(event.target.files[0]))      
}
function inputResetHandler(){
  if(inputReset.current){
    inputReset.current.value="";
    inputReset.current.type="text";
    inputReset.current.type="file"
  }
}
  useEffect(() => {    
     Ref.current.scrollTop=Ref.current.scrollHeight
  }, [message,list]);
  useEffect(() => { 
    socket.emit("room",currentUser.UserName) 
      socket.on("private_msg",(data) => {
      setMessageList((list) => [...list, data.data]);
    },[socket]);
    socket.on("typingStatus",(data)=>{
      setIsTyping(data)
    })
    socket.on("online",(data)=>{
            console.log(data);
    })
  }, [socket]); 
  async function call(){
    const res=await dispatch(getAllConversation({reciever_id:currentUser.UserName,sender_id:user.UserName})) 
  if( res.payload){
  setMessageList((list) => [...list,...res.payload.data.message[0].chats]);
  }}
  call()
  return (
    <div className="w-full pt-[3rem] bg-[#000000]  text-white">
       <div className="fixed w-full h-12 py-2 bg-slate-600 top-0">
        <div className="flex flex-row gap-2 px-2">
          <IoMdArrowRoundBack onClick={()=>navigate(-1)} className="text-xl"/>
          <div className="flex gap-3">
            <img src={currentUser.avatar} className="w-8 cursor-pointer h-8 rounded-full border-dotted border-1" />
            <div className="flex flex-col gap-0 p-0">
              <h1 key={currentUser.UserName} className="user text-base font-medium text-white">{currentUser.UserName}</h1>
              {online?
               <h1 className="text-xs">Online</h1>:
              <h1 className="text-xs">{isTyping ? "typing..." : ""}</h1>            
              }
            </div>
          </div>
        </div>
      </div>
       <div  ref={Ref}  className="msg_container space-y-3 py-2 w-[100%] h-[84vh] overflow-scroll">
        {(list.length>0)? list.map((data, index)=>{
          return(
            <div className={(data.sender_id===user.UserName)?"outgoing":"incoming"} key={index}>                
            <div className={(data.sender_id===user.UserName)?"outgoingInner":"incomingInner"}>
                {(data.msg_type==="text")?
                <div className="pr-2 pb-3 min-w-24 pl-3">{data.message}</div>:
                <MediaComponent key={data.secure_url} url_type={data.url_type} uploading={uploading} url={data.secure_url}/>
                  }
                <h6 className="absolute bottom-0 right-2 text-[#cdcaca] flex items-end text-xs">
                  {data.time}
                </h6>               
            </div>
          </div>
          );
        }):""}
      </div> 
      <form
      // w-[81%]
        className="fixed w-full bottom-0 right-0"
        onSubmit={sendChat}
        id="form"
      >
        <div className="relative flex gap-4 px-2">
          <label htmlFor="msg" className="w-full h-full rounded-md border-2 border-black">
          <input
            id="input"
            type="text"
            name="msg"
            onChange={changeHandler}
            onKeyDown={() =>{
               socket.emit("typingStatus",{
                status:true,
                to:currentUser
              })
            }}
            onKeyUp={()=>{
              setTimeout(()=>{
                socket.emit("typingStatus",{
                  status:false,
                  to:currentUser
                })
              },500)
            }}
            value={message}
            autoFocus
            className=" w-full p-1 pr-12 text-black font-semibold"
            placeholder="Messagee"
          />
          </label>
          <div>
            <label htmlFor="file">
            <IoCameraOutline className="absolute right-20 w-7 h-7 text-black"/>
            </label>
           <input id="file" type="file" ref={inputReset} name="file" onChange={fileChangeHandler}  className="file hidden text-black"/>
          <div className="h-10 w-10 flex justify-center items-center rounded-full bg-[#2eff35] text to-black">
          {(message.length>0 || file)?
          <button type="submit"><FiSend className="h-6 w-6 text-black font-semibold"/></button>
            :<BsSendSlashFill className=" h-6 w-6 text-black font-bold cursor-not-allowed"/>
           }
          </div>
          </div>
        </div>
      </form>    
    </div>
  );
}

